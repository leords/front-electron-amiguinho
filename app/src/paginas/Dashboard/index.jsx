import { useEffect, useState, useCallback } from "react";
import { format, parseISO } from "date-fns";
import Cabecalho from "../../componentes/Cabecalho/index.jsx";
import Rodape from "../../componentes/Rodape/index.jsx";
import styles from "./styles.module.css";
import { dataFormatadaCalendario, extrairDataYMD } from "../../utils/data.js";
import { formatarMoeda } from "../../utils/formartarMoeda";
import {
  TrendUpIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  CalendarBlankIcon,
  ChartBarIcon,
  MedalIcon,
  ArrowsLeftRightIcon,
  UsersIcon,
  SpinnerIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChartLineUpIcon,
  PercentIcon,
  PackageIcon,
  CaretDownIcon,
  ClockIcon,
  ArrowCounterClockwiseIcon,
  TagIcon,
} from "@phosphor-icons/react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Importando as funções de API do projeto
import { TotalVendasPeriodo } from "../../operadores/API/pedido/totalVendasPeriodo.js";
import { TicketMedio } from "../../operadores/API/pedido/ticketMedio.js";
import { IntervaloTemporal } from "../../operadores/API/pedido/intervaloTemporal.js";
import { TopProdutos } from "../../operadores/API/pedido/topProdutos.js";
import { MixProdutos } from "../../operadores/API/pedido/mixProdutos.js";
import { QuantidadePedidos } from "../../operadores/API/pedido/quantidadePedidos.js";
import { RelatorioProduto } from "../../operadores/API/produto/relatorioProduto.js";
import { buscarPedido } from "../../operadores/API/pedido/buscarPedido.js";
import { buscarRelatorioDevolucoes } from "../../operadores/API/pedido/buscarRelatorioDevolucoes.js";
import { buscarMetricasDesconto } from "../../operadores/API/desconto/metricasDesconto.js";
import { LerUsuario } from "../../operadores/API/usuario/lerUsuario.js";
import { useProdutos } from "../../hooks/useProdutos.js";
import { usarToast } from "../../componentes/Context/toastContext.jsx";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao.jsx";
import ModalPedidosDesconto from "../../componentes/ModalPedidosDesconto/index.jsx";

const SETORES = [
  { id: "todos", label: "Total Geral" },
  { id: "balcao", label: "Balcão" },
  { id: "delivery", label: "Delivery" },
  { id: "externo", label: "Externo" },
];
const SETORES_BASE = ["balcao", "delivery", "externo"];
const medalCores = ["#ff8c00", "#adb5bd", "#cd7f32"];

// Ajuste do fuso horário de UTC para horário de Brasília (-3 horas)
const ajustarFusoHorarioHorario = (horarioStr, offsetHoras = -3) => {
  if (!horarioStr) return "";
  return String(horarioStr).replace(
    /\b(\d{1,2})(?::(\d{2}))?\b/g,
    (match, h, m) => {
      const horaNum = parseInt(h, 10);
      if (isNaN(horaNum) || horaNum > 23) return match;
      const horaAjustada = (horaNum + offsetHoras + 24) % 24;
      const horaFormatada = String(horaAjustada).padStart(2, "0");
      return m !== undefined ? `${horaFormatada}:${m}` : `${horaFormatada}:00`;
    }
  );
};

const SETOR_INFO = {
  balcao: { nome: "Balcão", cor: "#ff8c00" },
  delivery: { nome: "Delivery", cor: "#2f9e44" },
  externo: { nome: "Externo", cor: "#1971c2" },
};

const FORMAS_PAGAMENTO_FIXAS = [
  "A VISTA",
  "CARTÃO",
  "PIX",
  "BOLETO",
  "CHEQUE",
  "VALE",
];

const CORES_FORMAS_PAGAMENTO = {
  "A VISTA": "#2f9e44",
  "CARTÃO": "#1971c2",
  "PIX": "#12b886",
  "BOLETO": "#f59f00",
  "CHEQUE": "#7048e8",
  "VALE": "#ff8c00",
};

const normalizarFormaPagamento = (nome) => {
  if (!nome) return null;
  const n = String(nome).trim().toUpperCase();

  // 1. PIX
  if (n.includes("PIX")) return "PIX";

  // 2. BOLETO
  if (n.includes("BOL")) return "BOLETO";

  // 3. CHEQUE
  if (n.includes("CHEQ") || n.includes("CHQ")) return "CHEQUE";

  // 4. VALE (Vale, Prazo, Crediário, Pendência, Convênio, Fiado, Notinha, etc.)
  if (
    n.includes("VALE") ||
    n.includes("PRAZO") ||
    n.includes("CREDIAR") ||
    n.includes("PEND") ||
    n.includes("CONVENIO") ||
    n.includes("CONVÊNIO") ||
    n.includes("FIADO") ||
    n.includes("NOTINHA") ||
    n.includes("INTERNO")
  ) {
    return "VALE";
  }

  // 5. CARTÃO (Crédito, Débito, Cartão, Master, Visa, Elo, Hiper, etc.)
  if (
    n.includes("CART") ||
    n.includes("CRÉD") ||
    n.includes("CRED") ||
    n.includes("DÉB") ||
    n.includes("DEB") ||
    n.includes("MASTER") ||
    n.includes("VISA") ||
    n.includes("ELO") ||
    n.includes("HIPER")
  ) {
    return "CARTÃO";
  }

  // 6. A VISTA (Dinheiro, À Vista, Espécie)
  if (
    n.includes("VISTA") ||
    n.includes("DINHEIRO") ||
    n.includes("ESPECIE") ||
    n.includes("ESPÉCIE")
  ) {
    return "A VISTA";
  }

  return null;
};

const extrairFormasPagamento = (pedidosBrutos) => {
  const mapaFormas = new Map();
  FORMAS_PAGAMENTO_FIXAS.forEach((forma) => {
    mapaFormas.set(forma, {
      nome: forma,
      total: 0,
      quantidade: 0,
      cor: CORES_FORMAS_PAGAMENTO[forma],
    });
  });

  pedidosBrutos.forEach((p) => {
    if (!p) return;
    const st = String(p.status || "").toLowerCase();
    if (st === "cancelado" || st === "devolvido") return;

    const pagamentosArr =
      Array.isArray(p.pagamentos) && p.pagamentos.length > 0
        ? p.pagamentos
        : Array.isArray(p.pagamentosParciais) && p.pagamentosParciais.length > 0
        ? p.pagamentosParciais
        : null;

    if (pagamentosArr) {
      pagamentosArr.forEach((pag) => {
        const nomeBruto =
          pag.formaPagamento?.nome ||
          pag.formaPagamentoNome ||
          pag.nomeFormaPagamento ||
          pag.nome ||
          pag.forma ||
          "";
        const nomeNorm = normalizarFormaPagamento(nomeBruto);
        if (nomeNorm && mapaFormas.has(nomeNorm)) {
          const val = Number(pag.valor || pag.valorParcialFormaPagamento || 0);
          const atual = mapaFormas.get(nomeNorm);
          atual.total += val;
          atual.quantidade += 1;
        }
      });
    } else {
      const nomeBruto =
        p.formaPagamento?.nome ||
        p.formaPagamentoNome ||
        p.formaPagamento ||
        p.forma_pagamento ||
        "";
      const nomeNorm = normalizarFormaPagamento(nomeBruto);
      if (nomeNorm && mapaFormas.has(nomeNorm)) {
        const val = Number(p.total || p.valorTotal || 0);
        const atual = mapaFormas.get(nomeNorm);
        atual.total += val;
        atual.quantidade += 1;
      }
    }
  });

  const totalFormasSum = Array.from(mapaFormas.values()).reduce(
    (acc, item) => acc + item.total,
    0
  );

  return Array.from(mapaFormas.values())
    .filter((f) => f.total > 0 || f.quantidade > 0)
    .map((f) => ({
      ...f,
      percentual: totalFormasSum > 0 ? (f.total / totalFormasSum) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
};

// Tooltips
function TooltipVendas({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      <p className={styles.tooltipValor}>
        {formatarMoeda(payload[0]?.value ?? 0)}
      </p>
      <p className={styles.tooltipSub}>{payload[1]?.value ?? 0} pedidos</p>
    </div>
  );
}

function TooltipVendasDiarias({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>Dia {label}</p>
      <p className={styles.tooltipValor}>
        {formatarMoeda(payload[0]?.value ?? 0)}
      </p>
      <p className={styles.tooltipSub}>{payload[1]?.value ?? 0} pedidos</p>
    </div>
  );
}



// KPI Card
function KpiCard({
  icone: Icone,
  cor,
  label,
  valor,
  sub,
  carregando,
  acao,
}) {
  return (
    <div className={styles.kpiCard}>
      <div className={styles.kpiIcone} data-cor={cor}>
        <Icone size={20} weight="fill" />
      </div>
      <div className={styles.kpiInfo}>
        <div className={styles.kpiHeaderLinha}>
          <p className={styles.kpiLabel}>{label}</p>
          {acao}
        </div>
        {carregando ? (
          <div className={styles.kpiSkeleton} />
        ) : (
          <strong className={styles.kpiValor}>{valor}</strong>
        )}
        <p className={styles.kpiSub}>{sub}</p>
      </div>
    </div>
  );
}

// Card de Tendência / Projeção de Vendas do Mês Atual
function CardTendenciaMes({
  dataInicio,
  dataFim,
  totalVendas,
  setor,
  carregando,
}) {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth();
  const primeiroDiaMes = new Date(anoAtual, mesAtual, 1);
  const ultimoDiaMesDate = new Date(anoAtual, mesAtual + 1, 0);
  const ultimoDiaMes = ultimoDiaMesDate.getDate();

  const primeiroDiaStr = format(primeiroDiaMes, "yyyy-MM-dd");
  const hojeStr = format(hoje, "yyyy-MM-dd");

  // O card só é renderizado quando o filtro for o mês atual em aberto
  // (dataInicio no dia 1º do mês corrente e dataFim dentro do mês corrente até hoje)
  const ehMesAtualAberto =
    dataInicio === primeiroDiaStr &&
    dataFim >= primeiroDiaStr &&
    dataFim <= hojeStr;

  if (!ehMesAtualAberto) return null;

  const diaFimObj = parseISO(dataFim);
  const diaDecorrido = isNaN(diaFimObj)
    ? hoje.getDate()
    : Math.min(diaFimObj.getDate(), ultimoDiaMes);

  const diasRestantes = Math.max(ultimoDiaMes - diaDecorrido, 0);
  const percentualTempoDecorrido = Math.min(
    (diaDecorrido / ultimoDiaMes) * 100,
    100
  );

  const totalFaturado = Number(totalVendas?.totalVendas ?? 0);
  const ritmoDiario = diaDecorrido > 0 ? totalFaturado / diaDecorrido : 0;
  const projecaoFechamento = ritmoDiario * ultimoDiaMes;

  const mesesNomes = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const nomeMes = mesesNomes[mesAtual];
  const setorNome =
    setor === "todos" ? "Total Geral" : SETOR_INFO[setor]?.nome || setor;

  return (
    <div className={styles.cardTendencia}>
      <div className={styles.cardTendenciaHeader}>
        <div className={styles.cardTendenciaHeaderLeft}>
          <div className={styles.cardTendenciaIconeWrapper}>
            <ChartLineUpIcon size={24} weight="bold" />
          </div>
          <div className={styles.cardTendenciaTitulos}>
            <p className={styles.cardTendenciaSubtitulo}>
              <span>Projeção de Vendas</span>
              <span className={styles.cardTendenciaBadgeSetor}>{setorNome}</span>
            </p>
            <h2 className={styles.cardTendenciaTitulo}>
              Tendência de Fechamento — {nomeMes} de {anoAtual}
            </h2>
          </div>
        </div>

        <div className={styles.cardTendenciaBadgeTempo}>
          <CalendarBlankIcon size={15} weight="bold" />
          <span>
            Dia {String(diaDecorrido).padStart(2, "0")} de {ultimoDiaMes} (
            {percentualTempoDecorrido.toFixed(1)}% do mês)
          </span>
        </div>
      </div>

      <div className={styles.cardTendenciaGrid}>
        {/* Faturado até o momento */}
        <div className={styles.cardTendenciaItem}>
          <p className={styles.cardTendenciaItemLabel}>
            <span>Faturado até o momento</span>
          </p>
          {carregando ? (
            <div className={styles.kpiSkeleton} />
          ) : (
            <strong className={styles.cardTendenciaItemValor}>
              {formatarMoeda(totalFaturado)}
            </strong>
          )}
          <p className={styles.cardTendenciaItemSub}>
            nos primeiros {diaDecorrido}{" "}
            {diaDecorrido === 1 ? "dia apurado" : "dias apurados"} do mês
          </p>
        </div>

        {/* Ritmo Diário */}
        <div className={styles.cardTendenciaItem}>
          <p className={styles.cardTendenciaItemLabel}>
            <span>Ritmo diário médio</span>
          </p>
          {carregando ? (
            <div className={styles.kpiSkeleton} />
          ) : (
            <strong className={styles.cardTendenciaItemValor}>
              {formatarMoeda(ritmoDiario)}
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "var(--gray-500)",
                  marginLeft: "4px",
                }}
              >
                / dia
              </span>
            </strong>
          )}
          <p className={styles.cardTendenciaItemSub}>
            média apurada por dia decorrido
          </p>
        </div>

        {/* Previsão de Fechamento */}
        <div
          className={`${styles.cardTendenciaItem} ${styles.cardTendenciaItemDestaque}`}
        >
          <div className={styles.cardTendenciaItemLabel}>
            <span style={{ color: "#2b8a3e", fontWeight: "800" }}>
              Previsão de Fechamento
            </span>
            <span className={styles.cardTendenciaTagProjecao}>Projeção</span>
          </div>
          {carregando ? (
            <div className={styles.kpiSkeleton} />
          ) : (
            <strong
              className={`${styles.cardTendenciaItemValor} ${styles.cardTendenciaItemValorDestaque}`}
            >
              {formatarMoeda(projecaoFechamento)}
            </strong>
          )}
          <p className={styles.cardTendenciaItemSub}>
            estimativa para {ultimoDiaMes}/{String(mesAtual + 1).padStart(2, "0")}{" "}
            no ritmo atual
          </p>
        </div>
      </div>

      {/* Barra de Progresso Temporal */}
      <div className={styles.cardTendenciaProgressoWrapper}>
        <div className={styles.cardTendenciaProgressoBarra}>
          <div
            className={styles.cardTendenciaProgressoFill}
            style={{ width: `${percentualTempoDecorrido}%` }}
          />
        </div>
        <div className={styles.cardTendenciaProgressoLegenda}>
          <span>
            ✓ {diaDecorrido}{" "}
            {diaDecorrido === 1 ? "dia decorrido" : "dias decorridos"} (
            {percentualTempoDecorrido.toFixed(1)}%)
          </span>
          <span>
            ⏳ {diasRestantes}{" "}
            {diasRestantes === 1 ? "dia restante" : "dias restantes"} para
            encerrar o mês
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [setor, setSetor] = useState("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Produtos cadastrados (para obter quantidade por caixa e precoCompra)
  const { produtos } = useProdutos();

  // Usuários e filtro do setor externo
  const [usuariosExternos, setUsuariosExternos] = useState([]);
  const [vendedorExterno, setVendedorExterno] = useState("todos");
  const [rankingVendedoresExternos, setRankingVendedoresExternos] = useState([]);

  //hooks
  const { mensagem, setMensagem } = usarToast();

  // dados principais
  const [totalVendas, setTotalVendas] = useState(null);
  const [ticketMedio, setTicketMedio] = useState(null);
  const [relatorioDevolucao, setRelatorioDevolucao] = useState(null);
  const [metricasDesconto, setMetricasDesconto] = useState(null);
  const [modalDescontosAberto, setModalDescontosAberto] = useState(false);
  const [vendasDiarias, setVendasDiarias] = useState([]);
  const [vendasPorSetor, setVendasPorSetor] = useState([]);
  const [vendasPorFormaPagamento, setVendasPorFormaPagamento] = useState([]);
  const [intervaloTemporal, setIntervaloTemporal] = useState([]);
  const [topProdutos, setTopProdutos] = useState([]);
  const [mixProdutos, setMixProdutos] = useState({});
  const [pedidosPorVendedor, setPedidosPorVendedor] = useState([]);

  // relatório de produto
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [relatorioProduto, setRelatorioProduto] = useState(null);
  const [carregandoProduto, setCarregandoProduto] = useState(false);
  const [expandirRelatorio, setExpandirRelatorio] = useState(false);

  // Carrega usuários externos para o filtro
  useEffect(() => {
    const carregarUsuarios = async () => {
      try {
        const lista = await LerUsuario();
        const listaArr = Array.isArray(lista)
          ? lista
          : Array.isArray(lista?.resultado)
          ? lista.resultado
          : [];
        const externos = listaArr.filter((u) => {
          const nivel = String(u.nivelAcesso || u.cargo || "").toLowerCase();
          return nivel === "externo";
        });
        setUsuariosExternos(externos);
      } catch (err) {
        console.error("Erro ao carregar usuários externos:", err);
      }
    };
    carregarUsuarios();
  }, []);

  // Inicializa datas com o primeiro dia do mês até hoje
  useEffect(() => {
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    setDataInicio(dataFormatadaCalendario(primeiroDia));
    setDataFim(dataFormatadaCalendario());
  }, []);

  // Busca todos os dados do dashboard (individual ou consolidado de todos os setores)
  const buscarDados = useCallback(async () => {
    if (!dataInicio || !dataFim) return;
    setCarregando(true);

    const params = { dataInicio, dataFim };
    if (setor === "externo" && vendedorExterno && vendedorExterno !== "todos") {
      params.vendedor = vendedorExterno;
    }

    try {
      if (setor === "todos") {
        setRelatorioDevolucao(null);
        setRankingVendedoresExternos([]);
        const [tvList, itList, tpList, mpList, pvList, pedResults, resDesconto] =
          await Promise.all([
            Promise.allSettled(
              SETORES_BASE.map((s) => TotalVendasPeriodo(s, params))
            ),
            Promise.allSettled(
              SETORES_BASE.map((s) => IntervaloTemporal(s, params))
            ),
            Promise.allSettled(
              SETORES_BASE.map((s) => TopProdutos(s, { ...params }))
            ),
            Promise.allSettled(
              SETORES_BASE.map((s) => MixProdutos(s, params))
            ),
            Promise.allSettled(
              SETORES_BASE.map((s) => QuantidadePedidos(s, params))
            ),
            Promise.allSettled(
              SETORES_BASE.map((s) =>
                buscarPedido({ dataInicio, dataFim, setor: s })
              )
            ),
            buscarMetricasDesconto(params).catch((err) => {
              console.error("Erro ao buscar métricas de desconto geral:", err);
              return null;
            }),
          ]);

        setMetricasDesconto(
          resDesconto?.resultado ||
            resDesconto?.dados ||
            (resDesconto?.totalValorDesconto !== undefined ? resDesconto : null)
        );

        // 1. Total Vendas
        const totalVendasValidos = tvList
          .filter((r) => r.status === "fulfilled" && r.value)
          .map((r) => r.value);

        let totalVendasSum = 0;
        let quantidadePedidosSum = 0;
        totalVendasValidos.forEach((item) => {
          totalVendasSum += Number(item.totalVendas || 0);
          quantidadePedidosSum += Number(item.quantidadePedidos || 0);
        });

        setTotalVendas({
          totalVendas: totalVendasSum,
          quantidadePedidos: quantidadePedidosSum,
        });

        // 2. Ticket Médio recalculado
        const ticketMedioCalc =
          quantidadePedidosSum > 0 ? totalVendasSum / quantidadePedidosSum : 0;
        setTicketMedio({
          pedidoMedio: ticketMedioCalc,
          quantidadePedidos: quantidadePedidosSum,
        });

        // 3. Vendas por Setor (% do Total Geral)
        const dadosSetores = SETORES_BASE.map((s, i) => {
          const res = tvList[i]?.status === "fulfilled" ? tvList[i].value : null;
          const total = Number(res?.totalVendas || 0);
          const qtd = Number(res?.quantidadePedidos || 0);
          return {
            id: s,
            nome: SETOR_INFO[s]?.nome || s,
            cor: SETOR_INFO[s]?.cor || "#ff8c00",
            total,
            quantidade: qtd,
            percentual: totalVendasSum > 0 ? (total / totalVendasSum) * 100 : 0,
          };
        }).sort((a, b) => b.total - a.total);
        setVendasPorSetor(dadosSetores);

        // 4. Vendas Diárias e Formas de Pagamento consolidadas
        const pedidosBrutos = pedResults
          .filter((r) => r.status === "fulfilled" && r.value)
          .flatMap((r) =>
            Array.isArray(r.value)
              ? r.value
              : Array.isArray(r.value?.resultado)
              ? r.value.resultado
              : []
          );

        const mapaDias = new Map();
        const mapaFormas = new Map();

        pedidosBrutos.forEach((p) => {
          if (!p) return;
          const st = String(p.status || "").toLowerCase();
          if (st === "cancelado" || st === "devolvido") return;

          // Agrupamento por dia
          const dataPed =
            p.criadoEm ||
            p.createdAt ||
            p.data ||
            p.dataHora ||
            p.dataCriacao ||
            p.created_at;
          const ymd = extrairDataYMD(dataPed);
          if (ymd) {
            const diaLabel = format(parseISO(ymd), "dd/MM");
            const atual = mapaDias.get(ymd) || {
              dataYMD: ymd,
              dia: diaLabel,
              totalVendido: 0,
              quantidadePedidos: 0,
            };
            atual.totalVendido += Number(p.total || p.valorTotal || 0);
            atual.quantidadePedidos += 1;
            mapaDias.set(ymd, atual);
          }
        });

        const listaVendasDiarias = Array.from(mapaDias.values()).sort((a, b) =>
          a.dataYMD.localeCompare(b.dataYMD)
        );
        setVendasDiarias(listaVendasDiarias);
        setVendasPorFormaPagamento(extrairFormasPagamento(pedidosBrutos));

        // 4. Intervalo Temporal consolidado com ajuste de fuso horário de Brasília (-3h)
        const itValidos = itList
          .filter((r) => r.status === "fulfilled" && Array.isArray(r.value))
          .map((r) => r.value)
          .flat();

        const mapaHorarios = new Map();
        itValidos.forEach((it) => {
          if (!it || !it.horario) return;
          const horarioAjustado = ajustarFusoHorarioHorario(it.horario, -3);
          const atual = mapaHorarios.get(horarioAjustado) || {
            horario: horarioAjustado,
            totalVendido: 0,
            quantidadePedidos: 0,
          };
          atual.totalVendido += Number(it.totalVendido || 0);
          atual.quantidadePedidos += Number(it.quantidadePedidos || 0);
          mapaHorarios.set(horarioAjustado, atual);
        });
        const itConsolidado = Array.from(mapaHorarios.values()).sort((a, b) =>
          String(a.horario).localeCompare(String(b.horario))
        );
        setIntervaloTemporal(itConsolidado);

        // 5. Top Produtos consolidado
        const tpValidos = tpList
          .filter((r) => r.status === "fulfilled" && Array.isArray(r.value))
          .map((r) => r.value)
          .flat();

        const mapaTopProdutos = new Map();
        tpValidos.forEach((p) => {
          if (!p || !p.produtoId) return;
          const chave = String(p.produtoId);
          const atual = mapaTopProdutos.get(chave) || {
            produtoId: p.produtoId,
            nomeProduto: p.nomeProduto || "Produto",
            quantidadeVendida: 0,
            valorTotalVendido: 0,
          };
          atual.quantidadeVendida += Number(p.quantidadeVendida || 0);
          atual.valorTotalVendido += Number(p.valorTotalVendido || 0);
          mapaTopProdutos.set(chave, atual);
        });
        const tpConsolidado = Array.from(mapaTopProdutos.values()).sort(
          (a, b) => Number(b.valorTotalVendido || 0) - Number(a.valorTotalVendido || 0)
        );
        setTopProdutos(tpConsolidado);

        // 6. Mix de Produtos consolidado
        const mpValidos = mpList
          .filter(
            (r) =>
              r.status === "fulfilled" &&
              r.value &&
              typeof r.value === "object"
          )
          .map((r) => r.value);

        const mixConsolidado = {};
        mpValidos.forEach((obj) => {
          Object.entries(obj).forEach(([prod, assoc]) => {
            if (!mixConsolidado[prod]) mixConsolidado[prod] = {};
            if (assoc && typeof assoc === "object") {
              Object.entries(assoc).forEach(([parceiro, freq]) => {
                mixConsolidado[prod][parceiro] =
                  (mixConsolidado[prod][parceiro] || 0) + Number(freq || 0);
              });
            }
          });
        });
        setMixProdutos(mixConsolidado);

        // 7. Pedidos por Vendedor consolidado
        const pvValidos = pvList
          .filter((r) => r.status === "fulfilled" && Array.isArray(r.value))
          .map((r) => r.value)
          .flat();

        const mapaVendedores = new Map();
        pvValidos.forEach((pv) => {
          if (!pv || !pv.vendedor) return;
          const chave = pv.vendedor.trim();
          const atual = mapaVendedores.get(chave) || {
            vendedor: chave,
            quantidadePedidos: 0,
          };
          atual.quantidadePedidos += Number(pv.quantidadePedidos || 0);
          mapaVendedores.set(chave, atual);
        });
        const pvConsolidado = Array.from(mapaVendedores.values()).sort(
          (a, b) => b.quantidadePedidos - a.quantidadePedidos
        );
        setPedidosPorVendedor(pvConsolidado);
      } else {
        const [tv, tm, it, tp, mp, pv, resPedidos, resDevolucao, resDesconto] =
          await Promise.all([
            TotalVendasPeriodo(setor, params),
            TicketMedio(setor, params),
            IntervaloTemporal(setor, params),
            TopProdutos(setor, { ...params }),
            MixProdutos(setor, params),
            QuantidadePedidos(setor, params),
            buscarPedido({ dataInicio, dataFim, setor }),
            setor === "externo"
              ? buscarRelatorioDevolucoes({
                  dataInicio,
                  dataFim,
                  vendedor: vendedorExterno,
                }).catch((err) => {
                  console.error("Erro ao buscar relatório de devoluções:", err);
                  return null;
                })
              : Promise.resolve(null),
            buscarMetricasDesconto({ ...params, setor }).catch((err) => {
              console.error("Erro ao buscar métricas de desconto:", err);
              return null;
            }),
          ]);

        setTotalVendas(tv);
        setTicketMedio(tm);
        setRelatorioDevolucao(resDevolucao);
        setMetricasDesconto(
          resDesconto?.resultado ||
            resDesconto?.dados ||
            (resDesconto?.totalValorDesconto !== undefined ? resDesconto : null)
        );
        setVendasPorSetor([]);

        // Vendas Diárias e Formas de Pagamento no setor
        const pedidosBrutos = Array.isArray(resPedidos)
          ? resPedidos
          : Array.isArray(resPedidos?.resultado)
          ? resPedidos.resultado
          : [];

        const mapaDias = new Map();
        const mapaFormas = new Map();

        pedidosBrutos.forEach((p) => {
          if (!p) return;
          const st = String(p.status || "").toLowerCase();
          if (st === "cancelado" || st === "devolvido") return;

          // Agrupamento por dia
          const dataPed =
            p.criadoEm ||
            p.createdAt ||
            p.data ||
            p.dataHora ||
            p.dataCriacao ||
            p.created_at;
          const ymd = extrairDataYMD(dataPed);
          if (ymd) {
            const diaLabel = format(parseISO(ymd), "dd/MM");
            const atual = mapaDias.get(ymd) || {
              dataYMD: ymd,
              dia: diaLabel,
              totalVendido: 0,
              quantidadePedidos: 0,
            };
            atual.totalVendido += Number(p.total || p.valorTotal || 0);
            atual.quantidadePedidos += 1;
            mapaDias.set(ymd, atual);
          }
        });

        const listaVendasDiarias = Array.from(mapaDias.values()).sort((a, b) =>
          a.dataYMD.localeCompare(b.dataYMD)
        );
        setVendasDiarias(listaVendasDiarias);
        setVendasPorFormaPagamento(extrairFormasPagamento(pedidosBrutos));

        // Ranking de Vendedores Externos quando selecionado "todos"
        if (setor === "externo" && vendedorExterno === "todos") {
          const mapaRanking = new Map();
          pedidosBrutos.forEach((p) => {
            if (!p) return;
            const st = String(p.status || "").toLowerCase();
            if (st === "cancelado" || st === "devolvido") return;

            const nomeVendedor = (p.vendedor || p.usuario?.nome || "Vendedor").trim();
            const val = Number(p.total || p.valorTotal || 0);

            const atual = mapaRanking.get(nomeVendedor) || {
              vendedor: nomeVendedor,
              totalVendas: 0,
              quantidadePedidos: 0,
            };
            atual.totalVendas += val;
            atual.quantidadePedidos += 1;
            mapaRanking.set(nomeVendedor, atual);
          });

          const totalGeralRanking = Array.from(mapaRanking.values()).reduce(
            (acc, v) => acc + v.totalVendas,
            0
          );

          const rankingLista = Array.from(mapaRanking.values())
            .map((v) => ({
              ...v,
              ticketMedio:
                v.quantidadePedidos > 0 ? v.totalVendas / v.quantidadePedidos : 0,
              percentual:
                totalGeralRanking > 0 ? (v.totalVendas / totalGeralRanking) * 100 : 0,
            }))
            .sort((a, b) => b.totalVendas - a.totalVendas);

          setRankingVendedoresExternos(rankingLista);
        } else {
          setRankingVendedoresExternos([]);
        }

        // Intervalo Temporal com ajuste de fuso horário de Brasília (-3h)
        const itProcessado = (Array.isArray(it) ? it : [])
          .map((item) => ({
            ...item,
            horario: ajustarFusoHorarioHorario(item.horario, -3),
          }))
          .sort((a, b) => String(a.horario).localeCompare(String(b.horario)));

        setIntervaloTemporal(itProcessado);
        const tpOrdenado = (Array.isArray(tp) ? tp : [])
          .slice()
          .sort(
            (a, b) =>
              Number(b.valorTotalVendido || 0) - Number(a.valorTotalVendido || 0)
          );
        setTopProdutos(tpOrdenado);
        setMixProdutos(mp);
        setPedidosPorVendedor(pv);
      }

      // Limpa o relatório de produto ao trocar filtros
      setProdutoSelecionado("");
      setRelatorioProduto(null);
      setExpandirRelatorio(false);
    } catch (e) {
      console.log(e);
      const mensagem =
        e.response?.data?.erro?.mensagem ||
        e.message ||
        "Erro ao carregar dados do dashboard";

      setMensagem(mensagem);
    } finally {
      setCarregando(false);
    }
  }, [setor, dataInicio, dataFim, vendedorExterno]);

  useEffect(() => {
    buscarDados();
  }, [buscarDados]);

  // Busca relatório do produto selecionado (com conversão para caixas e cálculo de margem)
  const buscarRelatorioProduto = async (produtoId) => {
    if (!produtoId) {
      setRelatorioProduto(null);
      setExpandirRelatorio(false);
      return;
    }

    setProdutoSelecionado(produtoId);
    setCarregandoProduto(true);
    setExpandirRelatorio(true);

    try {
      const params = { dataInicio, dataFim };
      if (setor === "externo" && vendedorExterno && vendedorExterno !== "todos") {
        params.vendedor = vendedorExterno;
      }

      // Produto da lista geral para obter quantidade por caixa e precoCompra
      const produtoObj = (Array.isArray(produtos) ? produtos : []).find(
        (p) => String(p.id) === String(produtoId)
      );

      const unidadesPorCaixa =
        Number(produtoObj?.quantidade || 0) > 0
          ? Number(produtoObj.quantidade)
          : 1;
      const precoCompra = Number(produtoObj?.precoCompra || 0);

      if (setor === "todos") {
        const resultados = await Promise.allSettled(
          SETORES_BASE.map((s) => RelatorioProduto(s, produtoId, params))
        );

        const resBalcao =
          resultados[0]?.status === "fulfilled" ? resultados[0].value : null;
        const resDelivery =
          resultados[1]?.status === "fulfilled" ? resultados[1].value : null;
        const resExterno =
          resultados[2]?.status === "fulfilled" ? resultados[2].value : null;

        // Balcão vende em unidades soltas -> transformar para caixas antes de somar
        const qtdUnidadesBalcao = Number(resBalcao?.quantidade || 0);
        const qtdCaixasBalcao = qtdUnidadesBalcao / unidadesPorCaixa;
        const qtdCaixasDelivery = Number(resDelivery?.quantidade || 0);
        const qtdCaixasExterno = Number(resExterno?.quantidade || 0);

        const totalCaixas =
          qtdCaixasBalcao + qtdCaixasDelivery + qtdCaixasExterno;

        const fatBalcao = Number(resBalcao?.faturamentoTotal || 0);
        const fatDelivery = Number(resDelivery?.faturamentoTotal || 0);
        const fatExterno = Number(resExterno?.faturamentoTotal || 0);
        const faturamentoTotal = fatBalcao + fatDelivery + fatExterno;

        const totalPedidos =
          Number(resBalcao?.totalPedidos || 0) +
          Number(resDelivery?.totalPedidos || 0) +
          Number(resExterno?.totalPedidos || 0);

        const pedidoPositavo =
          Number(resBalcao?.pedidoPositavo || 0) +
          Number(resDelivery?.pedidoPositavo || 0) +
          Number(resExterno?.pedidoPositavo || 0);

        const precoMedio =
          totalCaixas > 0 ? faturamentoTotal / totalCaixas : 0;
        const mediaProdutoPorPedido =
          totalPedidos > 0 ? totalCaixas / totalPedidos : 0;
        const porcentualPositivado =
          totalPedidos > 0 ? (pedidoPositavo / totalPedidos) * 100 : 0;

        // Margem do produto (2.1)
        const lucroTotal =
          totalCaixas > 0 && precoCompra > 0
            ? faturamentoTotal - totalCaixas * precoCompra
            : 0;
        const margemPercentual =
          precoMedio > 0 && precoCompra > 0
            ? ((precoMedio - precoCompra) / precoMedio) * 100
            : 0;

        setRelatorioProduto({
          quantidade: totalCaixas,
          unidadeMedida: "cx.",
          faturamentoTotal,
          precoMedio,
          precoCompra,
          lucroTotal,
          margemPercentual,
          mediaProdutoPorPedido,
          totalPedidos,
          pedidoPositavo,
          porcentualPositivado,
          detalheBalcao: {
            unidades: qtdUnidadesBalcao,
            caixas: qtdCaixasBalcao,
            unidadesPorCaixa,
          },
        });
      } else {
        const resultado = await RelatorioProduto(setor, produtoId, params);
        const qtd = Number(resultado?.quantidade || 0);
        const fat = Number(resultado?.faturamentoTotal || 0);
        const precoMedio = Number(resultado?.precoMedio || 0);

        let precoCompraBase = precoCompra;
        let unidadeMedida = "cx.";

        if (setor === "balcao") {
          unidadeMedida = "un.";
          precoCompraBase =
            unidadesPorCaixa > 0 ? precoCompra / unidadesPorCaixa : precoCompra;
        }

        const lucroTotal =
          qtd > 0 && precoCompraBase > 0
            ? fat - qtd * precoCompraBase
            : 0;
        const margemPercentual =
          precoMedio > 0 && precoCompraBase > 0
            ? ((precoMedio - precoCompraBase) / precoMedio) * 100
            : 0;

        setRelatorioProduto({
          ...resultado,
          unidadeMedida,
          precoCompra: precoCompraBase,
          lucroTotal,
          margemPercentual,
        });
      }
    } catch (e) {
      console.error("Erro ao buscar relatório do produto:", e);
      setMensagem(e.message || "Erro ao buscar relatório do produto");
    } finally {
      setCarregandoProduto(false);
    }
  };

  // Mix: pegar os 8 pares mais frequentes
  const mixPares = Object.entries(mixProdutos)
    .flatMap(([prod, assoc]) =>
      Object.entries(assoc).map(([parceiro, freq]) => ({
        par: `${prod} + ${parceiro}`,
        freq,
      })),
    )
    .sort((a, b) => b.freq - a.freq)
    .slice(0, 8);

  // Nome do produto selecionado para exibir no cabeçalho
  const nomeProdutoSelecionado =
    topProdutos.find((p) => String(p.produtoId) === String(produtoSelecionado))
      ?.nomeProduto ?? "";

  return (
    <div className={styles.container}>
      <ToastRadix mensagem={mensagem} />
      <Cabecalho />

      <main className={styles.main}>
        {/*  CABEÇALHO  */}
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <div className={styles.iconeWrapper}>
              <ChartBarIcon size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Visão geral</p>
              <h1 className={styles.pageTitulo}>Dashboard</h1>
            </div>
          </div>

          {carregando && (
            <div className={styles.carregandoBadge}>
              <SpinnerIcon
                size={14}
                weight="bold"
                className={styles.spinnerIcon}
              />
              Atualizando...
            </div>
          )}
        </div>

        {/*  FILTROS  */}
        <div className={styles.painelFiltros}>
          <div className={styles.filtrosHeader}>
            <FunnelIcon
              size={14}
              weight="bold"
              className={styles.filtroIcone}
            />
            <span>Filtros</span>
          </div>
          <div
            className={
              setor === "externo"
                ? styles.filtrosGridExterno
                : styles.filtrosGrid
            }
          >
            {/* SETOR */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>Setor</label>
              <div className={styles.setorTabs}>
                {SETORES.map((s) => (
                  <button
                    key={s.id}
                    className={`${styles.setorTab} ${setor === s.id ? styles.setorTabAtivo : ""}`}
                    onClick={() => {
                      setSetor(s.id);
                      if (s.id !== "externo") {
                        setVendedorExterno("todos");
                      }
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* VENDEDOR EXTERNO (Apenas quando setor Externo selecionado) */}
            {setor === "externo" && (
              <div className={styles.filtroGrupo}>
                <label className={styles.filtroLabel}>
                  <UsersIcon size={13} weight="bold" />
                  Vendedor Externo
                </label>
                <select
                  className={styles.selectInputFiltro}
                  value={vendedorExterno}
                  onChange={(e) => setVendedorExterno(e.target.value)}
                >
                  <option value="todos">Todos os vendedores</option>
                  {usuariosExternos.map((u) => (
                    <option key={u.id} value={u.nome}>
                      {u.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* DATA INICIAL */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>
                <CalendarBlankIcon size={13} weight="bold" />
                Data inicial
              </label>
              <input
                type="date"
                className={styles.calendario}
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            {/* DATA FINAL */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>
                <CalendarBlankIcon size={13} weight="bold" />
                Data final
              </label>
              <div className={styles.dataFimGroup}>
                <input
                  type="date"
                  className={styles.calendario}
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
                <button
                  className={styles.botaoHoje}
                  onClick={() => setDataFim(dataFormatadaCalendario())}
                >
                  Hoje
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div
          className={
            setor === "externo" ? styles.kpiGrid6 : styles.kpiGrid
          }
        >
          <KpiCard
            icone={TrendUpIcon}
            cor="orange"
            label="Total de vendas"
            valor={formatarMoeda(totalVendas?.totalVendas ?? 0)}
            sub={`${totalVendas?.quantidadePedidos ?? 0} pedidos no período`}
            carregando={carregando}
          />
          <KpiCard
            icone={CurrencyDollarIcon}
            cor="green"
            label="Ticket médio"
            valor={formatarMoeda(ticketMedio?.pedidoMedio ?? 0)}
            sub={`base: ${ticketMedio?.quantidadePedidos ?? 0} pedidos`}
            carregando={carregando}
          />
          <KpiCard
            icone={ShoppingCartIcon}
            cor="blue"
            label="Total de pedidos"
            valor={totalVendas?.quantidadePedidos ?? 0}
            sub="pedidos no período selecionado"
            carregando={carregando}
          />
          <KpiCard
            icone={UsersIcon}
            cor="purple"
            label="Vendedores ativos"
            valor={pedidosPorVendedor.length}
            sub={`${setor === "todos" ? "todos os setores" : setor} · no período`}
            carregando={carregando}
          />
          <KpiCard
            icone={TagIcon}
            cor="red"
            label="Descontos"
            valor={formatarMoeda(
              Math.abs(
                Number(
                  metricasDesconto?.totalValorDesconto ??
                    metricasDesconto?.totalValorDescontos ??
                    metricasDesconto?.valorTotalDesconto ??
                    0
                )
              )
            )}
            sub={`${Math.abs(
              Number(
                metricasDesconto?.quantidadePedidos ??
                  metricasDesconto?.totalPedidos ??
                  0
              )
            )} pedidos · ${Math.abs(
              Number(
                metricasDesconto?.quantidadeTotalItens ??
                  metricasDesconto?.quantidadeTotalItensDesconto ??
                  metricasDesconto?.quantidadeVezesAdicionado ??
                  metricasDesconto?.quantidadeDescontos ??
                  0
              )
            )} itens`}
            carregando={carregando}
            acao={
              <button
                className={styles.kpiBotaoAcao}
                onClick={() => setModalDescontosAberto(true)}
                title="Ver lista de pedidos com desconto"
                type="button"
              >
                <MagnifyingGlassIcon size={11} weight="bold" />
                <span>Ver pedidos</span>
              </button>
            }
          />
          {setor === "externo" && (
            <KpiCard
              icone={ArrowCounterClockwiseIcon}
              cor="red"
              label="Devoluções"
              valor={formatarMoeda(
                relatorioDevolucao?.resumo?.valorTotalDevolvido ?? 0
              )}
              sub={`${relatorioDevolucao?.resumo?.quantidadePedidosDevolvidos ?? 0} pedidos · ${Number(relatorioDevolucao?.resumo?.percentualValor ?? 0).toFixed(1)}% das vendas`}
              carregando={carregando}
            />
          )}
        </div>

        {/* CARD DE TENDÊNCIA DO MÊS ATUAL (Renderizado apenas quando o mês atual estiver em andamento) */}
        <CardTendenciaMes
          dataInicio={dataInicio}
          dataFim={dataFim}
          totalVendas={totalVendas}
          setor={setor}
          carregando={carregando}
        />

        {/* BARRAS DE %: PARTICIPAÇÃO POR SETOR E POR FORMA DE PAGAMENTO */}
        <div
          className={
            setor === "todos"
              ? styles.linhaGraficosCirculares
              : styles.linhaGraficosCircularesUnico
          }
        >
          {/* CARD 1: % POR SETOR (Visível no Total Geral) */}
          {setor === "todos" && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderTitle}>
                  <PercentIcon
                    size={18}
                    weight="bold"
                    className={styles.cardHeaderIcon}
                  />
                  <h2>Vendas por setor</h2>
                </div>
                <span className={styles.cardBadge}>
                  {vendasPorSetor.length} setores
                </span>
              </div>

              {carregando ? (
                <div className={styles.barraSkeletonLista}>
                  <div className={styles.rowSkeleton} />
                  <div className={styles.rowSkeleton} />
                  <div className={styles.rowSkeleton} />
                </div>
              ) : vendasPorSetor.length === 0 || (totalVendas?.totalVendas ?? 0) === 0 ? (
                <div className={styles.vazioGrafico}>Sem dados no período</div>
              ) : (
                <div className={styles.barraProgressoLista}>
                  {vendasPorSetor.map((item) => (
                    <div key={item.id} className={styles.barraProgressoItem}>
                      <div className={styles.barraProgressoHeader}>
                        <div className={styles.barraProgressoIdent}>
                          <div
                            className={styles.barraProgressoDot}
                            style={{ backgroundColor: item.cor }}
                          />
                          <span className={styles.barraProgressoNome}>
                            {item.nome}
                          </span>
                          <span className={styles.barraProgressoQtd}>
                            {item.quantidade} {item.quantidade === 1 ? "pedido" : "pedidos"}
                          </span>
                        </div>
                        <div className={styles.barraProgressoValores}>
                          <strong className={styles.barraProgressoTotal}>
                            {formatarMoeda(item.total)}
                          </strong>
                          <span
                            className={styles.barraProgressoPctBadge}
                            style={{
                              color: item.cor,
                              backgroundColor: `${item.cor}18`,
                            }}
                          >
                            {item.percentual?.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className={styles.barraProgressoTrack}>
                        <div
                          className={styles.barraProgressoFill}
                          style={{
                            width: `${Math.min(item.percentual || 0, 100)}%`,
                            backgroundColor: item.cor,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CARD 2: % POR FORMA DE PAGAMENTO (Visível para todos os setores) */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <CurrencyDollarIcon
                  size={18}
                  weight="bold"
                  className={styles.cardHeaderIcon}
                />
                <h2>Formas de pagamento</h2>
              </div>
              <span className={styles.cardBadge}>
                {vendasPorFormaPagamento.length} formas
              </span>
            </div>

            {carregando ? (
              <div className={styles.barraSkeletonLista}>
                <div className={styles.rowSkeleton} />
                <div className={styles.rowSkeleton} />
                <div className={styles.rowSkeleton} />
              </div>
            ) : vendasPorFormaPagamento.length === 0 ? (
              <div className={styles.vazioGrafico}>Sem dados no período</div>
            ) : (
              <div className={styles.barraProgressoLista}>
                {vendasPorFormaPagamento.map((item, idx) => (
                  <div key={`forma-item-${idx}`} className={styles.barraProgressoItem}>
                    <div className={styles.barraProgressoHeader}>
                      <div className={styles.barraProgressoIdent}>
                        <div
                          className={styles.barraProgressoDot}
                          style={{ backgroundColor: item.cor || "#ff8c00" }}
                        />
                        <span className={styles.barraProgressoNome}>
                          {item.nome}
                        </span>
                        <span className={styles.barraProgressoQtd}>
                          {item.quantidade} {item.quantidade === 1 ? "pedido" : "pedidos"}
                        </span>
                      </div>
                      <div className={styles.barraProgressoValores}>
                        <strong className={styles.barraProgressoTotal}>
                          {formatarMoeda(item.total)}
                        </strong>
                        <span
                          className={styles.barraProgressoPctBadge}
                          style={{
                            color: item.cor || "#ff8c00",
                            backgroundColor: `${item.cor || "#ff8c00"}18`,
                          }}
                        >
                          {item.percentual?.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className={styles.barraProgressoTrack}>
                      <div
                        className={styles.barraProgressoFill}
                        style={{
                          width: `${Math.min(item.percentual || 0, 100)}%`,
                          backgroundColor: item.cor || "#ff8c00",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* GRÁFICOS SUPERIORES: VENDAS DIÁRIAS & VENDAS POR HORÁRIO */}
        <div className={styles.linhaGraficosSuperiores}>
          {/* GRÁFICO 1: EVOLUÇÃO DE VENDAS DIÁRIAS */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <CalendarBlankIcon
                  size={18}
                  weight="bold"
                  className={styles.cardHeaderIcon}
                />
                <h2>Evolução de vendas diárias</h2>
              </div>
              <span className={styles.cardBadge}>
                {vendasDiarias.length} dias com vendas
              </span>
            </div>

            {carregando ? (
              <div className={styles.graficoSkeleton} />
            ) : vendasDiarias.length === 0 ? (
              <div className={styles.vazioGrafico}>Sem vendas registradas no período</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart
                  data={vendasDiarias}
                  margin={{ top: 6, right: 16, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradVendasDiarias" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#1971c2"
                        stopOpacity={0.25}
                      />
                      <stop offset="95%" stopColor="#1971c2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f3f5"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="dia"
                    tick={{ fontSize: 11, fill: "#868e96" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11, fill: "#868e96" }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                  />
                  <Tooltip content={<TooltipVendasDiarias />} />
                  <Area
                    type="monotone"
                    dataKey="totalVendido"
                    stroke="#1971c2"
                    strokeWidth={2.5}
                    fill="url(#gradVendasDiarias)"
                  />
                  <Area
                    type="monotone"
                    dataKey="quantidadePedidos"
                    stroke="#adb5bd"
                    strokeWidth={1.5}
                    fill="none"
                    strokeDasharray="4 3"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            <div className={styles.legendaGrafico}>
              <span className={styles.legendaItem} style={{ color: "#1971c2" }}>
                — Faturamento
              </span>
              <span className={styles.legendaItem} data-cor="gray">
                - - Pedidos
              </span>
            </div>
          </div>

          {/* GRÁFICO 2: VENDAS POR HORÁRIO (COM AJUSTE DE FUSO -3H) */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <ClockIcon
                  size={18}
                  weight="bold"
                  className={styles.cardHeaderIcon}
                />
                <h2>Vendas por horário (Brasília)</h2>
              </div>
              <span className={styles.cardBadge}>
                {intervaloTemporal.length} faixas
              </span>
            </div>

            {carregando ? (
              <div className={styles.graficoSkeleton} />
            ) : intervaloTemporal.length === 0 ? (
              <div className={styles.vazioGrafico}>Sem dados no período</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart
                  data={intervaloTemporal}
                  margin={{ top: 6, right: 16, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradVendas" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#ff8c00"
                        stopOpacity={0.25}
                      />
                      <stop offset="95%" stopColor="#ff8c00" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f3f5"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="horario"
                    tick={{ fontSize: 11, fill: "#868e96" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11, fill: "#868e96" }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                  />
                  <Tooltip content={<TooltipVendas />} />
                  <Area
                    type="monotone"
                    dataKey="totalVendido"
                    stroke="#ff8c00"
                    strokeWidth={2.5}
                    fill="url(#gradVendas)"
                  />
                  <Area
                    type="monotone"
                    dataKey="quantidadePedidos"
                    stroke="#adb5bd"
                    strokeWidth={1.5}
                    fill="none"
                    strokeDasharray="4 3"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            <div className={styles.legendaGrafico}>
              <span className={styles.legendaItem} data-cor="orange">
                — Faturamento
              </span>
              <span className={styles.legendaItem} data-cor="gray">
                - - Pedidos
              </span>
            </div>
          </div>
        </div>

        {/* PEDIDOS POR VENDEDOR / RANKING VENDEDORES EXTERNOS */}
        <div className={styles.linhaGraficos}>
          {setor === "externo" && vendedorExterno === "todos" ? (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderTitle}>
                  <MedalIcon
                    size={18}
                    weight="bold"
                    className={styles.cardHeaderIcon}
                  />
                  <h2>Ranking de vendedores externos (por faturamento)</h2>
                </div>
                <span className={styles.cardBadge}>
                  {rankingVendedoresExternos.length} vendedores ativos
                </span>
              </div>

              {carregando ? (
                <div className={styles.barraSkeletonLista}>
                  <div className={styles.rowSkeleton} />
                  <div className={styles.rowSkeleton} />
                  <div className={styles.rowSkeleton} />
                </div>
              ) : rankingVendedoresExternos.length === 0 ? (
                <div className={styles.vazioGrafico}>Sem vendas registradas no período</div>
              ) : (
                <div className={styles.rankingLista}>
                  {rankingVendedoresExternos.map((item, index) => (
                    <div key={item.vendedor} className={styles.rankingItem}>
                      <div
                        className={styles.rankingPosicao}
                        style={{
                          color: medalCores[index] ?? "#495057",
                          background: index < 3 ? `${medalCores[index]}25` : "#f1f3f5",
                        }}
                      >
                        {index < 3 ? (
                          <MedalIcon size={18} weight="fill" />
                        ) : (
                          <span>{index + 1}º</span>
                        )}
                      </div>

                      <div className={styles.rankingInfo}>
                        <div className={styles.rankingNomeLinha}>
                          <span className={styles.rankingNome}>{item.vendedor}</span>
                          <div className={styles.rankingValores}>
                            <strong className={styles.rankingTotal}>
                              {formatarMoeda(item.totalVendas)}
                            </strong>
                            <span className={styles.rankingPctBadge}>
                              {item.percentual?.toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        <div className={styles.rankingBarTrack}>
                          <div
                            className={styles.rankingBarFill}
                            style={{
                              width: `${Math.min(item.percentual || 0, 100)}%`,
                            }}
                          />
                        </div>

                        <div className={styles.rankingMetaLinha}>
                          <span>{item.quantidadePedidos} {item.quantidadePedidos === 1 ? "pedido" : "pedidos"}</span>
                          <span>•</span>
                          <span>Ticket Médio: {formatarMoeda(item.ticketMedio)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderTitle}>
                  <UsersIcon
                    size={18}
                    weight="bold"
                    className={styles.cardHeaderIcon}
                  />
                  <h2>Pedidos por vendedor</h2>
                </div>
                <span className={styles.cardBadge}>
                  {pedidosPorVendedor.length} vendedores
                </span>
              </div>

              {carregando ? (
                <div className={styles.graficoSkeleton} />
              ) : pedidosPorVendedor.length === 0 ? (
                <div className={styles.vazioGrafico}>Sem dados no período</div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(260, Math.min(pedidosPorVendedor.length * 36 + 40, 600))}
                >
                  <BarChart
                    data={pedidosPorVendedor}
                    layout="vertical"
                    margin={{ top: 8, right: 24, left: 16, bottom: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f1f3f5"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "#868e96" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="vendedor"
                      type="category"
                      tick={{ fontSize: 12, fill: "#495057", fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                      width={140}
                    />
                    <Tooltip formatter={(v) => [`${v} pedidos`, "Qtd"]} />
                    <Bar
                      dataKey="quantidadePedidos"
                      fill="#ff8c00"
                      radius={[0, 6, 6, 0]}
                      maxBarSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </div>

        {/* TOP PRODUTOS E MIX */}
        <div className={styles.linhaInferior}>
          {/* Top produtos */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <MedalIcon
                  size={18}
                  weight="bold"
                  className={styles.cardHeaderIcon}
                />
                <h2>Top produtos</h2>
              </div>
              <span className={styles.cardBadge}>
                {topProdutos.length} itens
              </span>
            </div>

            {carregando ? (
              <>
                <div className={styles.rowSkeleton} />
                <div className={styles.rowSkeleton} />
                <div className={styles.rowSkeleton} />
              </>
            ) : topProdutos.length === 0 ? (
              <div className={styles.vazioGrafico}>Sem dados no período</div>
            ) : (
              <div className={styles.topProdutoLista}>
                {topProdutos.map((p, i) => {
                  const baseMax = Number(topProdutos[0]?.valorTotalVendido || 0);
                  const pct =
                    baseMax > 0
                      ? Math.round(
                          (Number(p.valorTotalVendido || 0) / baseMax) * 100
                        )
                      : 0;
                  return (
                    <div key={p.produtoId} className={styles.topProdutoItem}>
                      <div
                        className={styles.topProdutoPos}
                        style={{ color: medalCores[i] ?? "#adb5bd" }}
                      >
                        {i < 3 ? (
                          <MedalIcon size={16} weight="fill" />
                        ) : (
                          <span className={styles.topProdutoNum}>{i + 1}</span>
                        )}
                      </div>
                      <div className={styles.topProdutoInfo}>
                        <div className={styles.topProdutoNome}>
                          {p.nomeProduto}
                        </div>
                        <div className={styles.topProdutoBar}>
                          <div
                            className={styles.topProdutoBarFill}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <div className={styles.topProdutoMetrics}>
                        <strong>{formatarMoeda(p.valorTotalVendido)}</strong>
                        <span>{p.quantidadeVendida} un.</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mix de produtos */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <ArrowsLeftRightIcon
                  size={18}
                  weight="bold"
                  className={styles.cardHeaderIcon}
                />
                <h2>Mix de produtos</h2>
              </div>
              <span className={styles.cardBadge}>combinações</span>
            </div>
            <p className={styles.mixSubtitulo}>
              Produtos mais comprados juntos
            </p>

            {carregando ? (
              <>
                <div className={styles.rowSkeleton} />
                <div className={styles.rowSkeleton} />
                <div className={styles.rowSkeleton} />
              </>
            ) : mixPares.length === 0 ? (
              <div className={styles.vazioGrafico}>Sem dados no período</div>
            ) : (
              <div className={styles.mixLista}>
                {mixPares.map((par, i) => (
                  <div key={i} className={styles.mixItem}>
                    <div className={styles.mixPar}>
                      {par.par.split(" + ").map((nome, j) => (
                        <span key={j} className={styles.mixTag}>
                          {nome}
                        </span>
                      ))}
                    </div>
                    <div className={styles.mixFreq}>
                      <div
                        className={styles.mixFreqBar}
                        style={{ width: `${Math.min(par.freq * 20, 100)}%` }}
                      />
                      <span>{par.freq}×</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RELATÓRIO E PRODUTOS*/}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderTitle}>
              <MagnifyingGlassIcon
                size={18}
                weight="bold"
                className={styles.cardHeaderIcon}
              />
              <h2>Relatório de produto</h2>
            </div>
            {nomeProdutoSelecionado && (
              <span className={styles.cardBadgeProduto}>
                {nomeProdutoSelecionado}
              </span>
            )}
          </div>

          {/* Select de produto */}
          <div className={styles.relatorioBuscaWrapper}>
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>Selecione o produto</label>
              <select
                className={styles.selectInput}
                value={produtoSelecionado}
                onChange={(e) => buscarRelatorioProduto(e.target.value)}
                disabled={topProdutos.length === 0}
              >
                <option value="">Escolha um produto...</option>
                {topProdutos.map((p) => (
                  <option key={p.produtoId} value={p.produtoId}>
                    {p.nomeProduto}
                  </option>
                ))}
              </select>
            </div>
            <p className={styles.relatorioBuscaHint}>
              A lista é populada a partir do Top Produtos do período selecionado
            </p>
          </div>

          {/* Seção expandida com os dados */}
          {expandirRelatorio && (
            <div className={styles.relatorioExpandido}>
              <div className={styles.relatorioExpandidoDivider} />

              {carregandoProduto ? (
                <div className={styles.relatorioSkeletonGrid}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className={styles.relatorioSkeleton} />
                  ))}
                </div>
              ) : relatorioProduto ? (
                <div className={styles.relatorioGrid}>
                  <div className={styles.relatorioCard} data-cor="orange">
                    <div className={styles.relatorioCardIcone}>
                      <PackageIcon size={18} weight="fill" />
                    </div>
                    <p className={styles.relatorioCardLabel}>
                      Quantidade vendida
                    </p>
                    <strong className={styles.relatorioCardValor}>
                      {Number.isInteger(Number(relatorioProduto.quantidade))
                        ? Number(relatorioProduto.quantidade)
                        : Number(relatorioProduto.quantidade).toFixed(2)}{" "}
                      {relatorioProduto.unidadeMedida || "cx."}
                    </strong>
                    {relatorioProduto.detalheBalcao?.unidades > 0 && (
                      <p className={styles.relatorioCardSub}>
                        inclui {relatorioProduto.detalheBalcao.unidades} un. balcão (
                        {relatorioProduto.detalheBalcao.unidadesPorCaixa} un/cx)
                      </p>
                    )}
                  </div>

                  <div className={styles.relatorioCard} data-cor="green">
                    <div className={styles.relatorioCardIcone}>
                      <TrendUpIcon size={18} weight="fill" />
                    </div>
                    <p className={styles.relatorioCardLabel}>
                      Faturamento total
                    </p>
                    <strong className={styles.relatorioCardValor}>
                      {formatarMoeda(relatorioProduto.faturamentoTotal)}
                    </strong>
                  </div>

                  <div className={styles.relatorioCard} data-cor="blue">
                    <div className={styles.relatorioCardIcone}>
                      <CurrencyDollarIcon size={18} weight="fill" />
                    </div>
                    <p className={styles.relatorioCardLabel}>Preço médio</p>
                    <strong className={styles.relatorioCardValor}>
                      {formatarMoeda(relatorioProduto.precoMedio)}
                    </strong>
                    <p className={styles.relatorioCardSub}>
                      por {relatorioProduto.unidadeMedida === "un." ? "unidade" : "caixa/fardo"}
                    </p>
                  </div>

                  <div className={styles.relatorioCard} data-cor="purple">
                    <div className={styles.relatorioCardIcone}>
                      <PercentIcon size={18} weight="fill" />
                    </div>
                    <p className={styles.relatorioCardLabel}>Margem de lucro</p>
                    <strong className={styles.relatorioCardValor}>
                      {relatorioProduto.margemPercentual != null
                        ? `${relatorioProduto.margemPercentual.toFixed(1)}%`
                        : "0.0%"}
                    </strong>
                    <p className={styles.relatorioCardSub}>
                      Custo: {formatarMoeda(relatorioProduto.precoCompra || 0)} · Lucro: {formatarMoeda(relatorioProduto.lucroTotal || 0)}
                    </p>
                    {relatorioProduto.margemPercentual > 0 && (
                      <div className={styles.positivacaoBar}>
                        <div
                          className={styles.positivacaoBarFill}
                          style={{
                            width: `${Math.min(Math.max(relatorioProduto.margemPercentual, 0), 100)}%`,
                            background: "linear-gradient(90deg, var(--purple), #b197fc)",
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className={styles.relatorioCard} data-cor="orange">
                    <div className={styles.relatorioCardIcone}>
                      <ShoppingCartIcon size={18} weight="fill" />
                    </div>
                    <p className={styles.relatorioCardLabel}>
                      Média por pedido
                    </p>
                    <strong className={styles.relatorioCardValor}>
                      {Number(relatorioProduto.mediaProdutoPorPedido || 0).toFixed(1)}{" "}
                      {relatorioProduto.unidadeMedida || "cx."}
                    </strong>
                  </div>

                  <div className={styles.relatorioCard} data-cor="green">
                    <div className={styles.relatorioCardIcone}>
                      <ChartLineUpIcon size={18} weight="fill" />
                    </div>
                    <p className={styles.relatorioCardLabel}>% positivação</p>
                    <strong className={styles.relatorioCardValor}>
                      {relatorioProduto.porcentualPositivado?.toFixed(1)}%
                    </strong>
                    <p className={styles.relatorioCardSub}>
                      {relatorioProduto.pedidoPositavo} de {relatorioProduto.totalPedidos} pedidos
                    </p>
                    <div className={styles.positivacaoBar}>
                      <div
                        className={styles.positivacaoBarFill}
                        style={{
                          width: `${Math.min(relatorioProduto.porcentualPositivado || 0, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </main>

      <ModalPedidosDesconto
        aberto={modalDescontosAberto}
        aoFechar={() => setModalDescontosAberto(false)}
        setorInicial={setor}
        dataInicio={dataInicio}
        dataFim={dataFim}
        vendedorInicial={vendedorExterno}
      />

      <Rodape />
    </div>
  );
}

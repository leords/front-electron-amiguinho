import { useEffect, useState, useCallback } from "react";
import Cabecalho from "../../componentes/Cabecalho/index.jsx";
import Rodape from "../../componentes/Rodape/index.jsx";
import styles from "./styles.module.css";
import { dataFormatadaCalendario } from "../../utils/data.js";
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
} from "@phosphor-icons/react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Importando as funções de API do projeto 
import { TotalVendasPeriodo } from "../../operadores/API/pedido/totalVendasPeriodo.js";
import { TicketMedio }        from "../../operadores/API/pedido/ticketMedio.js";
import { IntervaloTemporal }  from "../../operadores/API/pedido/intervaloTemporal.js";
import { TopProdutos }        from "../../operadores/API/pedido/topProdutos.js";
import { MixProdutos }        from "../../operadores/API/pedido/mixProdutos.js";
import { QuantidadePedidos }  from "../../operadores/API/pedido/quantidadePedidos.js";
import { RelatorioProduto }   from "../../operadores/API/produto/relatorioProduto.js";

const SETORES = ["balcao", "delivery", "externo"];
const medalCores = ["#ff8c00", "#adb5bd", "#cd7f32"];

// Tooltips 
function TooltipVendas({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      <p className={styles.tooltipValor}>{formatarMoeda(payload[0]?.value ?? 0)}</p>
      <p className={styles.tooltipSub}>{payload[1]?.value ?? 0} pedidos</p>
    </div>
  );
}

// KPI Card
function KpiCard({ icone: Icone, cor, label, valor, sub, carregando }) {
  return (
    <div className={styles.kpiCard}>
      <div className={styles.kpiIcone} data-cor={cor}>
        <Icone size={20} weight="fill" />
      </div>
      <div className={styles.kpiInfo}>
        <p className={styles.kpiLabel}>{label}</p>
        {carregando
          ? <div className={styles.kpiSkeleton} />
          : <strong className={styles.kpiValor}>{valor}</strong>
        }
        <p className={styles.kpiSub}>{sub}</p>
      </div>
    </div>
  );
}

// Componente principal
export default function Dashboard() {
  const [setor, setSetor]           = useState("balcao");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim]       = useState("");
  const [carregando, setCarregando] = useState(false);

  // dados principais
  const [totalVendas, setTotalVendas]               = useState(null);
  const [ticketMedio, setTicketMedio]               = useState(null);
  const [intervaloTemporal, setIntervaloTemporal]   = useState([]);
  const [topProdutos, setTopProdutos]               = useState([]);
  const [mixProdutos, setMixProdutos]               = useState({});
  const [pedidosPorVendedor, setPedidosPorVendedor] = useState([]);

  // relatório de produto
  const [produtoSelecionado, setProdutoSelecionado]     = useState("");
  const [relatorioProduto, setRelatorioProduto]         = useState(null);
  const [carregandoProduto, setCarregandoProduto]       = useState(false);
  const [expandirRelatorio, setExpandirRelatorio]       = useState(false);

  // Inicializa datas com o primeiro dia do mês até hoje
  useEffect(() => {
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    setDataInicio(dataFormatadaCalendario(primeiroDia));
    setDataFim(dataFormatadaCalendario());
  }, []);

  // Busca todos os dados do dashboard
  const buscarDados = useCallback(async () => {
    if (!dataInicio || !dataFim) return;
    setCarregando(true);

    const params = { dataInicio, dataFim };

    try {
      const [tv, tm, it, tp, mp, pv] = await Promise.all([
        TotalVendasPeriodo(setor, params),
        TicketMedio(setor, params),
        IntervaloTemporal(setor, params),
        TopProdutos(setor, {...params, quantidade: 6}),
        MixProdutos(setor, params),
        QuantidadePedidos(setor, params),
      ]);

      setTotalVendas(tv);
      setTicketMedio(tm);
      setIntervaloTemporal(it);
      setTopProdutos(tp);
      setMixProdutos(mp);
      setPedidosPorVendedor(pv);

      // Limpa o relatório de produto ao trocar filtros
      setProdutoSelecionado("");
      setRelatorioProduto(null);
      setExpandirRelatorio(false);
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
      alert("Erro ao carregar dados. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }, [setor, dataInicio, dataFim]);

  useEffect(() => {
    buscarDados();
  }, [buscarDados]);

  // Busca relatório do produto selecionado
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
      const resultado = await RelatorioProduto(setor, produtoId, params);
      setRelatorioProduto(resultado);
    } catch (err) {
      console.error("Erro ao buscar relatório do produto:", err);
      alert("Erro ao buscar relatório do produto.");
    } finally {
      setCarregandoProduto(false);
    }
  };

  // Mix: pegar os 8 pares mais frequentes
  const mixPares = Object.entries(mixProdutos)
    .flatMap(([prod, assoc]) =>
      Object.entries(assoc).map(([parceiro, freq]) => ({ par: `${prod} + ${parceiro}`, freq }))
    )
    .sort((a, b) => b.freq - a.freq)
    .slice(0, 8);

  // Nome do produto selecionado para exibir no cabeçalho
  const nomeProdutoSelecionado = topProdutos.find(
    (p) => String(p.produtoId) === String(produtoSelecionado)
  )?.nomeProduto ?? "";

  return (
    <div className={styles.container}>
      <Cabecalho />

      <main className={styles.main}>

        {/*  Cabeçalho  */}
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
              <SpinnerIcon size={14} weight="bold" className={styles.spinnerIcon} />
              Atualizando...
            </div>
          )}
        </div>

        {/*  Filtros  */}
        <div className={styles.painelFiltros}>
          <div className={styles.filtrosHeader}>
            <FunnelIcon size={14} weight="bold" className={styles.filtroIcone} />
            <span>Filtros</span>
          </div>
          <div className={styles.filtrosGrid}>
            {/* Setor */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>Setor</label>
              <div className={styles.setorTabs}>
                {SETORES.map((s) => (
                  <button
                    key={s}
                    className={`${styles.setorTab} ${setor === s ? styles.setorTabAtivo : ""}`}
                    onClick={() => setSetor(s)}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {/* Data Inicial */}
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
            {/* Data Final */}
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
        <div className={styles.kpiGrid}>
          <KpiCard
            icone={TrendUpIcon} cor="orange"
            label="Total de vendas"
            valor={formatarMoeda(totalVendas?.totalVendas ?? 0)}
            sub={`${totalVendas?.quantidadePedidos ?? 0} pedidos no período`}
            carregando={carregando}
          />
          <KpiCard
            icone={CurrencyDollarIcon} cor="green"
            label="Ticket médio"
            valor={formatarMoeda(ticketMedio?.pedidoMedio ?? 0)}
            sub={`base: ${ticketMedio?.quantidadePedidos ?? 0} pedidos`}
            carregando={carregando}
          />
          <KpiCard
            icone={ShoppingCartIcon} cor="blue"
            label="Total de pedidos"
            valor={totalVendas?.quantidadePedidos ?? 0}
            sub="pedidos no período selecionado"
            carregando={carregando}
          />
          <KpiCard
            icone={UsersIcon} cor="purple"
            label="Vendedores ativos"
            valor={pedidosPorVendedor.length}
            sub={`${setor} · no período`}
            carregando={carregando}
          />
        </div>

        {/* Gráfico de vendas e Pedidos por vendedor */}
        <div className={styles.linhaGraficos}>

          <div className={`${styles.card} ${styles.cardGrande}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <TrendUpIcon size={18} weight="bold" className={styles.cardHeaderIcon} />
                <h2>Vendas por horário</h2>
              </div>
              <span className={styles.cardBadge}>{intervaloTemporal.length} faixas</span>
            </div>

            {carregando ? <div className={styles.graficoSkeleton} /> :
             intervaloTemporal.length === 0 ? <div className={styles.vazioGrafico}>Sem dados no período</div> : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={intervaloTemporal} margin={{ top: 6, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradVendas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ff8c00" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ff8c00" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" vertical={false} />
                  <XAxis dataKey="horario" tick={{ fontSize: 12, fill: "#868e96" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#868e96" }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip content={<TooltipVendas />} />
                  <Area type="monotone" dataKey="totalVendido"      stroke="#ff8c00" strokeWidth={2.5} fill="url(#gradVendas)" />
                  <Area type="monotone" dataKey="quantidadePedidos" stroke="#adb5bd" strokeWidth={1.5} fill="none" strokeDasharray="4 3" />
                </AreaChart>
              </ResponsiveContainer>
            )}

            <div className={styles.legendaGrafico}>
              <span className={styles.legendaItem} data-cor="orange">— Faturamento</span>
              <span className={styles.legendaItem} data-cor="gray">- - Pedidos</span>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <UsersIcon size={18} weight="bold" className={styles.cardHeaderIcon} />
                <h2>Pedidos por vendedor</h2>
              </div>
            </div>

            {carregando ? <div className={styles.graficoSkeleton} /> :
             pedidosPorVendedor.length === 0 ? <div className={styles.vazioGrafico}>Sem dados no período</div> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={pedidosPorVendedor} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#868e96" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="vendedor" type="category" tick={{ fontSize: 12, fill: "#495057", fontWeight: 600 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip formatter={(v) => [`${v} pedidos`, "Qtd"]} />
                  <Bar dataKey="quantidadePedidos" fill="#ff8c00" radius={[0, 6, 6, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

        </div>

        {/* Top produtos e Mix */}
        <div className={styles.linhaInferior}>

          {/* Top produtos */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <MedalIcon size={18} weight="bold" className={styles.cardHeaderIcon} />
                <h2>Top produtos</h2>
              </div>
              <span className={styles.cardBadge}>{topProdutos.length} itens</span>
            </div>

            {carregando ? (
              <><div className={styles.rowSkeleton} /><div className={styles.rowSkeleton} /><div className={styles.rowSkeleton} /></>
            ) : topProdutos.length === 0 ? (
              <div className={styles.vazioGrafico}>Sem dados no período</div>
            ) : (
              <div className={styles.topProdutoLista}>
                {topProdutos.map((p, i) => {
                  const pct = Math.round((p.quantidadeVendida / topProdutos[0].quantidadeVendida) * 100);
                  return (
                    <div key={p.produtoId} className={styles.topProdutoItem}>
                      <div className={styles.topProdutoPos} style={{ color: medalCores[i] ?? "#adb5bd" }}>
                        {i < 3
                          ? <MedalIcon size={16} weight="fill" />
                          : <span className={styles.topProdutoNum}>{i + 1}</span>
                        }
                      </div>
                      <div className={styles.topProdutoInfo}>
                        <div className={styles.topProdutoNome}>{p.nomeProduto}</div>
                        <div className={styles.topProdutoBar}>
                          <div className={styles.topProdutoBarFill} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className={styles.topProdutoMetrics}>
                        <strong>{p.quantidadeVendida} un.</strong>
                        <span>{formatarMoeda(p.valorTotalVendido)}</span>
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
                <ArrowsLeftRightIcon size={18} weight="bold" className={styles.cardHeaderIcon} />
                <h2>Mix de produtos</h2>
              </div>
              <span className={styles.cardBadge}>combinações</span>
            </div>
            <p className={styles.mixSubtitulo}>Produtos mais comprados juntos</p>

            {carregando ? (
              <><div className={styles.rowSkeleton} /><div className={styles.rowSkeleton} /><div className={styles.rowSkeleton} /></>
            ) : mixPares.length === 0 ? (
              <div className={styles.vazioGrafico}>Sem dados no período</div>
            ) : (
              <div className={styles.mixLista}>
                {mixPares.map((par, i) => (
                  <div key={i} className={styles.mixItem}>
                    <div className={styles.mixPar}>
                      {par.par.split(" + ").map((nome, j) => (
                        <span key={j} className={styles.mixTag}>{nome}</span>
                      ))}
                    </div>
                    <div className={styles.mixFreq}>
                      <div className={styles.mixFreqBar} style={{ width: `${Math.min(par.freq * 20, 100)}%` }} />
                      <span>{par.freq}×</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ── Relatório de produto ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderTitle}>
              <MagnifyingGlassIcon size={18} weight="bold" className={styles.cardHeaderIcon} />
              <h2>Relatório de produto</h2>
            </div>
            {nomeProdutoSelecionado && (
              <span className={styles.cardBadgeProduto}>{nomeProdutoSelecionado}</span>
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
                  {[...Array(6)].map((_, i) => <div key={i} className={styles.relatorioSkeleton} />)}
                </div>
              ) : relatorioProduto ? (
                <div className={styles.relatorioGrid}>

                  <div className={styles.relatorioCard} data-cor="orange">
                    <div className={styles.relatorioCardIcone}>
                      <PackageIcon size={18} weight="fill" />
                    </div>
                    <p className={styles.relatorioCardLabel}>Quantidade vendida</p>
                    <strong className={styles.relatorioCardValor}>{relatorioProduto.quantidade} un.</strong>
                  </div>

                  <div className={styles.relatorioCard} data-cor="green">
                    <div className={styles.relatorioCardIcone}>
                      <TrendUpIcon size={18} weight="fill" />
                    </div>
                    <p className={styles.relatorioCardLabel}>Faturamento total</p>
                    <strong className={styles.relatorioCardValor}>{formatarMoeda(relatorioProduto.faturamentoTotal)}</strong>
                  </div>

                  <div className={styles.relatorioCard} data-cor="blue">
                    <div className={styles.relatorioCardIcone}>
                      <CurrencyDollarIcon size={18} weight="fill" />
                    </div>
                    <p className={styles.relatorioCardLabel}>Preço médio</p>
                    <strong className={styles.relatorioCardValor}>{formatarMoeda(relatorioProduto.precoMedio)}</strong>
                  </div>

                  <div className={styles.relatorioCard} data-cor="purple">
                    <div className={styles.relatorioCardIcone}>
                      <ShoppingCartIcon size={18} weight="fill" />
                    </div>
                    <p className={styles.relatorioCardLabel}>Média por pedido</p>
                    <strong className={styles.relatorioCardValor}>{relatorioProduto.mediaProdutoPorPedido.toFixed(1)} un.</strong>
                  </div>

                  <div className={styles.relatorioCard} data-cor="orange">
                    <div className={styles.relatorioCardIcone}>
                      <ChartLineUpIcon size={18} weight="fill" />
                    </div>
                    <p className={styles.relatorioCardLabel}>Pedidos positivados</p>
                    <strong className={styles.relatorioCardValor}>
                      {relatorioProduto.pedidoPositavo} <span className={styles.relatorioCardSub}>de {relatorioProduto.totalPedidos}</span>
                    </strong>
                  </div>

                  <div className={styles.relatorioCard} data-cor="green">
                    <div className={styles.relatorioCardIcone}>
                      <PercentIcon size={18} weight="fill" />
                    </div>
                    <p className={styles.relatorioCardLabel}>% positivação</p>
                    <strong className={styles.relatorioCardValor}>
                      {relatorioProduto.porcentualPositivado.toFixed(1)}%
                    </strong>
                    <div className={styles.positivacaoBar}>
                      <div
                        className={styles.positivacaoBarFill}
                        style={{ width: `${Math.min(relatorioProduto.porcentualPositivado, 100)}%` }}
                      />
                    </div>
                  </div>

                </div>
              ) : null}
            </div>
          )}
        </div>

      </main>

      <Rodape />
    </div>
  );
}
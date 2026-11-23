import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import Spinner from "../../componentes/Spinner";
import { usarToast } from "../../componentes/Context/toastContext";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";
import { AlertaRadix } from "../../componentes/ui/alerta/alerta";
import styles from "./styles.module.css";
import {
  ArrowLeft,
  ArrowClockwise,
  Printer,
  MagnifyingGlass,
  CheckCircle,
  Clock,
  XCircle,
  Funnel,
  User,
  Calendar,
  CreditCard,
  Bank,
  Money,
  Receipt,
  Tag,
  X,
  ArrowCounterClockwise,
  Wallet,
  Check,
  Plus,
} from "@phosphor-icons/react";
import { formatarMoeda } from "../../utils/formartarMoeda";
import { lerPagamentos } from "../../operadores/API/pagamento/lerPagamentos";
import { baixarPagamento } from "../../operadores/API/pagamento/baixarPagamento";
import { LerUsuario } from "../../operadores/API/usuario/lerUsuario";
import { LerClienteExterno } from "../../operadores/API/cliente/lerClienteExterno";
import { lerFormasPagamento } from "../../operadores/API/formaPagamento/lerFormasPagamento";
import { gerarRelatorioPagamentosHTML } from "../../utils/gerarRelatorioPagamentos";
import { gerarReciboPagamentoHTML } from "../../utils/gerarReciboPagamento";
import { dataFormatadaCalendario, extrairDataYMD } from "../../utils/data";
import ModalCriarPagamento from "../../componentes/ModalCriarPagamento";

const FORMAS_PADRAO = [
  { id: 1, nome: "Dinheiro" },
  { id: 2, nome: "PIX" },
  { id: 3, nome: "Cartão de Crédito" },
  { id: 4, nome: "Cartão de Débito" },
  { id: 5, nome: "Cheque" },
  { id: 6, nome: "Vale / A Prazo" },
];

/**
 * Normalização textual sem acentos e em maiúsculas
 */
const normalizarTexto = (txt) => {
  if (!txt) return "";
  return String(txt)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

/**
 * Normaliza dias da semana para bater com SEGUNDA, TERCA, etc.
 */
const normalizarDiaSemana = (dia) => {
  if (!dia) return "";
  const d = normalizarTexto(dia);
  if (d.includes("SEG")) return "SEGUNDA";
  if (d.includes("TER")) return "TERCA";
  if (d.includes("QUA")) return "QUARTA";
  if (d.includes("QUI")) return "QUINTA";
  if (d.includes("SEX")) return "SEXTA";
  if (d.includes("SAB")) return "SABADO";
  if (d.includes("DOM")) return "DOMINGO";
  return d;
};

/**
 * Helper para arredondar valores monetários com precisão de 2 casas
 */
const arredondarMoeda = (valor) => {
  const num = Number(valor);
  if (isNaN(num)) return 0;
  return Math.round(num * 100) / 100;
};

/**
 * Helper para conversão numérica segura
 */
const parseValorMonetario = (val) => {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const limpo = String(val).replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(limpo);
  return isNaN(num) ? 0 : num;
};

/**
 * Categoriza formas de pagamento (dinheiro, pix, cartao, cheque, vale)
 */
const categorizarFormaPagamento = (nome) => {
  if (!nome) return "dinheiro";
  const n = normalizarTexto(nome);

  if (n.includes("PIX")) return "pix";
  if (
    n.includes("CART") ||
    n.includes("CREDITO") ||
    n.includes("DEBITO") ||
    n.includes("MAQUINETA")
  ) {
    return "cartao";
  }
  if (n.includes("CHEQUE")) return "cheque";
  if (
    n.includes("VALE") ||
    n.includes("PRAZO") ||
    n.includes("PROMISSORIA") ||
    n.includes("FIADO")
  ) {
    return "vale";
  }
  if (
    n.includes("DINHEIRO") ||
    n.includes("VISTA") ||
    n.includes("ESPECIE") ||
    n.includes("CASH")
  ) {
    return "dinheiro";
  }

  return "dinheiro";
};

/**
 * Resolução do nome da forma de pagamento
 */
const resolverNomeFormaPagamento = (p, listaFormas = []) => {
  if (!p) return "";
  if (p.formaPagamento?.nome) return p.formaPagamento.nome;
  if (p.formaNome) return p.formaNome;
  if (p.forma) return p.forma;

  const id = p.formaPagamentoId || p.formaPagamento?.id || p.formaId;
  if (id && Array.isArray(listaFormas)) {
    const encontrada = listaFormas.find((f) => Number(f.id) === Number(id));
    if (encontrada?.nome) return encontrada.nome;
  }
  return "";
};

export default function Pagamentos() {
  const navegar = useNavigate();
  const { mensagem, setMensagem } = usarToast();

  // ── Estados de Dados ──
  const [pagamentos, setPagamentos] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [formasPagamento, setFormasPagamento] = useState(FORMAS_PADRAO);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [processandoAcao, setProcessandoAcao] = useState(false);
  const [modalCriarPagamentoAberto, setModalCriarPagamentoAberto] = useState(false);

  // ── Filtros da Rota ──
  const [filtroVendedor, setFiltroVendedor] = useState("TODOS");
  const [filtroAtendimento, setFiltroAtendimento] = useState("TODOS");
  const [dataInicio, setDataInicio] = useState(() => dataFormatadaCalendario());
  const [dataFim, setDataFim] = useState(() => dataFormatadaCalendario());
  const [filtroStatus, setFiltroStatus] = useState("coletado"); // 'coletado' | 'baixado' | 'cancelado'
  const [filtroForma, setFiltroForma] = useState("TODAS"); // 'TODAS' | 'dinheiro' | 'pix' | 'cartao' | 'cheque' | 'vale'
  const [filtroOrigem, setFiltroOrigem] = useState("todos"); // 'todos' | 'com_pendencia' | 'avulso'
  const [termoBusca, setTermoBusca] = useState("");

  // Mapa de Clientes indexados por ID
  const clientesMap = useMemo(() => {
    const mapa = new Map();
    clientes.forEach((c) => {
      if (c.id) mapa.set(Number(c.id), c);
    });
    return mapa;
  }, [clientes]);

  // 1. Carregar dados iniciais (vendedores, clientes, formas)
  useEffect(() => {
    const carregarIniciais = async () => {
      try {
        const [usuarios, listaClientes, formas] = await Promise.all([
          LerUsuario().catch(() => []),
          LerClienteExterno().catch(() => []),
          lerFormasPagamento().catch(() => FORMAS_PADRAO),
        ]);

        if (Array.isArray(usuarios)) setVendedores(usuarios);
        if (Array.isArray(listaClientes)) setClientes(listaClientes);
        if (Array.isArray(formas) && formas.length > 0)
          setFormasPagamento(formas);
      } catch (err) {
        console.warn("Erro ao carregar dados auxiliares:", err);
      }
    };

    carregarIniciais();
  }, []);

  // 2. Carregar Pagamentos
  const carregarPagamentos = useCallback(
    async (mostrarSpinner = false) => {
      if (mostrarSpinner) setCarregando(true);
      setAtualizando(true);

      try {
        const lista = await lerPagamentos();
        setPagamentos(Array.isArray(lista) ? lista : []);
      } catch (error) {
        console.error("Erro ao carregar pagamentos:", error);
        setMensagem(error.message || "Erro ao consultar pagamentos.");
        setPagamentos([]);
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [setMensagem]
  );

  useEffect(() => {
    carregarPagamentos(true);
  }, [carregarPagamentos]);

  // 3. Atalhos rápidos de data
  const aplicarAtalhoData = (tipo) => {
    const hoje = new Date();

    if (tipo === "hoje") {
      const dataStr = dataFormatadaCalendario(hoje);
      setDataInicio(dataStr);
      setDataFim(dataStr);
    } else if (tipo === "semana") {
      const diaSemana = hoje.getDay(); // 0 domingo, 1 segunda...
      const diffSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
      const segunda = new Date(hoje);
      segunda.setDate(hoje.getDate() + diffSegunda);
      setDataInicio(dataFormatadaCalendario(segunda));
      setDataFim(dataFormatadaCalendario(hoje));
    } else if (tipo === "mes") {
      const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      setDataInicio(dataFormatadaCalendario(primeiroDia));
      setDataFim(dataFormatadaCalendario(hoje));
    } else if (tipo === "limpar") {
      setDataInicio("");
      setDataFim("");
    }
  };

  const limparTodosFiltros = () => {
    const hojePadrao = dataFormatadaCalendario();
    setFiltroVendedor("TODOS");
    setFiltroAtendimento("TODOS");
    setDataInicio(hojePadrao);
    setDataFim(hojePadrao);
    setFiltroStatus("coletado");
    setFiltroForma("TODAS");
    setFiltroOrigem("todos");
    setTermoBusca("");
  };

  // 4. Filtragem dinâmica da Rota (sem o filtro de status) para contadores e listagem
  const pagamentosFiltradosSemStatus = useMemo(() => {
    const vendFiltro = normalizarTexto(filtroVendedor);
    const atendFiltro = normalizarDiaSemana(filtroAtendimento);
    const busca = termoBusca.toLowerCase().trim();

    return pagamentos.filter((pg) => {
      // ── Forma de Pagamento ──
      const nomeForma = resolverNomeFormaPagamento(pg, formasPagamento);
      const cat = categorizarFormaPagamento(nomeForma);
      if (filtroForma !== "TODAS" && cat !== filtroForma) return false;

      // ── Origem / Vínculo com Pendência ──
      if (filtroOrigem === "com_pendencia" && !pg.pendenciaId) return false;
      if (filtroOrigem === "avulso" && pg.pendenciaId) return false;

      // ── Período de Datas ──
      const dataPg = pg.data || pg.createdAt;
      if (dataPg) {
        const diaISO =
          extrairDataYMD(dataPg) ||
          new Date(dataPg).toISOString().split("T")[0];
        if (dataInicio && diaISO < dataInicio) return false;
        if (dataFim && diaISO > dataFim) return false;
      }

      // ── Vendedor e Dia de Atendimento da Rota ──
      const clienteId = Number(
        pg.pendencia?.clienteId || pg.clienteId || pg.cliente?.id
      );
      const clienteObj =
        pg.pendencia?.cliente ||
        (clienteId && clientesMap.get(clienteId)) ||
        pg.cliente;

      const rawVendedor =
        clienteObj?.vendedor ||
        pg.pendencia?.vendedor ||
        pg.vendedor ||
        "";
      const clienteVendedor = normalizarTexto(rawVendedor);

      if (vendFiltro !== "TODOS") {
        const bateVendedor =
          clienteVendedor === vendFiltro ||
          clienteVendedor.includes(vendFiltro) ||
          vendFiltro.includes(clienteVendedor);
        if (!bateVendedor) return false;
      }

      const rawAtendimento =
        clienteObj?.atendimento ||
        pg.pendencia?.atendimento ||
        pg.atendimento ||
        "";
      const clienteAtendimento = normalizarDiaSemana(rawAtendimento);

      if (atendFiltro !== "TODOS") {
        if (clienteAtendimento && clienteAtendimento !== atendFiltro) {
          return false;
        }
      }

      // ── Busca Textual ──
      if (busca) {
        const idStr = String(pg.id || "");
        const pendStr = String(pg.pendenciaId || "");
        const clienteNome = (
          clienteObj?.nome ||
          clienteObj?.nomeFantasia ||
          pg.cliente?.nome ||
          pg.cliente?.nomeFantasia ||
          pg.nomeCliente ||
          ""
        ).toLowerCase();
        const obs = String(pg.observacao || "").toLowerCase();
        const doc = String(clienteObj?.cpf || clienteObj?.cnpj || "");

        const bateBusca =
          idStr.includes(busca) ||
          pendStr.includes(busca) ||
          clienteNome.includes(busca) ||
          obs.includes(busca) ||
          doc.includes(busca);

        if (!bateBusca) return false;
      }

      return true;
    });
  }, [
    pagamentos,
    filtroForma,
    filtroOrigem,
    dataInicio,
    dataFim,
    filtroVendedor,
    filtroAtendimento,
    termoBusca,
    formasPagamento,
    clientesMap,
  ]);

  // Contagem para as abas de status respeitando os filtros ativos da rota
  const contadoresStatus = useMemo(() => {
    const c = { coletado: 0, baixado: 0, cancelado: 0 };
    pagamentosFiltradosSemStatus.forEach((p) => {
      const st = String(p.status || "coletado").toLowerCase().trim();
      if (c[st] !== undefined) c[st]++;
    });
    return c;
  }, [pagamentosFiltradosSemStatus]);

  // Lista final filtrada pelo status selecionado na aba ativa
  const pagamentosFiltrados = useMemo(() => {
    return pagamentosFiltradosSemStatus.filter((pg) => {
      const st = String(pg.status || "coletado").toLowerCase().trim();
      if (filtroStatus !== "todos" && st !== filtroStatus) return false;
      return true;
    });
  }, [pagamentosFiltradosSemStatus, filtroStatus]);

  // 5. Cálculo dos Totais e Resumos
  const totais = useMemo(() => {
    let totalGeral = 0;
    let totalConfirmado = 0;
    let totalColetado = 0;
    let totalCancelado = 0;

    let dinheiro = 0;
    let pix = 0;
    let cartao = 0;
    let cheque = 0;
    let vale = 0;

    pagamentosFiltrados.forEach((pg) => {
      const v = parseValorMonetario(pg.valor);
      const st = String(pg.status || "").toLowerCase().trim();
      const nomeForma = resolverNomeFormaPagamento(pg, formasPagamento);
      const cat = categorizarFormaPagamento(nomeForma);

      totalGeral += v;

      if (st === "baixado") {
        totalConfirmado += v;
      } else if (st === "coletado") {
        totalColetado += v;
      } else if (st === "cancelado") {
        totalCancelado += v;
      }

      // Subtotais por forma (considerando pagamentos ativos: baixados ou coletados)
      if (st !== "cancelado") {
        if (cat === "dinheiro") dinheiro += v;
        else if (cat === "pix") pix += v;
        else if (cat === "cartao") cartao += v;
        else if (cat === "cheque") cheque += v;
        else if (cat === "vale") vale += v;
      }
    });

    return {
      totalGeral: arredondarMoeda(totalGeral),
      totalConfirmado: arredondarMoeda(totalConfirmado),
      totalColetado: arredondarMoeda(totalColetado),
      totalCancelado: arredondarMoeda(totalCancelado),
      dinheiro: arredondarMoeda(dinheiro),
      pix: arredondarMoeda(pix),
      cartao: arredondarMoeda(cartao),
      cheque: arredondarMoeda(cheque),
      vale: arredondarMoeda(vale),
    };
  }, [pagamentosFiltrados, formasPagamento]);

  // 6. Ações Rápidas de Alteração de Status
  const tratarAcaoRapida = async (pagamentoId, novoStatus) => {
    if (!pagamentoId || processandoAcao) return;

    try {
      setProcessandoAcao(true);
      await baixarPagamento(pagamentoId, { status: novoStatus });

      if (novoStatus === "baixado") {
        setMensagem(`Pagamento #${pagamentoId} confirmado como BAIXADO!`);
      } else if (novoStatus === "coletado") {
        setMensagem(
          `Baixa cancelada! Pagamento #${pagamentoId} retornou para COLETADO.`
        );
      } else {
        const pgAlvo = pagamentos.find(
          (p) => Number(p.id) === Number(pagamentoId)
        );
        if (pgAlvo?.pendenciaId) {
          setMensagem(
            `Pagamento #${pagamentoId} cancelado e baixa da pendência #${pgAlvo.pendenciaId} estornada com sucesso!`
          );
        } else {
          setMensagem(`Pagamento #${pagamentoId} cancelado com sucesso.`);
        }
      }

      await carregarPagamentos(false);
    } catch (error) {
      console.error("Erro na ação do pagamento:", error);
      setMensagem(error.message || "Erro ao atualizar pagamento.");
    } finally {
      setProcessandoAcao(false);
    }
  };

  // 7. Impressão Térmica 80mm do Relatório Filtrado
  const tratarImprimirRelatorio = async () => {
    try {
      let periodoStr = "Geral";
      if (dataInicio && dataFim) periodoStr = `${dataInicio} até ${dataFim}`;
      else if (dataInicio) periodoStr = `A partir de ${dataInicio}`;
      else if (dataFim) periodoStr = `Até ${dataFim}`;

      const html = gerarRelatorioPagamentosHTML({
        vendedor: filtroVendedor,
        atendimento: filtroAtendimento,
        periodo: periodoStr,
        statusFiltro: filtroStatus,
        formaFiltro: filtroForma,
        totais,
        pagamentos: pagamentosFiltrados,
      });

      if (
        window.IMPRESSORA &&
        typeof window.IMPRESSORA.imprimir === "function"
      ) {
        await window.IMPRESSORA.imprimir(html);
        setMensagem("Relatório enviado para a impressora com sucesso!");
      } else {
        const janelaPrint = window.open("", "_blank");
        if (janelaPrint) {
          janelaPrint.document.write(html);
          janelaPrint.document.close();
          janelaPrint.focus();
          janelaPrint.print();
        } else {
          setMensagem("Impressão indisponível no navegador.");
        }
      }
    } catch (error) {
      console.error("Erro ao imprimir relatório de pagamentos:", error);
      setMensagem("Erro ao enviar para a impressora.");
    }
  };

  // 8. Impressão Térmica de Recibo de Pagamento Individual
  const tratarImprimirRecibo = async (pg) => {
    if (!pg) return;

    try {
      const formaNome = resolverNomeFormaPagamento(pg, formasPagamento);
      const clienteId = Number(
        pg.pendencia?.clienteId || pg.clienteId || pg.cliente?.id
      );
      const clienteObj =
        pg.pendencia?.cliente ||
        (clienteId && clientesMap.get(clienteId)) ||
        pg.cliente ||
        {};

      const html = gerarReciboPagamentoHTML({
        id: pg.id,
        valor: pg.valor,
        formaNome,
        data: pg.data || pg.createdAt,
        cliente: clienteObj,
        nomeCliente:
          clienteObj.nome ||
          clienteObj.nomeFantasia ||
          pg.nomeCliente ||
          pg.cliente?.nome,
        pendenciaId: pg.pendenciaId,
        pedidoId: pg.pedidoId || pg.pendencia?.pedidoId,
        vendedor:
          clienteObj.vendedor ||
          pg.pendencia?.vendedor ||
          pg.vendedor,
        usuarioNome: pg.usuario?.nome || pg.criadoPor,
        observacao: pg.observacao,
      });

      if (
        window.IMPRESSORA &&
        typeof window.IMPRESSORA.imprimir === "function"
      ) {
        await window.IMPRESSORA.imprimir(html);
        setMensagem(`Recibo do pagamento #${pg.id} impresso com sucesso!`);
      } else {
        const janelaPrint = window.open("", "_blank");
        if (janelaPrint) {
          janelaPrint.document.write(html);
          janelaPrint.document.close();
          janelaPrint.focus();
          janelaPrint.print();
          setMensagem(`Recibo do pagamento #${pg.id} aberto para impressão!`);
        } else {
          setMensagem("Impressão indisponível no navegador.");
        }
      }
    } catch (err) {
      console.error("Erro ao imprimir recibo de pagamento:", err);
      setMensagem("Erro ao gerar recibo de pagamento.");
    }
  };

  return (  
    <div className={styles.container}>
      <Cabecalho />

      <main className={styles.principal}>
        {/* ── CABEÇALHO DA PÁGINA ── */}
        <div className={styles.cabecalhoPage}>
          <div className={styles.tituloSection}>
            <button
              className={styles.botaoVoltar}
              onClick={() => navegar(-1)}
              title="Voltar ao Menu"
            >
              <ArrowLeft size={20} weight="bold" />
            </button>
            <div className={styles.iconeWrapper}>
              <CreditCard size={26} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>
                Controle Financeiro de Rotas
              </p>
              <h1 className={styles.pageTitulo}>Pagamentos Realizados</h1>
            </div>
          </div>

          <div className={styles.cabecalhoAcoes}>
            <button
              className={styles.btnCriarPagamento}
              onClick={() => setModalCriarPagamentoAberto(true)}
              title="Criar novo pagamento a partir de pendência em aberto"
            >
              <Plus size={16} weight="bold" />
              <span>Criar Pagamento</span>
            </button>

            <button
              className={styles.btnAtualizar}
              onClick={() => carregarPagamentos(false)}
              disabled={atualizando || carregando}
              title="Atualizar lista"
            >
              <ArrowClockwise
                size={16}
                weight="bold"
                className={atualizando ? styles.btnAtualizarGirando : ""}
              />
              <span>{atualizando ? "Atualizando..." : "Atualizar"}</span>
            </button>

            <button
              className={styles.btnImprimir}
              onClick={tratarImprimirRelatorio}
              disabled={pagamentosFiltrados.length === 0}
              title="Imprimir relatório térmico (80mm)"
            >
              <Printer size={16} weight="bold" />
              <span>Imprimir Relatório</span>
            </button>
          </div>
        </div>

        {/* ── CARDS DE RESUMO (TOPO) ── */}
        <section className={styles.gradeResumos}>
          {/* Card Total Geral */}
          <div className={`${styles.cardResumo} ${styles.cardGeral}`}>
            <div className={styles.cardIconeWrapper}>
              <Wallet size={24} weight="bold" />
            </div>
            <div className={styles.cardInfo}>
              <span className={styles.cardLabel}>Total Filtrado</span>
              <p className={styles.cardValor}>
                {formatarMoeda(totais.totalGeral)}
              </p>
              <span className={styles.cardSub}>
                {pagamentosFiltrados.length} pagamento(s) localizado(s)
              </span>
            </div>
          </div>

          {/* Card Confirmados */}
          <div className={`${styles.cardResumo} ${styles.cardConfirmado}`}>
            <div className={styles.cardIconeWrapper}>
              <CheckCircle size={24} weight="bold" />
            </div>
            <div className={styles.cardInfo}>
              <span className={styles.cardLabel}>Confirmados (Baixados)</span>
              <p className={styles.cardValor}>
                {formatarMoeda(totais.totalConfirmado)}
              </p>
              <span className={styles.cardSub}>
                Conferidos e quitados no caixa
              </span>
            </div>
          </div>

          {/* Card Coletados */}
          <div className={`${styles.cardResumo} ${styles.cardColetado}`}>
            <div className={styles.cardIconeWrapper}>
              <Clock size={24} weight="bold" />
            </div>
            <div className={styles.cardInfo}>
              <span className={styles.cardLabel}>Coletados (A Confirmar)</span>
              <p className={styles.cardValor}>
                {formatarMoeda(totais.totalColetado)}
              </p>
              <span className={styles.cardSub}>
                Aguardando conferência física
              </span>
            </div>
          </div>

          {/* Card Cancelados */}
          <div className={`${styles.cardResumo} ${styles.cardCancelado}`}>
            <div className={styles.cardIconeWrapper}>
              <XCircle size={24} weight="bold" />
            </div>
            <div className={styles.cardInfo}>
              <span className={styles.cardLabel}>Cancelados</span>
              <p className={styles.cardValor}>
                {formatarMoeda(totais.totalCancelado)}
              </p>
              <span className={styles.cardSub}>Desconsiderados no caixa</span>
            </div>
          </div>
        </section>

        {/* ── FAIXA DE SUBTOTAIS POR FORMA DE PAGAMENTO ── */}
        <section className={styles.faixaFormasPagamento}>
          <span className={styles.tituloFaixaFormas}>
            <Money size={14} weight="bold" />
            Subtotais:
          </span>
          <div className={styles.chipForma}>
            <span>Dinheiro:</span>
            <strong>{formatarMoeda(totais.dinheiro)}</strong>
          </div>
          <div className={styles.chipForma}>
            <span>PIX:</span>
            <strong>{formatarMoeda(totais.pix)}</strong>
          </div>
          <div className={styles.chipForma}>
            <span>Cartões:</span>
            <strong>{formatarMoeda(totais.cartao)}</strong>
          </div>
          <div className={styles.chipForma}>
            <span>Cheques:</span>
            <strong>{formatarMoeda(totais.cheque)}</strong>
          </div>
          <div className={styles.chipForma}>
            <span>Vales:</span>
            <strong>{formatarMoeda(totais.vale)}</strong>
          </div>
        </section>

        {/* ── PAINEL DE FILTROS DA ROTA ── */}
        <section className={styles.painelFiltros}>
          <div className={styles.filtrosHeader}>
            <span className={styles.filtrosTitulo}>
              <Funnel size={16} weight="bold" />
              Filtros da Rota e Parâmetros de Pesquisa
            </span>
            <button
              type="button"
              className={styles.btnLimparFiltros}
              onClick={limparTodosFiltros}
              title="Limpar todos os filtros"
            >
              <X size={14} weight="bold" />
              <span>Limpar Filtros</span>
            </button>
          </div>

          <div className={styles.filtrosGrid}>
            {/* 1. Vendedor / Motorista */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>
                <User size={13} weight="bold" />
                Vendedor / Motorista:
              </label>
              <select
                className={styles.selectFiltro}
                value={filtroVendedor}
                onChange={(e) => setFiltroVendedor(e.target.value)}
              >
                <option value="TODOS">Todos os vendedores</option>
                {vendedores.map((v) => (
                  <option key={v.id || v.nome} value={v.nome.toUpperCase()}>
                    {v.nome.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Dia de Atendimento da Rota */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>
                <Calendar size={13} weight="bold" />
                Dia de Atendimento:
              </label>
              <select
                className={styles.selectFiltro}
                value={filtroAtendimento}
                onChange={(e) => setFiltroAtendimento(e.target.value)}
              >
                <option value="TODOS">Todos os dias</option>
                <option value="SEGUNDA">Segunda-feira</option>
                <option value="TERCA">Terça-feira</option>
                <option value="QUARTA">Quarta-feira</option>
                <option value="QUINTA">Quinta-feira</option>
                <option value="SEXTA">Sexta-feira</option>
                <option value="SABADO">Sábado</option>
                <option value="DOMINGO">Domingo</option>
              </select>
            </div>

            {/* 3. Forma de Pagamento */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>
                <CreditCard size={13} weight="bold" />
                Forma de Pagamento:
              </label>
              <select
                className={styles.selectFiltro}
                value={filtroForma}
                onChange={(e) => setFiltroForma(e.target.value)}
              >
                <option value="TODAS">Todas as formas</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">PIX</option>
                <option value="cartao">Cartão de Crédito / Débito</option>
                <option value="cheque">Cheque</option>
                <option value="vale">Vale / A Prazo</option>
              </select>
            </div>

            {/* 4. Origem / Vínculo com Pendência */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>
                <Tag size={13} weight="bold" />
                Origem do Pagamento:
              </label>
              <select
                className={styles.selectFiltro}
                value={filtroOrigem}
                onChange={(e) => setFiltroOrigem(e.target.value)}
              >
                <option value="todos">Todos os pagamentos</option>
                <option value="com_pendencia">
                  Cobrança de Pendência Externa
                </option>
                <option value="avulso">Venda Direta / Balcão</option>
              </select>
            </div>

            {/* 5. Período de Datas */}
            <div className={styles.filtroGrupo} style={{ gridColumn: "span 2" }}>
              <label className={styles.filtroLabel}>
                <Calendar size={13} weight="bold" />
                Período de Datas:
              </label>
              <div className={styles.periodoInputsWrapper}>
                <input
                  type="date"
                  className={styles.inputFiltro}
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  title="Data Inicial"
                />
                <input
                  type="date"
                  className={styles.inputFiltro}
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  title="Data Final"
                />
              </div>
              <div className={styles.botoesAtalhosData}>
                <button
                  type="button"
                  className={styles.btnAtalho}
                  onClick={() => aplicarAtalhoData("hoje")}
                >
                  Hoje
                </button>
                <button
                  type="button"
                  className={styles.btnAtalho}
                  onClick={() => aplicarAtalhoData("semana")}
                >
                  Esta Semana
                </button>
                <button
                  type="button"
                  className={styles.btnAtalho}
                  onClick={() => aplicarAtalhoData("mes")}
                >
                  Este Mês
                </button>
                <button
                  type="button"
                  className={styles.btnAtalho}
                  onClick={() => aplicarAtalhoData("limpar")}
                >
                  Limpar Datas
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── SEÇÃO DA LISTAGEM ── */}
        <section className={styles.secaoCard}>
          <div className={styles.secaoHeaderLinha}>
            {/* Abas de Status */}
            <div className={styles.abasStatus}>
              <button
                type="button"
                className={`${styles.abaBotao} ${
                  filtroStatus === "coletado" ? styles.abaBotaoAtiva : ""
                }`}
                onClick={() => setFiltroStatus("coletado")}
              >
                <Clock size={14} weight="bold" color="#e67700" />
                <span>Coletados</span>
                <span className={styles.abaBadgeContador}>
                  {contadoresStatus.coletado}
                </span>
              </button>

              <button
                type="button"
                className={`${styles.abaBotao} ${
                  filtroStatus === "baixado" ? styles.abaBotaoAtiva : ""
                }`}
                onClick={() => setFiltroStatus("baixado")}
              >
                <CheckCircle size={14} weight="bold" color="#2b8a3e" />
                <span>Confirmados</span>
                <span className={styles.abaBadgeContador}>
                  {contadoresStatus.baixado}
                </span>
              </button>

              <button
                type="button"
                className={`${styles.abaBotao} ${
                  filtroStatus === "cancelado" ? styles.abaBotaoAtiva : ""
                }`}
                onClick={() => setFiltroStatus("cancelado")}
              >
                <XCircle size={14} weight="bold" color="#c92a2a" />
                <span>Cancelados</span>
                <span className={styles.abaBadgeContador}>
                  {contadoresStatus.cancelado}
                </span>
              </button>
            </div>

            {/* Barra de Busca Livre */}
            <div className={styles.barraBuscaWrapper}>
              <MagnifyingGlass
                size={16}
                className={styles.inputBuscaIcone}
                weight="bold"
              />
              <input
                type="text"
                placeholder="Buscar cliente, CPF/CNPJ, #ID do pagamento, Ref. pendência ou observação..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className={styles.inputBusca}
              />
            </div>
          </div>

          {/* Lista de Pagamentos */}
          <div className={styles.listaWrapper}>
            {carregando ? (
              <div className={styles.estadoVazio}>
                <Spinner />
                <p>Carregando histórico de pagamentos...</p>
              </div>
            ) : pagamentosFiltrados.length === 0 ? (
              <div className={styles.estadoVazio}>
                <Receipt size={42} weight="duotone" color="#868e96" />
                <p>Nenhum pagamento encontrado com os filtros selecionados.</p>
                <span>
                  Tente ajustar o vendedor, período de datas ou limpar a busca.
                </span>
              </div>
            ) : (
              pagamentosFiltrados.map((pg) => {
                const formaNome = resolverNomeFormaPagamento(
                  pg,
                  formasPagamento
                );
                const st = String(pg.status || "coletado")
                  .toLowerCase()
                  .trim();

                const clienteId = Number(
                  pg.pendencia?.clienteId || pg.clienteId || pg.cliente?.id
                );
                const clienteInfo =
                  pg.pendencia?.cliente ||
                  (clienteId && clientesMap.get(clienteId)) ||
                  pg.cliente;

                const clienteNome =
                  clienteInfo?.nome ||
                  clienteInfo?.nomeFantasia ||
                  pg.cliente?.nome ||
                  pg.cliente?.nomeFantasia ||
                  pg.nomeCliente ||
                  "Cliente Balcão/Externo";

                const vendedorNome =
                  clienteInfo?.vendedor ||
                  pg.pendencia?.vendedor ||
                  pg.vendedor ||
                  "Não informado";

                const atendimentoDia =
                  clienteInfo?.atendimento ||
                  pg.pendencia?.atendimento ||
                  pg.atendimento ||
                  "";

                const dataPg = pg.data || pg.createdAt;

                return (
                  <div
                    key={pg.id}
                    className={`${styles.cardPagamento} ${
                      st === "baixado"
                        ? styles.bordaBaixado
                        : st === "coletado"
                        ? styles.bordaColetado
                        : styles.bordaCancelado
                    }`}
                  >
                    <div className={styles.pagamentoInfo}>
                      <div className={styles.pagamentoHeaderLinha}>
                        <span className={styles.pagamentoId}>#{pg.id}</span>
                        <span className={styles.pagamentoCliente}>
                          {clienteNome}
                        </span>

                        <span
                          className={styles.badgeTag}
                          title="Vendedor da Rota"
                        >
                          <User size={11} weight="bold" />
                          {vendedorNome}
                        </span>

                        {atendimentoDia && (
                          <span
                            className={styles.badgeTag}
                            title="Dia de Atendimento da Rota"
                          >
                            <Calendar size={11} weight="bold" />
                            {atendimentoDia}
                          </span>
                        )}

                        {pg.pendenciaId && (
                          <span
                            className={styles.badgeTag}
                            title="Pendência de Origem"
                          >
                            <Tag size={11} weight="bold" />
                            Ref. Pendência #{pg.pendenciaId}
                          </span>
                        )}
                      </div>

                      <div className={styles.pagamentoMeta}>
                        <span>
                          <strong>Forma:</strong>{" "}
                          {formaNome || "Não informada"}
                        </span>
                        {dataPg && (
                          <span>
                            <strong>Data:</strong>{" "}
                            {new Date(dataPg).toLocaleDateString("pt-BR")}{" "}
                            às{" "}
                            {new Date(dataPg).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                        {(pg.usuario?.nome || pg.criadoPor) && (
                          <span>
                            <strong>Por:</strong>{" "}
                            {pg.usuario?.nome || pg.criadoPor}
                          </span>
                        )}
                      </div>

                      {pg.observacao && (
                        <div>
                          <span className={styles.pagamentoObservacao}>
                            "{pg.observacao}"
                          </span>
                        </div>
                      )}
                    </div>

                    <div className={styles.pagamentoValorStatus}>
                      <span className={styles.valorPagamento}>
                        {formatarMoeda(pg.valor)}
                      </span>

                      <span
                        className={`${styles.badgeStatus} ${
                          st === "baixado"
                            ? styles.statusBaixado
                            : st === "coletado"
                            ? styles.statusColetado
                            : styles.statusCancelado
                        }`}
                      >
                        {st}
                      </span>
                    </div>

                    {/* Ações Rápidas */}
                    <div className={styles.acoesPagamento}>
                      {st === "coletado" && (
                        <button
                          className={styles.btnAcaoBaixar}
                          onClick={() => tratarAcaoRapida(pg.id, "baixado")}
                          disabled={processandoAcao}
                          title="Confirmar baixa do pagamento"
                        >
                          <Check size={12} weight="bold" />
                          <span>Baixar</span>
                        </button>
                      )}

                      {st === "baixado" && (
                        <button
                          className={styles.btnAcaoRecibo}
                          onClick={() => tratarImprimirRecibo(pg)}
                          title="Imprimir recibo deste pagamento para o cliente"
                        >
                          <Receipt size={13} weight="bold" />
                          <span>Recibo</span>
                        </button>
                      )}

                      {st !== "cancelado" && (
                        <AlertaRadix
                          titulo="Cancelar Pagamento?"
                          descricao={
                            pg.pendenciaId
                              ? `Deseja realmente cancelar o pagamento #${pg.id} de ${formatarMoeda(
                                  pg.valor
                                )}? A baixa vinculada à pendência #${pg.pendenciaId} será cancelada e estornada.`
                              : `Deseja realmente cancelar o pagamento #${pg.id} de ${formatarMoeda(
                                  pg.valor
                                )}?`
                          }
                          tratar={() => tratarAcaoRapida(pg.id, "cancelado")}
                          confirmarTexto="Sim, Cancelar"
                          cancelarTexto="Voltar"
                          trigger={
                            <button
                              className={styles.btnAcaoCancelar}
                              disabled={processandoAcao}
                              title="Cancelar pagamento"
                            >
                              <X size={12} weight="bold" />
                              <span>Cancelar</span>
                            </button>
                          }
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      <ModalCriarPagamento
        aberto={modalCriarPagamentoAberto}
        aoFechar={() => setModalCriarPagamentoAberto(false)}
        aoConfirmarSucesso={({ mensagem: msgSucesso }) => {
          setMensagem(msgSucesso);
          carregarPagamentos(false);
        }}
        vendedores={vendedores}
        formasPagamento={formasPagamento}
        clientesMap={clientesMap}
      />

      <Rodape />
      <ToastRadix mensagem={mensagem} />
    </div>
  );
}

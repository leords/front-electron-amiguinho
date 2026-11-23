import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import {
  ArrowLeft,
  User,
  Calendar,
  CheckCircle,
  CurrencyDollar,
  CreditCard,
  Receipt,
  Printer,
  Plus,
  Trash,
  ArrowCounterClockwise,
  X,
  Calculator,
  Money,
  ArrowsLeftRight,
  HandCoins,
  Bank,
  Check,
  Clock,
  WarningCircle,
  ArrowClockwise,
  Tag,
  SealCheck,
  MagnifyingGlass,
  Coins,
} from "@phosphor-icons/react";

import { lerPendencias } from "../../operadores/API/pendencia/lerPendencias";
import { lerPagamentos } from "../../operadores/API/pagamento/lerPagamentos";
import { criarPagamento } from "../../operadores/API/pagamento/criarPagamento";
import { baixarPagamento } from "../../operadores/API/pagamento/baixarPagamento";
import { lerFormaPagamentoExterna } from "../../operadores/API/formaPagamento/lerFormaPagamentoExterna";
import { LerUsuario } from "../../operadores/API/usuario/lerUsuario";
import { LerClienteExterno } from "../../operadores/API/cliente/lerClienteExterno";
import { criarFechamento } from "../../operadores/API/AjusteFechamento/criarFechamento";
import { editarFechamento } from "../../operadores/API/AjusteFechamento/editarFechamento";
import { buscarFechamentoFinalizado } from "../../operadores/API/fechamento/buscarFechamentoFinalizado";

import { usarToast } from "../../componentes/Context/toastContext";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";
import { AlertaRadix } from "../../componentes/ui/alerta/alerta";
import { formatarMoeda } from "../../utils/formartarMoeda";
import { dataFormatadaCalendario, extrairDataYMD } from "../../utils/data";
import { gerarComprovantePrestacaoContasHTML } from "../../utils/gerarComprovantePrestacaoContas";
import { gerarReciboPagamentoHTML } from "../../utils/gerarReciboPagamento";
import Spinner from "../../componentes/Spinner";

const DIAS_SEMANA_MAP = [
  "DOMINGO",
  "SEGUNDA",
  "TERCA",
  "QUARTA",
  "QUINTA",
  "SEXTA",
  "SABADO",
];

const FORMAS_PADRAO = [
  { id: 1, nome: "Dinheiro" },
  { id: 2, nome: "PIX" },
  { id: 3, nome: "Cartão de Crédito" },
  { id: 4, nome: "Cartão de Débito" },
  { id: 5, nome: "Cheque" },
  { id: 6, nome: "Vale / A Prazo" },
];

const PRESETS_AJUSTES = [
  { categoria: "Almoço", tipo: "subtracao", forma: "Dinheiro", label: "Almoço (-)" },
  { categoria: "Combustível", tipo: "subtracao", forma: "Dinheiro", label: "Combustível (-)" },
  { categoria: "Pedágio", tipo: "subtracao", forma: "Dinheiro", label: "Pedágio (-)" },
  { categoria: "Devolução Troco", tipo: "adicao", forma: "Dinheiro", label: "Devolução Troco (+)" },
  { categoria: "Outros", tipo: "subtracao", forma: "Dinheiro", label: "Outros (-)" },
];

/**
 * Normalização textual para comparação sem acentos e case-insensitive
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
 * Normaliza e identifica a categoria de pagamento (dinheiro, pix, cartao, cheque, vale)
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
 * Resolução segura do nome da forma de pagamento a partir do objeto ou IDs
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

/**
 * Retorna o saldo devedor real da pendência (valor total menos o valor já pago)
 */
const obterSaldoPendencia = (pend) => {
  if (!pend) return 0;
  if (pend.saldoDevedor !== undefined && pend.saldoDevedor !== null) {
    return Math.max(0, Number(pend.saldoDevedor));
  }
  if (pend.saldo !== undefined && pend.saldo !== null) {
    return Math.max(0, Number(pend.saldo));
  }
  const valorTotal = Number(pend.valorTotal || pend.valor || 0);
  const pago = Number(pend.valorPago || 0);
  return Math.max(0, valorTotal - pago);
};

export default function PrestacaoContas() {
  const navegar = useNavigate();
  const { mensagem, setMensagem } = usarToast();

  // ── Filtros Superiores ──
  const [vendedores, setVendedores] = useState([]);
  const [vendedorSelecionado, setVendedorSelecionado] = useState("EMERSON");
  const [dataFechamento, setDataFechamento] = useState(() =>
    dataFormatadaCalendario(new Date())
  );
  const [atendimento, setAtendimento] = useState(() => {
    const diaIndex = new Date().getDay();
    return DIAS_SEMANA_MAP[diaIndex] || "SEGUNDA";
  });

  // ── Formas de Pagamento e Clientes ──
  const [formasPagamento, setFormasPagamento] = useState(FORMAS_PADRAO);
  const [clientes, setClientes] = useState([]);

  // ── Dados da Página ──
  const [pendencias, setPendencias] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);

  // ── Estados de Carregamento ──
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [processandoAcao, setProcessandoAcao] = useState(false);
  const [fechamentoAtual, setFechamentoAtual] = useState(null);
  const [carregandoFechamento, setCarregandoFechamento] = useState(false);

  // ── Abas Principais: 'pendencias' | 'coletados' | 'confirmados' ──
  const [abaAtiva, setAbaAtiva] = useState("confirmados");
  const [buscaTexto, setBuscaTexto] = useState("");

  // ── Modal de Gerar Pagamento da Pendência ──
  const [pendenciaParaGerarPagamento, setPendenciaParaGerarPagamento] = useState(null);
  const [formGerarPagamento, setFormGerarPagamento] = useState({
    valor: "",
    formaPagamentoId: "1",
    observacao: "",
  });

  // ── Lançamentos & Ajustes da Rota ──
  const [ajustes, setAjustes] = useState([]);
  const [tipoAjuste, setTipoAjuste] = useState("subtracao"); // 'adicao' | 'subtracao'
  const [categoriaAjuste, setCategoriaAjuste] = useState("Almoço");
  const [descricaoAjuste, setDescricaoAjuste] = useState("");
  const [valorAjuste, setValorAjuste] = useState("");
  const [formaAjuste, setFormaAjuste] = useState("Dinheiro");

  // ── Calculadora de Cédulas ──
  const [duzentos, setDuzentos] = useState(0);
  const [cem, setCem] = useState(0);
  const [cinquenta, setCinquenta] = useState(0);
  const [vinte, setVinte] = useState(0);
  const [dez, setDez] = useState(0);
  const [cinco, setCinco] = useState(0);
  const [dois, setDois] = useState(0);

  // Refs para navegação com tecla Enter na calculadora de cédulas
  const inputCemRef = useRef(null);
  const inputCinquentaRef = useRef(null);
  const inputVinteRef = useRef(null);
  const inputDezRef = useRef(null);
  const inputCincoRef = useRef(null);
  const inputDoisRef = useRef(null);

  // 1. Carregar lista de vendedores, clientes externos e formas de pagamento ao inicializar
  useEffect(() => {
    const carregarIniciais = async () => {
      try {
        // Carrega usuários / vendedores
        try {
          const listaUsuarios = await LerUsuario();
          if (Array.isArray(listaUsuarios) && listaUsuarios.length > 0) {
            setVendedores(listaUsuarios);
            const padrao =
              listaUsuarios.find(
                (u) =>
                  (u.nome || "").toUpperCase().includes("EMERSON") ||
                  (u.nivelAcesso || "").toUpperCase() === "EXTERNO"
              ) || listaUsuarios[0];

            if (padrao?.nome) {
              setVendedorSelecionado(padrao.nome.toUpperCase());
            }
          }
        } catch (errUsuarios) {
          console.warn("Erro ao carregar lista de usuários:", errUsuarios);
        }

        // Carrega lista de clientes externos para mapeamento por vendedor e atendimento
        try {
          const listaClientes = await LerClienteExterno();
          if (Array.isArray(listaClientes)) {
            setClientes(listaClientes);
          }
        } catch (errClientes) {
          console.warn("Erro ao carregar clientes externos:", errClientes);
        }

        // Carrega formas de pagamento
        try {
          const fps = await lerFormaPagamentoExterna();
          if (Array.isArray(fps) && fps.length > 0) {
            setFormasPagamento(fps);
          }
        } catch (errFps) {
          console.warn("Erro ao buscar formas de pagamento externas:", errFps);
        }
      } catch (e) {
        console.error("Erro na inicialização de PrestacaoContas:", e);
      }
    };

    carregarIniciais();
  }, []);

  // Mapa de Clientes por ID para busca rápida e precisa de vendedor e dia de atendimento
  const clientesMap = useMemo(() => {
    const mapa = new Map();
    clientes.forEach((c) => {
      if (c.id) mapa.set(Number(c.id), c);
    });
    return mapa;
  }, [clientes]);

  // Ref para sincronização segura de ajustes no localStorage
  const ajustesCarregadosRef = useRef(false);

  // 2. Carregar ajustes do localStorage para a combinação Vendedor + Data
  useEffect(() => {
    if (!vendedorSelecionado) return;
    ajustesCarregadosRef.current = false;
    try {
      const chave = `ajustes_prestacao_${vendedorSelecionado}_${dataFechamento}`;
      const salvo = localStorage.getItem(chave);
      if (salvo) {
        setAjustes(JSON.parse(salvo));
      } else {
        setAjustes([]);
      }
    } catch (e) {
      console.warn("Erro ao carregar ajustes do localStorage:", e);
      setAjustes([]);
    } finally {
      setTimeout(() => {
        ajustesCarregadosRef.current = true;
      }, 50);
    }
  }, [vendedorSelecionado, dataFechamento]);

  // Persistir ajustes sempre que houver alteração
  useEffect(() => {
    if (!ajustesCarregadosRef.current || !vendedorSelecionado) return;
    try {
      const chave = `ajustes_prestacao_${vendedorSelecionado}_${dataFechamento}`;
      localStorage.setItem(chave, JSON.stringify(ajustes));
    } catch (e) {
      console.warn("Erro ao salvar ajustes no localStorage:", e);
    }
  }, [ajustes, vendedorSelecionado, dataFechamento]);

  // 3. Carregar Pendências Ativas e Pagamentos (Retorna todos os pagamentos para filtragem precisa)
  const carregarDadosFechamento = async (mostrarSpinnerGlobal = false) => {
    if (!vendedorSelecionado) return;

    try {
      if (mostrarSpinnerGlobal) setCarregando(true);
      setAtualizando(true);

      const pendenciasPromessa = lerPendencias({
        vendedor: vendedorSelecionado,
        atendimento: atendimento !== "TODOS" ? atendimento : undefined,
        status: "ativas", // traz apenas 'aberta' e 'parcial'
      }).catch((err) => {
        console.warn("Erro ao ler pendencias:", err);
        return [];
      });

      // Busca pagamentos sem corte de data rígido para trazer todos os pagamentos confirmados/coletados
      const pagamentosPromessa = lerPagamentos().catch((err) => {
        console.warn("Erro ao ler pagamentos:", err);
        return [];
      });

      // Garante que clientes externos estejam carregados
      const clientesPromessa =
        clientes.length === 0
          ? LerClienteExterno().catch(() => [])
          : Promise.resolve(null);

      const [resPendencias, resPagamentos, resClientes] = await Promise.all([
        pendenciasPromessa,
        pagamentosPromessa,
        clientesPromessa,
      ]);

      setPendencias(Array.isArray(resPendencias) ? resPendencias : []);
      setPagamentos(Array.isArray(resPagamentos) ? resPagamentos : []);

      if (Array.isArray(resClientes) && resClientes.length > 0) {
        setClientes(resClientes);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do fechamento:", error);
      setMensagem(error.message || "Erro ao consultar dados.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  };

  useEffect(() => {
    carregarDadosFechamento(true);
  }, [vendedorSelecionado, atendimento, dataFechamento]);

  // ── Buscar Fechamento do Vendedor Selecionado na Data ──
  useEffect(() => {
    let ativo = true;
    const verificarFechamentoVendedor = async () => {
      if (!vendedorSelecionado || !dataFechamento) {
        setFechamentoAtual(null);
        return;
      }
      setCarregandoFechamento(true);
      try {
        const dados = await buscarFechamentoFinalizado(
          "externo",
          vendedorSelecionado,
          dataFechamento
        );
        if (!ativo) return;
        setFechamentoAtual(dados);
        if (dados && dados.status === "fechado") {
          setDuzentos(Number(dados.nota200 || 0));
          setCem(Number(dados.nota100 || 0));
          setCinquenta(Number(dados.nota50 || 0));
          setVinte(Number(dados.nota20 || 0));
          setDez(Number(dados.nota10 || 0));
          setCinco(Number(dados.nota5 || 0));
          setDois(Number(dados.nota2 || 0));
        } else {
          setDuzentos(0);
          setCem(0);
          setCinquenta(0);
          setVinte(0);
          setDez(0);
          setCinco(0);
          setDois(0);
        }
      } catch (err) {
        if (!ativo) return;
        console.warn("Erro ao buscar fechamento do vendedor:", err);
        setFechamentoAtual(null);
      } finally {
        if (ativo) setCarregandoFechamento(false);
      }
    };

    verificarFechamentoVendedor();
    return () => {
      ativo = false;
    };
  }, [vendedorSelecionado, dataFechamento]);

  // Atualiza a data de fechamento e sincroniza o dia da semana correspondente no atendimento
  const tratarAlteracaoData = (novaData) => {
    setDataFechamento(novaData);
    if (novaData) {
      try {
        const partes = novaData.split("-").map(Number);
        if (partes.length === 3) {
          const dt = new Date(partes[0], partes[1] - 1, partes[2]);
          const diaNome = DIAS_SEMANA_MAP[dt.getDay()];
          if (diaNome) setAtendimento(diaNome);
        }
      } catch (e) {
        console.warn("Erro ao calcular dia da semana:", e);
      }
    }
  };

  /**
   * Helper seguro para extrair a data YYYY-MM-DD ignorando possíveis defasagens de fuso
   */
  const extrairDataSegura = (val) => {
    if (!val) return "";
    if (typeof val === "string") {
      const match = val.match(/^(\d{4}-\d{2}-\d{2})/);
      if (val.includes("T00:00:00") && match) {
        return match[1];
      }
    }
    return extrairDataYMD(val);
  };

  /**
   * Identifica se um pagamento pertence ao vendedor selecionado no filtro.
   * Não valida o dia de atendimento (rota semanal) do cliente.
   */
  const pagamentoPertenceAoVendedor = (pg) => {
    const vendFiltro = normalizarTexto(vendedorSelecionado);
    if (!vendFiltro) return true;

    // 1. Verifica se o próprio pagamento possui o vendedor registrado
    const pgVendedor = normalizarTexto(
      pg.vendedor || pg.criadoPor || pg.usuario?.nome || ""
    );
    if (
      pgVendedor &&
      (pgVendedor === vendFiltro ||
        pgVendedor.includes(vendFiltro) ||
        vendFiltro.includes(pgVendedor))
    ) {
      return true;
    }

    // 2. Se estiver vinculado a uma pendência da lista atual
    if (pg.pendenciaId) {
      const pend = pendencias.find(
        (p) => Number(p.id) === Number(pg.pendenciaId)
      );
      const pendVendedor = normalizarTexto(
        pend?.vendedor || pg.pendencia?.vendedor || ""
      );
      if (
        pendVendedor &&
        (pendVendedor === vendFiltro ||
          pendVendedor.includes(vendFiltro) ||
          vendFiltro.includes(pendVendedor))
      ) {
        return true;
      }
    }

    // 3. Busca informações do cliente vinculado ao pagamento
    const clienteId = Number(
      pg.pendencia?.clienteId || pg.clienteId || pg.cliente?.id
    );
    const clienteObj =
      pg.pendencia?.cliente ||
      (clienteId && clientesMap.get(clienteId)) ||
      pg.cliente;

    const clienteVendedor = normalizarTexto(clienteObj?.vendedor || "");
    if (
      clienteVendedor &&
      (clienteVendedor === vendFiltro ||
        clienteVendedor.includes(vendFiltro) ||
        vendFiltro.includes(clienteVendedor))
    ) {
      return true;
    }

    return false;
  };

  /**
   * Verifica se o pagamento ocorreu/foi confirmado na data de fechamento selecionada.
   */
  const pagamentoOcorreuNaDataFechamento = (pg) => {
    const dataAlvo = extrairDataSegura(dataFechamento);
    if (!dataAlvo) return true;

    const dataPg = extrairDataSegura(
      pg.data || pg.createdAt || pg.dataPagamento || pg.dataBaixa || pg.updatedAt
    );
    return dataPg === dataAlvo;
  };

  /**
   * Identifica se um pagamento está relacionado a clientes do vendedor e dia de atendimento selecionados no filtro.
   * Usado para pagamentos em status 'coletado' na rota.
   */
  const pagamentoPertenceAoVendedorEAtendimento = (pg) => {
    if (!pagamentoPertenceAoVendedor(pg)) return false;

    const atendFiltro = normalizarDiaSemana(atendimento);
    if (atendFiltro === "TODOS") return true;

    // Se estiver explicitamente vinculado a uma pendência da lista atual
    if (
      pg.pendenciaId &&
      pendencias.some((p) => Number(p.id) === Number(pg.pendenciaId))
    ) {
      return true;
    }

    const clienteId = Number(
      pg.pendencia?.clienteId || pg.clienteId || pg.cliente?.id
    );
    const clienteObj =
      pg.pendencia?.cliente ||
      (clienteId && clientesMap.get(clienteId)) ||
      pg.cliente;

    const rawAtendimento =
      clienteObj?.atendimento ||
      pg.pendencia?.atendimento ||
      pg.atendimento ||
      "";
    const clienteAtendimento = normalizarDiaSemana(rawAtendimento);

    return !clienteAtendimento || clienteAtendimento === atendFiltro;
  };

  // ── Helper para arredondar valores monetários com 2 casas decimais precisas ──
  const arredondarMoeda = (valor) => {
    const num = Number(valor);
    if (isNaN(num)) return 0;
    return Math.round(num * 100) / 100;
  };

  // ── Helper seguro para parsing de valores vindos da API / inputs ──
  const parseValorMonetario = (val) => {
    if (val === null || val === undefined) return 0;
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    const limpo = String(val).replace(/\s/g, "").replace(",", ".");
    const num = parseFloat(limpo);
    return isNaN(num) ? 0 : num;
  };

  // ── Totais Calculados Dinamicamente ──
  const totais = useMemo(() => {
    // 1. Pagamentos Confirmados (status === 'baixado')
    let dinheiroConfirmado = 0;
    let pixConfirmado = 0;
    let cartaoConfirmado = 0;
    let chequeConfirmado = 0;
    let valeConfirmado = 0;

    // 2. Pagamentos Coletados (status === 'coletado', pendentes de baixa/confirmação)
    let dinheiroColetado = 0;
    let pixColetado = 0;
    let cartaoColetado = 0;
    let chequeColetado = 0;
    let valeColetado = 0;

    pagamentos.forEach((p) => {
      const st = String(p.status || "").toLowerCase().trim();
      if (st === "cancelado") return;

      const nomeForma = resolverNomeFormaPagamento(p, formasPagamento);
      const cat = categorizarFormaPagamento(nomeForma);
      const valor = parseValorMonetario(p.valor);

      if (st === "baixado") {
        // Pagamentos Confirmados: considera pagamentos confirmados na data de fechamento para o vendedor (sem filtrar dia da semana)
        if (
          !pagamentoPertenceAoVendedor(p) ||
          !pagamentoOcorreuNaDataFechamento(p)
        ) {
          return;
        }

        if (cat === "dinheiro") dinheiroConfirmado += valor;
        else if (cat === "pix") pixConfirmado += valor;
        else if (cat === "cartao") cartaoConfirmado += valor;
        else if (cat === "cheque") chequeConfirmado += valor;
        else if (cat === "vale") valeConfirmado += valor;
        else dinheiroConfirmado += valor;
      } else if (st === "coletado") {
        if (!pagamentoPertenceAoVendedorEAtendimento(p)) return;

        if (cat === "dinheiro") dinheiroColetado += valor;
        else if (cat === "pix") pixColetado += valor;
        else if (cat === "cartao") cartaoColetado += valor;
        else if (cat === "cheque") chequeColetado += valor;
        else if (cat === "vale") valeColetado += valor;
        else dinheiroColetado += valor;
      }
    });

    dinheiroConfirmado = arredondarMoeda(dinheiroConfirmado);
    pixConfirmado = arredondarMoeda(pixConfirmado);
    cartaoConfirmado = arredondarMoeda(cartaoConfirmado);
    chequeConfirmado = arredondarMoeda(chequeConfirmado);
    valeConfirmado = arredondarMoeda(valeConfirmado);
    const totalConfirmado = arredondarMoeda(
      dinheiroConfirmado +
        pixConfirmado +
        cartaoConfirmado +
        chequeConfirmado +
        valeConfirmado
    );

    dinheiroColetado = arredondarMoeda(dinheiroColetado);
    pixColetado = arredondarMoeda(pixColetado);
    cartaoColetado = arredondarMoeda(cartaoColetado);
    chequeColetado = arredondarMoeda(chequeColetado);
    valeColetado = arredondarMoeda(valeColetado);
    const totalColetado = arredondarMoeda(
      dinheiroColetado +
        pixColetado +
        cartaoColetado +
        chequeColetado +
        valeColetado
    );

    // 3. Lançamentos e ajustes de rota (+ / -)
    let ajustesDinheiro = 0;
    let ajustesPix = 0;
    let ajustesCartao = 0;
    let ajustesCheque = 0;
    let ajustesVale = 0;

    ajustes.forEach((aj) => {
      const v = parseValorMonetario(aj.valor);
      const isEntrada = aj.tipo === "adicao" || aj.tipo === "entrada";
      const delta = isEntrada ? v : -v;
      const cat = categorizarFormaPagamento(aj.formaPagamento);

      if (cat === "dinheiro") ajustesDinheiro += delta;
      else if (cat === "pix") ajustesPix += delta;
      else if (cat === "cartao") ajustesCartao += delta;
      else if (cat === "cheque") ajustesCheque += delta;
      else if (cat === "vale") ajustesVale += delta;
      else ajustesDinheiro += delta;
    });

    ajustesDinheiro = arredondarMoeda(ajustesDinheiro);
    ajustesPix = arredondarMoeda(ajustesPix);
    ajustesCartao = arredondarMoeda(ajustesCartao);
    ajustesCheque = arredondarMoeda(ajustesCheque);
    ajustesVale = arredondarMoeda(ajustesVale);
    const totalAjustes = arredondarMoeda(
      ajustesDinheiro + ajustesPix + ajustesCartao + ajustesCheque + ajustesVale
    );

    // 4. Totais Finais por Forma de Pagamento (Confirmados + Ajustes)
    const dinheiroFinal = arredondarMoeda(
      Math.max(0, dinheiroConfirmado + ajustesDinheiro)
    );
    const pixFinal = arredondarMoeda(
      Math.max(0, pixConfirmado + ajustesPix)
    );
    const cartaoFinal = arredondarMoeda(
      Math.max(0, cartaoConfirmado + ajustesCartao)
    );
    const chequeFinal = arredondarMoeda(
      Math.max(0, chequeConfirmado + ajustesCheque)
    );
    const valeFinal = arredondarMoeda(
      Math.max(0, valeConfirmado + ajustesVale)
    );
    const totalGeral = arredondarMoeda(
      dinheiroFinal + pixFinal + cartaoFinal + chequeFinal + valeFinal
    );

    // 5. Total de saldo de pendências ativas ainda em aberto
    const totalPendenciasAtivas = arredondarMoeda(
      pendencias.reduce((acc, pend) => {
        const saldo = parseValorMonetario(obterSaldoPendencia(pend));
        return acc + saldo;
      }, 0)
    );

    return {
      // Valores Confirmados (status 'baixado')
      dinheiroConfirmado,
      pixConfirmado,
      cartaoConfirmado,
      chequeConfirmado,
      valeConfirmado,
      totalConfirmado,

      // Aliases para compatibilidade total
      dinheiroPagamentos: dinheiroConfirmado,
      pixPagamentos: pixConfirmado,
      cartaoPagamentos: cartaoConfirmado,
      chequePagamentos: chequeConfirmado,
      valePagamentos: valeConfirmado,

      // Valores Coletados (status 'coletado', aguardando baixa)
      dinheiroColetado,
      pixColetado,
      cartaoColetado,
      chequeColetado,
      valeColetado,
      totalColetado,

      // Ajustes da Rota
      ajustesDinheiro,
      ajustesPix,
      ajustesCartao,
      ajustesCheque,
      ajustesVale,
      totalAjustes,

      // Totais Finais (Confirmados +/- Ajustes)
      dinheiroFinal,
      pixFinal,
      cartaoFinal,
      chequeFinal,
      valeFinal,
      totalGeral,

      // Pendências em aberto
      totalPendenciasAtivas,
    };
  }, [
    pagamentos,
    ajustes,
    pendencias,
    formasPagamento,
    clientesMap,
    vendedorSelecionado,
    atendimento,
    dataFechamento,
  ]);

  // ── Calculadora de Cédulas Dinâmica ──
  const contagemCedulas = useMemo(() => {
    const n200 = Math.max(0, parseInt(duzentos, 10) || 0);
    const n100 = Math.max(0, parseInt(cem, 10) || 0);
    const n50 = Math.max(0, parseInt(cinquenta, 10) || 0);
    const n20 = Math.max(0, parseInt(vinte, 10) || 0);
    const n10 = Math.max(0, parseInt(dez, 10) || 0);
    const n5 = Math.max(0, parseInt(cinco, 10) || 0);
    const n2 = Math.max(0, parseInt(dois, 10) || 0);

    const total = arredondarMoeda(
      n200 * 200 +
        n100 * 100 +
        n50 * 50 +
        n20 * 20 +
        n10 * 10 +
        n5 * 5 +
        n2 * 2
    );

    const diferenca = arredondarMoeda(total - totais.dinheiroFinal);
    const totalNotas = n200 + n100 + n50 + n20 + n10 + n5 + n2;

    return {
      totalContado: total,
      diferenca,
      totalNotas,
      cedulas: {
        duzentos: n200,
        cem: n100,
        cinquenta: n50,
        vinte: n20,
        dez: n10,
        cinco: n5,
        dois: n2,
      },
    };
  }, [duzentos, cem, cinquenta, vinte, dez, cinco, dois, totais.dinheiroFinal]);

  const limparCalculadoraCedulas = () => {
    setDuzentos(0);
    setCem(0);
    setCinquenta(0);
    setVinte(0);
    setDez(0);
    setCinco(0);
    setDois(0);
  };

  // ── AÇÃO: ABRIR E SALVAR 'GERAR PAGAMENTO' DA PENDÊNCIA ──
  const abrirGerarPagamento = (pendencia) => {
    setPendenciaParaGerarPagamento(pendencia);
    const saldoNum = obterSaldoPendencia(pendencia);
    setFormGerarPagamento({
      valor: saldoNum > 0 ? saldoNum.toFixed(2) : "",
      formaPagamentoId: formasPagamento[0]?.id
        ? String(formasPagamento[0].id)
        : "1",
      observacao: "",
    });
  };

  const tratarSalvarPagamentoPendencia = async (e) => {
    e.preventDefault();
    if (!pendenciaParaGerarPagamento || processandoAcao) return;

    const valorNum = parseFloat(
      String(formGerarPagamento.valor).replace(",", ".")
    );
    if (!valorNum || valorNum <= 0) {
      setMensagem("Informe um valor válido maior que zero.");
      return;
    }

    try {
      setProcessandoAcao(true);

      // Status fixado como 'baixado' e relacionando com a pendência
      await criarPagamento({
        pendenciaId: Number(pendenciaParaGerarPagamento.id),
        clienteId:
          pendenciaParaGerarPagamento.clienteId ||
          pendenciaParaGerarPagamento.cliente?.id,
        valor: valorNum,
        formaPagamentoId: Number(formGerarPagamento.formaPagamentoId),
        status: "baixado",
        vendedor: vendedorSelecionado,
        observacao: formGerarPagamento.observacao.trim() || undefined,
      });

      const formaNome =
        formasPagamento.find(
          (f) => Number(f.id) === Number(formGerarPagamento.formaPagamentoId)
        )?.nome || "Forma";

      setMensagem(
        `Pagamento de ${formatarMoeda(
          valorNum
        )} (${formaNome}) baixado com sucesso para a pendência #${
          pendenciaParaGerarPagamento.id
        }!`
      );

      setPendenciaParaGerarPagamento(null);
      await carregarDadosFechamento(false);
    } catch (error) {
      console.error("Erro ao gerar pagamento da pendência:", error);
      setMensagem(error.message || "Erro ao registrar pagamento da pendência.");
    } finally {
      setProcessandoAcao(false);
    }
  };

  // ── AÇÕES NAS LISTAS DE PAGAMENTOS: ALTERAR STATUS ──
  const tratarAcaoRapidaPagamento = async (pagamentoId, novoStatus) => {
    if (!pagamentoId || processandoAcao) return;

    try {
      setProcessandoAcao(true);
      await baixarPagamento(pagamentoId, { status: novoStatus });

      if (novoStatus === "baixado") {
        setMensagem(`Pagamento #${pagamentoId} confirmado como BAIXADO!`);
      } else if (novoStatus === "coletado") {
        setMensagem(`Baixa cancelada! Pagamento #${pagamentoId} retornou para COLETADO.`);
      } else {
        setMensagem(`Pagamento #${pagamentoId} cancelado com sucesso.`);
      }

      await carregarDadosFechamento(false);
    } catch (error) {
      console.error("Erro na ação do pagamento:", error);
      setMensagem(error.message || "Erro ao atualizar pagamento.");
    } finally {
      setProcessandoAcao(false);
    }
  };

  // ── Impressão de Recibo Individual de Pagamento Baixado ──
  const tratarImprimirReciboPagamento = async (pg) => {
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
          pg.vendedor ||
          vendedorSelecionado,
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



  // ── Gestão de Lançamentos & Ajustes da Rota ──
  const tratarAdicionarAjuste = (e) => {
    e.preventDefault();
    const v = parseValorMonetario(valorAjuste);
    if (!v || v <= 0) {
      setMensagem("Informe um valor válido maior que zero para o ajuste.");
      return;
    }

    const desc = descricaoAjuste.trim();
    const categoria = categoriaAjuste || desc || "Ajuste";

    const novo = {
      id: Date.now(),
      categoria,
      tipo: tipoAjuste,
      formaPagamento: formaAjuste,
      descricao: desc || categoria,
      valor: arredondarMoeda(v),
      hora: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setAjustes((prev) => [novo, ...prev]);
    setValorAjuste("");
    setDescricaoAjuste("");
    setMensagem(
      `Ajuste de ${categoria} (${formatarMoeda(v)}) registrado com sucesso!`
    );
  };

  const tratarRemoverAjuste = (id) => {
    setAjustes((prev) => prev.filter((a) => a.id !== id));
    setMensagem("Ajuste removido com sucesso.");
  };

  const aplicarPresetAjuste = (preset) => {
    setCategoriaAjuste(preset.categoria);
    setTipoAjuste(preset.tipo);
    setFormaAjuste(preset.forma);
    setDescricaoAjuste(preset.categoria);
  };

  // ── Impressão Térmica do Fechamento do Vendedor ──
  const tratarImprimirFechamento = async () => {
    try {
      const html = gerarComprovantePrestacaoContasHTML({
        vendedor: vendedorSelecionado,
        atendimento,
        dataReferencia: dataFechamento,
        totais,
        ajustes,
        pagamentos: [
          ...pagamentosConfirmados,
          ...pagamentosColetados,
        ],
        contagemCedulas,
      });

      if (window.IMPRESSORA && typeof window.IMPRESSORA.imprimir === "function") {
        await window.IMPRESSORA.imprimir(html);
        setMensagem("Enviado para a impressora com sucesso!");
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
      console.error("Erro ao imprimir prestação de contas:", error);
      setMensagem("Erro ao enviar para a impressora.");
    }
  };

  // ── Concluir Fechamento Real na API ──
  const tratarConcluirFechamento = async () => {
    if (!vendedorSelecionado) {
      setMensagem("Selecione um vendedor para concluir o fechamento.");
      return;
    }

    setProcessandoAcao(true);
    try {
      // 1. Cria ou recupera o fechamento no setor 'externo' para o vendedor selecionado
      const fechamento = await criarFechamento("externo", {
        vendedor: vendedorSelecionado,
        data: dataFechamento,
      });

      if (!fechamento?.id) {
        throw new Error("Não foi possível registrar o fechamento do vendedor.");
      }

      // 2. Prepara os dados de fechamento com totalSistema, totalInformado e cédulas
      const dadosFechamento = {
        totalSistema: totais.dinheiroFinal ?? 0,
        totalInformado: contagemCedulas.totalContado ?? 0,
        nota200: contagemCedulas.cedulas.duzentos,
        nota100: contagemCedulas.cedulas.cem,
        nota50: contagemCedulas.cedulas.cinquenta,
        nota20: contagemCedulas.cedulas.vinte,
        nota10: contagemCedulas.cedulas.dez,
        nota5: contagemCedulas.cedulas.cinco,
        nota2: contagemCedulas.cedulas.dois,
      };

      // 3. Salva e finaliza na API (marca status 'fechado' e calcula a diferença)
      const fechamentoAtualizado = await editarFechamento(
        fechamento.id,
        dadosFechamento
      );

      setFechamentoAtual(fechamentoAtualizado);
      setMensagem(
        `Fechamento de ${vendedorSelecionado} concluído com sucesso! Contabilizado: ${formatarMoeda(
          contagemCedulas.totalContado
        )} (Diferença: ${formatarMoeda(contagemCedulas.diferenca)})`
      );
    } catch (error) {
      console.error("Erro ao concluir fechamento:", error);
      setMensagem(error.message || "Erro ao concluir fechamento.");
    } finally {
      setProcessandoAcao(false);
    }
  };

  // ── Filtragem de Pendências por Busca ──
  const pendenciasFiltradas = useMemo(() => {
    if (!buscaTexto.trim()) return pendencias;
    const b = buscaTexto.toLowerCase();
    return pendencias.filter((p) => {
      const clienteNome = (
        p.cliente?.nome ||
        p.cliente?.nomeFantasia ||
        p.nomeCliente ||
        ""
      ).toLowerCase();
      const idStr = String(p.id);
      return clienteNome.includes(b) || idStr.includes(b);
    });
  }, [pendencias, buscaTexto]);

  // ── PAGAMENTOS COLETADOS E CONFIRMADOS RELACIONADOS A CLIENTES DO VENDEDOR ──
  const pagamentosColetados = useMemo(() => {
    return pagamentos.filter((p) => {
      const st = String(p.status || "").toLowerCase().trim();
      if (st !== "coletado") return false;
      return pagamentoPertenceAoVendedorEAtendimento(p);
    });
  }, [pagamentos, clientesMap, pendencias, vendedorSelecionado, atendimento]);

  // Pagamentos confirmados: apenas do vendedor e ocorridos na data atual/selecionada de fechamento (sem filtro por dia da semana)
  const pagamentosConfirmados = useMemo(() => {
    return pagamentos.filter((p) => {
      const st = String(p.status || "").toLowerCase().trim();
      if (st !== "baixado") return false;
      return (
        pagamentoPertenceAoVendedor(p) &&
        pagamentoOcorreuNaDataFechamento(p)
      );
    });
  }, [pagamentos, clientesMap, pendencias, vendedorSelecionado, dataFechamento]);

  // Helper para filtrar listas de pagamento por busca
  const filtrarListaPagamentos = (lista) => {
    if (!buscaTexto.trim()) return lista;

    const b = buscaTexto.toLowerCase();
    return lista.filter((p) => {
      const clienteId = Number(
        p.pendencia?.clienteId || p.clienteId || p.cliente?.id
      );
      const c =
        p.pendencia?.cliente ||
        (clienteId && clientesMap.get(clienteId)) ||
        p.cliente;

      const clienteNome = (
        c?.nome ||
        c?.nomeFantasia ||
        p.cliente?.nome ||
        p.cliente?.nomeFantasia ||
        p.nomeCliente ||
        ""
      ).toLowerCase();
      const idStr = String(p.id);
      return clienteNome.includes(b) || idStr.includes(b);
    });
  };

  const pagamentosColetadosFiltrados = useMemo(
    () => filtrarListaPagamentos(pagamentosColetados),
    [pagamentosColetados, buscaTexto, clientesMap]
  );

  const pagamentosConfirmadosFiltrados = useMemo(
    () => filtrarListaPagamentos(pagamentosConfirmados),
    [pagamentosConfirmados, buscaTexto, clientesMap]
  );

  return (
    <div className={styles.container}>
      <Cabecalho />

      <main className={styles.main}>
        {/* ── CABEÇALHO DA PÁGINA ── */}
        <div className={styles.cabecalhoPage}>
          <div className={styles.tituloSection}>
            <button
              className={styles.botaoVoltar}
              onClick={() => navegar(-1)}
              title="Voltar"
            >
              <ArrowLeft size={20} weight="bold" />
            </button>
            <div className={styles.iconeWrapper}>
              <Receipt size={24} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Controle de Vendas Externas</p>
              <h1 className={styles.pageTitulo}>
                Prestação de Contas — Vendedor
              </h1>
            </div>
          </div>

          <div className={styles.cabecalhoAcoes}>
            <div className={styles.badgeVendedorAtivo}>
              <User size={15} weight="bold" />
              <span>{vendedorSelecionado || "Nenhum vendedor"}</span>
            </div>
            <button
              className={styles.btnAtualizar}
              onClick={() => carregarDadosFechamento(false)}
              disabled={atualizando || carregando}
              title="Atualizar dados da tela"
            >
              <ArrowClockwise
                size={16}
                weight="bold"
                className={atualizando ? styles.btnAtualizarGirando : ""}
              />
              <span>{atualizando ? "Atualizando..." : "Atualizar"}</span>
            </button>
          </div>
        </div>

        {/* ── PAINEL DE FILTROS SUPERIORES ── */}
        <section className={styles.painelFiltros}>
          <div className={styles.filtrosHeader}>
            <span className={styles.filtrosTitulo}>
              <User size={16} weight="bold" />
              Filtros de Fechamento por Vendedor
            </span>
          </div>

          <div className={styles.filtrosGrid}>
            {/* 1. Seleção de Vendedor */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>
                <User size={14} weight="bold" />
                Vendedor:
              </label>
              <select
                className={styles.selectFiltro}
                value={vendedorSelecionado}
                onChange={(e) => setVendedorSelecionado(e.target.value)}
              >
                {vendedores.length > 0 ? (
                  vendedores.map((v) => (
                    <option key={v.id || v.nome} value={v.nome.toUpperCase()}>
                      {v.nome.toUpperCase()}
                      {v.nivelAcesso ? ` (${v.nivelAcesso})` : ""}
                    </option>
                  ))
                ) : (
                  <option value="EMERSON">EMERSON (EXTERNO)</option>
                )}
              </select>
            </div>

            {/* 2. Seleção de Atendimento */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>
                <Calendar size={14} weight="bold" />
                Dia de Atendimento:
              </label>
              <select
                className={styles.selectFiltro}
                value={atendimento}
                onChange={(e) => setAtendimento(e.target.value)}
              >
                <option value="SEGUNDA">Segunda-feira</option>
                <option value="TERCA">Terça-feira</option>
                <option value="QUARTA">Quarta-feira</option>
                <option value="QUINTA">Quinta-feira</option>
                <option value="SEXTA">Sexta-feira</option>
                <option value="SABADO">Sábado</option>
                <option value="DOMINGO">Domingo</option>
                <option value="TODOS">Todos os dias</option>
              </select>
            </div>

            {/* 3. Data de Referência */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>
                <Calendar size={14} weight="bold" />
                Data de Referência:
              </label>
              <div className={styles.dataFimGroup}>
                <input
                  type="date"
                  className={styles.inputFiltro}
                  value={dataFechamento}
                  onChange={(e) => tratarAlteracaoData(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.botaoHoje}
                  onClick={() =>
                    tratarAlteracaoData(dataFormatadaCalendario(new Date()))
                  }
                  title="Definir para a data de hoje"
                >
                  Hoje
                </button>
              </div>
            </div>

            {/* 4. Status do Fechamento do Vendedor */}
            <div className={styles.filtroGrupoStatus}>
              <span className={styles.filtroLabel}>
                <Coins size={14} weight="bold" />
                Status do Fechamento:
              </span>
              <div className={styles.statusFechamentoContainer}>
                {carregandoFechamento ? (
                  <span className={styles.badgeStatusAberto}>
                    Verificando...
                  </span>
                ) : fechamentoAtual?.status === "fechado" ? (
                  <span className={styles.badgeStatusFechado}>
                    <CheckCircle size={14} weight="fill" />
                    Fechamento Concluído
                  </span>
                ) : (
                  <span className={styles.badgeStatusAberto}>
                    Em Aberto
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── CARDS DE TOTAIS POR FORMA DE PAGAMENTO ── */}
        <section className={styles.gridTotais}>
          {/* Dinheiro */}
          <div className={`${styles.cardTotal} ${styles.cardDinheiro}`}>
            <div className={styles.cardTotalHeader}>
              <span className={styles.cardTotalLabel}>Dinheiro (+/- Ajustes)</span>
              <div className={styles.cardTotalIcone}>
                <Money size={18} weight="bold" />
              </div>
            </div>
            <p className={styles.cardTotalValor}>
              {formatarMoeda(totais.dinheiroFinal)}
            </p>
            <span className={styles.cardTotalSub}>
              Confirmado: {formatarMoeda(totais.dinheiroConfirmado)}
              {totais.ajustesDinheiro !== 0
                ? ` | Ajustes: ${totais.ajustesDinheiro > 0 ? "+" : ""}${formatarMoeda(
                    totais.ajustesDinheiro
                  )}`
                : ""}
              {totais.dinheiroColetado > 0
                ? ` | Coletado: ${formatarMoeda(totais.dinheiroColetado)}`
                : ""}
            </span>
          </div>

          {/* PIX */}
          <div className={`${styles.cardTotal} ${styles.cardPix}`}>
            <div className={styles.cardTotalHeader}>
              <span className={styles.cardTotalLabel}>PIX (+/- Ajustes)</span>
              <div className={styles.cardTotalIcone}>
                <Bank size={18} weight="bold" />
              </div>
            </div>
            <p className={styles.cardTotalValor}>
              {formatarMoeda(totais.pixFinal)}
            </p>
            <span className={styles.cardTotalSub}>
              Confirmado: {formatarMoeda(totais.pixConfirmado)}
              {totais.ajustesPix !== 0
                ? ` | Ajustes: ${totais.ajustesPix > 0 ? "+" : ""}${formatarMoeda(
                    totais.ajustesPix
                  )}`
                : ""}
              {totais.pixColetado > 0
                ? ` | Coletado: ${formatarMoeda(totais.pixColetado)}`
                : ""}
            </span>
          </div>

          {/* Cartões */}
          <div className={`${styles.cardTotal} ${styles.cardCartao}`}>
            <div className={styles.cardTotalHeader}>
              <span className={styles.cardTotalLabel}>Cartões</span>
              <div className={styles.cardTotalIcone}>
                <CreditCard size={18} weight="bold" />
              </div>
            </div>
            <p className={styles.cardTotalValor}>
              {formatarMoeda(totais.cartaoFinal)}
            </p>
            <span className={styles.cardTotalSub}>
              Confirmado: {formatarMoeda(totais.cartaoConfirmado)}
              {totais.ajustesCartao !== 0
                ? ` | Ajustes: ${totais.ajustesCartao > 0 ? "+" : ""}${formatarMoeda(
                    totais.ajustesCartao
                  )}`
                : ""}
              {totais.cartaoColetado > 0
                ? ` | Coletado: ${formatarMoeda(totais.cartaoColetado)}`
                : ""}
            </span>
          </div>

          {/* Cheques */}
          <div className={`${styles.cardTotal} ${styles.cardCheque}`}>
            <div className={styles.cardTotalHeader}>
              <span className={styles.cardTotalLabel}>Cheques</span>
              <div className={styles.cardTotalIcone}>
                <Receipt size={18} weight="bold" />
              </div>
            </div>
            <p className={styles.cardTotalValor}>
              {formatarMoeda(totais.chequeFinal)}
            </p>
            <span className={styles.cardTotalSub}>
              Confirmado: {formatarMoeda(totais.chequeConfirmado)}
              {totais.ajustesCheque !== 0
                ? ` | Ajustes: ${totais.ajustesCheque > 0 ? "+" : ""}${formatarMoeda(
                    totais.ajustesCheque
                  )}`
                : ""}
              {totais.chequeColetado > 0
                ? ` | Coletado: ${formatarMoeda(totais.chequeColetado)}`
                : ""}
            </span>
          </div>

          {/* Vales / A Prazo */}
          <div className={`${styles.cardTotal} ${styles.cardVale}`}>
            <div className={styles.cardTotalHeader}>
              <span className={styles.cardTotalLabel}>Vale / A Prazo</span>
              <div className={styles.cardTotalIcone}>
                <Tag size={18} weight="bold" />
              </div>
            </div>
            <p className={styles.cardTotalValor}>
              {formatarMoeda(totais.valeFinal)}
            </p>
            <span className={styles.cardTotalSub}>
              Confirmado: {formatarMoeda(totais.valeConfirmado)}
              {totais.ajustesVale !== 0
                ? ` | Ajustes: ${totais.ajustesVale > 0 ? "+" : ""}${formatarMoeda(
                    totais.ajustesVale
                  )}`
                : ""}
              {totais.valeColetado > 0
                ? ` | Coletado: ${formatarMoeda(totais.valeColetado)}`
                : ""}
            </span>
          </div>

          {/* Pendências Ativas */}
          <div className={`${styles.cardTotal} ${styles.cardPendenciasTotais}`}>
            <div className={styles.cardTotalHeader}>
              <span className={styles.cardTotalLabel}>Pendências em Aberto</span>
              <div className={styles.cardTotalIcone}>
                <WarningCircle size={18} weight="bold" />
              </div>
            </div>
            <p className={styles.cardTotalValor}>
              {formatarMoeda(totais.totalPendenciasAtivas)}
            </p>
            <span className={styles.cardTotalSub}>
              {pendencias.length} pendência(s) ativa(s)
            </span>
          </div>

          {/* Total Geral de Fechamento */}
          <div className={`${styles.cardTotal} ${styles.cardGeral}`}>
            <div className={styles.cardTotalHeader}>
              <span className={styles.cardTotalLabel}>Total Fechamento</span>
              <div className={styles.cardTotalIcone}>
                <HandCoins size={18} weight="bold" />
              </div>
            </div>
            <p className={styles.cardTotalValor}>
              {formatarMoeda(totais.totalGeral)}
            </p>
            <span className={styles.cardTotalSub}>
              Confirmados: {formatarMoeda(totais.totalConfirmado)}
              {totais.totalAjustes !== 0
                ? ` | Ajustes: ${totais.totalAjustes > 0 ? "+" : ""}${formatarMoeda(
                    totais.totalAjustes
                  )}`
                : ""}
              {totais.totalColetado > 0
                ? ` | Coletado: ${formatarMoeda(totais.totalColetado)}`
                : ""}
            </span>
          </div>
        </section>

        {/* ── GRID PRINCIPAL: 1. ABAS DE PENDÊNCIAS & PAGAMENTOS | 2. AJUSTES | 3. CALCULADORA ── */}
        <div className={styles.conteudoGrid}>
          {/* COLUNA 1: ABAS PENDÊNCIAS / COLETADOS / CONFIRMADOS */}
          <section className={styles.secaoCard}>
            <div className={styles.secaoCardHeader}>
              <div className={styles.abasNavegacao}>
                {/* Aba 1: Pendências Ativas */}
                <button
                  className={`${styles.abaBotao} ${
                    abaAtiva === "pendencias" ? styles.abaBotaoAtiva : ""
                  }`}
                  onClick={() => setAbaAtiva("pendencias")}
                >
                  <WarningCircle size={16} weight="bold" />
                  <span>Pendências Ativas</span>
                  <span className={styles.secaoCardContador}>
                    {pendencias.length}
                  </span>
                </button>

                {/* Aba 2: Pagamentos Coletados */}
                <button
                  className={`${styles.abaBotao} ${
                    abaAtiva === "coletados" ? styles.abaBotaoAtiva : ""
                  }`}
                  onClick={() => setAbaAtiva("coletados")}
                >
                  <Clock size={16} weight="bold" />
                  <span>Pagamentos Coletados</span>
                  <span className={styles.secaoCardContador}>
                    {pagamentosColetados.length}
                  </span>
                </button>

                {/* Aba 3: Pagamentos Confirmados */}
                <button
                  className={`${styles.abaBotao} ${
                    abaAtiva === "confirmados" ? styles.abaBotaoAtiva : ""
                  }`}
                  onClick={() => setAbaAtiva("confirmados")}
                >
                  <CheckCircle size={16} weight="bold" />
                  <span>Pagamentos Confirmados</span>
                  <span className={styles.secaoCardContador}>
                    {pagamentosConfirmados.length}
                  </span>
                </button>
              </div>

            </div>

            {/* Barra de Busca */}
            <div className={styles.barraBuscaFiltro}>
              <div className={styles.inputBuscaWrapper}>
                <MagnifyingGlass
                  size={16}
                  className={styles.inputBuscaIcone}
                  weight="bold"
                />
                <input
                  type="text"
                  placeholder={
                    abaAtiva === "pendencias"
                      ? "Buscar cliente ou #ID da pendência..."
                      : "Buscar cliente ou #ID do pagamento..."
                  }
                  value={buscaTexto}
                  onChange={(e) => setBuscaTexto(e.target.value)}
                  className={styles.inputBusca}
                />
              </div>
            </div>

            {/* ── CONTEÚDO DA ABA 1: PENDÊNCIAS ATIVAS ── */}
            {abaAtiva === "pendencias" && (
              <div className={styles.listaWrapper}>
                {carregando ? (
                  <div className={styles.estadoVazio}>
                    <Spinner />
                    <p>Consultando pendências em aberto...</p>
                  </div>
                ) : pendenciasFiltradas.length === 0 ? (
                  <div className={styles.estadoVazio}>
                    <SealCheck size={36} weight="duotone" color="#2f9e44" />
                    <p>Nenhuma pendência ativa para este vendedor/dia.</p>
                    <span>
                      Todas as pendências estão quitadas ou não existem
                      lançamentos com os filtros aplicados.
                    </span>
                  </div>
                ) : (
                  pendenciasFiltradas.map((pend) => {
                    const pagTodos = pagamentos.filter(
                      (p) => Number(p.pendenciaId) === Number(pend.id)
                    );
                    const pagVinculado =
                      pagTodos.find((p) => p.status !== "cancelado") ||
                      pagTodos[0];

                    const clienteNome =
                      pend.cliente?.nome ||
                      pend.cliente?.nomeFantasia ||
                      pend.nomeCliente ||
                      "Cliente";

                    const saldoNum = obterSaldoPendencia(pend);
                    const valorTotalNum = Number(
                      pend.valorTotal || pend.valor || saldoNum
                    );

                    return (
                      <div key={pend.id} className={styles.itemPendenciaCard}>
                        <div className={styles.pendenciaInfo}>
                          <span className={styles.pendenciaCliente}>
                            #{pend.id} — {clienteNome}
                          </span>
                          <div className={styles.pendenciaDetalhes}>
                            {pend.pedidoId && <span>Ped #{pend.pedidoId}</span>}
                            <span>
                              Atend: {pend.atendimento || atendimento}
                            </span>
                            <span
                              className={`${styles.badgeStatus} ${
                                pend.status === "parcial"
                                  ? styles.badgeParcial
                                  : styles.badgeAberta
                              }`}
                            >
                              {pend.status || "aberta"}
                            </span>

                            {/* Badge do pagamento vinculado */}
                            {pagVinculado && (
                              <span
                                className={`${styles.badgePagamentoVinculado} ${
                                  pagVinculado.status === "coletado"
                                    ? styles.badgeColetadoPendente
                                    : pagVinculado.status === "baixado"
                                    ? styles.badgeBaixadoPendente
                                    : styles.badgeCanceladoPendente
                                }`}
                              >
                                {pagVinculado.status === "coletado"
                                  ? `Coletado (${formatarMoeda(
                                      pagVinculado.valor
                                    )} - ${resolverNomeFormaPagamento(
                                      pagVinculado,
                                      formasPagamento
                                    )})`
                                  : pagVinculado.status === "baixado"
                                  ? `Baixado (${formatarMoeda(
                                      pagVinculado.valor
                                    )} - ${resolverNomeFormaPagamento(
                                      pagVinculado,
                                      formasPagamento
                                    )})`
                                  : `Cancelado (${formatarMoeda(
                                      pagVinculado.valor
                                    )})`}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className={styles.pendenciaValores}>
                          <span className={styles.saldoRestante}>
                            {formatarMoeda(saldoNum)}
                          </span>
                          {valorTotalNum > saldoNum && (
                            <span className={styles.valorOriginal}>
                              Orig: {formatarMoeda(valorTotalNum)}
                            </span>
                          )}
                        </div>

                        {/* Botão 'Gerar pagamento' */}
                        <div className={styles.acoesPendencia}>
                          <button
                            className={styles.btnGerarPagamento}
                            onClick={() => abrirGerarPagamento(pend)}
                            disabled={processandoAcao}
                            title="Gerar pagamento com baixa para esta pendência"
                          >
                            <HandCoins size={14} weight="bold" />
                            <span>Gerar pagamento</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── CONTEÚDO DA ABA 2: PAGAMENTOS COLETADOS ── */}
            {abaAtiva === "coletados" && (
              <div className={styles.listaWrapper}>
                {carregando ? (
                  <div className={styles.estadoVazio}>
                    <Spinner />
                    <p>Consultando pagamentos coletados...</p>
                  </div>
                ) : pagamentosColetadosFiltrados.length === 0 ? (
                  <div className={styles.estadoVazio}>
                    <Clock size={36} weight="duotone" color="#868e96" />
                    <p>
                      Nenhum pagamento coletado para clientes deste vendedor e
                      dia de atendimento.
                    </p>
                    <span>
                      Todos os pagamentos foram baixados ou não existem
                      registros com os filtros aplicados.
                    </span>
                  </div>
                ) : (
                  pagamentosColetadosFiltrados.map((pg) => {
                    const formaNome = resolverNomeFormaPagamento(
                      pg,
                      formasPagamento
                    );

                    const clienteId = Number(
                      pg.pendencia?.clienteId ||
                      pg.clienteId ||
                      pg.cliente?.id
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

                    const usuarioCriador =
                      pg.usuario?.nome ||
                      pg.vendedor ||
                      pg.criadoPor ||
                      "Financeiro";

                    return (
                      <div
                        key={pg.id}
                        className={`${styles.itemPagamentoCard} ${styles.statusColetado}`}
                      >
                        <div className={styles.pagamentoInfo}>
                          <div className={styles.pagamentoHeaderLinha}>
                            <span className={styles.pagamentoId}>
                              #{pg.id}
                            </span>
                            <span className={styles.pagamentoCliente}>
                              {clienteNome}
                            </span>
                            <span className={styles.badgeCriadoPor}>
                              <User size={10} weight="bold" />
                              {usuarioCriador}
                            </span>
                            {clienteInfo?.atendimento && (
                              <span
                                className={styles.badgeCriadoPor}
                                title="Dia de atendimento do cliente"
                              >
                                <Calendar size={10} weight="bold" />
                                Atend: {clienteInfo.atendimento}
                              </span>
                            )}
                            {clienteInfo?.vendedor && (
                              <span
                                className={styles.badgeCriadoPor}
                                title="Vendedor do cliente"
                              >
                                <User size={10} weight="bold" />
                                Vend: {clienteInfo.vendedor}
                              </span>
                            )}
                          </div>

                          <div className={styles.pagamentoMeta}>
                            <span>
                              {formaNome || "Forma não informada"}
                            </span>
                            {pg.pendenciaId && (
                              <span>Ref. Pendência #{pg.pendenciaId}</span>
                            )}
                            {(pg.data || pg.createdAt) && (
                              <span>
                                {new Date(pg.data || pg.createdAt).toLocaleDateString("pt-BR")}{" "}
                                às{" "}
                                {new Date(pg.data || pg.createdAt).toLocaleTimeString(
                                  "pt-BR",
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className={styles.pagamentoValorStatus}>
                          <span className={styles.valorPagamento}>
                            {formatarMoeda(pg.valor)}
                          </span>

                          <span
                            className={`${styles.badgeStatus} ${styles.badgeStatusColetado}`}
                          >
                            coletado
                          </span>
                        </div>

                        {/* Ações Rápidas: Baixado ou Cancelado */}
                        <div className={styles.acoesRapidasPagamento}>
                          <button
                            className={styles.btnAcaoBaixar}
                            onClick={() =>
                              tratarAcaoRapidaPagamento(pg.id, "baixado")
                            }
                            disabled={processandoAcao}
                            title="Confirmar baixa do pagamento"
                          >
                            <Check size={12} weight="bold" />
                            <span>Baixado</span>
                          </button>

                          <AlertaRadix
                            titulo="Cancelar Pagamento?"
                            descricao={`Deseja realmente cancelar o pagamento #${pg.id} de ${formatarMoeda(
                              pg.valor
                            )}?`}
                            tratar={() =>
                              tratarAcaoRapidaPagamento(pg.id, "cancelado")
                            }
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
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── CONTEÚDO DA ABA 3: PAGAMENTOS CONFIRMADOS (STATUS 'BAIXADO') ── */}
            {abaAtiva === "confirmados" && (
              <div className={styles.listaWrapper}>
                {carregando ? (
                  <div className={styles.estadoVazio}>
                    <Spinner />
                    <p>Consultando pagamentos confirmados...</p>
                  </div>
                ) : pagamentosConfirmadosFiltrados.length === 0 ? (
                  <div className={styles.estadoVazio}>
                    <CheckCircle size={36} weight="duotone" color="#868e96" />
                    <p>
                      Nenhum pagamento confirmado em{" "}
                      {dataFechamento
                        ? new Date(dataFechamento + "T12:00:00").toLocaleDateString("pt-BR")
                        : "hoje"}{" "}
                      para o vendedor {vendedorSelecionado}.
                    </p>
                    <span>
                      {pagamentos.some(
                        (p) =>
                          String(p.status || "").toLowerCase().trim() === "baixado"
                      )
                        ? "Existem pagamentos confirmados em outras datas ou para outros vendedores. Verifique a data selecionada no topo da página."
                        : "Nenhum pagamento baixado encontrado no sistema para esta data."}
                    </span>
                  </div>
                ) : (
                  pagamentosConfirmadosFiltrados.map((pg) => {
                    const formaNome = resolverNomeFormaPagamento(
                      pg,
                      formasPagamento
                    );

                    const clienteId = Number(
                      pg.pendencia?.clienteId ||
                      pg.clienteId ||
                      pg.cliente?.id
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

                    const usuarioCriador =
                      pg.usuario?.nome ||
                      pg.vendedor ||
                      pg.criadoPor ||
                      "Financeiro";

                    return (
                      <div
                        key={pg.id}
                        className={`${styles.itemPagamentoCard} ${styles.statusBaixado}`}
                      >
                        <div className={styles.pagamentoInfo}>
                          <div className={styles.pagamentoHeaderLinha}>
                            <span className={styles.pagamentoId}>
                              #{pg.id}
                            </span>
                            <span className={styles.pagamentoCliente}>
                              {clienteNome}
                            </span>
                            <span className={styles.badgeCriadoPor}>
                              <User size={10} weight="bold" />
                              {usuarioCriador}
                            </span>
                            {clienteInfo?.atendimento && (
                              <span
                                className={styles.badgeCriadoPor}
                                title="Dia de atendimento do cliente"
                              >
                                <Calendar size={10} weight="bold" />
                                Atend: {clienteInfo.atendimento}
                              </span>
                            )}
                            {clienteInfo?.vendedor && (
                              <span
                                className={styles.badgeCriadoPor}
                                title="Vendedor do cliente"
                              >
                                <User size={10} weight="bold" />
                                Vend: {clienteInfo.vendedor}
                              </span>
                            )}
                          </div>

                          <div className={styles.pagamentoMeta}>
                            <span>
                              {formaNome || "Forma não informada"}
                            </span>
                            {pg.pendenciaId && (
                              <span>Ref. Pendência #{pg.pendenciaId}</span>
                            )}
                            {(pg.data || pg.createdAt) && (
                              <span>
                                {new Date(pg.data || pg.createdAt).toLocaleDateString("pt-BR")}{" "}
                                às{" "}
                                {new Date(pg.data || pg.createdAt).toLocaleTimeString(
                                  "pt-BR",
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className={styles.pagamentoValorStatus}>
                          <span className={styles.valorPagamento}>
                            {formatarMoeda(pg.valor)}
                          </span>

                          <span
                            className={`${styles.badgeStatus} ${styles.badgeStatusBaixado}`}
                          >
                            baixado
                          </span>
                        </div>

                        {/* Ações Rápidas: Recibo, Cancelar baixa e Cancelar */}
                        <div className={styles.acoesRapidasPagamento}>
                          <button
                            className={styles.btnAcaoRecibo}
                            onClick={() => tratarImprimirReciboPagamento(pg)}
                            title="Imprimir recibo deste pagamento para o cliente"
                          >
                            <Receipt size={12} weight="bold" />
                            <span>Recibo</span>
                          </button>

                          <button
                            className={styles.btnVoltarColetado}
                            onClick={() =>
                              tratarAcaoRapidaPagamento(pg.id, "coletado")
                            }
                            disabled={processandoAcao}
                            title="Cancelar baixa do pagamento"
                          >
                            <ArrowCounterClockwise size={12} weight="bold" />
                            <span>Cancelar baixa</span>
                          </button>

                          <AlertaRadix
                            titulo="Cancelar Pagamento Baixado?"
                            descricao={`Deseja realmente cancelar o pagamento baixado #${pg.id} de ${formatarMoeda(
                              pg.valor
                            )}? O valor será removido do total de fechamento.`}
                            tratar={() =>
                              tratarAcaoRapidaPagamento(pg.id, "cancelado")
                            }
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
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </section>

          {/* COLUNA 2: LANÇAMENTOS E AJUSTES DE ROTA (+ / -) */}
          <section className={styles.secaoCard}>
            <div className={styles.secaoCardHeader}>
              <div className={styles.secaoCardTituloWrapper}>
                <ArrowsLeftRight size={18} weight="bold" color="#1971c2" />
                <h3 className={styles.secaoCardTitulo}>
                  Lançamentos & Ajustes
                </h3>
              </div>
              <span className={styles.secaoCardContador}>
                {ajustes.length}
              </span>
            </div>

            {/* Presets Rápidos */}
            <div className={styles.presetsWrapper}>
              <span className={styles.presetsTitulo}>Atalhos Rápidos:</span>
              <div className={styles.presetsGrid}>
                {PRESETS_AJUSTES.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className={`${styles.btnPreset} ${
                      p.tipo === "adicao"
                        ? styles.btnPresetPositivo
                        : styles.btnPresetNegativo
                    }`}
                    onClick={() => aplicarPresetAjuste(p)}
                  >
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Formulário de Novo Ajuste */}
            <form onSubmit={tratarAdicionarAjuste} className={styles.formAjuste}>
              <div className={styles.formAjusteLinha}>
                <select
                  value={tipoAjuste}
                  onChange={(e) => setTipoAjuste(e.target.value)}
                  className={styles.selectForm}
                >
                  <option value="subtracao">(-) Despesa / Saída</option>
                  <option value="adicao">(+) Entrada / Adição</option>
                </select>

                <input
                  type="text"
                  placeholder="Descrição (ex: Almoço, Troco...)"
                  value={descricaoAjuste}
                  onChange={(e) => setDescricaoAjuste(e.target.value)}
                  className={styles.inputForm}
                />
              </div>

              <div className={styles.formAjusteLinha2}>
                <select
                  value={formaAjuste}
                  onChange={(e) => setFormaAjuste(e.target.value)}
                  className={styles.selectForm}
                >
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="PIX">PIX</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Vale">Vale</option>
                </select>

                <input
                  type="number"
                  step="0.01"
                  placeholder="R$ 0,00"
                  value={valorAjuste}
                  onChange={(e) => setValorAjuste(e.target.value)}
                  className={styles.inputForm}
                  required
                />

                <button type="submit" className={styles.btnAdicionarAjuste}>
                  <Plus size={14} weight="bold" />
                  <span>Lançar</span>
                </button>
              </div>
            </form>

            {/* Lista dos Ajustes Lançados */}
            <div className={styles.listaAjustes}>
              {ajustes.length === 0 ? (
                <p className={styles.semAjustes}>
                  Nenhum ajuste lançado para este fechamento.
                </p>
              ) : (
                ajustes.map((aj) => {
                  const isEntrada =
                    aj.tipo === "adicao" || aj.tipo === "entrada";
                  return (
                    <div
                      key={aj.id}
                      className={`${styles.itemAjuste} ${
                        isEntrada ? styles.itemAjustePos : styles.itemAjusteNeg
                      }`}
                    >
                      <div className={styles.itemAjusteInfo}>
                        <span className={styles.itemAjusteDescricao}>
                          {aj.descricao || aj.categoria}
                        </span>
                        <span className={styles.itemAjusteDetalhe}>
                          {aj.formaPagamento} • {aj.hora}
                        </span>
                      </div>

                      <div className={styles.itemAjusteValorAcoes}>
                        <span
                          className={
                            isEntrada
                              ? styles.itemAjusteValorPos
                              : styles.itemAjusteValorNeg
                          }
                        >
                          {isEntrada ? "+" : "-"}
                          {formatarMoeda(aj.valor)}
                        </span>
                        <button
                          type="button"
                          className={styles.btnRemoverAjuste}
                          onClick={() => tratarRemoverAjuste(aj.id)}
                          title="Remover ajuste"
                        >
                          <Trash size={14} weight="bold" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* COLUNA 3: CALCULADORA DE CÉDULAS (CONFERÊNCIA FÍSICA) */}
          <section className={styles.secaoCard}>
            <div className={styles.secaoCardHeader}>
              <div className={styles.secaoCardTituloWrapper}>
                <Calculator size={18} weight="bold" color="#2f9e44" />
                <h3 className={styles.secaoCardTitulo}>Cédulas</h3>
              </div>
              <AlertaRadix
                titulo="Limpar contagem de notas?"
                descricao="Deseja zerar todos os campos da calculadora de cédulas?"
                tratar={limparCalculadoraCedulas}
                confirmarTexto="Limpar"
                cancelarTexto="Voltar"
                trigger={
                  <button
                    type="button"
                    className={styles.btnLimparContador}
                    title="Zerar calculadora"
                  >
                    <ArrowCounterClockwise size={12} weight="bold" />
                    <span>Limpar</span>
                  </button>
                }
              />
            </div>

            <div className={styles.contadorTabela}>
              <div className={styles.tabelaNotasHeader}>
                <span>Qtd</span>
                <span>Nota</span>
                <span style={{ textAlign: "right" }}>Subtotal</span>
              </div>

              {/* R$ 200 */}
              <div className={styles.itemNotaRow}>
                <input
                  type="number"
                  min="0"
                  className={styles.inputNotaQtd}
                  value={duzentos || ""}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setDuzentos(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  onKeyDown={(e) => e.key === "Enter" && inputCemRef.current?.focus()}
                />
                <span className={styles.notaRotulo}>R$ 200,00</span>
                <span className={styles.notaSubtotal}>
                  {formatarMoeda(duzentos * 200)}
                </span>
              </div>

              {/* R$ 100 */}
              <div className={styles.itemNotaRow}>
                <input
                  ref={inputCemRef}
                  type="number"
                  min="0"
                  className={styles.inputNotaQtd}
                  value={cem || ""}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setCem(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  onKeyDown={(e) => e.key === "Enter" && inputCinquentaRef.current?.focus()}
                />
                <span className={styles.notaRotulo}>R$ 100,00</span>
                <span className={styles.notaSubtotal}>
                  {formatarMoeda(cem * 100)}
                </span>
              </div>

              {/* R$ 50 */}
              <div className={styles.itemNotaRow}>
                <input
                  ref={inputCinquentaRef}
                  type="number"
                  min="0"
                  className={styles.inputNotaQtd}
                  value={cinquenta || ""}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setCinquenta(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  onKeyDown={(e) => e.key === "Enter" && inputVinteRef.current?.focus()}
                />
                <span className={styles.notaRotulo}>R$ 50,00</span>
                <span className={styles.notaSubtotal}>
                  {formatarMoeda(cinquenta * 50)}
                </span>
              </div>

              {/* R$ 20 */}
              <div className={styles.itemNotaRow}>
                <input
                  ref={inputVinteRef}
                  type="number"
                  min="0"
                  className={styles.inputNotaQtd}
                  value={vinte || ""}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setVinte(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  onKeyDown={(e) => e.key === "Enter" && inputDezRef.current?.focus()}
                />
                <span className={styles.notaRotulo}>R$ 20,00</span>
                <span className={styles.notaSubtotal}>
                  {formatarMoeda(vinte * 20)}
                </span>
              </div>

              {/* R$ 10 */}
              <div className={styles.itemNotaRow}>
                <input
                  ref={inputDezRef}
                  type="number"
                  min="0"
                  className={styles.inputNotaQtd}
                  value={dez || ""}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setDez(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  onKeyDown={(e) => e.key === "Enter" && inputCincoRef.current?.focus()}
                />
                <span className={styles.notaRotulo}>R$ 10,00</span>
                <span className={styles.notaSubtotal}>
                  {formatarMoeda(dez * 10)}
                </span>
              </div>

              {/* R$ 5 */}
              <div className={styles.itemNotaRow}>
                <input
                  ref={inputCincoRef}
                  type="number"
                  min="0"
                  className={styles.inputNotaQtd}
                  value={cinco || ""}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setCinco(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  onKeyDown={(e) => e.key === "Enter" && inputDoisRef.current?.focus()}
                />
                <span className={styles.notaRotulo}>R$ 5,00</span>
                <span className={styles.notaSubtotal}>
                  {formatarMoeda(cinco * 5)}
                </span>
              </div>

              {/* R$ 2 */}
              <div className={styles.itemNotaRow}>
                <input
                  ref={inputDoisRef}
                  type="number"
                  min="0"
                  className={styles.inputNotaQtd}
                  value={dois || ""}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setDois(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                />
                <span className={styles.notaRotulo}>R$ 2,00</span>
                <span className={styles.notaSubtotal}>
                  {formatarMoeda(dois * 2)}
                </span>
              </div>
            </div>

            {/* Resumo da Conferência */}
            <div className={styles.contadorResumoBloco}>
              <div className={styles.contadorResumoLinha}>
                <span>Total Físico Contado ({contagemCedulas.totalNotas} notas):</span>
                <strong>{formatarMoeda(contagemCedulas.totalContado)}</strong>
              </div>
              <div className={styles.contadorResumoLinha}>
                <span>Dinheiro Esperado em Caixa:</span>
                <strong>{formatarMoeda(totais.dinheiroFinal)}</strong>
              </div>

              <div
                className={`${styles.contadorDiferencaBadge} ${
                  Math.abs(contagemCedulas.diferenca) < 0.01
                    ? styles.diferencaExato
                    : contagemCedulas.diferenca > 0
                    ? styles.diferencaSobra
                    : styles.diferencaFalta
                }`}
              >
                {Math.abs(contagemCedulas.diferenca) < 0.01
                  ? "✓ Valores Físico e Esperado Batem! (R$ 0,00)"
                  : contagemCedulas.diferenca > 0
                  ? `Sobra de Caixa: +${formatarMoeda(contagemCedulas.diferenca)}`
                  : `Falta no Caixa: ${formatarMoeda(contagemCedulas.diferenca)}`}
              </div>
            </div>
          </section>
        </div>

        {/* ── BARRA FIXA DE AÇÃO NO RODAPÉ COM RESUMO CONFORME FORMA DE PAGAMENTO ── */}
        <div className={styles.barraAcaoFixa}>
          <div className={styles.barraAcaoResumo}>
            <div className={styles.barraAcaoItem}>
              <span>Dinheiro</span>
              <strong style={{ color: "#2b8a3e" }}>
                {formatarMoeda(totais.dinheiroFinal)}
              </strong>
            </div>

            <div className={styles.barraAcaoItem}>
              <span>PIX</span>
              <strong style={{ color: "#0ca678" }}>
                {formatarMoeda(totais.pixFinal)}
              </strong>
            </div>

            <div className={styles.barraAcaoItem}>
              <span>Cartões</span>
              <strong style={{ color: "#1971c2" }}>
                {formatarMoeda(totais.cartaoFinal)}
              </strong>
            </div>

            <div className={styles.barraAcaoItem}>
              <span>Cheques</span>
              <strong style={{ color: "#7048e8" }}>
                {formatarMoeda(totais.chequeFinal)}
              </strong>
            </div>

            <div className={styles.barraAcaoItem}>
              <span>Vales</span>
              <strong style={{ color: "#f59f00" }}>
                {formatarMoeda(totais.valeFinal)}
              </strong>
            </div>

            <div className={styles.barraAcaoItem}>
              <span>Total Fechamento</span>
              <strong style={{ color: "#1a1f2e", fontSize: "18px" }}>
                {formatarMoeda(totais.totalGeral)}
              </strong>
            </div>
          </div>

          <div className={styles.barraAcaoBotoes}>
            {fechamentoAtual?.status === "fechado" && (
              <span className={styles.badgeFechamentoConcluido}>
                <CheckCircle size={15} weight="fill" />
                Fechamento Concluído
              </span>
            )}

            <button
              className={styles.btnImprimirFechamento}
              onClick={tratarImprimirFechamento}
              title="Imprimir cupom térmico da prestação de contas"
            >
              <Printer size={16} weight="bold" />
              <span>Imprimir</span>
            </button>

            <AlertaRadix
              titulo={
                fechamentoAtual?.status === "fechado"
                  ? "Atualizar Prestação de Contas?"
                  : "Concluir Prestação de Contas?"
              }
              descricao={
                fechamentoAtual?.status === "fechado"
                  ? `Confirma a atualização do fechamento de ${vendedorSelecionado} para a data ${dataFechamento}? O total contabilizado em dinheiro será de ${formatarMoeda(
                      contagemCedulas.totalContado
                    )} e a diferença será de ${formatarMoeda(
                      contagemCedulas.diferenca
                    )}.`
                  : `Confirma a conclusão do fechamento de ${vendedorSelecionado} no valor total de ${formatarMoeda(
                      totais.totalGeral
                    )}?`
              }
              tratar={tratarConcluirFechamento}
              confirmarTexto={
                fechamentoAtual?.status === "fechado" ? "Atualizar" : "Concluir"
              }
              cancelarTexto="Voltar"
              trigger={
                <button
                  className={
                    fechamentoAtual?.status === "fechado"
                      ? `${styles.btnConcluirFechamento} ${styles.btnFechamentoAtualizar}`
                      : styles.btnConcluirFechamento
                  }
                  disabled={processandoAcao}
                >
                  <CheckCircle size={18} weight="bold" />
                  <span>
                    {fechamentoAtual?.status === "fechado"
                      ? "Atualizar Fechamento"
                      : "Concluir Fechamento"}
                  </span>
                </button>
              }
            />
          </div>
        </div>

        {/* ── MODAL DE 'GERAR PAGAMENTO' DA PENDÊNCIA (STATUS FIXO 'BAIXADO') ── */}
        {pendenciaParaGerarPagamento && (
          <div
            className={styles.modalOverlay}
            onClick={() => setPendenciaParaGerarPagamento(null)}
          >
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <div>
                  <p className={styles.modalSubtitulo}>
                    Pendência #{pendenciaParaGerarPagamento.id}
                  </p>
                  <h3 className={styles.modalTitulo}>Gerar Pagamento</h3>
                </div>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setPendenciaParaGerarPagamento(null)}
                  title="Fechar"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              <form onSubmit={tratarSalvarPagamentoPendencia}>
                <div className={styles.modalBody}>
                  {/* Informações da pendência */}
                  <div className={styles.modalInfoDestaque}>
                    <div className={styles.modalInfoDestaqueItem}>
                      <span>Cliente:</span>
                      <strong>
                        {pendenciaParaGerarPagamento.cliente?.nome ||
                          pendenciaParaGerarPagamento.cliente?.nomeFantasia ||
                          pendenciaParaGerarPagamento.nomeCliente ||
                          "Cliente"}
                      </strong>
                    </div>
                    <div
                      className={styles.modalInfoDestaqueItem}
                      style={{ textAlign: "right" }}
                    >
                      <span>Saldo em Aberto:</span>
                      <strong style={{ color: "#c92a2a" }}>
                        {formatarMoeda(
                          obterSaldoPendencia(pendenciaParaGerarPagamento)
                        )}
                      </strong>
                    </div>
                  </div>

                  {/* Valor do Pagamento */}
                  <div className={styles.divInputModal}>
                    <label>Valor do Pagamento (R$):</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0,00"
                      className={styles.inputModal}
                      value={formGerarPagamento.valor}
                      onChange={(e) =>
                        setFormGerarPagamento({
                          ...formGerarPagamento,
                          valor: e.target.value,
                        })
                      }
                      autoFocus
                    />
                  </div>

                  {/* Forma de Pagamento */}
                  <div className={styles.divInputModal}>
                    <label>Forma de Pagamento:</label>
                    <select
                      className={styles.selectModal}
                      value={formGerarPagamento.formaPagamentoId}
                      onChange={(e) =>
                        setFormGerarPagamento({
                          ...formGerarPagamento,
                          formaPagamentoId: e.target.value,
                        })
                      }
                    >
                      {formasPagamento.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Observação (Opcional) */}
                  <div className={styles.divInputModal}>
                    <label>Observação (Opcional):</label>
                    <input
                      type="text"
                      placeholder="Ex: Recebido em dinheiro / rota..."
                      className={styles.inputModal}
                      value={formGerarPagamento.observacao}
                      onChange={(e) =>
                        setFormGerarPagamento({
                          ...formGerarPagamento,
                          observacao: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    className={styles.btnCancelarModal}
                    onClick={() => setPendenciaParaGerarPagamento(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={styles.btnSalvarModal}
                    disabled={processandoAcao}
                  >
                    <Check size={16} weight="bold" />
                    <span>Confirmar e Baixar</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


      </main>

      <Rodape />
      <ToastRadix mensagem={mensagem} />
    </div>
  );
}

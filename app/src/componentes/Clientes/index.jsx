import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./styles.module.css";
import { LerClienteDelivery } from "../../operadores/API/cliente/lerClienteDelivery";
import { StatusClienteDelivery } from "../../operadores/API/cliente/statusClienteDelivery";
import { LerClienteExterno } from "../../operadores/API/cliente/lerClienteExterno";
import { StatusClienteExterno } from "../../operadores/API/cliente/statusClienteExterno";
import { formatarMoeda } from "../../utils/formartarMoeda";
import {
  MagnifyingGlass,
  ArrowClockwise,
  Users,
  Moped,
  Buildings,
  CheckCircle,
  XCircle,
  ArrowRight,
  MapPin,
  PlusCircle,
  PencilSimple,
  EyeSlash,
  Eye,
  WhatsappLogo,
  ArrowsClockwise,
  WarningCircle,
  CurrencyCircleDollar,
  FileXls,
  ChartLineUp,
} from "@phosphor-icons/react";
import { AlertaRadix } from "../ui/alerta/alerta";
import { usarToast } from "../Context/toastContext";
import ModalClienteDelivery from "../ModalClienteDelivery";
import ModalClienteExterno from "../ModalClienteExterno";
import {
  exportarClientesExternosExcel,
  exportarClientesDeliveryExcel,
} from "../../utils/exportarClientesExcel";

// Função para formatar telefone amigável
const formatarTelefoneVisual = (telefone) => {
  const digitos = String(telefone || "").replace(/\D/g, "");
  if (!digitos) return "—";
  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }
  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return telefone;
};

// Formatação visual amigável para CNPJ ou CPF
const formatarDocumentoVisual = (doc) => {
  const digitos = String(doc || "").replace(/\D/g, "");
  if (!digitos) return "—";
  if (digitos.length === 11) {
    return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
  }
  if (digitos.length === 14) {
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12)}`;
  }
  return doc;
};

export default function ListaCliente() {
  const navegar = useNavigate();
  const { setMensagem } = usarToast();

  const [opcao, setOpcao] = useState("delivery"); // Inicia no setor de Clientes Delivery
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [busca, setBusca] = useState("");

  // Filtros avançados para Clientes Delivery
  const [filtroStatus, setFiltroStatus] = useState("ativo"); // 'ativo' | 'inativo' | 'todos'
  const [filtroBairro, setFiltroBairro] = useState("");
  const [filtroCidade, setFiltroCidade] = useState("");

  // Filtros avançados para Clientes Externos
  const [filtroStatusExterno, setFiltroStatusExterno] = useState("ativo"); // 'ativo' | 'inativo' | 'todos'
  const [filtroVendedorExterno, setFiltroVendedorExterno] = useState("");
  const [filtroAtendimentoExterno, setFiltroAtendimentoExterno] = useState("");
  const [filtroPendenciaExterno, setFiltroPendenciaExterno] = useState("todos"); // 'todos' | 'com_pendencia' | 'sem_pendencia'

  // Estados do Modal de Cliente Delivery
  const [modalDeliveryAberto, setModalDeliveryAberto] = useState(false);
  const [clienteEmEdicao, setClienteEmEdicao] = useState(null);

  // Estados do Modal de Cliente Externo
  const [modalExternoAberto, setModalExternoAberto] = useState(false);
  const [clienteExternoEmEdicao, setClienteExternoEmEdicao] = useState(null);
' '
  // Contadores para os dois cards de setores
  const [totalExterno, setTotalExterno] = useState(null);
  const [totalDelivery, setTotalDelivery] = useState(null);

  function abrirLinkExterno(url) {
    if (window.LINK && window.LINK.abrirLinkExterno && url) {
      window.LINK.abrirLinkExterno(url);
    } else if (url) {
      window.open(url, "_blank");
    }
  }

  // Atalho direto para conversa no WhatsApp
  const tratarAbrirWhatsApp = (telefone) => {
    const limpo = String(telefone || "").replace(/\D/g, "");
    if (!limpo) {
      setMensagem("Este cliente não possui telefone válido cadastrado.");
      return;
    }
    const ddi = limpo.startsWith("55") ? limpo : `55${limpo}`;
    const url = `https://wa.me/${ddi}`;
    abrirLinkExterno(url);
  };

  // Navega para o relatório de compras e desempenho do cliente
  const tratarAbrirRelatorioCliente = (cliente, setor) => {
    navegar("/relatorio-cliente", {
      state: {
        cliente: {
          ...cliente,
          _setorOriginal: setor,
        },
      },
    });
  };

  // Busca clientes do setor selecionado com parâmetros
  const buscarClientesSetor = useCallback(async () => {
    setCarregando(true);
    try {
      if (opcao === "delivery") {
        const parametros = {};
        if (filtroStatus) parametros.status = filtroStatus;
        if (filtroBairro) parametros.bairro = filtroBairro;
        if (filtroCidade) parametros.cidade = filtroCidade;

        const dados = await LerClienteDelivery(parametros);
        const lista = Array.isArray(dados) ? dados : [];
        setClientes(lista);
        setTotalDelivery(lista.length);
      } else {
        const parametros = {};
        if (filtroStatusExterno) parametros.status = filtroStatusExterno;
        if (filtroVendedorExterno) parametros.vendedor = filtroVendedorExterno;
        if (filtroAtendimentoExterno)
          parametros.atendimento = filtroAtendimentoExterno;

        const dados = await LerClienteExterno(parametros);
        const lista = Array.isArray(dados)
          ? dados
          : Array.isArray(dados?.resultado)
          ? dados.resultado
          : Array.isArray(dados?.clientes)
          ? dados.clientes
          : [];
        setClientes(lista);
        setTotalExterno(lista.length);
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      setClientes([]);
      setMensagem(error.message || "Erro ao consultar a lista de clientes");
    } finally {
      setCarregando(false);
    }
  }, [
    opcao,
    filtroStatus,
    filtroBairro,
    filtroCidade,
    filtroStatusExterno,
    filtroVendedorExterno,
    filtroAtendimentoExterno,
    setMensagem,
  ]);

  // Carrega contagens iniciais dos dois setores em segundo plano
  useEffect(() => {
    let ativo = true;
    const carregarTotaisIniciais = async () => {
      try {
        if (totalExterno === null && opcao !== "externo") {
          const ext = await LerClienteExterno({ status: "todos" });
          const listaExt = Array.isArray(ext)
            ? ext
            : Array.isArray(ext?.resultado)
            ? ext.resultado
            : Array.isArray(ext?.clientes)
            ? ext.clientes
            : [];
          if (ativo) setTotalExterno(listaExt.length);
        }
        if (totalDelivery === null && opcao !== "delivery") {
          const del = await LerClienteDelivery({ status: "todos" });
          if (ativo && Array.isArray(del)) setTotalDelivery(del.length);
        }
      } catch (err) {
        // silencioso
      }
    };
    carregarTotaisIniciais();
    return () => {
      ativo = false;
    };
  }, [opcao, totalExterno, totalDelivery]);

  // Carrega clientes ao mudar de setor ou filtros
  useEffect(() => {
    buscarClientesSetor();
  }, [buscarClientesSetor]);

  // Listas dinâmicas de bairros e cidades para filtros de delivery
  const listaBairros = useMemo(() => {
    if (opcao !== "delivery" || !Array.isArray(clientes)) return [];
    const set = new Set();
    clientes.forEach((c) => {
      if (c.bairro && String(c.bairro).trim()) {
        set.add(String(c.bairro).trim().toUpperCase());
      }
    });
    return Array.from(set).sort();
  }, [clientes, opcao]);

  const listaCidades = useMemo(() => {
    if (opcao !== "delivery" || !Array.isArray(clientes)) return [];
    const set = new Set();
    clientes.forEach((c) => {
      if (c.cidade && String(c.cidade).trim()) {
        set.add(String(c.cidade).trim().toUpperCase());
      }
    });
    return Array.from(set).sort();
  }, [clientes, opcao]);

  // Listas dinâmicas de vendedores e cidades para clientes externos
  const listaVendedoresExterno = useMemo(() => {
    if (opcao !== "externo" || !Array.isArray(clientes)) return [];
    const set = new Set();
    clientes.forEach((c) => {
      if (c.vendedor && String(c.vendedor).trim()) {
        set.add(String(c.vendedor).trim().toUpperCase());
      }
    });
    return Array.from(set).sort();
  }, [clientes, opcao]);

  // Filtro de retorno em memória para digitação instantânea
  const clientesFiltrados = useMemo(() => {
    if (!Array.isArray(clientes)) return [];
    let resultado = clientes;

    if (busca.trim()) {
      const termo = busca.trim().toLowerCase();
      resultado = resultado.filter((c) => {
        const idMatch = String(c.id || "").toLowerCase().includes(termo);
        const nomeMatch = String(c.nome || "").toLowerCase().includes(termo);
        const telMatch = String(c.telefone || "")
          .replace(/\D/g, "")
          .includes(termo.replace(/\D/g, ""));
        const endMatch = String(c.endereco || "").toLowerCase().includes(termo);
        const bairroMatch = String(c.bairro || "").toLowerCase().includes(termo);
        const cidadeMatch = String(c.cidade || "").toLowerCase().includes(termo);
        const refMatch = String(c.referencia || "").toLowerCase().includes(termo);
        const cnpjMatch = String(c.cnpj || "").toLowerCase().includes(termo);
        const vendMatch = String(c.vendedor || "").toLowerCase().includes(termo);
        const atendMatch = String(c.atendimento || "").toLowerCase().includes(termo);

        return (
          idMatch ||
          nomeMatch ||
          telMatch ||
          endMatch ||
          bairroMatch ||
          cidadeMatch ||
          refMatch ||
          cnpjMatch ||
          vendMatch ||
          atendMatch
        );
      });
    }

    // Filtros adicionais locais para delivery (caso API retorne todos)
    if (opcao === "delivery") {
      if (filtroStatus && filtroStatus !== "todos") {
        resultado = resultado.filter(
          (c) => (c.status || "ativo") === filtroStatus,
        );
      }
      if (filtroBairro) {
        resultado = resultado.filter(
          (c) =>
            String(c.bairro || "").trim().toUpperCase() ===
            filtroBairro.toUpperCase(),
        );
      }
      if (filtroCidade) {
        resultado = resultado.filter(
          (c) =>
            String(c.cidade || "").trim().toUpperCase() ===
            filtroCidade.toUpperCase(),
        );
      }
    }

    // Filtros adicionais locais para clientes externos
    if (opcao === "externo") {
      if (filtroStatusExterno && filtroStatusExterno !== "todos") {
        resultado = resultado.filter(
          (c) => (c.status || "ativo") === filtroStatusExterno,
        );
      }
      if (filtroVendedorExterno) {
        resultado = resultado.filter(
          (c) =>
            String(c.vendedor || "").trim().toUpperCase() ===
            filtroVendedorExterno.toUpperCase(),
        );
      }
      if (filtroAtendimentoExterno) {
        resultado = resultado.filter(
          (c) =>
            String(c.atendimento || "").trim().toUpperCase() ===
            filtroAtendimentoExterno.toUpperCase(),
        );
      }
      if (filtroPendenciaExterno === "com_pendencia") {
        resultado = resultado.filter(
          (c) => c.temPendencia || Number(c.totalPendencia || 0) > 0,
        );
      } else if (filtroPendenciaExterno === "sem_pendencia") {
        resultado = resultado.filter(
          (c) => !c.temPendencia && Number(c.totalPendencia || 0) <= 0,
        );
      }
    }

    return resultado;
  }, [
    clientes,
    busca,
    opcao,
    filtroStatus,
    filtroBairro,
    filtroCidade,
    filtroStatusExterno,
    filtroVendedorExterno,
    filtroAtendimentoExterno,
    filtroPendenciaExterno,
  ]);

  // Contadores para os badges de delivery
  const contadoresDelivery = useMemo(() => {
    if (opcao !== "delivery") return null;
    const total = clientesFiltrados.length;
    const ativos = clientesFiltrados.filter(
      (c) => (c.status || "ativo") === "ativo",
    ).length;
    const inativos = total - ativos;
    return { total, ativos, inativos };
  }, [clientesFiltrados, opcao]);

  // Contadores para os badges de clientes externos
  const contadoresExterno = useMemo(() => {
    if (opcao !== "externo") return null;
    const total = clientesFiltrados.length;
    const ativos = clientesFiltrados.filter(
      (c) => (c.status || "ativo") === "ativo",
    ).length;
    const inativos = total - ativos;
    const comPendencia = clientesFiltrados.filter(
      (c) => c.temPendencia || Number(c.totalPendencia || 0) > 0,
    ).length;
    return { total, ativos, inativos, comPendencia };
  }, [clientesFiltrados, opcao]);

  // Soft Delete: Inativar ou Reativar Cliente Delivery
  const tratarAlternarStatusDelivery = async (cliente) => {
    const novoStatus = cliente.status === "inativo" ? "ativo" : "inativo";
    try {
      const resposta = await StatusClienteDelivery(cliente.id, novoStatus);
      setMensagem(
        resposta?.mensagem ||
          `Cliente "${cliente.nome}" agora está ${novoStatus}!`,
      );
      buscarClientesSetor();
    } catch (error) {
      console.error("Erro ao alterar status do cliente delivery:", error);
      setMensagem(error.message || "Erro ao alterar o status do cliente");
    }
  };

  // Soft Delete: Inativar ou Reativar Cliente Externo
  const tratarAlternarStatusExterno = async (cliente) => {
    const novoStatus = cliente.status === "inativo" ? "ativo" : "inativo";
    try {
      const resposta = await StatusClienteExterno(cliente.id, novoStatus);
      setMensagem(
        resposta?.mensagem ||
          `Cliente externo "${cliente.nome}" agora está ${novoStatus}!`,
      );
      buscarClientesSetor();
    } catch (error) {
      console.error("Erro ao alterar status do cliente externo:", error);
      setMensagem(error.message || "Erro ao alterar o status do cliente");
    }
  };

  // Abrir modal para novo cliente delivery
  const tratarAbrirModalNovo = () => {
    setClienteEmEdicao(null);
    setModalDeliveryAberto(true);
  };

  // Abrir modal para edição de cliente delivery
  const tratarAbrirModalEditar = (cliente) => {
    setClienteEmEdicao(cliente);
    setModalDeliveryAberto(true);
  };

  // Abrir modal para novo cliente externo
  const tratarAbrirModalNovoExterno = () => {
    setClienteExternoEmEdicao(null);
    setModalExternoAberto(true);
  };

  // Abrir modal para edição de cliente externo
  const tratarAbrirModalEditarExterno = (cliente) => {
    setClienteExternoEmEdicao(cliente);
    setModalExternoAberto(true);
  };

  // Limpar filtros de busca
  const tratarLimparFiltros = () => {
    setBusca("");
    if (opcao === "delivery") {
      setFiltroStatus("ativo");
      setFiltroBairro("");
      setFiltroCidade("");
    } else {
      setFiltroStatusExterno("ativo");
      setFiltroVendedorExterno("");
      setFiltroAtendimentoExterno("");
      setFiltroPendenciaExterno("todos");
    }
  };

  // Exportar clientes filtrados para planilha Excel
  const tratarExportarExcel = () => {
    try {
      if (!clientesFiltrados || clientesFiltrados.length === 0) {
        setMensagem(
          `Nenhum cliente ${
            isExterno ? "externo" : "delivery"
          } para exportar com os filtros atuais.`,
        );
        return;
      }

      if (isExterno) {
        const res = exportarClientesExternosExcel(clientesFiltrados, {
          vendedor: filtroVendedorExterno,
          status: filtroStatusExterno,
        });
        setMensagem(
          `Exportados ${res.quantidade} clientes externos para "${res.nomeArquivo}" com sucesso!`,
        );
      } else {
        const res = exportarClientesDeliveryExcel(clientesFiltrados, {
          bairro: filtroBairro,
          cidade: filtroCidade,
          status: filtroStatus,
        });
        setMensagem(
          `Exportados ${res.quantidade} clientes delivery para "${res.nomeArquivo}" com sucesso!`,
        );
      }
    } catch (error) {
      console.error("Erro ao exportar clientes para Excel:", error);
      setMensagem(error.message || "Erro ao gerar planilha de clientes.");
    }
  };

  const isExterno = opcao === "externo";
  const temFiltroAtivo =
    busca ||
    (opcao === "delivery" &&
      (filtroStatus !== "ativo" ||
        filtroBairro !== "" ||
        filtroCidade !== "")) ||
    (opcao === "externo" &&
      (filtroStatusExterno !== "ativo" ||
        filtroVendedorExterno !== "" ||
        filtroAtendimentoExterno !== "" ||
        filtroPendenciaExterno !== "todos"));

  return (
    <div className={styles.container}>
      {/* ── 2 CARDS DE SELEÇÃO: CLIENTES EXTERNOS & CLIENTES DELIVERY ── */}
      <div className={styles.gridCardsSetores}>
        {/* CARD 1: CLIENTES EXTERNOS */}
        <button
          type="button"
          className={`${styles.cardSetor} ${styles.externo} ${
            isExterno ? styles.ativo : ""
          }`}
          onClick={() => {
            setOpcao("externo");
            setBusca("");
          }}
          title="Clique para gerenciar clientes de vendas externas"
        >
          <div className={styles.cardHeaderInfo}>
            <div className={styles.cardCorpoEsquerdo}>
              <div className={`${styles.cardIconeWrapper} ${styles.externo}`}>
                <Buildings size={28} weight="fill" />
              </div>
              <div className={styles.cardTextos}>
                <span className={styles.cardSubtitulo}>Vendas Externas</span>
                <h2 className={styles.cardTitulo}>Clientes Externos</h2>
              </div>
            </div>

            {isExterno ? (
              <span className={`${styles.badgeAtivo} ${styles.externo}`}>
                <CheckCircle size={14} weight="fill" />
                Ativo
              </span>
            ) : (
              <span className={styles.badgeInativo}>Alternar</span>
            )}
          </div>

          <p className={styles.cardDescricao}>
            Base comercial com CNPJ, rotas, vendedor responsável, frequência de
            atendimento e controle de pendências financeiras.
          </p>

          <div className={styles.cardRodape}>
            <span className={styles.cardContador}>
              <Users size={15} weight="bold" />
              {totalExterno !== null
                ? `${totalExterno} clientes cadastrados`
                : "Carregando total..."}
            </span>
            <span className={styles.cardAcaoIndicador}>
              {isExterno ? "Visualizando" : "Selecionar"}
              <ArrowRight size={14} weight="bold" />
            </span>
          </div>
        </button>

        {/* CARD 2: CLIENTES DELIVERY */}
        <button
          type="button"
          className={`${styles.cardSetor} ${styles.delivery} ${
            !isExterno ? styles.ativo : ""
          }`}
          onClick={() => {
            setOpcao("delivery");
            setBusca("");
          }}
          title="Clique para gerenciar clientes atendidos via delivery"
        >
          <div className={styles.cardHeaderInfo}>
            <div className={styles.cardCorpoEsquerdo}>
              <div className={`${styles.cardIconeWrapper} ${styles.delivery}`}>
                <Moped size={28} weight="fill" />
              </div>
              <div className={styles.cardTextos}>
                <span className={styles.cardSubtitulo}>Entregas & Balcão</span>
                <h2 className={styles.cardTitulo}>Clientes Delivery</h2>
              </div>
            </div>

            {!isExterno ? (
              <span className={`${styles.badgeAtivo} ${styles.delivery}`}>
                <CheckCircle size={14} weight="fill" />
                Ativo
              </span>
            ) : (
              <span className={styles.badgeInativo}>Alternar</span>
            )}
          </div>

          <p className={styles.cardDescricao}>
            Base residencial e comercial com telefones, endereços completos,
            bairros e referências para entregas locais.
          </p>

          <div className={styles.cardRodape}>
            <span className={styles.cardContador}>
              <MapPin size={15} weight="bold" />
              {totalDelivery !== null
                ? `${totalDelivery} clientes cadastrados`
                : "Carregando total..."}
            </span>
            <span className={styles.cardAcaoIndicador}>
              {!isExterno ? "Visualizando" : "Selecionar"}
              <ArrowRight size={14} weight="bold" />
            </span>
          </div>
        </button>
      </div>

      {/* ── BARRA SUPERIOR: RESUMO E AÇÕES ── */}
      <div className={styles.barraSuperior}>
        <div className={styles.resumoBadges}>
          <span className={styles.badgeGeral}>
            <Users size={15} weight="bold" />
            {isExterno
              ? `${contadoresExterno?.total ?? clientesFiltrados.length} clientes externos`
              : `${contadoresDelivery?.total ?? clientesFiltrados.length} clientes delivery`}
          </span>

          {isExterno && contadoresExterno && (
            <>
              <span className={styles.badgeAtivos}>
                <CheckCircle size={14} weight="fill" />
                {contadoresExterno.ativos} ativos
              </span>
              {contadoresExterno.inativos > 0 && (
                <span className={styles.badgeInativos}>
                  <XCircle size={14} weight="fill" />
                  {contadoresExterno.inativos} inativos
                </span>
              )}
              {contadoresExterno.comPendencia > 0 && (
                <span className={styles.badgePendenciasTopo}>
                  <WarningCircle size={14} weight="bold" />
                  {contadoresExterno.comPendencia} com pendência
                </span>
              )}
            </>
          )}

          {!isExterno && contadoresDelivery && (
            <>
              <span className={styles.badgeAtivos}>
                <CheckCircle size={14} weight="fill" />
                {contadoresDelivery.ativos} ativos
              </span>
              {contadoresDelivery.inativos > 0 && (
                <span className={styles.badgeInativos}>
                  <XCircle size={14} weight="fill" />
                  {contadoresDelivery.inativos} inativos
                </span>
              )}
            </>
          )}
        </div>

        <div className={styles.acoesSuperiores}>
          {/* Botão + Novo Cliente Externo para Clientes Externos */}
          {isExterno && (
            <button
              className={styles.botaoNovoClienteExterno}
              onClick={tratarAbrirModalNovoExterno}
            >
              <PlusCircle size={18} weight="bold" />
              Novo Cliente Externo
            </button>
          )}

          {/* Botão + Novo Cliente Delivery exclusivo para o setor Delivery */}
          {!isExterno && (
            <button
              className={styles.botaoNovoCliente}
              onClick={tratarAbrirModalNovo}
            >
              <PlusCircle size={18} weight="bold" />
              Novo Cliente Delivery
            </button>
          )}

          {/* Botão Exportar Excel Contextual (Externo ou Delivery) */}
          <button
            className={styles.botaoExportarExcel}
            onClick={tratarExportarExcel}
            disabled={carregando || clientesFiltrados.length === 0}
            title={
              isExterno
                ? "Exportar clientes externos filtrados para Excel"
                : "Exportar clientes delivery filtrados para Excel"
            }
          >
            <FileXls size={18} weight="bold" />
            {isExterno ? "Exportar Externos" : "Exportar Delivery"}
          </button>

          <button
            className={styles.botaoRecarregar}
            onClick={buscarClientesSetor}
            title="Atualizar lista atual"
          >
            <ArrowClockwise
              size={16}
              weight="bold"
              className={carregando ? styles.spinnerIcone : ""}
            />
            Recarregar
          </button>
        </div>
      </div>

      {/* ── PAINEL DE BUSCA E FILTROS ── */}
      <div className={styles.painelFiltros}>
        <div className={styles.linhaFiltros}>
          {/* CAMPO DE BUSCA */}
          <div className={styles.inputBuscaWrapper}>
            <MagnifyingGlass
              size={18}
              weight="bold"
              className={styles.iconeBusca}
            />
            <input
              type="text"
              className={styles.inputBusca}
              placeholder={
                isExterno
                  ? "Buscar por nome, CNPJ, telefone, cidade, endereço ou vendedor..."
                  : "Buscar por nome, telefone, endereço, bairro, cidade ou referência..."
              }
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            {busca && (
              <button
                className={styles.limparBusca}
                onClick={() => setBusca("")}
                title="Limpar pesquisa"
              >
                ✕
              </button>
            )}
          </div>

          {/* FILTROS EXCLUSIVOS PARA CLIENTES EXTERNOS */}
          {isExterno && (
            <>
              {/* STATUS EXTERNO */}
              <div className={styles.selectFiltroWrapper}>
                <select
                  className={styles.selectFiltro}
                  value={filtroStatusExterno}
                  onChange={(e) => setFiltroStatusExterno(e.target.value)}
                >
                  <option value="ativo">Status: Ativos</option>
                  <option value="inativo">Status: Inativos</option>
                  <option value="todos">Status: Todos</option>
                </select>
              </div>

              {/* VENDEDOR EXTERNO */}
              <div className={styles.selectFiltroWrapper}>
                <select
                  className={styles.selectFiltro}
                  value={filtroVendedorExterno}
                  onChange={(e) => setFiltroVendedorExterno(e.target.value)}
                >
                  <option value="">Vendedor: Todos</option>
                  {listaVendedoresExterno.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* ATENDIMENTO EXTERNO */}
              <div className={styles.selectFiltroWrapper}>
                <select
                  className={styles.selectFiltro}
                  value={filtroAtendimentoExterno}
                  onChange={(e) => setFiltroAtendimentoExterno(e.target.value)}
                >
                  <option value="">Atendimento: Todos</option>
                  <option value="SEGUNDA">Segunda-feira</option>
                  <option value="TERÇA">Terça-feira</option>
                  <option value="QUARTA">Quarta-feira</option>
                  <option value="QUINTA">Quinta-feira</option>
                  <option value="SEXTA">Sexta-feira</option>
                  <option value="SÁBADO">Sábado</option>
                  <option value="DOMINGO">Domingo</option>
                </select>
              </div>

              {/* PENDÊNCIAS EXTERNAS */}
              <div className={styles.selectFiltroWrapper}>
                <select
                  className={styles.selectFiltro}
                  value={filtroPendenciaExterno}
                  onChange={(e) => setFiltroPendenciaExterno(e.target.value)}
                >
                  <option value="todos">Pendências: Todas</option>
                  <option value="com_pendencia">Com Débitos</option>
                  <option value="sem_pendencia">Sem Pendências</option>
                </select>
              </div>
            </>
          )}

          {/* FILTRO STATUS (DELIVERY) */}
          {!isExterno && (
            <div className={styles.selectFiltroWrapper}>
              <select
                className={styles.selectFiltro}
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <option value="ativo">Status: Ativos</option>
                <option value="inativo">Status: Inativos</option>
                <option value="todos">Status: Todos</option>
              </select>
            </div>
          )}

          {/* FILTRO BAIRRO (DELIVERY) */}
          {!isExterno && (
            <div className={styles.selectFiltroWrapper}>
              <select
                className={styles.selectFiltro}
                value={filtroBairro}
                onChange={(e) => setFiltroBairro(e.target.value)}
              >
                <option value="">Bairro: Todos</option>
                {listaBairros.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* FILTRO CIDADE (DELIVERY) */}
          {!isExterno && (
            <div className={styles.selectFiltroWrapper}>
              <select
                className={styles.selectFiltro}
                value={filtroCidade}
                onChange={(e) => setFiltroCidade(e.target.value)}
              >
                <option value="">Cidade: Todas</option>
                {listaCidades.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* BOTÃO LIMPAR FILTROS */}
          {temFiltroAtivo && (
            <button
              className={styles.botaoLimparFiltros}
              onClick={tratarLimparFiltros}
              title="Restaurar filtros padrão"
            >
              <ArrowsClockwise size={14} weight="bold" />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* ── TABELA ── */}
      <div className={styles.cardTabela}>
        {carregando ? (
          <div className={styles.spinnerWrapper}>
            <div className={styles.spinner} />
            <span className={styles.textoCarregando}>
              {`Carregando lista de ${
                isExterno ? "clientes externos" : "clientes delivery"
              }...`}
            </span>
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className={styles.estadoVazio}>
            <Users size={48} weight="duotone" className={styles.iconeVazio} />
            <h3 className={styles.tituloVazio}>
              {busca
                ? "Nenhum cliente encontrado"
                : "Nenhum cliente cadastrado neste setor"}
            </h3>
            <p className={styles.subtituloVazio}>
              {busca || temFiltroAtivo
                ? `Nenhum resultado corresponde aos filtros aplicados. Tente ajustar o termo de pesquisa.`
                : "Não há registros disponíveis para a categoria selecionada."}
            </p>
          </div>
        ) : (
          <div className={styles.tabelaWrapper}>
            {/* CABEÇALHO DA TABELA */}
            {isExterno ? (
              // EXTERNO COM STATUS E AÇÕES
              <div className={`${styles.tituloLista} ${styles.gridExterno}`}>
                <span>ID</span>
                <span>Nome / Razão Social</span>
                <span>CNPJ / CPF</span>
                <span>Telefone / WhatsApp</span>
                <span>Cidade / Endereço</span>
                <span>Vendedor</span>
                <span>Atend. / Freq.</span>
                <span>Pendências</span>
                <span>Status</span>
                <span style={{ textAlign: "center" }}>Ações</span>
              </div>
            ) : (
              // DELIVERY COM STATUS E AÇÕES
              <div className={`${styles.tituloLista} ${styles.gridDelivery}`}>
                <span>ID</span>
                <span>Nome</span>
                <span>Telefone / WhatsApp</span>
                <span>Endereço Completo</span>
                <span>Cidade</span>
                <span>Referência</span>
                <span>Status</span>
                <span style={{ textAlign: "center" }}>Ações</span>
              </div>
            )}

            {/* LINHAS DE CLIENTES */}
            <div className={styles.lista}>
              {clientesFiltrados.map((cliente, index) => {
                const isAtivo = (cliente.status || "ativo") === "ativo";

                return isExterno ? (
                  // LINHA CLIENTE EXTERNO NATIVO
                  <div
                    key={cliente.id || index}
                    className={`${styles.itemRow} ${styles.gridExterno} ${
                      !isAtivo ? styles.inativo : ""
                    }`}
                  >
                    {/* ID */}
                    <span className={styles.idCell}>#{cliente.id}</span>

                    {/* NOME / RAZÃO */}
                    <span className={styles.nomeCell}>
                      {cliente.nome || "—"}
                    </span>

                    {/* CNPJ / CPF COM FORMATAÇÃO */}
                    <span>{formatarDocumentoVisual(cliente.cnpj)}</span>

                    {/* TELEFONE / WHATSAPP COM LINK DIRETO */}
                    <div className={styles.telefoneWrapper}>
                      <span className={styles.telefoneTexto}>
                        {formatarTelefoneVisual(cliente.telefone)}
                      </span>
                      {cliente.telefone && (
                        <button
                          type="button"
                          className={styles.btnWhatsappDireto}
                          onClick={() => tratarAbrirWhatsApp(cliente.telefone)}
                          title={`Abrir WhatsApp com ${cliente.nome}`}
                        >
                          <WhatsappLogo size={16} weight="fill" />
                        </button>
                      )}
                    </div>

                    {/* CIDADE / ENDEREÇO */}
                    <div>
                      <span>{cliente.cidade || "—"}</span>
                      {cliente.endereco && (
                        <span
                          className={styles.subInfoTexto}
                          title={cliente.endereco}
                        >
                          {cliente.endereco}
                        </span>
                      )}
                    </div>

                    {/* VENDEDOR RESPONSÁVEL */}
                    <div>
                      {cliente.vendedor ? (
                        <span
                          className={styles.badgeVendedorTag}
                          title="Vendedor Responsável"
                        >
                          {cliente.vendedor}
                        </span>
                      ) : (
                        <span className={styles.semPendencia}>—</span>
                      )}
                    </div>

                    {/* ATENDIMENTO / FREQUÊNCIA */}
                    <div>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "12px",
                          color: "var(--gray-700)",
                        }}
                      >
                        {cliente.atendimento || "—"}
                      </span>
                      {cliente.frequencia && (
                        <span className={styles.subInfoTexto}>
                          {cliente.frequencia}
                        </span>
                      )}
                    </div>

                    {/* PENDÊNCIAS FINANCEIRAS */}
                    <div className={styles.pendenciaCol}>
                      {cliente.temPendencia ||
                      Number(cliente.totalPendencia || 0) > 0 ? (
                        <div className={styles.pendenciaContainer}>
                          <span
                            className={styles.badgePendenciaAlerta}
                            title={`Saldo devedor total: ${formatarMoeda(
                              cliente.totalPendencia,
                            )}`}
                          >
                            <WarningCircle size={13} weight="bold" />
                            {formatarMoeda(cliente.totalPendencia)}
                          </span>
                          {Number(cliente.totalPago || 0) > 0 && (
                            <span
                              className={styles.pendenciaPago}
                              title={`Total já pago: ${formatarMoeda(
                                cliente.totalPago,
                              )}`}
                            >
                              Pago: {formatarMoeda(cliente.totalPago)}
                            </span>
                          )}
                        </div>
                      ) : Number(cliente.totalPago || 0) > 0 ? (
                        <div className={styles.pendenciaContainer}>
                          <span className={styles.badgeSemPendencia}>
                            <CheckCircle size={13} weight="bold" />
                            Quitada
                          </span>
                          <span
                            className={styles.pendenciaPago}
                            title={`Total pago: ${formatarMoeda(
                              cliente.totalPago,
                            )}`}
                          >
                            Pago: {formatarMoeda(cliente.totalPago)}
                          </span>
                        </div>
                      ) : (
                        <span className={styles.badgeSemPendencia}>
                          <CheckCircle size={13} weight="bold" />
                          R$ 0,00
                        </span>
                      )}
                    </div>

                    {/* BADGE DE STATUS */}
                    <div>
                      <span
                        className={`${styles.statusBadge} ${
                          isAtivo ? styles.statusAtivo : styles.statusInativo
                        }`}
                      >
                        <span className={styles.pontoStatus} />
                        {isAtivo ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    {/* AÇÕES: WHATSAPP, EDITAR, SOFT DELETE */}
                    <div className={styles.colunaAcoes}>
                      {/* ATALHO WHATSAPP */}
                      <button
                        type="button"
                        className={styles.btnAcaoWhatsapp}
                        onClick={() => tratarAbrirWhatsApp(cliente.telefone)}
                        title={`Conversar com ${cliente.nome} no WhatsApp`}
                        disabled={!cliente.telefone}
                        style={{
                          opacity: cliente.telefone ? 1 : 0.4,
                          cursor: cliente.telefone ? "pointer" : "not-allowed",
                        }}
                      >
                        <WhatsappLogo size={16} weight="bold" />
                      </button>

                      {/* RELATÓRIO DO CLIENTE */}
                      <button
                        type="button"
                        className={styles.btnAcaoRelatorio}
                        onClick={() => tratarAbrirRelatorioCliente(cliente, "externo")}
                        title={`Ver relatório de desempenho de ${cliente.nome}`}
                      >
                        <ChartLineUp size={16} weight="bold" />
                      </button>

                      {/* EDITAR */}
                      <button
                        type="button"
                        className={styles.btnAcaoEditar}
                        onClick={() => tratarAbrirModalEditarExterno(cliente)}
                        title={`Editar cliente externo #${cliente.id}`}
                      >
                        <PencilSimple size={16} weight="bold" />
                      </button>

                      {/* SOFT DELETE COM ALERTA RADIX */}
                      <AlertaRadix
                        titulo={
                          isAtivo
                            ? "Inativar Cliente Externo"
                            : "Reativar Cliente Externo"
                        }
                        descricao={
                          isAtivo
                            ? `Deseja realmente inativar o cliente externo "${cliente.nome}"? Ele não aparecerá na lista de clientes ativos nas rotas.`
                            : `Deseja reativar o cliente externo "${cliente.nome}"? Ele voltará a ficar ativo para pedidos e rotas.`
                        }
                        tratar={() => tratarAlternarStatusExterno(cliente)}
                        confirmarTexto={
                          isAtivo ? "Sim, inativar" : "Sim, reativar"
                        }
                        cancelarTexto="Voltar"
                        trigger={
                          <button
                            type="button"
                            className={`${styles.btnAcaoStatus} ${
                              isAtivo ? styles.inativar : styles.reativar
                            }`}
                            title={
                              isAtivo
                                ? "Inativar cliente externo (Soft Delete)"
                                : "Reativar cliente externo"
                            }
                          >
                            {isAtivo ? (
                              <EyeSlash size={16} weight="bold" />
                            ) : (
                              <Eye size={16} weight="bold" />
                            )}
                          </button>
                        }
                      />
                    </div>
                  </div>
                ) : (
                  // LINHA CLIENTE DELIVERY
                  <div
                    key={cliente.id || index}
                    className={`${styles.itemRow} ${styles.gridDelivery} ${
                      !isAtivo ? styles.inativo : ""
                    }`}
                  >
                    {/* ID */}
                    <span className={styles.idCell}>#{cliente.id}</span>

                    {/* NOME */}
                    <span className={styles.nomeCell}>
                      {cliente.nome || "—"}
                    </span>

                    {/* TELEFONE / WHATSAPP COM LINK DIRETO */}
                    <div className={styles.telefoneWrapper}>
                      <span className={styles.telefoneTexto}>
                        {formatarTelefoneVisual(cliente.telefone)}
                      </span>
                      {cliente.telefone && (
                        <button
                          type="button"
                          className={styles.btnWhatsappDireto}
                          onClick={() => tratarAbrirWhatsApp(cliente.telefone)}
                          title={`Abrir WhatsApp com ${cliente.nome}`}
                        >
                          <WhatsappLogo size={16} weight="fill" />
                        </button>
                      )}
                    </div>

                    {/* ENDEREÇO COMPLETO */}
                    <span>
                      {`${cliente.endereco || "—"}${
                        cliente.numero ? `, nº ${cliente.numero}` : ""
                      }${cliente.bairro ? ` - ${cliente.bairro}` : ""}${
                        cliente.complemento ? ` (${cliente.complemento})` : ""
                      }`}
                    </span>

                    {/* CIDADE */}
                    <span>{cliente.cidade || "—"}</span>

                    {/* REFERÊNCIA */}
                    <span title={cliente.referencia}>
                      {cliente.referencia || "—"}
                    </span>

                    {/* BADGE DE STATUS */}
                    <div>
                      <span
                        className={`${styles.statusBadge} ${
                          isAtivo ? styles.statusAtivo : styles.statusInativo
                        }`}
                      >
                        <span className={styles.pontoStatus} />
                        {isAtivo ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    {/* AÇÕES: EDITAR, WHATSAPP E SOFT DELETE */}
                    <div className={styles.colunaAcoes}>
                      {/* ATALHO WHATSAPP */}
                      <button
                        type="button"
                        className={styles.btnAcaoWhatsapp}
                        onClick={() => tratarAbrirWhatsApp(cliente.telefone)}
                        title={`Conversar com ${cliente.nome} no WhatsApp`}
                        disabled={!cliente.telefone}
                        style={{
                          opacity: cliente.telefone ? 1 : 0.4,
                          cursor: cliente.telefone ? "pointer" : "not-allowed",
                        }}
                      >
                        <WhatsappLogo size={16} weight="bold" />
                      </button>

                      {/* RELATÓRIO DO CLIENTE */}
                      <button
                        type="button"
                        className={styles.btnAcaoRelatorio}
                        onClick={() => tratarAbrirRelatorioCliente(cliente, "delivery")}
                        title={`Ver relatório de desempenho de ${cliente.nome}`}
                      >
                        <ChartLineUp size={16} weight="bold" />
                      </button>

                      {/* EDITAR */}
                      <button
                        type="button"
                        className={styles.btnAcaoEditar}
                        onClick={() => tratarAbrirModalEditar(cliente)}
                        title={`Editar cliente #${cliente.id}`}
                      >
                        <PencilSimple size={16} weight="bold" />
                      </button>

                      {/* SOFT DELETE COM ALERTA RADIX */}
                      <AlertaRadix
                        titulo={
                          isAtivo
                            ? "Inativar Cliente Delivery"
                            : "Reativar Cliente Delivery"
                        }
                        descricao={
                          isAtivo
                            ? `Deseja realmente inativar o cliente delivery "${cliente.nome}"? Ele não aparecerá na lista de clientes ativos para novos pedidos.`
                            : `Deseja reativar o cliente delivery "${cliente.nome}"? Ele voltará a ficar disponível para entregas e novos pedidos.`
                        }
                        tratar={() => tratarAlternarStatusDelivery(cliente)}
                        confirmarTexto={
                          isAtivo ? "Sim, inativar" : "Sim, reativar"
                        }
                        cancelarTexto="Voltar"
                        trigger={
                          <button
                            type="button"
                            className={`${styles.btnAcaoStatus} ${
                              isAtivo ? styles.inativar : styles.reativar
                            }`}
                            title={
                              isAtivo
                                ? "Inativar cliente (Soft Delete)"
                                : "Reativar cliente"
                            }
                          >
                            {isAtivo ? (
                              <EyeSlash size={16} weight="bold" />
                            ) : (
                              <Eye size={16} weight="bold" />
                            )}
                          </button>
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL DE CADASTRO E EDIÇÃO DE CLIENTE DELIVERY ── */}
      <ModalClienteDelivery
        aberto={modalDeliveryAberto}
        aoFechar={() => {
          setModalDeliveryAberto(false);
          setClienteEmEdicao(null);
        }}
        cliente={clienteEmEdicao}
        aoSalvarSucesso={buscarClientesSetor}
      />

      {/* ── MODAL DE CADASTRO E EDIÇÃO DE CLIENTE EXTERNO ── */}
      <ModalClienteExterno
        aberto={modalExternoAberto}
        aoFechar={() => {
          setModalExternoAberto(false);
          setClienteExternoEmEdicao(null);
        }}
        cliente={clienteExternoEmEdicao}
        aoSalvarSucesso={buscarClientesSetor}
        vendedoresSugestoes={listaVendedoresExterno}
      />
    </div>
  );
}

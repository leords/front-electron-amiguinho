import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import Cabecalho from "../../componentes/Cabecalho/index.jsx";
import Rodape from "../../componentes/Rodape/index.jsx";
import ItemListaHistorico from "../../componentes/ItemListaHistorico/index.jsx";
import Select from "react-select";
import { dataFormatadaCalendario } from "../../utils/data.js";
import {
  CalendarBlankIcon,
  MagnifyingGlassIcon,
  FileTextIcon,
  NotepadIcon,
  FunnelIcon,
  XCircleIcon,
  FileXls,
} from "@phosphor-icons/react";
import { buscarPedido } from "../../operadores/API/pedido/buscarPedido.js";
import { useFormaPagamentoExterna } from "../../hooks/useFormaPagamentoExterna";
import { LerClienteDelivery } from "../../operadores/API/cliente/lerClienteDelivery.js";
import { LerClienteExterno } from "../../operadores/API/cliente/lerClienteExterno.js";
import { useLocation } from "react-router-dom";
import { usarToast } from "../../componentes/Context/toastContext";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";
import { LerUsuario } from "../../operadores/API/usuario/lerUsuario";
import { exportarPedidosExcel } from "../../utils/exportarPedidosExcel.js";

// Helper para verificar se a forma de pagamento é Maquininha (Cartão ou Pix)
const ehMaquininha = (nome) => {
  if (!nome) return false;
  const n = String(nome)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return (
    n.includes("CART") ||
    n.includes("PIX") ||
    n.includes("CREDITO") ||
    n.includes("DEBITO") ||
    n.includes("MAQUIN")
  );
};

// Verifica se um pedido foi pago via Maquininha (Cartão ou Pix)
const pedidoTemMaquininha = (p) => {
  if (!p) return false;

  // Balcão: relação 'pagamentos' (array de pagamentos com formaPagamento)
  if (Array.isArray(p.pagamentos) && p.pagamentos.length > 0) {
    return p.pagamentos.some((pg) => {
      const nomeForma = pg.formaPagamento?.nome || pg.formaNome || "";
      return ehMaquininha(nomeForma);
    });
  }

  // Delivery e Externo: relação 'formaPagamento'
  const nomeForma = p.formaPagamento?.nome || p.formaNome || "";
  return ehMaquininha(nomeForma);
};

export default function Pedidos() {
  // Estados
  const [carregando, setCarregando] = useState(false);
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [nomeFormaPagamento, setNomeFormaPagamento] = useState("");
  const [cliente, setCliente] = useState(null);
  const [setor, setSetor] = useState("");
  const [status, setStatus] = useState([]);
  const [statusSelecionado, setStatusSelecionado] = useState("");
  const [vendedorSelecionado, setVendedorSelecionado] = useState("");
  const [opcaoVendedorExterno, setOpcaoVendedorExterno] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  // state de rota (passando parametro por rota)
  const { state } = useLocation();

  // Hooks
  const { listaFormaPagamento } = useFormaPagamentoExterna();
  const { mensagem, setMensagem } = usarToast();

  // Lista manual de setores
  const opcaoSetor = [
    { id: 1, nome: "balcao", label: "Balcão" },
    { id: 2, nome: "delivery", label: "Delivery" },
    { id: 3, nome: "externo", label: "Externo" },
  ];

  // Lista manual de vendedores setor balcão
  const opcaoVendedorBalcao = [
    { id: 1, nome: "b1", label: "Balcão 01" },
    { id: 2, nome: "b2", label: "Balcão 02" },
  ];

  // Lista manual de vendedores setor delivery
  const opcaoVendedorDelivery = [
    { id: 1, nome: "delivery", label: "Delivery" },
  ];

  // Função que busca usuários e filtra apenas os vendedores externos.
  useEffect(() => {
    const buscarUsuarios = async () => {
      setCarregando(true);
      try {
        const listaUsuarios = await LerUsuario();
        if (listaUsuarios) {
          const externos =
            listaUsuarios.filter((usuario) =>
              ["EXTERNO", "VENDAS"].includes(usuario.nivelAcesso)
            ) ?? [];
          setOpcaoVendedorExterno(
            externos.map((v) => ({ id: v.id, nome: v.nome, label: v.nome })),
          );
        }
      } catch {
        setOpcaoVendedorExterno([]);
      } finally {
        setCarregando(false);
      }
    };

    buscarUsuarios();
  }, []);

  // Função que seta lista de usuários conforme o setor escolhido.
  useEffect(() => {
    const opcoes = {
      externo: opcaoVendedorExterno,
      balcao: opcaoVendedorBalcao,
      delivery: opcaoVendedorDelivery,
    };

    setUsuarios(opcoes[setor] || []);

    setVendedorSelecionado("");
  }, [setor]);

  // Setando o status de pedido disponiveis conforme o setor
  useEffect(() => {
    if (setor === "balcao") {
      setStatus(["finalizado", "cancelado"]);
    } else if (setor === "delivery") {
      setStatus(["carregado", "entregue", "devolvido", "cancelado"]);
    } else if (setor === "externo") {
      setStatus([
        "pendente",
        "carregado",
        "entregue",
        "devolvido",
        "cancelado",
      ]);
    } else {
      setStatus([
        "carregado",
        "cancelado",
        "pendente",
        "entregue",
        "devolvido",
      ]);
    }
  }, [setor]);

  // Fica ouvindo o state que vem de reimprimir para soltar o alerta.
  useEffect(() => {
    if (state) {
      setMensagem(state);
    }
  }, []);

  // Seta a data final do filtro no dia atual e inicio no primeiro dia do mes atual.
  useEffect(() => {
    const inicializarData = async () => {
      // Estava sendo usado quando buscavamos o intervalo de data para inicio do mês.
      // const mesInicio = new Date();
      // const primeiroDiaMes = new Date(
      //   mesInicio.getFullYear(),
      //   mesInicio.getMonth(),
      //   1,
      // );

      setDataInicio(dataFormatadaCalendario());
      setDataFim(dataFormatadaCalendario());
    };
    inicializarData();
  }, []);

  // Filtra pedidos conforme o filtro.
  useEffect(() => {
    if (!dataInicio || !dataFim) return;

    const filtrarPedidos = async () => {
      setCarregando(true);
      try {
        const isMaquininha = formaPagamento === "maquininha";

        const resultado = await buscarPedido({
          setor,
          vendedor: vendedorSelecionado,
          //cliente: cliente?.value ?? "",
          dataInicio,
          dataFim,
          formaPagamentoId: isMaquininha ? undefined : formaPagamento,
          status: statusSelecionado,
        });

        if (isMaquininha) {
          const pedidosMaquininha = (resultado || []).filter(pedidoTemMaquininha);
          setPedidosFiltrados(pedidosMaquininha);
        } else {
          setPedidosFiltrados(resultado || []);
        }
      } catch (error) {
        console.error("Erro ao filtrar pedidos:", error);
        alert("Erro ao buscar pedidos. Tente novamente.");
      } finally {
        setCarregando(false);
      }
    };

    filtrarPedidos();
  }, [
    dataInicio,
    dataFim,
    formaPagamento,
    setor,
    cliente,
    statusSelecionado,
    vendedorSelecionado,
  ]);

  // Filtra clientes se não for balcao.
  useEffect(() => {
    const filtrarClientes = async () => {
      if (setor === "balcao" || setor === "") {
        setClientesFiltrados([]);
        setCliente(null);
        return;
      }
      try {
        const resultado =
          setor === "externo"
            ? await LerClienteExterno()
            : await LerClienteDelivery();

        const clientesFormatados = resultado.map((c) => ({
          value: c.id,
          label: c.nome,
        }));
        setClientesFiltrados(clientesFormatados);
      } catch (error) {
        console.error(error.message);
        setMensagem(error.message);
      }
    };
    filtrarClientes();
  }, [setor]);

  // Limpa os filtros.
  const limparFiltros = () => {
    setSetor("");
    setCliente(null);
    setFormaPagamento("");
    setNomeFormaPagamento("");
    setDataFim(dataFormatadaCalendario());
  };

  // Exportar pedidos filtrados para planilha Excel (CSV com BOM UTF-8)
  const tratarExportarExcel = () => {
    try {
      if (!pedidosFiltrados || pedidosFiltrados.length === 0) {
        setMensagem(
          "Nenhum pedido localizado para exportar com os filtros atuais.",
        );
        return;
      }

      const resultado = exportarPedidosExcel(pedidosFiltrados, {
        dataInicio,
        dataFim,
        setor,
      });

      setMensagem(
        `Exportados ${resultado.quantidade} pedidos para "${resultado.nomeArquivo}" com sucesso!`,
      );
    } catch (error) {
      console.error("Erro ao exportar pedidos para Excel:", error);
      setMensagem(error.message || "Erro ao gerar arquivo Excel.");
    }
  };

  const mostrarSelectCliente = setor !== "balcao" && setor !== "";

  return (
    <div className={styles.container}>
      <ToastRadix mensagem={mensagem} />
      <Cabecalho />

      <main className={styles.principal}>
        {/* Cabeçalho da página */}
        <div className={styles.cabecalhoPage}>
          <div className={styles.tituloSection}>
            <div className={styles.iconeWrapper}>
              <NotepadIcon size={24} weight="fill" />
            </div>
            <div>
              <p className={styles.subtitulo}>Gestão de vendas</p>
              <h1 className={styles.menuTitulo}>Histórico de Pedidos</h1>
            </div>
          </div>

          <div className={styles.acoesCabecalho}>
            <button
              type="button"
              className={styles.botaoExportarExcel}
              onClick={tratarExportarExcel}
              disabled={carregando || pedidosFiltrados.length === 0}
              title="Exportar pedidos filtrados para planilha Excel"
            >
              <FileXls size={18} weight="bold" />
              <span>Exportar Excel</span>
            </button>

            <button className={styles.botaoLimpar} onClick={limparFiltros}>
              <XCircleIcon size={16} weight="bold" />
              Limpar filtros
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className={styles.painelFiltros}>
          {/* Subtitulo */}
          <div className={styles.filtrosHeader}>
            <FunnelIcon
              size={16}
              weight="bold"
              className={styles.filtroIcone}
            />
            <span>Filtros</span>
          </div>

          <div className={styles.filtrosGrid}>
            {/* Data Inicial */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>
                <CalendarBlankIcon size={14} weight="bold" />
                Data inicial
              </label>
              <input
                className={styles.calendario}
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            {/* Data Final */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>
                <CalendarBlankIcon size={14} weight="bold" />
                Data final
              </label>
              <div className={styles.dataFimGroup}>
                <input
                  className={styles.calendario}
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
                <button
                  className={styles.botaoHoje}
                  onClick={() => setDataFim(dataFormatadaCalendario())}
                  title="Voltar para hoje"
                >
                  Hoje
                </button>
              </div>
            </div>

            {/* Setor */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>Setor</label>
              <select
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                className={styles.selectInput}
              >
                <option value="">Todos os setores</option>
                {opcaoSetor.map((s) => (
                  <option key={s.id} value={s.nome}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Cliente */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>Cliente</label>
              {mostrarSelectCliente ? (
                <Select
                  classNamePrefix="custom"
                  options={clientesFiltrados}
                  value={cliente}
                  onChange={setCliente}
                  placeholder="Buscar cliente..."
                  isSearchable
                  isClearable
                  noOptionsMessage={() => "Nenhum cliente encontrado"}
                />
              ) : (
                <div className={styles.selectDesabilitado}>
                  {setor === "balcao"
                    ? "N/A para balcão"
                    : "Selecione um setor"}
                </div>
              )}
            </div>

            {/* Forma de pagamento */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>Forma de pagamento</label>
              <select
                value={formaPagamento}
                onChange={(e) => {
                  const valor = e.target.value;
                  setFormaPagamento(valor);
                  if (valor === "maquininha") {
                    setNomeFormaPagamento("MAQUININHA");
                  } else {
                    setNomeFormaPagamento(
                      listaFormaPagamento.find((f) => f.id === Number(valor))
                        ?.nome || "",
                    );
                  }
                }}
                className={styles.selectInput}
              >
                <option value="">Todas as formas</option>
                <option value="maquininha">MAQUININHA (Cartão + PIX)</option>
                {listaFormaPagamento?.map((forma) => (
                  <option key={forma.id} value={forma.id}>
                    {forma.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Vendedor */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>Vendedor</label>
              <select
                value={vendedorSelecionado}
                onChange={(e) => setVendedorSelecionado(e.target.value)}
                className={styles.selectInput}
              >
                <option value="">Todos os usuários</option>
                {usuarios?.map((s, index) => (
                  <option key={index} value={s.nome}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>Status</label>
              <select
                value={statusSelecionado}
                onChange={(e) => setStatusSelecionado(e.target.value)}
                className={styles.selectInput}
              >
                {status.map((s, index) => (
                  <option key={index} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <section className={styles.containerLista}>
          <div className={styles.cabecalhoLista}>
            <div className={styles.cabecalhoInfo}>
              <h2>
                <MagnifyingGlassIcon size={18} weight="bold" />
                Pedidos encontrados
                {nomeFormaPagamento && (
                  <span className={styles.badge}>{nomeFormaPagamento}</span>
                )}
              </h2>
              {!carregando && (
                <span className={styles.contador}>
                  {pedidosFiltrados.length}{" "}
                  {pedidosFiltrados.length === 1 ? "resultado" : "resultados"}
                </span>
              )}
            </div>
            {carregando && (
              <span className={styles.loading}>
                <span className={styles.dot} />
                Carregando...
              </span>
            )}
          </div>

          <div className={styles.tabelaWrapper}>
            <div className={styles.lista}>
              {carregando ? (
                <div className={styles.estadoVazio}>
                  <div className={styles.spinner} />
                  <p>Buscando pedidos...</p>
                </div>
              ) : pedidosFiltrados.length === 0 ? (
                <div className={styles.estadoVazio}>
                  <FileTextIcon
                    size={48}
                    weight="duotone"
                    className={styles.iconeVazio}
                  />
                  <p>Nenhum pedido encontrado</p>
                  <span>Ajuste os filtros ou selecione outro período</span>
                </div>
              ) : (
                <ItemListaHistorico pedidos={pedidosFiltrados} />
              )}
            </div>
          </div>
        </section>
      </main>

      <Rodape />
    </div>
  );
}

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
} from "@phosphor-icons/react";
import { buscarPedido } from "../../operadores/API/pedido/buscarPedido.js";
import { useFormaPagamento } from "../../hooks/useFormaPagamento";
import { LerClienteDelivery } from "../../operadores/API/cliente/lerClienteDelivery.js";
import { LerClienteExterno } from "../../operadores/API/cliente/lerClienteExterno.js";

export default function Pedidos() {
  const [carregando, setCarregando] = useState(false);

  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);

  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [nomeFormaPagamento, setNomeFormaPagamento] = useState("");
  const [cliente, setCliente] = useState(null);
  const [setor, setSetor] = useState("");

  const { listaFormaPagamento } = useFormaPagamento();

  const opcaoSetor = [
    { id: 1, nome: "balcao", label: "Balcão" },
    { id: 2, nome: "delivery", label: "Delivery" },
    { id: 3, nome: "externo", label: "Externo" },
  ];

  useEffect(() => {
    const inicializarData = async () => {
      const mesInicio = new Date();
      const primeiroDiaMes = new Date(
        mesInicio.getFullYear(),
        mesInicio.getMonth(),
        1
      );
      setDataInicio(dataFormatadaCalendario(primeiroDiaMes));
      setDataFim(dataFormatadaCalendario());
    };
    inicializarData();
  }, []);

  useEffect(() => {
    if (!dataInicio || !dataFim) return;

    const filtrarPedidos = async () => {
      setCarregando(true);
      try {
        const resultado = await buscarPedido({
          setor,
          vendedor: "",
          cliente: cliente?.value ?? "",
          dataInicio,
          dataFim,
          formaPagamentoId: formaPagamento,
        });
        setPedidosFiltrados(resultado);
      } catch (error) {
        console.error("Erro ao filtrar pedidos:", error);
        alert("Erro ao buscar pedidos. Tente novamente.");
      } finally {
        setCarregando(false);
      }
    };

    filtrarPedidos();
  }, [dataInicio, dataFim, formaPagamento, setor, cliente]);

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
        console.error("Erro ao filtrar clientes", error);
        alert("Erro ao buscar clientes. Tente novamente.");
      }
    };
    filtrarClientes();
  }, [setor]);

  const limparFiltros = () => {
    setSetor("");
    setCliente(null);
    setFormaPagamento("");
    setNomeFormaPagamento("");
    setDataFim(dataFormatadaCalendario());
  };

  const mostrarSelectCliente = setor !== "balcao" && setor !== "";

  return (
    <div className={styles.container}>
      <Cabecalho />

      <main className={styles.principal}>
        {/* ── Cabeçalho da página ── */}
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

          <button className={styles.botaoLimpar} onClick={limparFiltros}>
            <XCircleIcon size={16} weight="bold" />
            Limpar filtros
          </button>
        </div>

        {/* ── Filtros ── */}
        <div className={styles.painelFiltros}>
          <div className={styles.filtrosHeader}>
            <FunnelIcon size={16} weight="bold" className={styles.filtroIcone} />
            <span>Filtros</span>
          </div>

          <div className={styles.filtrosGrid}>
            {/* Datas */}
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
                  const id = e.target.value;
                  setFormaPagamento(id);
                  setNomeFormaPagamento(
                    listaFormaPagamento.find((f) => f.id === Number(id))?.nome || ""
                  );
                }}
                className={styles.selectInput}
              >
                <option value="">Todas as formas</option>
                {listaFormaPagamento?.map((forma) => (
                  <option key={forma.id} value={forma.id}>
                    {forma.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Tabela ── */}
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
            <div className={styles.tituloLista}>
              <h3 className={styles.itemLista1}>ID</h3>
              <h3 className={styles.itemLista2}>Data / Hora</h3>
              <h3 className={styles.itemLista2}>Cliente</h3>
              <h3 className={styles.itemLista3}>Vendedor</h3>
              <h3 className={styles.itemLista4}>Total</h3>
              <h3 className={styles.itemLista5}>Pagamento</h3>
              <h3 className={styles.itemLista6}>Editar</h3>
              <h3 className={styles.itemLista7}>Excluir</h3>
            </div>

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
import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import Cabecalho from "../../componentes/Cabecalho/index.jsx";
import Rodape from "../../componentes/Rodape/index.jsx";
import logo from "../../assets/logo.jpg";
import ItemListaHistorico from "../../componentes/ItemListaHistorico/index.jsx";
import { dataFormatadaCalendario } from "../../utils/data.js";
import {
  CalendarBlankIcon,
  MagnifyingGlassIcon,
  FileTextIcon,
  CurrencyDollarIcon,
  IdentificationCardIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { buscarPedido } from "../../operadores/API/pedido/buscarPedido.js";
import { useFormaPagamento } from "../../hooks/useFormaPagamento";
import { formatarMoeda } from "../../utils/formartarMoeda";

export default function HistoricoValesInterno() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [totalVendas, setTotalVendas] = useState(0);
  const [nomeFormaPagamento, setNomeFormaPagamento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const nomeMaquina = import.meta.env.VITE_NOME_MAQUINA;

  const { listaFormaPagamento } = useFormaPagamento();

  const ignorarItensLista = ["A VISTA", "PIX", "CARTÃO", "CHEQUE"];
  const listaFormasPagamentoFiltrada = listaFormaPagamento?.filter(
    (forma) => !ignorarItensLista.includes(forma.nome)
  );

  useEffect(() => {
    const hoje = dataFormatadaCalendario();
    setDataInicio(hoje);
    setDataFim(hoje);
  }, []);

  useEffect(() => {
    if (!dataInicio || !dataFim) return;
    const filtrarPedidos = async () => {
      setCarregando(true);
      try {
        if (formaPagamento) {
          const resultado = await buscarPedido({
            setor: "balcao",
            vendedor: nomeMaquina,
            dataInicio,
            dataFim,
            formaPagamentoId: formaPagamento,
          });
          setPedidosFiltrados(resultado);
        }
      } catch (error) {
        console.error("Erro ao filtrar pedidos:", error);
        alert("Erro ao buscar pedidos. Tente novamente.");
      } finally {
        setCarregando(false);
      }
    };
    filtrarPedidos();
  }, [dataInicio, dataFim, formaPagamento]);

  useEffect(() => {
    const total = pedidosFiltrados.reduce(
      (acc, pedido) =>
        acc + pedido.itens.reduce((soma, item) => soma + item.valorTotal || 0, 0),
      0
    );
    setTotalVendas(total);
  }, [pedidosFiltrados]);

  return (
    <div className={styles.container}>
      <Cabecalho />

      <main className={styles.principal}>

        {/* ── Cabeçalho ── */}
        <div className={styles.cabecalhoPage}>
          <div className={styles.tituloSection}>
            <div className={styles.iconeWrapper}>
              <IdentificationCardIcon size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Terminal de caixa</p>
              <h1 className={styles.menuTitulo}>Vales Internos</h1>
            </div>
          </div>
        </div>

        {/* ── Painel de filtros ── */}
        <div className={styles.painelFiltros}>
          <div className={styles.filtrosHeader}>
            <UserIcon size={14} weight="bold" className={styles.filtroIcone} />
            <span>Filtros</span>
          </div>

          <div className={styles.filtrosGrid}>

            {/* Colaborador */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>Colaborador</label>
              <select
                value={formaPagamento}
                onChange={(e) => {
                  const id = e.target.value;
                  setFormaPagamento(id);
                  setNomeFormaPagamento(
                    listaFormasPagamentoFiltrada.find((f) => f.id === Number(id))?.nome || ""
                  );
                }}
                className={styles.selectInput}
              >
                <option value="">Selecione o colaborador</option>
                {listaFormasPagamentoFiltrada?.map((forma) => (
                  <option key={forma.id} value={forma.id}>
                    {forma.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Data inicial */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>
                <CalendarBlankIcon size={13} weight="bold" />
                Data inicial
              </label>
              <input
                className={styles.calendario}
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            {/* Data final */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>
                <CalendarBlankIcon size={13} weight="bold" />
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
                >
                  Hoje
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ── Cards de resumo ── */}
        <div className={styles.resumoCards}>
          <div className={styles.card}>
            <div className={styles.cardIcone} data-color="orange">
              <FileTextIcon size={20} weight="fill" />
            </div>
            <div>
              <p className={styles.cardLabel}>Total de pedidos</p>
              <strong className={styles.cardValor}>{pedidosFiltrados.length}</strong>
              <p className={styles.cardSub}>
                {pedidosFiltrados.length === 1 ? "pedido no período" : "pedidos no período"}
              </p>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcone} data-color="green">
              <CurrencyDollarIcon size={20} weight="fill" />
            </div>
            <div>
              <p className={styles.cardLabel}>Total em vales</p>
              <strong className={styles.cardValor}>{formatarMoeda(totalVendas)}</strong>
              <p className={styles.cardSub}>valor total no período</p>
            </div>
          </div>
        </div>

        {/* ── Conteúdo principal ── */}
        <div className={styles.main}>

          <section className={styles.containerLista}>
            <div className={styles.cabecalhoLista}>
              <div className={styles.cabecalhoListaEsq}>
                <MagnifyingGlassIcon size={18} weight="bold" className={styles.cabecalhoIcone} />
                <h2>Pedidos encontrados</h2>
                {nomeFormaPagamento && (
                  <span className={styles.badgeColaborador}>{nomeFormaPagamento}</span>
                )}
                {!carregando && pedidosFiltrados.length > 0 && (
                  <span className={styles.contador}>
                    {pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? "resultado" : "resultados"}
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
                <h3 className={styles.itemLista3}>Balcão · Vendedor</h3>
                <h3 className={styles.itemLista4}>Total</h3>
                <h3 className={styles.itemLista5}>Pagamento</h3>
              </div>

              <div className={styles.lista}>
                {carregando ? (
                  <div className={styles.estadoVazio}>
                    <div className={styles.spinner} />
                    <p>Buscando pedidos...</p>
                  </div>
                ) : !formaPagamento ? (
                  <div className={styles.estadoVazio}>
                    <UserIcon size={44} weight="duotone" className={styles.iconeVazio} />
                    <p>Selecione um colaborador</p>
                    <span>Escolha o colaborador para visualizar os vales</span>
                  </div>
                ) : pedidosFiltrados.length === 0 ? (
                  <div className={styles.estadoVazio}>
                    <FileTextIcon size={44} weight="duotone" className={styles.iconeVazio} />
                    <p>Nenhum vale encontrado</p>
                    <span>Não há vales registrados para este período</span>
                  </div>
                ) : (
                  <ItemListaHistorico pedidos={pedidosFiltrados} />
                )}
              </div>
            </div>
          </section>

          {/* Mascote */}
          <aside className={styles.containerMascote}>
            <div className={styles.mascoteCard}>
              <img src={logo} alt="Logo" className={styles.logo} />
              <p className={styles.mascoteTexto}>
                Consulte o histórico de pedidos como vale interno.
              </p>
            </div>
          </aside>

        </div>
      </main>

      <Rodape />
    </div>
  );
}
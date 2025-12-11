import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import Cabecalho from "../../componentes/Cabecalho/index.jsx";
import Rodape from "../../componentes/Rodape/index.jsx";
import logo from "../../assets/logo.jpg";
import ItemListaHistorico from "../../componentes/ItemListaHistorico/index.jsx";
import {
  dataFormatadaCalendario,
  dataFormatadaFiltro,
} from "../../utils/data.js";
import {
  CalendarBlankIcon,
  MagnifyingGlassIcon,
  FileTextIcon,
} from "@phosphor-icons/react";

export default function Historico() {
  const [dataAtual, setDataAtual] = useState("");
  const [pedidosFiltrados, setPedidosFiltrados] = useState(vendas);
  const [carregando, setCarregando] = useState(false);
  const [totalVendas, setTotalVendas] = useState(0);
  const [totalItens, setTotalItens] = useState(0);

  // Inicializa com a data atual
  useEffect(() => {
    const inicializarData = async () => {
      const hoje = dataFormatadaCalendario();
      setDataAtual(hoje);
    };
    inicializarData();
  }, []);

  // Filtra pedidos conforme a data selecionada
  useEffect(() => {
    if (!dataAtual) return;

    const filtrarPedidos = async () => {
      setCarregando(true);

      try {
        const dataFiltro = dataFormatadaFiltro(dataAtual);
        console.log("Buscando pedidos para:", dataFiltro);

        // Simula delay de busca no banco
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Aqui você faria a chamada real ao banco de dados
        // const resultado = await buscarPedidosPorData(dataFiltro);

        // Por enquanto, filtra os dados mock
        const pedidosDoDia = vendas.filter((venda) => {
          // Ajuste a lógica de filtro conforme o formato da sua data
          return venda.data && venda.data.includes(dataFiltro);
        });

        setPedidosFiltrados(pedidosDoDia);

        // Calcula totais
        const total = pedidosDoDia.reduce(
          (acc, venda) => acc + (venda.total || 0),
          0
        );
        const itens = pedidosDoDia.reduce(
          (acc, venda) => acc + (venda.quantidade || 0),
          0
        );

        setTotalVendas(total);
        setTotalItens(itens);
      } catch (error) {
        console.error("Erro ao filtrar pedidos:", error);
        alert("Erro ao buscar pedidos. Tente novamente.");
      } finally {
        setCarregando(false);
      }
    };

    filtrarPedidos();
  }, [dataAtual]);

  const tratarAlteracao = (e) => {
    const novaData = e.target.value;
    setDataAtual(novaData);
  };

  const limparFiltro = () => {
    const hoje = dataFormatadaCalendario();
    setDataAtual(hoje);
  };

  return (
    <div className={styles.container}>
      <Cabecalho />

      <main className={styles.principal}>
        {/* Cabeçalho com título e filtros */}
        <div className={styles.cabecalhoPage}>
          <div className={styles.tituloSection}>
            <FileTextIcon size={40} weight="duotone" className={styles.icone} />
            <h1 className={styles.menuTitulo}>Histórico de Vendas</h1>
          </div>

          {/* Filtro de data */}
          <div className={styles.filtros}>
            <div className={styles.campoData}>
              <label>
                <CalendarBlankIcon size={18} weight="bold" />
                Selecionar data:
              </label>
              <div className={styles.inputGroup}>
                <input
                  className={styles.calendario}
                  type="date"
                  value={dataAtual}
                  onChange={tratarAlteracao}
                />
                <button
                  className={styles.botaoLimpar}
                  onClick={limparFiltro}
                  title="Voltar para hoje"
                >
                  Hoje
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className={styles.resumoCards}>
          {/* Total pedidos */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitulo}>Total de Pedidos</span>
              <div className={styles.cardIcone}>
                <FileTextIcon size={24} weight="duotone" />
              </div>
            </div>
            <p className={styles.cardValor}>{pedidosFiltrados.length}</p>
            <span className={styles.cardSubtitulo}>
              {pedidosFiltrados.length === 1 ? "pedido" : "pedidos"} no dia
            </span>
          </div>
          {/* Total em vendas */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitulo}>Total em Vendas</span>
              <div className={styles.cardIcone}>
                <span style={{ fontSize: "24px" }}>💰</span>
              </div>
            </div>
            <p className={styles.cardValor}>
              {totalVendas.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
            <span className={styles.cardSubtitulo}>faturamento do dia</span>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className={styles.main}>
          {/* Lista de pedidos */}
          <section className={styles.containerLista}>
            <div className={styles.cabecalhoLista}>
              <h2>
                <MagnifyingGlassIcon size={20} weight="bold" />
                Pedidos Encontrados
              </h2>
              {carregando && (
                <span className={styles.loading}>Carregando...</span>
              )}
            </div>
            {/* Titulos da tabela */}
            <div className={styles.tabelaWrapper}>
              <div className={styles.tituloLista}>
                <h3 className={styles.itemLista1}>ID</h3>
                <h3 className={styles.itemLista2}>DATA/HORA</h3>
                <h3 className={styles.itemLista3}>TOTAL</h3>
                <h3 className={styles.itemLista4}>ITENS</h3>
                <h3 className={styles.itemLista5}>PAGAMENTO</h3>
              </div>

              {/* Itens da tabela */}
              <div className={styles.lista}>
                {carregando ? (
                  <div className={styles.estadoVazio}>
                    <p>Carregando pedidos...</p>
                  </div>
                ) : pedidosFiltrados.length === 0 ? (
                  <div className={styles.estadoVazio}>
                    <FileTextIcon
                      size={48}
                      weight="duotone"
                      className={styles.iconeVazio}
                    />
                    <p>Nenhum pedido encontrado</p>
                    <span>Não há vendas registradas para esta data</span>
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
              <img
                src={logo}
                alt="Amigão Distribuidora de Bebidas"
                className={styles.logo}
              />
              <p className={styles.mascoteTexto}>
                Consulte o histórico de vendas por data
              </p>
            </div>
          </aside>
        </div>
      </main>

      <Rodape />
    </div>
  );
}

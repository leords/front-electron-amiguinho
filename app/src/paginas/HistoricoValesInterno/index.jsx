import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import Cabecalho from "../../componentes/Cabecalho/index.jsx";
import Rodape from "../../componentes/Rodape/index.jsx";
import logo from "../../assets/logo.jpg";
import ItemListaHistorico from "../../componentes/ItemListaHistorico/index.jsx";
import {
  dataFormatadaCalendario,
} from "../../utils/data.js";
import {
  CalendarBlankIcon,
  MagnifyingGlassIcon,
  FileTextIcon,
  NotepadIcon
} from "@phosphor-icons/react";
import { buscarPedido } from "../../operadores/API/pedido/buscarPedido.js";
import { useFormaPagamento } from "../../hooks/useFormaPagamento";

export default function HistoricoValesInterno() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [totalVendas, setTotalVendas] = useState(0);
  const [nomeFormaPagamento, setNomeFormaPagamento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState(1);
  const nomeMaquina = import.meta.env.VITE_NOME_MAQUINA;

    const {
      listaFormaPagamento
    } = useFormaPagamento();

    // filtrando apenas nomes para listar vales internos.
    const ignorarItensLista = ['A VISTA', 'PIX', 'CARTÃO'];
    const listaFormasPagamentoFiltrada = listaFormaPagamento?.filter(forma => !ignorarItensLista.includes(forma.nome));


  // Inicializa a data final com a data atual
  useEffect(() => {
    const inicializarData = async () => {
      const hoje = dataFormatadaCalendario();
      setDataInicio(hoje);
      setDataFim(hoje);
    };
    inicializarData();
  }, []);

  // Filtra pedidos conforme a data selecionada
  useEffect(() => {

    if (!dataInicio || !dataFim ) return;

    const filtrarPedidos = async () => {
      setCarregando(true);

      try {
        const resultado = await buscarPedido({
          setor: "balcao",
          vendedor: nomeMaquina,
          dataInicio: dataInicio,
          dataFim: dataFim,
          formaPagamentoId: formaPagamento,
          //formaPagamentoId
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
  }, [dataInicio, dataFim, formaPagamento]);

  // Calcular total do cupom
  useEffect(() => {
    // Calcula totais
    const total = pedidosFiltrados.reduce((acc, pedido) => {
      // array de pedidos
      return (
        acc + // acumulador geral
        pedido.itens.reduce((soma, item) => soma + item.valorTotal || 0, 0) //array de itens do pedido
      ); // soma = total do pedido atual.
      // o ultimo zero indica que a soma começa em zero.
    }, 0);

    setTotalVendas(total);
  }, [pedidosFiltrados]);

  // Apenas para listar. //TESTANDO
  useEffect(() => {
    console.log("Pedidos filtrados", pedidosFiltrados);
  }, [pedidosFiltrados]);


    // trata a alteração da data inicial
  const tratarAlteracaoDataInicio = (e) => {
    const novaData = e.target.value;
    setDataInicio(novaData);

    console.log('Tratar Inicio')
  };

  // trata a alteração da data final
  const tratarAlteracaoDataFim = (e) => {
    const novaData = e.target.value;
    setDataFim(novaData);
  };

  // butão que seta a data atual como dataFim no filtro
  const setarHojeDataFimAutomatico = () => {
    const hoje = dataFormatadaCalendario();
    setDataFim(hoje);
  };

  return (
    <div className={styles.container}>
      <Cabecalho />

      <main className={styles.principal}>
        {/* Cabeçalho com título e filtros */}
        <div className={styles.cabecalhoPage}>
          <div className={styles.tituloSection}>
            <NotepadIcon size={40} weight="duotone" className={styles.icone} />
            <h1 className={styles.menuTitulo}>Histórico de vales interno</h1>
          </div>

          {/* Filtro de data */}
          <div className={styles.filtros}>
            <div className={styles.campoData}>

              {/* SELECIONAR FORMA DE PAGAMENTO. */}
              <select
                value={formaPagamento}
                onChange={(e) => {
                  const id = e.target.value;

                  setFormaPagamento(id);

                  const nome =
                    listaFormasPagamentoFiltrada.find((forma) => forma.id === Number(id))
                      ?.nome || "";

                  setNomeFormaPagamento(nome);
                }}
                className={styles.selectPagamento}
              >
                {listaFormasPagamentoFiltrada?.map((forma) => (
                  <option key={forma.id} value={forma.id}>
                    {forma.nome}
                  </option>
                ))}
              </select>

              {/* SELECIONAR DATAS. */}
              <label>
                <CalendarBlankIcon size={18} weight="bold" />
                Selecionar data:
              </label>
              <div className={styles.inputGroup}>
                {/* SELECT DE DATA INICIAL */}
                <input
                  className={styles.calendario}
                  type="date"
                  value={dataInicio}
                  onChange={tratarAlteracaoDataInicio}
                />
                {/* SELECT DE DATA FINAL */}
                <input
                  className={styles.calendario}
                  type="date"
                  value={dataFim}
                  onChange={tratarAlteracaoDataFim}
                />
                {/* BOTÃO DE SETAR DIA ATUAL PARA DATA FINAL */}
                <button
                  className={styles.botaoLimpar}
                  onClick={setarHojeDataFimAutomatico}
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
              {pedidosFiltrados.length === 1 ? "pedido" : "pedidos"} no decorrer do período
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
            <span className={styles.cardSubtitulo}>Valor total em vales internos.</span>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className={styles.main}>
          {/* Lista de pedidos */}
          <section className={styles.containerLista}>
            <div className={styles.cabecalhoLista}>
              <h2>
                <MagnifyingGlassIcon size={20} weight="bold" />
                Pedidos Encontrados: {nomeFormaPagamento}
              </h2>
              {carregando && (
                <span className={styles.loading}>Carregando...</span>
              )}
            </div>
            {/* Titulos da tabela */}
            <div className={styles.tabelaWrapper}>
              <div className={styles.tituloLista}>
                <h3 className={styles.itemLista1}>ID</h3>
                <h3 className={styles.itemLista2}>Data-Horário</h3>
                <h3 className={styles.itemLista3}>Balcão-Vendedor</h3>
                <h3 className={styles.itemLista4}>TOTAL</h3>
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

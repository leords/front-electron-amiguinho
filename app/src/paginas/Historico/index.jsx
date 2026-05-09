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
  ReceiptIcon,
} from "@phosphor-icons/react";
import { buscarPedido } from "../../operadores/API/pedido/buscarPedido.js";
import { formatarMoeda } from "../../utils/formartarMoeda";
import { usarToast } from "../../componentes/Context/toastContext";

export default function Historico() {

  // variável .env
  const nomeMaquina = import.meta.env.VITE_NOME_MAQUINA;

  // estados
  const [dataAtual, setDataAtual] = useState("");
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [totalVendas, setTotalVendas] = useState(0);

  // hooks
  const { setMensagem } = usarToast();

  // atualizando data
  useEffect(() => {
    setDataAtual(dataFormatadaCalendario());
  }, []);

  // filtrando pedidos
  useEffect(() => {
    if (!dataAtual || !nomeMaquina) return;
    const filtrarPedidos = async () => {
      setCarregando(true);
      try {
        const resultado = await buscarPedido({
          setor: "balcao",
          vendedor: nomeMaquina,
          dataInicio: dataAtual,
          dataFim: dataAtual,
        });
        setPedidosFiltrados(resultado);
      } catch (error) {
        console.log(error.message);
        setMensagem(error.message);
      } finally {
        setCarregando(false);
      }
    };
    filtrarPedidos();
  }, [dataAtual, nomeMaquina]);

  // soma o total de pedidos filtrados
  useEffect(() => {
    const total = pedidosFiltrados.reduce(
      (acc, pedido) =>
        acc + pedido.itens.reduce((soma, item) => soma + item.valorTotal || 0, 0),
      0
    );
    setTotalVendas(total);
  }, [pedidosFiltrados]);

  // pega o valor de data selecionado no input
  const tratarAlteracao = (e) => setDataAtual(e.target.value);

  // função que seta o dia atual
  const setarHoje = () => setDataAtual(dataFormatadaCalendario());

  // formatação de data
  const dataSelecionada = dataAtual
    ? new Date(dataAtual + "T00:00:00").toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className={styles.container}>
      <Cabecalho />

      <main className={styles.principal}>

        {/* Cabeçalho */}
        <div className={styles.cabecalhoPage}>
          <div className={styles.tituloSection}>
            <div className={styles.iconeWrapper}>
              <ReceiptIcon size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Terminal de caixa</p>
              <h1 className={styles.menuTitulo}>Histórico de Vendas</h1>
            </div>
          </div>

          {/* Filtro */}
          <div className={styles.filtroBloco}>
            <label className={styles.filtroLabel}>
              <CalendarBlankIcon size={14} weight="bold" />
              Data
            </label>
            <div className={styles.inputGroup}>
              <input
                className={styles.calendario}
                type="date"
                value={dataAtual}
                onChange={tratarAlteracao}
              />
              <button className={styles.botaoHoje} onClick={setarHoje}>
                Hoje
              </button>
            </div>
            {dataSelecionada && (
              <span className={styles.dataLegenda}>{dataSelecionada}</span>
            )}
          </div>
        </div>

        {/* Cards de resumo */}
        <div className={styles.resumoCards}>
          <div className={styles.card}>
            <div className={styles.cardIcone} data-color="orange">
              <FileTextIcon size={20} weight="fill" />
            </div>
            <div>
              <p className={styles.cardLabel}>Total de pedidos</p>
              <strong className={styles.cardValor}>{pedidosFiltrados.length}</strong>
              <p className={styles.cardSub}>
                {pedidosFiltrados.length === 1 ? "pedido no dia" : "pedidos no dia"}
              </p>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcone} data-color="green">
              <CurrencyDollarIcon size={20} weight="fill" />
            </div>
            <div>
              <p className={styles.cardLabel}>Faturamento do dia</p>
              <strong className={styles.cardValor}>{formatarMoeda(totalVendas)}</strong>
              <p className={styles.cardSub}>total em vendas</p>
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className={styles.main}>

          {/* Tabela */}
          <section className={styles.containerLista}>
            <div className={styles.cabecalhoLista}>
              <div className={styles.cabecalhoListaEsq}>
                <MagnifyingGlassIcon size={18} weight="bold" className={styles.cabecalhoIcone} />
                <h2>Pedidos encontrados</h2>
                {!carregando && (
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
                ) : pedidosFiltrados.length === 0 ? (
                  <div className={styles.estadoVazio}>
                    <FileTextIcon size={44} weight="duotone" className={styles.iconeVazio} />
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
              <img src={logo} alt="Logo" className={styles.logo} />
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
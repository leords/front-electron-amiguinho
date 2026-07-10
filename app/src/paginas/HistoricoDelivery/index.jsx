import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import Cabecalho from "../../componentes/Cabecalho/index.jsx";
import Rodape from "../../componentes/Rodape/index.jsx";
import logo from "../../assets/logo.jpg";
import ItemListaHistoricoDelivery from "../../componentes/ItemListaHistoricoDelivery/index.jsx";
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
import { usarAuth } from "../../componentes/Context/authContext";
import Select from "react-select";

export default function HistoricoDelivery() {

  // Opções 
  const balcaoOptions = [
    { value: 'carregado', label: 'Carregado' },
    { value: 'entregue', label: 'Entregue' },
    { value: 'cancelado', label: 'Cancelado' },
    { value: undefined, label: 'Todos'}
  ];
  

  // estados
  const [dataAtual, setDataAtual] = useState("");
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [totalVendas, setTotalVendas] = useState(0);
  const [status, setStatus] = useState([balcaoOptions[3]]);

  // Hooks
  const { setMensagem } = usarToast();
  const { usuario } = usarAuth();

  
  // Atualizando data
  useEffect(() => {
    setDataAtual(dataFormatadaCalendario());
  }, []);

  // Filtrando pedidos
  useEffect(() => {
    if (!dataAtual || !status) return;

    const filtrarPedidos = async () => {
      setCarregando(true);
      try {
        const resultado = await buscarPedido({
          setor: "delivery",
          dataInicio: dataAtual,
          dataFim: dataAtual,
          status: status.value,
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
  }, [dataAtual, status]);

  // Soma o total de pedidos filtrados
  useEffect(() => {
    const total = pedidosFiltrados.reduce(
      (acc, pedido) =>
        acc + pedido.itens.reduce((soma, item) => soma + item.valorTotal || 0, 0),
      0
    );
    setTotalVendas(total);
  }, [pedidosFiltrados]);

  // Pega o valor de data selecionado no input
  const tratarAlteracao = (e) => setDataAtual(e.target.value);

  // Função que seta o dia atual
  const setarHoje = () => setDataAtual(dataFormatadaCalendario());

  // Formatação de data
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

        {/* CABEÇALHO */}
        <div className={styles.cabecalhoPage}>
          {/* TÍTULO */}
          <div className={styles.tituloSection}>
            <div className={styles.iconeWrapper}>
              <ReceiptIcon size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Terminal de caixa</p>
              <h1 className={styles.menuTitulo}>Histórico de Vendas Delivery</h1>
            </div>
          </div>

          {/* FILTRO */}
          <div className={styles.filtroBloco}>
            <label className={styles.filtroLabel}>
              <CalendarBlankIcon size={14} weight="bold" />
              Data
            </label>

            <div className={styles.inputGroup}>

              {/* SELECT - OPÇÃO SERÁ DISPONIVEL APENAS PARA USUÁRIO ADMIN */}
                {usuario?.nivelAcesso === 'ADMIN' &&
                <>
                <div className={styles.containerSelector}>
                  <p className={styles.subtituloBalcaoSelector}>Escolha o status:</p>
                </div>
                  <div className={styles.balcaoSelector}>
                    <Select
                      classNamePrefix="custom"
                      options={balcaoOptions}
                      value={status}
                      onChange={setStatus}
                      placeholder="Selecione o balcão"
                      isSearchable={false}
                    />
                  </div>  
                </>        
              }

              {/* INPUT DE DATA */}
              <input
                className={styles.calendario}
                type="date"
                value={dataAtual}
                onChange={tratarAlteracao}
              />

              {/* BOTÃO */}
              <button className={styles.botaoHoje} onClick={setarHoje}>
                Hoje
              </button>
              
            </div>

            {dataSelecionada && (
              <span className={styles.dataLegenda}>{dataSelecionada}</span>
            )}
          </div>
        </div>

        {/* CARDS DE RESUMO */}
        <div className={styles.resumoCards}>

          {/* CARD QUANTIDADE */}
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

          {/* CARD TOTAL */}
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

        {/* CONTEÚDO PRINCIPAL */}
        <div className={styles.main}>

          {/* TABELA */}
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
                <h3 className={styles.itemLista3}>Cliente</h3>
                <h3 className={styles.itemLista3}>Usuário</h3>
                <h3 className={styles.itemLista4}>Total</h3>
                <h3 className={styles.itemLista5}>Pagamento</h3>
                <h3 className={styles.itemLista5}>Status</h3>
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
                  <ItemListaHistoricoDelivery pedidos={pedidosFiltrados} />
                )}
              </div>
            </div>
          </section>

          {/* MASCOTE */}
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
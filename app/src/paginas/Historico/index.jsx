import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import Cabecalho from "../../componentes/Cabecalho/index.jsx";
import Rodape from "../../componentes/Rodape/index.jsx";
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
import { usarAuth } from "../../componentes/Context/authContext";
import Select from "react-select";

export default function Historico() {
  // Opções
  const balcaoOptions = [
    { value: "b1", label: "Balcão 1" },
    { value: "b2", label: "Balcão 2" },
    { value: undefined, label: "Geral" },
  ];

  // Storaged
  const nomeMaquina = localStorage.getItem("balcao");

  // estados
  const [dataAtual, setDataAtual] = useState("");
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [totalVendas, setTotalVendas] = useState(0);
  const [balcao, setBalcao] = useState(balcaoOptions[2]);

  // Hooks
  const { setMensagem } = usarToast();
  const { usuario } = usarAuth();

  // Atualizando data
  useEffect(() => {
    setDataAtual(dataFormatadaCalendario());
  }, []);

  // Filtrando pedidos
  useEffect(() => {
    if (!dataAtual) return;

    const filtrarPedidos = async () => {
      setCarregando(true);
      try {
        const terminalMaquina =
          nomeMaquina || localStorage.getItem("balcao") || undefined;

        // Se for ADMIN, usa o balcão escolhido no select (b1, b2 ou undefined para geral)
        // Se for BALCAO, restringe estritamente ao terminal desta máquina
        const vendedorFiltro =
          usuario?.nivelAcesso === "ADMIN" ? balcao?.value : terminalMaquina;

        const resultado = await buscarPedido({
          setor: "balcao",
          vendedor: vendedorFiltro,
          dataInicio: dataAtual,
          dataFim: dataAtual,
          status: "finalizado",
        });

        const lista = Array.isArray(resultado)
          ? resultado
          : Array.isArray(resultado?.resultado)
          ? resultado.resultado
          : [];

        // Dupla validação: se for operador de BALCAO, garante que apenas pedidos do terminal da máquina sejam exibidos
        const pedidosFiltradosFinal =
          usuario?.nivelAcesso === "ADMIN" || !terminalMaquina
            ? lista
            : lista.filter(
                (p) =>
                  String(p.vendedor || "").toLowerCase() ===
                  String(terminalMaquina).toLowerCase()
              );

        setPedidosFiltrados(pedidosFiltradosFinal);
      } catch (error) {
        console.error("Erro ao buscar histórico de vendas:", error.message);
        setMensagem(error.message);
      } finally {
        setCarregando(false);
      }
    };

    filtrarPedidos();
  }, [dataAtual, nomeMaquina, balcao, usuario?.nivelAcesso, setMensagem]);

  // Soma o total de pedidos filtrados
  useEffect(() => {
    const total = pedidosFiltrados.reduce(
      (acc, pedido) =>
        acc +
        pedido.itens.reduce((soma, item) => soma + item.valorTotal || 0, 0),
      0,
    );
    setTotalVendas(total);
  }, [pedidosFiltrados]);

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
              <h1 className={styles.menuTitulo}>Histórico de Vendas</h1>
            </div>
          </div>

          {/* FILTRO */}
          <div className={styles.filtroBloco}>
            <div className={styles.inputGroup}>
              {/* SELECT - OPÇÃO SERÁ DISPONIVEL APENAS PARA USUÁRIO ADMIN */}
              {usuario?.nivelAcesso === "ADMIN" && (
                <>
                  <div className={styles.containerSelector}>
                    <p className={styles.subtituloBalcaoSelector}>
                      Escolha o balcão:
                    </p>
                  </div>
                  <div className={styles.balcaoSelector}>
                    <Select
                      classNamePrefix="custom"
                      options={balcaoOptions}
                      value={balcao}
                      onChange={setBalcao}
                      placeholder="Selecione o balcão"
                      isSearchable={false}
                    />
                  </div>
                </>
              )}
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
              <strong className={styles.cardValor}>
                {pedidosFiltrados.length}
              </strong>
              <p className={styles.cardSub}>
                {pedidosFiltrados.length === 1
                  ? "pedido no dia"
                  : "pedidos no dia"}
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
              <strong className={styles.cardValor}>
                {formatarMoeda(totalVendas)}
              </strong>
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
                <MagnifyingGlassIcon
                  size={18}
                  weight="bold"
                  className={styles.cabecalhoIcone}
                />
                <h2>Pedidos encontrados</h2>
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
              {carregando ? (
                <div className={styles.estadoVazio}>
                  <div className={styles.spinner} />
                  <p>Buscando pedidos...</p>
                </div>
              ) : pedidosFiltrados.length === 0 ? (
                <div className={styles.estadoVazio}>
                  <FileTextIcon
                    size={44}
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
          </section>
        </div>
      </main>

      <Rodape />
    </div>
  );
}

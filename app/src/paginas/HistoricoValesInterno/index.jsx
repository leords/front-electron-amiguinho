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
  IdentificationCardIcon,
  UserIcon,
  FileCsvIcon,
} from "@phosphor-icons/react";
import { formatarMoeda } from "../../utils/formartarMoeda";
import { usarToast } from "../../componentes/Context/toastContext";
import { buscarValeInterno } from "../../operadores/API/pedido/buscarValeInterno";
import { useFormaPagamentoBalcao } from "../../hooks/useFormaPagamentoBalcao";
import {
  agruparValesPorColaborador,
  exportarValesColaboradoresCSV,
} from "../../utils/exportarValesColaboradoresExcel";

export default function HistoricoValesInterno() {
  // Hook
  const { listaFormaPagamento } = useFormaPagamentoBalcao();
  const { setMensagem } = usarToast();

  // Estados com intervalo do 1º dia do mês atual até a data de hoje
  const [dataInicio, setDataInicio] = useState(() => {
    const agora = new Date();
    return dataFormatadaCalendario(
      new Date(agora.getFullYear(), agora.getMonth(), 1),
    );
  });
  const [dataFim, setDataFim] = useState(() => dataFormatadaCalendario());
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [totalVendas, setTotalVendas] = useState(0);
  const [nomeFormaPagamento, setNomeFormaPagamento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [exportandoCSV, setExportandoCSV] = useState(false);

  // Lista à ser ignoradas
  const ignorarItensLista = [
    "A VISTA",
    "PIX",
    "CARTÃO",
    "CHEQUE",
    "ORÇAMENTO",
    "BOLETO",
  ];

  // Filtrando formas de pagamento, ignorando a lista ácima
  const listaFormasPagamentoFiltrada = listaFormaPagamento?.filter(
    (forma) => !ignorarItensLista.includes(forma.nome),
  );

  // Garantindo datas: 1º dia do mês atual até o dia atual
  useEffect(() => {
    const agora = new Date();
    const primeiroDia = new Date(agora.getFullYear(), agora.getMonth(), 1);
    setDataInicio(dataFormatadaCalendario(primeiroDia));
    setDataFim(dataFormatadaCalendario(agora));
  }, []);

  // Buscando vales internos
  useEffect(() => {
    if (!dataInicio || !dataFim) return;

    const filtrarPedidos = async () => {
      setCarregando(true);
      try {
        const resultado = await buscarValeInterno({
          setor: "balcao",
          dataInicio,
          dataFim,
          formaPagamento: formaPagamento,
        });

        setPedidosFiltrados(resultado);
      } catch (error) {
        setMensagem(error.message);
        console.error(error.message);
      } finally {
        setCarregando(false);
      }
    };
    filtrarPedidos();
  }, [dataInicio, dataFim, formaPagamento, setMensagem]);

  // Filtra apenas pedidos válidos (não cancelados) para totais e contagens
  const pedidosValidos = pedidosFiltrados.filter(
    (p) => String(p.status || "").toLowerCase() !== "cancelado"
  );
  const totalCancelados = pedidosFiltrados.filter(
    (p) => String(p.status || "").toLowerCase() === "cancelado"
  ).length;

  // Realizando a soma total do retorno dos pedidos buscados (desconsiderando cancelados)
  useEffect(() => {
    const validos = pedidosFiltrados.filter(
      (p) => String(p.status || "").toLowerCase() !== "cancelado"
    );

    const total = validos.reduce((acc, pedido) => {
      // Se selecionou um colaborador/forma específica, soma apenas a parte do vale dele
      if (formaPagamento) {
        const pagamentosColaborador = (pedido.pagamentos || []).filter(
          (pg) =>
            String(pg.formaPagamento?.nome || "").toUpperCase().trim() ===
            String(formaPagamento).toUpperCase().trim()
        );

        if (pagamentosColaborador.length > 0) {
          const somaForma = pagamentosColaborador.reduce(
            (somaPg, pg) => somaPg + Number(pg.valor || 0),
            0
          );
          return acc + somaForma;
        }

        return acc + Number(pedido.total || 0);
      }

      // Se for GERAL (todas as formas de vale): soma os pagamentos de vales
      if (Array.isArray(pedido.pagamentos) && pedido.pagamentos.length > 0) {
        const pagamentosVale = pedido.pagamentos.filter((pg) => {
          const nomePg = String(pg.formaPagamento?.nome || "").toUpperCase().trim();
          return !ignorarItensLista.includes(nomePg);
        });

        if (pagamentosVale.length > 0) {
          return (
            acc +
            pagamentosVale.reduce((somaPg, pg) => somaPg + Number(pg.valor || 0), 0)
          );
        }
      }

      // Fallback para pedidos sem pagamentos detalhados
      const somaItens = Array.isArray(pedido.itens)
        ? pedido.itens.reduce((soma, item) => soma + Number(item.valorTotal || 0), 0)
        : Number(pedido.total || 0);

      return acc + somaItens;
    }, 0);

    setTotalVendas(total);
  }, [pedidosFiltrados, formaPagamento]);

  // Manipulador para baixar o CSV do mês atual completo (dia 01 até hoje)
  const tratarBaixarCSV = async () => {
    setExportandoCSV(true);
    try {
      const agora = new Date();
      const primeiroDia = dataFormatadaCalendario(
        new Date(agora.getFullYear(), agora.getMonth(), 1)
      );
      const hoje = dataFormatadaCalendario(agora);

      // Busca todos os vales internos do mês atual completo sem filtro de colaborador específico
      const pedidosMes = await buscarValeInterno({
        setor: "balcao",
        dataInicio: primeiroDia,
        dataFim: hoje,
        formaPagamento: "",
      });

      const colaboradoresAgrupados = agruparValesPorColaborador(pedidosMes);

      if (colaboradoresAgrupados.length === 0) {
        setMensagem("Nenhum vale interno ativo encontrado no período deste mês.");
        return;
      }

      const res = exportarValesColaboradoresCSV(colaboradoresAgrupados, {
        dataInicio: primeiroDia,
        dataFim: hoje,
      });

      setMensagem(
        `CSV exportado com sucesso! (${res.quantidade} colaborador${
          res.quantidade !== 1 ? "es" : ""
        })`
      );
    } catch (error) {
      console.error("Erro ao exportar CSV de vales:", error);
      setMensagem(error.message || "Erro ao exportar CSV de vales");
    } finally {
      setExportandoCSV(false);
    }
  };

  return (
    <div className={styles.container}>
      <Cabecalho />

      <main className={styles.principal}>
        {/* CABEÇALHO */}
        <div className={styles.cabecalhoPage}>
          <div className={styles.tituloSection}>
            <div className={styles.iconeWrapper}>
              <IdentificationCardIcon size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Terminal de caixa</p>
              <div className={styles.tituloLinha}>
                <h1 className={styles.menuTitulo}>Vales Internos</h1>
                <button
                  type="button"
                  className={styles.botaoExportarCSV}
                  onClick={tratarBaixarCSV}
                  disabled={exportandoCSV}
                  title="Baixar lista em CSV com o total gasto de cada colaborador no mês atual"
                >
                  <FileCsvIcon size={18} weight="bold" />
                  {exportandoCSV ? "Baixando CSV..." : "Baixar CSV"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PAINEL DE FILTROS */}
        <div className={styles.painelFiltros}>
          <div className={styles.filtrosHeader}>
            <UserIcon size={14} weight="bold" className={styles.filtroIcone} />
            <span>Filtros</span>
          </div>

          <div className={styles.filtrosGrid}>
            {/* COLABORADOR */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>Colaborador</label>
              <select
                value={formaPagamento}
                onChange={(e) => {
                  setFormaPagamento(e.target.value);
                  setNomeFormaPagamento(e.target.value);
                }}
                className={styles.selectInput}
              >
                <option value="">GERAL</option>
                {listaFormasPagamentoFiltrada?.map((forma) => (
                  <option key={forma.id} value={forma.nome}>
                    {forma.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* DATA INICIAL */}
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

            {/* DATA FINAL */}
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

        {/* CARDS DE RESUMO */}
        <div className={styles.resumoCards}>
          <div className={styles.card}>
            <div className={styles.cardIcone} data-color="orange">
              <FileTextIcon size={20} weight="fill" />
            </div>
            <div>
              <p className={styles.cardLabel}>Total de pedidos</p>
              <strong className={styles.cardValor}>
                {pedidosValidos.length}
              </strong>
              <p className={styles.cardSub}>
                {pedidosValidos.length === 1
                  ? "pedido ativo"
                  : "pedidos ativos"}
                {totalCancelados > 0 && ` (${totalCancelados} cancelado${totalCancelados !== 1 ? "s" : ""})`}
              </p>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcone} data-color="green">
              <CurrencyDollarIcon size={20} weight="fill" />
            </div>
            <div>
              <p className={styles.cardLabel}>Total em vales</p>
              <strong className={styles.cardValor}>
                {formatarMoeda(totalVendas)}
              </strong>
              <p className={styles.cardSub}>valor total ativo no período</p>
            </div>
          </div>
        </div>

        {/* CONTEUDO PRINCIPAL */}
        <div className={styles.main}>
          <section className={styles.containerLista}>
            <div className={styles.cabecalhoLista}>
              <div className={styles.cabecalhoListaEsq}>
                <MagnifyingGlassIcon
                  size={18}
                  weight="bold"
                  className={styles.cabecalhoIcone}
                />
                <h2>Pedidos encontrados</h2>
                {nomeFormaPagamento && (
                  <span className={styles.badgeColaborador}>
                    {nomeFormaPagamento}
                  </span>
                )}
                {!carregando && pedidosFiltrados.length > 0 && (
                  <span className={styles.contador}>
                    {pedidosValidos.length}{" "}
                    {pedidosValidos.length === 1 ? "ativo" : "ativos"}
                    {totalCancelados > 0 && ` (${totalCancelados} cancelado${totalCancelados !== 1 ? "s" : ""})`}
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
                    <FileTextIcon
                      size={44}
                      weight="duotone"
                      className={styles.iconeVazio}
                    />
                    <p>Nenhum vale encontrado</p>
                    <span>Não há vales registrados para este período</span>
                  </div>
                ) : (
                  <ItemListaHistorico pedidos={pedidosFiltrados} />
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <Rodape />
    </div>
  );
}

import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import { formatarMoeda } from "../../utils/formartarMoeda";
import { dataHoraFormatada, dataFormatadaCalendario } from "../../utils/data";
import { buscarPedido } from "../../operadores/API/pedido/buscarPedido";
import { LerClienteDelivery } from "../../operadores/API/cliente/lerClienteDelivery";
import { LerClienteExterno } from "../../operadores/API/cliente/lerClienteExterno";
import { usarToast } from "../../componentes/Context/toastContext";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";

import {
  ArrowLeft,
  ArrowsClockwise,
  ChartLineUp,
  CurrencyDollar,
  TrendUp,
  TrendDown,
  Equals,
  Receipt,
  Users,
  MagnifyingGlass,
  Funnel,
  FileXls,
  WarningCircle,
  CalendarBlank,
} from "@phosphor-icons/react";

// Função para calcular diferença em dias
const calcularDiasAtras = (dataStr) => {
  if (!dataStr) return null;
  const data = new Date(dataStr);
  if (isNaN(data.getTime())) return null;
  const hoje = new Date();
  const diffMs = hoje.getTime() - data.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

export default function GestaoDesempenhoClientes() {
  const navegar = useNavigate();
  const { mensagem, setMensagem } = usarToast();

  const [carregando, setCarregando] = useState(false);
  const [clientesOriginais, setClientesOriginais] = useState([]);
  const [pedidosCarregados, setPedidosCarregados] = useState([]);

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroSetor, setFiltroSetor] = useState("todos"); // 'todos' | 'delivery' | 'externo'
  const [filtroVendedor, setFiltroVendedor] = useState("todos");
  const [filtroTendencia, setFiltroTendencia] = useState("todos"); // 'todos' | 'crescimento' | 'queda' | 'estavel'
  const [ordenacao, setOrdenacao] = useState("totalDesc"); // 'totalDesc' | 'crescimentoDesc' | 'pedidosDesc' | 'recenteDesc'

  // Período de análise
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth(); // 0 a 11

  // Carrega clientes e pedidos do período recente
  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      // 1. Busca todos os clientes cadastrados (Delivery e Externo)
      const [resDeliv, resExt] = await Promise.allSettled([
        LerClienteDelivery(),
        LerClienteExterno(),
      ]);

      let todosClientes = [];
      if (resDeliv.status === "fulfilled" && Array.isArray(resDeliv.value)) {
        todosClientes = todosClientes.concat(
          resDeliv.value.map((c) => ({
            ...c,
            _setor: "delivery",
            vendedor: c.vendedor || "Balcão / Delivery",
          }))
        );
      }
      if (resExt.status === "fulfilled" && Array.isArray(resExt.value)) {
        todosClientes = todosClientes.concat(
          resExt.value.map((c) => ({
            ...c,
            _setor: "externo",
            vendedor: c.vendedor || "Não informado",
          }))
        );
      }

      setClientesOriginais(todosClientes);

      // 2. Busca pedidos recentes (últimos 180 dias para cobrir mês atual, anterior e histórico)
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - 180);
      const dataInicioStr = dataFormatadaCalendario(dataInicio);
      const dataFimStr = dataFormatadaCalendario(new Date());

      const [pedDeliv, pedExt] = await Promise.allSettled([
        buscarPedido({
          setor: "delivery",
          dataInicio: dataInicioStr,
          dataFim: dataFimStr,
        }),
        buscarPedido({
          setor: "externo",
          dataInicio: dataInicioStr,
          dataFim: dataFimStr,
        }),
      ]);

      let todosPedidos = [];
      if (pedDeliv.status === "fulfilled") {
        const lista = Array.isArray(pedDeliv.value)
          ? pedDeliv.value
          : Array.isArray(pedDeliv.value?.resultado)
          ? pedDeliv.value.resultado
          : [];
        todosPedidos = todosPedidos.concat(
          lista.map((p) => ({ ...p, _setor: "delivery" }))
        );
      }
      if (pedExt.status === "fulfilled") {
        const lista = Array.isArray(pedExt.value)
          ? pedExt.value
          : Array.isArray(pedExt.value?.resultado)
          ? pedExt.value.resultado
          : [];
        todosPedidos = todosPedidos.concat(
          lista.map((p) => ({ ...p, _setor: "externo" }))
        );
      }

      setPedidosCarregados(todosPedidos);
    } catch (err) {
      console.error("Erro ao carregar dados de desempenho de clientes:", err);
      setMensagem("Erro ao carregar dados: " + (err.message || "Erro desconhecido"));
    } finally {
      setCarregando(false);
    }
  }, [setMensagem]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Lista única de vendedores para o filtro dropdown
  const listaVendedores = useMemo(() => {
    const vends = new Set();
    clientesOriginais.forEach((c) => {
      if (c.vendedor && c.vendedor !== "Não informado") {
        vends.add(String(c.vendedor).trim());
      }
    });
    return Array.from(vends).sort();
  }, [clientesOriginais]);

  // Cruzamento dos dados: clientes + pedidos + métricas de crescimento
  const dadosPerformanceClientes = useMemo(() => {
    if (!clientesOriginais.length) return [];

    // Mapeia pedidos por clienteId ou por nome
    const mapaPedidos = new Map();
    const mapaPedidosPorNome = new Map();

    pedidosCarregados.forEach((p) => {
      if (String(p.status || "").toLowerCase() === "cancelado") return;

      const cId = p.clienteId ?? p.cliente?.id ?? p.idCliente;
      if (cId) {
        const idNum = Number(cId);
        if (!mapaPedidos.has(idNum)) mapaPedidos.set(idNum, []);
        mapaPedidos.get(idNum).push(p);
      }

      const cNome = (p.cliente?.nome || p.nomeCliente || "").trim().toLowerCase();
      if (cNome) {
        if (!mapaPedidosPorNome.has(cNome)) mapaPedidosPorNome.set(cNome, []);
        mapaPedidosPorNome.get(cNome).push(p);
      }
    });

    const dataHoje = new Date();
    const anoAtualRef = dataHoje.getFullYear();
    const mesAtualRef = dataHoje.getMonth(); // 0-11

    // Mês anterior
    const anoAnteriorRef = mesAtualRef === 0 ? anoAtualRef - 1 : anoAtualRef;
    const mesAnteriorRef = mesAtualRef === 0 ? 11 : mesAtualRef - 1;

    return clientesOriginais.map((cliente) => {
      // Recupera pedidos do cliente
      let pedidosDoCliente = [];
      if (cliente.id && mapaPedidos.has(Number(cliente.id))) {
        pedidosDoCliente = mapaPedidos.get(Number(cliente.id));
      } else if (cliente.nome) {
        const nomeLimpo = String(cliente.nome).trim().toLowerCase();
        pedidosDoCliente = mapaPedidosPorNome.get(nomeLimpo) || [];
      }

      // 1. Total de Vendas e Quantidade
      const totalVendas = pedidosDoCliente.reduce(
        (acc, p) => acc + Number(p.total || p.valorTotal || 0),
        0
      );
      const quantidadePedidos = pedidosDoCliente.length;
      const ticketMedio = quantidadePedidos > 0 ? totalVendas / quantidadePedidos : 0;

      // 2. Data da Última Compra
      let dataUltimaCompra = null;
      let valorUltimaCompra = 0;
      if (pedidosDoCliente.length > 0) {
        const pedidosOrdenados = [...pedidosDoCliente].sort((a, b) => {
          const tA = new Date(a.data || a.createdAt || 0).getTime();
          const tB = new Date(b.data || b.createdAt || 0).getTime();
          return tB - tA;
        });
        const maisRecente = pedidosOrdenados[0];
        dataUltimaCompra = maisRecente.data || maisRecente.createdAt;
        valorUltimaCompra = Number(maisRecente.total || maisRecente.valorTotal || 0);
      }

      const diasSemCompra = calcularDiasAtras(dataUltimaCompra);

      // 3. Vendas no Mês Atual vs Mês Anterior
      let vendasMesAtual = 0;
      let vendasMesAnterior = 0;

      pedidosDoCliente.forEach((p) => {
        const d = new Date(p.data || p.createdAt);
        if (isNaN(d.getTime())) return;
        const pAno = d.getFullYear();
        const pMes = d.getMonth();
        const valor = Number(p.total || p.valorTotal || 0);

        if (pAno === anoAtualRef && pMes === mesAtualRef) {
          vendasMesAtual += valor;
        } else if (pAno === anoAnteriorRef && pMes === mesAnteriorRef) {
          vendasMesAnterior += valor;
        }
      });

      // Cálculo do % de crescimento vs mês anterior
      let percentualCrescimento = 0;
      let tendencia = "estavel"; // 'crescimento' | 'queda' | 'estavel'

      if (vendasMesAnterior > 0) {
        const diff = vendasMesAtual - vendasMesAnterior;
        percentualCrescimento = Number(((diff / vendasMesAnterior) * 100).toFixed(1));
        if (percentualCrescimento > 0.5) tendencia = "crescimento";
        else if (percentualCrescimento < -0.5) tendencia = "queda";
        else tendencia = "estavel";
      } else if (vendasMesAtual > 0) {
        percentualCrescimento = 100;
        tendencia = "crescimento";
      } else {
        percentualCrescimento = 0;
        tendencia = "estavel";
      }

      return {
        cliente,
        totalVendas,
        quantidadePedidos,
        ticketMedio,
        dataUltimaCompra,
        diasSemCompra,
        valorUltimaCompra,
        vendasMesAtual,
        vendasMesAnterior,
        percentualCrescimento,
        tendencia,
      };
    });
  }, [clientesOriginais, pedidosCarregados]);

  // Filtragem e Ordenação
  const dadosFiltrados = useMemo(() => {
    let filtrados = dadosPerformanceClientes;

    // Filtro por setor
    if (filtroSetor !== "todos") {
      filtrados = filtrados.filter(
        (item) => String(item.cliente._setor || "").toLowerCase() === filtroSetor
      );
    }

    // Filtro por vendedor
    if (filtroVendedor !== "todos") {
      filtrados = filtrados.filter(
        (item) => String(item.cliente.vendedor || "").trim() === filtroVendedor
      );
    }

    // Filtro por tendência
    if (filtroTendencia !== "todos") {
      filtrados = filtrados.filter((item) => item.tendencia === filtroTendencia);
    }

    // Busca por texto
    if (busca.trim()) {
      const termo = busca.trim().toLowerCase();
      filtrados = filtrados.filter((item) => {
        const matchNome = String(item.cliente.nome || "").toLowerCase().includes(termo);
        const matchDoc = String(
          item.cliente.cpf || item.cliente.cnpj || item.cliente.documento || ""
        ).includes(termo);
        const matchVendedor = String(item.cliente.vendedor || "")
          .toLowerCase()
          .includes(termo);
        return matchNome || matchDoc || matchVendedor;
      });
    }

    // Ordenação
    return [...filtrados].sort((a, b) => {
      if (ordenacao === "totalDesc") return b.totalVendas - a.totalVendas;
      if (ordenacao === "totalAsc") return a.totalVendas - b.totalVendas;
      if (ordenacao === "crescimentoDesc")
        return b.percentualCrescimento - a.percentualCrescimento;
      if (ordenacao === "pedidosDesc") return b.quantidadePedidos - a.quantidadePedidos;
      if (ordenacao === "recenteDesc") {
        const timeA = a.dataUltimaCompra ? new Date(a.dataUltimaCompra).getTime() : 0;
        const timeB = b.dataUltimaCompra ? new Date(b.dataUltimaCompra).getTime() : 0;
        return timeB - timeA;
      }
      return 0;
    });
  }, [dadosPerformanceClientes, filtroSetor, filtroVendedor, filtroTendencia, busca, ordenacao]);

  // Totais dos Cards de KPIs
  const kpis = useMemo(() => {
    const totalFaturado = dadosFiltrados.reduce((acc, c) => acc + c.totalVendas, 0);
    const totalPedidos = dadosFiltrados.reduce((acc, c) => acc + c.quantidadePedidos, 0);
    const clientesComCompras = dadosFiltrados.filter((c) => c.quantidadePedidos > 0).length;
    const emCrescimento = dadosFiltrados.filter((c) => c.tendencia === "crescimento").length;
    const emQueda = dadosFiltrados.filter((c) => c.tendencia === "queda").length;

    return {
      totalFaturado,
      totalPedidos,
      clientesComCompras,
      emCrescimento,
      emQueda,
      totalClientes: dadosFiltrados.length,
    };
  }, [dadosFiltrados]);

  // Navega para o Relatório Individual do Cliente
  const tratarAbrirRelatorioCliente = (cliente) => {
    navegar("/relatorio-cliente", {
      state: {
        cliente,
      },
    });
  };

  // Exportar lista para Excel (CSV com BOM UTF-8)
  const tratarExportarExcel = () => {
    try {
      const cabecalho = [
        "ID",
        "Cliente",
        "Setor",
        "Vendedor",
        "Total Vendas (R$)",
        "Qtd Pedidos",
        "Ticket Medio (R$)",
        "Ultima Compra",
        "Dias sem Comprar",
        "Vendas Mes Atual (R$)",
        "Vendas Mes Anterior (R$)",
        "Crescimento (%)",
        "Tendencia",
      ].join(";");

      const linhas = dadosFiltrados.map((item) => {
        const c = item.cliente;
        return [
          c.id || "",
          `"${(c.nome || "").replace(/"/g, '""')}"`,
          c._setor?.toUpperCase() || "GERAL",
          `"${(c.vendedor || "").replace(/"/g, '""')}"`,
          item.totalVendas.toFixed(2).replace(".", ","),
          item.quantidadePedidos,
          item.ticketMedio.toFixed(2).replace(".", ","),
          item.dataUltimaCompra ? dataHoraFormatada(item.dataUltimaCompra) : "Nunca comprou",
          item.diasSemCompra !== null ? `${item.diasSemCompra} dias` : "Sem registro",
          item.vendasMesAtual.toFixed(2).replace(".", ","),
          item.vendasMesAnterior.toFixed(2).replace(".", ","),
          `${item.percentualCrescimento.toFixed(1)}%`.replace(".", ","),
          item.tendencia.toUpperCase(),
        ].join(";");
      });

      const conteudoCSV = "\uFEFF" + [cabecalho, ...linhas].join("\r\n");
      const blob = new Blob([conteudoCSV], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `desempenho-clientes-${dataFormatadaCalendario(new Date())}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      setMensagem("Planilha exportada com sucesso!");
    } catch (err) {
      console.error("Erro ao exportar:", err);
      setMensagem("Erro ao exportar planilha.");
    }
  };

  return (
    <div className={styles.container}>
      <ToastRadix mensagem={mensagem} />
      <Cabecalho />

      <main className={styles.principal}>
        {/* CABEÇALHO DA PÁGINA */}
        <div className={styles.cabecalhoPage}>
          <div className={styles.tituloSection}>
            <div className={styles.iconeWrapper}>
              <ChartLineUp size={24} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Gestão / Relatórios de Vendas</p>
              <h1 className={styles.pageTitulo}>Desempenho de Clientes</h1>
            </div>
          </div>

          <div className={styles.acoesCabecalho}>
            <button
              type="button"
              className={styles.botaoSecundario}
              onClick={carregarDados}
              disabled={carregando}
              title="Recarregar dados"
            >
              <ArrowsClockwise
                size={16}
                weight="bold"
                className={carregando ? styles.girando : ""}
              />
              Atualizar
            </button>

            <button
              type="button"
              className={styles.botaoExcel}
              onClick={tratarExportarExcel}
              disabled={carregando || dadosFiltrados.length === 0}
              title="Exportar para Excel (CSV)"
            >
              <FileXls size={18} weight="bold" />
              Exportar Planilha
            </button>

            <button
              type="button"
              className={styles.botaoVoltar}
              onClick={() => navegar("/gestao")}
            >
              <ArrowLeft size={16} weight="bold" />
              Voltar
            </button>
          </div>
        </div>

        {/* 4 CARDS DE KPIS */}
        <div className={styles.kpiGrid}>
          <div className={`${styles.kpiCard} ${styles.kpiVerde}`}>
            <div className={styles.kpiIconeWrapper}>
              <CurrencyDollar size={22} weight="bold" />
            </div>
            <div className={styles.kpiConteudo}>
              <span className={styles.kpiRotulo}>Faturamento Total</span>
              <strong className={styles.kpiValor}>{formatarMoeda(kpis.totalFaturado)}</strong>
              <span className={styles.kpiSub}>Em compras acumuladas</span>
            </div>
          </div>

          <div className={`${styles.kpiCard} ${styles.kpiAzul}`}>
            <div className={styles.kpiIconeWrapper}>
              <Users size={22} weight="bold" />
            </div>
            <div className={styles.kpiConteudo}>
              <span className={styles.kpiRotulo}>Clientes Ativos</span>
              <strong className={styles.kpiValor}>
                {kpis.clientesComCompras}{" "}
                <small style={{ fontSize: 13, color: "var(--gray-500)" }}>
                  / {kpis.totalClientes}
                </small>
              </strong>
              <span className={styles.kpiSub}>Clientes com compras registradas</span>
            </div>
          </div>

          <div className={`${styles.kpiCard} ${styles.kpiRoxo}`}>
            <div className={styles.kpiIconeWrapper}>
              <Receipt size={22} weight="bold" />
            </div>
            <div className={styles.kpiConteudo}>
              <span className={styles.kpiRotulo}>Total de Pedidos</span>
              <strong className={styles.kpiValor}>{kpis.totalPedidos}</strong>
              <span className={styles.kpiSub}>Volume total de pedidos</span>
            </div>
          </div>

          <div className={`${styles.kpiCard} ${styles.kpiLaranja}`}>
            <div className={styles.kpiIconeWrapper}>
              <TrendUp size={22} weight="bold" />
            </div>
            <div className={styles.kpiConteudo}>
              <span className={styles.kpiRotulo}>Balanço de Crescimento</span>
              <strong className={styles.kpiValor}>
                <span style={{ color: "var(--green)" }}>▲ {kpis.emCrescimento}</span>{" "}
                <span style={{ fontSize: 14, color: "var(--gray-500)" }}>|</span>{" "}
                <span style={{ color: "var(--red)" }}>▼ {kpis.emQueda}</span>
              </strong>
              <span className={styles.kpiSub}>Crescimento vs Mês Anterior</span>
            </div>
          </div>
        </div>

        {/* BARRA DE FILTROS */}
        <div className={styles.filtrosBarra}>
          <div className={styles.buscaWrapper}>
            <MagnifyingGlass size={18} className={styles.iconeBusca} />
            <input
              type="text"
              placeholder="Buscar cliente por nome, documento ou vendedor..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={styles.inputBusca}
            />
          </div>

          <div className={styles.filtrosControle}>
            {/* SETOR */}
            <div className={styles.filtroItem}>
              <label>Setor:</label>
              <select
                value={filtroSetor}
                onChange={(e) => setFiltroSetor(e.target.value)}
                className={styles.selectFiltro}
              >
                <option value="todos">Todos os Setores</option>
                <option value="delivery">Delivery</option>
                <option value="externo">Externo (Rotas)</option>
              </select>
            </div>

            {/* VENDEDOR */}
            <div className={styles.filtroItem}>
              <label>Vendedor:</label>
              <select
                value={filtroVendedor}
                onChange={(e) => setFiltroVendedor(e.target.value)}
                className={styles.selectFiltro}
              >
                <option value="todos">Todos os Vendedores</option>
                {listaVendedores.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* TENDÊNCIA */}
            <div className={styles.filtroItem}>
              <label>Tendência:</label>
              <select
                value={filtroTendencia}
                onChange={(e) => setFiltroTendencia(e.target.value)}
                className={styles.selectFiltro}
              >
                <option value="todos">Todas as Tendências</option>
                <option value="crescimento">Crescimento (▲)</option>
                <option value="queda">Em Queda (▼)</option>
                <option value="estavel">Estável (=)</option>
              </select>
            </div>

            {/* ORDENAÇÃO */}
            <div className={styles.filtroItem}>
              <label>Ordenar:</label>
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value)}
                className={styles.selectFiltro}
              >
                <option value="totalDesc">Maior Faturamento</option>
                <option value="totalAsc">Menor Faturamento</option>
                <option value="crescimentoDesc">Maior Crescimento (%)</option>
                <option value="pedidosDesc">Mais Pedidos</option>
                <option value="recenteDesc">Compra Mais Recente</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABELA DE PERFORMANCE DE CLIENTES */}
        <div className={styles.tabelaContainer}>
          <div className={styles.tabelaWrapper}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th style={{ width: "90px" }}>Setor</th>
                  <th>Vendedor</th>
                  <th style={{ width: "130px" }} className={styles.textRight}>
                    Total Vendas
                  </th>
                  <th style={{ width: "90px" }} className={styles.textCenter}>
                    Pedidos
                  </th>
                  <th style={{ width: "120px" }} className={styles.textRight}>
                    Ticket Médio
                  </th>
                  <th style={{ width: "150px" }}>Última Compra</th>
                  <th style={{ width: "130px" }} className={styles.textCenter}>
                    vs. Mês Anterior
                  </th>
                  <th style={{ width: "80px" }} className={styles.textCenter}>
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan="9" className={styles.tabelaVazia}>
                      <ArrowsClockwise size={26} className={styles.girando} />
                      <p>Calculando desempenho de vendas dos clientes...</p>
                    </td>
                  </tr>
                ) : dadosFiltrados.length > 0 ? (
                  dadosFiltrados.map((item) => {
                    const c = item.cliente;
                    const docFormatado = c.cpf || c.cnpj || c.documento || "";

                    return (
                      <tr key={`${c._setor}-${c.id}`}>
                        <td>
                          <div className={styles.clienteInfoCelula}>
                            <strong className={styles.clienteNomeTabela}>{c.nome}</strong>
                            {docFormatado && (
                              <span className={styles.clienteDocTabela}>
                                #{c.id} • {docFormatado}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`${styles.badgeSetor} ${
                              c._setor === "externo" ? styles.setorExterno : styles.setorDelivery
                            }`}
                          >
                            {c._setor?.toUpperCase() || "GERAL"}
                          </span>
                        </td>
                        <td>
                          <span className={styles.vendedorTexto}>
                            {c.vendedor || "Não informado"}
                          </span>
                        </td>
                        <td className={styles.textRight}>
                          <strong className={styles.totalVendasTexto}>
                            {formatarMoeda(item.totalVendas)}
                          </strong>
                        </td>
                        <td className={styles.textCenter}>
                          <span className={styles.badgeQtdPedidos}>
                            {item.quantidadePedidos}
                          </span>
                        </td>
                        <td className={styles.textRight}>
                          {formatarMoeda(item.ticketMedio)}
                        </td>
                        <td>
                          {item.dataUltimaCompra ? (
                            <div className={styles.ultimaCompraInfo}>
                              <span>{dataHoraFormatada(item.dataUltimaCompra)}</span>
                              <small className={styles.diasAtrasBadge}>
                                {item.diasSemCompra === 0
                                  ? "Hoje"
                                  : item.diasSemCompra === 1
                                  ? "Ontem"
                                  : `há ${item.diasSemCompra} dias`}
                              </small>
                            </div>
                          ) : (
                            <span className={styles.nuncaComprouTexto}>Nunca comprou</span>
                          )}
                        </td>
                        <td className={styles.textCenter}>
                          <span
                            className={`${styles.badgeTendencia} ${
                              item.tendencia === "crescimento"
                                ? styles.tendenciaCrescimento
                                : item.tendencia === "queda"
                                ? styles.tendenciaQueda
                                : styles.tendenciaEstavel
                            }`}
                          >
                            {item.tendencia === "crescimento" ? (
                              <TrendUp size={14} weight="bold" />
                            ) : item.tendencia === "queda" ? (
                              <TrendDown size={14} weight="bold" />
                            ) : (
                              <Equals size={14} weight="bold" />
                            )}
                            {item.percentualCrescimento > 0
                              ? `+${item.percentualCrescimento}%`
                              : `${item.percentualCrescimento}%`}
                          </span>
                        </td>
                        <td className={styles.textCenter}>
                          {/* BOTÃO QUE ABRE O RELATÓRIO COMPLETO DO CLIENTE */}
                          <button
                            type="button"
                            className={styles.btnVerRelatorio}
                            onClick={() => tratarAbrirRelatorioCliente(c)}
                            title={`Abrir relatório completo e histórico de ${c.nome}`}
                          >
                            <ChartLineUp size={16} weight="bold" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className={styles.tabelaVazia}>
                      <WarningCircle size={26} />
                      <p>Nenhum cliente encontrado para os filtros selecionados.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Rodape />
    </div>
  );
}


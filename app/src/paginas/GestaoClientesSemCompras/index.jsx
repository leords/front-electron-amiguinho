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
  UserMinus,
  CalendarBlank,
  ClockAfternoon,
  WarningCircle,
  WhatsappLogo,
  Phone,
  MapPin,
  MagnifyingGlass,
  FileXls,
  ChartLineUp,
  User,
  CheckCircle,
} from "@phosphor-icons/react";

// Calcula dias decorridos desde a data da última compra
const calcularDiasSemCompra = (dataStr) => {
  if (!dataStr) return 9999; // Representa nunca comprou
  const data = new Date(dataStr);
  if (isNaN(data.getTime())) return 9999;
  const hoje = new Date();
  const diffMs = hoje.getTime() - data.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

export default function GestaoClientesSemCompras() {
  const navegar = useNavigate();
  const { mensagem, setMensagem } = usarToast();

  const [carregando, setCarregando] = useState(false);
  const [clientesBase, setClientesBase] = useState([]);
  const [pedidosBase, setPedidosBase] = useState([]);

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroVendedor, setFiltroVendedor] = useState("todos");
  const [filtroDias, setFiltroDias] = useState("30"); // 'todos' | '30' | '60' | '90' | '120'
  const [filtroSetor, setFiltroSetor] = useState("todos"); // 'todos' | 'delivery' | 'externo'
  const [ordenacao, setOrdenacao] = useState("diasDesc"); // 'diasDesc' | 'diasAsc' | 'nomeAsc' | 'valorDesc'

  function abrirLinkExterno(url) {
    if (window.LINK && window.LINK.abrirLinkExterno && url) {
      window.LINK.abrirLinkExterno(url);
    } else if (url) {
      window.open(url, "_blank");
    }
  }

  // Atalho direto de WhatsApp com mensagem de saudação
  const tratarAbrirWhatsApp = (cliente, dias) => {
    const limpo = String(cliente.telefone || "").replace(/\D/g, "");
    if (!limpo) {
      setMensagem("Este cliente não possui telefone válido cadastrado.");
      return;
    }
    const ddi = limpo.startsWith("55") ? limpo : `55${limpo}`;
    const primeiroNome = String(cliente.nome || "Cliente").split(" ")[0];
    const textoMsg = encodeURIComponent(
      `Olá, ${primeiroNome}! Tudo bem? Sentimos sua falta aqui na Amigão Distribuidora. Gostaríamos de saber como podemos te atender hoje e apresentar nossas promoções especiais!`
    );
    const url = `https://wa.me/${ddi}?text=${textoMsg}`;
    abrirLinkExterno(url);
  };

  // Carrega clientes e pedidos do histórico
  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
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

      setClientesBase(todosClientes);

      // Busca pedidos dos últimos 365 dias para identificar histórico e última compra
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - 365);
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
        todosPedidos = todosPedidos.concat(lista);
      }
      if (pedExt.status === "fulfilled") {
        const lista = Array.isArray(pedExt.value)
          ? pedExt.value
          : Array.isArray(pedExt.value?.resultado)
          ? pedExt.value.resultado
          : [];
        todosPedidos = todosPedidos.concat(lista);
      }

      setPedidosBase(todosPedidos);
    } catch (err) {
      console.error("Erro ao carregar clientes inativos:", err);
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
    clientesBase.forEach((c) => {
      if (c.vendedor && c.vendedor !== "Não informado") {
        vends.add(String(c.vendedor).trim());
      }
    });
    return Array.from(vends).sort();
  }, [clientesBase]);

  // Processa a data da última compra e dias de inatividade de cada cliente
  const todosClientesComStatusCompra = useMemo(() => {
    if (!clientesBase.length) return [];

    const mapaPedidosPorId = new Map();
    const mapaPedidosPorNome = new Map();

    pedidosBase.forEach((p) => {
      if (String(p.status || "").toLowerCase() === "cancelado") return;

      const cId = p.clienteId ?? p.cliente?.id ?? p.idCliente;
      if (cId) {
        const idNum = Number(cId);
        if (!mapaPedidosPorId.has(idNum)) mapaPedidosPorId.set(idNum, []);
        mapaPedidosPorId.get(idNum).push(p);
      }

      const cNome = (p.cliente?.nome || p.nomeCliente || "").trim().toLowerCase();
      if (cNome) {
        if (!mapaPedidosPorNome.has(cNome)) mapaPedidosPorNome.set(cNome, []);
        mapaPedidosPorNome.get(cNome).push(p);
      }
    });

    return clientesBase.map((cliente) => {
      let pedidosDoCliente = [];
      if (cliente.id && mapaPedidosPorId.has(Number(cliente.id))) {
        pedidosDoCliente = mapaPedidosPorId.get(Number(cliente.id));
      } else if (cliente.nome) {
        const nomeLimpo = String(cliente.nome).trim().toLowerCase();
        pedidosDoCliente = mapaPedidosPorNome.get(nomeLimpo) || [];
      }

      let dataUltimaCompra = null;
      let valorUltimaCompra = 0;
      let totalGastoHistorico = 0;

      if (pedidosDoCliente.length > 0) {
        totalGastoHistorico = pedidosDoCliente.reduce(
          (acc, p) => acc + Number(p.total || p.valorTotal || 0),
          0
        );

        const ordenados = [...pedidosDoCliente].sort((a, b) => {
          const tA = new Date(a.data || a.createdAt || 0).getTime();
          const tB = new Date(b.data || b.createdAt || 0).getTime();
          return tB - tA;
        });

        const maisRecente = ordenados[0];
        dataUltimaCompra = maisRecente.data || maisRecente.createdAt;
        valorUltimaCompra = Number(maisRecente.total || maisRecente.valorTotal || 0);
      }

      const diasSemCompra = calcularDiasSemCompra(dataUltimaCompra);
      const nuncaComprou = diasSemCompra >= 9999;

      return {
        cliente,
        pedidosCount: pedidosDoCliente.length,
        totalGastoHistorico,
        dataUltimaCompra,
        valorUltimaCompra,
        diasSemCompra,
        nuncaComprou,
      };
    });
  }, [clientesBase, pedidosBase]);

  // Filtra apenas os clientes que estão SEM COMPRAS (dias >= filtro ou >= 30)
  const clientesInativosFiltrados = useMemo(() => {
    let resultado = todosClientesComStatusCompra;

    // Filtro de dias sem compra (30, 60, 90, 120+)
    if (filtroDias === "30") {
      resultado = resultado.filter((item) => item.diasSemCompra >= 30 && item.diasSemCompra < 60);
    } else if (filtroDias === "60") {
      resultado = resultado.filter((item) => item.diasSemCompra >= 60 && item.diasSemCompra < 90);
    } else if (filtroDias === "90") {
      resultado = resultado.filter((item) => item.diasSemCompra >= 90 && item.diasSemCompra < 120);
    } else if (filtroDias === "120") {
      resultado = resultado.filter((item) => item.diasSemCompra >= 120);
    } else if (filtroDias === "todosInativos") {
      resultado = resultado.filter((item) => item.diasSemCompra >= 30);
    }

    // Filtro por Vendedor
    if (filtroVendedor !== "todos") {
      resultado = resultado.filter(
        (item) => String(item.cliente.vendedor || "").trim() === filtroVendedor
      );
    }

    // Filtro por Setor
    if (filtroSetor !== "todos") {
      resultado = resultado.filter(
        (item) => String(item.cliente._setor || "").toLowerCase() === filtroSetor
      );
    }

    // Filtro de Busca por texto
    if (busca.trim()) {
      const termo = busca.trim().toLowerCase();
      resultado = resultado.filter((item) => {
        const c = item.cliente;
        const matchNome = String(c.nome || "").toLowerCase().includes(termo);
        const matchDoc = String(c.cpf || c.cnpj || c.documento || "").includes(termo);
        const matchTel = String(c.telefone || "").includes(termo);
        const matchVend = String(c.vendedor || "").toLowerCase().includes(termo);
        const matchBairro = String(c.bairro || "").toLowerCase().includes(termo);
        const matchCidade = String(c.cidade || "").toLowerCase().includes(termo);
        return matchNome || matchDoc || matchTel || matchVend || matchBairro || matchCidade;
      });
    }

    // Ordenação
    return [...resultado].sort((a, b) => {
      if (ordenacao === "diasDesc") return b.diasSemCompra - a.diasSemCompra;
      if (ordenacao === "diasAsc") return a.diasSemCompra - b.diasSemCompra;
      if (ordenacao === "nomeAsc")
        return String(a.cliente.nome || "").localeCompare(String(b.cliente.nome || ""));
      if (ordenacao === "valorDesc") return b.valorUltimaCompra - a.valorUltimaCompra;
      return 0;
    });
  }, [todosClientesComStatusCompra, filtroDias, filtroVendedor, filtroSetor, busca, ordenacao]);

  // Contadores para os Cards de KPIs
  const contadoresFaixas = useMemo(() => {
    const todos = todosClientesComStatusCompra;
    const f30 = todos.filter((i) => i.diasSemCompra >= 30 && i.diasSemCompra < 60).length;
    const f60 = todos.filter((i) => i.diasSemCompra >= 60 && i.diasSemCompra < 90).length;
    const f90 = todos.filter((i) => i.diasSemCompra >= 90 && i.diasSemCompra < 120).length;
    const f120 = todos.filter((i) => i.diasSemCompra >= 120).length;
    const totalInativos = todos.filter((i) => i.diasSemCompra >= 30).length;

    return { f30, f60, f90, f120, totalInativos };
  }, [todosClientesComStatusCompra]);

  // Abre o relatório individual do cliente
  const tratarAbrirRelatorioCliente = (cliente) => {
    navegar("/relatorio-cliente", {
      state: {
        cliente,
      },
    });
  };

  // Exportar para Excel (CSV com BOM UTF-8)
  const tratarExportarExcel = () => {
    try {
      const cabecalho = [
        "ID",
        "Cliente",
        "Setor",
        "Vendedor",
        "Telefone",
        "Endereco",
        "Bairro",
        "Cidade",
        "Dias sem Comprar",
        "Ultima Compra (Data)",
        "Valor Ultima Compra (R$)",
        "Total Historico (R$)",
      ].join(";");

      const linhas = clientesInativosFiltrados.map((item) => {
        const c = item.cliente;
        return [
          c.id || "",
          `"${(c.nome || "").replace(/"/g, '""')}"`,
          c._setor?.toUpperCase() || "GERAL",
          `"${(c.vendedor || "").replace(/"/g, '""')}"`,
          c.telefone || "",
          `"${(c.endereco || "").replace(/"/g, '""')}"`,
          `"${(c.bairro || "").replace(/"/g, '""')}"`,
          `"${(c.cidade || "").replace(/"/g, '""')}"`,
          item.nuncaComprou ? "Nunca comprou" : `${item.diasSemCompra} dias`,
          item.dataUltimaCompra ? dataHoraFormatada(item.dataUltimaCompra) : "Sem registro",
          item.valorUltimaCompra.toFixed(2).replace(".", ","),
          item.totalGastoHistorico.toFixed(2).replace(".", ","),
        ].join(";");
      });

      const conteudoCSV = "\uFEFF" + [cabecalho, ...linhas].join("\r\n");
      const blob = new Blob([conteudoCSV], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `clientes-sem-compras-${dataFormatadaCalendario(new Date())}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      setMensagem("Lista de clientes inativos exportada com sucesso!");
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
              <UserMinus size={24} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Gestão / Retenção de Clientes</p>
              <h1 className={styles.pageTitulo}>Clientes sem Compras</h1>
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
              disabled={carregando || clientesInativosFiltrados.length === 0}
              title="Exportar lista de clientes inativos para Excel (CSV)"
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

        {/* 5 CARDS DE KPIS POR FAIXA DE INATIVIDADE */}
        <div className={styles.kpiGrid}>
          {/* TOTAL DE INATIVOS */}
          <div
            className={`${styles.kpiCard} ${styles.kpiTotal} ${
              filtroDias === "todosInativos" ? styles.kpiCardAtivo : ""
            }`}
            onClick={() => setFiltroDias("todosInativos")}
            title="Ver todos com 30+ dias sem compra"
          >
            <div className={styles.kpiIconeWrapper}>
              <UserMinus size={22} weight="bold" />
            </div>
            <div className={styles.kpiConteudo}>
              <span className={styles.kpiRotulo}>Total Inativos</span>
              <strong className={styles.kpiValor}>{contadoresFaixas.totalInativos}</strong>
              <span className={styles.kpiSub}>30+ dias sem compras</span>
            </div>
          </div>

          {/* FAIXA 30 DIAS */}
          <div
            className={`${styles.kpiCard} ${styles.kpi30} ${
              filtroDias === "30" ? styles.kpiCardAtivo : ""
            }`}
            onClick={() => setFiltroDias("30")}
            title="Filtrar clientes inativos entre 30 e 59 dias"
          >
            <div className={styles.kpiIconeWrapper}>
              <ClockAfternoon size={22} weight="bold" />
            </div>
            <div className={styles.kpiConteudo}>
              <span className={styles.kpiRotulo}>30 a 59 dias</span>
              <strong className={styles.kpiValor}>{contadoresFaixas.f30}</strong>
              <span className={styles.kpiSub}>Alerta inicial</span>
            </div>
          </div>

          {/* FAIXA 60 DIAS */}
          <div
            className={`${styles.kpiCard} ${styles.kpi60} ${
              filtroDias === "60" ? styles.kpiCardAtivo : ""
            }`}
            onClick={() => setFiltroDias("60")}
            title="Filtrar clientes inativos entre 60 e 89 dias"
          >
            <div className={styles.kpiIconeWrapper}>
              <ClockAfternoon size={22} weight="bold" />
            </div>
            <div className={styles.kpiConteudo}>
              <span className={styles.kpiRotulo}>60 a 89 dias</span>
              <strong className={styles.kpiValor}>{contadoresFaixas.f60}</strong>
              <span className={styles.kpiSub}>Alerta moderado</span>
            </div>
          </div>

          {/* FAIXA 90 DIAS */}
          <div
            className={`${styles.kpiCard} ${styles.kpi90} ${
              filtroDias === "90" ? styles.kpiCardAtivo : ""
            }`}
            onClick={() => setFiltroDias("90")}
            title="Filtrar clientes inativos entre 90 e 119 dias"
          >
            <div className={styles.kpiIconeWrapper}>
              <WarningCircle size={22} weight="bold" />
            </div>
            <div className={styles.kpiConteudo}>
              <span className={styles.kpiRotulo}>90 a 119 dias</span>
              <strong className={styles.kpiValor}>{contadoresFaixas.f90}</strong>
              <span className={styles.kpiSub}>Inatividade crítica</span>
            </div>
          </div>

          {/* FAIXA 120+ DIAS OU NUNCA COMPROU */}
          <div
            className={`${styles.kpiCard} ${styles.kpi120} ${
              filtroDias === "120" ? styles.kpiCardAtivo : ""
            }`}
            onClick={() => setFiltroDias("120")}
            title="Filtrar clientes sem compras há 120+ dias ou sem histórico"
          >
            <div className={styles.kpiIconeWrapper}>
              <WarningCircle size={22} weight="bold" />
            </div>
            <div className={styles.kpiConteudo}>
              <span className={styles.kpiRotulo}>120+ dias</span>
              <strong className={styles.kpiValor}>{contadoresFaixas.f120}</strong>
              <span className={styles.kpiSub}>Recuperação urgente</span>
            </div>
          </div>
        </div>

        {/* BARRA DE FILTROS AVANÇADOS */}
        <div className={styles.filtrosBarra}>
          <div className={styles.buscaWrapper}>
            <MagnifyingGlass size={18} className={styles.iconeBusca} />
            <input
              type="text"
              placeholder="Buscar por cliente, documento, telefone, bairro ou vendedor..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={styles.inputBusca}
            />
          </div>

          <div className={styles.filtrosControle}>
            {/* FILTRO VENDEDOR (SOLICITADO) */}
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

            {/* FILTRO DIAS SEM COMPRA (SOLICITADO: 30-60-90-120) */}
            <div className={styles.filtroItem}>
              <label>Dias sem Compra:</label>
              <select
                value={filtroDias}
                onChange={(e) => setFiltroDias(e.target.value)}
                className={styles.selectFiltro}
              >
                <option value="todosInativos">Todos Inativos (30+ dias)</option>
                <option value="30">30 a 59 dias</option>
                <option value="60">60 a 89 dias</option>
                <option value="90">90 a 119 dias</option>
                <option value="120">120+ dias ou Nunca Compraram</option>
              </select>
            </div>

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

            {/* ORDENAÇÃO */}
            <div className={styles.filtroItem}>
              <label>Ordenar:</label>
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value)}
                className={styles.selectFiltro}
              >
                <option value="diasDesc">Mais tempo sem comprar</option>
                <option value="diasAsc">Menos tempo sem comprar</option>
                <option value="valorDesc">Maior valor da última compra</option>
                <option value="nomeAsc">Ordem Alfabética</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABELA DE CLIENTES INATIVOS */}
        <div className={styles.tabelaContainer}>
          <div className={styles.tabelaWrapper}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th style={{ width: "90px" }}>Setor</th>
                  <th>Vendedor</th>
                  <th>Contato</th>
                  <th>Localização</th>
                  <th style={{ width: "140px" }} className={styles.textCenter}>
                    Dias sem Compra
                  </th>
                  <th style={{ width: "130px" }}>Última Compra</th>
                  <th style={{ width: "110px" }} className={styles.textRight}>
                    Último Valor
                  </th>
                  <th style={{ width: "100px" }} className={styles.textCenter}>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan="9" className={styles.tabelaVazia}>
                      <ArrowsClockwise size={26} className={styles.girando} />
                      <p>Localizando clientes sem compras no histórico...</p>
                    </td>
                  </tr>
                ) : clientesInativosFiltrados.length > 0 ? (
                  clientesInativosFiltrados.map((item) => {
                    const c = item.cliente;
                    const docFormatado = c.cpf || c.cnpj || c.documento || "";

                    const dias = item.diasSemCompra;
                    let classeBadgeDias = styles.badgeDias30;
                    if (dias >= 120) classeBadgeDias = styles.badgeDias120;
                    else if (dias >= 90) classeBadgeDias = styles.badgeDias90;
                    else if (dias >= 60) classeBadgeDias = styles.badgeDias60;

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
                        <td>
                          <div className={styles.contatoCelula}>
                            <span className={styles.telefoneTexto}>
                              {c.telefone || "Sem telefone"}
                            </span>
                            {c.telefone && (
                              <button
                                type="button"
                                className={styles.btnAcaoWhatsapp}
                                onClick={() => tratarAbrirWhatsApp(c, item.diasSemCompra)}
                                title={`Conversar com ${c.nome} no WhatsApp`}
                              >
                                <WhatsappLogo size={15} weight="bold" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={styles.localizacaoTexto}>
                            {[c.bairro, c.cidade].filter(Boolean).join(" - ") ||
                              c.endereco ||
                              "—"}
                          </span>
                        </td>
                        <td className={styles.textCenter}>
                          <span className={`${styles.badgeDiasInativo} ${classeBadgeDias}`}>
                            {item.nuncaComprou
                              ? "Nunca comprou"
                              : `${item.diasSemCompra} dias`}
                          </span>
                        </td>
                        <td>
                          <span className={styles.dataUltimaCompra}>
                            {item.dataUltimaCompra
                              ? dataHoraFormatada(item.dataUltimaCompra)
                              : "Sem registro"}
                          </span>
                        </td>
                        <td className={styles.textRight}>
                          <strong className={styles.valorUltimaCompra}>
                            {formatarMoeda(item.valorUltimaCompra)}
                          </strong>
                        </td>
                        <td className={styles.textCenter}>
                          <div className={styles.acoesLinha}>
                            {/* BOTÃO PARA ABRIR O RELATÓRIO DO CLIENTE */}
                            <button
                              type="button"
                              className={styles.btnAcaoRelatorio}
                              onClick={() => tratarAbrirRelatorioCliente(c)}
                              title={`Ver histórico e relatório de ${c.nome}`}
                            >
                              <ChartLineUp size={16} weight="bold" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className={styles.tabelaVazia}>
                      <CheckCircle size={26} style={{ color: "var(--green)" }} />
                      <p>
                        Excelente! Nenhum cliente encontrado na faixa de inatividade
                        selecionada.
                      </p>
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


import { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  ChartBar,
  ChartLineUp,
  CurrencyDollar,
  Package,
  Percent,
  ShoppingCart,
  ArrowClockwise,
  FileCsv,
  Tag,
  TrendUp,
} from "@phosphor-icons/react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import styles from "./styles.module.css";
import { RelatorioProduto } from "../../operadores/API/produto/relatorioProduto";
import { formatarMoeda } from "../../utils/formartarMoeda";
import { formatarEstoque } from "../../utils/formatarEstoque";
import { usarToast } from "../Context/toastContext";

// Configuração fixa dos 12 meses do ano
const MESES_CONFIG = [
  { num: 1, sigla: "Jan", nome: "Janeiro" },
  { num: 2, sigla: "Fev", nome: "Fevereiro" },
  { num: 3, sigla: "Mar", nome: "Março" },
  { num: 4, sigla: "Abr", nome: "Abril" },
  { num: 5, sigla: "Mai", nome: "Maio" },
  { num: 6, sigla: "Jun", nome: "Junho" },
  { num: 7, sigla: "Jul", nome: "Julho" },
  { num: 8, sigla: "Ago", nome: "Agosto" },
  { num: 9, sigla: "Set", nome: "Setembro" },
  { num: 10, sigla: "Out", nome: "Outubro" },
  { num: 11, sigla: "Nov", nome: "Novembro" },
  { num: 12, sigla: "Dez", nome: "Dezembro" },
];

export default function ModalRelatorioProduto({
  aberto,
  aoFechar,
  produto = null,
}) {
  const { setMensagem } = usarToast();

  const anoAtual = new Date().getFullYear();
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);
  const [setorSelecionado, setSetorSelecionado] = useState("geral"); // 'geral' | 'balcao' | 'delivery' | 'externo'
  const [abaGrafico, setAbaGrafico] = useState("faturamento_quantidade"); // 'faturamento_quantidade' | 'positivacao_preco'

  const [dadosMensais, setDadosMensais] = useState([]);
  const [carregando, setCarregando] = useState(false);

  // Lista de anos para seleção (ano atual - 2 até ano atual + 1)
  const anosDisponiveis = useMemo(() => {
    return [anoAtual + 1, anoAtual, anoAtual - 1, anoAtual - 2];
  }, [anoAtual]);

  // Função para carregar os 12 meses do ano via Promise.all (Opção A)
  const carregarRelatorioAnual = useCallback(async () => {
    if (!aberto || !produto || !produto.id) return;

    setCarregando(true);
    try {
      const chamadasMeses = MESES_CONFIG.map(async (mes) => {
        const ultimoDia = new Date(anoSelecionado, mes.num, 0).getDate();
        const dataInicio = `${anoSelecionado}-${String(mes.num).padStart(2, "0")}-01`;
        const dataFim = `${anoSelecionado}-${String(mes.num).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;

        try {
          const resultado = await RelatorioProduto(setorSelecionado, produto.id, {
            dataInicio,
            dataFim,
          });

          // Se for GERAL, a rota retorna { balcao, delivery, externo }
          if (setorSelecionado === "geral") {
            const b = resultado?.balcao || {};
            const d = resultado?.delivery || {};
            const e = resultado?.externo || {};

            const qtd =
              (Number(b.quantidade) || 0) +
              (Number(d.quantidade) || 0) +
              (Number(e.quantidade) || 0);

            const fat =
              (Number(b.faturamentoTotal) || 0) +
              (Number(d.faturamentoTotal) || 0) +
              (Number(e.faturamentoTotal) || 0);

            const pedPos =
              (Number(b.pedidoPositavo) || 0) +
              (Number(d.pedidoPositavo) || 0) +
              (Number(e.pedidoPositavo) || 0);

            const totalPed =
              (Number(b.totalPedidos) || 0) +
              (Number(d.totalPedidos) || 0) +
              (Number(e.totalPedidos) || 0);

            const percPos =
              totalPed > 0 ? (pedPos / totalPed) * 100 : 0;

            const precoMed = qtd > 0 ? fat / qtd : 0;
            const medPed = pedPos > 0 ? qtd / pedPos : 0;

            return {
              mesNum: mes.num,
              mesSigla: mes.sigla,
              mesNome: mes.nome,
              quantidade: qtd,
              faturamento: fat,
              precoMedio: precoMed,
              pedidosPositivados: pedPos,
              totalPedidos: totalPed,
              porcentualPositivado: percPos,
              mediaProdutoPorPedido: medPed,
            };
          } else {
            // Setor específico (balcao, delivery ou externo)
            const qtd = Number(resultado?.quantidade) || 0;
            const fat = Number(resultado?.faturamentoTotal) || 0;
            const pedPos = Number(resultado?.pedidoPositavo) || 0;
            const totalPed = Number(resultado?.totalPedidos) || 0;
            const percPos =
              Number(resultado?.porcentualPositivado) ||
              (totalPed > 0 ? (pedPos / totalPed) * 100 : 0);
            const precoMed =
              Number(resultado?.precoMedio) || (qtd > 0 ? fat / qtd : 0);
            const medPed =
              Number(resultado?.mediaProdutoPorPedido) ||
              (pedPos > 0 ? qtd / pedPos : 0);

            return {
              mesNum: mes.num,
              mesSigla: mes.sigla,
              mesNome: mes.nome,
              quantidade: qtd,
              faturamento: fat,
              precoMedio: precoMed,
              pedidosPositivados: pedPos,
              totalPedidos: totalPed,
              porcentualPositivado: percPos,
              mediaProdutoPorPedido: medPed,
            };
          }
        } catch (errMes) {
          console.error(`Erro ao carregar dados do mês ${mes.nome}:`, errMes);
          return {
            mesNum: mes.num,
            mesSigla: mes.sigla,
            mesNome: mes.nome,
            quantidade: 0,
            faturamento: 0,
            precoMedio: 0,
            pedidosPositivados: 0,
            totalPedidos: 0,
            porcentualPositivado: 0,
            mediaProdutoPorPedido: 0,
          };
        }
      });

      const mesesRetornados = await Promise.all(chamadasMeses);
      setDadosMensais(mesesRetornados);
    } catch (error) {
      console.error("Erro ao carregar relatório anual do produto:", error);
      setMensagem(error.message || "Erro ao carregar dados do relatório");
    } finally {
      setCarregando(false);
    }
  }, [aberto, produto, anoSelecionado, setorSelecionado, setMensagem]);

  // Carrega ao abrir o modal ou mudar o ano / setor
  useEffect(() => {
    carregarRelatorioAnual();
  }, [carregarRelatorioAnual]);

  // Fecha no ESC
  useEffect(() => {
    if (!aberto) return;
    const tratarTeclaEsc = (e) => {
      if (e.key === "Escape") aoFechar();
    };
    window.addEventListener("keydown", tratarTeclaEsc);
    return () => window.removeEventListener("keydown", tratarTeclaEsc);
  }, [aberto, aoFechar]);

  // Cálculos consolidados do Ano (KPIs anuais)
  const totaisAnuais = useMemo(() => {
    if (!dadosMensais || dadosMensais.length === 0) {
      return {
        quantidade: 0,
        faturamento: 0,
        precoMedio: 0,
        pedidosPositivados: 0,
        totalPedidos: 0,
        porcentualPositivado: 0,
        mediaProdutoPorPedido: 0,
      };
    }

    const qtdTotal = dadosMensais.reduce((acc, m) => acc + m.quantidade, 0);
    const fatTotal = dadosMensais.reduce((acc, m) => acc + m.faturamento, 0);
    const pedPosTotal = dadosMensais.reduce(
      (acc, m) => acc + m.pedidosPositivados,
      0
    );
    const totalPedGeral = dadosMensais.reduce(
      (acc, m) => acc + m.totalPedidos,
      0
    );

    const precoMedioPonderado = qtdTotal > 0 ? fatTotal / qtdTotal : 0;
    const percPositivadoMedio =
      totalPedGeral > 0 ? (pedPosTotal / totalPedGeral) * 100 : 0;
    const mediaPorPedidoGeral =
      pedPosTotal > 0 ? qtdTotal / pedPosTotal : 0;

    return {
      quantidade: qtdTotal,
      faturamento: fatTotal,
      precoMedio: precoMedioPonderado,
      pedidosPositivados: pedPosTotal,
      totalPedidos: totalPedGeral,
      porcentualPositivado: percPositivadoMedio,
      mediaProdutoPorPedido: mediaPorPedidoGeral,
    };
  }, [dadosMensais]);

  // Exportar dados da tabela para CSV compatível com Excel
  const tratarExportarCSV = () => {
    if (!dadosMensais || dadosMensais.length === 0 || !produto) return;

    const cabecalhos = [
      "Mês",
      "Qtd. Vendida (cx)",
      "Faturamento Total (R$)",
      "Preço Médio (R$)",
      "Pedidos c/ Produto",
      "Total de Pedidos",
      "% Positivação",
      "Média cx/Pedido",
    ];

    const linhas = [cabecalhos.join(";")];

    dadosMensais.forEach((item) => {
      const linha = [
        item.mesNome,
        formatarEstoque(item.quantidade),
        item.faturamento.toFixed(2).replace(".", ","),
        item.precoMedio.toFixed(2).replace(".", ","),
        item.pedidosPositivados,
        item.totalPedidos,
        `${item.porcentualPositivado.toFixed(1).replace(".", ",")}%`,
        item.mediaProdutoPorPedido.toFixed(2).replace(".", ","),
      ];
      linhas.push(linha.join(";"));
    });

    // Linha de total acumulado do ano
    linhas.push(
      [
        `TOTAL / MÉDIA ANUAL (${anoSelecionado})`,
        formatarEstoque(totaisAnuais.quantidade),
        totaisAnuais.faturamento.toFixed(2).replace(".", ","),
        totaisAnuais.precoMedio.toFixed(2).replace(".", ","),
        totaisAnuais.pedidosPositivados,
        totaisAnuais.totalPedidos,
        `${totaisAnuais.porcentualPositivado.toFixed(1).replace(".", ",")}%`,
        totaisAnuais.mediaProdutoPorPedido.toFixed(2).replace(".", ","),
      ].join(";")
    );

    const conteudoCsv = "\uFEFF" + linhas.join("\r\n");
    const blob = new Blob([conteudoCsv], { type: "text/csv;charset=utf-8;" });
    const nomeLimpo = String(produto.nome || "produto")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");
    const nomeArquivo = `relatorio_${nomeLimpo}_${anoSelecionado}_${setorSelecionado}.csv`;

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", nomeArquivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    setMensagem(`Relatório anual exportado com sucesso: "${nomeArquivo}"`);
  };

  if (!aberto || !produto) return null;

  return (
    <div className={styles.overlay} onClick={aoFechar}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* CABEÇALHO */}
        <header className={styles.modalHeader}>
          <div className={styles.headerInfo}>
            <div className={styles.headerIconWrapper}>
              <ChartBar size={24} weight="bold" />
            </div>
            <div>
              <p className={styles.subtitulo}>Desempenho Comercial & Vendas</p>
              <h2 className={styles.titulo}>
                {produto.nome}
                <span className={styles.badgeId}>#{produto.id}</span>
              </h2>
              <div className={styles.detalhesProduto}>
                {produto.embalagem && (
                  <span className={styles.tagPequena}>
                    <Tag size={12} weight="bold" />
                    {produto.embalagem}
                  </span>
                )}
                {produto.segmento && (
                  <span className={styles.tagPequena}>{produto.segmento}</span>
                )}
                {produto.fornecedor && (
                  <span className={styles.tagPequena}>
                    {produto.fornecedor}
                  </span>
                )}
                <span className={styles.tagPequena}>
                  Estoque: {formatarEstoque(produto.estoque)} cx
                </span>
                {produto.precoVenda > 0 && (
                  <span className={styles.tagPequena}>
                    Preço Venda: {formatarMoeda(produto.precoVenda)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            className={styles.botaoFechar}
            onClick={aoFechar}
            title="Fechar (Esc)"
          >
            <X size={20} weight="bold" />
          </button>
        </header>

        {/* CORPO */}
        <div className={styles.modalCorpo}>
          {/* BARRA DE FILTROS (ANO, SETOR, EXPORTAÇÃO) */}
          <div className={styles.painelFiltros}>
            <div className={styles.filtrosControles}>
              {/* FILTRO DE ANO */}
              <div className={styles.filtroItem}>
                <label className={styles.filtroLabel}>Ano:</label>
                <select
                  value={anoSelecionado}
                  onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                  className={styles.selectInput}
                >
                  {anosDisponiveis.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              {/* FILTRO DE SETOR */}
              <div className={styles.filtroItem}>
                <label className={styles.filtroLabel}>Setor:</label>
                <select
                  value={setorSelecionado}
                  onChange={(e) => setSetorSelecionado(e.target.value)}
                  className={styles.selectInput}
                >
                  <option value="geral">Todos os Setores (Consolidado)</option>
                  <option value="balcao">Apenas Balcão</option>
                  <option value="delivery">Apenas Delivery</option>
                  <option value="externo">Apenas Venda Externa (Rotas)</option>
                </select>
              </div>
            </div>

            <div className={styles.acoesFiltros}>
              <button
                type="button"
                className={styles.botaoRecarregar}
                onClick={carregarRelatorioAnual}
                disabled={carregando}
                title="Recarregar dados"
              >
                <ArrowClockwise
                  size={14}
                  weight="bold"
                  className={carregando ? styles.spinnerIcone : ""}
                />
                Recarregar
              </button>

              <button
                type="button"
                className={styles.botaoExportarCSV}
                onClick={tratarExportarCSV}
                disabled={carregando}
                title="Baixar planilha CSV com os 12 meses"
              >
                <FileCsv size={16} weight="bold" />
                Exportar CSV
              </button>
            </div>
          </div>

          {carregando ? (
            <div className={styles.carregandoContainer}>
              <div className={styles.spinner} />
              <span>Calculando evolução comercial de {anoSelecionado}...</span>
            </div>
          ) : (
            <>
              {/* CARDS DE RESUMO (KPIS ANUAIS) */}
              <div className={styles.cardsGrid}>
                {/* 1. FATURAMENTO TOTAL */}
                <div className={styles.kpiCard} data-tema="azul">
                  <div className={styles.kpiTop}>
                    <span className={styles.kpiLabel}>Faturamento Total</span>
                    <CurrencyDollar
                      size={18}
                      weight="bold"
                      className={styles.kpiIcone}
                    />
                  </div>
                  <strong className={styles.kpiValor}>
                    {formatarMoeda(totaisAnuais.faturamento)}
                  </strong>
                  <span className={styles.kpiSub}>
                    Total faturado no exercício de {anoSelecionado}
                  </span>
                </div>

                {/* 2. QUANTIDADE TOTAL VENDIDA */}
                <div className={styles.kpiCard} data-tema="laranja">
                  <div className={styles.kpiTop}>
                    <span className={styles.kpiLabel}>Volume Total Vendido</span>
                    <Package
                      size={18}
                      weight="bold"
                      className={styles.kpiIcone}
                    />
                  </div>
                  <strong className={styles.kpiValor}>
                    {formatarEstoque(totaisAnuais.quantidade)} cx
                  </strong>
                  <span className={styles.kpiSub}>
                    Volume total comercializado no ano
                  </span>
                </div>

                {/* 3. PREÇO MÉDIO */}
                <div className={styles.kpiCard} data-tema="verde">
                  <div className={styles.kpiTop}>
                    <span className={styles.kpiLabel}>Preço Médio</span>
                    <TrendUp
                      size={18}
                      weight="bold"
                      className={styles.kpiIcone}
                    />
                  </div>
                  <strong className={styles.kpiValor}>
                    {formatarMoeda(totaisAnuais.precoMedio)}
                  </strong>
                  <span className={styles.kpiSub}>
                    Média ponderada praticada por caixa
                  </span>
                </div>

                {/* 4. POSITIVAÇÃO (%) */}
                <div className={styles.kpiCard} data-tema="roxo">
                  <div className={styles.kpiTop}>
                    <span className={styles.kpiLabel}>Positivação</span>
                    <Percent
                      size={18}
                      weight="bold"
                      className={styles.kpiIcone}
                    />
                  </div>
                  <strong className={styles.kpiValor}>
                    {totaisAnuais.porcentualPositivado.toFixed(1).replace(".", ",")}%
                  </strong>
                  <span className={styles.kpiSub}>
                    Presente em {totaisAnuais.pedidosPositivados} de{" "}
                    {totaisAnuais.totalPedidos} pedidos
                  </span>
                </div>

                {/* 5. MÉDIA POR PEDIDO */}
                <div className={styles.kpiCard} data-tema="cinza">
                  <div className={styles.kpiTop}>
                    <span className={styles.kpiLabel}>Média por Pedido</span>
                    <ShoppingCart
                      size={18}
                      weight="bold"
                      className={styles.kpiIcone}
                    />
                  </div>
                  <strong className={styles.kpiValor}>
                    {formatarEstoque(totaisAnuais.mediaProdutoPorPedido)} cx
                  </strong>
                  <span className={styles.kpiSub}>
                    Volumes médios por compra realizada
                  </span>
                </div>
              </div>

              {/* SEÇÃO DO GRÁFICO (RECHARTS JAN~DEZ) */}
              <div className={styles.secaoGrafico}>
                <div className={styles.graficoCabecalho}>
                  <div>
                    <h3 className={styles.graficoTitulo}>
                      Evolução Mensal (Janeiro a Dezembro de {anoSelecionado})
                    </h3>
                    <p className={styles.graficoSub}>
                      Acompanhamento cronológico do desempenho de vendas e presença em pedidos
                    </p>
                  </div>

                  {/* ABAS DO GRÁFICO */}
                  <div className={styles.abasGrafico}>
                    <button
                      type="button"
                      className={`${styles.abaBotao} ${
                        abaGrafico === "faturamento_quantidade"
                          ? styles.abaAtiva
                          : ""
                      }`}
                      onClick={() => setAbaGrafico("faturamento_quantidade")}
                    >
                      <ChartBar size={15} weight="bold" />
                      Faturamento & Quantidade
                    </button>
                    <button
                      type="button"
                      className={`${styles.abaBotao} ${
                        abaGrafico === "positivacao_preco"
                          ? styles.abaAtiva
                          : ""
                      }`}
                      onClick={() => setAbaGrafico("positivacao_preco")}
                    >
                      <ChartLineUp size={15} weight="bold" />
                      Positivação (%) & Preço Médio
                    </button>
                  </div>
                </div>

                {/* GRÁFICO CONDICIONAL */}
                <div className={styles.graficoContainer}>
                  {abaGrafico === "faturamento_quantidade" ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart
                        data={dadosMensais}
                        margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#eaecef"
                        />
                        <XAxis
                          dataKey="mesSigla"
                          tickLine={false}
                          stroke="#868e96"
                          fontSize={12}
                        />
                        <YAxis
                          yAxisId="left"
                          orientation="left"
                          tickLine={false}
                          axisLine={false}
                          stroke="#1971c2"
                          fontSize={12}
                          tickFormatter={(v) =>
                            `R$ ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                          }
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tickLine={false}
                          axisLine={false}
                          stroke="#ff8c00"
                          fontSize={12}
                          tickFormatter={(v) => `${v} cx`}
                        />
                        <Tooltip
                          formatter={(value, name) => {
                            if (name === "Faturamento (R$)")
                              return [formatarMoeda(value), name];
                            if (name === "Quantidade (cx)")
                              return [`${formatarEstoque(value)} cx`, name];
                            return [value, name];
                          }}
                          labelFormatter={(label) => {
                            const mesObj = dadosMensais.find(
                              (m) => m.mesSigla === label
                            );
                            return mesObj
                              ? `${mesObj.mesNome} de ${anoSelecionado}`
                              : label;
                          }}
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            borderRadius: "10px",
                            border: "1px solid #eaecef",
                            boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                            fontSize: "12px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                        <Bar
                          yAxisId="right"
                          dataKey="quantidade"
                          name="Quantidade (cx)"
                          fill="#ffd699"
                          radius={[5, 5, 0, 0]}
                          barSize={28}
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="faturamento"
                          name="Faturamento (R$)"
                          stroke="#1971c2"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#1971c2" }}
                          activeDot={{ r: 6 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart
                        data={dadosMensais}
                        margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#eaecef"
                        />
                        <XAxis
                          dataKey="mesSigla"
                          tickLine={false}
                          stroke="#868e96"
                          fontSize={12}
                        />
                        <YAxis
                          yAxisId="left"
                          orientation="left"
                          tickLine={false}
                          axisLine={false}
                          stroke="#7048e8"
                          fontSize={12}
                          unit="%"
                          domain={[0, 100]}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tickLine={false}
                          axisLine={false}
                          stroke="#2f9e44"
                          fontSize={12}
                          tickFormatter={(v) => `R$ ${v}`}
                        />
                        <Tooltip
                          formatter={(value, name) => {
                            if (name === "Positivação (%)")
                              return [
                                `${Number(value).toFixed(1).replace(".", ",")}%`,
                                name,
                              ];
                            if (name === "Preço Médio (R$)")
                              return [formatarMoeda(value), name];
                            return [value, name];
                          }}
                          labelFormatter={(label) => {
                            const mesObj = dadosMensais.find(
                              (m) => m.mesSigla === label
                            );
                            return mesObj
                              ? `${mesObj.mesNome} de ${anoSelecionado}`
                              : label;
                          }}
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            borderRadius: "10px",
                            border: "1px solid #eaecef",
                            boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                            fontSize: "12px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="porcentualPositivado"
                          name="Positivação (%)"
                          stroke="#7048e8"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#7048e8" }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="precoMedio"
                          name="Preço Médio (R$)"
                          stroke="#2f9e44"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={{ r: 4, fill: "#2f9e44" }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* SEÇÃO DA TABELA ANALÍTICA DOS 12 MESES */}
              <div className={styles.secaoTabela}>
                <h3 className={styles.graficoTitulo}>
                  Detalhamento Mês a Mês ({anoSelecionado})
                </h3>

                <div className={styles.tabelaWrapper}>
                  <table className={styles.tabelaAnalitica}>
                    <thead>
                      <tr>
                        <th>Mês</th>
                        <th className={styles.textRight}>Qtd. Vendida</th>
                        <th className={styles.textRight}>Faturamento Total</th>
                        <th className={styles.textRight}>Preço Médio</th>
                        <th className={styles.textCenter}>Pedidos c/ Produto</th>
                        <th className={styles.textCenter}>Total Pedidos</th>
                        <th className={styles.textCenter}>% Positivação</th>
                        <th className={styles.textRight}>Média cx/Pedido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dadosMensais.map((linha) => {
                        const temVenda = linha.quantidade > 0;
                        const perc = linha.porcentualPositivado;
                        const classePositivacao =
                          perc >= 20
                            ? styles.positivacaoAlta
                            : perc > 0
                            ? styles.positivacaoMedia
                            : styles.positivacaoBaixa;

                        return (
                          <tr key={linha.mesNum}>
                            <td>
                              <strong>{linha.mesNome}</strong>
                            </td>
                            <td className={styles.textRight}>
                              {temVenda ? `${formatarEstoque(linha.quantidade)} cx` : "—"}
                            </td>
                            <td className={styles.textRight}>
                              {temVenda ? (
                                <strong>{formatarMoeda(linha.faturamento)}</strong>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className={styles.textRight}>
                              {temVenda ? formatarMoeda(linha.precoMedio) : "—"}
                            </td>
                            <td className={styles.textCenter}>
                              {linha.pedidosPositivados > 0
                                ? linha.pedidosPositivados
                                : "0"}
                            </td>
                            <td className={styles.textCenter}>
                              {linha.totalPedidos}
                            </td>
                            <td className={styles.textCenter}>
                              <span
                                className={`${styles.badgePositivacao} ${classePositivacao}`}
                              >
                                {perc.toFixed(1).replace(".", ",")}%
                              </span>
                            </td>
                            <td className={styles.textRight}>
                              {linha.mediaProdutoPorPedido > 0
                                ? `${formatarEstoque(linha.mediaProdutoPorPedido)} cx`
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td>TOTAL / MÉDIA ANUAL</td>
                        <td className={styles.textRight}>
                          {formatarEstoque(totaisAnuais.quantidade)} cx
                        </td>
                        <td className={styles.textRight}>
                          {formatarMoeda(totaisAnuais.faturamento)}
                        </td>
                        <td className={styles.textRight}>
                          {formatarMoeda(totaisAnuais.precoMedio)}
                        </td>
                        <td className={styles.textCenter}>
                          {totaisAnuais.pedidosPositivados}
                        </td>
                        <td className={styles.textCenter}>
                          {totaisAnuais.totalPedidos}
                        </td>
                        <td className={styles.textCenter}>
                          <span
                            className={`${styles.badgePositivacao} ${
                              totaisAnuais.porcentualPositivado >= 20
                                ? styles.positivacaoAlta
                                : totaisAnuais.porcentualPositivado > 0
                                ? styles.positivacaoMedia
                                : styles.positivacaoBaixa
                            }`}
                          >
                            {totaisAnuais.porcentualPositivado
                              .toFixed(1)
                              .replace(".", ",")}%
                          </span>
                        </td>
                        <td className={styles.textRight}>
                          {formatarEstoque(totaisAnuais.mediaProdutoPorPedido)} cx
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

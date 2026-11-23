/**
 * Utilitário para exportação de Vales Internos de Colaboradores em formato CSV padrão Excel (pt-BR)
 * 
 * Formato gerado:
 * Nome;Total Gasto (R$)
 * LEONARDO;87,50
 */

const sanitizarCampoCSV = (valor) => {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor).trim();
  // Se contiver ponto e vírgula, aspas ou quebras de linha, envolve em aspas e duplica aspas internas
  if (
    texto.includes(";") ||
    texto.includes('"') ||
    texto.includes("\n") ||
    texto.includes("\r")
  ) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
};

const formatarNumeroMoeda = (val) => {
  const num = Number(val ?? 0);
  if (isNaN(num)) return "0,00";
  return num.toFixed(2).replace(".", ",");
};

// Formas de pagamento comuns que não são vales de colaboradores
const ignorarItensLista = [
  "A VISTA",
  "PIX",
  "CARTÃO",
  "CHEQUE",
  "ORÇAMENTO",
  "BOLETO",
  "MAQUININHA",
];

/**
 * Agrupa os pedidos de vales por colaborador (desconsiderando pedidos cancelados e formas comuns)
 * @param {Array} pedidos - Lista de pedidos retornados da API
 * @returns {Array<{ colaborador: string, total: number }>} Lista agrupada e ordenada por nome
 */
export const agruparValesPorColaborador = (pedidos = []) => {
  if (!Array.isArray(pedidos)) return [];

  // Filtra apenas pedidos não cancelados
  const pedidosValidos = pedidos.filter(
    (p) => String(p.status || "").toLowerCase() !== "cancelado"
  );

  const mapaColaboradores = {};

  pedidosValidos.forEach((pedido) => {
    if (Array.isArray(pedido.pagamentos) && pedido.pagamentos.length > 0) {
      pedido.pagamentos.forEach((pg) => {
        const nomePg = String(pg.formaPagamento?.nome || "").trim();
        if (nomePg && !ignorarItensLista.includes(nomePg.toUpperCase())) {
          const nomeNormalizado = nomePg.toUpperCase();
          mapaColaboradores[nomeNormalizado] =
            (mapaColaboradores[nomeNormalizado] || 0) + Number(pg.valor || 0);
        }
      });
    } else if (pedido.formaPagamento?.nome) {
      const nomePg = String(pedido.formaPagamento.nome).trim();
      if (nomePg && !ignorarItensLista.includes(nomePg.toUpperCase())) {
        const nomeNormalizado = nomePg.toUpperCase();
        mapaColaboradores[nomeNormalizado] =
          (mapaColaboradores[nomeNormalizado] || 0) + Number(pedido.total || 0);
      }
    }
  });

  // Converte em array e ordena alfabeticamente pelo nome do colaborador
  return Object.keys(mapaColaboradores)
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .map((colaborador) => ({
      colaborador,
      total: mapaColaboradores[colaborador],
    }));
};

/**
 * Exporta a lista de colaboradores e seus totais gastos para arquivo CSV (Excel pt-BR)
 * @param {Array} dadosColaboradores - Lista com { colaborador, total }
 * @param {Object} opcoes - { dataInicio, dataFim }
 */
export const exportarValesColaboradoresCSV = (dadosColaboradores = [], opcoes = {}) => {
  if (!Array.isArray(dadosColaboradores) || dadosColaboradores.length === 0) {
    throw new Error("Nenhum dado de vale interno para exportar.");
  }

  // Cabeçalhos solicitados: "Nome" e "Total Gasto (R$)"
  const cabecalhos = ["Nome", "Total Gasto (R$)"];
  const linhas = [cabecalhos.join(";")];

  dadosColaboradores.forEach((item) => {
    const nome = sanitizarCampoCSV(item.colaborador || item.nome || "-");
    const totalGasto = sanitizarCampoCSV(formatarNumeroMoeda(item.total));
    linhas.push(`${nome};${totalGasto}`);
  });

  // Prefixo BOM UTF-8 (\uFEFF) garante abertura com acentos corretos no Excel brasileiro
  const conteudoCsv = "\uFEFF" + linhas.join("\r\n");
  const blob = new Blob([conteudoCsv], { type: "text/csv;charset=utf-8;" });

  const inicio = opcoes.dataInicio ? opcoes.dataInicio.replace(/-/g, "") : "";
  const fim = opcoes.dataFim ? opcoes.dataFim.replace(/-/g, "") : "";
  const nomeArquivo =
    inicio && fim
      ? `vales_colaboradores_${inicio}_a_${fim}.csv`
      : `vales_colaboradores_mes_atual.csv`;

  // Download automático via elemento âncora temporário no DOM
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", nomeArquivo);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

  return {
    sucesso: true,
    quantidade: dadosColaboradores.length,
    nomeArquivo,
  };
};


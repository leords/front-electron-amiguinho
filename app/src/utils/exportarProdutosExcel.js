/**
 * Utilitário para exportação da lista de Produtos para formato compatível com Excel (CSV com BOM UTF-8)
 */

const sanitizarCampoCSV = (valor) => {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor).trim();
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

const gerarNomeArquivo = (filtros = {}) => {
  const hoje = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const segmento = filtros.segmento ? `_${filtros.segmento.toLowerCase().replace(/\s+/g, "_")}` : "";
  const status = filtros.status && filtros.status !== "todos" ? `_${filtros.status}` : "";
  return `catalogo_produtos${segmento}${status}_${hoje}.csv`;
};

export const exportarProdutosExcel = (produtos = [], filtros = {}) => {
  if (!Array.isArray(produtos) || produtos.length === 0) {
    throw new Error("Não há produtos para exportar com os filtros selecionados.");
  }

  const cabecalhos = [
    "ID",
    "Produto",
    "Embalagem",
    "Qtd. Caixa",
    "Peso (kg)",
    "Segmento",
    "Fornecedor",
    "Preço Venda Caixa (R$)",
    "Preço Unitário (R$)",
    "Estoque Atual",
    "Status",
  ];

  const linhas = [cabecalhos.join(";")];

  produtos.forEach((p) => {
    const id = `#${p.id}`;
    const nome = p.nome || "Sem nome";
    const embalagem = p.embalagem || "-";
    const qtdCaixa = p.quantidade ? String(p.quantidade) : "-";
    const peso = p.peso ? String(p.peso).replace(".", ",") : "-";
    const segmento = p.segmento || "-";
    const fornecedor = p.fornecedor || "-";
    const precoVenda = formatarNumeroMoeda(p.precoVenda);
    const precoUnd = formatarNumeroMoeda(p.precoUndVenda);
    
    // Formata estoque
    const estoqueNum = Number(p.estoque ?? 0);
    const estoqueFormatado = !isNaN(estoqueNum)
      ? estoqueNum.toFixed(2).replace(".", ",")
      : "0,00";

    const status = String(p.status || "ativo").toUpperCase();

    const linha = [
      sanitizarCampoCSV(id),
      sanitizarCampoCSV(nome),
      sanitizarCampoCSV(embalagem),
      sanitizarCampoCSV(qtdCaixa),
      sanitizarCampoCSV(peso),
      sanitizarCampoCSV(segmento),
      sanitizarCampoCSV(fornecedor),
      sanitizarCampoCSV(precoVenda),
      sanitizarCampoCSV(precoUnd),
      sanitizarCampoCSV(estoqueFormatado),
      sanitizarCampoCSV(status),
    ];

    linhas.push(linha.join(";"));
  });

  const conteudoCsv = "\uFEFF" + linhas.join("\r\n");
  const blob = new Blob([conteudoCsv], { type: "text/csv;charset=utf-8;" });

  const nomeArquivo = gerarNomeArquivo(filtros);

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
    quantidade: produtos.length,
    nomeArquivo,
  };
};


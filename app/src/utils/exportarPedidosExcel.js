import { dataHoraFormatada } from "./data.js";

/**
 * Escapa e sanitiza campos para formato CSV padrão Excel (pt-BR)
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

/**
 * Extrai a descrição da forma de pagamento de forma segura
 */
const extrairFormaPagamento = (pedido) => {
  if (!pedido) return "-";
  if (pedido.tipo === "balcao" && Array.isArray(pedido.pagamentos)) {
    const formas = pedido.pagamentos
      .map((p) => p.formaPagamento?.nome || p.formaNome || p.forma || "-")
      .filter(Boolean);
    return formas.length > 0 ? formas.join(" | ") : "-";
  }
  return (
    pedido.formaPagamento?.nome ||
    pedido.formaPagamentoNome ||
    pedido.forma ||
    "-"
  );
};

/**
 * Extrai a origem / vendedor / operador do pedido
 */
const extrairOrigemVendedor = (pedido) => {
  if (!pedido) return "-";
  if (pedido.tipo === "delivery") {
    return `Delivery · ${pedido.vendedor || "-"}`;
  }
  const balcao = pedido.vendedor || "Balcão";
  const operador = pedido.nomeUsuario ? ` · ${pedido.nomeUsuario}` : "";
  return `${balcao}${operador}`;
};

/**
 * Gera o nome padronizado do arquivo com base nos filtros
 */
const gerarNomeArquivo = (filtros = {}) => {
  const inicio = filtros.dataInicio ? filtros.dataInicio.replace(/-/g, "") : "";
  const fim = filtros.dataFim ? filtros.dataFim.replace(/-/g, "") : "";
  const setor = filtros.setor ? `_${filtros.setor}` : "";

  if (inicio && fim) {
    return `pedidos${setor}_${inicio}_a_${fim}.csv`;
  }
  const hoje = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `pedidos${setor}_${hoje}.csv`;
};

/**
 * Exporta a lista de pedidos filtrados diretamente pelo Front-end
 * Gerando um CSV com BOM UTF-8 (\uFEFF) e delimitador ';' 100% compatível com Excel
 */
export const exportarPedidosExcel = (pedidos = [], filtros = {}) => {
  if (!Array.isArray(pedidos) || pedidos.length === 0) {
    throw new Error("Não há pedidos para exportar com os filtros selecionados.");
  }

  // Cabeçalhos das colunas
  const cabecalhos = [
    "ID",
    "Data / Hora",
    "Setor",
    "Origem / Vendedor",
    "Cliente",
    "CPF / CNPJ",
    "Forma de Pagamento",
    "Qtd. Itens",
    "Valor Total (R$)",
    "Status",
  ];

  const linhas = [cabecalhos.join(";")];

  pedidos.forEach((p) => {
    const id = `#${p.id}`;
    const dataHora = dataHoraFormatada(p.data || p.createdAt);

    let setor = p.tipo || p.setor || "balcao";
    if (setor === "balcao") setor = "Balcão";
    else if (setor === "delivery") setor = "Delivery";
    else if (setor === "externo") setor = "Externo";

    const origem = extrairOrigemVendedor(p);

    const clienteNome =
      p.cliente?.nome ||
      p.cliente?.nomeFantasia ||
      p.nomeCliente ||
      (p.tipo === "balcao" ? "Consumidor Balcão" : "Não informado");

    const documento =
      p.cliente?.cnpj ||
      p.cliente?.cpf ||
      p.cnpj ||
      p.cpf ||
      "-";

    const formaPagamento = extrairFormaPagamento(p);

    const qtdItens = Array.isArray(p.itens)
      ? p.itens.reduce((acc, it) => acc + (Number(it.quantidade) || 0), 0)
      : (p.quantidadeItens || "-");

    const totalNum = Number(p.total ?? p.valorTotal ?? 0);
    const totalFormatado = !isNaN(totalNum)
      ? totalNum.toFixed(2).replace(".", ",")
      : "0,00";

    const status = String(p.status || "-").toUpperCase();

    const linha = [
      sanitizarCampoCSV(id),
      sanitizarCampoCSV(dataHora),
      sanitizarCampoCSV(setor),
      sanitizarCampoCSV(origem),
      sanitizarCampoCSV(clienteNome),
      sanitizarCampoCSV(documento),
      sanitizarCampoCSV(formaPagamento),
      sanitizarCampoCSV(qtdItens),
      sanitizarCampoCSV(totalFormatado),
      sanitizarCampoCSV(status),
    ];

    linhas.push(linha.join(";"));
  });

  // Prefixo BOM UTF-8 (\uFEFF) garante acentuação correta no Excel brasileiro
  const conteudoCsv = "\uFEFF" + linhas.join("\r\n");
  const blob = new Blob([conteudoCsv], { type: "text/csv;charset=utf-8;" });

  const nomeArquivo = gerarNomeArquivo(filtros);

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
    quantidade: pedidos.length,
    nomeArquivo,
  };
};

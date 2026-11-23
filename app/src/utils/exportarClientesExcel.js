/**
 * Utilitários para exportação de Clientes Externos e Clientes Delivery para Excel (CSV com BOM UTF-8)
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

const formatarTelefone = (telefone) => {
  const digitos = String(telefone || "").replace(/\D/g, "");
  if (!digitos) return "-";
  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }
  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return telefone;
};

const formatarDocumento = (doc) => {
  const digitos = String(doc || "").replace(/\D/g, "");
  if (!digitos) return "-";
  if (digitos.length === 11) {
    return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
  }
  if (digitos.length === 14) {
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12)}`;
  }
  return doc;
};

/**
 * 1. Exportação de Clientes Externos (Vendas em Campo)
 */
export const exportarClientesExternosExcel = (clientes = [], filtros = {}) => {
  if (!Array.isArray(clientes) || clientes.length === 0) {
    throw new Error("Não há clientes externos para exportar com os filtros selecionados.");
  }

  const cabecalhos = [
    "ID",
    "Razão Social / Nome",
    "CNPJ / CPF",
    "Telefone / WhatsApp",
    "Cidade",
    "Endereço Completo",
    "Vendedor Responsável",
    "Dia de Atendimento",
    "Frequência",
    "Saldo Devedor (R$)",
    "Total Amortizado (R$)",
    "Status de Débito",
    "Status do Cadastro",
  ];

  const linhas = [cabecalhos.join(";")];

  clientes.forEach((c) => {
    const id = `#${c.id}`;
    const nome = c.nome || "Não informado";
    const doc = formatarDocumento(c.cnpj);
    const tel = formatarTelefone(c.telefone);
    const cidade = c.cidade || "-";
    const endereco = c.endereco || "-";
    const vendedor = c.vendedor || "-";
    const atendimento = c.atendimento || "-";
    const frequencia = c.frequencia || "-";
    const saldoDevedor = formatarNumeroMoeda(c.totalPendencia);
    const totalPago = formatarNumeroMoeda(c.totalPago);

    const temPendencia = c.temPendencia || Number(c.totalPendencia || 0) > 0;
    const statusDebito = temPendencia ? "COM DÉBITOS" : "SEM DÉBITOS";
    const statusCadastro = String(c.status || "ativo").toUpperCase();

    const linha = [
      sanitizarCampoCSV(id),
      sanitizarCampoCSV(nome),
      sanitizarCampoCSV(doc),
      sanitizarCampoCSV(tel),
      sanitizarCampoCSV(cidade),
      sanitizarCampoCSV(endereco),
      sanitizarCampoCSV(vendedor),
      sanitizarCampoCSV(atendimento),
      sanitizarCampoCSV(frequencia),
      sanitizarCampoCSV(saldoDevedor),
      sanitizarCampoCSV(totalPago),
      sanitizarCampoCSV(statusDebito),
      sanitizarCampoCSV(statusCadastro),
    ];

    linhas.push(linha.join(";"));
  });

  const conteudoCsv = "\uFEFF" + linhas.join("\r\n");
  const blob = new Blob([conteudoCsv], { type: "text/csv;charset=utf-8;" });

  const hoje = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const vend = filtros.vendedor ? `_${filtros.vendedor.toLowerCase().replace(/\s+/g, "_")}` : "";
  const nomeArquivo = `clientes_externos${vend}_${hoje}.csv`;

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
    quantidade: clientes.length,
    nomeArquivo,
  };
};

/**
 * 2. Exportação de Clientes Delivery (Entregas & Balcão)
 */
export const exportarClientesDeliveryExcel = (clientes = [], filtros = {}) => {
  if (!Array.isArray(clientes) || clientes.length === 0) {
    throw new Error("Não há clientes delivery para exportar com os filtros selecionados.");
  }

  const cabecalhos = [
    "ID",
    "Nome do Cliente",
    "Telefone / WhatsApp",
    "Endereço",
    "Número",
    "Complemento",
    "Bairro",
    "Cidade",
    "Ponto de Referência",
    "Status",
  ];

  const linhas = [cabecalhos.join(";")];

  clientes.forEach((c) => {
    const id = `#${c.id}`;
    const nome = c.nome || "Não informado";
    const tel = formatarTelefone(c.telefone);
    const endereco = c.endereco || "-";
    const numero = c.numero !== undefined && c.numero !== null ? String(c.numero) : "-";
    const complemento = c.complemento || "-";
    const bairro = c.bairro || "-";
    const cidade = c.cidade || "-";
    const referencia = c.referencia || "-";
    const status = String(c.status || "ativo").toUpperCase();

    const linha = [
      sanitizarCampoCSV(id),
      sanitizarCampoCSV(nome),
      sanitizarCampoCSV(tel),
      sanitizarCampoCSV(endereco),
      sanitizarCampoCSV(numero),
      sanitizarCampoCSV(complemento),
      sanitizarCampoCSV(bairro),
      sanitizarCampoCSV(cidade),
      sanitizarCampoCSV(referencia),
      sanitizarCampoCSV(status),
    ];

    linhas.push(linha.join(";"));
  });

  const conteudoCsv = "\uFEFF" + linhas.join("\r\n");
  const blob = new Blob([conteudoCsv], { type: "text/csv;charset=utf-8;" });

  const hoje = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const bairroFiltro = filtros.bairro ? `_${filtros.bairro.toLowerCase().replace(/\s+/g, "_")}` : "";
  const nomeArquivo = `clientes_delivery${bairroFiltro}_${hoje}.csv`;

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
    quantidade: clientes.length,
    nomeArquivo,
  };
};


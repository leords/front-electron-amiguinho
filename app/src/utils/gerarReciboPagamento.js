import { dataHoraFormatada } from "./data.js";
import { formatarMoeda } from "./formartarMoeda.js";

/**
 * Gera o template HTML para impressão térmica (80mm/72mm) do Recibo de Pagamento.
 * Contém dados da empresa, cliente, detalhes do pagamento, valor em destaque e campo de assinatura do financeiro.
 */
export function gerarReciboPagamentoHTML(dados = {}) {
  const dataHoraEmissao = dataHoraFormatada(new Date());

  const idPagamento = dados.id || "-";
  const valorNum = Number(dados.valor || 0);
  const valorFormatado = formatarMoeda(valorNum);
  const formaNome = dados.formaNome || dados.forma || "Não informada";

  // Data do pagamento
  const dataPg = dados.data || dados.createdAt || new Date();
  let dataPgFormatada = "-";
  let horaPgFormatada = "";
  try {
    const dt = new Date(dataPg);
    if (!isNaN(dt.getTime())) {
      dataPgFormatada = dt.toLocaleDateString("pt-BR");
      horaPgFormatada = dt.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  } catch {
    dataPgFormatada = String(dataPg);
  }

  // Dados do cliente
  const clienteObj = dados.cliente || {};
  const clienteNome = (
    clienteObj.nome ||
    clienteObj.nomeFantasia ||
    dados.nomeCliente ||
    "CLIENTE NÃO IDENTIFICADO"
  ).toUpperCase();

  const cpfCnpj = clienteObj.cpf || clienteObj.cnpj || dados.cpfCnpj || "";
  const telefone = clienteObj.telefone || dados.telefone || "";
  const endereco = [
    clienteObj.rua || clienteObj.logradouro,
    clienteObj.numero,
    clienteObj.bairro,
    clienteObj.cidade,
  ]
    .filter(Boolean)
    .join(", ");

  const vendedor = dados.vendedor || clienteObj.vendedor || "";
  const operador = dados.usuarioNome || dados.criadoPor || "";
  const pendenciaId = dados.pendenciaId || "";
  const pedidoId = dados.pedidoId || "";
  const observacao = dados.observacao ? String(dados.observacao).trim() : "";

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recibo de Pagamento #${idPagamento} - Amigão</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: 80mm auto;
      margin: 0;
    }

    html, body {
      width: 80mm;
      margin: 0;
      padding: 0;
      background: #f0f0f0;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    #container {
      width: 72mm;
      max-width: 72mm;
      margin: 0 auto;
      background: white;
      padding: 3mm 2mm 4mm 2mm;
    }

    .header {
      text-align: center;
      margin-bottom: 2mm;
    }

    .empresa {
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.5px;
      line-height: 1.3;
    }

    .sub-empresa {
      font-size: 10px;
      line-height: 1.3;
    }

    .titulo-recibo {
      font-size: 13px;
      font-weight: 900;
      text-transform: uppercase;
      margin-top: 2mm;
      padding: 1.5mm 0;
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
      letter-spacing: 0.5px;
      text-align: center;
    }

    .num-recibo {
      font-size: 11px;
      font-weight: bold;
      text-align: center;
      margin: 1.5mm 0 2mm 0;
    }

    .divider-solid {
      border: 0;
      border-top: 1px solid #000;
      margin: 2mm 0;
    }

    .divider-dashed {
      border: 0;
      border-top: 1px dashed #000;
      margin: 2mm 0;
    }

    .secao-titulo {
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      margin-bottom: 1.5mm;
      letter-spacing: 0.4px;
    }

    .dados-bloco {
      font-size: 10px;
      line-height: 1.4;
    }

    .linha-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1mm;
      gap: 4px;
    }

    .linha-info span:first-child {
      color: #222;
    }

    .linha-info strong {
      text-align: right;
      word-break: break-word;
    }

    /* Caixa de Destaque do Valor */
    .caixa-valor {
      border: 1.5px solid #000;
      border-radius: 2px;
      padding: 2.5mm 2mm;
      margin: 2.5mm 0;
      text-align: center;
      background: #fafafa;
    }

    .caixa-valor-label {
      font-size: 10px;
      font-weight: bold;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 1mm;
    }

    .caixa-valor-total {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: 0.5px;
    }

    .texto-declaracao {
      font-size: 9.5px;
      line-height: 1.35;
      text-align: justify;
      margin: 2.5mm 0;
    }

    .observacao-bloco {
      font-size: 9.5px;
      font-style: italic;
      margin: 1.5mm 0;
      padding: 1.5mm;
      background: #f5f5f5;
      border-left: 2px solid #000;
    }

    /* Espaço de Assinatura */
    .secao-assinatura {
      margin-top: 8mm;
      text-align: center;
    }

    .linha-assinatura {
      border-top: 1px solid #000;
      width: 82%;
      margin: 0 auto 1.5mm auto;
    }

    .nome-assinatura {
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .cargo-assinatura {
      font-size: 9px;
      color: #333;
    }

    .rodape-recibo {
      text-align: center;
      font-size: 8.5px;
      color: #444;
      margin-top: 4mm;
      padding-top: 1.5mm;
      border-top: 1px dotted #888;
    }

    @media print {
      body {
        background: transparent;
      }
      #container {
        width: 72mm;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div id="container">
    <!-- Cabeçalho da Empresa -->
    <div class="header">
      <div class="empresa">AMIGAO DISTRIBUIDORA DE BEBIDAS LTDA</div>
      <div class="sub-empresa">CNPJ: 41.836.758/0001-41</div>
      <div class="sub-empresa">Canoinhas - SC</div>
      <div class="titulo-recibo">RECIBO DE PAGAMENTO</div>
      <div class="num-recibo">DOCUMENTO Nº #${idPagamento} (BAIXADO)</div>
    </div>

    <hr class="divider-solid">

    <!-- Dados do Cliente -->
    <div class="secao-titulo">DADOS DO CLIENTE</div>
    <div class="dados-bloco">
      <div class="linha-info">
        <span>NOME:</span>
        <strong>${clienteNome}</strong>
      </div>
      ${
        cpfCnpj
          ? `
      <div class="linha-info">
        <span>CPF/CNPJ:</span>
        <strong>${cpfCnpj}</strong>
      </div>`
          : ""
      }
      ${
        telefone
          ? `
      <div class="linha-info">
        <span>TELEFONE:</span>
        <strong>${telefone}</strong>
      </div>`
          : ""
      }
      ${
        endereco
          ? `
      <div class="linha-info">
        <span>ENDEREÇO:</span>
        <strong>${endereco}</strong>
      </div>`
          : ""
      }
    </div>

    <hr class="divider-dashed">

    <!-- Detalhes do Pagamento -->
    <div class="secao-titulo">DETALHES DO PAGAMENTO</div>
    <div class="dados-bloco">
      <div class="linha-info">
        <span>DATA DO PAGTO:</span>
        <strong>${dataPgFormatada} às ${horaPgFormatada}</strong>
      </div>
      <div class="linha-info">
        <span>FORMA DE PAGTO:</span>
        <strong>${formaNome.toUpperCase()}</strong>
      </div>
      <div class="linha-info">
        <span>STATUS:</span>
        <strong>CONFIRMADO / BAIXADO</strong>
      </div>
      ${
        pendenciaId
          ? `
      <div class="linha-info">
        <span>REF. PENDÊNCIA:</span>
        <strong>#${pendenciaId}</strong>
      </div>`
          : ""
      }
      ${
        pedidoId
          ? `
      <div class="linha-info">
        <span>REF. PEDIDO:</span>
        <strong>#${pedidoId}</strong>
      </div>`
          : ""
      }
      ${
        vendedor
          ? `
      <div class="linha-info">
        <span>VENDEDOR / ROTA:</span>
        <strong>${vendedor.toUpperCase()}</strong>
      </div>`
          : ""
      }
      ${
        operador
          ? `
      <div class="linha-info">
        <span>OPERADOR:</span>
        <strong>${operador.toUpperCase()}</strong>
      </div>`
          : ""
      }
    </div>

    <!-- Caixa com o Valor Pago -->
    <div class="caixa-valor">
      <div class="caixa-valor-label">VALOR RECEBIDO E QUITADO</div>
      <div class="caixa-valor-total">${valorFormatado}</div>
    </div>

    ${
      observacao
        ? `
    <div class="observacao-bloco">
      <strong>Observação:</strong> "${observacao}"
    </div>`
        : ""
    }

    <!-- Texto de Quitação -->
    <div class="texto-declaracao">
      Declaramos para os devidos fins ter recebido da pessoa física/jurídica acima qualificada a quantia discriminada neste documento, dando plena e irrevogável quitação referente a este pagamento.
    </div>

    <!-- Espaço para Assinatura do Financeiro -->
    <div class="secao-assinatura">
      <div class="linha-assinatura"></div>
      <div class="nome-assinatura">RESPONSÁVEL FINANCEIRO</div>
      <div class="cargo-assinatura">Amigão Distribuidora de Bebidas LTDA</div>
    </div>

    <div class="rodape-recibo">
      Amiguinho Sistema · Emissão: ${dataHoraEmissao}
    </div>
  </div>
</body>
</html>
  `;
}

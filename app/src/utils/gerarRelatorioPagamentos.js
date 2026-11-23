import { dataHoraFormatada } from "./data.js";
import { formatarMoeda } from "./formartarMoeda.js";

/**
 * Gera o template HTML para impressão térmica (80mm) do Relatório de Pagamentos Realizados.
 */
export function gerarRelatorioPagamentosHTML(dados) {
  const dataHora = dataHoraFormatada(new Date());
  const vendedor = dados.vendedor || "Todos";
  const atendimento = dados.atendimento || "Todos";
  const periodo = dados.periodo || "Geral";
  const statusFiltro = (dados.statusFiltro || "todos").toUpperCase();
  const formaFiltro = dados.formaFiltro || "Todas";
  const totais = dados.totais || {};
  const pagamentos = Array.isArray(dados.pagamentos) ? dados.pagamentos : [];

  let linhasPagamentosHTML = "";
  if (pagamentos.length > 0) {
    pagamentos.forEach((p) => {
      const clienteNome =
        p.cliente?.nomeFantasia ||
        p.cliente?.nome ||
        p.nomeCliente ||
        "Cliente Balcão/Externo";
      const statusLabel = (p.status || "coletado").toUpperCase();
      const formaNome =
        p.formaNome || p.forma || p.formaPagamento?.nome || "Forma";
      const dataStr = p.data || p.createdAt;
      const dataFormatada = dataStr
        ? new Date(dataStr).toLocaleDateString("pt-BR")
        : "-";
      const horaFormatada = dataStr
        ? new Date(dataStr).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";

      linhasPagamentosHTML += `
        <div class="linha-item">
          <div class="item-desc">
            <span>#${p.id} [${statusLabel}] ${clienteNome}</span>
            <small>${formaNome} • ${dataFormatada} ${horaFormatada}${
        p.pendenciaId ? ` • Ref #${p.pendenciaId}` : ""
      }</small>
          </div>
          <strong class="item-val">${formatarMoeda(p.valor || 0)}</strong>
        </div>
      `;
    });
  } else {
    linhasPagamentosHTML = `<div class="sem-itens">Nenhum pagamento encontrado com os filtros aplicados.</div>`;
  }

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Pagamentos - Amigão</title>
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
      padding: 3mm 2mm 2mm 2mm;
    }

    .header {
      text-align: center;
      margin-bottom: 2mm;
    }

    .header .empresa {
      font-size: 13px;
      font-weight: bold;
      letter-spacing: 0.5px;
      line-height: 1.3;
    }

    .header .info {
      font-size: 10px;
      line-height: 1.3;
    }

    .titulo-relatorio {
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      margin-top: 2mm;
      padding: 1.5mm 0;
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
      letter-spacing: 0.5px;
      text-align: center;
    }

    .dados-filtro {
      margin: 2mm 0;
      font-size: 10px;
      line-height: 1.4;
    }

    .dados-filtro .linha {
      display: flex;
      justify-content: space-between;
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
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 1.5mm;
      display: flex;
      justify-content: space-between;
    }

    .resumo-linha {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1mm;
      font-size: 11px;
    }

    .resumo-total-geral {
      display: flex;
      justify-content: space-between;
      margin-top: 2mm;
      padding: 1.5mm 0;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      font-size: 13px;
      font-weight: 900;
    }

    .linha-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5mm;
      font-size: 10px;
      gap: 2mm;
      border-bottom: 0.5px dotted #ccc;
      padding-bottom: 1mm;
    }

    .item-desc {
      display: flex;
      flex-direction: column;
      max-width: 48mm;
      word-break: break-word;
    }

    .item-desc small {
      font-size: 9px;
      color: #333;
    }

    .item-val {
      font-weight: bold;
      white-space: nowrap;
    }

    .sem-itens {
      font-style: italic;
      color: #555;
      font-size: 10px;
      margin-bottom: 1mm;
      text-align: center;
    }

    .assinaturas {
      margin-top: 6mm;
      text-align: center;
    }

    .campo-assinatura {
      margin-top: 5mm;
    }

    .linha-assinatura {
      border-top: 1px solid #000;
      width: 80%;
      margin: 0 auto 1mm auto;
    }

    .nome-assinatura {
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
    }

    .cargo-assinatura {
      font-size: 9px;
      color: #333;
    }

    .rodape-cupom {
      text-align: center;
      margin-top: 4mm;
      font-size: 8px;
      color: #444;
      border-top: 1px dashed #aaa;
      padding-top: 1.5mm;
    }

    @media print {
      @page {
        size: 80mm auto;
        margin: 0;
      }

      html, body {
        width: 80mm;
        margin: 0;
        padding: 0;
        background: #ffffff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      #container {
        width: 72mm;
        max-width: 72mm;
        margin: 0 auto;
        padding: 2mm 1mm 2mm 1mm;
        background: #ffffff;
      }
    }
  </style>
</head>
<body>
  <div id="container">
    <div class="header">
      <div class="empresa">AMIGAO DISTRIBUIDORA DE BEBIDAS</div>
      <div class="info">SISTEMA DE CONTROLE AMIGUINHO</div>
      <div class="titulo-relatorio">HISTÓRICO DE PAGAMENTOS</div>
    </div>

    <div class="dados-filtro">
      <div class="linha">
        <span>VENDEDOR:</span>
        <strong>${vendedor.toUpperCase()}</strong>
      </div>
      <div class="linha">
        <span>ATENDIMENTO:</span>
        <strong>${atendimento}</strong>
      </div>
      <div class="linha">
        <span>PERÍODO:</span>
        <span>${periodo}</span>
      </div>
      <div class="linha">
        <span>STATUS:</span>
        <span>${statusFiltro}</span>
      </div>
      <div class="linha">
        <span>FORMA:</span>
        <span>${formaFiltro}</span>
      </div>
      <div class="linha">
        <span>EMISSÃO:</span>
        <span>${dataHora}</span>
      </div>
    </div>

    <hr class="divider-solid">
    <div class="secao-titulo">RESUMO GERAL</div>

    <div class="resumo-linha">
      <span>Confirmados (Baixados):</span>
      <strong>${formatarMoeda(totais.totalConfirmado || 0)}</strong>
    </div>
    <div class="resumo-linha">
      <span>Coletados (A Confirmar):</span>
      <strong>${formatarMoeda(totais.totalColetado || 0)}</strong>
    </div>
    ${
      totais.totalCancelado
        ? `
    <div class="resumo-linha" style="color: #c92a2a;">
      <span>Cancelados:</span>
      <strong>${formatarMoeda(totais.totalCancelado || 0)}</strong>
    </div>
    `
        : ""
    }

    <div class="resumo-total-geral">
      <span>TOTAL GERAL:</span>
      <span>${formatarMoeda(totais.totalGeral || 0)}</span>
    </div>

    <hr class="divider-dashed">
    <div class="secao-titulo">POR FORMA DE PAGAMENTO</div>

    <div class="resumo-linha">
      <span>Dinheiro:</span>
      <span>${formatarMoeda(totais.dinheiro || 0)}</span>
    </div>
    <div class="resumo-linha">
      <span>PIX:</span>
      <span>${formatarMoeda(totais.pix || 0)}</span>
    </div>
    <div class="resumo-linha">
      <span>Cartões:</span>
      <span>${formatarMoeda(totais.cartao || 0)}</span>
    </div>
    <div class="resumo-linha">
      <span>Cheques:</span>
      <span>${formatarMoeda(totais.cheque || 0)}</span>
    </div>
    <div class="resumo-linha">
      <span>Vales:</span>
      <span>${formatarMoeda(totais.vale || 0)}</span>
    </div>

    <hr class="divider-dashed">
    <div class="secao-titulo">
      <span>PAGAMENTOS (${pagamentos.length})</span>
    </div>
    ${linhasPagamentosHTML}

    <div class="assinaturas">
      <div class="campo-assinatura">
        <div class="linha-assinatura"></div>
        <div class="nome-assinatura">CONFERÊNCIA FINANCEIRO / CAIXA</div>
        <div class="cargo-assinatura">Responsável pela Emissão</div>
      </div>
    </div>

    <div class="rodape-cupom">
      Amiguinho Sistema - Impresso em ${dataHora}
    </div>
  </div>
</body>
</html>
  `;
}

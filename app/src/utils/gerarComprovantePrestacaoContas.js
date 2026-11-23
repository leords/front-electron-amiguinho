import { dataHoraFormatada } from "./data.js";
import { formatarMoeda } from "./formartarMoeda.js";

/**
 * Gera o template HTML para impressão térmica (72mm / 80mm) da Prestação de Contas do Vendedor.
 */
export function gerarComprovantePrestacaoContasHTML(dados) {
  const dataHora = dataHoraFormatada(new Date());
  const vendedor = dados.vendedor || "Não informado";
  const atendimento = dados.atendimento || "-";
  const dataReferencia = dados.dataReferencia || "-";
  const totais = dados.totais || {};
  const ajustes = Array.isArray(dados.ajustes) ? dados.ajustes : [];
  const pagamentos = Array.isArray(dados.pagamentos) ? dados.pagamentos : [];
  const contagemCedulas = dados.contagemCedulas || null;

  // Ajustes formatados em HTML
  let linhasAjustesHTML = "";
  if (ajustes.length > 0) {
    ajustes.forEach((aj) => {
      const sinal = aj.tipo === "adicao" || aj.tipo === "entrada" ? "(+)" : "(-)";
      const classe = aj.tipo === "adicao" || aj.tipo === "entrada" ? "ajuste-pos" : "ajuste-neg";
      linhasAjustesHTML += `
        <div class="linha-ajuste ${classe}">
          <span>${sinal} ${aj.categoria || "Ajuste"} (${aj.formaPagamento || "Dinheiro"}): ${aj.descricao || "-"}</span>
          <strong>${formatarMoeda(aj.valor || 0)}</strong>
        </div>
      `;
    });
  } else {
    linhasAjustesHTML = `<div class="sem-itens">Nenhum ajuste extra lançado.</div>`;
  }

  // Pagamentos coletados/baixados formatados
  const pagamentosAtivos = pagamentos.filter((p) => p.status !== "cancelado");
  let linhasPagamentosHTML = "";
  if (pagamentosAtivos.length > 0) {
    pagamentosAtivos.forEach((p) => {
      const clienteNome = p.cliente?.nomeFantasia || p.cliente?.nome || p.nomeCliente || "Cliente";
      const statusLabel = (p.status || "coletado").toUpperCase();
      const formaNome = p.formaNome || p.forma || p.formaPagamento?.nome || "Forma";
      linhasPagamentosHTML += `
        <div class="linha-item">
          <div class="item-desc">
            <span>[${statusLabel}] ${clienteNome}</span>
            <small>${formaNome}</small>
          </div>
          <strong class="item-val">${formatarMoeda(p.valor || 0)}</strong>
        </div>
      `;
    });
  } else {
    linhasPagamentosHTML = `<div class="sem-itens">Nenhum pagamento registrado.</div>`;
  }

  // Cédulas contadas (se houver)
  let cedulasHTML = "";
  if (contagemCedulas && contagemCedulas.totalContado > 0) {
    const c = contagemCedulas.cedulas || {};
    let linhasNotasHTML = "";
    if (Number(c.duzentos) > 0) linhasNotasHTML += `<div class="resumo-linha"><span>${c.duzentos}x R$ 200,00:</span> <span>${formatarMoeda(c.duzentos * 200)}</span></div>`;
    if (Number(c.cem) > 0) linhasNotasHTML += `<div class="resumo-linha"><span>${c.cem}x R$ 100,00:</span> <span>${formatarMoeda(c.cem * 100)}</span></div>`;
    if (Number(c.cinquenta) > 0) linhasNotasHTML += `<div class="resumo-linha"><span>${c.cinquenta}x R$ 50,00:</span> <span>${formatarMoeda(c.cinquenta * 50)}</span></div>`;
    if (Number(c.vinte) > 0) linhasNotasHTML += `<div class="resumo-linha"><span>${c.vinte}x R$ 20,00:</span> <span>${formatarMoeda(c.vinte * 20)}</span></div>`;
    if (Number(c.dez) > 0) linhasNotasHTML += `<div class="resumo-linha"><span>${c.dez}x R$ 10,00:</span> <span>${formatarMoeda(c.dez * 10)}</span></div>`;
    if (Number(c.cinco) > 0) linhasNotasHTML += `<div class="resumo-linha"><span>${c.cinco}x R$ 5,00:</span> <span>${formatarMoeda(c.cinco * 5)}</span></div>`;
    if (Number(c.dois) > 0) linhasNotasHTML += `<div class="resumo-linha"><span>${c.dois}x R$ 2,00:</span> <span>${formatarMoeda(c.dois * 2)}</span></div>`;

    cedulasHTML = `
      <hr class="divider-dashed">
      <div class="secao-titulo">CONTAGEM FÍSICA DE CÉDULAS</div>
      ${linhasNotasHTML}
      <div class="resumo-linha" style="font-weight:bold; border-top: 1px dashed #000; padding-top: 1mm; margin-top: 1mm;">
        <span>Total Contado em Dinheiro:</span>
        <strong>${formatarMoeda(contagemCedulas.totalContado)}</strong>
      </div>
      <div class="resumo-linha">
        <span>Diferença (${(contagemCedulas.diferenca || 0) >= 0 ? "Sobra" : "Falta"}):</span>
        <strong>${(contagemCedulas.diferenca || 0) >= 0 ? "+" : ""}${formatarMoeda(contagemCedulas.diferenca || 0)}</strong>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prestação de Contas - ${vendedor}</title>
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

    .titulo-fechamento {
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      margin-top: 2mm;
      padding: 1.5mm 0;
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
      letter-spacing: 0.5px;
    }

    .dados-rota {
      margin: 2mm 0;
      font-size: 11px;
      line-height: 1.4;
    }

    .dados-rota .linha {
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

    .linha-ajuste, .linha-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1mm;
      font-size: 10px;
    }

    .item-desc {
      display: flex;
      flex-direction: column;
      max-width: 50mm;
    }

    .item-desc small {
      font-size: 9px;
      color: #333;
    }

    .item-val {
      font-weight: bold;
    }

    .sem-itens {
      font-style: italic;
      color: #555;
      font-size: 10px;
      margin-bottom: 1mm;
    }

    .assinaturas {
      margin-top: 8mm;
      text-align: center;
    }

    .campo-assinatura {
      margin-top: 6mm;
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
      <div class="titulo-fechamento">PRESTAÇÃO DE CONTAS - VENDEDOR</div>
    </div>

    <div class="dados-rota">
      <div class="linha">
        <span>VENDEDOR:</span>
        <strong>${vendedor.toUpperCase()}</strong>
      </div>
      <div class="linha">
        <span>ATENDIMENTO:</span>
        <strong>${atendimento}</strong>
      </div>
      <div class="linha">
        <span>DATA REFERENCIA:</span>
        <span>${dataReferencia}</span>
      </div>
      <div class="linha">
        <span>EMISSÃO:</span>
        <span>${dataHora}</span>
      </div>
    </div>

    <hr class="divider-solid">
    <div class="secao-titulo">RESUMO POR FORMA DE PAGTO</div>

    <div class="resumo-linha">
      <span>Dinheiro (+/- Ajustes):</span>
      <strong>${formatarMoeda(totais.dinheiroFinal || 0)}</strong>
    </div>
    <div class="resumo-linha">
      <span>PIX (+/- Ajustes):</span>
      <strong>${formatarMoeda(totais.pixFinal || 0)}</strong>
    </div>
    <div class="resumo-linha">
      <span>Cartão (+/- Ajustes):</span>
      <strong>${formatarMoeda(totais.cartaoFinal || 0)}</strong>
    </div>
    <div class="resumo-linha">
      <span>Cheque (+/- Ajustes):</span>
      <strong>${formatarMoeda(totais.chequeFinal || 0)}</strong>
    </div>
    <div class="resumo-linha">
      <span>Vale / A Prazo:</span>
      <strong>${formatarMoeda(totais.valeFinal || 0)}</strong>
    </div>

    <div class="resumo-total-geral">
      <span>TOTAL FECHAMENTO:</span>
      <span>${formatarMoeda(totais.totalGeral || 0)}</span>
    </div>

    ${totais.totalConfirmado !== undefined ? `
    <div class="resumo-linha" style="font-size: 10px; color: #333; margin-top: 1mm;">
      <span>Total Confirmado (Baixado):</span>
      <span>${formatarMoeda(totais.totalConfirmado)}</span>
    </div>
    ` : ""}

    ${totais.totalAjustes ? `
    <div class="resumo-linha" style="font-size: 10px; color: #333;">
      <span>Lançamentos / Ajustes:</span>
      <span>${totais.totalAjustes > 0 ? "+" : ""}${formatarMoeda(totais.totalAjustes)}</span>
    </div>
    ` : ""}

    ${totais.totalColetado ? `
    <div class="resumo-linha" style="font-size: 10px; color: #555;">
      <span>Coletados a Confirmar:</span>
      <span>${formatarMoeda(totais.totalColetado)}</span>
    </div>
    ` : ""}

    <div class="resumo-linha" style="margin-top: 1.5mm;">
      <span>Pendências em Aberto:</span>
      <span>${formatarMoeda(totais.totalPendenciasAtivas || 0)}</span>
    </div>

    <hr class="divider-dashed">
    <div class="secao-titulo">
      <span>PAGAMENTOS (${pagamentosAtivos.length})</span>
    </div>
    ${linhasPagamentosHTML}

    <hr class="divider-dashed">
    <div class="secao-titulo">
      <span>LANÇAMENTOS E AJUSTES (${ajustes.length})</span>
    </div>
    ${linhasAjustesHTML}

    ${cedulasHTML}

    <div class="assinaturas">
      <div class="campo-assinatura">
        <div class="linha-assinatura"></div>
        <div class="nome-assinatura">${vendedor}</div>
        <div class="cargo-assinatura">Vendedor Externo</div>
      </div>

      <div class="campo-assinatura" style="margin-top: 5mm;">
        <div class="linha-assinatura"></div>
        <div class="nome-assinatura">FINANCEIRO / BALCÃO</div>
        <div class="cargo-assinatura">Responsável pela Conferência</div>
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

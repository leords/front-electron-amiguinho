import { dataHoraFormatada } from "./data.js";
import { formatarMoeda } from "./formartarMoeda.js";

/**
 * Gera o template HTML para impressão térmica (72mm / 80mm) do Fechamento de Carga com o Motorista.
 */
export function gerarComprovanteFechamentoCargaHTML(dados) {
  const dataHora = dataHoraFormatada(new Date());
  const carga = dados.carga || {};
  const totais = dados.totais || {};
  const ajustes = Array.isArray(dados.ajustes) ? dados.ajustes : [];
  const pedidos = Array.isArray(dados.pedidos) ? dados.pedidos : [];
  const contagemCedulas = dados.contagemCedulas || null;

  // Ajustes formatados em HTML
  let linhasAjustesHTML = "";
  if (ajustes.length > 0) {
    ajustes.forEach((aj) => {
      const sinal = aj.tipo === "adicao" || aj.tipo === "entrada" ? "(+)" : "(-)";
      const classe = aj.tipo === "adicao" || aj.tipo === "entrada" ? "ajuste-pos" : "ajuste-neg";
      linhasAjustesHTML += `
        <div class="linha-ajuste ${classe}">
          <span>${sinal} ${aj.categoria || "Ajuste"}: ${aj.descricao || "-"}</span>
          <strong>${formatarMoeda(aj.valor || 0)}</strong>
        </div>
      `;
    });
  } else {
    linhasAjustesHTML = `<div class="sem-itens">Nenhum ajuste extra lançado.</div>`;
  }

  // Pedidos com alteração ou devolução
  const pedidosAlterados = pedidos.filter(
    (p) => p.statusEntrega === "devolvido" || (p.pagamentos && p.pagamentos.length > 1) || p.formaAlterada
  );

  let linhasAlteracoesHTML = "";
  if (pedidosAlterados.length > 0) {
    pedidosAlterados.forEach((p) => {
      const clienteNome = p.cliente?.nome || p.nomeCliente || "Cliente";
      if (p.statusEntrega === "devolvido") {
        linhasAlteracoesHTML += `
          <div class="linha-alteracao">
            <span>Ped #${p.id} - ${clienteNome}</span>
            <strong style="color:#000;">[ DEVOLVIDO / CANCEL ]</strong>
          </div>
        `;
      } else if (p.pagamentos && p.pagamentos.length > 0) {
        const detalhePagamentos = p.pagamentos
          .map((pg) => `${pg.formaNome || pg.nome}: ${formatarMoeda(pg.valor)}`)
          .join(" | ");
        linhasAlteracoesHTML += `
          <div class="linha-alteracao">
            <span>Ped #${p.id} - ${clienteNome}</span>
            <span>${detalhePagamentos}</span>
          </div>
        `;
      }
    });
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
    if (Number(c.moedas) > 0) linhasNotasHTML += `<div class="resumo-linha"><span>Moedas:</span> <span>${formatarMoeda(c.moedas)}</span></div>`;

    cedulasHTML = `
      <hr class="divider-dashed">
      <div class="secao-titulo">CONTAGEM FÍSICA DE CÉDULAS</div>
      ${linhasNotasHTML}
      <div class="resumo-linha" style="font-weight:bold; border-top: 1px dashed #000; padding-top: 1mm; margin-top: 1mm;">
        <span>Total de Notas Contadas:</span>
        <strong>${formatarMoeda(contagemCedulas.totalContado)}</strong>
      </div>
      <div class="resumo-linha">
        <span>Diferença (Sobra / Falta):</span>
        <strong>${formatarMoeda(contagemCedulas.diferenca || 0)}</strong>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fechamento de Carga #${carga.id || ""}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Courier New', Courier, monospace;
      background: #f0f0f0;
      font-size: 11px;
      color: #000;
      padding: 4mm;
    }

    #container {
      width: 72mm;
      margin: 0 auto;
      background: white;
      padding: 3mm 3mm 1mm 3mm;
    }

    /* ── CABEÇALHO ── */
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
      font-size: 13px;
      font-weight: 900;
      text-align: center;
      letter-spacing: 0.8px;
      margin: 2mm 0 1mm;
      padding: 1.5mm 0;
      border-top: 1.5px solid #000;
      border-bottom: 1.5px solid #000;
      text-transform: uppercase;
    }

    .data-emissao {
      font-size: 10px;
      text-align: center;
      margin-bottom: 2mm;
    }

    .divider-solid {
      border: none;
      border-bottom: 1.5px solid #000;
      margin: 2mm 0;
    }

    .divider-dashed {
      border: none;
      border-bottom: 1px dashed #000;
      margin: 2mm 0;
    }

    /* ── DADOS DO TRANSPORTE ── */
    .secao-transporte {
      margin-bottom: 2mm;
      font-size: 11px;
      line-height: 1.4;
    }

    .secao-transporte div {
      margin-bottom: 0.5mm;
    }

    /* ── TÍTULOS DE SEÇÃO ── */
    .secao-titulo {
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      margin: 2mm 0 1mm;
      border-bottom: 1px solid #000;
      padding-bottom: 0.5mm;
    }

    /* ── LINHAS DE RESUMO ── */
    .resumo-linha {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1mm;
      font-size: 11px;
      line-height: 1.3;
    }

    .resumo-linha strong {
      font-weight: bold;
    }

    .resumo-linha-destaque {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 900;
      padding: 1.5mm 0;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      margin: 1.5mm 0;
    }

    .resumo-total-geral {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 900;
      padding: 1.5mm 0;
      border-top: 1.5px solid #000;
      border-bottom: 1.5px solid #000;
      margin-top: 2mm;
    }

    /* ── AJUSTES & ALTERAÇÕES ── */
    .linha-ajuste, .linha-alteracao {
      display: flex;
      justify-content: space-between;
      gap: 2mm;
      font-size: 10px;
      padding: 1mm 0;
      border-bottom: 1px dashed #ccc;
      line-height: 1.2;
    }

    .sem-itens {
      font-size: 10px;
      color: #555;
      font-style: italic;
      padding: 1mm 0;
    }

    /* ── ASSINATURAS ── */
    .assinatura-bloco {
      margin-top: 6mm;
      page-break-inside: avoid;
    }

    .linha-assinatura {
      border-top: 1px solid #000;
      margin: 8mm auto 1mm auto;
      width: 90%;
    }

    .assinatura-texto {
      font-size: 10px;
      font-weight: bold;
      text-align: center;
    }

    /* ── BOTÃO PREVIEW ── */
    #button {
      margin-top: 5mm;
    }

    #button button {
      width: 100%;
      padding: 10px;
      font-size: 13px;
      font-weight: bold;
      background: #000;
      border: none;
      color: white;
      cursor: pointer;
      font-family: 'Courier New', monospace;
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
        background: white;
      }

      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        padding: 0;
      }

      #container {
        width: 72mm;
        margin: 0 auto;
        padding: 2mm 2mm 0 2mm;
      }

      #button { display: none; }
    }
  </style>
</head>

<body>
  <div id="container">

    <!-- CABEÇALHO -->
    <div class="header">
      <div class="empresa">AMIGAO DISTRIBUIDORA DE BEBIDAS LTDA</div>
      <div class="info">CNPJ: 41.836.758/0001-41 | Canoinhas - SC</div>
    </div>

    <div class="titulo-fechamento">
      PRESTAÇÃO DE CONTAS / FECHAMENTO
    </div>
    <div class="data-emissao">CARGA #${carga.id || ""} | FECHAMENTO: ${dataHora}</div>

    <hr class="divider-solid">

    <!-- DADOS DO TRANSPORTE -->
    <div class="secao-transporte">
      <div><strong>MOTORISTA:</strong> ${carga.motorista?.nome || `Motorista #${carga.motoristaId || "-"}`}</div>
      <div><strong>VEÍCULO:</strong> ${carga.veiculo?.nome || "Veículo"} (${carga.veiculo?.placa || "-"})</div>
      <div><strong>DESTINO:</strong> ${carga.destino || "Não especificado"}</div>
      <div><strong>QTD DE PEDIDOS:</strong> ${pedidos.length} pedidos</div>
    </div>

    <hr class="divider-solid">

    <!-- RESUMO POR FORMA DE PAGAMENTO -->
    <div class="secao-titulo">CONFERÊNCIA POR FORMA DE PGTO</div>

    <div class="resumo-linha">
      <span>Dinheiro (Pedidos):</span>
      <span>${formatarMoeda(totais.dinheiroPedidos || 0)}</span>
    </div>
    <div class="resumo-linha">
      <span>Ajustes Dinheiro (+ / -):</span>
      <span>${formatarMoeda(totais.ajustesDinheiro || 0)}</span>
    </div>
    <div class="resumo-linha-destaque">
      <span>(=) DINHEIRO A ENTREGAR:</span>
      <span>${formatarMoeda(totais.dinheiroFinal || 0)}</span>
    </div>

    <div class="resumo-linha">
      <span>PIX Conferido:</span>
      <strong>${formatarMoeda(totais.pixFinal != null ? totais.pixFinal : (totais.pix || 0))}</strong>
    </div>
    <div class="resumo-linha">
      <span>Cartão Crédito / Débito:</span>
      <strong>${formatarMoeda(totais.cartaoFinal != null ? totais.cartaoFinal : (totais.cartao || 0))}</strong>
    </div>
    <div class="resumo-linha">
      <span>Cheque a Receber:</span>
      <strong>${formatarMoeda(totais.chequeFinal != null ? totais.chequeFinal : (totais.cheque || 0))}</strong>
    </div>
    <div class="resumo-linha">
      <span>Vales / Pendências:</span>
      <strong>${formatarMoeda(totais.valeFinal != null ? totais.valeFinal : (totais.vale || 0))}</strong>
    </div>

    <div class="resumo-total-geral">
      <span>TOTAL GERAL DA CARGA:</span>
      <span>${formatarMoeda(totais.totalGeral || 0)}</span>
    </div>

    ${
      ajustes.length > 0
        ? `
      <hr class="divider-dashed">
      <div class="secao-titulo">LANÇAMENTOS & AJUSTES DA ROTA</div>
      ${linhasAjustesHTML}
    `
        : ""
    }

    ${
      pedidosAlterados.length > 0
        ? `
      <hr class="divider-dashed">
      <div class="secao-titulo">ALTERAÇÕES / DEVOLUÇÕES</div>
      ${linhasAlteracoesHTML}
    `
        : ""
    }

    ${cedulasHTML}

    <!-- ASSINATURAS -->
    <div class="assinatura-bloco">
      <div class="linha-assinatura"></div>
      <div class="assinatura-texto">${carga.motorista?.nome || "Motorista"} (Motorista)</div>

      <div class="linha-assinatura"></div>
      <div class="assinatura-texto">Conferente / Responsável pelo Caixa</div>
    </div>

    <!-- BOTÃO IMPRIMIR NA TELA -->
    <div id="button">
      <button onclick="window.print()">🖨️ IMPRIMIR COMPROVANTE</button>
    </div>

  </div>
</body>
</html>
  `;
}

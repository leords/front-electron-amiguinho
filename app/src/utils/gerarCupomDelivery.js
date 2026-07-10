import { dataHoraFormatada } from "./data.js";
import { formatarMoeda } from "./formartarMoeda.js";

export function gerarCupomDelivery(dados) {
  const dataHora =
    dados.tipo === "segundaVia"
      ? dataHoraFormatada(dados.data)
      : dataHoraFormatada();

  let totalGeral = 0;
  dados.itens.forEach((item) => {
    totalGeral += item.quantidade * item.valorUnit;
  });

  const valorTotalFormatado = formatarMoeda(totalGeral);

  let itensHTML = "";
  dados.itens.forEach((item) => {
    const valorTotal = item.quantidade * item.valorUnit;
    itensHTML += `
      <div class="item">
        <p>${item.quantidade}</p>
        <p>${item.nome}</p>
        <p>${formatarMoeda(Number(item.valorUnit))}</p>
        <p>${formatarMoeda(valorTotal)}</p>
      </div>
    `;
  });

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nota Delivery</title>
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
      padding: 3mm 3mm 0 3mm;
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
      line-height: 1.4;
    }

    .header .info {
      font-size: 10px;
      line-height: 1.4;
    }

    .data {
      font-size: 12px;
      font-weight: bold;
      line-height: 1.4;
      margin-top: 4mm;
    }
    .info {
      font-size: 12px;
      font-weight: bold;
      line-height: 1.4;
    }
    .ref {
      font-size: 12px;
      font-weight: bold;
      line-height: 1.4;
      margin-bottom: 4mm;
    }

    /* ── TÍTULOS ── */
    .cupom-titulo {
      font-size: 14px;
      text-align: center;
      font-weight: bold;
      letter-spacing: 1px;
      margin: 3mm 0 1mm 0;
    }

    .motivo {
      font-size: 11px;
      text-align: center;
      font-weight: bold;
      margin-bottom: 2mm;
    }

    .atendente {
      font-size: 11px;
      text-align: right;
      margin-bottom: 3mm;
    }

    /* ── TEXTO PROMISSÓRIA ── */
    .texto-nota {
      font-size: 11px;
      line-height: 1.1;
      text-align: justify;
      margin-bottom: 3mm;
    }

    /* ── SEPARADORES ── */
    .divider {
      border: none;
      border-bottom: 1px dashed #000;
      margin: 2mm 0;
    }

    .divider-solid {
      border: none;
      border-bottom: 1px solid #000;
      margin: 2mm 0;
    }

    /* ── TABELA DE ITENS ── */
    .itens-header {
      display: grid;
      grid-template-columns: 10% 45% 20% 25%;
      font-size: 11px;
      font-weight: bold;
      padding: 1mm 0;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      margin-bottom: 1mm;
    }

    .itens-header p:nth-child(1) { text-align: left; }
    .itens-header p:nth-child(2) { text-align: left; padding-left: 1mm; }
    .itens-header p:nth-child(3) { text-align: right; padding-right: 1mm; }
    .itens-header p:nth-child(4) { text-align: right; }

    .item {
      display: grid;
      grid-template-columns: 10% 45% 20% 25%;
      font-size: 11px;
      font-weight: bold;
      line-height: 1.4;
      padding: 1.5mm 0;
      border-bottom: 1px dotted #aaa;
      page-break-inside: avoid;
    }

    .item p:nth-child(1) { text-align: left; }
    .item p:nth-child(2) { text-align: left; padding-left: 1mm; word-break: break-word; }
    .item p:nth-child(3) { text-align: right; padding-right: 1mm; }
    .item p:nth-child(4) { text-align: right; }

    /* ── TOTAL ── */
    .total-bloco {
      padding: 2mm 0 1mm 0;
      border-top: 1px solid #000;
    }

    .total-linha {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      font-weight: bold;
    }

    /* ── PAGAMENTO ── */
    .pagamento {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: bold;
      padding: 2mm 0;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      margin-top: 2mm;
    }

    /* ── RODAPÉ ── */
    .rodape {
      text-align: center;
      margin-top: 3mm;
      padding-bottom: 1mm;
    }

    .rodape img {
      max-width: 40mm;
      height: auto;
      display: block;
      margin: 0 auto 2mm auto;
      filter: grayscale(100%);
    }

    .rodape .versiculo {
      font-size: 11px;
      font-style: italic;
      line-height: 1.4;
    }

    /* ══════════════════════════════════════
       CANHOTO DE ASSINATURA (destacável)
    ══════════════════════════════════════ */
    .linha-corte {
      position: relative;
      display: flex;
      align-items: center;
      margin: 2mm 0 0 0;
      gap: 1mm;
    }

    .linha-corte::before,
    .linha-corte::after {
      content: '';
      flex: 1;
      border-top: 1.5px dashed #000;
    }

    .linha-corte .tesoura {
      font-size: 13px;
      line-height: 1;
      flex-shrink: 0;
    }

    .canhoto {
      border: 1.5px dashed #000;
      padding: 3mm;
      margin-bottom: 3mm;
    }

    .canhoto .canhoto-titulo {
      font-size: 12px;
      font-weight: bold;
      text-align: center;
      letter-spacing: 0.5px;
      margin-bottom: 2mm;
      text-transform: uppercase;
    }

    .canhoto .canhoto-info {
      font-size: 11px;
      line-height: 1.6;
      margin-bottom: 2mm;
    }

    .canhoto .canhoto-info span {
      font-weight: bold;
    }

    .canhoto .assinatura-linha {
      margin-top: 10mm;
      border-top: 1px solid #000;
      padding-top: 1mm;
      font-size: 12px;
      text-align: center;
    }

    /* ── BOTÃO (só na tela) ── */
    #button {
      margin-top: 5mm;
    }

    #button button {
      width: 100%;
      padding: 10px;
      font-size: 14px;
      font-weight: bold;
      background: #000;
      border: none;
      color: white;
      cursor: pointer;
      font-family: 'Courier New', monospace;
    }

    /* ── IMPRESSÃO ── */
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

      .item { page-break-inside: avoid; }
    }
  </style>
</head>

<body>
  <div id="container">

    <!-- CABEÇALHO -->
    <div class="header">
      <div class="empresa">AMIGAO DISTRIBUIDORA DE BEBIDAS LTDA</div>
      <div class="info">CNPJ: 41.836.758/0001-41</div>
      <div class="info">Canoinhas - SC</div>
    </div>

    <hr class="divider">

    ${
      dados.tipo === "segundaVia"
        ? `<div class="cupom-titulo">SEGUNDA VIA NOTA</div>
           <div class="motivo">${dados.motivo}</div>`
        : `<div class="cupom-titulo">NOTA DELIVERY AMIGÃO</div>`
    }

    <div class="atendente">Atendente: <strong>${dados.nomeUsuario}</strong></div>

    <hr class="divider">

    <div class="data">DATA: ${dataHora}</div>
    <div class="info">CLIENTE: ${dados.cliente}</div>
    <div class="info">ENDERECO: ${dados.endereco}</div>
    <div class="info">CIDADE: ${dados.cidade} | TELEFONE: ${dados.telefone}</div>
    <div class="ref">REFERENCIA: ${dados.referencia}</div>

    <hr class="divider">

    <!-- TEXTO PROMISSÓRIA -->
    <p class="texto-nota">
      Paguei por esta única via de nota a Amigão Distribuidora de Bebidas LTDA, CNPJ 41.836.758/0001-41,
      ou a sua ordem, a quantia de <strong>${valorTotalFormatado}</strong> em moeda
      corrente deste país, pagável em Canoinhas&nbsp;-&nbsp;SC.
    </p>

    <hr class="divider">

    <!-- ITENS -->
    <div class="itens-header">
      <p>Qtd</p>
      <p>Descrição</p>
      <p>Preço</p>
      <p>Valor</p>
    </div>

    <div id="divItens">
      ${itensHTML}
    </div>

    <!-- TOTAL -->
    <div class="total-bloco">
      <div class="total-linha">
        <span>TOTAL</span>
        <span>${valorTotalFormatado}</span>
      </div>
    </div>

    <!-- PAGAMENTO -->
    <div class="pagamento">
      <span>Forma de pagamento</span>
      <span>${dados.formaPagamento}</span>
    </div>

    <!-- RODAPÉ -->
    <div class="rodape">
      <img
        src="https://lh3.googleusercontent.com/d/1nfGIn89pprzBhNaGtjDVH-mB8S38FZHG"
        alt="Amigão Distribuidora"
      >
      
    </div>

    <!-- ══ LINHA DE CORTE ══ -->
    <div class="linha-corte">
      <span class="tesoura">✂</span>
    </div>

    <!-- CANHOTO DESTACÁVEL -->
    <div class="canhoto">
      <div class="canhoto-titulo">— Recibo do Cliente —</div>
      <div class="canhoto-info">
        <div>Cliente: <span>${dados.cliente}</span></div>
        <div>Data: <span>${dataHora}</span></div>
        <div>Total: <span>${valorTotalFormatado}</span></div>
        <div>Pgto: <span>${dados.formaPagamento}</span></div>
      </div>
      <p style="font-size:12px; line-height:1.2;">
        Declaro que recebi os produtos acima relacionados em perfeito estado,
        conforme pedido realizado junto à Distribuidora de Bebidas Amigão.
      </p>
      <div class="assinatura-linha">Assinatura do cliente</div>
    </div>

    <div class="linha-corte">
      <span class="tesoura">-</span>
    </div>

    <!-- BOTÃO IMPRIMIR (só na tela) -->
    <div id="button">
      <button onclick="window.print()">🖨️ IMPRIMIR NOTA</button>
    </div>

  </div>
</body>
</html>
  `;
}
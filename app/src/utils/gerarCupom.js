import { dataHoraFormatada } from "./data.js";
import { formatarMoeda } from "./formartarMoeda.js";

export function gerarCupom(dados) {
  // Chamando a função para data conforme a solitação.
  const dataHora =
    dados.tipo === "segundaVia"
      ? dataHoraFormatada(dados.data)
      : dataHoraFormatada();


  // Calcular total da lista de produtos.
  let totalGeral = 0;
  dados.itens.forEach((item) => {
    totalGeral += item.quantidade * item.valorUnit;
  });

  // Formatando valor total.
  const valorTotalFormatado = formatarMoeda(totalGeral);

  // Gerar HTML dos itens
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

    // Gerar HTML dos pagamentos
  let pagamentosHTML = "";
  dados.pagamentos.forEach((item) => {
    
    pagamentosHTML += `
      <div class="item-pay">
        <p>${item.idFormaPagamentoParcial}</p>
        <p>${item.nomeFormaPagamentoParcial}</p>
        <p>${formatarMoeda(Number(item.valorParcialFormaPagamento))}</p>
      </div>
    `;
  });

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nota Promissória</title>
  
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Courier New', Courier, monospace;
    background: #f5f5f5;
    font-size: 11px;
    color: #000;
    padding: 2mm;
  }

  #container {
    width: 72mm;
    margin: 0 auto;
    background: white;
    padding: 2mm;
  }

  .header-line {
    text-align: center;
    font-size: 11px;
    line-height: 1.3;
    font-weight: bold;
    color: #000;
  }

  .header-line.bold {
    font-size: 12px;
  }

  .divider {
    border-bottom: 1px dashed #000;
    margin: 2mm 0;
  }

  .headerTitle {
    font-size: 15px;
    text-align: center;
    font-weight: bold;
    margin: 3mm 0 2mm 0;
    letter-spacing: 1px;
  }

  .motivo {
    font-size: 11px;
    text-align: center;
    font-weight: bold;
    margin-bottom: 3mm;
  }

  #title {
    text-align: justify;
    font-size: 12px;
    line-height: 1.3;
    margin-bottom: 3mm;
  }

  #headerDivItens {
    display: grid;
    grid-template-columns: 12% 43% 20% 25%;
    font-size: 11px;
    font-weight: bold;
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
    padding: 1mm 0;
    margin-bottom: 1mm;
    width: 100%;
  }

  #headerDivItens p:nth-child(1) {
    text-align: left;
  }

  #headerDivItens p:nth-child(2) {
    text-align: left;
    padding-left: 1mm;
  }

  #headerDivItens p:nth-child(3) {
    text-align: right;
    padding-right: 1mm;
  }

  #headerDivItens p:nth-child(4) {
    text-align: right;
  }

  #divItens {
    width: 100%;
  }

  .item {
    display: grid;
    grid-template-columns: 12% 43% 20% 25%;
    font-size: 11px;
    line-height: 1.3;
    padding: 1mm 0;
    border-bottom: 1px dotted #999;
    width: 100%;
    page-break-inside: avoid;
  }

  .item p:nth-child(1) {
    text-align: left;
    font-weight: bold;
  }

  .item p:nth-child(2) {
    text-align: left;
    padding-left: 1mm;
    word-break: break-word;
    font-weight: bold;
  }

  .item p:nth-child(3) {
    text-align: right;
    padding-right: 1mm;
    font-weight: bold;
  }

  .item p:nth-child(4) {
    text-align: right;
    font-weight: bold;
  }

  .totals-section {
    margin-top: 3mm;
    padding-top: 2mm;
    border-top: 1px solid #000;
  }

  .total-line.final {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    font-weight: bold;
  }

  #infoPay {
    display: flex;
    justify-content: space-between;
    margin-top: 3mm;
    padding: 2mm 0;
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
    font-size: 11px;
    font-weight: bold;
    gap: 3mm;
  }

  #infoPay p:last-child {
    text-align: right;
  }

  #inforFormPay {
    margin-top: 3mm;
    padding: 2mm 0;
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
    font-size: 11px;
    font-weight: bold;
  }

  #inforFormPay .headerPagamentos {
    display: grid;
    grid-template-columns: 20% 45% 35%;
    font-size: 11px;
    font-weight: bold;
    border-bottom: 1px solid #000;
    padding-bottom: 1mm;
    margin-bottom: 1mm;
  }

  #inforFormPay .headerPagamentos p:nth-child(1) {
    text-align: left;
  }

  #inforFormPay .headerPagamentos p:nth-child(2) {
    text-align: left;
    padding-left: 1mm;
  }

  #inforFormPay .headerPagamentos p:nth-child(3) {
    text-align: right;
  }

  #inforFormPay .item-pay {
    display: grid;
    grid-template-columns: 20% 45% 35%;
    font-size: 11px;
    line-height: 1.3;
    padding: 0.5mm 0;
    page-break-inside: avoid;
  }

  #inforFormPay .item-pay p:nth-child(1) {
    text-align: left;
  }

  #inforFormPay .item-pay p:nth-child(2) {
    text-align: left;
    padding-left: 1mm;
    word-break: break-word;
  }

  #inforFormPay .item-pay p:nth-child(3) {
    text-align: right;
  }

  #footer {
    margin-top: 4mm;
    text-align: center;
  }

  #div-logo img {
    max-width: 45mm;
    height: auto;
    display: block;
    margin: 0 auto;
    filter: grayscale(100%);
  }

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

  @media print {

    @page {
      size: 80mm auto;
      margin: 0;
    }

    html,
    body {
      width: 80mm;
      margin: 0;
      padding: 0;
      background: white;
    }

    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    #container {
      width: 72mm;
      margin: 0 auto;
      padding: 2mm;
      border: none;
    }

    #button {
      display: none;
    }

    .item,
    .item-pay {
      page-break-inside: avoid;
    }
  }
</style>
</head>

<body>
  <div id="container">
    <div class="header-line bold">AMIGAO DISTRIBUIDORA DE BEBIDAS LTDA</div>
    <div class="header-line">CNPJ: 41.836.758/0001-41</div>
    <div class="header-line">Canoinhas - SC</div>
    
    <div class="divider"></div>
    
    
    ${
      dados.tipo === "segundaVia"
        ? `<h4 class="headerTitle">SEGUNDA VIA NOTA </h4>
          <p class="motivo">${dados.motivo}</p>
        `
        : `<h4 class="headerTitle">NOTA PROMISSORIA</h4>`
    }
    
    <div class="header-line" style="text-align: right; font-size: 12px; font-weight: bold; margin-bottom: 10px; color: #000;">
      ${`${dados.vendedor}: ${dados.nomeUsuario}`}
    </div>

    ${
      dados.cliente
        ? `
      <p id="title">
      Na data de ${dataHora} eu, ${dados.cliente} paguei por esta unica via de nota a Amigao Distribuidora de Bebidas LTDA,
      CNPJ 41.836.758/0001-41, ou a sua ordem, a quantia de ${valorTotalFormatado} em moeda corrente deste pais,
      pagavel em Canoinhas - SC.
    </p>`
        : `<p id="title">
      Na data de ${dataHora} paguei por esta unica via de nota a Amigao Distribuidora de Bebidas LTDA,
      CNPJ 41.836.758/0001-41, ou a sua ordem, a quantia de ${valorTotalFormatado} em moeda corrente deste pais,
      pagavel em Canoinhas - SC.
    </p>`
    }

    <div class="divider"></div>

    <div id="headerDivItens">
      <p>Qtd</p>
      <p>Descrição</p>
      <p>Preço</p>
      <p>Valor</p>
    </div>

    <div id="divItens">
      ${itensHTML}
    </div>

    <div class="divider"></div>

    <div class="totals-section">
      <div class="total-line final">
        <span>TOTAL(=)</span>
        <span>${valorTotalFormatado}</span>
      </div>
    </div>

    <div id="inforFormPay">
      <div class="headerPagamentos">
        <p>Cód</p>
        <p>Forma de pagamento</p>
        <p>Valor</p>
      </div>
      ${pagamentosHTML}
    </div>

    <div class="divider"></div>

    <div id="footer">
      <div id="div-logo">
        <img 
          src="https://lh3.googleusercontent.com/d/1JAfTMDVupxRlmNubCr4ZzP0h9WVBfBUH"
          alt="Amigao Distribuidora"
        >
      </div>
    </div>

    <div class="divider" style="margin-top: 10px;"></div>
  </div>
</body>
</html>
  `;
}
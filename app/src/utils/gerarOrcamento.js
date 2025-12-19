import { dataFormatada, dataHoraFormatada } from "./data.js";

export function gerarOrcamento(dados) {
  // Chamando a função para data conforme a solitação.
  const dataHora =
    dados.tipo === "segundaVia"
      ? dataHoraFormatada(dados.data)
      : dataHoraFormatada();

  // Função para formatar valor em Real.
  function formatarValor(valor) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  // Calcular total da lista de produtos.
  let totalGeral = 0;
  dados.itens.forEach((item) => {
    totalGeral += item.quantidade * item.valorUnit;
  });

  // Formatando valor total.
  const valorTotalFormatado = formatarValor(totalGeral);

  // Gerar HTML dos itens
  let itensHTML = "";
  dados.itens.forEach((item) => {
    const valorTotal = item.quantidade * item.valorUnit;

    itensHTML += `
      <div class="item">
        <p>${item.quantidade}</p>
        <p>${item.nome}</p>
        <p>${formatarValor(Number(item.valorUnit))}</p>
        <p>${formatarValor(valorTotal)}</p>
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
      padding: 10px;
      font-size: 14px;
      color: #000;
    }

    #container {
      width: 300px;
      margin: 0 auto;
      background: white;
      border: 2px solid #000;
    }

    .header-line {
      text-align: center;
      font-size: 12px;
      line-height: 1.4;
      margin-bottom: 3px;
      font-weight: bold;
      color: #000;
    }

    .header-line.bold {
      font-weight: bold;
      font-size: 13px;
    }

    .divider {
      border-bottom: 2px solid #000;
      margin: 10px 0;
    }

    .headerTitle {
      font-size: 16px;
      text-align: center;
      font-weight: bold;
      padding: 10px 0;
      letter-spacing: 2px;
      margin: 10px 0;
      color: #000;
    }

    .motivo {
      font-size: 14px;
      text-align: center;
      font-weight: bold;
      padding: 10px 0;
      letter-spacing: 2px;
      margin: 10px 0;
      color: #000;
    }

    #title {
      text-align: justify;
      font-size: 12px;
      line-height: 1.1;
      margin-bottom: 12px;
      color: #000;
      font-weight: 500;
    }

    .section-title {
      font-size: 13px;
      font-weight: bold;
      margin: 12px 0 6px 0;
      text-align: center;
      color: #000;
    }

    #headerDivItens { 
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 12px;
      font-weight: bold;
      border-bottom: 2px solid #000;
      border-top: 2px solid #000;
      margin-bottom: 6px;
      color: #000;
    }

    #headerDivItens p:nth-child(1) { width: 20%; text-align: start; }
    #headerDivItens p:nth-child(2) { width: 60%; text-align: left; padding-left: 10px }
    #headerDivItens p:nth-child(3) { width: 15%; text-align: left; padding-right: 10px}
    #headerDivItens p:nth-child(4) { width: 15%; text-align: right; }

    #divItens {
      background: white;
      min-height: 150px;
    }

    .item {
      display: flex;
      justify-content: center;
      font-size: 12px;
      line-height: 1.4;
      color: #000;
      background-color: #d2d2d2;
      margin-bottom: 2px;
    }

    .item p:nth-child(1) {
      width: 8%;
      text-align: start;
      font-weight: bold;
      color: #000;
    }

    .item p:nth-child(2) {
      width: 42%;
      text-align: left;
      font-weight: bold;
      font-size: 11px;
      color: #000;
    }

    .item p:nth-child(3) {
      width: 23%;
      text-align: left;
      font-size: 10px;
      font-weight: bold;
      color: #000;
    }
    
    .item p:nth-child(4) {
      width: 27%;
      text-align: right;
      font-size: 11px;
      font-weight: bold;
      color: #000;
    }

    .totals-section {
      margin-top: 12px;
      padding-top: 10px;
      border-top: 2px solid #000;
      font-size: 12px;
      color: #000;
    }

    .total-line {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      font-weight: bold;
      color: #000;
    }

    .total-line.final {
      font-weight: bold;
      font-size: 14px;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 2px solid #000;
      color: #000;
    }

    #infoPay {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      margin-top: 10px;
      font-size: 13px;
      font-weight: bold;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      color: #000;
    }

    #infoPay p:first-child {
      font-weight: bold;
      color: #000;
    }

    #infoPay p:last-child {
      font-weight: bold;
      font-size: 14px;
      color: #000;
    }

    #footer {
      margin-top: 15px;
      padding-top: 12px;
      text-align: center;
      border-top: 2px solid #000;
    }

    #div-logo img {
      max-width: 180px;
      height: auto;
      display: block;
      margin: 0 auto 8px auto;
      filter: grayscale(100%) contrast(1.2);
    }

    #button {
      margin-top: 15px;
    }

    #button button {
      width: 100%;
      padding: 12px;
      font-size: 16px;
      font-weight: bold;
      background: #000;
      border: 2px solid #000;
      color: white;
      cursor: pointer;
      font-family: 'Courier New', monospace;
    }

    #button button:hover {
      background: #333;
    }

    @media print {
      body {
        background: white;
        padding: 0;
        margin: 0;
      }

      #container {
        width: 280px;
        margin: 0;
        padding: 10px;
        border: none;
      }

      #button {
        display: none;
      }

      .item {
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
    
    

    <h4 class="headerTitle">NOTA DE ORÇAMENTO</h4>
    <p class="motivo">APENAS PARA USO INFORMATIVO!!</p>
    
    
    <div class="header-line" style="text-align: right; font-size: 12px; font-weight: bold; margin-bottom: 10px; color: #000;">
      ${`${dados.vendedor}: ${dados.nomeUsuario}`}
    </div>

    <p id="title">
        Orçamento emitido em ${dataHora} pela Amigão Distribuidora de Bebidas LTDA,
        CNPJ 41.836.758/0001-41, no valor total de ${valorTotalFormatado},
        referente aos produtos descritos, sem valor fiscal ou comprovação de pagamento.
    </p>

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

    <div id="infoPay">
      <p>Forma de pagamento</p>
      <p>${dados.formaPagamento}</p>
    </div>

    <div id="footer">
      <div id="div-logo">
        <img 
          src="https://lh3.googleusercontent.com/d/1AgCeS49Thw9b7Qc7m9yzqFhl09HfbATD"
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

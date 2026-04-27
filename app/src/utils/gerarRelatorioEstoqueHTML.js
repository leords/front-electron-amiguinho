import { formatarMoeda } from "./formartarMoeda";

export function gerarRelatorioEstoqueHTML(relatorio) {
  let itensHTML = "";

  relatorio.itens.forEach((item) => {
    itensHTML += `
      <div class="item">
        <p>${item.quantidade}</p>
        <p>${item.produto || "-"}</p>
        <p>${formatarMoeda(item.valorUnit)}</p>
        <p>${formatarMoeda(item.valorTotal)}</p>
      </div>
    `;
  });

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Descarga</title>

      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: #000;
          width: 280px;
        }

        #container {
          width: 100%;
          padding: 8px;
        }

        .title {
          text-align: center;
          font-weight: bold;
          font-size: 15px;
          margin-bottom: 20px;
          letter-spacing: 1px;
        }

        .info {
          font-size: 13px;
          margin-bottom: 4px;
          display: flex;
          justify-content: start;
          gap: 6px;
          font-weight: bold;
        }

        .divider {
          border-bottom: 1px dashed #000;
          margin: 8px 0;
        }

        #header {
          display: flex;
          font-weight: bold;
          font-size: 12px;
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          padding: 4px 0;
        }

        /* Ajuste fino de colunas */
        #header p:nth-child(1) { width: 15%; }
        #header p:nth-child(2) { width: 40%; }
        #header p:nth-child(3) { width: 20%; text-align: left; }
        #header p:nth-child(4) { width: 20%; text-align: left; }

        .item {
          display: flex;
          font-size: 12px;
          font-weight: bold;
          padding: 2px 0;
          border-bottom: 1px dashed #000;
          page-break-inside: avoid;
          flex-wrap: wrap;
        }

        .item p:nth-child(1) { width: 10%; }
        .item p:nth-child(2) { width: 60%; }
        .item p:nth-child(3) { width: 22%; text-align: left; }
        .item p:nth-child(4) { width: 22%; text-align: left; }

        .total {
          margin-top: 12px;
          border-top: 1px solid #000;
          padding-top: 6px;
          font-weight: bold;
          display: flex;
          justify-content: center;
          font-size: 13px;
          gap: 6px
        }

        .rodape {
          margin-top: 12px;
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          padding-top: 6px;
          padding-bottom: 6px;
          font-weight: bold;
          display: flex;
          justify-content: center;
          font-size: 13px;
        }

        .assinatura {
          margin-top: 20px;
          gap: 20px;
          padding-top: 6px;
          padding-bottom: 6px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          flex-direction: column
        }

        /* ESSENCIAL PRA TÉRMICA */
        @page {
          margin: 0;
          size: 80mm auto;
        }

        @media print {
          body {
            width: 80mm;
          }

          #container {
            width: 100%;
            padding: 6px;
          }
        }
      </style>
    </head>

    <body>
      <div id="container">

        <img 
          src="https://res.cloudinary.com/dzbvrbszn/image/upload/e_grayscale,e_contrast:100,e_sharpen:100/q_auto/f_auto/v1777054899/logo-relatorio-estoque_qfbjjc.png"
          style="width: 120px; display: block; margin: 0 auto;"
        />
        
        <div class="title">RELATÓRIO DE ENTRADA</div>

        <div class="info"><span>Fornecedor:</span><span>${relatorio.fornecedor}</span></div>
        <div class="info"><span>Data:</span><span>${relatorio.data}</span></div>
        <div class="info"><span>Abertura:</span><span>${relatorio.dataAbertura}</span></div>
        <div class="info"><span>Código:</span><span>${relatorio.codigo}</span></div>
        <div class="info"><span>Itens:</span><span>${relatorio.quantidade}</span></div>

        <div class="divider"></div>

        <div id="header">
          <p>Qtd</p>
          <p>Produto</p>
          <p>Unit</p>
          <p>Total</p>
        </div>

        <div id="itens">
          ${itensHTML}
        </div>

        <div class="total">
          <span>TOTAL: </span>
          <span>${formatarMoeda(relatorio.total)}</span>
        </div>

        <div class="assinatura">
          <span>RECEBEDOR:</span>
          <span>______________________</span>
        </div>

        <div class="rodape">
          <span>DISTRIBUIDORA DE BEBIDAS AMIGÃO</span>
        </div>

      </div>
    </body>
    </html>
  `;
}
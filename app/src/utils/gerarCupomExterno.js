import { dataHoraFormatada, dataFormatada } from "./data.js";
import { formatarMoeda } from "./formartarMoeda.js";

/**
 * Gera o template HTML do Cupom Térmico (72mm/80mm) para Pedidos de Venda Externa.
 * 
 * Ordem dos Blocos:
 * 1. Cabeçalho da Empresa & Vendedor
 * 2. Dados do Cliente
 * 3. Cupom de Produtos (tabela sem sobreposição de texto)
 * 4. Total a Pagar do Pedido
 * 5. Forma de Pagamento
 * 6. Texto Promissória / Declaração
 * 7. Divisória
 * 8. Card de Pendências Anteriores do Cliente (se houver)
 * 9. Rodapé da Empresa
 * 10. Canhoto Destacável do Cliente (apenas Total do Pedido, sem pendências)
 * 
 * @param {Object} dados
 * @param {string} dados.tipo - "viaNormal" | "segundaVia"
 * @param {string} [dados.motivo] - Motivo caso seja 2ª via
 * @param {Date|string} dados.data - Data do pedido
 * @param {string} dados.cliente - Nome do cliente
 * @param {string} [dados.endereco] - Endereço do cliente
 * @param {string} [dados.cidade] - Cidade do cliente
 * @param {string} [dados.telefone] - Telefone do cliente
 * @param {string} [dados.referencia] - Ponto de referência
 * @param {string} [dados.nomeUsuario] - Nome do vendedor / operador
 * @param {string|Object} dados.formaPagamento - Forma de pagamento do pedido
 * @param {Array} dados.itens - Itens do pedido ({ quantidade, nome, valorUnit })
 * @param {Array} [dados.pendencias] - Lista de pendências em aberto do cliente ({ id, data, valor, valorPago, saldoDevedor })
 * @param {number} [dados.totalPendencia] - Total consolidado de débitos pendentes
 */
export function gerarCupomExterno(dados) {
  const dataHora =
    dados.tipo === "segundaVia"
      ? dataHoraFormatada(dados.data)
      : dataHoraFormatada(dados.data || new Date());

  // 1. Itens do pedido com layout que evita sobreposição de texto em nomes longos
  let totalPedido = 0;
  let itensHTML = "";
  (dados.itens || []).forEach((item, index) => {
    const qtd = Number(item.quantidade || 1);
    const vUnit = Number(item.valorUnit || item.precoVenda || 0);
    const subtotal = qtd * vUnit;
    totalPedido += subtotal;

    itensHTML += `
      <div class="item">
        <div class="item-linha-nome">
          <span class="item-index">${index + 1}.</span>
          <span class="item-nome">${item.nome || item.descricao || "Produto"}</span>
        </div>
        <div class="item-linha-valores">
          <span class="item-calculo">${qtd} UN &times; ${formatarMoeda(vUnit)}</span>
          <span class="item-subtotal">${formatarMoeda(subtotal)}</span>
        </div>
      </div>
    `;
  });

  const totalPedidoFormatado = formatarMoeda(totalPedido);

  // 2. Filtro e cálculo das pendências em aberto do cliente
  const pendenciasAtivas = (dados.pendencias || []).filter((p) => {
    const s = String(p.status || "").toLowerCase();
    if (s === "fechada" || s === "cancelada") return false;
    const saldo = Number(
      p.saldoDevedor !== undefined
        ? p.saldoDevedor
        : Number(p.valor || 0) - Number(p.valorPago || 0)
    );
    return saldo > 0;
  });

  const totalPendenciasValor =
    dados.totalPendencia !== undefined && Number(dados.totalPendencia) > 0
      ? Number(dados.totalPendencia)
      : pendenciasAtivas.reduce((acc, p) => {
          const saldo = Number(
            p.saldoDevedor !== undefined
              ? p.saldoDevedor
              : Number(p.valor || 0) - Number(p.valorPago || 0)
          );
          return acc + saldo;
        }, 0);

  const temPendencias = totalPendenciasValor > 0;
  const totalPendenciasFormatado = formatarMoeda(totalPendenciasValor);

  // 3. Montagem da lista detalhada de pendências por data
  let linhasPendenciasHTML = "";
  if (pendenciasAtivas.length > 0) {
    linhasPendenciasHTML = pendenciasAtivas
      .map((p, idx) => {
        const dt = dataFormatada(p.data || p.criadoEm || p.createdAt || new Date());
        const doc = p.pedidoId
          ? `Ped #${p.pedidoId}`
          : `Vale #${p.id || idx + 1}`;
        const saldo = Number(
          p.saldoDevedor !== undefined
            ? p.saldoDevedor
            : Number(p.valor || 0) - Number(p.valorPago || 0)
        );
        return `
          <div class="pendencia-linha">
            <span class="pend-col-data">${dt}</span>
            <span class="pend-col-doc">${doc}</span>
            <span class="pend-col-valor">${formatarMoeda(saldo)}</span>
          </div>
        `;
      })
      .join("");
  } else if (temPendencias) {
    linhasPendenciasHTML = `
      <div class="pendencia-linha">
        <span class="pend-col-data">Anterior</span>
        <span class="pend-col-doc">Saldo em aberto</span>
        <span class="pend-col-valor">${totalPendenciasFormatado}</span>
      </div>
    `;
  }

  const nomeFormaPagamento =
    typeof dados.formaPagamento === "object"
      ? dados.formaPagamento?.nome || "A VISTA"
      : dados.formaPagamento || "A VISTA";

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nota Vendas Externas</title>
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

    .cupom-titulo {
      font-size: 13px;
      text-align: center;
      font-weight: bold;
      letter-spacing: 0.5px;
      margin: 2mm 0 1mm 0;
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
      margin-bottom: 2mm;
    }

    /* ── DADOS DO CLIENTE ── */
    .dados-cliente {
      font-size: 11px;
      line-height: 1.4;
    }

    .dados-cliente .data {
      font-size: 12px;
      font-weight: bold;
      margin-top: 1mm;
    }

    .dados-cliente .linha-cliente {
      font-size: 11px;
      font-weight: bold;
      word-break: break-word;
    }

    .dados-cliente .ref {
      font-size: 11px;
      margin-bottom: 2mm;
    }

    /* ── SEPARADORES ── */
    .divider {
      border: none;
      border-bottom: 1px dashed #000;
      margin: 2mm 0;
    }

    .divider-solid {
      border: none;
      border-bottom: 1.5px solid #000;
      margin: 2.5mm 0;
    }

    /* ── TABELA DE ITENS (Anti-sobreposição de texto) ── */
    .itens-header {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-weight: bold;
      padding: 1.5mm 0;
      border-top: 1.5px solid #000;
      border-bottom: 1.5px solid #000;
      margin-bottom: 1mm;
      text-transform: uppercase;
    }

    .item {
      padding: 1.5mm 0;
      border-bottom: 1px dotted #aaa;
      page-break-inside: avoid;
    }

    .item-linha-nome {
      display: flex;
      align-items: flex-start;
      gap: 1mm;
      font-size: 11px;
      font-weight: bold;
      line-height: 1.3;
      word-break: break-word;
    }

    .item-index {
      flex-shrink: 0;
    }

    .item-nome {
      flex: 1;
    }

    .item-linha-valores {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10.5px;
      font-weight: bold;
      margin-top: 0.5mm;
      padding-left: 3.5mm;
    }

    .item-calculo {
      color: #222;
    }

    .item-subtotal {
      font-size: 11px;
      text-align: right;
    }

    /* ── TOTAL DO PEDIDO ── */
    .total-bloco {
      padding: 2mm 0 1mm 0;
      border-top: 1.5px solid #000;
    }

    .total-linha {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      font-weight: bold;
      line-height: 1.4;
    }

    .total-valor {
      font-size: 14px;
    }

    /* ── FORMA DE PAGAMENTO ── */
    .pagamento {
      display: flex;
      justify-content: space-between;
      font-size: 11.5px;
      font-weight: bold;
      padding: 1.5mm 0;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      margin-top: 2mm;
      margin-bottom: 2mm;
    }

    /* ── TEXTO PROMISSÓRIA / DECLARAÇÃO ── */
    .texto-nota {
      font-size: 10.5px;
      line-height: 1.25;
      text-align: justify;
      margin: 2mm 0;
    }

    /* ══════════════════════════════════════
       BLOCO DE DÉBITOS PENDENTES ANTERIORES
    ══════════════════════════════════════ */
    .bloco-pendencias {
      border: 1.5px solid #000;
      padding: 2mm;
      margin: 3mm 0;
      background: #fff;
    }

    .pendencias-titulo {
      font-size: 11px;
      font-weight: bold;
      text-align: center;
      letter-spacing: 0.5px;
      margin-bottom: 1.5mm;
      text-transform: uppercase;
      border-bottom: 1px dashed #000;
      padding-bottom: 1mm;
    }

    .pendencias-tabela-header {
      display: grid;
      grid-template-columns: 32% 38% 30%;
      font-size: 10px;
      font-weight: bold;
      border-bottom: 1px solid #000;
      padding-bottom: 1mm;
      margin-bottom: 1mm;
    }

    .pendencias-tabela-header span:nth-child(3) {
      text-align: right;
    }

    .pendencia-linha {
      display: grid;
      grid-template-columns: 32% 38% 30%;
      font-size: 10px;
      font-weight: bold;
      line-height: 1.4;
      padding: 1mm 0;
      border-bottom: 1px dotted #ccc;
    }

    .pend-col-valor {
      text-align: right;
    }

    .pendencias-subtotal {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-weight: bold;
      margin-top: 2mm;
      padding-top: 1mm;
      border-top: 1px solid #000;
    }

    .pendencias-aviso {
      font-size: 9.5px;
      font-style: italic;
      text-align: center;
      margin-top: 1.5mm;
      line-height: 1.2;
    }

    /* ── RODAPÉ ── */
    .rodape {
      text-align: center;
      margin-top: 2mm;
      padding-bottom: 1mm;
    }

    .rodape img {
      max-width: 35mm;
      height: auto;
      display: block;
      margin: 0 auto 1.5mm auto;
      filter: grayscale(100%);
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
      padding: 2.5mm;
      margin-bottom: 2mm;
    }

    .canhoto .canhoto-titulo {
      font-size: 11px;
      font-weight: bold;
      text-align: center;
      letter-spacing: 0.5px;
      margin-bottom: 1.5mm;
      text-transform: uppercase;
    }

    .canhoto .canhoto-info {
      font-size: 10.5px;
      line-height: 1.5;
      margin-bottom: 1.5mm;
    }

    .canhoto .canhoto-info span {
      font-weight: bold;
    }

    .canhoto .canhoto-destaque {
      display: flex;
      justify-content: space-between;
      border-top: 1px dotted #888;
      padding-top: 0.5mm;
      margin-top: 0.5mm;
    }

    .canhoto .assinatura-linha {
      margin-top: 8mm;
      border-top: 1px solid #000;
      padding-top: 1mm;
      font-size: 11px;
      text-align: center;
    }

    /* ── BOTÃO (só em visualização de tela) ── */
    #button {
      margin-top: 4mm;
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

    /* ── IMPRESSÃO TÉRMICA ── */
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

    <!-- CABEÇALHO DA EMPRESA -->
    <div class="header">
      <div class="empresa">AMIGAO DISTRIBUIDORA DE BEBIDAS LTDA</div>
      <div class="info">CNPJ: 41.836.758/0001-41</div>
      <div class="info">Canoinhas - SC</div>
    </div>

    <hr class="divider">

    ${
      dados.tipo === "segundaVia"
        ? `<div class="cupom-titulo">SEGUNDA VIA NOTA EXTERNA</div>
           ${dados.motivo ? `<div class="motivo">${dados.motivo}</div>` : ""}`
        : `<div class="cupom-titulo">NOTA DE VENDA EXTERNA</div>`
    }

    <div class="atendente">Vendedor: <strong>${dados.nomeUsuario || dados.vendedor || "Não informado"}</strong></div>

    <hr class="divider">

    <!-- DADOS DO CLIENTE -->
    <div class="dados-cliente">
      <div class="data">DATA: ${dataHora}</div>
      <div class="linha-cliente">CLIENTE: ${dados.cliente}</div>
      ${dados.endereco ? `<div>ENDERECO: ${dados.endereco}</div>` : ""}
      <div>CIDADE: ${dados.cidade || "CANOINHAS"} ${dados.telefone ? `| TEL: ${dados.telefone}` : ""}</div>
      ${dados.referencia ? `<div class="ref">REF: ${dados.referencia}</div>` : ""}
    </div>

    <hr class="divider">

    <!-- 1. ITENS DO PEDIDO (Sem sobreposição de texto) -->
    <div class="itens-header">
      <span>DESCRIÇÃO DOS ITENS</span>
      <span>TOTAL</span>
    </div>

    <div id="divItens">
      ${itensHTML}
    </div>

    <!-- 2. TOTAL DO PEDIDO A PAGAR -->
    <div class="total-bloco">
      <div class="total-linha">
        <span>TOTAL DO PEDIDO:</span>
        <span class="total-valor">${totalPedidoFormatado}</span>
      </div>
    </div>

    <!-- 3. FORMA DE PAGAMENTO DO PEDIDO -->
    <div class="pagamento">
      <span>Forma de pagamento:</span>
      <span>${nomeFormaPagamento}</span>
    </div>

    <!-- 4. TEXTO PROMISSÓRIA / DECLARAÇÃO DO PEDIDO -->
    ${
      String(nomeFormaPagamento).toUpperCase().includes("VALE")
        ? `<p class="texto-nota">
            Pagarei por esta única via de nota à Amigão Distribuidora de Bebidas LTDA, CNPJ 41.836.758/0001-41, ou à sua ordem, 
            a quantia de <strong>${totalPedidoFormatado}</strong> referente a este pedido, em moeda corrente deste país, 
            com vencimento para 7 (sete) dias a contar da data de emissão, pagável em Canoinhas&nbsp;-&nbsp;SC.
          </p>`
        : `<p class="texto-nota">
            Paguei por esta única via de nota a Amigão Distribuidora de Bebidas LTDA, CNPJ 41.836.758/0001-41,
            ou à sua ordem, a quantia de <strong>${totalPedidoFormatado}</strong> em moeda
            corrente deste país, pagável em Canoinhas&nbsp;-&nbsp;SC.
          </p>`
    }

    <!-- 5. BLOCO DE DÉBITOS PENDENTES ANTERIORES DO CLIENTE (SE HOUVER) -->
    ${
      temPendencias
        ? `
        <hr class="divider-solid">
        <div class="bloco-pendencias">
          <div class="pendencias-titulo">⚠️ DÉBITOS PENDENTES DO CLIENTE</div>
          <div class="pendencias-tabela-header">
            <span>DATA</span>
            <span>DOCUMENTO</span>
            <span>SALDO</span>
          </div>
          ${linhasPendenciasHTML}
          <div class="pendencias-subtotal">
            <span>TOTAL DE PENDÊNCIAS:</span>
            <span>${totalPendenciasFormatado}</span>
          </div>
          <div class="pendencias-aviso">
            * Débitos anteriores em aberto. Favor conferir e acertar com o cliente.
          </div>
        </div>
        `
        : ""
    }

    <!-- 6. RODAPÉ -->
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

    <!-- 7. CANHOTO DESTACÁVEL (RECIBO DO CLIENTE - APENAS PEDIDO ATUAL) -->
    <div class="canhoto">
      <div class="canhoto-titulo">— Recibo do Cliente —</div>
      <div class="canhoto-info">
        <div>Cliente: <span>${dados.cliente}</span></div>
        <div>Data: <span>${dataHora}</span></div>
        <div class="canhoto-destaque">
          <span>Total do Pedido:</span>
          <span>${totalPedidoFormatado}</span>
        </div>
        <div style="margin-top: 1mm;">Pgto: <span>${nomeFormaPagamento}</span></div>
      </div>
      <p style="font-size: 10.5px; line-height: 1.2;">
        Declaro que recebi os produtos acima relacionados em perfeito estado,
        conforme pedido realizado junto à Distribuidora de Bebidas Amigão.
      </p>
      <div class="assinatura-linha">Assinatura do cliente</div>
    </div>

    <div class="linha-corte">
      <span class="tesoura">-</span>
    </div>

    <!-- BOTÃO IMPRIMIR (só em visualização de tela) -->
    <div id="button">
      <button onclick="window.print()">🖨️ IMPRIMIR NOTA</button>
    </div>

  </div>
</body>
</html>
  `;
}
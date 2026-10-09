import { dataHoraFormatada } from "./data.js";

/**
 * Agrupa todos os produtos de todos os pedidos de uma carga somando as quantidades.
 */
export function agruparProdutosCarga(pedidos = []) {
  const mapa = {};

  (Array.isArray(pedidos) ? pedidos : []).forEach((ped) => {
    const listaItens = Array.isArray(ped.itens)
      ? ped.itens
      : Array.isArray(ped.produtos)
      ? ped.produtos
      : Array.isArray(ped.itensPedido)
      ? ped.itensPedido
      : [];

    listaItens.forEach((it) => {
      const nome =
        it.produto?.nome ||
        it.nomeProduto ||
        it.nome ||
        it.produtoNome ||
        "Produto Não Identificado";
      const qtd = Number(it.quantidade || it.qtd || 1);
      const chave = nome.trim().toLowerCase();

      if (!mapa[chave]) {
        mapa[chave] = {
          nome:
            it.produto?.nome ||
            it.nomeProduto ||
            it.nome ||
            it.produtoNome ||
            nome,
          quantidade: 0,
          unidade: it.produto?.unidade || it.unidade || "",
        };
      }
      mapa[chave].quantidade += qtd;
    });
  });

  return Object.values(mapa).sort((a, b) => a.nome.localeCompare(b.nome));
}

/**
 * Gera o template HTML para impressão térmica (72mm / 80mm) do Relatório de Carregamento da Carga.
 */
export function gerarRelatorioCarregamentoHTML(dados) {
  const dataHora = dataHoraFormatada(dados.criadoEm || dados.createdAt || new Date());
  const pedidos = Array.isArray(dados.pedidos) ? dados.pedidos : [];
  const quantidadePedidos = pedidos.length || dados.quantidadePedidos || 0;
  const produtosAgrupados = agruparProdutosCarga(pedidos);
  const totalItensVolumes = produtosAgrupados.reduce((acc, p) => acc + p.quantidade, 0);

  const pesoTotalTexto = dados.pesoTotal
    ? `${Number(dados.pesoTotal).toLocaleString("pt-BR")} kg`
    : "-";

  let linhasProdutosHTML = "";
  produtosAgrupados.forEach((prod, index) => {
    linhasProdutosHTML += `
      <div class="item-produto">
        <div class="produto-check">[ ]</div>
        <div class="produto-detalhes">
          <span class="produto-qtd">${prod.quantidade}x</span>
          <span class="produto-nome">${prod.nome}</span>
        </div>
      </div>
    `;
  });

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Carregamento - Carga #${dados.id || ""}</title>
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

    .titulo-relatorio {
      font-size: 14px;
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

    /* ── DADOS DO TRANSPORTE ── */
    .secao-transporte {
      margin-bottom: 2mm;
      font-size: 11px;
      line-height: 1.5;
    }

    .secao-transporte div {
      margin-bottom: 0.5mm;
    }

    .secao-transporte strong {
      font-weight: bold;
    }

    /* ── SEÇÃO DE PRODUTOS ── */
    .secao-titulo {
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      margin: 2mm 0 1.5mm;
      border-bottom: 1px solid #000;
      padding-bottom: 0.5mm;
      display: flex;
      justify-content: space-between;
    }

    .lista-produtos {
      margin-bottom: 2mm;
    }

    .item-produto {
      display: flex;
      align-items: flex-start;
      gap: 2mm;
      padding: 1.5mm 0;
      border-bottom: 1px dashed #888;
      page-break-inside: avoid;
    }

    .produto-check {
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 1px;
      min-width: 5mm;
    }

    .produto-detalhes {
      flex: 1;
      display: flex;
      gap: 1.5mm;
      font-size: 11px;
      line-height: 1.3;
    }

    .produto-qtd {
      font-weight: 900;
      font-size: 12px;
      min-width: 8mm;
    }

    .produto-nome {
      font-weight: bold;
      word-break: break-word;
    }

    /* ── RESUMO DE CARREGAMENTO ── */
    .resumo-bloco {
      margin-top: 2mm;
      padding-top: 1mm;
      font-size: 11px;
    }

    .resumo-linha {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1mm;
    }

    .resumo-total-itens {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 900;
      padding-top: 1.5mm;
      border-top: 1.5px solid #000;
      margin-top: 1mm;
    }

    /* ── ASSINATURA ── */
    .assinatura-area {
      margin-top: 8mm;
      text-align: center;
      page-break-inside: avoid;
    }

    .linha-assinatura {
      border-top: 1px solid #000;
      margin: 0 auto 1mm auto;
      width: 90%;
    }

    .assinatura-texto {
      font-size: 10px;
      font-weight: bold;
    }

    /* ── BOTÃO TELA PREVIEW ── */
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

      .item-produto { page-break-inside: avoid; }
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

    <div class="titulo-relatorio">
      RELATÓRIO DE CARREGAMENTO
    </div>
    <div class="data-emissao">CARGA #${dados.id || ""} | EMISSÃO: ${dataHora}</div>

    <hr class="divider-solid">

    <!-- DADOS DO TRANSPORTE -->
    <div class="secao-transporte">
      <div><strong>VEÍCULO:</strong> ${dados.veiculo?.nome || "Veículo"} (${dados.veiculo?.placa || "-"})</div>
      <div><strong>MOTORISTA:</strong> ${dados.motorista?.nome || `Motorista #${dados.motoristaId || "-"}`}</div>
      <div><strong>DESTINO:</strong> ${dados.destino || "Não especificado"}</div>
      <div><strong>QTD DE PEDIDOS:</strong> <strong>${quantidadePedidos} pedidos</strong></div>
      <div><strong>PESO TOTAL:</strong> ${pesoTotalTexto}</div>
    </div>

    <hr class="divider-solid">

    <!-- LISTA DE PRODUTOS A CARREGAR -->
    <div class="secao-titulo">
      <span>Itens a Carregar</span>
      <span>${produtosAgrupados.length} variedades</span>
    </div>

    <div class="lista-produtos">
      ${
        linhasProdutosHTML ||
        "<p style='text-align:center; padding:2mm;'>Nenhum produto listado nesta carga.</p>"
      }
    </div>

    <hr class="divider-solid">

    <!-- RESUMO -->
    <div class="resumo-bloco">
      <div class="resumo-total-itens">
        <span>TOTAL DE VOLUMES / ITENS:</span>
        <span>${totalItensVolumes} un</span>
      </div>
    </div>

    <!-- ÁREA DE ASSINATURA -->
    <div class="assinatura-area">
      <div class="linha-assinatura"></div>
      <div class="assinatura-texto">
        Conferente / Responsável pelo Carregamento
      </div>
    </div>

    <!-- BOTÃO IMPRIMIR (só na tela de preview) -->
    <div id="button">
      <button onclick="window.print()">🖨️ IMPRIMIR CARREGAMENTO</button>
    </div>

  </div>
</body>
</html>
  `;
}

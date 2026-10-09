import { dataHoraFormatada } from "./data.js";
import { formatarMoeda } from "./formartarMoeda.js";

export function gerarRomaneioCargaHTML(dados) {
  const dataHora = dataHoraFormatada(dados.criadoEm || dados.createdAt || new Date());
  const pedidos = Array.isArray(dados.pedidos) ? dados.pedidos : [];
  const quantidadePedidos = pedidos.length || dados.quantidadePedidos || 0;

  // Validação de necessidade de máquina de cartão
  const precisaMaquinaCartao = pedidos.some((p) => {
    const nomePgto = (
      p.formaPagamento?.nome ||
      p.formaPagamentoNome ||
      p.formaPagamento ||
      ""
    ).toLowerCase();
    return (
      nomePgto.includes("cart") ||
      nomePgto.includes("crédito") ||
      nomePgto.includes("credito") ||
      nomePgto.includes("débito") ||
      nomePgto.includes("debito")
    );
  });

  // Cálculo dos totais
  let totalGeral = 0;
  let totalDinheiro = 0;
  let totalCartao = 0;
  let totalPix = 0;
  let totalVale = 0;

  pedidos.forEach((p) => {
    const valor = Number(p.total || p.valorTotal || 0);
    totalGeral += valor;

    const nomePgto = (
      p.formaPagamento?.nome ||
      p.formaPagamentoNome ||
      p.formaPagamento ||
      ""
    ).toLowerCase();

    if (nomePgto.includes("dinheiro") || nomePgto.includes("vista")) {
      totalDinheiro += valor;
    } else if (
      nomePgto.includes("cart") ||
      nomePgto.includes("crédito") ||
      nomePgto.includes("credito") ||
      nomePgto.includes("débito") ||
      nomePgto.includes("debito")
    ) {
      totalCartao += valor;
    } else if (nomePgto.includes("pix")) {
      totalPix += valor;
    } else if (nomePgto.includes("vale") || nomePgto.includes("prazo") || nomePgto.includes("interno")) {
      totalVale += valor;
    }
  });

  const pesoTotalTexto = dados.pesoTotal
    ? `${Number(dados.pesoTotal).toLocaleString("pt-BR")} kg`
    : "-";

  // Renderização da lista de pedidos
  let linhasPedidosHTML = "";
  pedidos.forEach((p, index) => {
    const clienteNome = p.cliente?.nome || p.nomeCliente || "Cliente não informado";
    const endereco = p.cliente?.endereco || p.endereco || "";
    const bairro = p.cliente?.bairro || p.bairro || "";
    const enderecoCompleto = [endereco, bairro].filter(Boolean).join(" - ") || "Endereço não informado";
    const formaPgto = p.formaPagamento?.nome || p.formaPagamentoNome || p.formaPagamento || "-";
    const valorFormatado = formatarMoeda(p.total || p.valorTotal || 0);

    linhasPedidosHTML += `
      <div class="pedido-card">
        <div class="pedido-topo">
          <span class="pedido-num">#${index + 1} [Ped #${p.id}]</span>
          <span class="pedido-valor">${valorFormatado}</span>
        </div>
        <div class="pedido-cliente"><strong>${clienteNome}</strong></div>
        <div class="pedido-detalhe">📍 ${enderecoCompleto}</div>
        <div class="pedido-detalhe">💳 Pgto: <strong>${formaPgto}</strong></div>
      </div>
    `;
  });

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Romaneio de Carga #${dados.id || ""}</title>
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

    .titulo-romaneio {
      font-size: 15px;
      font-weight: 900;
      text-align: center;
      letter-spacing: 1px;
      margin: 2mm 0 1mm;
      padding: 1.5mm 0;
      border-top: 1.5px solid #000;
      border-bottom: 1.5px solid #000;
    }

    .data-emissao {
      font-size: 10px;
      text-align: center;
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
      margin: 2mm 0;
    }

    /* ── DADOS DO TRANSPORTE ── */
    .secao-transporte {
      margin-bottom: 2mm;
      font-size: 11px;
      line-height: 1.5;
    }

    .linha-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1mm;
    }

    .linha-info strong {
      font-weight: bold;
    }

    /* ── ALERTA MÁQUINA DE CARTÃO ── */
    .bloco-maquina {
      margin: 2.5mm 0;
      padding: 2mm;
      text-align: center;
      border: 2px solid #000;
      font-weight: bold;
      font-size: 12px;
    }

    .maquina-sim {
      background: #000;
      color: #fff;
    }

    .maquina-nao {
      background: #fff;
      color: #000;
    }

    /* ── LISTA DE PEDIDOS ── */
    .secao-titulo {
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      margin: 2mm 0 1.5mm;
      border-bottom: 1px solid #000;
      padding-bottom: 0.5mm;
    }

    .pedido-card {
      padding: 1.5mm 0;
      border-bottom: 1px dashed #777;
      page-break-inside: avoid;
    }

    .pedido-topo {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 0.5mm;
    }

    .pedido-cliente {
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 0.5mm;
      word-break: break-word;
    }

    .pedido-detalhe {
      font-size: 10px;
      line-height: 1.3;
      color: #222;
    }

    /* ── RESUMO FINANCEIRO ── */
    .resumo-bloco {
      margin-top: 2mm;
      padding-top: 1mm;
    }

    .resumo-linha {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      margin-bottom: 1mm;
    }

    .resumo-total-geral {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 900;
      padding-top: 1.5mm;
      border-top: 1.5px solid #000;
      margin-top: 1mm;
    }

    /* ── ASSINATURAS ── */
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

      .pedido-card { page-break-inside: avoid; }
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

    <div class="titulo-romaneio">
      ROMANEIO DE CARGA #${dados.id || ""}
    </div>
    <div class="data-emissao">EMISSÃO: ${dataHora}</div>

    <hr class="divider-solid">

    <!-- DADOS DO TRANSPORTE -->
    <div class="secao-transporte">
      <div><strong>VEÍCULO:</strong> ${dados.veiculo?.nome || "Veículo"} (${dados.veiculo?.placa || "-"})</div>
      <div><strong>MOTORISTA:</strong> ${dados.motorista?.nome || `Motorista #${dados.motoristaId || "-"}`}</div>
      <div><strong>DESTINO:</strong> ${dados.destino || "Não especificado"}</div>
      ${dados.descricao ? `<div><strong>OBS:</strong> ${dados.descricao}</div>` : ""}
      <div><strong>QTD DE PEDIDOS:</strong> <strong>${quantidadePedidos} pedidos</strong></div>
      <div><strong>PESO TOTAL:</strong> ${pesoTotalTexto}</div>
    </div>

    <!-- AVISO DE MÁQUINA DE CARTÃO -->
    <div class="bloco-maquina ${precisaMaquinaCartao ? "maquina-sim" : "maquina-nao"}">
      ${
        precisaMaquinaCartao
          ? "⚠️ LEVAR MAQUINA DE CARTÃO: SIM 💳"
          : "LEVAR MAQUINA DE CARTÃO: NÃO"
      }
    </div>

    <hr class="divider-solid">

    <!-- LISTA DE CLIENTES / PEDIDOS -->
    <div class="secao-titulo">Entregas da Carga (${quantidadePedidos})</div>

    <div class="lista-pedidos">
      ${linhasPedidosHTML || "<p style='text-align:center; padding:2mm;'>Nenhum pedido vinculado.</p>"}
    </div>

    <hr class="divider-solid">

    <!-- RESUMO FINANCEIRO -->
    <div class="resumo-bloco">
      <div class="resumo-linha">
        <span>Total em Dinheiro:</span>
        <strong>${formatarMoeda(totalDinheiro)}</strong>
      </div>
      <div class="resumo-linha">
        <span>Total em Cartão:</span>
        <strong>${formatarMoeda(totalCartao)}</strong>
      </div>
      <div class="resumo-linha">
        <span>Total em PIX:</span>
        <strong>${formatarMoeda(totalPix)}</strong>
      </div>
      <div class="resumo-linha">
        <span>Total em Vales/A Prazo:</span>
        <strong>${formatarMoeda(totalVale)}</strong>
      </div>
      <div class="resumo-total-geral">
        <span>TOTAL DA CARGA:</span>
        <span>${formatarMoeda(totalGeral)}</span>
      </div>
    </div>

    <!-- ÁREA DE ASSINATURA -->
    <div class="assinatura-area">
      <div class="linha-assinatura"></div>
      <div class="assinatura-texto">
        Assinatura do Motorista / Conferente
      </div>
    </div>

    <!-- BOTÃO IMPRIMIR (só na tela de preview) -->
    <div id="button">
      <button onclick="window.print()">🖨️ IMPRIMIR ROMANEIO</button>
    </div>

  </div>
</body>
</html>
  `;
}

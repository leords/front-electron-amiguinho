import { dataHoraFormatada } from "./data.js";

/**
 * Lista oficial com os 28 tipos de vasilhames retornáveis e seus respectivos aliases/variações.
 */
export const LISTA_VASILHAMES_OFICIAL = [
  {
    id: "litro",
    nome: "LITRO",
    aliases: [
      "LITRO",
      "LITRAO",
      "LITRÃO",
      "GARRAFA 1L",
      "GARRAFA 1 LITRO",
      "1L",
      "1 LITRO",
      "CERVEJA LITRO",
      "CERVEJA LITRAO",
      "CERVEJA LITRÃO",
    ],
  },
  {
    id: "garrafa",
    nome: "GARRAFA",
    aliases: ["GARRAFA", "GARRAFA 600", "GARRAFA 600ML", "600ML", "CERVEJA 600ML"],
  },
  {
    id: "profissa",
    nome: "PROFISSA",
    aliases: ["PROFISSA", "PROFISSAO", "PROFISSINHA", "300ML", "SKOL PROFISSA"],
  },
  {
    id: "schin_litro",
    nome: "SCHIN LITRO",
    aliases: ["SCHIN LITRO", "SCHIN 1L", "NOVA SCHIN LITRO"],
  },
  {
    id: "garrafa_heineken",
    nome: "GARRAFA HEINEKEN",
    aliases: ["GARRAFA HEINEKEN", "HEINEKEN 600", "HEINEKEN 600ML", "HEINEKEN GARRAFA"],
  },
  {
    id: "51_litro",
    nome: "51 LITRO",
    aliases: ["51 LITRO", "51 1L", "CANINHA 51 LITRO", "PIRASSUNUNGA 51 LITRO"],
  },
  {
    id: "ks",
    nome: "KS",
    aliases: ["KS", "GARRAFA KS", "REFRIGERANTE KS", "COCA KS", "GUARANA KS"],
  },
  {
    id: "velho_b_litro",
    nome: "VELHO B LITRO",
    aliases: [
      "VELHO B LITRO",
      "VELHO BARREIRO LITRO",
      "VELHO BARREIRO 1L",
      "VELHO B 1L",
    ],
  },
  {
    id: "coca_1l",
    nome: "COCA 1L",
    aliases: ["COCA 1L", "COCA-COLA 1L", "COCA COLA 1L", "COCA RETORNAVEL 1L"],
  },
  {
    id: "coca_retornavel_2l",
    nome: "COCA RETORNAVEL 2L",
    aliases: [
      "COCA RETORNAVEL 2L",
      "COCA RET 2L",
      "COCA R 2L",
      "COCA-COLA RETORNAVEL 2L",
      "COCA COLA RETORNAVEL 2L",
    ],
  },
  {
    id: "galao_20l",
    nome: "GALAO 20L",
    aliases: [
      "GALAO 20L",
      "GALÃO 20L",
      "GALAO 20 LITROS",
      "GALÃO 20 LITROS",
      "AGUA 20L",
      "GALAO AGUA 20L",
    ],
  },
  {
    id: "guarana_1l",
    nome: "GUARANA 1L",
    aliases: ["GUARANA 1L", "GUARANÁ 1L", "GUARANA ANTARCTICA 1L"],
  },
  {
    id: "cx_51",
    nome: "CX 51",
    aliases: ["CX 51", "CX. 51", "CAIXA 51"],
  },
  {
    id: "vasilheme_coca_2l",
    nome: "VASILHAME COCA 2L",
    aliases: [
      "VASILHEME COCA 2L",
      "VASILHAME COCA 2L",
      "VASILHAME COCA RETORNAVEL 2L",
      "CASCO COCA 2L",
    ],
  },
  {
    id: "vasilhame_51",
    nome: "VASILHAME 51",
    aliases: ["VASILHAME 51", "VASILHAME CANINHA 51", "CASCO 51"],
  },
  {
    id: "vasilhame_galao",
    nome: "VASILHAME GALAO",
    aliases: [
      "VASILHAME GALAO",
      "VASILHAME GALÃO",
      "VASILHAME GALAO 20L",
      "CASCO GALAO",
    ],
  },
  {
    id: "vasilhame_600",
    nome: "VASILHAME 600",
    aliases: ["VASILHAME 600", "VASILHAME 600ML", "CASCO 600", "CASCO 600ML"],
  },
  {
    id: "hulk_330",
    nome: "HULK 330",
    aliases: ["HULK 330", "HULK 330ML", "CORONA HULK 330", "HEINEKEN HULK 330"],
  },
  {
    id: "combo_5_cx_kaiser_600_05_cx_kaiser_600",
    nome: "COMBO 5 CX KAISER 600 + 0,5 CX KAISER 600",
    aliases: [
      "COMBO 5 CX KAISER 600 + 0,5 CX KAISER 600",
      "COMBO 5 CX KAISER 600 + 0.5 CX KAISER 600",
      "COMBO 5CX KAISER 600 + 0,5CX KAISER 600",
    ],
  },
  {
    id: "caixa_completa_600",
    nome: "CAIXA COMPLETA 600",
    aliases: ["CAIXA COMPLETA 600", "CX COMPLETA 600", "CAIXA COMPLETA 600ML"],
  },
  {
    id: "caixa_completa_1l",
    nome: "CAIXA COMPLETA 1L",
    aliases: ["CAIXA COMPLETA 1L", "CX COMPLETA 1L", "CAIXA COMPLETA 1 LITRO"],
  },
  {
    id: "caixa_completa_ks",
    nome: "CAIXA COMPLETA KS",
    aliases: ["CAIXA COMPLETA KS", "CX COMPLETA KS"],
  },
  {
    id: "caixa_completa_coca_1l",
    nome: "CAIXA COMPLETA COCA 1L",
    aliases: ["CAIXA COMPLETA COCA 1L", "CX COMPLETA COCA 1L"],
  },
  {
    id: "caixa_completa_coca_r_2l",
    nome: "CAIXA COMPLETA COCA R 2L",
    aliases: [
      "CAIXA COMPLETA COCA R 2L",
      "CAIXA COMPLETA COCA RETORNAVEL 2L",
      "CX COMPLETA COCA R 2L",
    ],
  },
  {
    id: "caixa_completa_300",
    nome: "CAIXA COMPLETA 300",
    aliases: ["CAIXA COMPLETA 300", "CX COMPLETA 300", "CAIXA COMPLETA 300ML"],
  },
  {
    id: "caixa_completa_heineken",
    nome: "CAIXA COMPLETA HEINEKEN",
    aliases: ["CAIXA COMPLETA HEINEKEN", "CX COMPLETA HEINEKEN"],
  },
  {
    id: "caixa_completa_hulk",
    nome: "CAIXA COMPLETA HULK",
    aliases: ["CAIXA COMPLETA HULK", "CX COMPLETA HULK"],
  },
  {
    id: "vasilhame_velho_b",
    nome: "VASILHAME VELHO B",
    aliases: ["VASILHAME VELHO B", "VASILHAME VELHO BARREIRO", "CASCO VELHO B"],
  },
];

/**
 * Normaliza strings para comparação (caixa alta, sem acentos, sem espaços redundantes).
 */
export function normalizarTexto(txt) {
  return String(txt || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Extrai número de forma resiliente aceitando números, strings inteiras ou com vírgula decimal ("10,5").
 */
export function extrairNumero(val) {
  if (val === undefined || val === null || val === "") return 1;
  if (typeof val === "number") return isNaN(val) ? 1 : val;
  const limpo = String(val).trim().replace(",", ".");
  const num = parseFloat(limpo);
  return isNaN(num) ? 1 : num;
}

// Monta lista de regras pré-ordenadas por especificidade (maior comprimento de termo primeiro)
const REGRAS_MATCH = [];
LISTA_VASILHAMES_OFICIAL.forEach((v) => {
  REGRAS_MATCH.push({ vasilhame: v, termo: normalizarTexto(v.nome) });
  (v.aliases || []).forEach((al) => {
    REGRAS_MATCH.push({ vasilhame: v, termo: normalizarTexto(al) });
  });
});
// Ordena decrescente por tamanho para que "SCHIN LITRO" (11 letras) tenha prioridade sobre "LITRO" (5 letras)
REGRAS_MATCH.sort((a, b) => b.termo.length - a.termo.length);

/**
 * Identifica a qual vasilhame oficial uma embalagem ou nome de produto pertence.
 */
export function identificarVasilhame(texto) {
  if (!texto) return null;
  const norm = normalizarTexto(texto);
  if (!norm) return null;

  // 1. Correspondência exata por termo ordenado
  for (const regra of REGRAS_MATCH) {
    if (regra.termo === norm) {
      return regra.vasilhame;
    }
  }

  // 2. Correspondência se o texto contém o termo como palavra inteira
  for (const regra of REGRAS_MATCH) {
    const escaped = regra.termo.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|\\s|\\W)${escaped}($|\\s|\\W)`, "i");
    if (regex.test(norm)) {
      return regra.vasilhame;
    }
  }

  return null;
}

/**
 * Agrupa os vasilhames retornáveis presentes nos pedidos da carga com quantidade > 0.
 */
export function agruparVasilhamesCarga(pedidos = [], produtosCatalogo = []) {
  const mapaContagem = {};
  LISTA_VASILHAMES_OFICIAL.forEach((v) => {
    mapaContagem[v.id] = {
      id: v.id,
      nome: v.nome,
      quantidade: 0,
      itensOrigem: [],
    };
  });

  // Mapa auxiliar do catálogo por ID e Nome
  const produtosMap = {};
  if (Array.isArray(produtosCatalogo)) {
    produtosCatalogo.forEach((p) => {
      if (p.id) produtosMap[String(p.id)] = p;
      if (p.nome) produtosMap[normalizarTexto(p.nome)] = p;
    });
  }

  (Array.isArray(pedidos) ? pedidos : []).forEach((ped) => {
    const listaItens = Array.isArray(ped.itens)
      ? ped.itens
      : Array.isArray(ped.produtos)
      ? ped.produtos
      : Array.isArray(ped.itensPedido)
      ? ped.itensPedido
      : [];

    listaItens.forEach((it) => {
      const pId = it.produtoId || it.produto?.id || it.idProduto;
      const pNome =
        it.produto?.nome ||
        it.nomeProduto ||
        it.nome ||
        it.produtoNome ||
        it.descricao ||
        "";

      const prodCat =
        (pId && produtosMap[String(pId)]) ||
        (pNome && produtosMap[normalizarTexto(pNome)]);

      // 1. Busca campo embalagem
      const embalagem =
        it.produto?.embalagem ||
        it.embalagem ||
        it.produtoEmbalagem ||
        it.tipoEmbalagem ||
        it.produto?.tipoEmbalagem ||
        prodCat?.embalagem ||
        prodCat?.tipoEmbalagem ||
        "";

      // 2. Tenta identificar pela embalagem
      let vasilhame = identificarVasilhame(embalagem);

      // 3. Se não identificou pela embalagem, tenta pelo nome do produto do item
      if (!vasilhame && pNome) {
        vasilhame = identificarVasilhame(pNome);
      }

      // 4. Se ainda não identificou, tenta pelo nome no catálogo de produtos
      if (!vasilhame && prodCat?.nome) {
        vasilhame = identificarVasilhame(prodCat.nome);
      }

      if (vasilhame) {
        const qtdBruta = it.quantidade ?? it.qtd ?? it.quant ?? it.quantidadeVendida ?? 1;
        const qtd = extrairNumero(qtdBruta);

        mapaContagem[vasilhame.id].quantidade += qtd;
        mapaContagem[vasilhame.id].itensOrigem.push({
          pedidoId: ped.id,
          produtoNome: pNome || prodCat?.nome || vasilhame.nome,
          quantidade: qtd,
          embalagemEncontrada: embalagem,
        });
      }
    });
  });

  // Retorna somente os vasilhames que têm quantidade > 0 na carga
  const vasilhamesComQuantidade = Object.values(mapaContagem).filter(
    (v) => v.quantidade > 0
  );

  // Mantém a ordem original da lista oficial de vasilhames
  const ordemOficial = LISTA_VASILHAMES_OFICIAL.map((v) => v.id);
  vasilhamesComQuantidade.sort(
    (a, b) => ordemOficial.indexOf(a.id) - ordemOficial.indexOf(b.id)
  );

  return vasilhamesComQuantidade;
}

/**
 * Gera o template HTML do Relatório de Vasilhames para impressão térmica (72mm / 80mm).
 */
export function gerarRelatorioVasilhamesHTML(dados, produtosCatalogo = []) {
  const dataHora = dataHoraFormatada(
    dados.criadoEm || dados.createdAt || dados.data || new Date()
  );
  const pedidos = Array.isArray(dados.pedidos) ? dados.pedidos : [];
  const vasilhames = agruparVasilhamesCarga(pedidos, produtosCatalogo);
  const totalVasilhames = vasilhames.reduce((acc, v) => acc + v.quantidade, 0);

  let linhasTabelaHTML = "";
  if (vasilhames.length === 0) {
    linhasTabelaHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 15px 0; font-size: 13px; font-weight: bold;">
          Nenhum vasilhame retornável registrado para esta carga.
        </td>
      </tr>
    `;
  } else {
    vasilhames.forEach((v) => {
      linhasTabelaHTML += `
        <tr class="tr-linha">
          <td class="col-nome">${v.nome}</td>
          <td class="col-pipe">|</td>
          <td class="col-qtd">${v.quantidade}</td>
          <td class="col-pipe">|</td>
          <td class="col-check">
            <span class="checkbox-box"></span>
          </td>
        </tr>
      `;
    });
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Vasilhames - Carga #${dados.id || ""}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Courier New', Courier, monospace;
      background: #f0f0f0;
      font-size: 13px;
      color: #000;
      padding: 3mm;
    }

    #container {
      width: 72mm;
      margin: 0 auto;
      background: white;
      padding: 3mm 1.5mm 2mm 1.5mm;
    }

    /* ── CABEÇALHO ── */
    .header {
      text-align: center;
      margin-bottom: 2mm;
    }

    .header .empresa {
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 0.5px;
      line-height: 1.2;
    }

    .header .subtitulo {
      font-size: 10px;
      color: #333;
      margin-top: 1mm;
    }

    .titulo-relatorio {
      font-size: 15px;
      font-weight: 900;
      text-align: center;
      letter-spacing: 0.5px;
      margin: 2mm 0 1mm;
      padding: 1.5mm 0;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      text-transform: uppercase;
    }

    .data-emissao {
      font-size: 11px;
      text-align: center;
      font-weight: bold;
      margin-bottom: 2mm;
    }

    /* ── DADOS DA CARGA ── */
    .secao-carga {
      margin-bottom: 2.5mm;
      font-size: 12px;
      line-height: 1.4;
      border-bottom: 1.5px solid #000;
      padding-bottom: 2mm;
    }

    .secao-carga div {
      margin-bottom: 0.8mm;
    }

    .secao-carga strong {
      font-weight: 900;
    }

    /* ── TABELA DE VASILHAMES (LARGURA FIXA 100% PARA NÃO CORTAR) ── */
    .tabela-vasilhames {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
      margin: 2mm 0;
      font-family: 'Courier New', Courier, monospace;
    }

    .tabela-vasilhames thead tr {
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
    }

    .tabela-vasilhames th {
      padding: 2mm 0;
      font-size: 13px;
      font-weight: 900;
      text-transform: uppercase;
    }

    .tabela-vasilhames td {
      padding: 2.5mm 0;
      border-bottom: 1.5px dashed #000;
      vertical-align: middle;
    }

    .col-nome {
      width: 48%;
      text-align: left;
      font-size: 13px;
      font-weight: 900;
      word-break: break-word;
      padding-right: 1mm;
      text-transform: uppercase;
    }

    .col-pipe {
      width: 4%;
      text-align: center;
      font-size: 15px;
      font-weight: 900;
      color: #000;
    }

    .col-qtd {
      width: 22%;
      text-align: center;
      font-size: 18px;
      font-weight: 900;
    }

    .col-check {
      width: 22%;
      text-align: center;
    }

    .checkbox-box {
      display: inline-block;
      width: 18px;
      height: 18px;
      border: 2px solid #000;
      background-color: #fff;
      vertical-align: middle;
      margin: 0 auto;
    }

    /* ── RESUMO / TOTAIS ── */
    .resumo-bloco {
      margin-top: 2.5mm;
      padding-top: 1.5mm;
      border-top: 2px solid #000;
      font-size: 13px;
      line-height: 1.4;
    }

    .resumo-linha {
      display: flex;
      justify-content: space-between;
      font-weight: 900;
      font-size: 14px;
      margin-bottom: 1mm;
    }

    .resumo-total-destaque {
      display: flex;
      justify-content: space-between;
      font-size: 15px;
      font-weight: 900;
      padding-top: 1.5mm;
      border-top: 1.5px dashed #000;
      margin-top: 1mm;
    }

    /* ── SEÇÃO DE ASSINATURA ── */
    .secao-assinatura {
      margin-top: 8mm;
      text-align: center;
      page-break-inside: avoid;
    }

    .assinatura-label {
      font-size: 13px;
      font-weight: 900;
      margin-bottom: 4mm;
      text-transform: uppercase;
    }

    .linha-assinatura {
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 1px;
      margin-bottom: 2mm;
    }

    .rodape-msg {
      margin-top: 4mm;
      font-size: 10px;
      text-align: center;
      color: #444;
      border-top: 1px dotted #888;
      padding-top: 2mm;
    }

    /* ── BOTÃO DE IMPRESSÃO (TELA/NAVEGADOR) ── */
    .action-bar {
      width: 72mm;
      margin: 0 auto 10px auto;
      text-align: center;
    }

    .action-bar button {
      background: #7048e8;
      color: white;
      border: none;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: bold;
      cursor: pointer;
      border-radius: 6px;
      width: 100%;
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

      .action-bar {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="action-bar">
    <button onclick="window.print()">🖨️ IMPRIMIR VASILHAMES</button>
  </div>

  <div id="container">
    <div class="header">
      <div class="empresa">DISTRIBUIDORA AMIGÃO</div>
      <div class="subtitulo">Sistema de Controle Amiguinho</div>
    </div>

    <div class="titulo-relatorio">RETORNO DE VASILHAMES</div>
    <div class="data-emissao">EMISSÃO: ${dataHora}</div>

    <div class="secao-carga">
      <div><strong>CARGA:</strong> #${dados.id || "-"}</div>
      <div><strong>MOTORISTA:</strong> ${dados.motorista?.nome || (dados.motoristaId ? `Motorista #${dados.motoristaId}` : "Não informado")}</div>
      <div><strong>VEÍCULO:</strong> ${dados.veiculo?.nome || "Veículo"} (${dados.veiculo?.placa || "-"})</div>
      <div><strong>DESTINO:</strong> ${dados.destino || "Não informado"}</div>
      <div><strong>TOTAL PEDIDOS:</strong> ${pedidos.length} pedidos</div>
    </div>

    <table class="tabela-vasilhames">
      <thead>
        <tr>
          <th class="col-nome">VASILHAME</th>
          <th class="col-pipe">|</th>
          <th class="col-qtd">QTD</th>
          <th class="col-pipe">|</th>
          <th class="col-check">CHECK</th>
        </tr>
      </thead>
      <tbody>
        ${linhasTabelaHTML}
      </tbody>
    </table>

    <div class="resumo-bloco">
      <div class="resumo-linha">
        <span>TIPOS DE VASILHAME:</span>
        <span>${vasilhames.length}</span>
      </div>
    </div>

    <div class="secao-assinatura">
      <div class="assinatura-label">Assinatura de quem verificou.</div>
      <div class="linha-assinatura">_______________________________</div>
    </div>

    <div class="rodape-msg">
      Relatório gerado pelo sistema amiguinho
    </div>
  </div>
</body>
</html>`;
}

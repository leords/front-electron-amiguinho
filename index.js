import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "path";
import dotenv from "dotenv";
import Store from "electron-store";
import { fileURLToPath } from "url";
import buscarGroq from "./backend/groq.js";
import buscarClima from "./backend/buscarClima.js";
import fs from "fs";
import baixarCSV from "./backend/baixarCSVRelatorioSPT.js";
import { buscarIA, consultaDadosIA } from "./backend/openRouter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho do .env no modo DEV
const envDevPath = path.join(__dirname, ".env");

const store = new Store();

// Carregando variáveis conforme ambiente
if (process.env.NODE_ENV === "development") {
  console.log("Carregando .env de DEV:", envDevPath);
  dotenv.config({ path: envDevPath });
} else {
  // Caminho no build: /resources/.env
  const envProdPath = path.join(process.resourcesPath, ".env");
  console.log("Carregando .env de PRODUÇÃO:", envProdPath);
  dotenv.config({ path: envProdPath });
}

let mainWindow;

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, "public", "mascote.png"),

    //show: false, // opcional (evita "piscar" ao abrir)

    autoHideMenuBar: true, // esconde o menu (Alt ainda mostra)

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // abre maximizado (tipo clicar no botão maximizar)
  mainWindow.maximize();

  // remove completamente o menu
  // mainWindow.setMenu(null);

  // // mostra a janela depois de pronta (opcional)
  // mainWindow.once("ready-to-show", () => {
  // mainWindow.show();
  //});

  if (!process.env.GROQ_API_KEY) {
    dialog.showErrorBox(
      "Erro de Configuração",
      `A chave GROQ_API_KEY não foi encontrada!

        Verifique o .env no diretório:
        DEV: ${envDevPath}
        BUILD: ${path.join(process.resourcesPath, ".env")}`,
    );
  }

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "app", "dist", "index.html"));
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// APIs
// ipcMain.handle("buscar-groq", async (_, prompt) => {
//   return await buscarGroq(prompt);
// });

ipcMain.handle("buscar-open-router", async (_, mensagem) => {
  return await buscarIA(mensagem);
});

ipcMain.handle(
  "consultar-open-router",
  async (_, instrucao, dados, pergunta) => {
    return await consultaDadosIA(instrucao, dados, pergunta);
  },
);

ipcMain.handle("buscar-clima", async (_, cidade) => {
  return await buscarClima(cidade);
});

ipcMain.handle("limpar-storages", async (_) => {
  return await limparStorages();
});

ipcMain.handle("pegar-nome-maquina", async () => {
  return process.env.NOME_MAQUINA;
});

// Ouvimos o evento vindo do preload (window.electronAPI.imprimir)
ipcMain.on("imprimir-cupom", async (event, htmlContent) => {
  // Converte o HTML recebido em uma URL no formato data:text/html
  // Isso permite carregar HTML direto da memória, sem precisar criar arquivo físico
  const finalURL =
    "data:text/html;charset=utf-8," + encodeURIComponent(htmlContent);

  // Criamos uma janela invisível apenas para carregar o HTML e imprimir
  const printWindow = new BrowserWindow({
    show: false, // A janela não aparece na tela (janela fantasma)
    webPreferences: {
      nodeIntegration: false, // Mantém a janela mais segura
      contextIsolation: true, // Evita acesso indevido ao contexto do Electron
    },
  });

  // Carrega o HTML convertido para data URL
  printWindow.loadURL(finalURL);

  // Só imprimimos depois que o HTML terminar de carregar
  printWindow.webContents.once("did-finish-load", () => {
    const deviceName = store.get("impressoraTermica");
    // Envia diretamente para a impressora
    printWindow.webContents.print(
      {
        silent: true, // Imprime sem abrir o diálogo do Windows
        printBackground: true, // Respeita estilos e fundos definidos no HTML
        deviceName,
      },
      (success, error) => {
        // Callback acionado quando a impressão termina

        if (!success) console.error("Erro ao imprimir:", error);
        else console.log("Impressão concluída com sucesso.");

        // Fecha a janela invisível após finalizar a impressão
        printWindow.close();
      },
    );
  });
});

// Abrir link externo
ipcMain.handle("abrir-link", (_, url) => {
  return shell.openExternal(url);
});

// PDF ESTOQUE ATUAL
ipcMain.handle("gerar-pdf-estoque", async (event, itens) => {
  try {
    const win = new BrowserWindow({
      show: false, // não precisa aparecer
    });

    // 🧾 Monta HTML na mão
    const html = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial;
              padding: 20px;
            }

            h1 {
              text-align: center;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }

            th, td {
              border: 1px solid #ccc;
              padding: 8px;
              text-align: left;
            }

            th {
              background: #f4f4f4;
            }
          </style>
        </head>

        <body>
          <h1>Relatório de Estoque</h1>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Caixa</th>
                <th>Unidade</th>
              </tr>
            </thead>

            <tbody>
              ${itens
                .map(
                  (item) =>
                    `
                <tr>
                  <td>${item.id}</td>
                  <td>${item.nome}</td>
                  <td>${Math.floor(item.estoque)}</td>
                  <td>${Math.round((item.estoque % 1) * item.quantidade)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

        </body>
      </html>
    `;

    await win.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
    );

    const pdf = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: "A4",
    });

    // ABRE A CAIXA DE DIALOGO
    const { filePath } = await dialog.showSaveDialog({
      title: "Salvar PDF do estoque",
      defaultPath: `estoque-${new Date().toISOString().slice(0, 10)}.pdf`,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });

    if (!filePath) {
      return {
        sucesso: false,
        mensagem: "Usuário cancelou",
      };
    }

    fs.writeFileSync(filePath, pdf);

    win.close();

    return {
      sucesso: true,
      mensagem: "PDF gerado com sucesso!",
    };
  } catch (error) {
    return {
      sucesso: false,
      mensagem: "Erro ao gerar PDF",
    };
  }

  return true;
});

// PDF RELATORIO SAIDA DE PRODUTOS
ipcMain.handle("gerar-pdf-saida-produto", async (event, setor, relatorio) => {
  try {
    const win = new BrowserWindow({
      show: false, // não precisa aparecer
    });

    // 🧾 Monta HTML na mão
    const html = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial;
              padding: 20px;
            }

            h1 {
              text-align: center;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }

            th, td {
              border: 1px solid #ccc;
              padding: 8px;
              text-align: left;
            }

            th {
              background: #f4f4f4;
            }
          </style>
        </head>

        <body>
          <h1>Relatório de Saída de produtos ${setor}</h1>

          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quantidade</th>
              </tr>
            </thead>

            <tbody>
              ${relatorio
                .map(
                  (relatorio) => `
                <tr>
                  <td>${relatorio.produto}</td>
                  <td>${relatorio.quantidade}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

        </body>
      </html>
    `;

    await win.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
    );

    const pdf = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: "A4",
    });

    const { filePath } = await dialog.showSaveDialog({
      title: "Salvar PDF do relatórios de saída de produtos",
      defaultPath: `relatorio-saida-produtos-${new Date().toISOString().slice(0, 10)}.pdf`,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });

    if (!filePath) {
      return {
        sucesso: false,
        mensagem: "Usuário cancelou",
      };
    }

    fs.writeFileSync(filePath, pdf);

    win.close();

    return {
      sucesso: true,
      mensagem: "PDF gerado com sucesso!",
    };
  } catch (error) {
    return {
      sucesso: false,
      mensagem: "Erro ao gerar PDF",
    };
  }

  return true;
});

// PDF RELATÓRIO DE DESEMPENHO POR CLIENTE — NOTAS COMPLETAS 1 A 1
ipcMain.handle("gerar-pdf-relatorio-cliente", async (event, dados) => {
  try {
    const {
      cliente = {},
      ano = new Date().getFullYear(),
      resumo = {},
      pedidos = [],
    } = dados || {};

    const win = new BrowserWindow({
      show: false,
    });

    const formatarMoedaLocal = (valor) =>
      Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });

    const formatarDataLocal = (dataStr) => {
      if (!dataStr) return "—";
      try {
        return new Date(dataStr).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      } catch {
        return String(dataStr);
      }
    };

    const formatarDataHoraLocal = (dataStr) => {
      if (!dataStr) return "—";
      try {
        return new Date(dataStr).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return String(dataStr);
      }
    };

    const dataHoraEmissao = new Date().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const totalGeralPedidos = pedidos.reduce(
      (acc, p) => acc + Number(p.total || 0),
      0
    );

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4;
              margin: 10mm 12mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              color: #1a1f2e;
              background: #fff;
              font-size: 10px;
              line-height: 1.4;
            }
            .header-doc {
              border-bottom: 2px solid #ff8c00;
              padding-bottom: 8px;
              margin-bottom: 12px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .empresa-principal-nome {
              font-size: 16px;
              font-weight: 800;
              color: #ff8c00;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            .doc-titulo {
              font-size: 12px;
              font-weight: 700;
              color: #495057;
              margin-top: 2px;
            }
            .doc-emissao-info {
              text-align: right;
              font-size: 9px;
              color: #868e96;
            }
            .resumo-cliente-topo {
              background: #f8f9fa;
              border: 1px solid #dee2e6;
              border-radius: 6px;
              padding: 10px 14px;
              margin-bottom: 14px;
              display: grid;
              grid-template-columns: 2fr 1fr 1fr;
              gap: 8px;
              font-size: 9.5px;
            }
            .resumo-label {
              font-size: 8px;
              text-transform: uppercase;
              color: #868e96;
              font-weight: 700;
              margin-bottom: 2px;
            }
            .resumo-valor-destaque {
              font-size: 12px;
              font-weight: 800;
              color: #1a1f2e;
            }
            .resumo-sub {
              font-size: 9px;
              color: #495057;
            }

            /* ── NOTA COMPLETA ── */
            .nota-card {
              border: 1.5px solid #212529;
              border-radius: 6px;
              padding: 10px 14px;
              margin-bottom: 18px;
              background: #fff;
              page-break-inside: avoid;
            }
            .nota-header {
              text-align: center;
              margin-bottom: 6px;
            }
            .nota-empresa {
              font-size: 13px;
              font-weight: 800;
              color: #1a1f2e;
              letter-spacing: 0.5px;
            }
            .nota-empresa-sub {
              font-size: 9px;
              font-weight: 600;
              color: #495057;
              margin-top: 1px;
            }
            .nota-divider-dashed {
              border-top: 1px dashed #495057;
              margin: 6px 0;
            }
            .nota-divider-solid {
              border-top: 1px solid #212529;
              margin: 6px 0;
            }
            .nota-titulo-principal {
              text-align: center;
              font-size: 12px;
              font-weight: 800;
              letter-spacing: 0.5px;
              margin: 4px 0;
              text-transform: uppercase;
              color: #1a1f2e;
            }
            .nota-meta-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              font-size: 9px;
              background: #f8f9fa;
              border: 1px solid #dee2e6;
              border-radius: 4px;
              padding: 5px 8px;
              margin: 4px 0;
            }
            .nota-cliente-box {
              font-size: 9.5px;
              line-height: 1.5;
              background: #fafbfc;
              border: 1px solid #e9ecef;
              border-radius: 4px;
              padding: 6px 10px;
              margin: 6px 0;
            }
            .nota-cliente-linha {
              display: flex;
              justify-content: space-between;
              gap: 12px;
            }
            .nota-promissoria-texto {
              font-size: 9px;
              line-height: 1.4;
              text-align: justify;
              margin: 6px 0;
              color: #212529;
              background: #fff;
              padding: 4px 0;
            }
            .tabela-itens-nota {
              width: 100%;
              border-collapse: collapse;
              font-size: 9px;
              margin: 6px 0;
            }
            .tabela-itens-nota th {
              background: #f1f3f5;
              font-size: 8.5px;
              font-weight: 700;
              text-transform: uppercase;
              padding: 5px 8px;
              border: 1px solid #ced4da;
            }
            .tabela-itens-nota td {
              padding: 5px 8px;
              border: 1px solid #dee2e6;
              color: #212529;
            }
            .tabela-itens-nota tr:nth-child(even) td {
              background: #fafbfc;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .nota-totais-box {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 6px 10px;
              background: #fff9db;
              border: 1px solid #ffe066;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 700;
              margin: 6px 0;
            }
            .nota-total-destaque {
              font-size: 13px;
              font-weight: 800;
              color: #d9480f;
            }
            .nota-pagamento-box {
              font-size: 9px;
              padding: 5px 8px;
              background: #f8f9fa;
              border: 1px solid #e9ecef;
              border-radius: 4px;
              margin: 6px 0;
            }
            .tabela-pagamentos-interna {
              width: 100%;
              border-collapse: collapse;
              margin-top: 4px;
              font-size: 8.5px;
            }
            .tabela-pagamentos-interna th {
              background: #e9ecef;
              padding: 3px 6px;
              text-align: left;
              border: 1px solid #ced4da;
            }
            .tabela-pagamentos-interna td {
              padding: 3px 6px;
              border: 1px solid #dee2e6;
            }
            .badge-setor {
              display: inline-block;
              padding: 1px 6px;
              border-radius: 4px;
              font-size: 8px;
              font-weight: 700;
              background: #e7f5ff;
              color: #1971c2;
              border: 1px solid #d0ebff;
            }
            .badge-status {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 8px;
              font-weight: 700;
              text-transform: uppercase;
              background: #e9ecef;
              color: #495057;
            }
            .badge-status.finalizado,
            .badge-status.entregue { background: #ebfbee; color: #2f9e44; }
            .badge-status.pendente,
            .badge-status.carregado { background: #fff3e0; color: #d9480f; }
            .badge-status.cancelado { background: #fff5f5; color: #c92a2a; }

            /* CANHOTO */
            .canhoto-bloco {
              margin-top: 8px;
              padding-top: 6px;
              page-break-inside: avoid;
            }
            .canhoto-linha-corte {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 9px;
              font-weight: 700;
              color: #495057;
              margin-bottom: 5px;
            }
            .canhoto-linha-corte-traco {
              flex: 1;
              border-top: 1px dashed #868e96;
            }
            .canhoto-conteudo {
              background: #fafbfc;
              border: 1px dashed #ced4da;
              border-radius: 4px;
              padding: 6px 10px;
            }
            .canhoto-dados {
              display: flex;
              justify-content: space-between;
              font-size: 9px;
              margin-bottom: 4px;
            }
            .canhoto-declaracao {
              font-size: 8.5px;
              color: #495057;
              font-style: italic;
              margin-bottom: 8px;
            }
            .canhoto-assinatura-linha {
              border-top: 1px solid #212529;
              width: 55%;
              margin: 12px auto 2px auto;
            }
            .canhoto-assinatura-legenda {
              font-size: 8px;
              text-align: center;
              color: #495057;
            }
            .rodape-geral {
              margin-top: 16px;
              padding-top: 8px;
              border-top: 1px solid #dee2e6;
              display: flex;
              justify-content: space-between;
              font-size: 8px;
              color: #adb5bd;
            }
            .page-break {
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <div class="header-doc">
            <div>
              <div class="empresa-principal-nome">Amigão Distribuidora de Bebidas</div>
              <div class="doc-titulo">Relatório Completo de Pedidos e Notas do Cliente — Exercício ${ano}</div>
            </div>
            <div class="doc-emissao-info">
              Emissão: <strong>${dataHoraEmissao}</strong><br/>
              Sistema de Controle Amiguinho
            </div>
          </div>

          <div class="resumo-cliente-topo page-break">
            <div>
              <div class="resumo-label">Cliente Selecionado</div>
              <div class="resumo-valor-destaque">#${cliente.id || "—"} - ${cliente.nome || "Não informado"}</div>
              <div class="resumo-sub">
                ${cliente.documento ? `CPF/CNPJ: ${cliente.documento}` : ""} ${cliente.telefone ? `• Tel: ${cliente.telefone}` : ""}
              </div>
              <div class="resumo-sub">
                ${[cliente.endereco, cliente.bairro, cliente.cidade].filter(Boolean).join(", ") || "Endereço não informado"}
              </div>
            </div>
            <div>
              <div class="resumo-label">Setor / Vendedor</div>
              <div class="resumo-sub">
                Setor: <strong>${cliente.setor ? cliente.setor.toUpperCase() : "GERAL"}</strong><br/>
                Vendedor: <strong>${cliente.vendedor || "Amigão Distribuidora"}</strong>
              </div>
            </div>
            <div>
              <div class="resumo-label">Resumo do Período (${ano})</div>
              <div class="resumo-sub">
                Total de Pedidos: <strong>${pedidos.length}</strong><br/>
                Total Faturado: <strong style="color: #2f9e44;">${formatarMoedaLocal(resumo.totalCompras || totalGeralPedidos)}</strong>
              </div>
            </div>
          </div>

          ${
            pedidos.length > 0
              ? pedidos
                  .map((p) => {
                    const statusClass = String(p.status || "").toLowerCase();
                    const totalQtdItens = (p.itens || []).reduce(
                      (acc, item) => acc + (Number(item.quantidade) || 0),
                      0
                    );

                    const itensHtml =
                      p.itens && p.itens.length > 0
                        ? p.itens
                            .map(
                              (it, idx) => `
                          <tr>
                            <td class="text-center">${idx + 1}</td>
                            <td class="text-center"><strong>${it.quantidade || 1} un</strong></td>
                            <td><strong>${it.nome || "Produto"}</strong></td>
                            <td class="text-right">${formatarMoedaLocal(it.valorUnit)}</td>
                            <td class="text-right"><strong>${formatarMoedaLocal(it.valorTotal)}</strong></td>
                          </tr>
                        `
                            )
                            .join("")
                        : `
                          <tr>
                            <td colspan="5" class="text-center" style="padding: 6px; color: #868e96; font-style: italic;">
                              Itens do pedido não especificados individualmente
                            </td>
                          </tr>
                        `;

                    const temPagamentosParciais =
                      Array.isArray(p.pagamentos) && p.pagamentos.length > 0;

                    const pagamentosHtml = temPagamentosParciais
                      ? `
                        <div><strong>Discriminação dos Pagamentos:</strong></div>
                        <table class="tabela-pagamentos-interna">
                          <thead>
                            <tr>
                              <th>Cód / Parcela</th>
                              <th>Forma de Pagamento</th>
                              <th class="text-right">Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${p.pagamentos
                              .map(
                                (pg) => `
                              <tr>
                                <td>${pg.id || "—"}</td>
                                <td>${pg.nome}</td>
                                <td class="text-right"><strong>${formatarMoedaLocal(pg.valor)}</strong></td>
                              </tr>
                            `
                              )
                              .join("")}
                          </tbody>
                        </table>
                      `
                      : `
                        <div>Forma de Pagamento: <strong>${p.formaPagamento || "A VISTA"}</strong></div>
                      `;

                    return `
                      <div class="nota-card page-break">
                        <div class="nota-header">
                          <div class="nota-empresa">AMIGÃO DISTRIBUIDORA DE BEBIDAS LTDA</div>
                          <div class="nota-empresa-sub">CNPJ: 41.836.758/0001-41 • Canoinhas - SC</div>
                          <div class="nota-divider-dashed"></div>
                          <div class="nota-titulo-principal">NOTA PROMISSÓRIA / COMPROVANTE DE PEDIDO #${p.id}</div>
                          <div class="nota-meta-grid">
                            <div><strong>Setor:</strong> <span class="badge-setor">${p.setor ? p.setor.toUpperCase() : "BALCÃO"}</span></div>
                            <div><strong>Data/Hora:</strong> ${formatarDataHoraLocal(p.data)}</div>
                            <div><strong>Vendedor:</strong> ${p.vendedor || "Amigão Distribuidora"}</div>
                            <div><strong>Status:</strong> <span class="badge-status ${statusClass}">${p.status || "FINALIZADO"}</span></div>
                          </div>
                        </div>

                        <div class="nota-divider-dashed"></div>

                        <div class="nota-cliente-box">
                          <div class="nota-cliente-linha">
                            <span><strong>Cliente:</strong> #${cliente.id || p.id} - ${p.clienteNome || cliente.nome || "Não informado"}</span>
                            <span><strong>CPF/CNPJ:</strong> ${p.clienteDoc || cliente.documento || "—"}</span>
                          </div>
                          <div class="nota-cliente-linha">
                            <span><strong>Endereço:</strong> ${[p.endereco || cliente.endereco, p.bairro || cliente.bairro, p.cidade || cliente.cidade].filter(Boolean).join(", ") || "Endereço não informado"}</span>
                            <span><strong>Telefone:</strong> ${p.telefone || cliente.telefone || "—"}</span>
                          </div>
                          ${
                            p.referencia || cliente.referencia
                              ? `
                            <div class="nota-cliente-linha">
                              <span><strong>Ponto de Referência:</strong> ${p.referencia || cliente.referencia}</span>
                            </div>
                          `
                              : ""
                          }
                        </div>

                        <p class="nota-promissoria-texto">
                          Na data de <strong>${formatarDataHoraLocal(p.data)}</strong> eu, <strong>${p.clienteNome || cliente.nome || "Cliente"}</strong>, paguei/assumo por esta única via de nota à <strong>Amigão Distribuidora de Bebidas LTDA</strong>, CNPJ 41.836.758/0001-41, ou à sua ordem, a quantia de <strong>${formatarMoedaLocal(p.total)}</strong> em moeda corrente deste país, pagável em Canoinhas - SC.
                        </p>

                        <div class="nota-divider-solid"></div>

                        <table class="tabela-itens-nota">
                          <thead>
                            <tr>
                              <th style="width: 35px;" class="text-center">#</th>
                              <th style="width: 60px;" class="text-center">Qtd</th>
                              <th>Descrição do Produto</th>
                              <th style="width: 85px;" class="text-right">Preço Unit.</th>
                              <th style="width: 95px;" class="text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${itensHtml}
                          </tbody>
                        </table>

                        <div class="nota-divider-solid"></div>

                        <div class="nota-totais-box">
                          <div>
                            Volumes / Qtd Total de Itens: <strong>${totalQtdItens} un</strong>
                          </div>
                          <div>
                            TOTAL (=) <span class="nota-total-destaque">${formatarMoedaLocal(p.total)}</span>
                          </div>
                        </div>

                        <div class="nota-divider-dashed"></div>

                        <div class="nota-pagamento-box">
                          ${pagamentosHtml}
                        </div>

                        <div class="canhoto-bloco">
                          <div class="canhoto-linha-corte">
                            <span style="font-size: 11px;">✂</span>
                            <span class="canhoto-linha-corte-traco"></span>
                            <span>CANHOTO DE RECEBIMENTO — PEDIDO #${p.id}</span>
                            <span class="canhoto-linha-corte-traco"></span>
                          </div>
                          <div class="canhoto-conteudo">
                            <div class="canhoto-dados">
                              <span><strong>Cliente:</strong> ${p.clienteNome || cliente.nome || "—"}</span>
                              <span><strong>Data da Emissão:</strong> ${formatarDataLocal(p.data)}</span>
                              <span><strong>Valor Total:</strong> ${formatarMoedaLocal(p.total)}</span>
                            </div>
                            <p class="canhoto-declaracao">
                              Declaro ter recebido os produtos constantes neste pedido em perfeitas condições.
                            </p>
                            <div class="canhoto-assinatura-linha"></div>
                            <div class="canhoto-assinatura-legenda">Assinatura do Cliente / Responsável</div>
                          </div>
                        </div>
                      </div>
                    `;
                  })
                  .join("")
              : `
              <div style="padding: 20px; text-align: center; color: #868e96; border: 1px solid #dee2e6; border-radius: 6px;">
                Nenhum pedido encontrado para este cliente no período selecionado.
              </div>
            `
          }

          <div class="rodape-geral">
            <span>Relatório de Notas e Pedidos gerado pelo Sistema Amiguinho</span>
            <span>Documento emitido eletronicamente para fins de controle e gestão</span>
          </div>
        </body>
      </html>
    `;

    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    const pdf = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: "A4",
    });

    const nomeClienteSanitizado = String(cliente.nome || "cliente")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .slice(0, 30)
      .toUpperCase();

    const { filePath } = await dialog.showSaveDialog({
      title: "Salvar Relatório do Cliente em PDF",
      defaultPath: `relatorio-cliente-${nomeClienteSanitizado}-${ano}.pdf`,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });

    win.close();

    if (!filePath) {
      return {
        sucesso: false,
        mensagem: "Operação cancelada pelo usuário",
      };
    }

    fs.writeFileSync(filePath, pdf);

    return {
      sucesso: true,
      mensagem: "Relatório em PDF gerado e baixado com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao gerar PDF do relatório do cliente:", error);
    return {
      sucesso: false,
      mensagem: "Erro ao gerar PDF do relatório: " + error.message,
    };
  }
});

// BAIXAR CSV
ipcMain.handle("gerar-csv-saida-produto", async (event, dados) => {
  return await baixarCSV(dados);
});

// LISTAR IMPRESSORAS
ipcMain.handle("retornar-impressoras", async (event) => {
  return await event.sender.getPrintersAsync();
});
// RETORNA A IMPRESSORA SELECIONADA
ipcMain.handle("definir-impressora", async (event, deviceName) => {
  store.set("impressoraTermica", deviceName);

  return true;
});

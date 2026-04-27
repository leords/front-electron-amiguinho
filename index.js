import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import buscarGroq from "./backend/groq.js";
import buscarClima from "./backend/buscarClima.js";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho do .env no modo DEV
const envDevPath = path.join(__dirname, ".env");

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
    icon: path.join(__dirname, 'public', 'mascote.png'),

    //show: false, // opcional (evita "piscar" ao abrir)

    //autoHideMenuBar: true, // esconde o menu (Alt ainda mostra)

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // // abre maximizado (tipo clicar no botão maximizar)
  // mainWindow.maximize();

  // // remove completamente o menu
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
        BUILD: ${path.join(process.resourcesPath, ".env")}`
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
ipcMain.handle("buscar-groq", async (_, prompt) => {
  return await buscarGroq(prompt);
});

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
    // Envia diretamente para a impressora
    printWindow.webContents.print(
      {
        silent: true, // Imprime sem abrir o diálogo do Windows
        printBackground: true, // Respeita estilos e fundos definidos no HTML
      },
      (success, error) => {
        // Callback acionado quando a impressão termina

        if (!success) console.error("Erro ao imprimir:", error);
        else console.log("Impressão concluída com sucesso.");

        // Fecha a janela invisível após finalizar a impressão
        printWindow.close();
      }
    );
  });
});

// Abrir link externo
ipcMain.handle('abrir-link', (_, url) => {
  return shell.openExternal(url);
});

// PDF
ipcMain.handle('gerar-pdf-estoque', async (event, itens) => {

  try {
        const win = new BrowserWindow({
      show: false // não precisa aparecer
    })

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
                <th>Quantidade</th>
              </tr>
            </thead>

            <tbody>
              ${itens.map(item => `
                <tr>
                  <td>${item.id}</td>
                  <td>${item.nome}</td>
                  <td>${item.estoque}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

        </body>
      </html>
    `

    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)

    const pdf = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4'
    })

    const { filePath } = await dialog.showSaveDialog({
      title: 'Salvar PDF do estoque',
      defaultPath: `estoque-${new Date().toISOString().slice(0,10)}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })

    if (!filePath) {
      return {
        sucesso: false,
        mensagem: 'Usuário cancelou'
      }
    }

    fs.writeFileSync(filePath, pdf)

    win.close()

    return {
      sucesso: true,
      mensagem: 'PDF gerado com sucesso!'
    }
  } catch (error) {
    return {
      sucesso: false,
      mensagem: 'Erro ao gerar PDF'
    }
  }

  return true
})



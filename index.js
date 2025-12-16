import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import buscarGroq from "./backend/groq.js";
import buscarClima from "./backend/buscarClima.js";

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
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

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

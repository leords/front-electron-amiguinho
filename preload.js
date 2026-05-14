const { contextBridge, ipcRenderer, shell  } = require("electron");

// imprimir
contextBridge.exposeInMainWorld("IMPRESSORA", {
  imprimir: (html) => ipcRenderer.send("imprimir-cupom", html),
});

// Acessar o .env
contextBridge.exposeInMainWorld("ENV", {
  pegarNomeMaquina: () => ipcRenderer.invoke("pegar-nome-maquina"),
});

// Buscar clima
contextBridge.exposeInMainWorld("API", {
  buscarClima: (cidade) => ipcRenderer.invoke("buscar-clima", cidade),
});

// Gerar pdf saldo de estoque e saida de produtos
contextBridge.exposeInMainWorld('PDF', {
  gerarPDFEstoque: (dados) => ipcRenderer.invoke('gerar-pdf-estoque', dados),
  gerarPDFSaidaProdutos: (setor, dados) => ipcRenderer.invoke('gerar-pdf-saida-produto', setor, dados),
  baixarCSV: (dados) => ipcRenderer.invoke('gerar-csv-saida-produto', dados),
})


// IA Groq
contextBridge.exposeInMainWorld("IA", {
  buscarGroq: (prompt) => ipcRenderer.invoke("buscar-groq", prompt),
});


contextBridge.exposeInMainWorld("electronAPI", {
  fecharJanela: () => ipcRenderer.send("fechar-janela"),
  limparStorages: () => ipcRenderer.send("limpar-storages"),
});

// Abrir links em explorer externos.
contextBridge.exposeInMainWorld('LINK', {
  abrirLinkExterno: (url) => ipcRenderer.invoke('abrir-link', url)
});





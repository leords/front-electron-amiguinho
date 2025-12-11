const { contextBridge, ipcRenderer } = require("electron");

console.log("PRELOAD CARREGADO!");

contextBridge.exposeInMainWorld("API", {
  buscarClima: (cidade) => ipcRenderer.invoke("buscar-clima", cidade),
});

contextBridge.exposeInMainWorld("IA", {
  buscarGroq: (prompt) => ipcRenderer.invoke("buscar-groq", prompt),
});

contextBridge.exposeInMainWorld("electronAPI", {
  fecharJanela: () => ipcRenderer.send("fechar-janela"),
  limparStorages: () => ipcRenderer.send("limpar-storages"),
});

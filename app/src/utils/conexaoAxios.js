import axios from "axios";

function getBaseURL() {
  const servidor = import.meta.env.VITE_API_URL

  return servidor || "https://api.amigaodistribuidora.com.br"
}

export const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 5000,
});

export const apiLong = axios.create({
  baseURL: getBaseURL(),
  timeout: 50000,
});


// Aqui é interceptado todos os responses que passarem por esta instância api

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const ehRotaLogin = error.config?.url?.includes("/login");

    if (error.response?.status === 401 && !ehRotaLogin) {
      localStorage.removeItem("token");
      localStorage.removeItem("nomeUsuario");
      localStorage.removeItem("idUsuario");
      localStorage.removeItem("nivelAcesso");
      window.location.hash = "#/";  // rotas com # para o Electron nao tentar carregar a raiz do disco.
    }

    return Promise.reject(error);
  }
);

apiLong.interceptors.response.use(
  (response) => response,
  (error) => {
    const ehRotaLogin = error.config?.url?.includes("/login");

    if (error.response?.status === 401 && !ehRotaLogin) {
      localStorage.removeItem("token");
      localStorage.removeItem("nomeUsuario");
      localStorage.removeItem("idUsuario");
      localStorage.removeItem("nivelAcesso");
      window.location.hash = "#/"; // rotas com # para o Electron nao tentar carregar a raiz do disco.
    }

    return Promise.reject(error);
  }
);
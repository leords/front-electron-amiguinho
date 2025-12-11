import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 5000, // se a resposta demorar mais que 5 segundos, dá erro
});

export const authAPI = async (credenciais) => {
  try {
    const resposta = await api.post("/login", credenciais);
    return resposta.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || "Erro ao fazer login");
    }
    if (error.request) {
      // Requisição enviada, mas backend não respondeu
      throw new Error("Servidor não respondeu. Tente novamente.");
    }
    // Erros internos (axios, rede, js, etc)
    throw new Error(error.message || "Erro inesperado");
  }
};

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 5000,
});

export const BuscarProduto = async (params = {}) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.get("/buscar-produtos", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return resposta.data;
  } catch (error) {
    if (error.reponse) {
      throw new Error(error.response.data || "Erro ao buscar produtos");
    }
    if (error.request) {
      throw new Error("Servidor não respondeu, tente novamente");
    }
    throw new Error(error.message || "Erro inesperado");
  }
};

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
});

export const BuscarProduto = async () => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.get("/buscar-produtos", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log("Requisição de buscar produtos realizada!")
    return resposta.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data || "Erro ao buscar produtos");
    }
    if (error.request) {
      throw new Error("Servidor não respondeu, tente novamente");
    }
    throw new Error(error.message || "Erro inesperado");
  }
};

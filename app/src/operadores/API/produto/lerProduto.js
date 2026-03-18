import { api } from "../../../utils/conexaoAxios";

export const LerProduto = async (params = {}) => {
  const token = localStorage.getItem("token");
  try {
    const resposta = await api.get("/ler-produtos", {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return resposta.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data || "Erro ao ler produtos");
    }
    if (error.request) {
      throw new Error("Servidor não respondeu, tente novamente");
    }
    throw new Error(error.message || "Erro inesrado");
  }
};

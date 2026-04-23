import { api } from "../../../utils/conexaoAxios";

export const buscarEstoque = async () => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.get("/buscar-estoque", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return resposta.data;

  } catch (error) {
    console.log("error", error)
    if (error.response) {
      throw new Error(error.response.data || "Erro ao buscar saldo do estoque");
    }
    if (error.request) {
      throw new Error("Servidor não respondeu. Tente novamente.");
    }
    throw new Error(error.message || "Erro inesperado");
  }
};

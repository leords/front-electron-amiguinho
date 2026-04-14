import { api } from "../../../utils/conexaoAxios";

export const buscarFornecedores = async ( params = {} ) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.get("/ler-fornecedores", {
    params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return resposta.data;

  } catch (error) {
    console.log("error", error)
    if (error.response) {
      throw new Error(error.response.data || "Erro ao buscar fornecedores");
    }
    if (error.request) {
      throw new Error("Servidor não respondeu. Tente novamente.");
    }
    throw new Error(error.message || "Erro inesperado");
  }
};

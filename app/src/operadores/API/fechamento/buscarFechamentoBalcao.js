import { api } from "../../../utils/conexaoAxios";

export const buscarFechamentoBalcao = async (params = {}) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.get("/buscar-fechamento-balcao-dia", {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return resposta.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.mensagem || "Erro ao ler fechamento de balcão"
      );
    }
    if (error.request) {
      throw new Error("Servidor não respondeu, tente novamente");
    }
    throw new Error(error.message || "Erro inesperado");
  }
};

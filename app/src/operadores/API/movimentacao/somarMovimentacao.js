import { api } from "../../../utils/conexaoAxios";

export const somarMovimentacao = async (fechamentoId) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.get(`/somar-movimentacao/${fechamentoId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return resposta.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.mensagem || "Erro ao buscar movimentação"
      );
    }
    if (error.request) {
      throw new Error("Servidor não respondeu, tente novamente");
    }
    throw new Error(error.message || "Erro inesperado");
  }
};
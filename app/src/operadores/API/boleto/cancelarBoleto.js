import { api } from "../../../utils/conexaoAxios";

export const cancelarBoleto = async (id, observacao = "") => {
  const token = localStorage.getItem("token");

  try {
    const payload = {};
    if (observacao && observacao.trim()) {
      payload.observacao = observacao.trim();
    }

    const resposta = await api.patch(
      `/pagamentos-boletos/${id}/cancelar`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return resposta.data;
  } catch (error) {
    if (error.request && !error.response) {
      throw new Error("Servidor não respondeu, tente novamente");
    }

    if (error.response) {
      const mensagem =
        error.response.data?.erro?.mensagem ||
        error.response.data?.mensagem ||
        "Erro ao cancelar boleto";
      throw new Error(mensagem);
    }

    throw new Error("Erro inesperado na requisição");
  }
};

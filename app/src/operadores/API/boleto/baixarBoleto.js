import { api } from "../../../utils/conexaoAxios";

export const baixarBoleto = async (id, dados = {}) => {
  const token = localStorage.getItem("token");

  try {
    const payload = {};
    if (dados.dataPagamento) {
      payload.dataPagamento = dados.dataPagamento;
    }
    if (dados.observacao && dados.observacao.trim()) {
      payload.observacao = dados.observacao.trim();
    }

    const resposta = await api.patch(
      `/pagamentos-boletos/${id}/baixar`,
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
        "Erro ao confirmar baixa do boleto";
      throw new Error(mensagem);
    }

    throw new Error("Erro inesperado na requisição");
  }
};

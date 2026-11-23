import { api } from "../../../utils/conexaoAxios";

export const criarFormaPagamento = async (dados) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.post("/criar-forma-pagamento", dados, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return resposta.data;
  } catch (error) {
    if (error.request && !error.response) {
      throw new Error("Servidor não respondeu, tente novamente");
    }

    if (error.response) {
      const mensagem =
        error.response.data?.erro?.mensagem ||
        error.response.data?.mensagem ||
        "Erro ao cadastrar forma de pagamento";
      throw new Error(mensagem);
    }

    throw new Error("Erro inesperado na requisição");
  }
};

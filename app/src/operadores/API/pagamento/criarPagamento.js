import { api } from "../../../utils/conexaoAxios";

export const criarPagamento = async (dados) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.post("/pagamentos", dados, {
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
      const mensagem = error.response.data?.erro?.mensagem || "Erro inesperado ao registrar pagamento";
      throw new Error(mensagem);
    }

    throw new Error("Erro inesperado na requisição");
  }
};

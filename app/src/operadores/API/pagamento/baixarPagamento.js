import { api } from "../../../utils/conexaoAxios";

export const baixarPagamento = async (id, dados = { status: "baixado" }) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.put(`/pagamentos/${id}`, dados, {
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
      const mensagem = error.response.data?.erro?.mensagem || "Erro inesperado ao dar baixa no pagamento";
      throw new Error(mensagem);
    }

    throw new Error("Erro inesperado na requisição");
  }
};

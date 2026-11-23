import { api } from "../../../utils/conexaoAxios";

export const statusFormaPagamento = async (id, status) => {
  const token = localStorage.getItem("token");

  try {
    const payload = status ? { status } : {};
    const resposta = await api.patch(`/status-forma-pagamento/${id}`, payload, {
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
        "Erro ao alternar status da forma de pagamento";
      throw new Error(mensagem);
    }

    throw new Error("Erro inesperado na requisição");
  }
};

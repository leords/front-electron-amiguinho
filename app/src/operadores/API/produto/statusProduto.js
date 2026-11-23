import { api } from "../../../utils/conexaoAxios";

export const StatusProduto = async (id, status = null) => {
  const token = localStorage.getItem("token");
  const corpo = status ? { status } : {};

  try {
    const resposta = await api.patch(`/status-produto/${id}`, corpo, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return resposta.data;
  } catch (error) {
    // ❌ sem resposta (API fora, internet, etc)
    if (error.request && !error.response) {
      throw new Error("Servidor não respondeu, tente novamente");
    }

    // 🔥 erro vindo do backend (AppError)
    if (error.response) {
      console.log("error response: ", error.response);
      const mensagem =
        error.response.data?.erro?.mensagem ||
        error.response.data?.mensagem ||
        "Erro inesperado ao alterar status do produto";
      throw new Error(mensagem);
    }

    // fallback
    throw new Error("Erro inesperado na requisição");
  }
};

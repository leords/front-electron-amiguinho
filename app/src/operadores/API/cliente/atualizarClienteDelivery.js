import { api } from "../../../utils/conexaoAxios";

export const AtualizarClienteDelivery = async (id, dadosCliente) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.put(
      `/atualizar-cliente-delivery/${id}`,
      dadosCliente,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

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
        "Erro inesperado ao atualizar cliente delivery";
      throw new Error(mensagem);
    }

    // fallback
    throw new Error("Erro inesperado na requisição");
  }
};

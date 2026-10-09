import { api } from "../../../utils/conexaoAxios";

export const devolverPedidoExterno = async (pedidoIdOuUuid) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.patch(
      `/pedidos/externo/${pedidoIdOuUuid}/devolver`,
      {},
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
        error.response.data?.erro ||
        "Erro ao devolver pedido externo";
      throw new Error(mensagem);
    }

    throw new Error("Erro inesperado na requisição");
  }
};

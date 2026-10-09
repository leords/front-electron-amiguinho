import { apiLong } from "../../../utils/conexaoAxios";

export const adicionarPedidosCarga = async (cargaId, pedidosIds) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await apiLong.post(
      `/cargas/${cargaId}/pedidos`,
      { pedidosIds },
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
        "Erro inesperado ao adicionar pedidos à carga";
      throw new Error(mensagem);
    }

    throw new Error("Erro inesperado na requisição");
  }
};

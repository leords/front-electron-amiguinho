import { api } from "../../../utils/conexaoAxios";

export const EnviarEdicaoPedido = async (setor, uuid, formaPagamentoId, dados) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.put(`/editar-pedido/${setor}/${uuid}`,
      dados, //body
       {
      params: {
        formaPagamentoId
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return resposta.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.mensagem || "Erro ao editar pedido"
      );
    }
    if (error.request) {
      throw new Error("Servidor não respondeu, tente novamente");
    }
    throw new Error(error.message || "Erro inesperado");
  }
};

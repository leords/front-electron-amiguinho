import { api } from "../../../utils/conexaoAxios";

//dataInicio(2025-12-12), dataFim, vendedor(string)
export const buscarPedido = async (params = {}) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.get("/buscar-pedidos", {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return resposta.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.mensagem || "Erro ao pedidos"
      );
    }
    if (error.request) {
      throw new Error("Servidor não respondeu, tente novamente");
    }
    throw new Error(error.message || "Erro inesperado");
  }
};

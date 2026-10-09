import { api } from "../../../utils/conexaoAxios";

export const buscarRotaVendedor = async ({ data, usuarioId }) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.get("/localizacoes/vendedor", {
      params: {
        data,
        usuarioId,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return resposta.data?.resultado || resposta.data || [];
  } catch (error) {
    if (error.request && !error.response) {
      throw new Error("Servidor não respondeu, tente novamente");
    }

    if (error.response) {
      const mensagem =
        error.response.data?.erro?.mensagem ||
        error.response.data?.mensagem ||
        error.response.data?.erro ||
        "Erro ao buscar rota do vendedor";
      throw new Error(mensagem);
    }

    throw new Error("Erro inesperado na requisição da rota");
  }
};

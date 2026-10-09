import { api } from "../../../utils/conexaoAxios";

export const obterPendencia = async (id) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.get(`/pendencias/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return resposta.data?.resultado || resposta.data;
  } catch (error) {
    if (error.request && !error.response) {
      throw new Error("Servidor não respondeu, tente novamente");
    }

    if (error.response) {
      const mensagem = error.response.data?.erro?.mensagem || "Erro inesperado ao buscar detalhes da pendência";
      throw new Error(mensagem);
    }

    throw new Error("Erro inesperado na requisição");
  }
};

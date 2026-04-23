import { api } from "../../../utils/conexaoAxios";

export const ajusteEstoque = async (id, quantidade, usuarioId, tipo) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.post(`/ajuste-estoque/${id}`, 
      {quantidade, usuarioId, tipo},
      {headers: {
        Authorization: `Bearer ${token}`,
      }},
    );

    return resposta.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.mensagem || "Erro ao criar novo ajuste de estoque"
      );
    }
    if (error.request) {
      throw new Error("Servidor não respondeu, tente novamente");
    }
    throw new Error(error.message || "Erro inesperado");
  }
};

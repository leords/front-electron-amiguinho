import { api } from "../../../utils/conexaoAxios";

export const editarStatusFornecedor = async (id) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.patch(`/editar-status-fornecedor/${id}`,
    { 
        headers: {Authorization: `Bearer ${token}`} 
    }
    );

    return resposta.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.mensagem || "Erro ao editar fornecedor"
      );
    }
    if (error.request) {
      throw new Error("Servidor não respondeu, tente novamente");
    }
    throw new Error(error.message || "Erro inesperado");
  }
};

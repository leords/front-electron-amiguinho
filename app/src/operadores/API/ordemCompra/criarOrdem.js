import { api } from "../../../utils/conexaoAxios";

export const criarOrdem = async (usuarioId, fornecedorId, itens) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.post("/criar-ordem", 
      {usuarioId, fornecedorId, itens},
      {headers: {
        Authorization: `Bearer ${token}`,
      }},
    );

    return resposta.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.mensagem || "Erro ao buscar ordem de compra"
      );
    }
    if (error.request) {
      throw new Error("Servidor não respondeu, tente novamente");
    }
    throw new Error(error.message || "Erro inesperado");
  }
};

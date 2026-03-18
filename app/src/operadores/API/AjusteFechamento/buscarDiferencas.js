import { api } from "../../../utils/conexaoAxios";


export const buscarDiferencas = async (setor) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.get(`/buscar-diferencas-fechamento/${setor}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return resposta.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.mensagem || "Erro ao buscar movimentação"
      );
    }
    if (error.request) {
      throw new Error("Servidor não respondeu, tente novamente");
    }
    throw new Error(error.message || "Erro inesperado");
  }
};
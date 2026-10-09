import { apiLong } from "../../../utils/conexaoAxios";

export const concluirCarga = async (id, dadosFechamento = {}) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await apiLong.patch(
      `/cargas/${id}/concluir`,
      dadosFechamento,
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
        "Erro inesperado ao finalizar/concluir carga";
      throw new Error(mensagem);
    }

    throw new Error("Erro inesperado na requisição");
  }
};

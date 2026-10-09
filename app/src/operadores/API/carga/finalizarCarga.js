import { apiLong } from "../../../utils/conexaoAxios";

export const finalizarCarga = async (id) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await apiLong.patch(
      `/cargas/${id}/finalizar`,
      {},
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
      const mensagem = error.response.data?.erro?.mensagem || "Erro inesperado ao finalizar carga";
      throw new Error(mensagem);
    }

    throw new Error("Erro inesperado na requisição");
  }
};

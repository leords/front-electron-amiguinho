import { api } from "../../../utils/conexaoAxios";

export const StatusClienteExterno = async (id, status = null) => {
  const token = localStorage.getItem("token");
  const corpo = status ? { status } : {};

  try {
    const resposta = await api.patch(
      `/status-cliente-externo/${id}`,
      corpo,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return resposta.data;
  } catch (error) {
    if (error.request && !error.response) {
      throw new Error("Servidor não respondeu, tente novamente");
    }

    if (error.response) {
      console.log("error response: ", error.response);
      const mensagem =
        error.response.data?.erro?.mensagem ||
        error.response.data?.mensagem ||
        "Erro inesperado ao alterar status do cliente externo";
      throw new Error(mensagem);
    }

    throw new Error("Erro inesperado na requisição");
  }
};


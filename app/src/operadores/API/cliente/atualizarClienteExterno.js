import { api } from "../../../utils/conexaoAxios";

export const AtualizarClienteExterno = async (id, dadosCliente) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.put(
      `/atualizar-cliente-externo/${id}`,
      dadosCliente,
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
        "Erro inesperado ao atualizar cliente externo";
      throw new Error(mensagem);
    }

    throw new Error("Erro inesperado na requisição");
  }
};


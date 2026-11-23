import { api } from "../../../utils/conexaoAxios";

export const lerFormasPagamento = async (filtros = {}) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.get("/ler-formas-pagamento", {
      params: filtros,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return resposta.data;
  } catch (error) {
    if (error.request && !error.response) {
      throw new Error("Servidor não respondeu, tente novamente");
    }

    if (error.response) {
      const mensagem =
        error.response.data?.erro?.mensagem ||
        error.response.data?.mensagem ||
        "Erro inesperado ao consultar formas de pagamento";
      throw new Error(mensagem);
    }

    throw new Error("Erro inesperado na requisição");
  }
};

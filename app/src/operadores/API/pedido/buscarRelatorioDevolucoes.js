import { api } from "../../../utils/conexaoAxios";

export const buscarRelatorioDevolucoes = async ({
  dataInicio,
  dataFim,
  vendedor = "todos",
}) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.get("/pedidos/externo/relatorio-devolucoes", {
      params: { dataInicio, dataFim, vendedor },
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
      const mensagem =
        error.response.data?.erro?.mensagem ||
        error.response.data?.mensagem ||
        error.response.data?.erro ||
        "Erro ao buscar relatório de devoluções";
      throw new Error(mensagem);
    }

    throw new Error("Erro inesperado na requisição");
  }
};

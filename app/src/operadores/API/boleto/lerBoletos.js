import { api } from "../../../utils/conexaoAxios";

export const lerBoletos = async (filtros = {}) => {
  const token = localStorage.getItem("token");

  try {
    const params = {};
    if (filtros.status && filtros.status !== "todos") {
      params.status = filtros.status;
    }
    if (filtros.setor && filtros.setor !== "todos") {
      params.setor = filtros.setor;
    }
    if (filtros.dataInicio) {
      params.dataInicio = filtros.dataInicio;
    }
    if (filtros.dataFim) {
      params.dataFim = filtros.dataFim;
    }
    if (filtros.termo && filtros.termo.trim()) {
      params.termo = filtros.termo.trim();
    }

    const resposta = await api.get("/pagamentos-boletos", {
      params,
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
        "Erro inesperado ao consultar boletos";
      throw new Error(mensagem);
    }

    throw new Error("Erro inesperado na requisição");
  }
};

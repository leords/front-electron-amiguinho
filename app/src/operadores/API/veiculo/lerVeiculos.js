import { api } from "../../../utils/conexaoAxios";

export const lerVeiculos = async (params = {}) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.get("/veiculos", {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = resposta.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
      if (Array.isArray(data.veiculos)) return data.veiculos;
      if (Array.isArray(data.resultado)) return data.resultado;
      if (Array.isArray(data.dados)) return data.dados;
      if (Array.isArray(data.data)) return data.data;
      if (Array.isArray(data.lista)) return data.lista;
    }

    return [];
  } catch (error) {
    if (error.request && !error.response) {
      throw new Error("Servidor não respondeu, tente novamente");
    }

    if (error.response) {
      const mensagem =
        error.response.data?.erro?.mensagem ||
        "Erro inesperado ao buscar veículos";
      throw new Error(mensagem);
    }

    throw new Error("Erro inesperado na requisição");
  }
};

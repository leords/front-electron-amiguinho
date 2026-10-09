import { api } from "../../../utils/conexaoAxios";

export const buscarMetricasDesconto = async (params = {}) => {
  const token = localStorage.getItem("token");

  const paramsLimpos = { ...params };
  if (paramsLimpos.setor === "todos" || paramsLimpos.setor === "geral") {
    delete paramsLimpos.setor;
  }
  if (paramsLimpos.vendedor === "todos") {
    delete paramsLimpos.vendedor;
  }
  // Remove propriedades vazias
  Object.keys(paramsLimpos).forEach((key) => {
    if (
      paramsLimpos[key] === "" ||
      paramsLimpos[key] === null ||
      paramsLimpos[key] === undefined
    ) {
      delete paramsLimpos[key];
    }
  });

  try {
    const resposta = await api.get("/descontos/metricas", {
      params: paramsLimpos,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return resposta.data;
  } catch (error) {
    console.warn("[buscarMetricasDesconto] Erro na rota principal /descontos/metricas:", error?.response?.status || error?.message);

    // Fallback 1: Rota singular /desconto/metricas
    if (error.response?.status === 404) {
      try {
        const respostaAlt = await api.get("/desconto/metricas", {
          params: paramsLimpos,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return respostaAlt.data;
      } catch (errAlt) {
        console.warn("[buscarMetricasDesconto] Fallback /desconto/metricas também falhou:", errAlt?.message);
      }
    }

    if (error.request && !error.response) {
      throw new Error("Servidor não respondeu, tente novamente");
    }

    if (error.response) {
      const mensagem =
        error.response.data?.erro?.mensagem ||
        error.response.data?.mensagem ||
        "Erro ao buscar métricas de desconto";
      throw new Error(mensagem);
    }

    throw new Error("Erro inesperado na requisição");
  }
};

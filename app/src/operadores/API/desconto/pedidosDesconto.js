import { api } from "../../../utils/conexaoAxios";

export const buscarPedidosDesconto = async (params = {}) => {
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
    const resposta = await api.get("/descontos/pedidos", {
      params: paramsLimpos,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return resposta.data;
  } catch (error) {
    console.warn("[buscarPedidosDesconto] Erro em /descontos/pedidos:", error?.response?.status || error?.message);

    // Fallback 1: Rota /descontos
    if (error.response?.status === 404) {
      try {
        const respostaAlt = await api.get("/descontos", {
          params: paramsLimpos,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return respostaAlt.data;
      } catch (errAlt) {
        console.warn("[buscarPedidosDesconto] Fallback /descontos falhou:", errAlt?.message);
      }

      // Fallback 2: Rota /desconto/pedidos
      try {
        const respostaAlt2 = await api.get("/desconto/pedidos", {
          params: paramsLimpos,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return respostaAlt2.data;
      } catch (errAlt2) {
        console.warn("[buscarPedidosDesconto] Fallback /desconto/pedidos falhou:", errAlt2?.message);
      }
    }

    if (error.request && !error.response) {
      throw new Error("Servidor não respondeu, tente novamente");
    }

    if (error.response) {
      const mensagem =
        error.response.data?.erro?.mensagem ||
        error.response.data?.mensagem ||
        "Erro ao listar pedidos com desconto";
      throw new Error(mensagem);
    }

    throw new Error("Erro inesperado na requisição");
  }
};

import { api } from "../../../utils/conexaoAxios";

export const buscarOrdem = async (params = {}) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.get("/buscar-ordem", {
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
      
      // 🔥 mantém erro original do backend
      throw error
    }
  };
  
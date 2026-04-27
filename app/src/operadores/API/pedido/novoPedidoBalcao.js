import { api } from "../../../utils/conexaoAxios";

export const NovoPedidoBalcao = async (setor, dados) => {
  const token = localStorage.getItem("token");
  try {
    //balcao, externo, delivery
    const resposta = await api.post(
      `/novo-pedido/${setor}`,
      { setor, dados },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return resposta.data;
  } catch (error) {
      if (error.request && !error.response) {
        throw new Error("Servidor não respondeu, tente novamente");
      }
      
      // 🔥 mantém erro original do backend
      throw error
    }
  };

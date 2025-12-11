import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 5000,
});

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
    if (error.response) {
      console.log(error.response.data);
      throw new Error(error.response.data.error || "Erro ao enviar pedido");
    }
    if (error.request) {
      throw new Error("Servidor não respondeu, tente novamente");
    }

    throw new Error(error.message || "Erro inesperado");
  }
};

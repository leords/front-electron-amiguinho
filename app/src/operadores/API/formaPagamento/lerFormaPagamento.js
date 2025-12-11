import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 5000,
});
// parametros da rota:
// StatusPossiveis = ['ATIVO', 'INATIVO']
// possivelSolicitante = ['BALCAO', 'GERAL']

export const LerFormaPagamento = async (params = {}) => {
  const token = localStorage.getItem("token");
  try {
    const resposta = await api.get("/ler-formas-pagamento", {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return resposta.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.mensagem || "Erro ao ler formas de pagamento"
      );
    }
    if (error.request) {
      throw new Error("Servidor não respondeu, tente novamente");
    }
    throw new Error(error.message || "Erro inesperado");
  }
};

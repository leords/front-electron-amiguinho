import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 20000,
});

export const buscarFormaPagamento = async () => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.get("/buscar-formas-pagamento", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("Requisição de buscar formas de pagamento realizada!")
    return resposta.data;

  } catch (error) {
    console.log("error", error)
    if (error.response) {
      throw new Error(error.response.data || "Erro ao buscar formas de pagamentos");
    }
    if (error.request) {
      throw new Error("Servidor não respondeu. Tente novamente.");
    }
    throw new Error(error.message || "Erro inesperado");
  }
};

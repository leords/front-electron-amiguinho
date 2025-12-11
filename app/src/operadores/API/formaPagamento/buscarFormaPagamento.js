import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 5000,
});

export const buscarFormaPagamento = async (params = {}) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.get("/buscar-formas-pagamento", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // sempre que é retorno da api = .data
    return resposta.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        //pegando o erro vindo do backend
        error.response.data || "Erro ao buscar formas de pagamentos"
      );
    }
    if (error.request) {
      // Requisição enviada, mas backend não respondeu
      throw new Error("Servidor não respondeu. Tente novamente.");
    }
    // Erros internos (axios, rede, js, etc)
    throw new Error(error.message || "Erro inesperado");
  }
};

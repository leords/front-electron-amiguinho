import axios from "axios";

export const testeServidor = async (dominio) => {

// dominio vem do link do servidor configurada na primeira tela do sistema
  try {
    const resposta = await axios.get(`http://${dominio}:4000/online`, {
      timeout: 3000
    });

    return resposta.data;
  } catch (error) {

    // ❌ sem resposta (API fora, internet, etc)
    if (error.request && !error.response) {
      throw new Error("Servidor não respondeu, tente novamente");
    }

    // 🔥 erro vindo do backend (AppError)
    if (error.response) {
      console.log("error response: ", error.response)
      const mensagem = error.response.data?.erro.mensagem || "Erro inesperado";
      throw new Error(mensagem);
    }

    // fallback
    throw new Error("Erro inesperado na requisição");
  }

};
import axios from "axios";

export const testeServidor = async (dominio) => {

// dominio vem do link do servidor configurada na primeira tela do sistema
  try {
    const resposta = await axios.get(`http://${dominio}:4000/online`, {
      timeout: 3000
    });

    return resposta.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.mensagem || "Erro ao buscar movimentação"
      );
    }
    if (error.request) {
      throw new Error("Servidor não respondeu, tente novamente");
    }
    throw new Error(error.message || "Erro inesperado");
  }
};
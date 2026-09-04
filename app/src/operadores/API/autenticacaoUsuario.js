import { api } from "../../utils/conexaoAxios";

export const authAPI = async (credenciais) => {
  try {
    const resposta = await api.post("/login", credenciais);

    return resposta.data;

  } catch (error) {

    // Sem resposta da API
    // Pode ser servidor desligado, problema de rede,
    // timeout, endereço incorreto etc.
    if (error.request && !error.response) {
      throw new Error("Servidor não respondeu, tente novamente");
    }

    // 🔥 Resposta recebida da API
    // Aqui entram os erros lançados pelo AppError
    if (error.response) {
      console.log("error response:", error.response);

      const mensagem =
        error.response.data?.erro?.mensagem ||
        "Erro inesperado";

      throw new Error(mensagem);
    }

    // ❌ Erro inesperado
    throw new Error("Erro inesperado na requisição");
  }
};
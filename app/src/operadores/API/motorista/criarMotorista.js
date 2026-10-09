import { api } from "../../../utils/conexaoAxios";

export const criarMotorista = async (dados) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.post("/motoristas", dados, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return resposta.data;
  } catch (error) {
    if (error.request && !error.response) {
      throw new Error("Servidor não respondeu, tente novamente");
    }

    if (error.response) {
      const mensagem = error.response.data?.erro?.mensagem || "Erro inesperado ao cadastrar motorista";
      throw new Error(mensagem);
    }

    throw new Error("Erro inesperado na requisição");
  }
};

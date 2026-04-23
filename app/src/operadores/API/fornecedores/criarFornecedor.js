import { api } from "../../../utils/conexaoAxios";

export const criarFornecedor = async (nome, cnpj, telefone, vendedor) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.post("/criar-fornecedor", 
      {nome, cnpj, telefone, vendedor},
      {headers: {
        Authorization: `Bearer ${token}`,
      }},
    );

    return resposta.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.mensagem || "Erro ao criar novo fornecedor"
      );
    }
    if (error.request) {
      throw new Error("Servidor não respondeu, tente novamente");
    }
    throw new Error(error.message || "Erro inesperado");
  }
};

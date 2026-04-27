import { api } from "../../../utils/conexaoAxios";

export const criarOrdem = async (usuarioId, fornecedorId, itens) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.post("/criar-ordem", 
      {usuarioId, fornecedorId, itens},
      {headers: {
        Authorization: `Bearer ${token}`,
      }},
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
  

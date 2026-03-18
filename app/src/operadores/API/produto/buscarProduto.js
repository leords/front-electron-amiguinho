import { apiLong } from "../../../utils/conexaoAxios";

export const BuscarProduto = async () => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await apiLong.get("/buscar-produtos", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log("Requisição de buscar produtos realizada!")
    return resposta.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data || "Erro ao buscar produtos");
    }
    if (error.request) {
      throw new Error("Servidor não respondeu, tente novamente");
    }
    throw new Error(error.message || "Erro inesperado");
  }
};

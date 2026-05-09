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
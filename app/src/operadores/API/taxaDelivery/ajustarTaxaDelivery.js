import { api } from "../../../utils/conexaoAxios";


export const ajustarTaxaDelivery = async (valor) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.post("/ajustar-taxa-delivery", 
      { valor },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("Requisição de ajustar taxa de delivery")
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
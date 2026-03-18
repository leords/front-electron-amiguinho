import { apiLong } from "../../../utils/conexaoAxios";


export const BuscarClienteDelivery = async () => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await apiLong.post("/coletar-clientes-delivery", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("Requisição de buscar clientes delivery realizada!")
    return resposta.data;

  } catch (error) {
    console.log("error", error)
    if (error.response) {
      throw new Error(error.response.data || "Erro ao buscar clientes delivery");
    }
    if (error.request) {
      throw new Error("Servidor não respondeu. Tente novamente.");
    }
    throw new Error(error.message || "Erro inesperado");
  }
};

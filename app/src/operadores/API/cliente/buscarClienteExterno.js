import { apiLong } from "../../../utils/conexaoAxios";


export const BuscarClienteExterno = async () => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await apiLong.post("/coletar-clientes-externo", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("Requisição de buscar clientes externos realizada!")
    return resposta.data;

  } catch (error) {
    console.log("error", error)
    if (error.response) {
      throw new Error(error.response.data || "Erro ao buscar clientes externos");
    }
    if (error.request) {
      throw new Error("Servidor não respondeu. Tente novamente.");
    }
    throw new Error(error.message || "Erro inesperado");
  }
};

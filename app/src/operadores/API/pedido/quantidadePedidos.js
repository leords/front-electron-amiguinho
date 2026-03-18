import { api } from "../../../utils/conexaoAxios";

//:setor, dataInicio(2025-12-26), dataFim
export const QuantidadePedidos = async (setor, params = {}) => {
    const token = localStorage.getItem("token");

    try {
        const resposta = await api.get(`/quantidade-pedidos/${setor}`, {
            params,
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return resposta.data;
    } catch (error) {
        if(error.response) {
            throw new Error(error.response.data.mensagem || "Erro ao buscar a quantidade de pedidos")
        }
        if(error.request) {
            throw new Error("Servidor não respondeu, tente novamente")
        }
        throw new Error(error.message || "Erro inesperado")
        
    }
}

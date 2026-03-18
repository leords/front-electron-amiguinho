import { api } from "../../../utils/conexaoAxios";

export const TotalVendasPeriodo = async (setor, params = {}) => {
    const token = localStorage.getItem("token");

    try {
        const resposta = await api.get(`/total-vendas-periodo/${setor}`, {
            params,
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return resposta.data;   
    } catch (error) {
        if(error.response) {
            throw new Error(error.response.data.mensagem || "Erro ao buscar o total de vendas")
        }
        if(error.request) {
            throw new Error("Servidor não respondeu, tente novamente")
        }
        throw new Error(error.message || "Erro inesperado")
    
    }
}
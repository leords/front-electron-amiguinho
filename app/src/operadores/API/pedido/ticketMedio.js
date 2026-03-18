import { api } from "../../../utils/conexaoAxios";

export const TicketMedio = async (setor, params={}) => {
    const token = localStorage.getItem("token")

    try {
        const resposta = await api.get(`/ticket-medio/${setor}`, {
            params,
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return resposta.data
    } catch (error) {
        if(error.response) {
            throw new Error(error.response.data.mensagem || "Erro ao buscar o ticket medio")
        }
        if(error.request) {
            throw new Error("Servidor não respondeu, tente novamente")
        }
        throw new Error(error.message ) 
    }
}
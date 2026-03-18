import { api } from "../../../utils/conexaoAxios";


// vendedor(b1 ou b2), data(2025-12-12)
export const BuscarFechamentoBalcaoDia = async (params = {}) => {
    const token = localStorage.getItem("token")

    try {
        const resposta = await api.get("/buscar-fechamento-balcao-dia", {
            params,
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return resposta.data
    } catch (error) {
        if(error.response) {
            throw new Error(error.response.data.mensagem || "Erro ao buscar o fechamendo do balcao")
        }
        if(error.request) {
            throw new Error("Servidor não respondeu, tente novamente")
        }
        throw new Error(error.message ) 
    }
}
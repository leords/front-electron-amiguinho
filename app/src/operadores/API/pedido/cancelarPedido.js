import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 5000
});

export const CancelarPedido = async (setor, id) => {
    const token = localStorage.getItem("token");

    try {
        const resposta = await api.patch(`/cancelar-pedido/${setor}/${id}`, 
            {}, // boyde vazio
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        )
        return resposta.data;
    } catch (error) {
        if(error.response) {
            throw new Error(error.response.data.mensagem || "Erro ao cancelar pedido")
        }
        if(error.request) {
            throw new Error("Servidor não respondeu, tente novamente")
        }
        throw new Error(error.message || "Erro inesperado")
    
    }
}
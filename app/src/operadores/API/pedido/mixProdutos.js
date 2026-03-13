import axios from "axios";


const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 5000
    });

export const MixProdutos = async (setor, params = {}) => {
    const token = localStorage.getItem("token");

    try {
        const resposta = await api.get(`/relatorio-mix-produtos/${setor}`, {
            params,
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return resposta.data;
    } catch (error) {
        if(error.response) {
            throw new Error(error.response.data.mensagem || "Erro ao buscar o mix de produtos")
        }
        if(error.request) {
            throw new Error("Servidor não respondeu, tente novamente")
        }
        throw new Error(error.message || "Erro inesperado")
    }
}
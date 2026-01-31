import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 5000
});
// :setor, dataInicio(2025-12-12), dataFim(2025-12-12)
export const TopProdutos = async (setor, params = {}) => { 
    const token = localStorage.getItem("token");

    try {
        const resposta = await api.get(`/intervalo-temporal/${setor}`, {
            params,
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return resposta.data;
    } catch (error) {
        if(error.response) {
            throw new Error(error.response.data.mensagem || "Erro ao buscar os top produtos");
        }
        if(error.request) {
            throw new Error("Servidor não respondeu, tente novamente");
        }
        throw new Error(error.message || "Erro inesperado");
    }
 }
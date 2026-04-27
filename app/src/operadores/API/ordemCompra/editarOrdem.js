import { api } from "../../../utils/conexaoAxios";

export const editarOrdem = async (id, status, usuarioId) => {
  const token = localStorage.getItem("token");

  try {
    const resposta = await api.patch(`/editar-ordem/${id}`,
    { usuarioId, status },
    { headers: {Authorization: `Bearer ${token}`} }
    );

    return resposta.data;
  } catch (error) {
    if (error.request && !error.response) {
      throw new Error("Servidor não respondeu, tente novamente");
    }
    
    // 🔥 mantém erro original do backend
    throw error
  }
};

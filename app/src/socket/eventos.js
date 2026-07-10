import { socket } from "../utils/socket.js"


export function registrarEventosSocket(onLocation) {
    socket.off("localizacao_recebida");

    socket.on("localizacao_recebida", (dados) => {
        onLocation(dados);
    });
}
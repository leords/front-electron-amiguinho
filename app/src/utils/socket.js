import { io } from "socket.io-client";

const servidor = import.meta.env.VITE_API_URL

export const socket = io(servidor, {
    autoConnect: false
});

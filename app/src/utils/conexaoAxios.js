import axios from "axios";

function getBaseURL() {
  const servidor = localStorage.getItem('dominio');

  return servidor
    ? `http://${servidor}:4000`
    : import.meta.env.VITE_API_URL;
}

export const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 5000,
});

export const apiLong = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
});





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


// Aqui é interceptado todos os responses que passarem por esta instância api

api.interceptors.response.use((response) => response, (error) => {

    if(error.response?.status === 401) {

      localStorage.removeItem('token')

      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

apiLong.interceptors.response.use((response) => response, (error) => {

    if(error.response?.status === 401) {

      localStorage.removeItem('token')

      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)
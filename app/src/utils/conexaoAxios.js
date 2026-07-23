import axios from "axios";

function getBaseURL() {
  const servidor = import.meta.env.VITE_API_URL

  return servidor || "https://www.amigaodistribuidora.com.br"
}

export const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 5000,
});

export const apiLong = axios.create({
  baseURL: getBaseURL(),
  timeout: 50000,
});


// Aqui é interceptado todos os responses que passarem por esta instância api

api.interceptors.response.use((response) => response, (error) => {

    if(error.response?.status === 401) {

      localStorage.removeItem('token')

      window.location.href = '/'
    }

    return Promise.reject(error)
  }
)

apiLong.interceptors.response.use((response) => response, (error) => {

    if(error.response?.status === 401) {

      localStorage.removeItem('token')

      window.location.href = '/'
    }

    return Promise.reject(error)
  }
)
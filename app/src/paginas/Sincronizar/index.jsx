import { useEffect, useState } from "react"
import Loading from "../../componentes/Loading/index.jsx"
import Menu from "../Menu/index.jsx"
import { usarToast } from "../../componentes/Context/toastContext.jsx"
import { buscarFormaPagamento } from "../../operadores/API/formaPagamento/buscarFormaPagamento.js"

export default function Sincronizar() {

  const { setMensagem } = usarToast()
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function iniciar() {
      try {
        await buscarFormaPagamento(),
        // dispara sync sem esperar terminar
        fetch("https://node-prisma-amiguinho.onrender.com/sincronizar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          }
        })

        setMensagem("Sincronização iniciada em segundo plano")
      } catch (error) {
        console.log(error.message)
        setMensagem("Erro ao iniciar sincronização")
      } finally {
        setCarregando(false)
      }
    }

    iniciar()
  }, [])

  if (carregando) {
    return <Loading />
  }

  return (
    <>
      <Menu />
    </>
  )
}
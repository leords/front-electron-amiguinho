import { useEffect, useState } from "react"
import Loading from "../../componentes/Loading/index.jsx";
import Menu from "../Menu/index.jsx";
import { buscarFormaPagamento } from "../../operadores/API/formaPagamento/buscarFormaPagamento.js";
import { BuscarProduto } from "../../operadores/API/produto/buscarProduto.js";


export default function Sincronizar() {

    const [carregando, setCarregando] = useState(true)

    useEffect(() => {
        async function sincronizar() {
            const tempoMinimo = 10000;
            const inicio = Date.now(); //pega data do inicio da execução

            try {
                await Promise.all([
                    buscarFormaPagamento(),
                    BuscarProduto()
                ])
                
            } catch (error) {
                console.error(error)
}           finally {
                
                const tempoPassado = Date.now() - inicio // pega data final da execução - a de inicio
                const restante = tempoMinimo - tempoPassado // final - inicio
                
                if(restante > 0) {
                    // aguarda o tempo de restante em setTimeout
                    await new Promise(resolve => setTimeout(resolve, restante))
                }
                
                setCarregando(false)
            }
        }

        sincronizar();
    }, []);



    if(carregando) {
        return <Loading />
    }

    return ( 
        <>
            <Menu />
        </>
    )
}
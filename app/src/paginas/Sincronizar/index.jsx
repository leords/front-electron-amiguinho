import { useEffect, useState } from "react"
import Loading from "../../componentes/Loading/index.jsx";
import Menu from "../Menu/index.jsx";
import { buscarFormaPagamento } from "../../operadores/API/formaPagamento/buscarFormaPagamento.js";
import { BuscarProduto } from "../../operadores/API/produto/buscarProduto.js";
import { usarToast } from "../../componentes/Context/toastContext.jsx";


export default function Sincronizar() {

    // Hook
    const { setMensagem } = usarToast();

    // estados
    const [carregando, setCarregando] = useState(true)

    // sincroniza produtos e formas de pagamento
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
                console.log(error.message)
                setMensagem(error.message)
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


    // Loading
    if(carregando) {
        return <Loading />
    }

    return ( 
        <>
            <Menu />
        </>
    )
}
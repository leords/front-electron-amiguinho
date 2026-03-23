import { useLocation } from "react-router-dom"
import Cabecalho from "../../componentes/Cabecalho"
import Rodape from "../../componentes/Rodape"

export default function EditarPedido() {

    const {state} = useLocation()

    return(
        <div>
            <Cabecalho />
            <h1>{state.status}</h1> 

            <Rodape />
        </div>
    )
}
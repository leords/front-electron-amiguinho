import { dataHoraFormatada } from "../../utils/data";
import { formatarMoeda } from "../../utils/formartarMoeda";
import styles from "./styles.module.css";
import { useNavigate } from "react-router-dom";



export default function PedidoHistoricoDelivery({ pedidos }) {
  const navegar = useNavigate();


  return (
    <div className={styles.container}> 
      <table className={styles.tabela}>
        <tbody>
          {pedidos.map((pedido, index) => (
            <tr
              key={index}
              onClick={() => navegar("/reimprimir", { state: pedido })}
            >
              <td>{pedido.id}</td>
              <td>{dataHoraFormatada(pedido.data)}</td>
              <td>{pedido.cliente.nome}</td>
              
              <td>{pedido.vendedor}</td>
              <td>
                {formatarMoeda(pedido.total)}
              </td>
              <td>{pedido.formaPagamento.nome}</td>
              <td className={`${ pedido.status === 'carregado' 
                ? styles.carregado 
                : pedido.status === 'ENTREGUE' 
                ? styles.entregue 
                : styles.cancelado}`}>
                  {pedido.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

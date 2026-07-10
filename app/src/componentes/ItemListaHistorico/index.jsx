import { dataHoraFormatada } from "../../utils/data";
import { formatarMoeda } from "../../utils/formartarMoeda";
import styles from "./styles.module.css";
import { useNavigate } from "react-router-dom";



export default function PedidoHistorico({ pedidos }) {
  const navegar = useNavigate();

  return (
    <div className={styles.container}>
      <table className={styles.tabela}>
        <tbody>
          {pedidos.map((pedido, index) => (
            <tr
              key={index}
              onClick={() => navegar("/reimprimir", { state: pedido })}
              className={pedido.status === 'cancelado' ? styles.validaStatus : ''}
            >
              <td>{pedido.id}</td>
             
              
              <td>{dataHoraFormatada(pedido.data)}</td>
              <td>{pedido.tipo === 'delivery' ? `delivery - ${pedido.vendedor}` : `${pedido.vendedor} - ${pedido.nomeUsuario}`}</td>
              <td>
                {formatarMoeda(pedido.total)}
              </td>
              {pedido.tipo === 'balcao' ?
                <td>
                  {pedido.pagamentos
                    .map((p) => p.formaPagamento.nome)
                    .join(" | ")}
                </td>
                :
                <td>
                  {pedido.formaPagamento?.nome}
                </td>
              }

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

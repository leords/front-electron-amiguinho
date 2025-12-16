import { dataFormatada, dataHoraFormatada } from "../../utils/data";
import styles from "./styles.module.css";
import { useNavigate } from "react-router-dom";

export default function PedidoHistorico({ pedidos }) {
  const navegar = useNavigate();

  console.log("pedidos: ", pedidos);

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
              <td>{`${pedido.vendedor} - ${pedido.nomeUsuario}`}</td>
              <td>
                {pedido.total.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </td>
              <td>{pedido.formaPagamento.nome}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

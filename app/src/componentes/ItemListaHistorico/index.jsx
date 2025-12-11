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
              <td>{pedido.data}</td>

              <td>
                {pedido.total.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </td>
              <td>{pedido.quantidadeItens}</td>
              <td>{pedido.formaPagamento}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

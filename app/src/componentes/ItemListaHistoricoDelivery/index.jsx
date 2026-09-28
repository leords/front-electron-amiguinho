import { dataHoraFormatada } from "../../utils/data";
import { formatarMoeda } from "../../utils/formartarMoeda";
import styles from "./styles.module.css";
import { useNavigate } from "react-router-dom";

export default function PedidoHistoricoDelivery({ pedidos = [] }) {
  const navegar = useNavigate();

  const obterClasseStatus = (status) => {
    const statusNormalizado = status?.toUpperCase();
    if (statusNormalizado === "CARREGADO") return styles.statusCarregado;
    if (statusNormalizado === "ENTREGUE") return styles.statusEntregue;
    if (statusNormalizado === "CANCELADO") return styles.statusCancelado;
    return styles.statusPadrao;
  };

  return (
    <div className={styles.container}>
      <table className={styles.tabela}>
        <thead>
          <tr>
            <th className={styles.colId}>ID</th>
            <th className={styles.colData}>Data / Hora</th>
            <th className={styles.colCliente}>Cliente</th>
            <th className={styles.colVendedor}>Vendedor / Entregador</th>
            <th className={styles.colTotal}>Total</th>
            <th className={styles.colPagamento}>Pagamento</th>
            <th className={styles.colStatus}>Status</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => (
            <tr
              key={pedido.id}
              onClick={() => navegar("/reimprimir", { state: pedido })}
              className={
                pedido.status?.toLowerCase() === "cancelado"
                  ? styles.linhaCancelada
                  : ""
              }
            >
              <td className={styles.colId}>#{pedido.id}</td>
              <td className={styles.colData}>
                {dataHoraFormatada(pedido.data)}
              </td>
              <td
                className={styles.colCliente}
                title={pedido.cliente?.nome || ""}
              >
                {pedido.cliente?.nome || "Consumidor"}
              </td>
              <td className={styles.colVendedor} title={pedido.vendedor || ""}>
                {pedido.vendedor || "—"}
              </td>
              <td className={styles.colTotal}>
                <strong>{formatarMoeda(pedido.total || 0)}</strong>
              </td>
              <td
                className={styles.colPagamento}
                title={pedido.formaPagamento?.nome || ""}
              >
                {pedido.formaPagamento?.nome || "—"}
              </td>
              <td className={styles.colStatus}>
                <span
                  className={`${styles.badgeStatus} ${obterClasseStatus(pedido.status)}`}
                >
                  {pedido.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

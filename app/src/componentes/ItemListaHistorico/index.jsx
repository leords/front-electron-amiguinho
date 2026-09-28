import { useState } from "react";
import { dataHoraFormatada } from "../../utils/data";
import { formatarMoeda } from "../../utils/formartarMoeda";
import styles from "./styles.module.css";
import { useNavigate } from "react-router-dom";
import { CheckCircleIcon, CircleIcon } from "@phosphor-icons/react";

export default function PedidoHistorico({ pedidos }) {
  const navegar = useNavigate();

  const [clientesConferidos, setClientesConferidos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("clientesPixConferidos")) || {};
    } catch {
      return {};
    }
  });

  const alternarConferencia = (uuid) => {
    if (!uuid) return;
    setClientesConferidos((atual) => {
      const novoEstado = {
        ...atual,
        [uuid]: !atual[uuid],
      };
      localStorage.setItem("clientesPixConferidos", JSON.stringify(novoEstado));
      return novoEstado;
    });
  };

  const extrairPagamento = (pedido) => {
    if (pedido.tipo === "balcao" && Array.isArray(pedido.pagamentos)) {
      return pedido.pagamentos
        .map((p) => p.formaPagamento?.nome || "-")
        .join(" | ");
    }
    return pedido.formaPagamento?.nome || "-";
  };

  const extrairOrigemVendedor = (pedido) => {
    if (pedido.tipo === "delivery") {
      return `Delivery · ${pedido.vendedor || "-"}`;
    }
    const balcao = pedido.vendedor || "Balcão";
    const operador = pedido.nomeUsuario ? ` · ${pedido.nomeUsuario}` : "";
    return `${balcao}${operador}`;
  };

  return (
    <div className={styles.container}>
      <table className={styles.tabela}>
        <thead>
          <tr>
            <th className={styles.colId}>ID</th>
            <th className={styles.colData}>Data / Hora</th>
            <th className={styles.colOrigem}>Balcão · Operador</th>
            <th className={styles.colCliente}>Cliente</th>
            <th className={styles.colTotal}>Total</th>
            <th className={styles.colPagamento}>Pagamento</th>
            <th className={styles.colConferencia} title="Conferência PIX">
              Conf.
            </th>
          </tr>
        </thead>

        <tbody>
          {pedidos.map((pedido) => {
            const conferido =
              !!clientesConferidos[pedido.clienteId || pedido.id];

            return (
              <tr
                key={pedido.id}
                onClick={() => navegar("/reimprimir", { state: pedido })}
                className={`
                  ${pedido.status === "cancelado" ? styles.validaStatus : ""}
                  ${conferido ? styles.pixConferido : ""}
                `}
              >
                <td className={styles.colId}>#{pedido.id}</td>
                <td className={styles.colData}>
                  {dataHoraFormatada(pedido.data)}
                </td>
                <td className={styles.colOrigem}>
                  {extrairOrigemVendedor(pedido)}
                </td>
                <td className={styles.colCliente}>
                  {pedido.tipo !== "balcao" && pedido.cliente?.nome
                    ? pedido.cliente.nome
                    : "—"}
                </td>
                <td className={styles.colTotal}>
                  <strong>{formatarMoeda(pedido.total || 0)}</strong>
                </td>
                <td className={styles.colPagamento}>
                  {extrairPagamento(pedido)}
                </td>
                <td
                  className={styles.colConferencia}
                  onClick={(e) => {
                    e.stopPropagation();
                    alternarConferencia(pedido.clienteId || pedido.id);
                  }}
                >
                  <button
                    type="button"
                    className={`${styles.btnConferencia} ${conferido ? styles.btnConferido : ""}`}
                    aria-label="Alternar conferência"
                  >
                    {conferido ? (
                      <CheckCircleIcon size={18} weight="fill" />
                    ) : (
                      <CircleIcon size={18} weight="bold" />
                    )}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

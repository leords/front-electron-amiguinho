import { useState } from "react";
import { dataHoraFormatada } from "../../utils/data";
import { formatarMoeda } from "../../utils/formartarMoeda";
import styles from "./styles.module.css";
import { useNavigate } from "react-router-dom";

export default function PedidoHistorico({ pedidos }) {
  const navegar = useNavigate();

  // json.parse tranforma em objeto
  const [clientesConferidos, setClientesConferidos] = useState(() => {
    return JSON.parse(localStorage.getItem("clientesPixConferidos")) || {};
  });

  // cria uma lista para conferencia de pedido.
  // criado para o usuario identificar pedidos com pix conferidos
  const alternarConferencia = (uuid) => {
    setClientesConferidos((atual) => {
      const novoEstado = {
        ...atual,
        [uuid]: !atual[uuid], //O [uuid] usa o valor da variável como nome da propriedade
      };

      localStorage.setItem("clientesPixConferidos", JSON.stringify(novoEstado));

      return novoEstado;
    });
  };

  return (
    <div className={styles.container}>
      <table className={styles.tabela}>
        <tbody>
          {pedidos.map((pedido, index) => (
            <tr
              key={index}
              onClick={() => navegar("/reimprimir", { state: pedido })}
              className={`
                ${pedido.status === "cancelado" ? styles.validaStatus : ""}
                ${clientesConferidos[pedido.clienteId] ? styles.pixConferido : ""}
              `}
            >
              <td>{pedido.id}</td>

              <td>{dataHoraFormatada(pedido.data)}</td>
              <td>{pedido.tipo !== "balcao" && pedido.cliente.nome}</td>
              <td>
                {pedido.tipo === "delivery"
                  ? `delivery - ${pedido.vendedor}`
                  : `${pedido.vendedor} - ${pedido.nomeUsuario}`}
              </td>
              <td>{formatarMoeda(pedido.total)}</td>
              {pedido.tipo === "balcao" ? (
                <td>
                  {pedido.pagamentos
                    .map((p) => p.formaPagamento.nome)
                    .join(" | ")}
                </td>
              ) : (
                <td>{pedido.formaPagamento?.nome}</td>
              )}
              <td
                onClick={(e) => {
                  e.stopPropagation(); // não deixa chegar no <tr> não chama a função do elemento pai.
                  alternarConferencia(pedido.clienteId);
                }}
              >
                {clientesConferidos[pedido.clienteId] ? "✓" : "o"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

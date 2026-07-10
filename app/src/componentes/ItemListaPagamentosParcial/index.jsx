import styles from "./styles.module.css";
import { TrashIcon, WarningCircleIcon } from "@phosphor-icons/react";

export default function ItemListaPagamentosParcial({
  index,
  pagamento,
  onRemover,
  botaoRemover = true,

}) {

  return (
    <div className={styles.container}>
      <table className={styles.tabela}>
        <tbody>
          <tr>
            <td>{index + 1}</td>
            <td>{pagamento.nomeFormaPagamentoParcial}</td>
            <td>
              {pagamento.valorParcialFormaPagamento.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </td>

            {botaoRemover ? (
              <td>
                  <TrashIcon
                    onClick={() => {
                      onRemover(pagamento.idFormaPagamentoParcial);
                    }}
                    size={19}
                  />
              </td>
            ) : (
              <td></td>
            )}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

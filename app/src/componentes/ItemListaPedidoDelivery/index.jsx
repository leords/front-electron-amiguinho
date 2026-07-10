import { formatarMoeda } from "../../utils/formartarMoeda";
import styles from "./styles.module.css";
import { TrashIcon, WarningCircleIcon } from "@phosphor-icons/react";

export default function ItemListaPedidoDelivery({
  produto,
  onRemover,
  botaoRemover = true,

}) {

  return (
    <div className={styles.container}>
      <table className={styles.tabela}>
        <tbody>
          <tr>
            <td>{produto.quantidade}</td>
            <td>{produto.nome}</td>
            <td>
              {formatarMoeda(produto?.precoVenda)}
            </td>
            <td>
              {formatarMoeda( (Number(produto.precoVenda) * produto.quantidade)) }
            </td>
            {botaoRemover ? (
              <td>
                {produto?.nome !== 'TAXA ENTREGA'
                  ?
                  <TrashIcon
                    onClick={() => {
                      onRemover(produto.id);
                    }}
                    size={20}
                  />
                  : 
                  <WarningCircleIcon
                    color="orange"
                    size={20}
                    weight="duotone"
                  />
                }

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

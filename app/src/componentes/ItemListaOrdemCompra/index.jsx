import { TrashIcon } from "@phosphor-icons/react";
import styles from "./styles.module.css";
import { useProdutos } from "../../hooks/useProdutos";
import { formatarMoeda } from "../../utils/formartarMoeda";

export function ItemListaOrdemCompra ({
    item,
    removeItem,
    indexItem
}) {

// Hooks
const { produtos } = useProdutos();

// Buscando o produto na lista de produtos
const produtoSelecionado = produtos.find( produto => Number(produto.id) === Number(item.produtoId))


return (
    <div className={styles.container}>
      <table className={styles.tabela}>
        <tbody>
          <tr>
            <td>{ indexItem + 1 }</td>
            <td>{ produtoSelecionado?.nome }</td>
            <td>
              {Number(item?.quantidade || 0)}
            </td>
            <td>
              {formatarMoeda(Number(item.valorUnit * item.quantidade))}
            </td>

              <td>
                <TrashIcon
                  onClick={() => {
                    removeItem(indexItem);
                  }}
                  size={18}
                />
              </td>

          </tr>
        </tbody>
      </table>
    </div>
  );
}
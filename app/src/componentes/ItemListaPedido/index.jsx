import styles from "./styles.module.css";
import { TrashIcon } from "@phosphor-icons/react";

export default function ItemListaPedido({
  produto,
  onRemover,
  botaoRemover = true,
}) {
  console.log(produto);
  return (
    <div className={styles.container}>
      <table className={styles.tabela}>
        <tbody>
          <tr>
            <td>{produto.quantidade}</td>
            <td>{produto.nome}</td>
            <td>
              {Number(produto?.precoUndVenda || 0).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </td>
            <td>
              {Number(
                produto.precoUndVenda * produto.quantidade
              ).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </td>
            {botaoRemover ? (
              <td>
                <TrashIcon
                  onClick={() => {
                    onRemover(produto.id);
                  }}
                  size={20}
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

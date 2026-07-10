import styles from "./styles.module.css";
import { TrashIcon, WarningCircleIcon } from "@phosphor-icons/react";

export default function ItemListaPedido({
  produto,
  onRemover,
  botaoRemover = true,

}) {

  const precoUnitario = parseFloat(
    produto.precoUndVenda.replace(",", ".")
  )
  const preco = precoUnitario * produto.quantidade


  return (
    <div className={styles.container}>
      <table className={styles.tabela}>
        <tbody>
          <tr>
            <td>{produto.quantidade}</td>
            <td>{produto.nome}</td>
            <td>
              {precoUnitario.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </td>
            <td>
              {preco.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
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

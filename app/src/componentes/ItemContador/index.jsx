import styles from "./styles.module.css";

export default function ItemContador({
  quantidade,
  nota,
  alterarQuantidade,
  navegavel = true,
}) {
  // Apenas dar acesso aos inputs que podem ser navegados, apenas os de quantidade
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      // valida com o enter
      e.preventDefault();

      // Busca só os inputs que podem ser navegados
      const inputs = Array.from(
        document.querySelectorAll("input[data-navegavel='true']") //passando por parametro
      );
      const index = inputs.indexOf(e.target);

      if (inputs[index + 1]) {
        inputs[index + 1].select();
      } else {
        e.target.blur();
      }
    }
  };

  return (
    <div className={styles.container}>
      <input
        type="number"
        className={styles.quantidade}
        value={quantidade}
        onChange={(e) => alterarQuantidade(Number(e.target.value))}
        onKeyDown={handleKeyDown}
        data-navegavel={navegavel}
        min="0"
        step="1"
      ></input>

      <input
        className={styles.nota}
        value={
          nota
            ? parseFloat(nota).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
            : ""
        }
      ></input>

      <input
        className={styles.total}
        value={parseFloat(quantidade * nota).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}
        onChange={alterarQuantidade(quantidade)}
      ></input>
    </div>
  );
}

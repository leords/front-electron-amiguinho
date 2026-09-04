import styles from "./styles.module.css";

export default function Rodape() {
  return (
    <footer className={styles.rodape}>
      <div className={styles.conteudo}>
        <span className={styles.marca}>Distribuidora de Bebidas Amigão</span>

        <span className={styles.divisor} aria-hidden="true" />

        <span className={styles.versao}>v2.1.5</span>

        <span className={styles.divisor} aria-hidden="true" />

        <span className={styles.creditos}>
          Desenvolvido por Leonardo Rodrigues © 2026
        </span>
      </div>
    </footer>
  );
}

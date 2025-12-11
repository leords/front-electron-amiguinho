import styles from "./styles.module.css";

export default function Rodape() {
  return (
    <footer className={styles.rodape}>
      <p className={styles.descricao}>
        Distribuidora de Bebidas Amigão — Sistema de Vendas balcão v1.0
        Desenvolvido por Leonardo Rodrigues © 2025
      </p>
    </footer>
  );
}

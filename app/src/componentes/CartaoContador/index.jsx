import styles from "./styles.module.css";

export default function CartaoContador({
  metodo = "Dinheiro",
  valor = 0,
  total = 0,
}) {
  // Calcula a porcentagem
  const porcentagem = total > 0 ? Math.round((valor / total) * 100) : 0;

  // Calcula o strokeDasharray para o círculo
  const raio = 30;
  const circunferencia = 2 * Math.PI * raio;
  const progresso = (porcentagem / 100) * circunferencia;

  return (
    <div className={styles.container}>
      <div className={styles.porcentual}>
        <svg className={styles.circuloSvg} viewBox="2 2 80 80">
          {/* Círculo de fundo */}
          <circle className={styles.circuloFundo} cx="40" cy="40" r={raio} />
          {/* Círculo de progresso */}
          <circle
            className={styles.circuloProgresso}
            cx="40"
            cy="40"
            r={raio}
            style={{
              strokeDasharray: `${progresso} ${circunferencia}`,
              strokeDashoffset: 0,
            }}
          />
        </svg>
        <p className>{porcentagem}%</p>
      </div>
      <div className={styles.valores}>
        <p className={styles.metodo}>{metodo}</p>
        <h1>
          {valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </h1>
      </div>
    </div>
  );
}

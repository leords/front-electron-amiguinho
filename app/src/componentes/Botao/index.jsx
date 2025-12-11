import styles from "./styles.module.css";
import { useNavigate } from "react-router-dom";
import { ArrowRightIcon } from "@phosphor-icons/react";

export default function MenuButton({
  corBG,
  titulo,
  descricao,
  destino,
  imagem,
}) {
  const navegar = useNavigate();

  return (
    <button
      onClick={() => navegar(destino)}
      className={styles.container}
      style={{ background: corBG }}
    >
      <div className={styles.conteudo}>
        <div className={styles.imagem}>{imagem}</div>
        <div className={styles.textos}>
          <h3 className={styles.titulo}>{titulo}</h3>
          <p className={styles.descricao}>{descricao}</p>
        </div>
        <div className={styles.seta}>
          <ArrowRightIcon size={24} weight="bold" />
        </div>
      </div>
    </button>
  );
}

import * as React from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import styles from "./styles.module.css";

export function AlertaRadix({
  trigger,
  titulo,
  descricao,
  tratar,
  confirmarTexto,
  cancelarTexto,
}) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Overlay className={styles.overlay} />

        <AlertDialog.Content className={styles.content}>
          <AlertDialog.Title className={styles.title}>
            {titulo}
          </AlertDialog.Title>

          <AlertDialog.Description className={styles.description}>
            {descricao}
          </AlertDialog.Description>

          <div className={styles.actions}>
            <AlertDialog.Cancel asChild>
              <button className={styles.cancel}>{cancelarTexto}</button>
            </AlertDialog.Cancel>

            <AlertDialog.Action asChild>
              <button className={styles.confirm} onClick={tratar}>
                {confirmarTexto}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

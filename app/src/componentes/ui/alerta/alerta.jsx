import * as React from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import styles from "./styles.module.css";

export function AlertaRadix({
  trigger,
  children,
  titulo,
  descricao,
  tratar,
  onConfirm,
  confirmarTexto = "Confirmar",
  cancelarTexto = "Cancelar",
}) {
  const elementoGatilho = trigger || children;
  const funcaoConfirmar = tratar || onConfirm;

  return (
    <AlertDialog.Root>
      {elementoGatilho && (
        <AlertDialog.Trigger asChild>{elementoGatilho}</AlertDialog.Trigger>
      )}

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
              <button className={styles.confirm} onClick={funcaoConfirmar}>
                {confirmarTexto}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

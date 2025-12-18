import * as React from "react";
import * as Toast from "@radix-ui/react-toast";
import styles from "./styles.module.css";
import { usarToast } from "../../Context/toastContext";

export function ToastRadix({ mensagem, duracao = 4000 }) {
  const [open, setOpen] = React.useState(false);
  const { setMensagem } = usarToast();

  // é um useEffect.
  // Se existir msg seta open como true, da um time de 4000ms, seta false e limpa a msg do context
  React.useEffect(() => {
    if (mensagem) setOpen(true);

    setTimeout(() => {
      setOpen(false);
      setMensagem("");
    }, duracao);
  }, [mensagem]); //Ouvindo mensagem que vem do parametro

  return (
    <Toast.Provider swipeDirection="right">
      <Toast.Root open={open} onOpenChange={setOpen} className={styles.toast}>
        <Toast.Description>{mensagem}</Toast.Description>
        <Toast.Close className={styles["toast-close"]}>×</Toast.Close>
      </Toast.Root>

      <Toast.Viewport className={styles["toast-container"]} />
    </Toast.Provider>
  );
}

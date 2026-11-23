import { useState, useEffect } from "react";
import { X, WarningOctagon, Trash, ChatCenteredText } from "@phosphor-icons/react";
import styles from "./styles.module.css";
import { formatarMoeda } from "../../utils/formartarMoeda";
import { cancelarBoleto } from "../../operadores/API/boleto/cancelarBoleto";
import { usarToast } from "../Context/toastContext";

export default function ModalCancelarBoleto({
  aberto,
  aoFechar,
  boleto,
  aoConfirmarSucesso,
}) {
  const { setMensagem } = usarToast();
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setObservacao("");
    setSalvando(false);
  }, [aberto, boleto]);

  useEffect(() => {
    if (!aberto) return;
    const tratarKeyDown = (e) => {
      if (e.key === "Escape" && !salvando) {
        aoFechar();
      }
    };
    window.addEventListener("keydown", tratarKeyDown);
    return () => window.removeEventListener("keydown", tratarKeyDown);
  }, [aberto, salvando, aoFechar]);

  if (!aberto || !boleto) return null;

  const isDelivery = Boolean(boleto.pedidoDeliveryId || boleto.pedidoDelivery);
  const pedidoObj = isDelivery ? boleto.pedidoDelivery : boleto.pedidoExterno;
  const clienteNome = pedidoObj?.cliente?.nome || "CLIENTE NÃO IDENTIFICADO";

  const tratarSubmeter = async (e) => {
    if (e) e.preventDefault();

    setSalvando(true);
    try {
      const resposta = await cancelarBoleto(boleto.id, observacao);
      setMensagem(
        resposta?.mensagem || `Boleto #${boleto.id} cancelado com sucesso!`
      );
      if (aoConfirmarSucesso) {
        aoConfirmarSucesso();
      }
      aoFechar();
    } catch (error) {
      console.error("Erro ao cancelar boleto:", error);
      setMensagem(error.message || "Erro ao cancelar boleto");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget && !salvando) aoFechar();
      }}
    >
      <div className={styles.modalContainer} role="dialog" aria-modal="true">
        <header className={styles.modalHeader}>
          <div className={styles.headerInfo}>
            <div className={styles.headerIconWrapper}>
              <WarningOctagon size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.subtitulo}>Ação Crítica</p>
              <h2 className={styles.titulo}>Cancelar Boleto #{boleto.id}</h2>
            </div>
          </div>

          <button
            type="button"
            className={styles.botaoFechar}
            onClick={aoFechar}
            disabled={salvando}
            title="Fechar (Esc)"
          >
            <X size={20} weight="bold" />
          </button>
        </header>

        <form onSubmit={tratarSubmeter} className={styles.modalCorpo}>
          <p className={styles.alertaTexto}>
            Tem certeza de que deseja cancelar o boleto de{" "}
            <strong>{formatarMoeda(boleto.valor)}</strong> vinculado ao cliente{" "}
            <strong>{clienteNome}</strong>? Esta ação registrará o boleto como cancelado no financeiro.
          </p>

          <div className={styles.grupoInput}>
            <label className={styles.label}>
              <ChatCenteredText size={14} weight="bold" />
              Motivo do Cancelamento (Opcional)
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                className={styles.campoTexto}
                placeholder="Ex: Mercadoria devolvida / pedido cancelado"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <footer className={styles.modalRodape}>
            <button
              type="button"
              className={styles.botaoCancelar}
              onClick={aoFechar}
              disabled={salvando}
            >
              Voltar
            </button>

            <button
              type="submit"
              className={styles.botaoConfirmarCancelamento}
              disabled={salvando}
            >
              {salvando ? (
                <>
                  <div className={styles.spinnerBtn} />
                  <span>Cancelando...</span>
                </>
              ) : (
                <>
                  <Trash size={16} weight="bold" />
                  <span>Confirmar Cancelamento</span>
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

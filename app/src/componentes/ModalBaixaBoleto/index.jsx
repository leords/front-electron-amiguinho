import { useState, useEffect } from "react";
import {
  X,
  CheckCircle,
  Calendar,
  Bank,
  Receipt,
  User,
  Truck,
  MapPin,
  Phone,
} from "@phosphor-icons/react";
import styles from "./styles.module.css";
import { formatarMoeda } from "../../utils/formartarMoeda";
import { baixarBoleto } from "../../operadores/API/boleto/baixarBoleto";
import { usarToast } from "../Context/toastContext";

// Retorna data/hora local no formato para input datetime-local: YYYY-MM-DDTHH:mm
const obterDataHoraLocal = () => {
  const agora = new Date();
  const offset = agora.getTimezoneOffset() * 60000;
  return new Date(agora.getTime() - offset).toISOString().slice(0, 16);
};

export default function ModalBaixaBoleto({
  aberto,
  aoFechar,
  boleto,
  aoConfirmarSucesso,
}) {
  const { setMensagem } = usarToast();

  const [dataPagamento, setDataPagamento] = useState(obterDataHoraLocal());
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Inicializa os campos ao abrir
  useEffect(() => {
    if (!aberto) return;
    setDataPagamento(obterDataHoraLocal());
    setObservacao("");
    setSalvando(false);
  }, [aberto, boleto]);

  // Fechar com Escape
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

  // Extração unificada de dados do cliente e canal
  const isDelivery = Boolean(boleto.pedidoDeliveryId || boleto.pedidoDelivery);
  const canalNome = isDelivery ? "DELIVERY" : "EXTERNO";
  const pedidoObj = isDelivery ? boleto.pedidoDelivery : boleto.pedidoExterno;
  const clienteObj = pedidoObj?.cliente;
  const clienteNome = clienteObj?.nome || "CLIENTE NÃO IDENTIFICADO";
  const clienteCidade = clienteObj?.cidade || "";
  const clienteBairro = clienteObj?.bairro || "";
  const clienteTelefone = clienteObj?.telefone || "";
  const cargaId = boleto.pedidoExterno?.carga?.id;
  const pedidoId = boleto.pedidoDeliveryId || boleto.pedidoExternoId || pedidoObj?.id;

  const bancosSugeridos = [
    "BANCO DO BRASIL",
    "SANTANDER",
    "BRADESCO",
    "ITAÚ",
    "SICREDI",
    "SICOOB",
  ];

  const selecionarSugestaoBanco = (banco) => {
    setObservacao((prev) => {
      if (!prev) return `Compensado no ${banco}`;
      return `${prev} - ${banco}`;
    });
  };

  const tratarSubmeter = async (e) => {
    if (e) e.preventDefault();

    setSalvando(true);
    try {
      // Converte data local para ISOString se preenchida
      const dataIso = dataPagamento
        ? new Date(dataPagamento).toISOString()
        : new Date().toISOString();

      const resposta = await baixarBoleto(boleto.id, {
        dataPagamento: dataIso,
        observacao,
      });

      setMensagem(
        resposta?.mensagem || `Baixa do boleto #${boleto.id} realizada com sucesso!`
      );

      if (aoConfirmarSucesso) {
        aoConfirmarSucesso();
      }
      aoFechar();
    } catch (error) {
      console.error("Erro ao baixar boleto:", error);
      setMensagem(error.message || "Erro ao dar baixa no boleto");
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
        {/* CABEÇALHO */}
        <header className={styles.modalHeader}>
          <div className={styles.headerInfo}>
            <div className={styles.headerIconWrapper}>
              <CheckCircle size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.subtitulo}>Compensação Bancária</p>
              <h2 className={styles.titulo}>
                Confirmar Baixa de Boleto
                <span className={styles.badgeId}>#{boleto.id}</span>
              </h2>
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

        {/* CORPO */}
        <form onSubmit={tratarSubmeter} className={styles.modalCorpo}>
          {/* CARD DE RESUMO */}
          <div className={styles.cardResumoBoleto}>
            <div className={styles.linhaResumoTopo}>
              <h3 className={styles.clienteNome}>
                <User size={16} weight="bold" style={{ marginRight: 6, verticalAlign: "middle" }} />
                {clienteNome}
              </h3>
              <span
                className={`${styles.badgeCanal} ${
                  isDelivery ? styles.canalDelivery : styles.canalExterno
                }`}
              >
                {canalNome}
              </span>
            </div>

            <div className={styles.linhaResumoDetalhes}>
              {pedidoId && (
                <div className={styles.detalheItem}>
                  <Receipt size={14} weight="bold" />
                  <span>Pedido: <strong>#{pedidoId}</strong></span>
                </div>
              )}

              {cargaId && (
                <div className={styles.detalheItem}>
                  <Truck size={14} weight="bold" />
                  <span>Carga: <strong>#{cargaId}</strong></span>
                </div>
              )}

              {(clienteBairro || clienteCidade) && (
                <div className={styles.detalheItem}>
                  <MapPin size={14} weight="bold" />
                  <span>{[clienteBairro, clienteCidade].filter(Boolean).join(" - ")}</span>
                </div>
              )}

              {clienteTelefone && (
                <div className={styles.detalheItem}>
                  <Phone size={14} weight="bold" />
                  <span>{clienteTelefone}</span>
                </div>
              )}
            </div>

            <div className={styles.cardValorDestaque}>
              <span className={styles.labelValor}>Valor Total do Boleto:</span>
              <strong className={styles.valorGrande}>
                {formatarMoeda(boleto.valor)}
              </strong>
            </div>
          </div>

          {/* CAMPO DATA DO PAGAMENTO */}
          <div className={styles.grupoInput}>
            <label className={styles.label}>
              <Calendar size={14} weight="bold" />
              Data e Hora da Compensação
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="datetime-local"
                className={styles.campoData}
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
              />
            </div>
          </div>

          {/* CAMPO OBSERVAÇÃO / CONTA BANCÁRIA */}
          <div className={styles.grupoInput}>
            <label className={styles.label}>
              <Bank size={14} weight="bold" />
              Observação / Conta Bancária
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                className={styles.campoTexto}
                placeholder="Ex: Compensado no Bradesco - Lote 12"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                autoFocus
              />
            </div>

            {/* Chips de atalhos rápidos */}
            <div className={styles.chipsBancos}>
              {bancosSugeridos.map((banco) => (
                <button
                  key={banco}
                  type="button"
                  className={styles.chipBanco}
                  onClick={() => selecionarSugestaoBanco(banco)}
                >
                  + {banco}
                </button>
              ))}
            </div>
          </div>

          {/* RODAPÉ */}
          <footer className={styles.modalRodape}>
            <button
              type="button"
              className={styles.botaoCancelar}
              onClick={aoFechar}
              disabled={salvando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className={styles.botaoConfirmarBaixa}
              disabled={salvando}
            >
              {salvando ? (
                <>
                  <div className={styles.spinnerBtn} />
                  <span>Confirmando Baixa...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={17} weight="bold" />
                  <span>Confirmar Baixa</span>
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

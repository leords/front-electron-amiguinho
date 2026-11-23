import { CheckCircleIcon, PrinterIcon, ArrowLeft } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import Cabecalho from "../../componentes/Cabecalho";
import { usarToast } from "../../componentes/Context/toastContext";
import Rodape from "../../componentes/Rodape";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";
import styles from "./styles.module.css";
import { useEffect, useState } from "react";
import { AlertaRadix } from "../../componentes/ui/alerta/alerta";

export default function ConfigurarImpressora() {
  const navegar = useNavigate();

  // Hooks
  const { mensagem, setMensagem } = usarToast();
  const [listaImpressoras, setListaImpressoras] = useState([]);
  const [impressoraSelecionada, setImpressoraSelecionada] = useState("");

  useEffect(() => {
    const retornarImpressorasDisponiveis = async () => {
      if (window.IMPRESSORA?.retornarImpressoras) {
        const impressoras = await window.IMPRESSORA.retornarImpressoras();
        setListaImpressoras(impressoras || []);
      }
    };

    retornarImpressorasDisponiveis();
  }, []);

  const selecionarImpressora = async () => {
    if (window.IMPRESSORA?.salvarImpressoras) {
      await window.IMPRESSORA.salvarImpressoras(impressoraSelecionada);
    }
    setMensagem("Impressora selecionada com sucesso!");
  };

  return (
    <div className={styles.container}>
      <ToastRadix mensagem={mensagem} />
      <Cabecalho />
      <main className={styles.main}>
        {/* CABEÇALHO */}
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <div className={styles.iconeWrapper}>
              <PrinterIcon size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Impressão destino</p>
              <h1 className={styles.pageTitulo}>
                Configurar impressora destino
              </h1>
            </div>
          </div>

          <button
            type="button"
            className={styles.botaoVoltar}
            onClick={() => navegar("/gestao")}
            title="Voltar para a tela de Gestão"
          >
            <ArrowLeft size={16} weight="bold" />
            Voltar
          </button>
        </div>

        {/* FORMULÁRIO */}
        <div className={styles.card}>
          <div className={styles.campoMetade}>
            <label className={styles.label}>
              <PrinterIcon size={14} weight="bold" />
              Selecione a impressora
            </label>

            <select
              value={impressoraSelecionada}
              onChange={(e) => setImpressoraSelecionada(e.target.value)}
              className={styles.select}
            >
              <option value="" disabled>
                Escolha uma impressora
              </option>
              {listaImpressoras?.map((impressora, index) => (
                <option
                  key={impressora?.name || impressora?.displayName || index}
                  value={impressora?.name || impressora?.displayName || impressora}
                >
                  {impressora?.displayName || impressora?.name || impressora}
                </option>
              ))}
            </select>
          </div>

          <AlertaRadix
            titulo="Gerar pedido"
            descricao="Você realmente deseja alterar a impressora?"
            tratar={selecionarImpressora}
            confirmarTexto="Sim, salvar nova impressora destino!"
            cancelarTexto="Sair"
            trigger={
              <button
                className={styles.botaoGerar}
                disabled={!impressoraSelecionada}
              >
                <CheckCircleIcon size={16} weight="bold" />
                Salvar impressora destino
              </button>
            }
          />
        </div>
      </main>
      <Rodape />
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import Cabecalho from "../../componentes/Cabecalho";
import ListaCliente from "../../componentes/Clientes";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import { Storefront, ArrowLeft } from "@phosphor-icons/react";
import { usarToast } from "../../componentes/Context/toastContext";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";

export default function Clientes() {
  const navegar = useNavigate();
  const { mensagem } = usarToast();

  // Voltar à página gestão
  const tratarVoltarMenu = () => {
    navegar("/gestao");
  };

  return (
    <div className={styles.container}>
      <ToastRadix mensagem={mensagem} />
      <Cabecalho />
      <main className={styles.principal}>
        {/* CABEÇALHO */}
        <div className={styles.tituloSection}>
          <div className={styles.containerTitulo}>
            <div className={styles.iconeWrapper}>
              <Storefront size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Gestão</p>
              <h1 className={styles.pageTitulo}>Gestão de Clientes</h1>
            </div>
          </div>

          {/* BOTÃO VOLTAR */}
          <button className={styles.botaoVoltar} onClick={tratarVoltarMenu}>
            <ArrowLeft size={14} weight="bold" />
            Voltar
          </button>
        </div>

        {/* CONTEÚDO PRINCIPAL COM OS 2 CARDS DE SETORES E TABELA */}
        <div className={styles.tabelaWrapper}>
          <ListaCliente />
        </div>
      </main>
      <Rodape />
    </div>
  );
}

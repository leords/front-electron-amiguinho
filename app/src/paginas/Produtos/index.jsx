import { useNavigate } from "react-router-dom";
import Cabecalho from "../../componentes/Cabecalho";
import ListaProduto from "../../componentes/Produtos";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import { Package, ArrowLeft } from "@phosphor-icons/react";
import { usarToast } from "../../componentes/Context/toastContext";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";

export default function Produtos() {
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
        {/* CABEÇALHO DA PÁGINA */}
        <div className={styles.tituloSection}>
          <div className={styles.containerTitulo}>
            <div className={styles.iconeWrapper}>
              <Package size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Gestão</p>
              <h1 className={styles.pageTitulo}>Gestão de Produtos</h1>
            </div>
          </div>

          {/* BOTÃO VOLTAR */}
          <button className={styles.botaoVoltar} onClick={tratarVoltarMenu}>
            <ArrowLeft size={14} weight="bold" />
            Voltar
          </button>
        </div>

        {/* COMPONENTE PRINCIPAL DE GESTÃO DE PRODUTOS */}
        <div className={styles.tabelaWrapper}>
          <ListaProduto />
        </div>
      </main>
      <Rodape />
    </div>
  );
}
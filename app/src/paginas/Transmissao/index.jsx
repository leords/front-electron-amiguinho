import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import Spinner from "../../componentes/Spinner";

// Ícones
import {
  UsersIcon,
  CreditCardIcon,
  CloudArrowUpIcon,
  ArrowLeft,
  CheckCircle,
} from "@phosphor-icons/react";

// Chamadas de API externas
import { BuscarClienteExterno } from "../../operadores/API/cliente/buscarClienteExterno";
import { buscarFormaPagamento } from "../../operadores/API/formaPagamento/buscarFormaPagamento";
import { lerFormaPagamentoBalcao } from "../../operadores/API/formaPagamento/lerFormaPagamentoBalcao";
import { lerFormaPagamentoExterna } from "../../operadores/API/formaPagamento/lerFormaPagamentoExterna";
import { usarToast } from "../../componentes/Context/toastContext";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";

// Componente botão de carga
function BotaoCarga({
  icone: Icone,
  cor,
  titulo,
  descricao,
  status,
  onClick,
}) {
  return (
    <button
      className={styles.botaoCarga}
      data-cor={cor}
      onClick={onClick}
      type="button"
    >
      <div className={styles.botaoIcone} data-cor={cor}>
        <Icone size={28} weight="fill" />
      </div>

      <div className={styles.botaoTexto}>
        <strong className={styles.botaoTitulo}>{titulo}</strong>
        <p className={styles.botaoDescricao}>{descricao}</p>
        {status && (
          <p className={styles.historicoCarga}>última carga: {status}</p>
        )}
      </div>

      <div className={styles.botaoArrow}>
        <CloudArrowUpIcon size={18} weight="bold" />
      </div>
    </button>
  );
}

export default function Transmissao() {
  const navegar = useNavigate();
  const [carregando, setCarregando] = useState(false);

  // Controladores de última carga
  const [statusExterno, setStatusExterno] = useState(
    localStorage.getItem("clientesExternoForce")
  );
  const [statusFormas, setStatusFormas] = useState(
    localStorage.getItem("clientesForce")
  );

  // Hook Toast
  const { mensagem, setMensagem } = usarToast();

  const tratarVoltarMenu = () => {
    navegar("/gestao");
  };

  // Funções de carga ativas
  const acoes = {
    clientesExternoForce: async () => {
      const agora = new Date().toLocaleString("pt-BR");
      await BuscarClienteExterno();
      setStatusExterno(agora);
      localStorage.setItem("clientesExternoForce", agora);
    },
    clientesForce: async () => {
      const agora = new Date().toLocaleString("pt-BR");
      await buscarFormaPagamento();
      await lerFormaPagamentoBalcao();
      await lerFormaPagamentoExterna();
      setStatusFormas(agora);
      localStorage.setItem("clientesForce", agora);
    },
  };

  // Função disparada para executar carga
  const carregar = async (opcao) => {
    try {
      setCarregando(true);

      if (acoes[opcao]) {
        await acoes[opcao]();
        setMensagem("Carga de dados concluída com sucesso!");
      }
    } catch (error) {
      console.error(error);
      setMensagem(error.message || "Erro inesperado ao transmitir dados");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className={styles.container}>
      <ToastRadix mensagem={mensagem} />
      <Cabecalho />

      <main className={styles.principal}>
        {/* Cabeçalho */}
        <div className={styles.cabecalhoPage}>
          <div className={styles.tituloSection}>
            <div className={styles.iconeWrapper}>
              <CloudArrowUpIcon size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Sistema</p>
              <h1 className={styles.pageTitulo}>Transmissão de dados</h1>
            </div>
          </div>

          <button className={styles.botaoVoltar} onClick={tratarVoltarMenu}>
            <ArrowLeft size={14} weight="bold" />
            Voltar
          </button>
        </div>

        {/* Banner Informativo sobre Módulos Nativos */}
        <div className={styles.avisoNativo}>
          <CheckCircle size={22} weight="fill" />
          <span>
            <strong>Gestão Nativa Ativa:</strong> Os cadastros de{" "}
            <strong>Produtos</strong>, <strong>Clientes Delivery</strong> e{" "}
            <strong>Formas de Pagamento</strong> agora são gerenciados de forma 100% nativa
            pelo sistema (com suporte a inclusão, edição e inativação). As cargas manuais desses
            módulos foram removidas desta tela para garantir a integridade dos dados e evitar
            sobreposições acidentais por outros usuários.
          </span>
        </div>

        <p className={styles.instrucao}>
          Selecione o conjunto de dados para sincronizar com o servidor:
        </p>

        {carregando ? (
          <div className={styles.carregamento}>
            <Spinner />
            <p>Carregando dados, aguarde!</p>
          </div>
        ) : (
          <div className={styles.grid}>
            <BotaoCarga
              icone={UsersIcon}
              cor="blue"
              titulo="Clientes Externo"
              descricao="Carregar lista de clientes do setor externo (Google Sheets)"
              status={statusExterno}
              onClick={() => carregar("clientesExternoForce")}
            />
          </div>
        )}
      </main>

      <Rodape />
    </div>
  );
}
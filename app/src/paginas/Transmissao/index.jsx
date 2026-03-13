import { useState } from "react";
import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import {
  UsersIcon,
  MotorcycleIcon,
  PackageIcon,
  CreditCardIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";

const STATUS = { idle: "idle", carregando: "carregando", ok: "ok", erro: "erro" };

function BotaoCarga({ icone: Icone, cor, titulo, descricao, status, onClick }) {
  return (
    <button
      className={`${styles.botaoCarga} ${styles[`botao_${status}`]}`}
      data-cor={cor}
      onClick={onClick}
      disabled={status === STATUS.carregando}
    >
      <div className={styles.botaoIcone} data-cor={cor}>
        {status === STATUS.carregando ? (
          <CloudArrowUpIcon size={28} weight="fill" className={styles.spinnerIcon} />
        ) : status === STATUS.ok ? (
          <CheckCircleIcon size={28} weight="fill" className={styles.statusIcone} data-status="ok" />
        ) : status === STATUS.erro ? (
          <WarningCircleIcon size={28} weight="fill" className={styles.statusIcone} data-status="erro" />
        ) : (
          <Icone size={28} weight="fill" />
        )}
      </div>

      <div className={styles.botaoTexto}>
        <strong className={styles.botaoTitulo}>{titulo}</strong>
        <p className={styles.botaoDescricao}>
          {status === STATUS.carregando
            ? "Carregando dados..."
            : status === STATUS.ok
            ? "Carga realizada com sucesso!"
            : status === STATUS.erro
            ? "Erro ao carregar. Tente novamente."
            : descricao}
        </p>
      </div>

      <div className={styles.botaoArrow}>
        {status === STATUS.idle && <CloudArrowUpIcon size={18} weight="bold" />}
      </div>
    </button>
  );
}

export default function Transmissao() {
  const [status, setStatus] = useState({
    clientesDelivery:   STATUS.idle,
    clientesExterno:    STATUS.idle,
    produtos:           STATUS.idle,
    formasPagamento:    STATUS.idle,
  });

  const executarCarga = async (chave, fn) => {
    setStatus((s) => ({ ...s, [chave]: STATUS.carregando }));
    try {
      await fn();
      setStatus((s) => ({ ...s, [chave]: STATUS.ok }));
    } catch (err) {
      console.error(`Erro na carga de ${chave}:`, err);
      setStatus((s) => ({ ...s, [chave]: STATUS.erro }));
    }
  };

  const carregarClientesDelivery  = () => executarCarga("clientesDelivery",  () => { /* sua função aqui */ });
  const carregarClientesExterno   = () => executarCarga("clientesExterno",   () => { /* sua função aqui */ });
  const carregarProdutos          = () => executarCarga("produtos",          () => { /* sua função aqui */ });
  const carregarFormasPagamento   = () => executarCarga("formasPagamento",   () => { /* sua função aqui */ });

  const todosOk = Object.values(status).every((s) => s === STATUS.ok);

  return (
    <div className={styles.container}>
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

          {todosOk && (
            <div className={styles.badgeTodos}>
              <CheckCircleIcon size={15} weight="fill" />
              Todas as cargas concluídas
            </div>
          )}
        </div>

        <p className={styles.instrucao}>
          Clique em cada botão para carregar a lista correspondente no sistema.
        </p>

        {/* Grid de botões */}
        <div className={styles.grid}>
          <BotaoCarga
            icone={MotorcycleIcon}
            cor="orange"
            titulo="Clientes Delivery"
            descricao="Carregar lista de clientes do setor delivery"
            status={status.clientesDelivery}
            onClick={carregarClientesDelivery}
          />
          <BotaoCarga
            icone={UsersIcon}
            cor="blue"
            titulo="Clientes Externo"
            descricao="Carregar lista de clientes do setor externo"
            status={status.clientesExterno}
            onClick={carregarClientesExterno}
          />
          <BotaoCarga
            icone={PackageIcon}
            cor="purple"
            titulo="Produtos"
            descricao="Carregar catálogo de produtos disponíveis"
            status={status.produtos}
            onClick={carregarProdutos}
          />
          <BotaoCarga
            icone={CreditCardIcon}
            cor="green"
            titulo="Formas de pagamento"
            descricao="Carregar métodos de pagamento aceitos"
            status={status.formasPagamento}
            onClick={carregarFormasPagamento}
          />
        </div>

      </main>

      <Rodape />
    </div>
  );
}
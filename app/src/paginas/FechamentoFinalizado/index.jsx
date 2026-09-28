import { useEffect, useState } from "react";
import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import { dataFormatada, dataFormatadaCalendario } from "../../utils/data";
import {
  HandCoinsIcon,
  CalculatorIcon,
  ArchiveIcon,
} from "@phosphor-icons/react";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";
import { usarToast } from "../../componentes/Context/toastContext";
import { buscarFechamentoFinalizado } from "../../operadores/API/fechamento/buscarFechamentoFinalizado";

// Ordem de exibição da contagem de cédulas
const CEDULAS = [
  { chave: "nota200", label: "R$ 200" },
  { chave: "nota100", label: "R$ 100" },
  { chave: "nota50", label: "R$ 50" },
  { chave: "nota20", label: "R$ 20" },
  { chave: "nota10", label: "R$ 10" },
  { chave: "nota5", label: "R$ 5" },
  { chave: "nota2", label: "R$ 2" },
];

// Define a variante de cor do badge de status
function classeBadgeStatus(status) {
  const valor = (status || "").toLowerCase();
  if (valor.includes("fech")) return styles.badgeVerde;
  if (valor.includes("abert")) return styles.badgeLaranja;
  return styles.badgeCinza;
}

function formatarMoeda(valor) {
  const numero = Number(valor) || 0;
  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Card de um setor (Delivery, Balcão 1, Balcão 2)
function CardFechamento({ titulo, fechamento, carregando }) {
  if (carregando) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderTitle}>
            <h2>{titulo}</h2>
          </div>
        </div>
        <div className={styles.skeletonGrupo}>
          <div className={`${styles.skeleton} ${styles.skeletonLinha}`} />
          <div className={`${styles.skeleton} ${styles.skeletonLinha}`} />
          <div className={`${styles.skeleton} ${styles.skeletonBloco}`} />
        </div>
      </div>
    );
  }

  if (!fechamento) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderTitle}>
            <h2>{titulo}</h2>
          </div>
        </div>
        <div className={styles.estadoVazio}>
          <ArchiveIcon size={32} className={styles.iconeVazio} />
          <p>Nenhum fechamento encontrado</p>
          <span>Não há registro para esta data neste setor</span>
        </div>
      </div>
    );
  }

  const diferenca = Number(fechamento.diferenca) || 0;
  const classeDiferenca =
    diferenca === 0
      ? styles.textoVerde
      : diferenca > 0
        ? styles.textoAzul
        : styles.textoVermelho;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderTitle}>
          <h2>{titulo}</h2>
        </div>
        <span
          className={`${styles.badge} ${classeBadgeStatus(fechamento.status)}`}
        >
          {fechamento.status}
        </span>
      </div>

      <div className={styles.infoLinha}>
        <span className={styles.infoLabel}>Vendedor</span>
        <span className={styles.infoValor}>{fechamento.vendedor}</span>
      </div>
      <div className={styles.infoLinha}>
        <span className={styles.infoLabel}>Data</span>
        <span className={styles.infoValor}>
          {dataFormatada(fechamento.data)}
        </span>
      </div>

      <div className={styles.valoresGrid}>
        <div className={styles.valorBox}>
          <span className={styles.valorLabel}>Total no sistema</span>
          <span className={styles.valorNumero}>
            {formatarMoeda(fechamento.totalSistema)}
          </span>
        </div>
        <div className={styles.valorBox}>
          <span className={styles.valorLabel}>Total contabilizado</span>
          <span className={styles.valorNumero}>
            {formatarMoeda(fechamento.totalInformado)}
          </span>
        </div>
        <div className={`${styles.valorBox} ${styles.valorBoxDestaque}`}>
          <span className={styles.valorLabel}>Diferença</span>
          <span className={`${styles.valorNumero} ${classeDiferenca}`}>
            {formatarMoeda(diferenca)}
          </span>
        </div>
      </div>

      <div className={styles.cedulasSection}>
        <p className={styles.cedulasTitulo}>
          <CalculatorIcon size={14} weight="bold" />
          Contagem de cédulas
        </p>
        <div className={styles.cedulasGrid}>
          {CEDULAS.map(({ chave, label }) => (
            <div key={chave} className={styles.cedulaItem}>
              <span className={styles.cedulaLabel}>{label}</span>
              <span className={styles.cedulaValor}>
                {fechamento[chave] ?? 0}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FechamentoFinalizado() {
  const [carregando, setCarregando] = useState(false);

  const [fechamentoDelivery, setFechamentoDelivery] = useState(null);
  const [fechamentoBalcao1, setFechamentoBalcao1] = useState(null);
  const [fechamentoBalcao2, setFechamentoBalcao2] = useState(null);

  // setando o dia atual já no estado.
  const [dataAtual, setDataAtual] = useState(dataFormatadaCalendario());

  // Pega o valor de data selecionado no input
  const tratarAlteracao = (e) => setDataAtual(e.target.value);

  // Função que seta o dia atual pelo botão HOJE
  const setarHoje = () => setDataAtual(dataFormatadaCalendario());

  // Hooks
  const { mensagem, setMensagem } = usarToast();

  // Busca fechamento de venda do dia escolhido de cada setor
  useEffect(() => {
    let ativo = true;
    setCarregando(true);

    const buscarVendasDia = async () => {
      try {
        const [dadosDelivery, dadosBalcao1, dadosBalcao2] = await Promise.all([
          buscarFechamentoFinalizado("delivery", "delivery", dataAtual),
          buscarFechamentoFinalizado("balcao", "b1", dataAtual),
          buscarFechamentoFinalizado("balcao", "b2", dataAtual),
        ]);

        if (!ativo) return;

        setFechamentoDelivery(dadosDelivery);
        setFechamentoBalcao1(dadosBalcao1);
        setFechamentoBalcao2(dadosBalcao2);
      } catch (erro) {
        if (!ativo) return;
        console.log(erro.message);
        setMensagem(erro.message);
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    buscarVendasDia();
    return () => {
      ativo = false;
    };
  }, [dataAtual]);

  return (
    <div className={styles.container}>
      <ToastRadix mensagem={mensagem} />
      <Cabecalho />
      <main className={styles.main}>
        {/* CABEÇALHO */}
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <div className={styles.iconeWrapper}>
              <HandCoinsIcon size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Gestão financeira</p>
              <h1 className={styles.pageTitulo}>
                Fechamento de Caixa Finalizado
              </h1>
            </div>
          </div>

          {/* DATA */}
          <div className={styles.containerData}>
            <input
              className={styles.calendario}
              type="date"
              value={dataAtual}
              onChange={tratarAlteracao}
            />
            <button className={styles.botaoHoje} onClick={setarHoje}>
              Hoje
            </button>
          </div>
        </div>

        {/* CARDS: Delivery, Balcão 1 e Balcão 2 lado a lado */}
        <div className={styles.cardsGrid}>
          <CardFechamento
            titulo="Delivery"
            fechamento={fechamentoDelivery}
            carregando={carregando}
          />

          <CardFechamento
            titulo="Balcão 1"
            fechamento={fechamentoBalcao1}
            carregando={carregando}
          />

          <CardFechamento
            titulo="Balcão 2"
            fechamento={fechamentoBalcao2}
            carregando={carregando}
          />
        </div>
      </main>
      <Rodape />
    </div>
  );
}

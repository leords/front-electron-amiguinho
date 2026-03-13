import { useState, useEffect } from "react";
import Cabecalho from "../../componentes/Cabecalho";
import ItemContador from "../../componentes/ItemContador";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import CartaoContador from "../../componentes/CartaoContador";
import logo from "../../assets/logo.jpg";
import {
  CalculatorIcon,
  CurrencyDollarIcon,
  ChartPieSliceIcon,
  EraserIcon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { buscarFechamentoBalcao } from "../../operadores/API/fechamento/buscarFechamentoBalcao";
import { dataFormatadaCalendario } from "../../utils/data";
import { AlertaRadix } from "../../componentes/ui/alerta/alerta";
import { formatarMoeda } from "../../utils/formartarMoeda";

export default function Fechamento() {
  const [duzentos, setDuzentos] = useState(0);
  const [cem, setCem] = useState(0);
  const [cinquenta, setCinquenta] = useState(0);
  const [vinte, setVinte] = useState(0);
  const [dez, setDez] = useState(0);
  const [cinco, setCinco] = useState(0);
  const [dois, setDois] = useState(0);

  const [vendaDia, setVendaDia] = useState({
    total: 0,
    interno: 0,
    resultado: { a_vista: 0, cartao: 0, pix: 0 },
  });

  const [horaAtual, setHoraAtual] = useState(new Date());

  // Atualiza o relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const dataFormatada = dataFormatadaCalendario();
    const nome = import.meta.env.VITE_NOME_MAQUINA;
    const buscarVendasDia = async () => {
      const dados = await buscarFechamentoBalcao({ data: dataFormatada, vendedor: nome });
      setVendaDia(dados);
    };
    buscarVendasDia();
  }, []);

  const limpar = () => {
    setDuzentos(0); setCem(0); setCinquenta(0);
    setVinte(0); setDez(0); setCinco(0); setDois(0);
  };

  const totalContado =
    duzentos * 200 + cem * 100 + cinquenta * 50 +
    vinte * 20 + dez * 10 + cinco * 5 + dois * 2;

  const totalNotas = duzentos + cem + cinquenta + vinte + dez + cinco + dois;
  const diferenca = totalContado - vendaDia.resultado.a_vista;

  const diferencaStatus = diferenca === 0 ? "ok" : diferenca > 0 ? "sobra" : "falta";

  return (
    <div className={styles.container}>
      <Cabecalho />

      <main className={styles.main}>

        {/* ── Cabeçalho da página ── */}
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <div className={styles.iconeWrapper}>
              <CalculatorIcon size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Terminal de caixa</p>
              <h1 className={styles.pageTitulo}>Fechamento do Caixa</h1>
            </div>
          </div>

          <div className={styles.relogio}>
            <div className={styles.relogioItem}>
              <CalendarIcon size={14} weight="bold" className={styles.relogioIcone} />
              <span>{horaAtual.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}</span>
            </div>
            <div className={styles.relogioDivider} />
            <div className={styles.relogioItem}>
              <ClockIcon size={14} weight="bold" className={styles.relogioIcone} />
              <span className={styles.relogioHora}>{horaAtual.toLocaleTimeString("pt-BR")}</span>
            </div>
          </div>
        </div>

        <div className={styles.layout}>

          {/* ══ COLUNA ESQUERDA: Contador ══ */}
          <div className={styles.colunaContador}>
            <div className={styles.card}>

              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderTitle}>
                  <CurrencyDollarIcon size={20} weight="bold" className={styles.cardHeaderIcon} />
                  <h2>Contador de Notas</h2>
                </div>
                <span className={styles.badgeNotas}>
                  {totalNotas} {totalNotas === 1 ? "nota" : "notas"}
                </span>
              </div>

              <div className={styles.tituloTabela}>
                <span>Qtd</span>
                <span>Nota</span>
                <span>Subtotal</span>
              </div>

              <div className={styles.listaNotas}>
                <ItemContador quantidade={duzentos} nota={200} alterarQuantidade={setDuzentos} navegavel={true} />
                <ItemContador quantidade={cem}      nota={100} alterarQuantidade={setCem}      navegavel={true} />
                <ItemContador quantidade={cinquenta} nota={50} alterarQuantidade={setCinquenta} navegavel={true} />
                <ItemContador quantidade={vinte}    nota={20}  alterarQuantidade={setVinte}    navegavel={true} />
                <ItemContador quantidade={dez}      nota={10}  alterarQuantidade={setDez}      navegavel={true} />
                <ItemContador quantidade={cinco}    nota={5}   alterarQuantidade={setCinco}    navegavel={true} />
                <ItemContador quantidade={dois}     nota={2}   alterarQuantidade={setDois}     navegavel={true} />
              </div>

              <div className={styles.rodapeContador}>
                <AlertaRadix
                  titulo="Limpar contador"
                  descricao="Você realmente deseja limpar todos os valores?"
                  tratar={limpar}
                  confirmarTexto="Sim, limpar!"
                  cancelarTexto="Cancelar"
                  trigger={
                    <button className={styles.botaoLimpar}>
                      <EraserIcon size={16} weight="bold" />
                      Limpar
                    </button>
                  }
                />
                <div className={styles.totalContado}>
                  <span>Total contado</span>
                  <strong>{formatarMoeda(totalContado)}</strong>
                </div>
              </div>

              {/* ── Conferência ── */}
              {totalContado > 0 && (
                <div className={`${styles.conferencia} ${styles[`conferencia_${diferencaStatus}`]}`}>
                  <div className={styles.conferenciaHeader}>
                    {diferencaStatus === "ok"
                      ? <CheckCircleIcon size={16} weight="fill" className={styles.conferenciaIconeOk} />
                      : <WarningCircleIcon size={16} weight="fill" className={styles.conferenciaIconeAviso} />}
                    <span className={styles.conferenciaTitulo}>Conferência</span>
                  </div>

                  <div className={styles.conferenciaLinha}>
                    <span>Dinheiro esperado</span>
                    <strong className={styles.valorNeutro}>
                      {formatarMoeda(vendaDia.resultado?.a_vista)}
                    </strong>
                  </div>
                  <div className={styles.conferenciaDivider} />
                  <div className={styles.conferenciaLinha}>
                    <span>Diferença</span>
                    <strong className={styles[`valor_${diferencaStatus}`]}>
                      {diferenca > 0 ? "+" : diferenca < 0 ? "−" : ""}
                      {formatarMoeda(Math.abs(diferenca))}
                      {diferenca > 0 && <em> sobra</em>}
                      {diferenca < 0 && <em> falta</em>}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ══ COLUNA DIREITA: Resumo ══ */}
          <div className={styles.colunaResumo}>

            {/* Card total geral */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderTitle}>
                  <ChartPieSliceIcon size={20} weight="bold" className={styles.cardHeaderIcon} />
                  <h2>Resumo do Dia</h2>
                </div>
              </div>
              <div className={styles.totalGeralWrapper}>
                <CartaoContador valor={vendaDia.total} metodo="Total" />
              </div>
            </div>

            {/* Card formas de pagamento */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderTitle}>
                  <span className={styles.formasPagLabel}>Formas de pagamento</span>
                </div>
              </div>
              <div className={styles.gridCartoes}>
                <CartaoContador valor={vendaDia.resultado.a_vista} metodo="Dinheiro" total={vendaDia.total} />
                <CartaoContador valor={vendaDia.resultado.cartao}  metodo="Cartão"   total={vendaDia.total} />
                <CartaoContador valor={vendaDia.resultado.pix}     metodo="PIX"      total={vendaDia.total} />
                <CartaoContador valor={vendaDia.interno}           metodo="Interno"  total={vendaDia.total} />
              </div>
            </div>

            {/* Mascote + mensagem */}
            <div className={styles.mascoteCard}>
              <img src={logo} alt="Logo" className={styles.logo} />
              <p className={styles.textoMascote}>
                Confira o fechamento do caixa e garanta que tudo está correto!
              </p>
            </div>

          </div>
        </div>
      </main>

      <Rodape />
    </div>
  );
}
import { useState, useEffect } from "react";
import Cabecalho from "../../componentes/Cabecalho";
import ItemContador from "../../componentes/ItemContador";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import CartaoContador from "../../componentes/CartaoContador";
import logo from "../../assets/logo.jpg";
import {
  Calculator,
  CurrencyDollar,
  ChartPieSlice,
  Eraser,
} from "@phosphor-icons/react";
import { buscarFechamentoBalcao } from "../../operadores/API/fechamento/buscarFechamentoBalcao";
import { dataFormatadaCalendario } from "../../utils/data";
import { AlertaRadix } from "../../componentes/ui/alerta/alerta";

export default function Fechamento() {
  const [duzentos, setDuzentos] = useState(0);
  const [cem, setCem] = useState(0);
  const [cinquenta, setCinquenta] = useState(0);
  const [vinte, setVinte] = useState(0);
  const [dez, setDez] = useState(0);
  const [cinco, setCinco] = useState(0);
  const [dois, setDois] = useState(0);
  const [nomeMaquina, setNomeMaquina] = useState("");
  // já criei o state desta forma para evitar usar .? nas variaveis.
  const [vendaDia, setVendaDia] = useState({
    total: 0,
    interno: 0,
    resultado: {
      a_vista: 0,
      cartao: 0,
      pix: 0,
    },
  });

  // Carregar nome da maquina que vem de .env
  useEffect(() => {
    async function carregarMaquina() {
      const nome = await window.ENV.pegarNomeMaquina();
      setNomeMaquina(nome);
    }

    carregarMaquina();
  }, []);

  // Simulação de busca de dados do dia
  useEffect(() => {
    const dataFormatada = dataFormatadaCalendario();

    // Aqui você faria a chamada ao banco de dados
    const buscarVendasDia = async () => {
      const dados = await buscarFechamentoBalcao({
        data: dataFormatada,
        vendedor: "b1",
      });
      setVendaDia(dados);
    };
    buscarVendasDia();
  }, []);

  useEffect(() => {
    console.log("dados", vendaDia);
  }, [vendaDia]);

  const limpar = () => {
    const confirmar = window.confirm(
      "Deseja limpar todos os valores do contador?"
    );
    if (!confirmar) return;

    setDuzentos(0);
    setCem(0);
    setCinquenta(0);
    setVinte(0);
    setDez(0);
    setCinco(0);
    setDois(0);
  };

  const totalContado =
    duzentos * 200 +
    cem * 100 +
    cinquenta * 50 +
    vinte * 20 +
    dez * 10 +
    cinco * 5 +
    dois * 2;

  const diferenca = totalContado - vendaDia.resultado.a_vista;

  useEffect(() => {
    console.log("dados", vendaDia);
    console.log("vendedor", nomeMaquina);
  }, [vendaDia]);

  return (
    <div className={styles.container}>
      <Cabecalho />

      <main className={styles.main}>
        {/* LADO ESQUERDO - CONTADOR DE NOTAS */}
        <div className={styles.containerContador}>
          <div className={styles.tituloSection}>
            <Calculator size={32} weight="duotone" className={styles.icone} />
            <h1>Fechamento do Caixa</h1>
          </div>

          <div className={styles.contador}>
            <div className={styles.cabecalhoContador}>
              <h2>
                <CurrencyDollar size={24} weight="bold" />
                Contador de Notas
              </h2>
              <span className={styles.badge}>
                {duzentos + cem + cinquenta + vinte + dez + cinco + dois} notas
              </span>
            </div>

            {/* Cabeçalho da tabela */}
            <div className={styles.tituloTabela}>
              <span>Qtd</span>
              <span>Nota</span>
              <span>Subtotal</span>
            </div>

            {/* Lista de notas */}
            <div className={styles.listaNotas}>
              <ItemContador
                quantidade={duzentos}
                nota={200}
                alterarQuantidade={setDuzentos}
                navegavel={true}
              />
              <ItemContador
                quantidade={cem}
                nota={100}
                alterarQuantidade={setCem}
                navegavel={true}
              />
              <ItemContador
                quantidade={cinquenta}
                nota={50}
                alterarQuantidade={setCinquenta}
                navegavel={true}
              />
              <ItemContador
                quantidade={vinte}
                nota={20}
                alterarQuantidade={setVinte}
                navegavel={true}
              />
              <ItemContador
                quantidade={dez}
                nota={10}
                alterarQuantidade={setDez}
                navegavel={true}
              />
              <ItemContador
                quantidade={cinco}
                nota={5}
                alterarQuantidade={setCinco}
                navegavel={true}
              />
              <ItemContador
                quantidade={dois}
                nota={2}
                alterarQuantidade={setDois}
                navegavel={true}
              />
            </div>

            {/* Rodapé com total e botão limpar */}
            <div className={styles.rodapeContador}>
              <AlertaRadix
                titulo="Limpar contador"
                descricao="Você realmente deseja limpar?"
                tratar={limpar}
                confirmarTexto="Sim, limpar!"
                cancelarTexto="Sair"
                trigger={
                  <button className={styles.botaoLimpar}>
                    <Eraser size={18} weight="bold" />
                    Limpar
                  </button>
                }
              />

              <div className={styles.totalContado}>
                <span>Total Contado:</span>
                <strong>
                  {totalContado.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </strong>
              </div>
            </div>

            {/* Conferência com valor esperado em dinheiro */}
            {totalContado > 0 && (
              <div className={styles.conferencia}>
                <div className={styles.linhaConferencia}>
                  <span>Dinheiro esperado:</span>
                  <span className={styles.valorEsperado}>
                    {vendaDia.resultado.a_vista?.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
                <div className={styles.linhaConferencia}>
                  <span>Diferença:</span>
                  <span
                    className={
                      diferenca === 0
                        ? styles.valorOk
                        : diferenca > 0
                        ? styles.valorPositivo
                        : styles.valorNegativo
                    }
                  >
                    {Math.abs(diferenca).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                    {diferenca > 0 && " (sobra)"}
                    {diferenca < 0 && " (falta)"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* LADO DIREITO - TOTAIS E FORMAS DE PAGAMENTO */}
        <div className={styles.containerTotal}>
          {/* Total de Vendas do Dia */}
          <div className={styles.secaoTotal}>
            <div className={styles.headerSecao}>
              <ChartPieSlice size={24} weight="duotone" />
              <h2>Resumo do Dia</h2>
            </div>

            <div className={styles.cardTotalGeral}>
              <CartaoContador valor={vendaDia.total} metodo="Total" />
            </div>
          </div>

          {/* Formas de Pagamento */}
          <div className={styles.secaoFormas}>
            <h3>Formas de Pagamento</h3>
            <div className={styles.gridCartoes}>
              <CartaoContador
                valor={vendaDia.resultado.a_vista}
                metodo="Dinheiro"
                total={vendaDia.total}
              />
              <CartaoContador
                valor={vendaDia.resultado.cartao}
                metodo="Cartão"
                total={vendaDia.total}
              />
              <CartaoContador
                valor={vendaDia.resultado.pix}
                metodo="PIX"
                total={vendaDia.total}
              />
              <CartaoContador
                valor={vendaDia.interno}
                metodo="Interno"
                total={vendaDia.total}
              />
            </div>
          </div>

          {/* Informações adicionais */}
          <div className={styles.infoAdicional}>
            <p>
              <strong>Data:</strong> {new Date().toLocaleDateString("pt-BR")}
            </p>
            <p>
              <strong>Horário:</strong> {new Date().toLocaleTimeString("pt-BR")}
            </p>
          </div>
        </div>
      </main>

      {/* Mascote */}
      <div className={styles.mascote}>
        <img
          src={logo}
          alt="Amigão Distribuidora de Bebidas"
          className={styles.logo}
        />
        <p className={styles.textoMascote}>
          Confira o fechamento do caixa e garanta que tudo está correto!
        </p>
      </div>

      <Rodape />
    </div>
  );
}

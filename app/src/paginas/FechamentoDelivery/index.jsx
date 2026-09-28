import { useEffect, useState } from "react";
import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import { dataFormatadaCalendario, dataHoraFormatada } from "../../utils/data";
import { criarMovimentacao } from "../../operadores/API/movimentacao/criarMovimentacao";
import { deletarMovimentacao } from "../../operadores/API/movimentacao/deletarMovimentacao";
import {
  CalculatorIcon,
  CurrencyDollarIcon,
  EraserIcon,
  PlusCircleIcon,
  TrashIcon,
  ReceiptIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  CreditCardIcon,
  MoneyIcon,
  ShoppingBagIcon,
  CoinsIcon,
  CalendarCheckIcon,
  DeviceMobileIcon,
  LockKeyIcon,
  TrendUpIcon,
  MoneyWavyIcon,
  InfoIcon,
} from "@phosphor-icons/react";
import ItemContador from "../../componentes/ItemContador";
import { AlertaRadix } from "../../componentes/ui/alerta/alerta";
import Select from "react-select";
import { criarFechamento } from "../../operadores/API/AjusteFechamento/criarFechamento";
import { buscarMovimentacao } from "../../operadores/API/movimentacao/buscarMovimentacao";
import { formatarMoeda } from "../../utils/formartarMoeda";
import { usarToast } from "../../componentes/Context/toastContext";
import { editarFechamento } from "../../operadores/API/AjusteFechamento/editarFechamento";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";
import Spinner from "../../componentes/Spinner";
import { LerInicioCaixa } from "../../operadores/API/caixa/lerInicioCaixa";
import { buscarFechamentoDelivery } from "../../operadores/API/fechamento/buscarFechamentoDelivery";
import VendasDelivery from "../VendasDelivery";
import { buscarMovimentacaoPagamentoEletronico } from "../../operadores/API/movimentacaoPagamentosEletronicos/buscarMovimentacao";
import { deletarMovimentacaoPagamentoEletronico } from "../../operadores/API/movimentacaoPagamentosEletronicos/deletarMovimentacao";
import { criarMovimentacaoPagamentoEletronico } from "../../operadores/API/movimentacaoPagamentosEletronicos/criarMovimentacao";

const tiposMovimentacao = [
  { value: "saida", label: "🔻 Saída de dinheiro", tipo: "saida" },
  { value: "entrada", label: "🔺 Entrada de dinheiro", tipo: "entrada" },
];

const tiposMovimentacaoPagamentoEletronico = [
  { value: "saida", label: "🔻 Saída eletrônica", tipo: "saida" },
  { value: "entrada", label: "🔺 Entrada eletrônica", tipo: "entrada" },
];

export default function FechamentoDelivery() {
  // Estados para opções
  const [tipoMovimentacao, setTipoMovimentacao] = useState(
    tiposMovimentacao[1],
  );
  const [
    tipoMovimentacaoPagamentosEletronicos,
    setTipoMovimentacaoPagamentosEletronicos,
  ] = useState(tiposMovimentacaoPagamentoEletronico[1]);

  // Estados para contador de notas
  const [duzentos, setDuzentos] = useState(0);
  const [cem, setCem] = useState(0);
  const [cinquenta, setCinquenta] = useState(0);
  const [vinte, setVinte] = useState(0);
  const [dez, setDez] = useState(0);
  const [cinco, setCinco] = useState(0);
  const [dois, setDois] = useState(0);

  // Hooks
  const { mensagem, setMensagem } = usarToast();

  // Estados
  const [vendaDelivery, setVendaDelivery] = useState(null);
  const [carregandoVendas, setCarregandoVendas] = useState(true);
  const [fechamentoAtual, setFechamentoAtual] = useState(null);
  const [valorManutencao, setValorManutencao] = useState("");
  const [descricaoManutencao, setDescricaoManutencao] = useState("");
  const [erroFormulario, setErroFormulario] = useState("");
  const [
    erroFormularioPagamentoEletronico,
    setErroFormularioPagamentoEletronico,
  ] = useState("");
  const [statusFechamento, setStatusFechamento] = useState(false);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataAtual, setDataAtual] = useState(dataFormatadaCalendario());

  const [
    valorManutencaoPagamentosEletronicos,
    setValorManutencaoPagamentosEletronicos,
  ] = useState("");
  const [
    descricaoManutencaoPagamentosEletronicos,
    setDescricaoManutencaoPagamentosEletronicos,
  ] = useState("");
  const [
    movimentacoesPagamentosEletronicos,
    setMovimentacoesPagamentosEletronicos,
  ] = useState([]);

  // Pega o valor de data selecionado no input
  const tratarAlteracao = (e) => setDataAtual(e.target.value);

  // Função que seta o dia atual pelo botão HOJE
  const setarHoje = () => setDataAtual(dataFormatadaCalendario());

  // Busca fechamento de venda do dia escolhido do delivery
  useEffect(() => {
    setCarregandoVendas(true);
    const buscarVendasDia = async () => {
      try {
        const dados = await buscarFechamentoDelivery({ data: dataAtual });
        setVendaDelivery(dados);
      } catch (erro) {
        console.log(erro.message);
        setMensagem(erro.message);
      } finally {
        setCarregandoVendas(false);
      }
    };
    buscarVendasDia();
  }, [dataAtual]);

  // Buscar/Criar fechamento de caixa do delivery
  useEffect(() => {
    // Não faz nada enquanto vendaDelivery ainda não chegou
    if (!vendaDelivery) return;

    const buscarFechamentoBalcaoDia = async () => {
      try {
        setLoading(true);

        if (vendaDelivery.resultado.quantidade <= 0) return;

        const fechamento = await criarFechamento("delivery", {
          vendedor: "delivery",
          data: dataAtual,
        });
        setFechamentoAtual(fechamento);
      } catch (error) {
        console.log(error.message);
        setMensagem(error.message);
      } finally {
        setLoading(false);
      }
    };

    buscarFechamentoBalcaoDia();
  }, [statusFechamento, vendaDelivery, dataAtual]);

  // Busca as movimentações de caixa(entrada e saidas manuais)
  const buscarMovimentacoes = async () => {
    try {
      // Evita o erro de fechamentoAtual ser chamado e ainda ser nulo
      if (fechamentoAtual) {
        const listaMovimentacoes = await buscarMovimentacao(fechamentoAtual.id);
        setMovimentacoes(listaMovimentacoes);

        // movimentações de pagamentos eletronicos
        const listaMovimentacoesPagamentosEletronicos =
          await buscarMovimentacaoPagamentoEletronico(fechamentoAtual.id);
        setMovimentacoesPagamentosEletronicos(
          listaMovimentacoesPagamentosEletronicos,
        );
      }
    } catch (error) {
      console.log(error.message);
      setMensagem(error.message);
    }
  };

  // Atualiza movimentações
  useEffect(() => {
    buscarMovimentacoes();
  }, [fechamentoAtual, dataAtual]);

  // Criar movimentação
  const novaMovimentacao = async () => {
    if (!descricaoManutencao || typeof descricaoManutencao !== "string") {
      setErroFormulario("Informe uma descrição para a movimentação.");
      return;
    }
    if (
      !valorManutencao ||
      typeof valorManutencao !== "number" ||
      valorManutencao <= 0
    ) {
      setErroFormulario("Informe um valor válido.");
      return;
    }
    const novaManutencao = {
      fechamentoId: fechamentoAtual.id,
      tipo: tipoMovimentacao.value,
      descricao: descricaoManutencao.trim(),
      valor: valorManutencao,
    };

    try {
      const movimentacao = await criarMovimentacao(novaManutencao);
      if (movimentacao) {
        setMensagem("Movimentação cadastrada com sucesso!");
        // se for parcial, cria automatico a movimentação oposta.
        gerarParcialAutomatico();
      }
      setValorManutencao("");
      setDescricaoManutencao("");
      setTipoMovimentacao(tiposMovimentacao[0]);
      await buscarMovimentacoes();
    } catch (error) {
      console.log(error.message);
      setMensagem(error.message);
    }
  };

  // Criar movimentação para pagamentos eletronicos
  const novaMovimentacaoPagamentoEletronico = async () => {
    if (
      !descricaoManutencaoPagamentosEletronicos ||
      typeof descricaoManutencaoPagamentosEletronicos !== "string"
    ) {
      setErroFormularioPagamentoEletronico(
        "Informe uma descrição para a movimentação.",
      );
      return;
    }
    if (
      !valorManutencaoPagamentosEletronicos ||
      typeof valorManutencaoPagamentosEletronicos !== "number" ||
      valorManutencaoPagamentosEletronicos <= 0
    ) {
      setErroFormularioPagamentoEletronico("Informe um valor válido.");
      return;
    }

    const novaManutencaoPagamentosEletronicos = {
      fechamentoId: fechamentoAtual.id,
      tipo: tipoMovimentacaoPagamentosEletronicos.value,
      descricao: descricaoManutencaoPagamentosEletronicos.trim(),
      valor: valorManutencaoPagamentosEletronicos,
    };

    try {
      const movimentacao = await criarMovimentacaoPagamentoEletronico(
        novaManutencaoPagamentosEletronicos,
      );

      if (movimentacao) {
        setMensagem("Movimentação cadastrada com sucesso!");
        // se for parcial, cria automatico a movimentação oposta.
        gerarParcialAutomatico();
      }

      setValorManutencaoPagamentosEletronicos("");
      setDescricaoManutencaoPagamentosEletronicos("");
      setTipoMovimentacao(tiposMovimentacaoPagamentoEletronico[0]);
      await buscarMovimentacoes();
    } catch (error) {
      console.log(error.message);
      setMensagem(error.message);
    }
  };

  // Criar parcial automatico
  const gerarParcialAutomatico = async () => {
    // gera a parcial automática de dinheiro para cartão.
    if (
      tipoMovimentacao.value === "entrada" &&
      descricaoManutencao === "parcial"
    ) {
      console.log("Entrei");

      const manutencaoParcial = {
        fechamentoId: fechamentoAtual.id,
        tipo: "saida",
        descricao: "parcial automática",
        valor: valorManutencao,
      };

      try {
        const movimentacao =
          await criarMovimentacaoPagamentoEletronico(manutencaoParcial);
        if (movimentacao) setMensagem("Parcial automática criada com sucesso!");

        //atualiza as listas.
        await buscarMovimentacoes();
      } catch (error) {
        console.log(error.message);
        setMensagem(error.message);
      }
    }
    // gera a parcial automática de cartão para dinheiro.
    else if (
      tipoMovimentacaoPagamentosEletronicos.value === "entrada" &&
      descricaoManutencaoPagamentosEletronicos === "parcial"
    ) {
      const manutencaoParcial = {
        fechamentoId: fechamentoAtual.id,
        tipo: "saida",
        descricao: "parcial automática",
        valor: valorManutencaoPagamentosEletronicos,
      };

      try {
        const movimentacao = await criarMovimentacao(manutencaoParcial);
        if (movimentacao) setMensagem("Parcial automática criada com sucesso!");

        //atualiza as listas
        await buscarMovimentacoes();
      } catch (error) {
        console.log(error.message);
        setMensagem(error.message);
      }
    } else return;
  };

  // Cancela/Limpa formulario
  const cancelarFormulario = () => {
    setValorManutencao("");
    setValorManutencaoPagamentosEletronicos("");
    setDescricaoManutencao("");
    setDescricaoManutencaoPagamentosEletronicos("");
    setTipoMovimentacao(tiposMovimentacao[0]);
    setTipoMovimentacaoPagamentosEletronicos(
      tipoMovimentacaoPagamentosEletronicos[0],
    );
    setErroFormulario("");
    setErroFormularioPagamentoEletronico("");
  };

  // Limpar contador de notas
  const limparContador = () => {
    setDuzentos(0);
    setCem(0);
    setCinquenta(0);
    setVinte(0);
    setDez(0);
    setCinco(0);
    setDois(0);
  };

  useEffect(() => {
    limparContador();
  }, []);

  // Remover manutenção de caixa.
  const removerManutencao = async (id) => {
    try {
      await deletarMovimentacao(id);
      setMensagem("Movimentação excluída com sucesso!");
      await buscarMovimentacoes();
    } catch (error) {
      console.log(error.message);
      setMensagem(error.message);
    }
  };

  // Remover manutenção de caixa.
  const removerManutencaoPagamentoEletronico = async (id) => {
    try {
      await deletarMovimentacaoPagamentoEletronico(id);
      setMensagem("Movimentação excluída com sucesso!");
      await buscarMovimentacoes();
    } catch (error) {
      console.log(error.message);
      setMensagem(error.message);
    }
  };

  // Finaliza fechamento
  const finalizarFechamento = async () => {
    // ao informar o total contado, somar o mesmo com entrada e saida de movimentações. Assim não teremos diferença de caixa com divergencia.
    const dados = {
      totalSistema: vendaDelivery?.resultado?.a_vista ?? 0,
      totalInformado: totalContado ?? 0,
      nota200: duzentos,
      nota100: cem,
      nota50: cinquenta,
      nota20: vinte,
      nota10: dez,
      nota5: cinco,
      nota2: dois,
    };

    try {
      await editarFechamento(fechamentoAtual.id, dados);
      setMensagem("Fechamento finalizado com sucesso!");
      setStatusFechamento((prev) => !prev);
    } catch (error) {
      console.log(error.message);
      setMensagem(error.message);
    }
  };

  const totalContado =
    duzentos * 200 +
    cem * 100 +
    cinquenta * 50 +
    vinte * 20 +
    dez * 10 +
    cinco * 5 +
    dois * 2;
  const totalNotas = duzentos + cem + cinquenta + vinte + dez + cinco + dois;
  const valorEsperado = vendaDelivery?.resultado?.a_vista ?? 0;
  const valorPix = vendaDelivery?.resultado?.pix ?? 0;
  const valorCartao = vendaDelivery?.resultado?.cartão ?? 0;
  const valorTotalMaquininha = valorPix + valorCartao;
  const totalEntradas = movimentacoes
    .filter((m) => m.tipo === "entrada")
    .reduce((acc, m) => acc + m.valor, 0);
  const totalSaidas = movimentacoes
    .filter((m) => m.tipo === "saida")
    .reduce((acc, m) => acc + m.valor, 0);
  const valorFinalFechamentoAvista =
    valorEsperado + totalEntradas - totalSaidas;
  const diferenca = totalContado - valorFinalFechamentoAvista;

  const totalEntradasAjustesEletronicos = movimentacoesPagamentosEletronicos
    .filter((m) => m.tipo === "entrada")
    .reduce((acc, m) => acc + m.valor, 0);
  const totalSaidasAjustesEletronicos = movimentacoesPagamentosEletronicos
    .filter((m) => m.tipo === "saida")
    .reduce((acc, m) => acc + m.valor, 0);

  const valorFinalEletronico =
    valorTotalMaquininha +
    totalEntradasAjustesEletronicos -
    totalSaidasAjustesEletronicos;

  return (
    <div className={styles.container}>
      <ToastRadix mensagem={mensagem} />
      <Cabecalho />

      <main className={styles.main}>
        {/* CABEÇALHO */}
        <div className={styles.pageHeader}>
          {/* TÍTULOS */}
          <div className={styles.pageHeaderLeft}>
            <div className={styles.iconeWrapper}>
              <CalculatorIcon size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Gestão financeira</p>
              <h1 className={styles.pageTitulo}>
                Fechamento de Caixa Delivery
              </h1>
            </div>
          </div>

          <div className={styles.containerData}>
            <input
              className={styles.calendario}
              type="date"
              value={dataAtual}
              onChange={tratarAlteracao}
            />
            {/* BOTÃO */}
            <button className={styles.botaoHoje} onClick={setarHoje}>
              Hoje
            </button>
          </div>
        </div>

        {loading ? (
          <div className={styles.enviandoPedido}>
            <Spinner />
            <p>Buscando fechamentos, aguarde um instante...</p>
            <span>Estabelecendo conexão com o banco de dados...</span>
          </div>
        ) : (
          <>
            {/* CONDICIONAL PARA CAIXA FECHADO OU ABERTO */}
            {vendaDelivery?.quantidade > 0 &&
            // ABERTO.
            fechamentoAtual?.status === "aberto" ? (
              <div className={styles.containerLados}>
                {/* CARDS DE RESUMO */}
                <div className={styles.resumoCards}>
                  {/* TOTAL DE VENDAS */}
                  <div className={styles.resumoCard}>
                    <div className={styles.resumoCardIcon} data-color="orange">
                      <TrendUpIcon size={18} weight="fill" />
                    </div>
                    <div>
                      <p className={styles.resumoCardLabel}>Total de vendas</p>
                      <strong className={styles.resumoCardValor}>
                        {formatarMoeda(vendaDelivery?.total ?? 0)}
                      </strong>
                    </div>
                  </div>

                  {/* ESPERADO EM DINHEIRO */}
                  <div className={styles.resumoCard}>
                    <div className={styles.resumoCardIcon} data-color="green">
                      <MoneyIcon size={18} weight="fill" />
                    </div>
                    <div>
                      <p className={styles.resumoCardLabel}>
                        Esperado em dinheiro
                      </p>
                      <strong className={styles.resumoCardValor}>
                        {formatarMoeda(valorEsperado)}
                      </strong>
                    </div>
                  </div>

                  {/* CARTÃO / PIX */}
                  <div className={styles.resumoCard}>
                    <div className={styles.resumoCardIcon} data-color="blue">
                      <CreditCardIcon size={18} weight="fill" />
                    </div>
                    <div>
                      <p className={styles.resumoCardLabel}>Cartão + Pix</p>
                      <strong className={styles.resumoCardValor}>
                        {formatarMoeda(valorTotalMaquininha)}
                      </strong>
                    </div>
                  </div>

                  {/* PEDIDOS GERADOS */}
                  <div className={styles.resumoCard}>
                    <div className={styles.resumoCardIcon} data-color="purple">
                      <ShoppingBagIcon size={18} weight="fill" />
                    </div>
                    <div>
                      <p className={styles.resumoCardLabel}>Pedidos gerados</p>
                      <strong className={styles.resumoCardValor}>
                        {vendaDelivery?.quantidade ?? 0}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className={styles.banner}>
                  {/* COLUNA ESQUERDA */}
                  <div className={styles.contador}>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardHeaderTitle}>
                        <CurrencyDollarIcon
                          size={20}
                          weight="bold"
                          className={styles.cardHeaderIcon}
                        />
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

                    {/* BOTÃO LIMPAR E TOTAL CONTATO */}
                    <div className={styles.rodapeContador}>
                      <AlertaRadix
                        titulo="Limpar contador"
                        descricao="Você realmente deseja limpar todos os valores?"
                        tratar={limparContador}
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

                    {/* CONFERENCIA DE NOTAS DIGITADAS */}
                    <div className={styles.conferencia}>
                      <p className={styles.conferenciaTitle}>
                        Conferência de caixa
                      </p>

                      <div className={styles.conferenciaLinha}>
                        <span>Movimentações positivas</span>
                        <span className={styles.valorPositivo}>
                          +{formatarMoeda(totalEntradas)}
                        </span>
                      </div>

                      <div className={styles.conferenciaLinha}>
                        <span>Movimentações negativas</span>
                        <span className={styles.valorNegativo}>
                          −{formatarMoeda(totalSaidas)}
                        </span>
                      </div>

                      <div className={styles.conferenciaDivider} />

                      <div className={styles.conferenciaLinha}>
                        <span>Dinheiro esperado (à vista)</span>
                        <span className={styles.valorNeutro}>
                          {carregandoVendas
                            ? "…"
                            : formatarMoeda(valorFinalFechamentoAvista)}
                        </span>
                      </div>

                      <div className={styles.conferenciaLinha}>
                        <span>Diferença</span>
                        <span
                          className={
                            diferenca === 0
                              ? styles.valorOk
                              : diferenca > 0
                                ? styles.valorPositivo
                                : styles.valorNegativo
                          }
                        >
                          {diferenca > 0 ? "+" : ""}
                          {formatarMoeda(diferenca)}
                          {diferenca > 0 && <em> sobra</em>}
                          {diferenca < 0 && <em> falta</em>}
                        </span>
                      </div>

                      {totalContado ? (
                        <AlertaRadix
                          titulo="Finalizar fechamento"
                          descricao="Você realmente deseja finalizar este fechamento?"
                          tratar={finalizarFechamento}
                          confirmarTexto="Sim, finalizar!"
                          cancelarTexto="Cancelar"
                          trigger={
                            <button className={styles.botaoFinalizar}>
                              <CheckCircleIcon size={18} weight="bold" />
                              Finalizar fechamento
                            </button>
                          }
                        />
                      ) : (
                        <p className={styles.obs}>
                          Informe as notas para habilitar a finalização.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* COLUNA DIREITA */}
                  <div className={styles.colunaManutencao}>
                    {/* CARD MAQUINA */}
                    <div className={styles.card}>
                      <div className={styles.cardHeader}>
                        <div className={styles.cardHeaderTitle}>
                          <CreditCardIcon
                            size={20}
                            weight="bold"
                            className={styles.cardHeaderIcon}
                          />
                          <h2>Vendas na Maquininha</h2>
                        </div>
                        <strong className={styles.valorDestaque}>
                          Total: {formatarMoeda(valorFinalEletronico)}
                        </strong>
                      </div>
                      <div className={styles.maquininhaGrid}>
                        <div className={styles.maquininhaItem}>
                          <CreditCardIcon
                            size={20}
                            weight="duotone"
                            className={styles.maquininhaIcone}
                          />
                          <div>
                            <p className={styles.maquininhaLabel}>Cartão</p>
                            <strong className={styles.maquininhaValor}>
                              {formatarMoeda(valorCartao)}
                            </strong>
                          </div>
                        </div>
                        <div className={styles.maquininhaDivider} />
                        <div className={styles.maquininhaItem}>
                          <DeviceMobileIcon
                            size={20}
                            weight="duotone"
                            className={styles.maquininhaIcone}
                          />
                          <div>
                            <p className={styles.maquininhaLabel}>Pix</p>
                            <strong className={styles.maquininhaValor}>
                              {formatarMoeda(valorPix)}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {valorTotalMaquininha > 0 && (
                        <>
                          <div className={styles.conferenciaLinha}>
                            <span>Ajustes eletrônicos positivos</span>
                            <span className={styles.valorPositivo}>
                              +{formatarMoeda(totalEntradasAjustesEletronicos)}
                            </span>
                          </div>

                          <div className={styles.conferenciaLinha}>
                            <span>Ajustes eletrônicos negativos</span>
                            <span className={styles.valorNegativo}>
                              −{formatarMoeda(totalSaidasAjustesEletronicos)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* FORMULARIO DE MOVIMENTAÇÃO PAGAMENTOS ELETRÔNICOS */}
                    <div className={styles.card}>
                      <div className={styles.cardHeaderMovimentacao}>
                        <div className={styles.cardHeaderTitle}>
                          <CreditCardIcon
                            size={20}
                            weight="bold"
                            className={styles.cardHeaderIcon}
                          />
                          <h2>Ajustes Eletrônicos</h2>
                          <div
                            title='
                          ENTRADA ELETRÔNICA: Nota no dinheiro com parcial no cartão! 
                          Obs: digitar entrada no valor pago em cartão, com descrição: "parcial" que vai lançar automático a soma no total do cartão'
                          >
                            <InfoIcon size={20} color="grey" weight="duotone" />
                          </div>
                        </div>
                        <span className={styles.conferenciaLinha}>
                          Ajuste valores recebidos via Pix, cartão ou vendas
                          diretas no CNPJ.
                        </span>
                      </div>

                      {/* TIPO */}
                      <div className={styles.campoForm}>
                        <label className={styles.labelForm}>Tipo</label>
                        <Select
                          classNamePrefix="custom"
                          options={tiposMovimentacaoPagamentoEletronico}
                          value={tipoMovimentacaoPagamentosEletronicos}
                          onChange={setTipoMovimentacaoPagamentosEletronicos}
                          isSearchable={false}
                        />
                      </div>
                      {/* VALOR */}
                      <div className={styles.campoForm}>
                        <label className={styles.labelForm}>Valor (R$)</label>
                        <input
                          className={styles.inputValor}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0,00"
                          value={valorManutencaoPagamentosEletronicos}
                          onChange={(e) =>
                            setValorManutencaoPagamentosEletronicos(
                              Number(e.target.value),
                            )
                          }
                        />
                      </div>
                      {/* DESCRIÇÃO */}
                      <div className={styles.campoForm}>
                        <label className={styles.labelForm}>Descrição</label>
                        <textarea
                          className={styles.inputDescricao}
                          placeholder="Descreva o motivo da movimentação..."
                          value={descricaoManutencaoPagamentosEletronicos}
                          onChange={(e) =>
                            setDescricaoManutencaoPagamentosEletronicos(
                              e.target.value,
                            )
                          }
                          rows={3}
                        />
                      </div>

                      {erroFormularioPagamentoEletronico && (
                        <div className={styles.msgErro}>
                          {erroFormularioPagamentoEletronico}
                        </div>
                      )}

                      {/* BOTÕES */}
                      <div className={styles.containerBotoes}>
                        <button
                          className={styles.botaoCancelar}
                          onClick={cancelarFormulario}
                        >
                          Cancelar
                        </button>
                        <AlertaRadix
                          titulo="Salvar movimentação"
                          descricao={`Deseja adicionar um novo ajuste eletronico no Delivery?`}
                          tratar={novaMovimentacaoPagamentoEletronico}
                          confirmarTexto="Adicionar"
                          cancelarTexto="Cancelar"
                          trigger={
                            <button className={styles.botaoSalvar}>
                              <PlusCircleIcon size={18} weight="bold" />
                              Salvar ajuste eletronico
                            </button>
                          }
                        />
                      </div>
                    </div>

                    {/* LISTA DE MOVIMENTAÇÕES PAGAMENTOS ELETRÔNICOS */}
                    {movimentacoesPagamentosEletronicos.length > 0 && (
                      <div className={styles.card}>
                        <div className={styles.cardHeader}>
                          <div className={styles.cardHeaderTitle}>
                            <ClockIcon
                              size={20}
                              weight="bold"
                              className={styles.cardHeaderIcon}
                            />
                            <h2>Ajustes eletrônicos do dia</h2>
                          </div>
                          {movimentacoesPagamentosEletronicos.length > 0 && (
                            <div className={styles.resumoMovimentacoes}>
                              <span className={styles.resumoEntrada}>
                                <ArrowUpIcon size={12} weight="bold" />
                                {formatarMoeda(totalEntradasAjustesEletronicos)}
                              </span>
                              <span className={styles.resumoSaida}>
                                <ArrowDownIcon size={12} weight="bold" />
                                {formatarMoeda(totalSaidasAjustesEletronicos)}
                              </span>
                            </div>
                          )}
                        </div>

                        {movimentacoesPagamentosEletronicos.length === 0 ? (
                          <div className={styles.listaVazia}>
                            <ReceiptIcon
                              size={36}
                              weight="duotone"
                              className={styles.iconeVazio}
                            />
                            <p>Nenhuma movimentação registrada</p>
                          </div>
                        ) : (
                          <div className={styles.itensMovimentacao}>
                            {movimentacoesPagamentosEletronicos.map((m) => (
                              <div
                                key={m.id}
                                className={`${styles.itemMovimentacao} ${styles[`item_${m.tipo}`]}`}
                              >
                                <div
                                  className={`${styles.itemIconeTipo} ${styles[`icone_${m.tipo}`]}`}
                                >
                                  {m.tipo === "entrada" ? (
                                    <ArrowUpIcon size={14} weight="bold" />
                                  ) : (
                                    <ArrowDownIcon size={14} weight="bold" />
                                  )}
                                </div>
                                <div className={styles.itemInfo}>
                                  <p className={styles.itemDescricao}>
                                    {m.descricao}
                                  </p>
                                  <span className={styles.itemHora}>
                                    <ClockIcon size={11} />
                                    {dataHoraFormatada(m.data)}
                                  </span>
                                </div>
                                <strong
                                  className={`${styles.itemValor} ${styles[`valor_${m.tipo}`]}`}
                                >
                                  {m.tipo === "saida" ? "−" : "+"}{" "}
                                  {formatarMoeda(m.valor)}
                                </strong>
                                <AlertaRadix
                                  titulo="Remover movimentação"
                                  descricao={`Deseja remover "${m.descricao}"?`}
                                  tratar={() =>
                                    removerManutencaoPagamentoEletronico(m.id)
                                  }
                                  confirmarTexto="Remover"
                                  cancelarTexto="Cancelar"
                                  trigger={
                                    <button className={styles.botaoRemover}>
                                      <TrashIcon size={14} weight="bold" />
                                    </button>
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ------- */}

                    {/* FORMULARIO DE MOVIMENTAÇÃO DINHEIRO */}
                    <div className={styles.card}>
                      <div className={styles.cardHeaderMovimentacao}>
                        <div className={styles.cardHeaderTitle}>
                          <MoneyWavyIcon
                            size={20}
                            weight="bold"
                            className={styles.cardHeaderIcon}
                          />
                          <h2>Ajustes Dinheiro</h2>
                          <div
                            title='
                        ENTRADA ELETRÔNICA: Nota no cartão com parcial no dinheiro! 
                      Obs: digitar entrada no valor pago em dinheiro, com descrição: "parcial" que vai lançar automático a soma no total de dinheiro'
                          >
                            <InfoIcon size={20} color="grey" weight="duotone" />
                          </div>
                        </div>
                        <span className={styles.conferenciaLinha}>
                          Registre entradas ou saídas de dinheiro físico do
                          caixa.
                        </span>
                      </div>
                      {/* TIPO */}
                      <div className={styles.campoForm}>
                        <label className={styles.labelForm}>Tipo</label>
                        <Select
                          classNamePrefix="custom"
                          options={tiposMovimentacao}
                          value={tipoMovimentacao}
                          onChange={setTipoMovimentacao}
                          isSearchable={false}
                        />
                      </div>
                      {/* VALOR */}
                      <div className={styles.campoForm}>
                        <label className={styles.labelForm}>Valor (R$)</label>
                        <input
                          className={styles.inputValor}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0,00"
                          value={valorManutencao}
                          onChange={(e) =>
                            setValorManutencao(Number(e.target.value))
                          }
                        />
                      </div>
                      {/* DESCRIÇÃO */}
                      <div className={styles.campoForm}>
                        <label className={styles.labelForm}>Descrição</label>
                        <textarea
                          className={styles.inputDescricao}
                          placeholder="Descreva o motivo do ajuste..."
                          value={descricaoManutencao}
                          onChange={(e) =>
                            setDescricaoManutencao(e.target.value)
                          }
                          rows={3}
                        />
                      </div>

                      {erroFormulario && (
                        <div className={styles.msgErro}>{erroFormulario}</div>
                      )}

                      {/* BOTÕES */}
                      <div className={styles.containerBotoes}>
                        <button
                          className={styles.botaoCancelar}
                          onClick={cancelarFormulario}
                        >
                          Cancelar
                        </button>
                        <AlertaRadix
                          titulo="Adicionar novo ajuste"
                          descricao={`Deseja adicionar um novo ajuste de dinheiro no  Delivery?`}
                          tratar={novaMovimentacao}
                          confirmarTexto="Adicionar"
                          cancelarTexto="Cancelar"
                          trigger={
                            <button className={styles.botaoSalvar}>
                              <PlusCircleIcon size={18} weight="bold" />
                              Salvar ajuste de dinheiro
                            </button>
                          }
                        />
                      </div>
                    </div>

                    {/* LISTA DE MOVIMENTAÇÕES DINHEIRO */}
                    {movimentacoes.length > 0 && (
                      <div className={styles.card}>
                        <div className={styles.cardHeader}>
                          <div className={styles.cardHeaderTitle}>
                            <ClockIcon
                              size={20}
                              weight="bold"
                              className={styles.cardHeaderIcon}
                            />
                            <h2>Movimentações do dia</h2>
                          </div>
                          {movimentacoes.length > 0 && (
                            <div className={styles.resumoMovimentacoes}>
                              <span className={styles.resumoEntrada}>
                                <ArrowUpIcon size={12} weight="bold" />
                                {formatarMoeda(totalEntradas)}
                              </span>
                              <span className={styles.resumoSaida}>
                                <ArrowDownIcon size={12} weight="bold" />
                                {formatarMoeda(totalSaidas)}
                              </span>
                            </div>
                          )}
                        </div>

                        {movimentacoes.length === 0 ? (
                          <div className={styles.listaVazia}>
                            <ReceiptIcon
                              size={36}
                              weight="duotone"
                              className={styles.iconeVazio}
                            />
                            <p>Nenhuma movimentação registrada</p>
                          </div>
                        ) : (
                          <div className={styles.itensMovimentacao}>
                            {movimentacoes.map((m) => (
                              <div
                                key={m.id}
                                className={`${styles.itemMovimentacao} ${styles[`item_${m.tipo}`]}`}
                              >
                                <div
                                  className={`${styles.itemIconeTipo} ${styles[`icone_${m.tipo}`]}`}
                                >
                                  {m.tipo === "entrada" ? (
                                    <ArrowUpIcon size={14} weight="bold" />
                                  ) : (
                                    <ArrowDownIcon size={14} weight="bold" />
                                  )}
                                </div>
                                <div className={styles.itemInfo}>
                                  <p className={styles.itemDescricao}>
                                    {m.descricao}
                                  </p>
                                  <span className={styles.itemHora}>
                                    <ClockIcon size={11} />
                                    {dataHoraFormatada(m.data)}
                                  </span>
                                </div>
                                <strong
                                  className={`${styles.itemValor} ${styles[`valor_${m.tipo}`]}`}
                                >
                                  {m.tipo === "saida" ? "−" : "+"}{" "}
                                  {formatarMoeda(m.valor)}
                                </strong>
                                <AlertaRadix
                                  titulo="Remover movimentação"
                                  descricao={`Deseja remover "${m.descricao}"?`}
                                  tratar={() => removerManutencao(m.id)}
                                  confirmarTexto="Remover"
                                  cancelarTexto="Cancelar"
                                  trigger={
                                    <button className={styles.botaoRemover}>
                                      <TrashIcon size={14} weight="bold" />
                                    </button>
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : // SEM VENDA AINDA
            vendaDelivery?.quantidade === 0 ? (
              <div className={styles.fechadoBanner}>
                <LockKeyIcon
                  size={32}
                  weight="fill"
                  className={styles.fechadoIcone}
                />
                <div>
                  <h2 className={styles.fechadoTitulo}>
                    Caixa ainda não aberto.
                  </h2>
                  <p className={styles.fechadoSubtitulo}>
                    Delivery · Status: Nenhuma movimentação registrada até o
                    momento.{" "}
                  </p>
                </div>
              </div>
            ) : (
              // FECHADO
              /* CAIXA FECHADO */
              <div className={styles.fechadoWrapper}>
                <div className={styles.fechadoBanner}>
                  <LockKeyIcon
                    size={32}
                    weight="fill"
                    className={styles.fechadoIcone}
                  />
                  <div>
                    <h2 className={styles.fechadoTitulo}>Caixa encerrado</h2>
                    <p className={styles.fechadoSubtitulo}>
                      Status fechamento delivery:{" "}
                      <strong className={styles.statusBadge}>
                        {fechamentoAtual?.status}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className={styles.fechadoGrid}>
                  <div className={styles.fechadoCard}>
                    <CoinsIcon
                      size={22}
                      weight="duotone"
                      className={styles.fechadoCardIcone}
                    />
                    <p className={styles.fechadoCardLabel}>Total de vendas</p>
                    <strong className={styles.fechadoCardValor}>
                      {formatarMoeda(vendaDelivery?.total ?? 0)}
                    </strong>
                  </div>
                  <div className={styles.fechadoCard}>
                    <ShoppingBagIcon
                      size={22}
                      weight="duotone"
                      className={styles.fechadoCardIcone}
                    />
                    <p className={styles.fechadoCardLabel}>Pedidos gerados</p>
                    <strong className={styles.fechadoCardValor}>
                      {vendaDelivery?.quantidade ?? 0}
                    </strong>
                  </div>
                  <div className={styles.fechadoCard}>
                    <MoneyIcon
                      size={22}
                      weight="duotone"
                      className={styles.fechadoCardIcone}
                    />
                    <p className={styles.fechadoCardLabel}>Vendas à vista</p>
                    <strong className={styles.fechadoCardValor}>
                      {formatarMoeda(vendaDelivery?.resultado?.a_vista ?? 0)}
                    </strong>
                  </div>
                  <div className={styles.fechadoCard}>
                    <CreditCardIcon
                      size={22}
                      weight="duotone"
                      className={styles.fechadoCardIcone}
                    />
                    <p className={styles.fechadoCardLabel}>Cartão + Pix</p>
                    <strong className={styles.fechadoCardValor}>
                      {formatarMoeda(valorTotalMaquininha)}
                    </strong>
                  </div>

                  {/* CONTAGEM DE NOTAS */}
                  <div
                    className={`${styles.fechadoCard} ${styles.fechadoCardNotas}`}
                  >
                    <div className={styles.fechadoCardNotasHeader}>
                      <CalculatorIcon
                        size={22}
                        weight="duotone"
                        className={styles.fechadoCardIcone}
                      />
                      <p className={styles.fechadoCardLabel}>
                        Contagem de notas
                      </p>
                    </div>

                    <div className={styles.notasGridFechado}>
                      <div className={styles.notaItemFechado}>
                        <span>R$ 200,00</span>
                        <strong>{fechamentoAtual?.nota200 ?? 0}</strong>
                      </div>
                      <div className={styles.notaItemFechado}>
                        <span>R$ 100,00</span>
                        <strong>{fechamentoAtual?.nota100 ?? 0}</strong>
                      </div>
                      <div className={styles.notaItemFechado}>
                        <span>R$ 50,00</span>
                        <strong>{fechamentoAtual?.nota50 ?? 0}</strong>
                      </div>
                      <div className={styles.notaItemFechado}>
                        <span>R$ 20,00</span>
                        <strong>{fechamentoAtual?.nota20 ?? 0}</strong>
                      </div>
                      <div className={styles.notaItemFechado}>
                        <span>R$ 10,00</span>
                        <strong>{fechamentoAtual?.nota10 ?? 0}</strong>
                      </div>
                      <div className={styles.notaItemFechado}>
                        <span>R$ 5,00</span>
                        <strong>{fechamentoAtual?.nota5 ?? 0}</strong>
                      </div>
                      <div className={styles.notaItemFechado}>
                        <span>R$ 2,00</span>
                        <strong>{fechamentoAtual?.nota2 ?? 0}</strong>
                      </div>
                    </div>

                    <div className={styles.fechadoNotasResumo}>
                      <div className={styles.conferenciaLinha}>
                        <span>Total informado</span>
                        <strong className={styles.valorNeutro}>
                          {formatarMoeda(fechamentoAtual?.totalInformado || 0)}
                        </strong>
                      </div>
                      <div className={styles.conferenciaLinha}>
                        <span>Diferença</span>
                        <span
                          className={
                            (fechamentoAtual?.totalInformado -
                              fechamentoAtual?.totalSistema || 0) === 0
                              ? styles.valorOk
                              : (fechamentoAtual?.totalInformado -
                                    fechamentoAtual?.totalSistema || 0) > 0
                                ? styles.valorPositivo
                                : styles.valorNegativo
                          }
                        >
                          {formatarMoeda(
                            fechamentoAtual?.totalInformado -
                              fechamentoAtual?.totalSistema || 0,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Rodape />
    </div>
  );
}

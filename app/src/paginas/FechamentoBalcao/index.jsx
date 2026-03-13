import { useEffect, useState} from 'react';
import Cabecalho from '../../componentes/Cabecalho'
import Rodape from '../../componentes/Rodape'
import styles from './styles.module.css'
import { dataFormatadaCalendario, dataHoraFormatada } from '../../utils/data';
import { buscarFechamentoBalcao } from '../../operadores/API/fechamento/buscarFechamentoBalcao';
import { buscarFechamentos } from '../../operadores/API/AjusteFechamento/buscarFechamentos'
import { criarMovimentacao } from '../../operadores/API/movimentacao/criarMovimentacao'
import { deletarMovimentacao } from '../../operadores/API/movimentacao/deletarMovimentacao'
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
} from '@phosphor-icons/react';
import ItemContador from '../../componentes/ItemContador';
import { AlertaRadix } from '../../componentes/ui/alerta/alerta';
import Select from "react-select";
import { criarFechamento } from '../../operadores/API/AjusteFechamento/criarFechamento';
import { buscarMovimentacao } from '../../operadores/API/movimentacao/buscarMovimentacao';
import { formatarMoeda } from '../../utils/formartarMoeda'
import { usarToast } from '../../componentes/Context/toastContext';
import { editarFechamento } from "../../operadores/API/AjusteFechamento/editarFechamento";
import { ToastRadix } from '../../componentes/ui/notificacao/notificacao';

const tiposMovimentacao = [
  { value: 'saida', label: '🔻 Saída', tipo: 'saida' },
  { value: 'entrada', label: '🔺 Entrada', tipo: 'entrada' },
];

const balcaoOptions = [
  { value: 'b1', label: 'Balcão 1' },
  { value: 'b2', label: 'Balcão 2' },
];

export default function FechamentoBalcao() {
  const [duzentos, setDuzentos] = useState(0);
  const [cem, setCem] = useState(0);
  const [cinquenta, setCinquenta] = useState(0);
  const [vinte, setVinte] = useState(0);
  const [dez, setDez] = useState(0);
  const [cinco, setCinco] = useState(0);
  const [dois, setDois] = useState(0);

  const [vendaBalcao, setVendaBalcao] = useState(null);
  const [carregandoVendas, setCarregandoVendas] = useState(true);
  const [fechamentoAtual, setFechamentoAtual] = useState(null);

  const [balcao, setBalcao] = useState(balcaoOptions[0]);
  const [tipoMovimentacao, setTipoMovimentacao] = useState(tiposMovimentacao[0]);
  const [valorManutencao, setValorManutencao] = useState('');
  const [descricaoManutencao, setDescricaoManutencao] = useState('');
  const [erroFormulario, setErroFormulario] = useState('');

  const { mensagem, setMensagem } = usarToast();
  const [statusFechamento, setStatusFechamento] = useState(false);
  const [movimentacoes, setMovimentacoes] = useState([]);

  useEffect(() => {
    const dataFormatada = dataFormatadaCalendario();
    setCarregandoVendas(true);
    const buscarVendasDia = async () => {
      try {
        const dados = await buscarFechamentoBalcao({ setor: 'balcao', data: dataFormatada, vendedor: balcao.value });
        setVendaBalcao(dados);
      } catch (err) {
        console.error('Erro ao buscar vendas:', err);
      } finally {
        setCarregandoVendas(false);
      }
    };
    buscarVendasDia();
  }, [balcao]);

  useEffect(() => {
    const dataFormatada = dataFormatadaCalendario();
    const buscarFechamentoBalcaoDia = async () => {
      try {
        let fechamentoBalcao = await buscarFechamentos('balcao', { data: dataFormatada, vendedor: balcao.value });
        setFechamentoAtual(fechamentoBalcao);
        if (fechamentoBalcao == null) {
          await criarFechamento('balcao', { vendedor: balcao.value });
          fechamentoBalcao = await buscarFechamentos('balcao', { data: dataFormatada, vendedor: balcao.value });
        }
        setFechamentoAtual(fechamentoBalcao);
      } catch (error) {
        console.log(error);
        throw new Error('Erro ao buscar fechamento balcão');
      }
    };
    buscarFechamentoBalcaoDia();
  }, [balcao, statusFechamento]);

  const buscarMovimentacoes = async () => {
    try {
      const listaMovimentacoes = await buscarMovimentacao(fechamentoAtual.id);
      setMovimentacoes(listaMovimentacoes);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    buscarMovimentacoes();
  }, [fechamentoAtual]);

  const novaMovimentacao = async () => {
    if (!descricaoManutencao || typeof descricaoManutencao !== 'string') {
      setErroFormulario('Informe uma descrição para a movimentação.');
      return;
    }
    if (!valorManutencao || typeof valorManutencao !== 'number' || valorManutencao <= 0) {
      setErroFormulario('Informe um valor válido.');
      return;
    }
    const novaManutencao = {
      fechamentoId: fechamentoAtual.id,
      tipo: tipoMovimentacao.value,
      descricao: descricaoManutencao.trim(),
      valor: valorManutencao,
    };
    const movimentacao = await criarMovimentacao(novaManutencao);
    if (movimentacao) setMensagem('Movimentação cadastrada com sucesso!');
    setValorManutencao('');
    setDescricaoManutencao('');
    setTipoMovimentacao(tiposMovimentacao[0]);
    await buscarMovimentacoes();
  };

  const cancelarFormulario = () => {
    setValorManutencao('');
    setDescricaoManutencao('');
    setTipoMovimentacao(tiposMovimentacao[0]);
    setErroFormulario('');
  };

  const limparContador = () => {
    setDuzentos(0); setCem(0); setCinquenta(0);
    setVinte(0); setDez(0); setCinco(0); setDois(0);
  };

  const removerManutencao = async (id) => {
    try {
      await deletarMovimentacao(id);
      setMensagem('Movimentação excluída com sucesso!');
      await buscarMovimentacoes();
    } catch (error) {
      const erroApi = error?.response?.data.erro;
      setMensagem(erroApi?.codigo === 'MOVIMENTACAO_NOT_FOUND' ? erroApi.mensagem : 'Erro inesperado. Tente novamente.');
    }
  };

  const finalizarFechamento = async () => {
    const dados = { totalSistema: vendaBalcao?.resultado?.a_vista ?? 0, totalInformado: totalContado ?? 0 };
    try {
      await editarFechamento(fechamentoAtual.id, dados);
      setMensagem('Fechamento finalizado com sucesso!');
      setStatusFechamento(prev => !prev);
    } catch (error) {
      const erroApi = error?.response?.data.erro;
      setMensagem(erroApi ? erroApi.mensagem : 'Erro inesperado. Tente novamente.');
    }
  };

  const totalContado = duzentos * 200 + cem * 100 + cinquenta * 50 + vinte * 20 + dez * 10 + cinco * 5 + dois * 2;
  const totalNotas = duzentos + cem + cinquenta + vinte + dez + cinco + dois;
  const valorEsperado = vendaBalcao?.resultado?.a_vista ?? 0;
  const valorPix = vendaBalcao?.resultado?.pix ?? 0;
  const valorCartao = vendaBalcao?.resultado?.cartão ?? 0;
  const valorTotalMaquininha = valorPix + valorCartao;
  const totalEntradas = movimentacoes.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + m.valor, 0);
  const totalSaidas = movimentacoes.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + m.valor, 0);
  const valorFinalFechamentoAvista = valorEsperado + totalEntradas - totalSaidas;
  const diferenca = totalContado - valorFinalFechamentoAvista;

  const dataHoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <div className={styles.container}>
      <ToastRadix mensagem={mensagem} />
      <Cabecalho />

      <main className={styles.main}>

        {/* ── Cabeçalho ── */}
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <div className={styles.iconeWrapper}>
              <CalculatorIcon size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Gestão financeira</p>
              <h1 className={styles.pageTitulo}>Fechamento de Caixa</h1>
            </div>
          </div>
          <div className={styles.pageHeaderRight}>
            <span className={styles.badgeData}>{dataHoje}</span>
            <div className={styles.balcaoSelector}>
              <label className={styles.labelForm}>Balcão ativo</label>
              <Select
                classNamePrefix="custom"
                options={balcaoOptions}
                value={balcao}
                onChange={setBalcao}
                isSearchable={false}
              />
            </div>
          </div>
        </div>

        {/* ── Cards de resumo rápido ── */}
        <div className={styles.resumoCards}>
          <div className={styles.resumoCard}>
            <div className={styles.resumoCardIcon} data-color="orange">
              <TrendUpIcon size={18} weight="fill" />
            </div>
            <div>
              <p className={styles.resumoCardLabel}>Total de vendas</p>
              <strong className={styles.resumoCardValor}>{formatarMoeda(vendaBalcao?.total ?? 0)}</strong>
            </div>
          </div>
          <div className={styles.resumoCard}>
            <div className={styles.resumoCardIcon} data-color="green">
              <MoneyIcon size={18} weight="fill" />
            </div>
            <div>
              <p className={styles.resumoCardLabel}>Esperado em dinheiro</p>
              <strong className={styles.resumoCardValor}>{formatarMoeda(valorEsperado)}</strong>
            </div>
          </div>
          <div className={styles.resumoCard}>
            <div className={styles.resumoCardIcon} data-color="blue">
              <CreditCardIcon size={18} weight="fill" />
            </div>
            <div>
              <p className={styles.resumoCardLabel}>Cartão + Pix</p>
              <strong className={styles.resumoCardValor}>{formatarMoeda(valorTotalMaquininha)}</strong>
            </div>
          </div>
          <div className={styles.resumoCard}>
            <div className={styles.resumoCardIcon} data-color="purple">
              <ShoppingBagIcon size={18} weight="fill" />
            </div>
            <div>
              <p className={styles.resumoCardLabel}>Pedidos gerados</p>
              <strong className={styles.resumoCardValor}>{vendaBalcao?.quantidade ?? 0}</strong>
            </div>
          </div>
        </div>

        {/* ── Conteúdo principal ── */}
        {fechamentoAtual?.status === 'aberto' ? (

          <div className={styles.containerLados}>

            {/* COLUNA ESQUERDA: Contador de notas */}
            <div className={styles.contador}>

              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderTitle}>
                  <CurrencyDollarIcon size={20} weight="bold" className={styles.cardHeaderIcon} />
                  <h2>Contador de Notas</h2>
                </div>
                <span className={styles.badgeNotas}>
                  {totalNotas} {totalNotas === 1 ? 'nota' : 'notas'}
                </span>
              </div>

              <div className={styles.tituloTabela}>
                <span>Qtd</span>
                <span>Nota</span>
                <span>Subtotal</span>
              </div>

              <div className={styles.listaNotas}>
                <ItemContador quantidade={duzentos} nota={200} alterarQuantidade={setDuzentos} navegavel={true} />
                <ItemContador quantidade={cem} nota={100} alterarQuantidade={setCem} navegavel={true} />
                <ItemContador quantidade={cinquenta} nota={50} alterarQuantidade={setCinquenta} navegavel={true} />
                <ItemContador quantidade={vinte} nota={20} alterarQuantidade={setVinte} navegavel={true} />
                <ItemContador quantidade={dez} nota={10} alterarQuantidade={setDez} navegavel={true} />
                <ItemContador quantidade={cinco} nota={5} alterarQuantidade={setCinco} navegavel={true} />
                <ItemContador quantidade={dois} nota={2} alterarQuantidade={setDois} navegavel={true} />
              </div>

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

              {/* Conferência */}
              {totalContado > 0 && (
                <div className={styles.conferencia}>
                  <p className={styles.conferenciaTitle}>Conferência de caixa</p>

                  <div className={styles.conferenciaLinha}>
                    <span>Movimentações positivas</span>
                    <span className={styles.valorPositivo}>+{formatarMoeda(totalEntradas)}</span>
                  </div>
                  <div className={styles.conferenciaLinha}>
                    <span>Movimentações negativas</span>
                    <span className={styles.valorNegativo}>−{formatarMoeda(totalSaidas)}</span>
                  </div>

                  <div className={styles.conferenciaDivider} />

                  <div className={styles.conferenciaLinha}>
                    <span>Dinheiro esperado (à vista)</span>
                    <span className={styles.valorNeutro}>
                      {carregandoVendas ? '…' : formatarMoeda(valorFinalFechamentoAvista)}
                    </span>
                  </div>
                  <div className={styles.conferenciaLinha}>
                    <span>Diferença</span>
                    <span className={diferenca === 0 ? styles.valorOk : diferenca > 0 ? styles.valorPositivo : styles.valorNegativo}>
                      {diferenca > 0 ? '+' : ''}{formatarMoeda(diferenca)}
                      {diferenca > 0 && <em> sobra</em>}
                      {diferenca < 0 && <em> falta</em>}
                    </span>
                  </div>

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
                </div>
              )}
            </div>

            {/* COLUNA DIREITA */}
            <div className={styles.colunaManutencao}>

              {/* Card Maquininha */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderTitle}>
                    <CreditCardIcon size={20} weight="bold" className={styles.cardHeaderIcon} />
                    <h2>Vendas na Maquininha</h2>
                  </div>
                  <strong className={styles.valorDestaque}>{formatarMoeda(valorTotalMaquininha)}</strong>
                </div>
                <div className={styles.maquininhaGrid}>
                  <div className={styles.maquininhaItem}>
                    <CreditCardIcon size={20} weight="duotone" className={styles.maquininhaIcone} />
                    <div>
                      <p className={styles.maquininhaLabel}>Cartão</p>
                      <strong className={styles.maquininhaValor}>{formatarMoeda(valorCartao)}</strong>
                    </div>
                  </div>
                  <div className={styles.maquininhaDivider} />
                  <div className={styles.maquininhaItem}>
                    <DeviceMobileIcon size={20} weight="duotone" className={styles.maquininhaIcone} />
                    <div>
                      <p className={styles.maquininhaLabel}>Pix</p>
                      <strong className={styles.maquininhaValor}>{formatarMoeda(valorPix)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulário de movimentação */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderTitle}>
                    <ReceiptIcon size={20} weight="bold" className={styles.cardHeaderIcon} />
                    <h2>Movimentação de Caixa</h2>
                  </div>
                  <span className={styles.balcaoBadge}>{balcao.label}</span>
                </div>

                <div className={styles.campoForm}>
                  <label className={styles.labelForm}>Tipo de movimentação</label>
                  <Select
                    classNamePrefix="custom"
                    options={tiposMovimentacao}
                    value={tipoMovimentacao}
                    onChange={setTipoMovimentacao}
                    isSearchable={false}
                  />
                </div>

                <div className={styles.campoForm}>
                  <label className={styles.labelForm}>Valor (R$)</label>
                  <input
                    className={styles.inputValor}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={valorManutencao}
                    onChange={(e) => setValorManutencao(Number(e.target.value))}
                  />
                </div>

                <div className={styles.campoForm}>
                  <label className={styles.labelForm}>Descrição</label>
                  <textarea
                    className={styles.inputDescricao}
                    placeholder="Descreva o motivo da movimentação..."
                    value={descricaoManutencao}
                    onChange={(e) => setDescricaoManutencao(e.target.value)}
                    rows={3}
                  />
                </div>

                {erroFormulario && (
                  <div className={styles.msgErro}>{erroFormulario}</div>
                )}

                <div className={styles.containerBotoes}>
                  <button className={styles.botaoCancelar} onClick={cancelarFormulario}>
                    Cancelar
                  </button>
                  <AlertaRadix
                    titulo="Salvar movimentação"
                    descricao={`Deseja adicionar nova movimentação no caixa do ${balcao.label}?`}
                    tratar={novaMovimentacao}
                    confirmarTexto="Adicionar"
                    cancelarTexto="Cancelar"
                    trigger={
                      <button className={styles.botaoSalvar}>
                        <PlusCircleIcon size={18} weight="bold" />
                        Salvar movimentação
                      </button>
                    }
                  />
                </div>
              </div>

              {/* Lista de movimentações */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderTitle}>
                    <ClockIcon size={20} weight="bold" className={styles.cardHeaderIcon} />
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
                    <ReceiptIcon size={36} weight="duotone" className={styles.iconeVazio} />
                    <p>Nenhuma movimentação registrada</p>
                  </div>
                ) : (
                  <div className={styles.itensMovimentacao}>
                    {movimentacoes.map((m) => (
                      <div key={m.id} className={`${styles.itemMovimentacao} ${styles[`item_${m.tipo}`]}`}>
                        <div className={`${styles.itemIconeTipo} ${styles[`icone_${m.tipo}`]}`}>
                          {m.tipo === 'entrada'
                            ? <ArrowUpIcon size={14} weight="bold" />
                            : <ArrowDownIcon size={14} weight="bold" />}
                        </div>
                        <div className={styles.itemInfo}>
                          <p className={styles.itemDescricao}>{m.descricao}</p>
                          <span className={styles.itemHora}>
                            <ClockIcon size={11} />
                            {dataHoraFormatada(m.data)}
                          </span>
                        </div>
                        <strong className={`${styles.itemValor} ${styles[`valor_${m.tipo}`]}`}>
                          {m.tipo === 'saida' ? '−' : '+'} {formatarMoeda(m.valor)}
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

            </div>
          </div>

        ) : (

          /* ── CAIXA FECHADO ── */
          <div className={styles.fechadoWrapper}>
            <div className={styles.fechadoBanner}>
              <LockKeyIcon size={32} weight="fill" className={styles.fechadoIcone} />
              <div>
                <h2 className={styles.fechadoTitulo}>Caixa encerrado</h2>
                <p className={styles.fechadoSubtitulo}>{balcao.label} · Status: <strong className={styles.statusBadge}>{fechamentoAtual?.status}</strong></p>
              </div>
            </div>

            <div className={styles.fechadoGrid}>
              <div className={styles.fechadoCard}>
                <CoinsIcon size={22} weight="duotone" className={styles.fechadoCardIcone} />
                <p className={styles.fechadoCardLabel}>Total de vendas</p>
                <strong className={styles.fechadoCardValor}>{formatarMoeda(vendaBalcao?.total ?? 0)}</strong>
              </div>
              <div className={styles.fechadoCard}>
                <ShoppingBagIcon size={22} weight="duotone" className={styles.fechadoCardIcone} />
                <p className={styles.fechadoCardLabel}>Pedidos gerados</p>
                <strong className={styles.fechadoCardValor}>{vendaBalcao?.quantidade ?? 0}</strong>
              </div>
              <div className={styles.fechadoCard}>
                <MoneyIcon size={22} weight="duotone" className={styles.fechadoCardIcone} />
                <p className={styles.fechadoCardLabel}>Vendas à vista</p>
                <strong className={styles.fechadoCardValor}>{formatarMoeda(vendaBalcao?.resultado?.a_vista ?? 0)}</strong>
              </div>
              <div className={styles.fechadoCard}>
                <CreditCardIcon size={22} weight="duotone" className={styles.fechadoCardIcone} />
                <p className={styles.fechadoCardLabel}>Cartão + Pix</p>
                <strong className={styles.fechadoCardValor}>{formatarMoeda(valorTotalMaquininha)}</strong>
              </div>
              <div className={styles.fechadoCard}>
                <DeviceMobileIcon size={22} weight="duotone" className={styles.fechadoCardIcone} />
                <p className={styles.fechadoCardLabel}>Pix</p>
                <strong className={styles.fechadoCardValor}>{formatarMoeda(valorPix)}</strong>
              </div>
              <div className={`${styles.fechadoCard} ${styles.fechadoCardDestaque}`}>
                <CalculatorIcon size={22} weight="duotone" className={styles.fechadoCardIcone} />
                <p className={styles.fechadoCardLabel}>Diferença de caixa</p>
                <strong className={styles.fechadoCardValor}>{formatarMoeda(fechamentoAtual?.diferenca ?? 0)}</strong>
              </div>
            </div>
          </div>

        )}
      </main>

      <Rodape />
    </div>
  );
}
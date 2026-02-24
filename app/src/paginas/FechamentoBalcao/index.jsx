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
} from '@phosphor-icons/react';
import ItemContador from '../../componentes/ItemContador';
import { AlertaRadix } from '../../componentes/ui/alerta/alerta';
import Select from "react-select";
import { criarFechamento } from '../../operadores/API/AjusteFechamento/criarFechamento';
import { buscarMovimentacao } from '../../operadores/API/movimentacao/buscarMovimentacao';

// Tipos de movimentação de caixa.
const tiposMovimentacao = [
  { value: 'saida', label: '🔻 Saida', tipo: 'saida' },
  { value: 'entrada', label: '🔺 Entrada', tipo: 'entrada' },
];
// Descrições de balcões disponiveis.
const balcaoOptions = [
  { value: 'b1', label: 'Balcão 1' },
  { value: 'b2', label: 'Balcão 2' },
];

export default function FechamentoBalcao() {
  // --- Estados do contador de notas ---
  const [duzentos, setDuzentos] = useState(0);
  const [cem, setCem] = useState(0);
  const [cinquenta, setCinquenta] = useState(0);
  const [vinte, setVinte] = useState(0);
  const [dez, setDez] = useState(0);
  const [cinco, setCinco] = useState(0);
  const [dois, setDois] = useState(0);

  // --- Estados do painel de vendas ---
  const [vendaBalcao, setVendaBalcao] = useState(null);
  const [carregandoVendas, setCarregandoVendas] = useState(true);
  const [fechamentoAtual, setFechamentoAtual] = useState(null);

  // --- Estados do formulário de manutenção ---
  const [balcao, setBalcao] = useState(balcaoOptions[0]);
  const [tipoMovimentacao, setTipoMovimentacao] = useState(tiposMovimentacao[0]);
  const [valorManutencao, setValorManutencao] = useState('');
  const [descricaoManutencao, setDescricaoManutencao] = useState('');
  const [erroFormulario, setErroFormulario] = useState('');

  const [mensagem, setMensagem] = useState('')

  // --- Estado da lista de manutenções ---
  const [movimentacoes, setMovimentacoes] = useState([]);

  // --- Busca o total do fechamento de vendas conforme o balcão escolhido.
  useEffect(() => {
    const dataFormatada = dataFormatadaCalendario();

    setCarregandoVendas(true);

    const buscarVendasDia = async () => {
      try {
        const dados = await buscarFechamentoBalcao({
          setor: 'balcao',
          data: dataFormatada,
          vendedor: balcao.value,
        });
        setVendaBalcao(dados);
      } catch (err) {
        console.error('Erro ao buscar vendas:', err);
      } finally {
        setCarregandoVendas(false);
      }
    };

    buscarVendasDia();
  }, [balcao]);


  // --- Busca o fechamento em aberto referente ao balcao e data
  useEffect(() => {
    const dataFormatada = dataFormatadaCalendario();

    const buscarFechamentoBalcaoDia = async () => {
      try {
        // buscando fechamento
        let fechamentoBalcao = await buscarFechamentos(
          'balcao',
          {
            data: dataFormatada,
            vendedor: balcao.value,
          }
        );

        console.log('Fechamento retornado: ', fechamentoBalcao)

        setFechamentoAtual(fechamentoBalcao);

      // Se não encontrar fechamento balcão, crie! 
      if(fechamentoBalcao == null) {
        console.log('Criando fechamento balcão')
        await criarFechamento('balcao', { vendedor: balcao.value })
        fechamentoBalcao = await buscarFechamentos(
          'balcao',
          {
            data: dataFormatada,
            vendedor: balcao.value,
          }
        );
      }
      // setando o novo fechamento criado.
      setFechamentoAtual(fechamentoBalcao);

      
      } catch (error) {
        console.log(error);
        throw new Error('Erro ao buscar fechamento balcão')
      }
    }

    buscarFechamentoBalcaoDia();

  }, [balcao]);


  // --- Listar movimentações do dia referente ao balcao e data
  const buscarMovimentacoes = async () => {

      console.log(fechamentoAtual.id)
      try {
        const listaMovimentacoes = await buscarMovimentacao(
          fechamentoAtual.id
        );

        console.log('Movimentações: ', listaMovimentacoes)

        setMovimentacoes(listaMovimentacoes); 
        
      } catch (error) {
        console.log(error)
      }
  }
  useEffect(() => {
    buscarMovimentacoes();
  }, [fechamentoAtual]);


  // --- Cria uma nova movimentação de caixa
  const novaMovimentacao = async () => {

    if (!descricaoManutencao || typeof descricaoManutencao !== 'string') {
      setErroFormulario('Informa uma descrição para a movimentação.');
      return;
    }
    if (!valorManutencao || typeof valorManutencao !== 'number' || valorManutencao <= 0) {
      setErroFormulario('Informe um valor válido para valor');
      return;
    }

    const novaManutencao = {
      fechamentoId: fechamentoAtual.id,
      tipo: tipoMovimentacao.value,
      descricao: descricaoManutencao.trim(),
      valor: valorManutencao
    };

    console.log('Nova manutenção:', novaManutencao);

    const movimentacao = await criarMovimentacao(novaManutencao);

    if(movimentacao) {
      console.log('Movimentação criada com sucesso:', novaMovimentacao)
    }

      setValorManutencao('');
      setDescricaoManutencao('');
      setTipoMovimentacao(tiposMovimentacao[0])

      // chamando novamente a função de buscar movimentações.
      await buscarMovimentacoes()
  }


  // --- Cancelar formulário ---
  const cancelarFormulario = () => {
    setValorManutencao('');
    setDescricaoManutencao('');
    setTipoMovimentacao(tiposMovimentacao[0]);
    setErroFormulario('');
  };


  // --- Limpar contador ---
  const limparContador = () => {
    setDuzentos(0); setCem(0); setCinquenta(0);
    setVinte(0); setDez(0); setCinco(0); setDois(0);
  };


  // PAREI AQUI PARA AJUSTAR O BACKEND, MSG DE ERROS!!!
  // --- Remover manutenção ---
  const removerManutencao = async (id) => {
    try {
      await deletarMovimentacao(id)
      setMensagem('Manutenção de caixa excluída com sucesso!')
      
      // chamando novamente a função de buscar movimentações.
      await buscarMovimentacoes()
    } catch (error) {
      if(error.response.data.codigo === "MOVIMENTACAO_NOT_FOUND") {
        setMensagem(error.response.data.mensagem)
      }
    }
  };

  
  // --- Total contado ---
  const totalContado =
    duzentos * 200 +
    cem * 100 +
    cinquenta * 50 +
    vinte * 20 +
    dez * 10 +
    cinco * 5 +
    dois * 2;

  const totalNotas = duzentos + cem + cinquenta + vinte + dez + cinco + dois;

  const valorEsperado = vendaBalcao?.resultado?.a_vista ?? 0;
  const diferenca = totalContado - valorEsperado;

  const valorPix = vendaBalcao?.resultado?.pix ?? 0;
  const valorCartao = vendaBalcao?.resultado?.cartão ?? 0;
  const valorTotalMaquininha = valorPix + valorCartao;


  // --- Totais das manutenções ---
  const totalEntradas = movimentacoes
    .filter(m => m.tipo === 'entrada')
    .reduce((acc, m) => acc + m.valor, 0);

  const totalSaidas = movimentacoes
    .filter(m => m.tipo === 'saida')
    .reduce((acc, m) => acc + m.valor, 0);


  const valorFinalFechamentoAvista = valorEsperado + totalEntradas - totalSaidas

  // -----------------------------

  const formatarMoeda = (valor) =>
    Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className={styles.container}>
      <Cabecalho />
      <main className={styles.main}>

        {/* TÍTULO DA PÁGINA */}
        <div className={styles.tituloSection}>
          <CalculatorIcon size={32} weight="duotone" className={styles.icone} />
          <h1>Fechamento de Caixa</h1>
          <span className={styles.badgeData}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </span>
        </div>

        <div className={styles.containerLados}>

          {/* ========== COLUNA ESQUERDA: CONTADOR DE NOTAS ========== */}
          <div className={styles.contador}>
                <div className={styles.campoForm}>
                  <label className={styles.labelForm}>Balcão</label>
                  <Select
                    classNamePrefix="custom"
                    options={balcaoOptions}
                    value={balcao}
                    onChange={setBalcao}
                    isSearchable={false}
                  />
                </div>
            <h1 className={styles.valorEsperado} >Valor esperado em dinheiro: <strong>{formatarMoeda(valorEsperado)}</strong> </h1>
            <div className={styles.cabecalhoContador}>

              <h2>
                <CurrencyDollarIcon size={24} weight="bold" />
                Contador de Notas
              </h2>
              <span className={styles.badge}>
                {totalNotas} {totalNotas === 1 ? 'nota' : 'notas'}
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
              <ItemContador quantidade={duzentos} nota={200} alterarQuantidade={setDuzentos} navegavel={true} />
              <ItemContador quantidade={cem} nota={100} alterarQuantidade={setCem} navegavel={true} />
              <ItemContador quantidade={cinquenta} nota={50} alterarQuantidade={setCinquenta} navegavel={true} />
              <ItemContador quantidade={vinte} nota={20} alterarQuantidade={setVinte} navegavel={true} />
              <ItemContador quantidade={dez} nota={10} alterarQuantidade={setDez} navegavel={true} />
              <ItemContador quantidade={cinco} nota={5} alterarQuantidade={setCinco} navegavel={true} />
              <ItemContador quantidade={dois} nota={2} alterarQuantidade={setDois} navegavel={true} />
            </div>

            {/* Rodapé com total e botão limpar */}
            <div className={styles.rodapeContador}>
              <AlertaRadix
                titulo="Limpar contador"
                descricao="Você realmente deseja limpar todos os valores?"
                tratar={limparContador}
                confirmarTexto="Sim, limpar!"
                cancelarTexto="Cancelar"
                trigger={
                  <button className={styles.botaoLimpar}>
                    <EraserIcon size={18} weight="bold" />
                    Limpar
                  </button>
                }
              />
              <div className={styles.totalContado}>
                <span>Total Contado</span>
                <strong>{formatarMoeda(totalContado)}</strong>
              </div>
            </div>

            {/* Conferência com valor esperado — aparece apenas quando há notas contadas */}
            {totalContado > 0 && (
              <div className={styles.conferencia}>
                <div className={styles.linhaConferencia}>
                    <span>Movimentações positivas</span>
                    <span style={{color: '#2f9e44', fontWeight: 'bold'}}>+{formatarMoeda(totalEntradas)}</span>
                </div>
                <div className={styles.linhaConferencia} style={{marginBottom: '20px'}}>
                    <span>Movimentações negativas</span>
                    <span style={{color: '#c92a2a', fontWeight: 'bold'}}>-{formatarMoeda(totalSaidas)}</span>
                </div>
                <div className={styles.linhaConferencia}>
                  <span>Dinheiro esperado (à vista):</span>
                  <span className={styles.valorEsperado}>
                    {carregandoVendas ? '...' : formatarMoeda(valorFinalFechamentoAvista)}
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
                    {formatarMoeda(Math.abs(diferenca))}
                    {diferenca > 0 && ' (sobra)'}
                    {diferenca < 0 && ' (falta)'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ========== COLUNA DIREITA: MANUTENÇÃO DE CAIXA ========== */}
          <div className={styles.colunaManutencao}>

            {/* FORMULÁRIO DE ENTRADA */}
            <div className={styles.entradaManual}>
              {/* TOTAL DE VENDAS MAQUININHA */}
                <div className={styles.cabecalhoFormulario}>
                  <ReceiptIcon size={22} weight="duotone" className={styles.icone} />
                  <h2>Total de vendas no cartão e pix: <strong style={{color: '#e67700', marginLeft:'10px', fontSize:'22px'}}>{formatarMoeda(valorTotalMaquininha)}</strong></h2>
              </div>
              <div className={styles.maquininha}>
                <label style={{color:'#e67700', fontSize:'15px', fontWeight:'600'}}>Cartão: {formatarMoeda(valorCartao)}</label>
                <label style={{color:'#1a1f2e', fontSize:'15px', fontWeight:'600'}}>Pix: {formatarMoeda(valorPix)}</label>
              </div>
            </div>
            <div className={styles.entradaManual}>
              <div className={styles.cabecalhoFormulario}>
                <ReceiptIcon size={22} weight="duotone" className={styles.icone} />
                <h2>Movimentação de Caixa</h2>
              </div>

              <div className={styles.gridFormulario}>
                {/* Selecionar o Tipo de manutenção */}
                <div className={styles.campoForm}>
                  <strong style={{color: '#ff8c00', fontSize: '26px', marginBottom:'15px'}}> {balcao.label} </strong>
                  <label className={styles.labelForm}>Tipo</label>
                  <Select
                    classNamePrefix="custom"
                    options={tiposMovimentacao}
                    value={tipoMovimentacao}
                    onChange={setTipoMovimentacao}
                    isSearchable={false}
                  />
                </div>
              </div>

              {/* Valor */}
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

              {/* Descrição */}
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

              {/* Mensagem de erro - setErroFormulario*/}
              {erroFormulario && (
                <div className={styles.msgErro}>{erroFormulario}</div>
              )}

              {/* Botões */}
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
                        <button className={styles.botaoSalvar} title="Adicionar">
                          <PlusCircleIcon size={18} weight="bold"  />
                          Salvar movimentação.
                        </button>
                      }
                    />
              </div>

            </div>

            {/* LISTA DE MANUTENÇÕES */}
            <div className={styles.listaManutencoes}>
              <div className={styles.cabecalhoLista}>
                <h3>Movimentações do dia</h3>
                {movimentacoes.length > 0 && (
                  // Totais de manutenções positivas e negativas cadastradas.
                  <div className={styles.resumoMovimentacoes}>
                    <span className={styles.resumoEntrada}>
                      <ArrowUpIcon size={14} weight="bold" />
                      {formatarMoeda(totalEntradas)}
                    </span>
                    <span className={styles.resumoSaida}>
                      <ArrowDownIcon size={14} weight="bold" />
                      {formatarMoeda(totalSaidas)}
                    </span>
                  </div>
                )}
              </div>
              {movimentacoes.length === 0 ? (
                <div className={styles.listaVazia}>
                  <ReceiptIcon size={40} weight="duotone" className={styles.iconeVazio} />
                  <p>Nenhuma movimentação registrada ainda.</p>
                </div>
              ) : (
                <div className={styles.itensManutencao}>
                  {movimentacoes.map((m) => (
                    <div key={m.id} className={`${styles.itemManutencao} ${styles[`item_${m.tipo}`]}`}>
                      <div className={styles.itemIconeTipo}>
                        {m.tipo === 'entrada'
                          ? <ArrowUpIcon size={16} weight="bold" />
                          : m.tipo === 'saida'
                          ? <ArrowDownIcon size={16} weight="bold" />
                          : <ReceiptIcon size={16} weight="bold" />}
                      </div>
                      <div className={styles.itemInfo}>
                        <p className={styles.itemDescricao}>{m.descricao}</p>
                        <div className={styles.itemRodape}>
                          <span className={styles.itemHora}>
                            <ClockIcon size={12} />
                            {dataHoraFormatada(m.data)}
                          </span>
                          <strong className={`${styles.itemValor} ${styles[`valor_${m.tipo}`]}`}>
                            {m.tipo === 'saida' ? '- ' : '+ '}
                            {formatarMoeda(m.valor)}
                          </strong>
                        </div>
                      </div>
                      <AlertaRadix
                        titulo="Remover movimentação"
                        descricao={`Deseja remover "${m.descricao}"?`}
                        tratar={() => removerManutencao(m.id)}
                        confirmarTexto="Remover"
                        cancelarTexto="Cancelar"
                        trigger={
                          <button className={styles.botaoRemover} title="Remover">
                            <TrashIcon size={16} weight="bold" />
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
      </main>
      <Rodape />
    </div>
  );
}
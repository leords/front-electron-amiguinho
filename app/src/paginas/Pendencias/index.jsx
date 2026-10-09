import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import {
  HandCoins,
  ArrowLeft,
  Funnel,
  Receipt,
  CheckCircle,
  Clock,
  WarningCircle,
  CurrencyCircleDollar,
  Eye,
  PlusCircle,
  X,
  User,
  CalendarBlank,
  CreditCard,
  FileText,
  MagnifyingGlass,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import { lerPendencias } from "../../operadores/API/pendencia/lerPendencias";
import { obterPendencia } from "../../operadores/API/pendencia/obterPendencia";
import { criarPendencia } from "../../operadores/API/pendencia/criarPendencia";
import { criarPagamento } from "../../operadores/API/pagamento/criarPagamento";
import { LerClienteExterno } from "../../operadores/API/cliente/lerClienteExterno";
import { useFormaPagamentoExterna } from "../../hooks/useFormaPagamentoExterna";
import { usarToast } from "../../componentes/Context/toastContext";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";
import { AlertaRadix } from "../../componentes/ui/alerta/alerta";
import { formatarMoeda } from "../../utils/formartarMoeda";
import { dataHoraFormatada } from "../../utils/data";
import Spinner from "../../componentes/Spinner";

export default function Pendencias() {
  const navegar = useNavigate();
  const { mensagem, setMensagem } = usarToast();
  const { listaFormaPagamento } = useFormaPagamentoExterna();

  // Estados principais
  const [pendencias, setPendencias] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [processando, setProcessando] = useState(false);

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState("aberta"); // 'todos' | 'aberta' | 'parcial' | 'fechada'
  const [filtroAtraso, setFiltroAtraso] = useState("");
  const [buscaTexto, setBuscaTexto] = useState("");
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState("");

  // Lista de clientes para filtro e cadastro manual
  const [clientes, setClientes] = useState([]);

  // Modais
  const [pendenciaDetalhe, setPendenciaDetalhe] = useState(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  // Modal de Registrar Pagamento
  const [pendenciaParaPagar, setPendenciaParaPagar] = useState(null);
  const [valorPagamento, setValorPagamento] = useState("");
  const [formaPagamentoId, setFormaPagamentoId] = useState("");
  const [observacaoPagamento, setObservacaoPagamento] = useState("");

  // Modal de Nova Pendência Manual
  const [modalNovaPendencia, setModalNovaPendencia] = useState(false);
  const [novoClienteId, setNovoClienteId] = useState("");
  const [novoPedidoId, setNovoPedidoId] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [novosDiasVencimento, setNovosDiasVencimento] = useState("7");

  // Carregar lista de clientes
  useEffect(() => {
    const buscarClientes = async () => {
      try {
        const resultado = await LerClienteExterno();
        setClientes(Array.isArray(resultado) ? resultado : []);
      } catch (err) {
        console.error("Erro ao carregar clientes externos:", err);
      }
    };
    buscarClientes();
  }, []);

  // Carregar pendências
  const carregarPendencias = async () => {
    setCarregando(true);
    try {
      let params = {};
      if (filtroStatus && filtroStatus !== "todos") params.status = filtroStatus;
      if (filtroAtraso) params.diasVencida = filtroAtraso;
      if (clienteSelecionadoId) params.clienteId = clienteSelecionadoId;

      const resultado = await lerPendencias(params);
      setPendencias(Array.isArray(resultado) ? resultado : []);
    } catch (error) {
      setPendencias([]);
      setMensagem(error.message || "Erro ao carregar pendências");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarPendencias();
  }, [filtroStatus, filtroAtraso, clienteSelecionadoId]);

  // Abrir detalhes da pendência
  const abrirDetalhePendencia = async (pendenciaId) => {
    setCarregandoDetalhe(true);
    try {
      const detalhe = await obterPendencia(pendenciaId);
      const dadosNormalizados = detalhe?.resultado || detalhe;
      setPendenciaDetalhe(dadosNormalizados);
    } catch (err) {
      setMensagem(err.message || "Erro ao obter detalhes da pendência");
    } finally {
      setCarregandoDetalhe(false);
    }
  };

  // Abrir modal de pagamento
  const abrirModalPagamento = (pendencia) => {
    const dados = pendencia?.resultado || pendencia;
    setPendenciaParaPagar(dados);
    const saldo = Number(
      dados.saldoDevedor !== undefined
        ? dados.saldoDevedor
        : Number(dados.valor || 0) - Number(dados.valorPago || 0)
    );
    setValorPagamento(saldo.toFixed(2));
    setFormaPagamentoId(listaFormaPagamento?.[0]?.id || "");
    setObservacaoPagamento("");
  };

  // Confirmar pagamento
  const tratarConfirmarPagamento = async () => {
    if (!pendenciaParaPagar || !valorPagamento || !formaPagamentoId) {
      setMensagem("Informe o valor e a forma de pagamento.");
      return;
    }

    try {
      setProcessando(true);
      await criarPagamento({
        pendenciaId: Number(pendenciaParaPagar.id),
        valor: Number(valorPagamento),
        formaPagamentoId: Number(formaPagamentoId),
        observacao: observacaoPagamento.trim() || undefined,
      });

      setMensagem(`Pagamento de ${formatarMoeda(valorPagamento)} registrado com sucesso!`);
      const pId = pendenciaParaPagar.id;
      setPendenciaParaPagar(null);
      await carregarPendencias();
      if (pendenciaDetalhe && pendenciaDetalhe.id === pId) {
        await abrirDetalhePendencia(pId);
      }
    } catch (error) {
      setMensagem(error.message || "Erro ao registrar pagamento");
    } finally {
      setProcessando(false);
    }
  };

  // Criar pendência manual
  const tratarCriarPendenciaManual = async () => {
    if (!novoClienteId || !novoValor) {
      setMensagem("Selecione o cliente e informe o valor da pendência.");
      return;
    }

    try {
      setProcessando(true);
      await criarPendencia({
        clienteId: Number(novoClienteId),
        pedidoId: novoPedidoId ? Number(novoPedidoId) : undefined,
        valor: Number(novoValor),
        diasVencimento: Number(novosDiasVencimento) || 7,
      });

      setMensagem("Pendência criada com sucesso!");
      setModalNovaPendencia(false);
      setNovoClienteId("");
      setNovoPedidoId("");
      setNovoValor("");
      setNovosDiasVencimento("7");
      carregarPendencias();
    } catch (error) {
      setMensagem(error.message || "Erro ao criar pendência manual");
    } finally {
      setProcessando(false);
    }
  };

  // Filtragem local por texto (busca por cliente, ID ou pedido)
  const pendenciasFiltradas = pendencias.filter((p) => {
    const termo = buscaTexto.toLowerCase();
    const clienteNome = p.cliente?.nome?.toLowerCase() || "";
    const idMatch = String(p.id).includes(termo);
    const pedidoMatch = String(p.pedidoId || p.pedido?.id || "").includes(termo);
    return clienteNome.includes(termo) || idMatch || pedidoMatch;
  });

  // Cálculos de totais dos cards KPI
  const totalSaldoDevedor = pendenciasFiltradas
    .filter((p) => p.status !== "fechada")
    .reduce((soma, p) => soma + Number(p.saldoDevedor || (Number(p.valor) - Number(p.valorPago || 0))), 0);

  const totalVencidas = pendenciasFiltradas
    .filter((p) => p.estaVencida || (p.diasAtraso && Number(p.diasAtraso) > 0))
    .length;

  const totalRecebido = pendenciasFiltradas
    .reduce((soma, p) => soma + Number(p.valorPago || 0), 0);

  return (
    <div className={styles.container}>
      <ToastRadix mensagem={mensagem} />
      <Cabecalho />

      <main className={styles.principal}>
        {/* CABEÇALHO */}
        <div className={styles.tituloSection}>
          <div className={styles.containerTitulo}>
            <div className={styles.iconeWrapper}>
              <HandCoins size={24} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Contas a Receber</p>
              <h1 className={styles.pageTitulo}>Pendências da Rota Externa</h1>
            </div>
          </div>

          <button className={styles.botaoVoltar} onClick={() => navegar("/menu")}>
            <ArrowLeft size={14} weight="bold" />
            Voltar
          </button>
        </div>

        {/* CARDS DE RESUMO (KPIs) */}
        <div className={styles.cardsResumoGrid}>
          <div className={`${styles.cardResumo} ${styles.cardResumoSaldo}`}>
            <div className={styles.cardResumoIcone}>
              <CurrencyCircleDollar size={24} weight="bold" />
            </div>
            <div className={styles.cardResumoInfo}>
              <span>Saldo a Receber</span>
              <strong>{formatarMoeda(totalSaldoDevedor)}</strong>
            </div>
          </div>

          <div className={`${styles.cardResumo} ${styles.cardResumoVencidas}`}>
            <div className={styles.cardResumoIcone}>
              <WarningCircle size={24} weight="bold" />
            </div>
            <div className={styles.cardResumoInfo}>
              <span>Pendências Vencidas</span>
              <strong>{totalVencidas} faturas</strong>
            </div>
          </div>

          <div className={`${styles.cardResumo} ${styles.cardResumoRecebido}`}>
            <div className={styles.cardResumoIcone}>
              <CheckCircle size={24} weight="bold" />
            </div>
            <div className={styles.cardResumoInfo}>
              <span>Total Já Recebido</span>
              <strong>{formatarMoeda(totalRecebido)}</strong>
            </div>
          </div>
        </div>

        {/* PAINEL DE FILTROS */}
        <div className={styles.painelFiltros}>
          <div className={styles.filtrosHeader}>
            <Funnel size={16} weight="bold" />
            <span>Filtros de Pesquisa</span>
          </div>

          <div className={styles.filtrosGrid}>
            {/* BUSCA */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>
                <MagnifyingGlass size={13} weight="bold" />
                Buscar
              </label>
              <input
                className={styles.inputFiltro}
                type="text"
                placeholder="Cliente, ID ou Pedido..."
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
              />
            </div>

            {/* STATUS */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>Status</label>
              <select
                className={styles.selectFiltro}
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <option value="aberta">Abertas / Em aberto (Total e Parcial)</option>
                <option value="somente_abertas">Somente 100% em aberto</option>
                <option value="parcial">Somente pagas parcialmente</option>
                <option value="fechada">Fechadas / Quitadas</option>
                <option value="todos">Todas as pendências</option>
              </select>
            </div>

            {/* DIAS VENCIDA */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>Atraso / Vencimento</label>
              <select
                className={styles.selectFiltro}
                value={filtroAtraso}
                onChange={(e) => setFiltroAtraso(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="15">Atrasadas até 15 dias</option>
                <option value="30">Atrasadas até 30 dias</option>
                <option value="60">Atrasadas mais de 60 dias</option>
              </select>
            </div>

            {/* CLIENTE */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>Cliente Específico</label>
              <select
                className={styles.selectFiltro}
                value={clienteSelecionadoId}
                onChange={(e) => setClienteSelecionadoId(e.target.value)}
              >
                <option value="">Todos os clientes</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* BARRA DE AÇÕES */}
        <div className={styles.cabecalhoPage}>
          <span className={styles.badgeContador}>
            {pendenciasFiltradas.length}{" "}
            {pendenciasFiltradas.length === 1 ? "pendência encontrada" : "pendências encontradas"}
          </span>

          <button
            className={styles.botaoNovaPendencia}
            onClick={() => setModalNovaPendencia(true)}
          >
            <PlusCircle size={18} weight="bold" />
            Nova Pendência Manual
          </button>
        </div>

        {/* TABELA DE PENDÊNCIAS */}
        <div className={styles.card}>
          {carregando ? (
            <div className={styles.estadoVazio}>
              <Spinner />
              <p>Carregando pendências financeiras...</p>
            </div>
          ) : pendenciasFiltradas.length === 0 ? (
            <div className={styles.estadoVazio}>
              <Receipt size={48} weight="duotone" className={styles.iconeVazio} />
              <p>Nenhuma pendência financeira encontrada</p>
              <span>Ajuste os filtros de status ou cliente</span>
            </div>
          ) : (
            <div className={styles.tabelaWrapper}>
              <div className={`${styles.tituloLista} ${styles.gridPendencias}`}>
                <span>ID</span>
                <span>Cliente</span>
                <span>Pedido</span>
                <span>Valor Total</span>
                <span>Valor Pago</span>
                <span>Saldo Devedor</span>
                <span>Vencimento</span>
                <span>Status</span>
                <span style={{ textAlign: "center" }}>Ações</span>
              </div>

              <div className={styles.lista}>
                {pendenciasFiltradas.map((p) => {
                  const saldo = Number(
                    p.saldoDevedor !== undefined
                      ? p.saldoDevedor
                      : Number(p.valor || 0) - Number(p.valorPago || 0)
                  );
                  const isAtrasado = p.estaVencida || Number(p.diasAtraso || 0) > 0;

                  return (
                    <div key={p.id} className={`${styles.itemRow} ${styles.gridPendencias}`}>
                      <span className={styles.idCell}>#{p.id}</span>
                      <span className={styles.nomeClienteCell}>
                        {p.cliente?.nome || p.nomeCliente || "-"}
                      </span>
                      <span>{p.pedidoId || p.pedido?.id ? `#${p.pedidoId || p.pedido?.id}` : "-"}</span>
                      <span>{formatarMoeda(p.valor || 0)}</span>
                      <span className={styles.valorPagoTexto}>{formatarMoeda(p.valorPago || 0)}</span>
                      <span className={styles.saldoDevedorTexto}>{formatarMoeda(saldo)}</span>
                      <span className={isAtrasado && p.status !== "fechada" ? styles.vencimentoAtrasado : ""}>
                        {p.dataVencimento
                          ? new Date(p.dataVencimento).toLocaleDateString("pt-BR")
                          : "-"}
                        {isAtrasado && p.status !== "fechada" && (
                          <small className={styles.badgeDiasAtraso}>
                            {p.diasAtraso ? ` (${p.diasAtraso}d atraso)` : " (Vencida)"}
                          </small>
                        )}
                      </span>
                      <span>
                        <span
                          className={`${styles.badgeStatus} ${
                            p.status === "fechada"
                              ? styles.badgeFechada
                              : p.status === "parcial"
                              ? styles.badgeParcial
                              : styles.badgeAberta
                          }`}
                        >
                          {p.status === "fechada"
                            ? "Quitada"
                            : p.status === "parcial"
                            ? "Parcial"
                            : "Aberta"}
                        </span>
                      </span>
                      <span className={styles.colunaAcoes}>
                        {/* DETALHES */}
                        <button
                          className={styles.botaoVisualizar}
                          onClick={() => abrirDetalhePendencia(p.id)}
                          title="Ver histórico de pagamentos"
                        >
                          <Eye size={16} weight="bold" />
                        </button>

                        {/* RECEBER PAGAMENTO */}
                        {p.status !== "fechada" && saldo > 0 && (
                          <button
                            className={styles.botaoReceber}
                            onClick={() => abrirModalPagamento(p)}
                            title="Registrar pagamento"
                          >
                            <CurrencyCircleDollar size={16} weight="bold" />
                            Receber
                          </button>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* MODAL DE HISTÓRICO / DETALHES DA PENDÊNCIA */}
        {pendenciaDetalhe && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <div>
                  <p className={styles.modalSubtitulo}>Histórico & Detalhes</p>
                  <h2 className={styles.modalTitulo}>Pendência #{pendenciaDetalhe.id}</h2>
                </div>
                <button
                  className={styles.modalCloseBtn}
                  onClick={() => setPendenciaDetalhe(null)}
                >
                  <X size={20} weight="bold" />
                </button>
              </div>

              <div className={styles.modalInfoGrid}>
                <div className={styles.modalInfoItem}>
                  <span>Cliente:</span>
                  <strong>{pendenciaDetalhe.cliente?.nome || "-"}</strong>
                </div>
                <div className={styles.modalInfoItem}>
                  <span>Pedido de Origem:</span>
                  <strong>
                    {pendenciaDetalhe.pedidoId ? `#${pendenciaDetalhe.pedidoId}` : "Manual / Direta"}
                  </strong>
                </div>
                <div className={styles.modalInfoItem}>
                  <span>Valor Total:</span>
                  <strong>{formatarMoeda(pendenciaDetalhe.valor || 0)}</strong>
                </div>
                <div className={styles.modalInfoItem}>
                  <span>Saldo Restante:</span>
                  <strong className={styles.saldoDevedorTexto}>
                    {formatarMoeda(
                      pendenciaDetalhe.saldoDevedor !== undefined
                        ? pendenciaDetalhe.saldoDevedor
                        : Number(pendenciaDetalhe.valor || 0) - Number(pendenciaDetalhe.valorPago || 0)
                    )}
                  </strong>
                </div>
              </div>

              {/* LISTA DE PAGAMENTOS RECEBIDOS */}
              <div className={styles.modalPagamentosWrapper}>
                <h4 className={styles.modalSecaoTitulo}>
                  Histórico de Pagamentos Recebidos ({pendenciaDetalhe.pagamentos?.length || 0})
                </h4>

                <div className={styles.modalTabela}>
                  {pendenciaDetalhe.pagamentos && pendenciaDetalhe.pagamentos.length > 0 ? (
                    pendenciaDetalhe.pagamentos.map((pag) => (
                      <div key={pag.id} className={styles.modalPagamentoRow}>
                        <div>
                          <strong>{formatarMoeda(pag.valor)}</strong>
                          <span className={styles.modalFormaPag}>
                            {" "}• {pag.formaPagamento?.nome || "Forma de Pagamento"}
                          </span>
                        </div>
                        <div className={styles.modalPagamentoDireita}>
                          <span className={styles.modalDataPag}>
                            {dataHoraFormatada(pag.data || pag.criadoEm || pag.createdAt)}
                          </span>
                          <span
                            className={`${styles.badgeStatus} ${
                              pag.status === "baixado" ? styles.badgeFechada : styles.badgeParcial
                            }`}
                          >
                            {pag.status === "baixado" ? "Baixado" : "Coletado na Rota"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={styles.semPagamentosModal}>Nenhum pagamento registrado até o momento.</p>
                  )}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={styles.botaoFecharModal}
                  onClick={() => setPendenciaDetalhe(null)}
                >
                  Fechar
                </button>

                {pendenciaDetalhe.status !== "fechada" && (
                  <button
                    className={styles.botaoReceberModal}
                    onClick={() => {
                      abrirModalPagamento(pendenciaDetalhe);
                    }}
                  >
                    <CurrencyCircleDollar size={16} weight="bold" />
                    Registrar Novo Pagamento
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE REGISTRAR PAGAMENTO */}
        {pendenciaParaPagar && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContentPequeno}>
              <div className={styles.modalHeader}>
                <div>
                  <p className={styles.modalSubtitulo}>Recebimento de Pendência</p>
                  <h2 className={styles.modalTitulo}>
                    Registrar Pagamento (#{pendenciaParaPagar.id})
                  </h2>
                </div>
                <button
                  className={styles.modalCloseBtn}
                  onClick={() => setPendenciaParaPagar(null)}
                >
                  <X size={20} weight="bold" />
                </button>
              </div>

              <div className={styles.modalFormBody}>
                <div className={styles.infoClienteBox}>
                  <span>Cliente:</span>
                  <strong>{pendenciaParaPagar.cliente?.nome || "Cliente"}</strong>
                </div>

                {/* VALOR DO PAGAMENTO */}
                <div className={styles.divInputModal}>
                  <label className={styles.filtroLabel}>
                    <CurrencyCircleDollar size={14} />
                    Valor a Pagar (R$) *
                  </label>
                  <input
                    className={styles.inputModal}
                    type="number"
                    step="0.01"
                    value={valorPagamento}
                    onChange={(e) => setValorPagamento(e.target.value)}
                  />
                  <small className={styles.ajudaSaldo}>
                    Saldo total restante:{" "}
                    {formatarMoeda(
                      pendenciaParaPagar.saldoDevedor !== undefined
                        ? pendenciaParaPagar.saldoDevedor
                        : Number(pendenciaParaPagar.valor || 0) - Number(pendenciaParaPagar.valorPago || 0)
                    )}
                  </small>
                </div>

                {/* FORMA DE PAGAMENTO */}
                <div className={styles.divInputModal}>
                  <label className={styles.filtroLabel}>
                    <CreditCard size={14} />
                    Forma de Pagamento *
                  </label>
                  <select
                    className={styles.inputModal}
                    value={formaPagamentoId}
                    onChange={(e) => setFormaPagamentoId(e.target.value)}
                  >
                    {listaFormaPagamento?.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* OBSERVAÇÃO */}
                <div className={styles.divInputModal}>
                  <label className={styles.filtroLabel}>
                    <FileText size={14} />
                    Observação / Recibo
                  </label>
                  <input
                    className={styles.inputModal}
                    type="text"
                    placeholder="Ex: Pago em dinheiro pelo gerente..."
                    value={observacaoPagamento}
                    onChange={(e) => setObservacaoPagamento(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={styles.botaoFecharModal}
                  onClick={() => setPendenciaParaPagar(null)}
                >
                  Cancelar
                </button>

                <AlertaRadix
                  titulo="Confirmar Recebimento"
                  descricao={`Confirmar registro do pagamento no valor de ${formatarMoeda(valorPagamento || 0)}?`}
                  tratar={tratarConfirmarPagamento}
                  confirmarTexto="Confirmar Pagamento"
                  cancelarTexto="Voltar"
                  trigger={
                    <button
                      className={styles.botaoConfirmarModal}
                      disabled={processando || !valorPagamento}
                    >
                      <CheckCircle size={16} weight="fill" />
                      Confirmar Pagamento
                    </button>
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE NOVA PENDÊNCIA MANUAL */}
        {modalNovaPendencia && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContentPequeno}>
              <div className={styles.modalHeader}>
                <div>
                  <p className={styles.modalSubtitulo}>Cadastro Manual</p>
                  <h2 className={styles.modalTitulo}>Criar Nova Pendência</h2>
                </div>
                <button
                  className={styles.modalCloseBtn}
                  onClick={() => setModalNovaPendencia(false)}
                >
                  <X size={20} weight="bold" />
                </button>
              </div>

              <div className={styles.modalFormBody}>
                {/* CLIENTE */}
                <div className={styles.divInputModal}>
                  <label className={styles.filtroLabel}>
                    <User size={14} />
                    Cliente *
                  </label>
                  <select
                    className={styles.inputModal}
                    value={novoClienteId}
                    onChange={(e) => setNovoClienteId(e.target.value)}
                  >
                    <option value="">Selecione um cliente...</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* VALOR */}
                <div className={styles.divInputModal}>
                  <label className={styles.filtroLabel}>
                    <CurrencyCircleDollar size={14} />
                    Valor (R$) *
                  </label>
                  <input
                    className={styles.inputModal}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={novoValor}
                    onChange={(e) => setNovoValor(e.target.value)}
                  />
                </div>

                {/* DIAS PARA VENCIMENTO */}
                <div className={styles.divInputModal}>
                  <label className={styles.filtroLabel}>
                    <CalendarBlank size={14} />
                    Dias para Vencimento
                  </label>
                  <input
                    className={styles.inputModal}
                    type="number"
                    value={novosDiasVencimento}
                    onChange={(e) => setNovosDiasVencimento(e.target.value)}
                  />
                </div>

                {/* PEDIDO ID OPCIONAL */}
                <div className={styles.divInputModal}>
                  <label className={styles.filtroLabel}>
                    <Receipt size={14} />
                    ID do Pedido (opcional)
                  </label>
                  <input
                    className={styles.inputModal}
                    type="number"
                    placeholder="Ex: 1234"
                    value={novoPedidoId}
                    onChange={(e) => setNovoPedidoId(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={styles.botaoFecharModal}
                  onClick={() => setModalNovaPendencia(false)}
                >
                  Cancelar
                </button>

                <AlertaRadix
                  titulo="Cadastrar Pendência"
                  descricao={`Confirmar cadastro da pendência no valor de ${formatarMoeda(novoValor || 0)} para o cliente selecionado?`}
                  tratar={tratarCriarPendenciaManual}
                  confirmarTexto="Cadastrar"
                  cancelarTexto="Voltar"
                  trigger={
                    <button
                      className={styles.botaoConfirmarModal}
                      disabled={processando || !novoClienteId || !novoValor}
                    >
                      <PlusCircle size={16} weight="bold" />
                      Cadastrar Pendência
                    </button>
                  }
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <Rodape />
    </div>
  );
}

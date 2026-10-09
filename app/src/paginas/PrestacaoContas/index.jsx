import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import {
  Receipt,
  ArrowLeft,
  Funnel,
  CheckCircle,
  Clock,
  CurrencyCircleDollar,
  CalendarBlank,
  Square,
  CheckSquare,
  X,
  CreditCard,
  User,
  FloppyDisk,
  PencilSimple,
  MagnifyingGlass,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import { lerPagamentos } from "../../operadores/API/pagamento/lerPagamentos";
import { baixarPagamento } from "../../operadores/API/pagamento/baixarPagamento";
import { usarToast } from "../../componentes/Context/toastContext";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";
import { AlertaRadix } from "../../componentes/ui/alerta/alerta";
import { formatarMoeda } from "../../utils/formartarMoeda";
import { dataFormatadaCalendario, dataHoraFormatada } from "../../utils/data";
import Spinner from "../../componentes/Spinner";

export default function PrestacaoContas() {
  const navegar = useNavigate();
  const { mensagem, setMensagem } = usarToast();

  // Estados
  const [pagamentos, setPagamentos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [processando, setProcessando] = useState(false);

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState("coletado"); // 'coletado' | 'baixado' | 'todos'
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [buscaTexto, setBuscaTexto] = useState("");

  // Seleção em lote
  const [selecionadosIds, setSelecionadosIds] = useState([]);

  // Modal de Edição / Ajuste
  const [pagamentoEdicao, setPagamentoEdicao] = useState(null);
  const [novoValor, setNovoValor] = useState("");
  const [novaObservacao, setNovaObservacao] = useState("");

  // Inicializar datas
  useEffect(() => {
    setDataInicio(dataFormatadaCalendario());
    setDataFim(dataFormatadaCalendario());
  }, []);

  // Buscar pagamentos
  const carregarPagamentos = async () => {
    if (!dataInicio || !dataFim) return;
    setCarregando(true);
    try {
      let params = {
        dataInicio,
        dataFim,
      };
      if (filtroStatus !== "todos") {
        params.status = filtroStatus;
      }

      const resultado = await lerPagamentos(params);
      setPagamentos(Array.isArray(resultado) ? resultado : []);
      setSelecionadosIds([]);
    } catch (error) {
      setPagamentos([]);
      setMensagem(error.message || "Erro ao buscar pagamentos para conferência");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarPagamentos();
  }, [filtroStatus, dataInicio, dataFim]);

  // Alternar seleção
  const alternarSelecao = (id) => {
    setSelecionadosIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Alternar todos pendentes de baixa
  const alternarTodos = () => {
    const coletados = pagamentosFiltrados.filter((p) => p.status === "coletado");
    if (selecionadosIds.length === coletados.length && coletados.length > 0) {
      setSelecionadosIds([]);
    } else {
      setSelecionadosIds(coletados.map((p) => p.id));
    }
  };

  // Baixa Individual
  const tratarBaixaIndividual = async (id) => {
    try {
      setProcessando(true);
      await baixarPagamento(id, { status: "baixado" });
      setMensagem(`Pagamento #${id} baixado e conferido com sucesso!`);
      carregarPagamentos();
    } catch (error) {
      setMensagem(error.message || "Erro ao dar baixa no pagamento");
    } finally {
      setProcessando(false);
    }
  };

  // Baixa em Lote
  const tratarBaixaEmLote = async () => {
    if (selecionadosIds.length === 0) return;

    try {
      setProcessando(true);
      const promessas = selecionadosIds.map((id) =>
        baixarPagamento(id, { status: "baixado" })
      );
      await Promise.all(promessas);
      setMensagem(`${selecionadosIds.length} pagamentos baixados com sucesso!`);
      setSelecionadosIds([]);
      carregarPagamentos();
    } catch (error) {
      setMensagem(error.message || "Erro ao dar baixa nos pagamentos selecionados");
    } finally {
      setProcessando(false);
    }
  };

  // Abrir edição
  const abrirEdicaoPagamento = (p) => {
    setPagamentoEdicao(p);
    setNovoValor(p.valor?.toString() || "");
    setNovaObservacao(p.observacao || "");
  };

  // Salvar edição
  const tratarSalvarEdicao = async () => {
    if (!pagamentoEdicao || !novoValor) return;

    try {
      setProcessando(true);
      await baixarPagamento(pagamentoEdicao.id, {
        valor: Number(novoValor),
        observacao: novaObservacao.trim() || undefined,
        status: pagamentoEdicao.status,
      });
      setMensagem(`Pagamento #${pagamentoEdicao.id} atualizado com sucesso!`);
      setPagamentoEdicao(null);
      carregarPagamentos();
    } catch (error) {
      setMensagem(error.message || "Erro ao atualizar pagamento");
    } finally {
      setProcessando(false);
    }
  };

  // Filtragem local
  const pagamentosFiltrados = pagamentos.filter((p) => {
    const termo = buscaTexto.toLowerCase();
    const clienteNome = (p.pendencia?.cliente?.nome || p.clienteNome || "").toLowerCase();
    const vendedorNome = (p.usuario?.nome || p.vendedor || "").toLowerCase();
    const formaNome = (p.formaPagamento?.nome || "").toLowerCase();
    const idMatch = String(p.id).includes(termo);
    const pendenciaMatch = String(p.pendenciaId || "").includes(termo);
    return (
      clienteNome.includes(termo) ||
      vendedorNome.includes(termo) ||
      formaNome.includes(termo) ||
      idMatch ||
      pendenciaMatch
    );
  });

  // Cálculos de Totais KPI
  const totalColetadoPendente = pagamentosFiltrados
    .filter((p) => p.status === "coletado")
    .reduce((soma, p) => soma + Number(p.valor || 0), 0);

  const qtdColetados = pagamentosFiltrados.filter((p) => p.status === "coletado").length;

  const totalJaBaixado = pagamentosFiltrados
    .filter((p) => p.status === "baixado")
    .reduce((soma, p) => soma + Number(p.valor || 0), 0);

  return (
    <div className={styles.container}>
      <ToastRadix mensagem={mensagem} />
      <Cabecalho />

      <main className={styles.principal}>
        {/* CABEÇALHO */}
        <div className={styles.tituloSection}>
          <div className={styles.containerTitulo}>
            <div className={styles.iconeWrapper}>
              <Receipt size={24} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Financeiro & Auditoria</p>
              <h1 className={styles.pageTitulo}>Prestação de Contas (Rota Externa)</h1>
            </div>
          </div>

          <button className={styles.botaoVoltar} onClick={() => navegar("/menu")}>
            <ArrowLeft size={14} weight="bold" />
            Voltar
          </button>
        </div>

        {/* CARDS KPI */}
        <div className={styles.cardsResumoGrid}>
          <div className={`${styles.cardResumo} ${styles.cardResumoPendente}`}>
            <div className={styles.cardResumoIcone}>
              <Clock size={24} weight="bold" />
            </div>
            <div className={styles.cardResumoInfo}>
              <span>A Conferir / Baixar</span>
              <strong>{formatarMoeda(totalColetadoPendente)}</strong>
              <small>{qtdColetados} pagamentos coletados na rua</small>
            </div>
          </div>

          <div className={`${styles.cardResumo} ${styles.cardResumoBaixado}`}>
            <div className={styles.cardResumoIcone}>
              <CheckCircle size={24} weight="bold" />
            </div>
            <div className={styles.cardResumoInfo}>
              <span>Total Baixado (Conferido)</span>
              <strong>{formatarMoeda(totalJaBaixado)}</strong>
              <small>Confirmados no caixa da empresa</small>
            </div>
          </div>
        </div>

        {/* PAINEL DE FILTROS */}
        <div className={styles.painelFiltros}>
          <div className={styles.filtrosHeader}>
            <Funnel size={16} weight="bold" />
            <span>Filtros de Conferência</span>
          </div>

          <div className={styles.filtrosGrid}>
            {/* DATA INICIAL */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>
                <CalendarBlank size={13} weight="bold" />
                Data Inicial
              </label>
              <input
                className={styles.inputFiltro}
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            {/* DATA FINAL */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>
                <CalendarBlank size={13} weight="bold" />
                Data Final
              </label>
              <div className={styles.dataFimGroup}>
                <input
                  className={styles.inputFiltro}
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
                <button
                  className={styles.botaoHoje}
                  onClick={() => setDataFim(dataFormatadaCalendario())}
                  type="button"
                >
                  Hoje
                </button>
              </div>
            </div>

            {/* STATUS */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>Status</label>
              <select
                className={styles.selectFiltro}
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <option value="coletado">Coletados (Pendentes de Baixa)</option>
                <option value="baixado">Baixados / Conferidos</option>
                <option value="todos">Todos os Pagamentos</option>
              </select>
            </div>

            {/* BUSCA TEXTO */}
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>
                <MagnifyingGlass size={13} weight="bold" />
                Buscar
              </label>
              <input
                className={styles.inputFiltro}
                type="text"
                placeholder="Cliente, Vendedor, Forma..."
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* BARRA DE AÇÕES EM LOTE */}
        <div className={styles.cabecalhoPage}>
          <div className={styles.acoesLoteEsquerda}>
            <button className={styles.botaoSelecionarTodos} onClick={alternarTodos}>
              {selecionadosIds.length > 0 ? (
                <>
                  <CheckSquare size={16} weight="bold" /> Desmarcar ({selecionadosIds.length})
                </>
              ) : (
                <>
                  <Square size={16} weight="bold" /> Selecionar Todos Pendentes
                </>
              )}
            </button>

            {selecionadosIds.length > 0 && (
              <AlertaRadix
                titulo="Baixa em Lote"
                descricao={`Deseja confirmar a baixa de ${selecionadosIds.length} pagamentos selecionados? O dinheiro será conferido no caixa.`}
                tratar={tratarBaixaEmLote}
                confirmarTexto="Dar Baixa em Lote"
                cancelarTexto="Voltar"
                trigger={
                  <button className={styles.botaoBaixaLote} disabled={processando}>
                    <CheckCircle size={16} weight="bold" />
                    Dar Baixa Selecionados ({selecionadosIds.length})
                  </button>
                }
              />
            )}
          </div>

          <span className={styles.badgeContador}>
            {pagamentosFiltrados.length}{" "}
            {pagamentosFiltrados.length === 1 ? "registro" : "registros"}
          </span>
        </div>

        {/* TABELA DE PAGAMENTOS */}
        <div className={styles.card}>
          {carregando ? (
            <div className={styles.estadoVazio}>
              <Spinner />
              <p>Carregando pagamentos para conferência...</p>
            </div>
          ) : pagamentosFiltrados.length === 0 ? (
            <div className={styles.estadoVazio}>
              <Receipt size={48} weight="duotone" className={styles.iconeVazio} />
              <p>Nenhum pagamento encontrado para conferência</p>
              <span>Ajuste as datas ou selecione outro status de visualização</span>
            </div>
          ) : (
            <div className={styles.tabelaWrapper}>
              <div className={`${styles.tituloLista} ${styles.gridPagamentos}`}>
                <span style={{ textAlign: "center" }}>Sel.</span>
                <span>ID</span>
                <span>Data / Hora</span>
                <span>Cliente / Pendência</span>
                <span>Forma Pagamento</span>
                <span>Recebido Por</span>
                <span>Valor (R$)</span>
                <span>Status</span>
                <span style={{ textAlign: "center" }}>Ações</span>
              </div>

              <div className={styles.lista}>
                {pagamentosFiltrados.map((p) => {
                  const isChecked = selecionadosIds.includes(p.id);
                  const isColetado = p.status === "coletado";

                  return (
                    <div
                      key={p.id}
                      className={`${styles.itemRow} ${styles.gridPagamentos} ${
                        isChecked ? styles.rowSelecionada : ""
                      }`}
                    >
                      <span style={{ textAlign: "center" }}>
                        {isColetado ? (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => alternarSelecao(p.id)}
                            className={styles.checkbox}
                          />
                        ) : (
                          <span style={{ color: "#dee2e6" }}>-</span>
                        )}
                      </span>

                      <span className={styles.idCell}>#{p.id}</span>
                      <span>{dataHoraFormatada(p.criadoEm || p.createdAt)}</span>
                      <span>
                        <strong className={styles.destaqueTexto}>
                          {p.pendencia?.cliente?.nome || p.clienteNome || "Cliente"}
                        </strong>
                        <small className={styles.subTexto}>
                          {p.pendenciaId ? ` (Pendência #${p.pendenciaId})` : ""}
                        </small>
                      </span>
                      <span>{p.formaPagamento?.nome || "Forma"}</span>
                      <span>{p.usuario?.nome || p.vendedor || "Vendedor Externo"}</span>
                      <span className={styles.valorDestaque}>{formatarMoeda(p.valor || 0)}</span>
                      <span>
                        <span
                          className={`${styles.badgeStatus} ${
                            p.status === "baixado" ? styles.badgeBaixado : styles.badgeColetado
                          }`}
                        >
                          {p.status === "baixado" ? "Baixado" : "Coletado na Rua"}
                        </span>
                      </span>

                      <span className={styles.colunaAcoes}>
                        {/* EDITAR */}
                        <button
                          className={styles.botaoEditar}
                          onClick={() => abrirEdicaoPagamento(p)}
                          title="Ajustar valor ou observação"
                        >
                          <PencilSimple size={15} weight="bold" />
                        </button>

                        {/* BAIXA INDIVIDUAL */}
                        {isColetado && (
                          <AlertaRadix
                            titulo="Conferir Pagamento"
                            descricao={`Confirmar a baixa do pagamento #${p.id} no valor de ${formatarMoeda(
                              p.valor || 0
                            )}?`}
                            tratar={() => tratarBaixaIndividual(p.id)}
                            confirmarTexto="Dar Baixa"
                            cancelarTexto="Voltar"
                            trigger={
                              <button
                                className={styles.botaoDarBaixa}
                                title="Dar baixa no caixa"
                                disabled={processando}
                              >
                                <CheckCircle size={15} weight="bold" />
                                Baixar
                              </button>
                            }
                          />
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* MODAL DE EDIÇÃO DO PAGAMENTO */}
        {pagamentoEdicao && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <div>
                  <p className={styles.modalSubtitulo}>Ajuste de Recebimento</p>
                  <h2 className={styles.modalTitulo}>Editar Pagamento #{pagamentoEdicao.id}</h2>
                </div>
                <button
                  className={styles.modalCloseBtn}
                  onClick={() => setPagamentoEdicao(null)}
                >
                  <X size={20} weight="bold" />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.divInputModal}>
                  <label className={styles.filtroLabel}>
                    <CurrencyCircleDollar size={14} />
                    Valor do Pagamento (R$)
                  </label>
                  <input
                    className={styles.inputModal}
                    type="number"
                    step="0.01"
                    value={novoValor}
                    onChange={(e) => setNovoValor(e.target.value)}
                  />
                </div>

                <div className={styles.divInputModal}>
                  <label className={styles.filtroLabel}>Observação / Recibo</label>
                  <input
                    className={styles.inputModal}
                    type="text"
                    value={novaObservacao}
                    placeholder="Observações do recebimento..."
                    onChange={(e) => setNovaObservacao(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={styles.botaoFecharModal}
                  onClick={() => setPagamentoEdicao(null)}
                >
                  Cancelar
                </button>

                <AlertaRadix
                  titulo="Salvar Ajuste"
                  descricao={`Deseja atualizar as informações do pagamento #${pagamentoEdicao.id}?`}
                  tratar={tratarSalvarEdicao}
                  confirmarTexto="Salvar"
                  cancelarTexto="Voltar"
                  trigger={
                    <button className={styles.botaoSalvarModal} disabled={processando}>
                      <FloppyDisk size={16} weight="fill" />
                      Salvar Ajustes
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

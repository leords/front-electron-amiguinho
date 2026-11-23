import { useState, useEffect, useMemo, useCallback } from "react";
import {
  X,
  Plus,
  MagnifyingGlass,
  Funnel,
  Calendar,
  User,
  Check,
  HandCoins,
  ArrowLeft,
  ArrowClockwise,
  CheckCircle,
  Receipt,
  Tag,
} from "@phosphor-icons/react";
import styles from "./styles.module.css";
import { formatarMoeda } from "../../utils/formartarMoeda";
import { lerPendencias } from "../../operadores/API/pendencia/lerPendencias";
import { criarPagamento } from "../../operadores/API/pagamento/criarPagamento";
import { baixarPagamento } from "../../operadores/API/pagamento/baixarPagamento";
import Spinner from "../Spinner";

const FORMAS_PADRAO = [
  { id: 1, nome: "Dinheiro" },
  { id: 2, nome: "PIX" },
  { id: 3, nome: "Cartão de Crédito" },
  { id: 4, nome: "Cartão de Débito" },
  { id: 5, nome: "Cheque" },
  { id: 6, nome: "Vale / A Prazo" },
];

/**
 * Normalização textual sem acentos e em maiúsculas
 */
const normalizarTexto = (txt) => {
  if (!txt) return "";
  return String(txt)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};


/**
 * Retorna o saldo devedor real da pendência
 */
const obterSaldoPendencia = (pend) => {
  if (!pend) return 0;
  if (pend.saldoDevedor !== undefined && pend.saldoDevedor !== null) {
    return Math.max(0, Number(pend.saldoDevedor));
  }
  if (pend.saldo !== undefined && pend.saldo !== null) {
    return Math.max(0, Number(pend.saldo));
  }
  const valorTotal = Number(pend.valorTotal || pend.valor || 0);
  const pago = Number(pend.valorPago || 0);
  return Math.max(0, valorTotal - pago);
};

export default function ModalCriarPagamento({
  aberto,
  aoFechar,
  aoConfirmarSucesso,
  vendedores = [],
  formasPagamento = FORMAS_PADRAO,
  clientesMap = new Map(),
}) {
  // ── Estados Principais ──
  const [pendencias, setPendencias] = useState([]);
  const [carregandoPendencias, setCarregandoPendencias] = useState(false);
  const [processandoAcao, setProcessandoAcao] = useState(false);
  const [erroLocal, setErroLocal] = useState("");

  // ── Pendência Selecionada (ao clicar nela, abre o formulário de pagamento) ──
  const [pendenciaSelecionada, setPendenciaSelecionada] = useState(null);

  // ── Formulário de Pagamento (Idêntico ao da Prestação de Contas) ──
  const [formGerarPagamento, setFormGerarPagamento] = useState({
    valor: "",
    formaPagamentoId: "1",
    observacao: "",
  });

  // ── Filtros da Listagem de Pendências ──
  const [filtroVendedor, setFiltroVendedor] = useState("TODOS");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [termoBusca, setTermoBusca] = useState("");

  // Carregar pendências em aberto ao abrir o modal
  const carregarPendenciasEmAberto = useCallback(async () => {
    setCarregandoPendencias(true);
    setErroLocal("");
    try {
      const lista = await lerPendencias({ status: "ativas" });
      setPendencias(Array.isArray(lista) ? lista : []);
    } catch (err) {
      console.error("Erro ao carregar pendências em aberto:", err);
      setErroLocal(err.message || "Não foi possível carregar as pendências.");
      setPendencias([]);
    } finally {
      setCarregandoPendencias(false);
    }
  }, []);

  useEffect(() => {
    if (aberto) {
      setPendenciaSelecionada(null);
      setErroLocal("");
      carregarPendenciasEmAberto();
    }
  }, [aberto, carregarPendenciasEmAberto]);

  // Fechar com tecla Escape
  useEffect(() => {
    if (!aberto) return;
    const tratarKeyDown = (e) => {
      if (e.key === "Escape" && !processandoAcao) {
        if (pendenciaSelecionada) {
          setPendenciaSelecionada(null);
        } else {
          aoFechar();
        }
      }
    };
    window.addEventListener("keydown", tratarKeyDown);
    return () => window.removeEventListener("keydown", tratarKeyDown);
  }, [aberto, processandoAcao, pendenciaSelecionada, aoFechar]);

  // Atalhos rápidos de data
  const aplicarAtalhoData = (tipo) => {
    const hoje = new Date();
    const formatarData = (d) => d.toISOString().split("T")[0];

    if (tipo === "hoje") {
      const dataStr = formatarData(hoje);
      setDataInicio(dataStr);
      setDataFim(dataStr);
    } else if (tipo === "semana") {
      const diaSemana = hoje.getDay();
      const diffSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
      const segunda = new Date(hoje);
      segunda.setDate(hoje.getDate() + diffSegunda);
      setDataInicio(formatarData(segunda));
      setDataFim(formatarData(hoje));
    } else if (tipo === "mes") {
      const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      setDataInicio(formatarData(primeiroDia));
      setDataFim(formatarData(hoje));
    } else if (tipo === "limpar") {
      setDataInicio("");
      setDataFim("");
    }
  };

  const limparFiltros = () => {
    setFiltroVendedor("TODOS");
    setDataInicio("");
    setDataFim("");
    setTermoBusca("");
  };

  // Filtragem dinâmica das pendências
  const pendenciasFiltradas = useMemo(() => {
    const vendFiltro = normalizarTexto(filtroVendedor);
    const busca = termoBusca.toLowerCase().trim();

    return pendencias.filter((pend) => {
      const st = String(pend.status || "").toLowerCase().trim();
      if (st === "fechada" || st === "cancelada") return false;

      const saldoNum = obterSaldoPendencia(pend);
      if (saldoNum <= 0.001) return false;

      // ── Vendedor ──
      const clienteId = Number(pend.clienteId || pend.cliente?.id);
      const clienteObj =
        pend.cliente || (clienteId && clientesMap.get(clienteId));

      const rawVendedor =
        clienteObj?.vendedor ||
        pend.vendedor ||
        "";
      const clienteVendedor = normalizarTexto(rawVendedor);

      if (vendFiltro !== "TODOS") {
        const bateVendedor =
          clienteVendedor === vendFiltro ||
          clienteVendedor.includes(vendFiltro) ||
          vendFiltro.includes(clienteVendedor);
        if (!bateVendedor) return false;
      }

      // ── Período de Datas (Data de Criação ou Vencimento) ──
      const dataPend = pend.dataVencimento || pend.createdAt || pend.data;
      if (dataPend) {
        const diaISO = new Date(dataPend).toISOString().split("T")[0];
        if (dataInicio && diaISO < dataInicio) return false;
        if (dataFim && diaISO > dataFim) return false;
      }

      // ── Busca Textual (Cliente, CPF/CNPJ, ID Pendência, Pedido) ──
      if (busca) {
        const idStr = String(pend.id || "");
        const pedStr = String(pend.pedidoId || pend.pedido?.id || "");
        const clienteNome = (
          clienteObj?.nome ||
          clienteObj?.nomeFantasia ||
          pend.cliente?.nome ||
          pend.cliente?.nomeFantasia ||
          pend.nomeCliente ||
          ""
        ).toLowerCase();
        const doc = String(clienteObj?.cpf || clienteObj?.cnpj || "");

        const bate =
          idStr.includes(busca) ||
          pedStr.includes(busca) ||
          clienteNome.includes(busca) ||
          doc.includes(busca);

        if (!bate) return false;
      }

      return true;
    });
  }, [pendencias, filtroVendedor, dataInicio, dataFim, termoBusca, clientesMap]);

  // Ação: Selecionar Pendência para abrir o componente de Gerar Pagamento
  const tratarSelecionarPendencia = (pend) => {
    setPendenciaSelecionada(pend);
    const saldo = obterSaldoPendencia(pend);
    const primeiraFormaId =
      formasPagamento && formasPagamento.length > 0
        ? String(formasPagamento[0].id)
        : "1";

    setFormGerarPagamento({
      valor: saldo > 0 ? saldo.toFixed(2) : "",
      formaPagamentoId: primeiraFormaId,
      observacao: "",
    });
    setErroLocal("");
  };

  // Ação: Confirmar e Salvar Pagamento com status 'baixado'
  const tratarSalvarPagamento = async (e) => {
    e.preventDefault();
    if (!pendenciaSelecionada || processandoAcao) return;

    const valorNum = parseFloat(
      String(formGerarPagamento.valor).replace(",", ".")
    );

    if (!valorNum || valorNum <= 0) {
      setErroLocal("Informe um valor de pagamento válido e maior que zero.");
      return;
    }

    try {
      setProcessandoAcao(true);
      setErroLocal("");

      const clienteId =
        pendenciaSelecionada.clienteId ||
        pendenciaSelecionada.cliente?.id;

      const vendedorNome =
        pendenciaSelecionada.cliente?.vendedor ||
        pendenciaSelecionada.vendedor ||
        undefined;

      // 2.2 - Criar já com status 'baixado' e relacionado à pendência
      const resposta = await criarPagamento({
        pendenciaId: Number(pendenciaSelecionada.id),
        clienteId: clienteId ? Number(clienteId) : undefined,
        valor: valorNum,
        formaPagamentoId: Number(formGerarPagamento.formaPagamentoId),
        status: "baixado",
        vendedor: vendedorNome,
        observacao: formGerarPagamento.observacao.trim() || undefined,
      });

      const pagamentoCriado =
        resposta?.resultado?.pagamento || resposta?.pagamento || resposta;

      // Garantia de segurança: se o backend tiver criado com outro status, força baixa imediata
      if (pagamentoCriado?.id && pagamentoCriado?.status !== "baixado") {
        try {
          await baixarPagamento(pagamentoCriado.id, { status: "baixado" });
        } catch (errBaixa) {
          console.warn("Failsafe de baixa do pagamento:", errBaixa);
        }
      }

      const formaNome =
        formasPagamento.find(
          (f) => Number(f.id) === Number(formGerarPagamento.formaPagamentoId)
        )?.nome || "Forma";

      const clienteNome =
        pendenciaSelecionada.cliente?.nome ||
        pendenciaSelecionada.cliente?.nomeFantasia ||
        pendenciaSelecionada.nomeCliente ||
        "Cliente";

      const mensagemSucesso = `Pagamento de ${formatarMoeda(
        valorNum
      )} (${formaNome}) baixado com sucesso para ${clienteNome} (Pendência #${
        pendenciaSelecionada.id
      })!`;

      if (aoConfirmarSucesso) {
        aoConfirmarSucesso({
          mensagem: mensagemSucesso,
          pagamento: pagamentoCriado,
        });
      }

      aoFechar();
    } catch (err) {
      console.error("Erro ao registrar pagamento da pendência:", err);
      setErroLocal(err.message || "Erro ao registrar pagamento com baixa.");
    } finally {
      setProcessandoAcao(false);
    }
  };

  if (!aberto) return null;

  return (
    <div className={styles.modalOverlay} onClick={aoFechar}>
      <div
        className={`${styles.modalContent} ${
          pendenciaSelecionada ? styles.modalContentPequeno : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── CABEÇALHO ── */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderTituloWrapper}>
            <div className={styles.iconeHeaderWrapper}>
              <HandCoins size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.modalSubtitulo}>
                {pendenciaSelecionada
                  ? `Pendência #${pendenciaSelecionada.id}`
                  : "Controle de Pendências em Aberto"}
              </p>
              <h2 className={styles.modalTitulo}>
                {pendenciaSelecionada
                  ? "Gerar Pagamento"
                  : "Criar Pagamento da Rota"}
              </h2>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            {pendenciaSelecionada && (
              <button
                type="button"
                className={styles.btnVoltarTopo}
                onClick={() => setPendenciaSelecionada(null)}
                title="Voltar para a lista de pendências"
              >
                <ArrowLeft size={13} weight="bold" />
                <span>Voltar</span>
              </button>
            )}

            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={aoFechar}
              title="Fechar"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* ── CORPO: ETAPA 1 (LISTAGEM DE PENDÊNCIAS EM ABERTO) ── */}
        {!pendenciaSelecionada && (
          <div className={styles.modalBody}>
            {/* Painel de Filtros */}
            <div className={styles.painelFiltros}>
              <div className={styles.filtrosLinhaTopo}>
                <span className={styles.filtrosTitulo}>
                  <Funnel size={13} weight="bold" />
                  Filtros de Pendências
                </span>
                <button
                  type="button"
                  className={styles.btnLimparFiltros}
                  onClick={limparFiltros}
                  title="Limpar todos os filtros"
                >
                  <X size={12} weight="bold" />
                  <span>Limpar Filtros</span>
                </button>
              </div>

              <div className={styles.filtrosGrid}>
                {/* 1. Vendedor */}
                <div className={styles.filtroGrupo}>
                  <label className={styles.filtroLabel}>
                    <User size={12} weight="bold" />
                    Vendedor / Motorista:
                  </label>
                  <select
                    className={styles.selectFiltro}
                    value={filtroVendedor}
                    onChange={(e) => setFiltroVendedor(e.target.value)}
                  >
                    <option value="TODOS">Todos os vendedores</option>
                    {vendedores.map((v) => (
                      <option
                        key={v.id || v.nome}
                        value={v.nome.toUpperCase()}
                      >
                        {v.nome.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Período de Datas */}
                <div className={styles.filtroGrupo}>
                  <label className={styles.filtroLabel}>
                    <Calendar size={12} weight="bold" />
                    Período (Início / Fim):
                  </label>
                  <div className={styles.periodoInputsWrapper}>
                    <input
                      type="date"
                      className={styles.inputFiltro}
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      title="Data Inicial"
                    />
                    <input
                      type="date"
                      className={styles.inputFiltro}
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      title="Data Final"
                    />
                  </div>
                  <div className={styles.botoesAtalhosData}>
                    <button
                      type="button"
                      className={styles.btnAtalho}
                      onClick={() => aplicarAtalhoData("hoje")}
                    >
                      Hoje
                    </button>
                    <button
                      type="button"
                      className={styles.btnAtalho}
                      onClick={() => aplicarAtalhoData("semana")}
                    >
                      Semana
                    </button>
                    <button
                      type="button"
                      className={styles.btnAtalho}
                      onClick={() => aplicarAtalhoData("mes")}
                    >
                      Mês
                    </button>
                  </div>
                </div>

                {/* 3. Busca por texto */}
                <div className={styles.filtroGrupo}>
                  <label className={styles.filtroLabel}>
                    <MagnifyingGlass size={12} weight="bold" />
                    Busca por Cliente ou ID:
                  </label>
                  <div className={styles.barraBuscaWrapper}>
                    <MagnifyingGlass
                      size={15}
                      className={styles.inputBuscaIcone}
                      weight="bold"
                    />
                    <input
                      type="text"
                      className={styles.inputBusca}
                      placeholder="Cliente, CPF/CNPJ, #ID da pendência ou pedido..."
                      value={termoBusca}
                      onChange={(e) => setTermoBusca(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contagem e Atualização */}
            <div className={styles.resumoContagem}>
              <span>
                Mostrando{" "}
                <strong>{pendenciasFiltradas.length}</strong> pendência(s) em aberto
              </span>
              <button
                type="button"
                className={styles.btnLimparFiltros}
                onClick={carregarPendenciasEmAberto}
                disabled={carregandoPendencias}
                title="Recarregar pendências do servidor"
              >
                <ArrowClockwise size={12} weight="bold" />
                <span>Atualizar</span>
              </button>
            </div>

            {/* Mensagem de Erro (se houver) */}
            {erroLocal && (
              <div
                style={{
                  background: "#fff5f5",
                  border: "1px solid #ffc9c9",
                  color: "#c92a2a",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {erroLocal}
              </div>
            )}

            {/* Lista de Pendências */}
            <div className={styles.listaPendencias}>
              {carregandoPendencias ? (
                <div className={styles.estadoVazio}>
                  <Spinner />
                  <p>Buscando pendências em aberto...</p>
                </div>
              ) : pendenciasFiltradas.length === 0 ? (
                <div className={styles.estadoVazio}>
                  <Receipt size={40} weight="duotone" color="#868e96" />
                  <p>Nenhuma pendência em aberto encontrada.</p>
                  <span>
                    Ajuste os filtros de vendedor e período ou limpe o termo de
                    busca.
                  </span>
                </div>
              ) : (
                pendenciasFiltradas.map((pend) => {
                  const clienteId = Number(pend.clienteId || pend.cliente?.id);
                  const clienteInfo =
                    pend.cliente ||
                    (clienteId && clientesMap.get(clienteId));

                  const clienteNome =
                    clienteInfo?.nome ||
                    clienteInfo?.nomeFantasia ||
                    pend.nomeCliente ||
                    "Cliente Não Identificado";

                  const vendedorNome =
                    clienteInfo?.vendedor ||
                    pend.vendedor ||
                    "Não informado";

                  const atendimentoDia =
                    clienteInfo?.atendimento ||
                    pend.atendimento ||
                    "";

                  const saldoRestante = obterSaldoPendencia(pend);
                  const valorTotal = Number(pend.valorTotal || pend.valor || 0);

                  const dataExibicao =
                    pend.dataVencimento || pend.createdAt || pend.data;

                  return (
                    <div
                      key={pend.id}
                      className={styles.itemPendenciaCard}
                      onClick={() => tratarSelecionarPendencia(pend)}
                      title="Clique para gerar o pagamento desta pendência"
                    >
                      <div className={styles.pendenciaInfo}>
                        <div className={styles.pendenciaHeaderLinha}>
                          <span className={styles.pendenciaId}>
                            #{pend.id}
                          </span>
                          <span className={styles.pendenciaCliente}>
                            {clienteNome}
                          </span>

                          <span
                            className={styles.badgeTag}
                            title="Vendedor Responsável"
                          >
                            <User size={10} weight="bold" />
                            {vendedorNome}
                          </span>

                          {atendimentoDia && (
                            <span
                              className={styles.badgeTag}
                              title="Dia de Atendimento da Rota"
                            >
                              <Calendar size={10} weight="bold" />
                              {atendimentoDia}
                            </span>
                          )}

                          {pend.pedidoId && (
                            <span
                              className={styles.badgeTag}
                              title="Pedido Vinculado"
                            >
                              <Tag size={10} weight="bold" />
                              Pedido #{pend.pedidoId}
                            </span>
                          )}
                        </div>

                        <div className={styles.pendenciaDetalhes}>
                          {dataExibicao && (
                            <span>
                              <strong>Vencimento:</strong>{" "}
                              {new Date(dataExibicao).toLocaleDateString(
                                "pt-BR"
                              )}
                            </span>
                          )}
                          <span>
                            <strong>Valor Total:</strong>{" "}
                            {formatarMoeda(valorTotal)}
                          </span>
                          {Number(pend.valorPago) > 0 && (
                            <span>
                              <strong>Já Pago:</strong>{" "}
                              {formatarMoeda(pend.valorPago)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={styles.pendenciaValores}>
                        <span className={styles.saldoRestanteLabel}>
                          Saldo em Aberto
                        </span>
                        <span className={styles.saldoRestante}>
                          {formatarMoeda(saldoRestante)}
                        </span>
                      </div>

                      <button
                        type="button"
                        className={styles.btnSelecionarPendencia}
                        onClick={(e) => {
                          e.stopPropagation();
                          tratarSelecionarPendencia(pend);
                        }}
                      >
                        <HandCoins size={14} weight="bold" />
                        <span>Gerar pagamento</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── CORPO: ETAPA 2 (COMPONENTE DE GERAR PAGAMENTO - IDÊNTICO À PRESTAÇÃO DE CONTAS) ── */}
        {pendenciaSelecionada && (
          <form onSubmit={tratarSalvarPagamento}>
            <div className={styles.modalBody}>
              {/* Destaque com Cliente e Saldo */}
              <div className={styles.modalInfoDestaque}>
                <div className={styles.modalInfoDestaqueItem}>
                  <span>Cliente:</span>
                  <strong>
                    {pendenciaSelecionada.cliente?.nome ||
                      pendenciaSelecionada.cliente?.nomeFantasia ||
                      pendenciaSelecionada.nomeCliente ||
                      "Cliente"}
                  </strong>
                </div>
                <div
                  className={styles.modalInfoDestaqueItem}
                  style={{ textAlign: "right" }}
                >
                  <span>Saldo em Aberto:</span>
                  <strong style={{ color: "#c92a2a" }}>
                    {formatarMoeda(obterSaldoPendencia(pendenciaSelecionada))}
                  </strong>
                </div>
              </div>

              {/* Aviso de Baixa Imediata */}
              <div className={styles.badgeAvisoBaixa}>
                <CheckCircle size={18} weight="fill" />
                <span>
                  Este pagamento será registrado como <strong>BAIXADO</strong> e
                  dará baixa imediata na pendência (total ou parcial).
                </span>
              </div>

              {/* Mensagem de Erro (se houver) */}
              {erroLocal && (
                <div
                  style={{
                    background: "#fff5f5",
                    border: "1px solid #ffc9c9",
                    color: "#c92a2a",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {erroLocal}
                </div>
              )}

              {/* Valor do Pagamento */}
              <div className={styles.divInputModal}>
                <label>Valor do Pagamento (R$):</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  className={styles.inputModal}
                  value={formGerarPagamento.valor}
                  onChange={(e) =>
                    setFormGerarPagamento({
                      ...formGerarPagamento,
                      valor: e.target.value,
                    })
                  }
                  autoFocus
                />
              </div>

              {/* Forma de Pagamento */}
              <div className={styles.divInputModal}>
                <label>Forma de Pagamento:</label>
                <select
                  className={styles.selectModal}
                  value={formGerarPagamento.formaPagamentoId}
                  onChange={(e) =>
                    setFormGerarPagamento({
                      ...formGerarPagamento,
                      formaPagamentoId: e.target.value,
                    })
                  }
                >
                  {formasPagamento.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Observação (Opcional) */}
              <div className={styles.divInputModal}>
                <label>Observação (Opcional):</label>
                <input
                  type="text"
                  placeholder="Ex: Recebido no balcão / rota..."
                  className={styles.inputModal}
                  value={formGerarPagamento.observacao}
                  onChange={(e) =>
                    setFormGerarPagamento({
                      ...formGerarPagamento,
                      observacao: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Rodapé da Etapa 2 */}
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnCancelarModal}
                onClick={() => setPendenciaSelecionada(null)}
                disabled={processandoAcao}
              >
                Voltar à Lista
              </button>
              <button
                type="submit"
                className={styles.btnSalvarModal}
                disabled={processandoAcao}
              >
                <Check size={16} weight="bold" />
                <span>
                  {processandoAcao ? "Baixando..." : "Confirmar e Baixar"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

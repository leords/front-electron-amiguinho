import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import {
  Barcode,
  ArrowLeft,
  ArrowClockwise,
  MagnifyingGlass,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  Motorcycle,
  CurrencyDollar,
  Receipt,
  User,
  MapPin,
  Calendar,
  X,
  CreditCard,
} from "@phosphor-icons/react";
import { formatarMoeda } from "../../utils/formartarMoeda";
import { lerBoletos } from "../../operadores/API/boleto/lerBoletos";
import { usarToast } from "../../componentes/Context/toastContext";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";
import ModalBaixaBoleto from "../../componentes/ModalBaixaBoleto";
import ModalCancelarBoleto from "../../componentes/ModalCancelarBoleto";

// Utilitário para formatar datas no padrão brasileiro
const formatarDataHora = (dataString) => {
  if (!dataString) return "-";
  try {
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return "-";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(data);
  } catch {
    return "-";
  }
};

export default function Boletos() {
  const navegar = useNavigate();
  const { mensagem, setMensagem } = usarToast();

  // Estados de dados e carregamento
  const [boletos, setBoletos] = useState([]);
  const [carregando, setCarregando] = useState(false);

  // Filtros
  const [statusAba, setStatusAba] = useState("pendente"); // 'pendente' | 'pago' | 'cancelado' | 'todos'
  const [filtroSetor, setFiltroSetor] = useState("todos"); // 'todos' | 'delivery' | 'externo'
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [termoBusca, setTermoBusca] = useState("");

  // Modais
  const [modalBaixaAberto, setModalBaixaAberto] = useState(false);
  const [modalCancelarAberto, setModalCancelarAberto] = useState(false);
  const [boletoSelecionado, setBoletoSelecionado] = useState(null);

  // Buscar boletos da API
  const carregarBoletos = useCallback(async () => {
    setCarregando(true);
    try {
      const filtros = {};
      // Não restringimos o status na API para que os cards de resumo e contadores de abas
      // sempre reflitam a totalidade real do período/setor
      if (filtroSetor !== "todos") filtros.setor = filtroSetor;
      if (dataInicio) filtros.dataInicio = dataInicio;
      if (dataFim) filtros.dataFim = dataFim;
      if (termoBusca.trim()) filtros.termo = termoBusca.trim();

      const resposta = await lerBoletos(filtros);
      const lista = Array.isArray(resposta)
        ? resposta
        : Array.isArray(resposta?.resultado)
        ? resposta.resultado
        : [];

      setBoletos(lista);
    } catch (error) {
      console.error("Erro ao carregar boletos:", error);
      setBoletos([]);
      setMensagem(error.message || "Erro ao consultar lista de boletos");
    } finally {
      setCarregando(false);
    }
  }, [filtroSetor, dataInicio, dataFim, termoBusca, setMensagem]);

  // Carrega ao montar ou alterar filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      carregarBoletos();
    }, 250); // Pequeno debounce para digitação de busca

    return () => clearTimeout(timer);
  }, [carregarBoletos]);

  // Contadores por Status para exibir nas abas
  const contadoresStatus = useMemo(() => {
    if (!Array.isArray(boletos)) {
      return { pendente: 0, pago: 0, cancelado: 0, todos: 0 };
    }
    const pendente = boletos.filter(
      (b) => String(b.status).toLowerCase() === "pendente"
    ).length;
    const pago = boletos.filter(
      (b) => String(b.status).toLowerCase() === "pago"
    ).length;
    const cancelado = boletos.filter(
      (b) => String(b.status).toLowerCase() === "cancelado"
    ).length;
    return { pendente, pago, cancelado, todos: boletos.length };
  }, [boletos]);

  // Boletos filtrados pela aba de status
  const boletosFiltrados = useMemo(() => {
    if (!Array.isArray(boletos)) return [];
    if (statusAba === "todos") return boletos;
    return boletos.filter(
      (b) => String(b.status).toLowerCase() === statusAba
    );
  }, [boletos, statusAba]);

  // Contadores e Totais dos Cards de Resumo
  const totaisCards = useMemo(() => {
    if (!Array.isArray(boletos)) {
      return {
        abertoValor: 0,
        abertoQtd: 0,
        pagoValor: 0,
        pagoQtd: 0,
        externoValor: 0,
        externoQtd: 0,
        deliveryValor: 0,
        deliveryQtd: 0,
      };
    }

    let abertoValor = 0;
    let abertoQtd = 0;
    let pagoValor = 0;
    let pagoQtd = 0;
    let externoValor = 0;
    let externoQtd = 0;
    let deliveryValor = 0;
    let deliveryQtd = 0;

    boletos.forEach((b) => {
      const valor = Number(b.valor) || 0;
      const status = String(b.status || "").toLowerCase();
      const isDelivery = Boolean(b.pedidoDeliveryId || b.pedidoDelivery);

      if (status === "pendente") {
        abertoValor += valor;
        abertoQtd += 1;
      } else if (status === "pago") {
        pagoValor += valor;
        pagoQtd += 1;
      }

      if (isDelivery) {
        deliveryValor += valor;
        deliveryQtd += 1;
      } else {
        externoValor += valor;
        externoQtd += 1;
      }
    });

    return {
      abertoValor,
      abertoQtd,
      pagoValor,
      pagoQtd,
      externoValor,
      externoQtd,
      deliveryValor,
      deliveryQtd,
    };
  }, [boletos]);

  // Abrir modal de baixa
  const tratarAbrirBaixa = (boleto) => {
    setBoletoSelecionado(boleto);
    setModalBaixaAberto(true);
  };

  // Abrir modal de cancelamento
  const tratarAbrirCancelar = (boleto) => {
    setBoletoSelecionado(boleto);
    setModalCancelarAberto(true);
  };

  // Voltar ao menu principal
  const tratarVoltarMenu = () => {
    navegar("/menu");
  };

  return (
    <div className={styles.container}>
      <ToastRadix mensagem={mensagem} />
      <Cabecalho />

      <main className={styles.principal}>
        {/* CABEÇALHO DA PÁGINA */}
        <div className={styles.tituloSection}>
          <div className={styles.containerTitulo}>
            <div className={styles.iconeWrapper}>
              <Barcode size={24} weight="bold" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Financeiro</p>
              <h1 className={styles.pageTitulo}>Controle de Boletos</h1>
            </div>
          </div>

          <button className={styles.botaoVoltar} onClick={tratarVoltarMenu}>
            <ArrowLeft size={14} weight="bold" />
            Voltar
          </button>
        </div>

        {/* CARDS DE RESUMO (TOPO) */}
        <div className={styles.gradeResumos}>
          {/* TOTAL EM ABERTO */}
          <div className={`${styles.cardResumo} ${styles.pendente}`}>
            <div className={styles.cardIconeWrapper}>
              <Clock size={24} weight="fill" />
            </div>
            <div className={styles.cardConteudo}>
              <span className={styles.cardRotulo}>Total em Aberto</span>
              <strong className={styles.cardValor}>
                {formatarMoeda(totaisCards.abertoValor)}
              </strong>
              <span className={styles.cardSubinfo}>
                {totaisCards.abertoQtd} boleto(s) pendente(s)
              </span>
            </div>
          </div>

          {/* TOTAL BAIXADO / PAGO */}
          <div className={`${styles.cardResumo} ${styles.pago}`}>
            <div className={styles.cardIconeWrapper}>
              <CheckCircle size={24} weight="fill" />
            </div>
            <div className={styles.cardConteudo}>
              <span className={styles.cardRotulo}>Total Compensado</span>
              <strong className={styles.cardValor}>
                {formatarMoeda(totaisCards.pagoValor)}
              </strong>
              <span className={styles.cardSubinfo}>
                {totaisCards.pagoQtd} boleto(s) liquidado(s)
              </span>
            </div>
          </div>

          {/* VENDAS EXTERNAS */}
          <div className={`${styles.cardResumo} ${styles.externo}`}>
            <div className={styles.cardIconeWrapper}>
              <Truck size={24} weight="fill" />
            </div>
            <div className={styles.cardConteudo}>
              <span className={styles.cardRotulo}>Canal Externo</span>
              <strong className={styles.cardValor}>
                {formatarMoeda(totaisCards.externoValor)}
              </strong>
              <span className={styles.cardSubinfo}>
                {totaisCards.externoQtd} boleto(s) emitido(s)
              </span>
            </div>
          </div>

          {/* DELIVERY */}
          <div className={`${styles.cardResumo} ${styles.delivery}`}>
            <div className={styles.cardIconeWrapper}>
              <Motorcycle size={24} weight="fill" />
            </div>
            <div className={styles.cardConteudo}>
              <span className={styles.cardRotulo}>Canal Delivery</span>
              <strong className={styles.cardValor}>
                {formatarMoeda(totaisCards.deliveryValor)}
              </strong>
              <span className={styles.cardSubinfo}>
                {totaisCards.deliveryQtd} boleto(s) emitido(s)
              </span>
            </div>
          </div>
        </div>

        {/* BARRA DE FILTROS E BUSCA */}
        <div className={styles.containerFiltros}>
          {/* ABAS DE STATUS */}
          <div className={styles.abasStatus}>
            <button
              type="button"
              className={`${styles.abaStatus} ${
                statusAba === "pendente" ? styles.ativa : ""
              }`}
              onClick={() => setStatusAba("pendente")}
            >
              <Clock size={16} weight="bold" />
              Pendentes
              <span className={styles.badgeQtdAba}>
                {contadoresStatus.pendente}
              </span>
            </button>

            <button
              type="button"
              className={`${styles.abaStatus} ${
                statusAba === "pago" ? styles.ativa : ""
              }`}
              onClick={() => setStatusAba("pago")}
            >
              <CheckCircle size={16} weight="bold" />
              Pagos
              <span className={styles.badgeQtdAba}>
                {contadoresStatus.pago}
              </span>
            </button>

            <button
              type="button"
              className={`${styles.abaStatus} ${
                statusAba === "cancelado" ? styles.ativa : ""
              }`}
              onClick={() => setStatusAba("cancelado")}
            >
              <XCircle size={16} weight="bold" />
              Cancelados
              <span className={styles.badgeQtdAba}>
                {contadoresStatus.cancelado}
              </span>
            </button>

            <button
              type="button"
              className={`${styles.abaStatus} ${
                statusAba === "todos" ? styles.ativa : ""
              }`}
              onClick={() => setStatusAba("todos")}
            >
              <Receipt size={16} weight="bold" />
              Todos
              <span className={styles.badgeQtdAba}>
                {contadoresStatus.todos}
              </span>
            </button>
          </div>

          {/* FILTROS ADICIONAIS */}
          <div className={styles.linhaFiltros}>
            {/* BUSCA TEXTUAL */}
            <div className={styles.buscaWrapper}>
              <MagnifyingGlass
                size={18}
                weight="bold"
                className={styles.iconeBusca}
              />
              <input
                type="text"
                className={styles.inputBusca}
                placeholder="Buscar por cliente, vendedor ou cidade..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
              />
            </div>

            {/* FILTRO DE CANAL/SETOR */}
            <select
              className={styles.selectFiltro}
              value={filtroSetor}
              onChange={(e) => setFiltroSetor(e.target.value)}
            >
              <option value="todos">Canal: Todos</option>
              <option value="delivery">Canal: Delivery</option>
              <option value="externo">Canal: Externo</option>
            </select>

            {/* FILTRO DE DATAS */}
            <div className={styles.filtroDatas}>
              <Calendar size={15} weight="bold" color="#868e96" />
              <input
                type="date"
                className={styles.inputData}
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                title="Data inicial"
              />
              <span className={styles.separadorData}>até</span>
              <input
                type="date"
                className={styles.inputData}
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                title="Data final"
              />
              {(dataInicio || dataFim) && (
                <button
                  type="button"
                  className={styles.botaoLimparDatas}
                  onClick={() => {
                    setDataInicio("");
                    setDataFim("");
                  }}
                  title="Limpar datas"
                >
                  <X size={14} weight="bold" />
                </button>
              )}
            </div>

            {/* BOTÃO ATUALIZAR */}
            <button
              type="button"
              className={styles.botaoRecarregar}
              onClick={carregarBoletos}
              disabled={carregando}
              title="Atualizar boletos"
            >
              <ArrowClockwise
                size={16}
                weight="bold"
                className={carregando ? styles.spin : ""}
              />
              Atualizar
            </button>
          </div>
        </div>

        {/* TABELA PRINCIPAL DE BOLETOS */}
        <div className={styles.tabelaContainer}>
          {carregando ? (
            <div className={styles.estadoCarregando}>
              <ArrowClockwise size={32} weight="bold" className={styles.spin} />
              <p>Carregando boletos bancários...</p>
            </div>
          ) : boletosFiltrados.length === 0 ? (
            <div className={styles.estadoVazio}>
              <Barcode size={48} weight="duotone" />
              <p>Nenhum boleto encontrado</p>
              <span>Tente ajustar os filtros ou pesquisar por outro termo.</span>
            </div>
          ) : (
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th style={{ width: "48px", textAlign: "center" }}>Canal</th>
                  <th>Cliente</th>
                  <th>Vendedor</th>
                  <th>Valor</th>
                  <th>Emissão</th>
                  <th>Status</th>
                  <th>Compensação / Auditoria</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {boletosFiltrados.map((boleto) => {
                  const isDelivery = Boolean(
                    boleto.pedidoDeliveryId || boleto.pedidoDelivery
                  );
                  const pedidoObj = isDelivery
                    ? boleto.pedidoDelivery
                    : boleto.pedidoExterno;
                  const clienteObj = pedidoObj?.cliente;
                  const clienteNome =
                    clienteObj?.nome || "CLIENTE NÃO IDENTIFICADO";
                  const clienteLocal = [clienteObj?.bairro, clienteObj?.cidade]
                    .filter(Boolean)
                    .join(" - ");
                  const clienteTelefone = clienteObj?.telefone;

                  const vendedorNome = pedidoObj?.vendedor || "-";

                  const statusStr = String(boleto.status || "").toLowerCase();
                  const isPendente = statusStr === "pendente";
                  const isPago = statusStr === "pago";
                  const isCancelado = statusStr === "cancelado";

                  return (
                    <tr key={boleto.id}>
                      {/* CANAL */}
                      <td style={{ textAlign: "center", width: "48px" }}>
                        {isDelivery ? (
                          <span
                            className={styles.badgeCanalDeliveryIcone}
                            title="Delivery"
                          >
                            <Motorcycle size={16} weight="fill" />
                          </span>
                        ) : (
                          <span
                            className={styles.badgeCanalExternoIcone}
                            title="Externo"
                          >
                            <Truck size={16} weight="fill" />
                          </span>
                        )}
                      </td>

                      {/* CLIENTE */}
                      <td>
                        <div className={styles.clienteColuna}>
                          <span className={styles.clienteNome}>
                            {clienteNome}
                          </span>
                          {(clienteLocal || clienteTelefone) && (
                            <span className={styles.clienteSubinfo}>
                              {clienteLocal && (
                                <>
                                  <MapPin size={12} weight="bold" />
                                  {clienteLocal}
                                </>
                              )}
                              {clienteTelefone && (
                                <span>• {clienteTelefone}</span>
                              )}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* VENDEDOR */}
                      <td>{vendedorNome}</td>

                      {/* VALOR */}
                      <td>
                        <strong className={styles.valorBoleto}>
                          {formatarMoeda(boleto.valor)}
                        </strong>
                      </td>

                      {/* EMISSÃO */}
                      <td style={{ whiteSpace: "nowrap" }}>
                        {formatarDataHora(boleto.criadoEm)}
                      </td>

                      {/* STATUS */}
                      <td>
                        {isPendente && (
                          <span className={styles.statusPendente}>
                            <Clock size={13} weight="fill" />
                            PENDENTE
                          </span>
                        )}
                        {isPago && (
                          <span className={styles.statusPago}>
                            <CheckCircle size={13} weight="fill" />
                            PAGO
                          </span>
                        )}
                        {isCancelado && (
                          <span className={styles.statusCancelado}>
                            <XCircle size={13} weight="fill" />
                            CANCELADO
                          </span>
                        )}
                      </td>

                      {/* AUDITORIA / BAIXA */}
                      <td>
                        {isPago ? (
                          <div className={styles.auditoriaColuna}>
                            <span className={styles.auditoriaData}>
                              Pago em: {formatarDataHora(boleto.dataPagamento)}
                            </span>
                            {boleto.usuarioBaixa?.nome && (
                              <span className={styles.auditoriaUsuario}>
                                Baixado por: {boleto.usuarioBaixa.nome}
                              </span>
                            )}
                            {boleto.observacao && (
                              <span
                                className={styles.auditoriaObs}
                                title={boleto.observacao}
                              >
                                Obs: {boleto.observacao}
                              </span>
                            )}
                          </div>
                        ) : isCancelado ? (
                          <div className={styles.auditoriaColuna}>
                            <span style={{ color: "#c92a2a", fontWeight: 600 }}>
                              Cancelado
                            </span>
                            {boleto.observacao && (
                              <span
                                className={styles.auditoriaObs}
                                title={boleto.observacao}
                              >
                                Motivo: {boleto.observacao}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "#868e96", fontSize: "12px" }}>
                            Aguardando compensação
                          </span>
                        )}
                      </td>

                      {/* AÇÕES */}
                      <td>
                        <div className={styles.acoesLinha}>
                          {isPendente && (
                            <>
                              <button
                                type="button"
                                className={styles.btnDarBaixa}
                                onClick={() => tratarAbrirBaixa(boleto)}
                                title="Confirmar recebimento / Baixa bancária"
                              >
                                <CheckCircle size={15} weight="bold" />
                                Baixar
                              </button>

                              <button
                                type="button"
                                className={styles.btnCancelarIcone}
                                onClick={() => tratarAbrirCancelar(boleto)}
                                title="Cancelar"
                              >
                                <XCircle size={17} weight="bold" />
                              </button>
                            </>
                          )}

                          {isPago && (
                            <span
                              className={styles.pagoConfirmadoIcon}
                              title={boleto.observacao || "Boleto compensado"}
                            >
                              <CheckCircle size={18} weight="fill" />
                              Liquidado
                            </span>
                          )}

                          {isCancelado && (
                            <span
                              style={{ color: "#868e96", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: 4 }}
                            >
                              <XCircle size={16} weight="bold" />
                              Inativo
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* MODAL DE BAIXA */}
      <ModalBaixaBoleto
        aberto={modalBaixaAberto}
        aoFechar={() => setModalBaixaAberto(false)}
        boleto={boletoSelecionado}
        aoConfirmarSucesso={carregarBoletos}
      />

      {/* MODAL DE CANCELAMENTO */}
      <ModalCancelarBoleto
        aberto={modalCancelarAberto}
        aoFechar={() => setModalCancelarAberto(false)}
        boleto={boletoSelecionado}
        aoConfirmarSucesso={carregarBoletos}
      />

      <Rodape />
    </div>
  );
}

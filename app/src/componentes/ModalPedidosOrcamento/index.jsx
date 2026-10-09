import { useState, useMemo, useEffect } from "react";
import {
  XIcon,
  MagnifyingGlassIcon,
  ReceiptIcon,
  ClockIcon,
  PrinterIcon,
  CaretDownIcon,
  CaretUpIcon,
  CalendarBlankIcon,
  StorefrontIcon,
  UserIcon,
  HashIcon,
} from "@phosphor-icons/react";
import styles from "./styles.module.css";
import { formatarMoeda } from "../../utils/formartarMoeda";
import { dataHoraFormatada } from "../../utils/data";
import { gerarOrcamento } from "../../utils/gerarOrcamento";
import { usarToast } from "../Context/toastContext";

export default function ModalPedidosOrcamento({
  aberto,
  aoFechar,
  pedidos = [],
  data = "",
  balcaoNome = "Balcão",
}) {
  const [termoBusca, setTermoBusca] = useState("");
  const [expandidos, setExpandidos] = useState(new Set());
  const { setMensagem } = usarToast();

  // Fecha o modal ao pressionar a tecla Escape
  useEffect(() => {
    if (!aberto) return;
    const tratarKeyDown = (e) => {
      if (e.key === "Escape") aoFechar();
    };
    window.addEventListener("keydown", tratarKeyDown);
    return () => window.removeEventListener("keydown", tratarKeyDown);
  }, [aberto, aoFechar]);

  // Alterna expansão de itens do orçamento
  const alternarExpandir = (id) => {
    setExpandidos((antigo) => {
      const novo = new Set(antigo);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  };

  // Filtra pedidos pelo termo de busca
  const pedidosFiltrados = useMemo(() => {
    if (!Array.isArray(pedidos)) return [];
    if (!termoBusca.trim()) return pedidos;

    const termo = termoBusca.trim().toLowerCase();
    return pedidos.filter((p) => {
      const idMatch = String(p.id || "").toLowerCase().includes(termo);
      const clienteMatch = String(p.cliente || "").toLowerCase().includes(termo);
      const vendedorMatch = String(p.vendedor || "").toLowerCase().includes(termo);
      const itemMatch = Array.isArray(p.itens)
        ? p.itens.some((i) => String(i.nome || "").toLowerCase().includes(termo))
        : false;
      return idMatch || clienteMatch || vendedorMatch || itemMatch;
    });
  }, [pedidos, termoBusca]);

  // Soma o valor total de todos os orçamentos da lista
  const valorTotalOrcamentos = useMemo(() => {
    if (!Array.isArray(pedidos)) return 0;
    return pedidos.reduce((acc, p) => acc + Number(p.total || 0), 0);
  }, [pedidos]);

  // Função para reimprimir o orçamento
  const tratarReimprimirOrcamento = (pedido) => {
    try {
      if (window.IMPRESSORA && typeof window.IMPRESSORA.imprimir === "function") {
        const dadosImpressao = {
          id: pedido.id,
          tipo: "segundaVia",
          data: pedido.data,
          cliente: pedido.cliente || "Consumidor",
          vendedor: pedido.vendedor || balcaoNome,
          nomeUsuario: pedido.nomeUsuario || "",
          itens: Array.isArray(pedido.itens)
            ? pedido.itens.map((it) => ({
                quantidade: it.quantidade,
                nome: it.nome,
                valorUnit: it.valorUnit || it.precoUndVenda || 0,
              }))
            : [],
        };

        const html = gerarOrcamento(dadosImpressao);
        window.IMPRESSORA.imprimir(html);
        setMensagem("Orçamento enviado para a impressora!");
      } else {
        setMensagem("Impressora não disponível nesta máquina.");
      }
    } catch (erro) {
      console.error("Erro ao imprimir orçamento:", erro);
      setMensagem("Erro ao imprimir orçamento.");
    }
  };

  if (!aberto) return null;

  return (
    <div className={styles.overlay} onClick={aoFechar}>
      <div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* HEADER */}
        <header className={styles.modalHeader}>
          <div className={styles.modalHeaderTitleGroup}>
            <div className={styles.modalIconeWrapper}>
              <ReceiptIcon size={24} weight="fill" />
            </div>
            <div>
              <p className={styles.modalSubtitulo}>Controle de Orçamentos</p>
              <h2 className={styles.modalTitulo}>Orçamentos do Balcão</h2>
            </div>
          </div>

          <div className={styles.modalHeaderAcoes}>
            <span className={styles.badgeFiltro}>
              <StorefrontIcon size={14} weight="bold" />
              {balcaoNome}
            </span>
            {data && (
              <span className={styles.badgeFiltro}>
                <CalendarBlankIcon size={14} weight="bold" />
                {data}
              </span>
            )}
            <button
              className={styles.botaoFechar}
              onClick={aoFechar}
              title="Fechar (Esc)"
              aria-label="Fechar modal"
            >
              <XIcon size={20} weight="bold" />
            </button>
          </div>
        </header>

        {/* KPIs E BARRA DE BUSCA */}
        <section className={styles.resumoSection}>
          <div className={styles.cardsResumo}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcone}>
                <ReceiptIcon size={18} weight="fill" />
              </div>
              <div>
                <p className={styles.kpiLabel}>Total de Orçamentos</p>
                <strong className={styles.kpiValor}>
                  {pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"}
                </strong>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIcone}>
                <HashIcon size={18} weight="bold" />
              </div>
              <div>
                <p className={styles.kpiLabel}>Valor Total Orçado</p>
                <strong className={styles.kpiValor}>
                  {formatarMoeda(valorTotalOrcamentos)}
                </strong>
              </div>
            </div>
          </div>

          <div className={styles.campoBuscaWrapper}>
            <MagnifyingGlassIcon size={16} className={styles.iconeBusca} />
            <input
              type="text"
              className={styles.inputBusca}
              placeholder="Buscar por cliente, produto ou ID..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />
          </div>
        </section>

        {/* CORPO DO MODAL */}
        <main className={styles.modalCorpo}>
          {pedidosFiltrados.length === 0 ? (
            <div className={styles.estadoVazio}>
              <div className={styles.iconeVazio}>
                <ReceiptIcon size={28} weight="fill" />
              </div>
              <h3 className={styles.tituloVazio}>
                {pedidos.length === 0
                  ? "Nenhum orçamento registrado"
                  : "Nenhum resultado para a busca"}
              </h3>
              <p className={styles.subtituloVazio}>
                {pedidos.length === 0
                  ? `Não há orçamentos emitidos para ${balcaoNome} nesta data.`
                  : "Tente buscar por outro termo, cliente ou produto."}
              </p>
            </div>
          ) : (
            <div className={styles.listaPedidos}>
              {pedidosFiltrados.map((pedido) => {
                const expandido = expandidos.has(pedido.id);
                const qtdItens = Array.isArray(pedido.itens)
                  ? pedido.itens.length
                  : 0;

                return (
                  <article key={pedido.id} className={styles.pedidoCard}>
                    {/* CABEÇALHO DO CARD */}
                    <div className={styles.pedidoCardHeader}>
                      <div className={styles.pedidoInfoEsquerda}>
                        <span className={styles.badgeId}>
                          #{String(pedido.id).replace("ORC-", "")}
                        </span>

                        {/* DATA E HORA EM DESTAQUE CLARO E VISÍVEL */}
                        <div
                          className={styles.badgeDataHora}
                          title="Data e Hora da emissão do orçamento"
                        >
                          <ClockIcon size={14} weight="bold" />
                          <span>{dataHoraFormatada(pedido.data)}</span>
                        </div>

                        <span className={styles.clienteNome}>
                          <UserIcon
                            size={14}
                            weight="bold"
                            style={{
                              display: "inline",
                              marginRight: "4px",
                              verticalAlign: "middle",
                            }}
                          />
                          {pedido.cliente || "Consumidor"}
                        </span>

                        {pedido.vendedor && (
                          <span className={styles.vendedorBadge}>
                            {pedido.vendedor === "b1"
                              ? "Balcão 1"
                              : pedido.vendedor === "b2"
                              ? "Balcão 2"
                              : pedido.vendedor}
                          </span>
                        )}
                      </div>

                      <div className={styles.pedidoInfoDireita}>
                        <div className={styles.valorTotalGrupo}>
                          <p className={styles.valorTotalLabel}>Total Orçado</p>
                          <strong className={styles.valorTotalValor}>
                            {formatarMoeda(pedido.total || 0)}
                          </strong>
                        </div>

                        <div className={styles.botoesAcoesPedido}>
                          <button
                            className={styles.botaoImprimir}
                            onClick={() => tratarReimprimirOrcamento(pedido)}
                            title="Reimprimir nota de orçamento"
                          >
                            <PrinterIcon size={14} weight="bold" />
                            Imprimir
                          </button>

                          {qtdItens > 0 && (
                            <button
                              className={styles.botaoDetalhes}
                              onClick={() => alternarExpandir(pedido.id)}
                              aria-expanded={expandido}
                              title={
                                expandido ? "Ocultar itens" : "Ver produtos"
                              }
                            >
                              <span>
                                {qtdItens} {qtdItens === 1 ? "item" : "itens"}
                              </span>
                              {expandido ? (
                                <CaretUpIcon size={13} weight="bold" />
                              ) : (
                                <CaretDownIcon size={13} weight="bold" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* DETALHES DOS ITENS SE EXPANDIDO */}
                    {expandido && qtdItens > 0 && (
                      <div className={styles.detalhesItens}>
                        <p className={styles.itensTitulo}>Itens do Orçamento</p>
                        <table className={styles.tabelaItens}>
                          <thead>
                            <tr>
                              <th className={styles.colQtd}>Qtd</th>
                              <th>Produto</th>
                              <th className={styles.colValorUnit}>Valor Unit.</th>
                              <th className={styles.colSubtotal}>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pedido.itens.map((item, idx) => {
                              const valorUnit =
                                Number(item.valorUnit || item.precoUndVenda || 0);
                              const valorSubtotal =
                                Number(
                                  item.valorTotal ||
                                    item.quantidade * valorUnit ||
                                    0
                                );

                              return (
                                <tr key={item.id || item.produtoId || idx}>
                                  <td className={styles.colQtd}>
                                    {item.quantidade}x
                                  </td>
                                  <td>{item.nome}</td>
                                  <td className={styles.colValorUnit}>
                                    {formatarMoeda(valorUnit)}
                                  </td>
                                  <td className={styles.colSubtotal}>
                                    <strong>
                                      {formatarMoeda(valorSubtotal)}
                                    </strong>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </main>

        {/* FOOTER */}
        <footer className={styles.modalFooter}>
          <p className={styles.footerInfo}>
            Exibindo {pedidosFiltrados.length} de {pedidos.length} orçamentos
          </p>
          <button className={styles.botaoFecharSecundario} onClick={aoFechar}>
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}

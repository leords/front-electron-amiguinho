import { useState, useEffect, useMemo } from "react";
import {
  TagIcon,
  XIcon,
  MagnifyingGlassIcon,
  SpinnerIcon,
  FileCsvIcon,
  CaretDownIcon,
  CaretUpIcon,
  CalendarBlankIcon,
  UsersIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ReceiptIcon,
} from "@phosphor-icons/react";
import styles from "./styles.module.css";
import { buscarPedidosDesconto } from "../../operadores/API/desconto/pedidosDesconto.js";
import { formatarMoeda } from "../../utils/formartarMoeda.js";
import { dataHoraFormatada, dataFormatadaFiltro } from "../../utils/data.js";
import { usarToast } from "../Context/toastContext.jsx";

const SETORES_MODAL = [
  { id: "todos", label: "Todos os Setores" },
  { id: "balcao", label: "Balcão" },
  { id: "delivery", label: "Delivery" },
  { id: "externo", label: "Externo" },
];

export default function ModalPedidosDesconto({
  aberto,
  aoFechar,
  setorInicial = "todos",
  dataInicio,
  dataFim,
  vendedorInicial = "todos",
}) {
  const [pedidos, setPedidos] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [termoBusca, setTermoBusca] = useState("");
  const [setorFiltro, setSetorFiltro] = useState(setorInicial);
  const [expandidos, setExpandidos] = useState(new Set());

  const { setMensagem } = usarToast();

  useEffect(() => {
    setSetorFiltro(setorInicial);
  }, [setorInicial]);

  // Carrega pedidos ao abrir o modal ou mudar filtros
  useEffect(() => {
    if (!aberto) return;

    let ativo = true;

    async function carregarPedidos() {
      setCarregando(true);
      try {
        const params = {
          dataInicio,
          dataFim,
        };

        if (setorFiltro && setorFiltro !== "todos") {
          params.setor = setorFiltro;
        }
        if (vendedorInicial && vendedorInicial !== "todos") {
          params.vendedor = vendedorInicial;
        }

        const resposta = await buscarPedidosDesconto(params);
        if (!ativo) return;

        const resultado =
          resposta?.resultado ||
          resposta?.dados ||
          (Array.isArray(resposta?.pedidos) ? resposta : null) ||
          (Array.isArray(resposta) ? { pedidos: resposta } : {});

        const listaBruta = Array.isArray(resultado?.pedidos)
          ? resultado.pedidos
          : Array.isArray(resultado)
          ? resultado
          : Array.isArray(resposta)
          ? resposta
          : [];

        // Normaliza itens de desconto em cada pedido tratando valores negativos
        const listaNormalizada = listaBruta.map((p) => {
          let descontos = (Array.isArray(p.descontos) ? p.descontos : []).map(
            (d) => ({
              ...d,
              quantidade: Math.abs(Number(d.quantidade || 1)),
              valorUnit: Math.abs(
                Number(d.valorUnit || d.precoUnit || d.valorTotal || 0)
              ),
              valorTotal: Math.abs(Number(d.valorTotal || d.total || 0)),
            })
          );

          // Se não vier descontos[] explícito, tenta extrair de itens[]
          if (descontos.length === 0 && Array.isArray(p.itens)) {
            descontos = p.itens
              .filter((it) => {
                const nome = String(
                  it.produtoNome || it.produto?.nome || it.nome || ""
                ).toUpperCase();
                const valorTot = Number(it.valorTotal || it.total || 0);
                const valorUn = Number(it.valorUnit || it.precoUnit || 0);
                return (
                  nome.includes("DESCONTO") || valorTot < 0 || valorUn < 0
                );
              })
              .map((it) => ({
                id: it.id || it.produtoId,
                produtoId: it.produtoId,
                produtoNome: it.produtoNome || it.produto?.nome || "DESCONTO",
                quantidade: Math.abs(Number(it.quantidade || 1)),
                valorUnit: Math.abs(
                  Number(it.valorUnit || it.precoUnit || it.valorTotal || 0)
                ),
                valorTotal: Math.abs(Number(it.valorTotal || it.total || 0)),
              }));
          }

          const somaDescontos = descontos.reduce(
            (acc, d) => acc + Math.abs(Number(d.valorTotal || 0)),
            0
          );

          const totalDesconto = Math.abs(
            Number(
              p.totalDesconto ??
                p.totalValorDesconto ??
                p.valorDesconto ??
                somaDescontos ??
                0
            )
          );

          const quantidadeDescontos = Math.abs(
            Number(
              p.quantidadeDescontos ??
                p.quantidadeTotalItensDesconto ??
                descontos.reduce(
                  (acc, d) => acc + Math.abs(Number(d.quantidade || 1)),
                  0
                ) ??
                descontos.length
            )
          );

          return {
            ...p,
            descontos,
            totalDesconto,
            quantidadeDescontos,
          };
        });

        const totalValorDesc = Math.abs(
          Number(
            resultado?.totalValorDescontos ??
              resultado?.totalValorDesconto ??
              listaNormalizada.reduce(
                (acc, p) => acc + Number(p.totalDesconto || 0),
                0
              )
          )
        );

        const totalQtdItens = Math.abs(
          Number(
            resultado?.quantidadeTotalItensDesconto ??
              resultado?.quantidadeTotalItens ??
              resultado?.quantidadeDescontos ??
              listaNormalizada.reduce(
                (acc, p) => acc + Number(p.quantidadeDescontos || 0),
                0
              )
          )
        );

        setPedidos(listaNormalizada);
        setResumo({
          totalPedidos: resultado.totalPedidos ?? listaNormalizada.length,
          totalValorDescontos: totalValorDesc,
          quantidadeTotalItensDesconto: totalQtdItens,
        });
      } catch (err) {
        if (!ativo) return;
        console.error("Erro ao carregar pedidos com desconto:", err);
        setMensagem(err.message || "Erro ao listar pedidos com desconto");
        setPedidos([]);
        setResumo(null);
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarPedidos();

    return () => {
      ativo = false;
    };
  }, [aberto, setorFiltro, dataInicio, dataFim, vendedorInicial, setMensagem]);

  // Alterna expansão de detalhes de um pedido
  const alternarExpansao = (id) => {
    setExpandidos((prev) => {
      const proximo = new Set(prev);
      if (proximo.has(id)) {
        proximo.delete(id);
      } else {
        proximo.add(id);
      }
      return proximo;
    });
  };

  // Filtragem local por texto
  const pedidosFiltrados = useMemo(() => {
    if (!termoBusca.trim()) return pedidos;
    const buscaNorm = termoBusca.toLowerCase().trim();

    return pedidos.filter((p) => {
      const idMatch = String(p.id || "").includes(buscaNorm);
      const uuidMatch = String(p.uuid || "").toLowerCase().includes(buscaNorm);
      const clienteNome = String(p.cliente?.nome || "").toLowerCase();
      const clienteDoc = String(p.cliente?.cnpj || "").toLowerCase();
      const vendedorNome = String(p.vendedor || p.usuario?.nome || "").toLowerCase();
      const setorNome = String(p.setor || "").toLowerCase();

      return (
        idMatch ||
        uuidMatch ||
        clienteNome.includes(buscaNorm) ||
        clienteDoc.includes(buscaNorm) ||
        vendedorNome.includes(buscaNorm) ||
        setorNome.includes(buscaNorm)
      );
    });
  }, [pedidos, termoBusca]);

  // Exportar relatório em CSV com BOM UTF-8
  const exportarCSV = () => {
    if (!pedidosFiltrados.length) {
      setMensagem("Nenhum pedido para exportar no momento.");
      return;
    }

    try {
      const cabecalhos = [
        "ID Pedido",
        "Data/Hora",
        "Setor",
        "Status",
        "Cliente",
        "Documento/CNPJ",
        "Vendedor",
        "Total Pedido (R$)",
        "Total Desconto (R$)",
        "Qtd Descontos",
        "Detalhes dos Descontos",
      ];

      const linhas = pedidosFiltrados.map((p) => {
        const dataFormat = dataHoraFormatada(
          p.data || p.criadoEm || p.createdAt || p.dataHora
        );
        const setor = p.setor || "Geral";
        const status = p.status || "-";
        const clienteNome = (p.cliente?.nome || "Não informado").replace(/;/g, ",");
        const clienteDoc = p.cliente?.cnpj || "-";
        const vendedorNome = (p.vendedor || p.usuario?.nome || "-").replace(/;/g, ",");
        const totalPed = Number(p.total || p.valorTotal || 0).toFixed(2);
        const totalDesc = Number(p.totalDesconto || 0).toFixed(2);
        const qtdDesc = p.quantidadeDescontos || (p.descontos?.length || 0);

        const descricoes = (p.descontos || [])
          .map(
            (d) =>
              `${d.produtoNome || "DESCONTO"} (Qtd: ${d.quantidade}, Unit: R$ ${Number(d.valorUnit || 0).toFixed(2)}, Total: R$ ${Number(d.valorTotal || 0).toFixed(2)})`
          )
          .join(" | ")
          .replace(/;/g, ",");

        return [
          p.id || p.uuid || "-",
          `"${dataFormat}"`,
          `"${setor}"`,
          `"${status}"`,
          `"${clienteNome}"`,
          `"${clienteDoc}"`,
          `"${vendedorNome}"`,
          totalPed,
          totalDesc,
          qtdDesc,
          `"${descricoes}"`,
        ].join(";");
      });

      const conteudoCSV = "\uFEFF" + [cabecalhos.join(";"), ...linhas].join("\n");
      const blob = new Blob([conteudoCSV], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `relatorio_descontos_${dataFormatadaFiltro(dataInicio || new Date()).replace(/\//g, "-")}_a_${dataFormatadaFiltro(dataFim || new Date()).replace(/\//g, "-")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao gerar CSV de descontos:", err);
      setMensagem("Erro ao exportar arquivo CSV.");
    }
  };

  if (!aberto) return null;

  const totalDescontosCalculado =
    resumo?.totalValorDescontos ??
    pedidos.reduce((acc, p) => acc + Number(p.totalDesconto || 0), 0);
  const totalPedidosCalculado = resumo?.totalPedidos ?? pedidos.length;
  const mediaDesconto =
    totalPedidosCalculado > 0 ? totalDescontosCalculado / totalPedidosCalculado : 0;

  return (
    <div className={styles.overlay} onClick={aoFechar}>
      <div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderTitleGroup}>
            <div className={styles.modalIconeWrapper}>
              <TagIcon size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.modalSubtitulo}>
                Período: {dataFormatadaFiltro(dataInicio)} até{" "}
                {dataFormatadaFiltro(dataFim)}
              </p>
              <h2 className={styles.modalTitulo}>
                Relatório de Pedidos com Desconto
              </h2>
            </div>
          </div>

          <div className={styles.modalHeaderAcoes}>
            <button
              className={styles.botaoExportarCSV}
              onClick={exportarCSV}
              title="Exportar dados filtrados para CSV"
            >
              <FileCsvIcon size={18} weight="bold" />
              <span>Exportar CSV</span>
            </button>
            <button
              className={styles.botaoFechar}
              onClick={aoFechar}
              title="Fechar"
            >
              <XIcon size={20} weight="bold" />
            </button>
          </div>
        </div>

        {/* Resumo de Indicadores no Topo */}
        <div className={styles.kpiResumoGrid}>
          <div className={styles.kpiMiniCard}>
            <span className={styles.kpiMiniLabel}>Total Concedido</span>
            <strong
              className={`${styles.kpiMiniValor} ${styles.kpiMiniValorDestaque}`}
            >
              {formatarMoeda(totalDescontosCalculado)}
            </strong>
          </div>
          <div className={styles.kpiMiniCard}>
            <span className={styles.kpiMiniLabel}>Pedidos com Desconto</span>
            <strong className={styles.kpiMiniValor}>
              {totalPedidosCalculado}
            </strong>
          </div>
          <div className={styles.kpiMiniCard}>
            <span className={styles.kpiMiniLabel}>Itens de Desconto</span>
            <strong className={styles.kpiMiniValor}>
              {resumo?.quantidadeTotalItensDesconto ?? 0}
            </strong>
          </div>
          <div className={styles.kpiMiniCard}>
            <span className={styles.kpiMiniLabel}>Média por Pedido</span>
            <strong className={styles.kpiMiniValor}>
              {formatarMoeda(mediaDesconto)}
            </strong>
          </div>
        </div>

        {/* Barra de Busca e Filtro de Setor */}
        <div className={styles.barraFiltros}>
          <div className={styles.buscaInputWrapper}>
            <MagnifyingGlassIcon
              size={18}
              weight="bold"
              className={styles.buscaIcone}
            />
            <input
              type="text"
              className={styles.buscaInput}
              placeholder="Buscar por cliente, CNPJ, vendedor ou ID do pedido..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              autoFocus
            />
          </div>

          <div className={styles.filtroSetorTabs}>
            {SETORES_MODAL.map((s) => (
              <button
                key={s.id}
                className={`${styles.filtroSetorBtn} ${
                  setorFiltro === s.id ? styles.filtroSetorBtnAtivo : ""
                }`}
                onClick={() => setSetorFiltro(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Listagem de Pedidos */}
        <div className={styles.modalCorpo}>
          {carregando ? (
            <div className={styles.carregandoContainer}>
              <SpinnerIcon size={32} weight="bold" className={styles.spinner} />
              <span>Carregando pedidos com desconto...</span>
            </div>
          ) : pedidosFiltrados.length === 0 ? (
            <div className={styles.vazioContainer}>
              <ReceiptIcon size={44} weight="duotone" color="#adb5bd" />
              <p className={styles.vazioTitulo}>Nenhum pedido com desconto</p>
              <p className={styles.vazioSub}>
                Não foram encontrados pedidos contendo desconto para os filtros
                selecionados.
              </p>
            </div>
          ) : (
            pedidosFiltrados.map((pedido) => {
              const expandido = expandidos.has(pedido.id || pedido.uuid);
              const setorClass =
                pedido.setor === "balcao"
                  ? styles.setorBalcao
                  : pedido.setor === "delivery"
                  ? styles.setorDelivery
                  : styles.setorExterno;

              const clienteNome =
                pedido.cliente?.nome || "Cliente Balcão (Avulso)";
              const vendedorNome =
                pedido.vendedor || pedido.usuario?.nome || "Balcão / Sistema";

              const totalDescontoPed = Number(
                pedido.totalDesconto ||
                  (pedido.descontos || []).reduce(
                    (acc, d) => acc + Number(d.valorTotal || 0),
                    0
                  ) ||
                  0
              );

              return (
                <div key={pedido.id || pedido.uuid} className={styles.pedidoCard}>
                  <div className={styles.pedidoHeader}>
                    <div className={styles.pedidoIdInfo}>
                      <span className={styles.pedidoIdBadge}>
                        #{pedido.id || String(pedido.uuid || "").slice(0, 8)}
                      </span>
                      <span className={`${styles.badgeSetor} ${setorClass}`}>
                        {pedido.setor || "Geral"}
                      </span>
                      {pedido.status && (
                        <span className={styles.pedidoStatusBadge}>
                          {pedido.status}
                        </span>
                      )}
                    </div>

                    <div className={styles.pedidoData}>
                      <CalendarBlankIcon size={14} weight="bold" />
                      <span>
                        {dataHoraFormatada(
                          pedido.data ||
                            pedido.criadoEm ||
                            pedido.createdAt ||
                            pedido.dataHora
                        )}
                      </span>
                    </div>
                  </div>

                  <div className={styles.pedidoCorpoGrid}>
                    <div className={styles.campoInfo}>
                      <span className={styles.campoRotulo}>Cliente</span>
                      <strong className={styles.campoValor} title={clienteNome}>
                        {clienteNome}
                      </strong>
                      {pedido.cliente?.cnpj && (
                        <span className={styles.campoSub}>
                          {pedido.cliente.cnpj}
                        </span>
                      )}
                    </div>

                    <div className={styles.campoInfo}>
                      <span className={styles.campoRotulo}>Vendedor</span>
                      <span className={styles.campoValor} title={vendedorNome}>
                        {vendedorNome}
                      </span>
                    </div>

                    <div className={styles.campoInfo}>
                      <span className={styles.campoRotulo}>Total Pedido</span>
                      <span className={styles.valorTotalPedido}>
                        {formatarMoeda(pedido.total || pedido.valorTotal || 0)}
                      </span>
                    </div>

                    <div className={styles.campoInfo}>
                      <span className={styles.campoRotulo}>Desconto</span>
                      <strong className={styles.valorDescontoDestaque}>
                        - {formatarMoeda(totalDescontoPed)}
                      </strong>
                    </div>

                    <div>
                      <button
                        className={styles.btnExpandir}
                        onClick={() =>
                          alternarExpansao(pedido.id || pedido.uuid)
                        }
                        title="Ver itens e descontos aplicados"
                      >
                        <span>Itens</span>
                        {expandido ? (
                          <CaretUpIcon size={14} weight="bold" />
                        ) : (
                          <CaretDownIcon size={14} weight="bold" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Seção expandida com os detalhes do desconto e produtos */}
                  {expandido && (
                    <div className={styles.detalhesExpandidos}>
                      <p className={styles.detalhesTitulo}>
                        Itens de Desconto Aplicados
                      </p>
                      {Array.isArray(pedido.descontos) &&
                      pedido.descontos.length > 0 ? (
                        <table className={styles.tabelaItensDesconto}>
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Quantidade</th>
                              <th>Valor Unit.</th>
                              <th>Total Desconto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pedido.descontos.map((desc, idx) => (
                              <tr key={desc.id || `desc-${idx}`}>
                                <td>
                                  <strong>{desc.produtoNome || "DESCONTO"}</strong>
                                </td>
                                <td>{desc.quantidade ?? 1}</td>
                                <td>{formatarMoeda(desc.valorUnit || 0)}</td>
                                <td style={{ color: "#dc2626", fontWeight: 700 }}>
                                  - {formatarMoeda(desc.valorTotal || 0)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p style={{ fontSize: "12px", color: "var(--gray-500)" }}>
                          Desconto registrado no valor de{" "}
                          <strong>{formatarMoeda(totalDescontoPed)}</strong>
                        </p>
                      )}

                      {/* Se houver outros itens no pedido */}
                      {Array.isArray(pedido.itens) && pedido.itens.length > 0 && (
                        <div style={{ marginTop: "6px" }}>
                          <p
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              color: "var(--gray-700)",
                              textTransform: "uppercase",
                              margin: "6px 0 4px",
                            }}
                          >
                            Outros Itens do Pedido ({pedido.itens.length})
                          </p>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "6px",
                            }}
                          >
                            {pedido.itens
                              .filter(
                                (it) =>
                                  !String(
                                    it.produtoNome ||
                                      it.produto?.nome ||
                                      it.nome ||
                                      ""
                                  )
                                    .toUpperCase()
                                    .includes("DESCONTO") &&
                                  Number(it.valorTotal || it.total || 0) >= 0
                              )
                              .map((it, idx) => (
                                <span
                                  key={it.id || idx}
                                  style={{
                                    fontSize: "11px",
                                    background: "#f1f5f9",
                                    padding: "2px 8px",
                                    borderRadius: "4px",
                                    color: "var(--gray-700)",
                                  }}
                                >
                                  {it.quantidade}x{" "}
                                  {it.produto?.nome ||
                                    it.produtoNome ||
                                    it.nome ||
                                    `Produto #${it.produtoId}`}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className={styles.modalFooter}>
          <span className={styles.modalFooterTexto}>
            Exibindo {pedidosFiltrados.length} de {pedidos.length} pedidos
          </span>
          <button className={styles.btnFecharSecundario} onClick={aoFechar}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

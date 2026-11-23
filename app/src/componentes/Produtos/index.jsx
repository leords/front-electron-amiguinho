import { useEffect, useState, useMemo, useCallback } from "react";
import styles from "./styles.module.css";
import {
  MagnifyingGlass,
  PlusCircle,
  PencilSimple,
  ArrowClockwise,
  CheckCircle,
  XCircle,
  Package,
  EyeSlash,
  Eye,
  ArrowsClockwise,
  FileXls,
  ChartBar,
} from "@phosphor-icons/react";
import { LerProduto } from "../../operadores/API/produto/lerProduto";
import { StatusProduto } from "../../operadores/API/produto/statusProduto";
import { formatarMoeda } from "../../utils/formartarMoeda";
import { formatarEstoque } from "../../utils/formatarEstoque";
import { AlertaRadix } from "../ui/alerta/alerta";
import { usarToast } from "../Context/toastContext";
import ModalProduto from "../ModalProduto";
import ModalRelatorioProduto from "../ModalRelatorioProduto";
import { exportarProdutosExcel } from "../../utils/exportarProdutosExcel";

export default function ListaProduto() {
  const { setMensagem } = usarToast();

  // Estados de dados e carregamento
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(false);

  // Estados de filtros
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("ativo"); // 'ativo' | 'inativo' | 'todos'
  const [filtroSegmento, setFiltroSegmento] = useState("");
  const [filtroFornecedor, setFiltroFornecedor] = useState("");

  // Estados do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEmEdicao, setProdutoEmEdicao] = useState(null);
  const [modalRelatorioAberto, setModalRelatorioAberto] = useState(false);
  const [produtoRelatorio, setProdutoRelatorio] = useState(null);

  // Busca produtos na API
  const carregarProdutos = useCallback(async () => {
    setCarregando(true);
    try {
      // Monta os parâmetros suportados pelo endpoint /ler-produtos
      const parametros = {};
      if (filtroStatus) parametros.status = filtroStatus;
      if (filtroSegmento) parametros.segmento = filtroSegmento;
      if (filtroFornecedor) parametros.fornecedor = filtroFornecedor;

      const dados = await LerProduto(parametros);
      setProdutos(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      setProdutos([]);
      setMensagem(error.message || "Erro ao consultar a lista de produtos");
    } finally {
      setCarregando(false);
    }
  }, [filtroStatus, filtroSegmento, filtroFornecedor, setMensagem]);

  // Carrega produtos ao montar ou ao alterar os filtros de status/segmento/fornecedor
  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  // Listas únicas de segmentos e fornecedores extraídas dos produtos para popular os selects
  const listaSegmentos = useMemo(() => {
    const set = new Set();
    produtos.forEach((p) => {
      if (p.segmento && String(p.segmento).trim()) {
        set.add(String(p.segmento).trim().toUpperCase());
      }
    });
    return Array.from(set).sort();
  }, [produtos]);

  const listaFornecedores = useMemo(() => {
    const set = new Set();
    produtos.forEach((p) => {
      if (p.fornecedor && String(p.fornecedor).trim()) {
        set.add(String(p.fornecedor).trim().toUpperCase());
      }
    });
    return Array.from(set).sort();
  }, [produtos]);

  // Filtro de produtos em memória para busca instantânea e fluida
  const produtosFiltrados = useMemo(() => {
    if (!Array.isArray(produtos)) return [];

    let resultado = produtos;

    // Filtro por termo de busca (ID ou Nome, Embalagem, Fornecedor, Segmento)
    if (busca.trim()) {
      const termo = busca.trim().toLowerCase();
      resultado = resultado.filter((p) => {
        const idMatch = String(p.id || "").toLowerCase().includes(termo);
        const nomeMatch = String(p.nome || "").toLowerCase().includes(termo);
        const embalagemMatch = String(p.embalagem || "")
          .toLowerCase()
          .includes(termo);
        const fornecedorMatch = String(p.fornecedor || "")
          .toLowerCase()
          .includes(termo);
        const segmentoMatch = String(p.segmento || "")
          .toLowerCase()
          .includes(termo);

        return (
          idMatch ||
          nomeMatch ||
          embalagemMatch ||
          fornecedorMatch ||
          segmentoMatch
        );
      });
    }

    // Filtro adicional por Segmento local (caso a API não filtre)
    if (filtroSegmento) {
      resultado = resultado.filter(
        (p) =>
          String(p.segmento || "").trim().toUpperCase() ===
          filtroSegmento.toUpperCase(),
      );
    }

    // Filtro adicional por Fornecedor local (caso a API não filtre)
    if (filtroFornecedor) {
      resultado = resultado.filter(
        (p) =>
          String(p.fornecedor || "").trim().toUpperCase() ===
          filtroFornecedor.toUpperCase(),
      );
    }

    return resultado;
  }, [produtos, busca, filtroSegmento, filtroFornecedor]);

  // Contadores para os badges
  const contadores = useMemo(() => {
    const total = produtosFiltrados.length;
    const ativos = produtosFiltrados.filter(
      (p) => (p.status || "ativo") === "ativo",
    ).length;
    const inativos = total - ativos;
    return { total, ativos, inativos };
  }, [produtosFiltrados]);

  // Alterna o status do produto (Soft Delete)
  const tratarAlternarStatus = async (produto) => {
    const novoStatus = produto.status === "inativo" ? "ativo" : "inativo";
    try {
      const resposta = await StatusProduto(produto.id, novoStatus);
      setMensagem(
        resposta?.mensagem ||
          `Produto "${produto.nome}" agora está ${novoStatus}!`,
      );
      carregarProdutos();
    } catch (error) {
      console.error("Erro ao alterar status do produto:", error);
      setMensagem(error.message || "Erro ao alterar o status do produto");
    }
  };

  // Abrir modal para novo produto
  const tratarAbrirModalNovo = () => {
    setProdutoEmEdicao(null);
    setModalAberto(true);
  };

  // Abrir modal para edição de produto
  const tratarAbrirModalEditar = (produto) => {
    setProdutoEmEdicao(produto);
    setModalAberto(true);
  };

  // Abrir modal de relatório de desempenho do produto
  const tratarAbrirModalRelatorio = (produto) => {
    setProdutoRelatorio(produto);
    setModalRelatorioAberto(true);
  };

  // Limpa todos os filtros
  const tratarLimparFiltros = () => {
    setBusca("");
    setFiltroStatus("ativo");
    setFiltroSegmento("");
    setFiltroFornecedor("");
  };

  // Exportar produtos filtrados para planilha Excel
  const tratarExportarExcel = () => {
    try {
      if (!produtosFiltrados || produtosFiltrados.length === 0) {
        setMensagem("Nenhum produto para exportar com os filtros atuais.");
        return;
      }

      const res = exportarProdutosExcel(produtosFiltrados, {
        segmento: filtroSegmento,
        status: filtroStatus,
      });

      setMensagem(
        `Exportados ${res.quantidade} produtos para "${res.nomeArquivo}" com sucesso!`,
      );
    } catch (error) {
      console.error("Erro ao exportar produtos para Excel:", error);
      setMensagem(error.message || "Erro ao gerar planilha de produtos.");
    }
  };

  const temFiltroAtivo =
    busca ||
    filtroStatus !== "ativo" ||
    filtroSegmento !== "" ||
    filtroFornecedor !== "";

  return (
    <div className={styles.container}>
      {/* BARRA SUPERIOR: RESUMO E AÇÕES */}
      <div className={styles.barraSuperior}>
        <div className={styles.resumoBadges}>
          <span className={styles.badgeGeral}>
            <Package size={15} weight="bold" />
            {contadores.total} produtos
          </span>
          <span className={styles.badgeAtivos}>
            <CheckCircle size={14} weight="fill" />
            {contadores.ativos} ativos
          </span>
          {contadores.inativos > 0 && (
            <span className={styles.badgeInativos}>
              <XCircle size={14} weight="fill" />
              {contadores.inativos} inativos
            </span>
          )}
        </div>

        <div className={styles.acoesSuperiores}>
          {/* Botão Exportar Excel */}
          <button
            className={styles.botaoExportarExcel}
            onClick={tratarExportarExcel}
            disabled={carregando || produtosFiltrados.length === 0}
            title="Exportar catálogo filtrado para planilha Excel"
          >
            <FileXls size={18} weight="bold" />
            Exportar Excel
          </button>

          <button
            className={styles.botaoRecarregar}
            onClick={carregarProdutos}
            title="Atualizar lista de produtos"
          >
            <ArrowClockwise
              size={16}
              weight="bold"
              className={carregando ? styles.spinnerIcone : ""}
            />
            Recarregar
          </button>

          <button
            className={styles.botaoNovoProduto}
            onClick={tratarAbrirModalNovo}
          >
            <PlusCircle size={18} weight="bold" />
            Novo Produto
          </button>
        </div>
      </div>

      {/* PAINEL DE FILTROS E BUSCA */}
      <div className={styles.painelFiltros}>
        <div className={styles.linhaFiltros}>
          {/* BUSCA POR NOME OU ID */}
          <div className={styles.inputBuscaWrapper}>
            <MagnifyingGlass
              size={16}
              weight="bold"
              className={styles.iconeBusca}
            />
            <input
              type="text"
              className={styles.inputBusca}
              placeholder="Buscar por ID, nome, embalagem, fornecedor..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            {busca && (
              <button
                className={styles.limparBusca}
                onClick={() => setBusca("")}
                title="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>

          {/* FILTRO STATUS */}
          <div className={styles.selectFiltroWrapper}>
            <select
              className={styles.selectFiltro}
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="ativo">Status: Ativos</option>
              <option value="inativo">Status: Inativos</option>
              <option value="todos">Status: Todos</option>
            </select>
          </div>

          {/* FILTRO SEGMENTO */}
          <div className={styles.selectFiltroWrapper}>
            <select
              className={styles.selectFiltro}
              value={filtroSegmento}
              onChange={(e) => setFiltroSegmento(e.target.value)}
            >
              <option value="">Segmento: Todos</option>
              {listaSegmentos.map((seg) => (
                <option key={seg} value={seg}>
                  {seg}
                </option>
              ))}
            </select>
          </div>

          {/* FILTRO FORNECEDOR */}
          <div className={styles.selectFiltroWrapper}>
            <select
              className={styles.selectFiltro}
              value={filtroFornecedor}
              onChange={(e) => setFiltroFornecedor(e.target.value)}
            >
              <option value="">Fornecedor: Todos</option>
              {listaFornecedores.map((forn) => (
                <option key={forn} value={forn}>
                  {forn}
                </option>
              ))}
            </select>
          </div>

          {/* BOTÃO LIMPAR FILTROS */}
          {temFiltroAtivo && (
            <button
              className={styles.botaoLimparFiltros}
              onClick={tratarLimparFiltros}
              title="Restaurar filtros padrão"
            >
              <ArrowsClockwise size={14} weight="bold" />
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* CARD DA TABELA DE PRODUTOS */}
      <div className={styles.cardTabela}>
        {carregando ? (
          <div className={styles.spinnerWrapper}>
            <div className={styles.spinner} />
            <span className={styles.textoCarregando}>
              Carregando catálogo de produtos...
            </span>
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className={styles.estadoVazio}>
            <Package size={48} weight="duotone" className={styles.iconeVazio} />
            <h3 className={styles.tituloVazio}>Nenhum produto encontrado</h3>
            <p className={styles.subtituloVazio}>
              {busca || temFiltroAtivo
                ? "Tente ajustar os filtros ou pesquisar por outro termo."
                : "Não há produtos registrados. Clique em '+ Novo Produto' para começar."}
            </p>
          </div>
        ) : (
          <div className={styles.tabelaWrapper}>
            {/* CABEÇALHO DA TABELA */}
            <div className={`${styles.cabecalhoTabela} ${styles.gridProdutos}`}>
              <span>ID</span>
              <span>Produto</span>
              <span>Embalagem</span>
              <span>Segmento</span>
              <span>Fornecedor</span>
              <span>Preço Venda</span>
              <span>Estoque</span>
              <span>Status</span>
              <span style={{ textAlign: "center" }}>Ações</span>
            </div>

            {/* LINHAS DE PRODUTOS */}
            <div className={styles.listaLinhas}>
              {produtosFiltrados.map((produto) => {
                const isAtivo = (produto.status || "ativo") === "ativo";
                const estoqueNumero = Number(produto.estoque || 0);

                return (
                  <div
                    key={produto.id}
                    className={`${styles.linhaProduto} ${styles.gridProdutos} ${
                      !isAtivo ? styles.inativo : ""
                    }`}
                  >
                    {/* ID */}
                    <span className={styles.idCell}>#{produto.id}</span>

                    {/* NOME / DETALHES */}
                    <div className={styles.nomeWrapper}>
                      <span className={styles.nomeTexto}>
                        {produto.nome || "Sem nome"}
                      </span>
                      <div className={styles.detalhesSubTexto}>
                        {produto.quantidade && (
                          <span>Cx c/ {produto.quantidade} unid.</span>
                        )}
                        {produto.peso ? <span>• {produto.peso}kg</span> : null}
                      </div>
                    </div>

                    {/* EMBALAGEM */}
                    <span className={styles.tagEmbalagem}>
                      {produto.embalagem || "—"}
                    </span>

                    {/* SEGMENTO */}
                    <div>
                      {produto.segmento ? (
                        <span className={styles.tagSegmento}>
                          {produto.segmento}
                        </span>
                      ) : (
                        "—"
                      )}
                    </div>

                    {/* FORNECEDOR */}
                    <span className={styles.tagFornecedor}>
                      {produto.fornecedor || "—"}
                    </span>

                    {/* PREÇO DE VENDA */}
                    <div>
                      <span className={styles.precoVendaTexto}>
                        {formatarMoeda(produto.precoVenda || 0)}
                      </span>
                      {produto.precoUndVenda > 0 && (
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--gray-500)",
                          }}
                        >
                          Und: {formatarMoeda(produto.precoUndVenda)}
                        </div>
                      )}
                    </div>

                    {/* ESTOQUE */}
                    <div>
                      <span
                        className={`${styles.estoqueBadge} ${
                          estoqueNumero <= 0 ? styles.estoqueCritico : ""
                        }`}
                        title={`Estoque disponível: ${formatarEstoque(estoqueNumero)} volumes`}
                      >
                        {formatarEstoque(estoqueNumero)} cx
                      </span>
                    </div>

                    {/* BADGE DE STATUS */}
                    <div>
                      <span
                        className={`${styles.statusBadge} ${
                          isAtivo ? styles.statusAtivo : styles.statusInativo
                        }`}
                      >
                        <span className={styles.pontoStatus} />
                        {isAtivo ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    {/* AÇÕES: RELATÓRIO, EDITAR & ALTERNAR STATUS */}
                    <div className={styles.colunaAcoes}>
                      {/* BOTÃO RELATÓRIO ANUAL */}
                      <button
                        className={styles.btnAcaoRelatorio}
                        onClick={() => tratarAbrirModalRelatorio(produto)}
                        title={`Desempenho de vendas #${produto.id} - ${produto.nome}`}
                      >
                        <ChartBar size={16} weight="bold" />
                      </button>

                      {/* BOTÃO EDITAR */}
                      <button
                        className={styles.btnAcaoEditar}
                        onClick={() => tratarAbrirModalEditar(produto)}
                        title={`Editar produto #${produto.id}`}
                      >
                        <PencilSimple size={16} weight="bold" />
                      </button>

                      {/* TOGGLE / BOTÃO DE STATUS COM CONFIRMAÇÃO ALERTA RADIX */}
                      <AlertaRadix
                        titulo={
                          isAtivo ? "Inativar Produto" : "Reativar Produto"
                        }
                        descricao={
                          isAtivo
                            ? `Deseja realmente inativar o produto "${produto.nome}"? Ele deixará de aparecer para vendas no balcão e delivery.`
                            : `Deseja reativar o produto "${produto.nome}"? Ele voltará a ficar disponível para vendas.`
                        }
                        tratar={() => tratarAlternarStatus(produto)}
                        confirmarTexto={
                          isAtivo ? "Sim, inativar" : "Sim, reativar"
                        }
                        cancelarTexto="Voltar"
                        trigger={
                          <button
                            className={`${styles.btnAcaoStatus} ${
                              isAtivo ? styles.inativar : styles.reativar
                            }`}
                            title={
                              isAtivo
                                ? "Inativar produto (Soft Delete)"
                                : "Reativar produto"
                            }
                          >
                            {isAtivo ? (
                              <EyeSlash size={16} weight="bold" />
                            ) : (
                              <Eye size={16} weight="bold" />
                            )}
                          </button>
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE CADASTRO E EDIÇÃO DE PRODUTO */}
      <ModalProduto
        aberto={modalAberto}
        aoFechar={() => {
          setModalAberto(false);
          setProdutoEmEdicao(null);
        }}
        produto={produtoEmEdicao}
        aoSalvarSucesso={carregarProdutos}
      />

      {/* MODAL DE RELATÓRIO ANUAL DO PRODUTO */}
      <ModalRelatorioProduto
        aberto={modalRelatorioAberto}
        aoFechar={() => {
          setModalRelatorioAberto(false);
          setProdutoRelatorio(null);
        }}
        produto={produtoRelatorio}
      />
    </div>
  );
}

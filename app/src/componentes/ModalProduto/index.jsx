import { useState, useEffect, useMemo } from "react";
import {
  X,
  PlusCircle,
  PencilSimple,
  Package,
  Barcode,
  Tag,
  Factory,
  Stack,
  Scales,
  CurrencyDollar,
  ChartLineUp,
  FloppyDisk,
  Lightning,
} from "@phosphor-icons/react";
import styles from "./styles.module.css";
import { CriarProduto } from "../../operadores/API/produto/criarProduto";
import { AtualizarProduto } from "../../operadores/API/produto/atualizarProduto";
import { usarToast } from "../Context/toastContext";
import { formatarMoeda } from "../../utils/formartarMoeda";

export default function ModalProduto({
  aberto,
  aoFechar,
  produto = null,
  aoSalvarSucesso,
}) {
  const { setMensagem } = usarToast();
  const modoEdicao = Boolean(produto && produto.id);

  // Estados dos campos do formulário
  const [nome, setNome] = useState("");
  const [embalagem, setEmbalagem] = useState("");
  const [segmento, setSegmento] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [quantidade, setQuantidade] = useState("12");
  const [peso, setPeso] = useState("");
  const [precoCompra, setPrecoCompra] = useState("");
  const [precoVenda, setPrecoVenda] = useState("");
  const [precoUndVenda, setPrecoUndVenda] = useState("");
  const [estoque, setEstoque] = useState("");
  const [status, setStatus] = useState("ativo");

  // Estados de controle e validação
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  // Popula o formulário caso seja modo edição ou reseta para novo produto
  useEffect(() => {
    if (!aberto) return;

    if (produto && produto.id) {
      setNome((produto.nome || "").toUpperCase());
      setEmbalagem((produto.embalagem || "").toUpperCase());
      setSegmento((produto.segmento || "").toUpperCase());
      setFornecedor((produto.fornecedor || "").toUpperCase());
      setQuantidade(
        produto.quantidade !== undefined && produto.quantidade !== null
          ? String(produto.quantidade)
          : "12",
      );
      setPeso(
        produto.peso !== undefined && produto.peso !== null
          ? String(produto.peso)
          : "",
      );
      setPrecoCompra(
        produto.precoCompra !== undefined && produto.precoCompra !== null
          ? String(produto.precoCompra)
          : "",
      );
      setPrecoVenda(
        produto.precoVenda !== undefined && produto.precoVenda !== null
          ? String(produto.precoVenda)
          : "",
      );
      setPrecoUndVenda(
        produto.precoUndVenda !== undefined && produto.precoUndVenda !== null
          ? String(produto.precoUndVenda)
          : "",
      );
      setEstoque(
        produto.estoque !== undefined && produto.estoque !== null
          ? String(
              Number(produto.estoque) % 1 === 0
                ? produto.estoque
                : Number(produto.estoque).toFixed(2)
            )
          : "0",
      );
      setStatus(produto.status || "ativo");
    } else {
      setNome("");
      setEmbalagem("");
      setSegmento("");
      setFornecedor("");
      setQuantidade("12");
      setPeso("");
      setPrecoCompra("");
      setPrecoVenda("");
      setPrecoUndVenda("");
      setEstoque("0");
      setStatus("ativo");
    }
    setErros({});
    setSalvando(false);
  }, [aberto, produto]);

  // Fecha o modal ao teclar Escape
  useEffect(() => {
    if (!aberto) return;
    const tratarKeyDown = (e) => {
      if (e.key === "Escape" && !salvando) {
        aoFechar();
      }
    };
    window.addEventListener("keydown", tratarKeyDown);
    return () => window.removeEventListener("keydown", tratarKeyDown);
  }, [aberto, salvando, aoFechar]);

  // CÁLCULO SEMPRE AUTOMÁTICO: Preço Unidade Avulsa = Preço de Venda ÷ Qtd. por Caixa
  useEffect(() => {
    const numVenda = parseFloat(String(precoVenda).replace(",", ".")) || 0;
    const numQtd = parseInt(quantidade, 10) || 0;

    if (numVenda > 0 && numQtd > 0) {
      setPrecoUndVenda((numVenda / numQtd).toFixed(2));
    } else {
      setPrecoUndVenda("");
    }
  }, [precoVenda, quantidade]);

  // Cálculos automáticos de lucro e margem para o card de projeção
  const calculos = useMemo(() => {
    const numVenda = parseFloat(String(precoVenda).replace(",", ".")) || 0;
    const numCompra = parseFloat(String(precoCompra).replace(",", ".")) || 0;
    const numQtd = parseInt(quantidade, 10) || 0;

    const lucro = numVenda - numCompra;
    const margemPercentual = numVenda > 0 ? (lucro / numVenda) * 100 : 0;
    const precoUnitarioCalculado = numQtd > 0 && numVenda > 0 ? numVenda / numQtd : 0;

    return {
      lucro,
      margemPercentual,
      precoUnitarioCalculado,
    };
  }, [precoVenda, precoCompra, quantidade]);

  // Tratar submissão do formulário com validações obrigatórias
  const tratarSubmeter = async (e) => {
    if (e) e.preventDefault();

    const novosErros = {};

    // 1. Nome do produto obrigatório
    if (!nome.trim()) {
      novosErros.nome = "Nome do produto é obrigatório.";
    }

    // 2. Embalagem obrigatória
    if (!embalagem.trim()) {
      novosErros.embalagem = "Embalagem é obrigatória (ex: LATA 350ML, PET 2L).";
    }

    // 3. Segmento obrigatório
    if (!segmento.trim()) {
      novosErros.segmento = "Segmento é obrigatório (ex: CERVEJA, REFRI).";
    }

    // 4. Fornecedor obrigatório
    if (!fornecedor.trim()) {
      novosErros.fornecedor = "Fornecedor é obrigatório (ex: AMBEV, HEINEKEN).";
    }

    // 5. Quantidade por caixa obrigatória e > 0
    const numQtd = parseInt(quantidade, 10);
    if (!quantidade || isNaN(numQtd) || numQtd <= 0) {
      novosErros.quantidade = "Qtd. por caixa deve ser maior que 0.";
    }

    // 6. Estoque atual obrigatório
    const numEstoque = parseFloat(String(estoque).replace(",", "."));
    if (estoque === "" || estoque === null || isNaN(numEstoque)) {
      novosErros.estoque = "Estoque atual é obrigatório (informe 0 se zerado).";
    }

    // 7. Preço de compra (custo) obrigatório e > 0
    const numCompra = parseFloat(String(precoCompra).replace(",", "."));
    if (!precoCompra || isNaN(numCompra) || numCompra <= 0) {
      novosErros.precoCompra = "Preço de compra deve ser maior que R$ 0,00.";
    }

    // 8. Preço de venda obrigatório e > 0
    const numVenda = parseFloat(String(precoVenda).replace(",", "."));
    if (!precoVenda || isNaN(numVenda) || numVenda <= 0) {
      novosErros.precoVenda = "Preço de venda deve ser maior que R$ 0,00.";
    }

    // Bloqueia se houver erros
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      setMensagem("Preencha todos os campos obrigatórios marcados com asterisco (*)");
      return;
    }

    setSalvando(true);

    try {
      const numPeso = parseFloat(String(peso).replace(",", ".")) || 0;
      // Preço unidade avulsa calculado automaticamente: precoVenda / quantidade
      const numPrecoUnd = Number((numVenda / numQtd).toFixed(4));

      const lucroCalculado = Number((numVenda - numCompra).toFixed(2));
      const margemCalculada = Number((((numVenda - numCompra) / numVenda) * 100).toFixed(2));

      const payload = {
        nome: nome.trim().toUpperCase(),
        embalagem: embalagem.trim().toUpperCase(),
        segmento: segmento.trim().toUpperCase(),
        fornecedor: fornecedor.trim().toUpperCase(),
        precoVenda: numVenda,
        precoCompra: numCompra,
        peso: numPeso,
        lucro: lucroCalculado,
        margem: margemCalculada,
        quantidade: numQtd,
        precoUndVenda: numPrecoUnd,
        estoque: numEstoque,
        status: status || "ativo",
      };

      if (modoEdicao) {
        const resposta = await AtualizarProduto(produto.id, payload);
        setMensagem(
          resposta?.mensagem || `Produto "${nome}" atualizado com sucesso!`,
        );
      } else {
        const resposta = await CriarProduto(payload);
        setMensagem(
          resposta?.mensagem || `Produto "${nome}" cadastrado com sucesso!`,
        );
      }

      if (aoSalvarSucesso) {
        aoSalvarSucesso();
      }
      aoFechar();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      setMensagem(error.message || "Erro ao salvar os dados do produto");
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) return null;

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget && !salvando) aoFechar();
      }}
    >
      <div className={styles.modalContainer} role="dialog" aria-modal="true">
        {/* CABEÇALHO DO MODAL */}
        <header className={styles.modalHeader}>
          <div className={styles.headerInfo}>
            <div
              className={`${styles.headerIconWrapper} ${
                modoEdicao ? styles.editar : styles.novo
              }`}
            >
              {modoEdicao ? (
                <PencilSimple size={22} weight="bold" />
              ) : (
                <PlusCircle size={22} weight="bold" />
              )}
            </div>
            <div>
              <p className={styles.subtitulo}>
                {modoEdicao ? "Atualização de Registro" : "Novo Cadastro"}
              </p>
              <h2 className={styles.titulo}>
                {modoEdicao ? "Editar Produto" : "Cadastrar Produto"}
                {modoEdicao && (
                  <span className={styles.badgeId}>#{produto.id}</span>
                )}
              </h2>
            </div>
          </div>

          <button
            type="button"
            className={styles.botaoFechar}
            onClick={aoFechar}
            disabled={salvando}
            title="Fechar (Esc)"
          >
            <X size={20} weight="bold" />
          </button>
        </header>

        {/* CORPO DO FORMULÁRIO */}
        <form onSubmit={tratarSubmeter} className={styles.modalCorpo}>
          <div className={styles.gridInputs}>
            {/* 1. NOME (OBRIGATÓRIO) */}
            <div className={`${styles.grupoInput} ${styles.colunaInteira}`}>
              <label className={styles.label}>
                <Barcode size={14} weight="bold" />
                Nome do Produto{" "}
                <span className={styles.labelObrigatorio}>*</span>
              </label>
              <div
                className={`${styles.inputWrapper} ${
                  erros.nome ? styles.inputErro : ""
                }`}
              >
                <input
                  type="text"
                  className={styles.campoTexto}
                  placeholder="Ex: CERVEJA HEINEKEN 350ML SLEEK"
                  value={nome}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setNome(val);
                    if (erros.nome && val.trim()) {
                      setErros((prev) => ({ ...prev, nome: null }));
                    }
                  }}
                  autoFocus
                />
              </div>
              {erros.nome && (
                <span className={styles.mensagemErro}>{erros.nome}</span>
              )}
            </div>

            {/* 2. EMBALAGEM (OBRIGATÓRIA) */}
            <div className={styles.grupoInput}>
              <label className={styles.label}>
                <Package size={14} weight="bold" />
                Embalagem{" "}
                <span className={styles.labelObrigatorio}>*</span>
              </label>
              <div
                className={`${styles.inputWrapper} ${
                  erros.embalagem ? styles.inputErro : ""
                }`}
              >
                <input
                  type="text"
                  list="listaEmbalagens"
                  className={styles.campoTexto}
                  placeholder="Ex: LATA 350ML, PET 2L, LONG NECK"
                  value={embalagem}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setEmbalagem(val);
                    if (erros.embalagem && val.trim()) {
                      setErros((prev) => ({ ...prev, embalagem: null }));
                    }
                  }}
                />
                <datalist id="listaEmbalagens">
                  <option value="LATA 350ML" />
                  <option value="LATA 473ML" />
                  <option value="LONG NECK" />
                  <option value="GARRAFA 600ML" />
                  <option value="GARRAFA 1L" />
                  <option value="PET 2L" />
                  <option value="PET 1.5L" />
                  <option value="CAÇULINHA" />
                  <option value="BARRIQUE" />
                </datalist>
              </div>
              {erros.embalagem && (
                <span className={styles.mensagemErro}>{erros.embalagem}</span>
              )}
            </div>

            {/* 3. SEGMENTO (OBRIGATÓRIO) */}
            <div className={styles.grupoInput}>
              <label className={styles.label}>
                <Tag size={14} weight="bold" />
                Segmento{" "}
                <span className={styles.labelObrigatorio}>*</span>
              </label>
              <div
                className={`${styles.inputWrapper} ${
                  erros.segmento ? styles.inputErro : ""
                }`}
              >
                <input
                  type="text"
                  list="listaSegmentos"
                  className={styles.campoTexto}
                  placeholder="Ex: CERVEJA, REFRI, DESTILADOS"
                  value={segmento}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setSegmento(val);
                    if (erros.segmento && val.trim()) {
                      setErros((prev) => ({ ...prev, segmento: null }));
                    }
                  }}
                />
                <datalist id="listaSegmentos">
                  <option value="CERVEJA" />
                  <option value="REFRI" />
                  <option value="DESTILADOS" />
                  <option value="ENERGÉTICO" />
                  <option value="ÁGUA" />
                  <option value="SUCO" />
                  <option value="VINHO" />
                  <option value="CARVÃO/GELO" />
                </datalist>
              </div>
              {erros.segmento && (
                <span className={styles.mensagemErro}>{erros.segmento}</span>
              )}
            </div>

            {/* 4. FORNECEDOR (OBRIGATÓRIO) */}
            <div className={styles.grupoInput}>
              <label className={styles.label}>
                <Factory size={14} weight="bold" />
                Fornecedor{" "}
                <span className={styles.labelObrigatorio}>*</span>
              </label>
              <div
                className={`${styles.inputWrapper} ${
                  erros.fornecedor ? styles.inputErro : ""
                }`}
              >
                <input
                  type="text"
                  list="listaFornecedores"
                  className={styles.campoTexto}
                  placeholder="Ex: AMBEV, HEINEKEN, COCA-COLA"
                  value={fornecedor}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setFornecedor(val);
                    if (erros.fornecedor && val.trim()) {
                      setErros((prev) => ({ ...prev, fornecedor: null }));
                    }
                  }}
                />
                <datalist id="listaFornecedores">
                  <option value="AMBEV" />
                  <option value="HEINEKEN" />
                  <option value="COCA-COLA" />
                  <option value="GRUPO PETRÓPOLIS" />
                  <option value="CAMPARI" />
                  <option value="DIAGEO" />
                  <option value="PERNOD RICARD" />
                </datalist>
              </div>
              {erros.fornecedor && (
                <span className={styles.mensagemErro}>{erros.fornecedor}</span>
              )}
            </div>

            {/* 5. QUANTIDADE POR FARDO / CAIXA (OBRIGATÓRIO) */}
            <div className={styles.grupoInput}>
              <label className={styles.label}>
                <Stack size={14} weight="bold" />
                Qtd. por Caixa/Embalagem{" "}
                <span className={styles.labelObrigatorio}>*</span>
              </label>
              <div
                className={`${styles.inputWrapper} ${
                  erros.quantidade ? styles.inputErro : ""
                }`}
              >
                <input
                  type="number"
                  min="1"
                  step="1"
                  className={styles.campoTexto}
                  placeholder="Ex: 12"
                  value={quantidade}
                  onChange={(e) => {
                    setQuantidade(e.target.value);
                    if (erros.quantidade && parseInt(e.target.value, 10) > 0) {
                      setErros((prev) => ({ ...prev, quantidade: null }));
                    }
                  }}
                />
                <span className={styles.sufixoTexto}>unid.</span>
              </div>
              {erros.quantidade && (
                <span className={styles.mensagemErro}>{erros.quantidade}</span>
              )}
            </div>

            {/* 6. ESTOQUE ATUAL (OBRIGATÓRIO) */}
            <div className={styles.grupoInput}>
              <label className={styles.label}>
                <Package size={14} weight="bold" />
                Estoque Atual{" "}
                <span className={styles.labelObrigatorio}>*</span>
              </label>
              <div
                className={`${styles.inputWrapper} ${
                  erros.estoque ? styles.inputErro : ""
                }`}
              >
                <input
                  type="number"
                  step="any"
                  className={styles.campoTexto}
                  placeholder="Ex: 100"
                  value={estoque}
                  onChange={(e) => {
                    setEstoque(e.target.value);
                    if (erros.estoque && e.target.value !== "") {
                      setErros((prev) => ({ ...prev, estoque: null }));
                    }
                  }}
                />
                <span className={styles.sufixoTexto}>fardos/cx</span>
              </div>
              {erros.estoque && (
                <span className={styles.mensagemErro}>{erros.estoque}</span>
              )}
            </div>

            {/* 7. PREÇO DE COMPRA (CUSTO) (OBRIGATÓRIO) */}
            <div className={styles.grupoInput}>
              <label className={styles.label}>
                <CurrencyDollar size={14} weight="bold" />
                Preço de Compra (Custo){" "}
                <span className={styles.labelObrigatorio}>*</span>
              </label>
              <div
                className={`${styles.inputWrapper} ${
                  erros.precoCompra ? styles.inputErro : ""
                }`}
              >
                <span className={styles.prefixoMoeda}>R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={styles.campoTexto}
                  placeholder="0,00"
                  value={precoCompra}
                  onChange={(e) => {
                    setPrecoCompra(e.target.value);
                    if (erros.precoCompra && parseFloat(e.target.value) > 0) {
                      setErros((prev) => ({ ...prev, precoCompra: null }));
                    }
                  }}
                />
              </div>
              {erros.precoCompra && (
                <span className={styles.mensagemErro}>{erros.precoCompra}</span>
              )}
            </div>

            {/* 8. PREÇO DE VENDA (OBRIGATÓRIO) */}
            <div className={styles.grupoInput}>
              <label className={styles.label}>
                <CurrencyDollar size={14} weight="bold" />
                Preço de Venda (Caixa){" "}
                <span className={styles.labelObrigatorio}>*</span>
              </label>
              <div
                className={`${styles.inputWrapper} ${
                  erros.precoVenda ? styles.inputErro : ""
                }`}
              >
                <span className={styles.prefixoMoeda}>R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={styles.campoTexto}
                  placeholder="0,00"
                  value={precoVenda}
                  onChange={(e) => {
                    setPrecoVenda(e.target.value);
                    if (erros.precoVenda && parseFloat(e.target.value) > 0) {
                      setErros((prev) => ({ ...prev, precoVenda: null }));
                    }
                  }}
                />
              </div>
              {erros.precoVenda && (
                <span className={styles.mensagemErro}>{erros.precoVenda}</span>
              )}
            </div>

            {/* 9. PREÇO UND VENDA (AVULSO) - SEMPRE AUTOMÁTICO */}
            <div className={styles.grupoInput}>
              <label className={styles.label}>
                <CurrencyDollar size={14} weight="bold" />
                Preço Unidade Avulsa
              </label>
              <div
                className={styles.inputWrapper}
                style={{ background: "var(--gray-200, #e9ecef)" }}
              >
                <span className={styles.prefixoMoeda}>R$</span>
                <input
                  type="text"
                  className={styles.campoTexto}
                  placeholder="Calculado automaticamente"
                  value={precoUndVenda}
                  readOnly
                  style={{
                    fontWeight: 700,
                    color: "var(--blue, #1971c2)",
                    cursor: "not-allowed",
                  }}
                  title="Calculado automaticamente: Preço de Venda ÷ Qtd. por Caixa"
                />
              </div>
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--gray-600, #495057)",
                  marginTop: "3px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Lightning size={13} weight="fill" color="var(--orange)" />
                Cálculo automático: Preço de Venda ÷ Qtd. Caixa
              </span>
            </div>

            {/* PESO (KG) - OPCIONAL */}
            <div className={styles.grupoInput}>
              <label className={styles.label}>
                <Scales size={14} weight="bold" />
                Peso Total (Carga)
              </label>
              <div className={styles.inputWrapper}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={styles.campoTexto}
                  placeholder="Ex: 4.5"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                />
                <span className={styles.sufixoTexto}>kg</span>
              </div>
            </div>

            {/* STATUS DO PRODUTO */}
            <div className={`${styles.grupoInput} ${styles.colunaInteira}`}>
              <label className={styles.label}>
                <Tag size={14} weight="bold" />
                Status do Produto
              </label>
              <div className={styles.inputWrapper}>
                <select
                  className={styles.campoSelect}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>
          </div>

          {/* CARD DE MÉTRICAS EM TEMPO REAL: LUCRO E MARGEM */}
          <div className={styles.cardCalculos}>
            <div className={styles.cardCalculosTitulo}>
              <ChartLineUp size={16} weight="bold" />
              Projeção Financeira e Rentabilidade
            </div>
            <div className={styles.gridMetricas}>
              {/* LUCRO BRUTO */}
              <div className={styles.metricaItem}>
                <span className={styles.metricaRotulo}>Lucro Estimado</span>
                <span
                  className={`${styles.metricaValor} ${
                    calculos.lucro > 0
                      ? styles.metricaPositiva
                      : calculos.lucro < 0
                        ? styles.metricaNegativa
                        : styles.metricaNeutra
                  }`}
                >
                  {formatarMoeda(calculos.lucro)}
                </span>
              </div>

              {/* MARGEM DE LUCRO */}
              <div className={styles.metricaItem}>
                <span className={styles.metricaRotulo}>Margem de Lucro</span>
                <span
                  className={`${styles.metricaValor} ${
                    calculos.margemPercentual > 0
                      ? styles.metricaPositiva
                      : calculos.margemPercentual < 0
                        ? styles.metricaNegativa
                        : styles.metricaNeutra
                  }`}
                >
                  {calculos.margemPercentual.toFixed(2)}%
                </span>
              </div>

              {/* PREÇO UNITÁRIO CALCULADO */}
              <div className={styles.metricaItem}>
                <span className={styles.metricaRotulo}>
                  Preço Automático / Unid.
                </span>
                <span className={`${styles.metricaValor} styles.metricaNeutra`}>
                  {calculos.precoUnitarioCalculado > 0
                    ? formatarMoeda(calculos.precoUnitarioCalculado)
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* RODAPÉ COM AÇÕES */}
          <footer className={styles.modalRodape}>
            <button
              type="button"
              className={styles.botaoCancelar}
              onClick={aoFechar}
              disabled={salvando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.botaoSalvar}
              disabled={salvando}
            >
              {salvando ? (
                <>
                  <div className={styles.spinnerBtn} />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <FloppyDisk size={16} weight="fill" />
                  <span>
                    {modoEdicao ? "Salvar Alterações" : "Cadastrar Produto"}
                  </span>
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

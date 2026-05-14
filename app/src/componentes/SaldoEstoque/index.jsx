import { useState, useEffect, useCallback } from "react";
import {
  FilePdfIcon,
  Package,
  MagnifyingGlass,
  X,
  Barcode,
  ArrowLeft,
  ArrowLeftIcon,
} from "@phosphor-icons/react";
import styles from "./styles.module.css";
import { buscarEstoque } from "../../operadores/API/estoque/buscarEstoque";
import AjustarProdutoEstoque from "../AjustarProdutoEstoque";
import { usarToast } from "../Context/toastContext";
import { AlertaRadix } from "../ui/alerta/alerta";
import SaidaEstoque from "../SaidaEstoque";

export default function Estoque({ setView }) {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [atualizarLista, setAtualizarLista] = useState(false);

  // Hooks
  const { setMensagem } = usarToast()

  // Função para gerar e baixar PDF
  const gerarPDF = async () => {

    const estoqueMaiorZero = itens.filter(item => item.estoque > 0)

    const pdf = await window.PDF.gerarPDFEstoque(estoqueMaiorZero);

    console.log(pdf)

    if(pdf.sucesso === false) {
      setMensagem(pdf.mensagem)
      return
    }
    setMensagem(pdf.mensagem)
  }

  // Função carregar estoque.
  const carregarEstoque = useCallback(async () => {
    setCarregando(true);
    try {
      const saldo = await buscarEstoque();
      setItens(saldo);
    } catch(error) {
        console.log(error.message)
        setMensagem(error.message)
    } finally {
      setCarregando(false);
    }
  }, []);

  // ouvindo função.
  useEffect(() => {
    carregarEstoque();
  }, [carregarEstoque, atualizarLista]);

  const itensFiltrados = itens.filter((i) =>
    i.nome.toLowerCase().includes(busca.toLowerCase())
  );

  function nivelEstoque(qtd) {
    if (qtd <= 20) return "critico";
    if (qtd <= 80) return "baixo";
    if (qtd <= 200) return "medio";
    return "alto";
  }

  return (
    <div className={styles.container}>

    {/* CABEÇALHO */}
        <div className={styles.cardHeader}>
            <div className={styles.cardHeaderTitle}>
                <Package size={18} className={styles.cardHeaderIcon} />
                <h2>Saldo de estoque atual</h2>
            </div>
            <button className={styles.botaoVoltar} onClick={() => setView("lista")}>
                <ArrowLeftIcon size={14} weight="bold" />
                Voltar
            </button>
        </div>

      {/* PAINEIS */}
      <div className={styles.layoutDuplo}>

        {/* LISTA */}
        <div className={styles.colunaLista}>

          {/* BUSCAR */}
          <div className={styles.buscaWrapper}>
            <MagnifyingGlass size={16} className={styles.buscaIcone} />
            <input
              className={styles.buscaInput}
              placeholder="Buscar produto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            {busca && (
              <button className={styles.buscaLimpar} onClick={() => setBusca("")}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* TABELA */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <Barcode size={17} className={styles.cardHeaderIcon} />
                <h2>Produtos em Estoque</h2>
              </div>
              <span className={styles.badge}>
                {itensFiltrados.length} produto{itensFiltrados.length !== 1 ? "s" : ""}
              </span>
              {/* BOTÃO GERAR PDF */}
              <AlertaRadix
                titulo="Criar PDF"
                descricao="Você realmente deseja gerar relatório de estoque em PDF?"
                tratar={gerarPDF}
                confirmarTexto="Confirmar"
                cancelarTexto="Sair"
                trigger={
                  <button className={styles.botaoPDF}>
                    <FilePdfIcon size={26} />
                  </button>
                }
              />
            </div>

            {/* TÍTULOS */}
            <div className={styles.tabelaWrapper}>
              <div className={styles.tituloLista}>
                <span>#</span>
                <span>Produto</span>
                <span>Qtd</span>
                <span>Status</span>
              </div>

            {/* LISTA */}
              {carregando ? (
                <div className={styles.estadoVazio}>
                  <div className={styles.spinner} />
                  <p>Carregando estoque...</p>
                </div>
                // LISTA VAZIA
              ) : itensFiltrados.length === 0 ? (
                <div className={styles.estadoVazio}>
                  <Package size={40} className={styles.iconeVazio} />
                  <p>Nenhum produto encontrado</p>
                  <span>Tente outro termo na busca</span>
                </div>
              ) : (
                // LISTA
                <div className={styles.lista}>
                  {itensFiltrados.map((item) => {
                    const nivel = nivelEstoque(item.estoque);
                    return (
                      <div key={item.id} className={styles.itemRow}>
                        <span className={styles.itemId}>#{item.id}</span>
                        <span className={styles.itemNome}>{item.nome}</span>
                        <span className={styles.itemEstoque}>{item.estoque}</span>
                        <span>
                          <span className={`${styles.statusBadge} ${styles[`status_${nivel}`]}`}>
                            {nivel === "critico" && "⚠ Crítico"}
                            {nivel === "baixo" && "↓ Baixo"}
                            {nivel === "medio" && "● Normal"}
                            {nivel === "alto" && "✓ Bom"}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AJUSTE */}
        <div className={styles.colunaAjuste}>
          <AjustarProdutoEstoque setAtualizarLista={setAtualizarLista} />
          <div>
              <SaidaEstoque />
          </div>
        </div>


      </div>
    </div>
  );
}
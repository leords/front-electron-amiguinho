import { useState } from "react";
import styles from "./styles.module.css";
import { ajusteEstoque } from "../../operadores/API/estoque/ajusteEstoque";
import { usarToast } from "../Context/toastContext";
import { useProdutos } from "../../hooks/useProdutos";
import Select from "react-select";
import {
  ArrowDown,
  ArrowUp,
  CircleNotch,
  Package,
  X,
} from "@phosphor-icons/react";
import { AlertaRadix } from "../ui/alerta/alerta";
import { formatarEstoque } from "../../utils/formatarEstoque";

export default function AjustarProdutoEstoque({ setAtualizarLista }) {
  // LocalStorage
  const usuarioId = localStorage.getItem("idUsuario");

  // Estados
  const [tipo, setTipo] = useState("ENTRADA");
  const [quantidade, setQuantidade] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // Hooks
  const { setMensagem } = usarToast();
  const { produtos } = useProdutos();

  // Formatando produtos no formato para o Select
  const listaProdutos = produtos.map((p) => ({ value: p.id, label: p.nome }));

  // Função salvar ajuste
  async function salvarAjuste() {
    if (!produtoSelecionado?.id) {
      setMensagem("Selecione um produto para realizar o ajuste.");
      return;
    }

    const qtd = parseInt(quantidade, 10);
    if (!qtd || qtd <= 0) {
      setMensagem("Informe uma quantidade válida maior que zero.");
      return;
    }

    if (!usuarioId) {
      setMensagem("Usuário não identificado. Faça login novamente.");
      return;
    }

    // Se for saída, valida se o estoque comporta
    if (tipo === "SAIDA" && Number(produtoSelecionado.estoque || 0) < qtd) {
      setMensagem("Estoque insuficiente para realizar esta saída.");
      return;
    }

    setSalvando(true);
    try {
      const ajuste = await ajusteEstoque(
        produtoSelecionado.id,
        qtd,
        usuarioId,
        tipo,
      );

      if (ajuste) {
        setMensagem(
          `Ajuste de ${tipo === "ENTRADA" ? "entrada" : "saída"} de ${qtd} un. realizado com sucesso!`,
        );

        // Atualiza o estoque local do produto selecionado
        setProdutoSelecionado((prev) => {
          if (!prev) return null;
          const delta = tipo === "ENTRADA" ? qtd : -qtd;
          return {
            ...prev,
            estoque: Math.max(0, Number(prev.estoque || 0) + delta),
          };
        });

        // Limpa campo de quantidade
        setQuantidade("");

        // Atualiza a lista da tela pai
        if (typeof setAtualizarLista === "function") {
          setAtualizarLista((prev) => !prev);
        }
      } else {
        setMensagem("Não foi possível concluir o ajuste.");
      }
    } catch (error) {
      console.error("Erro ao salvar ajuste de estoque:", error);
      setMensagem(error.message || "Erro inesperado ao realizar ajuste.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={styles.modal}>
      {/* TITULO */}
      <div className={styles.modalHeader}>
        <div className={styles.modalTitulo}>
          <Package size={18} weight="fill" />
          <span>Ajuste de Estoque</span>
        </div>
      </div>

      {/* SELECT */}
      <div className={styles.select}>
        <Select
          classNamePrefix="custom"
          options={listaProdutos}
          value={
            listaProdutos.find((opt) => opt.value === produtoSelecionado?.id) ||
            null
          }
          onChange={(opt) =>
            setProdutoSelecionado(produtos.find((p) => p.id === opt.value))
          }
          placeholder="Selecione ou digite..."
          isSearchable
          noOptionsMessage={() => "Nenhum produto encontrado"}
        />
      </div>

      <div className={styles.modalBody}>
        {/* MODAL DESCRIÇÃO PRODUTO + QUANTIDADE */}
        <div className={styles.modalProduto}>
          <p className={styles.modalProdutoNome}>{produtoSelecionado?.nome}</p>
          <span className={styles.modalProdutoEstoque}>
            Estoque atual: <strong>{formatarEstoque(produtoSelecionado?.estoque)}</strong>
          </span>
        </div>

        {/* BOTÕES DE TIPO DE AJUSTE: ENTRADA/SAIDA */}
        <div className={styles.tipoGroup}>
          {/* ENTRADA */}
          <button
            className={`${styles.tipoBotao} ${tipo === "ENTRADA" ? styles.tipoAtivo_entrada : ""}`}
            onClick={() => setTipo("ENTRADA")}
          >
            <ArrowDown size={16} weight="bold" />
            Entrada
          </button>
          {/* SAIDA */}
          <button
            className={`${styles.tipoBotao} ${tipo === "SAIDA" ? styles.tipoAtivo_saida : ""}`}
            onClick={() => setTipo("SAIDA")}
          >
            <ArrowUp size={16} weight="bold" />
            Saída
          </button>
        </div>

        {/* QUANTIDADE */}
        <div className={styles.filtroGrupo}>
          <label className={styles.filtroLabel}>Quantidade</label>
          <input
            type="number"
            min="1"
            className={styles.input}
            placeholder="Ex: 50"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && salvarAjuste()}
            autoFocus
          />
        </div>

        {/* PREVIEW NOVO ESTOQUE */}
        {quantidade && parseInt(quantidade, 10) > 0 && produtoSelecionado && (
          <div
            className={`${styles.preview} ${tipo === "ENTRADA" ? styles.previewEntrada : styles.previewSaida}`}
          >
            {/* CONDICIONAL ENTRADA / SAIDA */}
            {tipo === "ENTRADA" ? (
              <>
                <ArrowDown size={14} weight="bold" />
                Novo estoque:{" "}
                <strong>
                  {formatarEstoque(
                    Number(produtoSelecionado.estoque || 0) +
                      parseInt(quantidade, 10),
                  )}
                </strong>
              </>
            ) : (
              <>
                <ArrowUp size={14} weight="bold" />
                Novo estoque:{" "}
                <strong>
                  {formatarEstoque(
                    Math.max(
                      0,
                      Number(produtoSelecionado.estoque || 0) -
                        parseInt(quantidade, 10),
                    ),
                  )}
                </strong>
                {parseInt(quantidade, 10) >
                  Number(produtoSelecionado.estoque || 0) && (
                  <span className={styles.previewAviso}>
                    {" "}
                    — estoque insuficiente!
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* BOTÕES */}
      <div className={styles.modalFooter}>
        {/* BOTÃO CANCELAR */}
        <button
          type="button"
          className={styles.botaoCancelar}
          disabled={salvando}
          onClick={() => {
            setQuantidade("");
            setProdutoSelecionado(null);
          }}
        >
          Cancelar
        </button>

        {/* BOTÃO SALVAR */}
        <AlertaRadix
          titulo={`Confirmar ajuste de ${tipo === "ENTRADA" ? "entrada" : "saída"}`}
          descricao={
            produtoSelecionado
              ? `Deseja realmente confirmar a ${tipo === "ENTRADA" ? "entrada" : "saída"} de ${quantidade || 0} un. do produto "${produtoSelecionado.nome}"?`
              : "Você realmente deseja salvar o ajuste?"
          }
          tratar={() => {
            if (salvando || !quantidade || !produtoSelecionado) return;
            salvarAjuste();
          }}
          confirmarTexto="Confirmar"
          cancelarTexto="Voltar"
          trigger={
            <button
              type="button"
              className={styles.botaoPrincipal}
              disabled={
                salvando ||
                !produtoSelecionado ||
                !quantidade ||
                parseInt(quantidade, 10) <= 0
              }
            >
              {salvando ? (
                <>
                  <CircleNotch size={16} className={styles.spinnerIcon} />
                  Salvando...
                </>
              ) : (
                <>
                  {tipo === "ENTRADA" ? (
                    <ArrowDown size={16} weight="bold" />
                  ) : (
                    <ArrowUp size={16} weight="bold" />
                  )}
                  Confirmar {tipo === "ENTRADA" ? "Entrada" : "Saída"}
                </>
              )}
            </button>
          }
        />
      </div>
    </div>
  );
}

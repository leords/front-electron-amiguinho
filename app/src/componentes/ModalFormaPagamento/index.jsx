import { useState, useEffect } from "react";
import {
  X,
  PlusCircle,
  PencilSimple,
  CreditCard,
  Tag,
  FloppyDisk,
  SquaresFour,
} from "@phosphor-icons/react";
import styles from "./styles.module.css";
import { criarFormaPagamento } from "../../operadores/API/formaPagamento/criarFormaPagamento";
import { atualizarFormaPagamento } from "../../operadores/API/formaPagamento/atualizarFormaPagamento";
import { usarToast } from "../Context/toastContext";

export default function ModalFormaPagamento({
  aberto,
  aoFechar,
  forma = null,
  aoSalvarSucesso,
}) {
  const { setMensagem } = usarToast();
  const modoEdicao = Boolean(forma && forma.id);

  // Estados dos campos
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("VENDAS");
  const [status, setStatus] = useState("ATIVO");

  // Estados de controle
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  // Popula os campos na abertura
  useEffect(() => {
    if (!aberto) return;

    if (forma && forma.id) {
      setNome((forma.nome || "").toUpperCase());
      setTipo((forma.tipo || "VENDAS").toUpperCase());
      setStatus(String(forma.status || "ATIVO").toUpperCase());
    } else {
      setNome("");
      setTipo("VENDAS");
      setStatus("ATIVO");
    }

    setErros({});
    setSalvando(false);
  }, [aberto, forma]);

  // Tecla Escape para fechar
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

  // Submeter cadastro / edição
  const tratarSubmeter = async (e) => {
    if (e) e.preventDefault();

    const novosErros = {};

    if (!nome.trim()) {
      novosErros.nome = "Nome da forma de pagamento é obrigatório.";
    }

    if (!tipo.trim()) {
      novosErros.tipo = "Tipo/Canal é obrigatório (ex: VENDAS, BALCAO, EXTERNA).";
    }

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      setMensagem("Preencha todos os campos obrigatórios (*)");
      return;
    }

    setSalvando(true);

    try {
      const payload = {
        nome: nome.trim().toUpperCase(),
        tipo: tipo.trim().toUpperCase(),
        status: status || "ATIVO",
      };

      if (modoEdicao) {
        const resposta = await atualizarFormaPagamento(forma.id, payload);
        setMensagem(
          resposta?.mensagem || `Forma "${nome}" atualizada com sucesso!`,
        );
      } else {
        const resposta = await criarFormaPagamento(payload);
        setMensagem(
          resposta?.mensagem || `Forma "${nome}" cadastrada com sucesso!`,
        );
      }

      if (aoSalvarSucesso) {
        aoSalvarSucesso();
      }
      aoFechar();
    } catch (error) {
      console.error("Erro ao salvar forma de pagamento:", error);
      setMensagem(
        error.message || "Erro ao salvar os dados da forma de pagamento",
      );
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
                {modoEdicao
                  ? "Editar Forma de Pagamento"
                  : "Cadastrar Forma de Pagamento"}
                {modoEdicao && (
                  <span className={styles.badgeId}>#{forma.id}</span>
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
            {/* NOME DA FORMA DE PAGAMENTO */}
            <div className={styles.grupoInput}>
              <label className={styles.label}>
                <CreditCard size={14} weight="bold" />
                Nome da Forma de Pagamento{" "}
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
                  placeholder="Ex: DINHEIRO, PIX, CARTÃO DÉBITO"
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

            {/* TIPO / CANAL */}
            <div className={styles.grupoInput}>
              <label className={styles.label}>
                <SquaresFour size={14} weight="bold" />
                Tipo / Canal{" "}
                <span className={styles.labelObrigatorio}>*</span>
              </label>
              <div
                className={`${styles.inputWrapper} ${
                  erros.tipo ? styles.inputErro : ""
                }`}
              >
                <input
                  type="text"
                  list="listaTiposForma"
                  className={styles.campoTexto}
                  placeholder="Ex: VENDAS, BALCAO, EXTERNA"
                  value={tipo}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setTipo(val);
                    if (erros.tipo && val.trim()) {
                      setErros((prev) => ({ ...prev, tipo: null }));
                    }
                  }}
                />
                <datalist id="listaTiposForma">
                  <option value="VENDAS" />
                  <option value="BALCAO" />
                  <option value="EXTERNA" />
                  <option value="DELIVERY" />
                </datalist>
              </div>
              {erros.tipo && (
                <span className={styles.mensagemErro}>{erros.tipo}</span>
              )}
            </div>

            {/* STATUS */}
            <div className={styles.grupoInput}>
              <label className={styles.label}>
                <Tag size={14} weight="bold" />
                Status
              </label>
              <div className={styles.inputWrapper}>
                <select
                  className={styles.campoSelect}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="ATIVO">ATIVO</option>
                  <option value="INATIVO">INATIVO</option>
                </select>
              </div>
            </div>
          </div>

          {/* RODAPÉ DO MODAL */}
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
                    {modoEdicao ? "Salvar Alterações" : "Cadastrar Forma"}
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

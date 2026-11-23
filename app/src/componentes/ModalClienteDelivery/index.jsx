import { useState, useEffect } from "react";
import {
  X,
  PlusCircle,
  PencilSimple,
  User,
  Phone,
  MapPin,
  House,
  Signpost,
  NavigationArrow,
  Buildings,
  FloppyDisk,
  Tag,
} from "@phosphor-icons/react";
import styles from "./styles.module.css";
import { CriarClienteDelivery } from "../../operadores/API/cliente/criarClienteDelivery";
import { AtualizarClienteDelivery } from "../../operadores/API/cliente/atualizarClienteDelivery";
import { usarToast } from "../Context/toastContext";

// Função para formatar telefone brasileiro
const formatarTelefoneInput = (valor) => {
  const digitos = String(valor || "").replace(/\D/g, "").slice(0, 11);
  if (!digitos) return "";
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7, 11)}`;
};

export default function ModalClienteDelivery({
  aberto,
  aoFechar,
  cliente = null,
  aoSalvarSucesso,
}) {
  const { setMensagem } = usarToast();
  const modoEdicao = Boolean(cliente && cliente.id);

  // Estados dos campos
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [referencia, setReferencia] = useState("");
  const [complemento, setComplemento] = useState("");
  const [status, setStatus] = useState("ativo");

  // Estados de validação e controle
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  // Popula os campos na abertura
  useEffect(() => {
    if (!aberto) return;

    if (cliente && cliente.id) {
      setNome((cliente.nome || "").toUpperCase());
      setTelefone(formatarTelefoneInput(cliente.telefone || ""));
      setEndereco((cliente.endereco || "").toUpperCase());
      setNumero(
        cliente.numero !== undefined && cliente.numero !== null
          ? String(cliente.numero).toUpperCase()
          : "",
      );
      setBairro((cliente.bairro || "").toUpperCase());
      setCidade((cliente.cidade || "JOINVILLE").toUpperCase());
      setReferencia((cliente.referencia || "").toUpperCase());
      setComplemento((cliente.complemento || "").toUpperCase());
      setStatus(cliente.status || "ativo");
    } else {
      setNome("");
      setTelefone("");
      setEndereco("");
      setNumero("");
      setBairro("");
      setCidade("JOINVILLE");
      setReferencia("");
      setComplemento("");
      setStatus("ativo");
    }

    setErros({});
    setSalvando(false);
  }, [aberto, cliente]);

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

  // Submeter cadastro / edição com validação obrigatória dos 6 campos
  const tratarSubmeter = async (e) => {
    if (e) e.preventDefault();

    const novosErros = {};

    // 1. Nome Completo obrigatório
    if (!nome.trim()) {
      novosErros.nome = "Nome completo é obrigatório.";
    }

    // 2. Telefone obrigatório (com DDD)
    const telefoneLimpo = telefone.replace(/\D/g, "");
    if (!telefoneLimpo) {
      novosErros.telefone = "Telefone é obrigatório.";
    } else if (telefoneLimpo.length < 10) {
      novosErros.telefone = "Informe um telefone válido com DDD (mínimo 10 dígitos).";
    }

    // 3. Logradouro / Rua obrigatório
    if (!endereco.trim()) {
      novosErros.endereco = "Logradouro/Rua é obrigatório.";
    }

    // 4. Número predial obrigatório
    if (!String(numero).trim()) {
      novosErros.numero = "Número é obrigatório (use S/N se não houver).";
    }

    // 5. Bairro obrigatório
    if (!bairro.trim()) {
      novosErros.bairro = "Bairro é obrigatório.";
    }

    // 6. Cidade obrigatória
    if (!cidade.trim()) {
      novosErros.cidade = "Cidade é obrigatória.";
    }

    // Se houver campos não preenchidos, bloqueia o envio
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      setMensagem("Preencha todos os campos obrigatórios destacados em vermelho (*)");
      return;
    }

    setSalvando(true);

    try {
      const payload = {
        nome: nome.trim().toUpperCase(),
        telefone: telefoneLimpo || telefone.trim(),
        endereco: endereco.trim().toUpperCase(),
        numero: String(numero).trim().toUpperCase(),
        bairro: bairro.trim().toUpperCase(),
        cidade: cidade.trim().toUpperCase(),
        referencia: referencia.trim().toUpperCase(),
        complemento: complemento.trim().toUpperCase(),
        status: status || "ativo",
      };

      if (modoEdicao) {
        const resposta = await AtualizarClienteDelivery(cliente.id, payload);
        setMensagem(
          resposta?.mensagem || `Cliente "${nome}" atualizado com sucesso!`,
        );
      } else {
        const resposta = await CriarClienteDelivery(payload);
        setMensagem(
          resposta?.mensagem || `Cliente "${nome}" cadastrado com sucesso!`,
        );
      }

      if (aoSalvarSucesso) {
        aoSalvarSucesso();
      }
      aoFechar();
    } catch (error) {
      console.error("Erro ao salvar cliente delivery:", error);
      setMensagem(
        error.message || "Erro ao salvar os dados do cliente delivery",
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
                {modoEdicao ? "Atualização de Cadastro" : "Novo Cadastro"}
              </p>
              <h2 className={styles.titulo}>
                {modoEdicao
                  ? "Editar Cliente Delivery"
                  : "Cadastrar Cliente Delivery"}
                {modoEdicao && (
                  <span className={styles.badgeId}>#{cliente.id}</span>
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
          {/* SEÇÃO: DADOS PESSOAIS */}
          <div className={styles.secaoFormulario}>
            <span className={styles.secaoTitulo}>
              <User size={14} weight="bold" />
              Identificação & Contato
            </span>

            <div className={styles.gridInputs}>
              {/* NOME COMPLETO (OBRIGATÓRIO) */}
              <div className={`${styles.grupoInput} ${styles.colunaInteira}`}>
                <label className={styles.label}>
                  <User size={14} weight="bold" />
                  Nome Completo{" "}
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
                    placeholder="Ex: Carlos Eduardo Pereira"
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

              {/* TELEFONE / WHATSAPP (OBRIGATÓRIO) */}
              <div className={styles.grupoInput}>
                <label className={styles.label}>
                  <Phone size={14} weight="bold" />
                  Telefone / WhatsApp{" "}
                  <span className={styles.labelObrigatorio}>*</span>
                </label>
                <div
                  className={`${styles.inputWrapper} ${
                    erros.telefone ? styles.inputErro : ""
                  }`}
                >
                  <input
                    type="text"
                    className={styles.campoTexto}
                    placeholder="(47) 99999-9999"
                    value={telefone}
                    onChange={(e) => {
                      const valorFormatado = formatarTelefoneInput(e.target.value);
                      setTelefone(valorFormatado);
                      if (erros.telefone && valorFormatado.replace(/\D/g, "").length >= 10) {
                        setErros((prev) => ({ ...prev, telefone: null }));
                      }
                    }}
                  />
                </div>
                {erros.telefone && (
                  <span className={styles.mensagemErro}>{erros.telefone}</span>
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
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO: ENDEREÇO & ENTREGA */}
          <div className={styles.secaoFormulario}>
            <span className={styles.secaoTitulo}>
              <MapPin size={14} weight="bold" />
              Endereço de Entrega
            </span>

            <div className={styles.gridInputs}>
              {/* LOGRADOURO / RUA (OBRIGATÓRIO) */}
              <div className={styles.grupoInput}>
                <label className={styles.label}>
                  <Signpost size={14} weight="bold" />
                  Logradouro / Rua{" "}
                  <span className={styles.labelObrigatorio}>*</span>
                </label>
                <div
                  className={`${styles.inputWrapper} ${
                    erros.endereco ? styles.inputErro : ""
                  }`}
                >
                  <input
                    type="text"
                    className={styles.campoTexto}
                    placeholder="Ex: Rua das Palmeiras"
                    value={endereco}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setEndereco(val);
                      if (erros.endereco && val.trim()) {
                        setErros((prev) => ({ ...prev, endereco: null }));
                      }
                    }}
                  />
                </div>
                {erros.endereco && (
                  <span className={styles.mensagemErro}>{erros.endereco}</span>
                )}
              </div>

              {/* NÚMERO (OBRIGATÓRIO) */}
              <div className={styles.grupoInput}>
                <label className={styles.label}>
                  <House size={14} weight="bold" />
                  Número{" "}
                  <span className={styles.labelObrigatorio}>*</span>
                </label>
                <div
                  className={`${styles.inputWrapper} ${
                    erros.numero ? styles.inputErro : ""
                  }`}
                >
                  <input
                    type="text"
                    className={styles.campoTexto}
                    placeholder="Ex: 450 ou S/N"
                    value={numero}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setNumero(val);
                      if (erros.numero && val.trim()) {
                        setErros((prev) => ({ ...prev, numero: null }));
                      }
                    }}
                  />
                </div>
                {erros.numero && (
                  <span className={styles.mensagemErro}>{erros.numero}</span>
                )}
              </div>

              {/* BAIRRO (OBRIGATÓRIO) */}
              <div className={styles.grupoInput}>
                <label className={styles.label}>
                  <Buildings size={14} weight="bold" />
                  Bairro{" "}
                  <span className={styles.labelObrigatorio}>*</span>
                </label>
                <div
                  className={`${styles.inputWrapper} ${
                    erros.bairro ? styles.inputErro : ""
                  }`}
                >
                  <input
                    type="text"
                    className={styles.campoTexto}
                    placeholder="Ex: Centro, América, Glória"
                    value={bairro}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setBairro(val);
                      if (erros.bairro && val.trim()) {
                        setErros((prev) => ({ ...prev, bairro: null }));
                      }
                    }}
                  />
                </div>
                {erros.bairro && (
                  <span className={styles.mensagemErro}>{erros.bairro}</span>
                )}
              </div>

              {/* CIDADE (OBRIGATÓRIA) */}
              <div className={styles.grupoInput}>
                <label className={styles.label}>
                  <MapPin size={14} weight="bold" />
                  Cidade{" "}
                  <span className={styles.labelObrigatorio}>*</span>
                </label>
                <div
                  className={`${styles.inputWrapper} ${
                    erros.cidade ? styles.inputErro : ""
                  }`}
                >
                  <input
                    type="text"
                    className={styles.campoTexto}
                    placeholder="Ex: Joinville"
                    value={cidade}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setCidade(val);
                      if (erros.cidade && val.trim()) {
                        setErros((prev) => ({ ...prev, cidade: null }));
                      }
                    }}
                  />
                </div>
                {erros.cidade && (
                  <span className={styles.mensagemErro}>{erros.cidade}</span>
                )}
              </div>

              {/* COMPLEMENTO (OPCIONAL) */}
              <div className={styles.grupoInput}>
                <label className={styles.label}>
                  <House size={14} weight="bold" />
                  Complemento
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    className={styles.campoTexto}
                    placeholder="Ex: Apto 302, Bloco B, Casa dos Fundos"
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              {/* PONTO DE REFERÊNCIA (OPCIONAL) */}
              <div className={styles.grupoInput}>
                <label className={styles.label}>
                  <NavigationArrow size={14} weight="bold" />
                  Ponto de Referência
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    className={styles.campoTexto}
                    placeholder="Ex: Próximo à padaria central"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value.toUpperCase())}
                  />
                </div>
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
                    {modoEdicao ? "Salvar Alterações" : "Cadastrar Cliente"}
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

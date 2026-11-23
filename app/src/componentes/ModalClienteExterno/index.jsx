import { useState, useEffect } from "react";
import {
  X,
  Buildings,
  PencilSimple,
  PlusCircle,
  User,
  IdentificationCard,
  Phone,
  MapPin,
  Calendar,
  Clock,
  FloppyDisk,
  CheckCircle,
  XCircle,
  WarningCircle,
} from "@phosphor-icons/react";
import styles from "./styles.module.css";
import { CriarClienteExterno } from "../../operadores/API/cliente/criarClienteExterno";
import { AtualizarClienteExterno } from "../../operadores/API/cliente/atualizarClienteExterno";
import { formatarMoeda } from "../../utils/formartarMoeda";
import { usarToast } from "../Context/toastContext";

// Formatação inteligente para CPF (11 dígitos) ou CNPJ (14 dígitos)
const formatarDocumentoInput = (valor) => {
  const digitos = String(valor || "").replace(/\D/g, "").slice(0, 14);
  if (!digitos) return "";
  if (digitos.length <= 11) {
    // CPF: 000.000.000-00
    if (digitos.length <= 3) return digitos;
    if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
    if (digitos.length <= 9) {
      return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
    }
    return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9, 11)}`;
  }
  // CNPJ: 00.000.000/0000-00
  if (digitos.length <= 12) {
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8)}`;
  }
  return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12, 14)}`;
};

// Formatação de telefone com DDD (10 ou 11 dígitos)
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

const DIAS_ATENDIMENTO = [
  "SEGUNDA",
  "TERÇA",
  "QUARTA",
  "QUINTA",
  "SEXTA",
  "SÁBADO",
  "DOMINGO",
];

const FREQUENCIAS = ["SEMANAL", "QUINZENAL", "MENSAL"];

export default function ModalClienteExterno({
  aberto,
  aoFechar,
  cliente = null,
  aoSalvarSucesso,
  vendedoresSugestoes = [],
}) {
  const { setMensagem } = usarToast();
  const modoEdicao = Boolean(cliente && cliente.id);

  // Estados dos campos
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [endereco, setEndereco] = useState("");
  const [vendedor, setVendedor] = useState("");
  const [atendimento, setAtendimento] = useState("SEGUNDA");
  const [frequencia, setFrequencia] = useState("SEMANAL");
  const [status, setStatus] = useState("ativo");

  // Estados de controle e validação
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  // Preenche os campos ao abrir o modal
  useEffect(() => {
    if (!aberto) return;

    if (cliente && cliente.id) {
      setNome((cliente.nome || "").toUpperCase());
      setCnpj(formatarDocumentoInput(cliente.cnpj || ""));
      setTelefone(formatarTelefoneInput(cliente.telefone || ""));
      setCidade((cliente.cidade || "").toUpperCase());
      setEndereco((cliente.endereco || "").toUpperCase());
      setVendedor((cliente.vendedor || "").toUpperCase());
      setAtendimento((cliente.atendimento || "SEGUNDA").toUpperCase());
      setFrequencia((cliente.frequencia || "SEMANAL").toUpperCase());
      setStatus(cliente.status || "ativo");
    } else {
      setNome("");
      setCnpj("");
      setTelefone("");
      setCidade("CANOINHAS");
      setEndereco("");
      setVendedor("");
      setAtendimento("SEGUNDA");
      setFrequencia("SEMANAL");
      setStatus("ativo");
    }
    setErros({});
  }, [aberto, cliente]);

  if (!aberto) return null;

  // Validação simples antes de submeter
  const validarFormulario = () => {
    const novosErros = {};
    if (!nome.trim() || nome.trim().length < 2) {
      novosErros.nome = "O nome/razão social deve ter ao menos 2 caracteres";
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const tratarSubmeter = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setSalvando(true);
    try {
      const payload = {
        nome: nome.trim().toUpperCase(),
        cnpj: cnpj.replace(/\D/g, "") ? cnpj.trim() : null,
        telefone: telefone.replace(/\D/g, "") ? telefone.trim() : null,
        cidade: cidade.trim() ? cidade.trim().toUpperCase() : null,
        endereco: endereco.trim() ? endereco.trim().toUpperCase() : null,
        vendedor: vendedor.trim() ? vendedor.trim().toUpperCase() : null,
        atendimento: atendimento || null,
        frequencia: frequencia || null,
        status,
      };

      if (modoEdicao) {
        const resposta = await AtualizarClienteExterno(cliente.id, payload);
        setMensagem(
          resposta?.mensagem || `Cliente "${payload.nome}" atualizado com sucesso!`,
        );
      } else {
        const resposta = await CriarClienteExterno(payload);
        setMensagem(
          resposta?.mensagem || `Cliente "${payload.nome}" cadastrado com sucesso!`,
        );
      }

      if (typeof aoSalvarSucesso === "function") {
        aoSalvarSucesso();
      }
      aoFechar();
    } catch (error) {
      console.error("Erro ao salvar cliente externo:", error);
      setMensagem(error.message || "Erro ao salvar cliente externo");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={aoFechar}>
      <div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Cabeçalho */}
        <div className={styles.modalHeader}>
          <div className={styles.headerInfo}>
            <div
              className={`${styles.headerIconWrapper} ${
                modoEdicao ? styles.editar : styles.novo
              }`}
            >
              {modoEdicao ? (
                <PencilSimple size={22} weight="bold" />
              ) : (
                <Buildings size={22} weight="fill" />
              )}
            </div>
            <div>
              <p className={styles.subtitulo}>Clientes Externos / Vendas em Campo</p>
              <h2 className={styles.titulo}>
                {modoEdicao ? "Editar Cliente Externo" : "Novo Cliente Externo"}
                {modoEdicao && <span className={styles.badgeId}>#{cliente.id}</span>}
              </h2>
            </div>
          </div>

          <button
            type="button"
            className={styles.botaoFechar}
            onClick={aoFechar}
            title="Fechar (Esc)"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={tratarSubmeter} className={styles.formulario}>
          <div className={styles.modalCorpo}>
            {/* Aviso de Pendência (caso em edição com débitos) */}
            {modoEdicao && cliente?.temPendencia && (
              <div className={styles.alertaPendencia}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <WarningCircle size={20} weight="fill" color="#c92a2a" />
                  <span className={styles.alertaPendenciaTexto}>
                    Atenção: Este cliente possui pendências financeiras em aberto
                  </span>
                </div>
                <span className={styles.alertaPendenciaValor}>
                  {formatarMoeda(cliente.totalPendencia || 0)}
                </span>
              </div>
            )}

            {/* SEÇÃO 1: DADOS PRINCIPAIS */}
            <div className={styles.secaoFormulario}>
              <span className={styles.secaoTitulo}>
                <Buildings size={14} weight="bold" />
                Identificação Comercial
              </span>

              <div className={styles.gridCampos}>
                {/* Nome / Razão Social */}
                <div className={`${styles.campoGrupo} ${styles.col8}`}>
                  <label className={styles.rotulo}>
                    Nome / Razão Social <span className={styles.obrigatorio}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <User size={16} className={styles.inputIcone} />
                    <input
                      type="text"
                      className={`${styles.input} ${erros.nome ? styles.inputErro : ""}`}
                      placeholder="Ex: BAR E RESTAURANTE CENTRAL"
                      value={nome}
                      onChange={(e) => {
                        setNome(e.target.value.toUpperCase());
                        if (erros.nome) setErros((ant) => ({ ...ant, nome: null }));
                      }}
                      autoFocus
                    />
                  </div>
                  {erros.nome && (
                    <span className={styles.mensagemErro}>{erros.nome}</span>
                  )}
                </div>

                {/* CNPJ / CPF */}
                <div className={`${styles.campoGrupo} ${styles.col4}`}>
                  <label className={styles.rotulo}>CNPJ ou CPF</label>
                  <div className={styles.inputWrapper}>
                    <IdentificationCard size={16} className={styles.inputIcone} />
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="00.000.000/0000-00"
                      value={cnpj}
                      onChange={(e) =>
                        setCnpj(formatarDocumentoInput(e.target.value))
                      }
                    />
                  </div>
                </div>

                {/* Telefone / WhatsApp */}
                <div className={`${styles.campoGrupo} ${styles.col4}`}>
                  <label className={styles.rotulo}>Telefone / WhatsApp</label>
                  <div className={styles.inputWrapper}>
                    <Phone size={16} className={styles.inputIcone} />
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="(47) 99999-9999"
                      value={telefone}
                      onChange={(e) =>
                        setTelefone(formatarTelefoneInput(e.target.value))
                      }
                    />
                  </div>
                </div>

                {/* Cidade */}
                <div className={`${styles.campoGrupo} ${styles.col4}`}>
                  <label className={styles.rotulo}>Cidade</label>
                  <div className={styles.inputWrapper}>
                    <MapPin size={16} className={styles.inputIcone} />
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Ex: CANOINHAS"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                {/* Status Ativo/Inativo */}
                <div className={`${styles.campoGrupo} ${styles.col4}`}>
                  <label className={styles.rotulo}>Status do Cadastro</label>
                  <div className={styles.switchStatusWrapper}>
                    <button
                      type="button"
                      className={`${styles.btnStatusPill} ${
                        status === "ativo" ? styles.ativoSelected : ""
                      }`}
                      onClick={() => setStatus("ativo")}
                    >
                      <CheckCircle size={15} weight="fill" />
                      Ativo
                    </button>
                    <button
                      type="button"
                      className={`${styles.btnStatusPill} ${
                        status === "inativo" ? styles.inativoSelected : ""
                      }`}
                      onClick={() => setStatus("inativo")}
                    >
                      <XCircle size={15} weight="fill" />
                      Inativo
                    </button>
                  </div>
                </div>

                {/* Endereço Completo */}
                <div className={`${styles.campoGrupo} ${styles.col12}`}>
                  <label className={styles.rotulo}>Endereço Completo (Rua, Número, Bairro)</label>
                  <div className={styles.inputWrapper}>
                    <MapPin size={16} className={styles.inputIcone} />
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Ex: RUA MATIAS DE ALMEIDA, 450 - CENTRO"
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: LOGÍSTICA & ROTA */}
            <div className={styles.secaoFormulario}>
              <span className={styles.secaoTitulo}>
                <Calendar size={14} weight="bold" />
                Atendimento da Rota & Vendedor
              </span>

              <div className={styles.gridCampos}>
                {/* Vendedor Responsável */}
                <div className={`${styles.campoGrupo} ${styles.col6}`}>
                  <label className={styles.rotulo}>Vendedor Responsável</label>
                  <div className={styles.inputWrapper}>
                    <User size={16} className={styles.inputIcone} />
                    <input
                      type="text"
                      list="lista-vendedores-externo"
                      className={styles.input}
                      placeholder="Ex: EMERSON"
                      value={vendedor}
                      onChange={(e) => setVendedor(e.target.value.toUpperCase())}
                    />
                    <datalist id="lista-vendedores-externo">
                      {vendedoresSugestoes.map((v, i) => (
                        <option key={i} value={v} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Dia de Atendimento */}
                <div className={`${styles.campoGrupo} ${styles.col3}`}>
                  <label className={styles.rotulo}>Dia de Atendimento</label>
                  <select
                    className={`${styles.select} ${styles.inputSemIcone}`}
                    value={atendimento}
                    onChange={(e) => setAtendimento(e.target.value)}
                  >
                    {DIAS_ATENDIMENTO.map((dia) => (
                      <option key={dia} value={dia}>
                        {dia}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Frequência */}
                <div className={`${styles.campoGrupo} ${styles.col3}`}>
                  <label className={styles.rotulo}>Frequência</label>
                  <select
                    className={`${styles.select} ${styles.inputSemIcone}`}
                    value={frequencia}
                    onChange={(e) => setFrequencia(e.target.value)}
                  >
                    {FREQUENCIAS.map((freq) => (
                      <option key={freq} value={freq}>
                        {freq}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé com Ações */}
          <div className={styles.modalRodape}>
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
                <span>Salvando...</span>
              ) : (
                <>
                  <FloppyDisk size={18} weight="bold" />
                  <span>{modoEdicao ? "Atualizar Cliente" : "Cadastrar Cliente"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


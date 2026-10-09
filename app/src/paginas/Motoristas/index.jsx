import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import {
  IdentificationCard,
  ArrowLeft,
  PlusCircle,
  MagnifyingGlass,
  CheckCircle,
  XCircle,
  PencilSimple,
  FloppyDisk,
  X,
  Phone,
  User,
  ListChecks,
} from "@phosphor-icons/react";
import { lerMotoristas } from "../../operadores/API/motorista/lerMotoristas";
import { criarMotorista } from "../../operadores/API/motorista/criarMotorista";
import { atualizarMotorista } from "../../operadores/API/motorista/atualizarMotorista";
import { usarToast } from "../../componentes/Context/toastContext";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";
import { AlertaRadix } from "../../componentes/ui/alerta/alerta";
import Spinner from "../../componentes/Spinner";

export default function Motoristas() {
  const navegar = useNavigate();
  const { mensagem, setMensagem } = usarToast();

  // Estados de navegação interna
  const [render, setRender] = useState("lista"); // 'lista' | 'cadastro' | 'editar'
  const [motoristas, setMotoristas] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("todos"); // 'todos' | 'ativos' | 'inativos'
  const [buscaTexto, setBuscaTexto] = useState("");

  // Estado para Edição
  const [motoristaSelecionado, setMotoristaSelecionado] = useState(null);

  // Estados de Formulário
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [statusAtivo, setStatusAtivo] = useState(true);
  const [validaDados, setValidaDados] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Buscar motoristas
  const carregarMotoristas = async () => {
    setCarregando(true);
    try {
      let params = {};
      if (filtroStatus === "ativos") params.status = true;
      if (filtroStatus === "inativos") params.status = false;

      const resultado = await lerMotoristas(params);
      setMotoristas(Array.isArray(resultado) ? resultado : []);
    } catch (error) {
      setMotoristas([]);
      setMensagem(error.message || "Erro ao carregar motoristas");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarMotoristas();
  }, [filtroStatus]);

  // Limpar campos de formulário
  const limparFormulario = () => {
    setNome("");
    setCpf("");
    setTelefone("");
    setStatusAtivo(true);
    setValidaDados(false);
    setMotoristaSelecionado(null);
  };

  // Abrir edição
  const iniciarEdicao = (motorista) => {
    setMotoristaSelecionado(motorista);
    setNome(motorista.nome || "");
    setCpf(motorista.cpf || "");
    setTelefone(motorista.telefone || "");
    setStatusAtivo(motorista.status !== false);
    setRender("editar");
  };

  // Salvar novo motorista
  const tratarSalvarNovo = async () => {
    if (!nome.trim() || !cpf.trim()) {
      setValidaDados(true);
      return;
    }

    try {
      setSalvando(true);
      await criarMotorista({
        nome: nome.trim(),
        cpf: cpf.trim(),
        telefone: telefone.trim(),
      });
      setMensagem(`Motorista "${nome}" cadastrado com sucesso!`);
      limparFormulario();
      setRender("lista");
      carregarMotoristas();
    } catch (error) {
      setMensagem(error.message || "Erro ao salvar motorista");
    } finally {
      setSalvando(false);
    }
  };

  // Salvar edição
  const tratarSalvarEdicao = async () => {
    if (!motoristaSelecionado) return;

    try {
      setSalvando(true);
      await atualizarMotorista(motoristaSelecionado.id, {
        telefone: telefone.trim(),
        status: statusAtivo,
      });
      setMensagem(`Motorista "${motoristaSelecionado.nome}" atualizado com sucesso!`);
      limparFormulario();
      setRender("lista");
      carregarMotoristas();
    } catch (error) {
      setMensagem(error.message || "Erro ao atualizar motorista");
    } finally {
      setSalvando(false);
    }
  };

  // Voltar
  const tratarVoltar = () => {
    if (render === "lista") {
      navegar("/gestao");
    } else {
      limparFormulario();
      setRender("lista");
    }
  };

  // Filtragem local por texto
  const motoristasFiltrados = motoristas.filter((m) => {
    const termo = buscaTexto.toLowerCase();
    const nomeMatch = m.nome?.toLowerCase().includes(termo);
    const cpfMatch = m.cpf?.toLowerCase().includes(termo);
    const telMatch = m.telefone?.toLowerCase().includes(termo);
    return nomeMatch || cpfMatch || telMatch;
  });

  return (
    <div className={styles.container}>
      <ToastRadix mensagem={mensagem} />
      <Cabecalho />

      <main className={styles.principal}>
        {/* CABEÇALHO */}
        <div className={styles.tituloSection}>
          <div className={styles.containerTitulo}>
            <div className={styles.iconeWrapper}>
              <IdentificationCard size={24} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Gestão de Frotas</p>
              <h1 className={styles.pageTitulo}>
                {render === "lista"
                  ? "Motoristas"
                  : render === "cadastro"
                  ? "Novo Motorista"
                  : "Editar Motorista"}
              </h1>
            </div>
          </div>

          <button className={styles.botaoVoltar} onClick={tratarVoltar}>
            <ArrowLeft size={14} weight="bold" />
            Voltar
          </button>
        </div>

        {/* MODO LISTA */}
        {render === "lista" && (
          <div className={styles.conteudoWrapper}>
            {/* BARRA DE AÇÕES E FILTROS */}
            <div className={styles.cabecalhoPage}>
              <div className={styles.filtrosEsquerda}>
                <div className={styles.buscaContainer}>
                  <MagnifyingGlass size={16} className={styles.buscaIcone} />
                  <input
                    type="text"
                    placeholder="Buscar por nome, CPF ou telefone..."
                    value={buscaTexto}
                    onChange={(e) => setBuscaTexto(e.target.value)}
                    className={styles.buscaInput}
                  />
                </div>

                <div className={styles.filtroStatusContainer}>
                  <button
                    className={`${styles.filtroBtn} ${
                      filtroStatus === "todos" ? styles.filtroBtnAtivo : ""
                    }`}
                    onClick={() => setFiltroStatus("todos")}
                  >
                    Todos
                  </button>
                  <button
                    className={`${styles.filtroBtn} ${
                      filtroStatus === "ativos" ? styles.filtroBtnAtivo : ""
                    }`}
                    onClick={() => setFiltroStatus("ativos")}
                  >
                    Ativos
                  </button>
                  <button
                    className={`${styles.filtroBtn} ${
                      filtroStatus === "inativos" ? styles.filtroBtnAtivo : ""
                    }`}
                    onClick={() => setFiltroStatus("inativos")}
                  >
                    Inativos
                  </button>
                </div>
              </div>

              <button
                className={styles.botaoNovo}
                onClick={() => {
                  limparFormulario();
                  setRender("cadastro");
                }}
              >
                <PlusCircle size={18} weight="bold" />
                Novo Motorista
              </button>
            </div>

            {/* TABELA DE MOTORISTAS */}
            <div className={styles.card}>
              {carregando ? (
                <div className={styles.estadoVazio}>
                  <Spinner />
                  <p>Carregando motoristas...</p>
                </div>
              ) : motoristasFiltrados.length === 0 ? (
                <div className={styles.estadoVazio}>
                  <IdentificationCard size={48} weight="duotone" className={styles.iconeVazio} />
                  <p>Nenhum motorista encontrado</p>
                </div>
              ) : (
                <div className={styles.tabelaWrapper}>
                  <div className={`${styles.tituloLista} ${styles.gridMotoristas}`}>
                    <span>ID</span>
                    <span>Nome</span>
                    <span>CPF</span>
                    <span>Telefone</span>
                    <span>Status</span>
                    <span style={{ textAlign: "center" }}>Ação</span>
                  </div>

                  <div className={styles.lista}>
                    {motoristasFiltrados.map((m) => (
                      <div
                        key={m.id}
                        className={`${styles.itemRow} ${styles.gridMotoristas}`}
                        onClick={() => iniciarEdicao(m)}
                      >
                        <span className={styles.idCell}>#{m.id}</span>
                        <span className={styles.nomeCell}>{m.nome}</span>
                        <span>{m.cpf || "-"}</span>
                        <span>{m.telefone || "-"}</span>
                        <span>
                          <span
                            className={`${styles.badgeStatus} ${
                              m.status !== false ? styles.badgeAtivo : styles.badgeInativo
                            }`}
                          >
                            {m.status !== false ? "Ativo" : "Inativo"}
                          </span>
                        </span>
                        <span style={{ textAlign: "center" }}>
                          <button
                            className={styles.botaoAcaoTabela}
                            onClick={(e) => {
                              e.stopPropagation();
                              iniciarEdicao(m);
                            }}
                            title="Editar motorista"
                          >
                            <PencilSimple size={16} weight="bold" />
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODO CADASTRO */}
        {render === "cadastro" && (
          <div className={styles.formContainer}>
            <div className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <ListChecks size={18} weight="fill" className={styles.formHeaderIcon} />
                <h2>Dados do novo motorista</h2>
              </div>

              {salvando ? (
                <div className={styles.estadoVazio}>
                  <Spinner />
                  <p>Salvando motorista, aguarde...</p>
                </div>
              ) : (
                <>
                  <div className={styles.containerInputs}>
                    {/* NOME */}
                    <div className={styles.divInput}>
                      <label
                        className={`${styles.filtroLabel} ${
                          !nome && validaDados ? styles.filtroLabelErro : ""
                        }`}
                      >
                        <User size={14} />
                        Nome completo {!nome && validaDados && "*"}
                      </label>
                      <input
                        className={styles.input}
                        type="text"
                        placeholder="Ex: Carlos Silva"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                      />
                    </div>

                    {/* CPF */}
                    <div className={styles.divInput}>
                      <label
                        className={`${styles.filtroLabel} ${
                          !cpf && validaDados ? styles.filtroLabelErro : ""
                        }`}
                      >
                        <IdentificationCard size={14} />
                        CPF (apenas números ou formatado) {!cpf && validaDados && "*"}
                      </label>
                      <input
                        className={styles.input}
                        type="text"
                        placeholder="000.000.000-00"
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value)}
                      />
                    </div>

                    {/* TELEFONE */}
                    <div className={styles.divInput}>
                      <label className={styles.filtroLabel}>
                        <Phone size={14} />
                        Telefone / WhatsApp
                      </label>
                      <input
                        className={styles.input}
                        type="text"
                        placeholder="(00) 00000-0000"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.acoesForm}>
                    <button
                      className={styles.botaoCancelar}
                      type="button"
                      onClick={() => {
                        limparFormulario();
                        setRender("lista");
                      }}
                    >
                      <X size={15} weight="bold" />
                      Cancelar
                    </button>

                    <AlertaRadix
                      titulo="Cadastrar Motorista"
                      descricao={`Deseja confirmar o cadastro de "${nome || "novo motorista"}"?`}
                      tratar={tratarSalvarNovo}
                      confirmarTexto="Cadastrar"
                      cancelarTexto="Voltar"
                      trigger={
                        <button className={styles.botaoSalvar} type="button">
                          <FloppyDisk size={16} weight="fill" />
                          Salvar Motorista
                        </button>
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* MODO EDITAR */}
        {render === "editar" && motoristaSelecionado && (
          <div className={styles.formContainer}>
            <div className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <PencilSimple size={18} weight="fill" className={styles.formHeaderIcon} />
                <h2>Editar motorista: {motoristaSelecionado.nome}</h2>
              </div>

              {salvando ? (
                <div className={styles.estadoVazio}>
                  <Spinner />
                  <p>Atualizando motorista, aguarde...</p>
                </div>
              ) : (
                <>
                  <div className={styles.containerInputs}>
                    {/* NOME (Bloqueado) */}
                    <div className={styles.divInput}>
                      <label className={styles.filtroLabel}>
                        <User size={14} />
                        Nome (fixo)
                      </label>
                      <input
                        className={`${styles.input} ${styles.inputBloqueado}`}
                        type="text"
                        value={motoristaSelecionado.nome}
                        disabled
                      />
                    </div>

                    {/* CPF (Bloqueado) */}
                    <div className={styles.divInput}>
                      <label className={styles.filtroLabel}>
                        <IdentificationCard size={14} />
                        CPF (fixo)
                      </label>
                      <input
                        className={`${styles.input} ${styles.inputBloqueado}`}
                        type="text"
                        value={motoristaSelecionado.cpf || "-"}
                        disabled
                      />
                    </div>

                    {/* TELEFONE */}
                    <div className={styles.divInput}>
                      <label className={styles.filtroLabel}>
                        <Phone size={14} />
                        Telefone / WhatsApp
                      </label>
                      <input
                        className={styles.input}
                        type="text"
                        placeholder="(00) 00000-0000"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                      />
                    </div>

                    {/* STATUS */}
                    <div className={styles.divInput}>
                      <label className={styles.filtroLabel}>Status do Motorista</label>
                      <div className={styles.statusToggleContainer}>
                        <button
                          type="button"
                          className={`${styles.statusToggleBtn} ${
                            statusAtivo ? styles.statusAtivoBtn : ""
                          }`}
                          onClick={() => setStatusAtivo(true)}
                        >
                          <CheckCircle size={16} weight="bold" />
                          Ativo
                        </button>
                        <button
                          type="button"
                          className={`${styles.statusToggleBtn} ${
                            !statusAtivo ? styles.statusInativoBtn : ""
                          }`}
                          onClick={() => setStatusAtivo(false)}
                        >
                          <XCircle size={16} weight="bold" />
                          Inativo
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={styles.acoesForm}>
                    <button
                      className={styles.botaoCancelar}
                      type="button"
                      onClick={() => {
                        limparFormulario();
                        setRender("lista");
                      }}
                    >
                      <X size={15} weight="bold" />
                      Cancelar
                    </button>

                    <AlertaRadix
                      titulo="Atualizar Motorista"
                      descricao={`Deseja confirmar a alteração nos dados do motorista "${motoristaSelecionado.nome}"?`}
                      tratar={tratarSalvarEdicao}
                      confirmarTexto="Salvar Alterações"
                      cancelarTexto="Voltar"
                      trigger={
                        <button className={styles.botaoSalvar} type="button">
                          <FloppyDisk size={16} weight="fill" />
                          Atualizar Motorista
                        </button>
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      <Rodape />
    </div>
  );
}

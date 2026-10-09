import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import {
  Truck,
  ArrowLeft,
  PlusCircle,
  MagnifyingGlass,
  CheckCircle,
  XCircle,
  PencilSimple,
  FloppyDisk,
  X,
  ListChecks,
  Scales,
  CarProfile,
  Tag,
  NavigationArrow,
} from "@phosphor-icons/react";
import { lerVeiculos } from "../../operadores/API/veiculo/lerVeiculos";
import { criarVeiculo } from "../../operadores/API/veiculo/criarVeiculo";
import { atualizarVeiculo } from "../../operadores/API/veiculo/atualizarVeiculo";
import { usarToast } from "../../componentes/Context/toastContext";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";
import { AlertaRadix } from "../../componentes/ui/alerta/alerta";
import Spinner from "../../componentes/Spinner";

export default function Veiculos() {
  const navegar = useNavigate();
  const { mensagem, setMensagem } = usarToast();

  // Estados de navegação interna
  const [render, setRender] = useState("lista"); // 'lista' | 'cadastro' | 'editar'
  const [veiculos, setVeiculos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("todos"); // 'todos' | 'ativos' | 'inativos' | 'emRota' | 'disponiveis'
  const [buscaTexto, setBuscaTexto] = useState("");

  // Estado para Edição
  const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);

  // Estados de Formulário
  const [nome, setNome] = useState("");
  const [modelo, setModelo] = useState("");
  const [marca, setMarca] = useState("");
  const [placa, setPlaca] = useState("");
  const [pesoMaximo, setPesoMaximo] = useState("");
  const [statusAtivo, setStatusAtivo] = useState(true);
  const [emRota, setEmRota] = useState(false);
  const [validaDados, setValidaDados] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Buscar veículos
  const carregarVeiculos = async () => {
    setCarregando(true);
    try {
      let params = {};
      if (filtroStatus === "ativos") params.status = true;
      if (filtroStatus === "inativos") params.status = false;
      if (filtroStatus === "emRota") params.emRota = true;
      if (filtroStatus === "disponiveis") {
        params.status = true;
        params.emRota = false;
      }

      const resultado = await lerVeiculos(params);
      setVeiculos(Array.isArray(resultado) ? resultado : []);
    } catch (error) {
      setVeiculos([]);
      setMensagem(error.message || "Erro ao carregar veículos");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarVeiculos();
  }, [filtroStatus]);

  // Limpar formulário
  const limparFormulario = () => {
    setNome("");
    setModelo("");
    setMarca("");
    setPlaca("");
    setPesoMaximo("");
    setStatusAtivo(true);
    setEmRota(false);
    setValidaDados(false);
    setVeiculoSelecionado(null);
  };

  // Iniciar edição
  const iniciarEdicao = (veiculo) => {
    setVeiculoSelecionado(veiculo);
    setNome(veiculo.nome || "");
    setModelo(veiculo.modelo || "");
    setMarca(veiculo.marca || "");
    setPlaca(veiculo.placa || "");
    setPesoMaximo(veiculo.pesoMaximo?.toString() || "");
    setStatusAtivo(veiculo.status !== false);
    setEmRota(veiculo.emRota === true);
    setRender("editar");
  };

  // Salvar novo veículo
  const tratarSalvarNovo = async () => {
    if (!nome.trim() || !placa.trim() || !pesoMaximo) {
      setValidaDados(true);
      return;
    }

    try {
      setSalvando(true);
      await criarVeiculo({
        nome: nome.trim(),
        modelo: modelo.trim(),
        marca: marca.trim(),
        placa: placa.trim().toUpperCase(),
        pesoMaximo: Number(pesoMaximo),
      });
      setMensagem(`Veículo "${nome}" (${placa.toUpperCase()}) cadastrado com sucesso!`);
      limparFormulario();
      setRender("lista");
      carregarVeiculos();
    } catch (error) {
      setMensagem(error.message || "Erro ao salvar veículo");
    } finally {
      setSalvando(false);
    }
  };

  // Salvar edição
  const tratarSalvarEdicao = async () => {
    if (!veiculoSelecionado) return;

    try {
      setSalvando(true);
      await atualizarVeiculo(veiculoSelecionado.id, {
        nome: nome.trim(),
        modelo: modelo.trim(),
        marca: marca.trim(),
        pesoMaximo: Number(pesoMaximo),
        status: statusAtivo,
        emRota: emRota,
      });
      setMensagem(`Veículo "${nome}" atualizado com sucesso!`);
      limparFormulario();
      setRender("lista");
      carregarVeiculos();
    } catch (error) {
      setMensagem(error.message || "Erro ao atualizar veículo");
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
  const veiculosFiltrados = veiculos.filter((v) => {
    const termo = buscaTexto.toLowerCase();
    const nomeMatch = v.nome?.toLowerCase().includes(termo);
    const modeloMatch = v.modelo?.toLowerCase().includes(termo);
    const marcaMatch = v.marca?.toLowerCase().includes(termo);
    const placaMatch = v.placa?.toLowerCase().includes(termo);
    return nomeMatch || modeloMatch || marcaMatch || placaMatch;
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
              <Truck size={24} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Gestão de Frotas</p>
              <h1 className={styles.pageTitulo}>
                {render === "lista"
                  ? "Frota de Veículos"
                  : render === "cadastro"
                  ? "Novo Veículo"
                  : "Editar Veículo"}
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
                    placeholder="Buscar por placa, nome, modelo ou marca..."
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
                      filtroStatus === "disponiveis" ? styles.filtroBtnAtivo : ""
                    }`}
                    onClick={() => setFiltroStatus("disponiveis")}
                  >
                    Disponíveis
                  </button>
                  <button
                    className={`${styles.filtroBtn} ${
                      filtroStatus === "emRota" ? styles.filtroBtnAtivo : ""
                    }`}
                    onClick={() => setFiltroStatus("emRota")}
                  >
                    Em Rota
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
                Novo Veículo
              </button>
            </div>

            {/* TABELA DE VEÍCULOS */}
            <div className={styles.card}>
              {carregando ? (
                <div className={styles.estadoVazio}>
                  <Spinner />
                  <p>Carregando veículos...</p>
                </div>
              ) : veiculosFiltrados.length === 0 ? (
                <div className={styles.estadoVazio}>
                  <Truck size={48} weight="duotone" className={styles.iconeVazio} />
                  <p>Nenhum veículo encontrado</p>
                </div>
              ) : (
                <div className={styles.tabelaWrapper}>
                  <div className={`${styles.tituloLista} ${styles.gridVeiculos}`}>
                    <span>ID</span>
                    <span>Identificação / Nome</span>
                    <span>Placa</span>
                    <span>Marca / Modelo</span>
                    <span>Capacidade (Kg)</span>
                    <span>Disponibilidade</span>
                    <span>Status</span>
                    <span style={{ textAlign: "center" }}>Ação</span>
                  </div>

                  <div className={styles.lista}>
                    {veiculosFiltrados.map((v) => (
                      <div
                        key={v.id}
                        className={`${styles.itemRow} ${styles.gridVeiculos}`}
                        onClick={() => iniciarEdicao(v)}
                      >
                        <span className={styles.idCell}>#{v.id}</span>
                        <span className={styles.nomeCell}>{v.nome || "-"}</span>
                        <span className={styles.placaBadge}>{v.placa || "-"}</span>
                        <span>{v.marca ? `${v.marca} ${v.modelo || ""}` : v.modelo || "-"}</span>
                        <span className={styles.pesoCell}>
                          {v.pesoMaximo ? `${Number(v.pesoMaximo).toLocaleString("pt-BR")} kg` : "-"}
                        </span>
                        <span>
                          <span
                            className={`${styles.badgeRota} ${
                              v.emRota ? styles.badgeEmRota : styles.badgeDisponivel
                            }`}
                          >
                            {v.emRota ? "Em Rota" : "Disponível"}
                          </span>
                        </span>
                        <span>
                          <span
                            className={`${styles.badgeStatus} ${
                              v.status !== false ? styles.badgeAtivo : styles.badgeInativo
                            }`}
                          >
                            {v.status !== false ? "Ativo" : "Inativo"}
                          </span>
                        </span>
                        <span style={{ textAlign: "center" }}>
                          <button
                            className={styles.botaoAcaoTabela}
                            onClick={(e) => {
                              e.stopPropagation();
                              iniciarEdicao(v);
                            }}
                            title="Editar veículo"
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
                <h2>Dados do novo veículo</h2>
              </div>

              {salvando ? (
                <div className={styles.estadoVazio}>
                  <Spinner />
                  <p>Salvando veículo, aguarde...</p>
                </div>
              ) : (
                <>
                  <div className={styles.containerInputs}>
                    {/* NOME / IDENTIFICAÇÃO */}
                    <div className={styles.divInput}>
                      <label
                        className={`${styles.filtroLabel} ${
                          !nome && validaDados ? styles.filtroLabelErro : ""
                        }`}
                      >
                        <CarProfile size={14} />
                        Nome / Identificação {!nome && validaDados && "*"}
                      </label>
                      <input
                        className={styles.input}
                        type="text"
                        placeholder="Ex: Caminhão Baú 01 / Fiorino"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                      />
                    </div>

                    {/* PLACA */}
                    <div className={styles.divInput}>
                      <label
                        className={`${styles.filtroLabel} ${
                          !placa && validaDados ? styles.filtroLabelErro : ""
                        }`}
                      >
                        <Tag size={14} />
                        Placa (única) {!placa && validaDados && "*"}
                      </label>
                      <input
                        className={styles.input}
                        type="text"
                        placeholder="Ex: ABC1D23"
                        value={placa}
                        onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                      />
                    </div>

                    {/* MARCA */}
                    <div className={styles.divInput}>
                      <label className={styles.filtroLabel}>Marca</label>
                      <input
                        className={styles.input}
                        type="text"
                        placeholder="Ex: Mercedes-Benz, Fiat, VW"
                        value={marca}
                        onChange={(e) => setMarca(e.target.value)}
                      />
                    </div>

                    {/* MODELO */}
                    <div className={styles.divInput}>
                      <label className={styles.filtroLabel}>Modelo</label>
                      <input
                        className={styles.input}
                        type="text"
                        placeholder="Ex: Accelo 1016, Ducato"
                        value={modelo}
                        onChange={(e) => setModelo(e.target.value)}
                      />
                    </div>

                    {/* PESO MÁXIMO */}
                    <div className={styles.divInput}>
                      <label
                        className={`${styles.filtroLabel} ${
                          !pesoMaximo && validaDados ? styles.filtroLabelErro : ""
                        }`}
                      >
                        <Scales size={14} />
                        Capacidade Máxima / Peso (Kg) {!pesoMaximo && validaDados && "*"}
                      </label>
                      <input
                        className={styles.input}
                        type="number"
                        placeholder="Ex: 5000"
                        value={pesoMaximo}
                        onChange={(e) => setPesoMaximo(e.target.value)}
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
                      titulo="Cadastrar Veículo"
                      descricao={`Deseja confirmar o cadastro do veículo "${nome || "novo veículo"}"?`}
                      tratar={tratarSalvarNovo}
                      confirmarTexto="Cadastrar"
                      cancelarTexto="Voltar"
                      trigger={
                        <button className={styles.botaoSalvar} type="button">
                          <FloppyDisk size={16} weight="fill" />
                          Salvar Veículo
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
        {render === "editar" && veiculoSelecionado && (
          <div className={styles.formContainer}>
            <div className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <PencilSimple size={18} weight="fill" className={styles.formHeaderIcon} />
                <h2>Editar veículo: {veiculoSelecionado.nome} ({veiculoSelecionado.placa})</h2>
              </div>

              {salvando ? (
                <div className={styles.estadoVazio}>
                  <Spinner />
                  <p>Atualizando veículo, aguarde...</p>
                </div>
              ) : (
                <>
                  <div className={styles.containerInputs}>
                    {/* NOME */}
                    <div className={styles.divInput}>
                      <label className={styles.filtroLabel}>
                        <CarProfile size={14} />
                        Nome / Identificação
                      </label>
                      <input
                        className={styles.input}
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                      />
                    </div>

                    {/* PLACA (Fixo) */}
                    <div className={styles.divInput}>
                      <label className={styles.filtroLabel}>
                        <Tag size={14} />
                        Placa (fixo)
                      </label>
                      <input
                        className={`${styles.input} ${styles.inputBloqueado}`}
                        type="text"
                        value={veiculoSelecionado.placa}
                        disabled
                      />
                    </div>

                    {/* MARCA */}
                    <div className={styles.divInput}>
                      <label className={styles.filtroLabel}>Marca</label>
                      <input
                        className={styles.input}
                        type="text"
                        value={marca}
                        onChange={(e) => setMarca(e.target.value)}
                      />
                    </div>

                    {/* MODELO */}
                    <div className={styles.divInput}>
                      <label className={styles.filtroLabel}>Modelo</label>
                      <input
                        className={styles.input}
                        type="text"
                        value={modelo}
                        onChange={(e) => setModelo(e.target.value)}
                      />
                    </div>

                    {/* PESO MÁXIMO */}
                    <div className={styles.divInput}>
                      <label className={styles.filtroLabel}>
                        <Scales size={14} />
                        Capacidade Máxima (Kg)
                      </label>
                      <input
                        className={styles.input}
                        type="number"
                        value={pesoMaximo}
                        onChange={(e) => setPesoMaximo(e.target.value)}
                      />
                    </div>

                    {/* STATUS DE ATIVO */}
                    <div className={styles.divInput}>
                      <label className={styles.filtroLabel}>Status do Veículo</label>
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

                    {/* STATUS DE ROTA */}
                    <div className={styles.divInput}>
                      <label className={styles.filtroLabel}>Disponibilidade de Rota</label>
                      <div className={styles.statusToggleContainer}>
                        <button
                          type="button"
                          className={`${styles.statusToggleBtn} ${
                            !emRota ? styles.statusDisponivelBtn : ""
                          }`}
                          onClick={() => setEmRota(false)}
                        >
                          <CheckCircle size={16} weight="bold" />
                          Disponível
                        </button>
                        <button
                          type="button"
                          className={`${styles.statusToggleBtn} ${
                            emRota ? styles.statusEmRotaBtn : ""
                          }`}
                          onClick={() => setEmRota(true)}
                        >
                          <NavigationArrow size={16} weight="bold" />
                          Em Rota
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
                      titulo="Atualizar Veículo"
                      descricao={`Deseja confirmar a alteração no veículo "${nome}"?`}
                      tratar={tratarSalvarEdicao}
                      confirmarTexto="Salvar Alterações"
                      cancelarTexto="Voltar"
                      trigger={
                        <button className={styles.botaoSalvar} type="button">
                          <FloppyDisk size={16} weight="fill" />
                          Atualizar Veículo
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

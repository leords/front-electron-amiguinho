import { useEffect, useState, useMemo, useCallback } from "react";
import styles from "./styles.module.css";
import {
  MagnifyingGlass,
  PlusCircle,
  PencilSimple,
  ArrowClockwise,
  CheckCircle,
  XCircle,
  CreditCard,
  EyeSlash,
  Eye,
} from "@phosphor-icons/react";
import { lerFormasPagamento } from "../../operadores/API/formaPagamento/lerFormasPagamento";
import { statusFormaPagamento } from "../../operadores/API/formaPagamento/statusFormaPagamento";
import { AlertaRadix } from "../ui/alerta/alerta";
import { usarToast } from "../Context/toastContext";
import ModalFormaPagamento from "../ModalFormaPagamento";

export default function ListaFormasPagamento() {
  const { setMensagem } = usarToast();

  // Estados de dados e carregamento
  const [formas, setFormas] = useState([]);
  const [carregando, setCarregando] = useState(false);

  // Estados de filtros
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("ATIVO"); // 'ATIVO' | 'INATIVO' | 'TODOS'
  const [filtroTipo, setFiltroTipo] = useState("");

  // Estados do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [formaEmEdicao, setFormaEmEdicao] = useState(null);

  // Busca formas de pagamento na API
  const carregarFormas = useCallback(async () => {
    setCarregando(true);
    try {
      const parametros = {};
      if (filtroStatus) parametros.status = filtroStatus;
      if (filtroTipo) parametros.tipo = filtroTipo;

      const dados = await lerFormasPagamento(parametros);
      setFormas(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error("Erro ao carregar formas de pagamento:", error);
      setFormas([]);
      setMensagem(
        error.message || "Erro ao consultar a lista de formas de pagamento",
      );
    } finally {
      setCarregando(false);
    }
  }, [filtroStatus, filtroTipo, setMensagem]);

  // Carrega ao montar ou mudar filtros de status/tipo
  useEffect(() => {
    carregarFormas();
  }, [carregarFormas]);

  // Tipos únicos para o dropdown
  const listaTipos = useMemo(() => {
    const set = new Set();
    formas.forEach((f) => {
      if (f.tipo && String(f.tipo).trim()) {
        set.add(String(f.tipo).trim().toUpperCase());
      }
    });
    return Array.from(set).sort();
  }, [formas]);

  // Filtro de busca textual por nome
  const formasFiltradas = useMemo(() => {
    if (!Array.isArray(formas)) return [];

    if (!busca.trim()) return formas;

    const termo = busca.trim().toLowerCase();
    return formas.filter((f) => {
      const nome = String(f.nome || "").toLowerCase();
      const tipo = String(f.tipo || "").toLowerCase();
      const id = String(f.id || "");
      return nome.includes(termo) || tipo.includes(termo) || id.includes(termo);
    });
  }, [formas, busca]);

  // Contadores
  const contadores = useMemo(() => {
    const total = formas.length;
    const ativas = formas.filter(
      (f) => String(f.status).toUpperCase() === "ATIVO",
    ).length;
    const inativas = formas.filter(
      (f) => String(f.status).toUpperCase() === "INATIVO",
    ).length;
    return { total, ativas, inativas };
  }, [formas]);

  // Alternar status (Soft Delete)
  const tratarAlternarStatus = async (forma) => {
    const novoStatus =
      String(forma.status).toUpperCase() === "ATIVO" ? "INATIVO" : "ATIVO";

    try {
      const resposta = await statusFormaPagamento(forma.id, novoStatus);
      setMensagem(
        resposta?.mensagem ||
          `Status da forma "${forma.nome}" alterado para ${novoStatus} com sucesso!`,
      );
      await carregarFormas();
    } catch (error) {
      console.error("Erro ao alternar status da forma:", error);
      setMensagem(error.message || "Erro ao alternar status");
    }
  };

  // Abrir modal para novo
  const abrirModalNovo = () => {
    setFormaEmEdicao(null);
    setModalAberto(true);
  };

  // Abrir modal para editar
  const abrirModalEditar = (forma) => {
    setFormaEmEdicao(forma);
    setModalAberto(true);
  };

  return (
    <div className={styles.container}>
      {/* BARRA SUPERIOR: BADGES E AÇÕES */}
      <div className={styles.barraSuperior}>
        <div className={styles.resumoBadges}>
          <span className={styles.badgeGeral}>
            <CreditCard size={15} weight="bold" />
            Total: {contadores.total}
          </span>
          <span className={styles.badgeAtivos}>
            <CheckCircle size={15} weight="bold" />
            Ativas: {contadores.ativas}
          </span>
          <span className={styles.badgeInativos}>
            <XCircle size={15} weight="bold" />
            Inativas: {contadores.inativas}
          </span>
        </div>

        <div className={styles.acoesSuperiores}>
          <button
            type="button"
            className={styles.botaoRecarregar}
            onClick={carregarFormas}
            disabled={carregando}
            title="Recarregar lista"
          >
            <ArrowClockwise
              size={15}
              weight="bold"
              className={carregando ? styles.spin : ""}
            />
            Atualizar
          </button>

          <button
            type="button"
            className={styles.botaoNovaForma}
            onClick={abrirModalNovo}
          >
            <PlusCircle size={17} weight="bold" />
            Nova Forma de Pagamento
          </button>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div className={styles.cardFiltros}>
        <div className={styles.buscaWrapper}>
          <MagnifyingGlass size={18} weight="bold" className={styles.iconeBusca} />
          <input
            type="text"
            className={styles.inputBusca}
            placeholder="Buscar por nome, ID ou tipo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {/* FILTRO DE STATUS */}
        <select
          className={styles.selectFiltro}
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
        >
          <option value="ATIVO">Status: Ativas</option>
          <option value="INATIVO">Status: Inativas</option>
          <option value="TODOS">Status: Todas</option>
        </select>

        {/* FILTRO DE TIPO */}
        <select
          className={styles.selectFiltro}
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
        >
          <option value="">Tipo: Todos</option>
          {listaTipos.map((tipo) => (
            <option key={tipo} value={tipo}>
              Tipo: {tipo}
            </option>
          ))}
        </select>
      </div>

      {/* TABELA DE FORMAS DE PAGAMENTO */}
      <div className={styles.tabelaContainer}>
        {carregando ? (
          <div className={styles.estadoCarregando}>
            <ArrowClockwise size={32} weight="bold" className={styles.spin} />
            <p>Carregando formas de pagamento...</p>
          </div>
        ) : formasFiltradas.length === 0 ? (
          <div className={styles.estadoVazio}>
            <CreditCard size={48} weight="duotone" />
            <p>Nenhuma forma de pagamento encontrada</p>
            <span>Tente alterar os filtros ou cadastre uma nova forma.</span>
          </div>
        ) : (
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th className={styles.colId}>ID</th>
                <th>Nome</th>
                <th>Tipo / Canal</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {formasFiltradas.map((forma) => {
                const ativo = String(forma.status).toUpperCase() === "ATIVO";
                return (
                  <tr key={forma.id}>
                    <td className={styles.colId}>#{forma.id}</td>
                    <td className={styles.nomeForma}>{forma.nome}</td>
                    <td>
                      <span className={styles.badgeTipo}>
                        {forma.tipo || "VENDAS"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          ativo ? styles.statusAtivo : styles.statusInativo
                        }
                      >
                        {ativo ? (
                          <>
                            <CheckCircle size={14} weight="fill" />
                            ATIVO
                          </>
                        ) : (
                          <>
                            <XCircle size={14} weight="fill" />
                            INATIVO
                          </>
                        )}
                      </span>
                    </td>
                    <td>
                      <div className={styles.acoesLinha}>
                        {/* EDITAR */}
                        <button
                          type="button"
                          className={styles.btnAcaoEditar}
                          onClick={() => abrirModalEditar(forma)}
                          title="Editar Forma de Pagamento"
                        >
                          <PencilSimple size={16} weight="bold" />
                        </button>

                        {/* ALTERNAR STATUS (SOFT DELETE) */}
                        <AlertaRadix
                          titulo={
                            ativo
                              ? "Inativar Forma de Pagamento"
                              : "Reativar Forma de Pagamento"
                          }
                          descricao={
                            ativo
                              ? `Deseja realmente inativar a forma "${forma.nome}"? Ela deixará de aparecer nos menus de venda imediatamente.`
                              : `Deseja reativar a forma "${forma.nome}"? Ela voltará a ficar disponível para seleção em vendas.`
                          }
                          confirmarTexto={
                            ativo ? "Sim, inativar" : "Sim, reativar"
                          }
                          cancelarTexto="Cancelar"
                          tratar={() => tratarAlternarStatus(forma)}
                          trigger={
                            <button
                              type="button"
                              className={
                                ativo
                                  ? styles.btnAcaoInativar
                                  : styles.btnAcaoReativar
                              }
                              title={ativo ? "Inativar" : "Reativar"}
                            >
                              {ativo ? (
                                <EyeSlash size={16} weight="bold" />
                              ) : (
                                <Eye size={16} weight="bold" />
                              )}
                            </button>
                          }
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      <ModalFormaPagamento
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        forma={formaEmEdicao}
        aoSalvarSucesso={carregarFormas}
      />
    </div>
  );
}

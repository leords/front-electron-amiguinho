import { useState, useEffect, useCallback } from "react";
import {
  Package,
  Plus,
  ArrowLeft,
  CircleNotch,
  MagnifyingGlass,
  Funnel,
  PencilSimple,
  CheckCircle,
  XCircle,
  ClockCountdown,
  Truck,
  Buildings,
  User,
  CalendarBlank,
  CurrencyCircleDollar,
  ListBullets,
  X,
  FloppyDisk,
  Trash,
  Warning,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import Select from "react-select";
import styles from "./styles.module.css";
import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import ListaOrdemCompra from "../../componentes/ListaOrdemCompra";
import NovaOrdemCompra from "../../componentes/NovaOrdemCompra";
import { EditarStatusOrdem } from "../../componentes/EditarStatusOrdem";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";
import { usarToast } from "../../componentes/Context/toastContext";




const mockFornecedores = [
  { id: 1, nome: "ACB AMBEV", cnpj: "12.345.678/0001-90", telefone: "(47) 3322-1100", email: "compras@acbambev.com.br" },
  { id: 2, nome: "Distribuidora Sul", cnpj: "98.765.432/0001-11", telefone: "(48) 3211-9900", email: "vendas@distrsul.com.br" },
  { id: 3, nome: "Bebidas Norte LTDA", cnpj: "11.222.333/0001-44", telefone: "(51) 3100-8800", email: "contato@bebidasnorte.com.br" },
];

// ─── Utilitários ─────────────────────────────────────────────────────────────

const STATUS_META = {
  Finalizada:    { cor: styles.badgeGreen,  icone: CheckCircle },
  Pendente:      { cor: styles.badgeOrange, icone: ClockCountdown },
  "Em andamento":{ cor: styles.badgeBlue,   icone: Truck },
  Cancelada:     { cor: styles.badgeRed,    icone: XCircle },
};

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function EstoquePage() {

  // Estados
  const [fornecedores, setFornecedores] = useState(mockFornecedores);

  //Hooks
    const { mensagem, setMensagem } = usarToast();

  // Modais / Abas
  const [view, setView] = useState("lista"); // "lista" | "novaOrdem" | "editarOrdem" | "fornecedores"
  const [ordemSelecionada, setOrdemSelecionada] = useState(null);


  // Form editar ordem
  const [editStatus, setEditStatus] = useState(null);

  // ── Fornecedores CRUD
  const [formFornecedorNovo, setFormFornecedorNovo] = useState({ nome: "", cnpj: "", telefone: "", email: "" });
  const [fornecedorEditando, setFornecedorEditando] = useState(null);
  const [modalDeleteFornecedor, setModalDeleteFornecedor] = useState(null);


  // ── Fornecedores ───────────────────────────────────────────────────────────

  const handleSalvarFornecedor = () => {
    if (!formFornecedorNovo.nome) return;
    if (fornecedorEditando) {
      setFornecedores((prev) =>
        prev.map((f) => (f.id === fornecedorEditando.id ? { ...fornecedorEditando, ...formFornecedorNovo } : f))
      );
      setFornecedorEditando(null);
    } else {
      setFornecedores((prev) => [...prev, { id: Date.now(), ...formFornecedorNovo }]);
    }
    setFormFornecedorNovo({ nome: "", cnpj: "", telefone: "", email: "" });
  };

  const handleEditarFornecedor = (f) => {
    setFornecedorEditando(f);
    setFormFornecedorNovo({ nome: f.nome, cnpj: f.cnpj, telefone: f.telefone, email: f.email });
  };

  const handleDeletarFornecedor = (id) => {
    setFornecedores((prev) => prev.filter((f) => f.id !== id));
    setModalDeleteFornecedor(null);
  };

 
  return (
    <div className={styles.container}>
      <ToastRadix mensagem={mensagem} />
      <Cabecalho />
      <main className={styles.principal}>

        {/* CABEÇALHO */}
        <div className={styles.cabecalhoPage}>
          <div className={styles.tituloSection}>
            <div className={styles.iconeWrapper}>
              <Package size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Controle de Estoque</p>
              <h1 className={styles.pageTitulo}>Ordens de Compra</h1>
            </div>
          </div>
          { /* BOTÕES */ }
          <div className={styles.cabecalhoAcoes}>
            <button className={styles.botaoSecundario} onClick={() => setView("fornecedores")}>
              <Buildings size={16} weight="bold" />
              Fornecedores
            </button>
            {view !== 'novaOrdem' && 
            <button className={styles.botaoPrincipal} onClick={() => { setView("novaOrdem") }}>
              <Plus size={16} weight="bold" />
              Nova Ordem
            </button>
            }
          </div>
        </div>

        {/* COMPONENTE LISTA */}
        {view === "lista" && (
          <ListaOrdemCompra
              setView={setView}
              setOrdemSelecionada={setOrdemSelecionada}
              setEditStatus={setEditStatus}
          />
        )}

        {/* COMPONENTE NOVA ORDEM */}
        {view === "novaOrdem" && (
          <NovaOrdemCompra 
            setView={setView}
            setMensagem={setMensagem}
          />
        )}

        {/* COMPONENTE EDITAR STATUS */}
        {view === "editarOrdem" && ordemSelecionada && (
          <EditarStatusOrdem 
            ordemSelecionada = { ordemSelecionada }
            setView = { setView }
            setMensagem={setMensagem}
          />
        )}

        {/* ══════════════════════════ FORNECEDORES ══════════════════════════ */}
        {view === "fornecedores" && (
          <div className={`${styles.card} ${styles.fadeUp}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <Buildings size={18} className={styles.cardHeaderIcon} />
                <h2>Fornecedores</h2>
              </div>
              <button className={styles.botaoVoltar} onClick={() => setView("lista")}>
                <ArrowLeft size={14} weight="bold" />
                Voltar
              </button>
            </div>

            {/* Form add/edit fornecedor */}
            <div className={styles.painelFiltros} style={{ marginBottom: 20 }}>
              <div className={styles.filtrosHeader}>
                <Buildings size={13} className={styles.filtroIcone} weight="bold" />
                {fornecedorEditando ? `Editando: ${fornecedorEditando.nome}` : "Cadastrar Fornecedor"}
              </div>
              <div className={styles.filtrosGrid} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                {[
                  { field: "nome",     placeholder: "Razão social *", label: "Nome" },
                  { field: "cnpj",     placeholder: "00.000.000/0000-00", label: "CNPJ" },
                  { field: "telefone", placeholder: "(47) 0000-0000", label: "Telefone" },
                  { field: "email",    placeholder: "email@empresa.com", label: "E-mail" },
                ].map(({ field, placeholder, label }) => (
                  <div key={field} className={styles.filtroGrupo}>
                    <label className={styles.filtroLabel}>{label}</label>
                    <input
                      className={styles.input}
                      placeholder={placeholder}
                      value={formFornecedorNovo[field]}
                      onChange={(e) => setFormFornecedorNovo((p) => ({ ...p, [field]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <div className={styles.formAcoes} style={{ padding: "0 20px 18px", justifyContent: "flex-end" }}>
                {fornecedorEditando && (
                  <button
                    className={styles.botaoCancelar}
                    onClick={() => {
                      setFornecedorEditando(null);
                      setFormFornecedorNovo({ nome: "", cnpj: "", telefone: "", email: "" });
                    }}
                  >
                    <X size={14} weight="bold" /> Cancelar edição
                  </button>
                )}
                <button
                  className={styles.botaoPrincipal}
                  onClick={handleSalvarFornecedor}
                  disabled={!formFornecedorNovo.nome}
                >
                  <FloppyDisk size={14} weight="bold" />
                  {fornecedorEditando ? "Salvar alterações" : "Cadastrar"}
                </button>
              </div>
            </div>

            {/* Lista fornecedores */}
            <div className={styles.tabelaWrapper}>
              <div className={`${styles.tituloLista} ${styles.gridFornecedores}`}>
                <span>Nome</span>
                <span>CNPJ</span>
                <span>Telefone</span>
                <span>E-mail</span>
                <span></span>
              </div>
              <div className={styles.lista}>
                {fornecedores.length === 0 && (
                  <div className={styles.estadoVazio}>
                    <Buildings size={36} className={styles.iconeVazio} />
                    <p>Nenhum fornecedor cadastrado</p>
                  </div>
                )}
                {fornecedores.map((f) => (
                  <div key={f.id} className={`${styles.itemRow} ${styles.gridFornecedores}`}>
                    <span className={styles.cellFornecedor}>
                      <Buildings size={13} />
                      {f.nome}
                    </span>
                    <span>{f.cnpj || "—"}</span>
                    <span>{f.telefone || "—"}</span>
                    <span>{f.email || "—"}</span>
                    <div className={styles.acoesRow}>
                      <button className={styles.btnIcone} onClick={() => handleEditarFornecedor(f)} title="Editar">
                        <PencilSimple size={14} weight="bold" />
                      </button>
                      <button
                        className={`${styles.btnIcone} ${styles.btnIconeRed}`}
                        onClick={() => setModalDeleteFornecedor(f)}
                        title="Excluir"
                      >
                        <Trash size={14} weight="bold" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ══ Modal confirmação delete fornecedor ══ */}
      {modalDeleteFornecedor && (
        <div className={styles.modalOverlay} onClick={() => setModalDeleteFornecedor(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcone}>
              <Warning size={28} weight="fill" />
            </div>
            <h3>Excluir fornecedor?</h3>
            <p>
              Tem certeza que deseja excluir <strong>{modalDeleteFornecedor.nome}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className={styles.modalAcoes}>
              <button className={styles.botaoCancelar} onClick={() => setModalDeleteFornecedor(null)}>
                Cancelar
              </button>
              <button
                className={styles.botaoPrincipal}
                style={{ background: "var(--red)", boxShadow: "0 2px 8px rgba(201,42,42,0.25)" }}
                onClick={() => handleDeletarFornecedor(modalDeleteFornecedor.id)}
              >
                <Trash size={14} weight="bold" />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
      <Rodape />
    </div>
  );
}
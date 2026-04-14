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
import { dataFormatada } from "../../utils/data";
import { formatarMoeda } from "../../utils/formartarMoeda";
import ListaOrdemCompra from "../../componentes/ListaOrdemCompra";

// ─── MOCK helpers (substituir pelas APIs reais) ──────────────────────────────
//import { buscarOrdem } from "../../API/estoque/buscarOrdem";
// import { criarOrdem }  from "../../API/estoque/criarOrdem";
// import { editarOrdem } from "../../API/estoque/editarOrdem";

const mockOrdens = [
  {
    id: 1,
    data: "2026-04-06T20:01:48.176Z",
    usuarioId: 3,
    fornecedorId: 1,
    status: "Finalizada",
    total: 540.0,
    itens: [
      { id: 1, notaEntradaId: 1, produtoId: 1, quantidade: 24, valorUnit: 12.5, valorTotal: 300 },
      { id: 2, notaEntradaId: 1, produtoId: 2, quantidade: 12, valorUnit: 20.0, valorTotal: 240 },
    ],
    fornecedor: { nome: "ACB AMBEV" },
    usuario: { nome: "administrador" },
  },
  {
    id: 2,
    data: "2026-04-06T20:03:38.358Z",
    usuarioId: 3,
    fornecedorId: 2,
    status: "Pendente",
    total: 188.0,
    itens: [
      { id: 3, notaEntradaId: 2, produtoId: 3, quantidade: 8, valorUnit: 23.5, valorTotal: 188 },
    ],
    fornecedor: { nome: "Distribuidora Sul" },
    usuario: { nome: "joao.vendas" },
  },
  {
    id: 3,
    data: "2026-04-07T10:15:00.000Z",
    usuarioId: 2,
    fornecedorId: 3,
    status: "Em andamento",
    total: 975.0,
    itens: [
      { id: 4, notaEntradaId: 3, produtoId: 4, quantidade: 50, valorUnit: 9.75, valorTotal: 487.5 },
      { id: 5, notaEntradaId: 3, produtoId: 1, quantidade: 25, valorUnit: 19.5, valorTotal: 487.5 },
    ],
    fornecedor: { nome: "Bebidas Norte LTDA" },
    usuario: { nome: "maria.estoque" },
  },
];

const mockFornecedores = [
  { id: 1, nome: "ACB AMBEV", cnpj: "12.345.678/0001-90", telefone: "(47) 3322-1100", email: "compras@acbambev.com.br" },
  { id: 2, nome: "Distribuidora Sul", cnpj: "98.765.432/0001-11", telefone: "(48) 3211-9900", email: "vendas@distrsul.com.br" },
  { id: 3, nome: "Bebidas Norte LTDA", cnpj: "11.222.333/0001-44", telefone: "(51) 3100-8800", email: "contato@bebidasnorte.com.br" },
];

const mockProdutos = [
  { id: 1, nome: "Cerveja Skol Lata 350ml" },
  { id: 2, nome: "Água Mineral 500ml" },
  { id: 3, nome: "Refrigerante Coca-Cola 2L" },
  { id: 4, nome: "Suco Integral Laranja 1L" },
  { id: 5, nome: "Cerveja Heineken Long Neck 330ml" },
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
  // Dados
  const [ordens, setOrdens] = useState([]);
  const [fornecedores, setFornecedores] = useState(mockFornecedores);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState(null);

  // Modais / Abas
  const [view, setView] = useState("lista"); // "lista" | "novaOrdem" | "editarOrdem" | "fornecedores"
  const [ordemSelecionada, setOrdemSelecionada] = useState(null);

  // Form nova ordem
  const [formFornecedor, setFormFornecedor] = useState(null);
  const [formItens, setFormItens] = useState([{ produtoId: null, quantidade: "", valorUnit: "" }]);
  const [salvando, setSalvando] = useState(false);

  // Form editar ordem
  const [editStatus, setEditStatus] = useState(null);

  // ── Fornecedores CRUD
  const [formFornecedorNovo, setFormFornecedorNovo] = useState({ nome: "", cnpj: "", telefone: "", email: "" });
  const [fornecedorEditando, setFornecedorEditando] = useState(null);
  const [modalDeleteFornecedor, setModalDeleteFornecedor] = useState(null);

  // ── Carregar ordens ────────────────────────────────────────────────────────
  const carregarOrdens = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      // const data = await buscarOrdem();
      await new Promise((r) => setTimeout(r, 600)); // simula latência
      setOrdens(mockOrdens);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregarOrdens(); }, [carregarOrdens]);

  // ── Filtros aplicados ──────────────────────────────────────────────────────
  const ordensFiltradas = ordens.filter((o) => {
    const textoBusca = busca.toLowerCase();
    const matchBusca =
      !busca ||
      o.fornecedor.nome.toLowerCase().includes(textoBusca) ||
      o.usuario.nome.toLowerCase().includes(textoBusca) ||
      String(o.id).includes(textoBusca);
    const matchStatus = !filtroStatus || o.status === filtroStatus.value;
    return matchBusca && matchStatus;
  });

  // ── Criar ordem ────────────────────────────────────────────────────────────
  const handleCriarOrdem = async () => {
    if (!formFornecedor) return;
    const itensValidos = formItens.filter((i) => i.produtoId && i.quantidade && i.valorUnit);
    if (!itensValidos.length) return;

    setSalvando(true);
    try {
      const payload = itensValidos.map((i) => ({
        produtoId: i.produtoId.value,
        quantidade: Number(i.quantidade),
        valorUnit: Number(i.valorUnit),
        valorTotal: Number(i.quantidade) * Number(i.valorUnit),
      }));
      // await criarOrdem(3, formFornecedor.value, payload);
      await new Promise((r) => setTimeout(r, 700));
      await carregarOrdens();
      setView("lista");
      resetFormOrdem();
    } catch (e) {
      alert(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const resetFormOrdem = () => {
    setFormFornecedor(null);
    setFormItens([{ produtoId: null, quantidade: "", valorUnit: "" }]);
  };

  // ── Editar status ──────────────────────────────────────────────────────────
  const handleEditarOrdem = async () => {
    if (!editStatus || !ordemSelecionada) return;
    setSalvando(true);
    try {
      // await editarOrdem(editStatus.value, 3, ordemSelecionada.id);
      await new Promise((r) => setTimeout(r, 600));
      await carregarOrdens();
      setView("lista");
      setOrdemSelecionada(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setSalvando(false);
    }
  };

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

  // ── Select options ─────────────────────────────────────────────────────────
  const opFornecedores = fornecedores.map((f) => ({ value: f.id, label: f.nome }));
  const opProdutos     = mockProdutos.map((p) => ({ value: p.id, label: p.nome }));
  const opStatus       = ["Pendente", "Em andamento", "Finalizada", "Cancelada"].map((s) => ({ value: s, label: s }));


  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
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
            <button className={styles.botaoPrincipal} onClick={() => { setView("novaOrdem"); resetFormOrdem(); }}>
              <Plus size={16} weight="bold" />
              Nova Ordem
            </button>
          </div>
        </div>

        {/* LISTA */}
        {view === "lista" && (
            <ListaOrdemCompra
                setView={setView}
                setOrdemSelecionada={setOrdemSelecionada}
                setEditStatus={setEditStatus}
            />
          )
        }

        {/* NOVA ORDEM */}
        {view === "novaOrdem" && (
          <div className={`${styles.card} ${styles.fadeUp}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <Plus size={18} className={styles.cardHeaderIcon} />
                <h2>Nova Ordem de Compra</h2>
              </div>
              <button className={styles.botaoVoltar} onClick={() => setView("lista")}>
                <ArrowLeft size={14} weight="bold" />
                Voltar
              </button>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGrupo}>
                <label className={styles.formLabel}>
                  <Buildings size={13} /> Fornecedor
                </label>
                <Select
                  classNamePrefix="custom"
                  options={opFornecedores}
                  value={formFornecedor}
                  onChange={setFormFornecedor}
                  placeholder="Selecione o fornecedor…"
                />
              </div>
            </div>

            {/* Itens */}
            <div className={styles.itensSection}>
              <div className={styles.itensTitulo}>
                <ListBullets size={15} weight="bold" />
                Itens da Ordem
              </div>

              {formItens.map((item, idx) => (
                <div key={idx} className={styles.itemFormRow}>
                  <div className={styles.itemFormProduto}>
                    <label className={styles.formLabel}>Produto</label>
                    <Select
                      classNamePrefix="custom"
                      options={opProdutos}
                      value={item.produtoId}
                      onChange={(v) => {
                        const nova = [...formItens];
                        nova[idx].produtoId = v;
                        setFormItens(nova);
                      }}
                      placeholder="Selecione…"
                    />
                  </div>
                  <div className={styles.itemFormQtd}>
                    <label className={styles.formLabel}>Qtd</label>
                    <input
                      className={styles.input}
                      type="number"
                      min="1"
                      placeholder="0"
                      value={item.quantidade}
                      onChange={(e) => {
                        const nova = [...formItens];
                        nova[idx].quantidade = e.target.value;
                        setFormItens(nova);
                      }}
                    />
                  </div>
                  <div className={styles.itemFormValor}>
                    <label className={styles.formLabel}>Vlr. Unit (R$)</label>
                    <input
                      className={styles.input}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={item.valorUnit}
                      onChange={(e) => {
                        const nova = [...formItens];
                        nova[idx].valorUnit = e.target.value;
                        setFormItens(nova);
                      }}
                    />
                  </div>
                  <div className={styles.itemFormTotal}>
                    <label className={styles.formLabel}>Total</label>
                    <span className={styles.itemTotalCalc}>
                      {formatarMoeda((item.quantidade || 0) * (item.valorUnit || 0))}
                    </span>
                  </div>
                  {formItens.length > 1 && (
                    <button
                      className={styles.btnRemoverItem}
                      onClick={() => setFormItens((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <X size={14} weight="bold" />
                    </button>
                  )}
                </div>
              ))}

              <button
                className={styles.botaoAdicionarItem}
                onClick={() => setFormItens((prev) => [...prev, { produtoId: null, quantidade: "", valorUnit: "" }])}
              >
                <Plus size={14} weight="bold" />
                Adicionar item
              </button>
            </div>

            {/* Rodapé do form */}
            <div className={styles.formRodape}>
              <div className={styles.totalOrdem}>
                Total:{" "}
                <strong>
                  {formatarMoeda(
                    formItens.reduce((s, i) => s + (Number(i.quantidade) || 0) * (Number(i.valorUnit) || 0), 0)
                  )}
                </strong>
              </div>
              <div className={styles.formAcoes}>
                <button className={styles.botaoCancelar} onClick={() => setView("lista")}>
                  <X size={15} weight="bold" />
                  Cancelar
                </button>
                <button
                  className={styles.botaoPrincipal}
                  onClick={handleCriarOrdem}
                  disabled={salvando || !formFornecedor}
                >
                  {salvando ? <CircleNotch size={15} className={styles.spinnerIcon} /> : <FloppyDisk size={15} weight="bold" />}
                  {salvando ? "Salvando…" : "Criar Ordem"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════ EDITAR STATUS ══════════════════════════ */}
        {view === "editarOrdem" && ordemSelecionada && (
          <div className={`${styles.card} ${styles.fadeUp}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <PencilSimple size={18} className={styles.cardHeaderIcon} />
                <h2>Editar Ordem #{ordemSelecionada.id}</h2>
              </div>
              <button className={styles.botaoVoltar} onClick={() => setView("lista")}>
                <ArrowLeft size={14} weight="bold" />
                Voltar
              </button>
            </div>

            {/* Detalhes da ordem */}
            <div className={styles.detalheOrdem}>
              <div className={styles.detalheItem}>
                <span className={styles.detalheLabel}>Fornecedor</span>
                <span className={styles.detalheValor}>{ordemSelecionada.fornecedor.nome}</span>
              </div>
              <div className={styles.detalheItem}>
                <span className={styles.detalheLabel}>Responsável</span>
                <span className={styles.detalheValor}>{ordemSelecionada.usuario.nome}</span>
              </div>
              <div className={styles.detalheItem}>
                <span className={styles.detalheLabel}>Data</span>
                <span className={styles.detalheValor}>{dataFormatada(ordemSelecionada.data)}</span>
              </div>
              <div className={styles.detalheItem}>
                <span className={styles.detalheLabel}>Total</span>
                <span className={styles.detalheValor}>{formatarMoeda(ordemSelecionada.total)}</span>
              </div>
            </div>

            {/* Itens da ordem (readonly) */}
            <div className={styles.itensSection}>
              <div className={styles.itensTitulo}>
                <ListBullets size={15} weight="bold" />
                Itens
              </div>
              <div className={styles.tabelaWrapper}>
                <div className={`${styles.tituloLista} ${styles.gridItens}`}>
                  <span>Produto ID</span>
                  <span>Qtd</span>
                  <span>Vlr Unit</span>
                  <span>Total</span>
                </div>
                {ordemSelecionada.itens.map((it) => (
                  <div key={it.id} className={`${styles.itemRow} ${styles.gridItens}`}>
                    <span>Produto #{it.produtoId}</span>
                    <span>{it.quantidade}</span>
                    <span>{formatarMoeda(it.valorUnit)}</span>
                    <span>{formatarMoeda(it.valorTotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Alterar status */}
            <div className={styles.formGrid} style={{ marginTop: 20 }}>
              <div className={styles.formGrupo}>
                <label className={styles.formLabel}>
                  <CheckCircle size={13} /> Alterar Status
                </label>
                <Select
                  classNamePrefix="custom"
                  options={opStatus}
                  value={editStatus}
                  onChange={setEditStatus}
                  placeholder="Selecione o novo status…"
                />
              </div>
            </div>

            <div className={styles.formAcoes} style={{ marginTop: 20 }}>
              <button className={styles.botaoCancelar} onClick={() => setView("lista")}>
                <X size={15} weight="bold" />
                Cancelar
              </button>
              <button
                className={styles.botaoPrincipal}
                onClick={handleEditarOrdem}
                disabled={salvando || !editStatus}
              >
                {salvando ? <CircleNotch size={15} className={styles.spinnerIcon} /> : <FloppyDisk size={15} weight="bold" />}
                {salvando ? "Salvando…" : "Salvar Alteração"}
              </button>
            </div>
          </div>
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
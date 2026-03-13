import { useState, useRef } from "react";
import Select from "react-select";
import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import logo from "../../assets/logo.jpg";
import ItemListaPedido from "../../componentes/ItemListaPedido";
import { usarAuth } from "../../componentes/Context/authContext";
import { NovoPedidoBalcao } from "../../operadores/API/pedido/novoPedidoBalcao.js";
import { useProdutos } from "../../hooks/useProdutos.js";
import { useFormaPagamento } from "../../hooks/useFormaPagamento.js";
import { gerarCupom } from "../../utils/gerarCupom.js";
import { AlertaRadix } from "../../componentes/ui/alerta/alerta";
import { usarToast } from "../../componentes/Context/toastContext";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";
import { gerarOrcamento } from "../../utils/gerarOrcamento";
import { formatarMoeda } from "../../utils/formartarMoeda";
import {
  ShoppingCartIcon,
  PlusCircleIcon,
  ReceiptIcon,
  CurrencyDollarIcon,
  TrashIcon,
  CheckCircleIcon,
  UserIcon,
  PackageIcon,
  SpinnerIcon,
} from "@phosphor-icons/react";

export default function Vendas() {
  const [nome, setNome] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const [cupom, setCupom] = useState([]);
  const [formaPagamento, setFormaPagamento] = useState(1);
  const [abrirOpcaoNome, setAbrirOpcaoNome] = useState(false);
  const [nomeFormaPagamento, setNomeFormaPagamento] = useState("");
  const nomeMaquina = import.meta.env.VITE_NOME_MAQUINA;
  const inputProduto = useRef(null);

  const { usuario } = usarAuth();
  const { mensagem, setMensagem } = usarToast();
  const { produtos, carregando } = useProdutos();
  const { listaFormaPagamento } = useFormaPagamento();

  if (!usuario) {
    window.location.href = "/";
  }

  const handleEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const elements = Array.from(document.querySelectorAll("input:not([data-skip-enter])"));
      const index = elements.indexOf(e.target);
      elements[index + 1]?.focus();
    }
  };

  const options = produtos.map((p) => ({ value: p.id, label: p.nome }));

  const handleRemoveProduto = (id) => setCupom(cupom.filter((item) => item.id !== id));

  const handleAddProduto = () => {
    if (!produtoSelecionado || quantidade <= 0) {
      alert("Selecione um produto e quantidade válida!");
      return;
    }
    const itemExistente = cupom.find((i) => i.id === produtoSelecionado.id);
    const novoCupom = itemExistente
      ? cupom.map((i) => i.id === produtoSelecionado.id ? { ...i, quantidade: i.quantidade + quantidade } : i)
      : [...cupom, { ...produtoSelecionado, quantidade }];

    setCupom(novoCupom);
    setProdutoSelecionado(null);
    setQuantidade(1);
    inputProduto.current.focus();
  };

  const totalProduto = (preco, qtd) => (preco * qtd).toFixed(2);
  const totalPedido = cupom.reduce((acc, item) => acc + item.precoUndVenda * item.quantidade, 0).toFixed(2);
  const quantidadeTotal = cupom.reduce((acc, item) => acc + item.quantidade, 0);

  const handleCancelarPedido = () => {
    if (cupom.length > 0) {
      const confirmar = window.confirm("Deseja realmente cancelar o pedido? Todos os itens serão removidos.");
      if (!confirmar) return;
    }
    setCupom([]);
    setProdutoSelecionado(null);
    setQuantidade(1);
    setFormaPagamento("");
  };

  const handleGerarPedido = async () => {
    if (cupom.length === 0) { alert("Adicione produtos ao cupom antes de gerar o pedido!"); return; }
    if (!formaPagamento) { alert("Selecione a forma de pagamento!"); return; }

    const pedido = {
      cliente: nome || "",
      formaPagamentoId: formaPagamento,
      vendedor: nomeMaquina,
      nomeUsuario: usuario.nome,
      usuarioId: usuario.id,
      itens: cupom.map((item) => ({ produtoId: item.id, quantidade: item.quantidade, valorUnit: item.precoUndVenda })),
    };

    const pedidoImprimir = {
      cliente: nome || "",
      formaPagamento: nomeFormaPagamento,
      vendedor: nomeMaquina === "b1" ? "Balcao 01" : nomeMaquina === "b2" ? "Balcao 02" : null,
      nomeUsuario: usuario.nome,
      itens: cupom.map((item) => ({ produtoId: item.id, nome: item.nome, quantidade: item.quantidade, valorUnit: item.precoUndVenda })),
    };

    if (nomeFormaPagamento === "ORÇAMENTO") {
      window.IMPRESSORA.imprimir(gerarOrcamento(pedidoImprimir));
      setMensagem("Orçamento gerado com sucesso!");
    } else {
      const retornoAPI = await NovoPedidoBalcao("balcao", pedido);
      window.IMPRESSORA.imprimir(gerarCupom(pedidoImprimir));
      setMensagem(retornoAPI.mensagem);
    }

    setNome("");
    setCupom([]);
    setProdutoSelecionado(null);
    setQuantidade(1);
    setFormaPagamento(1);
  };

  return (
    <div className={styles.container}>
      <ToastRadix mensagem={mensagem} />
      <Cabecalho />

      <main className={styles.main}>

        {/* ── Lado esquerdo ── */}
        <div className={styles.colunaEsquerda}>

          {/* Cabeçalho da página */}
          <div className={styles.cabecalhoPage}>
            <div className={styles.iconeWrapper}>
              <ShoppingCartIcon size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Balcão</p>
              <h1 className={styles.pageTitulo}>Nova Venda</h1>
            </div>
          </div>

          {/* Card de adicionar produto */}
          <div className={styles.cardAdicionar}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <PlusCircleIcon size={17} weight="bold" className={styles.cardHeaderIcon} />
                <h2>Adicionar produto</h2>
              </div>
            </div>

            <div className={styles.formulario}>

              {/* Select produto */}
              <div className={styles.campo}>
                <label className={styles.label}>Produto</label>
                {carregando ? (
                  <div className={styles.carregandoProduto}>
                    <SpinnerIcon size={16} weight="bold" className={styles.spinnerIcon} />
                    Carregando produtos...
                  </div>
                ) : (
                  <Select
                    ref={inputProduto}
                    classNamePrefix="custom"
                    options={options}
                    value={options.find((opt) => opt.value === produtoSelecionado?.id) || null}
                    onChange={(opt) => setProdutoSelecionado(produtos.find((p) => p.id === opt.value))}
                    placeholder="Selecione ou digite..."
                    isSearchable
                    noOptionsMessage={() => "Nenhum produto encontrado"}
                    onKeyDown={handleEnter}
                  />
                )}
              </div>

              {/* Quantidade + Preço */}
              <div className={styles.linha}>
                <div className={styles.campoMetade}>
                  <label className={styles.label}>Quantidade</label>
                  <input
                    type="number"
                    value={quantidade}
                    onChange={(e) => { const v = parseInt(e.target.value) || 1; setQuantidade(v > 0 ? v : 1); }}
                    min="1"
                    className={styles.input}
                  />
                </div>
                <div className={styles.campoMetade}>
                  <label className={styles.label}>Preço unitário</label>
                  <input
                    type="text"
                    value={produtoSelecionado ? `R$ ${Number(produtoSelecionado.precoUndVenda || 0).toFixed(2)}` : "R$ 0,00"}
                    readOnly
                    className={`${styles.input} ${styles.inputReadonly}`}
                  />
                </div>
              </div>

              {/* Total do produto */}
              <div className={styles.campo}>
                <label className={styles.label}>Total do produto</label>
                <input
                  type="text"
                  value={produtoSelecionado ? `R$ ${totalProduto(produtoSelecionado.precoUndVenda, quantidade)}` : "R$ 0,00"}
                  readOnly
                  className={`${styles.input} ${styles.inputTotal}`}
                />
              </div>

              {/* Botão adicionar */}
              <button
                className={styles.botaoAdicionar}
                onClick={handleAddProduto}
                disabled={!produtoSelecionado}
              >
                <PlusCircleIcon size={18} weight="bold" />
                Adicionar ao cupom
              </button>

            </div>
          </div>

          {/* Mascote */}
          <div className={styles.mascote}>
            <img src={logo} alt="Logo" className={styles.logo} />
          </div>

        </div>

        {/* ── Lado direito ── */}
        <div className={styles.colunaDireita}>

          {/* Cupom */}
          <div className={styles.cardCupom}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <ReceiptIcon size={17} weight="bold" className={styles.cardHeaderIcon} />
                <h2>Cupom fiscal</h2>
              </div>
              <span className={styles.badge}>
                {cupom.length} {cupom.length === 1 ? "item" : "itens"}
              </span>
            </div>

            <div className={styles.lista}>
              {cupom.length === 0 ? (
                <div className={styles.listaVazia}>
                  <PackageIcon size={40} weight="duotone" className={styles.iconeVazio} />
                  <p>Nenhum produto adicionado</p>
                  <span>Selecione produtos para iniciar a venda</span>
                </div>
              ) : (
                cupom.map((item) => (
                  <ItemListaPedido key={item.id} produto={item} onRemover={handleRemoveProduto} />
                ))
              )}
            </div>
          </div>

          {/* Resumo + pagamento + botões */}
          <div className={styles.cardResumo}>

            {/* Documento opcional */}
            <div className={styles.checkboxRow}>
              <input
                type="checkbox"
                id="opcaoNome"
                checked={abrirOpcaoNome}
                onChange={(e) => setAbrirOpcaoNome(e.target.checked)}
                className={styles.checkbox}
              />
              <label htmlFor="opcaoNome" className={styles.checkboxLabel}>
                <UserIcon size={14} weight="bold" />
                Adicionar documento de identificação
              </label>
            </div>

            {abrirOpcaoNome && (
              <div className={styles.campoNome}>
                <label className={styles.label}>Documento de identificação</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome e número do documento"
                  className={styles.input}
                />
              </div>
            )}

            {/* Totais */}
            <div className={styles.totais}>
              <div className={styles.linhaTotal}>
                <span>Quantidade total</span>
                <strong>{quantidadeTotal} {quantidadeTotal === 1 ? "unidade" : "unidades"}</strong>
              </div>
              <div className={styles.linhaTotal}>
                <span>Subtotal</span>
                <strong>{formatarMoeda(totalPedido)}</strong>
              </div>
              <div className={`${styles.linhaTotal} ${styles.totalFinal}`}>
                <span>Total</span>
                <strong className={styles.valorTotal}>{formatarMoeda(totalPedido)}</strong>
              </div>
            </div>

            {/* Forma de pagamento */}
            <div className={styles.campo}>
              <label className={styles.label}>
                <CurrencyDollarIcon size={14} weight="bold" />
                Forma de pagamento
              </label>
              <select
                value={formaPagamento}
                onChange={(e) => {
                  const id = e.target.value;
                  setFormaPagamento(id);
                  setNomeFormaPagamento(listaFormaPagamento.find((f) => f.id === Number(id))?.nome || "");
                }}
                className={styles.select}
              >
                {listaFormaPagamento?.map((forma) => (
                  <option key={forma.id} value={forma.id}>{forma.nome}</option>
                ))}
              </select>
            </div>

            {/* Botões */}
            <div className={styles.botoesAcao}>
              <AlertaRadix
                titulo="Cancelar pedido"
                descricao="Você realmente deseja cancelar o pedido?"
                tratar={handleCancelarPedido}
                confirmarTexto="Confirmar cancelamento"
                cancelarTexto="Sair"
                trigger={
                  <button className={styles.botaoCancelar}>
                    <TrashIcon size={16} weight="bold" />
                    Cancelar
                  </button>
                }
              />
              <AlertaRadix
                titulo="Gerar pedido"
                descricao="Você realmente deseja gerar o pedido?"
                tratar={handleGerarPedido}
                confirmarTexto="Sim, gerar pedido!"
                cancelarTexto="Sair"
                trigger={
                  <button className={styles.botaoGerar} disabled={cupom.length === 0}>
                    <CheckCircleIcon size={16} weight="bold" />
                    Gerar Pedido
                  </button>
                }
              />
            </div>

          </div>
        </div>
      </main>

      <Rodape />
    </div>
  );
}
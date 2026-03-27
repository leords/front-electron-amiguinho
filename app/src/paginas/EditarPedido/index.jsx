import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Receipt,
  CreditCard,
  Package,
  Plus,
  Trash,
  Warning,
  CheckCircle,
  SpinnerGap,
  PencilSimple,
  ShoppingCart,
  CurrencyDollar,
  Hash,
} from "@phosphor-icons/react";
import Select from "react-select";
import styles from "./styles.module.css";
import { useProdutos } from "../../hooks/useProdutos";
import { useFormaPagamento } from "../../hooks/useFormaPagamento";
import { formatarMoeda } from "../../utils/formartarMoeda";
import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import { useLocation, useNavigate } from "react-router-dom";
import { dataHoraFormatada } from "../../utils/data";
import { EnviarEdicaoPedido } from "../../operadores/API/pedido/editarPedido";
import { usarToast } from "../../componentes/Context/toastContext";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";
import { AlertaRadix } from "../../componentes/ui/alerta/alerta";


export default function EditarPedido() {  

const { state } = useLocation()
const navegar = useNavigate() 

  // Alerta
  const { mensagem, setMensagem } = usarToast();

  // Estado novo item
  const [itens, setItens] = useState(state.itens);
  const [novaQuantidade, setNovaQuantidade] = useState(1);
  const [formaPagamento, setFormaPagamento] = useState(1);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [valorTotal, setValorTotal] = useState();

  // Hooks
  const { listaFormaPagamento } = useFormaPagamento();
  const { produtos } = useProdutos(); 

  // Mapeando produtos para o <Select />
  const options = produtos.map((p) => ({ value: p.id, label: p.nome }));

  // adiciona o nome referente ao id e key a todos os itens
  useEffect(() => {
    if (!produtos.length) return;

    const map = new Map(produtos.map((p) => [p.id, p.nome]));

    setItens((prev) =>
      prev.map((item) => ({
        ...item,
        nomeProduto: map.get(Number(item.produtoId)) || "Produto nao encontrado",
        _key: crypto.randomUUID(),
      }))
    );
  }, [produtos]);

  // calcula o valor total do pedido
  useEffect(() => {
    if (!itens.length) return;

    const total = itens.reduce((s, item) => s + item.quantidade * item.valorUnit, 0);
    setValorTotal(total);

  }, [itens]);


  // funções p/ lista de produtos
  const atualizarQuantidade = (key, valor) => {
    setItens((prev) =>
      prev.map((item) => (item._key === key ? { ...item, quantidade: Number(valor) } : item))
    );
    setMensagem('Quantidade alterada')
  };
  const atualizarValor = (key, valor) => {
    setItens((prev) =>
      prev.map((item) => (item._key === key ? { ...item, valorUnit: valor } : item))
    );
  };
  const removerItem = (key) => {
    setItens((prev) => prev.filter((item) => item._key !== key));
    setMensagem('Item removido')
  };
  const adicionarItem = () => { 
    if (!produtoSelecionado) return;

    setItens((prev) => [
      ...prev,
      {
        _key: crypto.randomUUID(),
        nomeProduto: produtoSelecionado.nome,
        id: state.id,
        pedidoId: state.id,
        produtoId: produtoSelecionado.id,
        quantidade: Number(novaQuantidade),
        valorTotal: Number(produtoSelecionado?.precoUndVenda * novaQuantidade),
        valorUnit: Number(produtoSelecionado?.precoUndVenda),
      },
    ]);

    setMensagem('Novo item adicionado')
    setProdutoSelecionado(null);
    setNovaQuantidade(1);
  };

  
  // Enviar edição
const enviarEdicao = async () => {
    try {

      if (itens.length === 0) {
        setMensagem('Nenhum item no pedido')
      } 
      else if(itens.quantidade <= 0) {
        setMensagem('Quantidade igual ou menor que zero')
      }
      else if(itens.valorUnit <= 0) {
        setMensagem('Valor unitário igual ou menor que zero')
      }

      // formatando o array para enviar apenas os dados que precisa para o banco
      const payload = (itens || []).map(({id, _key, pedidoId, nomeProduto, valorTotal, ...rest}) => rest)

      console.log(payload)

      // enviando
      const retorno = await EnviarEdicaoPedido(state.tipo, state.uuid, formaPagamento, payload);

      setMensagem(retorno.mensagem)

      navegar('/pedidos')


    } catch (error) {
      console.log(error)
    }
  }
  

  return (
    <div className={styles.container}>
    <ToastRadix mensagem={mensagem} />
    <Cabecalho />
      <main className={styles.principal}>

        {/* Cabeçalho */}
        <div className={styles.cabecalhoPage}>
          <div className={styles.tituloSection}>
            <div className={styles.iconeWrapper}>
              <PencilSimple size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Gerenciamento de Pedidos</p>
              <h1 className={styles.pageTitulo}>Editar Pedido #{state.id}</h1>
            </div>
          </div>

          <button className={styles.botaoVoltar} onClick={() => {navegar(-1)}}>
            <ArrowLeft size={15} weight="bold" />
            Voltar
          </button>
        </div>

        {/* Informações do pedido */}
        <div className={`${styles.card} ${styles.fadeUp}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderTitle}>
              <Receipt size={17} weight="fill" className={styles.cardHeaderIcon} />
              <h2>Informações do Pedido</h2>
            </div>
            <span className={styles.badge}>{state.tipo.toUpperCase()}</span>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>UUID</span>
              <span className={styles.infoValorMono}>{state.uuid}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Data</span>
              <span className={styles.infoValor}>{dataHoraFormatada(state.data)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Vendedor</span>
              <span className={styles.infoValor}>{state.vendedor}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Usuário</span>
              <span className={styles.infoValor}>{state.nomeUsuario}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Status</span>
              <span className={`${styles.badge} ${styles.badgeBlue}`}>
                {state.status}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Forma de pagamento</span>
              <span className={styles.infoValor}>
                {state.formaPagamento.nome}
            </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Cliente</span>
              <span className={styles.infoValor}>
                {state.cliente ?? <em style={{ color: "var(--gray-300)" }}>Não informado</em>}
              </span>
            </div> 
          </div>
        </div>

        {/* Selecionar forma de pagamento*/}
        <div className={`${styles.card} ${styles.fadeUp}`} style={{ animationDelay: "0.06s" }}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderTitle}>
              <CreditCard size={17} weight="fill" className={styles.cardHeaderIcon} />
              <h2>Forma de Pagamento</h2>
            </div>
          </div>

          <div className={styles.filtroGrupo} style={{ maxWidth: 320 }}>
            <label className={styles.filtroLabel}>
              <CreditCard size={12} />
              Selecione a forma
            </label>
              <select
                value={formaPagamento}
                onChange={(e) => {
                  const id = e.target.value;
                  setFormaPagamento(id);
                }}
                className={styles.selectFormaPagamento}
              >
                {listaFormaPagamento?.map((forma) => (
                  <option key={forma.id} value={forma.id}>{forma.nome}</option>
                ))}
              </select>
          </div>
        </div>

        {/* Itens do pedido */}
        <div className={`${styles.card} ${styles.fadeUp}`} style={{ animationDelay: "0.12s" }}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderTitle}>
              <Package size={17} weight="fill" className={styles.cardHeaderIcon} />
              <h2>Itens do Pedido</h2>
            </div>
            <span className={styles.badge}>{itens.length} {itens.length === 1 ? "item" : "itens"}</span>
          </div>

          {/* Tabela de itens */}
          {itens.length > 0 ? (
            <div className={styles.tabelaWrapper}>
              <div className={styles.tituloLista}>
                <span>Produto</span>
                <span>Qtd</span>
                <span>Valor Unit.</span>
                <span>Subtotal</span>
                <span></span>
              </div>
              <div className={styles.lista}>
                {itens.map((it, idx) => (
                  <div key={it._key} className={styles.itemRow}>
                    <span className={styles.itemIdx}>{idx + 1}</span>
                    <span className={styles.itemNome}>{it.nomeProduto}</span>

                    {/* Quantidade já na lista */}
                      <input
                        type="number"
                        className={styles.input}
                        value={it.quantidade ?? ""}
                        onChange={(e) => atualizarQuantidade(it._key, e.target.value)}
                      />

                    {/* Valor unitário */}
                    <span
                      className={styles.itemSubtotal}
                      value={it.valorUnit}
                      onChange={(e) => atualizarValor(it._key, e.target.value)}>
                      {formatarMoeda(it.valorUnit)}
                    </span>

                    {/* Subtotal */}
                    <span className={styles.itemSubtotal}>
                      {formatarMoeda(it.quantidade * it.valorUnit)}
                    </span>

                    { /* Remover item */}
                    <button
                      className={styles.btnRemover}
                      onClick={() => removerItem(it._key)}
                      title="Remover item"
                    >
                      <Trash size={15} weight="fill" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.estadoVazio}>
              <ShoppingCart size={40} className={styles.iconeVazio} />
              <p>Nenhum item no pedido</p>
              <span>Adicione produtos abaixo</span>
            </div>
          )}

          {/* Adicionar novo item */}
          <div className={styles.adicionarWrapper}>
            <p className={styles.adicionarTitulo}>
              <Plus size={13} weight="bold" />
              Adicionar produto
            </p>
            {/* GRID ADICIONAR NOVO PRODUTO */}
            <div className={styles.adicionarGrid}>

              {/* Selecionar produto */}
              <div className={styles.filtroGrupo} style={{ gridColumn: "1 / 2" }}>
                <label className={styles.filtroLabel}>
                  <Package size={12} />
                  Produto
                </label>
                  <Select
                    classNamePrefix="custom"
                    options={options}
                    value={options.find((opt) => opt.value === produtoSelecionado?.id) || null}
                    onChange={(opt) => setProdutoSelecionado(produtos.find((p) => p.id === opt.value))}
                    placeholder="Selecione..."
                    isSearchable
                    noOptionsMessage={() => "Nenhum produto encontrado"}
                  />
              </div>
              {/* Quantidade */} 
              <div className={styles.filtroGrupo}>
                <label className={styles.filtroLabel}>
                  <Hash size={12} />
                  Quantidade
                </label>
                  <input
                    type="number"
                    className={styles.input}
                    value={novaQuantidade}
                    min={1}
                    onChange={(e) => setNovaQuantidade(e.target.value)}
                  />
              </div>

              {/* Valor Unitário */}
              <div className={styles.filtroGrupo}>
                <label className={styles.filtroLabel}>
                  <CurrencyDollar size={12} />
                  Valor Unit. (R$)
                </label>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="0,00"
                  value={produtoSelecionado?.precoUndVenda}
                  disabled={true}
                />
              </div>

              {/* Valor Total */}
              <div className={styles.filtroGrupo}>
                <label className={styles.filtroLabel}>
                  <CurrencyDollar size={12} />
                  Valor Total. (R$)
                </label>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="0,00"
                  value={produtoSelecionado?.precoUndVenda * novaQuantidade}
                  readOnly
                />
              </div>
            </div>

            {/* Botão adicionar produto */}
            <div className={styles.filtroGrupoBotao}>
              <label className={styles.filtroLabel} style={{ visibility: "hidden" }}>.</label>
              <button
                className={styles.botaoSalvarNovoItem}
                onClick={adicionarItem}
                disabled={!produtoSelecionado?.precoUndVenda}>
                  <Plus size={15} weight="bold" />
                  Adicionar
              </button>
            </div>

          </div>
        </div>

        {/* Rodapé e botões*/}
        <div className={styles.rodape}>
          <div className={styles.totalWrapper}>
            <span className={styles.totalLabel}>Total do Pedido</span>
            <span className={styles.totalValor}>{formatarMoeda(valorTotal)}</span>
          </div>
          {/* Botões */}
          <div className={styles.acoesWrapper}>
            {/* cancelar */}
            <button className={styles.botaoCancelar} onClick={() => {navegar(-1)}}>
              <ArrowLeft size={15} weight="bold" />
              Cancelar
            </button>
            {/* salvar */}
            <AlertaRadix
                titulo="Salvar Alteração"
                descricao="Você realmente deseja salvar a alteração?"
                tratar={enviarEdicao}
                confirmarTexto="Confirmar cancelamento"
                cancelarTexto="Sair"
                trigger={
                  <button className={styles.botaoPrincipal}>
                    <CheckCircle size={16} weight="fill" />
                    Salvar Alterações
                  </button>
                }
              />
          </div>
        </div>

      </main>
    <Rodape />
    </div>
  );
}
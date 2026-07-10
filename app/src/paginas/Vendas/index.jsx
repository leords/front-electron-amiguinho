import { useEffect, useState } from "react";
import Select from "react-select";
import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import logo from "../../assets/logo.jpg";
import ItemListaPedido from "../../componentes/ItemListaPedido";
import { usarAuth } from "../../componentes/Context/authContext";
import { NovoPedidoBalcao } from "../../operadores/API/pedido/novoPedidoBalcao.js";
import { useProdutos } from "../../hooks/useProdutos.js";
import { useFormaPagamentoBalcao } from "../../hooks/useFormaPagamentoBalcao.js";
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
  CoinsIcon,
  WalletIcon,
  OrangeIcon
} from "@phosphor-icons/react";
import Spinner from "../../componentes/Spinner";
import ItemListaPagamentosParcial from "../../componentes/ItemListaPagamentosParcial";
import { useFormaPagamentoExterna } from "../../hooks/useFormaPagamentoExterna.js";


export default function Vendas() {

  // Storaged
  const nomeMaquina = localStorage.getItem('balcao')

  // Hooks
  const { usuario } = usarAuth();
  const { mensagem, setMensagem } = usarToast();
  const { produtos, carregando } = useProdutos();
  const { listaFormaPagamento } = useFormaPagamentoBalcao();
  const { listaFormaPagamento: listaFormaPagamentoParcial } = useFormaPagamentoExterna();


  // Estados
  const [nome, setNome] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [cupom, setCupom] = useState([]);
  //const [formaPagamento, setFormaPagamento] = useState(1);
  const [abrirOpcaoNome, setAbrirOpcaoNome] = useState(false);
  //const [abrirOpcaoFormaPagamentoParcial, setAbrirOpcaoFormaPagamentoParcial] = useState(false)

  const [nomeFormaPagamento, setNomeFormaPagamento] = useState("A VISTA");
  const [statusPedido, setStatusPedido] = useState(false)
  const [entradaDinheiro, setEntradaDinheiro] = useState("")

  const [nomeFormaPagamentoParcial, setNomeFormaPagamentoParcial] = useState("A VISTA")
  const [idFormaPagamentoParcial, setIdFormaPagamentoParcial] = useState(1)
  const [pagamentosParciais, setPagamentosParciais] = useState([])
  const [valorParcialFormaPagamento, setValorParcialFormaPagamento] = useState("")
  const [totalListaPagamentosParcial, setTotalListaPagamentosParcial] = useState(0)


  // Opções
  const balcaoOptions = [
    { value: 'b1', label: 'Balcão 1' },
    { value: 'b2', label: 'Balcão 2' },
  ];

  const [balcao, setBalcao] = useState(balcaoOptions[0]);
  
  // Somando o total da lista
  useEffect(() => {
    const totalParciais = pagamentosParciais.reduce(
      (total, item) => total + item.valorParcialFormaPagamento,
      0
    );

    setTotalListaPagamentosParcial(totalParciais);
  }, [pagamentosParciais])



  // Valida existencia de usuário.
  if (!usuario) {
    window.location.href = "/";
  }

  // UX - tecla entrar chama o proximo componente disponivel
  const handleEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const elements = Array.from(document.querySelectorAll("input:not([data-skip-enter])"));
      const index = elements.indexOf(e.target);
      elements[index + 1]?.focus();
    }
  };


  // Mapeando produtos para ser utilizado no componentes <Select />
  const options = produtos.map((p) => ({ value: p.id, label: p.nome }));


  // Adiciona forma de pagamento parcial
  const handleAddFormaPagamentoParcial = () => {
    if (
      !valorParcialFormaPagamento ||
      !nomeFormaPagamentoParcial ||
      !idFormaPagamentoParcial
    ) {
      setMensagem('Preencha valor e forma de pagamento para adicionar!')
      return
    }

    // Criando o objeto
    const parciais = {
      valorParcialFormaPagamento: Number(valorParcialFormaPagamento),
      nomeFormaPagamentoParcial: nomeFormaPagamentoParcial,
      idFormaPagamentoParcial: Number(idFormaPagamentoParcial)
    }


    // Validando se já existe a forma de pagamento na lista, evita repetir a mesma forma.
    const repetido = pagamentosParciais.find((item) => item.idFormaPagamentoParcial === Number(idFormaPagamentoParcial))
    
    if (repetido) {
      setMensagem('Esta forma de pagamento já existe na lista')
      return
    }
    // Validando se é orçamento e impede de adicionar mais formas de pagamentos.
    const orcamento = pagamentosParciais.find((item) => item.nomeFormaPagamentoParcial === 'ORÇAMENTO')
    if(orcamento) {
      setMensagem('Orçamento não é parcial de pagamento')
      return
    }

    // Setando nova forma na lista
    const novaLista = [...pagamentosParciais, parciais];

    setPagamentosParciais(novaLista);
    setValorParcialFormaPagamento("");
  }

  // Remove forma de pagamento parcial
  const handleRemoverFormaPagamentoParcial = (id) => {
    setPagamentosParciais(pagamentosParciais.filter((item) => item.idFormaPagamentoParcial !== id))
  }

  // Remove produto
  const handleRemoveProduto = (id) => setCupom(cupom.filter((item) => item.id !== id));

  // Adiciona produto
  const handleAddProduto = () => {

    // Valida os campos de produto e quantidade
    if (!produtoSelecionado || quantidade <= 0) {
      setProdutoSelecionado(null)
      setMensagem("Selecione um produto e quantidade válida!");
      return;
    }

    // Valida a configuração de validar estoque no multiclick
    if (localStorage.getItem('validaEstoque') === 'true') {
      // Valida existencia do produto em estoque antes de adicionar, (transforma unidade em caixa)
      if (produtoSelecionado.estoque < (quantidade / produtoSelecionado.quantidade)) {
        setProdutoSelecionado(null)
        setMensagem(`Estoque insuficiente. Disponível: ${produtoSelecionado.estoque} unidades.`)
        return
      }
    }

    const itemExistente = cupom.find((i) => i.id === produtoSelecionado.id);
    const novoCupom = itemExistente
      ? cupom.map((i) => i.id === produtoSelecionado.id ? { ...i, quantidade: i.quantidade + quantidade } : i)
      : [...cupom, { ...produtoSelecionado, quantidade }];

    setCupom(novoCupom);
    setProdutoSelecionado(null);
    setQuantidade(1);
  };

  // Realiza as somas dos produtos
  const totalProduto = (preco, qtd) => (preco * qtd).toFixed(2);
  const totalPedido = cupom.reduce((acc, item) => acc + item.precoUndVenda * item.quantidade, 0).toFixed(2);
  const quantidadeTotal = cupom.reduce((acc, item) => acc + item.quantidade, 0);

    useEffect(() => {
    if(!totalPedido) {
      return
    }
    setValorParcialFormaPagamento(totalPedido)
  }, [totalPedido])


  // Troco (pagamento único)
  const trocoUnico = Number(entradaDinheiro || 0) - Number(totalPedido);

  // Restante/troco (pagamentos parciais)
  const trocoParcial = Number(totalListaPagamentosParcial || 0) - Number(totalPedido);

  // Cancela o pedido
  const handleCancelarPedido = () => {
    if (cupom.length > 0) {
      const confirmar = window.confirm("Deseja realmente cancelar o pedido? Todos os itens serão removidos.");
      if (!confirmar) return;
    }
    setCupom([]);
    setProdutoSelecionado(null);
    setQuantidade(1);
    //setFormaPagamento("");
    setPagamentosParciais([]);
    setEntradaDinheiro("");
  };

  // finaliza o pedido, imprime e envia para o backend
  const handleGerarPedido = async () => {
    if (cupom.length === 0) { alert("Adicione produtos ao cupom antes de gerar o pedido!"); return; }
    //if (!formaPagamento) { alert("Selecione a forma de pagamento!"); return; }

    try {
      setStatusPedido(true)

      // Criando o pedido
      const pedido = {
        cliente: nome || "",
        //formaPagamentoId: formaPagamento,
        vendedor: usuario.nivelAcesso === 'ADMIN' ? balcao.value : nomeMaquina,
        nomeUsuario: usuario.nome,
        usuarioId: usuario.id,
        itens: cupom.map((item) => ({ produtoId: item.id, quantidade: item.quantidade, valorUnit: item.precoUndVenda })),
        pagamentos: pagamentosParciais.map((pagamento) => ({ idFormaPagamentoParcial: pagamento.idFormaPagamentoParcial, nomeFormaPagamentoParcial: pagamento.nomeFormaPagamentoParcial, valorParcialFormaPagamento: pagamento.valorParcialFormaPagamento  }))
      };

      const vendedorTerminal =
        usuario.nivelAcesso === "ADMIN"
          ? balcao.label
          : nomeMaquina === "b1"
            ? "Balcao 01"
            : nomeMaquina === "b2"
              ? "Balcao 02"
              : null;

      // Criando o pedido para impressão
      const pedidoImprimir = {
        cliente: nome || "",
        //formaPagamento: nomeFormaPagamento,
        vendedor: vendedorTerminal,
        nomeUsuario: usuario.nome,
        itens: cupom.map((item) => ({ produtoId: item.id, nome: item.nome, quantidade: item.quantidade, valorUnit: item.precoUndVenda })),
        pagamentos: pagamentosParciais.map((pagamento) => ({ idFormaPagamentoParcial: pagamento.idFormaPagamentoParcial, nomeFormaPagamentoParcial: pagamento.nomeFormaPagamentoParcial, valorParcialFormaPagamento: pagamento.valorParcialFormaPagamento  }))
      };
      
      const orcamento = pagamentosParciais.find((item) => item.nomeFormaPagamentoParcial === 'ORÇAMENTO')

      // Função imprimir condicional
      if (orcamento) {
        window.IMPRESSORA.imprimir(gerarOrcamento(pedidoImprimir));
        setStatusPedido(false)
        setMensagem("Orçamento gerado com sucesso!");
      } else {

        // Enviando o pedido para o banco
        const retornoAPI = await NovoPedidoBalcao("balcao", pedido);
        window.IMPRESSORA.imprimir(gerarCupom(pedidoImprimir));
        setStatusPedido(false)
        setMensagem(`${retornoAPI.mensagem}! Aguarde a impressão do comprovante.`);
      }

      setNome("");
      setCupom([]);
      setProdutoSelecionado(null);
      setQuantidade(1);
      //setFormaPagamento(1);
      setPagamentosParciais([]);
      setEntradaDinheiro("");
    } catch (error) {
      setStatusPedido(false)
      setMensagem(error.message)
    };
  }

  return (
    <div className={styles.container}>
      <ToastRadix mensagem={mensagem} />
      <Cabecalho />

      <main className={styles.main}>

        {/* LADO ESQUERDO */}
        <div className={styles.colunaEsquerda}>

          {/* CABEÇALHO (padrão obrigatório) */}
          <div className={styles.cabecalhoPage}>
            <div className={styles.tituloSection}>
              <div className={styles.iconeWrapper}>
                <ShoppingCartIcon size={22} weight="fill" />
              </div>
              <div>
                <p className={styles.pageSubtitulo}>Balcão</p>
                <h1 className={styles.pageTitulo}>Nova Venda</h1>
              </div>
            </div>

            {/* OPÇÃO SERÁ DISPONIVEL APENAS PARA USUÁRIO ADMIN */}
            {usuario?.nivelAcesso === 'ADMIN' &&
              <div className={styles.balcaoSelector}>
                <label className={styles.labelForm}>Balcão destino</label>
                <Select
                  classNamePrefix="custom"
                  options={balcaoOptions}
                  value={balcao}
                  onChange={setBalcao}
                  isSearchable={false}
                />
              </div>
            }
          </div>

          {/* CARD ADICIONAR PRODUTO */}
          <div className={styles.cardAdicionar}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <PlusCircleIcon size={17} weight="bold" className={styles.cardHeaderIcon} />
                <h2>Adicionar produto</h2>
              </div>
            </div>

            <div className={styles.formulario}>

              {/* SELECT DE PRODUTO */}
              <div className={styles.campo}>
                <label className={styles.label}>Produto</label>
                {carregando || options.length <= 0 ? (
                  <div className={styles.carregandoProduto}>
                    <SpinnerIcon size={16} weight="bold" className={styles.spinnerIcon} />
                    Carregando produtos...
                  </div>
                ) : (
                  <Select
                    classNamePrefix="custom"
                    options={options}
                    value={options.find((opt) => opt.value === produtoSelecionado?.id) || null}
                    onChange={(opt) => {
                      if (!opt) { setProdutoSelecionado(null); return; }
                      setProdutoSelecionado(produtos.find((p) => p.id === opt.value) ?? null);
                    }}
                    placeholder="Selecione ou digite..."
                    isSearchable
                    noOptionsMessage={() => "Nenhum produto encontrado"}
                    onKeyDown={handleEnter}
                  />
                )}
              </div>

              {/* INPUTS */}
              <div className={styles.linha}>
                {/* QUANTIDADE */}
                <div className={styles.campoMetade}>
                  <label className={styles.label}>Quantidade</label>
                  <input
                    type="number"
                    value={!produtoSelecionado ? 0 : quantidade}
                    onChange={(e) => { const v = parseInt(e.target.value) || 1; setQuantidade(v > 0 ? v : 1); }}
                    min="1"
                    className={styles.input}
                    disabled={!produtoSelecionado}
                  />
                </div>
                {/* PREÇO */}
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

              {/* TOTAL PRODUTO */}
              <div className={styles.campo}>
                <label className={styles.label}>Total do produto</label>
                <input
                  type="text"
                  value={produtoSelecionado ? `R$ ${totalProduto(produtoSelecionado.precoUndVenda, quantidade)}` : "R$ 0,00"}
                  readOnly
                  className={`${styles.input} ${styles.inputTotal}`}
                />
              </div>

              {/* BOTÃO ADICIONAR */}
              <button
                className={styles.botaoAdicionar}
                onClick={handleAddProduto}
                disabled={!produtoSelecionado}
              >
                <PlusCircleIcon size={18} weight="bold" />
                Adicionar ao cupom
              </button>
              {!nomeMaquina && usuario?.nivelAcesso !== 'ADMIN' &&
                <p className={styles.notificacaoNomeMaquina}>Este terminal ainda não possui um balcão cadastrado!</p>
              }

            </div>
          </div>

          {/* MASCOTE */}
          <div className={styles.mascote}>
            <img src={logo} alt="Logo" className={styles.logo} />
          </div>

        </div>

        {/* ── LADO DIREITO ── */}
        <div className={styles.colunaDireita}>

          {/* CUPOM */}
          <div className={styles.cardCupom}>

            {/* TÍTULOS DE LISTA */}
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <ReceiptIcon size={17} weight="bold" className={styles.cardHeaderIcon} />
                <h2>Cupom fiscal</h2>
              </div>
              <span className={styles.badge}>
                {cupom.length} {cupom.length === 1 ? "item" : "itens"}
              </span>
            </div>

            {/* LISTA */}
            <div className={styles.lista}>

              {/* LISTA VAZIA */}
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

          {statusPedido
            ?
            // RENDER LOADING...
            <div className={styles.enviandoPedido}>
              <Spinner />
              <p>Enviando pedido, aguarde um instante...</p>
              <span>Estabelecendo conexão com o banco de dados...</span>
            </div>
            :
            // RENDER FINALIZAR CUPOM...
            <>
              {/* DOCUMENTO, TOTAIS, FORMA DE PAGAMENTO E BOTÕES */}
              <div className={styles.cardResumo}>

                {/* CHECKBOX PARA ATIVAR IDENTIFICAÇÃO OPCIONAL */}
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

                {/* INPUT OPCIONAL IDENTIFICAÇÃO DE CLIENTE */}
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

                {/* TOTAIS DO CUPOM */}
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

                {/* ADICIONAR FORMA DE PAGAMENTO MULTIPLO! */}
                <div className={styles.campo}>
                    <div className={styles.campoMultiFormas}>

                      {/* VALOR */}
                      <div className={styles.campoMetade}>
                        <label className={styles.label}>
                          <CurrencyDollarIcon size={14} weight="bold" />
                          Valor
                        </label>
                        <input
                          type="number"
                          value={valorParcialFormaPagamento}
                          onChange={(e) => setValorParcialFormaPagamento(e.target.value)}
                          className={styles.input}
                        />
                      </div>

                      {/* FORMA PAGAMENTO */}
                      <div className={styles.campoMetade}>
                        <label className={styles.label}>
                          <WalletIcon size={14} weight="bold" />
                          Forma de pagamento
                        </label>

                        <select
                          value={idFormaPagamentoParcial}
                          onChange={(e) => {
                            const id = e.target.value;
                            setIdFormaPagamentoParcial(id);
                            setNomeFormaPagamentoParcial(listaFormaPagamento.find((f) => f.id === Number(id))?.nome || "");
                          }}
                          className={styles.select}
                        >
                          {listaFormaPagamento?.map((forma) => (
                            <option key={forma.id} value={forma.id}>{forma.nome}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* BOTÃO SALVAR FORMA DE PAGAMENTO PARCIAL */}
                    <AlertaRadix
                      titulo="Salvar pagamento"
                      descricao="Você realmente deseja salvar forma de pagamento?"
                      tratar={handleAddFormaPagamentoParcial}
                      confirmarTexto="Sim"
                      cancelarTexto="Sair"
                      trigger={
                        <button className={styles.botaoSalvarNovaFormaPagamento} disabled={!valorParcialFormaPagamento}>
                          <CheckCircleIcon size={16} weight="bold" />
                          Salvar pagamento
                        </button>
                      }
                    />

                    {/* LISTA DE FORMAS DE PAGAMENTOS */}
                    <div className={styles.cardCupom}>

                      {/* TÍTULOS DE LISTA */}
                      <div className={styles.cardHeader}>
                        <div className={styles.cardHeaderTitle}>
                          <WalletIcon size={17} weight="bold" className={styles.cardHeaderIcon} />
                          <h2>Formas de pagamentos adicionadas</h2>
                        </div>
                        <span className={styles.badge}>
                          {pagamentosParciais.length} {pagamentosParciais.length === 1 ? "item" : "formas"}
                        </span>
                      </div>

                      {/* LISTA */}
                      <div className={styles.lista}>

                        {/* LISTA VAZIA */}
                        {pagamentosParciais.length === 0
                          ?
                          (
                            <div className={styles.listaVazia}>
                              <PackageIcon size={40} weight="duotone" className={styles.iconeVazio} />
                              <p>Nenhuma forma de pagamento adicionada</p>
                              <span>Adicione formas de pagamento para finalizar a venda</span>
                            </div>
                          )
                          :
                          (
                            pagamentosParciais?.map((item, index) => (
                              <ItemListaPagamentosParcial
                                key={item.idFormaPagamentoParcial}
                                index={index}
                                pagamento={item}
                                onRemover={handleRemoverFormaPagamentoParcial} />
                            ))
                          )}
                      </div>

                    </div>

                    {/* TOTAIS */}
                    <div className={styles.totais}>
                      <div className={styles.linhaTotal}>
                        <span>Formas de pagamento</span>
                        <strong>{pagamentosParciais.length} {pagamentosParciais.length === 1 ? "forma de pagamento" : "formas de pagamentos"}</strong>
                      </div>
                      <div className={`${styles.linhaTotal} ${styles.totalFinal}`}>
                        <span>Total</span>
                        <strong className={styles.valorTotal}>{formatarMoeda(totalPedido)}</strong>
                      </div>
                    </div>

                    {/* RESTANTE / TROCO DOS PAGAMENTOS PARCIAIS */}
                    <div className={styles.trocoResult}>
                      <span className={styles.trocoLabel}>{trocoParcial < 0 ? "Falta" : "Troco"}</span>
                      <span className={trocoParcial < 0 ? styles.trocoValorNegativo : styles.trocoValor}>
                        {formatarMoeda(Math.abs(trocoParcial))}
                      </span>
                    </div>
                </div>

                {/* BOTÕES */}
                <div className={styles.botoesAcao}>
                  {/* CANCELAR */}
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
                  {/* GERAR PEDIDO */}
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
            </>
          }

        </div>
      </main>
      <Rodape />
    </div>
  );
}
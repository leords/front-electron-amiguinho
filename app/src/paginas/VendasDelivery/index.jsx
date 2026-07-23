import { useEffect, useMemo, useState} from "react";
import Select from "react-select";
import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import ItemListaPedido from "../../componentes/ItemListaPedido";
import { usarAuth } from "../../componentes/Context/authContext";
import { NovoPedidoBalcao } from "../../operadores/API/pedido/novoPedidoBalcao.js";
import { useProdutos } from "../../hooks/useProdutos.js";
import { AlertaRadix } from "../../componentes/ui/alerta/alerta";
import { usarToast } from "../../componentes/Context/toastContext";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";
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
  Motorcycle,
  CopySimpleIcon,
  HandCoinsIcon,
  ExclamationMarkIcon,
  ChatTeardropTextIcon,
  WarningCircleIcon,
  QuestionIcon,
  ArrowsClockwiseIcon,
  ArrowClockwiseIcon
} from "@phosphor-icons/react";
import Loading from "../../componentes/Loading";
import Spinner from "../../componentes/Spinner";
import { LerClienteDelivery } from "../../operadores/API/cliente/lerClienteDelivery";
import { useClientesDelivery } from "../../hooks/useClientesDelivery";
import { LerTaxaDelivery } from "../../operadores/API/taxaDelivery/lerInicioCaixa";
import { gerarCupomDelivery } from "../../utils/gerarCupomDelivery";
import ItemListaPedidoDelivery from "../../componentes/ItemListaPedidoDelivery";
import { useFormaPagamentoExterna } from "../../hooks/useFormaPagamentoExterna";
import { buscarPedido } from "../../operadores/API/pedido/buscarPedido";
import { dataFormatadaCalendario } from "../../utils/data";
import { tempoMedioEntregaDelivery } from "../../operadores/API/delivery/tempoMedioEntregaDelivery";

export default function VendasDelivery() {
  

  // Hooks
  const { usuario } = usarAuth();
  const { mensagem, setMensagem } = usarToast();
  const { produtos, carregando } = useProdutos();
  const { clientes, carregandoClientesDelivery } = useClientesDelivery();
  const { listaFormaPagamento } = useFormaPagamentoExterna();

  // Estados
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [clienteSelecionado, setClienteSelecionado] = useState(null)
  const [quantidade, setQuantidade] = useState(1);
  const [cupom, setCupom] = useState([]);
  const [formaPagamento, setFormaPagamento] = useState(1);
  const [nomeFormaPagamento, setNomeFormaPagamento] = useState("A VISTA");
  const [statusPedido, setStatusPedido] = useState(false)
  const [taxaEntrega, setTaxaEntrega] = useState("")
  const [ajusteTaxa, setAjusteTaxa] = useState(0)
  const [quantidadePedidos, setQuantidadePedidos] = useState(null)
  const [tempoEntrega, setTempoEntrega] = useState(null)
  const [carregandoClientes, setCarregando] = useState(false)
  const [controleNovoPedido, setControleNovopedido] = useState(false)
  const [ajustePrecoProduto, setAjustePrecoProduto] = useState("")
  const [atualizarRelatorio, setAtualizarRelatorio] = useState(false)


  
  // Valida existencia de usuário.
  if (!usuario) {
    window.location.href = "/";
  }

  // Buscando a taxa de delivery salva no banco
  useEffect(() => {
    const buscarTaxaEntrega = async () => {
      try {
        const resultado = await LerTaxaDelivery();
        if(!resultado) return
        setTaxaEntrega(resultado)
      } catch (error) {
        console.log(error)
      }
    }

    buscarTaxaEntrega()
  }, [controleNovoPedido])

  // Buscando se há ajuste realizado para taxa de entrega.
  useEffect(() => {
    const retornoAjusteTaxa = localStorage.getItem('adicionalTaxaDelivery');

    const valor = Number(retornoAjusteTaxa)

    if(retornoAjusteTaxa) {
      setAjusteTaxa(Number.isFinite(valor) ? valor : 0);
    }
  }, [])

  // Adiconar a taxa de entrega automaticamente em novo pedido.
  useEffect(() => {

    const adicionarTaxaEntregaPedido = async () => {


      const jaExiste = cupom.find((p) => p.nome === 'TAXA ENTREGA');
      if(jaExiste) return

      if(carregando) return

      if(!taxaEntrega) return

      // buscar o item taxa de entrega e passar o valor da taxa no banco + ajuste.
      const itemTaxaEntrega = produtos.find((p) => p.nome === 'TAXA ENTREGA');
        
      if(!itemTaxaEntrega) return 

        // Valor fixo taxa de entrega + ajuste
      const totalComtaxaEntrega = Number(taxaEntrega.valor || 0) + Number(ajusteTaxa || 0)

      // alterando o cupom e novo item do cupom com valor de taxa de entrega
      const cupomComTaxaEntrega = [
        ...cupom, 
        {
          ...itemTaxaEntrega,
          precoUndVenda: totalComtaxaEntrega,
          precoVenda: totalComtaxaEntrega,
          quantidade: 1,
        }
      ]

      setCupom(cupomComTaxaEntrega)
    }

    adicionarTaxaEntregaPedido()
  }, [carregando, ajusteTaxa, taxaEntrega, controleNovoPedido])

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

  // Mapeando clientes delivery para ser utilizado no componentes <Select />
  const listaClientesDelivery = clientes.map((p) => ({ value: p.id, label: p.nome }));

  // Remove produto
  const handleRemoveProduto = (id) => setCupom(cupom.filter((item) => item.id !== id));

  // Adiciona produto
  const handleAddProduto = () => {

    // Valida os campos de produto e quantidade
    if (!produtoSelecionado || quantidade === 0 || quantidade < 0.5) {
      setProdutoSelecionado(null)
      setMensagem("Selecione um produto e quantidade válida!");
      return;
    }

    // Valida existencia do produto em estoque antes de adicionar.
    if(produtoSelecionado.estoque < quantidade) {
      setProdutoSelecionado(null)
      setMensagem(`Estoque insuficiente. Disponível: ${produtoSelecionado.estoque} unidades.`)
      return
    }


    // preço de venda + reajuste?
    const precoFinal =  Number(produtoSelecionado.precoVenda) + Number(ajustePrecoProduto || 0);
   
    // Valida a existencia do item no cupom
    const itemExistente = cupom.find((i) => i.id === produtoSelecionado.id && i.precoVenda === precoFinal);

    // Criando o cupom novo
    const novoCupom = itemExistente
      ? cupom.map((i) => i.id === produtoSelecionado.id && i.precoVenda === precoFinal ? { ...i, quantidade: i.quantidade + quantidade } : i)
      : [...cupom, { ...produtoSelecionado, quantidade, precoVenda: precoFinal }];

    setCupom(novoCupom);
    setProdutoSelecionado(null);
    setQuantidade(1);
    setAjustePrecoProduto("")
    //inputProduto.current.focus();
  };

  // Realiza as somas dos produtos
  const totalProduto = (preco, qtd) => (preco * qtd).toFixed(2);
  const totalPedido = cupom.reduce((acc, item) => acc + item.precoVenda * item.quantidade, 0).toFixed(2);
  const quantidadeTotal = cupom.reduce((acc, item) => acc + item.quantidade, 0);
  

  // Cancela o pedido 
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

  // finaliza o pedido, imprime e envia para o backend
  const handleGerarPedido = async () => {
    if (cupom.length === 0) { alert("Adicione produtos ao cupom antes de gerar o pedido!"); return; }
    if (!formaPagamento) { alert("Selecione a forma de pagamento!"); return; }

    try {
      setStatusPedido(true)
    // Criando o pedido
    const pedido = {
      cliente: clienteSelecionado?.id || "", //
      formaPagamentoId: formaPagamento, //
      vendedor: usuario.nome, //
      usuarioId: usuario.id,
      itens: cupom.map((item) => ({ produtoId: item.id, quantidade: item.quantidade, valorUnit: item.precoVenda })),
    };

    // Criando o pedido para impressão
    const pedidoImprimir = {
      cliente: clienteSelecionado?.nome || "",
      endereco: ` ${clienteSelecionado?.endereco}, ${clienteSelecionado?.numero} - ${clienteSelecionado?.bairro} `,
      cidade: clienteSelecionado?.cidade,
      telefone: clienteSelecionado?.telefone,
      referencia: clienteSelecionado?.referencia,
      formaPagamento: nomeFormaPagamento,
      vendedor: clienteSelecionado?.id,
      nomeUsuario: usuario.nome,
      itens: cupom.map((item) => ({ produtoId: item.id, nome: item.nome, quantidade: item.quantidade, valorUnit: item.precoVenda })),
    };

    // Enviando o pedido para o banco
    const retornoAPI = await NovoPedidoBalcao("delivery", pedido);
    window.IMPRESSORA.imprimir(gerarCupomDelivery(pedidoImprimir));
    localStorage.setItem("adicionalTaxaDelivery", 0)
    setStatusPedido(false)
    setMensagem(`${retornoAPI.mensagem}! Aguarde a impressão do comprovante.`);
    
 
    setCupom([]);
    setProdutoSelecionado(null);
    setClienteSelecionado(null)
    setQuantidade(1);
    setFormaPagamento(1);

    setControleNovopedido(prev => !prev)


    } catch (error) {
      console.log(error.message)  
      setStatusPedido(false)                
      setMensagem(error.message)
    };
  }

  // Buscando tempo médio de entrega, preparação, médio total e quantidade
  useEffect(() => {
    const buscarRelatorio = async () => {
      try {
        const relatorio = await tempoMedioEntregaDelivery({
          dataInicio: dataFormatadaCalendario(new Date),
          dataFim: dataFormatadaCalendario(new Date) 
        });

      setTempoEntrega(relatorio)

      } catch (error) {
        console.log(error)
      }
    }


    buscarRelatorio();
  }, [atualizarRelatorio])


  // Busca a quantidade de pedido por status.
  useEffect(() => {

    const buscarPedidos = async () => {
      setCarregando(true);
      try {
        const resultado = await buscarPedido({
          setor: 'delivery',
          dataInicio: dataFormatadaCalendario(new Date()),
          dataFim: dataFormatadaCalendario(new Date()),
        });
        setQuantidadePedidos(resultado);
      } catch (error) {
          console.error("Erro ao filtrar pedidos:", error);
          alert("Erro ao buscar pedidos. Tente novamente.");
        } finally {
          setCarregando(false);
        }        
    }
    buscarPedidos();
  }, [controleNovoPedido, atualizarRelatorio])

  const resumo = useMemo(() => ({
    cancelado: quantidadePedidos?.filter(p => p.status === "cancelado").length,
    pendente: quantidadePedidos?.filter(p => p.status === "pendente").length,
    entregue: quantidadePedidos?.filter(p => p.status === "entregue").length,
    carregado: quantidadePedidos?.filter(p => p.status === "carregado").length,
  }), [quantidadePedidos]);


  return (
    <div className={styles.container}>
      <ToastRadix mensagem={mensagem} />
      <Cabecalho />

      <main className={styles.main}>

        {/* CABEÇALHO E MASCOTE */}
        <div className={styles.containerTituloLogo}>

          {/* CABEÇALHO */}
          <div className={styles.cabecalhoPage}>
            <div className={styles.iconeWrapper}>
              <Motorcycle size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Delivery</p>
              <h1 className={styles.pageTitulo}>Nova Venda</h1>
            </div>
          </div>

          {/* CONTROLE DE STATUS DE PEDIDOS */}
          {carregandoClientes 
          ?
            <Spinner />
          :
            <div className={styles.containerPedidos}>
              <div className={styles.containerPedidosHeader}>
                <p className={styles.cardLabel}>Relatório de pedidos do dia</p>
                <div 
                  className={styles.reload}
                  onClick={() => setAtualizarRelatorio(prev => !prev)}
                  title="Atualizar relatório"
                >
                  <ArrowClockwiseIcon 
                    size={18} 
                    weight="bold" 
                    color="green" 
                  />
                </div>
              </div>

              <div className={styles.containerContagemPedidos}>
                <label className={styles.labelContagem}>
                  ⚠️ Pendentes: {resumo.pendente ? resumo.pendente : 0}
                </label>
                <label className={styles.labelContagem}>
                  ⬆️ Carregado: {resumo.carregado ? resumo.carregado : 0}
                </label>
                <label className={styles.labelContagem}>
                  ✅ Entregue: {resumo.entregue ? resumo.entregue  : 0}
                </label>
                <label className={styles.labelContagem}>
                  ❌ Cancelado: {resumo.cancelado ? resumo.cancelado : 0}
                </label>
                <label className={styles.labelContagem}>
                  📋 Total: {tempoEntrega?.totalPedidos ? tempoEntrega?.totalPedidos : 0}
                </label>
              </div>

              <p className={styles.TempoLabel}></p>

              <div className={styles.containerTempoMedio}>
                <label className={styles.labelTempoMedio}>
                  📦 Preparação: {tempoEntrega?.tempoMedioPreparacao ? `${tempoEntrega?.tempoMedioPreparacao} min` : `${0} min`}
                </label>
                <label className={styles.labelTempoMedio}>
                  🚚 Deslocamento: {tempoEntrega?.tempoMedioEntrega ? `${tempoEntrega?.tempoMedioEntrega} min` : `${0} min`}
                </label>
                <label className={styles.labelTempoMedio}>
                  🕒 Entrega: {tempoEntrega?.tempoMedioTotal ? `${tempoEntrega?.tempoMedioTotal} min`  : `${0} min`}
                </label>
              </div>
            </div>
          }
          
          

          {/* CARD TAXA DE ENTREGA */}
          <div className={styles.card}>
            <div className={styles.cardIcone}>
              <CurrencyDollarIcon size={20} weight="fill" />
            </div>
            <div>
              <p className={styles.cardLabel}>Taxa de entrega</p>
              <strong className={styles.cardValor}>{formatarMoeda(taxaEntrega.valor + ajusteTaxa)} {ajusteTaxa > 0 ? <span className={styles.ajuste} title="Taxa de entrega com ajuste do ADM!"> <HandCoinsIcon size={20} weight="duotone" color="green"/> </span> : ""} </strong>
            </div>
          </div>
          
        </div>

        {/* CARD NOVO PEDIDO */}
        <div className={styles.centro}>

          {/* LADO ESQUERDO */}
          <div className={styles.colunaEsquerda}>
            <div className={styles.containerCliente}>

              {/* TITULO */} 
              <div className={styles.balcaoSelector}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderTitle}>
                    <PlusCircleIcon size={17} weight="bold" className={styles.cardHeaderIcon} />
                    <h2>Adicionar cliente</h2>
                  </div>
                </div>
              </div>

              {/* DADOS DO CLIENTE */} 
              <div className={styles.dadosCliente}>

                {/* SELECIONAR CLIENTE */}
                <div className={styles.campoMetade}>
                    <label className={styles.label}>Cliente</label>
                    {carregandoClientesDelivery 
                    ? 
                    (
                      <div className={styles.carregandoProduto}>
                        <SpinnerIcon size={16} weight="bold" className={styles.spinnerIcon} />
                        Carregando clientes...
                      </div>
                    )
                    :
                    (
                      <Select
                        classNamePrefix="custom"
                        options={listaClientesDelivery}
                        value={listaClientesDelivery.find((cliente) => cliente.value === clienteSelecionado?.id) || null }
                        onChange={(cliente) => {
                          if(!cliente) { setClienteSelecionado(null); return }

                          setClienteSelecionado(clientes.find((c) => c.id === cliente.value) ?? null)
                        }}
                        placeholder="Selecione ou digite..."
                        isSearchable
                        noOptionsMessage={() => "Nenhum cliente encontrado"}
                        onKeyDown={handleEnter}
                      />
                    )
                  }
                </div>

                <div className={styles.informativoCliente}>
                  {/* ID */}
                  <div className={styles.campoMetade}>
                    <label className={styles.label}>ID</label>
                    <input
                      type="text"
                      value={clienteSelecionado ? clienteSelecionado?.id : ""}
                      readOnly
                      className={`${styles.input} ${styles.inputReadonly}`}
                    />
                  </div>

                  {/* ENDEREÇO */}
                  <div className={styles.campoMetade}>
                    <label className={styles.label}>Endereço</label>
                    <input
                      type="text"
                      value={clienteSelecionado ? `R. ${clienteSelecionado?.endereco}, ${clienteSelecionado?.numero} - ${clienteSelecionado?.bairro}, ${clienteSelecionado?.cidade}` : ""}
                      readOnly
                      className={`${styles.input} ${styles.inputReadonly}`}
                      title={clienteSelecionado?.endereco}
                    />
                  </div>

                  {/* TELEFONE */}
                  <div className={styles.campoMetade}>
                    <label className={styles.label}>Telefone</label>
                    <input
                      type="text"
                      value={clienteSelecionado ? clienteSelecionado?.telefone : ""}
                      readOnly
                      className={`${styles.input} ${styles.inputReadonly}`}
                      title={clienteSelecionado?.telefone}
                    />
                  </div>
                </div>

              </div> 

            </div>
        
            {/* ADICIONAR PRODUTO */}
            <div className={styles.cardAdicionar}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderTitle}>
                  <PlusCircleIcon size={17} weight="bold" className={styles.cardHeaderIcon} />
                  <h2>Adicionar produto</h2>
                </div>
                  <div className={styles.informaticoSeq} title="O cadastro do mesmo produto com preços distintos deve ser feito sequencialmente.">
                    <QuestionIcon size={19} weight="duotone" color="gray"/>
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
                      //ref={inputProduto}
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
                      onChange={(e) => setQuantidade(e.target.value)}
                      onBlur={() => {
                        let v = parseFloat(quantidade);

                        if (isNaN(v) || v < 0.5) {
                          v = 0.5;
                        }

                        // Arredonda para o múltiplo de 0.5 mais próximo
                        v = Math.round(v * 2) / 2;

                        setQuantidade(v);
                      }}
                      min="0.5"
                      step="0.5"
                      className={styles.input}
                      disabled={!produtoSelecionado}
                    />
                  </div>



                  {/* PREÇO */}
                  <div className={styles.campoMetade}>
                    <label className={styles.label}>Preço unitário</label>
                    <input
                      type="text"
                      value={produtoSelecionado ? `R$ ${( Number(produtoSelecionado.precoVenda) + Number(ajustePrecoProduto) || 0).toFixed(2)}` : "R$ 0,00"}
                      readOnly
                      className={`${styles.input} ${styles.inputReadonly}`}
                    />
                  </div>

                  {/* DESCONTO - ACESSO ADM */}
                  {usuario.nivelAcesso === 'ADMIN'
                  &&
                  <div className={styles.campoMetade}>
                    <label className={styles.label}>Ajuste R$</label>
                    <input
                      type="number"
                      value={ajustePrecoProduto}
                      onChange={(e) => setAjustePrecoProduto(e.target.value)}
                      className={styles.input}
                      title="Ajuste de preço final do produto"
                    />
                  </div>
                  
                } 
                </div>

                {/* TOTAL PRODUTO */}
                <div className={styles.campo}>
                  <label className={styles.label}>Total do produto</label>
                  <input
                    type="text"
                    value={produtoSelecionado ? `R$ ${totalProduto(Number(produtoSelecionado.precoVenda) + Number(ajustePrecoProduto || 0), quantidade)}` : "R$ 0,00"}
                    readOnly
                    className={`${styles.input} ${styles.inputTotal}`}
                  />
                </div>

                {/* BOTÃO ADICIONAR */}
                { ajustePrecoProduto 
                ?
                (
                  <AlertaRadix
                    titulo={`Desconto no produto ${produtoSelecionado?.nome} ?`}
                    descricao={`Você realmente deseja adicionar o produto ao cupom com desconto de ${formatarMoeda(ajustePrecoProduto)}?`}
                    tratar={handleAddProduto}
                    confirmarTexto="Sim, adicionar produto!"
                    cancelarTexto="Não"
                    trigger={
                      <button
                        className={styles.botaoAdicionar}
                        disabled={!produtoSelecionado || !clienteSelecionado || !quantidade}
                      >
                        <PlusCircleIcon size={18} weight="bold" />
                        Adicionar ao cupom
                      </button>
                    }
                  />
                )
                :
                (
                  <button
                    className={styles.botaoAdicionar}
                    onClick={handleAddProduto}
                    disabled={!produtoSelecionado || !clienteSelecionado || !quantidade }
                  >
                    <PlusCircleIcon size={18} weight="bold" />
                    Adicionar ao cupom
                  </button>
                ) 
              }


              </div>
            </div>
          </div>

          {/* LADO DIREITO */}
          <div className={styles.colunaDireita}>

            {/* CUPOM */}
            <div className={styles.cardCupom}>

              {/* TÍTULOS DE LISTA */}
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderTitle}>
                  <ReceiptIcon size={17} weight="bold" className={styles.cardHeaderIcon} />
                  <h2>Cupom fiscal</h2>
                </div>
                <div className={styles.titleCupomFiscal}>
                  <span className={styles.badge}>
                    {cupom.length} {cupom.length === 1 ? "item" : "itens"}
                  </span>
                  {/* VAI COPIAR O PEDIDO PARA PODER ENVIAR PARA O WPP. */}
                  <div title="Copiar pedido">
                    <CopySimpleIcon size={22} weight="duotone" color="gray"/>
                  </div>
                </div>
              </div>

              {/* LISTA VAZIA */}
              <div className={styles.lista}>
                {cupom.length === 0 ? (
                  <div className={styles.listaVazia}>
                    <PackageIcon size={40} weight="duotone" className={styles.iconeVazio} />
                    <p>Nenhum produto adicionado</p>
                    <span>Selecione produtos para iniciar a venda</span>
                  </div>
                ) : (
                  // LISTA
                  
                  cupom.map((item) => (
                    <ItemListaPedidoDelivery key={`${item.id}-${item.precoVenda}`} produto={item} onRemover={handleRemoveProduto} />
                  ))
                )}
              </div>

            </div>

            {
            statusPedido 
            ?
            // LOADING
            <div className={styles.enviandoPedido}> 
              <Spinner />
                <p>Enviando pedido, aguarde um instante...</p>
                <span>Estabelecendo conexão com o banco de dados...</span>
            </div>
            :
            <>
              {/* DOCUMENTO, TOTAIS, FORMA DE PAGAMENTO E BOTÕES */}
              <div className={styles.cardResumo}>
                {/* TOTAIS */}
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

                {/* FORMA DE PAGAMENTO */}
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
        </div>

      </main>
      <Rodape />
    </div>
  );
}
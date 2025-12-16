import { useState, useEffect } from "react";
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

export default function Vendas() {
  const [nome, setNome] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const [cupom, setCupom] = useState([]);
  const [formaPagamento, setFormaPagamento] = useState(1);
  const [abrirOpcaoNome, setAbrirOpcaoNome] = useState(false);
  const [nomeFormaPagamento, setNomeFormaPagamento] = useState("");

  const { usuario } = usarAuth();
  const { produtos, carregando, erro } = useProdutos();
  const {
    listaFormaPagamento,
    carregandoFormasPagamento,
    erroHookFormaPagamento,
  } = useFormaPagamento();

  if (!usuario) {
    window.location.href = "/";
  }
  // criando a lista de opções a partir de produtos
  const options = produtos.map((p) => ({
    value: p.id,
    label: p.nome,
  }));

  // Remover produto
  const handleRemoveProduto = (id) => {
    const novoCupom = cupom.filter((item) => item.id !== id);
    setCupom(novoCupom);
  };

  // Validar ao adicionar
  const handleAddProduto = () => {
    if (!produtoSelecionado || quantidade <= 0) {
      alert("Selecione um produto e quantidade válida!");
      return;
    }
    // Se existir incrementar quantidade
    const itemExistente = cupom.find((i) => i.id === produtoSelecionado.id);
    let novoCupom;

    if (itemExistente) {
      novoCupom = cupom.map((i) =>
        i.id === produtoSelecionado.id
          ? { ...i, quantidade: i.quantidade + quantidade }
          : i
      );
    } else {
      novoCupom = [...cupom, { ...produtoSelecionado, quantidade }];
    }

    setCupom(novoCupom);
    setProdutoSelecionado(null);
    setQuantidade(1);
  };

  // Função para somar quantidade * preço
  const totalProduto = (preco, qtd) => (preco * qtd).toFixed(2);

  // Soma o total do cupom
  const totalPedido = cupom
    .reduce((acc, item) => acc + item.precoUndVenda * item.quantidade, 0)
    .toFixed(2);

  // Soma a quantidade
  const quantidadeTotal = cupom.reduce((acc, item) => acc + item.quantidade, 0);

  // Cancela o cupom
  const handleCancelarPedido = () => {
    if (cupom.length > 0) {
      const confirmar = window.confirm(
        "Deseja realmente cancelar o pedido? Todos os itens serão removidos."
      );
      if (!confirmar) return;
    }
    setCupom([]);
    setProdutoSelecionado(null);
    setQuantidade(1);
    setFormaPagamento("");
  };

  // Gerar pedido
  const handleGerarPedido = async () => {
    if (cupom.length === 0) {
      alert("Adicione produtos ao cupom antes de gerar o pedido!");
      return;
    }
    if (!formaPagamento) {
      alert("Selecione a forma de pagamento!");
      return;
    }

    // Este pedido neste formato será enviado ao backend
    const pedido = {
      cliente: nome || "",
      formaPagamentoId: formaPagamento,
      vendedor: "b1",
      nomeUsuario: usuario.nome,
      usuarioId: usuario.id,
      itens: cupom.map((item) => ({
        produtoId: item.id,
        quantidade: item.quantidade,
        valorUnit: item.precoUndVenda,
      })),
    };

    const pedidoImprimir = {
      cliente: nome || "",
      formaPagamento: nomeFormaPagamento,
      vendedor: "Balcão 1",
      nomeUsuario: usuario.nome,
      itens: cupom.map((item) => ({
        produtoId: item.id,
        nome: item.nome,
        quantidade: item.quantidade,
        valorUnit: item.precoUndVenda,
      })),
    };

    const retornoAPI = await NovoPedidoBalcao("balcao", pedido);
    const html = gerarCupom(pedidoImprimir);

    window.IMPRESSORA.imprimir(html);

    alert(retornoAPI.mensagem);

    // Resetar formulário
    setNome("");
    setCupom([]);
    setProdutoSelecionado(null);
    setQuantidade(1);
    setFormaPagamento("");
  };

  return (
    <div className={styles.container}>
      <Cabecalho />

      <main className={styles.main}>
        {/* LADO ESQUERDO - ADICIONAR PRODUTOS */}
        <div className={styles.containerContador}>
          <h1>Nova Venda</h1>

          <div className={styles.contador}>
            <h1>Adicionar Produto</h1>
            <div className={styles.formulario}>
              {/* SELECIONAR PRODUTO */}
              {carregando ? (
                <p>Carregando...</p>
              ) : (
                <div className={styles.campo}>
                  <label>Produto</label>
                  <Select
                    classNamePrefix="custom"
                    options={options}
                    value={
                      options.find(
                        (opt) => opt.value === produtoSelecionado?.id
                      ) || null
                    }
                    onChange={(opt) =>
                      setProdutoSelecionado(
                        produtos.find((p) => p.id === opt.value)
                      )
                    }
                    placeholder="Selecione ou digite..."
                    isSearchable
                    noOptionsMessage={() => "Nenhum produto encontrado"}
                  />
                </div>
              )}

              {/* LINHA COM QUANTIDADE E PREÇO */}
              <div className={styles.linha}>
                <div className={styles.campoMetade}>
                  <label>Quantidade</label>
                  <input
                    type="number"
                    value={quantidade}
                    onChange={(e) => {
                      const valor = parseInt(e.target.value) || 1;
                      setQuantidade(valor > 0 ? valor : 1);
                    }}
                    min="1"
                  />
                </div>

                <div className={styles.campoMetade}>
                  <label>Preço unitário</label>
                  <input
                    type="text"
                    value={
                      produtoSelecionado
                        ? `R$ ${Number(
                            produtoSelecionado.precoUndVenda || 0
                          ).toFixed(2)}`
                        : "R$ 0,00"
                    }
                    readOnly
                  />
                </div>
              </div>

              {/* TOTAL DO PRODUTO */}
              <div className={styles.campo}>
                <label>Total do produto</label>
                <input
                  type="text"
                  className={styles.inputTotal}
                  value={
                    produtoSelecionado
                      ? `R$ ${totalProduto(
                          produtoSelecionado.precoUndVenda,
                          quantidade
                        )}`
                      : "R$ 0,00"
                  }
                  readOnly
                />
              </div>

              {/* BOTÃO ADICIONAR */}
              <button
                className={styles.botaoAdicionar}
                onClick={handleAddProduto}
                disabled={!produtoSelecionado}
              >
                Adicionar ao Cupom
              </button>
            </div>
          </div>

          {/* MASCOTE */}
          <div className={styles.mascote}>
            <img
              src={logo}
              alt="Amigão Distribuidora de Bebidas"
              className={styles.logo}
            />
          </div>
        </div>

        {/* LADO DIREITO - CUPOM E RESUMO */}
        <div className={styles.containerTotal}>
          {/* CUPOM */}
          <div className={styles.cupomContainer}>
            <div className={styles.cupomHeader}>
              <h2>Cupom Fiscal</h2>
              <span className={styles.badge}>
                {cupom.length} {cupom.length === 1 ? "item" : "itens"}
              </span>
            </div>

            {/* LISTA DE PRODUTOS */}
            <div className={styles.lista}>
              {cupom.length === 0 ? (
                <div className={styles.listaVazia}>
                  <p>Nenhum produto adicionado</p>
                  <p className={styles.textoSecundario}>
                    Selecione produtos para iniciar a venda
                  </p>
                </div>
              ) : (
                cupom.map((item) => (
                  <ItemListaPedido
                    key={item.id}
                    produto={item}
                    onRemover={handleRemoveProduto}
                  />
                ))
              )}
            </div>
          </div>

          {/* RESUMO E PAGAMENTO */}
          <div className={styles.resumo}>
            {/* TOTAIS */}
            <div className={styles.totais}>
              <div className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={abrirOpcaoNome}
                  onChange={(e) => setAbrirOpcaoNome(e.target.checked)}
                />
                <label>adicionar documento</label>
              </div>

              {abrirOpcaoNome ? (
                <div className={styles.campoNome}>
                  <label>Documento de identificação</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => {
                      setNome(e.target.value);
                    }}
                    placeholder="CPF ou CNPJ"
                  />
                </div>
              ) : (
                <></>
              )}
              <div className={styles.linhaTotal}>
                <span>Quantidade total:</span>
                <strong>
                  {quantidadeTotal}{" "}
                  {quantidadeTotal === 1 ? "unidade" : "unidades"}
                </strong>
              </div>
              <div className={styles.linhaTotal}>
                <span>Subtotal:</span>
                <strong>
                  {parseFloat(totalPedido).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </strong>
              </div>
              <div className={`${styles.linhaTotal} ${styles.totalFinal}`}>
                <span>TOTAL:</span>
                <strong>
                  {parseFloat(totalPedido).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </strong>
              </div>
            </div>

            {/* FORMA DE PAGAMENTO */}
            <div className={styles.pagamento}>
              <label>Forma de Pagamento</label>
              <select
                value={formaPagamento}
                onChange={(e) => {
                  const id = e.target.value;

                  setFormaPagamento(id);

                  const nome =
                    listaFormaPagamento.find((forma) => forma.id === Number(id))
                      ?.nome || "";

                  setNomeFormaPagamento(nome);
                }}
                className={styles.selectPagamento}
              >
                {listaFormaPagamento?.map((forma) => (
                  <option key={forma.value} value={forma.id}>
                    {forma.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className={styles.botoesAcao}>
              <button
                className={styles.botaoCancelar}
                onClick={handleCancelarPedido}
              >
                Cancelar Pedido
              </button>
              <button
                className={styles.botaoGerar}
                onClick={handleGerarPedido}
                disabled={cupom.length === 0}
              >
                Gerar Pedido
              </button>
            </div>
          </div>
        </div>
      </main>

      <Rodape />
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import { usarAuth } from "../../componentes/Context/authContext";
import { usarToast } from "../../componentes/Context/toastContext";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";
import { AlertaRadix } from "../../componentes/ui/alerta/alerta";
import { formatarMoeda } from "../../utils/formartarMoeda";
import {
  Storefront,
  PlusCircleIcon,
  ReceiptIcon,
  CurrencyDollarIcon,
  TrashIcon,
  CheckCircleIcon,
  UserIcon,
  PackageIcon,
  SpinnerIcon,
  ArrowClockwiseIcon,
  IdentificationCardIcon,
  MapPinIcon,
  PhoneIcon,
  BuildingsIcon,
  WalletIcon,
} from "@phosphor-icons/react";
import Spinner from "../../componentes/Spinner";
import ItemListaPedidoDelivery from "../../componentes/ItemListaPedidoDelivery";
import { useProdutos } from "../../hooks/useProdutos";
import { useClientesExterno } from "../../hooks/useClientesExterno";
import { useFormaPagamentoExterna } from "../../hooks/useFormaPagamentoExterna";
import { NovoPedidoExterno } from "../../operadores/API/pedido/novoPedidoExterno";
import { BuscarClienteExterno } from "../../operadores/API/cliente/buscarClienteExterno";

export default function PedidoExterno() {
  // Hooks de contexto e dados
  const { usuario } = usarAuth();
  const { mensagem, setMensagem } = usarToast();
  const { produtos, carregando: carregandoProdutos } = useProdutos();
  const {
    clientes,
    carregando: carregandoClientes,
    recarregarClientes,
  } = useClientesExterno();
  const {
    listaFormaPagamento,
    carregandoFormasPagamento,
  } = useFormaPagamentoExterna();

  // Estados do formulário
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const [ajustePrecoProduto, setAjustePrecoProduto] = useState("");
  const [cupom, setCupom] = useState([]);
  const [formaPagamento, setFormaPagamento] = useState(1);
  const [vendedor, setVendedor] = useState("");
  const [statusPedido, setStatusPedido] = useState(false);
  const [carregandoSincronizacao, setCarregandoSincronizacao] = useState(false);

  // Redireciona caso não haja usuário logado
  if (!usuario) {
    window.location.href = "/";
  }

  // Preenche a forma de pagamento padrão ao carregar a lista
  useEffect(() => {
    if (listaFormaPagamento && listaFormaPagamento.length > 0 && !formaPagamento) {
      setFormaPagamento(listaFormaPagamento[0].id);
    }
  }, [listaFormaPagamento, formaPagamento]);

  // Atualiza o vendedor padrão ao selecionar o cliente
  useEffect(() => {
    if (clienteSelecionado) {
      setVendedor(clienteSelecionado.vendedor || usuario?.nome || "");
    }
  }, [clienteSelecionado, usuario]);

  // Forçar sincronização de clientes externos
  const handleSincronizarClientes = async () => {
    setCarregandoSincronizacao(true);
    try {
      await BuscarClienteExterno();
      await recarregarClientes();
      setMensagem("Clientes externos sincronizados com sucesso!");
    } catch (error) {
      console.error("Erro ao sincronizar clientes externos:", error);
      setMensagem(error.message || "Erro ao sincronizar clientes.");
    } finally {
      setCarregandoSincronizacao(false);
    }
  };

  // Mapeamento de clientes para o react-select com busca inteligente (Nome ou CNPJ)
  const opcoesClientes = useMemo(() => {
    return (clientes || []).map((cliente) => ({
      value: cliente.id,
      label: `${cliente.nome} ${cliente.cnpj ? `(CNPJ: ${cliente.cnpj})` : ""}`,
      cliente,
    }));
  }, [clientes]);

  // Mapeamento de produtos para o react-select
  const opcoesProdutos = useMemo(() => {
    return (produtos || []).map((prod) => ({
      value: prod.id,
      label: `${prod.nome} — R$ ${Number(prod.precoVenda || prod.precoUndVenda || 0).toFixed(2)}`,
      produto: prod,
    }));
  }, [produtos]);

  // Filtro personalizado de clientes (busca por nome ou dígitos de CNPJ)
  const filtrarCliente = (option, rawInput) => {
    if (!rawInput) return true;
    const termo = rawInput.toLowerCase().trim();
    const termoNumeros = rawInput.replace(/\D/g, "");

    const nome = option.data.cliente?.nome?.toLowerCase() || "";
    const cnpj = option.data.cliente?.cnpj || "";
    const cnpjNumeros = cnpj.replace(/\D/g, "");
    const cidade = option.data.cliente?.cidade?.toLowerCase() || "";
    const vendedorCli = option.data.cliente?.vendedor?.toLowerCase() || "";

    const matchNome = nome.includes(termo);
    const matchCidade = cidade.includes(termo);
    const matchVendedor = vendedorCli.includes(termo);
    const matchCnpj =
      cnpj.toLowerCase().includes(termo) ||
      (termoNumeros.length > 0 && cnpjNumeros.includes(termoNumeros));

    return matchNome || matchCnpj || matchCidade || matchVendedor;
  };

  // Preço unitário calculado (preço base + eventual ajuste de preço)
  const precoUnitarioCalculado = useMemo(() => {
    if (!produtoSelecionado) return 0;
    const base = Number(
      produtoSelecionado.precoVenda || produtoSelecionado.precoUndVenda || 0
    );
    const ajuste = Number(ajustePrecoProduto || 0);
    return base + ajuste;
  }, [produtoSelecionado, ajustePrecoProduto]);

  // Total do produto selecionado
  const totalItemCalculado = useMemo(() => {
    return (precoUnitarioCalculado * Number(quantidade || 0)).toFixed(2);
  }, [precoUnitarioCalculado, quantidade]);

  // Totais do pedido
  const totalPedido = useMemo(() => {
    return cupom
      .reduce((acc, item) => acc + Number(item.precoVenda) * Number(item.quantidade), 0)
      .toFixed(2);
  }, [cupom]);

  const quantidadeTotalItens = useMemo(() => {
    return cupom.reduce((acc, item) => acc + Number(item.quantidade), 0);
  }, [cupom]);

  // Adicionar produto ao cupom
  const handleAddProduto = () => {
    if (!produtoSelecionado) {
      setMensagem("Selecione um produto antes de adicionar!");
      return;
    }

    const qtdNumerica = parseFloat(quantidade);
    if (isNaN(qtdNumerica) || qtdNumerica <= 0) {
      setMensagem("Informe uma quantidade válida!");
      return;
    }

    // Validação de estoque se habilitado
    if (
      localStorage.getItem("validaEstoque") === "true" &&
      produtoSelecionado.estoque < qtdNumerica
    ) {
      setMensagem(
        `Estoque insuficiente. Disponível: ${produtoSelecionado.estoque} unidades.`
      );
      return;
    }

    const precoFinal = precoUnitarioCalculado;

    // Verifica se item já existe no cupom com o mesmo preço
    const itemExistente = cupom.find(
      (item) => item.id === produtoSelecionado.id && item.precoVenda === precoFinal
    );

    const novoCupom = itemExistente
      ? cupom.map((item) =>
          item.id === produtoSelecionado.id && item.precoVenda === precoFinal
            ? { ...item, quantidade: item.quantidade + qtdNumerica }
            : item
        )
      : [
          ...cupom,
          {
            ...produtoSelecionado,
            quantidade: qtdNumerica,
            precoVenda: precoFinal,
          },
        ];

    setCupom(novoCupom);
    setProdutoSelecionado(null);
    setQuantidade(1);
    setAjustePrecoProduto("");
  };

  // Remover produto do cupom
  const handleRemoveProduto = (id) => {
    setCupom(cupom.filter((item) => item.id !== id));
  };

  // Cancelar pedido e limpar campos
  const handleCancelarPedido = () => {
    setCupom([]);
    setProdutoSelecionado(null);
    setClienteSelecionado(null);
    setQuantidade(1);
    setAjustePrecoProduto("");
    setVendedor("");
    if (listaFormaPagamento && listaFormaPagamento.length > 0) {
      setFormaPagamento(listaFormaPagamento[0].id);
    }
  };

  // Confirmar e enviar novo pedido externo
  const handleConfirmarPedido = async () => {
    if (!clienteSelecionado) {
      setMensagem("Selecione um cliente externo para continuar!");
      return;
    }

    if (cupom.length === 0) {
      setMensagem("Adicione ao menos um produto ao cupom antes de gerar o pedido!");
      return;
    }

    if (!formaPagamento) {
      setMensagem("Selecione uma forma de pagamento válida!");
      return;
    }

    try {
      setStatusPedido(true);

      const formaPagamentoIdNumerico = Number(formaPagamento);
      const clienteIdNumerico = Number(clienteSelecionado.id);
      const vendedorNome = vendedor || clienteSelecionado.vendedor || usuario.nome;

      const novoUuid =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
              const r = (Math.random() * 16) | 0;
              const v = c === "x" ? r : (r & 0x3) | 0x8;
              return v.toString(16);
            });

      const payload = {
        uuid: novoUuid,
        cliente: clienteIdNumerico,
        formaPagamentoId: formaPagamentoIdNumerico,
        vendedor: vendedorNome,
        usuarioId: Number(usuario.id),
        itens: cupom.map((item) => ({
          produtoId: Number(item.id),
          quantidade: Number(item.quantidade),
          valorUnit: Number(item.precoVenda),
        })),
      };

      // Envia requisição para a API
      const respostaAPI = await NovoPedidoExterno(payload);

      

      setMensagem(
        respostaAPI?.mensagem || "Pedido externo gerado com sucesso!"
      );

      // Limpeza do formulário após sucesso
      handleCancelarPedido();
    } catch (error) {
      console.error("Erro ao gerar pedido externo:", error);
      setMensagem(error.message || "Erro inesperado ao gerar pedido externo.");
    } finally {
      setStatusPedido(false);
    }
  };

  return (
    <div className={styles.container}>
      <ToastRadix mensagem={mensagem} />
      <Cabecalho />

      <main className={styles.main}>
        {/* CABEÇALHO DA PÁGINA */}
        <div className={styles.containerTituloLogo}>
          <div className={styles.cabecalhoPage}>
            <div className={styles.iconeWrapper}>
              <Storefront size={24} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Vendas Externas</p>
              <h1 className={styles.pageTitulo}>Novo Pedido Externo</h1>
            </div>
          </div>

          <div className={styles.headerInfoCard}>
            <div className={styles.headerInfoIcon}>
              <IdentificationCardIcon size={20} weight="fill" />
            </div>
            <div className={styles.headerInfoText}>
              <p className={styles.headerInfoLabel}>Operador</p>
              <strong className={styles.headerInfoValue}>
                {usuario?.nome || "Usuário"}
              </strong>
            </div>
          </div>
        </div>

        {/* CORPO PRINCIPAL (2 COLUNAS) */}
        <div className={styles.centro}>
          {/* COLUNA ESQUERDA: CLIENTE E PRODUTO */}
          <div className={styles.colunaEsquerda}>
            {/* SELEÇÃO DE CLIENTE EXTERNO */}
            <div className={styles.containerCliente}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderTitle}>
                  <BuildingsIcon
                    size={18}
                    weight="bold"
                    className={styles.cardHeaderIcon}
                  />
                  <h2>Cliente externo</h2>
                </div>

                <div
                  className={styles.reload}
                  onClick={handleSincronizarClientes}
                  title="Sincronizar clientes externos"
                >
                  <ArrowClockwiseIcon
                    size={18}
                    weight="bold"
                    color="#1971c2"
                    className={carregandoSincronizacao ? styles.spinnerIcon : ""}
                  />
                </div>
              </div>

              {carregandoSincronizacao ? (
                <div className={styles.carregandoContainer}>
                  <Spinner />
                  <p>Sincronizando clientes externos, aguarde...</p>
                </div>
              ) : (
                <div className={styles.dadosCliente}>
                  {/* SELECT DE BUSCA POR NOME OU CNPJ */}
                  <div className={styles.campo}>
                    <label className={styles.label}>
                      Buscar cliente (Razão social, Nome fantasia ou CNPJ)
                    </label>

                    {carregandoClientes ? (
                      <div className={styles.carregandoProduto}>
                        <SpinnerIcon
                          size={16}
                          weight="bold"
                          className={styles.spinnerIcon}
                        />
                        Carregando clientes externos...
                      </div>
                    ) : (
                      <Select
                        classNamePrefix="custom"
                        options={opcoesClientes}
                        value={
                          opcoesClientes.find(
                            (opt) => opt.value === clienteSelecionado?.id
                          ) || null
                        }
                        onChange={(opcao) => {
                          setClienteSelecionado(opcao ? opcao.cliente : null);
                        }}
                        filterOption={filtrarCliente}
                        placeholder="Digite o nome ou CNPJ do cliente..."
                        isSearchable
                        isClearable
                        noOptionsMessage={() => "Nenhum cliente externo encontrado"}
                      />
                    )}
                  </div>

                  {/* RESUMO RÁPIDO DO CLIENTE SELECIONADO */}
                  {clienteSelecionado && (
                    <div className={styles.resumoClienteCard}>
                      <div className={styles.resumoClienteHeader}>
                        <h3 className={styles.resumoClienteNome}>
                          {clienteSelecionado.nome}
                        </h3>
                        <span className={styles.resumoClienteBadge}>
                          ID #{clienteSelecionado.id}
                        </span>
                      </div>

                      <div className={styles.resumoClienteGrid}>
                        <div className={styles.resumoItem}>
                          <span className={styles.resumoItemLabel}>CNPJ</span>
                          <span className={styles.resumoItemValor}>
                            {clienteSelecionado.cnpj || "Não informado"}
                          </span>
                        </div>

                        <div className={styles.resumoItem}>
                          <span className={styles.resumoItemLabel}>Cidade</span>
                          <span className={styles.resumoItemValor}>
                            {clienteSelecionado.cidade || "Não informada"}
                          </span>
                        </div>

                        <div className={styles.resumoItem}>
                          <span className={styles.resumoItemLabel}>Endereço</span>
                          <span className={styles.resumoItemValor}>
                            {clienteSelecionado.endereco || "Não informado"}
                          </span>
                        </div>

                        <div className={styles.resumoItem}>
                          <span className={styles.resumoItemLabel}>
                            Vendedor padrão
                          </span>
                          <span className={styles.resumoItemValor}>
                            {clienteSelecionado.vendedor || "Não vinculado"}
                          </span>
                        </div>

                        {clienteSelecionado.telefone && (
                          <div className={styles.resumoItem}>
                            <span className={styles.resumoItemLabel}>Telefone</span>
                            <span className={styles.resumoItemValor}>
                              {clienteSelecionado.telefone}
                            </span>
                          </div>
                        )}

                        {clienteSelecionado.frequencia && (
                          <div className={styles.resumoItem}>
                            <span className={styles.resumoItemLabel}>
                              Frequência
                            </span>
                            <span className={styles.resumoItemValor}>
                              {clienteSelecionado.frequencia}
                            </span>
                          </div>
                        )}

                        <div className={styles.resumoItem}>
                          <span className={styles.resumoItemLabel}>
                            Pendências
                          </span>
                          <span
                            className={styles.resumoItemValor}
                            style={{
                              fontWeight: "700",
                              color:
                                Number(clienteSelecionado.totalPendencia || 0) > 0
                                  ? "var(--red)"
                                  : "var(--green)",
                            }}
                          >
                            {Number(clienteSelecionado.totalPendencia || 0) > 0
                              ? formatarMoeda(clienteSelecionado.totalPendencia)
                              : "Em dia"}
                            {Number(clienteSelecionado.totalPago || 0) > 0 && (
                              <span
                                style={{
                                  color: "#2f9e44",
                                  backgroundColor: "#ebfbee",
                                  border: "1px solid #8ce99a",
                                  padding: "2px 6px",
                                  borderRadius: "6px",
                                  marginLeft: "8px",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                }}
                              >
                                (Pago: {formatarMoeda(clienteSelecionado.totalPago)})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SELEÇÃO DE PRODUTO */}
            <div className={styles.cardAdicionar}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderTitle}>
                  <PlusCircleIcon
                    size={18}
                    weight="bold"
                    className={styles.cardHeaderIcon}
                  />
                  <h2>Adicionar produto</h2>
                </div>
              </div>

              <div className={styles.formulario}>
                {/* SELECT DE PRODUTOS */}
                <div className={styles.campo}>
                  <label className={styles.label}>Produto</label>
                  {carregandoProdutos ? (
                    <div className={styles.carregandoProduto}>
                      <SpinnerIcon
                        size={16}
                        weight="bold"
                        className={styles.spinnerIcon}
                      />
                      Carregando produtos...
                    </div>
                  ) : (
                    <Select
                      classNamePrefix="custom"
                      options={opcoesProdutos}
                      value={
                        opcoesProdutos.find(
                          (opt) => opt.value === produtoSelecionado?.id
                        ) || null
                      }
                      onChange={(opt) => {
                        setProdutoSelecionado(opt ? opt.produto : null);
                      }}
                      placeholder="Selecione ou busque o produto..."
                      isSearchable
                      isClearable
                      noOptionsMessage={() => "Nenhum produto encontrado"}
                    />
                  )}
                </div>

                {/* QUANTIDADE E PREÇO */}
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
                        if (isNaN(v) || v < 0.5) v = 1;
                        setQuantidade(v);
                      }}
                      min="0.5"
                      step="0.5"
                      className={styles.input}
                      disabled={!produtoSelecionado}
                    />
                  </div>

                  {/* PREÇO UNITÁRIO */}
                  <div className={styles.campoMetade}>
                    <label className={styles.label}>Preço unitário</label>
                    <input
                      type="text"
                      value={
                        produtoSelecionado
                          ? `R$ ${precoUnitarioCalculado.toFixed(2)}`
                          : "R$ 0,00"
                      }
                      readOnly
                      className={`${styles.input} ${styles.inputReadonly}`}
                    />
                  </div>

                  {/* AJUSTE DE PREÇO (ADMIN) */}
                  {usuario?.nivelAcesso === "ADMIN" && (
                    <div className={styles.campoMetade}>
                      <label className={styles.label}>Ajuste R$</label>
                      <input
                        type="number"
                        value={ajustePrecoProduto}
                        onChange={(e) => setAjustePrecoProduto(e.target.value)}
                        placeholder="± 0.00"
                        className={styles.input}
                        disabled={!produtoSelecionado}
                      />
                    </div>
                  )}
                </div>

                {/* TOTAL DO PRODUTO */}
                <div className={styles.campo}>
                  <label className={styles.label}>Total do produto</label>
                  <input
                    type="text"
                    value={
                      produtoSelecionado
                        ? `R$ ${totalItemCalculado}`
                        : "R$ 0,00"
                    }
                    readOnly
                    className={`${styles.input} ${styles.inputTotal}`}
                  />
                </div>

                {/* BOTÃO ADICIONAR AO CUPOM */}
                <button
                  className={styles.botaoAdicionar}
                  onClick={handleAddProduto}
                  disabled={!produtoSelecionado || !quantidade}
                >
                  <PlusCircleIcon size={18} weight="bold" />
                  Adicionar ao cupom
                </button>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: CUPOM E FINALIZAÇÃO */}
          <div className={styles.colunaDireita}>
            {/* CUPOM DE ITENS */}
            <div className={styles.cardCupom}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderTitle}>
                  <ReceiptIcon
                    size={18}
                    weight="bold"
                    className={styles.cardHeaderIcon}
                  />
                  <h2>Itens do pedido</h2>
                </div>

                <span className={styles.badge}>
                  {cupom.length} {cupom.length === 1 ? "item" : "itens"}
                </span>
              </div>

              {/* LISTAGEM DE ITENS */}
              <div className={styles.lista}>
                {cupom.length === 0 ? (
                  <div className={styles.listaVazia}>
                    <PackageIcon
                      size={40}
                      weight="duotone"
                      className={styles.iconeVazio}
                    />
                    <p>Nenhum produto adicionado</p>
                    <span>Selecione clientes e produtos para montar o pedido</span>
                  </div>
                ) : (
                  cupom.map((item) => (
                    <ItemListaPedidoDelivery
                      key={`${item.id}-${item.precoVenda}`}
                      produto={item}
                      onRemover={handleRemoveProduto}
                    />
                  ))
                )}
              </div>
            </div>

            {/* ESTADO DE ENVIO OU RESUMO */}
            {statusPedido ? (
              <div className={styles.enviandoPedido}>
                <Spinner />
                <p>Enviando pedido externo, aguarde um instante...</p>
                <span>Estabelecendo comunicação com a API central...</span>
              </div>
            ) : (
              <div className={styles.cardResumo}>
                {/* TOTAIS DO PEDIDO */}
                <div className={styles.totais}>
                  <div className={styles.linhaTotal}>
                    <span>Quantidade total</span>
                    <strong>
                      {quantidadeTotalItens}{" "}
                      {quantidadeTotalItens === 1 ? "unidade" : "unidades"}
                    </strong>
                  </div>

                  <div className={styles.linhaTotal}>
                    <span>Subtotal</span>
                    <strong>{formatarMoeda(totalPedido)}</strong>
                  </div>

                  <div className={`${styles.linhaTotal} ${styles.totalFinal}`}>
                    <span>Total do pedido</span>
                    <strong className={styles.valorTotal}>
                      {formatarMoeda(totalPedido)}
                    </strong>
                  </div>
                </div>

                {/* FORMA DE PAGAMENTO */}
                <div className={styles.campo}>
                  <label className={styles.label}>
                    <WalletIcon size={14} weight="bold" />
                    Forma de pagamento
                  </label>

                  {carregandoFormasPagamento ? (
                    <div className={styles.carregandoProduto}>
                      <SpinnerIcon
                        size={16}
                        weight="bold"
                        className={styles.spinnerIcon}
                      />
                      Carregando formas de pagamento...
                    </div>
                  ) : (
                    <select
                      value={formaPagamento}
                      onChange={(e) => setFormaPagamento(Number(e.target.value))}
                      className={styles.select}
                    >
                      {listaFormaPagamento?.map((forma) => (
                        <option key={forma.id} value={forma.id}>
                          {forma.nome}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* CAMPO VENDEDOR */}
                <div className={styles.campo} style={{ marginTop: 12 }}>
                  <label className={styles.label}>
                    <UserIcon size={14} weight="bold" />
                    Vendedor responsável
                  </label>
                  <input
                    type="text"
                    value={vendedor}
                    onChange={(e) => setVendedor(e.target.value)}
                    placeholder="Nome do vendedor responsável"
                    className={styles.input}
                  />
                </div>

                {/* BOTÕES DE AÇÃO COM CONFIRMAÇÃO */}
                <div className={styles.botoesAcao}>
                  {/* CANCELAR */}
                  <AlertaRadix
                    titulo="Cancelar pedido externo"
                    descricao="Deseja realmente limpar todos os itens e campos preenchidos?"
                    tratar={handleCancelarPedido}
                    confirmarTexto="Sim, cancelar"
                    cancelarTexto="Voltar"
                    trigger={
                      <button className={styles.botaoCancelar}>
                        <TrashIcon size={16} weight="bold" />
                        Cancelar
                      </button>
                    }
                  />

                  {/* CONFIRMAR PEDIDO */}
                  <AlertaRadix
                    titulo="Confirmar pedido externo"
                    descricao={`Confirma a emissão do pedido para "${clienteSelecionado?.nome || "Cliente"}" no valor total de ${formatarMoeda(totalPedido)}?`}
                    tratar={handleConfirmarPedido}
                    confirmarTexto="Sim, confirmar pedido!"
                    cancelarTexto="Voltar"
                    trigger={
                      <button
                        className={styles.botaoGerar}
                        disabled={cupom.length === 0 || !clienteSelecionado}
                      >
                        <CheckCircleIcon size={16} weight="bold" />
                        Confirmar Pedido
                      </button>
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Rodape />
    </div>
  );
}

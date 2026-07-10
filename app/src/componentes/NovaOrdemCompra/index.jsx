import { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css"
import { buscarFornecedores } from "../../operadores/API/fornecedores/buscarFornecedores.js";
import { formatarMoeda } from "../../utils/formartarMoeda";
import { useProdutos } from "../../hooks/useProdutos";
import { criarOrdem } from "../../operadores/API/ordemCompra/criarOrdem";
import Spinner from "../Spinner";
import { ArrowLeft, Building, Buildings, CircleNotch, FloppyDisk, ListBullets, PackageIcon, Plus, PlusCircleIcon, X } from "@phosphor-icons/react";
import Select from "react-select";
import { ItemListaOrdemCompra } from "../ItemListaOrdemCompra";
import { ToastRadix } from "../ui/notificacao/notificacao";
import { AlertaRadix } from "../ui/alerta/alerta";


export default function NovaOrdemCompra({ setView, setMensagem }) {

  // Referencia para acessar componente
  const inputProduto = useRef(null);

  // Storaged
  const usuarioId = localStorage.getItem("idUsuario");

  // Hooks
  const { produtos, carregando } = useProdutos();
  
  // Estados
  const [fornecedor, setFornecedor] = useState()
  const [salvando, setSalvando] = useState()
  const [produtoSelecionado, setProdutoSelecionado] = useState(null)
  const [quantidade, setQuantidade] = useState()
  const [ajustePreco, setAjustePreco] = useState()


  //Listas
  const [listaFornecedores, setListaFornecedores] = useState([])

  // Lista do cupom de itens
  const [formItens, setFormItens] = useState([]);

  // Calculo
  const totalProduto = (preco, qtd, ajuste) => ((preco - ajuste) * qtd);
  const ajuste = Number(( ajustePreco || "0").replace(",", ".")) || 0

  console.log('produto selecionado: ', produtoSelecionado)

  // Adicionar item na lista da ordem
  const handleAdicionarProduto = () => {
    console.log(produtoSelecionado.precoCompra)
    // Validando variáveis
    if(!produtoSelecionado.id || quantidade <= 0 || produtoSelecionado.precoCompra <= 0 ) {
      setMensagem("Selecione produto e adicione quantidade de forma válida!")
    }

    // Ajustando preço
    const precoComAjuste = produtoSelecionado.precoCompra - ajuste

    // Spread Operator
    setFormItens([
      ...formItens, 
      {
        produtoId: produtoSelecionado.id,
        quantidade: Number(quantidade), 
        valorUnit: precoComAjuste
      }
    ]);

    setQuantidade(0)
    inputProduto.current.focus();

  }

  // Remove produto pelo index
  const handleRemoveProduto = (id) => {
    setFormItens(formItens.filter((item, index) => index !== id));
  }
  
  // Buscando fornecedores.
    useEffect(() => {
      const filtrarFornecedores = async () => {
        try {
          const resultado = await buscarFornecedores({
            status: "ATIVO"
          });
    
          setListaFornecedores(resultado.map((f) => ({ value: f.id, label: f.nome })))
              
          } catch (error) {
              console.log(error)
          }
        }
          filtrarFornecedores();
    }, [])

  // Mapeando produtos para ser utilizado no componentes <Select />
  const listaProdutos = produtos.map((p) => ({ value: p.id, label: p.nome }));

  // Criar nova ordem de compra
  const handleCriarOrdem = async () => {
    if (!fornecedor) return;

    // filtrando da forma que a API espera
    const itensValidos = formItens.filter((i) => i.produtoId && i.quantidade > 0 && i.valorUnit >= 0);

    console.log('Itens validados: ', itensValidos)

    // Valida a existencia de item
    if (!itensValidos.length) return;

    setSalvando(true);
    try {
      const payload = itensValidos.map((i) => ({
        produtoId: i.produtoId,
        valorUnit: Number(i.valorUnit),
        quantidade: Number(i.quantidade),
      }));

      console.log('payload: ', payload)

      const novaOrdem = await criarOrdem(Number(usuarioId), fornecedor.value, payload);

      if(novaOrdem.id) {
        setMensagem("Ordem de compra criada com sucesso!")
      }

      await new Promise((r) => setTimeout(r, 700));
  
      setView("lista");
      resetFormOrdem();
    } catch (error) {
        console.log(error.message)
        setMensagem(error.message)
    } finally {
      setSalvando(false);
    }
  };

  // Resetar a ordem de cupom
  const resetFormOrdem = () => {
    setFornecedor(null);
    setFormItens([{ produtoId: null, quantidade: "", valorUnit: "" }]);
  };


    return (
          <div className={`${styles.card} ${styles.fadeUp}`}>

            {/* CABEÇALHO */}
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

            { /* SELECIONAR FORNECEDOR */}
            <div className={styles.formGrid}>
              <div className={styles.formGrupo}>
                <label className={styles.formLabel}>
                  <Buildings size={13} /> Fornecedor
                </label>
                <Select
                  classNamePrefix="custom"
                  options={listaFornecedores}
                  value={fornecedor}
                  onChange={setFornecedor}
                  placeholder="Selecione o fornecedor…"
                  isDisabled={formItens.length > 0 } // fornecedor fica desabilitado quando houver produto na lista.
                />
              </div>
            </div>

            {/* ADICIONAR ITEM */}
            <div className={styles.itensSection}>

              {carregando && <Spinner />}

              {/* GRID DE NOVO PRODUTO */}
              <div  className={styles.itemFormRow}>

                  {/* PRODUTO */} 
                  <div className={styles.itemFormProduto}>
                    <label className={styles.formLabel}>Produto</label>
                    <Select
                      ref={inputProduto}
                      classNamePrefix="custom"
                      options={listaProdutos}
                      value={listaProdutos.find(opt => opt.value === produtoSelecionado?.id) || null}
                      onChange={(opt) => setProdutoSelecionado(produtos.find((p) => p.id === opt.value))}
                      placeholder="Selecione…"
                    />
                  </div>

                  {/* QUANTIDADE */}                  
                  <div className={styles.itemFormQtd}>
                    <label className={styles.formLabel}>Qtd</label>
                    <input
                      className={styles.input}
                      type="number"
                      min="1"
                      placeholder="0"
                      value={quantidade}
                      onChange={(e) => { const v = parseInt(e.target.value) || 1; setQuantidade(v > 0 ? v : 1); }}
                    />
                  </div> 

                  {/* VALOR UNITÁRIO */} 
                  <div className={styles.itemFormValor}>
                    <label className={styles.formLabel}>Vlr. Unit (R$)</label>
                    <input
                      className={styles.input}
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={produtoSelecionado?.precoCompra}
                    /> 
                  </div>

                  {/* AJUSTE VALOR */} 
                  <div className={styles.itemFormValor}>
                    <label className={styles.formLabel}>Vlr. Ajuste (R$)</label>
                      <input
                        className={styles.input}
                        type="text"
                        placeholder="0,00"
                        value={ajustePreco}
                        onChange={(e) => {
                          let valor = e.target.value;

                          // permite só números e vírgula
                          valor = valor.replace(/[^0-9,]/g, "");

                          // evita mais de uma vírgula
                          const partes = valor.split(",");
                          if (partes.length > 2) {
                            valor = partes[0] + "," + partes[1];
                          }

                          setAjustePreco(valor);
                        }}
                      />    
                  </div>

                  {/* TOTAL */} 
                  <div className={styles.itemFormTotal}>
                    <label className={styles.formLabel}>Total</label>
                    <span className={styles.itemTotalCalc}>
                      {formatarMoeda( 
                        totalProduto(
                          produtoSelecionado?.precoCompra || 0, 
                          quantidade || 0, 
                          ajuste
                         )
                      )}
                    </span>
                  </div>

              </div>
       
              {/* BOTÃO ADICIONAR ITEM */}
              <button
                className={styles.botaoAdicionar}
                onClick={handleAdicionarProduto}
                disabled={!produtoSelecionado || !quantidade}
              >
                <PlusCircleIcon size={18} weight="bold" />
                Adicionar na ordem
              </button>

            </div>

            <div className={styles.itensTitulo}>
              <ListBullets size={15} weight="bold" />
              Itens da Ordem
            </div>

            {/* LISTA VAZIA */}
            <div className={styles.lista}>
              {formItens.length === 0 ? (
                <div className={styles.listaVazia}>
                  <PackageIcon size={40} weight="duotone" className={styles.iconeVazio} />
                  <p>Nenhum produto adicionado</p>
                  <span>Selecione produtos para iniciar a venda</span>
                </div>
              ) : (
                formItens.map((item, index) => (
                  <ItemListaOrdemCompra key={index} item={item} removeItem={handleRemoveProduto} indexItem={index} />
                ))
              )}
            </div>

            {/* RODAPÉ E BOTÕES */}
            <div className={styles.formRodape}>

              {/* TOTAL */}
              <div className={styles.totalOrdem}>
                Total:{" "}
                <strong>
                  {formatarMoeda(
                    formItens.reduce((s, i) => s + (Number(i.quantidade) || 0) * (Number(i.valorUnit) || 0), 0)
                  )}
                </strong>
              </div>

              {/* BOTÕES */}
              <div className={styles.formAcoes}>

                {/* BOTÃO CANCELAR */}
                <button className={styles.botaoCancelar} onClick={() => setView("lista")}>
                  <X size={15} weight="bold" />
                  Cancelar
                </button>
                  
                  {/* BOTÃO SALVAR */}
                <AlertaRadix
                  titulo="Criar nova ordem de compra"
                  descricao="Você realmente deseja criar nova ordem de compra?"
                  tratar={handleCriarOrdem}
                  confirmarTexto="Confirmar"
                  cancelarTexto="Sair"
                  trigger={
                    <button
                      className={styles.botaoPrincipal}
                      disabled={salvando || !fornecedor}
                    >
                      {salvando ? <CircleNotch size={15} className={styles.spinnerIcon} /> : <FloppyDisk size={15} weight="bold" />}
                      {salvando ? "Salvando…" : "Criar Ordem"}
                    </button>
                  }
                />

              </div>

            </div>

          </div>
    )
}
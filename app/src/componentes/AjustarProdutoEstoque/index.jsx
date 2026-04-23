import { useState } from 'react'
import styles from './styles.module.css'
import { ajusteEstoque } from '../../operadores/API/estoque/ajusteEstoque'
import { usarToast } from '../Context/toastContext'
import { useProdutos } from '../../hooks/useProdutos'
import Select from 'react-select'
import { ArrowDown, ArrowUp, CircleNotch, Package, X } from '@phosphor-icons/react'
import { AlertaRadix } from '../ui/alerta/alerta'

export default function AjustarProdutoEstoque({setAtualizarLista}) {

    //LocalStoraged
    const usuarioId = localStorage.getItem('idUsuario')

    // Estados
    const [tipo, setTipo] = useState('ENTRADA')
    const [quantidade, setQuantidade] = useState()
    const [produtoSelecionado, setProdutoSelecionado] = useState()
    const [salvando, setSalvando] = useState()


    //Hooks
    const { setMensagem } = usarToast()
    const { produtos } = useProdutos();

    // Formatando produtos no formato para o Select
    const listaProdutos = produtos.map((p) => ({ value: p.id, label: p.nome }));


    // Função salvar ajuste
    async function salvarAjuste() {
        const qtd = parseInt(quantidade, 10);
        if (!qtd || qtd <= 0) {
          setMensagem("Informe uma quantidade válida.")
          return;
        }
        setSalvando(true);

        const ajuste = await ajusteEstoque(produtoSelecionado.id, qtd, usuarioId, tipo)
    
        if(!ajuste) {
           setSalvando(false);
            setMensagem("Informe uma quantidade válida.")
        }

        setAtualizarLista(prev => !prev)
       
        setMensagem("Ajuste realizado com sucesso!")

    }


    return (
          <div className={styles.modal} >

            {/* TITULO */}
            <div className={styles.modalHeader}>
              <div className={styles.modalTitulo}>
                <Package size={18} weight="fill" />
                <span>Ajuste de Estoque</span>
              </div>
            </div>

            {/* SELECT */}
            <div className={styles.select}>
              <Select
                classNamePrefix="custom"
                options={listaProdutos}
                value={listaProdutos.find((opt) => opt.value === produtoSelecionado?.id) || null}
                onChange={(opt) => setProdutoSelecionado(produtos.find((p) => p.id === opt.value))}
                placeholder="Selecione ou digite..."
                isSearchable
                noOptionsMessage={() => "Nenhum produto encontrado"}
              />
            </div>

            <div className={styles.modalBody}>

              {/* MODAL DESCRIÇÃO PRODUTO + QUANTIDADE */}
              <div className={styles.modalProduto}>
                <p className={styles.modalProdutoNome}>{produtoSelecionado?.nome}</p>
                <span className={styles.modalProdutoEstoque}>
                  Estoque atual: <strong>{produtoSelecionado?.estoque}</strong>
                </span>
              </div>

              {/* BOTÕES DE TIPO DE AJUSTE: ENTRADA/SAIDA */}
              <div className={styles.tipoGroup}>

                {/* ENTRADA */}
                <button
                  className={`${styles.tipoBotao} ${tipo === "ENTRADA" ? styles.tipoAtivo_entrada : ""}`}
                  onClick={() => setTipo("ENTRADA")}
                >
                  <ArrowDown size={16} weight="bold" />
                  Entrada
                </button>
                {/* SAIDA */}
                <button
                  className={`${styles.tipoBotao} ${tipo === "SAIDA" ? styles.tipoAtivo_saida : ""}`}
                  onClick={() => setTipo("SAIDA")}
                >
                  <ArrowUp size={16} weight="bold" />
                  Saída
                </button>

              </div>

              {/* QUANTIDADE */}
              <div className={styles.filtroGrupo}>
                <label className={styles.filtroLabel}>Quantidade</label>
                <input
                  type="number"
                  min="1"
                  className={styles.input}
                  placeholder="Ex: 50"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && salvarAjuste()}
                  autoFocus
                />
              </div>

              {/* PREVIEW NOVO ESTOQUE */}
              {quantidade && parseInt(quantidade) > 0 && (
                <div className={`${styles.preview} ${tipo === "ENTRADA" ? styles.previewEntrada : styles.previewSaida}`}>
                  
                  {/* CONDICIONAL ENTRADA / SAIDA */}
                  {tipo === "ENTRADA" ? (
                    <>
                      <ArrowDown size={14} weight="bold" />
                      Novo estoque: <strong>{produtoSelecionado?.estoque + parseInt(quantidade)}</strong>
                    </>
                  ) : (
                    <>
                      <ArrowUp size={14} weight="bold" />
                      Novo estoque: <strong>{Math.max(0, produtoSelecionado?.estoque - parseInt(quantidade))}</strong>
                      {parseInt(quantidade) > produtoSelecionado.estoque && (
                        <span className={styles.previewAviso}> — estoque ficará negativo!</span>
                      )}
                    </>
                  )}

                </div>
              )}

            </div>

            {/* BOTÕES */}
            <div className={styles.modalFooter}>

              {/* BOTÕES CANCELAR */}
              <button className={styles.botaoCancelar} disabled={salvando}>
                Cancelar
              </button>

              {/* BOTÕES SALVAR*/}



              <AlertaRadix
                titulo="Novo ajuste de estoque"
                descricao="Você realmente deseja salvar o ajuste?"
                tratar={() => {  if (salvando || !quantidade) return
                salvarAjuste()}} 
                confirmarTexto="Confirmar"
                cancelarTexto="Sair"
                trigger={
                  <button
                    className={styles.botaoPrincipal}
                  >
                    {salvando ? (
                      <>
                        <CircleNotch size={16} className={styles.spinnerIcon} />
                        Salvando...
                      </>
                    ) : (
                      <>
                        {tipo === "ENTRADA" ? <ArrowDown size={16} weight="bold" /> : <ArrowUp size={16} weight="bold" />}
                        Confirmar {tipo === "ENTRADA" ? "Entrada" : "Saída"}
                      </>
                    )}
                  </button>
                }
              />

            </div>

          </div>
    )

}
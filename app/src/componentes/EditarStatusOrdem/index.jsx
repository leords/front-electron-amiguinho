import { useState } from 'react';
import { dataHoraFormatada } from '../../utils/data'
import { formatarMoeda } from '../../utils/formartarMoeda'
import styles from './styles.module.css'
import { ArrowLeft, CheckCircle, CircleNotch, FloppyDisk, ListBullets, PencilSimple, X } from '@phosphor-icons/react';
import Select from 'react-select';
import { editarOrdem } from '../../operadores/API/ordemCompra/editarOrdem';
import { AlertaRadix } from '../ui/alerta/alerta';
import { usarToast } from '../Context/toastContext';
import { useProdutos } from '../../hooks/useProdutos';
import { gerarRelatorioEstoqueHTML } from '../../utils/gerarRelatorioEstoqueHTML';



export function EditarStatusOrdem ({ ordemSelecionada, setView }) {

    const dataHora = dataHoraFormatada();

    // Hooks
    const { setMensagem } = usarToast();
    const { produtos } = useProdutos();
    

    //Storaged
    const usuarioId = localStorage.getItem('idUsuario')


    // Estados
    const [status, setStatus] = useState(null)
    const [salvando, setSalvando] = useState(false)

    // Opções de status já no formatado para o Select
    const opStatus = ["Pendente", "Realizada", "Finalizada", "Cancelada"].map((s) => ({ value: s, label: s }));
    
    // Função para editar a ordem
    const handleEditarOrdem = async () => {
        if (!status || !ordemSelecionada.id) return;

        setSalvando(true);

        try {
            if(status.value === 'Pendente') {
              
              const relatorio = {
                data: dataHoraFormatada(ordemSelecionada.data) || "",
                dataAbertura: dataHora,
                fornecedor: ordemSelecionada.fornecedor.nome || "",
                total: ordemSelecionada.total || "",
                codigo: (ordemSelecionada.fornecedorId || 0 + ordemSelecionada.id || 0), //vai validar a entrada na nota com esse ID
                quantidade: ordemSelecionada.itens.length,
                itens: ordemSelecionada.itens.map((item) => ({
                  produto: produtos.find( produto => Number(produto.id) === Number(item.produtoId))?.nome,
                  quantidade: item.quantidade,
                  valorTotal: item.valorTotal,
                  valorUnit: item.valorUnit
                }))
              }

              window.IMPRESSORA.imprimir(gerarRelatorioEstoqueHTML(relatorio));

            }

            await editarOrdem(ordemSelecionada.id, status.value, usuarioId);

          
            setMensagem("Status da ordem de compra alterado com sucesso!")
            setView("lista");

        } catch(e) {
          const mensagem = e.response?.data?.erro.mensagem || 
          e.message ||
          "Erro, não foi possivel realizar a alteração!";
          
          setMensagem(mensagem)
        } finally {
        setSalvando(false);
        }
    };
  
    return (
        <div className={`${styles.card} ${styles.fadeUp}`}>
          
          {/* CABEÇALHO */}
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

            {/* DETALHES DA ORDEM */}
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
                <span className={styles.detalheValor}>{dataHoraFormatada(ordemSelecionada.data)}</span>
              </div>
              <div className={styles.detalheItem}>
                <span className={styles.detalheLabel}>Total</span>
                <span className={styles.detalheValor}>{formatarMoeda(ordemSelecionada.total)}</span>
              </div>
            </div>

            {/* LISTA */}
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
                    <span>{produtos.find( produto => Number(produto.id) === Number(it.produtoId))?.nome}</span>
                    <span>{it.quantidade}</span>
                    <span>{formatarMoeda(it.valorUnit)}</span>
                    <span>{formatarMoeda(it.valorTotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SELECT DO STATUS */}
            <div className={styles.formGrid} style={{ marginTop: 20 }}>
              <div className={styles.formGrupo}>
                <label className={styles.formLabel}>
                  <CheckCircle size={13} /> Alterar Status
                </label>
                <Select
                  classNamePrefix="custom"
                  options={opStatus}
                  value={status}
                  onChange={setStatus}
                  placeholder="Selecione o novo status…"
                />
              </div>
            </div>

            {/* BOTÕES */}
            <div className={styles.formAcoes} style={{ marginTop: 20 }}>
              {/* BOTÃO CANCELAR */}
              <button className={styles.botaoCancelar} onClick={() => setView("lista")}>
                <X size={15} weight="bold" />
                Cancelar
              </button>

              {/* BOTÃO SALVAR */}
              <AlertaRadix
                titulo="Salvar alteração"
                descricao="Você realmente deseja salvar alteração?"
                tratar={handleEditarOrdem}
                confirmarTexto="Confirmar"
                cancelarTexto="Sair"
                trigger={
                <button
                    className={styles.botaoPrincipal}
                    disabled={salvando || !status}
                  >
                    {salvando ? <CircleNotch size={15} className={styles.spinnerIcon} /> : <FloppyDisk size={15} weight="bold" />}
                    {salvando ? "Salvando…" : "Salvar Alteração"}
                </button>
                }
              />
            </div>

          </div>
    )
}
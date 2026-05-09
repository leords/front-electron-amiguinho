import { useEffect, useState } from 'react'
import styles from './styles.module.css'
import { ArrowLeftIcon, Building, BuildingIcon, FloppyDisk, ArrowCircleUpIcon, FloppyDiskIcon, PencilSimple, TrashIcon, X } from '@phosphor-icons/react'
import { buscarFornecedores } from '../../operadores/API/fornecedores/buscarFornecedores.js'
import { AlertaRadix } from '../ui/alerta/alerta'
import { editarStatusFornecedor } from '../../operadores/API/fornecedores/editarStatusFornecedor'
import { usarToast } from '../Context/toastContext'
import { ToastRadix } from '../ui/notificacao/notificacao'
import { criarFornecedor } from '../../operadores/API/fornecedores/criarFornecedor'
import { alterarDadosFornecedor } from '../../operadores/API/fornecedores/alterarDadosFornecedor'
import { BotaoWhatsApp } from '../BotaoWpp'


export function Fornecedor ({ setView }) {

  const opcaoStatus = [
    { id: 1, value: "ATIVO", label: "ATIVO" },
    { id: 2, value: "INATIVO", label: "INATIVO" }
  ];

    // Estados
    const [novoFornecedor, setNovoFornecedor] = useState({ nome: "", cnpj: "", telefone: "", vendedor: ""})
    const [editarFornecedor, setEditarFornecedor] = useState(null)
    const [listaFornecedores, setListaFornecedores] = useState([])
    const [controladorLista, setControladorLista] = useState(false)
    const [status, setStatus] = useState("ATIVO")

    // Hooks
    const { setMensagem } = usarToast();

    
    // Função salvar novo fornecedor | salvar alteração fornecedor
    const handleSalvarFornecedor = async () => {

          // Edição de fornecedor
          if(editarFornecedor) {
            try {

              if(!novoFornecedor.telefone && !novoFornecedor.vendedor) {
                alert("É obrigatório Telefone ou cnpj e telefone para alterar fornecedor!")
                return
              }

              const fornecedorAlterado = await alterarDadosFornecedor(editarFornecedor.id, novoFornecedor.telefone, novoFornecedor.vendedor)
              
              if(fornecedorAlterado) {
                setMensagem(`Fornecedor ${novoFornecedor.nome} alterado com sucesso!`)
                
                // atualizando a lista do effect
                setControladorLista(prev => !prev)

                return fornecedorAlterado
              }

            } catch (error) {
              console.log(error.message)
              setMensagem(`${error.message} ao editar o fornecedor ${editarFornecedor.nome}`)
            }
          }


          // Criar fornecedor
          if(!novoFornecedor.nome || !novoFornecedor.cnpj || !novoFornecedor.telefone || !novoFornecedor.vendedor) {
            alert("É obrigatório nome, cnpj e telefone para cadastrar novo fornecedor!")
            return
          }
          try {
            const fornecedorCriado = await criarFornecedor(novoFornecedor.nome, novoFornecedor.cnpj, novoFornecedor.telefone, novoFornecedor.vendedor)
            if(fornecedorCriado) {
              setMensagem(`Fornecedor ${novoFornecedor.nome} criado com sucesso!`)

              // atualizando a lista do effect
              setControladorLista(prev => !prev)

              return fornecedorCriado
            }

          } catch (error) {
            console.log(error.message)
            setMensagem(error.message)
          }
    }

    // Função para editar fornecedor
    const handleEditarFornecedor = (f) => {
        setEditarFornecedor(f);
        setNovoFornecedor({ nome: f.nome, cnpj: f.cnpj, telefone: f.telefone, vendedor: f.vendedor});
    };

    // Função invativar fornecedor
    const handleInativarFornecedor = async (f) => {
      try {
        const alterarStatusFornecedor = await editarStatusFornecedor(f.id)
        if(alterarStatusFornecedor) {
          setMensagem(`Status do fornecedor ${f.nome} alterado com sucesso!`)

          // atualizando a lista do effect
          setControladorLista(prev => !prev)

          return
        }
      } catch (error) {
          console.log(error.message)
          setMensagem(error.message)
      }
    }

    // Buscando fornecedores.
    useEffect(() => {
      const filtrarFornecedores = async () => {
        try {
          const resultado = await buscarFornecedores({
            status: status
          });
        
          setListaFornecedores(resultado)
                  
        } catch (error) {
          console.log(error.message)
          setMensagem(error.message)
        }
      }
    filtrarFornecedores();
    }, [controladorLista, status])

    return (
          <div className={`${styles.card} ${styles.fadeUp}`}>
            {/* CABEÇALHO */}
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <BuildingIcon size={18} className={styles.cardHeaderIcon} />
                <h2>Fornecedores</h2>
              </div>
              <button className={styles.botaoVoltar} onClick={() => setView("lista")}>
                <ArrowLeftIcon size={14} weight="bold" />
                Voltar
              </button>
            </div>

            {/* FORMULÁRIO */}
            <div className={styles.painelFiltros} style={{ marginBottom: 20 }}>

                {/* TITÚLO */}
                <div className={styles.filtrosHeader}>
                <BuildingIcon size={13} className={styles.filtroIcone} weight="bold" />
                {editarFornecedor ? `Editando: ${editarFornecedor.nome}` : "Cadastrar Fornecedor"}
                </div>

                {/* FORMULÁRIO DINAMICO */}
                <div className={styles.filtrosGrid} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                    {/* Array de configuração */}
                    {[
                    { field: "nome",     placeholder: "Descrição *", label: "Nome" },
                    { field: "cnpj",     placeholder: "14 dígitos sem pontuação *", label: "CNPJ" },
                    { field: "telefone", placeholder: "47984126073 *", label: "Telefone" },
                    { field: "vendedor", placeholder: "Leonardo Rodrigues *", label: "Vendedor" },

                    ].map(({ field, placeholder, label }) => ( //Desestruturando
                    <div key={field} className={styles.filtroGrupo}>
                        <label className={styles.filtroLabel}>{label}</label>
                        <input
                        className={styles.input}
                        placeholder={placeholder}
                        value={novoFornecedor[field]} // vale o valor de field
                        onChange={(e) => setNovoFornecedor((p) => ({ ...p, [field]: e.target.value }))} // pega o estado atual, mantém tudo e altera só o campo atual com o e.target. 
                        
                        //Permite alteração só nos campos telefone e vendedor quando for editar
                        readOnly={editarFornecedor && (field === "nome" || field === "cnpj")}
                        /> 
                    </div>
                    ))}
                </div>

                {/* BOTÕES */}
                <div className={styles.formAcoes} style={{ padding: "0 20px 18px", justifyContent: "flex-end" }}>
                    
                    {/* BOTÃO CANCELAR CONDICIONAL */}
                    {editarFornecedor && (

                    <AlertaRadix
                        titulo="Cancelar edição"
                        descricao="Você realmente deseja cancelar está edição?"
                        tratar={
                          () => {
                              setEditarFornecedor(null);
                              setNovoFornecedor({ nome: "", cnpj: "", telefone: "", vendedor: "" });
                              }
                        }
                        confirmarTexto="Confirmar cancelamento!"
                        cancelarTexto="Sair"
                        trigger={
                          <button
                              className={styles.botaoCancelar}
                          >
                              <X size={14} weight="bold" /> Cancelar edição
                          </button>
                        }
                    />

                    
                    )}

                    {/* BOTÃO CADASTRAR/SALVAR CONDICIONAL */}

                    <AlertaRadix
                        titulo="Salvar"
                        descricao={editarFornecedor ? "Você realmente deseja salvar estas alterações?" : "Você realmente deseja salvar este novo cadastro?"}
                        tratar={handleSalvarFornecedor}
                        confirmarTexto="Confirmar!"
                        cancelarTexto="Sair"
                        trigger={
                          <button
                              className={styles.botaoPrincipal}
                              disabled={!novoFornecedor.nome}
                              >
                              <FloppyDiskIcon size={14} weight="bold" />
                              {editarFornecedor ? "Salvar alterações" : "Cadastrar"}
                          </button>
                        }
                    />

                </div>

            </div>

            {/* STATUS */}
            <div className={styles.filtroGrupo}>
            <label className={styles.filtroLabel}>Setor</label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={styles.selectInput}
            >
              <option value="">TODOS</option>
                {opcaoStatus.map((s) => (
                <option key={s.id} value={s.value}>
                {s.value}
              </option>
              ))}
            </select>
            </div>

            {/* DIV LISTA */}
            <div className={styles.tabelaWrapper}>

               {/* TITÚLOS */} 
              <div className={`${styles.tituloLista} ${styles.gridFornecedores}`}>
                <span>Nome</span>
                <span>CNPJ</span>
                <span>Telefone</span>
                <span>Vendedor</span>
                <span></span>
              </div>

              {/* LISTA */}
              <div className={styles.lista}>
                {/* LISTA VAZIA*/}
                {listaFornecedores?.length === 0 && (
                  <div className={styles.estadoVazio}>
                    <Building size={36} className={styles.iconeVazio} />
                    <p>Nenhum fornecedor cadastrado</p>
                  </div>
                )}

                {/* LISTA FORNECEDORES */}
                {listaFornecedores?.map((f) => (
                  <div key={f.id} className={`${styles.itemRow} ${styles.gridFornecedores} ${f.status === "INATIVO" ? styles.inativo : ""}`}>
                    <span className={styles.cellFornecedor}>
                      <Building size={13} />
                      {f.nome}
                    </span>
                    <span>{f.cnpj || "—"}</span>
                    <span>
                    {f.telefone ?
                    <BotaoWhatsApp 
                      telefone={f.telefone}
                      mensagem={"Olá! Aqui é comprador da Distribuidora de bebidas Amigão."}
                    /> : 
                    f.telefone || "—"
                    }
                    </span>
                    <span>{f.vendedor || "—"}</span>
                    <div className={styles.acoesRow}>

                    {/* EDITAR FORNECEDOR */}
                      <button className={styles.btnIcone} onClick={() => handleEditarFornecedor(f)} title="Editar">
                        <PencilSimple size={14} weight="bold" />
                      </button>

                    {/* ATIVAR/INATIVAR STATUS */}
                    <AlertaRadix
                        titulo="Inativar Fornecedor"
                        descricao="Você realmente deseja inativar este fornecedor?"
                        tratar={() => {handleInativarFornecedor(f)}}
                        confirmarTexto="Confirmar inativação!"
                        cancelarTexto="Sair"
                        trigger={
                            <button
                                className={`${styles.btnIcone} ${styles.btnIconeRed}`}
                                title="Excluir">
                                
                                {f.status === "ATIVO" 
                                ? <TrashIcon size={14} weight="bold" color='red'/>
                                : <ArrowCircleUpIcon size={14} weight="bold" color='green'/>}
                            </button>
                        }
                    />

                    </div>
                  </div>
                ))}

              </div>
              
            </div>
          </div>        
    )
}
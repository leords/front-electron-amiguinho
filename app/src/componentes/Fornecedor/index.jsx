import { useState } from 'react'
import styles from './styles.module.css'
import { Building, FloppyDisk, PencilSimple, X } from '@phosphor-icons/react'
import { Console } from 'node:console'


export function Fornecedor ({ setView }) {

    const [novoFornecedor, setNovoFornecedor] = useState({ nome: "", cnpj: "", telefone: "", email: "" })
    const [editarFornecedor, setEditarFornecedor] = useState(null)


    // Função salvar novo fornecedor
    const handleSalvarFornecedor = () => {
        console.log('Salvar fornecedor')
    }

    // Função editar fornecedor
    const handleEditarFornecedor = (f) => {
        setEditarFornecedor(f);
        setNovoFornecedor({ nome: f.nome, cnpj: f.cnpj, telefone: f.telefone, email: f.email });
    };

    // Função invativar fornecedor
    const handleInativarFornecedor = () => {
        console.log('Inativar fornecedor?')
    }

    return (
          <div className={`${styles.card} ${styles.fadeUp}`}>
            
            {/* CABEÇALHO */}
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <Buildings size={18} className={styles.cardHeaderIcon} />
                <h2>Fornecedores</h2>
              </div>
              <button className={styles.botaoVoltar} onClick={() => setView("lista")}>
                <ArrowLeft size={14} weight="bold" />
                Voltar
              </button>
            </div>

            {/* FORMULÁRIO */}
            <div className={styles.painelFiltros} style={{ marginBottom: 20 }}>

                {/* TITÚLO */}
                <div className={styles.filtrosHeader}>
                <Buildings size={13} className={styles.filtroIcone} weight="bold" />
                {editarFornecedor ? `Editando: ${editarFornecedor.nome}` : "Cadastrar Fornecedor"}
                </div>

                {/* FORMULÁRIO DINAMICO */}
                <div className={styles.filtrosGrid} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                    {/* Array de configuração */}
                    {[
                    { field: "nome",     placeholder: "Descrição *", label: "Nome" },
                    { field: "cnpj",     placeholder: "00.000.000/0000-00", label: "CNPJ" },
                    { field: "telefone", placeholder: "(47) 0000-0000", label: "Telefone" },
                    { field: "email",    placeholder: "email@empresa.com", label: "E-mail" },
                    ].map(({ field, placeholder, label }) => ( //Desestruturando
                    <div key={field} className={styles.filtroGrupo}>
                        <label className={styles.filtroLabel}>{label}</label>
                        <input
                        className={styles.input}
                        placeholder={placeholder}
                        value={novoFornecedor[field]} // vale o valor de field
                        onChange={(e) => setNovoFornecedor((p) => ({ ...p, [field]: e.target.value }))} // pega o estado atual, mantém tudo e altera só o campo atual com o e.target. 
                        
                        /> {/* Isso é repetido para todos os itens de map. */}
                    </div>
                    ))}
                </div>

                {/* BOTÕES */}
                <div className={styles.formAcoes} style={{ padding: "0 20px 18px", justifyContent: "flex-end" }}>
                    
                    {/* BOTÃO CANCELAR CONDICIONAL */}
                    {editarFornecedor && (

                    <button
                        className={styles.botaoCancelar}
                        onClick={() => {
                        setEditarFornecedor(null);
                        setNovoFornecedor({ nome: "", cnpj: "", telefone: "", email: "" });
                        }}
                    >
                        <X size={14} weight="bold" /> Cancelar edição
                    </button>
                    
                    )}

                    {/* BOTÃO CADASTRAR/SALVAR CONDICIONAL */}
                    <button
                        className={styles.botaoPrincipal}
                        onClick={handleSalvarFornecedor}
                        disabled={!novoFornecedor.nome}
                        >
                        <FloppyDisk size={14} weight="bold" />
                        {editarFornecedor ? "Salvar alterações" : "Cadastrar"}
                    </button>

                </div>

            </div>

            {/* DIV LISTA */}
            <div className={styles.tabelaWrapper}>

               {/* TITÚLOS */} 
              <div className={`${styles.tituloLista} ${styles.gridFornecedores}`}>
                <span>Nome</span>
                <span>CNPJ</span>
                <span>Telefone</span>
                <span>E-mail</span>
                <span></span>
              </div>

              {/* LISTA */}
              <div className={styles.lista}>
                {/* LISTA VAZIA*/}
                {fornecedores.length === 0 && (
                  <div className={styles.estadoVazio}>
                    <Building size={36} className={styles.iconeVazio} />
                    <p>Nenhum fornecedor cadastrado</p>
                  </div>
                )}

                {/* LISTA FORNECEDORES */}
                {fornecedores.map((f) => (
                  <div key={f.id} className={`${styles.itemRow} ${styles.gridFornecedores}`}>
                    <span className={styles.cellFornecedor}>
                      <Building size={13} />
                      {f.nome}
                    </span>
                    <span>{f.cnpj || "—"}</span>
                    <span>{f.telefone || "—"}</span>
                    <span>{f.email || "—"}</span>
                    <div className={styles.acoesRow}>

                    {/* EDITAR FORNECEDOR */}
                      <button className={styles.btnIcone} onClick={() => handleEditarFornecedor(f)} title="Editar">
                        <PencilSimple size={14} weight="bold" />
                      </button>

                    {/* EXCLUIR */}

                    <AlertaRadix
                        titulo="Cancelar pedido"
                        descricao="Você realmente deseja cancelar o pedido?"
                        tratar={'handleCancelarPedido'}
                        confirmarTexto="Confirmar cancelamento"
                        cancelarTexto="Sair"
                        trigger={
                            <button
                                className={`${styles.btnIcone} ${styles.btnIconeRed}`}
                                onClick={() => handleInativarFornecedor(f)}
                                title="Excluir">

                                <Trash size={14} weight="bold" />
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
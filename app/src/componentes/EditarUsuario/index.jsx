import { useState } from 'react'
import styles from './styles.module.css'
import { AtIcon, EnvelopeIcon, FloppyDiskIcon, PowerIcon, IdentificationCardIcon, ListChecksIcon, ShieldIcon, WhatsappLogoIcon, XIcon } from '@phosphor-icons/react'
import { AlertaRadix } from '../ui/alerta/alerta'
import { AlterarUsuario } from '../../operadores/API/usuario/alterarUsuario'
import { usarToast } from '../Context/toastContext'

export default function EditarUsuario ({setRender, usuario}) {

    // Estados
    const [nivelAcesso, setNivelAcesso] = useState("")
    const [status, setStatus] = useState("")

    // Hook
    const { setMensagem } = usarToast();

    // Listas
    const listaNiveisAcessos = ['ADMIN', 'BALCAO', 'DELIVERY', 'EXTERNO', 'USUARIO']


    // Filtrar as lista de opções do select que apareça todas menos a opção atual do usuário
    const listaNivelAcessoFiltrada = listaNiveisAcessos.filter(
      lista => lista !== usuario.nivelAcesso
    )
    const listaStatusFiltrada = usuario.status === true ? 'INATIVO' : 'ATIVO'
    

    // Função salvar novas alterações
    const alterarUsuario = async ()  => {
      if(!nivelAcesso && !status) {
        setMensagem('Verifique se realmente alterou os estados de pelo menos um dos campo entre Novo nivel de acesso e Status do usuário')
        return
      }

      try {

        console.log('Dados: ', status, '--' ,nivelAcesso)
        const usuarioAlterado = await AlterarUsuario(usuario.id, status, nivelAcesso);

        if(usuarioAlterado) {
          setRender('lista')
          setMensagem('Alteração realizada com sucesso!');        
        } 
      } catch (error) {
        console.log(error)
      }
    }


    //Função que cancela a alteração
    const cancelarAlteracao = () => {
      setStatus("")
      setNivelAcesso("")

      return
    }


    return (
    <div className={styles.container}>
      {/* FORMULÁRIO */}
      <div className={styles.card}>

        {/* SUBTÍTULOS */}
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderTitle}>
            <ListChecksIcon size={17} weight="fill" className={styles.cardHeaderIcon} />
            <h2>Editar usuário</h2>
          </div>
        </div>

        {/* INPUTS */}
        <div className={styles.containerInputs}>
          {/* NOME */}
          <div className={styles.divInput}>
            <label className={styles.filtroLabel}>
              <IdentificationCardIcon size={13} />
              NOME
            </label>
            <input 
                className={styles.input} 
                value={usuario.nome} 
                readOnly
              />
          </div>

          {/* EMAIL */}
          <div className={styles.divInput}>
            <label className={styles.filtroLabel}>
              <EnvelopeIcon size={13} />
              EMAIL
            </label>
            <input 
                className={styles.input} 
                value={usuario.email}
                readOnly
              />
          </div>

          {/* USUARIO */}
          <div className={styles.divInput}>
            <label className={styles.filtroLabel}>
              <AtIcon size={13} />
              USUÁRIO
            </label>
            <input 
                className={styles.input} 
                value={usuario.usuario}
                readOnly
              />
          </div>

          {/* WHATSAPP */}
          <div className={styles.divInput}>
            <label className={styles.filtroLabel}>
              <WhatsappLogoIcon size={13} />
              WHATSAPP
            </label>
            <input 
                className={styles.input} 
                value={usuario.whatsapp}
                readOnly
              />
          </div>

          {/* NÍVEL DE ACESSO ATUAL */}
          <div className={styles.divInput}>
            <label className={styles.filtroLabel}>
              <ShieldIcon size={13} />
              NÍVEL DE ACESSO ATUAL
            </label>
            <input 
                className={styles.input} 
                value={usuario.nivelAcesso}
                readOnly
              />
          </div>

          {/* NOVO NIVEL DE ACESSO */}
          <div className={styles.divInput}>
            <label className={styles.filtroLabelEditar}>
              <ShieldIcon size={13} />
                NOVO NÍVEL DE ACESSO
            </label>
            <div className={styles.nivelWrapperEditar}>

              <select 
                className={styles.inputEditar} 
                value={nivelAcesso}
                onChange={(e) => setNivelAcesso(e.target.value)}
                >
                <option value={""} disabled>
                  Selecione
                </option>

                {listaNivelAcessoFiltrada.map((lista, index) => (
                  <option key={index} value={lista}>
                    {lista}
                  </option>
                )
              )}
              </select>

            </div>
          </div>

          {/* STATUS USUÁRIO ATUAL */}
          <div className={styles.divInput}>
            <label className={styles.filtroLabel}>
              <PowerIcon size={13} />
              STATUS ATUAL DO USUÁRIO
            </label>
            <input 
                className={styles.input} 
                value={usuario.status ? 'ATIVO' : 'INATIVO'}
                readOnly
              />
          </div>

          {/* NOVO STATUS DO USUÁRIO */}
          <div className={styles.divInput}>
                <label className={styles.filtroLabelEditar}>
                    <PowerIcon size={13} />
                    NOVO STATUS
                </label>
                <div className={styles.nivelWrapperEditar}>

                <select 
                    className={styles.inputEditar} 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    >
                    <option value={""} disabled>Selecione</option>
                    <option value={listaStatusFiltrada}> {listaStatusFiltrada} </option> 
                </select>

                </div>
          </div>

        </div>


        {/* BOTÕES */}
        <div className={styles.acoes}>

          {/* BOTÃO DE CANCELAR */}
          <AlertaRadix
            titulo="Cancelar alteração"
            descricao="Você realmente deseja cancelar esta alteração?"
            tratar={cancelarAlteracao}
            confirmarTexto="Confirmar"
            cancelarTexto="Sair"
            trigger={
              <button className={styles.botaoCancelar} type="button">
                <XIcon size={15} weight="bold" />
                Cancelar
              </button>
            }
          />
          
          {/* BOTÃO DE SALVAR */}
          <AlertaRadix
            titulo="Confirmar esta alteração"
            descricao="Você realmente deseja confirmar esta alteração?"
            tratar={alterarUsuario}
            confirmarTexto="Confirmar"
            cancelarTexto="Sair"
            trigger={
            <button className={styles.botaoPrincipal} type="button">
              <FloppyDiskIcon size={15} weight="fill" />
              Salvar alteração
            </button>
            }
          />

        </div>

      </div>

    </div>
    )
}
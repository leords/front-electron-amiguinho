import { useState } from 'react'
import styles from './styles.module.css'
import { AtIcon, EnvelopeIcon, FloppyDiskIcon, PowerIcon, IdentificationCardIcon, ListChecksIcon, ShieldIcon, WhatsappLogoIcon, XIcon } from '@phosphor-icons/react'
import { AlertaRadix } from '../ui/alerta/alerta'

export default function EditarUsuario ({usuario}) {

    const [nivelAcesso, setNivelAcesso] = useState("")
    const [status, setStatus] = useState("")

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

          {/* NIVEL DE ACESSO */}
          <div className={styles.divInput}>
            <label className={styles.filtroLabel}>
              <ShieldIcon size={13} />
                NÍVEL DE ACESSO
            </label>
            <div className={styles.nivelWrapper}>

              <select 
                className={styles.input} 
                value={usuario.nivelAcesso}
                onChange={(e) => setNivelAcesso(e.target.value)}
                
                >
                <option value="" disabled>Selecione</option>
                <option value={'ADMIN'}>admin</option>
                <option value={'VENDAS'}>vendas</option>
                <option value={'BALCAO'}>balcão</option>
                <option value={'DELIVERY'}>delivery</option>
                <option value={'EXTERNO'}>externo</option>
                <option value={'USUARIO'}>usuário</option>
              </select>

            </div>
          </div>

            {/* STATUS DO USUÁRIO */}
            <div className={styles.divInput}>
                <label className={styles.filtroLabel}>
                    <PowerIcon size={13} />
                    STATUS USUÁRIO
                </label>
                <div className={styles.nivelWrapper}>

                <select 
                    className={styles.input} 
                    value={usuario.status === true ? 'ATIVO' : 'INATIVO'}
                    onChange={(e) => setStatus(e.target.value)}
                    
                    >
                    <option value="" disabled>Selecione</option>
                    <option value={'ATIVO'}>ativo</option>
                    <option value={'INATIVO'}>inativo</option>

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
            tratar={''}
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
            tratar={''}
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
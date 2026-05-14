import { useState } from 'react';
import { AlertaRadix } from '../ui/alerta/alerta';
import styles from './styles.module.css';
import { UserPlusIcon, WhatsappLogoIcon, IdentificationCardIcon, EnvelopeIcon, AtIcon, LockIcon, LockKeyIcon, ShieldIcon, InfoIcon, XIcon, FloppyDiskIcon, ListChecksIcon } from '@phosphor-icons/react';
import { CriarUsuario } from '../../operadores/API/usuario/criarUsuario';
import { ToastRadix } from '../ui/notificacao/notificacao';
import { usarToast } from '../Context/toastContext';


export default function NovoUsuario({setRender}) {

  // Estados
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [usuario, setUsuario] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [nivelAcesso, setNivelAcesso] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmaSenha, setConfirmarSenha] = useState("")
  const [validaDados, setValidaDados] = useState(false)
  const [validaSenha, setValidaSenha] = useState(false)


  // Hook
  const { setMensagem } = usarToast();

    

  const EnviarNovoCadastro = async () => {
    // valida o preenchimento de todos os campos
    if(!nome || !usuario || !email || !nivelAcesso || !senha || !confirmaSenha) {
      setValidaDados(true)
      return
    }
    // valida se as senhas se coincidem 
    if(senha !== confirmaSenha) {
      setValidaSenha(true)
      return
    }

    try {
      // Criando objeto do novo cadastro
      const novoUsuarioData = {
        nome: nome,
        email: email,
        usuario: usuario,
        senha: senha,
        nivelAcesso: nivelAcesso,
        whatsapp: whatsapp
      }

      // Chamando a função novo usuário
      const novoUsuario = await CriarUsuario(novoUsuarioData)

      if(novoUsuario.usuario) {
        setMensagem(`Usuário ${novoUsuario.usuario.nome} cadastrado com sucesso!`)

        // limpar os campos
        LimparNovoCadastro();

        // voltar para lista
        setRender('lista')

      }
    } catch (error) {
      alert('Erro: ', error) 
      setMensagem(`${error.message} ao cadastrar novo usuário, tente novamente`)
    }
  }

  const LimparNovoCadastro = async () => {
    setNome("")
    setEmail("")
    setUsuario("")
    setWhatsapp("")
    setNivelAcesso("")
    setSenha("")
    setConfirmarSenha("")
    setValidaDados(false)
    setValidaSenha(false)
  }



  return (
    <div className={styles.container}>
      
      {/* FORMULÁRIO */}
      <div className={styles.card}>

        {/* SUBTÍTULOS */}
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderTitle}>
            <ListChecksIcon size={17} weight="fill" className={styles.cardHeaderIcon} />
            <h2>Dados do usuário</h2>
          </div>
        </div>

        {/* INPUTS */}
        <div className={styles.containerInputs}>
          {/* NOME */}
          <div className={styles.divInput}>
            <label className={`
                ${styles.filtroLabel}
                ${validaDados ? styles.filtroLabelErro : ''}
              `}>

              <IdentificationCardIcon size={13} />
              { validaDados === true ? 'Nome é obrigatório *' : 'Nome' }
            </label>
            <input 
              className={styles.input} 
              type="text" 
              placeholder="Nome completo" 
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              />
          </div>

          {/* EMAIL */}
          <div className={styles.divInput}>
            <label className={`
                ${styles.filtroLabel}
                ${validaDados ? styles.filtroLabelErro : ''}
              `}>

              <EnvelopeIcon size={13} />
              { validaDados === true ? 'Email é obrigatório *' : 'Email' }
            </label>
            <input 
              className={styles.input} 
              type="email" 
              placeholder="email@empresa.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              
              />
          </div>

          {/* USUARIO */}
          <div className={styles.divInput}>
            <label className={`
                ${styles.filtroLabel}
                ${validaDados ? styles.filtroLabelErro : ''}
              `}>

              <AtIcon size={13} />
              { validaDados === true ? 'Usuário é obrigatório *' : 'USUÁRIO' }
            </label>
            <input 
              className={styles.input} 
              type="text" 
              placeholder="nome.usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
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
              type="number" 
              placeholder="47911223344"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              />
          </div>

          {/* SENHA */}
          <div className={styles.divInput}>
            <label className={`
                ${styles.filtroLabel}
                ${validaDados ? styles.filtroLabelErro : ''}
              `}>

              <LockIcon size={13} />
              { validaDados === true ? 'Senha é obrigatório *' : 'SENHA' }
            </label>
            <input 
              className={styles.input} 
              type="password" 
              placeholder="••••••••" 
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              />
          </div>

          {/* NIVEL DE ACESSO */}
          <div className={styles.divInput}>
            <label className={`
                ${styles.filtroLabel}
                ${validaDados ? styles.filtroLabelErro : ''}
              `}>

              <ShieldIcon size={13} />
              { validaDados === true ? 'Nível de acesso é obrigatório *' : 'NÍVEL DE ACESSO' }
            </label>
            <div className={styles.nivelWrapper}>

              <select 
                className={styles.input} 
                placeholder="ex: vendas, balcao, delivery…"
                value={nivelAcesso}
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

          {/* CONFIRMAR SENHA */}
          <div className={styles.divInput}>
            <label className={`
                ${styles.filtroLabel}
                ${validaDados ? styles.filtroLabelErro : ''}
              `}>

              <LockKeyIcon size={13} />
              { validaDados === true ? 'Confirmação de senha é obrigatório *' : 'CONFIRME A SENHA' }
            </label>
            <input 
              className={styles.input} 
              type="password" 
              placeholder="••••••••" 
              value={confirmaSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              />

          </div>


        </div>
        { validaSenha && 
          <div className={styles.containerRetornoSenha}>
            <p className={styles.retornoSenha}> As senhas não coincidem, tente novamente!</p>
          </div> 
        }

        {/* BOTÕES */}
        <div className={styles.acoes}>

          {/* BOTÃO DE CANCELAR */}
          <AlertaRadix
            titulo="Cancelar cadastro"
            descricao="Você realmente deseja cancelar este cadastro?"
            tratar={LimparNovoCadastro}
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
            titulo="Confirmar novo cadastro"
            descricao="Você realmente deseja confirmar este cadastro?"
            tratar={EnviarNovoCadastro}
            confirmarTexto="Confirmar"
            cancelarTexto="Sair"
            trigger={
            <button className={styles.botaoPrincipal} type="button">
              <FloppyDiskIcon size={15} weight="fill" />
              Salvar usuário
            </button>
            }
          />

        </div>

      </div>

    </div>
  );
}
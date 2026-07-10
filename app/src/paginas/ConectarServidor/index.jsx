import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { LockKey, X, ArrowRight, NetworkIcon, CheckFatIcon, DesktopTowerIcon, CheckCircleIcon  } from "@phosphor-icons/react";
import Spinner from "../../componentes/Spinner";
import { AlertaRadix } from "../../componentes/ui/alerta/alerta";

export default function ConectarServidor({ funcaoParametro }) {

    // Variável .env
    const senhaServidor = import.meta.env.VITE_SENHA_CONFIG_SERVIDOR;

    // Estados
    const [senha, setSenha] = useState("");
    const [carregamento, setCarregamento] = useState(false);
    const [acesso, setAcesso] = useState(false);
    const [informativo, setInformativo] = useState("")
    const [balcao, setBalcao] = useState("")
    const [validaTerminal, setValidaTerminal] = useState("")


    // Validar status atual do terminal configurado.
    useEffect(() => {
        // Buscando o valor alocado no storaged
        setValidaTerminal(localStorage.getItem('balcao'))
    }, [])

    async function limparTerminal() {
        setValidaTerminal("")
        localStorage.setItem('balcao', "")
    }


    // Validando acesso de ADM
    async function iniciarAcessoADM() {

        setCarregamento(true);
        
        const tempoMinimo = 2000;
        const inicio = Date.now();
        
        try {
            if(senhaServidor !== senha) {
                setInformativo('A senha de acesso admin está incorreta!')
                return
            }
            // Garante tempo mínimo de loading
            const tempoPassado = Date.now() - inicio;
            const restante = tempoMinimo - tempoPassado;
        
            if (restante > 0) {
                await new Promise((resolve) => setTimeout(resolve, restante));
            }
              
            setAcesso(true);
            setInformativo('')
              
        } catch (error) {
            alert(error.message);
        } finally {
            setCarregamento(false);
        }
    }

    // Validando balcao destino.
    async function iniciarBalcaoDestino() {

        setCarregamento(true);
        
        const tempoMinimo = 2000;
        const inicio = Date.now();
        
        try {
            setCarregamento(true)

            if(!balcao && !validaTerminal) {
                setInformativo('Informe um balcão válido')
                return
            }

            // Garante tempo mínimo de loading
            const tempoPassado = Date.now() - inicio;
            const restante = tempoMinimo - tempoPassado;
        
            if (restante > 0) {
                await new Promise((resolve) => setTimeout(resolve, restante));
            }

            // Só salva se for um dos balcão.
            if(balcao && balcao !== 'admin') {
                localStorage.setItem('balcao', balcao);
            }

                    
        } catch (error) {
            alert(error.message);
        } finally {
            setCarregamento(false);
            console.log('Balcão destino: ', balcao)
            funcaoParametro();
        }
    }


  return (
    <div className={styles.containerADM}>
      <div className={styles.modal}>

        {/* CABEÇALHO */}
        <div className={styles.modalHeader}>
          <div className={styles.iconeWrapper}>
            <LockKey size={22} weight="fill" />
          </div>
          <div>
            <p className={styles.modalSub}>Acesso restrito</p>
            <h2 className={styles.modalTitulo}>Painel Admin</h2>
          </div>
        </div>

        {/* VALIDANDO A SENHA */}
        {acesso === false 
            ? 
            // COMPONENTE DE SENHA
            (       
            <>
                <p className={styles.descricao}>
                    Para configurar o servidor, insira sua senha de administrador.
                </p>
                <div className={styles.campo}>
                <label className={styles.label}>
                    <LockKey size={12} weight="bold" /> Senha
                </label>
                <input
                    key="senha"
                    className={styles.input}
                    placeholder="Digite sua senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                />

                {informativo && <p className={styles.retorno}>{informativo}</p>}
                </div>
                {carregamento === true

                ?
                // Carregamento - Spinner
                (
                <div className={styles.spinner}>
                <Spinner />
                <p className={styles.retorno}>Autenticando...</p>
                </div>
                )
                :
                // botões
                (            
                <div className={styles.botoes}>
                    <button className={styles.botaoCancelar} onClick={funcaoParametro}>
                        <X size={15} weight="bold" />
                        Cancelar
                    </button>
                    <button
                        className={styles.botaoEntrar}
                        onClick={() => iniciarAcessoADM()}
                    >
                        Entrar
                        <ArrowRight size={15} weight="bold" />
                    </button>
                </div>
                )

                }
            </>
            )
            : 
            // COMPONENTE DE BALCÃO DESTINO
            (
            <>
                <p className={styles.descricao}>
                    Para configurar o balcão destino, escolha entre as opções.
                </p>
                <div className={styles.campo}>
                
                {/* VALIDA O CAMPO DE CONFIGURAR TERMINAL. */}
                {validaTerminal
                    ?
                    <div className={styles.terminal}>
                        <DesktopTowerIcon size={18} weight="duotone" color="orange" />
                        <label className={styles.modalSub}>
                            {`Este terminal já está configurado para: ${validaTerminal}`}
                        </label>
                    </div>
                    :
                    <>
                        <label className={styles.labelBalcao}>
                            <DesktopTowerIcon size={12} weight="bold" /> Balcão
                        </label>
                        <select
                            className={styles.input}
                            onChange={(e) => setBalcao(e.target.value)}
                        >
                            <option value="">Selecione</option>
                            <option value="b1">Balcão 01</option>
                            <option value="b2">Balcão 02</option>

                        </select>
                    </>
                }

                </div>

                {/* LOADING */}
                {carregamento === true
                    ?
                    (
                    <div className={styles.spinner}>
                        <Spinner />
                        <p className={styles.retorno}>Autenticando...</p>
                    </div>
                    )
                    :
                    (
                    <div className={styles.botoes}>
                        {!validaTerminal ?

                            <button className={styles.botaoConectar} onClick={iniciarBalcaoDestino}>
                                <CheckFatIcon  size={15} weight="bold" />
                                Selecionar
                            </button>
                            :
                            <>
                            <AlertaRadix
                                titulo="Limpar terminal"
                                descricao="Você realmente deseja limpar o terminal de destino?"
                                tratar={limparTerminal}
                                confirmarTexto="Sim, limpar!"
                                cancelarTexto="Cancelar"
                                trigger={
                                <button className={styles.botaoLimpar}>
                                    <CheckCircleIcon size={18} weight="bold" />
                                    Limpar terminal
                                </button>
                                }
                            />
                            <button className={styles.botaoSair} onClick={() => funcaoParametro()}>
                                <CheckFatIcon  size={15} weight="bold" />
                                Sair
                            </button>
                            </>


                        }

                    </div>
                    )  
                }
            </>
            )
    
        }


      </div>
    </div>
  );
}
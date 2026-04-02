import { useState } from "react";
import styles from "./styles.module.css";
import { LockKey, X, ArrowRight, NetworkIcon, CheckFatIcon, DesktopTowerIcon  } from "@phosphor-icons/react";
import { testeServidor } from "../../operadores/API/testeServidor/testeServidor.js";
import Spinner from "../../componentes/Spinner";

export default function ConectarServidor({ funcaoParametro }) {

    // variável .env
    const senhaServidor = import.meta.env.VITE_SENHA_CONFIG_SERVIDOR;

    // estados
    const [senha, setSenha] = useState("");
    const [dominio, setDominio] = useState("");
    const [carregamento, setCarregamento] = useState(false);
    const [acesso, setAcesso] = useState(false);
    const [informativo, setInformativo] = useState("")
    const [statusCode, setStatusCode] = useState(0)
    const [balcao, setBalcao] = useState("")


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

    // Validando dominio de servidor.
    async function iniciarAcessoDominio() {

        setCarregamento(true);
        
        const tempoMinimo = 2000;
        const inicio = Date.now();
        
        try {
            setCarregamento(true)
            if(!dominio) {
                setInformativo('Informe um domínio válido')
                return
            }

            else if(!balcao) {
                setInformativo('Informe um balcão válido')
                return
            }

            // Garante tempo mínimo de loading
            const tempoPassado = Date.now() - inicio;
            const restante = tempoMinimo - tempoPassado;
        
            if (restante > 0) {
                await new Promise((resolve) => setTimeout(resolve, restante));
            }

            const retorno = await testeServidor(dominio);
            if(retorno.mensagem !== 'Servidor conectado com sucesso') {
                setInformativo('Servidor não conectado!')
                return
            }

            setInformativo(`${retorno.mensagem} ✔`)
            setStatusCode(retorno.status)

            // setando o dominio e qual balcao no storaged
            localStorage.setItem('dominio', dominio);

            // só salva se for um dos balcão
            if(balcao !== 'delivery') {
                localStorage.setItem('balcao', balcao);
            }
            
        } catch (error) {
            alert(error.message);
        } finally {
            setCarregamento(false);
            setInformativo('')
        }
    }

    // Função que vem do elemento pai, controla a renderização desta tela
    function finalizar() {
        funcaoParametro();
    }


  return (
    <div className={styles.containerADM}>
      <div className={styles.modal}>

        {/* Cabeçalho */}
        <div className={styles.modalHeader}>
          <div className={styles.iconeWrapper}>
            <LockKey size={22} weight="fill" />
          </div>
          <div>
            <p className={styles.modalSub}>Acesso restrito</p>
            <h2 className={styles.modalTitulo}>Painel Admin</h2>
          </div>
        </div>

        {/* Validando senha para acesso a componentes */}
        {acesso === false 
            ? 
            // Componente de senha
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
            // Componente de domínio
            (
            <>
                <p className={styles.descricao}>
                Para configurar o servidor, insira seu domínio.
                </p>
                <div className={styles.campo}>
                <label className={styles.label}>
                    <NetworkIcon size={12} weight="bold" /> Domínio
                </label>
                <input
                    key="dominio"
                    onChange={e => setDominio(e.target.value)}
                    value={dominio}
                    className={styles.input}
                    placeholder="meu-dominio.com/api"
                    type="text"
                />
                {informativo && <p className={statusCode === "ok" ? styles.retornoOk  : styles.retorno}>{informativo}</p>}
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
                    <option value="delivery">Delivery 01</option>
                </select>
                </div>

                {/* Loading */}
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
                        {statusCode === "ok"
                            ?
                            // botão para finalizar sessão
                            (
                            <button className={styles.botaoConectar} onClick={finalizar}>
                                <CheckFatIcon  size={15} weight="bold" />
                                Finalizar
                            </button>
                            )
                            :
                            // botões de cancelar e conectar
                            (                        
                            <>
                                <button className={styles.botaoCancelar} onClick={funcaoParametro}>
                                    <X size={15} weight="bold" />
                                    Cancelar
                                </button>
                                <button
                                    key="dominio"
                                    className={styles.botaoConectar}
                                    onChange={(e) => setDominio(e.tarde.value)}
                                    value={dominio}
                                    onClick={() => iniciarAcessoDominio()}
                                >
                                    Conectar
                                    <NetworkIcon size={15} weight="bold" />
                                </button>
                            </>
                            )
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
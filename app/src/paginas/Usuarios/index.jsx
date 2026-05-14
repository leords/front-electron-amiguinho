
import { useNavigate } from 'react-router-dom';
import Cabecalho from '../../componentes/Cabecalho'
import ListaProduto from '../../componentes/Produtos';
import Rodape from '../../componentes/Rodape'
import styles from './styles.module.css'
import { Users, FileTextIcon, ArrowLeftIcon, PlusCircleIcon } from "@phosphor-icons/react";
import { useState } from 'react';
import ListaUsuario from '../../componentes/ListaUsuario';
import NovoUsuario from '../../componentes/NovoUsuario';
import { usarToast } from '../../componentes/Context/toastContext';
import { ToastRadix } from '../../componentes/ui/notificacao/notificacao';
import EditarUsuario from '../../componentes/EditarUsuario';


export default function Usuarios() {
    const navegar = useNavigate();

    // Estados
    const [render, setRender] = useState('lista')
    const [objetoUsuario, setObjetoUsuario] = useState(null)

    // Hooks
    const { mensagem } = usarToast();

    // Voltar à página gestão
    const tratarVoltarMenu = () => {
        if(render === 'lista') {
           navegar("/gestao"); 
        }
        setRender('lista')
    };

    return (
        <div className={styles.container} >
            <ToastRadix mensagem={mensagem} />
            <Cabecalho />
            <main className={styles.principal}>

                {/* CABEÇALHO */}
                <div className={styles.tituloSection}>
                    <div className={styles.containerTitulo}>
                        <div className={styles.iconeWrapper}>
                            <Users size={22} weight="fill" />
                        </div>
                        <div>
                            <p className={styles.pageSubtitulo}>Gestão</p>
                            <h1 className={styles.pageTitulo}>{render === "lista" ? "Usuários do sistema" : render === "editar" ? "Alterar dados de usuário" :"Cadastrar novo usuário"}</h1>
                        </div>
                    </div>

                    {/* BOTÃO VOLTAR */}
                    <button className={styles.botaoVoltar} onClick={tratarVoltarMenu}>
                        <ArrowLeftIcon size={14} weight="bold" />
                        Voltar
                    </button>
                </div>


                <div className={styles.tabelaWrapper}>
                    <div className={styles.lista}>
                        {render === 'lista' ?
                        <ListaUsuario 
                            setRender={setRender}
                            setObjetoUsuario={setObjetoUsuario}
                        /> 
                        : render === 'editar' ?
                        <EditarUsuario 
                            setRender={setRender}
                            usuario={objetoUsuario}
                        /> 
                        : render === 'cadastro' ?
                        <NovoUsuario 
                            setRender={setRender}
                        />
                        : ""
                    }
                    </div>
                </div>

            </main>
            <Rodape />
        </div>
    )
}

import { useNavigate } from 'react-router-dom';
import Cabecalho from '../../componentes/Cabecalho'
import ListaCliente from '../../componentes/Clientes';
import ListaProduto from '../../componentes/Produtos';
import Rodape from '../../componentes/Rodape'
import styles from './styles.module.css'
import { Users, FileTextIcon, ArrowLeftIcon } from "@phosphor-icons/react";


export default function Produtos() {

    const navegar = useNavigate();

    // Voltar à página gestão
    const tratarVoltarMenu = () => {
        navegar("/gestao");
    };

    return (
        <div className={styles.container} >
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
                            <h1 className={styles.pageTitulo}>Produtos cadastrados</h1>
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
                        <ListaProduto />    
                    </div>
                </div>

            </main>
            <Rodape />
        </div>
    )
}
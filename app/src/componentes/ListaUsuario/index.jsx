import { useEffect, useState } from 'react';
import styles from './styles.module.css'
import { LerUsuario } from '../../operadores/API/usuario/lerUsuario';
import { FileTextIcon, PlusCircleIcon } from '@phosphor-icons/react';


export default function ListaUsuario({setRender, setObjetoUsuario}) {
    const [usuarios, setUsuarios] = useState([]);
    const [carregando, setCarregando] = useState(false);

    const handleParametros = async (usuario) => {
        setRender('editar')
        setObjetoUsuario(usuario)
    }


    // Função que busca clientes
    useEffect(() => {
        const buscarUsuarios = async () => {
            setCarregando(true);
            try {
        
                const listaUsuarios = await LerUsuario();
                setUsuarios(listaUsuarios ?? []); 
                    
            }   catch {
                setUsuarios([]);
            }   finally {
                setCarregando(false);
            }
        };

        buscarUsuarios();
    }, []);


    return (
        <div className={styles.container}>

        {/* CABEÇALHO */}
            <div className={styles.cabecalhoPage}>
                {usuarios.length > 0 && (
                <span className={styles.badge}>
                    {`Resultado da pesquisa: ${usuarios.length} usuários`}
                </span>
                )}
                <div className={styles.botoes}>
                    <button 
                        className={styles.botaoNovoUsuario}
                        onClick={() => {setRender('cadastro')}}
                    >
                        <PlusCircleIcon size={18} />
                        Cadastrar novo usuário
                    </button>
                </div>
            </div>


        {/* TABELA */}
            <div className={styles.card}>
                {carregando ? (
                <div className={styles.estadoVazio}>
                    <div className={styles.spinner} />
                    <p>Carregando produtos...</p>
                </div>
                ) : usuarios.length === 0 ? (
                <div className={styles.estadoVazio}>
                    <FileTextIcon size={44} weight="duotone" className={styles.iconeVazio} />
                    <p>{usuarios ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}</p>
                </div>
                ) : (
                <div className={styles.tabelaWrapper}>

                    {/* SUBTÍTULOS */}
                    <div className={`${styles.tituloLista} ${styles.gridExterno}`}>
                        <span>ID</span>
                        <span>Nome</span>
                        <span>Email</span>
                        <span>Whatsapp</span>
                        <span>Usuario</span>
                        <span>Status</span>
                    </div>
        
                    {/* LISTA */}
                    <div className={styles.lista}>
                    {usuarios.map((usuario, index) =>
                        // LISTA EXTERNO                   
                        <div key={index} className={`${styles.itemRow} ${styles.gridExterno}`} onClick={() => handleParametros(usuario)}>
                            <span className={styles.idCell}>{usuario.id}</span>
                            <span className={styles.nomeCell}>{usuario.nome || '-'}</span>
                            <span>{usuario.email || '-'}</span>
                            <span>{usuario.whatsapp || '-'}</span>
                            <span>{usuario.usuario || '-'}</span>
                            <span>{usuario.status === true ? 'ativo' : 'inativo'}</span>
                        </div>
                    )}
                    </div>

                </div>
                )}
            </div>
        </div>
    );
}
import { useEffect, useState, useMemo } from 'react';
import styles from './styles.module.css';
import { LerClienteDelivery } from '../../operadores/API/cliente/lerClienteDelivery';
import { LerClienteExterno } from '../../operadores/API/cliente/lerClienteExterno';
import { FileTextIcon, MagnifyingGlassIcon, PlusCircleIcon, SpinnerIcon, UsersIcon } from '@phosphor-icons/react';

export default function ListaCliente() {
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [busca, setBusca] = useState('');
  const [opcao, setOpcao] = useState("externo")

  const link = import.meta.env.VITE_LINK_PANILHA_CLIENTES

    // Função que abre link externos - função que vem do electron
    function abrirLink() {
        window.LINK.abrirLinkExterno(link);
    }

    // Função que busca clientes
    useEffect(() => {
        const buscarClientes = async () => {
        setCarregando(true);
        try {
            if (opcao === 'delivery') {
            const clienteDelivery = await LerClienteDelivery();
            setClientes(clienteDelivery ?? []);
            } else if (opcao === 'externo') {
            const clienteExterno = await LerClienteExterno();
            setClientes(clienteExterno ?? []);
            } else {
            setClientes([]);
            }
        } catch {
            setClientes([]);
        } finally {
            setCarregando(false);
        }
        };
        buscarClientes();
        setBusca('');
    }, [opcao]);

    // Filtro de retorno
    const clientesFiltrados = useMemo(() => {
        if (!busca.trim()) return clientes;
        const termo = busca.toLowerCase();
        return clientes.filter((c) =>
        [c.nome, c.cnpj, c.telefone, c.cidade, c.endereco, c.bairro, c.vendedor, c.referencia]
            .some((v) => v && String(v).toLowerCase().includes(termo))
        );
    }, [clientes, busca]);

    const isExterno = opcao === 'externo';

    return (
        <div className={styles.container}>
            {/* FILTRO SETOR */}
            <select
                className={styles.input}
                value={opcao}
                onChange={(e) => setOpcao(e.target.value) }
            >
                <option value="delivery">Clientes do delivery</option>
                <option value="externo">Clientes de vendas externas</option>
            </select>

        {/* CABEÇALHO */}
        <div className={styles.cabecalhoPage}>
            {clientes.length > 0 && (
            <span className={styles.badge}>
                {`${clientesFiltrados.length} cadastros do setor ${opcao}`}
            </span>
            )}
                <span className={styles.link} onClick={abrirLink}>
                    <PlusCircleIcon size={18} />
                    Cadastrar novo cliente!
                </span>
        </div>

        {/* CAMPO DE BUSCA */}
        <div className={styles.painelBusca}>
            <div className={styles.inputBuscaWrapper}>
            <MagnifyingGlassIcon size={16} weight="bold" className={styles.iconeBusca} />
            <input
                type="text"
                className={styles.inputBusca}
                placeholder="Buscar por nome, cidade, telefone..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
            />
            {busca && (
                <button className={styles.limparBusca} onClick={() => setBusca('')} title="Limpar">
                ✕
                </button>
            )}
            </div>
        </div>

        {/* TABELA */}
        <div className={styles.card}>
            {carregando ? (
            <div className={styles.estadoVazio}>
                <div className={styles.spinner} />
                <p>Carregando clientes...</p>
            </div>
            ) : clientesFiltrados.length === 0 ? (
            <div className={styles.estadoVazio}>
                <FileTextIcon size={44} weight="duotone" className={styles.iconeVazio} />
                <p>{busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</p>
                <span>
                {busca
                    ? `Nenhum resultado para "${busca}"`
                    : 'Não há clientes registrados para esta categoria'}
                </span>
            </div>
            ) : (
            <div className={styles.tabelaWrapper}>

                {/* SUBTÍTULOS */}
                {isExterno ? (
                // EXTERNO
                <div className={`${styles.tituloLista} ${styles.gridExterno}`}>
                    <span>ID</span>
                    <span>Nome</span>
                    <span>CNPJ</span>
                    <span>Cidade</span>
                    <span>Endereço</span>
                    <span>Telefone</span>
                    <span>Vendedor</span>
                    <span>Atendimento</span>
                    <span>Frequência</span>
                </div>
                ) : (
                // DELIVERY
                <div className={`${styles.tituloLista} ${styles.gridDelivery}`}>
                    <span>ID</span>
                    <span>Nome</span>
                    <span>Telefone</span>
                    <span>Endereço</span>
                    <span>Bairro</span>
                    <span>Cidade</span>
                    <span>Referência</span>
                </div>
                )}

                {/* LISTA */}
                <div className={styles.lista}>
                {clientesFiltrados.map((cliente, index) =>
                    isExterno ? (
                    // LISTA EXTERNO
                    <div key={index} className={`${styles.itemRow} ${styles.gridExterno}`}>
                        <span className={styles.idCell}>{cliente.id}</span>
                        <span className={styles.nomeCell}>{cliente.nome || '-'}</span>
                        <span>{cliente.cnpj || '-'}</span>
                        <span>{cliente.cidade || '-'}</span>
                        <span>{cliente.endereco || '-'}</span>
                        <span>{cliente.telefone || '-'}</span>
                        <span>{cliente.vendedor || '-'}</span>
                        <span>{cliente.atendimento || '-'}</span>
                        <span>{cliente.frequencia || '-'}</span>
                    </div>
                    ) : (
                    // LISTA DELIVERY
                    <div key={index} className={`${styles.itemRow} ${styles.gridDelivery}`}>
                        <span className={styles.idCell}>{cliente.id}</span>
                        <span className={styles.nomeCell}>{cliente.nome}</span>
                        <span>{cliente.telefone || ''}</span>
                        <span>{`${cliente.endereco}, nº ${cliente.numero || '-'}`}</span>
                        <span>{cliente.bairro}</span>
                        <span>{cliente.cidade || ''}</span>
                        <span>{cliente.referencia || ''}</span>
                    </div>
                    )
                )}
                </div>

            </div>
            )}
        </div>
        </div>
    );
}
import { useEffect, useState, useMemo } from 'react';
import styles from './styles.module.css';
import { LerClienteDelivery } from '../../operadores/API/cliente/lerClienteDelivery';
import { LerClienteExterno } from '../../operadores/API/cliente/lerClienteExterno';
import { FileTextIcon, MagnifyingGlassIcon, PlusCircleIcon, SpinnerIcon, UsersIcon } from '@phosphor-icons/react';
import { LerProduto } from '../../operadores/API/produto/lerProduto';
import { formatarMoeda } from '../../utils/formartarMoeda';

export default function ListaProduto() {
  const [produtos, setprodutos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [busca, setBusca] = useState('');


  const link = import.meta.env.VITE_LINK_PANILHA_PRODUTOS

    // Função que abre link externos - função que vem do electron
    function abrirLink() {
        window.LINK.abrirLinkExterno(link);
    }

    // Função que busca produtos
    useEffect(() => {
        const buscarProdutos = async () => {
        setCarregando(true);
        try {

            const produtos = await LerProduto();
            setprodutos(produtos ?? []);            
        } catch {
            setprodutos([]);
        } finally {
            setCarregando(false);
        }
        };
        buscarProdutos();
        setBusca('');
    }, []);

    // Filtro de retorno
    const produtosFiltrados = useMemo(() => {
        if (!busca.trim()) return produtos;
        const termo = busca.toLowerCase();
        return produtos.filter((c) =>
        [c.nome, c.embalagem, c.segmento, c.fornecedor]
            .some((v) => v && String(v).toLowerCase().includes(termo))
        );
    }, [produtos, busca]);


    return (
        <div className={styles.container}>

        {/* CABEÇALHO */}
        <div className={styles.cabecalhoPage}>
            {produtos.length > 0 && (
            <span className={styles.badge}>
                {`Resultado da pesquisa: ${produtosFiltrados.length} produtos`}
            </span>
            )}
            <span className={styles.link} onClick={abrirLink}>
                <PlusCircleIcon size={18} />
                Cadastrar novo produto!
            </span>
        </div>

        {/* CAMPO DE BUSCA */}
        <div className={styles.painelBusca}>
            <div className={styles.inputBuscaWrapper}>
            <MagnifyingGlassIcon size={16} weight="bold" className={styles.iconeBusca} />
            <input
                type="text"
                className={styles.inputBusca}
                placeholder="Buscar por nome, embalagem, segmento, fornecedor..."
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
                <p>Carregando produtos...</p>
            </div>
            ) : produtosFiltrados.length === 0 ? (
            <div className={styles.estadoVazio}>
                <FileTextIcon size={44} weight="duotone" className={styles.iconeVazio} />
                <p>{busca ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}</p>
                <span>
                {busca
                    ? `Nenhum resultado para "${busca}"`
                    : 'Não há produtos registrados para esta categoria'}
                </span>
            </div>
            ) : (
            <div className={styles.tabelaWrapper}>

                {/* SUBTÍTULOS */}
                <div className={`${styles.tituloLista} ${styles.gridExterno}`}>
                    <span>ID</span>
                    <span>Nome</span>
                    <span>Segmento</span>
                    <span>Fornecedor</span>
                    <span>R$ Compra</span>
                    <span>R$ Venda</span>
                    <span>R$ Unidade</span>
                    <span>Peso</span>
                    <span>Margem</span>
                </div>
    
                {/* LISTA */}
                <div className={styles.lista}>
                {produtosFiltrados.map((produto, index) =>
                    // LISTA EXTERNO

                    
                    <div key={index} className={`${styles.itemRow} ${styles.gridExterno}`}>
                        <span className={styles.idCell}>{produto.id}</span>
                        <span className={styles.nomeCell}>{produto.nome || '-'}</span>

                        <span>{produto.segmento || '-'}</span>
                        <span>{produto.fornecedor || '-'}</span>
                        <span>{formatarMoeda(produto.precoCompra) || '-'}</span>
                        <span>{formatarMoeda(produto.precoVenda) || '-'}</span>
                        <span>{formatarMoeda(produto.precoUndVenda) || '-'}</span>
                        <span>{`${produto.peso} kg`}</span>
                        <span>{`${( (produto.margem*100).toFixed(2))}%`}</span>
                    </div>
                    
                )}
                </div>

            </div>
            )}
        </div>
        </div>
    );
}
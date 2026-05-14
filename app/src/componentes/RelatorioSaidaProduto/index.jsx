import { useEffect, useState} from "react";
import {
  FilePdfIcon,
  Package,
  MagnifyingGlass,
  X,
  Barcode,
  ArrowLeft,
  ArrowLeftIcon,
  FileXlsIcon
  
} from "@phosphor-icons/react";
import styles from "./styles.module.css";
import AjustarProdutoEstoque from "../AjustarProdutoEstoque";
import { usarToast } from "../Context/toastContext";
import { AlertaRadix } from "../ui/alerta/alerta";
import SaidaEstoque from "../SaidaEstoque";
import { RelatorioSTP } from "../../operadores/API/produto/relatorioSTP";

export default function RelatorioSaidaProduto({ setView }) {

  // Estados
  const [itens, setItens] = useState([]);
  const [itensFiltrados, setItensFiltrados] = useState([])
  const [carregando, setCarregando] = useState(false);
  const [busca, setBusca] = useState("");
  const [setor, setSetor] = useState('geral');
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim]       = useState("");

  // Hooks
  const { setMensagem } = usarToast()

  // Função para gerar PDF
  const gerarPDF = async () => {

        try {
            if(itens) {
                // Gerando o PDF
                await window.PDF.gerarPDFSaidaProdutos(setor, itens);
            }
            return
        } catch (error) {
            console.log(error)
            setMensagem('Erro ao gerar relatório PDF', error.message)
        }
  }

  // Função para gerar CSV
  const gerarCSV = async () => {

        try {

            if(itens) {
                console.log('relatorio para csv existe!')
                // Gerando o PDF
                await window.PDF.baixarCSV(itens);
            }
            return
        } catch (error) {
            console.log(error)
            setMensagem('Erro ao gerar relatório CSV', error.message)
        }
  }

  // Função que faz a chamada na API
  const carregarSaidasEstoque = async () => {

    // Validando dados para filtro
    if(!dataInicio || dataInicio === undefined || !dataFim || dataFim === undefined) {
      setMensagem('Erro: selecione o setor e o período para gerar o resultado.')
      return
    }

    try {
      setCarregando(true)
      const relatorio = await RelatorioSTP(setor, {dataInicio, dataFim})

      if(!relatorio) return

       setItens(relatorio)
       setItensFiltrados(relatorio)


    } catch (error) {
        setMensagem('Erro ao buscar relatório de saída de produtos.', error.message)
        console.log(error)
    } finally {
        setCarregando(false)
    }
  }

  // Função que atualiza a lista de itens conforme a busca
  useEffect(() => {

    // valida busca (.trim remove os espaços em brancos)
    if(!busca.trim()) {
      setItensFiltrados(itens)
      return
    }

    // filtrando
    const filtro = itens.filter((i) =>
      i.produto?.toLowerCase().includes(busca.toLowerCase())
    );

    setItensFiltrados(filtro)
  
  }, [busca, itens])


  return (
    <div className={styles.container}>

    {/* CABEÇALHO */}
        <div className={styles.cardHeader}>
            <div className={styles.cardHeaderTitle}>
                <Package size={18} className={styles.cardHeaderIcon} />
                <h2>Relatório de saída de produtos</h2>
            </div>
            <button className={styles.botaoVoltar} onClick={() => setView("lista")}>
                <ArrowLeftIcon size={14} weight="bold" />
                Voltar
            </button>
        </div>

      {/* PAINEIS */}
      <div className={styles.layoutDuplo}>

        {/* COMPONENTE DE FILTROS */}
        <div className={styles.colunaAjuste}>
          <SaidaEstoque 
          setSetor={setSetor}
          setDataInicio={setDataInicio}
          setDataFim={setDataFim}
          dataInicio={dataInicio}
          dataFim={dataFim}
          handleBuscar={carregarSaidasEstoque}
          />
        </div>

        {/* LISTA */}
        <div className={styles.colunaLista}>

          {/* BUSCAR */}
          <div className={styles.buscaWrapper}>
            <MagnifyingGlass size={16} className={styles.buscaIcone} />
            <input
              className={styles.buscaInput}
              placeholder="Buscar produto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            {busca && (
              <button className={styles.buscaLimpar} onClick={() => setBusca("")}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* TABELA */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <Barcode size={17} className={styles.cardHeaderIcon} />
                <h2>Produtos em Estoque</h2>
              </div>
            
              {/* DESCRIÇÃO DE QUANTIDADE */}
              <span className={styles.badge}>
                {itensFiltrados.length} produto{itensFiltrados.length !== 1 ? "s" : ""}
              </span>

              {/* BOTÕES */}
              <div className={styles.geradoresDoc}>
                {/* BOTÕES GERAR PDF*/}
                  <AlertaRadix
                      titulo="Gerar documento em PDF"
                      descricao="Você realmente deseja gerar o PDF"
                      tratar={gerarPDF} 
                      confirmarTexto="Confirmar"
                      cancelarTexto="Sair"
                      trigger={
                      <button className={styles.botaoGerarPDF} title="Baixar documento em PDF">
                          <FilePdfIcon size={18} weight='bold'/>
                      </button>
                      }
                  />

                  {/* BOTÕES GERAR CSV*/}
                  <AlertaRadix
                      titulo="Gerar documento em CSV"
                      descricao="Você realmente deseja gerar o CSV"
                      tratar={gerarCSV} 
                      confirmarTexto="Confirmar"
                      cancelarTexto="Sair"
                      trigger={
                      <button className={styles.botaoGerarCSV} title="Baixar documento em CSV">
                          <FileXlsIcon size={18} weight='bold'/>
                      </button>
                      }
                  />
              </div>

            </div>

            {/* TÍTULOS */}
            <div className={styles.tabelaWrapper}>
              {/* SUBTÍTULOS LISTA */}
              <div className={styles.tituloLista}>
                <span>#</span>
                <span>Produto</span>
                <span>Quantidade</span>
              </div>

            {/* LISTA */}
              {carregando ? (
                <div className={styles.estadoVazio}>
                  <div className={styles.spinner} />
                  <p>Carregando estoque...</p>
                </div>
                // LISTA VAZIA
              ) : itensFiltrados.length === 0 ? (
                <div className={styles.estadoVazio}>
                  <Package size={40} className={styles.iconeVazio} />
                  <p>Nenhum produto encontrado</p>
                  <span>Tente outro termo na busca</span>
                </div>
              ) : (

                // LISTA PRODUTOS 
                <div className={styles.lista}>
                  {itensFiltrados.map((item, index) => {
                    return (
                      <div key={index} className={styles.itemRow}>
                        <span className={styles.itemId}>#{item.id}</span>
                        <span className={styles.itemNome}>{item.produto}</span>
                        <span className={styles.itemEstoque}>{item.quantidade}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
        
      </div>
    </div>
  );
}
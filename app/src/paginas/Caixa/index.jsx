import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CashRegister, CurrencyDollar, ArrowLeft, Desktop, Receipt, Lock, PaperPlaneTilt, HandCoinsIcon } from "@phosphor-icons/react";
import { LerInicioCaixa } from "../../operadores/API/caixa/lerInicioCaixa";
import { usarToast } from "../../componentes/Context/toastContext";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";
import Spinner from "../../componentes/Spinner";
import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import { dataFormatadaCalendario } from "../../utils/data";
import { buscarFechamentoBalcao } from "../../operadores/API/fechamento/buscarFechamentoBalcao";
import styles from "./styles.module.css";
import { AlertaRadix } from "../../componentes/ui/alerta/alerta";
import { AjustarInicioCaixa } from "../../operadores/API/caixa/ajustarInicioCaixa";
import { formatarMoeda } from "../../utils/formartarMoeda";
import { LerTaxaDelivery } from "../../operadores/API/taxaDelivery/lerInicioCaixa";
import { ajustarTaxaDelivery } from "../../operadores/API/taxaDelivery/ajustarTaxaDelivery";

export default function Caixa () {

    const navegar = useNavigate();

    // Estados
    const [carregandoInicioCaixa, setCarregandoInicioCaixa] = useState(false);
    const [carregandoTaxaDelivery, setCarregandoTaxaDelivery] = useState(false);

    const [inicioCaixa, setInicioCaixa] = useState("")
    const [taxaEntrega, setTaxaEntrega] = useState("")

    const [valorCaixa, setValorCaixa] = useState("")
    const [valorDelivery, setValorDelivery] = useState("")

    const [valorAdicionalDelivery, setValorAdicionalDelivery] = useState("")

    const [valorAjusteDeliveryStoraged, setAjusteDeliveryStoraged] = useState("")

    const [balcao1, setBalcao1] = useState("")
    const [balcao2, setBalcao2] = useState("")
    const [atualizarCaixar, setAtualizarCaixa] = useState(false)
    const [atualizarDelivery, setAtualizarDelivery] = useState(false)


    // Hooks
    const { mensagem, setMensagem } = usarToast();

    // Buscando se há ajuste realizado para taxa de entrega.
    useEffect(() => {
      const retornoAjusteTaxa = localStorage.getItem('adicionalTaxaDelivery');
    
      if(retornoAjusteTaxa) {
        setAjusteDeliveryStoraged(Number(retornoAjusteTaxa));
      }
    }, [])

    // Buscar fechamento de balcões.
    useEffect(() => {
        const fechamentoBalcoes = async () => {
            // Pegando a data atual no formato preciso.
            const dataFormatada = dataFormatadaCalendario();

            // Busca balcão 1
            const fBalcao1 = await buscarFechamentoBalcao({ setor: 'balcao', data: dataFormatada, vendedor: 'b1' });
            setBalcao1(fBalcao1);

            // Busca balcão 2
            const fBalcao2 = await buscarFechamentoBalcao({ setor: 'balcao', data: dataFormatada, vendedor: 'b2' });
            setBalcao2(fBalcao2);
        }

        fechamentoBalcoes()
    }, [])
    
    // Função de voltar a página gestão.
    const tratarVoltarMenu = () => {
        navegar("/gestao");
    };

    // Função de alteração de valor de inicio de caixa.
    const alterarValorInicial = async () => {

        if(!valorCaixa) {
            setMensagem('Informe um valor válido para novo valor de inicio de caixa.');
            return
        }

        try {
            setCarregandoInicioCaixa(true)
            const resultado = await AjustarInicioCaixa(valorCaixa)
            setAtualizarCaixa(prev => !prev)
            setMensagem(resultado.mensagem)
        } catch (error) {
            setMensagem(error.message)
            console.log(error)
        } finally {
            setCarregandoInicioCaixa(false)
            setValorCaixa("")
        }
    }

    // Função de alteração de valor taxa de entrega.
    const alterarValorTaxaDelivery = async () => {

        if(!valorDelivery) {
            setMensagem('Informe um valor válido para novo valor de taxa de delivery.');
            return
        }

        try {
            setCarregandoTaxaDelivery(true)
            const resultado = await ajustarTaxaDelivery(valorDelivery)
            setAtualizarDelivery(prev => !prev)
            setMensagem(resultado.mensagem)
        } catch (error) {
            setMensagem(error.message)
            console.log(error)
        } finally {
            setCarregandoTaxaDelivery(false)
            setValorDelivery("")
        }
    }

    // Função que vai setar um localStoraged com o valor de ajuste
    const ajustarValorAdicionalTaxaDelivery = () => {
      if(!valorAdicionalDelivery) {
        setMensagem('Informe o valor do adicional de taxa de delivery');
        return
      }
      try {
        localStorage.setItem('adicionalTaxaDelivery', valorAdicionalDelivery);

        setMensagem(`Taxa adicional de R$ ${valorAdicionalDelivery} aplicada ao próximo pedido.`)

      } catch (error) {
        console.log('Erro ao salvar no localStoraged ajuste de taxa', error)
        setMensagem('Erro ao aplicar taxa adicional')
      }

    }

    // Função que busca o inicio de caixa salvo no banco de dados.
    useEffect(() => {
        const buscarTaxaEntrega = async () => {
          setCarregandoTaxaDelivery(true)
          try {
            const resultado = await LerTaxaDelivery();
            setTaxaEntrega(resultado)
          } catch (error) {
            setTaxaEntrega("")
            console.log(error)
            setMensagem(error.message)
          } finally {
            setCarregandoTaxaDelivery(false)
          }
        }
    
    
        buscarTaxaEntrega()
      }, [atualizarDelivery])

    // Função que busca o inicio de caixa salvo no banco de dados.
    useEffect(() => {
        const buscarInicioCaixa = async () => {
            setCarregandoInicioCaixa(true)
            try {
                const resultado = await LerInicioCaixa()
                setInicioCaixa(resultado)
            } catch (error) {
                setInicioCaixa("")
                console.log(error)
                setMensagem(error.message)
            } finally {
                setCarregandoInicioCaixa(false)
            }   
        }

        buscarInicioCaixa()
    }, [atualizarCaixar])



    return (
    <div className={styles.container}>
      <ToastRadix mensagem={mensagem} />
      <Cabecalho />

      <main className={styles.principal}>

        {/* CABEÇALHO */}
        <div className={`${styles.cabecalhoPage} ${styles.fadeUp}`}>
          <div className={styles.tituloSection}>
            <div className={styles.iconeWrapper}>
              <CashRegister size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Administração</p>
              <h1 className={styles.pageTitulo}>Configuração de Caixa</h1>
            </div>
          </div>
          <button className={styles.botaoVoltar} onClick={tratarVoltarMenu}>
            <ArrowLeft size={15} weight="bold" /> Voltar
          </button>
        </div>

        {/* RENDER CONDICIONAL DE LOADING INICIO DE CAIXA*/}
        {carregandoInicioCaixa ? (
          <div className={styles.spinnerWrapper}>
            <div className={styles.spinner} />
          </div>
        ) : (
          <>
            <p className={styles.pageSubtitulo}>Setor balcão</p>
            {/* CARD INÍCIO DE CAIXA */}
            <div className={`${styles.card} ${styles.fadeUp}`} style={{ animationDelay: "0.05s" }}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderTitle}>
                  <CurrencyDollar size={24} weight="fill" className={styles.cardHeaderIcon} />
                  <h2>Início de Caixa dos balcões</h2>
                </div>
              </div>

              <div className={styles.inicioCaixaRow}>
                <span className={styles.inicioCaixaLabel}>Valor atual inicio de caixa:</span>
                <output
                  className={styles.inicioCaixaValor}
                  title="Valor configurado pelo adm para início de caixa!"
                >
                  {formatarMoeda(inicioCaixa.valor)}
                </output>
              </div>

              <div className={styles.inputRow}>
                <input
                  className={styles.input}
                  type="number"
                  placeholder="Novo valor (R$)"
                  value={valorCaixa}
                  onChange={(e) => setValorCaixa(e.target.value)}
                />

                {/* ADICIONAR LOADING NO BOTAO DE ENVIAR ALTERAÇÃO!!!! */}
                <AlertaRadix
                    titulo="Salvar novo valor de inicio de caixa"
                    descricao='Deseja alterar o valor inicial de caixa?'
                    tratar={alterarValorInicial}
                    confirmarTexto="Sim, alterar!"
                    cancelarTexto="Cancelar"
                    trigger={
                        <button
                        className={styles.botaoPrincipal}
                        disabled={!valorCaixa || carregandoInicioCaixa}
                        >
                        <PaperPlaneTilt size={16} weight="bold" />
                        {valorCaixa ? "Enviar novo início de caixa" : "Adicione um novo valor"}
                        </button>
                    }
                  />

              </div>
            </div>

            {/* CARDS DE CAIXA */}
            <div className={`${styles.caixasGrid} ${styles.fadeUp}`} style={{ animationDelay: "0.1s" }}>
              {[
                { label: "Caixa 01", dados: balcao1 },
                { label: "Caixa 02", dados: balcao2 },
              ].map(({ label, dados }) => (
                <div className={styles.caixaCard} key={label}>
                  <div className={styles.caixaHeader}>
                    <div className={styles.caixaTitulo}>
                      <Desktop size={18} weight="fill" />
                      {label}
                    </div>
                    <span className={dados.quantidade > 0 ? styles.badgeAberto : styles.badgeFechado}>
                      {dados.quantidade > 0 ? "Caixa Aberto" : "Caixa Fechado"}
                    </span>
                  </div>
                  <div className={styles.caixaInfo}>
                    {dados.quantidade > 0 ? (
                      <><Receipt size={15} /><span><strong>{dados.quantidade}</strong> pedidos em aberto</span></>
                    ) : (
                      <><Lock size={15} /><span>Nenhum pedido em aberto</span></>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* RENDER CONDICIONAL DE LOADING TAXA DE DELIVERY*/}
        {carregandoTaxaDelivery 
        ? (
          <div className={styles.spinnerWrapper}>
            <div className={styles.spinner} />
          </div>
          ) 
        : (
            <>
              {/* CONFIGURAÇÃO DE VALOR TAXA DE DELIVERY */}
              <p className={styles.pageSubtituloDelivery}>Setor Delivery</p>
              <div className={`${styles.card} ${styles.fadeUp}`} style={{ animationDelay: "0.05s" }}>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardHeaderTitle}>
                        <CurrencyDollar size={24} weight="fill" className={styles.cardHeaderIconDelivery} />
                        <h2>Inicio de taxa de delivery</h2>
                      </div>
                    </div>

                    <div className={styles.inicioCaixaRow}>
                      <span className={styles.inicioCaixaLabel}>Valor atual taxa de entrega:</span>
                      <output
                        className={styles.inicioCaixaValorDelivery}
                        title="Valor configurado pelo adm para taxa de entrega"
                      >
                        {formatarMoeda(taxaEntrega.valor)}
                      </output>
                    </div>

                    <div className={styles.inputRow}>
                      <input
                        className={styles.input}
                        type="number"
                        placeholder="Novo valor (R$)"
                        value={valorDelivery}
                        onChange={(e) => setValorDelivery(e.target.value)}
                      />

                      {/* ADICIONAR LOADING NO BOTAO DE ENVIAR ALTERAÇÃO!!!! */}
                      <AlertaRadix
                          titulo="Salvar novo valor de taxa de entrega delivery"
                          descricao='Deseja alterar o valor para taxa de entrega?'
                          tratar={alterarValorTaxaDelivery}
                          confirmarTexto="Sim, alterar!"
                          cancelarTexto="Cancelar"
                          trigger={
                              <button
                              className={styles.botaoPrincipalDelivery}
                              disabled={!valorDelivery || carregandoTaxaDelivery}
                              >
                              <PaperPlaneTilt size={16} weight="bold" />
                              {valorCaixa ? "Salvar novo valor para taxa de entrega" : "Adicione um novo valor"}
                              </button>
                          }
                        />

                    </div>
              </div>

              {/* CONFIGURAÇÃO DE VALOR ADICIONAL NA TAXA DE DELIVERY */}
              <div className={`${styles.card} ${styles.fadeUp}`} style={{ animationDelay: "0.05s" }}>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardHeaderTitle}>
                        <HandCoinsIcon size={24} weight="fill" className={styles.cardHeaderIconDelivery} />
                        <h2>Ajuste taxa de delivery</h2>
                      </div>

                      <div className={styles.taxaAtual}>
                      <span className={styles.inicioCaixaLabel}>Taxa de entrega fixa:</span>
                      <output
                        className={styles.inicioCaixaValorDelivery}
                        title="Valor configurado pelo adm para taxa de entrega"
                      >
                        {formatarMoeda(taxaEntrega.valor)}
                      </output>
                      </div>

                    </div>

                    {/* TAXA TEMPORARIA */}
                    <div className={styles.inicioCaixaRow}>
                      <span className={styles.inicioCaixaLabel}>Valor da taxa de entrega temporária:</span>
                      <output
                        className={styles.inicioCaixaValorDelivery}
                        title="Valor configurado pelo adm para taxa de entrega"
                      >
                        {valorAdicionalDelivery ? formatarMoeda(Number(valorAdicionalDelivery) + Number(taxaEntrega.valor)) : valorAjusteDeliveryStoraged ? formatarMoeda(valorAjusteDeliveryStoraged) : 0}
                      </output>
                    </div>

                    {/* INFORMATIVO */}
                    { valorAdicionalDelivery || valorAjusteDeliveryStoraged &&
                      <p className={styles.informativo}>Importante: Esta alteração é válida apenas para o próximo pedido. Após sua geração, a taxa de entrega será automaticamente redefinida para o valor padrão.</p>
                    }
                   

                    {/* ADICIONAR AJUSTE */}
                    <div className={styles.inputRow}>
                      <input
                        className={styles.input}
                        type="number"
                        placeholder="Adicional ao valor (R$)"
                        value={valorAdicionalDelivery}
                        onChange={(e) => setValorAdicionalDelivery(e.target.value)}
                      />

                      {/* ADICIONAR LOADING NO BOTAO DE ENVIAR ALTERAÇÃO!!!! */}
                      <AlertaRadix
                          titulo="Salvar ajuste para taxa de entrega"
                          descricao='Deseja adicionar valor para o ajuste de taxa de entrega?'
                          tratar={ajustarValorAdicionalTaxaDelivery}
                          confirmarTexto="Sim, alterar!"
                          cancelarTexto="Cancelar"
                          trigger={
                              <button
                              className={styles.botaoPrincipalDelivery}
                              disabled={!valorAdicionalDelivery || carregandoTaxaDelivery}
                              >
                              <PaperPlaneTilt size={16} weight="bold" />
                              {valorCaixa ? "Salvar ajuste de taxa de entrega" : "Adicione um novo valor"}
                              </button>
                          }
                        />

                  </div>
              </div>
            </>
          )
        }


      </main>

      <Rodape />
    </div>
  );
}
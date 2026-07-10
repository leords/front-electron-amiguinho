import { useLocation, useNavigate } from "react-router-dom";
import { useProdutos } from "../../hooks/useProdutos";
import { gerarCupom } from "../../utils/gerarCupom";
import { AlertaRadix } from "../../componentes/ui/alerta/alerta";
import { formatarMoeda } from "../../utils/formartarMoeda";
import Cabecalho from "../../componentes/Cabecalho/index.jsx";
import Rodape from "../../componentes/Rodape/index.jsx";
import logo from "../../assets/logo.jpg";
import styles from "./styles.module.css";
import {
  ArrowCircleLeftIcon,
  PrinterIcon,
  ReceiptIcon,
  CurrencyDollarIcon,
  PackageIcon,
  CreditCardIcon,
  TrashIcon,
  PencilIcon,
  ShieldIcon,
  SpinnerIcon
} from "@phosphor-icons/react";
import { usarAuth } from "../../componentes/Context/authContext";
import { CancelarPedido } from "../../operadores/API/pedido/cancelarPedido";
import { usarToast } from "../../componentes/Context/toastContext";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";
import { useState } from "react";
import { gerarCupomDelivery } from "../../utils/gerarCupomDelivery";

export default function Reimprimir() {
  const navegar = useNavigate();

  // Hook
  const { state } = useLocation();
  const { produtos } = useProdutos();
  const { usuario } = usarAuth();
  const { setMensagem } = usarToast();
  const [ carregando, setCarregando ] = useState(false)

  const cupom = state;

  // Se não houver cupom, retornar à historico.
  if (!cupom) {
    navegar("/historico");
    return null;
  }

  // Função para retornar 1 pagina a menos.
  const handleVoltar = () => navegar(-1);

  // Chama a tela editar conforme status do pedido
  const handleEditarPedido = async () => {
    try {
      if(cupom.status !== 'cancelado' || cupom.status !== 'pendente') {
        setMensagem('Este pedido não deve ser alterado devido ao seu status atual')
      }

      navegar('/editar', {
        state: cupom
      });

    } catch (error) {
      console.log(error)
    }
  }

  // Função para cancelar pedido.
  const handleCancelarPedido = async () => {
    try {
      if(cupom.status === 'cancelado') {
        setMensagem('Este pedido já está cancelado!')
      }

      const resposta = await CancelarPedido(cupom.tipo, cupom.uuid);
      if (resposta.mensagem === "Pedido cancelado com sucesso") {
        handleVoltar()
      } 
    } catch (error) {
      setMensagem(error.message)
      console.log(error.message)
    } 
  }

  // Função para imprimir segunda via.
  const handleImprimirSegundaVia = async () => {
    setCarregando(true)

    if(cupom.tipo === 'balcao') {
      const cupomFormatado = {
        tipo: "segundaVia",
        motivo: "PRODUTO JÁ CARREGADO!",
        data: cupom.data,
        cliente: cupom.cliente,
        vendedor: cupom.vendedor,
        nomeUsuario: cupom.nomeUsuario,
        itens: cupom.itens.map((item) => ({
            produtoId: item.produtoId,
            nome: produtos.find((p) => 
            p.id === item.produtoId)?.nome || "",
            quantidade: item.quantidade,
            valorUnit: item.valorUnit,
        })),
        pagamentos: cupom.pagamentos.map((pagamento) => ({ 
          idFormaPagamentoParcial: pagamento.idFormaPagamentoParcial, 
          nomeFormaPagamentoParcial: pagamento.nomeFormaPagamentoParcial, 
          valorParcialFormaPagamento: pagamento.valorParcialFormaPagamento  
        }))
      };

        const html = gerarCupom(cupomFormatado);
        window.IMPRESSORA.imprimir(html);

        setCarregando(false)

    }

    const cupomFormatado = {
      tipo: "segundaVia",
      motivo: "PRODUTO JÁ CARREGADO!",
      data: cupom.data,
      cliente: cupom.cliente,
      formaPagamento: cupom.formaPagamento.nome,
      vendedor: cupom.vendedor,
      nomeUsuario: cupom.nomeUsuario,
      itens: cupom.itens.map((item) => ({
          produtoId: item.produtoId,
          nome: produtos.find((p) => 
          p.id === item.produtoId)?.nome || "",
          quantidade: item.quantidade,
          valorUnit: item.valorUnit,
      })),
    };

    const html = gerarCupomDelivery(cupomFormatado);
    window.IMPRESSORA.imprimir(html);

    setCarregando(false)
  };

  // Faz a soma dos pedidos
  const totalItens = cupom.itens.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <div className={styles.container}>
      <Cabecalho />

      <main className={styles.principal}>

        {/* CABEÇALHO */}
        <div className={styles.cabecalhoPage}>
          {/* TITULO */}   
          <div className={styles.tituloSection}>
            <div className={styles.iconeWrapper}>
              <PrinterIcon size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Pedido</p>
              <h1 className={styles.pageTitulo}>Reimprimir</h1>
            </div>
          </div>
        </div>

        <div className={styles.conteudo}>

          <div className={styles.colunaLista}>

            {/* CARDS DE RESUMO */}
            <div className={styles.resumoCards}>

              {/* QUANTIDADE DE ITENS */}
              <div className={styles.card}>
                <div className={styles.cardIcone} data-color="orange">
                  <PackageIcon size={20} weight="fill" />
                </div>
                <div>
                  <p className={styles.cardLabel}>Itens no pedido</p>
                  <strong className={styles.cardValor}>{cupom.itens.length}</strong>
                  <p className={styles.cardSub}>{totalItens} unidades no total</p>
                </div>
              </div>
              {/* TOTAL DO PEDIDO */}
              <div className={styles.card}>
                <div className={styles.cardIcone} data-color="green">
                  <CurrencyDollarIcon size={20} weight="fill" />
                </div>
                <div>
                  <p className={styles.cardLabel}>Total do pedido</p>
                  <strong className={styles.cardValor}>{formatarMoeda(cupom.total)}</strong>
                  <p className={styles.cardSub}>valor final</p>
                </div>
              </div>
              {/* FORMA DE PAGAMENTO */}
              <div className={styles.card}>
                <div className={styles.cardIcone} data-color="blue">
                  <CreditCardIcon size={20} weight="fill" />
                </div>
                <div>
                  <p className={styles.cardLabel}>Forma de pagamento</p>
                  {cupom.tipo === 'balcao'
                  ?
                    <strong className={styles.cardValorPagamento}>
                        {cupom.pagamentos
                          .map((p) => p.formaPagamento.nome)
                          .join(" / ")}
                    </strong>                    
                  :
                    <strong className={styles.cardValorPagamento}>
                        {cupom.formaPagamento?.nome}
                    </strong>
                }

                  <p className={styles.cardSub}>método utilizado</p>
                </div>
              </div> 

            </div>

            {/* CUPOM */}
            <div className={styles.cupomFiscal}>

              <div className={styles.cupomHeader}>
                {/* BOTÃO VOLTAR */}
                <button className={styles.botaoVoltar} onClick={handleVoltar}>
                  <ArrowCircleLeftIcon size={18} weight="regular" />
                  Voltar
                </button>

                <div className={styles.cupomHeaderCenter}>
                  <div className={styles.cupomHeaderIcon}>
                    <ReceiptIcon size={18} weight="bold" className={styles.cupomHeaderIcon} />
                    <h2>Segunda via da nota</h2>
                  </div>
                  <div className={styles.ConteinerStatusPedido}>
                    <strong className={styles.status}>Status:</strong>
                     <p className={`
                      ${styles.pendente}
                      ${cupom.status === 'cancelado' ? styles.cancelado : ''}
                      ${cupom.status === 'carregado' ? styles.carregado : ''}
                      ${cupom.status === 'pendente' ? styles.carregado : ''}
                      ${cupom.status === 'entregue' ? styles.entregue : ''}
                      ${cupom.status === 'devolvido' ? styles.devolvido : ''}
                      `}>{cupom.status}</p>
                  </div>
                </div>
                  <span className={styles.badge}>{cupom.itens.length} {cupom.itens.length === 1 ? "item" : "itens"}</span>
              </div>

              {/* TABELA */}
              <div className={styles.tabelaCupom}>
                <div className={styles.tabelaHeader}>
                  <span>Qtd</span>
                  <span>Produto</span>
                  <span>Preço und.</span>
                  <span>Total</span>
                </div>

                <div className={styles.tabelaBody}>
                  {cupom.itens.map((item) => (
                    <div key={item.id} className={styles.itemRow}>
                      <span className={styles.itemQtd}>{item.quantidade}</span>
                      <span className={styles.itemNome}>
                        {produtos.find((p) => p.id === item.produtoId)?.nome || "Produto não encontrado"}
                      </span>
                      <span className={styles.itemValor}>{formatarMoeda(item.valorUnit)}</span>
                      <span className={styles.itemTotal}>{formatarMoeda(item.valorTotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* RESUMO */}
              <div className={styles.resumo}>
                <div className={styles.resumoItem}>
                  <span>Quantidade total</span>
                  <span className={styles.destaque}>{totalItens} unidades</span>
                </div>
                <div className={styles.resumoItem}>
                  <span>Subtotal</span>
                  <span>{formatarMoeda(cupom.total)}</span>
                </div>

                {cupom.tipo === 'balcao'
                  ?
                    <div className={styles.resumoItem}>
                      <span>Pagamentos</span>
                        {cupom.pagamentos
                          .map((p) => `${p.formaPagamento.nome}: R$ ${p.valor.toFixed(2)}`)
                          .join(" + ")}
                    </div>                    
                  :
                    <strong className={styles.cardValorPagamento}>
                        {cupom.formaPagamento?.nome}
                    </strong>
                }

                <div className={styles.totalFinal}>
                  <span>Total</span>
                  <span className={styles.valorTotal}>{formatarMoeda(cupom.total)}</span>
                </div>

              </div>

              {/* BOTÃO IMPRIMIR */}
              {usuario.nivelAcesso !== "DELIVERY" && 
                <div className={styles.botoesFinais}>
                  <AlertaRadix
                    titulo="2ª via do pedido"
                    descricao="Você realmente deseja imprimir?"
                    tratar={handleImprimirSegundaVia}
                    confirmarTexto="Sim, imprimir segunda via!"
                    cancelarTexto="Cancelar"
                    trigger={
                      <button 
                        className={styles.botaoImprimir}
                        disabled={carregando}
                        >
                        <PrinterIcon size={18} weight="bold" />
                        {carregando ? 'Imprimindo...' : 'Imprimir 2ª via'}
                
                      </button>
                    }
                  />
                </div>
              }
            </div>
          </div>

          {/* MASCOTE */}
          <aside className={styles.containerMascote}>
            <div className={styles.mascoteCard}>
              <img src={logo} alt="Logo" className={styles.logo} />
              <p className={styles.mascoteTexto}>
                Reimpressão da segunda via do pedido selecionado.
              </p>
            </div>

            {/* SÓ RENDERIZA SE USUARIO FOR ADMIN */}
            {usuario.nivelAcesso === "ADMIN" && 
              <div className={styles.botoesFinais}>
                <div className={styles.botoesFinaisHeader}>
                  <ShieldIcon size={14} />
                  <p>Funções de administrador</p>
                </div>

                <div className={styles.botoesFinaisAcoes}>
                  <AlertaRadix
                    titulo="Editar este pedido"
                    descricao="Você realmente deseja editar este pedido?"
                    tratar={handleEditarPedido}
                    confirmarTexto="Sim, quero editar!"
                    cancelarTexto="Cancelar"
                  
                    trigger={
                      <button className={styles.botaoEditar}>
                        <PencilIcon size={15} />
                        Editar este pedido
                      </button>
                    }
                  />

                  <AlertaRadix
                    titulo="Cancelar este pedido"
                    descricao="Você realmente deseja cancelar este pedido?"
                    tratar={handleCancelarPedido}
                    confirmarTexto="Sim, quero cancelar!"
                    cancelarTexto="Cancelar"
                    
                    trigger={
                      <button className={styles.botaoApagar}>
                        <TrashIcon size={15} />
                        Cancelar este pedido
                      </button>
                    }
                  />

                </div>
              </div>
            }
          </aside>

        </div>
      </main>

      <Rodape />
    </div>
  );
}
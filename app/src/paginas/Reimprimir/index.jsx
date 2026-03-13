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
} from "@phosphor-icons/react";

export default function Reimprimir() {
  const { state } = useLocation();
  const navegar = useNavigate();
  const { produtos } = useProdutos();

  const cupom = state;

  if (!cupom) {
    navegar("/historico");
    return null;
  }

  const handleVoltar = () => navegar(-1);

  const handleImprimirSegundaVia = async () => {
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
        nome: produtos.find((p) => p.id === item.produtoId)?.nome || "",
        quantidade: item.quantidade,
        valorUnit: item.valorUnit,
      })),
    };

    const html = gerarCupom(cupomFormatado);
    window.IMPRESSORA.imprimir(html);
  };

  const totalItens = cupom.itens.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <div className={styles.container}>
      <Cabecalho />

      <main className={styles.principal}>

        {/* ── Cabeçalho ── */}
        <div className={styles.cabecalhoPage}>
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

        {/* ── Conteúdo ── */}
        <div className={styles.conteudo}>

          {/* Coluna principal */}
          <div className={styles.colunaLista}>

            {/* Cards de resumo */}
            <div className={styles.resumoCards}>
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

              <div className={styles.card}>
                <div className={styles.cardIcone} data-color="blue">
                  <CreditCardIcon size={20} weight="fill" />
                </div>
                <div>
                  <p className={styles.cardLabel}>Forma de pagamento</p>
                  <strong className={styles.cardValorPagamento}>{cupom.formaPagamento.nome}</strong>
                  <p className={styles.cardSub}>método utilizado</p>
                </div>
              </div>
            </div>

            {/* Cupom */}
            <div className={styles.cupomFiscal}>

              <div className={styles.cupomHeader}>
                <button className={styles.botaoVoltar} onClick={handleVoltar}>
                  <ArrowCircleLeftIcon size={18} weight="regular" />
                  Voltar
                </button>
                <div className={styles.cupomHeaderCenter}>
                  <ReceiptIcon size={18} weight="bold" className={styles.cupomHeaderIcon} />
                  <h2>Segunda via da nota</h2>
                </div>
                <span className={styles.badge}>{cupom.itens.length} {cupom.itens.length === 1 ? "item" : "itens"}</span>
              </div>

              {/* Tabela */}
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

              {/* Resumo */}
              <div className={styles.resumo}>
                <div className={styles.resumoItem}>
                  <span>Quantidade total</span>
                  <span className={styles.destaque}>{totalItens} unidades</span>
                </div>
                <div className={styles.resumoItem}>
                  <span>Subtotal</span>
                  <span>{formatarMoeda(cupom.total)}</span>
                </div>
                <div className={styles.totalFinal}>
                  <span>Total</span>
                  <span className={styles.valorTotal}>{formatarMoeda(cupom.total)}</span>
                </div>
              </div>

              {/* Botão imprimir */}
              <div className={styles.botoesFinais}>
                <AlertaRadix
                  titulo="2ª via do pedido"
                  descricao="Você realmente deseja imprimir?"
                  tratar={handleImprimirSegundaVia}
                  confirmarTexto="Sim, imprimir segunda via!"
                  cancelarTexto="Cancelar"
                  trigger={
                    <button className={styles.botaoImprimir}>
                      <PrinterIcon size={18} weight="bold" />
                      Imprimir 2ª via
                    </button>
                  }
                />
              </div>

            </div>
          </div>

          {/* Mascote */}
          <aside className={styles.containerMascote}>
            <div className={styles.mascoteCard}>
              <img src={logo} alt="Logo" className={styles.logo} />
              <p className={styles.mascoteTexto}>
                Reimpressão da segunda via do pedido selecionado.
              </p>
            </div>
          </aside>

        </div>
      </main>

      <Rodape />
    </div>
  );
}
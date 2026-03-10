import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import logo from "../../assets/logo.jpg";

import { useLocation, useNavigate } from "react-router-dom";
import { useProdutos } from "../../hooks/useProdutos";
import { gerarCupom } from "../../utils/gerarCupom";
import { AlertaRadix } from "../../componentes/ui/alerta/alerta";
import { formatarMoeda } from "../../utils/formartarMoeda";
import { ArrowCircleLeftIcon } from "@phosphor-icons/react";

export default function Reimprimir() {
  const { state } = useLocation();
  const navegar = useNavigate();

  const { produtos } = useProdutos();

  const cupom = state;

  const handleVoltar = () => {
    navegar(-1);
  };


  const handleImprimirSegundaVia = async () => {
    //CRIAR CUPOM FORMATADO PRA IMPRESSÃO!
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

  if (!cupom) {
    navegar("/historico");
    return null;
  }

  return (
    <div className={styles.container}>
      <Cabecalho />
      <div className={styles.cabecalho}>
        <h1>Reimprimir</h1>
      </div>
      <main>
        <section className={styles.central}>
          {/* CONTAINER LISTA */}
          <div className={styles.containerLista}>
            <div className={styles.cupomFiscal}>
              <div className={styles.cupomHeader}>
                <button className={styles.botaoVoltar} onClick={handleVoltar} > < ArrowCircleLeftIcon size={22} weight="regular"/> voltar</button>
                <h2>SEGUNDA VIA DA NOTA</h2>
                <span className={styles.badge}>{cupom.itens.length} items</span>
              </div>

              <div className={styles.tabelaCupom}>
                <div className={styles.tabelaHeader}>
                  <span>Qtd</span>
                  <span>Produto</span>
                  <span>Preço und</span>
                  <span>Total</span>
                  <span></span>
                </div>

                <div className={styles.tabelaBody}>
                  {cupom.itens.map((item) => (
                    <div key={item.id} className={styles.itemRow}>
                      <span>{item.quantidade}</span>
                      <span>
                        {produtos.find((p) => p.id === item.produtoId)?.nome ||
                          "Produto não encontrado"}
                      </span>
                      <span>
                        {formatarMoeda(item.valorUnit)}
                      </span>
                      <span>
                        {formatarMoeda(item.valorTotal)}
                      </span>
                      <span></span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.resumo}>
                <div className={styles.resumoItem}>
                  <span>Quantidade total:</span>
                  <span className={styles.destaque}>
                    {cupom.itens.reduce(
                      (acc, item) => acc + item.quantidade,
                      0
                    )}{" "}
                    unidades
                  </span>
                </div>
                <div className={styles.resumoItem}>
                  <span>Subtotal:</span>
                  <span>
                    {" "}
                    {formatarMoeda(cupom.total)}
                  </span>
                </div>
                <div className={styles.totalFinal}>
                  <span>TOTAL:</span>
                  <span className={styles.valorTotal}>
                    R${" "}
                    {formatarMoeda(cupom.total)}
                  </span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Forma de Pagamento</label>

                <option>{cupom.formaPagamento.nome}</option>
              </div>

              <div className={styles.botoesFinais}>
                <AlertaRadix
                  titulo="2ª via do pedido"
                  descricao="Você realmente deseja imprimir ?"
                  tratar={handleImprimirSegundaVia}
                  confirmarTexto="Sim, imprimir segunda via!"
                  cancelarTexto="Sair"
                  trigger={<button>Imprimir 2º via</button>}
                />
              </div>
            </div>
          </div>

          <div className={styles.containerLogo}>
            <img
              src={logo}
              alt="Amigão Distribuidora de Bebidas"
              className={styles.logo}
            />
          </div>
        </section>
      </main>
      <Rodape />
    </div>
  );
}

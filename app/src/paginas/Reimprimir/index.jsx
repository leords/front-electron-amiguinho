import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import logo from "../../assets/logo.jpg";

import ItemListaPedido from "../../componentes/ItemListaPedido";
import { useLocation, useNavigate } from "react-router-dom";

export default function Reimprimir() {
  const { state } = useLocation();
  const navegar = useNavigate();

  const cupom = state;

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
            <p>Cupom</p>
            <div className={styles.lista}>
              <div className={styles.tituloLista}>
                <h2 className={styles.itemLista1}>ID</h2>
                <h2 className={styles.itemLista2}>Produto</h2>
                <h2 className={styles.itemLista3}>Qtd</h2>
                <h2 className={styles.itemLista4}>Preço und</h2>
                <h2 className={styles.itemLista5}>Preço total</h2>
              </div>
              {cupom.itens.map((item) => (
                <ItemListaPedido
                  key={item.id}
                  produto={item}
                  onRemover={""}
                  botaoRemover={false}
                />
              ))}
            </div>
            <div className={styles.valores}>
              <p>{`Valor total:  R$ ${cupom.total.toFixed(2)}`}</p>
              <p>{`Forma de pagamento: ${cupom.formaPagamento}`}</p>
            </div>
            <div className={styles.botoes}>
              <button>Imprimir 2º via</button>
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

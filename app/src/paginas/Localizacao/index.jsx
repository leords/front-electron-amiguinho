import { useState } from "react";
import { MapPin, Moped, Path } from "@phosphor-icons/react";

import BuscaPedidos from "../../componentes/BuscaPedidos/index.jsx";
import BuscarRotas from "../../componentes/BuscarRotas/index.jsx";
import Cabecalho from "../../componentes/Cabecalho/index.jsx";
import Rodape from "../../componentes/Rodape/index.jsx";
import Mapa from "../../componentes/Mapa/index.jsx";
import styles from "./styles.module.css";

export default function Localizacao() {
  // Estados
  const [tipoBusca, setTipoBusca] = useState("delivery"); // 'delivery' | 'rota'
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [dataCarregada, setDataCarregada] = useState(null);
  const [dataEntregue, setDataEntregue] = useState(null);
  const [remetente, setRemetente] = useState("delivery");
  const [pontosRota, setPontosRota] = useState([]);
  const [pontoFocado, setPontoFocado] = useState(null);

  // Altera o tipo de busca e reseta dados
  const tratarMudarTipoBusca = (novoTipo) => {
    setTipoBusca(novoTipo);
    setPontoFocado(null);
    setPontosRota([]);
    setRemetente(novoTipo);
    setLatitude(null);
    setLongitude(null);
  };

  return (
    <div className={styles.container}>
      <Cabecalho />

      <div className={styles.principal}>
        {/* Cabeçalho padrão de página */}
        <div className={styles.cabecalhoPage}>
          <div className={styles.tituloSection}>
            <div className={styles.iconeWrapper}>
              <MapPin size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Rastreamento em tempo real e rotas</p>
              <h1 className={styles.pageTitulo}>Localização e Rotas</h1>
            </div>
          </div>
        </div>

        <div className={styles.conteudo}>
          {/* Painel esquerdo */}
          <div className={styles.painelEsquerdo}>
            {/* Painel de filtros - tipo de busca */}
            <div className={styles.painelFiltros}>
              <div className={styles.filtrosHeader}>
                <MapPin size={14} weight="bold" className={styles.filtroIcone} />
                Tipo de busca
              </div>

              <div className={styles.tipoBuscaGrid}>
                <button
                  type="button"
                  className={`${styles.tipoBuscaBtn} ${
                    tipoBusca === "delivery" ? styles.tipoBuscaBtnAtivo : ""
                  }`}
                  onClick={() => tratarMudarTipoBusca("delivery")}
                >
                  <Moped size={16} weight="bold" />
                  Delivery
                </button>

                <button
                  type="button"
                  className={`${styles.tipoBuscaBtn} ${
                    tipoBusca === "rota" ? styles.tipoBuscaBtnAtivo : ""
                  }`}
                  onClick={() => tratarMudarTipoBusca("rota")}
                >
                  <Path size={16} weight="bold" />
                  Rota
                </button>
              </div>
            </div>

            {/* Card de busca dinâmico */}
            <div className={styles.card}>
              {tipoBusca === "delivery" && (
                <BuscaPedidos
                  setPontosRota={setPontosRota}
                  setPontoFocado={setPontoFocado}
                  setRemetente={setRemetente}
                />
              )}

              {tipoBusca === "rota" && (
                <BuscarRotas
                  setPontosRota={setPontosRota}
                  setPontoFocado={setPontoFocado}
                  setRemetente={setRemetente}
                />
              )}
            </div>
          </div>

          {/* Painel direito - mapa */}
          <div className={styles.painelDireito}>
            <div className={styles.mapaCard}>
              <Mapa
                latitude={latitude}
                longitude={longitude}
                dataCarregada={dataCarregada}
                dataEntregue={dataEntregue}
                remetente={remetente}
                pontosRota={pontosRota}
                pontoFocado={pontoFocado}
              />
            </div>
          </div>
        </div>
      </div>

      <Rodape />
    </div>
  );
}

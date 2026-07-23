import { useState } from "react";
import { MapPin, Package, User } from "@phosphor-icons/react";

import BuscaPedidos from "../../componentes/BuscaPedidos/index.jsx";
import BuscaUsuarios from "../../componentes/BuscarUsuarios/index.jsx";
import Cabecalho from "../../componentes/Cabecalho/index.jsx";
import Informacoes from "../../componentes/Informacoes/index.jsx";
import Mapa from "../../componentes/Mapa/index.jsx";
import "./styles.css";

export default function Localizacao() {
  // Estados
  const [tipoBusca, setTipoBusca] = useState("pedido");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [dataCarregada, setDataCarregada] = useState(null)
  const [dataEntregue, setDataEntregue] = useState(null)
  const [remetente, setRemetente] = useState("")

  return (
    <div className="container">
      <Cabecalho />

      <div className="principal">
        {/* Cabeçalho padrão de página */}
        <div className="cabecalho-page">
          <div className="titulo-section">
            <div className="icone-wrapper">
              <MapPin size={22} weight="fill" />
            </div>
            <div>
              <p className="page-subtitulo">Rastreamento em tempo real</p>
              <h1 className="page-titulo">Localização dos Entregadores</h1>
            </div>
          </div>
        </div>

        <div className="conteudo">
          {/* Painel esquerdo */}
          <div className="painel-esquerdo">
            {/* Painel de filtros - tipo de busca */}
            <div className="painel-filtros">
              <div className="filtros-header">
                <MapPin size={14} weight="bold" className="filtro-icone" />
                Tipo de busca
              </div>

              <div className="tipo-busca-grid">
                <button
                  type="button"
                  className={`tipo-busca-btn ${
                    tipoBusca === "pedido" ? "tipo-busca-btn-ativo" : ""
                  }`}
                  onClick={() => setTipoBusca("pedido")}
                >
                  <Package size={17} weight="bold" />
                  Pedido
                </button>

                <button
                  type="button"
                  className={`tipo-busca-btn ${
                    tipoBusca === "usuario" ? "tipo-busca-btn-ativo" : ""
                  }`}
                  onClick={() => setTipoBusca("usuario")}
                >
                  <User size={17} weight="bold" />
                  Entregador
                </button>
              </div>
            </div>

            {/* Card de busca */}
            <div className="card">
              {tipoBusca === "pedido" ? (
                <BuscaPedidos
                  setLatitude={setLatitude}
                  setLongitude={setLongitude}
                  setDataCarregada={setDataCarregada}
                  setDataEntregue={setDataEntregue}
                  setRemetente={setRemetente}

                />
              ) : (
                <BuscaUsuarios
                  setLatitude={setLatitude}
                  setLongitude={setLongitude}
                  setRemetente={setRemetente}
                />
              )}
            </div>

            {/* Card de informações */}
            <div className="card">
              <Informacoes
                latitude={localStorage.getItem("ultimaLatitude")}
                longitude={localStorage.getItem("ultimaLongitude")}
                ultimaAtualizacao={localStorage.getItem("ultimaBusca")}
                pedido={localStorage.getItem("ultimoCliente")}
                usuario={localStorage.getItem("ultimoUsuario")}
              />
            </div>
          </div>

          {/* Painel direito - mapa */}
          <div className="painel-direito">
            <div className="mapa-card">
              <Mapa 
                latitude={latitude} 
                longitude={longitude} 
                dataCarregada={dataCarregada}
                dataEntregue={dataEntregue}
                remetente={remetente}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

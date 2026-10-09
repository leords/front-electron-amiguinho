import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import { MapPinLine } from "@phosphor-icons/react";
import L from "leaflet";
import { dataHoraFormatada } from "../../utils/data";
import { formatarMoeda } from "../../utils/formartarMoeda";
import { parseISO } from "date-fns";
import "./styles.css";

/*
    Corrige o problema do ícone padrão
    do Leaflet quando usado com React.
*/
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Ícone numérico personalizado para os pontos da rota e do delivery
function criarIconeSequencia(numero, origem = "delivery") {
  let bgCor = "#ff8c00"; // Amarelo/Laranja padrão Amiguinho (Delivery)
  if (origem.toLowerCase() === "pedido") bgCor = "#2f9e44"; // Verde
  if (origem.toLowerCase() === "visita") bgCor = "#1971c2"; // Azul

  return L.divIcon({
    className: "marcador-sequencia-custom",
    html: `
      <div style="
        background: ${bgCor};
        color: #ffffff;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 13px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
        border: 2px solid #ffffff;
        font-family: system-ui, sans-serif;
      ">
        ${numero}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

function AjustarVisualizacaoMapa({ latitude, longitude, pontosRota, pontoFocado }) {
  const mapa = useMap();

  useEffect(() => {
    if (pontoFocado?.latitude != null && pontoFocado?.longitude != null) {
      mapa.setView([pontoFocado.latitude, pontoFocado.longitude], 17, {
        animate: true,
      });
      return;
    }

    if (Array.isArray(pontosRota) && pontosRota.length > 0) {
      const coords = pontosRota
        .filter((p) => p.latitude != null && p.longitude != null)
        .map((p) => [p.latitude, p.longitude]);

      if (coords.length === 1) {
        mapa.setView(coords[0], 16, { animate: true });
      } else if (coords.length > 1) {
        const bounds = L.latLngBounds(coords);
        mapa.fitBounds(bounds, { padding: [50, 50], animate: true });
      }
      return;
    }

    if (latitude != null && longitude != null) {
      mapa.setView([latitude, longitude], 16, {
        animate: true,
      });
    }
  }, [latitude, longitude, pontosRota, pontoFocado]);

  return null;
}

function formatarDataEntrega(data) {
  if (!data) return "Data não informada";
  try {
    const dataObj = typeof data === "string" ? parseISO(data) : new Date(data);
    if (isNaN(dataObj)) return String(data);
    return dataHoraFormatada(dataObj);
  } catch {
    return String(data);
  }
}

function formatarHora(dataStr) {
  if (!dataStr) return "--:--";
  try {
    const d = new Date(dataStr);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "--:--";
  }
}

export default function Mapa({
  latitude,
  longitude,
  dataCarregada,
  dataEntregue,
  remetente = "delivery",
  pontosRota = [],
  pontoFocado = null,
}) {
  const isModoLista = remetente === "rota" || remetente === "delivery";
  const temPontosRota = isModoLista && Array.isArray(pontosRota) && pontosRota.length > 0;
  const temCoordenadaUnica = latitude != null && longitude != null;

  if (!temPontosRota && !temCoordenadaUnica) {
    return (
      <div className="mapa-vazio">
        <MapPinLine size={40} weight="light" className="icone-mapa-vazio" />
        <p>Nenhuma localização encontrada</p>
        <span>
          {remetente === "delivery"
            ? "Selecione a data para visualizar as entregas do delivery no mapa"
            : "Selecione a data e o vendedor para visualizar a rota completa no mapa"}
        </span>
      </div>
    );
  }

  const centroInicial = temPontosRota
    ? [pontosRota[0].latitude, pontosRota[0].longitude]
    : [latitude, longitude];

  return (
    <MapContainer center={centroInicial} zoom={15} className="mapa">
      <AjustarVisualizacaoMapa
        latitude={latitude}
        longitude={longitude}
        pontosRota={pontosRota}
        pontoFocado={pontoFocado}
      />

      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* MARCADORES SEQUENCIAIS (DELIVERY OU ROTA) */}
      {temPontosRota ? (
        <>
          {pontosRota.map((ponto, index) => {
            const seq = ponto.sequencia || index + 1;
            const origem = ponto.origem || (remetente === "delivery" ? "delivery" : "visita");
            const isDelivery = origem.toLowerCase() === "delivery";

            return (
              <Marker
                key={ponto.id || ponto.uuid || index}
                position={[ponto.latitude, ponto.longitude]}
                icon={criarIconeSequencia(seq, origem)}
              >
                <Tooltip
                  permanent={false}
                  direction="top"
                  offset={[0, -14]}
                  opacity={1}
                  className="tooltip-rota"
                >
                  #{seq} • {ponto.cliente?.nome || "Cliente"} ({formatarHora(ponto.data)})
                </Tooltip>

                <Popup>
                  <div className="popup-rota-conteudo">
                    <div className="popup-rota-header">
                      <span className="popup-rota-titulo">
                        {isDelivery ? `Entrega #${seq}` : `Parada #${seq}`}
                      </span>
                      <span
                        className={`popup-rota-badge ${
                          isDelivery
                            ? "popup-badge-delivery"
                            : origem.toLowerCase() === "pedido"
                            ? "popup-badge-pedido"
                            : "popup-badge-visita"
                        }`}
                      >
                        {isDelivery ? "Delivery" : origem}
                      </span>
                    </div>

                    <p style={{ margin: "3px 0 2px", fontWeight: 700 }}>
                      {ponto.cliente?.nome || "Cliente não informado"}
                    </p>

                    {ponto.cliente?.telefone && (
                      <p style={{ margin: "1px 0", color: "#495057", fontSize: "11px" }}>
                        📞 {ponto.cliente.telefone}
                      </p>
                    )}

                    {ponto.cliente?.cnpj && (
                      <p style={{ margin: "1px 0", color: "#6c757d", fontSize: "11px" }}>
                        CNPJ/CPF: {ponto.cliente.cnpj}
                      </p>
                    )}

                    {ponto.cliente?.endereco && (
                      <p style={{ margin: "2px 0", fontSize: "11px" }}>
                        📍 {ponto.cliente.endereco}{" "}
                        {ponto.cliente?.cidade ? `(${ponto.cliente.cidade})` : ""}
                      </p>
                    )}

                    {ponto.cliente?.referencia && (
                      <p style={{ margin: "1px 0", color: "#868e96", fontSize: "11px", fontStyle: "italic" }}>
                        Ref: {ponto.cliente.referencia}
                      </p>
                    )}

                    <p style={{ margin: "3px 0 1px", fontSize: "11px", color: "#495057" }}>
                      ⏰ {isDelivery ? "Entregue às:" : "Horário:"} {formatarHora(ponto.data)}
                    </p>

                    {(ponto.total != null || ponto.formaPagamento) && (
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#2f9e44", fontWeight: 700 }}>
                        💰 {ponto.total != null ? formatarMoeda(ponto.total) : ""}{" "}
                        {ponto.formaPagamento ? `(${ponto.formaPagamento})` : ""}
                      </p>
                    )}

                    {ponto.usuario?.nome && (
                      <p style={{ margin: "2px 0", fontSize: "11px", color: "#495057" }}>
                        👤 Vendedor: {ponto.usuario.nome}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </>
      ) : (
        /* MARCADOR ÚNICO FALLBACK */
        temCoordenadaUnica && (
          <Marker position={[latitude, longitude]}>
            <Tooltip
              permanent
              direction="top"
              offset={[0, -10]}
              opacity={1}
              className="tooltipEntrega"
            >
              {remetente === "entrega"
                ? `📅 Entregue em: ${formatarDataEntrega(dataEntregue)}`
                : "📍 Localização"}
            </Tooltip>
            <Popup>
              {remetente === "entrega" ? "Local da Entrega" : "Posição"}
            </Popup>
          </Marker>
        )
      )}
    </MapContainer>
  );
}


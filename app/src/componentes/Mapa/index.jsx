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
import "./styles.css";

/*
    Corrige o problema do ícone padrão
    do Leaflet quando usado com React.
*/
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function CentralizarMapa({ latitude, longitude }) {
  const mapa = useMap();

  // ouvindo novas coords e setando no mapa
  useEffect(() => {
    if (!latitude || !longitude) return;

    mapa.setView([latitude, longitude], 16, {
      animate: true,
    });
  }, [latitude, longitude]);

  return null;
}

export default function Mapa({ latitude, longitude, dataCarregada, dataEntregue }) {
  
  const inicio = new Date(dataCarregada);
  const fim = new Date(dataEntregue)

  const diferencaMs = fim - inicio;

  const tempo = Math.round(diferencaMs/60000)

  if (!latitude || !longitude) {
    return (
      <div className="mapa-vazio">
        <MapPinLine size={40} weight="light" className="icone-mapa-vazio" />
        <p>Nenhuma localização encontrada</p>
        <span>Selecione um pedido ou entregador para visualizar no mapa</span>
      </div>
    );
  }

  return (
    <MapContainer center={[latitude, longitude]} zoom={16} className="mapa">
      <CentralizarMapa latitude={latitude} longitude={longitude} />

      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={[latitude, longitude]}>
        <Tooltip
          permanent
          direction="top"
          offset={[0, -10]}
          opacity={1}
          className="tooltipEntrega"
          >
        {`⏱️ tempo de entrega: ${tempo} min`}
        </Tooltip>
        <Popup>Usuário</Popup>
      </Marker>
    </MapContainer>
  );
}

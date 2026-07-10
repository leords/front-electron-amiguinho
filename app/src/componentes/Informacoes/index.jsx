import { Info, Package, User, MapPinLine, Clock } from "@phosphor-icons/react";
import "./styles.css";

// Remove aspas extras de valores salvos com JSON.stringify no localStorage
function formatarValor(valor) {
  if (valor === null || valor === undefined || valor === "undefined") return null;
  try {
    const parsed = JSON.parse(valor);
    return parsed === null || parsed === "" ? null : parsed;
  } catch {
    return valor;
  }
}

export default function Informacoes({
  pedido,
  usuario,
  latitude,
  longitude,
  ultimaAtualizacao,
}) {
  const itens = [
    { label: "Pedido", valor: formatarValor(pedido), icon: Package },
    { label: "Entregador", valor: formatarValor(usuario), icon: User },
    { label: "Latitude", valor: formatarValor(latitude), icon: MapPinLine },
    { label: "Longitude", valor: formatarValor(longitude), icon: MapPinLine },
    { label: "Última atualização", valor: formatarValor(ultimaAtualizacao), icon: Clock },
  ];

  return (
    <div className="informacoes">
      {/* Header do card */}
      <div className="card-header">
        <div className="card-header-title">
          <Info size={18} weight="bold" className="card-header-icon" />
          <h2>Última pesquisa</h2>
        </div>
      </div>

      <div className="lista-informacoes">
        {itens.map(({ label, valor, icon: Icon }) => (
          <div className="item" key={label}>
            <span className="titulo">
              <Icon size={14} className="titulo-icone" />
              {label}
            </span>
            <span className={`valor ${!valor ? "valor-vazio" : ""}`}>
              {valor ?? "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

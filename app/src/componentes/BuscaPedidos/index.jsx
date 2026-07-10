import { useEffect, useState } from "react";
import { Package, CalendarBlank, CircleNotch, MagnifyingGlass } from "@phosphor-icons/react";
import "./styles.css";
import { buscarPedido } from "../../operadores/API/pedido/buscarPedido.js";
import { usarAuth } from "../Context/authContext.jsx";
import { dataHoraFormatada } from "../../utils/data";

export default function BuscaPedidos({ setLatitude, setLongitude, setDataCarregada, setDataEntregue }) {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pedidoAtual, setPedidoAtual] = useState(null);

  const { usuario } = usarAuth();

  // Gera data atual para hoje nos dois estados
  useEffect(() => {
    const hoje = new Date().toISOString().split("T")[0];
    setDataInicio(hoje);
    setDataFim(hoje);
  }, []);

  // Função que busca pedidos
  async function pesquisarPedidos() {
    try {
      setLoading(true);

      const resposta = await buscarPedido({
        setor: "delivery",
        dataInicio: dataInicio,
        dataFim: dataFim,
        status: "entregue",
      });

      setPedidos(resposta);
    } catch (erro) {
      console.error(erro);
    } finally {
      setLoading(false);
    }
  }

  async function selecionarPedido(idPedido) {
    try {
      const pedido = pedidos.find((item) => item.id === Number(idPedido));

      setPedidoAtual(pedido.id);

      localStorage.setItem("ultimoCliente", JSON.stringify(pedido?.cliente.nome));
      localStorage.setItem("ultimoUsuario", JSON.stringify(usuario?.nome));
      localStorage.setItem("ultimaLatitude", JSON.stringify(pedido?.latitudeEntrega));
      localStorage.setItem("ultimaLongitude", JSON.stringify(pedido?.longitudeEntrega));
      localStorage.setItem("ultimaBusca", JSON.stringify(dataHoraFormatada()));

      setDataCarregada(pedido?.dataCarregada)
      setDataEntregue(pedido?.dataEntrega)

      setLatitude(pedido?.latitudeEntrega);
      setLongitude(pedido?.longitudeEntrega);
    } catch (erro) {
      console.error(erro);
    }
  }

  return (
    <div className="busca-pedidos">
      {/* Header do card */}
      <div className="card-header">
        <div className="card-header-title">
          <Package size={18} weight="bold" className="card-header-icon" />
          <h2>Buscar Pedido</h2>
        </div>

        {loading && (
          <span className="carregando-badge">
            <CircleNotch size={13} weight="bold" className="spinner-icon" />
            Buscando
          </span>
        )}
      </div>

      {/* DATAS */}
      <div className="filtros-grid">
        <div className="filtro-grupo">
          <label className="filtro-label">
            <CalendarBlank size={13} />
            Data Inicial
          </label>
          <input
            className="calendario"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>

        <div className="filtro-grupo">
          <label className="filtro-label">
            <CalendarBlank size={13} />
            Data Final
          </label>
          <input
            className="calendario"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>
      </div>

      {/* BOTÃO BUSCAR */}
      <button className="botao-principal" onClick={pesquisarPedidos} disabled={loading}>
        <MagnifyingGlass size={16} weight="bold" />
        Buscar
      </button>

      {/* SELECT DE PEDIDOS */}
      {pedidos.length > 0 && (
        <div className="filtro-grupo">
          <label className="filtro-label">Selecionar cliente</label>
          <select
            className="select-input"
            value={pedidoAtual ?? ""}
            onChange={(e) => selecionarPedido(e.target.value)}
          >
            <option value="">Selecione...</option>
            {pedidos.map((pedido) => (
              <option key={pedido.id} value={pedido.id}>
                {pedido.cliente.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      {!loading && pedidos.length === 0 && (
        <div className="estado-vazio-inline">
          <Package size={28} weight="light" className="icone-vazio" />
          <span>Nenhum pedido buscado ainda</span>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  Moped,
  CalendarBlank,
  CircleNotch,
  MagnifyingGlass,
  Clock,
  Package,
} from "@phosphor-icons/react";
import "./styles.css";
import { buscarPedido } from "../../operadores/API/pedido/buscarPedido.js";
import { dataFormatadaCalendario, dataHoraFormatada } from "../../utils/data";
import { formatarMoeda } from "../../utils/formartarMoeda";
import { usarToast } from "../Context/toastContext";
import { ToastRadix } from "../ui/notificacao/notificacao";

export default function BuscaPedidos({
  setPontosRota,
  setPontoFocado,
  setRemetente,
}) {
  const [dataDelivery, setDataDelivery] = useState("");
  const [pontos, setPontos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pontoSelecionadoId, setPontoSelecionadoId] = useState(null);

  const { mensagem, setMensagem } = usarToast();

  // Inicializa data com o dia de hoje
  useEffect(() => {
    const hoje = dataFormatadaCalendario(new Date());
    setDataDelivery(hoje);
  }, []);

  async function pesquisarEntregasDelivery() {
    if (!dataDelivery) {
      setMensagem("Informe a data para buscar as entregas do delivery.");
      return;
    }

    try {
      setLoading(true);
      setPontoSelecionadoId(null);

      // Busca pedidos do setor delivery para o dia selecionado
      const resposta = await buscarPedido({
        setor: "delivery",
        dataInicio: dataDelivery,
        dataFim: dataDelivery,
      });

      const pedidosArray = Array.isArray(resposta) ? resposta : [];

      // Filtra apenas pedidos com coordenadas válidas de entrega e ordena por dataEntrega crescente
      const pontosValidos = pedidosArray
        .filter(
          (p) =>
            p.latitudeEntrega != null &&
            p.longitudeEntrega != null &&
            !isNaN(Number(p.latitudeEntrega)) &&
            !isNaN(Number(p.longitudeEntrega))
        )
        .sort((a, b) => {
          const dataA = new Date(a.dataEntrega || a.data).getTime();
          const dataB = new Date(b.dataEntrega || b.data).getTime();
          return dataA - dataB;
        })
        .map((pedido, index) => {
          const enderecoCompleto = [
            pedido.cliente?.endereco,
            pedido.cliente?.numero ? `nº ${pedido.cliente.numero}` : null,
            pedido.cliente?.bairro,
          ]
            .filter(Boolean)
            .join(", ");

          return {
            id: pedido.id,
            uuid: pedido.uuid,
            sequencia: index + 1,
            latitude: Number(pedido.latitudeEntrega),
            longitude: Number(pedido.longitudeEntrega),
            data: pedido.dataEntrega || pedido.data,
            origem: "delivery",
            total: pedido.total,
            formaPagamento: pedido.formaPagamento?.nome,
            status: pedido.status,
            cliente: {
              id: pedido.cliente?.id,
              nome: pedido.cliente?.nome || `Cliente #${pedido.clienteId || ""}`,
              telefone: pedido.cliente?.telefone,
              endereco: enderecoCompleto || pedido.cliente?.endereco || "",
              cidade: pedido.cliente?.cidade,
              referencia: pedido.cliente?.referencia,
            },
          };
        });

      setPontos(pontosValidos);
      setPontosRota(pontosValidos);
      setRemetente("delivery");

      if (pontosValidos.length > 0) {
        localStorage.setItem(
          "ultimoCliente",
          JSON.stringify(`Entregas Delivery (${pontosValidos.length} pontos)`)
        );
        localStorage.setItem("ultimoUsuario", JSON.stringify("Delivery"));
        localStorage.setItem(
          "ultimaLatitude",
          JSON.stringify(pontosValidos[0].latitude)
        );
        localStorage.setItem(
          "ultimaLongitude",
          JSON.stringify(pontosValidos[0].longitude)
        );
        localStorage.setItem("ultimaBusca", JSON.stringify(dataHoraFormatada()));

        setMensagem(`${pontosValidos.length} entregas encontradas para o mapa.`);
      } else {
        if (pedidosArray.length > 0) {
          setMensagem(
            `Foram encontrados ${pedidosArray.length} pedidos, mas nenhum possui coordenadas GPS registradas.`
          );
        } else {
          setMensagem("Nenhum pedido de delivery encontrado para esta data.");
        }
      }
    } catch (erro) {
      console.error("Erro ao pesquisar entregas delivery:", erro);
      setMensagem(erro.message || "Erro ao consultar pedidos de delivery.");
    } finally {
      setLoading(false);
    }
  }

  function selecionarPonto(ponto) {
    setPontoSelecionadoId(ponto.id);
    if (typeof setPontoFocado === "function") {
      setPontoFocado(ponto);
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

  return (
    <div className="busca-pedidos">
      <ToastRadix mensagem={mensagem} />

      {/* Header do card */}
      <div className="card-header">
        <div className="card-header-title">
          <Moped size={20} weight="bold" className="card-header-icon" />
          <h2>Entregas do Delivery</h2>
        </div>

        {loading && (
          <span className="carregando-badge">
            <CircleNotch size={13} weight="bold" className="spinner-icon" />
            Buscando
          </span>
        )}
      </div>

      {/* FILTRO DE DATA ÚNICA */}
      <div className="filtros-grid">
        <div className="filtro-grupo">
          <label className="filtro-label">
            <CalendarBlank size={13} />
            Data das Entregas
          </label>
          <input
            className="calendario"
            type="date"
            value={dataDelivery}
            onChange={(e) => setDataDelivery(e.target.value)}
          />
        </div>
      </div>

      {/* BOTÃO BUSCAR ENTREGAS */}
      <button
        type="button"
        className="botao-principal"
        onClick={pesquisarEntregasDelivery}
        disabled={loading}
      >
        <MagnifyingGlass size={16} weight="bold" />
        {loading ? "Carregando Entregas..." : "Visualizar Entregas no Mapa"}
      </button>

      {/* LISTA DE ENTREGAS REALIZADAS */}
      {pontos.length > 0 && (
        <>
          <div className="resumo-entrega-header">
            <span>Entregas Sequenciais</span>
            <span className="badge-total-pontos">{pontos.length} entregas</span>
          </div>

          <div className="lista-pontos-delivery">
            {pontos.map((ponto, index) => {
              const seq = ponto.sequencia || index + 1;
              const isAtivo = pontoSelecionadoId === ponto.id;

              return (
                <div
                  key={ponto.id || ponto.uuid || index}
                  className={`item-ponto-delivery ${
                    isAtivo ? "item-ponto-ativo" : ""
                  }`}
                  onClick={() => selecionarPonto(ponto)}
                  title="Clique para centralizar no mapa"
                >
                  <div className="ponto-sequencia-badge">{seq}</div>

                  <div className="ponto-info">
                    <div className="ponto-cliente-linha">
                      <strong className="ponto-cliente-nome">
                        {ponto.cliente?.nome || "Cliente"}
                      </strong>
                    </div>

                    <div className="ponto-detalhes">
                      <Clock size={12} />
                      <span>{formatarHora(ponto.data)}</span>
                      {ponto.cliente?.cidade && (
                        <>
                          <span>•</span>
                          <span className="ponto-endereco">
                            {ponto.cliente.cidade}
                          </span>
                        </>
                      )}
                    </div>

                    {ponto.cliente?.endereco && (
                      <div
                        className="ponto-endereco"
                        title={ponto.cliente.endereco}
                      >
                        {ponto.cliente.endereco}
                      </div>
                    )}

                    {(ponto.total != null || ponto.formaPagamento) && (
                      <div className="ponto-valores">
                        {ponto.total != null && (
                          <span>{formatarMoeda(ponto.total)}</span>
                        )}
                        {ponto.formaPagamento && (
                          <>
                            <span>•</span>
                            <span>{ponto.formaPagamento}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!loading && pontos.length === 0 && (
        <div className="estado-vazio-inline">
          <Package size={28} weight="light" className="icone-vazio" />
          <span>Selecione a data para mapear as entregas do delivery</span>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  Path,
  CalendarBlank,
  User,
  CircleNotch,
  MagnifyingGlass,
  MapPin,
  Clock,
  Storefront,
} from "@phosphor-icons/react";
import "./styles.css";
import { LerUsuario } from "../../operadores/API/usuario/lerUsuario";
import { buscarRotaVendedor } from "../../operadores/API/localizacao/buscarRotaVendedor";
import { dataFormatadaCalendario, dataHoraFormatada } from "../../utils/data";
import { usarToast } from "../Context/toastContext";
import { ToastRadix } from "../ui/notificacao/notificacao";

export default function BuscarRotas({
  setPontosRota,
  setPontoFocado,
  setRemetente,
}) {
  const [dataRota, setDataRota] = useState("");
  const [vendedores, setVendedores] = useState([]);
  const [vendedorId, setVendedorId] = useState("");
  const [pontos, setPontos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingVendedores, setLoadingVendedores] = useState(false);
  const [pontoSelecionadoId, setPontoSelecionadoId] = useState(null);

  const { mensagem, setMensagem } = usarToast();

  // Inicializa data atual e carrega lista de vendedores com nível EXTERNO
  useEffect(() => {
    const hoje = dataFormatadaCalendario(new Date());
    setDataRota(hoje);
    carregarVendedores();
  }, []);

  async function carregarVendedores() {
    try {
      setLoadingVendedores(true);
      const lista = await LerUsuario();
      if (Array.isArray(lista)) {
        const apenasExternos = lista.filter(
          (u) => (u.nivelAcesso || "").toUpperCase() === "EXTERNO"
        );
        setVendedores(apenasExternos);
        if (apenasExternos.length > 0) {
          setVendedorId(String(apenasExternos[0].id));
        }
      }
    } catch (erro) {
      console.error("Erro ao carregar lista de vendedores:", erro);
      setMensagem("Erro ao carregar lista de vendedores externos.");
    } finally {
      setLoadingVendedores(false);
    }
  }

  async function pesquisarRota() {
    if (!vendedorId) {
      setMensagem("Selecione um vendedor externo.");
      return;
    }
    if (!dataRota) {
      setMensagem("Informe a data da rota.");
      return;
    }

    try {
      setLoading(true);
      setPontoSelecionadoId(null);

      const resultado = await buscarRotaVendedor({
        data: dataRota,
        usuarioId: Number(vendedorId),
      });

      const pontosValidos = Array.isArray(resultado)
        ? resultado
            .filter((p) => p.latitude != null && p.longitude != null)
            .sort((a, b) => (Number(a.sequencia) || 0) - (Number(b.sequencia) || 0))
        : [];

      setPontos(pontosValidos);
      setPontosRota(pontosValidos);
      setRemetente("rota");

      const vendedorObj = vendedores.find((v) => String(v.id) === String(vendedorId));
      const vendedorNome = vendedorObj?.nome || "Vendedor";

      if (pontosValidos.length > 0) {
        localStorage.setItem(
          "ultimoCliente",
          JSON.stringify(`Rota de ${vendedorNome} (${pontosValidos.length} pontos)`)
        );
        localStorage.setItem("ultimoUsuario", JSON.stringify(vendedorNome));
        localStorage.setItem(
          "ultimaLatitude",
          JSON.stringify(pontosValidos[0].latitude)
        );
        localStorage.setItem(
          "ultimaLongitude",
          JSON.stringify(pontosValidos[0].longitude)
        );
        localStorage.setItem("ultimaBusca", JSON.stringify(dataHoraFormatada()));

        setMensagem(`Rota carregada com ${pontosValidos.length} paradas.`);
      } else {
        setMensagem("Nenhuma localização ou parada encontrada para este vendedor nesta data.");
      }
    } catch (erro) {
      console.error("Erro ao pesquisar rota:", erro);
      setMensagem(erro.message || "Erro ao consultar rota do vendedor.");
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
    <div className="busca-rotas">
      <ToastRadix mensagem={mensagem} />

      {/* Header do card */}
      <div className="card-header">
        <div className="card-header-title">
          <Path size={18} weight="bold" className="card-header-icon" />
          <h2>Rastrear Rota do Vendedor</h2>
        </div>

        {loading && (
          <span className="carregando-badge">
            <CircleNotch size={13} weight="bold" className="spinner-icon" />
            Buscando Rota
          </span>
        )}
      </div>

      {/* FILTROS: DATA E VENDEDOR EXTERNO */}
      <div className="filtros-grid">
        <div className="filtro-grupo">
          <label className="filtro-label">
            <CalendarBlank size={13} />
            Data da Rota
          </label>
          <input
            className="calendario"
            type="date"
            value={dataRota}
            onChange={(e) => setDataRota(e.target.value)}
          />
        </div>

        <div className="filtro-grupo">
          <label className="filtro-label">
            <User size={13} />
            Vendedor Externo
          </label>
          <select
            className="select-input"
            value={vendedorId}
            onChange={(e) => setVendedorId(e.target.value)}
            disabled={loadingVendedores}
          >
            {vendedores.length > 0 ? (
              vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))
            ) : (
              <option value="">
                {loadingVendedores ? "Carregando..." : "Nenhum vendedor externo"}
              </option>
            )}
          </select>
        </div>
      </div>

      {/* BOTÃO BUSCAR ROTA */}
      <button
        type="button"
        className="botao-principal"
        onClick={pesquisarRota}
        disabled={loading || loadingVendedores}
      >
        <MagnifyingGlass size={16} weight="bold" />
        {loading ? "Carregando Rota..." : "Visualizar Rota no Mapa"}
      </button>

      {/* LISTA DE PONTOS / PARADAS DA ROTA */}
      {pontos.length > 0 && (
        <>
          <div className="resumo-rota-header">
            <span>Paradas Realizadas</span>
            <span className="badge-total-pontos">{pontos.length} pontos</span>
          </div>

          <div className="lista-pontos-rota">
            {pontos.map((ponto, index) => {
              const seq = ponto.sequencia || index + 1;
              const isAtivo = pontoSelecionadoId === ponto.id;

              return (
                <div
                  key={ponto.id || ponto.uuid || index}
                  className={`item-ponto-rota ${isAtivo ? "item-ponto-ativo" : ""}`}
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
                          <span className="ponto-endereco">{ponto.cliente.cidade}</span>
                        </>
                      )}
                    </div>

                    {ponto.cliente?.endereco && (
                      <div className="ponto-endereco" title={ponto.cliente.endereco}>
                        {ponto.cliente.endereco}
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
          <Storefront size={26} weight="light" className="icone-vazio" />
          <span>Selecione a data e o vendedor para traçar a rota no mapa</span>
        </div>
      )}
    </div>
  );
}

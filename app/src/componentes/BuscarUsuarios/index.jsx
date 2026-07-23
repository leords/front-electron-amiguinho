import { useEffect, useRef, useState } from "react";
import { MagnifyingGlass, User, CircleNotch, UsersThree, Broadcast } from "@phosphor-icons/react";
import "./styles.css";
import { LerUsuario } from "../../operadores/API/usuario/lerUsuario";
import { buscarLocalizacaoEntregador } from "../../operadores/API/localizacao/buscarLocalizacaoEntregador";
import { dataHoraFormatada } from "../../utils/data";
import { registrarEventosSocket } from "../../socket/eventos";
import { usarAuth } from "../Context/authContext";
import { ToastRadix } from "../ui/notificacao/notificacao";
import { usarToast } from "../Context/toastContext";

export default function BuscaUsuarios({ setLatitude, setLongitude, setRemetente }) {
  
  //Estados
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pesquisa, setPesquisa] = useState("");
  const [selecionadoId, setSelecionadoId] = useState(null);
  const [coords, setCoords] = useState(null);

  // Hook
  const { mensagem, setMensagem } = usarToast();
  const { usuario } = usarAuth();

  const selecionadoIdRef = useRef(null);

  useEffect(() => {
    selecionadoIdRef.current = selecionadoId;
  }, [selecionadoId]);

  useEffect(() => {
    carregarUsuarios();

    registrarEventosSocket((dados) => {
      if (dados.entregadorId === selecionadoIdRef.current) {
        setCoords(dados);
      }
    });
  }, []);

  useEffect(() => {
    if (!coords) return;

    setLatitude(coords.latitude);
    setLongitude(coords.longitude);

    localStorage.setItem("ultimoCliente", JSON.stringify(""));
    localStorage.setItem("ultimoUsuario", JSON.stringify(usuario?.nome));
    localStorage.setItem("ultimaLatitude", JSON.stringify(coords.latitude));
    localStorage.setItem("ultimaLongitude", JSON.stringify(coords.longitude));
    localStorage.setItem("ultimaBusca", JSON.stringify(dataHoraFormatada()));
  }, [coords]);

  async function carregarUsuarios() {
    try {
      setLoading(true);
      const resposta = await LerUsuario();
      const niveisPermitidos = ["ENTREGADOR", "EXTERNO"];
      const usuariosFiltrados = resposta.filter((u) =>
        niveisPermitidos.includes(u.nivelAcesso)
      );
      setUsuarios(usuariosFiltrados);
    } catch (erro) {
      console.error(erro);
    } finally {
      setLoading(false);
    }
  }

  async function selecionarUsuario(usuarioSelecionado) {
    try {
      setLoading(true);
      setSelecionadoId(usuarioSelecionado.id);
      setRemetente("entregador");

       const localizacao = await buscarLocalizacaoEntregador(usuarioSelecionado.id);

          // ✅ usa a localização inicial retornada pela API
      if (localizacao?.latitude && localizacao?.longitude) {
        setLatitude(localizacao.latitude);
        setLongitude(localizacao.longitude);
      }
      
    } catch (error) {
      console.error(error);
      setMensagem(error.message);
    } finally {
      setLoading(false);
    }
  }


  const usuariosFiltrados = usuarios.filter((u) =>
    u.nome.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <div className="busca-usuarios">
      <ToastRadix mensagem={mensagem} />
      <div className="card-header">
        <div className="card-header-title">
          <UsersThree size={18} weight="bold" className="card-header-icon" />
          <h2>Buscar Entregador</h2>
        </div>

        {loading && (
          <span className="carregando-badge">
            <CircleNotch size={13} weight="bold" className="spinner-icon" />
            Atualizando
          </span>
        )}
      </div>

      <div className="busca-input-wrapper">
        <MagnifyingGlass size={16} className="busca-input-icon" />
        <input
          className="input"
          type="text"
          placeholder="Pesquisar entregador..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
        />
      </div>

      <div className="lista-usuarios">
        {!loading && usuariosFiltrados.length === 0 && (
          <div className="estado-vazio">
            <User size={34} weight="light" className="icone-vazio" />
            <p>Nenhum entregador encontrado</p>
            <span>Tente ajustar sua pesquisa</span>
          </div>
        )}

        {usuariosFiltrados.map((u) => {

          return (
            <div
              key={u.id}
              className={`card-usuario ${selecionadoId === u.id ? "card-usuario-ativo" : ""}`}
              onClick={() => selecionarUsuario(u)}
            >
              <div className="card-usuario-info">
                <div className="avatar-usuario">
                  <User size={16} weight="bold" />
                </div>
                <div>
                  <strong>{u.nome}</strong>
                  <span className={`badge ${u.nivelAcesso === "ENTREGADOR" ? "badge-orange" : "badge-blue"}`}>
                    {u.nivelAcesso}
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}

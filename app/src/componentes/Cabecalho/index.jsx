import {
  CalendarBlankIcon,
  CloudCheckIcon,
  CloudXIcon,
  HouseLineIcon,
  SignOutIcon,
  UserCircleCheckIcon,
} from "@phosphor-icons/react";
import styles from "./styles.module.css";
import { useNavigate } from "react-router-dom";
import { usarAuth } from "../Context/authContext";
import { useEffect, useState } from "react";
import { AlertaRadix } from "../ui/alerta/alerta.jsx";
import mascote from "../../assets/logo-unico.png";

export default function Cabecalho() {
  const navegar = useNavigate();
  const { sair, usuario } = usarAuth();
  const [diaSemana, setDiaSemana] = useState("");
  const [online, setOnline] = useState(navigator.onLine);

  // Gera o nome da semana em extenso
  useEffect(() => {
    const hojeDiaSemana = new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    setDiaSemana(hojeDiaSemana);
  }, []);

  // Monitora status de conexão
  useEffect(() => {
    const marcarOnline = () => setOnline(true);
    const marcarOffline = () => setOnline(false);

    window.addEventListener("online", marcarOnline);
    window.addEventListener("offline", marcarOffline);

    return () => {
      window.removeEventListener("online", marcarOnline);
      window.removeEventListener("offline", marcarOffline);
    };
  }, []);

  // Voltar ao menu
  const tratarVoltarMenu = () => {
    navegar("/menu");
  };

  // Deslogar o usuário.
  const tratarSair = async () => {
    try {
      await sair();
    } catch (error) {
      console.error("Erro ao sair:", error);
      alert("Erro ao sair da conta. Tente novamente.");
    }
  };

  return (
    <header className={styles.cabecalho}>
      <div className={styles.container}>
        {/* TÍTULO, USUÁRIO E STATUS DE SERVIDOR */}
        <div className={styles.containerTitulos}>
          {/* MASCOTE */}
          <div className={styles.mascoteMoldura}>
            <img
              src={mascote}
              alt="Mascote Amigão Distribuidora"
              className={styles.mascote}
            />
          </div>

          <div className={styles.textoTitulos}>
            <h1 className={styles.titulo}>Sistema de Controle Amiguinho</h1>

            <div className={styles.linhaInfo}>
              <span className={styles.pilha}>
                <UserCircleCheckIcon size={16} weight="duotone" />
                {usuario?.nome || "Carregando..."}
              </span>

              <span
                className={`${styles.pilha} ${
                  online ? styles.pilhaOnline : styles.pilhaOffline
                }`}
                title={online ? "Servidor conectado" : "Sem conexão"}
              >
                {online ? (
                  <CloudCheckIcon size={16} weight="duotone" />
                ) : (
                  <CloudXIcon size={16} weight="duotone" />
                )}
                {online ? "Conectado" : "Offline"}
              </span>
            </div>
          </div>
        </div>

        {/* BOTÕES */}
        <div className={styles.botoescabecalho}>
          <div className={styles.botoes}>
            {/* BOTÃO HOME */}
            <button
              title="Menu inicial"
              onClick={tratarVoltarMenu}
              className={styles.iconeBotao}
              aria-label="Ir para menu inicial"
            >
              <HouseLineIcon size={28} />
            </button>

            {/* BOTÃO DESLOGAR */}
            <AlertaRadix
              titulo="Deslogar da conta"
              descricao="Você realmente deseja sair da sua conta?"
              tratar={tratarSair}
              confirmarTexto="Confirmar sair"
              cancelarTexto="Cancelar"
              trigger={
                <button
                  title="Sair"
                  className={styles.iconeBotao}
                  aria-label="Sair da conta"
                >
                  <SignOutIcon size={28} />
                </button>
              }
            />
          </div>

          {/* DIA */}
          <span className={styles.pilhaData}>
            <CalendarBlankIcon size={16} weight="duotone" />
            {diaSemana}
          </span>
        </div>
      </div>
    </header>
  );
}

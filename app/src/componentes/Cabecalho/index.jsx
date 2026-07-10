import { CloudCheckIcon, CloudXIcon, HouseLineIcon, SignOutIcon, UserCircleCheckIcon } from "@phosphor-icons/react";
import styles from "./styles.module.css";
import { useNavigate } from "react-router-dom";
import { usarAuth } from "../Context/authContext";
import { useEffect, useState } from "react";
import { AlertaRadix } from "../ui/alerta/alerta.jsx";


export default function Cabecalho() {
  const navegar = useNavigate();
  const { sair, usuario } = usarAuth();
  const [climaAtual, setClimaAtual] = useState({});
  const [diaSemana, setDiaSemana] = useState("");



  // Gera o nome da semana em extenso
  useEffect(() => {
    const diaDaSemana = async () => {
      const hojeDiaSeamana = new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      setDiaSemana(hojeDiaSeamana);
    };

    diaDaSemana();
  }, []);

  // Chama a API do clima
  useEffect(() => {
    const buscarClimaAtual = async () => {
      const clima = await window.API.buscarClima("Canoinhas");
      setClimaAtual({
        temperatura: clima.main.temp,
        condicao: clima.weather[0].description,
      });
    };
    buscarClimaAtual();

  // ATUALIZA A CADA 5 MINUTOS.  (1 minuto é igual a 60000 ms)
    const intervalo = setInterval(() => {
      buscarClimaAtual();
    }, 300000);

    return () => clearInterval(intervalo);
  }, []);

  // Voltar ao menu
  const tratarVoltarMenu = () => {
    navegar("/menu");
  };

  // Deslogar o usuário.
  const tratarSair = async () => {
    console.log("Deslogar");
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
          <h1 className={styles.titulo}>Sistema de vendas Amiguinho</h1>
          <p> 
            <UserCircleCheckIcon size={24} color="gray" weight="duotone" alt="Servidor conectado!"/> 
            Usuário conectado: {usuario?.nome || "Carregando..."} 
          </p>

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

          {/* DIA E CLIMA  */}
          <p>📅 {diaSemana}</p>
          <p>  
            {climaAtual.temperatura < 14 ? (
              <span className={styles.iconeClima}>🌥️</span>
            ) : (
              <span className={styles.iconeClima}>☀️</span>
            )}
            {Math.round(climaAtual.temperatura)}°, {climaAtual.condicao} 
          </p>

        </div>

      </div>
    </header>
  );
}

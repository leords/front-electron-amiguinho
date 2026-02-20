import { HouseLineIcon, SignOutIcon } from "@phosphor-icons/react";
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


  // GERA O NOME DA SEMANA EM EXTENSO.
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

  // PEGA O CLIMA ATUAL DO DIA.
  useEffect(() => {
    const buscarClimaAtual = async () => {
      const clima = await window.API.buscarClima("Canoinhas");
      setClimaAtual({
        temperatura: clima.main.temp,
        condicao: clima.weather[0].description,
      });
      console.log(clima);
    };
    buscarClimaAtual();

  // ATUALIZA A CADA 5 MINUTOS.  (1 minuto é igual a 60000 ms)
    const intervalo = setInterval(() => {
      buscarClimaAtual();
    }, 300000);

    return () => clearInterval(intervalo);
  }, []);


  // VOLTAR AO MENU INICIAL.
  const tratarVoltarMenu = () => {
    navegar("/menu");
  };

  // DESLOGAR.
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
        <div>
          <h1 className={styles.titulo}>Sistema de vendas Amiguinho</h1>
          <p>Usuário conectado: {usuario?.nome || "Carregando..."}</p>
        </div>
        <div className={styles.botoescabecalho}>
          <div className={styles.botoes}>
            <button
              title="Menu inicial"
              onClick={tratarVoltarMenu}
              className={styles.iconeBotao}
              aria-label="Ir para menu inicial"
            >
              <HouseLineIcon size={28} />
            </button>
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

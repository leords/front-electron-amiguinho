import {
  ShoppingCartIcon,
  ClockCounterClockwiseIcon,
  CoinsIcon,
} from "@phosphor-icons/react";
import MenuButton from "../../componentes/Botao/index";
import mascote from "../../assets/mascote.png";
import styles from "./styles.module.css";
import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import { useEffect, useState } from "react";
import GerarVersiculo from "../../utils/gerarVersiculo";

export default function Menu() {
  const [saudacao, setSaudacao] = useState("");
  const [mensagemDoDia, setMensagemDoDia] = useState("");
  const [diaSemana, setDiaSemana] = useState("");
  const [estatisticas, setEstatisticas] = useState({
    vendasHoje: 12,
    totalHoje: 5000.0,
  });

  // Gera o dia da semana extenso
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

  // Busca via groq a mensagem do dia.
  useEffect(() => {
    const carregarMensagem = async () => {
      const mensagemSalva = localStorage.getItem("mensagemDoDia");
      const dataSalva = localStorage.getItem("mensagemDoDia_data");

      const hoje = new Date().toISOString().slice(0, 10); //YYYY-MM-DD

      // Se já tem mensagem salva para hoje, usar ela
      if (mensagemSalva && dataSalva === hoje) {
        setMensagemDoDia(mensagemSalva);
        return;
      }

      //Caso contrário, busca da API
      const novaMensagem = await GerarVersiculo();
      localStorage.setItem("mensagemDoDia", novaMensagem);
      localStorage.setItem("mensagemDoDia_data", hoje);
      setMensagemDoDia(novaMensagem);
    };

    carregarMensagem();
  }, []);

  // Define saudação baseada no horário
  useEffect(() => {
    const hora = new Date().getHours();
    if (hora < 12) {
      setSaudacao("Bom dia");
    } else if (hora < 18) {
      setSaudacao("Boa tarde");
    } else {
      setSaudacao("Boa noite");
    }
  }, []);

  return (
    <div className={styles.container}>
      <Cabecalho />

      <main className={styles.principal}>
        {/* Saudação e Estatísticas */}
        <div className={styles.cabecalho}>
          <div className={styles.saudacao}>
            <h1>
              {saudacao}! <span className={styles.emoji}>👋</span>
            </h1>
            <p>O que você gostaria de fazer hoje?</p>
          </div>
          {/* aqui colocar o clima atual. */}
        </div>

        {/* Botões do Menu */}
        <div className={styles.menuBotoes}>
          <MenuButton
            titulo="Vendas"
            descricao="Registrar novos pedidos"
            corBG="linear-gradient(135deg, #ff8c00 0%, #ffa726 100%)"
            destino="/venda"
            imagem={<ShoppingCartIcon size={70} weight="duotone" />}
          />

          <MenuButton
            titulo="Histórico"
            descricao="Consultar pedidos anteriores"
            corBG="linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)"
            destino="/historico"
            imagem={<ClockCounterClockwiseIcon size={70} weight="duotone" />}
          />

          <MenuButton
            titulo="Fechamento"
            descricao="Conferir caixa do dia"
            corBG="linear-gradient(135deg, #388e3c 0%, #66bb6a 100%)"
            destino="/fechamento"
            imagem={<CoinsIcon size={70} weight="duotone" />}
          />
        </div>

        {/* Mascote e mensagem do dia */}
        <div className={styles.containerMascote}>
          <div className={styles.dicaDia}>
            <h3>
              <span className={styles.emojiDica}>💡</span> Mensagem do Dia
            </h3>
            <p>{mensagemDoDia}</p>
            <p className={styles.diaSemana}>{diaSemana}</p>
          </div>
          <img
            src={mascote}
            alt="Mascote Amigão Distribuidora"
            className={styles.mascote}
          />
        </div>
      </main>

      <Rodape />
    </div>
  );
}

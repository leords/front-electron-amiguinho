import {
  ShoppingCartIcon,
  ClockCounterClockwiseIcon,
  CoinsIcon,
  ChartLineIcon,
  CurrencyCircleDollarIcon,
  HandWithdrawIcon,
  ClipboardTextIcon,
  CloudArrowUpIcon,
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

  useEffect(() => {
    const carregarMensagem = async () => {
      const mensagemSalva = localStorage.getItem("mensagemDoDia");
      const dataSalva = localStorage.getItem("mensagemDoDia_data");
      const hoje = new Date().toISOString().slice(0, 10);

      if (mensagemSalva && dataSalva === hoje) {
        setMensagemDoDia(mensagemSalva);
        return;
      }

      const novaMensagem = await GerarVersiculo();
      localStorage.setItem("mensagemDoDia", novaMensagem);
      localStorage.setItem("mensagemDoDia_data", hoje);
      setMensagemDoDia(novaMensagem);
    };

    carregarMensagem();
  }, []);

  useEffect(() => {
    const hora = new Date().getHours();
    if (hora < 12) setSaudacao("Bom dia");
    else if (hora < 18) setSaudacao("Boa tarde");
    else setSaudacao("Boa noite");
  }, []);

  return (
    <div className={styles.container}>
      <Cabecalho />

      <main className={styles.principal}>

        {/* Saudação */}
        <div className={styles.cabecalho}>
          <div className={styles.saudacao}>
            <h1>
              {saudacao}! <span className={styles.emoji}>👋</span>
            </h1>
            <p>O que você gostaria de fazer hoje?</p>
          </div>
        </div>

        {/* Grid de botões */}
        <div className={styles.menuBotoes}>
          <MenuButton titulo="Vendas"         descricao="Registrar novos pedidos"           destino="/venda"        icone={ShoppingCartIcon}          cor="orange" />
          <MenuButton titulo="Histórico"      descricao="Consultar pedidos anteriores"      destino="/historico"    icone={ClockCounterClockwiseIcon} cor="blue"   />
          <MenuButton titulo="Fechamento"     descricao="Conferir caixa do dia"             destino="/fechamento"   icone={CoinsIcon}                 cor="green"  />
          <MenuButton titulo="Dashboard"      descricao="Conferir números de venda"         destino="/dashboard"    icone={ChartLineIcon}             cor="gray"   />
          <MenuButton titulo="Fechar balcão"  descricao="Finalizar operações do dia"        destino="/fechar-balcao" icone={CurrencyCircleDollarIcon} cor="orange" />
          <MenuButton titulo="Vales internos" descricao="Consultar histórico de vales"      destino="/vales-interno" icone={HandWithdrawIcon}         cor="blue"   />
          <MenuButton titulo="Pedidos"        descricao="Conferir pedidos realizados"       destino="/pedidos"      icone={ClipboardTextIcon}         cor="green"  />
          <MenuButton titulo="Transmissão"    descricao="Realizar cargas forçadas"          destino="/transmissao"  icone={CloudArrowUpIcon}          cor="gray"   />
        </div>

        {/* Mascote + mensagem do dia */}
        <div className={styles.containerMascote}>
          <div className={styles.dicaDia}>
            <h3>
              <span className={styles.emojiDica}>💡</span> Mensagem do Dia
            </h3>
            <p>{mensagemDoDia || "Carregando mensagem..."}</p>
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
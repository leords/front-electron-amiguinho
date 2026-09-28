import {
  GearIcon,
  Users,
  Package,
  Storefront,
  Truck,
  CoinsIcon,
  GpsFixIcon,
  HandCoinsIcon,
  PrinterIcon,
} from "@phosphor-icons/react";
import styles from "./styles.module.css";
import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import MenuButton from "../../componentes/Botao";

export default function Gestao() {
  return (
    <div className={styles.container}>
      <Cabecalho />
      <main className={styles.principal}>
        {/* CABEÇALHO */}
        <div className={styles.tituloSection}>
          <div className={styles.iconeWrapper}>
            <GearIcon size={22} weight="fill" />
          </div>
          <div>
            <p className={styles.pageSubtitulo}>Administração</p>
            <h1 className={styles.pageTitulo}>Gestão do Sistema</h1>
          </div>
        </div>

        {/* BOTÕES */}
        <div className={`${styles.gradeSecoes} ${styles.fadeUp}`}>
          <MenuButton
            titulo="Usuários"
            descricao="Criar, visualizar e editar usuários do sistema"
            destino="/usuarios"
            icone={Users}
            cor="blue"
          />

          <MenuButton
            titulo="Produtos"
            descricao="Visualizar produtos e acessar planilha"
            destino="/produtos"
            icone={Package}
            cor="green"
          />

          <MenuButton
            titulo="Clientes"
            descricao="Visualizar clientes de delivery e acessar planilha"
            destino="/clientes"
            icone={Storefront}
            cor="orange"
          />

          <MenuButton
            titulo="Ajustes de caixas"
            descricao="Visualisar e ajustar inicio de caixa"
            destino="/caixa"
            icone={CoinsIcon}
            cor="blue"
          />

          <MenuButton
            titulo="Localizar"
            descricao="Visualizar localização de aplicações externas"
            destino="/buscar-localizacao"
            icone={GpsFixIcon}
            cor="green"
          />

          <MenuButton
            titulo="Buscar fechamentos"
            descricao="Visualizar fechamentos finalizados"
            destino="/fechamentos-finalizados"
            icone={HandCoinsIcon}
            cor="orange"
          />

          <MenuButton
            titulo="Configurar impressão"
            descricao="Configurar impressora destino"
            destino="/configurar-impressora"
            icone={PrinterIcon}
            cor="blue"
          />
        </div>
      </main>
      <Rodape />
    </div>
  );
}

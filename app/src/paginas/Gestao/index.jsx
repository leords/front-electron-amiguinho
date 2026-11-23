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
  IdentificationCardIcon,
  ReceiptIcon,
  CloudArrowUpIcon,
  CreditCard,
  ChartLineUp,
  UserMinus,
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
            descricao="Cadastro, edição e gestão completa de produtos"
            destino="/produtos"
            icone={Package}
            cor="green"
          />

          <MenuButton
            titulo="Formas de Pagamento"
            descricao="Cadastro, edição e ativação de formas de pagamento"
            destino="/formas-pagamento"
            icone={CreditCard}
            cor="orange"
          />

          <MenuButton
            titulo="Clientes"
            descricao="Clientes Externos e Clientes Delivery"
            destino="/clientes"
            icone={Storefront}
            cor="orange"
          />

          <MenuButton
            titulo="Desempenho de Clientes"
            descricao="Vendas, pedidos, última compra e crescimento vs mês anterior"
            destino="/gestao-desempenho-clientes"
            icone={ChartLineUp}
            cor="orange"
          />

          <MenuButton
            titulo="Clientes sem Compras"
            descricao="Clientes inativos filtrados por vendedor e dias sem comprar"
            destino="/gestao-clientes-sem-compras"
            icone={UserMinus}
            cor="blue"
          />

          <MenuButton
            titulo="Motoristas"
            descricao="Cadastro e gestão de motoristas de entrega"
            destino="/motoristas"
            icone={IdentificationCardIcon}
            cor="orange"
          />

          <MenuButton
            titulo="Veículos"
            descricao="Frota, capacidade de carga e disponibilidade"
            destino="/veiculos"
            icone={Truck}
            cor="blue"
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

          <MenuButton
            titulo="Transmissão"
            descricao="Realizar cargas forçadas"
            destino="/transmissao"
            icone={CloudArrowUpIcon}
            cor="blue"
          />
        </div>
      </main>
      <Rodape />
    </div>
  );
}

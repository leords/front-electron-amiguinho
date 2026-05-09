
import { GearIcon, Users, Package, Storefront, Truck } from "@phosphor-icons/react";
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

                </div>
                
            </main>
            <Rodape />
        </div>
    )
}
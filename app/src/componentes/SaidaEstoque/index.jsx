import styles from './styles.module.css'
import { ArrowDownIcon, ArrowUpIcon, CalendarBlankIcon, ChartPieSliceIcon, DeviceMobileIcon, FilePdfIcon, FileXlsIcon, HouseIcon, MotorcycleIcon, PackageIcon } from '@phosphor-icons/react';
import { AlertaRadix } from '../ui/alerta/alerta';
import { RelatorioSTP } from '../../operadores/API/produto/relatorioSTP';
import { useState } from 'react';

export default function SaidaEstoque({setSetor, setDataInicio, setDataFim, dataInicio, dataFim, handleBuscar}) {

    const [botaoSelecionado, setBotaoSelecionado] = useState('geral')

    const acaoBotao = (botao) => {
        setSetor(botao)
        setBotaoSelecionado(botao)
    }

    return (
        <div className={styles.modal}>

            {/* TÍTULOS DE FILTRO */}   
            <div className={styles.tituloLista}>
                <span>Selecione setor e período</span>
            </div>

            {/* BOTÕES E SELETOR DE DATA */}
            <div className={styles.tipoGroup}>


                {/* BALCAO */}
                <button
                    className={`${styles.tipoBotao} ${botaoSelecionado === "balcao" ? styles.tipoAtivo_entrada : ""}`}
                    onClick={() => acaoBotao("balcao")}
                >
                    <HouseIcon size={16} weight="bold" />
                    Balcão
                </button>

                {/* DELIVERY */}
                <button
                    className={`${styles.tipoBotao} ${botaoSelecionado === "delivery" ? styles.tipoAtivo_entrada : ""}`}
                    onClick={() => acaoBotao("delivery")}
                >
                    <MotorcycleIcon size={16} weight="bold" />
                    Delivery
                </button>

                {/* EXTERNO */}
                <button
                    className={`${styles.tipoBotao} ${botaoSelecionado === "externo" ? styles.tipoAtivo_entrada : ""}`}
                    onClick={() => acaoBotao("externo")}
                >
                    <DeviceMobileIcon size={16} weight="bold" />
                    Externo
                </button>

                {/* GERAL */}
                <button
                    className={`${styles.tipoBotao} ${botaoSelecionado === "geral" ? styles.tipoAtivo_entrada : ""}`}
                    onClick={() => acaoBotao("geral")}
                >
                    <ChartPieSliceIcon size={16} weight="bold" />
                    Geral
                </button>

             
                {/* INPUT DATA INICIAL */}
                <div className={styles.filtroGrupo}>
                        <label className={styles.filtroLabel}>
                            <CalendarBlankIcon size={13} weight="bold" />
                            Data inicial
                        </label>
                        <input
                            type="date"
                            className={styles.calendario}
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                        />
                </div>

                {/* INPUT DATA FINAL */}
                <div className={styles.filtroGrupo}>
                        <label className={styles.filtroLabel}>
                            <CalendarBlankIcon size={13} weight="bold" />
                            Data final
                        </label>
                            <input
                            type="date"
                            className={styles.calendario}
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                            />
                    
                </div>
    
            </div>
            <div className={styles.divBotao}>
                <button onClick={handleBuscar}>Gerar Relatório</button>
            </div>

        </div>
    )
}
import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { dataHoraFormatada } from "../../utils/data";
import { formatarMoeda } from "../../utils/formartarMoeda";
import { CheckCircleIcon, ClockCountdown, WarningOctagonIcon,  PlusCircleIcon, TruckIcon , NotepadIcon, ListChecksIcon, User, ListBullets, CurrencyCircleDollar, EyeIcon, ClockCountdownIcon, XCircleIcon, CalendarBlankIcon, ArrowsClockwise, MagnifyingGlass, Package, CalendarBlank, Building } from "@phosphor-icons/react";
import { Funnel } from "recharts";
import Select from "react-select";

import { buscarFornecedores } from "../../operadores/API/fornecedores/buscarFornecedores.js";
import { buscarOrdem } from "../../operadores/API/ordemCompra/buscarOrdem.js";
import { usarToast } from "../Context/toastContext";


export default function ListaOrdemCompra({ setView, setOrdemSelecionada }) {

    // Estados
    const [carregando, setCarregando] = useState(false)
    const [atualizarListaOrdem, setAtualizarListaOrdem] = useState(false)

    // Estados de filtros
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");
    const [usuarioId, setUsuarioId] = useState(null);
    const [fornecedorId, setFornecedorId] = useState(null);
    const [status, setStatus] = useState("");

    // Listas
    const [listaOrdem, setListaOrdem] = useState([])
    const [listaFornecedores, setListaFornecedores] = useState([])


    // Hooks
    const { setMensagem } = usarToast();
    
    // Lista de status
    const listaStatus = [
      {id: 1, value: "Realizada", label: "Realizada"},
      {id: 2, value: "Finalizada", label: "Finalizada"},
      {id: 3, value: "Cancelada", label: "Cancelada"},
      {id: 4, value: "Pendente", label: "Pendente"},
      {id: 5, value: "", label: "Todos"},
    ]

    // Utilitários
    const STATUS_META = {
      Finalizada:    { cor: styles.badgeGreen,  icone: CheckCircleIcon },
      Pendente:      { cor: styles.badgeOrange, icone: ClockCountdownIcon },
      Cancelada:     { cor: styles.badgeRed,    icone: XCircleIcon }, 
      Realizada:     { cor: styles.badgeBlue,    icone: PlusCircleIcon },
    };

    // Totais de resumo
    const totalGeral = listaOrdem.reduce((s, o) => s + Number(o.total), 0);
    const qtdPendentes = listaOrdem.filter((o) => o.status === "Finalizada").length;
    const qtdRealizadas = listaOrdem.filter((o) => o.status === "Realizadas").length;
    const qtdAndamento = listaOrdem.filter((o) => o.status === "Pendente").length;
    const qtdCancelada = listaOrdem.filter((o) => o.status === "Cancelada").length;

    // Lista de usuários tratada para o Select
    const listaUsuarios = [ ...Array.from(  //  Array.from = converte para array
      new Map( //New map = estrutura com chave única → resolve duplicidade.
        listaOrdem.map((o) => [
          o.usuarioId,
          {
            value: o.usuarioId,
            label: o.usuario.nome
          },
        ]) //.values = é um método do map que retorna apenas os valores.
      ).values()), /*Spread operator = */ {value: "", label: "geral"} ]


    // Busca ordens de compra.
    useEffect(() => {
        const filtrarOrdemCompra = async () => {
            setCarregando(true);
            try {
                const resultado = await buscarOrdem({

                    usuarioId: usuarioId?.value,
                    fornecedorId: fornecedorId?.value,
                    status: status?.value,
                    dataInicio,
                    dataFim,
                })
                setListaOrdem(resultado)
            } catch (error) {
                console.log(error.message)
                setMensagem(error.message)
            } finally {
                setCarregando(false)
            }
        }

        filtrarOrdemCompra();
    }, [dataInicio, dataFim, usuarioId, fornecedorId, status, atualizarListaOrdem])

    // Buscando fornecedores.
    useEffect(() => {
      const filtrarFornecedores = async () => {
        try {
          const resultado = await buscarFornecedores({
            status: "ATIVO"
          });

          setListaFornecedores([...resultado.map((f) => ({ value: f.id, label: f.nome })), {value: "", label: "Todos"}])
          
        } catch (error) {
          console.log(error.message)
          setMensagem(error.message)
        }
      }

      filtrarFornecedores();
    }, [])


    return (
        <div className={`${styles.card} ${styles.fadeUp}`}>
            
            {/* CARDS */}
            <div className={styles.resumoGrid}>
              {/* TOTAL DE ORDENS */}
              <div className={`${styles.resumoCard} ${styles.fadeUp}`}>
                <div className={styles.resumoIcone} style={{ background: "linear-gradient(135deg,#969696,#6B6B6B)" }}>
                  <ListBullets size={20} weight="fill" />
                </div>
                <div>
                  <span className={styles.resumoValor}>{listaOrdem.length}</span>
                  <span className={styles.resumoLabel}>Total de Ordens</span>
                </div>
              </div>

              {/* TOTAL DE REALIZADAS */}
              <div className={`${styles.resumoCard} ${styles.fadeUp}`} style={{ animationDelay: "0.05s" }}>
                <div className={styles.resumoIcone} style={{ background: "linear-gradient(135deg,#2B87FF,#499CF5)" }}>
                  <NotepadIcon size={20} weight="fill" />
                </div>
                <div>
                  <span className={styles.resumoValor}>{qtdRealizadas}</span>
                  <span className={styles.resumoLabel}>Realizadas</span>
                </div>
              </div>

              {/* TOTAL DE FINALIZADAS */}
              <div className={`${styles.resumoCard} ${styles.fadeUp}`} style={{ animationDelay: "0.05s" }}>
                <div className={styles.resumoIcone} style={{ background: "linear-gradient(135deg,#2f9e44,#51cf66)" }}>
                  <ListChecksIcon size={20} weight="fill" />
                </div>
                <div>
                  <span className={styles.resumoValor}>{qtdPendentes}</span>
                  <span className={styles.resumoLabel}>Finalizadas</span>
                </div>
              </div>
            
              {/* TOTAL DE PENDENTES */}
              <div className={`${styles.resumoCard} ${styles.fadeUp}`} style={{ animationDelay: "0.05s" }}>
                <div className={styles.resumoIcone} style={{ background: "linear-gradient(135deg,#ff8c00,#ffb347)" }}>
                  <WarningOctagonIcon size={20} weight="fill" />
                </div>
                <div>
                  <span className={styles.resumoValor}>{qtdAndamento}</span>
                  <span className={styles.resumoLabel}>Pendentes</span>
                </div>
              </div>

              {/* TOTAL DE CANCELADA */}
              <div className={`${styles.resumoCard} ${styles.fadeUp}`} style={{ animationDelay: "0.05s" }}>
                <div className={styles.resumoIcone} style={{ background: "linear-gradient(135deg,#FF0000, #FF5959)" }}>
                  <XCircleIcon size={20} weight="fill" />
                </div>
                <div>
                  <span className={styles.resumoValor}>{qtdCancelada}</span>
                  <span className={styles.resumoLabel}>Canceladas</span>
                </div>
              </div>

              {/* TOTAL DE VALOR R$ */}
              <div className={`${styles.resumoCard} ${styles.fadeUp}`} style={{ animationDelay: "0.15s" }}>
                <div className={styles.resumoIcone} style={{ background: "linear-gradient(135deg,#2f9e44,#51cf66)" }}>
                  <CurrencyCircleDollar size={20} weight="fill" />
                </div>
                <div>
                  <span className={styles.resumoValor}>{formatarMoeda(totalGeral)}</span>
                  <span className={styles.resumoLabel}>Volume Total</span>
                </div>
              </div>
            </div>

            {/* TÍTULO E BOTÃO DE ATUALIZAR */}
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <ListBullets size={18} className={styles.cardHeaderIcon} />
                <h2>Ordens de Compra</h2>
              </div>
              {/* BOTÃO */}
              <button className={styles.botaoAtualizar} onClick={() => { setAtualizarListaOrdem(prev => !prev) }} title="Atualizar">
                <ArrowsClockwise size={15} weight="bold" className={carregando ? styles.spinnerIcon : ""} />
              </button>
            </div> 

            {/* FILTROS */}
            <div className={styles.painelFiltros}>
              <div className={styles.filtrosHeader}>
                <Funnel size={13} className={styles.filtroIcone} weight="bold" />
                Filtros
              </div>
              <div className={styles.filtrosGrid}>
                
                {/* DATA INICIAL */}
                <div className={styles.filtroGrupo}>
                  <label className={styles.filtroLabel}>
                    <MagnifyingGlass size={12} /> DATA ÍNICIO
                  </label>
                  <div className={styles.inputIconWrapper}>
                    <CalendarBlankIcon size={14} className={styles.inputIconLeft} />
                    <input
                      className={styles.inputComIcone}
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      type="date"
                    />
                  </div>
                </div>

                {/* DATA FINAL */}
                <div className={styles.filtroGrupo}>
                  <label className={styles.filtroLabel}>
                    <MagnifyingGlass size={12} /> DATA ÍNICIO
                  </label>
                  <div className={styles.inputIconWrapper}>
                    <CalendarBlankIcon size={14} className={styles.inputIconLeft} />
                    <input
                      className={styles.inputComIcone}
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      type="date"
                    />
                  </div>
                </div>

                {/* STATUS */}
                <div className={styles.filtroGrupo}>
                  <label className={styles.filtroLabel}>
                    <Funnel size={12} /> Status
                  </label>
                  <Select
                    classNamePrefix="custom"
                    options={listaStatus}
                    value={status}
                    onChange={(option) => setStatus(option)}
                    placeholder="Todos"
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                  />
                </div>

                {/* FORNECEDORES */}
                <div className={styles.filtroGrupo}>
                  <label className={styles.filtroLabel}>
                    <Funnel size={12} /> Fornecedores
                  </label>
                  <Select
                    classNamePrefix="custom"
                    options={listaFornecedores}
                    value={fornecedorId}
                    onChange={(option) => setFornecedorId(option)}
                    placeholder="Todos"
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                  />
                </div>

                {/* USUÁRIOS */}
                <div className={styles.filtroGrupo}>
                  <label className={styles.filtroLabel}>
                    <Funnel size={12} /> Usuários
                  </label>
                  <Select
                    classNamePrefix="custom"
                    options={listaUsuarios}
                    value={usuarioId}
                    onChange={(option) => setUsuarioId(option)}
                    placeholder="Todos"
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                  />
                </div>
              </div>
            </div>

            {/* TABELA */}
            <div className={styles.tabelaWrapper}>
              <div className={`${styles.tituloLista} ${styles.gridOrdens}`}>
                <span>#</span>
                <span>Data</span>
                <span>Fornecedor</span>
                <span>Responsável</span>
                <span>Itens</span>
                <span>Total</span>
                <span>Status</span>
                <span></span>
              </div>

              <div className={styles.lista}>
                {carregando && (
                  <div className={styles.estadoVazio}>
                    <div className={styles.spinner} />
                    <p>Carregando ordens…</p>
                  </div>
                )}

                {!carregando && listaOrdem.length === 0 && (
                  <div className={styles.estadoVazio}>
                    <Package size={36} className={styles.iconeVazio} />
                    <p>Nenhuma ordem encontrada</p>
                    <span>Tente ajustar os filtros</span>
                  </div>
                )}
                {!carregando &&
                  listaOrdem.map((ordem) => {
                    const meta = STATUS_META[ordem.status] || STATUS_META["Pendente"];
                    const Icone = meta.icone;
                    return (
                      <div key={ordem.id} className={`${styles.itemRow} ${styles.gridOrdens}`}>
                        <span className={styles.ordemId}>#{ordem.id}</span>
                        <span className={styles.cellData}>
                          <CalendarBlank size={13} />
                          {dataHoraFormatada(ordem.data)}
                        </span>
                        <span className={styles.cellFornecedor}>
                          <Building size={13} />
                          {ordem.fornecedor.nome}
                        </span>
                        <span className={styles.cellUsuario}>
                          <User size={13} />
                          {ordem.usuario.nome}
                        </span>
                        <span className={styles.cellItens}>{ordem.itens.length} item(s)</span>
                        <span className={styles.cellTotal}>{formatarMoeda(ordem.total)}</span>
                        <span>
                          <span className={`${styles.badge} ${meta.cor}`}>
                            <Icone size={11} weight="bold" />
                            {ordem.status}
                          </span>
                        </span>
                        <div className={styles.acoesRow}>
                          <button
                            className={styles.btnIcone}
                            title="Editar status"
                            onClick={() => {
                              setOrdemSelecionada(ordem);
                              setView("editarOrdem");
                            }}
                          >
                            <EyeIcon size={15} weight="bold" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
        </div>
    )
}
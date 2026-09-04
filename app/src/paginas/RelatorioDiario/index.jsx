import { useState, useEffect, useCallback } from "react";
import {
  ChartLineUp,
  CalendarBlank,
  ArrowClockwise,
  Storefront,
  Truck,
  MapTrifold,
  CurrencyDollar,
  ShoppingCartSimple,
  Receipt,
  Buildings,
  Money,
  CreditCard,
  QrCode,
  PackageIcon,
  CheckCircle,
  XCircle,
  ClockIcon,
  WarningCircle,
  TrayIcon,
} from "@phosphor-icons/react";
import { PieChart, Pie, Cell } from "recharts";
import { BuscarRelatorioDiario } from "../../operadores/API/relatorioDiario/buscarRelatorioDiario.js";
import styles from "./styles.module.css";
import Cabecalho from "../../componentes/Cabecalho/index.jsx";
import { formatarMoeda } from "../../utils/formartarMoeda.js";

// Helpers

const formatarNumero = (valor = 0) => valor.toLocaleString("pt-BR");

const formatarPercentual = (valor = 0) =>
  `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

const hojeInput = () => new Date().toISOString().slice(0, 10);

const formatarDataHora = (isoString) => {
  if (!isoString) return "--";
  return new Date(isoString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ICONE_PAGAMENTO = {
  "A VISTA": Money,
  CARTÃO: CreditCard,
  PIX: QrCode,
};

const CORES_SETOR = {
  balcao: "var(--orange)",
  delivery: "var(--blue)",
  externo: "var(--purple)",
};

// Subcomponentes

function StatCard({ icon: Icon, valor, label, cor }) {
  return (
    <div className={`${styles.statCard} ${styles.fadeUp}`}>
      <div className={`${styles.statIconWrapper} ${styles[`statIcon${cor}`]}`}>
        <Icon size={22} weight="fill" />
      </div>
      <div className={styles.statTextos}>
        <span className={styles.statValue}>{valor}</span>
        <span className={styles.statLabel}>{label}</span>
      </div>
    </div>
  );
}

function BarraProgresso({ nome, valor, percentual, cor, Icon }) {
  return (
    <div className={styles.progressItem}>
      <div className={styles.progressTopo}>
        <span className={styles.progressNome}>
          {Icon && <Icon size={14} weight="bold" />}
          {nome}
        </span>
        <span className={styles.progressValores}>
          <span className={styles.progressPercent}>
            {formatarPercentual(percentual)}
          </span>
          <span className={styles.progressAbsoluto}>
            {formatarMoeda(valor)}
          </span>
        </span>
      </div>
      <div className={styles.progressBarTrack}>
        <div
          className={styles.progressBarFill}
          style={{ width: `${percentual}%`, background: cor }}
        />
      </div>
    </div>
  );
}

function MiniBarraProgresso({ nome, percentual, cor }) {
  return (
    <div className={styles.miniProgressItem}>
      <div className={styles.miniProgressTopo}>
        <span>{nome}</span>
        <span>{formatarPercentual(percentual)}</span>
      </div>
      <div className={styles.miniProgressTrack}>
        <div
          className={styles.miniProgressFill}
          style={{ width: `${percentual}%`, background: cor }}
        />
      </div>
    </div>
  );
}

function EstadoVazioSetor({ texto }) {
  return (
    <div className={styles.estadoVazioSetor}>
      <TrayIcon size={30} className={styles.iconeVazio} weight="light" />
      <p>Sem movimento</p>
      <span>{texto}</span>
    </div>
  );
}

// Componente principal.

export default function RelatorioVendas() {
  const [dataInicio, setDataInicio] = useState(hojeInput());
  const [dataFim, setDataFim] = useState(hojeInput());
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const buscarDados = useCallback(async (inicio, fim) => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await BuscarRelatorioDiario({
        dataInicio: inicio,
        dataFim: fim,
      });

      setDados(resposta);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarDados(dataInicio, dataFim);
  }, []);

  const handleFiltrar = (e) => {
    e.preventDefault();
    buscarDados(dataInicio, dataFim);
  };

  const handleHoje = () => setDataFim(hojeInput());

  const dadosDonut = dados
    ? [
        {
          nome: "Balcão",
          valor: dados.geral.participacaoSetores.balcao,
          cor: CORES_SETOR.balcao,
        },
        {
          nome: "Delivery",
          valor: dados.geral.participacaoSetores.delivery,
          cor: CORES_SETOR.delivery,
        },
        {
          nome: "Externo",
          valor: dados.geral.participacaoSetores.externo,
          cor: CORES_SETOR.externo,
        },
      ].filter((s) => s.valor > 0)
    : [];

  return (
    <div className={styles.container}>
      <Cabecalho />
      <main className={styles.principal}>
        {/* Cabeçalho */}
        <div className={styles.cabecalhoPage}>
          <div className={styles.tituloSection}>
            <div className={styles.iconeWrapper}>
              <ChartLineUp size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Análise diária</p>
              <h1 className={styles.pageTitulo}>Relatório de Vendas</h1>
            </div>
          </div>
          {dados && (
            <div className={styles.atualizadoEm}>
              <ClockIcon size={14} />
              Atualizado em{" "}
              <strong>{formatarDataHora(dados.atualizadoEm)}</strong>
            </div>
          )}
        </div>

        {/* Filtros */}
        <form className={styles.painelFiltros} onSubmit={handleFiltrar}>
          <div className={styles.filtrosHeader}>
            <CalendarBlank
              size={14}
              className={styles.filtroIcone}
              weight="bold"
            />
            Período de análise
          </div>
          <div className={styles.filtrosGrid}>
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>Data início</label>
              <input
                type="date"
                className={styles.calendario}
                value={dataInicio}
                max={dataFim}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className={styles.filtroGrupo}>
              <label className={styles.filtroLabel}>Data fim</label>
              <div className={styles.dataFimGroup}>
                <input
                  type="date"
                  className={styles.calendario}
                  value={dataFim}
                  min={dataInicio}
                  onChange={(e) => setDataFim(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.botaoHoje}
                  onClick={handleHoje}
                >
                  Hoje
                </button>
              </div>
            </div>
            <div className={styles.filtroGrupo}>
              <button
                type="submit"
                className={styles.botaoPrincipal}
                disabled={carregando}
              >
                {carregando ? (
                  <ArrowClockwise
                    size={16}
                    weight="bold"
                    className={styles.spinnerIcon}
                  />
                ) : (
                  <ChartLineUp size={16} weight="bold" />
                )}
                {carregando ? "Buscando..." : "Filtrar"}
              </button>
            </div>
          </div>
        </form>

        {erro && (
          <div className={styles.erroBox}>
            <WarningCircle size={18} weight="fill" />
            {erro}
          </div>
        )}

        {/* Skeleton de carregamento */}
        {carregando && !dados && (
          <>
            <div className={styles.statsGrid}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`${styles.skeleton} ${styles.skeletonStatCard}`}
                />
              ))}
            </div>
            <div className={styles.linhaDupla}>
              <div className={`${styles.skeleton} ${styles.skeletonCard}`} />
              <div className={`${styles.skeleton} ${styles.skeletonCard}`} />
            </div>
            <div className={styles.setoresGrid}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`${styles.skeleton} ${styles.skeletonCard}`}
                />
              ))}
            </div>
          </>
        )}

        {dados && (
          <>
            {/* Cards de resumo geral */}
            <div className={styles.statsGrid}>
              <StatCard
                icon={CurrencyDollar}
                cor="Laranja"
                valor={formatarMoeda(dados.geral.totalVendas)}
                label="Faturamento total"
              />
              <StatCard
                icon={ShoppingCartSimple}
                cor="Azul"
                valor={formatarNumero(dados.geral.quantidadePedidos)}
                label="Pedidos"
              />
              <StatCard
                icon={Receipt}
                cor="Verde"
                valor={formatarMoeda(dados.geral.ticketMedio)}
                label="Ticket médio"
              />
              <StatCard
                icon={Buildings}
                cor="Roxo"
                valor={dados.resumo.setores}
                label="Setores ativos"
              />
            </div>

            {/* Participação por setor + Formas de pagamento */}
            <div className={styles.linhaDupla}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderTitle}>
                    <Storefront
                      size={16}
                      className={styles.cardHeaderIcon}
                      weight="fill"
                    />
                    <h2>Participação por setor</h2>
                  </div>
                </div>

                {dadosDonut.length > 0 ? (
                  <div className={styles.donutWrapper}>
                    <PieChart width={140} height={140}>
                      <Pie
                        data={dadosDonut}
                        dataKey="valor"
                        nameKey="nome"
                        innerRadius={42}
                        outerRadius={65}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {dadosDonut.map((entrada) => (
                          <Cell key={entrada.nome} fill={entrada.cor} />
                        ))}
                      </Pie>
                    </PieChart>
                    <div className={styles.legendaSetores}>
                      {dadosDonut.map((entrada) => (
                        <div key={entrada.nome} className={styles.legendaItem}>
                          <span
                            className={styles.legendaDot}
                            style={{ background: entrada.cor }}
                          />
                          <span className={styles.legendaNome}>
                            {entrada.nome}
                          </span>
                          <span className={styles.legendaValor}>
                            {formatarPercentual(entrada.valor)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EstadoVazioSetor texto="Nenhum setor com vendas no período" />
                )}
              </div>

              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderTitle}>
                    <Money
                      size={16}
                      className={styles.cardHeaderIcon}
                      weight="fill"
                    />
                    <h2>Formas de pagamento (geral)</h2>
                  </div>
                </div>

                {dados.geral.formasPagamento.length > 0 ? (
                  <div className={styles.progressList}>
                    {dados.geral.formasPagamento.map((fp) => (
                      <BarraProgresso
                        key={fp.nome}
                        nome={fp.nome}
                        valor={fp.valor}
                        percentual={fp.percentual}
                        cor="var(--orange)"
                        Icon={ICONE_PAGAMENTO[fp.nome] || Money}
                      />
                    ))}
                  </div>
                ) : (
                  <EstadoVazioSetor texto="Nenhum pagamento registrado no período" />
                )}
              </div>
            </div>

            {/* Setores: Balcão / Delivery / Externo */}
            <div className={styles.setoresGrid}>
              {/* BALCÃO */}
              <div className={styles.setorCard}>
                <div className={styles.setorTopo}>
                  <div className={styles.setorTitulo}>
                    <div
                      className={`${styles.setorIconWrapper} ${styles.setorIconLaranja}`}
                    >
                      <Storefront size={18} weight="fill" />
                    </div>
                    <div>
                      <h3>Balcão</h3>
                      <p className={styles.setorSub}>
                        {dados.balcao.pedidos} pedido(s)
                      </p>
                    </div>
                  </div>
                  <span
                    className={`${styles.badge} ${dados.balcao.pedidos > 0 ? "" : styles.badgeCinza}`}
                  >
                    {dados.balcao.pedidos > 0 ? "Ativo" : "Sem movimento"}
                  </span>
                </div>

                <div className={styles.setorCorpo}>
                  {dados.balcao.pedidos > 0 ? (
                    <>
                      <div className={styles.setorStatsGrid}>
                        <div className={styles.setorStatItem}>
                          <span className={styles.setorStatValor}>
                            {formatarMoeda(dados.balcao.total)}
                          </span>
                          <span className={styles.setorStatLabel}>Total</span>
                        </div>
                        <div className={styles.setorStatItem}>
                          <span className={styles.setorStatValor}>
                            {formatarMoeda(dados.balcao.ticketMedio)}
                          </span>
                          <span className={styles.setorStatLabel}>
                            Ticket médio
                          </span>
                        </div>
                        <div className={styles.setorStatItem}>
                          <span className={styles.setorStatValor}>
                            {formatarNumero(dados.balcao.pedidos)}
                          </span>
                          <span className={styles.setorStatLabel}>Pedidos</span>
                        </div>
                        <div className={styles.setorStatItem}>
                          <span className={styles.setorStatValor}>
                            {formatarMoeda(dados.balcao.valeInterno)}
                          </span>
                          <span className={styles.setorStatLabel}>
                            Vale interno
                          </span>
                        </div>
                      </div>

                      {dados.balcao.formasPagamento.length > 0 && (
                        <div>
                          <p className={styles.setorBlocoTitulo}>
                            Formas de pagamento
                          </p>
                          <div className={styles.miniProgressList}>
                            {dados.balcao.formasPagamento.map((fp) => (
                              <MiniBarraProgresso
                                key={fp.nome}
                                nome={fp.nome}
                                percentual={fp.percentual}
                                cor="var(--orange)"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {dados.balcao.vendedores.length > 0 && (
                        <div>
                          <p className={styles.setorBlocoTitulo}>Vendedores</p>
                          <div className={styles.tabelaWrapper}>
                            <div className={styles.tituloLista}>
                              <span>Nome</span>
                              <span>Pedidos</span>
                              <span style={{ textAlign: "right" }}>Total</span>
                            </div>
                            <div className={styles.lista}>
                              {dados.balcao.vendedores.map((v) => (
                                <div key={v.nome} className={styles.itemRow}>
                                  <span className={styles.itemRowNome}>
                                    {v.nome}
                                  </span>
                                  <span>{v.pedidos}</span>
                                  <span className={styles.itemRowValor}>
                                    {formatarMoeda(v.total)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <EstadoVazioSetor texto="Nenhuma venda de balcão no período" />
                  )}
                </div>
              </div>

              {/* DELIVERY */}
              <div className={styles.setorCard}>
                <div className={styles.setorTopo}>
                  <div className={styles.setorTitulo}>
                    <div
                      className={`${styles.setorIconWrapper} ${styles.setorIconAzul}`}
                    >
                      <Truck size={18} weight="fill" />
                    </div>
                    <div>
                      <h3>Delivery</h3>
                      <p className={styles.setorSub}>
                        {dados.delivery.pedidos} pedido(s)
                      </p>
                    </div>
                  </div>
                  <span
                    className={`${styles.badge} ${dados.delivery.pedidos > 0 ? styles.badgeAzul : styles.badgeCinza}`}
                  >
                    {dados.delivery.pedidos > 0 ? "Ativo" : "Sem movimento"}
                  </span>
                </div>

                <div className={styles.setorCorpo}>
                  {dados.delivery.pedidos > 0 ? (
                    <>
                      <div className={styles.setorStatsGrid}>
                        <div className={styles.setorStatItem}>
                          <span className={styles.setorStatValor}>
                            {formatarMoeda(dados.delivery.total)}
                          </span>
                          <span className={styles.setorStatLabel}>Total</span>
                        </div>
                        <div className={styles.setorStatItem}>
                          <span className={styles.setorStatValor}>
                            {formatarMoeda(dados.delivery.ticketMedio)}
                          </span>
                          <span className={styles.setorStatLabel}>
                            Ticket médio
                          </span>
                        </div>
                        <div className={styles.setorStatItem}>
                          <span className={styles.setorStatValor}>
                            {dados.delivery.tempoEntrega}min
                          </span>
                          <span className={styles.setorStatLabel}>
                            Tempo entrega
                          </span>
                        </div>
                        <div className={styles.setorStatItem}>
                          <span className={styles.setorStatValor}>
                            {dados.delivery.tempoCarregamento}min
                          </span>
                          <span className={styles.setorStatLabel}>
                            Tempo carreg.
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className={styles.setorBlocoTitulo}>
                          Status dos pedidos
                        </p>
                        <div className={styles.statusGrid}>
                          <div className={styles.statusChip}>
                            <PackageIcon
                              size={16}
                              className={styles.filtroIcone}
                            />
                            <span className={styles.statusChipValor}>
                              {dados.delivery.status.pendentes}
                            </span>
                            <span className={styles.statusChipLabel}>
                              Pendentes
                            </span>
                          </div>
                          <div className={styles.statusChip}>
                            <Truck size={16} />
                            <span className={styles.statusChipValor}>
                              {dados.delivery.status.carregados}
                            </span>
                            <span className={styles.statusChipLabel}>
                              Carregados
                            </span>
                          </div>
                          <div className={styles.statusChip}>
                            <CheckCircle
                              size={16}
                              weight="fill"
                              style={{ color: "var(--green)" }}
                            />
                            <span className={styles.statusChipValor}>
                              {dados.delivery.status.entregues}
                            </span>
                            <span className={styles.statusChipLabel}>
                              Entregues
                            </span>
                          </div>
                          <div className={styles.statusChip}>
                            <XCircle
                              size={16}
                              weight="fill"
                              style={{ color: "var(--red)" }}
                            />
                            <span className={styles.statusChipValor}>
                              {dados.delivery.status.cancelados}
                            </span>
                            <span className={styles.statusChipLabel}>
                              Cancelados
                            </span>
                          </div>
                        </div>
                      </div>

                      {dados.delivery.formasPagamento.length > 0 && (
                        <div>
                          <p className={styles.setorBlocoTitulo}>
                            Formas de pagamento
                          </p>
                          <div className={styles.miniProgressList}>
                            {dados.delivery.formasPagamento.map((fp) => (
                              <MiniBarraProgresso
                                key={fp.nome}
                                nome={fp.nome}
                                percentual={fp.percentual}
                                cor="var(--blue)"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <EstadoVazioSetor texto="Nenhuma venda de delivery no período" />
                  )}
                </div>
              </div>

              {/* EXTERNO */}
              <div className={styles.setorCard}>
                <div className={styles.setorTopo}>
                  <div className={styles.setorTitulo}>
                    <div
                      className={`${styles.setorIconWrapper} ${styles.setorIconRoxo}`}
                    >
                      <MapTrifold size={18} weight="fill" />
                    </div>
                    <div>
                      <h3>Externo</h3>
                      <p className={styles.setorSub}>
                        {dados.externo.pedidos} pedido(s)
                      </p>
                    </div>
                  </div>
                  <span
                    className={`${styles.badge} ${dados.externo.pedidos > 0 ? styles.badgeRoxo : styles.badgeCinza}`}
                  >
                    {dados.externo.pedidos > 0 ? "Ativo" : "Sem movimento"}
                  </span>
                </div>

                <div className={styles.setorCorpo}>
                  {dados.externo.pedidos > 0 ? (
                    <>
                      <div className={styles.setorStatsGrid}>
                        <div className={styles.setorStatItem}>
                          <span className={styles.setorStatValor}>
                            {formatarMoeda(dados.externo.total)}
                          </span>
                          <span className={styles.setorStatLabel}>Total</span>
                        </div>
                        <div className={styles.setorStatItem}>
                          <span className={styles.setorStatValor}>
                            {formatarMoeda(dados.externo.ticketMedio)}
                          </span>
                          <span className={styles.setorStatLabel}>
                            Ticket médio
                          </span>
                        </div>
                      </div>

                      {dados.externo.vendedores.length > 0 && (
                        <div>
                          <p className={styles.setorBlocoTitulo}>Vendedores</p>
                          <div className={styles.tabelaWrapper}>
                            <div className={styles.tituloLista}>
                              <span>Nome</span>
                              <span>Pedidos</span>
                              <span style={{ textAlign: "right" }}>Total</span>
                            </div>
                            <div className={styles.lista}>
                              {dados.externo.vendedores.map((v) => (
                                <div key={v.nome} className={styles.itemRow}>
                                  <span className={styles.itemRowNome}>
                                    {v.nome}
                                  </span>
                                  <span>{v.pedidos}</span>
                                  <span className={styles.itemRowValor}>
                                    {formatarMoeda(v.total)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <EstadoVazioSetor texto="Nenhuma venda externa no período" />
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import { dataFormatada, dataFormatadaCalendario } from "../../utils/data";
import {
  HandCoinsIcon,
  CalculatorIcon,
  ArchiveIcon,
  TruckIcon,
  StorefrontIcon,
  PackageIcon,
  ArrowLeft,
} from "@phosphor-icons/react";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";
import { usarToast } from "../../componentes/Context/toastContext";
import { buscarFechamentoFinalizado } from "../../operadores/API/fechamento/buscarFechamentoFinalizado";
import { LerUsuario } from "../../operadores/API/usuario/LerUsuario";
import { lerCargas } from "../../operadores/API/carga/lerCargas";

// Ordem de exibição da contagem de cédulas
const CEDULAS = [
  { chave: "nota200", label: "R$ 200" },
  { chave: "nota100", label: "R$ 100" },
  { chave: "nota50", label: "R$ 50" },
  { chave: "nota20", label: "R$ 20" },
  { chave: "nota10", label: "R$ 10" },
  { chave: "nota5", label: "R$ 5" },
  { chave: "nota2", label: "R$ 2" },
];

// Define a variante de cor do badge de status
function classeBadgeStatus(status) {
  const valor = (status || "").toLowerCase();
  if (valor.includes("fech")) return styles.badgeVerde;
  if (valor.includes("abert")) return styles.badgeLaranja;
  return styles.badgeCinza;
}

function formatarMoeda(valor) {
  const numero = Number(valor) || 0;
  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Card de um setor (Delivery, Balcão 1, Balcão 2)
function CardFechamento({ titulo, fechamento, carregando }) {
  if (carregando) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderTitle}>
            <h2>{titulo}</h2>
          </div>
        </div>
        <div className={styles.skeletonGrupo}>
          <div className={`${styles.skeleton} ${styles.skeletonLinha}`} />
          <div className={`${styles.skeleton} ${styles.skeletonLinha}`} />
          <div className={`${styles.skeleton} ${styles.skeletonBloco}`} />
        </div>
      </div>
    );
  }

  if (!fechamento) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderTitle}>
            <h2>{titulo}</h2>
          </div>
        </div>
        <div className={styles.estadoVazio}>
          <ArchiveIcon size={32} className={styles.iconeVazio} />
          <p>Nenhum fechamento encontrado</p>
          <span>Não há registro para esta data neste setor</span>
        </div>
      </div>
    );
  }

  const diferenca = Number(fechamento.diferenca) || 0;
  const classeDiferenca =
    diferenca === 0
      ? styles.textoVerde
      : diferenca > 0
        ? styles.textoAzul
        : styles.textoVermelho;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderTitle}>
          <h2>{titulo}</h2>
        </div>
        <span
          className={`${styles.badge} ${classeBadgeStatus(fechamento.status)}`}
        >
          {fechamento.status}
        </span>
      </div>

      <div className={styles.infoLinha}>
        <span className={styles.infoLabel}>
          {fechamento.setor === "carga" ? "Identificação" : "Vendedor"}
        </span>
        <span className={styles.infoValor}>{fechamento.vendedor}</span>
      </div>
      <div className={styles.infoLinha}>
        <span className={styles.infoLabel}>Data</span>
        <span className={styles.infoValor}>
          {dataFormatada(fechamento.data)}
        </span>
      </div>

      <div className={styles.valoresGrid}>
        <div className={styles.valorBox}>
          <span className={styles.valorLabel}>Total no sistema</span>
          <span className={styles.valorNumero}>
            {formatarMoeda(fechamento.totalSistema)}
          </span>
        </div>
        <div className={styles.valorBox}>
          <span className={styles.valorLabel}>Total contabilizado</span>
          <span className={styles.valorNumero}>
            {formatarMoeda(fechamento.totalInformado)}
          </span>
        </div>
        <div className={`${styles.valorBox} ${styles.valorBoxDestaque}`}>
          <span className={styles.valorLabel}>Diferença</span>
          <span className={`${styles.valorNumero} ${classeDiferenca}`}>
            {formatarMoeda(diferenca)}
          </span>
        </div>
      </div>

      <div className={styles.cedulasSection}>
        <p className={styles.cedulasTitulo}>
          <CalculatorIcon size={14} weight="bold" />
          Contagem de cédulas
        </p>
        <div className={styles.cedulasGrid}>
          {CEDULAS.map(({ chave, label }) => (
            <div key={chave} className={styles.cedulaItem}>
              <span className={styles.cedulaLabel}>{label}</span>
              <span className={styles.cedulaValor}>
                {fechamento[chave] ?? 0}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FechamentoFinalizado() {
  const navegar = useNavigate();
  const [carregando, setCarregando] = useState(false);

  const [fechamentoDelivery, setFechamentoDelivery] = useState(null);
  const [fechamentoBalcao1, setFechamentoBalcao1] = useState(null);
  const [fechamentoBalcao2, setFechamentoBalcao2] = useState(null);
  const [fechamentosExternos, setFechamentosExternos] = useState([]);
  const [vendedoresExternos, setVendedoresExternos] = useState([]);
  const [cargasProcessadas, setCargasProcessadas] = useState([]);

  // setando o dia atual já no estado.
  const [dataAtual, setDataAtual] = useState(dataFormatadaCalendario());

  // Pega o valor de data selecionado no input
  const tratarAlteracao = (e) => setDataAtual(e.target.value);

  // Função que seta o dia atual pelo botão HOJE
  const setarHoje = () => setDataAtual(dataFormatadaCalendario());

  // Hooks
  const { mensagem, setMensagem } = usarToast();

  // Busca fechamento de venda do dia escolhido de cada setor
  useEffect(() => {
    let ativo = true;
    setCarregando(true);

    const buscarVendasDia = async () => {
      try {
        const [
          dadosDelivery,
          dadosBalcao1,
          dadosBalcao2,
          dadosExternos,
          usuariosCadastrados,
          dadosCargasFechadas,
          cargasCadastradas,
        ] = await Promise.all([
          buscarFechamentoFinalizado("delivery", "delivery", dataAtual),
          buscarFechamentoFinalizado("balcao", "b1", dataAtual),
          buscarFechamentoFinalizado("balcao", "b2", dataAtual),
          buscarFechamentoFinalizado("externo", undefined, dataAtual).catch(
            (e) => {
              console.warn("Erro ao buscar fechamentos externos:", e);
              return [];
            }
          ),
          LerUsuario().catch((e) => {
            console.warn("Erro ao buscar usuários para rotas:", e);
            return [];
          }),
          buscarFechamentoFinalizado("carga", undefined, dataAtual).catch(
            (e) => {
              console.warn("Erro ao buscar fechamentos de cargas:", e);
              return [];
            }
          ),
          lerCargas().catch((e) => {
            console.warn("Erro ao buscar lista de cargas:", e);
            return [];
          }),
        ]);

        if (!ativo) return;

        setFechamentoDelivery(dadosDelivery);
        setFechamentoBalcao1(dadosBalcao1);
        setFechamentoBalcao2(dadosBalcao2);

        // 1. Processa os fechamentos externos retornados pela API
        const listaFechamentos = Array.isArray(dadosExternos)
          ? dadosExternos
          : dadosExternos
            ? [dadosExternos]
            : [];
        setFechamentosExternos(listaFechamentos);

        // Identifica vendedores externos a partir dos usuários cadastrados
        let listaNomesExternos = [];
        if (Array.isArray(usuariosCadastrados) && usuariosCadastrados.length > 0) {
          const filtrados = usuariosCadastrados.filter(
            (u) =>
              (u.nivelAcesso || "").toUpperCase() === "EXTERNO" ||
              (u.nome || "").toUpperCase().includes("EMERSON")
          );
          listaNomesExternos = filtrados
            .map((u) => (u.nome || "").toUpperCase().trim())
            .filter(Boolean);
        }

        // Se não encontrou vendedores com tag EXTERNO, garante ao menos o padrão EMERSON
        if (listaNomesExternos.length === 0) {
          listaNomesExternos.push("EMERSON");
        }

        // Garante que qualquer vendedor que tenha efetuado fechamento na data também apareça
        listaFechamentos.forEach((f) => {
          const nomeVend = (f.vendedor || "").toUpperCase().trim();
          if (nomeVend && !listaNomesExternos.includes(nomeVend)) {
            listaNomesExternos.push(nomeVend);
          }
        });

        setVendedoresExternos(listaNomesExternos);

        // 2. Processa Fechamentos de Cargas
        const listaFechamentosCargas = Array.isArray(dadosCargasFechadas)
          ? dadosCargasFechadas
          : dadosCargasFechadas
            ? [dadosCargasFechadas]
            : [];

        // Filtra cargas cadastradas que foram finalizadas na data selecionada
        const cargasFinalizadasDia = (
          Array.isArray(cargasCadastradas) ? cargasCadastradas : []
        ).filter((c) => {
          if ((c.status || "").toLowerCase() !== "finalizada") return false;
          try {
            const dataC = c.data
              ? dataFormatadaCalendario(new Date(c.data))
              : "";
            return dataC === dataAtual;
          } catch {
            return false;
          }
        });

        // Unifica os fechamentos de carga garantindo o padrão: Carga #${carga.id} — ${veiculo} - ${motorista}
        const mapaCargas = new Map();

        // 2.1 Adiciona as cargas finalizadas encontradas via lerCargas()
        cargasFinalizadasDia.forEach((c) => {
          const veiculoNome =
            c.veiculo?.nome || c.veiculo?.modelo || "Veículo";
          const motoristaNome = c.motorista?.nome || "Motorista";
          const titulo = `Carga #${c.id} — ${veiculoNome} - ${motoristaNome}`;

          // Localiza fechamento persistido correspondente ao ID da carga
          const f = listaFechamentosCargas.find(
            (fc) =>
              (fc.vendedor || "").includes(`Carga #${c.id}`) ||
              (fc.vendedor || "").includes(`CARGA #${c.id}`)
          );

          mapaCargas.set(c.id, {
            id: c.id,
            titulo,
            fechamento: f || null,
          });
        });

        // 2.2 Adiciona qualquer fechamento persistido do setor 'carga' que ainda não esteja no mapa
        listaFechamentosCargas.forEach((fc) => {
          const matchId = (fc.vendedor || "").match(/Carga\s*#(\d+)/i);
          const cargaId = matchId ? Number(matchId[1]) : fc.id;

          if (!mapaCargas.has(cargaId)) {
            mapaCargas.set(cargaId, {
              id: cargaId,
              titulo: fc.vendedor || `Carga #${cargaId}`,
              fechamento: fc,
            });
          } else {
            const item = mapaCargas.get(cargaId);
            if (!item.fechamento) {
              item.fechamento = fc;
            }
          }
        });

        setCargasProcessadas(Array.from(mapaCargas.values()));
      } catch (erro) {
        if (!ativo) return;
        console.log(erro.message);
        setMensagem(erro.message);
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    buscarVendasDia();
    return () => {
      ativo = false;
    };
  }, [dataAtual]);

  return (
    <div className={styles.container}>
      <ToastRadix mensagem={mensagem} />
      <Cabecalho />
      <main className={styles.main}>
        {/* CABEÇALHO */}
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <div className={styles.iconeWrapper}>
              <HandCoinsIcon size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Gestão financeira</p>
              <h1 className={styles.pageTitulo}>
                Fechamento de Caixa Finalizado
              </h1>
            </div>
          </div>

          {/* AÇÕES: DATA + BOTÃO VOLTAR */}
          <div className={styles.headerAcoes}>
            <div className={styles.containerData}>
              <input
                className={styles.calendario}
                type="date"
                value={dataAtual}
                onChange={tratarAlteracao}
              />
              <button className={styles.botaoHoje} onClick={setarHoje}>
                Hoje
              </button>
            </div>

            <button
              type="button"
              className={styles.botaoVoltar}
              onClick={() => navegar("/gestao")}
              title="Voltar para a tela de Gestão"
            >
              <ArrowLeft size={16} weight="bold" />
              Voltar
            </button>
          </div>
        </div>

        {/* SEÇÃO 1: CAIXAS INTERNOS (BALCÃO E DELIVERY) */}
        <section className={styles.secaoBloco}>
          <div className={styles.secaoHeader}>
            <div className={styles.secaoHeaderLeft}>
              <StorefrontIcon size={20} weight="bold" />
              <h2>Balcão e Delivery</h2>
            </div>
            <span className={styles.secaoTag}>3 caixas</span>
          </div>

          <div className={styles.cardsGrid}>
            <CardFechamento
              titulo="Delivery"
              fechamento={fechamentoDelivery}
              carregando={carregando}
            />

            <CardFechamento
              titulo="Balcão 1"
              fechamento={fechamentoBalcao1}
              carregando={carregando}
            />

            <CardFechamento
              titulo="Balcão 2"
              fechamento={fechamentoBalcao2}
              carregando={carregando}
            />
          </div>
        </section>

        {/* SEÇÃO 2: VENDEDORES EXTERNOS (ROTAS) */}
        <section className={styles.secaoBloco}>
          <div className={styles.secaoHeader}>
            <div className={styles.secaoHeaderLeft}>
              <TruckIcon size={20} weight="bold" />
              <h2>Vendedores Externos (Rotas)</h2>
            </div>
            <span className={styles.secaoTag}>
              {vendedoresExternos.length} vendedor(es)
            </span>
          </div>

          <div className={styles.cardsGridExternos}>
            {vendedoresExternos.map((nomeVendedor) => {
              const fechamentoVend = fechamentosExternos.find(
                (f) => (f.vendedor || "").toUpperCase() === nomeVendedor
              );
              return (
                <CardFechamento
                  key={nomeVendedor}
                  titulo={`Rota — ${nomeVendedor}`}
                  fechamento={fechamentoVend}
                  carregando={carregando}
                />
              );
            })}
          </div>
        </section>

        {/* SEÇÃO 3: FECHAMENTOS DE CARGAS */}
        <section className={styles.secaoBloco}>
          <div className={styles.secaoHeader}>
            <div className={styles.secaoHeaderLeft}>
              <PackageIcon size={20} weight="bold" />
              <h2>Fechamentos de Cargas</h2>
            </div>
            <span className={styles.secaoTag}>
              {cargasProcessadas.length} carga(s)
            </span>
          </div>

          <div className={styles.cardsGridExternos}>
            {cargasProcessadas.length > 0 ? (
              cargasProcessadas.map((item) => (
                <CardFechamento
                  key={item.id}
                  titulo={item.titulo}
                  fechamento={item.fechamento}
                  carregando={carregando}
                />
              ))
            ) : (
              <div className={styles.cardAvisoVazio}>
                <ArchiveIcon size={32} className={styles.iconeVazio} />
                <p>Nenhum fechamento de carga finalizado nesta data</p>
                <span>
                  As cargas finalizadas neste dia aparecerão listadas aqui
                </span>
              </div>
            )}
          </div>
        </section>
      </main>
      <Rodape />
    </div>
  );
}

import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import { formatarMoeda } from "../../utils/formartarMoeda";
import { dataHoraFormatada } from "../../utils/data";
import { buscarPedido } from "../../operadores/API/pedido/buscarPedido";
import { lerPendencias } from "../../operadores/API/pendencia/lerPendencias";
import { LerClienteDelivery } from "../../operadores/API/cliente/lerClienteDelivery";
import { LerClienteExterno } from "../../operadores/API/cliente/lerClienteExterno";
import { useProdutos } from "../../hooks/useProdutos";
import { usarToast } from "../../componentes/Context/toastContext";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

import {
  ArrowLeft,
  Calendar,
  CurrencyDollar,
  Receipt,
  TrendUp,
  ClockAfternoon,
  FilePdf,
  ArrowsClockwise,
  User,
  MapPin,
  Phone,
  IdentificationCard,
  MagnifyingGlass,
  CheckCircle,
  WarningCircle,
  ChartBar,
  ArrowsLeftRight,
  Package,
  Barcode,
} from "@phosphor-icons/react";

const MESES_NOMES = [
  { num: 1, sigla: "Jan", nome: "Janeiro" },
  { num: 2, sigla: "Fev", nome: "Fevereiro" },
  { num: 3, sigla: "Mar", nome: "Março" },
  { num: 4, sigla: "Abr", nome: "Abril" },
  { num: 5, sigla: "Mai", nome: "Maio" },
  { num: 6, sigla: "Jun", nome: "Junho" },
  { num: 7, sigla: "Jul", nome: "Julho" },
  { num: 8, sigla: "Ago", nome: "Agosto" },
  { num: 9, sigla: "Set", nome: "Setembro" },
  { num: 10, sigla: "Out", nome: "Outubro" },
  { num: 11, sigla: "Nov", nome: "Novembro" },
  { num: 12, sigla: "Dez", nome: "Dezembro" },
];

export default function RelatorioCliente() {
  const { state } = useLocation();
  const navegar = useNavigate();
  const { mensagem, setMensagem } = usarToast();

  const anoAtual = new Date().getFullYear();
  const mesAtualNum = new Date().getMonth() + 1; // 1 a 12

  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);
  const [setorFiltro, setSetorFiltro] = useState("todos"); // 'todos' | 'delivery' | 'externo'
  const [clienteAtual, setClienteAtual] = useState(state?.cliente || null);

  const [pedidos, setPedidos] = useState([]);
  const [pendencias, setPendencias] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [gerandoPDF, setGerandoPDF] = useState(false);

  // Hook de catálogo de produtos para mapeamento confiável de nomes
  const { produtos } = useProdutos();

  // Mapeamento id -> nomeProduto
  const mapaCatalogoProdutos = useMemo(() => {
    const map = new Map();
    (produtos || []).forEach((p) => {
      map.set(Number(p.id), p.nome);
    });
    return map;
  }, [produtos]);

  // Função utilitária para obter o nome do produto com múltiplos fallbacks
  const obterNomeProduto = useCallback(
    (item) => {
      if (item?.nome && String(item.nome).trim()) return String(item.nome).trim();
      if (item?.nomeProduto && String(item.nomeProduto).trim())
        return String(item.nomeProduto).trim();
      if (item?.produto?.nome && String(item.produto.nome).trim())
        return String(item.produto.nome).trim();
      if (item?.descricao && String(item.descricao).trim())
        return String(item.descricao).trim();
      const id = item?.produtoId ?? item?.idProduto ?? item?.produto?.id;
      if (id && mapaCatalogoProdutos.has(Number(id))) {
        return mapaCatalogoProdutos.get(Number(id));
      }
      return "Produto";
    },
    [mapaCatalogoProdutos]
  );

  // Busca interna na lista de pedidos
  const [buscaPedido, setBuscaPedido] = useState("");

  // Busca interna na lista de produtos comprados
  const [buscaProdutoTexto, setBuscaProdutoTexto] = useState("");

  // Comparativo de meses selecionados via CALENDÁRIO MENSAL (input type="month")
  // Permite selecionar meses do ano anterior
  const mesBaseInicial =
    mesAtualNum === 1
      ? `${anoAtual - 1}-12`
      : `${anoAtual}-${String(mesAtualNum - 1).padStart(2, "0")}`;
  const mesCompInicial = `${anoAtual}-${String(mesAtualNum).padStart(2, "0")}`;

  const [mesAnoA, setMesAnoA] = useState(mesBaseInicial);
  const [mesAnoB, setMesAnoB] = useState(mesCompInicial);

  // Lista de clientes para pesquisa/troca
  const [listaClientes, setListaClientes] = useState([]);
  const [buscaClienteTexto, setBuscaClienteTexto] = useState("");
  const [modalTrocaClienteAberto, setModalTrocaClienteAberto] = useState(false);

  // Carrega lista de clientes para busca rápida caso queira trocar
  useEffect(() => {
    const carregarClientesGerais = async () => {
      try {
        const [cliDeliv, cliExt] = await Promise.allSettled([
          LerClienteDelivery(),
          LerClienteExterno(),
        ]);

        let combinados = [];
        if (cliDeliv.status === "fulfilled" && Array.isArray(cliDeliv.value)) {
          combinados = combinados.concat(
            cliDeliv.value.map((c) => ({ ...c, _setorOriginal: "delivery" }))
          );
        }
        if (cliExt.status === "fulfilled" && Array.isArray(cliExt.value)) {
          combinados = combinados.concat(
            cliExt.value.map((c) => ({ ...c, _setorOriginal: "externo" }))
          );
        }
        setListaClientes(combinados);
      } catch (err) {
        console.warn("Erro ao buscar lista de clientes para troca:", err);
      }
    };
    carregarClientesGerais();
  }, []);

  // Busca os pedidos e pendências do cliente selecionado
  const carregarDadosCliente = useCallback(async () => {
    if (!clienteAtual?.id && !clienteAtual?.nome) return;

    setCarregando(true);
    try {
      // Busca dados dos últimos 2 anos para permitir comparação com anos anteriores
      const anoMinimo = Math.min(anoSelecionado - 1, 2024);
      const dataInicio = `${anoMinimo}-01-01`;
      const dataFim = `${anoSelecionado}-12-31`;

      const idCliente = clienteAtual.id;
      const nomeCliente = (clienteAtual.nome || "").trim().toLowerCase();

      // Chamadas simultâneas
      const promessaPedidosDelivery = buscarPedido({
        setor: "delivery",
        dataInicio,
        dataFim,
        clienteId: idCliente,
      }).catch(() => []);

      const promessaPedidosExterno = buscarPedido({
        setor: "externo",
        dataInicio,
        dataFim,
        clienteId: idCliente,
      }).catch(() => []);

      const promessaPendencias = lerPendencias({
        clienteId: idCliente,
      }).catch(() => []);

      const [resDeliv, resExt, resPend] = await Promise.all([
        promessaPedidosDelivery,
        promessaPedidosExterno,
        promessaPendencias,
      ]);

      const listaDeliv = Array.isArray(resDeliv)
        ? resDeliv
        : Array.isArray(resDeliv?.resultado)
        ? resDeliv.resultado
        : [];
      const listaExt = Array.isArray(resExt)
        ? resExt
        : Array.isArray(resExt?.resultado)
        ? resExt.resultado
        : [];

      const todosPedidos = [...listaDeliv, ...listaExt];

      // Filtra estritamente pelo cliente atual (por ID ou nome correspondente)
      const pedidosDoCliente = todosPedidos.filter((p) => {
        const pClienteId = p.clienteId ?? p.cliente?.id ?? p.idCliente;
        if (idCliente && pClienteId) {
          return Number(pClienteId) === Number(idCliente);
        }
        const pNome = (p.cliente?.nome || p.nomeCliente || "").trim().toLowerCase();
        return pNome && pNome === nomeCliente;
      });

      // Ordena por data decrescente (mais recentes primeiro)
      pedidosDoCliente.sort((a, b) => {
        const timeA = new Date(a.data || a.createdAt || 0).getTime();
        const timeB = new Date(b.data || b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      setPedidos(pedidosDoCliente);
      setPendencias(Array.isArray(resPend) ? resPend : []);
    } catch (erro) {
      console.error("Erro ao carregar dados do relatório do cliente:", erro);
      setMensagem(erro.message || "Erro ao carregar relatório do cliente");
    } finally {
      setCarregando(false);
    }
  }, [clienteAtual, anoSelecionado, setMensagem]);

  useEffect(() => {
    carregarDadosCliente();
  }, [carregarDadosCliente]);

  // Pedidos do ano selecionado (para KPIs, gráfico do ano e resumo)
  const pedidosDoAno = useMemo(() => {
    return pedidos.filter((p) => {
      const d = new Date(p.data || p.createdAt);
      if (isNaN(d.getTime())) return true;
      return d.getFullYear() === Number(anoSelecionado);
    });
  }, [pedidos, anoSelecionado]);

  // Filtra por setor se selecionado
  const pedidosFiltradosPorSetor = useMemo(() => {
    if (setorFiltro === "todos") return pedidosDoAno;
    return pedidosDoAno.filter(
      (p) => String(p.setor || p.tipo || "").toLowerCase() === setorFiltro.toLowerCase()
    );
  }, [pedidosDoAno, setorFiltro]);

  // Filtra por busca textual (ID do pedido, valor, forma)
  const pedidosExibicao = useMemo(() => {
    if (!buscaPedido.trim()) return pedidosFiltradosPorSetor;
    const termo = buscaPedido.trim().toLowerCase();
    return pedidosFiltradosPorSetor.filter((p) => {
      const matchId = String(p.id || "").includes(termo);
      const matchForma = String(
        p.formaPagamento?.nome || p.formaPagamento || ""
      ).toLowerCase().includes(termo);
      const matchTotal = String(p.total || "").includes(termo);
      const matchStatus = String(p.status || "").toLowerCase().includes(termo);
      return matchId || matchForma || matchTotal || matchStatus;
    });
  }, [pedidosFiltradosPorSetor, buscaPedido]);

  // Cálculos de Resumo (KPIs)
  const metricasResumo = useMemo(() => {
    const pedidosValidos = pedidosFiltradosPorSetor.filter(
      (p) => String(p.status || "").toLowerCase() !== "cancelado"
    );

    const totalCompras = pedidosValidos.reduce(
      (acc, p) => acc + Number(p.total || p.valorTotal || 0),
      0
    );

    const totalPedidos = pedidosValidos.length;
    const ticketMedio = totalPedidos > 0 ? totalCompras / totalPedidos : 0;

    // Cálculo da média de dias em atraso
    const agora = new Date();
    const pendenciasComAtraso = pendencias.filter((p) => {
      if (Number(p.diasAtraso || 0) > 0) return true;
      if (p.dataVencimento && p.status !== "fechada") {
        const venc = new Date(p.dataVencimento);
        return venc < agora;
      }
      return false;
    });

    let mediaDiasAtraso = 0;
    if (pendenciasComAtraso.length > 0) {
      const somaDias = pendenciasComAtraso.reduce((acc, p) => {
        let dias = Number(p.diasAtraso || 0);
        if (!dias && p.dataVencimento) {
          const diffMs = agora.getTime() - new Date(p.dataVencimento).getTime();
          dias = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        }
        return acc + dias;
      }, 0);
      mediaDiasAtraso = Math.round(somaDias / pendenciasComAtraso.length);
    }

    return {
      totalCompras,
      totalPedidos,
      ticketMedio,
      mediaDiasAtraso,
      totalPendenciasAtraso: pendenciasComAtraso.length,
    };
  }, [pedidosFiltradosPorSetor, pendencias]);

  // RELATÓRIO DE PRODUTOS COMPRADOS PELO CLIENTE (Requisito 3)
  const produtosComprados = useMemo(() => {
    const mapa = new Map();

    pedidosFiltradosPorSetor.forEach((pedido) => {
      if (String(pedido.status || "").toLowerCase() === "cancelado") return;
      const itens = Array.isArray(pedido.itens) ? pedido.itens : [];

      itens.forEach((it) => {
        const nomeProd = obterNomeProduto(it);
        const qtd = Number(it.quantidade || 1);
        const totalItem = Number(
          it.valorTotal ??
            (Number(it.quantidade || 1) *
              Number(it.valorUnit || it.precoVenda || it.precoUndVenda || 0))
        );

        if (!mapa.has(nomeProd)) {
          mapa.set(nomeProd, {
            nome: nomeProd,
            quantidade: 0,
            total: 0,
            pedidosCount: 0,
          });
        }

        const atual = mapa.get(nomeProd);
        atual.quantidade += qtd;
        atual.total += totalItem;
        atual.pedidosCount += 1;
      });
    });

    const lista = Array.from(mapa.values()).map((p) => ({
      ...p,
      precoMedio: p.quantidade > 0 ? p.total / p.quantidade : 0,
    }));

    // Ordena decrescente por quantidade total comprada
    lista.sort((a, b) => b.quantidade - a.quantidade);
    return lista;
  }, [pedidosFiltradosPorSetor, obterNomeProduto]);

  // Produtos filtrados pela busca textual
  const produtosCompradosFiltrados = useMemo(() => {
    if (!buscaProdutoTexto.trim()) return produtosComprados;
    const termo = buscaProdutoTexto.trim().toLowerCase();
    return produtosComprados.filter((p) => p.nome.toLowerCase().includes(termo));
  }, [produtosComprados, buscaProdutoTexto]);

  // Cálculo da Positivação de SKU do cliente em relação à base de produtos (Requisito 1.1)
  const metricasSKU = useMemo(() => {
    if (!produtos || produtos.length === 0) {
      return {
        totalBase: 0,
        positivados: produtosComprados.length,
        porcentagem: 0,
      };
    }
    const ativos = produtos.filter(
      (p) => !p.status || String(p.status).toLowerCase() === "ativo"
    );
    const totalBase = ativos.length > 0 ? ativos.length : produtos.length;
    const positivados = produtosComprados.length;
    const porcentagem =
      totalBase > 0 ? Number(((positivados / totalBase) * 100).toFixed(1)) : 0;

    return {
      totalBase,
      positivados,
      porcentagem,
    };
  }, [produtos, produtosComprados]);

  // Dados para o Gráfico Mês a Mês (12 meses do ano selecionado)
  const dadosMeses = useMemo(() => {
    const meses = MESES_NOMES.map((m) => ({
      numero: m.num,
      nome: m.sigla,
      nomeCompleto: m.nome,
      total: 0,
      quantidade: 0,
      ticketMedio: 0,
    }));

    pedidosFiltradosPorSetor.forEach((p) => {
      if (String(p.status || "").toLowerCase() === "cancelado") return;
      const dataStr = p.data || p.createdAt;
      if (!dataStr) return;

      const d = new Date(dataStr);
      if (isNaN(d.getTime())) return;

      const mesNum = d.getMonth() + 1; // 1 a 12
      const targetMes = meses.find((item) => item.numero === mesNum);
      if (targetMes) {
        targetMes.total += Number(p.total || p.valorTotal || 0);
        targetMes.quantidade += 1;
      }
    });

    meses.forEach((m) => {
      m.ticketMedio = m.quantidade > 0 ? m.total / m.quantidade : 0;
    });

    return meses;
  }, [pedidosFiltradosPorSetor]);

  // Função auxiliar para extrair YYYY-MM
  const extrairAnoMes = (dataStr) => {
    if (!dataStr) return "";
    const d = new Date(dataStr);
    if (isNaN(d.getTime())) return "";
    const a = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${a}-${m}`;
  };

  const formatarRotuloMesAno = (anoMesStr) => {
    if (!anoMesStr) return "—";
    const [ano, mes] = anoMesStr.split("-").map(Number);
    const mesObj = MESES_NOMES.find((m) => m.num === mes);
    return `${mesObj ? mesObj.nome : mes} de ${ano}`;
  };

  // Cálculo dos dados de qualquer mês/ano escolhido no calendário (Requisito 2.2)
  const calcularDadosMesAno = useCallback(
    (anoMesStr) => {
      if (!anoMesStr) {
        return {
          nomeFormatado: "—",
          total: 0,
          quantidade: 0,
          ticketMedio: 0,
        };
      }

      // Busca em todo o histórico de pedidos do cliente (inclusive anos anteriores)
      const pedidosDoMes = pedidos.filter((p) => {
        if (String(p.status || "").toLowerCase() === "cancelado") return false;
        if (setorFiltro !== "todos") {
          const pSetor = String(p.setor || p.tipo || "").toLowerCase();
          if (pSetor !== setorFiltro.toLowerCase()) return false;
        }
        const pAnoMes = extrairAnoMes(p.data || p.createdAt);
        return pAnoMes === anoMesStr;
      });

      const total = pedidosDoMes.reduce(
        (acc, p) => acc + Number(p.total || p.valorTotal || 0),
        0
      );
      const quantidade = pedidosDoMes.length;
      const ticketMedio = quantidade > 0 ? total / quantidade : 0;

      return {
        anoMesStr,
        nomeFormatado: formatarRotuloMesAno(anoMesStr),
        total,
        quantidade,
        ticketMedio,
      };
    },
    [pedidos, setorFiltro]
  );

  // Comparativo Dinâmico Mês A vs Mês B
  const comparativoMeses = useMemo(() => {
    const dadosA = calcularDadosMesAno(mesAnoA);
    const dadosB = calcularDadosMesAno(mesAnoB);

    const diffValor = dadosB.total - dadosA.total;
    const diffQtd = dadosB.quantidade - dadosA.quantidade;
    const diffTicket = dadosB.ticketMedio - dadosA.ticketMedio;

    let percValor = 0;
    if (dadosA.total > 0) {
      percValor = Number(((diffValor / dadosA.total) * 100).toFixed(1));
    } else if (dadosB.total > 0) {
      percValor = 100;
    }

    return {
      mesA: dadosA,
      mesB: dadosB,
      diffValor,
      diffQtd,
      diffTicket,
      percValor,
    };
  }, [calcularDadosMesAno, mesAnoA, mesAnoB]);

  // Função para baixar PDF completo 1 a 1 com lista de produtos e totais (Requisito 2.1)
  const tratarBaixarPDF = async () => {
    if (!clienteAtual) {
      setMensagem("Selecione um cliente para gerar o relatório.");
      return;
    }

    setGerandoPDF(true);
    try {
      const payloadPDF = {
        cliente: {
          id: clienteAtual.id,
          nome: clienteAtual.nome,
          documento:
            clienteAtual.cpf || clienteAtual.cnpj || clienteAtual.documento || "",
          telefone: clienteAtual.telefone || "",
          endereco: clienteAtual.endereco || "",
          bairro: clienteAtual.bairro || "",
          cidade: clienteAtual.cidade || "",
          referencia: clienteAtual.referencia || clienteAtual.pontoReferencia || "",
          vendedor: clienteAtual.vendedor || "",
          setor:
            setorFiltro !== "todos"
              ? setorFiltro
              : clienteAtual._setorOriginal || "Geral",
        },
        ano: anoSelecionado,
        resumo: metricasResumo,
        pedidos: pedidosFiltradosPorSetor.map((p) => {
          const nomeClientePedido =
            (typeof p.cliente === "object" ? p.cliente?.nome : null) ||
            p.cliente ||
            p.nomeCliente ||
            clienteAtual.nome ||
            "Cliente";
          const docClientePedido =
            (typeof p.cliente === "object"
              ? p.cliente?.cpf || p.cliente?.cnpj || p.cliente?.documento
              : null) ||
            p.documento ||
            p.cpf ||
            p.cnpj ||
            clienteAtual.cpf ||
            clienteAtual.cnpj ||
            clienteAtual.documento ||
            "";
          const enderecoPedido =
            (typeof p.cliente === "object" ? p.cliente?.endereco : null) ||
            p.endereco ||
            clienteAtual.endereco ||
            "";
          const bairroPedido =
            (typeof p.cliente === "object" ? p.cliente?.bairro : null) ||
            p.bairro ||
            clienteAtual.bairro ||
            "";
          const cidadePedido =
            (typeof p.cliente === "object" ? p.cliente?.cidade : null) ||
            p.cidade ||
            clienteAtual.cidade ||
            "";
          const telefonePedido =
            (typeof p.cliente === "object" ? p.cliente?.telefone : null) ||
            p.telefone ||
            clienteAtual.telefone ||
            "";
          const referenciaPedido =
            (typeof p.cliente === "object" ? p.cliente?.referencia : null) ||
            p.referencia ||
            clienteAtual.referencia ||
            "";
          const vendedorPedido =
            p.vendedor ||
            p.nomeUsuario ||
            p.usuario?.nome ||
            clienteAtual.vendedor ||
            "Amigão Distribuidora";

          const listaItens = (Array.isArray(p.itens) ? p.itens : []).map((it) => {
            const nome = obterNomeProduto(it);
            const qtd = Number(it.quantidade || 1);
            const vUnit = Number(
              it.valorUnit || it.precoVenda || it.precoUndVenda || 0
            );
            const vTotal = Number(
              it.valorTotal ?? qtd * vUnit
            );
            return {
              nome,
              quantidade: qtd,
              valorUnit: vUnit,
              valorTotal: vTotal,
            };
          });

          const listaPagamentos = (Array.isArray(p.pagamentos) ? p.pagamentos : []).map(
            (pg) => ({
              id: pg.formaPagamento?.id || pg.idFormaPagamentoParcial || pg.id || "—",
              nome:
                pg.formaPagamento?.nome ||
                pg.nomeFormaPagamentoParcial ||
                pg.nome ||
                "Forma de Pagamento",
              valor: Number(
                pg.valor ?? pg.valorParcialFormaPagamento ?? 0
              ),
            })
          );

          return {
            id: p.id,
            data: p.data || p.createdAt,
            setor: p.setor || p.tipo || "balcao",
            vendedor: vendedorPedido,
            clienteNome: nomeClientePedido,
            clienteDoc: docClientePedido,
            endereco: enderecoPedido,
            bairro: bairroPedido,
            cidade: cidadePedido,
            telefone: telefonePedido,
            referencia: referenciaPedido,
            formaPagamento:
              p.formaPagamento?.nome ||
              p.formaPagamentoNome ||
              p.formaPagamento ||
              "A VISTA",
            pagamentos: listaPagamentos,
            status: p.status || "finalizado",
            total: Number(p.total || p.valorTotal || 0),
            itens: listaItens,
          };
        }),
      };

      if (window.PDF && window.PDF.gerarPDFRelatorioCliente) {
        const resposta = await window.PDF.gerarPDFRelatorioCliente(payloadPDF);
        setMensagem(resposta.mensagem || "Relatório em PDF gerado com sucesso!");
      } else {
        window.print();
      }
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      setMensagem(err.message || "Erro ao gerar PDF do relatório");
    } finally {
      setGerandoPDF(false);
    }
  };

  // Filtragem da lista de clientes para modal de troca
  const clientesFiltradosTroca = useMemo(() => {
    if (!buscaClienteTexto.trim()) return listaClientes.slice(0, 15);
    const termo = buscaClienteTexto.trim().toLowerCase();
    return listaClientes
      .filter((c) => {
        const matchNome = String(c.nome || "").toLowerCase().includes(termo);
        const matchDoc = String(c.cpf || c.cnpj || c.documento || "").includes(termo);
        const matchTel = String(c.telefone || "").includes(termo);
        return matchNome || matchDoc || matchTel;
      })
      .slice(0, 20);
  }, [listaClientes, buscaClienteTexto]);

  const tratarSelecionarCliente = (cli) => {
    setClienteAtual(cli);
    setModalTrocaClienteAberto(false);
    setBuscaClienteTexto("");
  };

  return (
    <div className={styles.container}>
      <ToastRadix mensagem={mensagem} />
      <Cabecalho />

      <main className={styles.principal}>
        {/* CABEÇALHO DA PÁGINA */}
        <div className={styles.cabecalhoPage}>
          <div className={styles.tituloSection}>
            <div className={styles.iconeWrapper}>
              <ChartBar size={24} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Gestão de Clientes</p>
              <h1 className={styles.pageTitulo}>Relatório de Desempenho do Cliente</h1>
            </div>
          </div>

          <div className={styles.acoesCabecalho}>
            {/* BOTÃO ATUALIZAR */}
            <button
              type="button"
              className={styles.botaoSecundario}
              onClick={carregarDadosCliente}
              disabled={carregando}
              title="Atualizar dados"
            >
              <ArrowsClockwise
                size={16}
                weight="bold"
                className={carregando ? styles.girando : ""}
              />
              Atualizar
            </button>

            {/* BOTÃO BAIXAR PDF (1 A 1 COM PRODUTOS E TOTAIS) */}
            <button
              type="button"
              className={styles.botaoPDF}
              onClick={tratarBaixarPDF}
              disabled={gerandoPDF || carregando || !clienteAtual}
              title="Baixar arquivo PDF com todos os pedidos detalhados e lista de produtos"
            >
              <FilePdf size={18} weight="bold" />
              {gerandoPDF ? "Gerando PDF..." : "Baixar Relatório (PDF)"}
            </button>

            {/* BOTÃO VOLTAR PARA A TELA DESEMPENHO DE CLIENTES (Requisito 1) */}
            <button
              type="button"
              className={styles.botaoVoltar}
              onClick={() => navegar("/gestao-desempenho-clientes")}
              title="Voltar para a tela Desempenho de Clientes"
            >
              <ArrowLeft size={16} weight="bold" />
              Voltar
            </button>
          </div>
        </div>

        {/* BARRA DE DADOS DO CLIENTE & FILTROS GERAIS */}
        <div className={styles.clienteCard}>
          <div className={styles.clienteInfoPrincipal}>
            <div className={styles.avatarWrapper}>
              <User size={28} weight="fill" />
            </div>
            <div className={styles.clienteTextos}>
              <div className={styles.clienteNomeLinha}>
                <h2 className={styles.clienteNome}>
                  {clienteAtual?.nome || "Nenhum cliente selecionado"}
                </h2>
                {clienteAtual?.id && (
                  <span className={styles.badgeClienteId}>#{clienteAtual.id}</span>
                )}
                <button
                  type="button"
                  className={styles.btnTrocarCliente}
                  onClick={() => setModalTrocaClienteAberto(true)}
                  title="Selecionar outro cliente"
                >
                  Trocar Cliente
                </button>
              </div>

              <div className={styles.clienteMetadados}>
                {(clienteAtual?.cpf || clienteAtual?.cnpj || clienteAtual?.documento) && (
                  <span className={styles.metaItem}>
                    <IdentificationCard size={15} />
                    {clienteAtual.cpf || clienteAtual.cnpj || clienteAtual.documento}
                  </span>
                )}
                {clienteAtual?.telefone && (
                  <span className={styles.metaItem}>
                    <Phone size={15} />
                    {clienteAtual.telefone}
                  </span>
                )}
                {(clienteAtual?.endereco || clienteAtual?.bairro || clienteAtual?.cidade) && (
                  <span className={styles.metaItem}>
                    <MapPin size={15} />
                    {[clienteAtual.endereco, clienteAtual.bairro, clienteAtual.cidade]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* FILTROS DE ANO E SETOR */}
          <div className={styles.filtrosControle}>
            <div className={styles.filtroItem}>
              <label htmlFor="anoSelect">
                <Calendar size={14} /> Exercício / Ano:
              </label>
              <select
                id="anoSelect"
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                className={styles.selectFiltro}
              >
                {[anoAtual, anoAtual - 1, anoAtual - 2, anoAtual - 3].map((ano) => (
                  <option key={ano} value={ano}>
                    {ano}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filtroItem}>
              <label htmlFor="setorSelect">Setor:</label>
              <select
                id="setorSelect"
                value={setorFiltro}
                onChange={(e) => setSetorFiltro(e.target.value)}
                className={styles.selectFiltro}
              >
                <option value="todos">Todos os Setores</option>
                <option value="delivery">Delivery</option>
                <option value="externo">Externo (Rotas)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4 CARDS DE KPIS */}
        <div className={styles.kpiGrid}>
          {/* TOTAL EM COMPRAS */}
          <div className={`${styles.kpiCard} ${styles.kpiVerde}`}>
            <div className={styles.kpiIconeWrapper}>
              <CurrencyDollar size={22} weight="bold" />
            </div>
            <div className={styles.kpiConteudo}>
              <span className={styles.kpiRotulo}>Total de Compras</span>
              <strong className={styles.kpiValor}>
                {formatarMoeda(metricasResumo.totalCompras)}
              </strong>
              <span className={styles.kpiSub}>Em pedidos finalizados ({anoSelecionado})</span>
            </div>
          </div>

          {/* QUANTIDADE DE PEDIDOS */}
          <div className={`${styles.kpiCard} ${styles.kpiAzul}`}>
            <div className={styles.kpiIconeWrapper}>
              <Receipt size={22} weight="bold" />
            </div>
            <div className={styles.kpiConteudo}>
              <span className={styles.kpiRotulo}>Quantidade de Pedidos</span>
              <strong className={styles.kpiValor}>{metricasResumo.totalPedidos}</strong>
              <span className={styles.kpiSub}>Volume de pedidos realizados</span>
            </div>
          </div>

          {/* TICKET MÉDIO */}
          <div className={`${styles.kpiCard} ${styles.kpiRoxo}`}>
            <div className={styles.kpiIconeWrapper}>
              <TrendUp size={22} weight="bold" />
            </div>
            <div className={styles.kpiConteudo}>
              <span className={styles.kpiRotulo}>Ticket Médio</span>
              <strong className={styles.kpiValor}>
                {formatarMoeda(metricasResumo.ticketMedio)}
              </strong>
              <span className={styles.kpiSub}>Média gasta por pedido</span>
            </div>
          </div>

          {/* MÉDIA DE DIAS EM ATRASO */}
          <div
            className={`${styles.kpiCard} ${
              metricasResumo.mediaDiasAtraso > 0 ? styles.kpiLaranja : styles.kpiSucesso
            }`}
          >
            <div className={styles.kpiIconeWrapper}>
              {metricasResumo.mediaDiasAtraso > 0 ? (
                <ClockAfternoon size={22} weight="bold" />
              ) : (
                <CheckCircle size={22} weight="bold" />
              )}
            </div>
            <div className={styles.kpiConteudo}>
              <span className={styles.kpiRotulo}>Média de Dias em Atraso</span>
              <strong className={styles.kpiValor}>
                {metricasResumo.mediaDiasAtraso > 0
                  ? `${metricasResumo.mediaDiasAtraso} dias`
                  : "0 dias"}
              </strong>
              <span className={styles.kpiSub}>
                {metricasResumo.mediaDiasAtraso > 0
                  ? `${metricasResumo.totalPendenciasAtraso} títulos com atraso`
                  : "Cliente pontual / Em dia"}
              </span>
            </div>
          </div>

          {/* POSITIVAÇÃO DE SKU (Requisito 1.1) */}
          <div className={`${styles.kpiCard} ${styles.kpiIndigo}`}>
            <div className={styles.kpiIconeWrapper}>
              <Barcode size={22} weight="bold" />
            </div>
            <div className={styles.kpiConteudo}>
              <span className={styles.kpiRotulo}>Positivação de SKU</span>
              <strong className={styles.kpiValor}>{metricasSKU.porcentagem}%</strong>
              <span className={styles.kpiSub}>
                {metricasSKU.positivados} de {metricasSKU.totalBase} SKUs da base
              </span>
            </div>
          </div>
        </div>

        {/* SESSÃO 1: RELATÓRIO DE PRODUTOS COMPRADOS PELO CLIENTE (Requisito 2) */}
        <div className={styles.cardSecao}>
          <div className={styles.secaoCabecalho}>
            <div>
              <h2 className={styles.secaoTitulo}>
                Produtos Comprados pelo Cliente ({produtosComprados.length} SKUs)
              </h2>
              <p className={styles.secaoSub}>
                Relação de itens comprados por este cliente no exercício de {anoSelecionado}
              </p>
            </div>

            <div className={styles.buscaProdutoWrapper}>
              <MagnifyingGlass size={16} className={styles.iconeBusca} />
              <input
                type="text"
                placeholder="Filtrar por nome do produto..."
                value={buscaProdutoTexto}
                onChange={(e) => setBuscaProdutoTexto(e.target.value)}
                className={styles.inputBuscaProduto}
              />
            </div>
          </div>

          {/* TABELA DE PRODUTOS COMPRADOS (SÓBRIA E MENOS CHAMATIVA) */}
          <div className={styles.tabelaWrapper}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Produto / Embalagem</th>
                  <th style={{ width: "130px" }} className={styles.textCenter}>
                    Qtd. Comprada
                  </th>
                  <th style={{ width: "130px" }} className={styles.textRight}>
                    Preço Médio
                  </th>
                  <th style={{ width: "140px" }} className={styles.textRight}>
                    Total Gasto
                  </th>
                  <th style={{ width: "110px" }} className={styles.textCenter}>
                    % do Cliente
                  </th>
                </tr>
              </thead>
              <tbody>
                {produtosCompradosFiltrados.length > 0 ? (
                  produtosCompradosFiltrados.map((prod) => {
                    const percDoTotal =
                      metricasResumo.totalCompras > 0
                        ? ((prod.total / metricasResumo.totalCompras) * 100).toFixed(1)
                        : "0.0";

                    return (
                      <tr key={prod.nome}>
                        <td>
                          <span className={styles.produtoNomeSutil}>{prod.nome}</span>
                        </td>
                        <td className={styles.textCenter}>
                          <span className={styles.produtoQtdSutil}>
                            {prod.quantidade} un
                          </span>
                        </td>
                        <td className={styles.textRight}>
                          <span className={styles.produtoPrecoSutil}>
                            {formatarMoeda(prod.precoMedio)}
                          </span>
                        </td>
                        <td className={styles.textRight}>
                          <strong>{formatarMoeda(prod.total)}</strong>
                        </td>
                        <td className={styles.textCenter}>
                          <span className={styles.badgePercProduto}>{percDoTotal}%</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className={styles.tabelaVazia}>
                      <WarningCircle size={22} />
                      <p>Nenhum produto encontrado nas compras deste cliente.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SESSÃO 2: GRÁFICO DE MÊS A MÊS DO ANO */}
        <div className={styles.cardSecao}>
          <div className={styles.secaoCabecalho}>
            <div>
              <h2 className={styles.secaoTitulo}>Evolução de Compras Mês a Mês</h2>
              <p className={styles.secaoSub}>
                Faturamento mensal acumulado deste cliente no exercício de {anoSelecionado}
              </p>
            </div>
            <span className={styles.badgeAno}>{anoSelecionado}</span>
          </div>

          <div className={styles.graficoWrapper}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dadosMeses} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="nome"
                  tickLine={false}
                  stroke="var(--gray-500)"
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  stroke="var(--gray-500)"
                  fontSize={12}
                  tickFormatter={(val) => `R$ ${val}`}
                />
                <Tooltip
                  formatter={(value, name) => [
                    formatarMoeda(value),
                    name === "total" ? "Total Faturado" : name,
                  ]}
                  labelFormatter={(label) => {
                    const obj = dadosMeses.find((m) => m.nome === label);
                    return obj ? obj.nomeCompleto : label;
                  }}
                  contentStyle={{
                    backgroundColor: "var(--white)",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-md)",
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {dadosMeses.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.total > 0 ? "var(--orange)" : "var(--gray-300)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SESSÃO 3: COMPARATIVO MÊS ENTRE MÊS COM CALENDÁRIO MENSAL (Requisito 2.2) */}
        <div className={styles.cardSecao}>
          <div className={styles.secaoCabecalho}>
            <div>
              <h2 className={styles.secaoTitulo}>Comparativo Mês entre Mês</h2>
              <p className={styles.secaoSub}>
                Abra o calendário para comparar qualquer mês com outro, inclusive de anos anteriores
              </p>
            </div>

            <div className={styles.seletoresComparativo}>
              {/* MÊS BASE COM CALENDÁRIO (TYPE="MONTH") */}
              <div className={styles.seletorPar}>
                <label>Mês de Base (Calendário):</label>
                <input
                  type="month"
                  value={mesAnoA}
                  onChange={(e) => setMesAnoA(e.target.value)}
                  className={styles.inputMesAno}
                  title="Clique para abrir o calendário mensal e escolher ano e mês"
                />
              </div>

              <div className={styles.iconeVersus}>
                <ArrowsLeftRight size={18} weight="bold" />
              </div>

              {/* MÊS COMPARADO COM CALENDÁRIO (TYPE="MONTH") */}
              <div className={styles.seletorPar}>
                <label>Mês de Comparação (Calendário):</label>
                <input
                  type="month"
                  value={mesAnoB}
                  onChange={(e) => setMesAnoB(e.target.value)}
                  className={styles.inputMesAno}
                  title="Clique para abrir o calendário mensal e escolher ano e mês"
                />
              </div>
            </div>
          </div>

          <div className={styles.gridComparativo}>
            {/* CARD MÊS A */}
            <div className={styles.cardMesDado}>
              <span className={styles.mesDadoBadge}>Base</span>
              <h3 className={styles.mesDadoTitulo}>{comparativoMeses.mesA.nomeFormatado}</h3>
              <div className={styles.mesDadoLinha}>
                <span>Total Comprado:</span>
                <strong>{formatarMoeda(comparativoMeses.mesA.total)}</strong>
              </div>
              <div className={styles.mesDadoLinha}>
                <span>Quantidade:</span>
                <strong>{comparativoMeses.mesA.quantidade} pedidos</strong>
              </div>
              <div className={styles.mesDadoLinha}>
                <span>Ticket Médio:</span>
                <strong>{formatarMoeda(comparativoMeses.mesA.ticketMedio)}</strong>
              </div>
            </div>

            {/* CARD DE RESULTADO / VARIAÇÃO */}
            <div
              className={`${styles.cardResultadoVariacao} ${
                comparativoMeses.diffValor > 0
                  ? styles.variacaoPositiva
                  : comparativoMeses.diffValor < 0
                  ? styles.variacaoNegativa
                  : styles.variacaoNeutra
              }`}
            >
              <span className={styles.rotuloResultado}>Variação Percentual</span>
              <strong className={styles.valorDestaqueVariacao}>
                {comparativoMeses.percValor > 0
                  ? `+${comparativoMeses.percValor}%`
                  : `${comparativoMeses.percValor}%`}
              </strong>
              <div className={styles.detalhesDiferenca}>
                <span>
                  Diferença em R$:{" "}
                  <strong>{formatarMoeda(comparativoMeses.diffValor)}</strong>
                </span>
                <span>
                  Diferença de Pedidos:{" "}
                  <strong>
                    {comparativoMeses.diffQtd > 0
                      ? `+${comparativoMeses.diffQtd}`
                      : comparativoMeses.diffQtd}
                  </strong>
                </span>
              </div>
            </div>

            {/* CARD MÊS B */}
            <div className={styles.cardMesDado}>
              <span className={styles.mesDadoBadge}>Comparado</span>
              <h3 className={styles.mesDadoTitulo}>{comparativoMeses.mesB.nomeFormatado}</h3>
              <div className={styles.mesDadoLinha}>
                <span>Total Comprado:</span>
                <strong>{formatarMoeda(comparativoMeses.mesB.total)}</strong>
              </div>
              <div className={styles.mesDadoLinha}>
                <span>Quantidade:</span>
                <strong>{comparativoMeses.mesB.quantidade} pedidos</strong>
              </div>
              <div className={styles.mesDadoLinha}>
                <span>Ticket Médio:</span>
                <strong>{formatarMoeda(comparativoMeses.mesB.ticketMedio)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* SESSÃO 4: PEDIDOS REALIZADOS PELO CLIENTE (LISTA DE PEDIDOS) */}
        <div className={styles.cardSecao}>
          <div className={styles.secaoCabecalho}>
            <div>
              <h2 className={styles.secaoTitulo}>Pedidos Realizados pelo Cliente</h2>
              <p className={styles.secaoSub}>
                Listagem de pedidos emitidos no período ({pedidosFiltradosPorSetor.length} pedidos)
              </p>
            </div>

            <div className={styles.buscaPedidoWrapper}>
              <MagnifyingGlass size={16} className={styles.iconeBusca} />
              <input
                type="text"
                placeholder="Buscar por #ID, forma de pagamento, status, total..."
                value={buscaPedido}
                onChange={(e) => setBuscaPedido(e.target.value)}
                className={styles.inputBuscaPedido}
              />
            </div>
          </div>

          <div className={styles.tabelaWrapper}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th style={{ width: "90px" }}>ID</th>
                  <th style={{ width: "160px" }}>Data / Hora</th>
                  <th style={{ width: "110px" }}>Setor</th>
                  <th>Forma de Pagamento</th>
                  <th style={{ width: "130px" }} className={styles.textCenter}>
                    Status
                  </th>
                  <th style={{ width: "140px" }} className={styles.textRight}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan="6" className={styles.tabelaVazia}>
                      <ArrowsClockwise size={24} className={styles.girando} />
                      <p>Carregando histórico de pedidos do cliente...</p>
                    </td>
                  </tr>
                ) : pedidosExibicao.length > 0 ? (
                  pedidosExibicao.map((pedido) => {
                    const statusNorm = String(pedido.status || "").toLowerCase();
                    const statusClass =
                      statusNorm === "finalizado" || statusNorm === "entregue"
                        ? styles.statusFinalizado
                        : statusNorm === "cancelado"
                        ? styles.statusCancelado
                        : styles.statusPendente;

                    return (
                      <tr key={pedido.uuid || pedido.id}>
                        <td>
                          <strong>#{pedido.id}</strong>
                        </td>
                        <td>{dataHoraFormatada(pedido.data || pedido.createdAt)}</td>
                        <td>
                          <span className={styles.badgeSetor}>
                            {pedido.setor ? pedido.setor.toUpperCase() : "BALCÃO"}
                          </span>
                        </td>
                        <td>
                          {pedido.formaPagamento?.nome ||
                            pedido.formaPagamentoNome ||
                            pedido.formaPagamento ||
                            "A VISTA"}
                        </td>
                        <td className={styles.textCenter}>
                          <span className={`${styles.badgeStatus} ${statusClass}`}>
                            {pedido.status || "—"}
                          </span>
                        </td>
                        <td className={styles.textRight}>
                          <strong className={styles.pedidoValorTotal}>
                            {formatarMoeda(pedido.total || pedido.valorTotal || 0)}
                          </strong>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className={styles.tabelaVazia}>
                      <WarningCircle size={28} />
                      <p>Nenhum pedido encontrado para os filtros selecionados.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL PARA TROCAR DE CLIENTE */}
      {modalTrocaClienteAberto && (
        <div className={styles.modalOverlay} onClick={() => setModalTrocaClienteAberto(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Selecionar Outro Cliente</h3>
              <button
                type="button"
                className={styles.modalBtnFechar}
                onClick={() => setModalTrocaClienteAberto(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBuscaWrapper}>
              <MagnifyingGlass size={18} />
              <input
                type="text"
                placeholder="Digite o nome, documento ou telefone do cliente..."
                value={buscaClienteTexto}
                onChange={(e) => setBuscaClienteTexto(e.target.value)}
                autoFocus
                className={styles.modalInputBusca}
              />
            </div>

            <div className={styles.modalListaClientes}>
              {clientesFiltradosTroca.length > 0 ? (
                clientesFiltradosTroca.map((c) => (
                  <div
                    key={`${c._setorOriginal}-${c.id}`}
                    className={styles.modalItemCliente}
                    onClick={() => tratarSelecionarCliente(c)}
                  >
                    <div>
                      <strong>{c.nome}</strong>
                      <span className={styles.modalItemSub}>
                        #{c.id} • {c.cpf || c.cnpj || c.documento || "Sem documento"} • {c.telefone || "Sem telefone"}
                      </span>
                    </div>
                    <span className={styles.modalBadgeSetor}>
                      {c._setorOriginal?.toUpperCase() || "CLIENTE"}
                    </span>
                  </div>
                ))
              ) : (
                <div className={styles.modalListaVazia}>Nenhum cliente encontrado</div>
              )}
            </div>
          </div>
        </div>
      )}

      <Rodape />
    </div>
  );
}

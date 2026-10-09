import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import {
  ArrowLeft,
  Truck,
  CheckCircle,
  CurrencyDollar,
  CreditCard,
  Receipt,
  Printer,
  Plus,
  Trash,
  ArrowCounterClockwise,
  X,
  Calculator,
  Money,
  ArrowsLeftRight,
  Coffee,
  Package,
  MagnifyingGlass,
  HandCoins,
  PencilSimple,
  Bank,
} from "@phosphor-icons/react";
import { concluirCarga } from "../../operadores/API/carga/concluirCarga";
import { lerCargas } from "../../operadores/API/carga/lerCargas";
import { lerFormasPagamento } from "../../operadores/API/formaPagamento/lerFormasPagamento";
import { lerPendencias } from "../../operadores/API/pendencia/lerPendencias";
import { devolverPedidoExterno } from "../../operadores/API/pedido/devolverPedidoExterno";
import { buscarPedido } from "../../operadores/API/pedido/buscarPedido";
import { usarToast } from "../../componentes/Context/toastContext";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";
import { AlertaRadix } from "../../componentes/ui/alerta/alerta";
import { formatarMoeda } from "../../utils/formartarMoeda";
import { dataFormatadaCalendario, dataFormatadaFiltro } from "../../utils/data";
import { gerarComprovanteFechamentoCargaHTML } from "../../utils/gerarComprovanteFechamentoCarga";
import Spinner from "../../componentes/Spinner";

const categorizarFormaPagamento = (nome) => {
  if (!nome) return "dinheiro";
  const n = String(nome)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (n.includes("pix")) return "pix";
  if (
    n.includes("cart") ||
    n.includes("credito") ||
    n.includes("debito") ||
    n.includes("maquineta")
  ) {
    return "cartao";
  }
  if (n.includes("cheque")) return "cheque";
  if (n.includes("vale") || n.includes("prazo") || n.includes("promissoria")) {
    return "vale";
  }
  if (
    n.includes("dinheiro") ||
    n.includes("vista") ||
    n.includes("especie") ||
    n.includes("cash")
  ) {
    return "dinheiro";
  }

  return "dinheiro";
};

export default function FechamentoCarga() {
  const navegar = useNavigate();
  const location = useLocation();
  const { id: paramId } = useParams();
  const { mensagem, setMensagem } = usarToast();

  const [carga, setCarga] = useState(location.state?.carga || null);
  const [carregando, setCarregando] = useState(!location.state?.carga);
  const [processando, setProcessando] = useState(false);
  const [formasPagamento, setFormasPagamento] = useState([]);

  // Lista dos pedidos da carga com status e pagamentos
  const [pedidos, setPedidos] = useState([]);

  // Lista de pendências em aberto dos clientes
  const [pendenciasAbertas, setPendenciasAbertas] = useState([]);

  // Lista de lançamentos e ajustes da rota (+ / -)
  const [ajustes, setAjustes] = useState([]);

  // Form de novo ajuste
  const [tipoAjuste, setTipoAjuste] = useState("subtracao"); // 'adicao' | 'subtracao'
  const [categoriaAjuste, setCategoriaAjuste] = useState("Almoço");
  const [descricaoAjuste, setDescricaoAjuste] = useState("");
  const [valorAjuste, setValorAjuste] = useState("");
  const [formaAjuste, setFormaAjuste] = useState("Dinheiro");

  // Filtros e busca de pedidos para cargas com muitos pedidos (até 40+)
  const [buscaPedido, setBuscaPedido] = useState("");
  const [filtroStatusPedido, setFiltroStatusPedido] = useState("todos"); // 'todos' | 'entregues' | 'devolvidos' | 'alterados'

  // Estados individuais para calculadora de cédulas
  const [duzentos, setDuzentos] = useState(0);
  const [cem, setCem] = useState(0);
  const [cinquenta, setCinquenta] = useState(0);
  const [vinte, setVinte] = useState(0);
  const [dez, setDez] = useState(0);
  const [cinco, setCinco] = useState(0);
  const [dois, setDois] = useState(0);

  // Carregar dados iniciais da carga e pendências
  useEffect(() => {
    const carregarDadosIniciais = async () => {
      try {
        setCarregando(true);

        // Formas de pagamento
        try {
          const fps = await lerFormasPagamento();
          if (Array.isArray(fps)) setFormasPagamento(fps);
        } catch (e) {
          console.warn("Erro ao ler formas de pagamento:", e);
        }

        // Pendências em aberto de todos os clientes
        try {
          const pends = await lerPendencias({ status: "aberta" });
          setPendenciasAbertas(Array.isArray(pends) ? pends : []);
        } catch (e) {
          console.warn("Erro ao buscar pendências abertas:", e);
        }

        let cargaAtual = location.state?.carga;
        if (!cargaAtual && paramId) {
          const lista = await lerCargas({ id: paramId });
          if (Array.isArray(lista) && lista.length > 0) {
            cargaAtual = lista[0];
          }
        }

        if (cargaAtual) {
          setCarga(cargaAtual);

          // Recupera eventuais ajustes de rota salvos em memória para esta carga
          const salvoAjustes = localStorage.getItem(`ajustes_carga_${cargaAtual.id}`);
          if (salvoAjustes) {
            try {
              const parsed = JSON.parse(salvoAjustes);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setAjustes(parsed);
              }
            } catch (errStorage) {
              console.warn("Erro ao recuperar ajustes salvos:", errStorage);
            }
          }

          // Inicializa pedidos
          const pedidosIniciais = (cargaAtual.pedidos || []).map((p) => {
            const formaNome =
              p.formaPagamento?.nome ||
              p.formaPagamentoNome ||
              p.formaPagamento ||
              "A VISTA";
            const valorTotal = Number(p.total || p.valorTotal || 0);

            return {
              ...p,
              valorTotal,
              statusEntrega: "entregue", // 'entregue' | 'devolvido'
              motivoDevolucao: "",
              formaAlterada: false,
              pagamentos: [
                {
                  formaId: p.formaPagamentoId || p.formaPagamento?.id || 1,
                  formaNome,
                  valor: valorTotal,
                },
              ],
            };
          });
          setPedidos(pedidosIniciais);
        }
      } catch (error) {
        console.error("Erro ao carregar dados da carga para fechamento:", error);
        setMensagem(error.message || "Erro ao carregar carga");
      } finally {
        setCarregando(false);
      }
    };

    carregarDadosIniciais();
  }, [paramId]);

  // Sincroniza e persiste os ajustes da rota em memória (localStorage)
  useEffect(() => {
    const cargaIdAtual = carga?.id || paramId;
    if (cargaIdAtual && Array.isArray(ajustes)) {
      try {
        localStorage.setItem(
          `ajustes_carga_${cargaIdAtual}`,
          JSON.stringify(ajustes)
        );
      } catch (errStorage) {
        console.warn("Erro ao salvar ajustes no localStorage:", errStorage);
      }
    }
  }, [ajustes, carga?.id, paramId]);

  // Totais calculados dinamicamente
  const totais = useMemo(() => {
    let dinheiroPedidos = 0;
    let pixPedidos = 0;
    let cartaoPedidos = 0;
    let chequePedidos = 0;
    let valePedidos = 0;
    let totalDevolucoes = 0;

    pedidos.forEach((p) => {
      if (p.statusEntrega === "devolvido") {
        totalDevolucoes += Number(p.valorTotal || 0);
        return;
      }

      (p.pagamentos || []).forEach((pg) => {
        const cat = categorizarFormaPagamento(pg.formaNome);
        const v = Number(pg.valor || 0);

        if (cat === "dinheiro") {
          dinheiroPedidos += v;
        } else if (cat === "pix") {
          pixPedidos += v;
        } else if (cat === "cartao") {
          cartaoPedidos += v;
        } else if (cat === "cheque") {
          chequePedidos += v;
        } else if (cat === "vale") {
          valePedidos += v;
        } else {
          dinheiroPedidos += v;
        }
      });
    });

    let ajustesDinheiro = 0;
    let ajustesPix = 0;
    let ajustesCartao = 0;
    let ajustesCheque = 0;
    let ajustesVale = 0;

    ajustes.forEach((aj) => {
      const v = Number(aj.valor || 0);
      const isEntrada = aj.tipo === "adicao" || aj.tipo === "entrada";
      const delta = isEntrada ? v : -v;
      const cat = categorizarFormaPagamento(aj.formaPagamento);

      if (cat === "dinheiro") {
        ajustesDinheiro += delta;
      } else if (cat === "pix") {
        ajustesPix += delta;
      } else if (cat === "cartao") {
        ajustesCartao += delta;
      } else if (cat === "cheque") {
        ajustesCheque += delta;
      } else if (cat === "vale") {
        ajustesVale += delta;
      } else {
        ajustesDinheiro += delta;
      }
    });

    const dinheiroFinal = Math.max(0, dinheiroPedidos + ajustesDinheiro);
    const pixFinal = Math.max(0, pixPedidos + ajustesPix);
    const cartaoFinal = Math.max(0, cartaoPedidos + ajustesCartao);
    const chequeFinal = Math.max(0, chequePedidos + ajustesCheque);
    const valeFinal = Math.max(0, valePedidos + ajustesVale);
    const totalGeral = dinheiroFinal + pixFinal + cartaoFinal + chequeFinal + valeFinal;

    return {
      dinheiroPedidos,
      ajustesDinheiro,
      dinheiroFinal,
      pix: pixPedidos,
      ajustesPix,
      pixFinal,
      cartao: cartaoPedidos,
      ajustesCartao,
      cartaoFinal,
      cheque: chequePedidos,
      ajustesCheque,
      chequeFinal,
      vale: valePedidos,
      ajustesVale,
      valeFinal,
      totalDevolucoes,
      totalGeral,
    };
  }, [pedidos, ajustes]);

  // Contadores para chips de filtro
  const contagemPedidos = useMemo(() => {
    const total = pedidos.length;
    const entregues = pedidos.filter((p) => p.statusEntrega === "entregue").length;
    const devolvidos = pedidos.filter((p) => p.statusEntrega === "devolvido").length;
    const alterados = pedidos.filter(
      (p) => p.formaAlterada || (p.pagamentos && p.pagamentos.length > 1)
    ).length;
    return { total, entregues, devolvidos, alterados };
  }, [pedidos]);

  // Pedidos filtrados para exibição
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((p) => {
      // Filtro por status
      if (filtroStatusPedido === "entregues" && p.statusEntrega !== "entregue") return false;
      if (filtroStatusPedido === "devolvidos" && p.statusEntrega !== "devolvido") return false;
      if (
        filtroStatusPedido === "alterados" &&
        !p.formaAlterada &&
        (!p.pagamentos || p.pagamentos.length <= 1)
      ) {
        return false;
      }

      // Filtro por termo de busca
      if (buscaPedido.trim()) {
        const termo = buscaPedido.toLowerCase().trim();
        const numId = String(p.id || "");
        const clienteNome = (p.cliente?.nome || p.nomeCliente || "").toLowerCase();
        const endereco = (p.cliente?.endereco || p.endereco || "").toLowerCase();
        return (
          numId.includes(termo) ||
          clienteNome.includes(termo) ||
          endereco.includes(termo)
        );
      }
      return true;
    });
  }, [pedidos, filtroStatusPedido, buscaPedido]);

  // Contagem de cédulas
  const totalNotas =
    Number(duzentos || 0) +
    Number(cem || 0) +
    Number(cinquenta || 0) +
    Number(vinte || 0) +
    Number(dez || 0) +
    Number(cinco || 0) +
    Number(dois || 0);

  const totalCedulasContado = useMemo(() => {
    return (
      Number(duzentos || 0) * 200 +
      Number(cem || 0) * 100 +
      Number(cinquenta || 0) * 50 +
      Number(vinte || 0) * 20 +
      Number(dez || 0) * 10 +
      Number(cinco || 0) * 5 +
      Number(dois || 0) * 2
    );
  }, [duzentos, cem, cinquenta, vinte, dez, cinco, dois]);

  const diferencaCedulas = totalCedulasContado - totais.dinheiroFinal;

  // Navegação no teclado entre os inputs de cédulas com tecla Enter
  const handleKeyDownNota = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const inputs = Array.from(
        document.querySelectorAll('input[data-nota-input="true"]')
      );
      const index = inputs.indexOf(e.target);
      if (inputs[index + 1]) {
        inputs[index + 1].focus();
        inputs[index + 1].select();
      } else {
        e.target.blur();
      }
    }
  };

  // Limpar contagem de cédulas
  const limparContagemCedulas = () => {
    setDuzentos(0);
    setCem(0);
    setCinquenta(0);
    setVinte(0);
    setDez(0);
    setCinco(0);
    setDois(0);
    setMensagem("Contagem de cédulas zerada.");
  };

  // Presets rápidos de ajustes
  const aplicarPresetAjuste = (tipo, cat, desc, val = "", forma = "Dinheiro") => {
    setTipoAjuste(tipo);
    setCategoriaAjuste(cat);
    setDescricaoAjuste(desc);
    setValorAjuste(val);
    setFormaAjuste(forma);
  };

  // Adicionar Ajuste
  const tratarAdicionarAjuste = (e) => {
    if (e) e.preventDefault();
    const v = Number(valorAjuste);
    if (!v || v <= 0) {
      setMensagem("Informe um valor válido para o ajuste.");
      return;
    }

    const novoAjuste = {
      id: Date.now(),
      tipo: tipoAjuste,
      categoria: categoriaAjuste,
      descricao: descricaoAjuste || categoriaAjuste,
      valor: v,
      formaPagamento: formaAjuste,
    };

    setAjustes((prev) => [novoAjuste, ...prev]);
    setValorAjuste("");
    setDescricaoAjuste("");
    setMensagem(`Lançamento de ${categoriaAjuste} adicionado com sucesso!`);
  };

  // Remover Ajuste
  const tratarRemoverAjuste = (id) => {
    setAjustes((prev) => prev.filter((a) => a.id !== id));
  };

  // Devolver Pedido Externo chamando a API do backend
  const tratarDevolverPedido = async (ped) => {
    const ident = ped.uuid || ped.id;
    try {
      setProcessando(true);
      const resposta = await devolverPedidoExterno(ident);

      setPedidos((prev) =>
        prev.map((p) => {
          if (p.id !== ped.id) return p;
          return {
            ...p,
            status: "devolvido",
            statusEntrega: "devolvido",
            motivoDevolucao: "Devolução da Carga",
          };
        })
      );

      // Remove eventuais pendências deste pedido se foram canceladas
      setPendenciasAbertas((prev) =>
        prev.filter((pend) => pend.pedidoId !== ped.id && pend.id !== ped.id)
      );

      setMensagem(
        resposta?.mensagem ||
          `Pedido #${ped.id} marcado como DEVOLVIDO no servidor!`
      );
    } catch (error) {
      console.error("Erro ao devolver pedido externo:", error);
      setMensagem(error.message || "Erro ao devolver pedido externo");
    } finally {
      setProcessando(false);
    }
  };

  // Lançar Pendência do Cliente como Lançamento Rápido em Ajustes da Rota
  const tratarLancarPendenciaComoAjuste = (pendencia, pedido) => {
    const saldo = Number(
      pendencia.saldoDevedor ||
        Number(pendencia.valor) - Number(pendencia.valorPago || 0)
    );
    const clienteNome =
      pedido.cliente?.nome ||
      pedido.nomeCliente ||
      pendencia.cliente?.nome ||
      "Cliente";

    aplicarPresetAjuste(
      "adicao",
      "Coleta Vale",
      `Coleta Vale #${pendencia.pedidoId || pendencia.id} (${clienteNome})`,
      saldo > 0 ? saldo.toFixed(2) : "",
      "Dinheiro"
    );

    setMensagem(
      `Pendência do Vale #${pendencia.pedidoId || pendencia.id} (${clienteNome}) preenchida em Ajustes da Rota!`
    );
  };

  // Redirecionar para o Reimprimir para visualizar ou editar pedido
  const tratarAbrirReimprimir = (ped) => {
    const cupomFormatado = {
      ...ped,
      tipo: ped.tipo || "externo",
      origem: `/fechamento-carga/${carga?.id || ""}`,
    };
    navegar("/reimprimir", { state: cupomFormatado });
  };

  // Redirecionar para o Reimprimir ao clicar na pendência
  const tratarAbrirReimprimirPendencia = async (pendencia) => {
    try {
      setProcessando(true);
      if (
        pendencia.pedido &&
        Array.isArray(pendencia.pedido.itens) &&
        pendencia.pedido.itens.length > 0
      ) {
        const cupomFormatado = {
          ...pendencia.pedido,
          tipo: pendencia.pedido.tipo || "externo",
          origem: `/fechamento-carga/${carga?.id || ""}`,
        };
        navegar("/reimprimir", { state: cupomFormatado });
        return;
      }

      const pedidoIdBuscado = pendencia.pedidoId || pendencia.id;
      const res = await buscarPedido({ id: pedidoIdBuscado, setor: "externo" });
      const lista = Array.isArray(res)
        ? res
        : Array.isArray(res?.resultado)
        ? res.resultado
        : res
        ? [res]
        : [];
      const pedidoEncontrado =
        lista.find((p) => Number(p.id) === Number(pedidoIdBuscado)) ||
        lista[0];

      if (pedidoEncontrado) {
        const clienteObj =
          typeof pedidoEncontrado.cliente === "object"
            ? pedidoEncontrado.cliente
            : { nome: pedidoEncontrado.cliente || pedidoEncontrado.nomeCliente || "Cliente não informado" };

        const cupomFormatado = {
          ...pedidoEncontrado,
          cliente: clienteObj,
          formaPagamento:
            typeof pedidoEncontrado.formaPagamento === "object"
              ? pedidoEncontrado.formaPagamento
              : { nome: pedidoEncontrado.formaPagamento || "VALE" },
          tipo: pedidoEncontrado.tipo || "externo",
          origem: `/fechamento-carga/${carga?.id || ""}`,
        };
        navegar("/reimprimir", { state: cupomFormatado });
      } else {
        const clienteNome =
          typeof pendencia.cliente === "object"
            ? pendencia.cliente?.nome
            : pendencia.cliente || pendencia.nomeCliente || "Cliente não informado";

        const cupomFormatado = {
          id: pedidoIdBuscado,
          uuid: pendencia.uuid || `pendencia-${pendencia.id}`,
          data: pendencia.criadoEm || pendencia.createdAt || pendencia.data,
          cliente: {
            nome: clienteNome,
            endereco: pendencia.cliente?.endereco || "",
            cidade: pendencia.cliente?.cidade || "",
            telefone: pendencia.cliente?.telefone || "",
            referencia: pendencia.cliente?.referencia || "",
          },
          total: Number(pendencia.valor || 0),
          saldoDevedor: Number(
            pendencia.saldoDevedor ||
              Number(pendencia.valor) - Number(pendencia.valorPago || 0)
          ),
          status: pendencia.status || "pendente",
          itens: pendencia.itens || [],
          formaPagamento: { nome: "VALE" },
          tipo: "externo",
          origem: `/fechamento-carga/${carga?.id || ""}`,
        };
        navegar("/reimprimir", { state: cupomFormatado });
      }
    } catch (error) {
      console.error("Erro ao abrir pedido da pendência no reimprimir:", error);
      setMensagem(error.message || "Não foi possível carregar o pedido para reimpressão.");
    } finally {
      setProcessando(false);
    }
  };

  // Impressão Térmica do Fechamento
  const tratarImprimirFechamento = () => {
    if (!carga) return;
    try {
      if (!window.IMPRESSORA || typeof window.IMPRESSORA.imprimir !== "function") {
        setMensagem("Interface de impressão não disponível nesta plataforma.");
        return;
      }

      const html = gerarComprovanteFechamentoCargaHTML({
        carga,
        totais,
        ajustes,
        pedidos,
        contagemCedulas: {
          totalContado: totalCedulasContado,
          diferenca: diferencaCedulas,
          cedulas: {
            duzentos,
            cem,
            cinquenta,
            vinte,
            dez,
            cinco,
            dois,
          },
        },
      });

      window.IMPRESSORA.imprimir(html);
      setMensagem(`Comprovante de Fechamento da Carga #${carga.id} enviado para impressão!`);
    } catch (error) {
      console.error("Erro ao imprimir comprovante de fechamento:", error);
      setMensagem("Erro ao imprimir comprovante.");
    }
  };

  // Concluir e Finalizar Fechamento definitivamente
  const tratarConcluirFechamento = async () => {
    if (!carga) return;
    try {
      setProcessando(true);

      const payloadFechamento = {
        cargaId: carga.id,
        status: "finalizada",
        totais,
        ajustes,
        pedidosAtualizados: pedidos.map((p) => ({
          id: p.id,
          statusEntrega: p.statusEntrega,
          motivoDevolucao: p.motivoDevolucao,
          pagamentos: p.pagamentos,
        })),
        contagemCedulas: {
          totalContado: totalCedulasContado,
          diferenca: diferencaCedulas,
          cedulas: {
            duzentos,
            cem,
            cinquenta,
            vinte,
            dez,
            cinco,
            dois,
          },
        },
      };

      await concluirCarga(carga.id, payloadFechamento);

      // Limpa os ajustes em memória da carga finalizada
      if (carga?.id) {
        try {
          localStorage.removeItem(`ajustes_carga_${carga.id}`);
        } catch (e) {
          console.warn("Erro ao remover ajustes do localStorage:", e);
        }
      }

      setMensagem(`Fechamento da Carga #${carga.id} concluído com sucesso!`);

      // Tenta imprimir comprovante automaticamente
      try {
        if (window.IMPRESSORA && typeof window.IMPRESSORA.imprimir === "function") {
          const html = gerarComprovanteFechamentoCargaHTML({
            carga,
            totais,
            ajustes,
            pedidos,
            contagemCedulas: {
              totalContado: totalCedulasContado,
              diferenca: diferencaCedulas,
              cedulas: {
                duzentos,
                cem,
                cinquenta,
                vinte,
                dez,
                cinco,
                dois,
              },
            },
          });
          window.IMPRESSORA.imprimir(html);
        }
      } catch (e) {
        console.warn("Impressão automática silenciosa falhou:", e);
      }

      // Redireciona de volta para a lista de cargas
      setTimeout(() => {
        navegar("/cargas");
      }, 1000);
    } catch (error) {
      console.error("Erro ao concluir fechamento da carga:", error);
      setMensagem(error.message || "Erro ao concluir fechamento da carga");
    } finally {
      setProcessando(false);
    }
  };

  if (carregando) {
    return (
      <div className={styles.container}>
        <Cabecalho />
        <main className={styles.main}>
          <Spinner />
        </main>
        <Rodape />
      </div>
    );
  }

  if (!carga) {
    return (
      <div className={styles.container}>
        <Cabecalho />
        <main className={styles.main}>
          <div className={styles.cabecalhoPage}>
            <div className={styles.tituloSection}>
              <button
                className={styles.botaoVoltar}
                onClick={() => navegar("/cargas")}
                title="Voltar para Cargas"
              >
                <ArrowLeft size={18} weight="bold" />
              </button>
              <div>
                <p className={styles.pageSubtitulo}>Fechamento com Motorista</p>
                <h1 className={styles.pageTitulo}>Carga não encontrada</h1>
              </div>
            </div>
          </div>
          <p>Nenhuma carga selecionada para fechamento.</p>
        </main>
        <Rodape />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Cabecalho />
      <ToastRadix mensagem={mensagem} />

      <main className={styles.main}>
        {/* CABEÇALHO */}
        <div className={styles.cabecalhoPage}>
          <div className={styles.tituloSection}>
            <button
              className={styles.botaoVoltar}
              onClick={() => navegar("/cargas")}
              title="Voltar para Cargas"
            >
              <ArrowLeft size={18} weight="bold" />
            </button>
            <div className={styles.iconeWrapper}>
              <Truck size={24} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Prestação de Contas da Rota</p>
              <h1 className={styles.pageTitulo}>
                Fechamento da Carga #{carga.id} — {carga.motorista?.nome || "Motorista"}
              </h1>
            </div>
          </div>

          <div className={styles.cabecalhoAcoes}>
            <span className={styles.badgeCargaStatus}>
              <Truck size={16} weight="bold" />
              {carga.veiculo?.nome || "Veículo"} ({carga.veiculo?.placa || "-"})
            </span>

            <button
              type="button"
              className={styles.btnIrPendencias}
              onClick={() => navegar("/pendencias")}
              title="Ir direto para o painel de Pendências"
            >
              <HandCoins size={16} weight="bold" />
              Pendências
            </button>

            <button
              type="button"
              className={styles.btnImprimirFechamento}
              onClick={tratarImprimirFechamento}
              title="Imprimir Comprovante na Impressora Térmica"
            >
              <Printer size={16} weight="bold" />
              Imprimir Fechamento
            </button>
          </div>
        </div>

        {/* CARDS DE TOTAIS POR FORMA DE PAGAMENTO */}
        <div className={styles.gridTotais}>
          {/* DINHEIRO */}
          <div className={`${styles.cardTotal} ${styles.cardDinheiro}`}>
            <div className={styles.cardTotalHeader}>
              <span className={styles.cardTotalLabel}>Dinheiro a Entregar</span>
              <div className={styles.cardTotalIcone}>
                <Money size={18} weight="bold" />
              </div>
            </div>
            <h3 className={styles.cardTotalValor}>{formatarMoeda(totais.dinheiroFinal)}</h3>
            <span className={styles.cardTotalSub}>
              Pedidos: {formatarMoeda(totais.dinheiroPedidos)}{" "}
              {totais.ajustesDinheiro !== 0 &&
                `(${totais.ajustesDinheiro > 0 ? "+" : ""}${formatarMoeda(
                  totais.ajustesDinheiro
                )} aj.)`}
            </span>
          </div>

          {/* PIX */}
          <div className={`${styles.cardTotal} ${styles.cardPix}`}>
            <div className={styles.cardTotalHeader}>
              <span className={styles.cardTotalLabel}>PIX Conferido</span>
              <div className={styles.cardTotalIcone}>
                <CurrencyDollar size={18} weight="bold" />
              </div>
            </div>
            <h3 className={styles.cardTotalValor}>{formatarMoeda(totais.pixFinal)}</h3>
            <span className={styles.cardTotalSub}>
              {totais.ajustesPix !== 0
                ? `Pedidos: ${formatarMoeda(totais.pix)} (${totais.ajustesPix > 0 ? "+" : ""}${formatarMoeda(
                    totais.ajustesPix
                  )} aj.)`
                : "Conferir extrato bancário"}
            </span>
          </div>

          {/* CARTÕES */}
          <div className={`${styles.cardTotal} ${styles.cardCartao}`}>
            <div className={styles.cardTotalHeader}>
              <span className={styles.cardTotalLabel}>Cartões</span>
              <div className={styles.cardTotalIcone}>
                <CreditCard size={18} weight="bold" />
              </div>
            </div>
            <h3 className={styles.cardTotalValor}>{formatarMoeda(totais.cartaoFinal)}</h3>
            <span className={styles.cardTotalSub}>
              {totais.ajustesCartao !== 0
                ? `Pedidos: ${formatarMoeda(totais.cartao)} (${totais.ajustesCartao > 0 ? "+" : ""}${formatarMoeda(
                    totais.ajustesCartao
                  )} aj.)`
                : "Comprovantes da maquineta"}
            </span>
          </div>

          {/* CHEQUES */}
          <div className={`${styles.cardTotal} ${styles.cardCheque}`}>
            <div className={styles.cardTotalHeader}>
              <span className={styles.cardTotalLabel}>Cheques</span>
              <div className={styles.cardTotalIcone}>
                <Bank size={18} weight="bold" />
              </div>
            </div>
            <h3 className={styles.cardTotalValor}>{formatarMoeda(totais.chequeFinal)}</h3>
            <span className={styles.cardTotalSub}>
              {totais.ajustesCheque !== 0
                ? `Pedidos: ${formatarMoeda(totais.cheque)} (${totais.ajustesCheque > 0 ? "+" : ""}${formatarMoeda(
                    totais.ajustesCheque
                  )} aj.)`
                : "Cheques recebidos"}
            </span>
          </div>

          {/* TOTAL GERAL DA CARGA */}
          <div className={`${styles.cardTotal} ${styles.cardGeral}`}>
            <div className={styles.cardTotalHeader}>
              <span className={styles.cardTotalLabel}>Total da Carga</span>
              <div className={styles.cardTotalIcone}>
                <CheckCircle size={18} weight="fill" />
              </div>
            </div>
            <h3 className={styles.cardTotalValor}>{formatarMoeda(totais.totalGeral)}</h3>
            <span className={styles.cardTotalSub}>
              {pedidos.length} pedidos (
              {totais.totalDevolucoes > 0
                ? `${formatarMoeda(totais.totalDevolucoes)} devolvidos`
                : "sem devoluções"}
              )
            </span>
          </div>
        </div>

        {/* GRID PRINCIPAL: 1. PEDIDOS DA CARGA | 2. LANÇAMENTOS & AJUSTES | 3. CALCULADORA DE NOTAS */}
        <div className={styles.conteudoGrid}>
          {/* ── SEÇÃO 1: CONFERÊNCIA DE PEDIDOS ── */}
          <div className={styles.secaoCard}>
            <div className={styles.secaoCardHeader}>
              <div className={styles.secaoCardTituloWrapper}>
                <Receipt size={20} weight="bold" color="#1971c2" />
                <h2 className={styles.secaoCardTitulo}>Pedidos da Carga</h2>
              </div>
              <span className={styles.secaoCardContador}>
                {pedidosFiltrados.length} de {pedidos.length} pedidos
              </span>
            </div>

            {/* BARRA DE BUSCA E CHIPS DE FILTRO (IDEAL PARA CARGAS DE 40+ PEDIDOS) */}
            <div className={styles.barraBuscaFiltroPedidos}>
              <div className={styles.inputBuscaPedidosWrapper}>
                <MagnifyingGlass size={16} weight="bold" className={styles.inputBuscaPedidosIcone} />
                <input
                  type="text"
                  className={styles.inputBuscaPedidos}
                  placeholder="Buscar por #ID, cliente ou endereço..."
                  value={buscaPedido}
                  onChange={(e) => setBuscaPedido(e.target.value)}
                />
              </div>

              <div className={styles.filtrosChipsWrapper}>
                <button
                  type="button"
                  className={`${styles.chipFiltro} ${
                    filtroStatusPedido === "todos" ? styles.chipFiltroAtivo : ""
                  }`}
                  onClick={() => setFiltroStatusPedido("todos")}
                >
                  Todos ({contagemPedidos.total})
                </button>
                <button
                  type="button"
                  className={`${styles.chipFiltro} ${
                    filtroStatusPedido === "entregues" ? styles.chipFiltroAtivo : ""
                  }`}
                  onClick={() => setFiltroStatusPedido("entregues")}
                >
                  Entregues ({contagemPedidos.entregues})
                </button>
                <button
                  type="button"
                  className={`${styles.chipFiltro} ${
                    filtroStatusPedido === "devolvidos" ? styles.chipFiltroDevolvidoAtivo : ""
                  }`}
                  onClick={() => setFiltroStatusPedido("devolvidos")}
                >
                  Devolvidos ({contagemPedidos.devolvidos})
                </button>
              </div>
            </div>

            <div className={styles.listaPedidos}>
              {pedidosFiltrados.length > 0 ? (
                pedidosFiltrados.map((ped, index) => {
                  const isDevolvido = ped.statusEntrega === "devolvido";

                  // Busca pendências abertas deste cliente
                  const clienteIdRef = ped.clienteId || ped.cliente?.id;
                  const clienteNomeRef = ped.cliente?.nome || ped.nomeCliente;

                  const pendenciasCliente = pendenciasAbertas.filter((p) => {
                    if (p.status === "fechada") return false;
                    if (clienteIdRef && (p.clienteId === clienteIdRef || p.cliente?.id === clienteIdRef)) {
                      return true;
                    }
                    if (clienteNomeRef && p.cliente?.nome && p.cliente.nome.trim().toLowerCase() === clienteNomeRef.trim().toLowerCase()) {
                      return true;
                    }
                    return false;
                  });

                  return (
                    <div
                      key={ped.id}
                      className={`${styles.pedidoItemCard} ${
                        isDevolvido ? styles.pedidoDevolvidoCard : ""
                      }`}
                    >
                      <div className={styles.pedidoLinhaUnica}>
                        <div className={styles.pedidoInfoEsquerda}>
                          <span className={styles.pedidoPosicao}>{index + 1}.</span>
                          <span
                            className={styles.pedidoCliente}
                            title={ped.cliente?.nome || ped.nomeCliente || ""}
                          >
                            {ped.cliente?.nome || ped.nomeCliente || "Cliente não informado"}
                          </span>
                          <span className={styles.pedidoIdSutil}>#{ped.id}</span>
                        </div>

                        <div className={styles.pedidoInfoDireita}>
                          {isDevolvido ? (
                            <span className={styles.tagDevolvido}>
                              ⛔ DEVOLVIDO
                            </span>
                          ) : (
                            (ped.pagamentos || []).map((pg, idx) => {
                              const cat = categorizarFormaPagamento(pg.formaNome);
                              return (
                                <span
                                  key={idx}
                                  className={`${styles.tagPagamento} ${
                                    cat === "pix"
                                      ? styles.tagPagamentoPix
                                      : cat === "cartao"
                                      ? styles.tagPagamentoCartao
                                      : cat === "vale"
                                      ? styles.tagPagamentoVale
                                      : styles.tagPagamentoDestaque
                                  }`}
                                >
                                  {pg.formaNome}: {formatarMoeda(pg.valor)}
                                </span>
                              );
                            })
                          )}

                          <button
                            type="button"
                            className={styles.btnEditarPedido}
                            onClick={() => tratarAbrirReimprimir(ped)}
                            title="editar pedido"
                          >
                            <PencilSimple size={14} weight="bold" />
                          </button>

                          {!isDevolvido && (
                            <AlertaRadix
                              titulo="Confirmar Devolução do Pedido"
                              descricao={`Deseja devolver o Pedido #${ped.id} de ${
                                ped.cliente?.nome || ped.nomeCliente || "Cliente"
                              }? O status do pedido será alterado para DEVOLVIDO no servidor, o estoque será estornado e as pendências vinculadas canceladas.`}
                              tratar={() => tratarDevolverPedido(ped)}
                              confirmarTexto="Sim, Devolver Pedido"
                              cancelarTexto="Cancelar"
                              trigger={
                                <button
                                  type="button"
                                  className={`${styles.btnAcaoPedido} ${styles.btnDevolver}`}
                                  disabled={processando}
                                  title="Gerar devolução do pedido"
                                >
                                  <ArrowCounterClockwise size={14} weight="bold" />
                                </button>
                              }
                            />
                          )}
                        </div>
                      </div>

                      {/* PENDÊNCIAS EM ABERTO DESTE CLIENTE (DISCRETO) */}
                      {pendenciasCliente.length > 0 && !isDevolvido && (
                        <div className={styles.pendenciasDiscretasWrapper}>
                          <div className={styles.pendenciasDiscretasLabel}>
                            <HandCoins size={12} weight="bold" />
                            <span>
                              {pendenciasCliente.length === 1
                                ? "Pendência:"
                                : `Pendências (${pendenciasCliente.length}):`}
                            </span>
                          </div>
                          <div className={styles.pendenciasDiscretasChips}>
                            {pendenciasCliente.map((pend) => {
                              const saldoDevedor = Number(
                                pend.saldoDevedor !== undefined && pend.saldoDevedor !== null
                                  ? pend.saldoDevedor
                                  : Number(pend.valor || 0) - Number(pend.valorPago || 0)
                              );
                              const totalPago = Number(pend.valorPago || 0);

                              return (
                                <div
                                  key={pend.id}
                                  className={styles.chipPendenciaDiscreto}
                                  title="Clique nas informações para abrir o pedido no Reimprimir ou em '+ Lançar' para preencher nos ajustes"
                                >
                                  <div
                                    className={styles.chipPendenciaClickInfo}
                                    onClick={() =>
                                      tratarAbrirReimprimirPendencia(pend)
                                    }
                                    title="Abrir este pedido no Reimprimir"
                                  >
                                    <span className={styles.chipPendenciaData}>
                                      {dataFormatadaFiltro(
                                        pend.criadoEm ||
                                          pend.createdAt ||
                                          pend.data ||
                                          pend.dataCriacao
                                      )}
                                    </span>
                                    {totalPago > 0 && (
                                      <span
                                        className={styles.chipPendenciaPago}
                                        title={`Total já pago: ${formatarMoeda(totalPago)}`}
                                      >
                                        Pago: {formatarMoeda(totalPago)}
                                      </span>
                                    )}
                                    <span
                                      className={styles.chipPendenciaSaldo}
                                      title={`Total pendente: ${formatarMoeda(saldoDevedor)}`}
                                    >
                                      {formatarMoeda(saldoDevedor)}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    className={styles.chipPendenciaAcao}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      tratarLancarPendenciaComoAjuste(pend, ped);
                                    }}
                                    title="Lançar valor recebido em Ajustes da Rota"
                                  >
                                    <Plus size={10} weight="bold" />
                                    Lançar
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className={styles.semAjustes} style={{ padding: "24px 0" }}>
                  Nenhum pedido encontrado com os filtros aplicados.
                </p>
              )}
            </div>
          </div>

          {/* ── SEÇÃO 2: LANÇAMENTOS E AJUSTES DA ROTA ── */}
          <div className={styles.secaoCard}>
            <div className={styles.secaoCardHeader}>
              <div className={styles.secaoCardTituloWrapper}>
                <ArrowsLeftRight size={20} weight="bold" color="#2f9e44" />
                <h2 className={styles.secaoCardTitulo}>Ajustes da Rota</h2>
              </div>
              <span className={styles.secaoCardContador}>{ajustes.length} lançamentos</span>
            </div>

            {/* PRESETS RÁPIDOS */}
            <div className={styles.presetsWrapper}>
              <span className={styles.presetsTitulo}>Lançamentos Rápidos</span>
              <div className={styles.presetsGrid}>
                <button
                  type="button"
                  className={`${styles.btnPreset} ${styles.btnPresetNegativo}`}
                  onClick={() =>
                    aplicarPresetAjuste(
                      "subtracao",
                      "Almoço",
                      "Almoço do motorista/ajudante",
                      "35.00"
                    )
                  }
                >
                  <Coffee size={14} weight="bold" />
                  Almoço R$ 35
                </button>

                <button
                  type="button"
                  className={`${styles.btnPreset} ${styles.btnPresetAmarelo}`}
                  onClick={() =>
                    aplicarPresetAjuste(
                      "adicao",
                      "Pagamento Parcial",
                      "Pagamento parcial de pedido",
                      ""
                    )
                  }
                >
                  <Receipt size={14} weight="bold" />
                  Pagamento Parcial
                </button>

                <button
                  type="button"
                  className={`${styles.btnPreset} ${styles.btnPresetPositivo}`}
                  onClick={() =>
                    aplicarPresetAjuste(
                      "adicao",
                      "Vasilhames",
                      "Venda de vasilhames na rota",
                      ""
                    )
                  }
                >
                  <Package size={14} weight="bold" />
                  Vasilhame
                </button>
              </div>
            </div>

            {/* FORMULÁRIO DE NOVO AJUSTE */}
            <form onSubmit={tratarAdicionarAjuste} className={styles.formAjuste}>
              <div className={styles.formAjusteLinha}>
                <select
                  className={styles.selectForm}
                  value={tipoAjuste}
                  onChange={(e) => setTipoAjuste(e.target.value)}
                >
                  <option value="subtracao">(-) Despesa / Saída</option>
                  <option value="adicao">(+) Entrada / Coleta</option>
                </select>

                <input
                  type="text"
                  className={styles.inputForm}
                  placeholder="Descrição (ex: Almoço, Vale do Bar do Zé...)"
                  value={descricaoAjuste}
                  onChange={(e) => setDescricaoAjuste(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formAjusteLinha2}>
                <select
                  className={styles.selectForm}
                  value={formaAjuste}
                  onChange={(e) => setFormaAjuste(e.target.value)}
                >
                  <option value="Dinheiro">💵 Em Dinheiro</option>
                  <option value="PIX">⚡ No PIX</option>
                  <option value="Cartão">💳 No Cartão</option>
                  <option value="Cheque">📄 No Cheque</option>
                </select>

                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className={styles.inputForm}
                  placeholder="Valor R$"
                  value={valorAjuste}
                  onChange={(e) => setValorAjuste(e.target.value)}
                  required
                />

                <button type="submit" className={styles.btnAdicionarAjuste}>
                  <Plus size={16} weight="bold" />
                  Lançar
                </button>
              </div>
            </form>

            {/* LISTA DE AJUSTES */}
            <div className={styles.listaAjustes}>
              {ajustes.length > 0 ? (
                ajustes.map((aj) => {
                  const isPos = aj.tipo === "adicao" || aj.tipo === "entrada";
                  return (
                    <div
                      key={aj.id}
                      className={`${styles.itemAjuste} ${
                        isPos ? styles.itemAjustePos : styles.itemAjusteNeg
                      }`}
                    >
                      <div className={styles.itemAjusteInfo}>
                        <span className={styles.itemAjusteDescricao}>
                          {isPos ? "(+)" : "(-)"} {aj.descricao}
                        </span>
                        <span className={styles.itemAjusteDetalhe}>
                          {aj.categoria} • Forma: {aj.formaPagamento}
                        </span>
                      </div>

                      <div className={styles.itemAjusteValorAcoes}>
                        <strong
                          className={`${styles.itemAjusteValor} ${
                            isPos ? styles.itemAjusteValorPos : styles.itemAjusteValorNeg
                          }`}
                        >
                          {isPos ? "+" : "-"} {formatarMoeda(aj.valor)}
                        </strong>

                        <button
                          type="button"
                          className={styles.btnRemoverAjuste}
                          onClick={() => tratarRemoverAjuste(aj.id)}
                          title="Remover ajuste"
                        >
                          <Trash size={15} weight="bold" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className={styles.semAjustes}>
                  Nenhum ajuste ou despesa lançado para esta carga.
                </p>
              )}
            </div>
          </div>

          {/* ── SEÇÃO 3: CALCULADORA & SOMA DE NOTAS ── */}
          <div className={styles.secaoCard}>
            <div className={styles.secaoCardHeader}>
              <div className={styles.secaoCardTituloWrapper}>
                <Calculator size={20} weight="bold" color="#2f9e44" />
                <h2 className={styles.secaoCardTitulo}>Calculadora de Notas</h2>
              </div>
              <span className={styles.secaoCardContador}>
                {totalNotas} {totalNotas === 1 ? "nota" : "notas"}
              </span>
            </div>

            <div className={styles.tabelaNotasHeader}>
              <span>Qtd</span>
              <span>Nota</span>
              <span style={{ textAlign: "right" }}>Subtotal</span>
            </div>

            <div className={styles.contadorTabela}>
              {/* R$ 200,00 */}
              <div className={styles.itemNotaRow}>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className={styles.inputNotaQtd}
                  data-nota-input="true"
                  value={duzentos || ""}
                  placeholder="0"
                  onChange={(e) =>
                    setDuzentos(Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  onKeyDown={handleKeyDownNota}
                />
                <div className={styles.notaRotulo}>
                  <span>R$ 200,00</span>
                </div>
                <span className={styles.notaSubtotal}>
                  {formatarMoeda((duzentos || 0) * 200)}
                </span>
              </div>

              {/* R$ 100,00 */}
              <div className={styles.itemNotaRow}>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className={styles.inputNotaQtd}
                  data-nota-input="true"
                  value={cem || ""}
                  placeholder="0"
                  onChange={(e) =>
                    setCem(Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  onKeyDown={handleKeyDownNota}
                />
                <div className={styles.notaRotulo}>
                  <span>R$ 100,00</span>
                </div>
                <span className={styles.notaSubtotal}>
                  {formatarMoeda((cem || 0) * 100)}
                </span>
              </div>

              {/* R$ 50,00 */}
              <div className={styles.itemNotaRow}>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className={styles.inputNotaQtd}
                  data-nota-input="true"
                  value={cinquenta || ""}
                  placeholder="0"
                  onChange={(e) =>
                    setCinquenta(Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  onKeyDown={handleKeyDownNota}
                />
                <div className={styles.notaRotulo}>
                  <span>R$ 50,00</span>
                </div>
                <span className={styles.notaSubtotal}>
                  {formatarMoeda((cinquenta || 0) * 50)}
                </span>
              </div>

              {/* R$ 20,00 */}
              <div className={styles.itemNotaRow}>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className={styles.inputNotaQtd}
                  data-nota-input="true"
                  value={vinte || ""}
                  placeholder="0"
                  onChange={(e) =>
                    setVinte(Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  onKeyDown={handleKeyDownNota}
                />
                <div className={styles.notaRotulo}>
                  <span>R$ 20,00</span>
                </div>
                <span className={styles.notaSubtotal}>
                  {formatarMoeda((vinte || 0) * 20)}
                </span>
              </div>

              {/* R$ 10,00 */}
              <div className={styles.itemNotaRow}>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className={styles.inputNotaQtd}
                  data-nota-input="true"
                  value={dez || ""}
                  placeholder="0"
                  onChange={(e) =>
                    setDez(Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  onKeyDown={handleKeyDownNota}
                />
                <div className={styles.notaRotulo}>
                  <span>R$ 10,00</span>
                </div>
                <span className={styles.notaSubtotal}>
                  {formatarMoeda((dez || 0) * 10)}
                </span>
              </div>

              {/* R$ 5,00 */}
              <div className={styles.itemNotaRow}>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className={styles.inputNotaQtd}
                  data-nota-input="true"
                  value={cinco || ""}
                  placeholder="0"
                  onChange={(e) =>
                    setCinco(Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  onKeyDown={handleKeyDownNota}
                />
                <div className={styles.notaRotulo}>
                  <span>R$ 5,00</span>
                </div>
                <span className={styles.notaSubtotal}>
                  {formatarMoeda((cinco || 0) * 5)}
                </span>
              </div>

              {/* R$ 2,00 */}
              <div className={styles.itemNotaRow}>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className={styles.inputNotaQtd}
                  data-nota-input="true"
                  value={dois || ""}
                  placeholder="0"
                  onChange={(e) =>
                    setDois(Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  onKeyDown={handleKeyDownNota}
                />
                <div className={styles.notaRotulo}>
                  <span>R$ 2,00</span>
                </div>
                <span className={styles.notaSubtotal}>
                  {formatarMoeda((dois || 0) * 2)}
                </span>
              </div>
            </div>

            {/* RESUMO DO CONTADOR */}
            <div className={styles.contadorResumoBloco}>
              <div className={styles.contadorResumoLinha}>
                <span>Total Físico Contado:</span>
                <strong style={{ color: "#2b8a3e" }}>
                  {formatarMoeda(totalCedulasContado)}
                </strong>
              </div>

              <div className={styles.contadorResumoLinha}>
                <span>Esperado da Carga:</span>
                <strong>{formatarMoeda(totais.dinheiroFinal)}</strong>
              </div>

              <div
                className={`${styles.contadorDiferencaBadge} ${
                  diferencaCedulas === 0
                    ? styles.diferencaExato
                    : diferencaCedulas > 0
                    ? styles.diferencaSobra
                    : styles.diferencaFalta
                }`}
              >
                <span>
                  {diferencaCedulas === 0
                    ? "✅ Exato (R$ 0,00)"
                    : diferencaCedulas > 0
                    ? `🔵 Sobra de +${formatarMoeda(diferencaCedulas)}`
                    : `🔴 Falta de ${formatarMoeda(diferencaCedulas)}`}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "4px",
                }}
              >
                <AlertaRadix
                  titulo="Limpar Contagem de Cédulas"
                  descricao="Deseja zerar todos os campos de notas?"
                  tratar={limparContagemCedulas}
                  confirmarTexto="Sim, Limpar"
                  cancelarTexto="Voltar"
                  trigger={
                    <button type="button" className={styles.btnLimparContador}>
                      <Trash size={14} weight="bold" />
                      Limpar Contagem
                    </button>
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* BARRA INFERIOR FIXA DE FECHAMENTO */}
        <div className={styles.barraAcaoFixa}>
          <div className={styles.barraAcaoResumo}>
            <div className={styles.barraAcaoItem}>
              <span>Dinheiro a Entregar</span>
              <strong style={{ color: "#2b8a3e" }}>
                {formatarMoeda(totais.dinheiroFinal)}
              </strong>
            </div>

            <div className={styles.barraAcaoItem}>
              <span>Total Contado (Notas)</span>
              <strong
                style={{
                  color:
                    diferencaCedulas === 0
                      ? "#2b8a3e"
                      : diferencaCedulas > 0
                      ? "#1971c2"
                      : "#c92a2a",
                }}
              >
                {formatarMoeda(totalCedulasContado)}
              </strong>
            </div>

            <div className={styles.barraAcaoItem}>
              <span>PIX a Conferir</span>
              <strong style={{ color: "#0ca678" }}>
                {formatarMoeda(totais.pixFinal)}
              </strong>
            </div>

            <div className={styles.barraAcaoItem}>
              <span>Cartões</span>
              <strong style={{ color: "#1971c2" }}>
                {formatarMoeda(totais.cartaoFinal)}
              </strong>
            </div>

            <div className={styles.barraAcaoItem}>
              <span>Cheques</span>
              <strong style={{ color: "#7048e8" }}>
                {formatarMoeda(totais.chequeFinal)}
              </strong>
            </div>
          </div>

          <div className={styles.barraAcaoBotoes}>
            <button
              type="button"
              className={styles.btnImprimirFechamento}
              onClick={tratarImprimirFechamento}
              title="Imprimir Comprovante na Impressora Térmica"
            >
              <Printer size={16} weight="bold" />
              Imprimir
            </button>

            <AlertaRadix
              titulo="Concluir e Finalizar Fechamento"
              descricao={`Confirmar o fechamento da Carga #${carga.id} do motorista ${
                carga.motorista?.nome || ""
              }? O total em dinheiro a entregar é ${formatarMoeda(
                totais.dinheiroFinal
              )} e as pendências de vale serão geradas.`}
              tratar={tratarConcluirFechamento}
              confirmarTexto="Sim, Concluir Fechamento"
              cancelarTexto="Voltar"
              trigger={
                <button
                  type="button"
                  className={styles.btnConcluirFechamento}
                  disabled={processando}
                >
                  <CheckCircle size={18} weight="fill" />
                  {processando ? "Concluindo..." : "Concluir Fechamento"}
                </button>
              }
            />
          </div>
        </div>
      </main>

      <Rodape />
    </div>
  );
}

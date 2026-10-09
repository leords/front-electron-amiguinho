import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import {
  Package,
  Truck,
  ArrowLeft,
  PlusCircle,
  CheckCircle,
  CalendarBlank,
  PaperPlaneRight,
  Scales,
  User,
  MapPin,
  FileText,
  X,
  Warning,
  CheckSquare,
  Square,
  Funnel,
  Eye,
  Info,
  MagnifyingGlass,
  ArrowCounterClockwise,
  Printer,
  Receipt,
  Trash,
  Plus,
  CreditCard,
  Check,
  ClipboardText,
} from "@phosphor-icons/react";
import { lerCargas } from "../../operadores/API/carga/lerCargas";
import { criarCarga } from "../../operadores/API/carga/criarCarga";
import { finalizarCarga } from "../../operadores/API/carga/finalizarCarga";
import { concluirCarga } from "../../operadores/API/carga/concluirCarga";
import { retornarCargaPendente } from "../../operadores/API/carga/retornarCargaPendente";
import { cancelarCarga } from "../../operadores/API/carga/cancelarCarga";
import { adicionarPedidosCarga } from "../../operadores/API/carga/adicionarPedidosCarga";
import { removerPedidoCarga } from "../../operadores/API/carga/removerPedidoCarga";
import { lerMotoristas } from "../../operadores/API/motorista/lerMotoristas";
import { lerVeiculos } from "../../operadores/API/veiculo/lerVeiculos";
import { buscarPedido } from "../../operadores/API/pedido/buscarPedido";
import { LerUsuario } from "../../operadores/API/usuario/lerUsuario";
import { usarToast } from "../../componentes/Context/toastContext";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";
import { AlertaRadix } from "../../componentes/ui/alerta/alerta";
import { formatarMoeda } from "../../utils/formartarMoeda";
import {
  dataFormatadaCalendario,
  dataHoraFormatada,
  extrairDataYMD,
} from "../../utils/data";
import { gerarRomaneioCargaHTML } from "../../utils/gerarRomaneioCarga";
import {
  gerarRelatorioCarregamentoHTML,
  agruparProdutosCarga,
} from "../../utils/gerarRelatorioCarregamento";
import { gerarCupomExterno } from "../../utils/gerarCupomExterno";
import Spinner from "../../componentes/Spinner";

export default function Cargas() {
  const navegar = useNavigate();
  const { mensagem, setMensagem } = usarToast();

  // Estados de navegação interna
  const [render, setRender] = useState("lista"); // 'lista' | 'montagem'
  const [cargas, setCargas] = useState([]);
  const [carregandoCargas, setCarregandoCargas] = useState(false);
  const [processandoAcao, setProcessandoAcao] = useState(false);

  // Filtros da listagem de cargas.
  const [filtroStatus, setFiltroStatus] = useState("");
  const [dataInicio, setDataInicio] = useState(dataFormatadaCalendario());
  const [dataFim, setDataFim] = useState(dataFormatadaCalendario());
  const [motoristaFiltroId, setMotoristaFiltroId] = useState("");
  const [veiculoFiltroId, setVeiculoFiltroId] = useState("");

  // Listas de apoio.
  const [motoristas, setMotoristas] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [vendedores, setVendedores] = useState([]);

  // Estados para Montagem de Carga.
  const [motoristaSelecionadoId, setMotoristaSelecionadoId] = useState("");
  const [veiculoSelecionadoId, setVeiculoSelecionadoId] = useState("");
  const [destino, setDestino] = useState("");
  const [descricao, setDescricao] = useState("");
  const [pedidosPendentes, setPedidosPendentes] = useState([]);
  const [pedidosSelecionadosIds, setPedidosSelecionadosIds] = useState([]);
  const [carregandoPedidos, setCarregandoPedidos] = useState(false);

  // Filtros de seleção de pedidos dentro da montagem.
  const [dataPedido, setDataPedido] = useState(dataFormatadaCalendario());
  const [vendedorPedido, setVendedorPedido] = useState("");
  const [buscaPedidoTexto, setBuscaPedidoTexto] = useState("");

  // Modal de Detalhes da Carga & Romaneio.
  const [cargaDetalhe, setCargaDetalhe] = useState(null);
  const [modalCarregamentoAberto, setModalCarregamentoAberto] = useState(false);
  const [modalAdicionarAberto, setModalAdicionarAberto] = useState(false);
  const [pedidosParaAdicionar, setPedidosParaAdicionar] = useState([]);
  const [pedidosParaAdicionarSelIds, setPedidosParaAdicionarSelIds] = useState([]);
  const [carregandoAdicionar, setCarregandoAdicionar] = useState(false);
  const [buscaAdicionarTexto, setBuscaAdicionarTexto] = useState("");
  const [imprimindoLote, setImprimindoLote] = useState(false);

  const formatarStatusCarga = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "rota" || s === "carregada" || s === "carregado") {
      return { label: "Em Rota", classe: styles.badgeRota };
    }
    if (s === "finalizada") {
      return { label: "Finalizada", classe: styles.badgeFinalizada };
    }
    return { label: "Pendente", classe: styles.badgePendente };
  };

  const isCargaPendente = (status) => {
    const s = String(status || "").toLowerCase();
    return s === "pendente" || (!s && s !== "rota" && s !== "finalizada" && s !== "carregada" && s !== "carregado");
  };

  const isCargaEmRota = (status) => {
    const s = String(status || "").toLowerCase();
    return s === "rota" || s === "carregada" || s === "carregado";
  };

  const isCargaFinalizada = (status) => {
    const s = String(status || "").toLowerCase();
    return s === "finalizada";
  };

  // Carregar motoristas, veículos e vendedores
  const carregarApoio = async () => {
    try {
      const [resM, resV, resU] = await Promise.allSettled([
        lerMotoristas(),
        lerVeiculos(),
        LerUsuario(),
      ]);

      if (resM.status === "fulfilled") {
        const listaM = Array.isArray(resM.value) ? resM.value : [];
        setMotoristas(listaM);
      }

      if (resV.status === "fulfilled") {
        const listaV = Array.isArray(resV.value) ? resV.value : [];
        setVeiculos(listaV);
      }

      if (resU.status === "fulfilled") {
        const listaU = Array.isArray(resU.value)
          ? resU.value
          : Array.isArray(resU.value?.resultado)
          ? resU.value.resultado
          : [];
        const externos = listaU.filter(
          (u) =>
            u.nivelAcesso &&
            ["EXTERNO", "ADMIN"].includes(u.nivelAcesso.toUpperCase())
        );
        setVendedores(externos);
      }
    } catch (err) {
      console.error("Erro ao carregar dados de apoio:", err);
    }
  };

  useEffect(() => {
    carregarApoio();
  }, []);

  // Buscar cargas
  const carregarCargas = async () => {
    setCarregandoCargas(true);
    try {
      const params = {};
      if (dataInicio) params.dataInicio = dataInicio;
      if (dataFim) params.dataFim = dataFim;
      if (filtroStatus) params.status = filtroStatus;
      if (motoristaFiltroId) params.motoristaId = motoristaFiltroId;
      if (veiculoFiltroId) params.veiculoId = veiculoFiltroId;

      const resultado = await lerCargas(params);
      
      setCargas(Array.isArray(resultado) ? resultado : []);
    } catch (error) {
      console.error("[Cargas] Erro ao carregar cargas:", error);
      setCargas([]);
      setMensagem(error.message || "Erro ao carregar cargas");
    } finally {
      setCarregandoCargas(false);
    }
  };

  useEffect(() => {
    carregarCargas();
  }, [filtroStatus, dataInicio, dataFim, motoristaFiltroId, veiculoFiltroId]);

  // Filtragem defensiva local das cargas carregadas por data, status, motorista e veículo
  const cargasFiltradas = cargas.filter((c) => {
    const dataCarga =
      c.criadoEm ||
      c.createdAt ||
      c.data ||
      c.dataCriacao ||
      c.dataHora ||
      c.created_at;
    const ymdCarga = extrairDataYMD(dataCarga);

    if (dataInicio && ymdCarga && ymdCarga < dataInicio) return false;
    if (dataFim && ymdCarga && ymdCarga > dataFim) return false;

    if (filtroStatus) {
      if (filtroStatus === "pendente" && !isCargaPendente(c.status)) return false;
      if (filtroStatus === "rota" && !isCargaEmRota(c.status)) return false;
      if (filtroStatus === "finalizada" && !isCargaFinalizada(c.status)) return false;
    }
    if (motoristaFiltroId) {
      const mId = String(c.motoristaId || c.motorista?.id || "");
      if (mId !== String(motoristaFiltroId)) return false;
    }
    if (veiculoFiltroId) {
      const vId = String(c.veiculoId || c.veiculo?.id || "");
      if (vId !== String(veiculoFiltroId)) return false;
    }
    return true;
  });

  // Carregar pedidos externos para montagem com filtros
  const carregarPedidosExternos = async () => {   
    setCarregandoPedidos(true); 
    try {
      const params = {
        setor: "externo",
        status: "pendente",
        semCarga: true,
      };
      if (vendedorPedido) params.vendedor = vendedorPedido;
      if (dataPedido) {
        params.dataInicio = dataPedido;
        params.dataFim = dataPedido;
      }

      console.log("[Cargas] Buscando pedidos externos com parâmetros:", params);
      const lista = await buscarPedido(params);
      console.log("[Cargas] Resposta da API buscarPedido:", lista);

      const arrayValido = Array.isArray(lista)
        ? lista
        : Array.isArray(lista?.resultado)
        ? lista.resultado
        : [];

      // Filtra estritamente para garantir que nenhum pedido já associado a carga seja exibido
      const pedidosSemCarga = arrayValido.filter(
        (p) => p.cargaId === null || p.cargaId === undefined
      );

      setPedidosPendentes(pedidosSemCarga);
    } catch (err) {
      console.error("[Cargas] Erro ao buscar pedidos externos:", err);
      setPedidosPendentes([]);
      setMensagem(err.message || "Erro ao buscar pedidos externos");
    } finally {
      setCarregandoPedidos(false);
    }
  };

  // Recarregar pedidos quando filtros de montagem mudarem
  useEffect(() => {
    if (render === "montagem") {
      carregarPedidosExternos();
    }
  }, [render, vendedorPedido, dataPedido]);

  const iniciarMontagem = () => {
    setMotoristaSelecionadoId("");
    setVeiculoSelecionadoId("");
    setDestino("");
    setDescricao("");
    setPedidosSelecionadosIds([]);
    setBuscaPedidoTexto("");
    setRender("montagem");
    carregarCargas();
    carregarApoio();
    carregarPedidosExternos();
  };

  // Alternar seleção de pedido
  const alternarSelecaoPedido = (pedidoId) => {
    setPedidosSelecionadosIds((prev) =>
      prev.includes(pedidoId)
        ? prev.filter((id) => id !== pedidoId)
        : [...prev, pedidoId]
    );
  };

  // Filtragem local dos pedidos da montagem por data, vendedor e texto (Cliente / ID)
  const pedidosMontagemFiltrados = pedidosPendentes.filter((p) => {
    if (p.cargaId !== null && p.cargaId !== undefined) return false;
    if (dataPedido) {
      const dataPed =
        p.criadoEm ||
        p.createdAt ||
        p.data ||
        p.dataHora ||
        p.dataCriacao ||
        p.created_at;
      const ymdPed = extrairDataYMD(dataPed);
      if (ymdPed && ymdPed !== dataPedido) return false;
    }
    if (vendedorPedido) {
      const vNome = (p.vendedor || p.usuario?.nome || "").toLowerCase();
      if (!vNome.includes(vendedorPedido.toLowerCase())) return false;
    }
    if (!buscaPedidoTexto.trim()) return true;
    const termo = buscaPedidoTexto.toLowerCase();
    const clienteNome = (p.cliente?.nome || p.nomeCliente || "").toLowerCase();
    const idMatch = String(p.id).includes(termo);
    const vendedorMatch = (p.vendedor || p.usuario?.nome || "").toLowerCase().includes(termo);
    return clienteNome.includes(termo) || idMatch || vendedorMatch;
  });

  // Selecionar ou desselecionar todos os pedidos visíveis
  const alternarTodosPedidos = () => {
    const idsVisiveis = pedidosMontagemFiltrados.map((p) => p.id);
    const todosVisiveisEstaoSelecionados = idsVisiveis.every((id) =>
      pedidosSelecionadosIds.includes(id)
    );

    if (todosVisiveisEstaoSelecionados) {
      setPedidosSelecionadosIds((prev) =>
        prev.filter((id) => !idsVisiveis.includes(id))
      );
    } else {
      setPedidosSelecionadosIds((prev) => [
        ...prev,
        ...idsVisiveis.filter((id) => !prev.includes(id)),
      ]);
    }
  };

  // Cálculo de peso acumulado estimado dos pedidos selecionados
  const veiculoEscolhido = veiculos.find(
    (v) => String(v.id) === String(veiculoSelecionadoId)
  );

  const calcularPesoTotalPedidosSelecionados = () => {
    return pedidosPendentes
      .filter((p) => pedidosSelecionadosIds.includes(p.id))
      .reduce((acumulador, pedido) => {
        let pesoPedido = 0;
        if (pedido.pesoTotal) {
          pesoPedido = Number(pedido.pesoTotal);
        } else if (Array.isArray(pedido.itens)) {
          pesoPedido = pedido.itens.reduce((soma, item) => {
            const pesoItem = item.produto?.peso || item.peso || 0;
            return soma + Number(pesoItem) * Number(item.quantidade || 1);
          }, 0);
        }
        return acumulador + pesoPedido;
      }, 0);
  };

  const calcularValorTotalPedidosSelecionados = () => {
    return pedidosPendentes
      .filter((p) => pedidosSelecionadosIds.includes(p.id))
      .reduce((soma, p) => soma + Number(p.total || p.valorTotal || 0), 0);
  };

  const pesoTotalEstimado = calcularPesoTotalPedidosSelecionados();
  const capacidadeVeiculo = veiculoEscolhido ? Number(veiculoEscolhido.pesoMaximo || 0) : 0;
  const porcentagemCapacidade =
    capacidadeVeiculo > 0
      ? Math.min(Math.round((pesoTotalEstimado / capacidadeVeiculo) * 100), 100)
      : 0;
  const sobrepeso = capacidadeVeiculo > 0 && pesoTotalEstimado > capacidadeVeiculo;

  // Salvar montagem da carga
  const tratarCriarCarga = async () => {
    if (!veiculoSelecionadoId || !motoristaSelecionadoId) {
      setMensagem("Selecione o motorista e o veículo da carga.");
      return;
    }

    if (pedidosSelecionadosIds.length === 0) {
      setMensagem("Selecione ao menos um pedido para a carga.");
      return;
    }

    try {
      setProcessandoAcao(true);
      const payload = {
        veiculoId: Number(veiculoSelecionadoId),
        motoristaId: Number(motoristaSelecionadoId),
        destino: destino.trim() || undefined,
        descricao: descricao.trim() || undefined,
        pedidosIds: pedidosSelecionadosIds,
      };

      console.log("[Cargas] Enviando criação de carga:", payload);
      const resposta = await criarCarga(payload);
      console.log("[Cargas] Resposta de criação de carga:", resposta);

      setMensagem("Carga montada com sucesso!");
      setRender("lista");
      await carregarCargas();
    } catch (error) {
      console.error("[Cargas] Erro ao criar carga:", error);
      setMensagem(error.message || "Erro ao criar carga");
    } finally {
      setProcessandoAcao(false);
    }
  };

  // Despachar carga para rota (pendente -> rota)
  const tratarFinalizarCarga = async (cargaId) => {
    try {
      setProcessandoAcao(true);
      await finalizarCarga(cargaId);
      setMensagem("Carga despachada para rota de entrega com sucesso!");
      await carregarCargas();
      if (cargaDetalhe && String(cargaDetalhe.id) === String(cargaId)) {
        setCargaDetalhe((prev) => ({ ...prev, status: "rota" }));
      }
    } catch (error) {
      setMensagem(error.message || "Erro ao despachar carga para rota");
    } finally {
      setProcessandoAcao(false);
    }
  };

  // Redirecionar para a tela de Fechamento da Carga com o motorista
  const tratarIniciarFechamentoCarga = (cargaObj) => {
    if (!cargaObj) return;
    navegar("/fechamento-carga", { state: { carga: cargaObj } });
  };

  // Concluir/Finalizar carga (rota -> finalizada) - gera as pendências de VALE
  const tratarConcluirCarga = async (cargaId) => {
    try {
      setProcessandoAcao(true);
      await concluirCarga(cargaId);
      setMensagem(`Carga #${cargaId} finalizada com sucesso! Pendências de 'VALE' foram geradas.`);
      await carregarCargas();
      if (cargaDetalhe && String(cargaDetalhe.id) === String(cargaId)) {
        setCargaDetalhe((prev) => ({ ...prev, status: "finalizada" }));
      }
    } catch (error) {
      console.error("Erro ao concluir carga:", error);
      setMensagem(error.message || "Erro ao concluir carga");
    } finally {
      setProcessandoAcao(false);
    }
  };

  // Retornar carga para pendente (rota -> pendente)
  const tratarRetornarCargaPendente = async (cargaId) => {
    try {
      setProcessandoAcao(true);
      await retornarCargaPendente(cargaId);
      setMensagem(`Carga #${cargaId} retornada para o status 'pendente' com sucesso! Agora você pode adicionar ou remover pedidos.`);
      await carregarCargas();
      if (cargaDetalhe && String(cargaDetalhe.id) === String(cargaId)) {
        setCargaDetalhe((prev) => ({ ...prev, status: "pendente" }));
      }
    } catch (error) {
      console.error("Erro ao retornar carga para pendente:", error);
      setMensagem(error.message || "Erro ao retornar carga para pendente");
    } finally {
      setProcessandoAcao(false);
    }
  };

  // Formatar pedido para cupom térmico (utilitário de impressão)
  const formatarPedidoParaCupom = (pedido) => {
    const itensFormatados = Array.isArray(pedido.itens)
      ? pedido.itens.map((it) => ({
          quantidade: Number(it.quantidade || 1),
          nome: it.produto?.nome || it.nomeProduto || it.nome || "Produto",
          valorUnit: Number(it.valorUnit || it.precoVenda || it.valor || 0),
        }))
      : [];

    return {
      tipo: "viaNormal",
      data: pedido.criadoEm || pedido.createdAt || new Date(),
      cliente: pedido.cliente?.nome || pedido.nomeCliente || "Cliente não informado",
      endereco: pedido.cliente?.endereco || pedido.endereco || "",
      cidade: pedido.cliente?.cidade || pedido.cidade || "",
      telefone: pedido.cliente?.telefone || pedido.telefone || "",
      referencia: pedido.cliente?.referencia || pedido.referencia || "",
      nomeUsuario: pedido.vendedor || pedido.usuario?.nome || "Vendedor",
      formaPagamento:
        pedido.formaPagamento?.nome ||
        pedido.formaPagamentoNome ||
        pedido.formaPagamento ||
        "Não informado",
      itens: itensFormatados,
    };
  };

  // Impressão direta do Romaneio de Carga
  const tratarImprimirRomaneio = () => {
    if (!cargaDetalhe) return;
    try {
      if (!window.IMPRESSORA || typeof window.IMPRESSORA.imprimir !== "function") {
        setMensagem("Interface de impressão não disponível nesta plataforma.");
        return;
      }
      const html = gerarRomaneioCargaHTML(cargaDetalhe);
      window.IMPRESSORA.imprimir(html);
      setMensagem(`Romaneio da Carga #${cargaDetalhe.id} enviado para impressão!`);
    } catch (error) {
      console.error("Erro ao imprimir romaneio:", error);
      setMensagem("Erro ao imprimir romaneio da carga.");
    }
  };

  // Impressão do Relatório de Carregamento da Carga
  const tratarImprimirRelatorioCarregamento = () => {
    if (!cargaDetalhe) return;
    try {
      if (!window.IMPRESSORA || typeof window.IMPRESSORA.imprimir !== "function") {
        setMensagem("Interface de impressão não disponível nesta plataforma.");
        return;
      }
      const html = gerarRelatorioCarregamentoHTML(cargaDetalhe);
      window.IMPRESSORA.imprimir(html);
      setMensagem(`Relatório de Carregamento da Carga #${cargaDetalhe.id} enviado para impressão!`);
    } catch (error) {
      console.error("Erro ao imprimir relatório de carregamento:", error);
      setMensagem("Erro ao imprimir relatório de carregamento.");
    }
  };

  // Impressão sequencial de todos os pedidos da carga
  const tratarImprimirTodosPedidos = async () => {
    if (!cargaDetalhe || !Array.isArray(cargaDetalhe.pedidos) || cargaDetalhe.pedidos.length === 0) {
      setMensagem("Nenhum pedido vinculado a esta carga para imprimir.");
      return;
    }

    if (!window.IMPRESSORA || typeof window.IMPRESSORA.imprimir !== "function") {
      setMensagem("Interface de impressão não disponível nesta plataforma.");
      return;
    }

    try {
      setImprimindoLote(true);
      setMensagem(`Iniciando impressão de ${cargaDetalhe.pedidos.length} pedidos...`);

      for (let i = 0; i < cargaDetalhe.pedidos.length; i++) {
        const ped = cargaDetalhe.pedidos[i];
        const payloadCupom = formatarPedidoParaCupom(ped);
        const html = gerarCupomExterno(payloadCupom);
        window.IMPRESSORA.imprimir(html);

        // Intervalo sequencial para a fila de impressão térmica
        if (i < cargaDetalhe.pedidos.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 700));
        }
      }

      setMensagem(`Todos os ${cargaDetalhe.pedidos.length} comprovantes foram impressos com sucesso!`);
    } catch (error) {
      console.error("Erro na impressão sequencial:", error);
      setMensagem("Erro ao realizar impressão dos pedidos da carga.");
    } finally {
      setImprimindoLote(false);
    }
  };

  // Impressão individual de comprovante de pedido
  const tratarImprimirPedidoIndividual = (ped) => {
    try {
      if (!window.IMPRESSORA || typeof window.IMPRESSORA.imprimir !== "function") {
        setMensagem("Interface de impressão não disponível nesta plataforma.");
        return;
      }
      const payloadCupom = formatarPedidoParaCupom(ped);
      const html = gerarCupomExterno(payloadCupom);
      window.IMPRESSORA.imprimir(html);
      setMensagem(`Comprovante do Pedido #${ped.id} enviado para impressão!`);
    } catch (error) {
      console.error("Erro ao imprimir pedido:", error);
      setMensagem("Erro ao imprimir comprovante do pedido.");
    }
  };

  // Cancelar a carga inteira e retornar pedidos para pendente
  const tratarCancelarCarga = async (cargaId) => {
    try {
      setProcessandoAcao(true);
      await cancelarCarga(cargaId);
      setMensagem(`Carga #${cargaId} cancelada com sucesso! Os pedidos voltaram para o status 'pendente'.`);
      setCargaDetalhe(null);
      await carregarCargas();
    } catch (error) {
      console.error("Erro ao cancelar carga:", error);
      setMensagem(error.message || "Erro ao cancelar carga");
    } finally {
      setProcessandoAcao(false);
    }
  };

  // Remover pedido individual da carga
  const tratarRemoverPedidoCarga = async (pedidoId) => {
    if (!cargaDetalhe) return;
    try {
      setProcessandoAcao(true);
      await removerPedidoCarga(cargaDetalhe.id, pedidoId);
      setMensagem(`Pedido #${pedidoId} removido da carga com sucesso!`);

      const params = {};
      if (dataInicio) params.dataInicio = dataInicio;
      if (dataFim) params.dataFim = dataFim;
      const cargasAtualizadas = await lerCargas(params);

      const cargaAtualizada = (
        Array.isArray(cargasAtualizadas) ? cargasAtualizadas : []
      ).find((c) => String(c.id) === String(cargaDetalhe.id));

      if (cargaAtualizada) {
        setCargaDetalhe(cargaAtualizada);
      } else {
        const pedidosAtualizados = (cargaDetalhe.pedidos || []).filter(
          (p) => String(p.id) !== String(pedidoId)
        );

        setCargaDetalhe((prev) => ({
          ...prev,
          pedidos: pedidosAtualizados,
          quantidadePedidos: pedidosAtualizados.length,
        }));
      }

      await carregarCargas();
    } catch (error) {
      console.error("Erro ao remover pedido da carga:", error);
      setMensagem(error.message || "Erro ao remover pedido da carga");
    } finally {
      setProcessandoAcao(false);
    }
  };

  // Abrir painel para adicionar mais pedidos pendentes à carga
  const tratarAbrirAdicionarPedidos = async () => {
    setModalAdicionarAberto(true);
    setPedidosParaAdicionarSelIds([]);
    setBuscaAdicionarTexto("");
    setCarregandoAdicionar(true);
    try {
      const lista = await buscarPedido({
        setor: "externo",
        status: "pendente",
        semCarga: true,
      });
      const arrayValido = Array.isArray(lista)
        ? lista
        : Array.isArray(lista?.resultado)
        ? lista.resultado
        : [];
      // Garante que apenas pedidos sem nenhuma carga sejam adicionáveis
      const pedidosDisponiveis = arrayValido.filter(
        (p) => p.cargaId === null || p.cargaId === undefined
      );
      setPedidosParaAdicionar(pedidosDisponiveis);
    } catch (error) {
      console.error("Erro ao buscar pedidos pendentes:", error);
      setPedidosParaAdicionar([]);
      setMensagem("Erro ao buscar pedidos pendentes disponíveis");
    } finally {
      setCarregandoAdicionar(false);
    }
  };

  const alternarSelecaoPedidoParaAdicionar = (pedidoId) => {
    setPedidosParaAdicionarSelIds((prev) =>
      prev.includes(pedidoId)
        ? prev.filter((id) => id !== pedidoId)
        : [...prev, pedidoId]
    );
  };

  // Confirmar adição dos pedidos selecionados à carga
  const tratarConfirmarAdicaoPedidos = async () => {
    if (pedidosParaAdicionarSelIds.length === 0) {
      setMensagem("Selecione ao menos um pedido para adicionar.");
      return;
    }

    try {
      setProcessandoAcao(true);
      await adicionarPedidosCarga(cargaDetalhe.id, pedidosParaAdicionarSelIds);
      setMensagem(`${pedidosParaAdicionarSelIds.length} pedidos adicionados à carga com sucesso!`);
      setModalAdicionarAberto(false);

      const params = {};
      if (dataInicio) params.dataInicio = dataInicio;
      if (dataFim) params.dataFim = dataFim;
      const cargasAtualizadas = await lerCargas(params);

      const cargaAtualizada = (
        Array.isArray(cargasAtualizadas) ? cargasAtualizadas : []
      ).find((c) => String(c.id) === String(cargaDetalhe.id));

      if (cargaAtualizada) {
        setCargaDetalhe(cargaAtualizada);
      } else {
        const pedidosAdicionados = pedidosParaAdicionar.filter((p) =>
          pedidosParaAdicionarSelIds.includes(p.id)
        );
        setCargaDetalhe((prev) => ({
          ...prev,
          pedidos: [...(prev.pedidos || []), ...pedidosAdicionados],
          quantidadePedidos: (prev.pedidos?.length || 0) + pedidosAdicionados.length,
        }));
      }

      await carregarCargas();
    } catch (error) {
      console.error("Erro ao adicionar pedidos à carga:", error);
      setMensagem(error.message || "Erro ao adicionar pedidos à carga");
    } finally {
      setProcessandoAcao(false);
    }
  };

  return (
    <div className={styles.container}>
      <ToastRadix mensagem={mensagem} />
      <Cabecalho />

      <main className={styles.principal}>
        {/* CABEÇALHO DA PÁGINA */}
        <div className={styles.tituloSection}>
          <div className={styles.containerTitulo}>
            <div className={styles.iconeWrapper}>
              <Package size={24} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Logística Externa</p>
              <h1 className={styles.pageTitulo}>
                {render === "lista" ? "Cargas & Romaneios" : "Montagem de Nova Carga"}
              </h1>
            </div>
          </div>

          <button
            className={styles.botaoVoltar}
            onClick={() => {
              if (render === "lista") {
                navegar("/menu");
              } else {
                setRender("lista");
              }
            }}
          >
            <ArrowLeft size={14} weight="bold" />
            Voltar
          </button>
        </div>

        {/* MODO LISTA */}
        {render === "lista" && (
          <div className={styles.conteudoWrapper}>
            {/* PAINEL DE FILTROS */}
            <div className={styles.painelFiltros}>
              <div className={styles.filtrosHeader}>
                <Funnel size={16} weight="bold" />
                <span>Filtros de Cargas</span>
              </div>

              <div className={styles.filtrosGrid}>
                {/* DATA INICIAL */}
                <div className={styles.filtroGrupo}>
                  <label className={styles.filtroLabel}>
                    <CalendarBlank size={13} weight="bold" />
                    Data inicial
                  </label>
                  <input
                    className={styles.inputFiltro}
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>

                {/* DATA FINAL */}
                <div className={styles.filtroGrupo}>
                  <label className={styles.filtroLabel}>
                    <CalendarBlank size={13} weight="bold" />
                    Data final
                  </label>
                  <div className={styles.dataFimGroup}>
                    <input
                      className={styles.inputFiltro}
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                    />
                    <button
                      className={styles.botaoHoje}
                      onClick={() => {
                        const hoje = dataFormatadaCalendario();
                        setDataInicio(hoje);
                        setDataFim(hoje);
                      }}
                      type="button"
                      title="Filtrar cargas de hoje"
                    >
                      Hoje
                    </button>
                    <button
                      className={styles.botaoHoje}
                      onClick={() => {
                        setDataInicio("");
                        setDataFim("");
                      }}
                      type="button"
                      title="Ver todas as cargas sem filtro de data"
                      style={{ background: "#e9ecef", color: "#495057", borderColor: "#ced4da" }}
                    >
                      Todas
                    </button>
                  </div>
                </div>

                {/* STATUS */}
                <div className={styles.filtroGrupo}>
                  <label className={styles.filtroLabel}>Status</label>
                  <select
                    className={styles.selectFiltro}
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                  >
                    <option value="">Todos os status</option>
                    <option value="pendente">Pendente</option>
                    <option value="rota">Em Rota</option>
                    <option value="finalizada">Finalizada</option>
                  </select>
                </div>

                {/* MOTORISTA */}
                <div className={styles.filtroGrupo}>
                  <label className={styles.filtroLabel}>Motorista</label>
                  <select
                    className={styles.selectFiltro}
                    value={motoristaFiltroId}
                    onChange={(e) => setMotoristaFiltroId(e.target.value)}
                  >
                    <option value="">Todos os motoristas</option>
                    {motoristas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* VEÍCULO */}
                <div className={styles.filtroGrupo}>
                  <label className={styles.filtroLabel}>Veículo</label>
                  <select
                    className={styles.selectFiltro}
                    value={veiculoFiltroId}
                    onChange={(e) => setVeiculoFiltroId(e.target.value)}
                  >
                    <option value="">Todos os veículos</option>
                    {veiculos.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nome} ({v.placa})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* BARRA DE AÇÃO */}
            <div className={styles.cabecalhoPage}>
              <span className={styles.badgeContador}>
                {cargasFiltradas.length}{" "}
                {cargasFiltradas.length === 1
                  ? "carga encontrada"
                  : "cargas encontradas"}
              </span>

              <button className={styles.botaoNovo} onClick={iniciarMontagem}>
                <PlusCircle size={18} weight="bold" />
                Montar Nova Carga
              </button>
            </div>

            {/* TABELA DE CARGAS */}
            <div className={styles.card}>
              {carregandoCargas ? (
                <div className={styles.estadoVazio}>
                  <Spinner />
                  <p>Carregando cargas...</p>
                </div>
              ) : cargasFiltradas.length === 0 ? (
                <div className={styles.estadoVazio}>
                  <Package size={48} weight="duotone" className={styles.iconeVazio} />
                  <p>Nenhuma carga encontrada no período</p>
                  <span>Ajuste os filtros ou crie uma nova carga de entrega</span>
                </div>
              ) : (
                <div className={styles.tabelaWrapper}>
                  <div className={`${styles.tituloLista} ${styles.gridCargas}`}>
                    <span>ID</span>
                    <span>Data/Hora</span>
                    <span>Motorista</span>
                    <span>Veículo / Placa</span>
                    <span>Destino</span>
                    <span>Pedidos</span>
                    <span>Peso Total</span>
                    <span>Status</span>
                    <span style={{ textAlign: "center" }}>Ações</span>
                  </div>

                  <div className={styles.lista}>
                    {cargasFiltradas.map((c) => {
                      const statusInfo = formatarStatusCarga(c.status);
                      const podeDespachar = isCargaPendente(c.status);

                      return (
                        <div key={c.id} className={`${styles.itemRow} ${styles.gridCargas}`}>
                          <span className={styles.idCell}>#{c.id}</span>
                          <span>
                            {dataHoraFormatada(
                              c.criadoEm ||
                                c.createdAt ||
                                c.data ||
                                c.dataCriacao ||
                                c.dataHora ||
                                c.created_at
                            )}
                          </span>
                          <span className={styles.destaqueTexto}>
                            {c.motorista?.nome || `Motorista #${c.motoristaId}`}
                          </span>
                          <span>
                            {c.veiculo?.nome || "Veículo"}{" "}
                            <strong className={styles.placaTag}>
                              ({c.veiculo?.placa || "-"})
                            </strong>
                          </span>
                          <span>{c.destino || "-"}</span>
                          <span className={styles.pedidosCount}>
                            {c.pedidos?.length || c.quantidadePedidos || 0} pedidos
                          </span>
                          <span className={styles.pesoTexto}>
                            {c.pesoTotal ? `${Number(c.pesoTotal).toLocaleString("pt-BR")} kg` : "-"}
                          </span>
                          <span>
                            <span
                              className={`${styles.badgeStatusCarga} ${statusInfo.classe}`}
                            >
                              {statusInfo.label}
                            </span>
                          </span>
                          <span className={styles.colunaAcoes}>
                            {/* BOTÃO DETALHES / ROMANEIO (Apenas o olho na listagem) */}
                            <button
                              className={styles.botaoVisualizar}
                              onClick={() => setCargaDetalhe(c)}
                              title="Ver romaneio e detalhes da carga"
                            >
                              <Eye size={16} weight="bold" />
                            </button>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODO MONTAGEM DE CARGA */}
        {render === "montagem" && (
          <div className={styles.montagemWrapper}>
            {/* CARD SUPERIOR: MOTORISTA, VEÍCULO E INFORMAÇÕES */}
            <div className={styles.cardMontagemTop}>
              <div className={styles.montagemHeader}>
                <Truck size={20} weight="fill" className={styles.iconeMontagem} />
                <h2>Definições da Carga & Transporte</h2>
              </div>

              <div className={styles.gridSelecaoTransporte}>
                {/* MOTORISTA */}
                <div className={styles.grupoInput}>
                  <label className={styles.labelCampo}>
                    <User size={14} weight="bold" />
                    Motorista Responsável *
                  </label>
                  <select
                    className={styles.selectInput}
                    value={motoristaSelecionadoId}
                    onChange={(e) => setMotoristaSelecionadoId(e.target.value)}
                  >
                    <option value="">Selecione um motorista...</option>
                    {motoristas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome} {m.telefone ? `(${m.telefone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* VEÍCULO */}
                <div className={styles.grupoInput}>
                  <label className={styles.labelCampo}>
                    <Truck size={14} weight="bold" />
                    Veículo da Frota *
                  </label>
                  <select
                    className={styles.selectInput}
                    value={veiculoSelecionadoId}
                    onChange={(e) => setVeiculoSelecionadoId(e.target.value)}
                  >
                    <option value="">Selecione um veículo...</option>
                    {veiculos.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nome} - {v.placa} (Capacidade: {v.pesoMaximo} kg)
                      </option>
                    ))}
                  </select>
                </div>

                {/* DESTINO */}
                <div className={styles.grupoInput}>
                  <label className={styles.labelCampo}>
                    <MapPin size={14} weight="bold" />
                    Destino / Região / Bairro
                  </label>
                  <input
                    className={styles.textInput}
                    type="text"
                    placeholder="Ex: Rota Norte / Centro e Bairros"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                  />
                </div>

                {/* OBSERVAÇÕES */}
                <div className={styles.grupoInput}>
                  <label className={styles.labelCampo}>
                    <FileText size={14} weight="bold" />
                    Observações
                  </label>
                  <input
                    className={styles.textInput}
                    type="text"
                    placeholder="Instruções adicionais..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                  />
                </div>
              </div>

              {/* CARD DE CAPACIDADE & PESO COMPARATIVO */}
              {veiculoEscolhido && (
                <div
                  className={`${styles.cardCapacidade} ${
                    sobrepeso ? styles.cardSobrepeso : ""
                  }`}
                >
                  <div className={styles.capacidadeInfo}>
                    <div className={styles.capacidadeTexto}>
                      <Scales size={18} weight="bold" />
                      <span>
                        Peso Selecionado:{" "}
                        <strong>{pesoTotalEstimado.toLocaleString("pt-BR")} kg</strong> /{" "}
                        Capacidade do Veículo:{" "}
                        <strong>{capacidadeVeiculo.toLocaleString("pt-BR")} kg</strong>
                      </span>
                    </div>

                    <span className={styles.porcentagemBadge}>
                      {capacidadeVeiculo > 0
                        ? `${Math.round((pesoTotalEstimado / capacidadeVeiculo) * 100)}% ocupado`
                        : "0%"}
                    </span>
                  </div>

                  <div className={styles.barraProgressoBg}>
                    <div
                      className={`${styles.barraProgressoFill} ${
                        sobrepeso ? styles.barraProgressoSobrepeso : ""
                      }`}
                      style={{ width: `${Math.min(porcentagemCapacidade, 100)}%` }}
                    />
                  </div>

                  {sobrepeso && (
                    <div className={styles.avisoSobrepeso}>
                      <Warning size={16} weight="bold" />
                      <span>Atenção: O peso dos pedidos selecionados excede a capacidade do veículo!</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SELEÇÃO DE PEDIDOS COM PAINEL DE FILTROS */}
            <div className={styles.cardPedidosSelecao}>
              {/* FILTROS INTERNOS DA MONTAGEM */}
              <div className={styles.painelFiltrosMontagem}>
                <div className={styles.filtrosHeader}>
                  <Funnel size={15} weight="bold" />
                  <span>Filtros de Pedidos Externos Pendentes</span>
                </div>

                <div className={styles.gridFiltrosMontagem}>
                  {/* BUSCA CLIENTE / ID */}
                  <div className={styles.filtroGrupo}>
                    <label className={styles.filtroLabel}>
                      <MagnifyingGlass size={12} weight="bold" />
                      Nome do Cliente ou ID
                    </label>
                    <input
                      className={styles.inputFiltro}
                      type="text"
                      placeholder="Buscar cliente ou #ID..."
                      value={buscaPedidoTexto}
                      onChange={(e) => setBuscaPedidoTexto(e.target.value)}
                    />
                  </div>

                  {/* VENDEDOR */}
                  <div className={styles.filtroGrupo}>
                    <label className={styles.filtroLabel}>
                      <User size={12} weight="bold" />
                      Vendedor
                    </label>
                    <select
                      className={styles.selectFiltro}
                      value={vendedorPedido}
                      onChange={(e) => setVendedorPedido(e.target.value)}
                    >
                      <option value="">Todos os vendedores</option>
                      {vendedores.map((v) => (
                        <option key={v.id} value={v.nome}>
                          {v.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* DATA DO PEDIDO */}
                  <div className={styles.filtroGrupo}>
                    <label className={styles.filtroLabel}>
                      <CalendarBlank size={12} weight="bold" />
                      Data do Pedido
                    </label>
                    <div className={styles.dataFimGroup}>
                      <input
                        className={styles.inputFiltro}
                        type="date"
                        value={dataPedido}
                        onChange={(e) => setDataPedido(e.target.value)}
                      />
                      <button
                        className={styles.botaoHoje}
                        onClick={() => setDataPedido(dataFormatadaCalendario())}
                        type="button"
                        title="Filtrar pedidos de hoje"
                      >
                        Hoje
                      </button>
                      <button
                        className={styles.botaoHoje}
                        onClick={() => setDataPedido("")}
                        type="button"
                        title="Ver pedidos de qualquer data"
                        style={{ background: "#e9ecef", color: "#495057", borderColor: "#ced4da" }}
                      >
                        Todas
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* BARRA DE SELEÇÃO E CONTADOR */}
              <div className={styles.pedidosHeader}>
                <div className={styles.pedidosHeaderEsq}>
                  <h3>Lista de Pedidos ({pedidosMontagemFiltrados.length})</h3>
                  <span className={styles.contadorPedidosSel}>
                    {pedidosSelecionadosIds.length} selecionados no total (Valor Selecionado:{" "}
                    {formatarMoeda(calcularValorTotalPedidosSelecionados())})
                  </span>
                </div>

                <button
                  type="button"
                  className={styles.botaoSelecionarTodos}
                  onClick={alternarTodosPedidos}
                >
                  {pedidosMontagemFiltrados.length > 0 &&
                  pedidosMontagemFiltrados.every((p) =>
                    pedidosSelecionadosIds.includes(p.id)
                  ) ? (
                    <>
                      <CheckSquare size={16} weight="bold" /> Desmarcar Visíveis
                    </>
                  ) : (
                    <>
                      <Square size={16} weight="bold" /> Selecionar Visíveis
                    </>
                  )}
                </button>
              </div>

              {carregandoPedidos ? (
                <div className={styles.estadoVazio}>
                  <Spinner />
                  <p>Carregando pedidos externos...</p>
                </div>
              ) : pedidosMontagemFiltrados.length === 0 ? (
                <div className={styles.estadoVazio}>
                  <Info size={44} weight="duotone" className={styles.iconeVazio} />
                  <p>Nenhum pedido encontrado com os filtros informados</p>
                </div>
              ) : (
                <div className={styles.tabelaWrapper}>
                  <div className={`${styles.tituloLista} ${styles.gridPedidosSel}`}>
                    <span style={{ textAlign: "center" }}>Sel.</span>
                    <span>Pedido</span>
                    <span>Data/Hora</span>
                    <span>Cliente</span>
                    <span>Forma Pagamento</span>
                    <span>Vendedor</span>
                    <span>Valor Total</span>
                  </div>

                  <div className={styles.lista}>
                    {pedidosMontagemFiltrados.map((p) => {
                      const isChecked = pedidosSelecionadosIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          className={`${styles.itemRow} ${styles.gridPedidosSel} ${
                            isChecked ? styles.rowSelecionada : ""
                          }`}
                          onClick={() => alternarSelecaoPedido(p.id)}
                        >
                          <span style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className={styles.checkbox}
                            />
                          </span>
                          <span className={styles.idCell}>#{p.id}</span>
                          <span>{dataHoraFormatada(p.criadoEm || p.createdAt || p.data)}</span>
                          <span className={styles.destaqueTexto}>
                            {p.cliente?.nome || p.nomeCliente || "Cliente não informado"}
                          </span>
                          <span>{p.formaPagamento?.nome || p.formaPagamentoNome || "-"}</span>
                          <span>{p.vendedor || p.usuario?.nome || "-"}</span>
                          <span className={styles.valorDestaque}>
                            {formatarMoeda(p.total || p.valorTotal || 0)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AÇÕES DE MONTAGEM */}
              <div className={styles.acoesMontagem}>
                <button
                  className={styles.botaoCancelar}
                  type="button"
                  onClick={() => setRender("lista")}
                >
                  <X size={15} weight="bold" />
                  Cancelar
                </button>

                <AlertaRadix
                  titulo="Confirmar Montagem de Carga"
                  descricao={`Deseja montar esta carga com ${pedidosSelecionadosIds.length} pedidos vinculados ao motorista e veículo selecionados?`}
                  tratar={tratarCriarCarga}
                  confirmarTexto="Montar Carga"
                  cancelarTexto="Voltar"
                  trigger={
                    <button
                      className={styles.botaoConfirmarCarga}
                      type="button"
                      disabled={processandoAcao || pedidosSelecionadosIds.length === 0}
                    >
                      <CheckCircle size={16} weight="fill" />
                      Criar & Montar Carga
                    </button>
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE DETALHES DO ROMANEIO DA CARGA */}
        {cargaDetalhe && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              {/* CABEÇALHO DO MODAL */}
              <div className={styles.modalHeader}>
                <div>
                  <p className={styles.modalSubtitulo}>Romaneio da Carga</p>
                  <h2 className={styles.modalTitulo}>Carga #{cargaDetalhe.id}</h2>
                </div>

                <div className={styles.modalHeaderRight}>
                  {/* IMPRIMIR ROMANEIO */}
                  <button
                    type="button"
                    className={styles.botaoAcaoImprimirRomaneio}
                    onClick={tratarImprimirRomaneio}
                    title="Imprimir Romaneio da Carga na impressora térmica"
                  >
                    <Printer size={16} weight="bold" />
                    Romaneio
                  </button>

                  {/* RELATÓRIO DE CARREGAMENTO */}
                  <button
                    type="button"
                    className={styles.botaoAcaoCarregamento}
                    onClick={() => setModalCarregamentoAberto(true)}
                    title="Visualizar e imprimir relatório consolidado de produtos para carregamento"
                  >
                    <ClipboardText size={16} weight="bold" />
                    Relatório de Carregamento
                  </button>

                  {/* IMPRIMIR TODOS OS PEDIDOS */}
                  <button
                    type="button"
                    className={styles.botaoAcaoImprimirTodos}
                    onClick={tratarImprimirTodosPedidos}
                    disabled={imprimindoLote || !cargaDetalhe.pedidos?.length}
                    title="Imprimir comprovantes de todos os pedidos sequencialmente"
                  >
                    <Receipt size={16} weight="bold" />
                    {imprimindoLote ? "Imprimindo..." : "Imprimir Pedidos"}
                  </button>

                  {/* ADICIONAR PEDIDOS */}
                  {isCargaPendente(cargaDetalhe.status) && (
                    <button
                      type="button"
                      className={styles.botaoAcaoAdicionar}
                      onClick={tratarAbrirAdicionarPedidos}
                      title="Adicionar mais pedidos pendentes a esta carga"
                    >
                      <Plus size={16} weight="bold" />
                      Adicionar Pedidos
                    </button>
                  )}

                  {/* CANCELAR CARGA */}
                  {isCargaPendente(cargaDetalhe.status) && (
                    <AlertaRadix
                      titulo="Cancelar Carga"
                      descricao={`Deseja realmente cancelar a Carga #${cargaDetalhe.id}? Todos os ${
                        cargaDetalhe.pedidos?.length || 0
                      } pedidos vinculados voltarão para o status "pendente".`}
                      tratar={() => tratarCancelarCarga(cargaDetalhe.id)}
                      confirmarTexto="Sim, Cancelar Carga"
                      cancelarTexto="Voltar"
                      trigger={
                        <button
                          type="button"
                          className={styles.botaoCancelarCarga}
                          title="Cancelar carga e devolver pedidos para pendente"
                          disabled={processandoAcao}
                        >
                          <Trash size={16} weight="bold" />
                          Cancelar Carga
                        </button>
                      }
                    />
                  )}

                  <button
                    className={styles.modalCloseBtn}
                    onClick={() => {
                      setCargaDetalhe(null);
                      setModalAdicionarAberto(false);
                    }}
                    title="Fechar Romaneio"
                  >
                    <X size={20} weight="bold" />
                  </button>
                </div>
              </div>

              {/* AVISO DE MÁQUINA DE CARTÃO */}
              <div
                className={`${styles.avisoCartaoModal} ${
                  (cargaDetalhe.pedidos || []).some((p) => {
                    const nome = (
                      p.formaPagamento?.nome ||
                      p.formaPagamentoNome ||
                      p.formaPagamento ||
                      ""
                    ).toLowerCase();
                    return (
                      nome.includes("cart") ||
                      nome.includes("crédito") ||
                      nome.includes("credito") ||
                      nome.includes("débito") ||
                      nome.includes("debito")
                    );
                  })
                    ? styles.avisoCartaoSim
                    : styles.avisoCartaoNao
                }`}
              >
                <CreditCard size={18} weight="bold" />
                <span>
                  {(cargaDetalhe.pedidos || []).some((p) => {
                    const nome = (
                      p.formaPagamento?.nome ||
                      p.formaPagamentoNome ||
                      p.formaPagamento ||
                      ""
                    ).toLowerCase();
                    return (
                      nome.includes("cart") ||
                      nome.includes("crédito") ||
                      nome.includes("credito") ||
                      nome.includes("débito") ||
                      nome.includes("debito")
                    );
                  })
                    ? "LEVAR MÁQUINA DE CARTÃO: SIM 💳 (Há pedidos com pagamento em Cartão)"
                    : "LEVAR MÁQUINA DE CARTÃO: NÃO (Nenhum pedido em Cartão)"}
                </span>
              </div>

              {/* GRID DE INFORMAÇÕES DA CARGA */}
              <div className={styles.modalInfoGrid}>
                <div className={styles.modalInfoItem}>
                  <span>Motorista:</span>
                  <strong>{cargaDetalhe.motorista?.nome || `Motorista #${cargaDetalhe.motoristaId || "-"}`}</strong>
                </div>
                <div className={styles.modalInfoItem}>
                  <span>Veículo / Placa:</span>
                  <strong>
                    {cargaDetalhe.veiculo?.nome || "Veículo"} ({cargaDetalhe.veiculo?.placa || "-"})
                  </strong>
                </div>
                <div className={styles.modalInfoItem}>
                  <span>Destino / Região:</span>
                  <strong>{cargaDetalhe.destino || "-"}</strong>
                </div>
                <div className={styles.modalInfoItem}>
                  <span>Qtd. de Pedidos:</span>
                  <strong>{cargaDetalhe.pedidos?.length || 0} pedidos</strong>
                </div>
                <div className={styles.modalInfoItem}>
                  <span>Peso Total:</span>
                  <strong>
                    {cargaDetalhe.pesoTotal ? `${Number(cargaDetalhe.pesoTotal).toLocaleString("pt-BR")} kg` : "-"}
                  </strong>
                </div>
                <div className={styles.modalInfoItem}>
                  <span>Status:</span>
                  <span
                    className={`${styles.badgeStatusCarga} ${
                      formatarStatusCarga(cargaDetalhe.status).classe
                    }`}
                  >
                    {formatarStatusCarga(cargaDetalhe.status).label}
                  </span>
                </div>
              </div>

              {/* SEÇÃO DE PEDIDOS DO ROMANEIO */}
              <div className={styles.modalPedidosWrapper}>
                {/* PAINEL DE ADICIONAR PEDIDOS PENDENTES (SE ABERTO) */}
                {modalAdicionarAberto && (
                  <div className={styles.painelAdicionarPedidos}>
                    <div className={styles.painelAdicionarHeader}>
                      <span className={styles.painelAdicionarTitulo}>
                        Adicionar Pedidos Pendentes à Carga
                      </span>
                      <button
                        type="button"
                        className={styles.modalCloseBtn}
                        onClick={() => setModalAdicionarAberto(false)}
                      >
                        <X size={16} weight="bold" />
                      </button>
                    </div>

                    <input
                      type="text"
                      className={styles.inputBuscaAdicionar}
                      placeholder="Buscar por cliente ou #ID..."
                      value={buscaAdicionarTexto}
                      onChange={(e) => setBuscaAdicionarTexto(e.target.value)}
                    />

                    {carregandoAdicionar ? (
                      <div className={styles.estadoVazio} style={{ padding: "20px" }}>
                        <Spinner />
                        <p style={{ margin: 0, fontSize: "12px" }}>Buscando pedidos pendentes...</p>
                      </div>
                    ) : pedidosParaAdicionar.length === 0 ? (
                      <p className={styles.semPedidosModal}>
                        Nenhum pedido externo pendente disponível.
                      </p>
                    ) : (
                      <div className={styles.listaPedidosParaAdicionar}>
                        {pedidosParaAdicionar
                          .filter((p) => {
                            if (!buscaAdicionarTexto.trim()) return true;
                            const termo = buscaAdicionarTexto.toLowerCase();
                            const nome = (p.cliente?.nome || p.nomeCliente || "").toLowerCase();
                            return nome.includes(termo) || String(p.id).includes(termo);
                          })
                          .map((p) => {
                            const isSel = pedidosParaAdicionarSelIds.includes(p.id);
                            return (
                              <div
                                key={p.id}
                                className={`${styles.itemPedidoAdicionar} ${
                                  isSel ? styles.itemPedidoAdicionarAtivo : ""
                                }`}
                                onClick={() => alternarSelecaoPedidoParaAdicionar(p.id)}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSel}
                                  onChange={() => {}}
                                  className={styles.checkbox}
                                />
                                <div className={styles.itemPedidoAdicionarInfo}>
                                  <span>
                                    <strong>#{p.id}</strong> - {p.cliente?.nome || p.nomeCliente || "Cliente"}
                                  </span>
                                  <span className={styles.valorDestaque}>
                                    {formatarMoeda(p.total || p.valorTotal || 0)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}

                    <div className={styles.painelAdicionarAcoes}>
                      <button
                        type="button"
                        className={styles.botaoCancelar}
                        onClick={() => setModalAdicionarAberto(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className={styles.botaoConfirmarAdicao}
                        onClick={tratarConfirmarAdicaoPedidos}
                        disabled={processandoAcao || pedidosParaAdicionarSelIds.length === 0}
                      >
                        <Check size={14} weight="bold" />
                        Adicionar {pedidosParaAdicionarSelIds.length} Selecionados
                      </button>
                    </div>
                  </div>
                )}

                <div className={styles.modalSecaoHeader}>
                  <h4 className={styles.modalSecaoTitulo}>
                    Pedidos na Carga ({cargaDetalhe.pedidos?.length || 0})
                  </h4>
                </div>

                <div className={styles.modalTabela}>
                  {cargaDetalhe.pedidos && cargaDetalhe.pedidos.length > 0 ? (
                    <>
                      <div className={styles.modalPedidoRowHeader}>
                        <span>#ID</span>
                        <span>Cliente / Bairro</span>
                        <span>Forma de Pagamento</span>
                        <span>Valor Total</span>
                        <span style={{ textAlign: "right" }}>Ações</span>
                      </div>

                      {cargaDetalhe.pedidos.map((ped) => (
                        <div key={ped.id} className={styles.modalPedidoRow}>
                          <span className={styles.idCell}>#{ped.id}</span>
                          <span>
                            <strong>{ped.cliente?.nome || ped.nomeCliente || "Cliente"}</strong>
                            {ped.cliente?.bairro && (
                              <small style={{ display: "block", color: "#868e96", fontSize: "11px" }}>
                                {ped.cliente.bairro}
                              </small>
                            )}
                          </span>
                          <span>{ped.formaPagamento?.nome || ped.formaPagamentoNome || "-"}</span>
                          <span className={styles.valorDestaque}>
                            {formatarMoeda(ped.total || ped.valorTotal || 0)}
                          </span>
                          <div className={styles.modalPedidoAcoes}>
                            {/* IMPRIMIR COMPROVANTE INDIVIDUAL */}
                            <button
                              type="button"
                              className={`${styles.btnAcaoItem} ${styles.btnImprimirItem}`}
                              onClick={() => tratarImprimirPedidoIndividual(ped)}
                              title="Imprimir comprovante deste pedido"
                            >
                              <Printer size={15} weight="bold" />
                            </button>

                            {/* REMOVER DA CARGA */}
                            {isCargaPendente(cargaDetalhe.status) && (
                              <AlertaRadix
                                titulo="Remover Pedido da Carga"
                                descricao={`Deseja remover o Pedido #${ped.id} desta carga? O status dele voltará para "pendente".`}
                                tratar={() => tratarRemoverPedidoCarga(ped.id)}
                                confirmarTexto="Remover Pedido"
                                cancelarTexto="Voltar"
                                trigger={
                                  <button
                                    type="button"
                                    className={`${styles.btnAcaoItem} ${styles.btnRemoverItem}`}
                                    title="Remover pedido da carga (volta para pendente)"
                                    disabled={processandoAcao}
                                  >
                                    <Trash size={15} weight="bold" />
                                  </button>
                                }
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p className={styles.semPedidosModal}>Nenhum pedido listado nesta carga.</p>
                  )}
                </div>
              </div>

              {/* FOOTER DO MODAL */}
              <div className={styles.modalFooter}>
                <div className={styles.modalFooterLeft}>
                  <span>
                    Total da Carga:{" "}
                    <strong>
                      {formatarMoeda(
                        (cargaDetalhe.pedidos || []).reduce(
                          (acc, p) => acc + Number(p.total || p.valorTotal || 0),
                          0
                        )
                      )}
                    </strong>
                  </span>
                </div>

                <div className={styles.modalFooterRight}>
                  <button
                    className={styles.botaoCancelar}
                    onClick={() => {
                      setCargaDetalhe(null);
                      setModalAdicionarAberto(false);
                    }}
                  >
                    Fechar
                  </button>

                  {/* QUANDO PENDENTE: DESPACHAR PARA ROTA */}
                  {isCargaPendente(cargaDetalhe.status) && (
                    <AlertaRadix
                      titulo="Despachar Carga para Rota"
                      descricao={`Confirmar saída e despacho da Carga #${cargaDetalhe.id} para rota de entrega? O status mudará para "Em Rota".`}
                      tratar={() => tratarFinalizarCarga(cargaDetalhe.id)}
                      confirmarTexto="Despachar para Rota"
                      cancelarTexto="Voltar"
                      trigger={
                        <button className={styles.botaoDespacharModal} disabled={processandoAcao}>
                          <PaperPlaneRight size={16} weight="bold" />
                          Despachar para Rota
                        </button>
                      }
                    />
                  )}

                  {/* QUANDO EM ROTA: RETORNAR PARA PENDENTE OU FINALIZAR */}
                  {isCargaEmRota(cargaDetalhe.status) && (
                    <>
                      <AlertaRadix
                        titulo="Retornar Carga para Pendente"
                        descricao={`Deseja retornar a Carga #${cargaDetalhe.id} para o status "Pendente"? Isso permitirá adicionar ou remover pedidos de última hora.`}
                        tratar={() => tratarRetornarCargaPendente(cargaDetalhe.id)}
                        confirmarTexto="Retornar para Pendente"
                        cancelarTexto="Voltar"
                        trigger={
                          <button className={styles.botaoRetornarPendenteModal} disabled={processandoAcao}>
                            <ArrowCounterClockwise size={16} weight="bold" />
                            Retornar para Pendente
                          </button>
                        }
                      />

                      <button
                        type="button"
                        className={styles.botaoConcluirCargaModal}
                        onClick={() => tratarIniciarFechamentoCarga(cargaDetalhe)}
                        title="Ir para o Fechamento / Prestação de Contas da Carga"
                      >
                        <CheckCircle size={16} weight="bold" />
                        Finalizar Carga (Fechamento)
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* MODAL DE RELATÓRIO DE CARREGAMENTO */}
        {modalCarregamentoAberto && cargaDetalhe && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalCarregamentoContent}>
              {/* CABEÇALHO DO MODAL */}
              <div className={styles.modalHeader}>
                <div>
                  <p className={styles.modalSubtitulo}>Conferência de Carga</p>
                  <h2 className={styles.modalTitulo}>Relatório de Carregamento — Carga #{cargaDetalhe.id}</h2>
                </div>

                <div className={styles.modalHeaderRight}>
                  <button
                    type="button"
                    className={styles.botaoImprimirCarregamentoModal}
                    onClick={tratarImprimirRelatorioCarregamento}
                    title="Imprimir relatório de carregamento na impressora térmica"
                  >
                    <Printer size={16} weight="bold" />
                    Imprimir Carregamento
                  </button>

                  <button
                    className={styles.modalCloseBtn}
                    onClick={() => setModalCarregamentoAberto(false)}
                    title="Fechar Relatório"
                  >
                    <X size={20} weight="bold" />
                  </button>
                </div>
              </div>

              {/* CORPO DO MODAL */}
              <div className={styles.carregamentoBody}>
                {/* INFORMAÇÕES DE TRANSPORTE E CARGA */}
                <div className={styles.carregamentoInfoCard}>
                  <div className={styles.carregamentoInfoItem}>
                    <span>Veículo / Placa</span>
                    <strong>
                      {cargaDetalhe.veiculo?.nome || "Veículo"} ({cargaDetalhe.veiculo?.placa || "-"})
                    </strong>
                  </div>
                  <div className={styles.carregamentoInfoItem}>
                    <span>Motorista</span>
                    <strong>
                      {cargaDetalhe.motorista?.nome || `Motorista #${cargaDetalhe.motoristaId || "-"}`}
                    </strong>
                  </div>
                  <div className={styles.carregamentoInfoItem}>
                    <span>Destino / Região</span>
                    <strong>{cargaDetalhe.destino || "Não informado"}</strong>
                  </div>
                  <div className={styles.carregamentoInfoItem}>
                    <span>Qtd. de Pedidos na Carga</span>
                    <strong>{cargaDetalhe.pedidos?.length || 0} pedidos</strong>
                  </div>
                  <div className={styles.carregamentoInfoItem}>
                    <span>Peso Total Estimado</span>
                    <strong>
                      {cargaDetalhe.pesoTotal
                        ? `${Number(cargaDetalhe.pesoTotal).toLocaleString("pt-BR")} kg`
                        : "-"}
                    </strong>
                  </div>
                  <div className={styles.carregamentoInfoItem}>
                    <span>Total de Volumes / Itens</span>
                    <strong>
                      {agruparProdutosCarga(cargaDetalhe.pedidos).reduce(
                        (acc, p) => acc + p.quantidade,
                        0
                      )}{" "}
                      unidades
                    </strong>
                  </div>
                </div>

                {/* TABELA CONSOLIDADA DE PRODUTOS */}
                <div className={styles.carregamentoTabelaWrapper}>
                  <div className={styles.modalSecaoHeader}>
                    <h3 className={styles.modalSecaoTitulo}>
                      Lista de Produtos a Carregar ({agruparProdutosCarga(cargaDetalhe.pedidos).length} itens diferentes)
                    </h3>
                  </div>

                  <div className={styles.carregamentoRowHeader}>
                    <span>#</span>
                    <span>Produto / Descrição</span>
                    <span style={{ textAlign: "right" }}>Qtd. Total</span>
                  </div>

                  {agruparProdutosCarga(cargaDetalhe.pedidos).length > 0 ? (
                    agruparProdutosCarga(cargaDetalhe.pedidos).map((prod, index) => (
                      <div key={index} className={styles.carregamentoRow}>
                        <span style={{ color: "#868e96", fontWeight: 700 }}>
                          {index + 1}
                        </span>
                        <strong style={{ color: "#1a1f2e" }}>
                          {prod.nome}
                        </strong>
                        <div style={{ textAlign: "right" }}>
                          <span className={styles.carregamentoQtdBadge}>
                            {prod.quantidade} un
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={styles.semPedidosModal}>
                      Nenhum produto encontrado nos pedidos desta carga.
                    </p>
                  )}
                </div>
              </div>

              {/* FOOTER DO MODAL */}
              <div className={styles.modalFooter}>
                <div className={styles.modalFooterLeft}>
                  <span>
                    Total de Volumes:{" "}
                    <strong>
                      {agruparProdutosCarga(cargaDetalhe.pedidos).reduce(
                        (acc, p) => acc + p.quantidade,
                        0
                      )}{" "}
                      unidades
                    </strong>
                  </span>
                </div>

                <div className={styles.modalFooterRight}>
                  <button
                    className={styles.botaoCancelar}
                    onClick={() => setModalCarregamentoAberto(false)}
                  >
                    Fechar
                  </button>

                  <button
                    type="button"
                    className={styles.botaoImprimirCarregamentoModal}
                    onClick={tratarImprimirRelatorioCarregamento}
                  >
                    <Printer size={16} weight="bold" />
                    Imprimir Carregamento (Térmica)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Rodape />
    </div>
  );
}

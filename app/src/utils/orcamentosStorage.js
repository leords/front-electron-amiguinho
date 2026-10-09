// Utilitário para armazenamento e gestão de orçamentos emitidos no balcão
const CHAVE_STORAGE = "amiguinho_orcamentos_balcao";

/**
 * Salva um novo orçamento no localStorage local da máquina
 */
export function salvarOrcamentoLocal(dados) {
  try {
    const listaExistente = obterTodosOrcamentosLocais();

    const novoOrcamento = {
      id: dados.id || `ORC-${Date.now()}`,
      data: dados.data
        ? new Date(dados.data).toISOString()
        : new Date().toISOString(),
      vendedor: dados.vendedor || "b1",
      nomeUsuario: dados.nomeUsuario || "",
      cliente: dados.cliente || "Consumidor",
      itens: Array.isArray(dados.itens) ? dados.itens : [],
      total: Number(dados.total || 0),
      formaPagamento: "ORÇAMENTO",
    };

    // Insere no início da lista
    listaExistente.unshift(novoOrcamento);

    // Mantém no máximo 500 registros para evitar sobrecarga de storage
    const listaTratada = listaExistente.slice(0, 500);
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(listaTratada));

    return novoOrcamento;
  } catch (erro) {
    console.error("Erro ao salvar orçamento localmente:", erro);
    return null;
  }
}

/**
 * Retorna todos os orçamentos salvos no localStorage
 */
export function obterTodosOrcamentosLocais() {
  try {
    const bruto = localStorage.getItem(CHAVE_STORAGE);
    return bruto ? JSON.parse(bruto) : [];
  } catch (erro) {
    console.error("Erro ao obter orçamentos locais:", erro);
    return [];
  }
}

/**
 * Retorna os orçamentos locais filtrados por data (YYYY-MM-DD) e/ou vendedor/balcão
 */
export function obterOrcamentosLocais({ data, vendedor } = {}) {
  try {
    const todos = obterTodosOrcamentosLocais();

    return todos.filter((orc) => {
      // Filtro de data
      if (data) {
        try {
          const dataIso = new Date(orc.data).toISOString().split("T")[0];
          if (dataIso !== data) return false;
        } catch {
          // Fallback caso a data esteja em outro formato
          if (!String(orc.data).includes(data)) return false;
        }
      }

      // Filtro de vendedor/balcão
      if (vendedor && vendedor !== "todos") {
        const vendOrc = String(orc.vendedor || "").trim().toLowerCase();
        const vendFiltro = String(vendedor).trim().toLowerCase();
        if (vendOrc && vendOrc !== vendFiltro) return false;
      }

      return true;
    });
  } catch (erro) {
    console.error("Erro ao filtrar orçamentos locais:", erro);
    return [];
  }
}

/**
 * Remove um orçamento do localStorage por ID
 */
export function removerOrcamentoLocal(id) {
  try {
    const todos = obterTodosOrcamentosLocais();
    const filtrados = todos.filter((orc) => String(orc.id) !== String(id));
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(filtrados));
    return true;
  } catch (erro) {
    console.error("Erro ao remover orçamento local:", erro);
    return false;
  }
}

import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// date-fns só aceita objetos DATE válidos

//apenas data 01/01/2025
export const dataFormatada = (data = new Date()) => {
  return format(data, "dd/MM/yyyy", { locale: ptBR });
};

export const dataHoraFormatada = (data) => {
  if (data === null || data === "" || data === false) {
    return "-";
  }

  const dataRef = data === undefined ? new Date() : data;
  const dataObj = typeof dataRef === "string" ? parseISO(dataRef) : dataRef;

  if (isNaN(dataObj)) {
    const fallback = new Date(dataRef);
    if (!isNaN(fallback.getTime())) {
      return format(fallback, "dd/MM/yyyy HH:mm", { locale: ptBR });
    }
    return "-";
  }

  return format(dataObj, "dd/MM/yyyy HH:mm", { locale: ptBR });
};

//apenas data 01-01-2025
export const dataFormatadaCalendario = (data = new Date()) => {
  return format(data, "yyyy-MM-dd", { locale: ptBR });
};

// Extrai data no formato YYYY-MM-DD no fuso horário local de forma segura
export const extrairDataYMD = (data) => {
  if (!data) return "";
  try {
    const dataObj = typeof data === "string" ? parseISO(data) : data;
    if (dataObj instanceof Date && !isNaN(dataObj.getTime())) {
      return format(dataObj, "yyyy-MM-dd");
    }
    const fallback = new Date(data);
    if (!isNaN(fallback.getTime())) {
      return format(fallback, "yyyy-MM-dd");
    }
    return "";
  } catch {
    return "";
  }
};

export const dataFormatadaFiltro = (data) => {
  // Caso o campo esteja vazio
  if (!data) {
    return "";
  }

  // se a data vier em string("2025-10-24"), convertemos com parseISO
  const dataObj = typeof data === "string" ? parseISO(data) : data;

  // Se, por algum motivo, a data for inválida
  if (isNaN(dataObj)) {
    console.error("Data inválida recebida em dataFormatadaFiltro", data);
    return "";
  }

  // Retorna a data formatada no estilo brasileiro
  return format(dataObj, "dd/MM/yyyy", { locale: ptBR });
};

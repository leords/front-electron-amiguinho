import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// date-fns só aceita objetos DATE válidos

//apenas data 01/01/2025
export const dataFormatada = (data = new Date()) => {
  return format(data, "dd/MM/yyyy", { locale: ptBR });
};

export const dataHoraFormatada = (data = new Date()) => {
  return format(data, "dd/MM/yyyy HH:mm", { locale: ptBR });
};

//apenas data 01-01-2025
export const dataFormatadaCalendario = (data = new Date()) => {
  return format(data, "yyyy-MM-dd", { locale: ptBR });
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

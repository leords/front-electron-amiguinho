/**
 * Formata quantidade de estoque para exibição padronizada na interface.
 * Números inteiros são exibidos diretamente (ex: 10).
 * Números fracionados são limitados a exatamente 2 casas decimais após a vírgula (ex: 9,67),
 * evitando estouro visual e quebra do layout dos componentes.
 *
 * @param {number|string} valor - Valor numérico do estoque
 * @returns {string} Valor formatado (ex: "10", "9,67", "0")
 */
export const formatarEstoque = (valor) => {
  const num = Number(valor ?? 0);
  if (isNaN(num)) return "0";

  // Se for inteiro exato, exibe sem decimais
  if (num % 1 === 0) {
    return String(num);
  }

  // Se tiver fração/decimais, limita a 2 casas após a vírgula (pt-BR)
  return num.toFixed(2).replace(".", ",");
};

export default async function GerarVersiculo() {
  const clima = await window.API.buscarClima("Canoinhas");

  const hoje = new Date().toLocaleDateString("pt-BR");

  const prompt = `
Para a data de hoje (${hoje}), responda exatamente nos três blocos abaixo:

1 Versículo bíblico:
  Traga **apenas um versículo bíblico curto** (máx. 1 frase).
  capítulo e versículo.
(quebra linha)
2 Data comemorativa:
  Informe se a data de hoje (${hoje}) possui **alguma comemoração oficial ou popular no Brasil**.
  Exemplo: "Dia do Vendedor".
  Caso não exista, deixe em branco, pule o data comemorativa".
(quebra linha)
3 Curiosidade sobre bebidas:
  Traga **uma curiosidade curta e interessante** sobre o ramo de bebidas em geral (refrigerantes, cervejas, destilados, água, etc.).
  Máx. 1 frases.

Responda de forma objetiva, sem emojis e sem textos adicionais fora desses blocos.
  `;

  const versiculo = await window.IA.buscarGroq(prompt);
  return versiculo;
}

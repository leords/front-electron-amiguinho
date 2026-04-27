export default async function GerarVersiculo() {

  const hoje = new Date().toLocaleDateString("pt-BR");

  const prompt = `
    Para a data de hoje (${hoje}), responda exatamente nos 3 blocos abaixo:

    1 - Conteúdo do dia:
    (varie diariamente, evite repetir conteúdos recentes):
    - Curiosidade interessante (mundo, ciência, negócios ou comportamento)
    - Frase motivacional curta

    O conteúdo deve ser simples, direto e de fácil leitura.

    (quebra linha)

    2 - Data comemorativa:
    Informe se a data de hoje (${hoje}) possui alguma comemoração oficial ou popular no Brasil.
    Exemplo: "Dia do Vendedor".
    Caso não exista, deixe em branco.

    (quebra linha)

    3 - Versículo bíblico:
    (varie diariamente, evite repetir conteúdos recentes):
    - curto (máx 2 frases + referência)
    

    Responda de forma objetiva, sem emojis e sem textos adicionais.
`;

  const versiculo = await window.IA.buscarGroq(prompt);
  return versiculo;
}

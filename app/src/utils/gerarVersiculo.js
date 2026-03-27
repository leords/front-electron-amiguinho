export default async function GerarVersiculo() {

  const hoje = new Date().toLocaleDateString("pt-BR");

  const prompt = `
    Para a data de hoje (${hoje}), responda exatamente nos 3 blocos abaixo:

    1 - Conteúdo do dia:
    Escolha APENAS UM dos formatos abaixo (varie diariamente, evite repetir conteúdos recentes):
    - Versículo bíblico curto (máx 2 frases + referência)
    - Curiosidade interessante (mundo, ciência, negócios ou comportamento)
    - Frase motivacional curta

    O conteúdo deve ser simples, direto e de fácil leitura.

    (quebra linha)

    2 - Data comemorativa:
    Informe se a data de hoje (${hoje}) possui alguma comemoração oficial ou popular no Brasil.
    Exemplo: "Dia do Vendedor".
    Caso não exista, deixe em branco.

    (quebra linha)

    3 - Título do conteúdo:
    Informe o tipo do conteúdo escolhido:
    Ex: "Versículo", "Curiosidade", "Reflexão"

    Responda de forma objetiva, sem emojis e sem textos adicionais.
`;

  const versiculo = await window.IA.buscarGroq(prompt);
  return versiculo;
}

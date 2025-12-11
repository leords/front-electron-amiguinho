export default async function GerarVersiculo() {
  const clima = await window.API.buscarClima("Canoinhas");

  const hoje = new Date().toLocaleDateString("pt-BR");

  const prompt = `
  Crie uma mensagem bíblica curta e inspiradora para hoje, dia ${hoje}, que seja fácil de ler e transmitir positividade.  
  Considere o clima atual:  
- Temperatura: ${clima.main.temp}°C  
- Condição: ${clima.weather[0].description}  

A mensagem deve:  
- Ser curta (uma ou duas frases).  
- Ter linguagem tranquila e acessível, para jovens e todas as idades.  
- Ser espiritual e baseada nos ensinamentos da Bíblia, mas de forma leve e descontraída.  
- Transmitir esperança, motivação ou conforto.`;

  const versiculo = await window.IA.buscarGroq(prompt);
  return versiculo;
}

import Groq from "groq-sdk";

export default async function buscarGroq(prompt) {
  // Instancia o cliente APÓS o dotenv já ter sido carregado no index.js
  const client = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const resposta = await client.chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "llama-3.3-70b-versatile", // ← ATUALIZE PARA ESTE MODELO
    temperature: 0.7,
    max_tokens: 1024,
  });

  return resposta.choices[0].message.content;
}

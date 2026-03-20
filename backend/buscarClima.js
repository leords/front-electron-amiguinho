

export default async function buscarClima() {

  const OPEN_KEY = process.env.OPENWEATHER_KEY;

  const cidade = "Canoinhas"
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&units=metric&lang=pt_br&appid=${OPEN_KEY}`;
  
  const result = await fetch(url);

  const data = await result.json();
  
  if (!result.ok) {
    console.error("Erro OpenWeather:", data);
    throw new Error(data.message);
  }

  return data;

}
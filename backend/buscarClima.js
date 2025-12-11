import dotenv from "dotenv";
dotenv.config();

const OPENWEATHER_KEY = process.env.OPENWEATHER_KEY;

export default async function buscarClima(cidade) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&units=metric&lang=pt_br&appid=${OPENWEATHER_KEY}`;
  const result = await fetch(url);
  return result.json();
}

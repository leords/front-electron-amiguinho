import { useEffect, useState, useCallback } from "react";
import { lerCargas } from "../operadores/API/carga/lerCargas.js";

export function useCargas(paramsIniciais = {}) {
  const [cargas, setCargas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async (params = paramsIniciais) => {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await lerCargas(params);
      setCargas(Array.isArray(lista) ? lista : []);
    } catch (error) {
      setErro(error);
      setCargas([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return {
    cargas,
    carregando,
    erro,
    recarregar: carregar,
  };
}

import { useEffect, useState, useCallback } from "react";
import { lerPendencias } from "../operadores/API/pendencia/lerPendencias.js";

export function usePendencias(paramsIniciais = {}) {
  const [pendencias, setPendencias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async (params = paramsIniciais) => {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await lerPendencias(params);
      setPendencias(Array.isArray(lista) ? lista : []);
    } catch (error) {
      setErro(error);
      setPendencias([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return {
    pendencias,
    carregando,
    erro,
    recarregar: carregar,
  };
}

import { useEffect, useState, useCallback } from "react";
import { lerVeiculos } from "../operadores/API/veiculo/lerVeiculos.js";

export function useVeiculos(paramsIniciais = {}) {
  const [veiculos, setVeiculos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async (params = paramsIniciais) => {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await lerVeiculos(params);
      setVeiculos(Array.isArray(lista) ? lista : []);
    } catch (error) {
      setErro(error);
      setVeiculos([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return {
    veiculos,
    carregando,
    erro,
    recarregar: carregar,
  };
}

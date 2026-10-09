import { useEffect, useState, useCallback } from "react";
import { lerMotoristas } from "../operadores/API/motorista/lerMotoristas.js";

export function useMotoristas(paramsIniciais = {}) {
  const [motoristas, setMotoristas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async (params = paramsIniciais) => {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await lerMotoristas(params);
      setMotoristas(Array.isArray(lista) ? lista : []);
    } catch (error) {
      setErro(error);
      setMotoristas([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return {
    motoristas,
    carregando,
    erro,
    recarregar: carregar,
  };
}

import { useEffect, useState, useCallback } from "react";
import { lerPagamentos } from "../operadores/API/pagamento/lerPagamentos.js";

export function usePagamentos(paramsIniciais = {}) {
  const [pagamentos, setPagamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async (params = paramsIniciais) => {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await lerPagamentos(params);
      setPagamentos(Array.isArray(lista) ? lista : []);
    } catch (error) {
      setErro(error);
      setPagamentos([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return {
    pagamentos,
    carregando,
    erro,
    recarregar: carregar,
  };
}

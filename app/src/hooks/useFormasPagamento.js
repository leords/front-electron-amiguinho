import { useEffect, useState } from "react";
import { lerFormaPagamentoExterna } from "../operadores/API/formaPagamento/lerFormaPagamentoExterna.js";

export function useFormasPagamento() {
  const [listaFormaPagamento, setListaFormasPagamento] = useState([]);
  const [carregandoFormasPagamento, setCarregandoFormasPagamento] =
    useState(true);
  const [erroHookFormaPagamento, setErroHookFormaPagamento] = useState(null);

  useEffect(() => {
    const carregar = async () => {
      try {
        const lista = await lerFormaPagamentoExterna();
        setListaFormasPagamento(Array.isArray(lista) ? lista : []);
      } catch (error) {
        setErroHookFormaPagamento(error);
      } finally {
        setCarregandoFormasPagamento(false);
      }
    };

    carregar();
  }, []);

  return {
    listaFormaPagamento,
    carregandoFormasPagamento,
    erroHookFormaPagamento,
  };
}

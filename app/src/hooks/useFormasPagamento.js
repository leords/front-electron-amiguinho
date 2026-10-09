import { useEffect, useState } from "react";
import { lerFormasPagamento } from "../operadores/API/formaPagamento/lerFormasPagamento.js";
import { lerFormaPagamentoExterna } from "../operadores/API/formaPagamento/lerFormaPagamentoExterna.js";

export function useFormasPagamento() {
  const [listaFormaPagamento, setListaFormasPagamento] = useState([]);
  const [carregandoFormasPagamento, setCarregandoFormasPagamento] =
    useState(true);
  const [erroHookFormaPagamento, setErroHookFormaPagamento] = useState(null);

  useEffect(() => {
    const carregar = async () => {
      try {
        try {
          const lista = await lerFormasPagamento();
          if (Array.isArray(lista) && lista.length > 0) {
            setListaFormasPagamento(lista);
            return;
          }
        } catch (e) {
          console.warn("Tentando fallback de formas de pagamento:", e);
        }

        const fallbackLista = await lerFormaPagamentoExterna();
        setListaFormasPagamento(fallbackLista ?? []);
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

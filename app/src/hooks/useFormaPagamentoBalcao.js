import { useEffect, useState } from "react";
import { lerFormaPagamentoBalcao } from "../operadores/API/formaPagamento/lerFormaPagamentoBalcao.js";

export function useFormaPagamentoBalcao() {

  // Estados
  const [listaFormaPagamento, setListaFormasPagamento] = useState();
  const [carregandoFormasPagamento, setCarregandoFormasPagamento] = useState(true);
  const [erroHookFormaPagamento, setErroHookFormaPagamento] = useState(null);



  useEffect(() => {
    const carregar = async () => {
      try {
        const lista = await lerFormaPagamentoBalcao();
        setListaFormasPagamento(lista);
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

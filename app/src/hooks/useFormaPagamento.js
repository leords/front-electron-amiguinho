import { useEffect, useState } from "react";
import { LerFormaPagamento } from "../operadores/API/formaPagamento/lerFormaPagamento";

export function useFormaPagamento() {
  const [listaFormaPagamento, setListaFormasPagamento] = useState();
  const [carregandoFormasPagamento, setCarregandoFormasPagamento] =
    useState(true);
  const [erroHookFormaPagamento, setErroHookFormaPagamento] = useState(null);

  const buscarFormasPagamento = async () => {
    const formasPagamentoStorage = localStorage.getItem("formas");

    if (formasPagamentoStorage) {
      try {
        const json = JSON.parse(formasPagamentoStorage);

        if (Array.isArray(json) && json.length > 0) {
          return json;
        }
      } catch (e) {
        console.log("JSON inválido no storage, limpando");
        localStorage.removeItem("formas");
      }
    }

    const retornoFormasPagamentoAPI = LerFormaPagamento({
      status: "ATIVO",
      solicitante: "BALCAO",
    });
    return retornoFormasPagamentoAPI;
  };

  useEffect(() => {
    const carregar = async () => {
      try {
        const lista = await buscarFormasPagamento();
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

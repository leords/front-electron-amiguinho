import { useEffect, useState } from "react";
import { LerClienteDelivery } from "../operadores/API/cliente/lerClienteDelivery.js";

export function useClientesDelivery() {

  // Estados
  const [clientes, setClientes] = useState([]);
  const [carregandoClientesDelivery, setCarregandoClientesDelivery] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const carregar = async () => {
      try {
        const lista = await LerClienteDelivery();
        setClientes(lista);
        
      } catch (error) {
        setErro(error);
      } finally {
        setCarregandoClientesDelivery(false);
      }
    };

    carregar();
  }, []);

  return {
    clientes,
    carregandoClientesDelivery,
    erro,
  };
}

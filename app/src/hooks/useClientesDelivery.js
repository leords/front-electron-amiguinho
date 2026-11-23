import { useEffect, useState } from "react";
import { LerClienteDelivery } from "../operadores/API/cliente/lerClienteDelivery.js";

export function useClientesDelivery() {
  // Estados
  const [clientes, setClientes] = useState([]);
  const [carregandoClientesDelivery, setCarregandoClientesDelivery] =
    useState(true);
  const [erro, setErro] = useState(null);

  const carregar = async () => {
    setCarregandoClientesDelivery(true);
    try {
      const lista = await LerClienteDelivery();
      setClientes(Array.isArray(lista) ? lista : []);
    } catch (error) {
      setErro(error);
    } finally {
      setCarregandoClientesDelivery(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  return {
    clientes,
    carregandoClientesDelivery,
    erro,
    recarregarClientes: carregar,
  };
}

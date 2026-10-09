import { useCallback, useEffect, useState } from "react";
import { LerClienteExterno } from "../operadores/API/cliente/lerClienteExterno.js";

export function useClientesExterno() {
  // estados
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const lista = await LerClienteExterno();
      setClientes(lista ?? []);
      setErro(null);
    } catch (error) {
      setErro(error);
      setClientes([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return {
    clientes,
    carregando,
    erro,
    recarregarClientes: carregar,
  };
}

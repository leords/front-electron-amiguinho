import { useEffect, useState } from "react";
import { LerClienteExterno } from "../operadores/API/cliente/lerClienteExterno.js";

export function useClientesExterno() {
    //estados
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);


  useEffect(() => {
    const carregar = async () => {
      try {
        const lista = await LerClienteExterno();
        setClientes(lista);

      } catch (error) {
        setErro(error);
      } finally {
        setCarregando(false);
      }
    };

    carregar();
  }, []);

  return {
    clientes,
    carregando,
    erro,
  };
}

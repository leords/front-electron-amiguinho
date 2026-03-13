import { useEffect, useState } from "react";
import { LerProduto } from "../operadores/API/produto/lerProduto.js";
import { LerClienteDelivery } from "../operadores/API/cliente/lerClienteDelivery.js";
import { LerClienteExterno } from "../operadores/API/cliente/lerClienteExterno.js";

export function useClientesDelivery() {
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const buscarCliente = async () => {
    const ClienteStorage = localStorage.getItem("clientesDelivery");

    if (ClienteStorage) {
      try {
        const json = JSON.parse(ClienteStorage);

        if (Array.isArray(json) && json.length > 0) {
          return json;
        }
      } catch (e) {
        console.warn("JSON inválido no storage, limpando", e);
        localStorage.removeItem("clientes");
      }
    }
    
      const retornoProdutoAPI = await LerClienteDelivery()
      localStorage.setItem("clientes", JSON.stringify(retornoProdutoAPI));
      return retornoProdutoAPI;
   
  };

  useEffect(() => {
    const carregar = async () => {
      try {
        const lista = await buscarCliente();
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

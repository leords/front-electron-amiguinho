import { useEffect, useState } from "react";
import { LerProduto } from "../operadores/API/produto/lerProduto.js";

export function useProdutos() {
  // Estados
  const [produtos, setProduto] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = async () => {
    setCarregando(true);
    try {
      const lista = await LerProduto();
      setProduto(Array.isArray(lista) ? lista : []);
    } catch (error) {
      setErro(error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  return {
    produtos,
    carregando,
    erro,
    recarregarProdutos: carregar,
  };
}


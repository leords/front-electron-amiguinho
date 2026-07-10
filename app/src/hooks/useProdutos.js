import { useEffect, useState } from "react";
import { LerProduto } from "../operadores/API/produto/lerProduto.js";

export function useProdutos() {

  // Estados
  const [produtos, setProduto] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const carregar = async () => {
      try {
        const lista = await LerProduto();
        setProduto(lista);

      } catch (error) {
        setErro(error);
      } finally {
        setCarregando(false);
      }
    };

    carregar();
  }, []);

  return {
    produtos,
    carregando,
    erro,
  };
}

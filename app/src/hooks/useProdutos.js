import { useEffect, useState } from "react";
import { LerProduto } from "../operadores/API/produto/lerProduto.js";

export function useProdutos() {
  const [produtos, setProduto] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const buscarProduto = async () => {
    const produtoStorage = localStorage.getItem("produtos");

    if (produtoStorage) {
      try {
        const json = JSON.parse(produtoStorage);

        if (Array.isArray(json) && json.length > 0) {
          return json;
        }
      } catch (e) {
        console.warn("JSON inválido no storage, limpando");
        localStorage.removeItem("produtos");
      }
    }

    const retornoProdutoAPI = await LerProduto();

    localStorage.setItem("produtos", JSON.stringify(retornoProdutoAPI));

    return retornoProdutoAPI;
  };

  useEffect(() => {
    const carregar = async () => {
      try {
        const lista = await buscarProduto();
        setProduto(lista);
      } catch (error) {
        setErro(e);
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

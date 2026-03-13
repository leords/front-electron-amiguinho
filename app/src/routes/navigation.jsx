import { Routes, Route, HashRouter } from "react-router-dom";
import PaginaLogin from "../paginas/Login/index.jsx";
import Menu from "../paginas/Menu/index.jsx";
import Historico from "../paginas/Historico/index.jsx";
import Vendas from "../paginas/Vendas/index.jsx";
import Fechamento from "../paginas/Fechamento/index.jsx";
import Reimprimir from "../paginas/Reimprimir/index.jsx";
import { AuthProvedor } from "../componentes/Context/authContext.jsx";
import { ToastProvedor } from "../componentes/Context/toastContext.jsx";
import Dashboard from "../paginas/Dashboard/index.jsx";
import FechamentoBalcao from "../paginas/FechamentoBalcao/index.jsx";
import Sincronizar from "../paginas/Sincronizar/index.jsx";
import HistoricoValesInterno from "../paginas/HistoricoValesInterno/index.jsx";
import Pedidos from "../paginas/Pedidos/index.jsx";
import Transmissao from "../paginas/Transmissao/index.jsx";

export function Navegador() {
  return (
    <HashRouter>
      <AuthProvedor>
        <ToastProvedor>
          <Routes>
            <Route path="/" element={<PaginaLogin />} />
            <Route path="/sincronizar" element={<Sincronizar />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/historico" element={<Historico />} />
            <Route path="/venda" element={<Vendas />} />
            <Route path="/fechamento" element={<Fechamento />} />
            <Route path="/reimprimir" element={<Reimprimir />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/fechar-balcao" element={<FechamentoBalcao />} />
            <Route path="/vales-interno" element={<HistoricoValesInterno />} />
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/transmissao" element={<Transmissao />} />
          </Routes>
        </ToastProvedor>
      </AuthProvedor>
    </HashRouter>
  );
}

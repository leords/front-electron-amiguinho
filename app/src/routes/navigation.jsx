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
import EditarPedido from "../paginas/EditarPedido/index.jsx";
import Estoque from "../paginas/estoque/index.jsx";
import Gestao from "../paginas/Gestao/index.jsx";
import Usuarios from "../paginas/Usuarios/index.jsx";
import Produtos from "../paginas/Produtos/index.jsx";
import Clientes from "../paginas/Clientes/index.jsx";

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
            <Route path="/editar" element={<EditarPedido />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/gestao" element={<Gestao />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/clientes" element={<Clientes />} />
          </Routes>
        </ToastProvedor>
      </AuthProvedor>
    </HashRouter>
  );
}

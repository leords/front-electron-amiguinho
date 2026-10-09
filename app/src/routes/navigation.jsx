import { Routes, Route, HashRouter } from "react-router-dom";
import PaginaLogin from "../paginas/Login/index.jsx";
import Menu from "../paginas/Menu/index.jsx";
import Historico from "../paginas/Historico/index.jsx";
import Vendas from "../paginas/Vendas/index.jsx";
import FechamentoBalcaoUsuario from "../paginas/FechamentoBalcaoUsuario/index.jsx";
import Reimprimir from "../paginas/Reimprimir/index.jsx";
import { AuthProvedor } from "../componentes/Context/authContext.jsx";
import { ToastProvedor } from "../componentes/Context/toastContext.jsx";
import Dashboard from "../paginas/Dashboard/index.jsx";
import FechamentoBalcao from "../paginas/FechamentoBalcao/index.jsx";
import HistoricoValesInterno from "../paginas/HistoricoValesInterno/index.jsx";
import Pedidos from "../paginas/Pedidos/index.jsx";
import Transmissao from "../paginas/Transmissao/index.jsx";
import EditarPedido from "../paginas/EditarPedido/index.jsx";
import Estoque from "../paginas/estoque/index.jsx";
import Gestao from "../paginas/Gestao/index.jsx";
import Usuarios from "../paginas/Usuarios/index.jsx";
import Produtos from "../paginas/Produtos/index.jsx";
import Clientes from "../paginas/Clientes/index.jsx";
import Caixa from "../paginas/Caixa/index.jsx";
import VendasDelivery from "../paginas/VendasDelivery/index.jsx";
import HistoricoDelivery from "../paginas/HistoricoDelivery/index.jsx";
import FechamentoDeliveryUsuario from "../paginas/FechamentoDeliveryUsuario/index.jsx";
import FechamentoDelivery from "../paginas/FechamentoDelivery/index.jsx";
import Localizacao from "../paginas/Localizacao/index.jsx";
import RelatorioVendas from "../paginas/RelatorioDiario/index.jsx";
import FechamentoFinalizado from "../paginas/FechamentoFinalizado/index.jsx";
import ConfigurarImpressora from "../paginas/Impressora/index.jsx";
import Motoristas from "../paginas/Motoristas/index.jsx";
import Veiculos from "../paginas/Veiculos/index.jsx";
import Cargas from "../paginas/Cargas/index.jsx";
import Pendencias from "../paginas/Pendencias/index.jsx";
import PrestacaoContas from "../paginas/PrestacaoContas/index.jsx";
import PedidoExterno from "../paginas/PedidoExterno/index.jsx";
import FechamentoCarga from "../paginas/FechamentoCarga/index.jsx";

export function Navegador() {
  return (
    <HashRouter>
      <AuthProvedor>
        <ToastProvedor>
          <Routes>
            <Route path="/" element={<PaginaLogin />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/historico" element={<Historico />} />
            <Route path="/venda" element={<Vendas />} />
            <Route path="/fechamento" element={<FechamentoBalcaoUsuario />} />
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
            <Route path="/caixa" element={<Caixa />} />
            <Route path="/venda-delivery" element={<VendasDelivery />} />
            <Route path="/venda-externa" element={<PedidoExterno />} />
            <Route path="/pedido-externo" element={<PedidoExterno />} />
            <Route
              path="/historico-pedidos-delivery"
              element={<HistoricoDelivery />}
            />
            <Route
              path="/fechamento-usuario-delivery"
              element={<FechamentoDeliveryUsuario />}
            />
            <Route
              path="/fechamento-delivery"
              element={<FechamentoDelivery />}
            />
            <Route path="/buscar-localizacao" element={<Localizacao />} />
            <Route
              path="/buscar-relatorio-diario"
              element={<RelatorioVendas />}
            />
            <Route
              path="/fechamentos-finalizados"
              element={<FechamentoFinalizado />}
            />
            <Route
              path="/configurar-impressora"
              element={<ConfigurarImpressora />}
            />
            <Route path="/motoristas" element={<Motoristas />} />
            <Route path="/veiculos" element={<Veiculos />} />
            <Route path="/cargas" element={<Cargas />} />
            <Route path="/fechamento-carga" element={<FechamentoCarga />} />
            <Route path="/fechamento-carga/:id" element={<FechamentoCarga />} />
            <Route path="/pendencias" element={<Pendencias />} />
            <Route path="/prestacao-contas" element={<PrestacaoContas />} />
          </Routes>
        </ToastProvedor>
      </AuthProvedor>
    </HashRouter>
  );
}

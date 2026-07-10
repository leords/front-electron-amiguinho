import { useState} from "react";
import {
  Package,
  Plus,
  ArrowLeft,
  CircleNotch,
  MagnifyingGlass,
  Funnel,
  PencilSimple,
  CheckCircle,
  XCircle,
  ClockCountdown,
  Truck,
  Buildings,
  User,
  CalendarBlank,
  CurrencyCircleDollar,
  ListBullets,
  X,
  FloppyDisk,
  Trash,
  Warning,
  PackageIcon,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import Select from "react-select";
import styles from "./styles.module.css";
import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import ListaOrdemCompra from "../../componentes/ListaOrdemCompra";
import NovaOrdemCompra from "../../componentes/NovaOrdemCompra";
import { EditarStatusOrdem } from "../../componentes/EditarStatusOrdem";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";
import { usarToast } from "../../componentes/Context/toastContext";
import { Fornecedor } from "../../componentes/Fornecedor";
import Estoque from "../../componentes/SaldoEstoque";
import RelatorioSaidaProduto from "../../componentes/RelatorioSaidaProduto";


export default function EstoquePage() {

  //Hooks
    const { mensagem, setMensagem } = usarToast();

  // Estados
  const [view, setView] = useState("lista"); // "lista" | "novaOrdem" | "editarOrdem" | "fornecedores" | "saldoEstoque"
  const [ordemSelecionada, setOrdemSelecionada] = useState(null);

 
  return (
    <div className={styles.container}>
      <ToastRadix mensagem={mensagem} />
      <Cabecalho />
      <main className={styles.principal}>

        {/* CABEÇALHO */}
        <div className={styles.cabecalhoPage}>
          <div className={styles.tituloSection}>
            <div className={styles.iconeWrapper}>
              <Package size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Controle de Estoque</p>
              <h1 className={styles.pageTitulo}>Ordens de Compra</h1>
            </div>
          </div>
          
          { /* BOTÕES */ }
          <div className={styles.cabecalhoAcoes}>
            {view !== 'novaOrdem' && 
            <button className={styles.botaoPrincipal} onClick={() => { setView("novaOrdem") }}>
              <Plus size={16} weight="bold" />
              Nova Ordem
            </button>
            }
            {view !== 'fornecedores' &&
              <button className={styles.botaoSecundario} onClick={() => setView("fornecedores")}>
              <Buildings size={16} weight="bold" />
              Fornecedores
            </button>
            }
            {view !== 'saldoEstoque' &&
              <button className={styles.botaoSaldoEstoque} onClick={() => { setView("saldoEstoque") }}>
                <PackageIcon size={16} weight="bold" />
                Saldo do estoque
              </button>
            }
            {view !== 'relatorioSaida' &&
              <button className={styles.botaoRelatorioSaida} onClick={() => { setView("relatorioSaida") }}>
                <PackageIcon size={16} weight="bold" />
                Relatório de saídas
              </button>
            }

          </div>
        </div>

        {/* SALDO ESTOQUE */} 
        {view === "saldoEstoque" && (
          <Estoque 
            setView={setView}
          />  
        )}

        {/* COMPONENTE RELATÓRIO DE SAÍDA DE PRODUTO */}
        {view === "relatorioSaida" && (
          <RelatorioSaidaProduto
              setView={setView}
          />
        )}

        {/* COMPONENTE LISTA */}
        {view === "lista" && (
          <ListaOrdemCompra
              setView={setView}
              setOrdemSelecionada={setOrdemSelecionada}
          />
        )}

        {/* COMPONENTE NOVA ORDEM */}
        {view === "novaOrdem" && (
          <NovaOrdemCompra 
            setView={setView}
            setMensagem={setMensagem}
          />
        )}

        {/* COMPONENTE EDITAR STATUS */}
        {view === "editarOrdem" && ordemSelecionada && (
          <EditarStatusOrdem 
            ordemSelecionada = { ordemSelecionada }
            setView = { setView }
          />
        )}

        {/* FORNECEDORES */}
        {view === "fornecedores" && (
          <Fornecedor 
          setView = {setView}
          />
        )}
        
      </main>

      <Rodape />
    </div>
  );
}
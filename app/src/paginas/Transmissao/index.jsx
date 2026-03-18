import { useState } from "react";

import Cabecalho from "../../componentes/Cabecalho";
import Rodape from "../../componentes/Rodape";
import styles from "./styles.module.css";
import Spinner from "../../componentes/Spinner";
// Ícones
import {
  UsersIcon,
  MotorcycleIcon,
  PackageIcon,
  CreditCardIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  HardDrivesIcon,
  PowerIcon
} from "@phosphor-icons/react";

// Chamadas de API externas
import { BuscarClienteDelivery } from "../../operadores/API/cliente/buscarClienteDelivery";
import { BuscarClienteExterno } from "../../operadores/API/cliente/buscarClienteExterno";
import { BuscarProduto } from "../../operadores/API/produto/buscarProduto";
import { buscarFormaPagamento } from "../../operadores/API/formaPagamento/buscarFormaPagamento";


// Componente botão.
function BotaoCarga({ icone: Icone, cor, titulo, descricao, status, onClick }) {
  return (
    <button
      className={styles.botaoCarga}
      data-cor={cor}
      onClick={onClick}
    
    >
      <div className={styles.botaoIcone} data-cor={cor}>
          <Icone size={28} weight="fill" />
      </div>

      <div className={styles.botaoTexto}>
        <strong className={styles.botaoTitulo}>{titulo}</strong>
        <p className={styles.botaoDescricao}>
          {descricao}
        </p>
        {status && ( <p className={styles.historicoCarga}>última carga: {status}</p> )}
      </div>

      <div className={styles.botaoArrow}>
        <CloudArrowUpIcon size={18} weight="bold" />
      </div>
    </button>
  );
}

export default function Transmissao() {

  const [carregando, setCarregando] = useState(false)

  // Controladores de ultima carga
  const [statusDelivery, setStatusDelivery] = useState(localStorage.getItem('clientesDeliveryForce'))
  const [statusExterno, setStatusExterno] = useState(localStorage.getItem('clientesExternoForce'))
  const [statusProdutos, setStatusProdutos] = useState(localStorage.getItem('produtosForce'))
  const [statusFormas, setStatusFormas] = useState(localStorage.getItem('clientesForce'))

  // Data atual
  const agora = new Date().toLocaleString('pt-BR')

  // Array de funções
  const acoes = {
    clientesDeliveryForce: async () => {
      await BuscarClienteDelivery();
      setStatusDelivery(agora);
    },
    clientesExternoForce: async () => {
      await BuscarClienteExterno();
      setStatusExterno(agora);
    },
    produtosForce: async () => {
      await BuscarProduto();
      setStatusProdutos(agora);
    },
    clientesForce: async () => {
      await buscarFormaPagamento();
      setStatusFormas(agora);
    },
  }

  // Função que chama a função conforme o parametro
  const carregar = async (opcao) => { 
    try {
      setCarregando(true)

      if(acoes[opcao]){
        await acoes[opcao]();
        localStorage.setItem(opcao, agora)
      }

    } catch (error) {
      console.log('Erro ao carregar dados', error)
    } finally {
      setCarregando(false)
    }
   };

  return (
    <div className={styles.container}>
      <Cabecalho />

      <main className={styles.principal}>

        {/* Cabeçalho */}
        <div className={styles.cabecalhoPage}>
          <div className={styles.tituloSection}>
            <div className={styles.iconeWrapper}>
              <CloudArrowUpIcon size={22} weight="fill" />
            </div>
            <div>
              <p className={styles.pageSubtitulo}>Sistema</p>
              <h1 className={styles.pageTitulo}>Transmissão de dados</h1>
            </div>
          </div>
        </div>
        <p className={styles.instrucao}>
          Clique em cada botão para carregar listas no servidor.
        </p>

        {carregando 
           // Div de carregamento 
        ? <div className={styles.carregamento}>
            <Spinner />
            <p>Carregando dados, aguarde!</p>
          </div> 
        : // Grid de botões */}
          <div className={styles.grid}>
            <BotaoCarga
              icone={MotorcycleIcon}
              cor="orange"
              titulo="Clientes Delivery"
              descricao="Carregar lista de clientes do setor delivery"
              status={statusDelivery}
              onClick={() => carregar('clientesDeliveryForce')}
            />
            <BotaoCarga
              icone={UsersIcon}
              cor="blue"
              titulo="Clientes Externo"
              descricao="Carregar lista de clientes do setor externo"
              status={statusExterno}
              onClick={() => carregar('clientesExternoForce')}
            />
            <BotaoCarga
              icone={PackageIcon}
              cor="purple"
              titulo="Produtos"
              descricao="Carregar catálogo de produtos disponíveis"
              status={statusProdutos}
              onClick={() => carregar('produtosForce')}
            />
            <BotaoCarga
              icone={CreditCardIcon}
              cor="green"
              titulo="Formas de pagamento"
              descricao="Carregar métodos de pagamento aceitos"
              status={statusFormas}
              onClick={() => carregar('clientesForce')}
            />
          </div>
        }
       

      </main>

      <Rodape />
    </div>
  );
}
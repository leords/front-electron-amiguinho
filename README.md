# Sistema de Controle Amiguinho — Amiguinho Balcão (v2.2.4)

Sistema Desktop desenvolvido em **Electron**, **React** e **Vite** para gestão operacional e financeira da **Amigão Distribuidora de Bebidas LTDA**.

---

## 📌 Módulos Principais

- **Vendas Balcão**: Emissão de pedidos rápidos, orçamentos, sangrias e fechamento de caixa por operador e diário.
- **Delivery**: Gestão de pedidos para entrega, controle de envio e fechamento de motoboys.
- **Cargas & Logística**: Montagem de cargas vinculadas a motoristas e veículos, romaneio de carga, conferência de estoque e fechamento formal de cargas (`FechamentoCarga`).
- **Prestação de Contas (Externo)**: Conferência analítica de rotas com vendedores externos (dinheiro, cartão, PIX, boletos faturados, pendências/vasilhames e devoluções) e fechamento financeiro integrado ao setor `carga`.
- **Gestão Central**: Usuários, produtos, estoque (com controle seguro de loading e conferência), formas de pagamento, clientes, motoristas, veículos, caixas e localização em tempo real.
- **Fechamentos Finalizados**: Consulta e histórico consolidado dos fechamentos de Balcão, Delivery e Cargas.
- **Impressão Térmica**: Impressão silenciosa de cupons fiscais/não fiscais, orçamentos, romaneios e comprovantes de carga em bobinas de 72mm/80mm.

---

## 🛠️ Tecnologias Utilizadas

- **Desktop**: [Electron](https://www.electronjs.org/) (Processo Principal `index.js`, IPC seguro via `preload.js`)
- **Frontend**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Roteamento**: `react-router-dom` (`HashRouter`)
- **Estilização**: CSS Modules (`styles.module.css`) com Design System padronizado
- **Componentes & UI**: `@phosphor-icons/react`, Radix UI (`@radix-ui/react-alert-dialog`, `@radix-ui/react-toast`), Leaflet e Recharts
- **Comunicação**: Axios (`api` e `apiLong`) e Socket.IO para eventos em tempo real

---

## 🚀 Como Executar

### 1. Pré-requisitos
- Node.js (versão 20+ recomendada)
- NPM

### 2. Instalação de dependências
```bash
# Na raiz do projeto:
npm install

# No diretório do frontend (app):
cd app
npm install
cd ..
```

### 3. Desenvolvimento
Para rodar a aplicação em modo de desenvolvimento (Vite + Electron):
```bash
npm run start
```
Ou individualmente:
```bash
# Apenas o frontend Vite:
npm run dev:react

# Apenas o Electron:
npm run dev:electron
```

### 4. Build de Produção
Para compilar o frontend e gerar o instalador do Electron:
```bash
npm run build
```

---

## 📖 Diretrizes e Padrões de Código

Consulte o arquivo [AGENTS.md](./AGENTS.md) para ver as diretrizes completas de desenvolvimento, convenções de nomenclatura em Português, paleta de cores do Design System, padrões de cabeçalho, botão Voltar e regras de negócio.


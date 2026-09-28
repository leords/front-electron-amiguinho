# Diretrizes e Padrões de Desenvolvimento — Amiguinho Balcão

Este documento estabelece as diretrizes arquiteturais, convenções de código e padrões visuais/UX do projeto **Amiguinho / Sistema de Controle Amiguinho** (v2.2.1) para a **Amigão Distribuidora de Bebidas LTDA**. Todas as futuras implementações, refatorações e correções devem seguir rigorosamente estes padrões.

---

## 1. Visão Geral da Stack & Arquitetura

- **Ambiente Desktop**: Electron com processo principal (`index.js`) e ponte segura via `contextBridge` (`preload.js`).
- **Frontend**: React 18 + Vite, utilizando `HashRouter` do `react-router-dom` para navegação desktop.
- **Backend do Electron (`backend/`)**: Rotas e serviços Node.js para integração com IAs (OpenRouter / Groq), clima (OpenWeather), geração de CSVs com BOM UTF-8 (`\uFEFF`) e impressão térmica silenciosa via janela fantasma (`BrowserWindow`).
- **Estilização**: CSS Modules (`styles.module.css`) por componente/página com variáveis de cores do design system.
- **Ícones & UI**: `@phosphor-icons/react` (pesos `bold`, `duotone`, `fill`), Radix UI (`@radix-ui/react-alert-dialog`, `@radix-ui/react-toast`), Recharts e Leaflet.

---

## 2. Nomenclatura e Convenções de Código

1. **Idioma**: Todo o código (variáveis, nomes de funções, comentários, mensagens de erro, estados e arquivos) deve ser escrito em **Português**.
2. **Funções e Handlers**:
   - Prefixo `tratar` para eventos gerais (ex.: `tratarAlteracao`, `tratarVoltarMenu`, `tratarSair`).
   - Prefixo `iniciar` ou `handle` para fluxos específicos (ex.: `iniciarLogin`, `iniciarBalcaoDestino`, `handleAddProduto`).
3. **Hooks Customizados**:
   - Localizados em `app/src/hooks/use[Recurso].js`.
   - Nomes com prefixo `use` ou `usar` (ex.: `usarAuth`, `usarToast`, `useProdutos`, `useFormaPagamentoBalcao`).
   - Retorno padronizado contendo dados, estado de carregamento e erro (ex.: `{ produtos, carregando, erro }`).
4. **Estados e Variáveis**:
   - Nomes semânticos e diretos (ex.: `duzentos`, `cem`, `fechamentoAtual`, `carregandoVendas`, `pagamentosParciais`).

---

## 3. Estrutura de Pastas e Padrão de Arquivos

```
amiguinho-balcao/
├── index.js                    # Processo principal do Electron (Janelas, IPCs, Impressão térmica)
├── preload.js                  # Exposição de APIs seguras (IMPRESSORA, ENV, API, PDF, IA, LINK)
├── backend/                    # Serviços Node (OpenRouter, Groq, Clima, CSV)
└── app/
    └── src/
        ├── assets/             # Imagens e logos (mascote, logo-amigao, etc.)
        ├── componentes/        # Componentes reutilizáveis (Cabecalho, Rodape, ItemContador, ui/)
        │   └── ui/             # Componentes Radix UI (alerta, notificacao)
        ├── hooks/              # Custom Hooks React
        ├── operadores/API/     # Camada de comunicação com a API REST
        │   └── [modulo]/       # Subpastas modulares (pedido, fechamento, caixa, produto...)
        ├── paginas/            # Telas da aplicação
        │   └── [NomePagina]/   # Cada página com seu index.jsx e styles.module.css
        ├── routes/             # Navegação (navigation.jsx com HashRouter)
        ├── socket/             # Ouvintes de eventos Socket.IO
        └── utils/              # Funções utilitárias (data.js, formartarMoeda.js, gerarCupom.js)
```

---

## 4. Camada de API (`app/src/operadores/API/`)

- Cada rota/operação da API deve ter seu próprio arquivo isolado (ex.: `novoPedidoBalcao.js`, `buscarPedido.js`).
- Utilizar as instâncias do Axios definidas em `app/src/utils/conexaoAxios.js`:
  - `api`: para requisições com timeout padrão (5s).
  - `apiLong`: para requisições de maior duração (timeout 50s, ex.: criação/edição de pedidos).
- **Tratamento de Erros Obrigatório**:
  ```javascript
  try {
    const resposta = await api.get("/sua-rota", {
      headers: { Authorization: `Bearer ${token}` }
    });
    return resposta.data;
  } catch (error) {
    if (error.request && !error.response) {
      throw new Error("Servidor não respondeu, tente novamente");
    }
    if (error.response) {
      const mensagem = error.response.data?.erro?.mensagem || "Erro inesperado";
      throw new Error(mensagem);
    }
    throw new Error("Erro inesperado na requisição");
  }
  ```

---

## 5. Padrões de Interface (UI) e Experiência do Usuário (UX)

### Paleta de Cores do Design System
```css
:root {
  --orange: #ff8c00;
  --orange-light: #fff3e0;
  --orange-mid: #ffd699;
  --green: #2f9e44;
  --green-light: #ebfbee;
  --blue: #1971c2;
  --blue-light: #e7f5ff;
  --purple: #7048e8;
  --purple-light: #f3f0ff;
  --red: #c92a2a;
  --red-light: #fff5f5;
  --gray-900: #1a1f2e;
  --gray-700: #495057;
  --gray-500: #868e96;
  --gray-300: #dee2e6;
  --gray-100: #f8f9fa;
  --white: #ffffff;
  --border: #eaecef;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 8px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 2px 10px rgba(0, 0, 0, 0.08), 0 6px 24px rgba(0, 0, 0, 0.06);
  --radius: 14px;
}
```

### Cabeçalho Padrão das Telas
Toda página interna deve renderizar o `<Cabecalho />` no topo, o `<Rodape />` na base e incluir o cabeçalho padronizado da página:
```jsx
<div className={styles.cabecalhoPage}>
  <div className={styles.tituloSection}>
    <div className={styles.iconeWrapper}>
      <Icone size={22} weight="fill" />
    </div>
    <div>
      <p className={styles.pageSubtitulo}>Nome do Módulo</p>
      <h1 className={styles.pageTitulo}>Título da Página</h1>
    </div>
  </div>
  {/* Ações adicionais ou filtros à direita */}
</div>
```

### Confirmações e Notificações
1. **Ações Críticas**: Sempre usar `<AlertaRadix />` para pedir confirmação antes de excluir, cancelar, limpar, trocar de caixa ou deslogar.
2. **Notificações**: Sempre usar `<ToastRadix mensagem={mensagem} />` integrado com `const { mensagem, setMensagem } = usarToast()`.
3. **Tempo Mínimo de Loading**: Em operações de autenticação e recuperação de senha, aplicar o atraso mínimo de 2 segundos para evitar transições bruscas de interface.

### Impressão Térmica
- Usar templates HTML puros em `app/src/utils/gerarCupom.js` e `gerarOrcamento.js` com largura de 72mm/80mm, tipografia monospace e envio silencioso via `window.IMPRESSORA.imprimir(html)`.

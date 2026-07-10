import logo from "../../assets/logo-amigao.png";
import logoSusto from "../../assets/logo-susto.png";
import mascote from "../../assets/logo.jpg";
import styles from "./styles.module.css";
import { authAPI } from "../../operadores/API/autenticacaoUsuario.js";
import { usarAuth } from "../../componentes/Context/authContext.jsx";
import { useRef, useState } from "react";
import { ArrowLeft, SignIn, Key, EnvelopeSimple, LockKey, User, ArrowClockwise, SpinnerGapIcon } from "@phosphor-icons/react";
import ConectarServidor from "../ConectarServidor";
import { usarToast } from "../../componentes/Context/toastContext";
import { ToastRadix } from "../../componentes/ui/notificacao/notificacao";
import { ResetarSenhaUsuario } from "../../operadores/API/usuario/resetarSenhaUsuario";
import { EsqueciSenhaUsuario } from "../../operadores/API/usuario/esqueciSenhaUsuario";

export default function Login() {

  // Estados
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [render, setRender] = useState("login");
  const [carregamento, setCarregamento] = useState(false);
  const [acessoMultiClick, setAcessoMultiClick] = useState(false);

  // Hooks
  const { login } = usarAuth();
  const { mensagem, setMensagem } = usarToast();


  // Função de autenticar
  async function iniciarLogin(event) {
    event.preventDefault();
    setCarregamento(true);

    const tempoMinimo = 2000;
    const inicio = Date.now();

    try {
      const dadosUsuario = await authAPI({ usuario, senha });

      const tempoPassado = Date.now() - inicio;
      const restante = tempoMinimo - tempoPassado;

      if (restante > 0) {
        await new Promise((resolve) => setTimeout(resolve, restante));
      }

      login(dadosUsuario);
    } catch (error) {
      setMensagem(error.message)
      console.log(error.message)

    } finally {
      setCarregamento(false)
    }
  }

  async function esqueciSenha() {
        
      // Valida email
      if(!email) {
        alert('Preencha o e-mail. Lembre-se de que você precisa ter acesso a ele.')
        return
      }

      // Valida formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setMensagem('Digite um e-mail válido. Exemplo: usuario@provedor.com')
        return
      }

      const tempoMinimo = 2000;
      const inicio = Date.now();
      setCarregamento(true);

      try {
      const retorno = await EsqueciSenhaUsuario ( {email} );

      // Aguarda tempo mínimo antes de qualquer transição
      const tempoPassado = Date.now() - inicio;
      const restante = tempoMinimo - tempoPassado;
      if (restante > 0) {
        await new Promise((resolve) => setTimeout(resolve, restante));
      }
      
      // Valida o retorno da API que é boleano
      if(retorno) {
        setMensagem(retorno.mensagem)
        setRender('novaSenha')
      } else {
        setMensagem('E-mail não encontrado. Verifique e tente novamente.')
      }

    } catch (error) {
      setMensagem(error.message)
      console.log(error.message)

    } finally {
      setEmail("")
      setCarregamento(false)
    }
  }

  async function resetarSenha() {

    if(!token || !novaSenha) {
      alert('Por favor informe token enviado por email e nova senha')
      return
    }

    const tempoMinimo = 2000;
    const inicio = Date.now();
    setCarregamento(true);

    try {
      const retorno = await ResetarSenhaUsuario({ token, novaSenha });

      if (restante > 0) {
        await new Promise((resolve) => setTimeout(resolve, restante));
      }

      if(retorno) {
        setMensagem('Senha resetada com sucesso!')
        setRender('login')
        return
      }

      const tempoPassado = Date.now() - inicio;
      const restante = tempoMinimo - tempoPassado;


    } catch (error) {
      setMensagem(error.message)
      console.log(error.message)

    } finally {
      setCarregamento(false)
      setToken("")
      setNovaSenha("")
    }
  }

  const clicks = useRef(0);
  // 5 clicks seguidos para abrir a opção de configurar o servidor
    function multiLogoClick() {
      clicks.current++;

      if (clicks.current >= 5) {
        setAcessoMultiClick(true);
        clicks.current = 0;
      }

      setTimeout(() => {
        clicks.current = 0;
      }, 2000);

    }

  return (
    <div className={styles.container}>
      <ToastRadix mensagem={mensagem} />
      {/* Acessar config de servidor */}
      {acessoMultiClick && (
        // função por parametro para controlar este componente
        <ConectarServidor funcaoParametro={() => setAcessoMultiClick(false)} />
      )}

      {/* LADO ESQUERDO — MASCOTE */}
      <div className={styles.ladoMascote}>
        <div className={styles.mascoteConteudo}>
          <div className={styles.mascoteTextoTopo}>
            <span className={styles.tagBemVindo}>Sistema de Vendas</span>
            <h1 className={styles.titulo}>
              Olá,<br />bem‑vindo!
            </h1>
            <p className={styles.subTitulo}>
               Você está acessando o sistema de controle de vendas.<br />
            </p>
          </div>

          <div className={styles.mascoteImagemWrap}>
            <img
              src={mascote}
              alt="Mascote Amigão"
              className={styles.mascote}
              onClick={multiLogoClick}
            />
          </div>

          <p className={styles.rodapeEsq}>
            Distribuidora de bebidas Amigão 2025 · @Leords
          </p>
        </div>
      </div>

      {/* LADO DIREITO — FORMULÁRIOS */}
      <div className={styles.ladoForm}>
        <p className={styles.rodape}>Distribuidora de bebidas Amigão 2026 · @Leords</p>

        {render === "login" && (
          <div className={`${styles.card} ${styles.fadeUp}`}>
            <div className={styles.logoWrap}>
              <img src={logo} alt="Amigão Distribuidora" className={styles.logo} />
            </div>

            <div className={styles.cardCabecalho}>
              <p className={styles.cardSub}>Controle de acesso</p>
              <h2 className={styles.cardTitulo}>Entrar na conta</h2>
            </div>

            {carregamento ? (
              <div className={styles.spinnerWrap}>
                <span className={styles.spinnerGrande} />
                <p className={styles.spinnerTexto}>Autenticando...</p>
              </div>
            ) : (
              <form onSubmit={iniciarLogin} className={styles.formulario}>
                <div className={styles.campo}>
                  <label className={styles.label}>
                    <User size={13} weight="bold" /> Usuário
                  </label>
                  <input
                    type="text"
                    placeholder="Digite seu usuário"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.campo}>
                  <label className={styles.label}>
                    <LockKey size={13} weight="bold" /> Senha
                  </label>
                  <input
                    type="password"
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <button type="submit" className={styles.botaoPrincipal}>
                  <SignIn size={18} weight="bold" />
                  Entrar
                </button>

                <button
                  type="button"
                  className={styles.linkEsqueci}
                  onClick={() => setRender("email")}
                >
                  Esqueci minha senha
                </button>
              </form>
            )}
          </div>
        )}

        {render === "email" && (
          <div className={`${styles.card} ${styles.fadeUp}`}>
            <div className={styles.logoSustoWrap}>
              <img src={logoSusto} alt="Redefinir senha" className={styles.logoSusto} />
            </div>

            <div className={styles.cardCabecalho}>
              <p className={styles.cardSub}>Recuperação de acesso</p>
              <h2 className={`${styles.cardTitulo} ${styles.cardTituloAlerta}`}>
                Redefinir senha
              </h2>
            </div>

            <p className={styles.cardDescricao}>
              Informe o email associado à sua conta para receber o token de redefinição.
            </p>

            <div className={styles.formulario}>

              {/* EMAIL */}
              <div className={styles.campo}>
                <label className={styles.label}>
                  <EnvelopeSimple size={13} weight="bold" /> Email
                </label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                />
              </div>

              {/* ENVIAR TOKEN */}
              <button
                className={styles.botaoPrincipal}
                disabled={!email}
                onClick={esqueciSenha}
              >
                {carregamento ?
                <SpinnerGapIcon size={24} className={styles.spin} weight="duotone" />
              :
              <>
              <EnvelopeSimple size={18} weight="bold" />
                {email ? 'Enviar token' : 'Preencha com o e-mail do usuário.'}</>
              }

              </button>

              {/* VOLTAR PARA O LOGIN */}
              <button
                type="button"
                className={styles.botaoVoltar}
                onClick={() => setRender("login")}
              >
                <ArrowLeft size={14} weight="bold" />
                Voltar para login
              </button>
            </div>
          </div>
        )}

        {render === "novaSenha" && (
          <div className={`${styles.card} ${styles.fadeUp}`}>

            {/* LOGO + TÍTULO */}
            <div className={styles.logoSustoWrap}>
              <img src={logoSusto} alt="Nova senha" className={styles.logoSusto} />
            </div>

            <div className={styles.cardCabecalho}>
              <p className={styles.cardSub}>Recuperação de acesso</p>
              <h2 className={`${styles.cardTitulo} ${styles.cardTituloAlerta}`}>
                Nova senha
              </h2>
            </div>

            <p className={styles.cardDescricao}>
              Informe o token recebido por email e defina sua nova senha.
            </p>

            {/* FORMULÁRIO */}
            <div className={styles.formulario}>

              {/* TOKEN */}
              <div className={styles.campo}>
                <label className={styles.label}>
                  <Key size={13} weight="bold" /> Token
                </label>
                <input
                  type="text"
                  placeholder="Cole o token aqui"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className={styles.input}
                />
              </div>

              {/* NOVA SENHA */}
              <div className={styles.campo}>
                <label className={styles.label}>
                  <LockKey size={13} weight="bold" /> Nova senha
                </label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className={styles.input}
                />
              </div>

              {/* BOTÃO SALVAR SENHA */}

              <button
                className={styles.botaoPrincipal}
                disabled={!token || !novaSenha }
                onClick={resetarSenha}
              >
                {carregamento ?
                <SpinnerGapIcon size={24} className={styles.spin} weight="duotone" />
              :
              <>
              <ArrowClockwise size={18} weight="bold" />
                {!token || !novaSenha ? 'Preencha token e nova senha.' : 'Salvar nova senha'}</>
              }

              </button>

              {/* BOTÃO VOLTAR */}
              <button
                type="button"
                className={styles.botaoVoltar}
                onClick={() => setRender("login")}
              >
                <ArrowLeft size={14} weight="bold" />
                Voltar para login
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
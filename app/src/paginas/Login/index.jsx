import logo from "../../assets/logo-amigao.png";
import logoSusto from "../../assets/logo-susto.png";
import mascote from "../../assets/logo.jpg";
import styles from "./styles.module.css";
import { authAPI } from "../../operadores/API/autenticacaoUsuario.js";
import { usarAuth } from "../../componentes/Context/authContext.jsx";
import { useState } from "react";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [render, setRender] = useState("login");
  const [carragamento, setCarregamento] = useState(false);

  const { login } = usarAuth();

  //const navegar = useNavigate();

  async function iniciarLogin(event) {
    event.preventDefault();
    try {
      setCarregamento(true);
      const dadosUsuario = await authAPI({ usuario, senha });
      login(dadosUsuario);
    } catch (error) {
      alert(error.message);
    } finally {
      setCarregamento(false);
    }
  }

  return (
    <div className={styles.container}>
      {/* LADO MASCOTE */}
      <div className={styles.containerMascote}>
        <div className={styles.boasVindas}>
          <h1 className={styles.titulo}>Olá, bem vindo!</h1>
          <p className={styles.subTitulo}>
            Você está acessando o sistema de
            <br />
            controle de vendas amiguinho!
          </p>

          <div className={styles.imagemMascote}>
            <img
              src={mascote}
              alt="Mascote Amigão"
              className={styles.mascote}
            />
          </div>
        </div>
      </div>

      {render === "login" ? (
        <div className={styles.containerLogin}>
          <div className={styles.card}>
            <div className={styles.logoContainer}>
              <img
                src={logo}
                alt="Amigão Distribuidora de Bebidas"
                className={styles.logo}
              />
            </div>

            <form onSubmit={iniciarLogin}>
              <div className={styles.formulario}>
                <input
                  type="text"
                  placeholder="Digite seu usuário"
                  value={usuario || ""}
                  onChange={(e) => setUsuario(e.target.value)}
                  className={styles.input}
                  required
                />

                <input
                  type="password"
                  placeholder="Digite sua senha"
                  value={senha || ""}
                  onChange={(e) => setSenha(e.target.value)}
                  className={styles.input}
                  required
                />

                <button type="submit" className={styles.botao}>
                  Entrar
                </button>
                <p
                  onClick={() => {
                    setRender("email");
                  }}
                >
                  Esqueci minha senha
                </p>
              </div>
            </form>
          </div>

          {/* RODAPÉ */}
          <p className={styles.rodape}>
            Distribuidora de bebidas Amigão 2025 - @Leords
          </p>
        </div>
      ) : render === "email" ? (
        <div className={styles.containerLogin}>
          <div className={styles.card}>
            <img
              src={logoSusto}
              alt="Amigão Distribuidora de Bebidas"
              className={styles.logoSusto}
            />
            <div className={styles.logoTitulo}>
              <h1>Redefinir senha</h1>
              <p>Informe seu email para o qual deseja redefinir a sua senha</p>
            </div>

            <div className={styles.formulario}>
              <input
                type="text"
                placeholder="Email"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className={styles.input}
              />

              <button
                onClick={() => {
                  //chamar função que vai gerar o token
                  setRender("novaSenha");
                }}
                className={styles.botao}
              >
                Redefinir senha
              </button>
              <p
                onClick={() => {
                  setRender("login");
                }}
              >
                Voltar para login
              </p>
            </div>
          </div>

          {/* RODAPÉ */}
          <p className={styles.rodape}>
            Distribuidora de bebidas Amigão 2025 - @Leords
          </p>
        </div>
      ) : (
        <div className={styles.containerLogin}>
          <div className={styles.card}>
            <img
              src={logoSusto}
              alt="Amigão Distribuidora de Bebidas"
              className={styles.logoSusto}
            />

            <div className={styles.logoTitulo}>
              <h1>Redefinir senha</h1>
              <p>Informe o token recebido por email e sua nova senha</p>
            </div>

            <div className={styles.formulario}>
              <input
                type="text"
                placeholder="Token"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className={styles.input}
              />
              <input
                type="text"
                placeholder="Nova senha"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className={styles.input}
              />

              <button
                onClick={console.log("Enviar nova senha")}
                className={styles.botao}
              >
                Enviar nova senha
              </button>
              <p
                onClick={() => {
                  setRender("login");
                }}
              >
                Voltar para login
              </p>
            </div>
          </div>

          {/* RODAPÉ */}
          <p className={styles.rodape}>
            Distribuidora de bebidas Amigão 2025 - @Leords
          </p>
        </div>
      )}
    </div>
  );
}

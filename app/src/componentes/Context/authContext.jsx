import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
//import { socket } from "../../utils/socket";
//import { registrarEventosSocket } from "../../socket/eventos";

const AuthContext = createContext();

export const usarAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvedor = ({ children }) => {
  const navegar = useNavigate();
  const [usuario, setUsuario] = useState(() => {
    const token = localStorage.getItem("token");
    const nome = localStorage.getItem("nomeUsuario");
    const id = localStorage.getItem("idUsuario");
    const nivel = localStorage.getItem("nivelAcesso");

    if (token) {
      return {
        id: Number(id),
        nome,
        nivelAcesso: nivel,
      };
    }
    return null;
  });

  useEffect(() => {
    const atualizarUsuario = () => {
      const token = localStorage.getItem("token");
      const nome = localStorage.getItem("nomeUsuario");
      const id = localStorage.getItem("idUsuario");
      const nivel = localStorage.getItem("nivelAcesso");

      if (token) {
        setUsuario({
          id: Number(id),
          nome,
          nivelAcesso: nivel,
        });
      } else {
        setUsuario(null);
      }
    };

    window.addEventListener("storage", atualizarUsuario);
    return () => window.removeEventListener("storage", atualizarUsuario);
  }, []);

  // Função login
  const login = (credenciais) => {
    // Armazenando os dados do usuário e token no Storaged.
    localStorage.setItem("token", credenciais.token);
    localStorage.setItem("nomeUsuario", credenciais.usuario.nome);
    localStorage.setItem("idUsuario", credenciais.usuario.id);
    localStorage.setItem("nivelAcesso", credenciais.usuario.nivelAcesso);

    setUsuario({
      id: credenciais.usuario.id,
      nome: credenciais.usuario.nome,
      nivelAcesso: credenciais.usuario.nivelAcesso,
    });

    navegar("/menu");
  };

  // Função deslogar
  const sair = () => {
    // Remover do localStorage e limpar o estado
    localStorage.removeItem("token");
    localStorage.removeItem("nomeUsuario");
    localStorage.removeItem("idUsuario");
    localStorage.removeItem("nivelAcesso");
    localStorage.removeItem("produtos");
    localStorage.removeItem("formas");
    setUsuario(null);
    navegar("/");
  };

  // Valida a abertura da conexão socket
  // useEffect(() => {
  //   if (!usuario) return;

  //   const registrar = () => {
  //     socket.emit("registrar", {
  //       tipo: "painel",
  //       usuarioId: usuario.id,
  //     });

  //     registrarEventosSocket();
  //   };

  //   socket.connect();

  //   if (socket.connected) {
  //     registrar();
  //   } else {
  //     socket.once("connect", registrar);
  //   }

  //   return () => {
  //     socket.off("connect", registrar);
  //     socket.disconnect();
  //   };
  // }, [usuario]);

  return (
    <AuthContext.Provider value={{ usuario, login, sair }}>
      {children}
    </AuthContext.Provider>
  );
};

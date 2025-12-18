import { createContext, useContext, useState } from "react";

const ToastContext = createContext();

export const usarToast = () => {
  return useContext(ToastContext);
};

export const ToastProvedor = ({ children }) => {
  const [mensagem, setMensagem] = useState("");

  return (
    <ToastContext.Provider value={{ mensagem, setMensagem }}>
      {children}
    </ToastContext.Provider>
  );
};

import { WhatsappLogo } from "@phosphor-icons/react";

export function BotaoWhatsApp({ telefone, mensagem }) {

  // limpa o telefone (remove tudo que não for número)
  const numeroLimpo = String(telefone).replace(/\D/g, "");

  const link = `https://wa.me/${numeroLimpo}${
    mensagem ? `?text=${encodeURIComponent(mensagem)}` : ""
  }`;

  // Função que chama a função do electron
  function handleClick() {

    window.LINK.abrirLinkExterno(link);
  }

  return (
    <span
      onClick={handleClick}
      style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
    >
    {telefone}
      <WhatsappLogo size={20} color="#25D366" />
    </span>
  );
}
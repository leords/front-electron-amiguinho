import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Navegador } from "./routes/navigation";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Navegador />
  </StrictMode>
);

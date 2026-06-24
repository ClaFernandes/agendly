import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

// Em GitHub Actions usa /agendly, em Vercel e localhost usa /
const basename = import.meta.env.BASE_URL === "/agendly/" ? "/agendly" : "/";

createRoot(document.getElementById("root")).render(
  <BrowserRouter basename={basename}>
    <App />
  </BrowserRouter>,
);
import { createRoot } from "react-dom/client";
import App from "./App";

const container = document.querySelector("#root");

if (!container) {
  throw new Error("Missing #root container");
}

createRoot(container).render(<App />);

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Error boundary for the root render
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("Root element not found");
    document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Root element not found</div>';
  } else {
    createRoot(rootElement).render(<App />);
  }
} catch (error) {
  console.error("Failed to render app:", error);
  document.body.innerHTML = `<div style="color: red; padding: 20px;">Failed to start app: ${error}</div>`;
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global Error Handler to catch errors that happen outside React
window.onerror = function (message, source, lineno, colno, error) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; color: red; padding: 20px; z-index: 9999; overflow: auto;';
  errorDiv.innerHTML = `
    <h3>Global Error</h3>
    <p>Message: ${message}</p>
    <p>Source: ${source}:${lineno}:${colno}</p>
    <pre>${error?.stack || 'No stack trace'}</pre>
  `;
  document.body.appendChild(errorDiv);
  return false;
};

// Catch unhandled promise rejections
window.onunhandledrejection = function (event) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'position: fixed; bottom: 0; left: 0; width: 100%; height: 50%; background: #fff0f0; color: darkred; padding: 20px; z-index: 9999; overflow: auto; border-top: 2px solid red;';
  errorDiv.innerHTML = `
    <h3>Unhandled Promise Rejection</h3>
    <pre>${event.reason?.stack || event.reason || 'Unknown reason'}</pre>
  `;
  document.body.appendChild(errorDiv);
};

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  
  const root = createRoot(rootElement);
  root.render(<App />);
  
} catch (error) {
  console.error("Failed to render app:", error);
  document.body.innerHTML = `<div style="color: red; padding: 20px;"><h3>Startup Error</h3><pre>${error}</pre></div>`;
}

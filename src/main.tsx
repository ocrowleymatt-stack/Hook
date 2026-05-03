import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <div style={{padding: 20, fontFamily: "sans-serif"}}>
      <h1>Hook OS Live</h1>
      <p>System is deployed and running.</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Popup";
import Setup from "./pages/Setup";
import Settings from "./pages/Settings";
import { getBaseline } from "./storage/storageService";
import "./popup.css";

function App() {
  const [ready, setReady] = useState(false);
  const [hasBaseline, setHasBaseline] = useState(false);

  useEffect(() => {
    getBaseline((b) => {
      setHasBaseline(!!b);
      setReady(true);
    });
  }, []);

  if (!ready) return null;

  return (
    <HashRouter>
      <Routes>
        <Route path="/setup" element={<Setup onComplete={() => setHasBaseline(true)} />} />
        <Route path="/settings" element={<Settings />} />
        <Route
          path="/"
          element={hasBaseline ? <Home /> : <Navigate to="/setup" replace />}
        />
      </Routes>
    </HashRouter>
  );
}

ReactDOM.createRoot(document.body).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

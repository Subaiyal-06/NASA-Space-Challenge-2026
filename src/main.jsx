import React, { Suspense, lazy, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// The dev panel loads only when the address ends in #/dev (for example http://localhost:5173/#/dev).
const DevPanel = lazy(() => import("./dev/DevPanel.jsx"));

function Root() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  if (hash === "#/dev") return <Suspense fallback={null}><DevPanel /></Suspense>;
  return <App />;
}

createRoot(document.getElementById("root")).render(<Root />);

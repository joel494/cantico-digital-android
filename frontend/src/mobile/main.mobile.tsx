import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import MobileApp from "./app/MobileApp";
import { MobileContentProvider } from "./data/contentContext";
import { MobileSettingsProvider } from "./state/mobileSettings";
import "../index.css";
import "./styles/mobile.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MobileSettingsProvider>
      <MobileContentProvider>
        <HashRouter>
          <MobileApp />
        </HashRouter>
      </MobileContentProvider>
    </MobileSettingsProvider>
  </React.StrictMode>,
);

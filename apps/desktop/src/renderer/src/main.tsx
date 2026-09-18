// Renderer entry point: fonts, i18n, providers, and the router root.
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/roboto/900.css";
import { IconProvider } from "@directify/ui";
import "@directify/ui";
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./App";
import "./i18n";
import { resolveDesktopIcon } from "./icon-map";
import { LibraryProvider } from "./library-context";
import { installMockDirectifyIfNeeded } from "./mock-directify";
import { SettingsProvider } from "./settings-context";

installMockDirectifyIfNeeded();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <IconProvider resolve={resolveDesktopIcon}>
      <SettingsProvider>
        <LibraryProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </LibraryProvider>
      </SettingsProvider>
    </IconProvider>
  </React.StrictMode>
);

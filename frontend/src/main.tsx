// Point d'entrée de l'application React : c'est le premier fichier exécuté
// dans le navigateur (référencé par index.html via <script src="/src/main.tsx">).
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Monte le composant racine <App /> dans la balise <div id="root"> de index.html.
// StrictMode active des vérifications supplémentaires en développement
// (il n'a aucun effet en production).
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
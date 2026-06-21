// Composant racine de l'application. Pour l'instant le site n'a qu'une
// seule page (Home), donc App se contente de l'afficher. Si on ajoutait
// plusieurs pages, c'est ici qu'on mettrait un routeur (ex: react-router).
import Home from "./pages/Home";

function App() {
  return <Home />;
}

export default App;
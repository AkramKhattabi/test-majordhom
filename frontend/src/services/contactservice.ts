// Cette fonction est le seul endroit du frontend qui parle au backend
// pour le formulaire de contact. La séparer dans son propre fichier permet
// de changer facilement l'URL ou la librairie HTTP sans toucher au composant.
import axios from "axios";
import type { ContactFormData } from "../types/contact";

export async function submitContact(data: ContactFormData) {
  // "/api/contact" est un chemin relatif : en développement, Vite le
  // redirige vers l'API FastAPI (voir le "proxy" dans vite.config.ts).
  // En production, il faudrait que le serveur web redirige ce chemin
  // vers l'API de la même façon.
  const response = await axios.post("/api/contact", data);
  return response.data;
}

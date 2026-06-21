// Tests du schéma Zod utilisé par le formulaire de contact.
//
// Pourquoi tester ce fichier en particulier ?
// --------------------------------------------
// C'est la première ligne de défense contre les données invalides : si
// une règle est trop souple (ou trop stricte) ici, un utilisateur peut
// soit envoyer des données incorrectes jusqu'au backend, soit se voir
// bloqué à tort. Comme ce schéma ne dépend ni du DOM ni du réseau, il se
// teste directement, sans avoir besoin de monter le composant React.
import { describe, expect, it } from "vitest";
import { contactSchema } from "./contactSchema";

// Payload minimal valide, réutilisé par chaque test et légèrement
// modifié pour ne pas réécrire tous les champs à chaque fois.
const VALID_DATA = {
  civility: "M",
  firstName: "Jean",
  lastName: "Dupont",
  email: "jean.dupont@example.com",
  phone: "0612345678",
  requestType: "Visite",
  message: "Bonjour, je souhaite visiter ce bien rapidement.",
};

describe("contactSchema", () => {
  it("accepte un payload valide", () => {
    const result = contactSchema.safeParse(VALID_DATA);

    expect(result.success).toBe(true);
  });

  it("refuse un email invalide", () => {
    const result = contactSchema.safeParse({ ...VALID_DATA, email: "pas-un-email" });

    expect(result.success).toBe(false);
  });

  it("refuse un message de moins de 10 caractères", () => {
    const result = contactSchema.safeParse({ ...VALID_DATA, message: "court" });

    expect(result.success).toBe(false);
  });

  it("refuse un prénom ou nom de moins de 2 caractères", () => {
    const result = contactSchema.safeParse({ ...VALID_DATA, firstName: "J" });

    expect(result.success).toBe(false);
  });

  it("refuse une civilité vide", () => {
    const result = contactSchema.safeParse({ ...VALID_DATA, civility: "" });

    expect(result.success).toBe(false);
  });

  it("refuse un téléphone de moins de 8 caractères", () => {
    const result = contactSchema.safeParse({ ...VALID_DATA, phone: "0612" });

    expect(result.success).toBe(false);
  });
});

// Schéma de validation du formulaire de contact, utilisé par react-hook-form
// (via zodResolver) pour valider les champs côté navigateur avant l'envoi.
// Les mêmes règles sont revalidées côté serveur dans backend/schemas.py,
// car il ne faut jamais faire confiance uniquement à la validation client.
import { z } from "zod";

export const contactSchema = z.object({
  civility: z.string().min(1, "Choisissez une civilité"),

  firstName: z.string().min(2, "Prénom requis"),

  lastName: z.string().min(2, "Nom requis"),

  email: z
    .string()
    .email("Email invalide"),

  phone: z.string().min(8, "Téléphone invalide"),

  requestType: z.string().min(1, "Choisissez un type de demande"),

  message: z.string().min(10, "Message trop court"),
});

// Type TypeScript déduit automatiquement du schéma ci-dessus : ça évite
// d'écrire à la main une interface qui devrait toujours rester identique
// aux règles de validation.
export type ContactSchemaType = z.infer<typeof contactSchema>;
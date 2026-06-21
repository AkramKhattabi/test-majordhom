// Types partagés décrivant les données du formulaire de contact.
// Contrairement à contactSchema.ts (qui valide), ce fichier décrit juste
// la "forme" des données, utilisée par le composant et le service d'envoi.

// Un créneau de disponibilité choisi par l'utilisateur (jour + heure de
// début/fin). Géré en dehors du formulaire react-hook-form (état React local).
export interface Availability {
  day: string;
  start: string;
  end: string;
}

// Données complètes envoyées au backend : les champs du formulaire
// (validés par contactSchema) + la liste des disponibilités ajoutées.
export interface ContactFormData {
  civility: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  requestType: string;
  message: string;
  availabilities: Availability[];
}
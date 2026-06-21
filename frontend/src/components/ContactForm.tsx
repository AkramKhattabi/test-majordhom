// Formulaire de contact affiché sur la page d'accueil.
// Les champs simples (nom, email, message...) sont gérés par
// react-hook-form + Zod (validation). Les disponibilités (jour/heure) sont
// gérées séparément avec un état React classique car ce n'est pas un champ
// de formulaire unique mais une liste qu'on construit petit à petit.
import { useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema } from "../lib/contactSchema";
import type { ContactSchemaType } from "../lib/contactSchema";
import { submitContact } from "../services/contactservice";
import type { Availability } from "../types/contact";

// Formate un créneau pour l'affichage dans le récapitulatif
// (ex: "Lundi 09:00 - 10:00").
const formatAvailability = (a: Availability) => `${a.day} ${a.start} - ${a.end}`;

// Récapitulatif affiché dans la modale de confirmation, pour que
// l'utilisateur revoie en un coup d'œil ce qu'il vient d'envoyer.
type SuccessRecap = {
  fullName: string;
  email: string;
  phone: string;
  requestType: string;
  message: string;
  availabilities: Availability[];
};

// Modale affichée après l'envoi (remplace les alert() natifs du
// navigateur, peu esthétiques et pas alignés avec le design du site).
// Le succès porte un récapitulatif, l'erreur porte juste un message.
type Feedback =
  | { type: "success"; recap: SuccessRecap }
  | { type: "error"; message: string };

const REQUEST_TYPE_LABELS: Record<string, string> = {
  Visite: "Demande de visite",
  Rappel: "Être rappelé.e",
  Photos: "Plus de photos",
};

export default function ContactForm() {
  // Liste des créneaux de disponibilité ajoutés par l'utilisateur.
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);

  // Contenu de la modale actuellement affichée (null = aucune modale).
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  // Contrôle séparément l'animation d'entrée/sortie, pour pouvoir la
  // refermer en douceur avant de la retirer du DOM.
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = (next: Feedback) => {
    setFeedback(next);
    requestAnimationFrame(() => setModalVisible(true));
  };

  // Pas de fermeture automatique : avec un récapitulatif à lire, c'est à
  // l'utilisateur de fermer (bouton ou clic en dehors), pas à un minuteur.
  const closeModal = () => {
    setModalVisible(false);
    window.setTimeout(() => setFeedback(null), 200);
  };

  // Valeurs actuelles du petit formulaire "jour / heure début / heure fin"
  // utilisé pour construire un nouveau créneau avant de l'ajouter à la liste.
  const [day, setDay] = useState("Lundi");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");

  const {
    register, // relie un <input> au formulaire (ex: {...register("email")})
    handleSubmit, // englobe onSubmit : valide les données avant de les passer
    reset, // vide tous les champs du formulaire (utilisé après un envoi réussi)
    formState: { errors, isSubmitting }, // erreurs de validation + état d'envoi en cours
  } = useForm<ContactSchemaType>({
    resolver: zodResolver(contactSchema), // branche le schéma Zod comme règles de validation
  });

  // Ajoute le créneau actuellement sélectionné (day/start/end) à la liste.
  const addAvailability = () => {
    setAvailabilities((prev) => [
      ...prev,
      { day, start, end },
    ]);
  };

  // Retire un créneau de la liste à partir de sa position.
  const removeAvailability = (index: number) => {
    setAvailabilities((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  // Appelée uniquement si la validation Zod passe (sinon `errors` est
  // rempli et ce code n'est jamais exécuté).
  const onSubmit = async (data: ContactSchemaType) => {
    try {
      // On combine les champs validés (data) avec la liste des
      // disponibilités (gérée à part) avant d'envoyer au backend.
      await submitContact({
        ...data,
        availabilities,
      });

      openModal({
        type: "success",
        recap: {
          fullName: `${data.civility} ${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
          requestType: REQUEST_TYPE_LABELS[data.requestType] ?? data.requestType,
          message: data.message,
          availabilities,
        },
      });

      // Remet le formulaire à zéro pour permettre un nouvel envoi.
      reset();
      setAvailabilities([]);
    } catch (error) {
      console.error(error);
      // Distingue "le serveur a refusé la demande" (ex: validation côté
      // backend) de "le serveur est inaccessible" (API non démarrée,
      // mauvais port...), pour afficher un message plus utile que générique.
      // - pas de réponse du tout : la requête n'a même pas atteint un serveur.
      // - 502/503/504 : en développement, c'est le proxy Vite qui répond
      //   lui-même parce qu'il n'arrive pas à joindre l'API FastAPI.
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const isNetworkError =
        axios.isAxiosError(error) && (!error.response || [502, 503, 504].includes(status!));
      openModal({
        type: "error",
        message: isNetworkError
          ? "Impossible de contacter le serveur. Vérifiez votre connexion et réessayez."
          : "Échec de l'envoi. Réessayez dans un instant.",
      });
    }
  };

  return (
    <>
      {/* Modale de confirmation/erreur affichée au centre de l'écran après
          l'envoi, par-dessus un fond sombre. Le succès affiche un
          récapitulatif de ce qui a été envoyé ; l'erreur reste un message
          court. Clic sur le fond ou sur "Fermer" referme la modale. */}
      {feedback && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 transition-opacity duration-200 motion-reduce:transition-none ${
            modalVisible ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeModal}
        >
          <div
            role={feedback.type === "success" ? "status" : "alertdialog"}
            aria-live="polite"
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl transition-all duration-200 ease-out motion-reduce:transition-none ${
              modalVisible
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95 motion-reduce:scale-100"
            }`}
          >
            <span
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
                feedback.type === "success"
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {feedback.type === "success" ? (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7">
                  <path
                    fillRule="evenodd"
                    d="M16.704 5.29a1 1 0 0 1 0 1.42l-7.25 7.25a1 1 0 0 1-1.42 0L3.296 9.21a1 1 0 1 1 1.42-1.42l3.61 3.61 6.54-6.54a1 1 0 0 1 1.42 0Z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.7 7.29a1 1 0 0 0-1.41 1.42L8.59 10l-1.3 1.29a1 1 0 1 0 1.42 1.42L10 11.41l1.29 1.3a1 1 0 0 0 1.42-1.42L11.41 10l1.3-1.29a1 1 0 0 0-1.42-1.42L10 8.59 8.7 7.3Z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </span>

            <h3 className="mt-4 text-xl font-bold uppercase text-gray-900">
              {feedback.type === "success" ? "Demande envoyée" : "Échec de l'envoi"}
            </h3>

            {feedback.type === "success" ? (
              <>
                <p className="mt-1 text-sm text-gray-500">On vous recontacte vite.</p>

                {/* Récapitulatif : relit à l'utilisateur ce qu'il vient
                    d'envoyer, sans qu'il ait besoin de s'en souvenir. */}
                <dl className="mt-6 space-y-3 rounded-2xl bg-gray-50 p-5 text-left text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Nom</dt>
                    <dd className="font-medium text-gray-900">{feedback.recap.fullName}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Email</dt>
                    <dd className="font-medium text-gray-900">{feedback.recap.email}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Téléphone</dt>
                    <dd className="font-medium text-gray-900">{feedback.recap.phone}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Demande</dt>
                    <dd className="font-medium text-gray-900">{feedback.recap.requestType}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Disponibilités</dt>
                    <dd className="font-medium text-gray-900 text-right">
                      {feedback.recap.availabilities.length === 0 ? (
                        "Aucune"
                      ) : (
                        <ul>
                          {feedback.recap.availabilities.map((a, i) => (
                            <li key={i}>{formatAvailability(a)}</li>
                          ))}
                        </ul>
                      )}
                    </dd>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <dt className="text-gray-500">Message</dt>
                    <dd className="mt-1 text-gray-900">{feedback.recap.message}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-600">{feedback.message}</p>
            )}

            <button
              type="button"
              onClick={closeModal}
              className="mt-6 w-full rounded-full bg-orange-400 px-6 py-3 font-semibold text-white"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

    <form onSubmit={handleSubmit(onSubmit)} className="mt-8">

      <div className="grid lg:grid-cols-2 gap-10">

        {/* GAUCHE : coordonnées (civilité, nom, email, téléphone) + disponibilités */}

        <div>

          <h2 className="text-white text-xl font-semibold mb-6 uppercase">
            Vos coordonnées
          </h2>

          <div className="flex gap-6 text-white mb-4">

            <label>
              <input
                type="radio"
                value="Mme"
                {...register("civility")}
              />
              <span className="ml-2">Mme</span>
            </label>

            <label>
              <input
                type="radio"
                value="M"
                {...register("civility")}
              />
              <span className="ml-2">M</span>
            </label>

          </div>

          <p className="text-red-300 text-sm">
            {errors.civility?.message}
          </p>

          <div className="grid md:grid-cols-2 gap-4 mt-4">

            <input
              placeholder="Nom"
              className="rounded-full px-5 py-3 bg-white text-gray-900 placeholder-gray-500"
              {...register("lastName")}
            />

            <input
              placeholder="Prénom"
              className="rounded-full px-5 py-3 bg-white text-gray-900 placeholder-gray-500"
              {...register("firstName")}
            />

          </div>

          <p className="text-red-300 text-sm mt-1">
            {errors.lastName?.message}
          </p>

          <p className="text-red-300 text-sm">
            {errors.firstName?.message}
          </p>

          <input
            placeholder="Adresse mail"
            className="w-full rounded-full px-5 py-3 mt-4 bg-white text-gray-900 placeholder-gray-500"
            {...register("email")}
          />

          <p className="text-red-300 text-sm">
            {errors.email?.message}
          </p>

          <input
            placeholder="Téléphone"
            className="w-full rounded-full px-5 py-3 mt-4 bg-white text-gray-900 placeholder-gray-500"
            {...register("phone")}
          />

          <p className="text-red-300 text-sm">
            {errors.phone?.message}
          </p>

          <div className="mt-10">

            <h3 className="text-white uppercase mb-4">
              Disponibilités
            </h3>

            {/* Sélecteurs pour composer un créneau, puis bouton pour l'ajouter
                à la liste `availabilities` (ce ne sont pas des champs du
                formulaire react-hook-form, juste de l'état React local). */}
            <div className="flex flex-wrap gap-3">

              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="rounded-full px-4 py-3 bg-white text-gray-900"
              >
                <option>Lundi</option>
                <option>Mardi</option>
                <option>Mercredi</option>
                <option>Jeudi</option>
                <option>Vendredi</option>
              </select>

              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="rounded-full px-4 py-3 bg-white text-gray-900"
              />

              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="rounded-full px-4 py-3 bg-white text-gray-900"
              />

              <button
                type="button"
                onClick={addAvailability}
                className="bg-purple-700 text-white px-5 py-3 rounded-full"
              >
                AJOUTER DISPO
              </button>

            </div>

            {/* Liste des créneaux déjà ajoutés, chacun avec un bouton "✕"
                pour le retirer via removeAvailability. */}
            <div className="mt-4 flex flex-col gap-2">

              {availabilities.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-full px-4 py-2 flex items-center gap-3 w-fit"
                >
                  {item.day} | {item.start} - {item.end}

                  <button
                    type="button"
                    onClick={() => removeAvailability(index)}
                  >
                    ✕
                  </button>
                </div>
              ))}

            </div>

          </div>

        </div>

        {/* DROITE : type de demande + message + bouton d'envoi */}

        <div>

          <h2 className="text-white text-xl font-semibold mb-6 uppercase">
            Votre message
          </h2>

          <div className="flex flex-wrap gap-5 text-white mb-6">

            <label>
              <input
                type="radio"
                value="Visite"
                {...register("requestType")}
              />
              <span className="ml-2">Demande de visite</span>
            </label>

            <label>
              <input
                type="radio"
                value="Rappel"
                {...register("requestType")}
              />
              <span className="ml-2">Être rappelé.e</span>
            </label>

            <label>
              <input
                type="radio"
                value="Photos"
                {...register("requestType")}
              />
              <span className="ml-2">Plus de photos</span>
            </label>

          </div>

          <p className="text-red-300 text-sm">
            {errors.requestType?.message}
          </p>

          <textarea
            rows={10}
            className="w-full rounded-3xl p-5 resize-none bg-white text-gray-900 placeholder-gray-500"
            placeholder="Votre message"
            {...register("message")}
          />

          <p className="text-red-300 text-sm mt-2">
            {errors.message?.message}
          </p>

          <div className="flex justify-end mt-6">

            {/* Pas de type="submit" explicite : c'est le comportement par
                défaut d'un <button> dans un <form>, donc le clic déclenche
                bien handleSubmit(onSubmit) défini sur le <form>. */}
            <button
              disabled={isSubmitting}
              className="bg-orange-400 text-white px-10 py-4 rounded-full font-semibold"
            >
              {isSubmitting ? "ENVOI..." : "ENVOYER"}
            </button>

          </div>

        </div>

      </div>

    </form>
    </>
  );
}
// Page unique du site : une photo de fond avec le formulaire de contact
// affiché par-dessus.
import ContactForm from "../components/ContactForm";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <section className="relative w-full max-w-7xl overflow-hidden rounded-[32px] shadow-2xl">

        {/* Image de fond (fichier servi depuis public/salon.png).
            "absolute inset-0" la fait occuper tout l'espace de la <section>. */}
        <img
          src="/salon.png"
          alt="Maison"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Voile noir semi-transparent posé sur l'image pour que le texte
            blanc et le formulaire restent lisibles par-dessus la photo. */}
        <div className="absolute inset-0 bg-black/50" />

        {/* "relative z-10" place ce bloc au-dessus de l'image et du voile
            dans l'ordre d'empilement (sinon il serait caché en dessous). */}
        <div className="relative z-10 p-8 md:p-12">

          <h1 className="text-white text-4xl md:text-5xl font-bold uppercase">
            Contactez l'agence
          </h1>

          <ContactForm />

        </div>
      </section>
    </main>
  );
}
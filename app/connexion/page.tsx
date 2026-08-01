import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormulaireConnexion } from "./formulaire-connexion";

export const metadata = { title: "Connexion — Woto" };

export default async function PageConnexion({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  // Déjà connecté et autorisé → accueil.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profil } = await supabase
      .from("profils")
      .select("id")
      .eq("id", user.id)
      .eq("actif", true)
      .maybeSingle();
    if (profil) redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[412px] flex-col justify-center px-6 pb-16">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-[18px] bg-ink text-3xl font-bold text-lime">
          W
        </div>
        <h1 className="text-[26px] font-bold tracking-tight">Woto</h1>
        <p className="mt-1 text-sm text-ink-3">
          Suivi du véhicule et des versements
        </p>
      </div>

      <FormulaireConnexion erreurProfil={erreur === "profil"} />

      <a
        href="/connexion/chauffeur"
        className="mx-auto mt-6 flex min-h-11 items-center px-2 text-sm font-semibold text-ink-2"
      >
        Chauffeur ? Se connecter par SMS
      </a>
    </main>
  );
}

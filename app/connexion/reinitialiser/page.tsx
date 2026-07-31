import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FormulaireReinitialisation } from "./formulaire-reinitialisation";

export const metadata = { title: "Nouveau mot de passe — Woto" };

export default async function PageReinitialisation({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const supabase = await createClient();

  // Le lien de l'email porte un code à échanger contre une session.
  let sessionValide = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    sessionValide = !error;
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    sessionValide = Boolean(user);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[412px] flex-col justify-center px-6 pb-16">
      <h1 className="mb-1 text-[19px] font-bold">Nouveau mot de passe</h1>

      {sessionValide ? (
        <>
          <p className="mb-6 text-sm text-ink-3">
            Choisis un nouveau mot de passe pour ton compte.
          </p>
          <FormulaireReinitialisation />
        </>
      ) : (
        <>
          <p className="mb-6 text-sm text-ink-3">
            Ce lien n&apos;est plus valide. Redemande un email depuis la page de
            connexion.
          </p>
          <Link
            href="/connexion"
            className="text-sm font-semibold text-brand"
          >
            Retour à la connexion
          </Link>
        </>
      )}
    </main>
  );
}

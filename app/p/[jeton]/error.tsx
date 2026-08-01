"use client";

import { useEffect } from "react";

// Page publique : le chauffeur et les tiers n'ont aucun moyen de « réessayer
// autrement ». Plutôt qu'une « Application error » avec un digest, on affiche
// un message lisible. La cause réelle part dans les logs du serveur.

export default function ErreurPartage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page de partage:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[412px] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="size-11 rounded-full bg-fill-soft" />
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.6px]">
          Page indisponible
        </h1>
        <p className="mt-2 text-[13px] leading-[1.5] text-ink-2">
          Le suivi ne peut pas être affiché pour le moment. Réessaie dans un
          instant, ou demande un nouveau lien au propriétaire du véhicule.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="flex min-h-12 items-center justify-center rounded-full bg-ink px-6 text-sm font-bold text-white"
      >
        Réessayer
      </button>
    </main>
  );
}

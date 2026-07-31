"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supprimerInspection } from "@/app/actions/inspections";

export function BoutonSupprimerInspection({
  inspectionId,
}: {
  inspectionId: string;
}) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState(false);
  const [enCours, startTransition] = useTransition();

  function supprimer() {
    if (enCours) return;
    startTransition(async () => {
      const resultat = await supprimerInspection(inspectionId);
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      toast.success("Contrôle supprimé");
      router.push("/photos");
      router.refresh();
    });
  }

  if (!confirmation) {
    return (
      <button
        type="button"
        onClick={() => setConfirmation(true)}
        className="flex min-h-11 items-center px-2 text-[13px] font-semibold text-crit"
      >
        Supprimer
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <button
        type="button"
        onClick={supprimer}
        disabled={enCours}
        className="flex min-h-11 items-center px-2 text-[13px] font-bold text-crit disabled:opacity-60"
      >
        {enCours ? "Suppression…" : "Confirmer"}
      </button>
      <button
        type="button"
        onClick={() => setConfirmation(false)}
        className="flex min-h-11 items-center px-2 text-[13px] font-semibold text-ink-3"
      >
        Annuler
      </button>
    </span>
  );
}

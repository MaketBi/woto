"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { clsx } from "clsx";
import {
  creerPartage,
  majPartage,
  regenererPartage,
} from "@/app/actions/partages";
import type { Tables } from "@/lib/database.types";

function Interrupteur({
  actif,
  onBascule,
  libelle,
}: {
  actif: boolean;
  onBascule: () => void;
  libelle: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      aria-label={libelle}
      onClick={onBascule}
      className={clsx(
        "flex h-7 w-[46px] rounded-full p-[3px] transition-colors duration-150",
        actif ? "justify-end bg-brand" : "justify-start bg-line"
      )}
    >
      <span className="size-[22px] rounded-full bg-white" />
    </button>
  );
}

export function LienPartage({
  partage,
  vehiculeId,
  urlBase,
}: {
  partage: Tables<"partages"> | null;
  vehiculeId: string;
  urlBase: string;
}) {
  const router = useRouter();
  const [enCours, startTransition] = useTransition();
  const [confirmeRegen, setConfirmeRegen] = useState(false);

  function creer() {
    if (enCours) return;
    startTransition(async () => {
      const resultat = await creerPartage(vehiculeId);
      if (!resultat.ok) toast.error(resultat.erreur);
      else router.refresh();
    });
  }

  function basculer(champ: "actif" | "voirMontants" | "voirDepenses") {
    if (!partage || enCours) return;
    startTransition(async () => {
      const resultat = await majPartage({
        id: partage.id,
        actif: champ === "actif" ? !partage.actif : undefined,
        voirMontants:
          champ === "voirMontants" ? !partage.voir_montants : undefined,
        voirDepenses:
          champ === "voirDepenses" ? !partage.voir_depenses : undefined,
      });
      if (!resultat.ok) toast.error(resultat.erreur);
      else router.refresh();
    });
  }

  async function copier() {
    if (!partage) return;
    const url = `${urlBase}/p/${partage.jeton}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié — colle-le dans WhatsApp");
    } catch {
      toast.error(url);
    }
  }

  function regenerer() {
    if (!partage || enCours) return;
    startTransition(async () => {
      const resultat = await regenererPartage(partage.id);
      setConfirmeRegen(false);
      if (!resultat.ok) toast.error(resultat.erreur);
      else {
        toast.success("Nouveau lien généré — l'ancien ne marche plus");
        router.refresh();
      }
    });
  }

  if (!partage) {
    return (
      <button
        type="button"
        onClick={creer}
        disabled={enCours}
        className="flex min-h-[46px] w-full items-center justify-center rounded-xl border border-line bg-surface text-sm font-semibold disabled:opacity-60"
      >
        {enCours ? "Création…" : "Créer le lien de consultation"}
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <button
        type="button"
        onClick={copier}
        className="w-full border-b border-line-soft px-3.5 py-[13px] text-left"
      >
        <div className="break-all font-mono text-[13px] font-medium text-brand">
          {urlBase.replace(/^https?:\/\//, "")}/p/{partage.jeton}
        </div>
        <div className="mt-[3px] text-xs text-ink-3">
          {partage.dernier_acces
            ? `Dernière consultation le ${format(parseISO(partage.dernier_acces), "d MMMM 'à' HH'h'mm", { locale: fr })}`
            : "Jamais consulté"}
          {" · toucher pour copier"}
        </div>
      </button>

      <div className="flex min-h-11 items-center justify-between border-b border-line-soft px-3.5 py-3">
        <span className="text-sm font-medium text-ink-2">Lien actif</span>
        <Interrupteur
          actif={partage.actif}
          onBascule={() => basculer("actif")}
          libelle="Lien actif"
        />
      </div>
      <div className="flex min-h-11 items-center justify-between border-b border-line-soft px-3.5 py-3">
        <span className="text-sm font-medium text-ink-2">
          Afficher les montants
        </span>
        <Interrupteur
          actif={partage.voir_montants}
          onBascule={() => basculer("voirMontants")}
          libelle="Afficher les montants"
        />
      </div>
      <div className="flex min-h-11 items-center justify-between border-b border-line-soft px-3.5 py-3">
        <span className="text-sm font-medium text-ink-2">
          Afficher les dépenses
        </span>
        <Interrupteur
          actif={partage.voir_depenses}
          onBascule={() => basculer("voirDepenses")}
          libelle="Afficher les dépenses"
        />
      </div>

      <div className="flex min-h-11 items-center justify-center px-3.5 py-2">
        {confirmeRegen ? (
          <span className="flex items-center gap-3">
            <button
              type="button"
              onClick={regenerer}
              disabled={enCours}
              className="min-h-9 text-[13px] font-bold text-crit disabled:opacity-60"
            >
              {enCours ? "Régénération…" : "Confirmer — l'ancien lien mourra"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmeRegen(false)}
              className="min-h-9 text-[13px] font-semibold text-ink-3"
            >
              Annuler
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmeRegen(true)}
            className="min-h-9 text-[13px] font-semibold text-ink-3"
          >
            Régénérer le lien
          </button>
        )}
      </div>
    </div>
  );
}

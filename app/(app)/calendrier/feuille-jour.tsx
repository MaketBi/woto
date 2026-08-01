"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clsx } from "clsx";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  BoutonPrimaire,
  BoutonSecondaire,
} from "@/components/bouton-primaire";
import {
  creerVersement,
  supprimerVersement,
  versementsDuJour,
} from "@/app/actions/versements";
import {
  ajustementDuJour,
  creerAjustement,
  supprimerAjustement,
} from "@/app/actions/ajustements";
import { libelleMode, type JourEtat } from "@/lib/libelles";
import { fcfa, dateLongue } from "@/lib/format";

const MOTIFS = [
  { valeur: "garage", libelle: "Garage" },
  { valeur: "conges", libelle: "Congés" },
  { valeur: "revision", libelle: "Révision" },
  { valeur: "panne", libelle: "Panne" },
  { valeur: "autre", libelle: "Autre" },
] as const;

const LIBELLES_MOTIF: Record<string, string> = {
  garage: "Garage",
  conges: "Congés",
  revision: "Révision",
  panne: "Panne",
  autre: "Autre",
};

const PASTILLES = {
  verse: { classe: "bg-good-soft text-good", point: "bg-good", texte: "Versé" },
  partiel: {
    classe: "bg-warn-soft text-warn-ink",
    point: "bg-warn",
    texte: "Partiel",
  },
  non_verse: {
    classe: "bg-crit-soft text-crit-ink",
    point: "bg-crit",
    texte: "Non versé",
  },
  non_du: {
    classe: "bg-plane text-ink-2",
    point: "bg-ink-3",
    texte: "Jour non dû",
  },
  a_venir: {
    classe: "bg-plane text-ink-2",
    point: "bg-ink-3",
    texte: "À venir",
  },
} as const;

export function FeuilleJour({
  jour,
  onFermer,
  contratId,
  dernierMode,
}: {
  jour: JourEtat | null;
  onFermer: () => void;
  contratId: string;
  dernierMode: string;
}) {
  const router = useRouter();
  const [enCours, startTransition] = useTransition();
  const [choixMotif, setChoixMotif] = useState<string | null>(null);
  const [ajustement, setAjustement] = useState<{
    id: string;
    motif: string;
  } | null>(null);
  const [versements, setVersements] = useState<
    { id: string; montant: number; mode: string }[]
  >([]);

  // Charge le contexte du jour à l'ouverture (ajustement couvrant, versements).
  useEffect(() => {
    setChoixMotif(null);
    setAjustement(null);
    setVersements([]);
    if (!jour) return;
    if (jour.etat === "non_du" && jour.motif) {
      ajustementDuJour(contratId, jour.jour).then((a) =>
        setAjustement(a ? { id: a.id, motif: a.motif } : null)
      );
    }
    if (jour.etat === "verse" || jour.etat === "partiel") {
      versementsDuJour(contratId, jour.jour).then(setVersements);
    }
  }, [jour, contratId]);

  if (!jour) {
    return (
      <Sheet open={false} onOpenChange={() => {}}>
        <SheetContent side="bottom" className="hidden" />
      </Sheet>
    );
  }

  const pastille = PASTILLES[jour.etat];
  const titreBrut = dateLongue(jour.jour);
  const titre = titreBrut.charAt(0).toUpperCase() + titreBrut.slice(1);
  const duEtNonRegle =
    jour.attendu > 0 && (jour.etat === "non_verse" || jour.etat === "a_venir");
  const reste = Math.max(jour.attendu - jour.recu, 0);

  function versementUnTap(montant: number) {
    if (enCours) return;
    startTransition(async () => {
      const resultat = await creerVersement({
        contratId,
        date: jour!.jour,
        montant,
        mode: dernierMode,
      });
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      if (resultat.avertissement) toast.warning(resultat.avertissement);
      else toast.success(`Versement de ${fcfa(montant)} enregistré`);
      onFermer();
      router.refresh();
    });
  }

  function marquerNonDu(motif: string) {
    if (enCours) return;
    startTransition(async () => {
      const resultat = await creerAjustement({
        contratId,
        dateDebut: jour!.jour,
        dateFin: jour!.jour,
        motif,
      });
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      toast.success("Jour marqué non dû");
      onFermer();
      router.refresh();
    });
  }

  function repasserEnDu() {
    if (enCours || !ajustement) return;
    startTransition(async () => {
      const resultat = await supprimerAjustement(ajustement.id);
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      toast.success("Jour repassé en dû");
      onFermer();
      router.refresh();
    });
  }

  function supprimer(id: string) {
    if (enCours) return;
    startTransition(async () => {
      const resultat = await supprimerVersement(id);
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      toast.success("Versement supprimé");
      onFermer();
      router.refresh();
    });
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onFermer()}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-[412px] rounded-t-[26px] border-none bg-surface px-[18px] pb-6 pt-2.5"
      >
        <div className="mx-auto mb-3.5 h-1 w-[38px] rounded-sm bg-line" />
        <SheetHeader className="flex-row items-start justify-between gap-3 p-0 text-left">
          <div>
            <SheetTitle className="text-[22px] font-bold tracking-[-0.6px]">
              {titre}
            </SheetTitle>
            <span
              className={clsx(
                "mt-2 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5",
                pastille.classe
              )}
            >
              <span className={clsx("size-2 rounded-full", pastille.point)} />
              <span className="text-[13px] font-semibold">
                {jour.etat === "non_du" && jour.motif
                  ? `Jour non dû · ${LIBELLES_MOTIF[jour.motif] ?? jour.motif}`
                  : pastille.texte}
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-fill-soft text-[15px] font-semibold text-ink-2"
          >
            ✕
          </button>
        </SheetHeader>

        {/* Détail du jour */}
        <div className="mt-3.5 rounded-2xl bg-plane px-4 py-1">
          <div className="flex justify-between border-b border-skeleton py-3">
            <span className="text-[13px] font-medium text-ink-2">
              Attendu ce jour
            </span>
            <span className="text-sm font-bold tabular-nums">
              {jour.attendu > 0 ? fcfa(jour.attendu) : "—"}
            </span>
          </div>
          <div className="flex justify-between border-b border-skeleton py-3">
            <span className="text-[13px] font-medium text-ink-2">Reçu</span>
            <span
              className={clsx(
                "text-sm font-bold tabular-nums",
                jour.recu === 0 && jour.attendu > 0 && jour.etat === "non_verse"
                  ? "text-crit-ink"
                  : jour.recu > 0
                    ? "text-good"
                    : "text-ink"
              )}
            >
              {fcfa(jour.recu)}
            </span>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-[13px] font-medium text-ink-2">
              Mode habituel
            </span>
            <span className="text-sm font-bold">
              {libelleMode(dernierMode).charAt(0).toUpperCase() +
                libelleMode(dernierMode).slice(1)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3.5 flex flex-col gap-2">
          {duEtNonRegle && choixMotif === null && (
            <>
              <BoutonPrimaire
                onClick={() => versementUnTap(jour.attendu)}
                disabled={enCours}
              >
                {enCours ? "Enregistrement…" : `Enregistrer ${fcfa(jour.attendu)}`}
              </BoutonPrimaire>
              <div className="flex gap-2">
                <BoutonSecondaire onClick={() => setChoixMotif("conges")}>
                  Jour non dû
                </BoutonSecondaire>
                <Link
                  href={`/versement/nouveau?date=${jour.jour}&montant=libre&retour=/calendrier`}
                  className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-fill-soft text-[13px] font-semibold text-ink"
                >
                  Montant partiel
                </Link>
              </div>
            </>
          )}

          {duEtNonRegle && choixMotif !== null && (
            <div className="rounded-2xl bg-plane p-4">
              <div className="mb-2.5 text-sm font-medium text-ink-2">
                Pourquoi ce jour n&apos;est-il pas dû ?
              </div>
              <div className="flex flex-wrap gap-2">
                {MOTIFS.map((m) => (
                  <button
                    key={m.valeur}
                    type="button"
                    onClick={() => setChoixMotif(m.valeur)}
                    className={clsx(
                      "flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold",
                      choixMotif === m.valeur
                        ? "bg-ink text-white"
                        : "bg-surface text-ink"
                    )}
                  >
                    {m.libelle}
                    {choixMotif === m.valeur && (
                      <span className="size-[7px] rounded-full bg-lime" />
                    )}
                  </button>
                ))}
              </div>
              <BoutonPrimaire
                onClick={() => marquerNonDu(choixMotif)}
                disabled={enCours}
                className="mt-3 min-h-12"
              >
                {enCours ? "Enregistrement…" : "Confirmer le jour non dû"}
              </BoutonPrimaire>
            </div>
          )}

          {jour.etat === "partiel" && (
            <>
              <BoutonPrimaire
                onClick={() => versementUnTap(reste)}
                disabled={enCours || reste === 0}
              >
                {enCours ? "Enregistrement…" : `Compléter · reste ${fcfa(reste)}`}
              </BoutonPrimaire>
              {versements.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => supprimer(v.id)}
                  disabled={enCours}
                  className="flex min-h-12 w-full items-center justify-center rounded-full bg-fill-soft text-[13px] font-semibold text-crit-ink"
                >
                  Supprimer le versement de {fcfa(v.montant)}
                </button>
              ))}
            </>
          )}

          {jour.etat === "verse" && (
            <>
              <Link
                href={`/versement/nouveau?date=${jour.jour}&montant=libre&retour=/calendrier`}
                className="flex min-h-12 w-full items-center justify-center rounded-full bg-fill-soft text-[13px] font-semibold text-ink"
              >
                Ajouter un autre versement ce jour
              </Link>
              {versements.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => supprimer(v.id)}
                  disabled={enCours}
                  className="flex min-h-12 w-full items-center justify-center rounded-full bg-fill-soft text-[13px] font-semibold text-crit-ink"
                >
                  Supprimer le versement de {fcfa(v.montant)}
                </button>
              ))}
            </>
          )}

          {jour.etat === "non_du" &&
            (ajustement ? (
              <BoutonSecondaire onClick={repasserEnDu} disabled={enCours}>
                {enCours ? "Un instant…" : "Repasser en jour dû"}
              </BoutonSecondaire>
            ) : jour.motif ? null : (
              <p className="text-center text-[13px] text-ink-3">
                Jour non dû par le contrat
                {estDimanche(jour.jour) ? " (dimanche)" : ""}.
              </p>
            ))}

          {jour.etat === "a_venir" && jour.attendu === 0 && (
            <p className="text-center text-[13px] text-ink-3">
              Rien à faire pour ce jour.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function estDimanche(jour: string): boolean {
  return new Date(`${jour}T00:00:00`).getDay() === 0;
}

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
    classe: "bg-crit-soft text-crit",
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
  aujourdhui,
}: {
  jour: JourEtat | null;
  onFermer: () => void;
  contratId: string;
  dernierMode: string;
  aujourdhui: string;
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
        className="mx-auto max-w-[412px] rounded-t-[20px] border-line bg-surface px-[18px] pb-[22px] pt-2.5"
      >
        <div className="mx-auto mb-3.5 h-1 w-[38px] rounded-sm bg-line" />
        <SheetHeader className="p-0 text-left">
          <SheetTitle className="text-xl font-bold tracking-[-0.3px]">
            {titre}
          </SheetTitle>
          <span
            className={clsx(
              "inline-flex w-fit items-center gap-[7px] rounded-full px-[11px] py-1.5",
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
        </SheetHeader>

        {/* Détail du jour */}
        <div className="mt-3.5 overflow-hidden rounded-xl border border-line">
          <div className="flex justify-between border-b border-line-soft px-3.5 py-3">
            <span className="text-[13px] font-medium text-ink-2">
              Attendu ce jour
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {jour.attendu > 0 ? fcfa(jour.attendu) : "—"}
            </span>
          </div>
          <div className="flex justify-between border-b border-line-soft px-3.5 py-3">
            <span className="text-[13px] font-medium text-ink-2">Reçu</span>
            <span
              className={clsx(
                "text-sm font-semibold tabular-nums",
                jour.recu === 0 && jour.attendu > 0 && jour.etat === "non_verse"
                  ? "text-crit"
                  : jour.recu > 0
                    ? "text-good"
                    : "text-ink"
              )}
            >
              {fcfa(jour.recu)}
            </span>
          </div>
          <div className="flex justify-between px-3.5 py-3">
            <span className="text-[13px] font-medium text-ink-2">
              Mode habituel
            </span>
            <span className="text-sm font-semibold">
              {libelleMode(dernierMode).charAt(0).toUpperCase() +
                libelleMode(dernierMode).slice(1)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3.5 flex flex-col gap-2">
          {duEtNonRegle && choixMotif === null && (
            <>
              <button
                type="button"
                onClick={() => versementUnTap(jour.attendu)}
                disabled={enCours}
                className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-brand text-base font-semibold text-white disabled:opacity-60"
              >
                {enCours ? "Enregistrement…" : `Enregistrer ${fcfa(jour.attendu)}`}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setChoixMotif("conges")}
                  className="flex min-h-[46px] flex-1 items-center justify-center rounded-xl border border-line bg-surface text-sm font-semibold"
                >
                  Marquer jour non dû
                </button>
                <Link
                  href={`/versement/nouveau?date=${jour.jour}&montant=libre&retour=/calendrier`}
                  className="flex min-h-[46px] flex-1 items-center justify-center rounded-xl border border-line bg-surface text-sm font-semibold"
                >
                  Montant partiel
                </Link>
              </div>
            </>
          )}

          {duEtNonRegle && choixMotif !== null && (
            <div className="rounded-xl border border-line p-3.5">
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
                      "flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold",
                      choixMotif === m.valeur
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-line bg-surface text-ink"
                    )}
                  >
                    {m.libelle}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => marquerNonDu(choixMotif)}
                disabled={enCours}
                className="mt-3 flex min-h-[46px] w-full items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white disabled:opacity-60"
              >
                {enCours ? "Enregistrement…" : "Confirmer le jour non dû"}
              </button>
            </div>
          )}

          {jour.etat === "partiel" && (
            <>
              <button
                type="button"
                onClick={() => versementUnTap(reste)}
                disabled={enCours || reste === 0}
                className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-brand text-base font-semibold text-white disabled:opacity-60"
              >
                {enCours ? "Enregistrement…" : `Compléter · reste ${fcfa(reste)}`}
              </button>
              {versements.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => supprimer(v.id)}
                  disabled={enCours}
                  className="flex min-h-[46px] w-full items-center justify-center rounded-xl border border-line bg-surface text-sm font-semibold text-crit"
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
                className="flex min-h-[46px] w-full items-center justify-center rounded-xl border border-line bg-surface text-sm font-semibold"
              >
                Ajouter un autre versement ce jour
              </Link>
              {versements.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => supprimer(v.id)}
                  disabled={enCours}
                  className="flex min-h-[46px] w-full items-center justify-center rounded-xl border border-line bg-surface text-sm font-semibold text-crit"
                >
                  Supprimer le versement de {fcfa(v.montant)}
                </button>
              ))}
            </>
          )}

          {jour.etat === "non_du" &&
            (ajustement ? (
              <button
                type="button"
                onClick={repasserEnDu}
                disabled={enCours}
                className="flex min-h-[46px] w-full items-center justify-center rounded-xl border border-line bg-surface text-sm font-semibold disabled:opacity-60"
              >
                {enCours ? "Un instant…" : "Repasser en jour dû"}
              </button>
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

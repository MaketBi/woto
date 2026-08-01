"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { clsx } from "clsx";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  changerStatutEcheance,
  creerEcheance,
  modifierEcheance,
  supprimerEcheance,
} from "@/app/actions/echeances";
import { fcfa } from "@/lib/format";
import type { Tables } from "@/lib/database.types";

const TYPES = [
  { valeur: "assurance", libelle: "Assurance" },
  { valeur: "controle_technique", libelle: "Contrôle technique" },
  { valeur: "vidange", libelle: "Vidange" },
  { valeur: "autre", libelle: "Autre" },
] as const;

type Echeance = Tables<"echeances">;

export function ListeEcheances({
  echeances,
  vehiculeId,
  aujourdhui,
}: {
  echeances: Echeance[];
  vehiculeId: string;
  aujourdhui: string;
}) {
  const router = useRouter();
  const [enCours, startTransition] = useTransition();
  const [ouverte, setOuverte] = useState(false);
  const [enEdition, setEnEdition] = useState<Echeance | null>(null);
  const [type, setType] = useState<string>("assurance");
  const [libelle, setLibelle] = useState("");
  const [date, setDate] = useState("");
  const [montant, setMontant] = useState<number>(NaN);
  const [rappel, setRappel] = useState<number>(15);

  function ouvrirCreation() {
    setEnEdition(null);
    setType("assurance");
    setLibelle("");
    setDate("");
    setMontant(NaN);
    setRappel(15);
    setOuverte(true);
  }

  function ouvrirEdition(e: Echeance) {
    setEnEdition(e);
    setType(e.type);
    setLibelle(e.libelle);
    setDate(e.date_echeance ?? "");
    setMontant(e.montant ?? NaN);
    setRappel(e.rappel_jours);
    setOuverte(true);
  }

  function enregistrer() {
    if (enCours || !libelle.trim()) return;
    startTransition(async () => {
      const params = {
        type,
        libelle,
        dateEcheance: date || undefined,
        montant: Number.isInteger(montant) && montant > 0 ? montant : undefined,
        rappelJours: Number.isInteger(rappel) && rappel >= 0 ? rappel : 15,
      };
      const resultat = enEdition
        ? await modifierEcheance({ id: enEdition.id, ...params })
        : await creerEcheance({ vehiculeId, ...params });
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      toast.success(enEdition ? "Échéance modifiée" : "Échéance ajoutée");
      setOuverte(false);
      router.refresh();
    });
  }

  function basculerStatut(e: Echeance) {
    if (enCours) return;
    startTransition(async () => {
      const resultat = await changerStatutEcheance(
        e.id,
        e.statut === "fait" ? "a_venir" : "fait"
      );
      if (!resultat.ok) toast.error(resultat.erreur);
      else router.refresh();
    });
  }

  function supprimer(e: Echeance) {
    if (enCours) return;
    startTransition(async () => {
      const resultat = await supprimerEcheance(e.id);
      if (!resultat.ok) toast.error(resultat.erreur);
      else {
        toast.success("Échéance supprimée");
        setOuverte(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={ouvrirCreation}
        className="flex min-h-[58px] w-full items-center justify-center rounded-full bg-ink text-base font-bold text-white"
      >
        Ajouter une échéance
      </button>

      {echeances.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-2 bg-surface px-4 py-[26px] text-center text-[13px] text-ink-3">
          Aucune échéance pour l&apos;instant.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[18px] bg-surface">
          {echeances.map((e, i) => {
            const faite = e.statut === "fait";
            const nbJours = e.date_echeance
              ? differenceInCalendarDays(
                  parseISO(e.date_echeance),
                  parseISO(aujourdhui)
                )
              : null;
            const urgente = !faite && nbJours !== null && nbJours <= e.rappel_jours;
            return (
              <div
                key={e.id}
                className={clsx(
                  "flex min-h-[56px] items-center justify-between gap-2 px-3.5 py-3",
                  i < echeances.length - 1 && "border-b border-line-soft"
                )}
              >
                <button
                  type="button"
                  onClick={() => ouvrirEdition(e)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div
                    className={clsx(
                      "truncate text-sm font-semibold",
                      faite && "text-ink-3 line-through"
                    )}
                  >
                    {e.libelle}
                  </div>
                  <div className="mt-0.5 text-xs text-ink-3">
                    {e.date_echeance
                      ? format(parseISO(e.date_echeance), "d MMMM yyyy", {
                          locale: fr,
                        })
                      : "Sans date"}
                    {e.montant ? ` · ${fcfa(e.montant)}` : ""}
                    {urgente && nbJours !== null
                      ? nbJours === 0
                        ? " · aujourd'hui"
                        : nbJours < 0
                          ? " · dépassée"
                          : ` · dans ${nbJours} j`
                      : ""}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => basculerStatut(e)}
                  disabled={enCours}
                  className={clsx(
                    "flex min-h-9 items-center whitespace-nowrap rounded-full px-3 text-xs font-semibold",
                    faite
                      ? "bg-good-soft text-good-ink"
                      : urgente
                        ? "bg-crit-soft text-crit-ink"
                        : "bg-plane text-ink-2"
                  )}
                >
                  {faite ? "Fait ✓" : "À venir"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Sheet open={ouverte} onOpenChange={setOuverte}>
        <SheetContent
          side="bottom"
          className="mx-auto max-w-[412px] rounded-t-[20px] border-line bg-surface px-[18px] pb-[22px] pt-2.5"
        >
          <div className="mx-auto mb-3.5 h-1 w-[38px] rounded-sm bg-line" />
          <SheetHeader className="p-0 text-left">
            <SheetTitle className="text-xl font-bold tracking-[-0.3px]">
              {enEdition ? "Modifier l'échéance" : "Nouvelle échéance"}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-3.5 flex flex-col gap-3.5">
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.valeur}
                  type="button"
                  onClick={() => setType(t.valeur)}
                  className={clsx(
                    "flex min-h-11 items-center rounded-full px-4 text-sm font-semibold",
                    type === t.valeur
                      ? "bg-ink text-white"
                      : "bg-plane text-ink"
                  )}
                >
                  {t.libelle}
                </button>
              ))}
            </div>

            <div>
              <label
                htmlFor="libelle"
                className="mb-1.5 block text-sm font-medium text-ink-2"
              >
                Libellé
              </label>
              <input
                id="libelle"
                type="text"
                value={libelle}
                onChange={(e) => setLibelle(e.target.value)}
                placeholder="Renouvellement assurance…"
                className="min-h-11 w-full rounded-[14px] bg-plane px-3 text-[15px] placeholder:text-ink-4"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="date-echeance"
                  className="mb-1.5 block text-sm font-medium text-ink-2"
                >
                  Date (facultatif)
                </label>
                <input
                  id="date-echeance"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="min-h-11 w-full rounded-[14px] bg-plane px-3 text-[15px] font-semibold"
                />
              </div>
              <div>
                <label
                  htmlFor="montant-echeance"
                  className="mb-1.5 block text-sm font-medium text-ink-2"
                >
                  Montant (facultatif)
                </label>
                <input
                  id="montant-echeance"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={Number.isNaN(montant) ? "" : montant}
                  onChange={(e) => setMontant(parseInt(e.target.value, 10))}
                  placeholder="—"
                  className="min-h-11 w-full rounded-[14px] bg-plane px-3 text-[15px] font-semibold tabular-nums placeholder:text-ink-4"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="rappel" className="text-sm font-medium text-ink-2">
                Alerte avant l&apos;échéance
              </label>
              <div className="flex items-baseline gap-1.5">
                <input
                  id="rappel"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={Number.isNaN(rappel) ? "" : rappel}
                  onChange={(e) => setRappel(parseInt(e.target.value, 10))}
                  className="w-16 rounded-[14px] bg-plane px-2 py-2 text-right text-[15px] font-semibold tabular-nums"
                />
                <span className="text-sm text-ink-3">jours</span>
              </div>
            </div>

            <button
              type="button"
              onClick={enregistrer}
              disabled={enCours || !libelle.trim()}
              className="flex min-h-[58px] w-full items-center justify-center rounded-full bg-ink text-base font-bold text-white disabled:opacity-60"
            >
              {enCours ? "Enregistrement…" : "Enregistrer"}
            </button>

            {enEdition && (
              <button
                type="button"
                onClick={() => supprimer(enEdition)}
                disabled={enCours}
                className="flex min-h-11 w-full items-center justify-center text-sm font-semibold text-crit-ink"
              >
                Supprimer cette échéance
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

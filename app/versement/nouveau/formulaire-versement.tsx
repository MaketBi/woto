"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clsx } from "clsx";
import { creerVersement } from "@/app/actions/versements";
import { fcfa } from "@/lib/format";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

const MODES = [
  { valeur: "wave", libelle: "Wave" },
  { valeur: "especes", libelle: "Espèces" },
  { valeur: "orange_money", libelle: "Orange Money" },
  { valeur: "virement", libelle: "Virement" },
] as const;

function libelleDate(date: string, aujourdhui: string): string {
  const court = format(parseISO(date), "EEE d MMM", { locale: fr });
  if (date === aujourdhui) return `Aujourd'hui · ${court}`;
  const hier = new Date(`${aujourdhui}T00:00:00`);
  hier.setDate(hier.getDate() - 1);
  const hierISO = format(hier, "yyyy-MM-dd");
  if (date === hierISO) return `Hier · ${court}`;
  return format(parseISO(date), "EEEE d MMMM", { locale: fr });
}

export function FormulaireVersement({
  contratId,
  montantJournalier,
  dernierMode,
  solde,
  dateInitiale,
  aujourdhui,
  deverrouille,
  retour,
}: {
  contratId: string;
  montantJournalier: number;
  dernierMode: string;
  solde: number;
  dateInitiale: string;
  aujourdhui: string;
  deverrouille: boolean;
  retour: string;
}) {
  const router = useRouter();
  const [enCours, startTransition] = useTransition();
  const [montantLibre, setMontantLibre] = useState(deverrouille);
  const [montant, setMontant] = useState(montantJournalier);
  const [date, setDate] = useState(dateInitiale);
  const [dateOuverte, setDateOuverte] = useState(false);
  const [mode, setMode] = useState(
    MODES.some((m) => m.valeur === dernierMode) ? dernierMode : "wave"
  );
  const [note, setNote] = useState("");

  const montantValide = Number.isInteger(montant) && montant > 0;
  const soldeApres = useMemo(
    () => solde - (montantValide ? montant : 0),
    [solde, montant, montantValide]
  );

  function enregistrer() {
    if (!montantValide || enCours) return;
    startTransition(async () => {
      const resultat = await creerVersement({
        contratId,
        date,
        montant,
        mode,
        note,
      });
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      if (resultat.avertissement) toast.warning(resultat.avertissement);
      else toast.success(`Versement de ${fcfa(montant)} enregistré`);
      router.push(retour);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[412px] flex-col">
      {/* En-tête : Annuler · Versement */}
      <div className="flex items-center justify-between px-4 pb-3 pt-1.5">
        <Link
          href={retour}
          className="flex min-h-11 items-center text-[15px] font-semibold text-brand"
        >
          Annuler
        </Link>
        <span className="text-base font-semibold">Versement</span>
        <span className="w-[60px]" />
      </div>

      <div className="flex flex-1 flex-col gap-3.5 px-4">
        {/* Montant */}
        <div className="rounded-[18px] bg-surface p-[18px]">
          <div className="text-[13px] font-medium text-ink-2">
            Montant du jour
          </div>
          {montantLibre ? (
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={Number.isNaN(montant) ? "" : montant}
              onChange={(e) => setMontant(parseInt(e.target.value, 10))}
              autoFocus
              className="mt-1.5 w-full bg-transparent text-[40px] font-bold tracking-[-1.4px] tabular-nums outline-none"
              aria-label="Montant en francs CFA"
            />
          ) : (
            <div className="mt-1.5 text-[40px] font-bold tracking-[-1.4px]">
              {fcfa(montant)}
            </div>
          )}
          {montantLibre ? (
            <p className="mt-2.5 text-xs text-ink-3">
              Montant déverrouillé — réservé aux corrections et aux versements
              partiels.
            </p>
          ) : (
            <div className="mt-2.5 flex items-center justify-between">
              <span className="inline-flex items-center gap-[7px] rounded-lg bg-plane px-2.5 py-[7px]">
                <span className="size-[9px] rounded-[2px] border-[1.5px] border-ink-3" />
                <span className="text-xs font-medium text-ink-2">
                  Fixé par le contrat · non modifiable
                </span>
              </span>
              <button
                type="button"
                onClick={() => setMontantLibre(true)}
                className="min-h-11 px-1 text-xs font-semibold text-brand"
              >
                Modifier le montant
              </button>
            </div>
          )}
        </div>

        {/* Date + mode */}
        <div className="overflow-hidden rounded-[18px] bg-surface">
          <button
            type="button"
            onClick={() => setDateOuverte((o) => !o)}
            className="flex min-h-14 w-full items-center justify-between border-b border-line-soft p-3.5"
          >
            <span className="text-sm font-medium text-ink-2">Date</span>
            <span className="flex items-center gap-2">
              <span className="text-[15px] font-semibold">
                {libelleDate(date, aujourdhui)}
              </span>
              <span className="text-[15px] font-semibold text-ink-4">›</span>
            </span>
          </button>
          {dateOuverte && (
            <div className="border-b border-line-soft p-3.5">
              <input
                type="date"
                value={date}
                max={aujourdhui}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                className="min-h-11 w-full rounded-[14px] bg-plane px-3 text-[15px] font-semibold"
                aria-label="Date du versement"
              />
            </div>
          )}
          <div className="p-3.5">
            <div className="mb-2.5 text-sm font-medium text-ink-2">
              Mode de paiement
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map((m) => (
                <button
                  key={m.valeur}
                  type="button"
                  onClick={() => setMode(m.valeur)}
                  className={clsx(
                    "flex min-h-[50px] items-center justify-center gap-2 rounded-full text-[15px]",
                    mode === m.valeur
                      ? "bg-ink font-bold text-white"
                      : "bg-plane font-semibold text-ink"
                  )}
                >
                  {m.libelle}
                  {mode === m.valeur && (
                    <span className="size-[7px] rounded-full bg-lime" />
                  )}
                </button>
              ))}
            </div>
            {MODES.some((m) => m.valeur === dernierMode) && (
              <p className="mt-[9px] text-xs text-ink-3">
                {MODES.find((m) => m.valeur === dernierMode)!.libelle} : votre
                dernier mode utilisé.
              </p>
            )}
          </div>
        </div>

        {/* Note */}
        <div className="rounded-[18px] bg-surface p-3.5">
          <label
            htmlFor="note"
            className="text-sm font-medium text-ink-2"
          >
            Note (facultatif)
          </label>
          <input
            id="note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ajouter une précision…"
            className="mt-2 w-full bg-transparent text-[15px] outline-none placeholder:text-ink-4"
          />
        </div>

        {/* Solde après */}
        <div className="flex justify-between rounded-[18px] bg-brand-soft px-4 py-3.5">
          <span className="text-[13px] font-medium text-ink-2">
            Solde après enregistrement
          </span>
          <span className="text-[13px] font-semibold tabular-nums">
            {fcfa(soldeApres)}
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-plane px-4 pb-[22px] pt-3.5">
        <button
          type="button"
          onClick={enregistrer}
          disabled={!montantValide || enCours}
          className="flex min-h-[58px] w-full items-center justify-center rounded-full bg-ink text-[17px] font-bold text-white disabled:opacity-60"
        >
          {enCours
            ? "Enregistrement…"
            : montantValide
              ? `Enregistrer ${fcfa(montant)}`
              : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}

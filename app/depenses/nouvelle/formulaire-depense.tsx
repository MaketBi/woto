"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clsx } from "clsx";
import { creerDepense } from "@/app/actions/depenses";
import { fcfa } from "@/lib/format";

const CATEGORIES = [
  { valeur: "entretien", libelle: "Entretien" },
  { valeur: "assurance", libelle: "Assurance" },
  { valeur: "controle_technique", libelle: "Contrôle technique" },
  { valeur: "divers", libelle: "Divers" },
] as const;

export function FormulaireDepense({
  vehiculeId,
  aujourdhui,
}: {
  vehiculeId: string;
  aujourdhui: string;
}) {
  const router = useRouter();
  const [enCours, startTransition] = useTransition();
  const [categorie, setCategorie] = useState<string>("entretien");
  const [montant, setMontant] = useState<number>(NaN);
  const [fournisseur, setFournisseur] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(aujourdhui);
  const [km, setKm] = useState<number>(NaN);

  const montantValide = Number.isInteger(montant) && montant > 0;

  function enregistrer() {
    if (!montantValide || enCours) return;
    startTransition(async () => {
      const resultat = await creerDepense({
        vehiculeId,
        date,
        categorie,
        montant,
        fournisseur,
        note,
        km: Number.isInteger(km) && km > 0 ? km : undefined,
      });
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      toast.success(`Dépense de ${fcfa(montant)} enregistrée`);
      router.push("/depenses");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[412px] flex-col">
      {/* En-tête */}
      <div className="flex items-center justify-between px-4 pb-3 pt-1.5">
        <Link
          href="/depenses"
          className="flex min-h-11 items-center text-[15px] font-semibold text-brand"
        >
          Annuler
        </Link>
        <span className="text-base font-semibold">Dépense</span>
        <span className="w-[60px]" />
      </div>

      <div className="flex flex-1 flex-col gap-3.5 px-4">
        {/* Catégorie */}
        <div className="rounded-[14px] border border-line bg-surface p-3.5">
          <div className="mb-2.5 text-sm font-medium text-ink-2">Catégorie</div>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.valeur}
                type="button"
                onClick={() => setCategorie(c.valeur)}
                className={clsx(
                  "flex min-h-12 items-center justify-center rounded-[10px] px-2 text-center text-sm font-semibold leading-tight",
                  categorie === c.valeur
                    ? "border-[1.5px] border-brand bg-brand-soft text-brand"
                    : "border border-line bg-surface text-ink"
                )}
              >
                {c.libelle}
              </button>
            ))}
          </div>
        </div>

        {/* Montant */}
        <div className="rounded-[14px] border border-line bg-surface p-[18px]">
          <label htmlFor="montant" className="text-[13px] font-medium text-ink-2">
            Montant
          </label>
          <div className="mt-1.5 flex items-baseline gap-2">
            <input
              id="montant"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={Number.isNaN(montant) ? "" : montant}
              onChange={(e) => setMontant(parseInt(e.target.value, 10))}
              placeholder="0"
              className="w-full bg-transparent text-[34px] font-bold tracking-[-1.2px] tabular-nums outline-none placeholder:text-ink-4"
            />
            <span className="text-[19px] font-semibold text-ink-3">F</span>
          </div>
        </div>

        {/* Détails */}
        <div className="overflow-hidden rounded-[14px] border border-line bg-surface">
          <div className="border-b border-line-soft p-3.5">
            <label
              htmlFor="fournisseur"
              className="text-sm font-medium text-ink-2"
            >
              Fournisseur (facultatif)
            </label>
            <input
              id="fournisseur"
              type="text"
              value={fournisseur}
              onChange={(e) => setFournisseur(e.target.value)}
              placeholder="Garage, assureur…"
              className="mt-2 w-full bg-transparent text-[15px] outline-none placeholder:text-ink-4"
            />
          </div>
          <div className="border-b border-line-soft p-3.5">
            <label htmlFor="note" className="text-sm font-medium text-ink-2">
              Note (facultatif)
            </label>
            <input
              id="note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Vidange + filtres…"
              className="mt-2 w-full bg-transparent text-[15px] outline-none placeholder:text-ink-4"
            />
          </div>
          <div className="flex min-h-14 items-center justify-between border-b border-line-soft p-3.5">
            <label htmlFor="date" className="text-sm font-medium text-ink-2">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              max={aujourdhui}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="min-h-11 rounded-[10px] border border-line bg-surface px-3 text-[15px] font-semibold"
            />
          </div>
          <div className="flex min-h-14 items-center justify-between p-3.5">
            <label htmlFor="km" className="text-sm font-medium text-ink-2">
              Kilométrage (facultatif)
            </label>
            <div className="flex items-baseline gap-1.5">
              <input
                id="km"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={Number.isNaN(km) ? "" : km}
                onChange={(e) => setKm(parseInt(e.target.value, 10))}
                placeholder="—"
                className="w-24 bg-transparent text-right text-[15px] font-semibold tabular-nums outline-none placeholder:text-ink-4"
              />
              <span className="text-sm text-ink-3">km</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-plane px-4 pb-[22px] pt-3.5">
        <button
          type="button"
          onClick={enregistrer}
          disabled={!montantValide || enCours}
          className="flex min-h-[54px] w-full items-center justify-center rounded-xl bg-brand text-[17px] font-semibold text-white disabled:opacity-60"
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

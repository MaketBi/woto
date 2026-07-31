import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getContratActif,
  getDepensesMois,
  moisPrecedent,
  LIBELLES_CATEGORIE,
} from "@/lib/data";
import { fcfa, jourISO } from "@/lib/format";

export const metadata = { title: "Dépenses — Woto" };

const ORDRE_CATEGORIES = [
  "entretien",
  "assurance",
  "controle_technique",
  "divers",
] as const;

export default async function PageDepenses() {
  const contrat = await getContratActif();
  if (!contrat) notFound();

  const aujourdhui = jourISO();
  const moisISO = aujourdhui.slice(0, 7);
  const donnees = await getDepensesMois(contrat.vehicule_id, moisISO);

  const nomMois = format(parseISO(`${moisISO}-01`), "MMMM", { locale: fr });
  const nomMoisMaj = nomMois.charAt(0).toUpperCase() + nomMois.slice(1);
  const moisPrecedentNom = format(
    parseISO(`${moisPrecedent(moisISO)}-01`),
    "MMMM",
    { locale: fr }
  );
  const moisPrecedentMaj =
    moisPrecedentNom.charAt(0).toUpperCase() + moisPrecedentNom.slice(1);

  return (
    <>
      {/* En-tête */}
      <div className="flex items-end justify-between">
        <h1 className="text-xl font-bold tracking-[-0.3px]">Dépenses</h1>
        <span className="flex min-h-[34px] items-center rounded-lg border border-line bg-surface px-2.5 text-xs font-semibold text-ink-2">
          {nomMoisMaj}
        </span>
      </div>

      {/* Total du mois */}
      <div className="rounded-[14px] border border-line bg-surface p-4">
        <div className="text-[13px] font-medium text-ink-2">Total du mois</div>
        <div className="mt-1 text-[34px] font-bold tracking-[-1.2px] tabular-nums">
          {fcfa(donnees.totalMois)}
        </div>
        <div className="mt-1 text-xs text-ink-3">
          {donnees.nbMois === 0
            ? "Aucune dépense"
            : donnees.nbMois === 1
              ? "1 dépense"
              : `${donnees.nbMois} dépenses`}
          {" · "}moyenne 6 mois : {fcfa(donnees.moyenne6Mois)}
        </div>
      </div>

      {/* Tuiles catégories */}
      <div className="grid grid-cols-2 gap-2">
        {ORDRE_CATEGORIES.map((cat) => {
          const total = donnees.parCategorie[cat] ?? 0;
          return (
            <div
              key={cat}
              className="rounded-xl border border-line bg-surface px-[13px] py-3"
            >
              <div className="text-[13px] font-semibold">
                {LIBELLES_CATEGORIE[cat]}
              </div>
              <div
                className={
                  total === 0
                    ? "mt-[3px] text-[15px] font-semibold text-ink-4"
                    : "mt-[3px] text-[15px] font-semibold text-ink-2"
                }
              >
                {fcfa(total)}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <Link
        href="/depenses/nouvelle"
        className="flex min-h-[52px] items-center justify-center rounded-xl bg-brand text-base font-semibold text-white"
      >
        Ajouter une dépense
      </Link>

      <Link
        href="/depenses/rentabilite"
        className="flex min-h-[46px] items-center justify-between rounded-xl border border-line bg-surface px-3.5 text-sm font-semibold"
      >
        Rentabilité sur 6 mois
        <span className="text-[15px] font-semibold text-ink-4">›</span>
      </Link>

      {/* Liste du mois */}
      <div className="mt-0.5 text-sm font-semibold">Ce mois-ci</div>
      {donnees.liste.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-2 bg-surface p-6 text-center">
          <div className="text-sm font-semibold text-ink-2">Rien à afficher</div>
          <div className="mt-1 text-[13px] leading-snug text-ink-3">
            Les dépenses du véhicule apparaîtront ici.
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          {donnees.liste.map((d, i) => (
            <div
              key={d.id}
              className={
                i < donnees.liste.length - 1
                  ? "flex items-center justify-between border-b border-line-soft px-3.5 py-[13px]"
                  : "flex items-center justify-between px-3.5 py-[13px]"
              }
            >
              <div>
                <div className="text-sm font-semibold">
                  {d.note ?? d.fournisseur ?? LIBELLES_CATEGORIE[d.categorie]}
                </div>
                <div className="mt-0.5 text-xs text-ink-3">
                  {LIBELLES_CATEGORIE[d.categorie]} ·{" "}
                  {format(parseISO(d.date), "EEE d MMM", { locale: fr })}
                </div>
              </div>
              <span className="text-sm font-semibold tabular-nums">
                {fcfa(d.montant)}
              </span>
            </div>
          ))}
        </div>
      )}

      {donnees.moisPrecedentVide && (
        <div className="rounded-xl border border-dashed border-line-2 bg-surface p-3.5 text-center text-xs leading-snug text-ink-3">
          {moisPrecedentMaj} : aucune dépense enregistrée
        </div>
      )}
    </>
  );
}

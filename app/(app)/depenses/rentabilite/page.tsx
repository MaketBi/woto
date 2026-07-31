import Link from "next/link";
import { notFound } from "next/navigation";
import { getContratActif, getRentabilite, LIBELLES_CATEGORIE } from "@/lib/data";
import { fcfa, jourISO } from "@/lib/format";
import { GraphiqueRentabilite } from "./graphique";

export const metadata = { title: "Rentabilité — Woto" };

// Dégradé orange de la charte pour la répartition par catégorie
const COULEURS_CATEGORIE: Record<string, string> = {
  entretien: "#eb6834",
  assurance: "#f09367",
  controle_technique: "#f6bfa4",
  divers: "#e6e5df",
};
const ORDRE = ["entretien", "assurance", "controle_technique", "divers"];

export default async function PageRentabilite() {
  const contrat = await getContratActif();
  if (!contrat) notFound();

  const moisCourant = jourISO().slice(0, 7);
  const donnees = await getRentabilite(
    contrat.id,
    contrat.vehicule_id,
    moisCourant
  );
  const net = donnees.totalEncaisse - donnees.totalDepenses;

  const categories = ORDRE.map((cat) => ({
    cat,
    montant: donnees.parCategorie[cat] ?? 0,
  })).filter((c) => c.montant > 0);
  const totalCategories = categories.reduce((s, c) => s + c.montant, 0);

  return (
    <>
      <div className="flex items-center justify-between">
        <Link
          href="/depenses"
          className="flex min-h-11 items-center text-[15px] font-semibold text-brand"
        >
          ‹ Dépenses
        </Link>
        <a
          href="/depenses/rentabilite/export"
          download
          className="flex min-h-11 items-center px-2 text-[13px] font-semibold text-brand"
        >
          Exporter (CSV)
        </a>
      </div>
      <h1 className="text-xl font-bold tracking-[-0.3px]">Rentabilité</h1>

      {/* Net sur 6 mois */}
      <div className="rounded-[14px] border border-line bg-surface p-4">
        <div className="text-[13px] font-medium text-ink-2">Net sur 6 mois</div>
        <div className="mt-1 text-[34px] font-bold tracking-[-1.2px] tabular-nums">
          {fcfa(net)}
        </div>
        <div className="mt-1 text-xs text-ink-3">
          {fcfa(donnees.totalEncaisse)} encaissés ·{" "}
          {fcfa(donnees.totalDepenses)} de dépenses
        </div>
      </div>

      {/* Graphique barres groupées */}
      <div className="rounded-[14px] border border-line bg-surface px-3.5 pb-3 pt-4">
        <GraphiqueRentabilite mois={donnees.mois} moisCourant={moisCourant} />
      </div>

      {/* Répartition par catégorie */}
      <div className="rounded-[14px] border border-line bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold">
          Dépenses par catégorie · 6 mois
        </h2>
        {categories.length === 0 ? (
          <p className="text-[13px] text-ink-3">
            Aucune dépense sur les 6 derniers mois.
          </p>
        ) : (
          <>
            <div className="mb-3.5 flex h-3 overflow-hidden rounded-md">
              {categories.map((c) => (
                <div
                  key={c.cat}
                  style={{
                    width: `${(c.montant / totalCategories) * 100}%`,
                    background: COULEURS_CATEGORIE[c.cat],
                  }}
                />
              ))}
            </div>
            <div className="flex flex-col gap-2.5">
              {categories.map((c) => (
                <div
                  key={c.cat}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="size-[11px] rounded-[3px]"
                      style={{ background: COULEURS_CATEGORIE[c.cat] }}
                    />
                    <span className="text-[13px] font-medium">
                      {LIBELLES_CATEGORIE[c.cat]}
                    </span>
                  </span>
                  <span className="text-[13px] font-semibold text-ink-2 tabular-nums">
                    {fcfa(c.montant)} ·{" "}
                    {Math.round((c.montant / totalCategories) * 100)} %
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

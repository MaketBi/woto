import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { clsx } from "clsx";
import { getContratActif, getHistorique, type Mouvement } from "@/lib/data";
import { fcfa, nombre } from "@/lib/format";

export const metadata = { title: "Historique — Woto" };

const FILTRES = [
  { valeur: "tout", libelle: "Tout" },
  { valeur: "versements", libelle: "Versements" },
  { valeur: "depenses", libelle: "Dépenses" },
] as const;

export default async function PageHistorique({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string }>;
}) {
  const params = await searchParams;
  const contrat = await getContratActif();
  if (!contrat) notFound();

  const filtre = FILTRES.some((f) => f.valeur === params.filtre)
    ? (params.filtre as (typeof FILTRES)[number]["valeur"])
    : "tout";

  const tous = await getHistorique(
    contrat.id,
    contrat.vehicule_id,
    contrat.montant_journalier
  );
  const mouvements = tous.filter(
    (m) =>
      filtre === "tout" ||
      (filtre === "versements" && m.type === "versement") ||
      (filtre === "depenses" && m.type === "depense")
  );

  // Regroupement par mois (déjà triés du plus récent au plus ancien)
  const parMois: { mois: string; liste: Mouvement[] }[] = [];
  for (const m of mouvements) {
    const mois = m.date.slice(0, 7);
    const dernier = parMois[parMois.length - 1];
    if (dernier && dernier.mois === mois) dernier.liste.push(m);
    else parMois.push({ mois, liste: [m] });
  }

  return (
    <>
      <h1 className="text-xl font-bold tracking-[-0.3px]">Historique</h1>

      {/* Filtres */}
      <div className="flex gap-2">
        {FILTRES.map((f) => (
          <Link
            key={f.valeur}
            href={f.valeur === "tout" ? "/historique" : `/historique?filtre=${f.valeur}`}
            className={clsx(
              "flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold",
              filtre === f.valeur
                ? "border-brand bg-brand-soft text-brand"
                : "border-line bg-surface text-ink"
            )}
          >
            {f.libelle}
          </Link>
        ))}
      </div>

      {parMois.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-2 bg-surface px-4 py-[26px] text-center">
          <div className="text-sm font-semibold text-ink-2">Rien à afficher</div>
          <div className="mt-1 text-[13px] leading-[1.4] text-ink-3">
            Aucun mouvement pour ce filtre.
          </div>
        </div>
      ) : (
        parMois.map(({ mois, liste }) => {
          const nomBrut = format(parseISO(`${mois}-01`), "MMMM yyyy", {
            locale: fr,
          });
          const nom = nomBrut.charAt(0).toUpperCase() + nomBrut.slice(1);
          const total = liste.reduce(
            (s, m) => s + (m.type === "versement" ? m.montant : -m.montant),
            0
          );
          return (
            <section key={mois}>
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.07em] text-ink-3">
                  {nom}
                </h2>
                <span
                  className={clsx(
                    "text-xs font-semibold tabular-nums",
                    total < 0 ? "text-crit" : "text-ink-2"
                  )}
                >
                  {filtre === "tout"
                    ? `net ${fcfa(total)}`
                    : fcfa(Math.abs(total))}
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-line bg-surface">
                {liste.map((m, i) => (
                  <div
                    key={`${m.type}-${m.id}`}
                    className={clsx(
                      "flex items-center justify-between px-3.5 py-3",
                      i < liste.length - 1 && "border-b border-line-soft"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {m.libelle}
                      </div>
                      <div className="mt-px text-xs text-ink-3">
                        {format(parseISO(m.date), "EEE d MMMM", { locale: fr })}
                        {m.partiel &&
                          ` · ${nombre(m.montant)} sur ${nombre(contrat.montant_journalier)}`}
                      </div>
                    </div>
                    <span
                      className={clsx(
                        "ml-2 whitespace-nowrap text-sm font-semibold tabular-nums",
                        m.type === "depense"
                          ? "text-crit"
                          : m.partiel
                            ? "text-warn"
                            : "text-good"
                      )}
                    >
                      {m.type === "depense" ? "− " : "+ "}
                      {fcfa(m.montant)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}
    </>
  );
}

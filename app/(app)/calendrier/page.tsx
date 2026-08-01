import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { clsx } from "clsx";
import {
  getContratActif,
  getDernierMode,
  getMois,
  moisPrecedent,
  moisSuivant,
} from "@/lib/data";
import { fcfa, jourISO } from "@/lib/format";
import { GrilleMois } from "./grille-mois";
import { JoursNonDus } from "./jours-non-dus";

export const metadata = { title: "Calendrier — Woto" };

const ENTETES = [
  { lettre: "L", dim: false },
  { lettre: "M", dim: false },
  { lettre: "M", dim: false },
  { lettre: "J", dim: false },
  { lettre: "V", dim: false },
  { lettre: "S", dim: false },
  { lettre: "D", dim: true },
] as const;

export default async function PageCalendrier({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string }>;
}) {
  const params = await searchParams;
  const contrat = await getContratActif();
  if (!contrat) notFound();

  const aujourdhui = jourISO();
  const moisCourant = aujourdhui.slice(0, 7);
  const moisISO =
    params.mois && /^\d{4}-(0[1-9]|1[0-2])$/.test(params.mois)
      ? params.mois
      : moisCourant;

  const [annee, mois] = [
    Number(moisISO.slice(0, 4)),
    Number(moisISO.slice(5, 7)),
  ];

  const [jours, dernierMode] = await Promise.all([
    getMois(contrat.id, annee, mois),
    getDernierMode(contrat.id),
  ]);

  const attendu = jours.reduce((s, j) => s + j.attendu, 0);
  const recu = jours.reduce((s, j) => s + j.recu, 0);
  const manquant = Math.max(attendu - recu, 0);

  const titreBrut = format(parseISO(`${moisISO}-01`), "MMMM yyyy", {
    locale: fr,
  });
  const titre = titreBrut.charAt(0).toUpperCase() + titreBrut.slice(1);
  const suivantAutorise = moisISO < moisCourant;

  return (
    <>
      {/* Navigation mois */}
      <div className="flex items-center justify-between">
        <Link
          href={`/calendrier?mois=${moisPrecedent(moisISO)}`}
          aria-label="Mois précédent"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-surface text-base font-semibold text-ink-2"
        >
          ‹
        </Link>
        <h1 className="text-2xl font-bold tracking-[-0.9px]">{titre}</h1>
        {suivantAutorise ? (
          <Link
            href={`/calendrier?mois=${moisSuivant(moisISO)}`}
            aria-label="Mois suivant"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-surface text-base font-semibold text-ink-2"
          >
            ›
          </Link>
        ) : (
          <span
            aria-hidden
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-surface text-base font-semibold text-ink-4"
          >
            ›
          </span>
        )}
      </div>

      {/* Grille */}
      <div className="rounded-[22px] bg-surface px-3.5 py-4">
        <div className="mb-2 grid grid-cols-7 gap-1.5">
          {ENTETES.map((e, i) => (
            <div
              key={i}
              className={clsx(
                "text-center text-[11px] font-semibold",
                e.dim ? "text-ink-4" : "text-ink-3"
              )}
            >
              {e.lettre}
            </div>
          ))}
        </div>
        <GrilleMois
          jours={jours}
          aujourdhui={aujourdhui}
          contratId={contrat.id}
          dernierMode={dernierMode}
        />
      </div>

      {/* Légende */}
      <div className="grid grid-cols-2 gap-2 gap-x-3.5 rounded-[18px] bg-surface px-4 py-[15px]">
        <div className="flex items-center gap-2">
          <span className="size-3.5 rounded-full bg-good-soft" />
          <span className="text-xs font-medium text-ink-2">Versé</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3.5 rounded-full bg-warn-soft" />
          <span className="text-xs font-medium text-ink-2">Partiel</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3.5 rounded-full bg-crit" />
          <span className="text-xs font-medium text-ink-2">Non versé</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hachures-non-du size-3.5 rounded-full" />
          <span className="text-xs font-medium text-ink-2">Jour non dû</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3.5 rounded-full border-[1.5px] border-line-2" />
          <span className="text-xs font-medium text-ink-2">À venir</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3.5 rounded-full bg-ink" />
          <span className="text-xs font-medium text-ink-2">Aujourd&apos;hui</span>
        </div>
      </div>

      {/* Totaux du mois */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-[18px] bg-surface px-3.5 py-[15px]">
          <div className="text-xs font-medium text-ink-2">Attendu</div>
          <div className="mt-1 text-[17px] font-bold tracking-[-0.4px] tabular-nums">
            {fcfa(attendu)}
          </div>
        </div>
        <div className="rounded-[18px] bg-surface px-3.5 py-[15px]">
          <div className="text-xs font-medium text-ink-2">Reçu</div>
          <div className="mt-1 text-[17px] font-bold tracking-[-0.4px] text-good tabular-nums">
            {fcfa(recu)}
          </div>
        </div>
        <div className="rounded-[18px] bg-surface px-3.5 py-[15px]">
          <div className="text-xs font-medium text-ink-2">Manquant</div>
          <div
            className={clsx(
              "mt-1 text-[17px] font-bold tracking-[-0.4px] tabular-nums",
              manquant > 0 ? "text-crit-ink" : "text-ink"
            )}
          >
            {fcfa(manquant)}
          </div>
        </div>
      </div>

      <JoursNonDus contratId={contrat.id} aujourdhui={aujourdhui} />

      <p className="text-xs leading-[1.4] text-ink-3">
        Touchez un jour pour voir le détail ou enregistrer un versement.
      </p>
    </>
  );
}

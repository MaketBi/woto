import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { fr } from "date-fns/locale";
import { clsx } from "clsx";
import { getContratActif, getEcheances } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { fcfa, jourISO } from "@/lib/format";
import { LienPartage } from "./lien-partage";

export const metadata = { title: "Réglages — Woto" };

const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

function libelleJoursActifs(jours: number[]): string {
  const tries = [...jours].sort((a, b) => a - b);
  // Cas usuel : plage continue (ex. lundi au samedi)
  const continue_ = tries.every((j, i) => i === 0 || j === tries[i - 1] + 1);
  if (continue_ && tries.length > 1) {
    const premier = JOURS[tries[0] - 1];
    const dernier = JOURS[tries[tries.length - 1] - 1];
    const cap = premier.charAt(0).toUpperCase() + premier.slice(1);
    return `${cap} au ${dernier}`;
  }
  return tries.map((j) => JOURS[j - 1]).join(", ");
}

export default async function PageReglages() {
  const contrat = await getContratActif();
  if (!contrat) notFound();

  const aujourdhui = jourISO();
  const supabase = await createClient();
  const [echeances, { data: partage }] = await Promise.all([
    getEcheances(contrat.vehicule_id),
    supabase
      .from("partages")
      .select("*")
      .eq("vehicule_id", contrat.vehicule_id)
      .order("cree_le", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const prochaine = echeances.find(
    (e) =>
      e.statut !== "fait" &&
      e.date_echeance !== null &&
      e.date_echeance >= aujourdhui
  );
  const urgente =
    prochaine?.date_echeance != null &&
    differenceInCalendarDays(
      parseISO(prochaine.date_echeance),
      parseISO(aujourdhui)
    ) <= prochaine.rappel_jours;

  return (
    <>
      <h1 className="mb-0.5 text-xl font-bold tracking-[-0.3px]">
        Réglages{contrat.chauffeurs ? ` · ${contrat.chauffeurs.nom}` : ""}
      </h1>

      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">
        Contrat
      </div>
      <div className="overflow-hidden rounded-[18px] bg-surface">
        <div className="flex min-h-11 items-center justify-between border-b border-line-soft px-3.5 py-3">
          <span className="text-sm font-medium text-ink-2">Montant par jour</span>
          <span className="text-[15px] font-semibold tabular-nums">
            {fcfa(contrat.montant_journalier)}
          </span>
        </div>
        <div className="flex min-h-11 items-center justify-between border-b border-line-soft px-3.5 py-3">
          <span className="text-sm font-medium text-ink-2">Jours dus</span>
          <span className="text-[15px] font-semibold">
            {libelleJoursActifs(contrat.jours_actifs)}
          </span>
        </div>
        <div className="flex min-h-11 items-center justify-between px-3.5 py-3">
          <span className="text-sm font-medium text-ink-2">Véhicule</span>
          <span className="text-[15px] font-semibold">
            {contrat.vehicules.immatriculation}
          </span>
        </div>
      </div>

      <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">
        Échéances
      </div>
      <Link
        href="/reglages/echeances"
        className="flex min-h-11 items-center justify-between rounded-[18px] bg-surface px-3.5 py-3"
      >
        <span className="text-sm font-medium text-ink-2">
          {prochaine
            ? prochaine.libelle
            : "Assurance, contrôle technique, vidange…"}
        </span>
        <span className="flex items-center gap-2">
          {prochaine?.date_echeance && (
            <span
              className={clsx(
                "text-[15px] font-semibold",
                urgente ? "text-crit-ink" : "text-ink"
              )}
            >
              {format(parseISO(prochaine.date_echeance), "d MMM", {
                locale: fr,
              })}
            </span>
          )}
          <span className="text-[15px] font-semibold text-ink-4">›</span>
        </span>
      </Link>

      <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">
        Lien de consultation
      </div>
      <LienPartage
        partage={partage ?? null}
        vehiculeId={contrat.vehicule_id}
        urlBase={process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}
      />
    </>
  );
}

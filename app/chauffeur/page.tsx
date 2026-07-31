import Link from "next/link";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/server";
import {
  getContratActif,
  getMois,
  getSolde,
  moisPrecedent,
  moisSuivant,
} from "@/lib/data";
import { fcfa, jourISO } from "@/lib/format";
import { CalendrierLecture } from "@/components/calendrier-lecture";
import { seDeconnecter } from "@/app/actions/auth";

export const metadata = { title: "Mon suivi — Woto" };

export default async function PageChauffeur({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sa fiche chauffeur (RLS : seule la sienne est visible)
  const { data: chauffeur } = await supabase
    .from("chauffeurs")
    .select("id, nom")
    .eq("user_id", user!.id)
    .maybeSingle();

  // Le contrat actif — la RLS ne montre au chauffeur que le sien
  const contrat = chauffeur ? await getContratActif() : null;

  if (!chauffeur || !contrat) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[412px] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-semibold text-ink-2">
          Aucun contrat actif pour ce compte.
        </p>
        <form action={seDeconnecter}>
          <button className="min-h-11 px-2 text-sm font-semibold text-brand">
            Se déconnecter
          </button>
        </form>
      </main>
    );
  }

  const aujourdhui = jourISO();
  const moisCourant = aujourdhui.slice(0, 7);
  const moisISO =
    params.mois && /^\d{4}-(0[1-9]|1[0-2])$/.test(params.mois)
      ? params.mois
      : moisCourant;

  const [solde, jours] = await Promise.all([
    getSolde(contrat.id),
    getMois(contrat.id, Number(moisISO.slice(0, 4)), Number(moisISO.slice(5, 7))),
  ]);

  const attendu = jours.reduce((s, j) => s + j.attendu, 0);
  const recu = jours.reduce((s, j) => s + j.recu, 0);
  const enRetard = solde > 0;

  const titreBrut = format(parseISO(`${moisISO}-01`), "MMMM yyyy", { locale: fr });
  const titre = titreBrut.charAt(0).toUpperCase() + titreBrut.slice(1);
  const suivantAutorise = moisISO < moisCourant;
  const vehicule = [contrat.vehicules.marque, contrat.vehicules.modele]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[412px] flex-col gap-2.5 px-4 pb-6 pt-3">
      {/* En-tête */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[19px] font-bold tracking-[-0.2px]">
            {chauffeur.nom}
          </h1>
          <p className="mt-0.5 text-[13px] text-ink-3">
            {[vehicule, contrat.vehicules.immatriculation]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <form action={seDeconnecter}>
          <button className="flex min-h-[34px] items-center rounded-lg border border-line bg-surface px-2.5 text-xs font-semibold text-ink-2">
            Se déconnecter
          </button>
        </form>
      </div>

      {/* Solde */}
      <div
        className={clsx(
          "rounded-[14px] border bg-surface p-[18px]",
          enRetard ? "border-crit/25" : "border-line"
        )}
      >
        <div className="text-[13px] font-medium text-ink-2">Mon solde</div>
        <div
          className={clsx(
            "my-1.5 text-[40px] font-bold leading-[1.05] tracking-[-1.5px] tabular-nums",
            enRetard ? "text-crit" : "text-ink"
          )}
        >
          {fcfa(solde)}
        </div>
        <span
          className={clsx(
            "inline-flex items-center gap-[7px] rounded-full px-3 py-[7px]",
            enRetard ? "bg-crit-soft text-crit" : "bg-good-soft text-good"
          )}
        >
          <span
            className={clsx(
              "size-2 rounded-full",
              enRetard ? "bg-crit" : "bg-good"
            )}
          />
          <span className="text-[13px] font-semibold">
            {enRetard ? "À régler au propriétaire" : "À jour"}
          </span>
        </span>
      </div>

      {/* Navigation mois */}
      <div className="flex items-center justify-between">
        <Link
          href={`/chauffeur?mois=${moisPrecedent(moisISO)}`}
          aria-label="Mois précédent"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-[10px] border border-line bg-surface text-base font-semibold text-ink-2"
        >
          ‹
        </Link>
        <h2 className="text-xl font-bold tracking-[-0.3px]">{titre}</h2>
        {suivantAutorise ? (
          <Link
            href={`/chauffeur?mois=${moisSuivant(moisISO)}`}
            aria-label="Mois suivant"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-[10px] border border-line bg-surface text-base font-semibold text-ink-2"
          >
            ›
          </Link>
        ) : (
          <span
            aria-hidden
            className="flex min-h-11 min-w-11 items-center justify-center rounded-[10px] border border-line bg-surface text-base font-semibold text-ink-4"
          >
            ›
          </span>
        )}
      </div>

      <CalendrierLecture jours={jours} aujourdhui={aujourdhui} />

      {/* Totaux */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-line bg-surface p-3">
          <div className="text-xs font-medium text-ink-2">Attendu</div>
          <div className="mt-1 text-[18px] font-bold tracking-[-0.4px] tabular-nums">
            {fcfa(attendu)}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3">
          <div className="text-xs font-medium text-ink-2">Reçu</div>
          <div className="mt-1 text-[18px] font-bold tracking-[-0.4px] text-good tabular-nums">
            {fcfa(recu)}
          </div>
        </div>
      </div>

      {/* Photos — étape 6 */}
      <div className="rounded-xl border border-dashed border-line-2 bg-surface px-4 py-[18px] text-center">
        <div className="text-sm font-semibold text-ink-2">
          Photos du véhicule
        </div>
        <div className="mt-1 text-[13px] leading-[1.4] text-ink-3">
          Le contrôle photo (6 angles + kilométrage) arrive bientôt.
        </div>
      </div>

      <p className="text-center text-[11px] leading-[1.4] text-ink-3">
        Espace personnel en lecture seule. Pour toute correction, contactez le
        propriétaire.
      </p>
    </main>
  );
}

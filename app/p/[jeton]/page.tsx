import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { clsx } from "clsx";
import { getDonneesPartage } from "@/lib/partage";
import { fcfa, jourISO } from "@/lib/format";
import { libelleMode } from "@/lib/libelles";
import { CalendrierLecture } from "@/components/calendrier-lecture";

// Page publique en LECTURE SEULE — aucune session, aucune Server Action.
// Les données sont lues côté serveur après validation du jeton (lib/partage.ts).

export const metadata = {
  title: "Woto · consultation",
  robots: { index: false, follow: false },
};

export default async function PagePublique({
  params,
}: {
  params: Promise<{ jeton: string }>;
}) {
  const { jeton } = await params;
  const aujourdhui = jourISO();
  const donnees = await getDonneesPartage(jeton, aujourdhui);
  if (!donnees) notFound();

  const {
    partage,
    vehicule,
    chauffeur,
    contrat,
    solde,
    joursNonVerses,
    mois,
    attendu,
    recu,
    depensesMois,
    derniersVersements,
  } = donnees;

  const enRetard = solde > 0;
  const nomMoisBrut = format(parseISO(aujourdhui), "MMMM yyyy", { locale: fr });
  const nomMois = nomMoisBrut.charAt(0).toUpperCase() + nomMoisBrut.slice(1);
  const nomVehicule = [vehicule.marque, vehicule.modele]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[412px] flex-col">
      {/* Bandeau consultation */}
      <div className="border-b border-line px-4 pb-2.5 pt-3">
        <div className="text-[13px] font-semibold text-ink-3">
          Woto · consultation
        </div>
        <div className="mt-0.5 text-xs text-ink-3">Lecture seule</div>
      </div>

      <main className="flex flex-1 flex-col gap-3 px-4 pb-2 pt-3.5">
        {/* En-tête */}
        <div>
          <h1 className="text-[19px] font-bold">
            {chauffeur?.nom ?? nomVehicule ?? "Véhicule"}
          </h1>
          <p className="mt-0.5 text-[13px] text-ink-3">
            {[nomVehicule, vehicule.immatriculation, nomMois.toLowerCase()]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        {/* Solde — seulement si les montants sont publics */}
        {partage.voir_montants && contrat && (
          <div className="rounded-[14px] border border-line bg-surface p-4">
            <div className="text-[13px] font-medium text-ink-2">Solde</div>
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
                "inline-flex items-center gap-[7px] rounded-full px-[11px] py-1.5",
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
                {!enRetard
                  ? "À jour"
                  : joursNonVerses > 0
                    ? `${joursNonVerses} jour${joursNonVerses > 1 ? "s" : ""} non versé${joursNonVerses > 1 ? "s" : ""}`
                    : "Solde à régler"}
              </span>
            </span>
          </div>
        )}

        {/* Calendrier du mois */}
        {contrat && mois.length > 0 && (
          <div>
            <div className="mb-2 text-sm font-semibold">{nomMois}</div>
            <CalendrierLecture jours={mois} aujourdhui={aujourdhui} />
            <div className="mt-3 flex flex-wrap gap-x-3.5 gap-y-2.5">
              <span className="flex items-center gap-1.5">
                <span className="size-[11px] rounded-[3px] border border-good/25 bg-good-soft" />
                <span className="text-[11px] font-medium text-ink-2">Versé</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-[11px] rounded-[3px] border border-warn/40 bg-warn-soft" />
                <span className="text-[11px] font-medium text-ink-2">
                  Partiel
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-[11px] rounded-[3px] border border-crit/25 bg-crit-soft" />
                <span className="text-[11px] font-medium text-ink-2">
                  Non versé
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-[11px] rounded-[3px] [background:repeating-linear-gradient(45deg,#eceae5_0_3px,#d3d2cb_3px_6px)]" />
                <span className="text-[11px] font-medium text-ink-2">
                  Non dû
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Totaux du mois */}
        {partage.voir_montants && contrat && (
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-line bg-surface px-[13px] py-3">
              <div className="text-xs font-medium text-ink-2">Attendu</div>
              <div className="mt-1 text-lg font-bold tracking-[-0.4px] tabular-nums">
                {fcfa(attendu)}
              </div>
            </div>
            <div className="rounded-xl border border-line bg-surface px-[13px] py-3">
              <div className="text-xs font-medium text-ink-2">Reçu</div>
              <div className="mt-1 text-lg font-bold tracking-[-0.4px] text-good tabular-nums">
                {fcfa(recu)}
              </div>
            </div>
          </div>
        )}

        {/* Dépenses du mois — si autorisé */}
        {partage.voir_montants && partage.voir_depenses && contrat && (
          <div className="flex items-baseline justify-between rounded-xl border border-line bg-surface px-[13px] py-3">
            <span className="text-xs font-medium text-ink-2">
              Dépenses du véhicule ce mois
            </span>
            <span className="text-lg font-bold tracking-[-0.4px] text-crit tabular-nums">
              {fcfa(depensesMois)}
            </span>
          </div>
        )}

        {/* Derniers versements */}
        {contrat && derniersVersements.length > 0 && (
          <>
            <div className="mt-0.5 text-[13px] font-semibold">
              Derniers versements
            </div>
            <div className="overflow-hidden rounded-xl border border-line bg-surface">
              {derniersVersements.map((v, i) => {
                const partiel =
                  contrat.montant_journalier > 0 &&
                  v.montant < contrat.montant_journalier;
                return (
                  <div
                    key={`${v.date}-${i}`}
                    className={clsx(
                      "flex items-center justify-between px-3.5 py-[11px]",
                      i < derniersVersements.length - 1 &&
                        "border-b border-line-soft"
                    )}
                  >
                    <span className="text-[13px] font-medium">
                      {format(parseISO(v.date), "EEE d MMMM", { locale: fr })} ·{" "}
                      {libelleMode(v.mode)}
                    </span>
                    <span
                      className={clsx(
                        "text-[13px] font-semibold tabular-nums",
                        partiel ? "text-warn" : "text-good"
                      )}
                    >
                      {partage.voir_montants ? fcfa(v.montant) : "✓"}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!contrat && (
          <div className="rounded-xl border border-dashed border-line-2 bg-surface px-4 py-[26px] text-center text-[13px] text-ink-3">
            Aucun contrat actif pour ce véhicule.
          </div>
        )}
      </main>

      <footer className="px-4 pb-5 pt-3 text-center text-[11px] leading-[1.4] text-ink-3">
        Page partagée par le propriétaire du véhicule. Aucune modification
        possible depuis ce lien.
      </footer>
    </div>
  );
}

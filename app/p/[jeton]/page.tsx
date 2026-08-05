import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { clsx } from "clsx";
import { getDonneesPartage } from "@/lib/partage";
import { fcfa, nombre, jourISO } from "@/lib/format";
import { libelleMode } from "@/lib/libelles";
import { CalendrierLecture } from "@/components/calendrier-lecture";
import { LockupWoto } from "@/components/logo-woto";

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
    totalVerse,
    mois,
    attendu,
    recu,
    depensesMois,
    derniersVersements,
  } = donnees;

  const enRetard = solde > 0;
  // Comme sur l'accueil admin : le grand chiffre est le cumul versé, pas le
  // solde dû — sans ce repère, le badge du mois voisin induit en erreur.
  const debutContrat = contrat
    ? format(parseISO(contrat.date_debut), "d MMMM", { locale: fr })
    : null;
  const nomMoisBrut = format(parseISO(aujourdhui), "MMMM yyyy", { locale: fr });
  const nomMois = nomMoisBrut.charAt(0).toUpperCase() + nomMoisBrut.slice(1);
  const nomVehicule = [vehicule.marque, vehicule.modele]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[412px] flex-col">
      {/* Bandeau consultation */}
      <div className="flex items-center justify-between px-4 pb-2.5 pt-3">
        <LockupWoto taille={26} />
        <span className="text-[11px] text-ink-3">Lecture seule</span>
      </div>

      <main className="flex flex-1 flex-col gap-3 px-4 pb-2 pt-3.5">
        {/* Solde sur fond encre — seulement si les montants sont publics */}
        {partage.voir_montants && contrat ? (
          <div className="rounded-[24px] bg-ink p-5 text-white">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-on-ink-muted">
                {[chauffeur?.nom, vehicule.immatriculation]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <span className="shrink-0 rounded-full bg-lime px-2.5 py-[5px] text-[11px] font-semibold text-ink">
                {nomMois}
              </span>
            </div>
            <div className="mt-3.5 text-[46px] font-extrabold leading-none tracking-[-2.2px] tabular-nums text-white">
              {nombre(totalVerse)}
              <span className="ml-1 text-xl tracking-normal text-on-ink-muted">
                F
              </span>
            </div>
            {debutContrat && (
              <p className="mt-1.5 text-[11px] font-medium text-on-ink-muted">
                versés depuis le {debutContrat}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <span
                className={clsx(
                  "size-[9px] rounded-full",
                  enRetard ? "bg-crit" : "bg-dot-good"
                )}
              />
              <span className="text-[13px] font-semibold text-on-ink">
                {!enRetard
                  ? "À jour"
                  : [
                      `Reste ${fcfa(solde)}`,
                      joursNonVerses > 0
                        ? `${joursNonVerses} jour${joursNonVerses > 1 ? "s" : ""} non versé${joursNonVerses > 1 ? "s" : ""}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
              </span>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.9px]">
              {chauffeur?.nom ?? nomVehicule ?? "Véhicule"}
            </h1>
            <p className="mt-0.5 text-[13px] text-ink-2">
              {[nomVehicule, vehicule.immatriculation, nomMois.toLowerCase()]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        )}

        {/* Calendrier du mois */}
        {contrat && mois.length > 0 && (
          <div>
            <div className="mb-2 text-sm font-semibold">{nomMois}</div>
            <CalendrierLecture jours={mois} aujourdhui={aujourdhui} />
            <div className="mt-3 flex flex-wrap gap-x-3.5 gap-y-2.5">
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-good-soft" />
                <span className="text-[11px] font-medium text-ink-2">Versé</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-warn-soft" />
                <span className="text-[11px] font-medium text-ink-2">
                  Partiel
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-crit" />
                <span className="text-[11px] font-medium text-ink-2">
                  Non versé
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="hachures-non-du size-3 rounded-full" />
                <span className="text-[11px] font-medium text-ink-2">
                  Non dû
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Totaux du mois */}
        {partage.voir_montants && contrat && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[18px] bg-surface px-4 py-[15px]">
              <div className="text-xs font-medium text-ink-2">Attendu</div>
              <div className="mt-1 text-lg font-bold tracking-[-0.4px] tabular-nums">
                {fcfa(attendu)}
              </div>
            </div>
            <div className="rounded-[18px] bg-surface px-4 py-[15px]">
              <div className="text-xs font-medium text-ink-2">Reçu</div>
              <div className="mt-1 text-lg font-bold tracking-[-0.4px] text-good tabular-nums">
                {fcfa(recu)}
              </div>
            </div>
          </div>
        )}

        {/* Dépenses du mois — si autorisé */}
        {partage.voir_montants && partage.voir_depenses && contrat && (
          <div className="flex items-baseline justify-between rounded-[18px] bg-surface px-4 py-[15px]">
            <span className="text-xs font-medium text-ink-2">
              Dépenses du véhicule ce mois
            </span>
            <span className="text-lg font-bold tracking-[-0.4px] tabular-nums">
              {fcfa(depensesMois)}
            </span>
          </div>
        )}

        {/* Derniers versements */}
        {contrat && derniersVersements.length > 0 && (
          <div className="rounded-[18px] bg-surface px-4 py-1">
              {derniersVersements.map((v, i) => {
                const partiel =
                  contrat.montant_journalier > 0 &&
                  v.montant < contrat.montant_journalier;
                return (
                  <div
                    key={`${v.date}-${i}`}
                    className={clsx(
                      "flex items-center justify-between gap-3 py-3",
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
        )}

        {!contrat && (
          <div className="rounded-[18px] bg-surface px-4 py-7 text-center text-[13px] text-ink-2">
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

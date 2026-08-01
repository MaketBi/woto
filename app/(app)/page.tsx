import Link from "next/link";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { fr } from "date-fns/locale";
import { getAccueil, type JourEtat } from "@/lib/data";
import { fcfa, nombre, jourISO, dateLongue } from "@/lib/format";
import { LienPrimaire } from "@/components/bouton-primaire";
import { clsx } from "clsx";

export const metadata = { title: "Woto" };

const LETTRES_JOUR = ["L", "M", "M", "J", "V", "S", "D"];

// Pastilles de la semaine, posées sur le hero encre.
function pastilleSemaine(jour: JourEtat): string {
  switch (jour.etat) {
    case "verse":
      return "bg-dot-good";
    case "partiel":
      return "bg-dot-warn";
    case "non_verse":
      return "bg-crit";
    case "non_du":
      return "hachures-non-du opacity-40";
    default:
      return "border-[1.5px] border-dashed border-ink-dash";
  }
}

export default async function Accueil() {
  const aujourdhui = jourISO();
  const donnees = await getAccueil(aujourdhui);

  if (!donnees) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm font-semibold text-ink-2">Aucun contrat actif.</p>
        <p className="text-[13px] text-ink-3">
          Crée le véhicule, le chauffeur et le contrat pour commencer le suivi.
        </p>
      </div>
    );
  }

  const {
    contrat,
    solde,
    aucunVersement,
    dernierVersement,
    joursNonVerses,
    joursPartiels,
    premierRetard,
    semaine,
    encaisseMois,
    depensesMois,
    echeanceProche,
    mouvements,
  } = donnees;

  const enRetard = solde > 0;
  const nomMois = format(parseISO(aujourdhui), "MMMM", { locale: fr });
  const nomMoisMaj = nomMois.charAt(0).toUpperCase() + nomMois.slice(1);
  // Le hero s'adresse au chauffeur par son prénom : « Solde de Moussa ».
  const prenom = (contrat.chauffeurs?.nom ?? "Chauffeur").split(" ")[0];

  // Ligne d'état sous le solde
  let pastille: { point: string; texte: string } | null = null;
  if (!aucunVersement) {
    if (enRetard) {
      const morceaux = [
        joursNonVerses > 0
          ? `${joursNonVerses} jour${joursNonVerses > 1 ? "s" : ""} non versé${joursNonVerses > 1 ? "s" : ""}`
          : null,
        joursPartiels > 0
          ? `${joursPartiels} partiel${joursPartiels > 1 ? "s" : ""}`
          : null,
      ].filter(Boolean);
      pastille = {
        point: "bg-crit",
        texte: morceaux.join(" · ") || "Solde à régler",
      };
    } else {
      const nbJours = dernierVersement
        ? differenceInCalendarDays(
            parseISO(aujourdhui),
            parseISO(dernierVersement.date)
          )
        : null;
      const quand =
        nbJours === 0
          ? "aujourd'hui"
          : nbJours === 1
            ? "hier"
            : dernierVersement
              ? format(parseISO(dernierVersement.date), "EEE d MMM", {
                  locale: fr,
                })
              : "";
      pastille = {
        point: "bg-dot-good",
        texte: `À jour · dernier versement ${quand}`,
      };
    }
  }

  // Semaine : jours dus et versés
  const joursDus = semaine.filter((j) => j.attendu > 0);
  const versesSemaine = joursDus.filter((j) => j.etat === "verse").length;
  const semaineEnRetard = joursDus.some((j) => j.etat === "non_verse");

  const nbEcheanceJours = echeanceProche?.date_echeance
    ? differenceInCalendarDays(
        parseISO(echeanceProche.date_echeance),
        parseISO(aujourdhui)
      )
    : null;

  return (
    <>
      {/* Hero : identité, solde et semaine en cours réunis sur fond encre */}
      <div className="rounded-[24px] bg-ink p-5 text-white">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-on-ink-muted">
            Solde de {prenom}
          </span>
          <span className="shrink-0 rounded-full bg-lime px-2.5 py-[5px] text-[11px] font-semibold text-ink">
            {nomMoisMaj}
          </span>
        </div>
        <div
          className={clsx(
            "mt-3.5 text-[56px] font-extrabold leading-none tracking-[-2.6px] tabular-nums",
            aucunVersement
              ? "text-on-ink-muted"
              : enRetard
                ? "text-crit"
                : "text-white"
          )}
        >
          {nombre(solde)}
          <span className="ml-1 text-2xl tracking-normal text-on-ink-muted">
            F
          </span>
        </div>
        {aucunVersement ? (
          <p className="mt-3 text-[13px] leading-[1.4] text-on-ink-muted">
            Aucun versement enregistré. Le suivi démarre dès le premier
            encaissement.
          </p>
        ) : (
          pastille && (
            <div className="mt-3 flex items-center gap-2">
              <span className={clsx("size-[9px] rounded-full", pastille.point)} />
              <span className="text-[13px] font-semibold text-on-ink">
                {pastille.texte}
              </span>
            </div>
          )
        )}

        {!aucunVersement && semaine.length > 0 && (
          <>
            <div className="my-4 h-px bg-ink-line" />
            <div className="flex items-end justify-between gap-3">
              <div className="flex gap-[7px]">
                {semaine.map((j) => {
                  const isodow =
                    (new Date(`${j.jour}T00:00:00`).getDay() + 6) % 7; // 0 = lundi
                  return (
                    <div
                      key={j.jour}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <span
                        className={clsx("size-[22px] rounded-full", pastilleSemaine(j))}
                      />
                      <span className="text-[10px] font-semibold text-on-ink-muted">
                        {LETTRES_JOUR[isodow]}
                      </span>
                    </div>
                  );
                })}
              </div>
              <span
                className={clsx(
                  "shrink-0 pb-4 text-xs font-semibold",
                  semaineEnRetard ? "text-crit" : "text-on-ink-muted"
                )}
              >
                {versesSemaine} / {joursDus.length} versés
              </span>
            </div>
          </>
        )}
      </div>

      {/* Tuiles mois */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[18px] bg-surface px-4 py-[15px]">
          <div className="text-xs font-medium text-ink-2">Encaissé du mois</div>
          <div
            className={clsx(
              "mt-1.5 text-[23px] font-bold tracking-[-0.8px] tabular-nums",
              aucunVersement && encaisseMois === 0 ? "text-ink-4" : "text-ink"
            )}
          >
            {aucunVersement && encaisseMois === 0 ? "—" : fcfa(encaisseMois)}
          </div>
        </div>
        <div className="rounded-[18px] bg-surface px-4 py-[15px]">
          <div className="text-xs font-medium text-ink-2">Net du mois</div>
          <div
            className={clsx(
              "mt-1.5 text-[23px] font-bold tracking-[-0.8px] tabular-nums",
              aucunVersement && encaisseMois === 0 ? "text-ink-4" : "text-ink"
            )}
          >
            {aucunVersement && encaisseMois === 0
              ? "—"
              : fcfa(encaisseMois - depensesMois)}
          </div>
        </div>
      </div>

      {/* Alertes — barre d'accroche verticale, action en pilule */}
      {premierRetard && (
        <Link
          href="/calendrier"
          className="flex items-center justify-between gap-3 rounded-[18px] bg-surface px-4 py-3.5"
        >
          <span className="flex items-center gap-2.5">
            <span className="h-[34px] w-1.5 shrink-0 rounded-[3px] bg-crit" />
            <span>
              <span className="block text-[13px] font-semibold">
                Retard depuis {dateLongue(premierRetard)}
              </span>
              <span className="mt-px block text-xs text-ink-2">
                {joursNonVerses > 0
                  ? `${joursNonVerses} jour${joursNonVerses > 1 ? "s" : ""} à régulariser`
                  : "À régulariser"}
              </span>
            </span>
          </span>
          <span className="flex min-h-8 shrink-0 items-center rounded-full bg-lime px-3 text-xs font-semibold text-ink">
            Relancer
          </span>
        </Link>
      )}
      {echeanceProche && nbEcheanceJours !== null && (
        <Link
          href="/reglages/echeances"
          className="flex items-center justify-between gap-3 rounded-[18px] bg-surface px-4 py-3.5"
        >
          <span className="flex items-center gap-2.5">
            <span className="h-[34px] w-1.5 shrink-0 rounded-[3px] bg-lime" />
            <span>
              <span className="block text-[13px] font-semibold">
                {echeanceProche.libelle}
              </span>
              <span className="mt-px block text-xs text-ink-2">
                {nbEcheanceJours === 0
                  ? "Aujourd'hui"
                  : nbEcheanceJours === 1
                    ? "Demain"
                    : `Dans ${nbEcheanceJours} jours`}
                {echeanceProche.date_echeance
                  ? ` · ${format(parseISO(echeanceProche.date_echeance), "d MMMM", { locale: fr })}`
                  : ""}
              </span>
            </span>
          </span>
          <span className="flex min-h-8 shrink-0 items-center text-xs font-semibold text-ink-2">
            Voir
          </span>
        </Link>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <LienPrimaire href="/versement/nouveau">
          {aucunVersement
            ? "Enregistrer le premier versement"
            : `Enregistrer ${fcfa(contrat.montant_journalier)}`}
        </LienPrimaire>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/depenses/nouvelle"
            className="flex min-h-12 items-center justify-center rounded-full bg-surface text-sm font-semibold"
          >
            Dépense
          </Link>
          <Link
            href="/photos"
            className="flex min-h-12 items-center justify-center rounded-full bg-surface text-sm font-semibold"
          >
            Photos
          </Link>
        </div>
      </div>

      {/* Derniers mouvements */}
      <div className="mt-0.5 flex items-baseline justify-between">
        <span className="text-[15px] font-bold tracking-[-0.2px]">
          Derniers mouvements
        </span>
        {mouvements.length > 0 && (
          <Link href="/historique" className="text-xs font-semibold text-ink-2">
            Tout voir
          </Link>
        )}
      </div>
      {mouvements.length === 0 ? (
        <div className="rounded-[18px] bg-surface px-4 py-7 text-center">
          <div className="mx-auto mb-3 size-11 rounded-full bg-fill-soft" />
          <div className="text-[15px] font-bold">Rien à afficher</div>
          <div className="mt-1 text-[13px] leading-[1.4] text-ink-2">
            Versements et dépenses apparaîtront ici, du plus récent au plus
            ancien.
          </div>
        </div>
      ) : (
        <div className="rounded-[18px] bg-surface px-4 py-1">
          {mouvements.map((m, i) => (
            <div
              key={`${m.type}-${m.id}`}
              className={clsx(
                "flex items-center justify-between gap-3 py-3",
                i < mouvements.length - 1 && "border-b border-line-soft"
              )}
            >
              <div>
                <div className="text-sm font-semibold">{m.libelle}</div>
                <div className="mt-px text-xs text-ink-2">
                  {format(parseISO(m.date), "EEE d MMMM", { locale: fr })}
                  {m.partiel &&
                    ` · ${nombre(m.montant)} sur ${nombre(contrat.montant_journalier)}`}
                </div>
              </div>
              <span
                className={clsx(
                  "shrink-0 text-sm font-bold tabular-nums",
                  m.type === "depense"
                    ? "text-ink"
                    : m.partiel
                      ? "text-warn"
                      : "text-good"
                )}
              >
                {m.type === "depense" ? "− " : "+ "}
                {nombre(m.montant)}
              </span>
            </div>
          ))}
        </div>
      )}

      {aucunVersement && (
        <Link
          href="/reglages"
          className="flex items-center justify-between gap-3 rounded-[18px] bg-brand-soft px-4 py-3.5"
        >
          <span>
            <span className="block text-[13px] font-semibold">
              Vérifiez le contrat
            </span>
            <span className="mt-px block text-xs leading-[1.4] text-ink-2">
              {fcfa(contrat.montant_journalier)} par jour, lundi au samedi
            </span>
          </span>
          <span className="shrink-0 text-xs font-semibold text-ink-2">
            Ouvrir
          </span>
        </Link>
      )}
    </>
  );
}

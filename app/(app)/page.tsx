import Link from "next/link";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { fr } from "date-fns/locale";
import { getAccueil, type JourEtat } from "@/lib/data";
import { fcfa, nombre, jourISO, dateLongue } from "@/lib/format";
import { clsx } from "clsx";

export const metadata = { title: "Woto" };

const LETTRES_JOUR = ["L", "M", "M", "J", "V", "S", "D"];

function classesCaseSemaine(jour: JourEtat): string {
  switch (jour.etat) {
    case "verse":
      return "bg-good-soft border border-good/20";
    case "partiel":
      return "bg-warn-soft border border-warn/40";
    case "non_verse":
      return "bg-crit-soft border border-crit/25";
    case "non_du":
      return "border border-line-2 [background:repeating-linear-gradient(45deg,#eceae5_0_3px,#d3d2cb_3px_6px)]";
    default:
      return "bg-surface border-[1.5px] border-dashed border-line-2";
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
  const vehicule = [contrat.vehicules.marque, contrat.vehicules.modele]
    .filter(Boolean)
    .join(" ");

  // Pastille sous le solde
  let pastille: { classe: string; point: string; texte: string } | null = null;
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
        classe: "bg-crit-soft text-crit",
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
        classe: "bg-good-soft text-good",
        point: "bg-good",
        texte: `À jour · dernier versement ${quand}`,
      };
    }
  }

  // Semaine : jours dus et versés
  const joursDus = semaine.filter((j) => j.attendu > 0);
  const versesSemaine = joursDus.filter((j) => j.etat === "verse").length;
  const semaineEnRetard = joursDus.some((j) => j.etat === "non_verse");
  const lundi = semaine[0]?.jour;

  const nbEcheanceJours = echeanceProche?.date_echeance
    ? differenceInCalendarDays(
        parseISO(echeanceProche.date_echeance),
        parseISO(aujourdhui)
      )
    : null;

  return (
    <>
      {/* En-tête */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[19px] font-bold tracking-[-0.2px]">
            {contrat.chauffeurs?.nom ?? "Chauffeur"}
          </h1>
          <p className="mt-0.5 text-[13px] text-ink-3">
            {[vehicule, contrat.vehicules.immatriculation]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <span className="flex min-h-[34px] items-center rounded-lg border border-line bg-surface px-2.5 text-xs font-semibold text-ink-2">
          {nomMoisMaj}
        </span>
      </div>

      {/* Solde */}
      <div
        className={clsx(
          "rounded-[14px] border bg-surface p-[18px]",
          enRetard && !aucunVersement ? "border-crit/25" : "border-line"
        )}
      >
        <div className="text-[13px] font-medium text-ink-2">
          Solde du chauffeur
        </div>
        <div
          className={clsx(
            "my-1.5 text-[46px] font-bold leading-[1.05] tracking-[-1.8px] tabular-nums",
            aucunVersement ? "text-ink-3" : enRetard ? "text-crit" : "text-ink"
          )}
        >
          {fcfa(solde)}
        </div>
        {aucunVersement ? (
          <p className="text-[13px] leading-[1.4] text-ink-2">
            Aucun versement enregistré pour l&apos;instant. Le suivi commence au
            premier versement.
          </p>
        ) : (
          pastille && (
            <span
              className={clsx(
                "inline-flex items-center gap-[7px] rounded-full px-3 py-[7px]",
                pastille.classe
              )}
            >
              <span
                className={clsx("size-2 rounded-full", pastille.point)}
              />
              <span className="text-[13px] font-semibold">{pastille.texte}</span>
            </span>
          )
        )}
      </div>

      {/* Semaine en cours */}
      {!aucunVersement && semaine.length > 0 && (
        <div className="rounded-[14px] border border-line bg-surface px-4 py-3.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-medium text-ink-2">
              Semaine du {lundi ? format(parseISO(lundi), "d MMMM", { locale: fr }) : ""}
            </span>
            <span
              className={clsx(
                "text-[13px] font-semibold",
                semaineEnRetard ? "text-crit" : "text-ink"
              )}
            >
              {versesSemaine} / {joursDus.length} versés
            </span>
          </div>
          <div
            className="mt-[11px] grid gap-[7px]"
            style={{
              gridTemplateColumns: `repeat(${semaine.length}, 1fr)`,
            }}
          >
            {semaine.map((j) => {
              const isodow =
                (new Date(`${j.jour}T00:00:00`).getDay() + 6) % 7; // 0 = lundi
              return (
                <div
                  key={j.jour}
                  className="flex flex-col items-center gap-[5px]"
                >
                  <div
                    className={clsx(
                      "h-[34px] w-full rounded-lg",
                      classesCaseSemaine(j)
                    )}
                  />
                  <span
                    className={clsx(
                      "text-[11px] font-semibold",
                      j.jour === aujourdhui ? "text-ink" : "text-ink-3"
                    )}
                  >
                    {LETTRES_JOUR[isodow]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tuiles mois */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-line bg-surface px-3.5 py-[13px]">
          <div className="text-xs font-medium text-ink-2">Encaissé du mois</div>
          <div
            className={clsx(
              "mt-[5px] text-[22px] font-bold tracking-[-0.6px] tabular-nums",
              aucunVersement && encaisseMois === 0 ? "text-ink-4" : "text-ink"
            )}
          >
            {aucunVersement && encaisseMois === 0 ? "—" : fcfa(encaisseMois)}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-surface px-3.5 py-[13px]">
          <div className="text-xs font-medium text-ink-2">Net du mois</div>
          <div
            className={clsx(
              "mt-[5px] text-[22px] font-bold tracking-[-0.6px] tabular-nums",
              aucunVersement && encaisseMois === 0 ? "text-ink-4" : "text-ink"
            )}
          >
            {aucunVersement && encaisseMois === 0
              ? "—"
              : fcfa(encaisseMois - depensesMois)}
          </div>
        </div>
      </div>

      {/* Alertes */}
      {premierRetard && (
        <Link
          href="/calendrier"
          className="flex items-center justify-between gap-2.5 rounded-xl border border-crit/20 bg-crit-soft px-3.5 py-3"
        >
          <span className="text-[13px] font-medium leading-[1.35]">
            Retard depuis {dateLongue(premierRetard)}
          </span>
          <span className="whitespace-nowrap text-xs font-semibold text-crit">
            Voir
          </span>
        </Link>
      )}
      {echeanceProche && nbEcheanceJours !== null && (
        <Link
          href="/reglages"
          className="flex items-center justify-between gap-2.5 rounded-xl border border-brand/15 bg-brand-soft px-3.5 py-3"
        >
          <span className="text-[13px] font-medium leading-[1.35]">
            {echeanceProche.libelle}{" "}
            {nbEcheanceJours === 0
              ? "aujourd'hui"
              : nbEcheanceJours === 1
                ? "demain"
                : `dans ${nbEcheanceJours} jours`}
          </span>
          <span className="whitespace-nowrap text-xs font-semibold text-brand">
            Voir
          </span>
        </Link>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Link
          href="/versement/nouveau"
          className="flex min-h-[52px] items-center justify-center rounded-xl bg-brand text-base font-semibold text-white"
        >
          {aucunVersement
            ? "Enregistrer le premier versement"
            : "Enregistrer un versement"}
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/depenses/nouvelle"
            className="flex min-h-[46px] items-center justify-center rounded-xl border border-line bg-surface text-sm font-semibold"
          >
            Dépense
          </Link>
          <Link
            href="/photos"
            className="flex min-h-[46px] items-center justify-center rounded-xl border border-line bg-surface text-sm font-semibold"
          >
            Photos
          </Link>
        </div>
      </div>

      {/* Derniers mouvements */}
      <div className="mt-0.5 flex items-baseline justify-between">
        <span className="text-sm font-semibold">Derniers mouvements</span>
        {mouvements.length > 0 && (
          <Link href="/depenses" className="text-xs font-semibold text-brand">
            Tout voir
          </Link>
        )}
      </div>
      {mouvements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-2 bg-surface px-4 py-[26px] text-center">
          <div className="text-sm font-semibold text-ink-2">Rien à afficher</div>
          <div className="mt-1 text-[13px] leading-[1.4] text-ink-3">
            Les versements et dépenses apparaîtront ici, du plus récent au plus
            ancien.
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          {mouvements.map((m, i) => (
            <div
              key={`${m.type}-${m.id}`}
              className={clsx(
                "flex items-center justify-between px-3.5 py-3",
                i < mouvements.length - 1 && "border-b border-line-soft"
              )}
            >
              <div>
                <div className="text-sm font-semibold">{m.libelle}</div>
                <div className="mt-px text-xs text-ink-3">
                  {format(parseISO(m.date), "EEE d MMMM", { locale: fr })}
                  {m.partiel &&
                    ` · ${nombre(m.montant)} sur ${nombre(contrat.montant_journalier)}`}
                </div>
              </div>
              <span
                className={clsx(
                  "text-sm font-semibold tabular-nums",
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
      )}

      {aucunVersement && (
        <div className="rounded-xl border border-brand/15 bg-brand-soft px-3.5 py-3">
          <div className="text-[13px] font-semibold">Vérifiez le contrat</div>
          <div className="mt-[3px] text-xs leading-[1.4] text-ink-2">
            {fcfa(contrat.montant_journalier)} par jour travaillé, du lundi au
            samedi.
          </div>
        </div>
      )}
    </>
  );
}

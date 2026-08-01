"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clsx } from "clsx";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BoutonPrimaire } from "@/components/bouton-primaire";
import {
  modifierContrat,
  modifierVehicule,
  modifierChauffeur,
} from "@/app/actions/contrat";
import { fcfa } from "@/lib/format";

const JOURS = [
  { iso: 1, lettre: "L", nom: "lundi" },
  { iso: 2, lettre: "M", nom: "mardi" },
  { iso: 3, lettre: "M", nom: "mercredi" },
  { iso: 4, lettre: "J", nom: "jeudi" },
  { iso: 5, lettre: "V", nom: "vendredi" },
  { iso: 6, lettre: "S", nom: "samedi" },
  { iso: 7, lettre: "D", nom: "dimanche" },
] as const;

export function libelleJoursActifs(jours: number[]): string {
  const tries = [...jours].sort((a, b) => a - b);
  const continus = tries.every((j, i) => i === 0 || j === tries[i - 1] + 1);
  if (continus && tries.length > 1) {
    const premier = JOURS[tries[0] - 1].nom;
    const dernier = JOURS[tries[tries.length - 1] - 1].nom;
    return `${premier.charAt(0).toUpperCase()}${premier.slice(1)} au ${dernier}`;
  }
  return tries.map((j) => JOURS[j - 1].nom).join(", ");
}

type Ouvert = "contrat" | "vehicule" | "chauffeur" | null;

const CHAMP =
  "min-h-11 w-full rounded-[14px] bg-plane px-3 text-[15px] outline-none placeholder:text-ink-4";
const LIGNE =
  "flex min-h-11 w-full items-center justify-between gap-3 px-3.5 py-3 text-left";

export function EditionContrat({
  contrat,
}: {
  contrat: {
    id: string;
    montant_journalier: number;
    jours_actifs: number[];
    solde_initial: number;
    date_debut: string;
    vehicule_id: string;
    vehicules: {
      immatriculation: string;
      marque: string | null;
      modele: string | null;
      annee: number | null;
      km_actuel: number | null;
    };
    chauffeurs: { id: string; nom: string; telephone: string | null } | null;
  };
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState<Ouvert>(null);
  const [enCours, startTransition] = useTransition();

  // Contrat
  const [montant, setMontant] = useState(contrat.montant_journalier);
  const [jours, setJours] = useState<number[]>(contrat.jours_actifs);
  const [solde, setSolde] = useState(contrat.solde_initial);
  const [debut, setDebut] = useState(contrat.date_debut);

  // Véhicule
  const [immat, setImmat] = useState(contrat.vehicules.immatriculation);
  const [marque, setMarque] = useState(contrat.vehicules.marque ?? "");
  const [modele, setModele] = useState(contrat.vehicules.modele ?? "");
  const [annee, setAnnee] = useState<number | null>(contrat.vehicules.annee);
  const [km, setKm] = useState<number | null>(contrat.vehicules.km_actuel);

  // Chauffeur
  const [nom, setNom] = useState(contrat.chauffeurs?.nom ?? "");
  const [tel, setTel] = useState(contrat.chauffeurs?.telephone ?? "");

  function fermer() {
    setOuvert(null);
  }

  function appliquer(action: () => Promise<{ ok: boolean; erreur?: string }>) {
    if (enCours) return;
    startTransition(async () => {
      const r = await action();
      if (!r.ok) {
        toast.error(r.erreur ?? "Enregistrement impossible.");
        return;
      }
      toast.success("Modification enregistrée");
      fermer();
      router.refresh();
    });
  }

  const contratModifie =
    montant !== contrat.montant_journalier ||
    solde !== contrat.solde_initial ||
    debut !== contrat.date_debut ||
    jours.join() !== [...contrat.jours_actifs].sort((a, b) => a - b).join();

  return (
    <>
      <div className="overflow-hidden rounded-[18px] bg-surface">
        <button
          type="button"
          onClick={() => setOuvert("contrat")}
          className={clsx(LIGNE, "border-b border-line-soft")}
        >
          <span className="text-sm font-medium text-ink-2">Montant par jour</span>
          <span className="flex items-center gap-2">
            <span className="text-[15px] font-semibold tabular-nums">
              {fcfa(contrat.montant_journalier)}
            </span>
            <span className="text-[15px] font-semibold text-ink-4">›</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setOuvert("contrat")}
          className={clsx(LIGNE, "border-b border-line-soft")}
        >
          <span className="text-sm font-medium text-ink-2">Jours dus</span>
          <span className="flex items-center gap-2">
            <span className="text-[15px] font-semibold">
              {libelleJoursActifs(contrat.jours_actifs)}
            </span>
            <span className="text-[15px] font-semibold text-ink-4">›</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setOuvert("contrat")}
          className={clsx(LIGNE, "border-b border-line-soft")}
        >
          <span className="text-sm font-medium text-ink-2">Solde de départ</span>
          <span className="flex items-center gap-2">
            <span className="text-[15px] font-semibold tabular-nums">
              {fcfa(contrat.solde_initial)}
            </span>
            <span className="text-[15px] font-semibold text-ink-4">›</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setOuvert("vehicule")}
          className={clsx(LIGNE, contrat.chauffeurs && "border-b border-line-soft")}
        >
          <span className="text-sm font-medium text-ink-2">Véhicule</span>
          <span className="flex items-center gap-2">
            <span className="text-[15px] font-semibold">
              {contrat.vehicules.immatriculation}
            </span>
            <span className="text-[15px] font-semibold text-ink-4">›</span>
          </span>
        </button>
        {contrat.chauffeurs && (
          <button
            type="button"
            onClick={() => setOuvert("chauffeur")}
            className={LIGNE}
          >
            <span className="text-sm font-medium text-ink-2">Chauffeur</span>
            <span className="flex items-center gap-2">
              <span className="text-[15px] font-semibold">
                {contrat.chauffeurs.nom}
              </span>
              <span className="text-[15px] font-semibold text-ink-4">›</span>
            </span>
          </button>
        )}
      </div>

      {/* ------------------------------------------------------- Contrat */}
      <Sheet
        open={ouvert === "contrat"}
        onOpenChange={(o) => !o && fermer()}
      >
        <SheetContent
          side="bottom"
          className="mx-auto max-w-[412px] rounded-t-[26px] border-none bg-surface px-[18px] pb-6 pt-2.5"
        >
          <div className="mx-auto mb-3.5 h-1 w-[38px] rounded-sm bg-line" />
          <SheetHeader className="p-0 text-left">
            <SheetTitle className="text-[22px] font-bold tracking-[-0.6px]">
              Contrat
            </SheetTitle>
          </SheetHeader>

          <div className="mt-3.5 flex flex-col gap-3.5">
            <div>
              <label
                htmlFor="montant-jour"
                className="text-sm font-medium text-ink-2"
              >
                Montant par jour
              </label>
              <input
                id="montant-jour"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={Number.isNaN(montant) ? "" : montant}
                onChange={(e) => setMontant(parseInt(e.target.value, 10))}
                className={clsx(CHAMP, "mt-2 font-semibold tabular-nums")}
              />
            </div>

            <div>
              <span className="text-sm font-medium text-ink-2">Jours dus</span>
              <div className="mt-2 flex gap-1.5">
                {JOURS.map((j) => {
                  const actif = jours.includes(j.iso);
                  return (
                    <button
                      key={j.iso}
                      type="button"
                      aria-pressed={actif}
                      aria-label={j.nom}
                      onClick={() =>
                        setJours((prec) =>
                          actif
                            ? prec.filter((x) => x !== j.iso)
                            : [...prec, j.iso]
                        )
                      }
                      className={clsx(
                        "flex aspect-square flex-1 items-center justify-center rounded-full text-[13px] font-bold",
                        actif ? "bg-ink text-lime" : "bg-plane text-ink-2"
                      )}
                    >
                      {j.lettre}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-ink-2">
                {jours.length > 0
                  ? libelleJoursActifs(jours)
                  : "Aucun jour dû sélectionné."}
              </p>
            </div>

            <div>
              <label
                htmlFor="solde-initial"
                className="text-sm font-medium text-ink-2"
              >
                Solde de départ
              </label>
              <input
                id="solde-initial"
                type="number"
                inputMode="numeric"
                step={1}
                value={Number.isNaN(solde) ? "" : solde}
                onChange={(e) => setSolde(parseInt(e.target.value, 10))}
                className={clsx(CHAMP, "mt-2 font-semibold tabular-nums")}
              />
              <p className="mt-1.5 text-xs text-ink-2">
                Ce que le chauffeur devait déjà au début du suivi. 0 s&apos;il
                était à jour.
              </p>
            </div>

            <div>
              <label
                htmlFor="date-debut"
                className="text-sm font-medium text-ink-2"
              >
                Début du contrat
              </label>
              <input
                id="date-debut"
                type="date"
                value={debut}
                onChange={(e) => e.target.value && setDebut(e.target.value)}
                className={clsx(CHAMP, "mt-2 font-semibold")}
              />
            </div>

            {contratModifie && (
              <p className="rounded-[14px] bg-brand-soft px-4 py-3 text-xs leading-[1.5] text-ink-2">
                Ces réglages servent au calcul du solde : le modifier recalcule
                tout l&apos;historique, y compris les mois déjà passés.
              </p>
            )}

            <BoutonPrimaire
              onClick={() =>
                appliquer(() =>
                  modifierContrat({
                    contratId: contrat.id,
                    montantJournalier: montant,
                    joursActifs: jours,
                    soldeInitial: solde,
                    dateDebut: debut,
                  })
                )
              }
              disabled={enCours || jours.length === 0}
            >
              {enCours ? "Enregistrement…" : "Enregistrer"}
            </BoutonPrimaire>
          </div>
        </SheetContent>
      </Sheet>

      {/* ------------------------------------------------------ Véhicule */}
      <Sheet
        open={ouvert === "vehicule"}
        onOpenChange={(o) => !o && fermer()}
      >
        <SheetContent
          side="bottom"
          className="mx-auto max-w-[412px] rounded-t-[26px] border-none bg-surface px-[18px] pb-6 pt-2.5"
        >
          <div className="mx-auto mb-3.5 h-1 w-[38px] rounded-sm bg-line" />
          <SheetHeader className="p-0 text-left">
            <SheetTitle className="text-[22px] font-bold tracking-[-0.6px]">
              Véhicule
            </SheetTitle>
          </SheetHeader>

          <div className="mt-3.5 flex flex-col gap-3.5">
            <div>
              <label htmlFor="immat" className="text-sm font-medium text-ink-2">
                Immatriculation
              </label>
              <input
                id="immat"
                type="text"
                value={immat}
                onChange={(e) => setImmat(e.target.value)}
                placeholder="DK-4821-AB"
                className={clsx(CHAMP, "mt-2 font-semibold")}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="marque"
                  className="text-sm font-medium text-ink-2"
                >
                  Marque
                </label>
                <input
                  id="marque"
                  type="text"
                  value={marque}
                  onChange={(e) => setMarque(e.target.value)}
                  placeholder="Peugeot"
                  className={clsx(CHAMP, "mt-2")}
                />
              </div>
              <div>
                <label
                  htmlFor="modele"
                  className="text-sm font-medium text-ink-2"
                >
                  Modèle
                </label>
                <input
                  id="modele"
                  type="text"
                  value={modele}
                  onChange={(e) => setModele(e.target.value)}
                  placeholder="508"
                  className={clsx(CHAMP, "mt-2")}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="annee" className="text-sm font-medium text-ink-2">
                  Année
                </label>
                <input
                  id="annee"
                  type="number"
                  inputMode="numeric"
                  min={1950}
                  max={2100}
                  step={1}
                  value={annee ?? ""}
                  onChange={(e) =>
                    setAnnee(e.target.value ? parseInt(e.target.value, 10) : null)
                  }
                  placeholder="—"
                  className={clsx(CHAMP, "mt-2 tabular-nums")}
                />
              </div>
              <div>
                <label htmlFor="km" className="text-sm font-medium text-ink-2">
                  Kilométrage
                </label>
                <input
                  id="km"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={km ?? ""}
                  onChange={(e) =>
                    setKm(e.target.value ? parseInt(e.target.value, 10) : null)
                  }
                  placeholder="—"
                  className={clsx(CHAMP, "mt-2 tabular-nums")}
                />
              </div>
            </div>

            <BoutonPrimaire
              onClick={() =>
                appliquer(() =>
                  modifierVehicule({
                    vehiculeId: contrat.vehicule_id,
                    immatriculation: immat,
                    marque,
                    modele,
                    annee: annee ?? undefined,
                    kmActuel: km ?? undefined,
                  })
                )
              }
              disabled={enCours || !immat.trim()}
            >
              {enCours ? "Enregistrement…" : "Enregistrer"}
            </BoutonPrimaire>
          </div>
        </SheetContent>
      </Sheet>

      {/* ----------------------------------------------------- Chauffeur */}
      <Sheet
        open={ouvert === "chauffeur"}
        onOpenChange={(o) => !o && fermer()}
      >
        <SheetContent
          side="bottom"
          className="mx-auto max-w-[412px] rounded-t-[26px] border-none bg-surface px-[18px] pb-6 pt-2.5"
        >
          <div className="mx-auto mb-3.5 h-1 w-[38px] rounded-sm bg-line" />
          <SheetHeader className="p-0 text-left">
            <SheetTitle className="text-[22px] font-bold tracking-[-0.6px]">
              Chauffeur
            </SheetTitle>
          </SheetHeader>

          <div className="mt-3.5 flex flex-col gap-3.5">
            <div>
              <label htmlFor="nom" className="text-sm font-medium text-ink-2">
                Nom
              </label>
              <input
                id="nom"
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className={clsx(CHAMP, "mt-2 font-semibold")}
              />
            </div>
            <div>
              <label htmlFor="tel" className="text-sm font-medium text-ink-2">
                Téléphone
              </label>
              <input
                id="tel"
                type="tel"
                inputMode="tel"
                value={tel}
                onChange={(e) => setTel(e.target.value)}
                placeholder="+221 77 123 45 67"
                className={clsx(CHAMP, "mt-2 font-semibold tabular-nums")}
              />
              <p className="mt-1.5 text-xs text-ink-2">
                Sert à la connexion du chauffeur par SMS.
              </p>
            </div>

            <BoutonPrimaire
              onClick={() =>
                appliquer(() =>
                  modifierChauffeur({
                    chauffeurId: contrat.chauffeurs!.id,
                    nom,
                    telephone: tel,
                  })
                )
              }
              disabled={enCours || !nom.trim()}
            >
              {enCours ? "Enregistrement…" : "Enregistrer"}
            </BoutonPrimaire>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

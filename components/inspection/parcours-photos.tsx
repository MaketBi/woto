"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clsx } from "clsx";
import {
  ajouterPhoto,
  creerInspection,
  finaliserInspection,
} from "@/app/actions/inspections";
import { compresserImage } from "@/lib/compression";

// Parcours guidé des 6 angles — maquette 1j. Utilisé par l'admin et le chauffeur.

const ANGLES = [
  {
    valeur: "avant",
    libelle: "Avant",
    court: "Avant",
    consigne: "Placez-vous face à la voiture, entière dans le cadre.",
  },
  {
    valeur: "arriere",
    libelle: "Arrière",
    court: "Arrière",
    consigne: "Placez-vous derrière la voiture, entière dans le cadre.",
  },
  {
    valeur: "gauche",
    libelle: "Côté gauche",
    court: "Côté\ngauche",
    consigne: "Reculez de trois pas, la voiture entière dans le cadre.",
  },
  {
    valeur: "droite",
    libelle: "Côté droit",
    court: "Côté\ndroit",
    consigne: "Reculez de trois pas, la voiture entière dans le cadre.",
  },
  {
    valeur: "interieur",
    libelle: "Intérieur",
    court: "Intérieur",
    consigne: "Sièges avant et banquette arrière visibles.",
  },
  {
    valeur: "tableau_bord",
    libelle: "Tableau de bord",
    court: "Tableau\nde bord",
    consigne: "Contact mis, compteur kilométrique lisible.",
  },
] as const;

type AngleValeur = (typeof ANGLES)[number]["valeur"];

export function ParcoursPhotos({
  vehiculeId,
  retour,
}: {
  vehiculeId: string;
  retour: string;
}) {
  const router = useRouter();
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [apercus, setApercus] = useState<Partial<Record<AngleValeur, string>>>({});
  const [angleCourant, setAngleCourant] = useState<AngleValeur>("avant");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [finEnCours, setFinEnCours] = useState(false);
  const [km, setKm] = useState<number>(NaN);
  const [etat, setEtat] = useState<number | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const champFichier = useRef<HTMLInputElement>(null);

  // Libère les object URLs au démontage
  useEffect(() => {
    const urls = apercus;
    return () => Object.values(urls).forEach((u) => u && URL.revokeObjectURL(u));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nbPrises = Object.keys(apercus).length;
  const toutesPrises = nbPrises === ANGLES.length;
  const indexCourant = ANGLES.findIndex((a) => a.valeur === angleCourant);
  const angleInfos = ANGLES[indexCourant];

  function prochainAngleManquant(
    depuis: Partial<Record<AngleValeur, string>>
  ): AngleValeur | null {
    return ANGLES.find((a) => !depuis[a.valeur])?.valeur ?? null;
  }

  async function surFichier(evt: React.ChangeEvent<HTMLInputElement>) {
    const fichier = evt.target.files?.[0];
    evt.target.value = ""; // permet de reprendre la même photo
    if (!fichier || envoiEnCours) return;

    setEnvoiEnCours(true);
    try {
      const compressee = await compresserImage(fichier);
      console.log(
        `[photo] ${angleCourant}: ${Math.round(fichier.size / 1024)} Ko → ${Math.round(compressee.size / 1024)} Ko`
      );

      // L'inspection est créée au moment de la première photo
      let id = inspectionId;
      if (!id) {
        const creation = await creerInspection(vehiculeId);
        if (!creation.ok || !creation.inspectionId) {
          toast.error(creation.erreur ?? "Création impossible.");
          return;
        }
        id = creation.inspectionId;
        setInspectionId(id);
      }

      const donnees = new FormData();
      donnees.set("inspectionId", id);
      donnees.set("vehiculeId", vehiculeId);
      donnees.set("angle", angleCourant);
      donnees.set("fichier", compressee, `${angleCourant}.jpg`);

      const resultat = await ajouterPhoto(donnees);
      if (!resultat.ok) {
        toast.error(resultat.erreur ?? "Envoi impossible.");
        return;
      }

      const url = URL.createObjectURL(compressee);
      setApercus((prec) => {
        if (prec[angleCourant]) URL.revokeObjectURL(prec[angleCourant]!);
        const maj = { ...prec, [angleCourant]: url };
        const prochain = prochainAngleManquant(maj);
        if (prochain) setAngleCourant(prochain);
        return maj;
      });
    } catch (err) {
      console.error(err);
      toast.error("Photo illisible. Réessayez.");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function terminer() {
    if (!inspectionId || !toutesPrises || finEnCours) return;
    setFinEnCours(true);
    const resultat = await finaliserInspection({
      inspectionId,
      km: Number.isInteger(km) && km > 0 ? km : undefined,
      etatGeneral: etat ?? undefined,
      commentaire,
    });
    setFinEnCours(false);
    if (!resultat.ok) {
      toast.error(resultat.erreur ?? "Enregistrement impossible.");
      return;
    }
    toast.success("Contrôle enregistré");
    router.push(retour);
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[412px] flex-col">
      {/* En-tête */}
      <div className="flex items-center justify-between px-4 pb-2.5 pt-1.5">
        <Link
          href={retour}
          className="flex min-h-11 items-center text-[15px] font-semibold text-brand"
        >
          Fermer
        </Link>
        <span className="text-base font-semibold">
          Photos · {Math.min(nbPrises + 1, 6)} sur 6
        </span>
        <span className="w-14" />
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4">
        {/* Progression */}
        <div className="flex gap-1">
          {ANGLES.map((a) => (
            <div
              key={a.valeur}
              className={clsx(
                "h-1 flex-1 rounded-sm",
                apercus[a.valeur]
                  ? "bg-good"
                  : a.valeur === angleCourant
                    ? "bg-ink"
                    : "bg-line"
              )}
            />
          ))}
        </div>

        {/* Angle courant */}
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.4px]">
            {angleInfos.libelle}
          </h1>
          <p className="mt-[3px] text-[13px] text-ink-2">{angleInfos.consigne}</p>
        </div>

        {/* Zone photo */}
        <div className="relative aspect-[16/10] overflow-hidden rounded-[20px] hachures-photo">
          {apercus[angleCourant] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={apercus[angleCourant]}
              alt={`Photo ${angleInfos.libelle}`}
              className="size-full object-cover"
            />
          ) : (
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md border border-line bg-surface px-2.5 py-1.5 font-mono text-xs text-ink-3">
              photo {angleInfos.libelle.toLowerCase()}
            </span>
          )}
        </div>

        <input
          ref={champFichier}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={surFichier}
          className="hidden"
          aria-label="Prendre la photo"
        />
        <button
          type="button"
          onClick={() => champFichier.current?.click()}
          disabled={envoiEnCours}
          className="flex min-h-[58px] w-full items-center justify-center rounded-full bg-ink text-[17px] font-bold text-white disabled:opacity-60"
        >
          {envoiEnCours
            ? "Envoi…"
            : apercus[angleCourant]
              ? "Reprendre la photo"
              : "Prendre la photo"}
        </button>

        {/* Vignettes */}
        <div className="grid grid-cols-6 gap-1.5">
          {ANGLES.map((a) => {
            const prise = Boolean(apercus[a.valeur]);
            const courant = a.valeur === angleCourant;
            return (
              <button
                key={a.valeur}
                type="button"
                onClick={() => setAngleCourant(a.valeur)}
                className="flex flex-col items-center gap-1"
              >
                <span
                  className={clsx(
                    "block w-full overflow-hidden rounded-lg",
                    courant
                      ? "aspect-square border-[1.5px] border-ink bg-brand-soft"
                      : prise
                        ? "aspect-square border border-good/40"
                        : "aspect-square border border-dashed border-line-2 bg-surface"
                  )}
                >
                  {apercus[a.valeur] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={apercus[a.valeur]}
                      alt=""
                      className="size-full object-cover"
                    />
                  )}
                </span>
                <span
                  className={clsx(
                    "whitespace-pre-line text-center text-[9.5px] font-semibold leading-[1.15]",
                    courant ? "text-brand" : prise ? "text-good" : "text-ink-3"
                  )}
                >
                  {a.court}
                </span>
              </button>
            );
          })}
        </div>

        {/* Kilométrage + état */}
        <div className="flex flex-col gap-3 rounded-[18px] bg-surface p-3.5">
          <div className="flex items-center justify-between">
            <label htmlFor="km" className="text-sm font-medium text-ink-2">
              Kilométrage
            </label>
            <div className="flex items-baseline gap-1.5">
              <input
                id="km"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={Number.isNaN(km) ? "" : km}
                onChange={(e) => setKm(parseInt(e.target.value, 10))}
                placeholder="—"
                className="w-28 bg-transparent text-right text-[15px] font-semibold tabular-nums outline-none placeholder:text-ink-4"
              />
              <span className="text-sm text-ink-3">km</span>
            </div>
          </div>
          <div>
            <div className="mb-2 text-sm font-medium text-ink-2">
              État général
            </div>
            <div className="grid grid-cols-5 gap-[7px]">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setEtat(n)}
                  className={clsx(
                    "flex min-h-[46px] items-center justify-center rounded-full text-[15px]",
                    etat === n
                      ? "bg-ink font-bold text-lime"
                      : "bg-plane font-semibold text-ink-2"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label
              htmlFor="commentaire"
              className="mb-2 block text-sm font-medium text-ink-2"
            >
              Commentaire (facultatif)
            </label>
            <input
              id="commentaire"
              type="text"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Rayure aile avant droite…"
              className="w-full bg-transparent text-[15px] outline-none placeholder:text-ink-4"
            />
          </div>
        </div>
      </div>

      {/* Terminer */}
      <div className="px-4 pb-[22px] pt-3">
        <button
          type="button"
          onClick={terminer}
          disabled={!toutesPrises || finEnCours}
          className={clsx(
            "flex min-h-[52px] w-full items-center justify-center rounded-full text-[15px] font-semibold",
            toutesPrises
              ? "bg-ink text-white"
              : "bg-surface text-ink-3"
          )}
        >
          {finEnCours
            ? "Enregistrement…"
            : toutesPrises
              ? "Terminer le contrôle"
              : `Terminer le contrôle (${ANGLES.length - nbPrises} photo${ANGLES.length - nbPrises > 1 ? "s" : ""} restante${ANGLES.length - nbPrises > 1 ? "s" : ""})`}
        </button>
      </div>
    </div>
  );
}

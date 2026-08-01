import { clsx } from "clsx";

// Logo Woto — six pastilles pour les six jours dus de la semaine (lundi → samedi),
// la dernière en citron : le versement du jour.
// Spécification : projet Design « 13 maquettes UI multiétat », Woto Logo - retenu.dc.html
//
// Proportions constantes quelle que soit la taille (relevées sur la maquette) :
//   rayon de la tuile 28,9 % · diamètre d'une pastille 15,6 % · gouttière 10,2 %
// Les gouttières sont égales en largeur et en hauteur, jamais de dégradé,
// d'ombre portée ni de rotation.

const RAYON = 0.289;
const PASTILLE = 0.156;
const GOUTTIERE = 0.102;

// Sous 32 px, la grille de six devient illisible : on bascule sur une seule
// pastille centrée, comme le prévoit la règle d'échelle de la maquette.
const SEUIL_PASTILLE_UNIQUE = 32;

type Variante =
  | "citron-sur-encre" // défaut : tuile encre, pastilles blanches, dernière citron
  | "encre-sur-citron" // tuile citron, pastilles encre
  | "gravure" // contour encre, pastilles grises, dernière encre
  | "encre-sur-papier"; // tuile papier, pastilles encre translucides

const VARIANTES: Record<
  Variante,
  { tuile: string; pastille: string; opacite: number; derniere: string }
> = {
  "citron-sur-encre": {
    tuile: "bg-ink",
    pastille: "bg-white",
    opacite: 0.45,
    derniere: "bg-lime",
  },
  "encre-sur-citron": {
    tuile: "bg-lime",
    pastille: "bg-ink",
    opacite: 0.26,
    derniere: "bg-ink",
  },
  gravure: {
    tuile: "border-[1.5px] border-ink",
    pastille: "bg-line-2",
    opacite: 1,
    derniere: "bg-ink",
  },
  "encre-sur-papier": {
    tuile: "bg-plane",
    pastille: "bg-ink",
    opacite: 0.22,
    derniere: "bg-ink",
  },
};

export function LogoWoto({
  taille = 44,
  variante = "citron-sur-encre",
  className,
}: {
  taille?: number;
  variante?: Variante;
  className?: string;
}) {
  const v = VARIANTES[variante];
  const pastille = taille * PASTILLE;
  const gouttiere = taille * GOUTTIERE;
  const pastilleUnique = taille < SEUIL_PASTILLE_UNIQUE;

  return (
    <div
      aria-hidden
      className={clsx(
        "grid shrink-0 place-content-center justify-items-center",
        v.tuile,
        className
      )}
      style={{
        width: taille,
        height: taille,
        borderRadius: taille * RAYON,
        gridTemplateColumns: pastilleUnique
          ? undefined
          : `repeat(3, ${pastille}px)`,
        gridAutoRows: pastilleUnique ? undefined : `${pastille}px`,
        gap: pastilleUnique ? undefined : gouttiere,
        boxSizing: "border-box",
      }}
    >
      {pastilleUnique ? (
        <span
          className={clsx("rounded-full", v.derniere)}
          style={{ width: taille * 0.375, height: taille * 0.375 }}
        />
      ) : (
        Array.from({ length: 6 }, (_, i) => {
          const derniere = i === 5;
          return (
            <span
              key={i}
              className={clsx(
                "size-full rounded-full",
                derniere ? v.derniere : v.pastille
              )}
              style={derniere ? undefined : { opacity: v.opacite }}
            />
          );
        })
      )}
    </div>
  );
}

// Lockup : le logo accompagné du mot « Woto ».
export function LockupWoto({
  taille = 44,
  orientation = "horizontal",
  variante = "citron-sur-encre",
  className,
}: {
  taille?: number;
  orientation?: "horizontal" | "vertical";
  variante?: Variante;
  className?: string;
}) {
  const vertical = orientation === "vertical";
  return (
    <div
      className={clsx("flex items-center", vertical && "flex-col", className)}
      style={{ gap: vertical ? taille * 0.23 : taille * 0.25 }}
    >
      <LogoWoto taille={taille} variante={variante} />
      <span
        className="font-extrabold tracking-[-0.05em] text-ink"
        style={{ fontSize: vertical ? taille * 0.375 : taille * 0.59 }}
      >
        Woto
      </span>
    </div>
  );
}

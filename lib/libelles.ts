// Libellés et types partagés client/serveur — aucun accès données ici.

export type JourEtat = {
  jour: string;
  attendu: number;
  recu: number;
  etat: "verse" | "partiel" | "non_verse" | "non_du" | "a_venir";
  motif: string | null;
};

const LIBELLES_MODE: Record<string, string> = {
  especes: "espèces",
  wave: "Wave",
  orange_money: "Orange Money",
  virement: "virement",
  autre: "autre",
};

export const LIBELLES_CATEGORIE: Record<string, string> = {
  entretien: "Entretien",
  assurance: "Assurance",
  controle_technique: "Contrôle technique",
  divers: "Divers",
};

export function libelleMode(mode: string): string {
  return LIBELLES_MODE[mode] ?? mode;
}

// Pastilles du calendrier — charte « Carte d'encre ».
// Source unique : la grille admin, la grille lecture seule et les légendes
// lisent toutes ces classes. Ne pas redéfinir les couleurs ailleurs.
export const CLASSES_ETAT_JOUR: Record<JourEtat["etat"], string> = {
  verse: "bg-good-soft font-bold text-good",
  partiel: "bg-warn-soft font-bold text-warn-ink",
  // Chiffre en encre et non en blanc : sur le corail, le blanc tombe à 2,71 de
  // contraste (échec AA) là où l'encre atteint 6,59.
  non_verse: "bg-crit font-bold text-ink",
  non_du: "hachures-non-du font-bold text-ink-2",
  a_venir: "border-[1.5px] border-line-2 font-bold text-ink-2",
};

// Aujourd'hui prime sur l'état : pastille encre, chiffre citron.
export const CLASSE_AUJOURDHUI = "bg-ink font-bold text-lime";

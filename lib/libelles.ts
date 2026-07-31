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

import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Formatage monétaire centralisé — seul endroit du code où un montant
 * est mis en forme. Entiers F CFA uniquement, jamais de décimales.
 * Le séparateur de milliers est normalisé en espace insécable fine (U+202F),
 * quel que soit le caractère renvoyé par le runtime (U+202F ou U+00A0).
 */
export const fcfa = (n: number) =>
  `${nombre(n)} F`;

/** Nombre entier sans unité (ex. « 5 000 sur 8 000 ») — même séparateur que fcfa. */
export const nombre = (n: number) =>
  n.toLocaleString("fr-FR").replace(/[  ]/g, " ");

/** Accepte une `date` SQL (chaîne yyyy-MM-dd) ou un objet Date local. */
const asDate = (d: Date | string) => (typeof d === "string" ? parseISO(d) : d);

/** Jour métier au format `date` SQL (yyyy-MM-dd), en heure locale — jamais via toISOString(). */
export const jourISO = (d: Date = new Date()) => format(d, "yyyy-MM-dd");

/** `vendredi 31 juillet` */
export const dateLongue = (d: Date | string) =>
  format(asDate(d), "EEEE d MMMM", { locale: fr });

/** `31 juil.` */
export const dateCourte = (d: Date | string) =>
  format(asDate(d), "d MMM", { locale: fr });

/** `juillet 2026` — titre du calendrier et des récapitulatifs mensuels. */
export const moisAnnee = (d: Date | string) =>
  format(asDate(d), "MMMM yyyy", { locale: fr });

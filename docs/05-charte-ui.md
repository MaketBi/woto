# Charte UI — « Carte d'encre »

La référence visuelle est `maquettes-UI/Woto-encre.dc.html`. En cas de doute, ouvrir la maquette.

Le principe : **fonds encre, accent citron, cartes sans bordure**. La séparation visuelle repose
sur le contraste `--surface` sur `--plane`, jamais sur un trait. Il n'y a plus aucun bleu.

## Couleurs

Toutes définies dans `app/globals.css` (`:root`) et exposées en classes Tailwind. **Ne jamais
écrire une valeur hexadécimale dans un composant** : utiliser le token.

```css
--surface:    #ffffff   /* fond des cartes */
--plane:      #f5f4f0   /* fond de page */
--ink:        #16171c   /* texte principal, fonds encre, couleur d'action */
--ink-2:      #7c7b76   /* texte secondaire */
--ink-3:      #a9a8a1   /* texte discret, labels */
--ink-4:      #cfcec8   /* valeurs vides, chevrons */
--line:       #e6e5df   /* filets résiduels */
--line-soft:  #f0efe9   /* séparateurs de lignes internes */
--line-2:     #d6d5cf   /* cases « à venir » */

--lime:       #d4f24d   /* accent : puces de CTA, badges, pouce des interrupteurs */
--lime-dark:  #8ea34a

--good: #0f8a4a   --good-soft: #dff8e8   /* versé */
--warn: #c48800   --warn-ink: #a37200   --warn-soft: #fff0d0   /* partiel */
--crit: #ff7060   --crit-ink: #c93b2c   --crit-soft: #ffe9e6   /* non versé, retard */

/* Sur fond encre */
--on-ink: #e9e8ee   --on-ink-muted: #9b9aa2
--ink-line: #2b2c33   /* filet séparateur */   --ink-dash: #4b4c55
/* Pastilles vives de la semaine */
--dot-good: #3ddc7f   --dot-warn: #ffc247
--fill-soft: #f2f1ec  /* boutons secondaires */
```

`--brand` vaut `--ink` : la couleur d'action **est** l'encre.

Graphique mensuel : encaissé `--chart-1` (encre), dépenses `--chart-2` (citron). Recharts prend
des props JS : `graphique.tsx` lit ces variables au montage, il ne recopie pas les valeurs.

Les jours non dus utilisent des **hachures** à 45°, pas une couleur pleine — pour qu'ils ne
soient jamais confondus avec un état de paiement. Motif unique : l'utilitaire `hachures-non-du`
(et `hachures-photo` pour les vignettes manquantes). Ne pas redupliquer le gradient.

## Typographie

`system-ui, -apple-system, "Segoe UI", sans-serif`. Pas de police chargée depuis le web : c'est
du poids inutile en 3G.

- Solde du hero : **56 px / 800**, `letter-spacing: -2.6px`, l'unité `F` détachée en 24 px
- Titres d'écran : 24 px / 700, `letter-spacing: -0.9px`
- Titres de section : 15 px / 700
- Valeurs de tuile : 23 px / 700
- Corps : 13–15 px
- Labels de section (Réglages) : 11 px / 600, majuscules, `letter-spacing: .1em`, `--ink-3`

Tous les montants portent `tabular-nums`.

## Composants

- **Rayons** : hero 24 px, grandes cartes (calendrier, graphique) 22 px, cartes 18 px,
  boutons et chips **999 px (pilule)**, pastilles du calendrier **50 % (cercle)**
- **Cartes sans bordure.** Le contraste suffit.
- **CTA principal** : `components/bouton-primaire.tsx` — pilule encre, 58 px, avec une puce ronde
  citron de 24 px portant `→` (avancer) ou `+` (ajouter). C'est le motif signature.
- **Boutons secondaires** : pilule `--fill-soft`, sans bordure.
- **Chips de sélection** : pilule ; sélectionné = fond encre + puce citron de 7 px.
- **Interrupteurs** : 46 × 28 px ; actif = fond encre + **pouce citron**.
- **Cible tactile minimum** : 44 × 44 px.
- **Barre d'onglets** : pilule blanche flottante à 16 px des bords, l'onglet actif est une pilule
  encre pleine. 4 onglets : Accueil · Calendrier · Dépenses · Réglages.
- **Fiche de jour** : bottom sheet, rayon 26 px, avec un bouton de fermeture rond de 36 px.
  Voile `--ink` à 40 %.

### États d'un jour du calendrier

Source unique : `CLASSES_ETAT_JOUR` et `CLASSE_AUJOURDHUI` dans `lib/libelles.ts`.

| État | Fond | Chiffre |
|---|---|---|
| Versé | `--good-soft` | `--good` |
| Partiel | `--warn-soft` | `--warn-ink` |
| Non versé | `--crit` **plein** | blanc |
| Non dû | hachures | `--ink-2` |
| À venir | bordure `--line-2` | `--ink-2` |
| **Aujourd'hui** (prime sur l'état) | `--ink` **plein** | **citron** |

Le chiffre du jour reste **toujours affiché** : l'état ne doit jamais reposer sur la couleur seule.

## Formatage

- Montants : `8 000 F` — espace insécable fine, jamais de décimales, jamais de `€`
- Dans les **listes de mouvements**, le suffixe `F` tombe (`+ 8 000`) ; il est conservé sur les
  grands chiffres (hero, tuiles, totaux). Utiliser `nombre()` plutôt que `fcfa()` dans ce cas.
- Les dépenses s'affichent en encre, pas en rouge : ce n'est pas une alerte.
- Dates : `vendredi 31 juillet`, `31 juil.` en version courte — locale `fr` de date-fns
- Un solde positif s'écrit sans signe `+` : c'est une dette, pas un gain

## Ce qu'il ne faut pas faire

- Pas de bordure sur les cartes
- Pas de valeur hexadécimale hors `globals.css`
- Pas de couleur à opacité hexadécimale (`#d03b3b40`) : la charte n'en utilise aucune
- Pas de dégradés décoratifs, pas d'ombres portées lourdes
- Pas de mode sombre en V1
- Pas d'animation de plus de 200 ms

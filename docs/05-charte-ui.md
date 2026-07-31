# Charte UI

La référence visuelle est `maquette/index.html`. En cas de doute, ouvrir la maquette.

## Couleurs

```css
--surface:    #ffffff   /* fond des cartes */
--plane:      #f4f4f1   /* fond de page */
--ink:        #0b0b0b   /* texte principal */
--ink-2:      #52514e   /* texte secondaire */
--ink-3:      #898781   /* texte discret, labels */
--line:       #e6e5df   /* bordures */

--brand:      #2a78d6   /* bleu principal, boutons, liens */
--brand-soft: #eaf2fd

--good:       #0ca30c   --good-ink: #046b04   --good-soft: #e7f6e7   /* versé */
--warn:       #fab219   --warn-ink: #8a5c00   --warn-soft: #fdf3dd   /* partiel */
--crit:       #d03b3b   --crit-ink: #9c2020   --crit-soft: #fbeaea   /* non versé, retard */
```

Graphique mensuel : encaissé `#2a78d6`, dépenses `#eb6834`. Ces deux teintes ont été validées pour rester distinguables en vision daltonienne.

Les jours non dus du calendrier utilisent des **hachures** à 45°, pas une couleur pleine — pour qu'ils ne soient jamais confondus avec un état de paiement.

## Typographie

`system-ui, -apple-system, "Segoe UI", sans-serif`. Pas de police chargée depuis le web : c'est du poids inutile en 3G.

- Solde en une : **40 px / 700**
- Titres d'écran : 19 px / 700
- Corps : 14–15 px
- Labels de section : 12,5 px / 600, majuscules, `letter-spacing: .07em`, couleur `--ink-3`

Les chiffres alignés en colonne portent `font-variant-numeric: tabular-nums`. Les grands chiffres isolés gardent les chiffres proportionnels.

## Composants

- **Rayons** : cartes 14–16 px, boutons 14 px, pastilles 99 px
- **Cible tactile minimum** : 44 × 44 px. Les jours du calendrier font une case carrée pleine largeur / 7.
- **Boutons d'action principale** : pleine largeur, 16–18 px de padding vertical
- **Barre d'onglets** : Accueil · Calendrier · ＋ · Dépenses · Réglages
- **Fiche de jour** : feuille remontant du bas (bottom sheet), pas une boîte de dialogue centrée

## Formatage

- Montants : `8 000 F` — espace insécable fine comme séparateur de milliers, jamais de décimales, jamais de `€`
- Dates : `vendredi 31 juillet`, `31 juil.` en version courte — locale `fr` de date-fns
- Un solde positif s'écrit sans signe `+` : c'est une dette, pas un gain

## Ce qu'il ne faut pas faire

- Pas de dégradés décoratifs, pas d'ombres portées lourdes
- Pas d'icônes de bibliothèque tierce là où un emoji suffit (la maquette en utilise, c'est assumé)
- Pas de mode sombre en V1
- Pas d'animation de plus de 200 ms

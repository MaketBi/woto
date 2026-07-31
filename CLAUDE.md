# Woto — instructions pour Claude Code

> **Woto** = « voiture » en wolof. Application web de suivi d'un véhicule VTC exploité au Sénégal.
> Ce fichier est la source de vérité. Lis-le en entier avant d'écrire une ligne de code.

## 1. Le produit en une phrase

Un outil personnel qui répond à deux questions, à tout moment, depuis un téléphone :
**« Est-ce que le chauffeur est à jour dans ses versements ? »** et **« Est-ce que cette voiture me rapporte de l'argent ? »**

## 2. Contexte non négociable

- **Un seul véhicule, un seul chauffeur** en V1 — mais le schéma est multi-véhicule dès le départ.
- **Le chauffeur n'est pas salarié.** Il encaisse ses courses, garde sa part, et verse un montant fixe par jour travaillé.
- **Un seul type de compte : administrateur** (email + mot de passe). Le chauffeur et les tiers consultent via un lien public en lecture seule, sans compte.
- **Monnaie : franc CFA (XOF)**, entiers uniquement, jamais de décimales, jamais d'euro.
- **Mobile d'abord.** L'écran de référence fait 390 px de large. Le desktop est un bonus.
- **Coût d'hébergement : 0 €/mois.** Aucune dépendance payante ne doit être introduite.

## 3. Paramètres métier retenus

| Paramètre | Valeur |
|---|---|
| Montant journalier attendu | **8 000 F** |
| Jours dus | **lundi → samedi** (dimanche non dû) |
| Montant d'un versement | **fixe et verrouillé** dans le formulaire. Seul l'admin peut le déverrouiller pour corriger. |
| Solde de départ | **saisi manuellement** à la création du contrat (`contrats.solde_initial`) |
| Catégories de dépenses | `entretien`, `assurance`, `controle_technique`, `divers` — **et rien d'autre** |
| Modes de paiement | `especes`, `wave`, `orange_money`, `virement`, `autre` |

**Le carburant, le lavage, les péages et les amendes sont à la charge du chauffeur.** Ils ne doivent apparaître nulle part dans l'application.

## 4. La règle d'or : le calcul du solde

```
attendu(jour) = 0 si le jour n'est pas dans jours_actifs
                sinon ajustements.montant_journalier s'il existe un ajustement couvrant ce jour
                sinon contrats.montant_journalier

solde = contrats.solde_initial
      + Σ attendu(jour) pour tous les jours du début du contrat à aujourd'hui
      − Σ versements reçus
```

- solde **> 0** → le chauffeur doit de l'argent → **rouge**
- solde **≤ 0** → il est à jour ou en avance → **vert**

Ce calcul vit dans **une fonction SQL** (`solde_chauffeur`), jamais dupliqué en TypeScript.
Si tu dois l'afficher côté client, appelle la fonction. Ne réimplémente pas la formule.

## 5. Stack

- **Next.js 15**, App Router, TypeScript strict, Server Components par défaut
- **Tailwind CSS v4** + **shadcn/ui**
- **Supabase** : Postgres + Auth (email/mot de passe) + Storage (photos)
- **Vercel** pour le déploiement
- **date-fns** avec la locale `fr` pour toute manipulation de dates
- **Recharts** pour le graphique mensuel
- PWA : `manifest.json` + icônes, installable sur l'écran d'accueil

Pas de librairie de state management. Pas d'ORM par-dessus Supabase. Pas de React Native.

## 6. Conventions de code

- Le code, les noms de variables et les commentaires sont **en français** quand ils portent du métier (`solde`, `versement`, `ajustement`, `jourNonDu`) et en anglais pour la technique (`fetchData`, `formatCurrency`).
- **Formatage monétaire centralisé** dans `lib/format.ts` :
  ```ts
  export const fcfa = (n: number) => `${n.toLocaleString('fr-FR').replace(/ | /g, ' ')} F`
  ```
  Aucun `toLocaleString` monétaire ailleurs dans le code.
- **Les dates sont des `date` SQL**, jamais des timestamps, pour tout ce qui est métier (versements, ajustements, dépenses). Le fuseau du Sénégal est UTC+0 toute l'année : pas de piège d'heure d'été, mais ne pas utiliser `new Date().toISOString()` pour dériver un jour métier.
- Les montants sont des **entiers** (`bigint` en base, `number` en TS). Jamais de flottant sur de l'argent.
- Toute mutation passe par une **Server Action** avec revalidation. Pas d'appel Supabase mutant depuis un composant client.

## 7. Sécurité — à ne jamais contourner

- RLS activé sur **toutes** les tables. Écriture réservée aux utilisateurs présents et actifs dans `profils`.
- **Aucune policy `anon`** sur les tables métier. La page publique de partage (`/p/[jeton]`) est rendue **côté serveur**, valide le jeton, puis lit les données avec la clé `service_role`. Cette clé ne doit jamais atteindre le navigateur.
- La page publique est **strictement en lecture**. Aucune Server Action mutante n'y est accessible.
- `SUPABASE_SERVICE_ROLE_KEY` ne figure jamais dans une variable `NEXT_PUBLIC_*`.

## 8. Ergonomie — les règles qui font que l'outil sera utilisé

1. **Enregistrer un versement = 1 tap.** Depuis le calendrier, toucher un jour dû non versé propose directement « Versement de 8 000 F » avec un seul bouton Valider.
2. **Zéro champ obligatoire évitable.** Date = aujourd'hui, montant = 8 000 F, mode = celui de la dernière fois.
3. **Tout est modifiable après coup.** La peur de se tromper est le premier frein à la saisie.
4. **Le solde se met à jour sous les yeux** après chaque enregistrement.
5. **Ça doit marcher en 3G**, dans la rue, sur un téléphone d'entrée de gamme.
6. **Aucun jargon comptable** dans l'interface.

## 9. Où trouver quoi

| Fichier | Contenu |
|---|---|
| `docs/01-conception.md` | La réflexion produit complète, les arbitrages, les coûts |
| `docs/02-specs-fonctionnelles.md` | Chaque écran, chaque comportement, les critères d'acceptation |
| `docs/03-modele-donnees.md` | Les tables, les règles de calcul, les états d'un jour |
| `docs/04-plan-implementation.md` | **Le plan d'exécution étape par étape — commence ici** |
| `docs/05-charte-ui.md` | Couleurs, typographie, composants |
| `supabase/*.sql` | Schéma, RLS, jeu de données de test |
| `maquette/index.html` | La maquette cliquable validée. **C'est la référence visuelle.** Ouvre-la. |

## 10. Méthode de travail attendue

- Suis `docs/04-plan-implementation.md` dans l'ordre. Chaque étape a un critère d'acceptation vérifiable.
- Après chaque étape, lance `npm run build` et `npx tsc --noEmit`. Ne passe pas à la suivante si ça casse.
- Prends une capture d'écran des pages construites (Playwright) et compare-la à `maquette/index.html` avant de déclarer une étape terminée.
- Ne crée pas de fichiers non demandés (README de sous-dossiers, tests d'exemple, pages de démo).
- Si une décision produit manque, **arrête-toi et demande** plutôt que d'inventer.

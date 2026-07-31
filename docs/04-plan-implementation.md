# Plan d'implémentation — V1

À suivre **dans l'ordre**. Chaque étape a un critère d'acceptation vérifiable.
Après chaque étape : `npx tsc --noEmit` puis `npm run build`. On ne passe pas à la suite si ça casse.

---

## Étape 0 — Squelette (≈ 1 h)

- `npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir=false --import-alias "@/*"`
- Installer : `@supabase/supabase-js`, `@supabase/ssr`, `date-fns`, `recharts`, `clsx`, `tailwind-merge`
- Initialiser shadcn/ui, installer les composants : `button`, `card`, `input`, `label`, `sheet`, `dialog`, `select`, `tabs`, `badge`, `separator`, `skeleton`, `sonner`
- Reprendre les variables CSS de `docs/05-charte-ui.md` dans `app/globals.css`
- Créer `lib/format.ts` avec `fcfa()` et les helpers de dates en locale `fr`
- `manifest.json` + icônes PWA

**Acceptation** : la page d'accueil se déploie sur Vercel et affiche « Woto ».

---

## Étape 1 — Base de données (≈ 2 h)

- Exécuter `supabase/01_schema.sql`, `02_rls.sql`, `03_seed.sql` dans le SQL Editor
- Générer les types : `npx supabase gen types typescript --project-id <id> > lib/database.types.ts`
- Créer les clients Supabase : `lib/supabase/client.ts` (navigateur), `lib/supabase/server.ts` (RSC + Server Actions), `lib/supabase/admin.ts` (service role, **serveur uniquement**, avec `import 'server-only'`)

**Acceptation** : `select solde_chauffeur('<id-contrat>')` renvoie une valeur cohérente avec le jeu de test.

---

## Étape 2 — Authentification (≈ 1 h 30)

- `/connexion` : email + mot de passe, mot de passe oublié
- Middleware protégeant tout sauf `/connexion` et `/p/*`
- Vérifier que l'utilisateur existe et est actif dans `profils` ; sinon déconnexion

**Acceptation** : un utilisateur non connecté qui ouvre `/` atterrit sur `/connexion`. Un utilisateur connecté accède à `/`.

---

## Étape 3 — Versements et dépenses (≈ 3 h)

- Server Actions : `creerVersement`, `modifierVersement`, `supprimerVersement`, `creerDepense`, `modifierDepense`, `supprimerDepense`
- Écran `/versement/nouveau` conforme au §3 des specs — montant verrouillé à 8 000 F
- Écran `/depenses` : liste + formulaire, 4 catégories

**Acceptation** : un versement créé apparaît en base avec la bonne date et le bon montant, et le solde change en conséquence.

---

## Étape 4 — Accueil et solde (≈ 3 h)

- Requête serveur unique qui rassemble : solde, semaine en cours, totaux du mois, alertes, 5 derniers mouvements
- Composants : hero du solde, tuiles, alertes, liste de mouvements

**Acceptation** : les chiffres de l'accueil correspondent au jeu de test, vérifiés à la main.

---

## Étape 5 — Calendrier (≈ 3 h) — **le cœur du produit**

- Fonction serveur `etatDuMois(contratId, annee, mois)` qui renvoie, pour chaque jour : `{ date, attendu, recu, etat, motif? }`
  Elle s'appuie sur `attendu_par_jour` et sur les versements du mois. **Aucune logique de calcul dupliquée côté client.**
- Grille 7 colonnes, lundi en premier, hachures pour les jours non dus
- Feuille de jour (bottom sheet) avec les actions du §2 des specs
- Formulaire « Déclarer des jours non dus » → crée **un seul** ajustement sur la plage
- Navigation mois précédent / suivant

**Acceptation** : les 4 scénarios du §2 des specs passent (dimanches, création d'ajustement, suppression, total du mois).

---

## Étape 6 — Photos (≈ 3 h)

- Compression navigateur avant envoi : canvas, largeur max 1600 px, JPEG 0,8
- Envoi vers le bucket privé `photos`, URLs signées à la lecture
- Parcours guidé des 6 angles, puis kilométrage / état / commentaire
- Galerie des inspections passées

**Acceptation** : une photo de 4 Mo arrive à moins de 400 Ko dans Storage.

---

## Étape 7 — Échéances, entretiens, historique, rentabilité (≈ 3 h)

- CRUD des échéances, alerte à J-15 sur l'accueil
- Historique unifié avec filtres
- Rentabilité : barres groupées 6 mois, répartition par catégorie, export CSV

**Acceptation** : le graphique affiche 6 mois avec une légende et un seul axe vertical.

---

## Étape 8 — Partage public (≈ 2 h)

- CRUD des liens dans les réglages, avec les 3 interrupteurs
- `/p/[jeton]` rendue côté serveur, données lues via `lib/supabase/admin.ts` après validation du jeton
- Mise à jour de `partages.dernier_acces`

**Acceptation** : la page s'ouvre en navigation privée ; `grep` du HTML et du bundle ne trouve aucune trace de la clé `service_role` ; aucune Server Action n'est atteignable depuis cette route.

---

## Étape 9 — Finitions (≈ 2 h)

- PWA installable, icônes, écran de démarrage
- États de chargement (skeletons), états vides rédigés en français clair
- Passe d'accessibilité : cibles tactiles ≥ 44 px, contrastes, libellés de formulaires
- Captures Playwright des 7 écrans, comparées à `maquette/index.html`

**Acceptation** : Lighthouse mobile ≥ 90 en Performance et en Accessibilité.

---

## Étape 10 — Mise en service (≈ 1 h)

- Secrets GitHub pour le keep-alive, déclencher le workflow à la main une fois
- Créer le véhicule, le chauffeur et le contrat réels : 8 000 F/jour, lundi→samedi, solde de départ saisi
- Générer le lien de consultation et l'envoyer au chauffeur

---

## Rappels permanents

- Le calcul du solde vit **en SQL**. Ne jamais le réécrire en TypeScript.
- Les montants sont des entiers en F CFA. Jamais de flottant, jamais de décimale, jamais d'euro.
- `SUPABASE_SERVICE_ROLE_KEY` ne sort jamais du serveur.
- Ne pas créer de fichiers qui n'ont pas été demandés.
- En cas de doute produit : demander, ne pas inventer.

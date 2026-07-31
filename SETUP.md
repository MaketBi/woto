# Mise en place des services — ce que Mamadou doit faire

Tout est gratuit. Compter 30 minutes en tout.

## 1. GitHub

1. Créer un dépôt **privé** nommé `woto`.
2. Depuis le dossier du projet :
   ```bash
   git init
   git add .
   git commit -m "Woto — cadrage V1"
   git branch -M main
   git remote add origin https://github.com/<ton-compte>/woto.git
   git push -u origin main
   ```

## 2. Supabase

1. Créer un compte sur supabase.com, puis un projet nommé **woto**.
2. Choisir la région **eu-west-3 (Paris)** ou **eu-central-1** — les plus proches de Dakar parmi les régions gratuites.
3. Noter le **mot de passe de la base** dans un gestionnaire de mots de passe. Il n'est affiché qu'une fois.
4. Dans **SQL Editor**, exécuter dans l'ordre :
   - `supabase/01_schema.sql`
   - `supabase/02_rls.sql`
   - `supabase/03_seed.sql` (facultatif — jeu de données de démonstration)
5. Dans **Storage**, créer un bucket **privé** nommé `photos`.
6. Dans **Authentication > Providers**, garder **Email** activé et **désactiver « Confirm email »** (tu es le seul utilisateur, ça évite un aller-retour inutile).
7. Dans **Authentication > Users**, créer ton compte : `mdiop99@gmail.com` + un mot de passe.
8. Dans **SQL Editor**, lier ce compte à la table `profils` :
   ```sql
   insert into profils (id, nom, email)
   select id, 'Mamadou Diop', email from auth.users where email = 'mdiop99@gmail.com';
   ```

### Les clés à récupérer
**Project Settings > API** :
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY` — **secrète**, jamais dans le navigateur, jamais commitée

Les coller dans `.env.local` (copié depuis `.env.example`).

## 3. Vercel

1. Créer un compte, **Add New > Project**, importer le dépôt `woto`.
2. Ajouter les trois variables d'environnement (les mêmes que `.env.local`, plus `NEXT_PUBLIC_SITE_URL` avec l'URL Vercel une fois connue).
3. Déployer.

## 4. Le keep-alive anti-pause

Dans le dépôt GitHub, **Settings > Secrets and variables > Actions > New repository secret** :
- `SUPABASE_URL` = l'URL du projet
- `SUPABASE_ANON_KEY` = la clé anon

Le workflow `.github/workflows/keepalive.yml` fait le reste : une requête par jour, le projet ne se met jamais en pause.

## 5. Vérification finale

- [ ] `npm run dev` démarre sans erreur
- [ ] Connexion avec l'email + mot de passe fonctionne
- [ ] Le calendrier affiche le mois en cours
- [ ] Un versement enregistré fait bouger le solde
- [ ] Le lien de partage s'ouvre dans une fenêtre de navigation privée, sans connexion
- [ ] L'action GitHub `keepalive` passe au vert quand on la lance à la main

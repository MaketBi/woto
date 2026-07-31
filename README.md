# Woto

Suivi d'un véhicule VTC : versements journaliers du chauffeur, dépenses, entretiens, échéances et état du véhicule en photos.

- **Monnaie** : franc CFA (XOF)
- **Hébergement** : Vercel (gratuit) + Supabase (gratuit)
- **Accès** : un compte administrateur ; les tiers consultent via un lien en lecture seule

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis remplir les clés Supabase
npm run dev
```

## Documentation

Tout est dans `docs/`. Commencer par `docs/04-plan-implementation.md`.
La maquette de référence est `maquette/index.html` — l'ouvrir dans un navigateur.

## Mise en place des services

Voir `SETUP.md`.

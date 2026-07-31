# Woto — dossier de conception V1

*Mis à jour le 31 juillet 2026*

---

## 1. Le problème en une phrase

Une voiture est louée à un chauffeur VTC à Dakar. Il faut savoir, à tout moment et sans ouvrir Excel :
**« Est-ce que le chauffeur est à jour ? »** et **« Est-ce que cette voiture rapporte de l'argent ? »**

Tout le reste — entretiens, photos, assurance — sert à protéger ces deux réponses.

---

## 2. La contrainte « 0 € » : ce qui est vraiment gratuit

| Brique | Solution | Offre gratuite | Le piège |
|---|---|---|---|
| Hébergement | **Vercel Hobby** | 100 Go de bande passante/mois | Officiellement non commercial (voir §2.3) |
| Base + auth + fichiers | **Supabase** | 500 Mo de base, 1 Go de fichiers | **Pause après 7 jours** de faible activité |
| Base alternative | **Neon** | 0,5 Go, 100 h de calcul/mois | Ne pause jamais, mais ni auth ni stockage |
| Domaine | sous-domaine `.vercel.app` | gratuit | Un vrai domaine coûte ~10 €/an |

### 2.1 Le vrai sujet : la mise en pause

Un projet Supabase gratuit se met en pause après « une activité faible sur une période de 7 jours ». Il reste **restaurable pendant 90 jours** : aucune donnée n'est perdue, mais l'application tombe en rade entre-temps — exactement le genre de chose qui tue l'adoption d'un outil.

**La parade retenue** : un workflow GitHub Actions (`.github/workflows/keepalive.yml`) qui fait une vraie requête en base une fois par jour. Dix lignes, gratuit, illimité. Le problème disparaît définitivement.

**L'alternative écartée** : Neon ne met jamais un projet en pause (veille après 5 min, réveil en ~0,5 s). Excellente base, mais il aurait fallu brancher séparément l'authentification et le stockage des photos — trois fournisseurs au lieu d'un, trois fois plus de choses qui cassent.

### 2.2 Ce qui a été retenu

**Supabase + keep-alive quotidien.** Un seul produit pour la base, la connexion et les photos, avec la sécurité par rôle (RLS) intégrée.

### 2.3 Une réserve honnête sur Vercel

Le plan Hobby est destiné aux projets **non commerciaux**. Un outil interne pour gérer sa propre voiture est une zone grise ; à ce volume, personne ne se fait couper. Si un jour il faut être parfaitement en règle, deux sorties propres existent : **Cloudflare Pages/Workers** (gratuit, usage commercial autorisé) ou Vercel Pro à 20 $/mois. Le code ne doit donc utiliser aucune API exclusive à Vercel — c'est gratuit de garder cette porte ouverte.

**Coût total V1 : 0 €/mois.**

---

## 3. Stack

```
Next.js 15 (App Router) + TypeScript
    ↓
Tailwind CSS + shadcn/ui        ← le « joli » sans designer
    ↓
Supabase (Postgres + Auth + Storage)
    ↓
Vercel (déploiement auto à chaque push GitHub)
```

- **Next.js** : un seul langage pour le front et le back, le stack le mieux documenté du marché — donc le plus facile à faire coder et à faire reprendre plus tard.
- **shadcn/ui** : des composants déjà beaux et accessibles. C'est ce qui donne un rendu « produit » sans passer trois semaines sur le CSS.
- **PWA** : installable sur l'écran d'accueil, sans passer par les stores.

---

## 4. Accès : un seul type de compte

| Qui | Accès | Comment |
|---|---|---|
| **Mamadou (et un éventuel co-admin)** | Tout | Compte **email + mot de passe** |
| **Le chauffeur, la famille, un associé** | **Consultation seule** | Un **lien**, sans compte, sans inscription |

Ce choix n'est pas seulement technique : **la personne qui saisit est celle qui a intérêt à ce que les chiffres soient justes.** Si le chauffeur saisit ses propres versements, il faut tout vérifier. S'il ne fait que consulter, il n'y a jamais de débat sur qui a écrit quoi — et il voit quand même son solde en temps réel, ce qui est l'effet recherché.

Le lien (`/p/9fK2xQ`) s'envoie sur WhatsApp, s'ouvre sans rien installer, se révoque en un clic. Trois interrupteurs décident de ce qu'il montre : calendrier & solde, dépenses, photos. **L'écriture est refusée au niveau de la base**, pas seulement cachée dans l'interface.

---

## 5. Le modèle économique du contrat

Le chauffeur n'est pas salarié. Il encaisse ses courses, garde sa part, et **verse 8 000 F par jour travaillé**, du lundi au samedi.

- Le **montant d'un versement est fixe et verrouillé** dans le formulaire. Seul l'administrateur peut le déverrouiller pour corriger une erreur. Conséquence directe : **enregistrer un versement se fait en un seul tap** depuis le calendrier. C'est la simplification la plus importante du produit.
- Le **solde démarre sur une valeur saisie** à la mise en service. Le passé n'est pas ressaisi.
- Les **jours non dus** (dimanche, congés, garage, révision, panne) sortent du calcul. Sans ça, l'application reprocherait au chauffeur des jours où la voiture était immobilisée — et un solde injuste n'est plus jamais consulté.

Le détail du calcul est dans `03-modele-donnees.md`. Il vit dans des fonctions SQL, jamais dupliqué en TypeScript.

---

## 6. Les dépenses suivies, et seulement celles-là

`entretien` · `assurance` · `controle_technique` · `divers`

Le carburant, le lavage, les péages et les amendes sont à la charge du chauffeur. Les suivre fausserait la rentabilité et alourdirait la saisie pour rien. `divers` sert de soupape : si une ligne y revient tous les mois, elle méritera sa propre catégorie.

---

## 7. Les photos : attention au quota

1 Go de stockage gratuit. Sans précaution, 6 photos par semaine en qualité téléphone (≈ 4 Mo) font **1,2 Go par an** — quota explosé.

**La parade** : compression dans le navigateur **avant** l'envoi (1600 px de large, JPEG 0,8). Une photo passe de 4 Mo à ~250 Ko, soit ≈ **75 Mo par an**. On tient plus de dix ans, et l'envoi est instantané même en 4G moyenne.

---

## 8. Périmètre

### V1 — l'objectif « utilisable en deux semaines »

Connexion admin · contrat · **calendrier des versements** · jours non dus · versements · dépenses · **solde automatique** · tableau de bord mensuel · inspections photos · échéances · lien de consultation · PWA.

### V2 — après quelques semaines d'usage réel

Rappels automatiques WhatsApp ou email · import du CA Yango/Heetch · export PDF mensuel · entretien prédictif au kilométrage · plusieurs véhicules.

### V3 — si l'outil prend

Multi-propriétaires · signature électronique du contrat · OCR des factures.

**La règle** : rien n'entre en V1 s'il n'est pas utilisé au moins une fois par semaine.

---

## 9. Les risques, franchement

| Risque | Gravité | Parade |
|---|---|---|
| **La saisie n'est pas tenue** | **Élevée** | C'est LE risque, puisqu'une seule personne saisit. Parade : un tap par versement, et un calendrier qui rend le trou visible immédiatement. Un jour rouge se voit ; une ligne manquante dans Excel, non. |
| Contestation d'un montant | Moyenne | Le lien de consultation : le chauffeur voit son solde au jour le jour, donc il conteste tout de suite, pas trois mois après |
| Pause Supabase | Faible | Keep-alive quotidien |
| Quota photos | Faible | Compression navigateur (§7) |
| Conditions Vercel Hobby | Faible | Code portable → Cloudflare si besoin |
| Perte de données | Moyenne | Export CSV mensuel |
| Espèces non tracées | **Élevée** | Hors périmètre technique — mais l'application rend l'écart visible, ce qui est déjà l'essentiel |

---

## 10. Décisions arrêtées

1. **Supabase** + keep-alive quotidien.
2. **8 000 F par jour**, du **lundi au samedi**.
3. **Montant verrouillé** à la saisie ; modifiable par l'administrateur seul.
4. **Solde de départ saisi** à la mise en service.
5. **Un seul type de compte** (admin) ; les autres consultent via un lien en lecture seule.
6. **Quatre catégories de dépenses** : entretien, assurance, contrôle technique, divers.
7. **Franc CFA**, sans décimales.
8. **Calendrier** vert / orange / rouge / hachuré, avec gestion des jours non dus.

---

## 11. Restant à préciser

- Le **solde de départ** exact au jour de la mise en service.
- La **caution** : montant et date.
- Les **modes de paiement** réellement utilisés parmi espèces, Wave, Orange Money, virement.
- L'**immatriculation** et les caractéristiques réelles du véhicule.
- Les **dates d'échéance** réelles de l'assurance et du contrôle technique.

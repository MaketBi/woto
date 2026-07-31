# Modèle de données

Toutes les tables sont dans `supabase/01_schema.sql`. Ce document explique **pourquoi** elles sont faites ainsi.

## Les tables

| Table | Rôle |
|---|---|
| `profils` | Les administrateurs, et eux seuls. Lié 1-1 à `auth.users`. |
| `vehicules` | Le véhicule. Une seule ligne en V1. |
| `chauffeurs` | Le chauffeur. Pas de compte, juste une fiche. |
| `contrats` | Le lien véhicule ↔ chauffeur, avec le montant journalier, les jours dus et le solde de départ. |
| `ajustements` | Les plages de jours où le montant attendu change — typiquement 0 (jour non dû). |
| `versements` | Ce que le chauffeur verse. |
| `depenses` | Les charges à la charge du propriétaire uniquement. |
| `echeances` | Assurance, contrôle technique, etc. |
| `inspections` + `inspection_photos` | L'état du véhicule en photos. |
| `partages` | Les liens de consultation en lecture seule. |

## Le cœur : `attendu(jour)`

```
attendu(jour) =
  0                                    si ISO-dow(jour) ∉ contrats.jours_actifs
  ajustements.montant_journalier       s'il existe un ajustement couvrant ce jour
  contrats.montant_journalier          sinon
```

`jours_actifs` est un tableau d'entiers ISO : **1 = lundi … 7 = dimanche**. Valeur retenue : `{1,2,3,4,5,6}`.

Les ajustements servent à un seul but : **rendre le système juste**. Quand la voiture est au garage ou que le chauffeur est en congés, le jour ne doit pas apparaître comme un retard. Sans cette table, il faudrait corriger le solde à la main — et un solde corrigé à la main n'est plus crédible pour personne.

Motifs : `garage`, `conges`, `revision`, `panne`, `autre`.

## Le solde

```
solde = contrats.solde_initial
      + Σ attendu(jour) du début du contrat à aujourd'hui
      − Σ versements.montant
```

Implémenté dans deux fonctions SQL, jamais dupliqué en TypeScript :

- `attendu_par_jour(contrat, du, au)` → une ligne par jour dû, avec son montant
- `solde_chauffeur(contrat, au)` → un entier

## Les cinq états d'une journée

C'est ce qui alimente le calendrier.

| État | Condition | Rendu |
|---|---|---|
| `verse` | reçu ≥ attendu, attendu > 0 | vert, ✓ |
| `partiel` | 0 < reçu < attendu | orange, ½ |
| `non_verse` | jour passé, attendu > 0, reçu = 0 | rouge, ✕ |
| `non_du` | attendu = 0 | hachuré gris, — |
| `a_venir` | date > aujourd'hui | neutre |

L'état `partiel` reste supporté par le modèle même si, en pratique, le montant d'un versement est verrouillé sur le montant attendu. C'est une soupape pour les corrections manuelles — elle ne coûte rien et évite de bloquer un cas réel.

## Décisions à connaître

**Le montant d'un versement est verrouillé.** Le formulaire propose 8 000 F et n'autorise pas la modification, sauf déverrouillage explicite par l'administrateur. Conséquence directe : **enregistrer un versement se fait en un seul tap** depuis le calendrier. C'est la simplification la plus importante de tout le produit.

**Le solde démarre sur une valeur saisie** (`contrats.solde_initial`), pas à zéro. Le passé n'est pas ressaisi ; on part de ce que le chauffeur doit au jour de la mise en service.

**Les montants sont des `bigint`**, en francs CFA entiers. Aucun flottant sur de l'argent, jamais.

**Les dates métier sont des `date`**, pas des `timestamptz`. Un versement appartient à un jour, pas à un instant.

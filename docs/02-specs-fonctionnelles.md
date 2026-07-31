# Spécifications fonctionnelles — V1

Référence visuelle : `maquette/index.html`. Chaque section ci-dessous décrit un écran, son comportement et ses critères d'acceptation.

---

## Écrans et navigation

Barre d'onglets fixe en bas : **Accueil · Calendrier · ＋ · Dépenses · Réglages**.
Le bouton ＋ central ouvre directement la saisie d'un versement.

Routes :

```
/                     Accueil (protégé)
/calendrier           Calendrier mensuel (protégé)
/versement/nouveau    Saisie d'un versement (protégé)
/depenses             Liste + saisie des dépenses (protégé)
/photos               Inspections (protégé)
/historique           Journal unifié (protégé)
/rentabilite          Graphiques (protégé)
/reglages             Contrat, comptes, partage, échéances (protégé)
/connexion            Email + mot de passe
/p/[jeton]            Consultation publique, lecture seule, rendue côté serveur
```

---

## 1. Accueil

**Contenu, dans l'ordre :**

1. **Solde chauffeur** en très gros. Rouge si > 0, vert si ≤ 0. Sous le chiffre, une pastille : « 3 jours non versés » (ou « À jour »).
2. Une barre de progression de la **semaine en cours** : reçu / attendu.
3. Deux tuiles : **encaissé du mois** et **net du mois** (encaissé − dépenses), avec l'évolution vs le mois précédent.
4. Les **alertes** : échéance à moins de 15 jours, inspection photo datant de plus de 7 jours.
5. Trois boutons : *Enregistrer un versement*, *Voir le calendrier*, *Photos de la semaine*.
6. Les **5 derniers mouvements** (versements, dépenses, jours non dus mélangés), avec un lien « Tout voir ».

**Critères d'acceptation**
- Le solde affiché est exactement `solde_chauffeur(contrat, aujourd'hui)`.
- Un versement enregistré fait bouger le solde sans rechargement manuel.
- La page se rend en moins de 2 s sur une connexion lente simulée.

---

## 2. Calendrier — l'écran central

Grille du mois, 7 colonnes, lundi en première colonne. Chaque case porte le numéro du jour et un marqueur.

| État | Fond | Marqueur |
|---|---|---|
| Versé | vert clair | ✓ |
| Partiel | orange clair | ½ |
| Non versé | rouge clair | ✕ |
| Non dû | hachures grises 45° | — |
| À venir | blanc | aucun |

Le jour du jour porte un contour bleu.

**Sous la grille** : la légende, puis trois chiffres du mois — **attendu / reçu / manquant** — puis un bouton *Déclarer des jours non dus*.

**Toucher un jour** ouvre une feuille remontant du bas :
- le montant reçu vs attendu, sur fond de la couleur de l'état ;
- si le jour est dû et non versé → un bouton **« Versement de 8 000 F »** qui enregistre en un tap, plus un bouton *Marquer comme jour non dû* ;
- si le jour est versé → *Modifier* et *Supprimer* ;
- si le jour est non dû → le motif, et un bouton *Repasser en jour dû*.

**Déclarer des jours non dus** : motif (garage, congés, révision, panne, autre), date de début, date de fin, commentaire libre. Enregistre **un seul** `ajustement` couvrant la plage.

**Navigation** : flèches ‹ › pour changer de mois. Pas de sélecteur de date compliqué.

**Critères d'acceptation**
- Les dimanches apparaissent en « non dû » sans qu'aucun ajustement n'ait été créé.
- Créer un ajustement du 28 au 29 fait passer ces deux jours en hachuré et diminue le solde de 16 000 F.
- Supprimer cet ajustement remet les deux jours en rouge et rétablit le solde.
- Le total « attendu » du mois correspond à la somme des cases non hachurées.

---

## 3. Enregistrer un versement

Deux chemins : le bouton ＋ de la barre d'onglets, ou un jour du calendrier.

- **Montant** : pré-rempli à 8 000 F, affiché en gros, **verrouillé**. Une petite action *Modifier le montant* le déverrouille — réservée aux corrections.
- **Date** : trois pastilles *Aujourd'hui* / *Hier* / *Autre…*, aujourd'hui présélectionné.
- **Mode** : espèces, Wave, Orange Money, virement, autre. Celui du dernier versement est présélectionné.
- **Note** : facultative.

Un seul bouton **Valider**.

**Critères d'acceptation**
- Depuis le calendrier, enregistrer un versement demande **un seul tap** après l'ouverture de la feuille.
- Enregistrer deux fois le même jour affiche un avertissement (« un versement existe déjà pour ce jour ») mais reste possible.
- Après validation, retour au calendrier avec le jour passé au vert.

---

## 4. Dépenses

Quatre catégories, et seulement quatre : **Entretien**, **Assurance**, **Contrôle technique**, **Divers**.

Formulaire : catégorie (tuiles), montant, fournisseur, date, kilométrage (facultatif, utile pour l'entretien), photo de facture (facultative).

La liste montre les dépenses du mois en cours par défaut, avec un filtre par catégorie et un total.

**Critères d'acceptation**
- Aucune mention de carburant, lavage, péage ou amende nulle part.
- La photo de facture est compressée avant envoi (voir §6).

---

## 5. Photos du véhicule

Bouton *Nouvelle inspection*. L'application demande **6 angles**, un par un, dans l'ordre : avant, arrière, côté gauche, côté droit, intérieur, tableau de bord. Chaque angle affiche son libellé pour éviter toute confusion.

À la fin : kilométrage, état général de 1 à 5, commentaire libre.

La galerie liste les inspections passées par date, avec les 6 vignettes.

**Compression obligatoire côté navigateur avant envoi** : redimensionnement à 1600 px de large maximum, JPEG qualité 0,8. Une photo passe de ~4 Mo à ~250 Ko. Sans ça, le quota gratuit de 1 Go est atteint en un an.

**Critères d'acceptation**
- Une photo de 4 Mo arrive dans Supabase Storage à moins de 400 Ko.
- L'envoi fonctionne sur une connexion lente sans bloquer l'interface.

---

## 6. Historique

Une liste unique, antéchronologique, mélangeant versements, dépenses et jours non dus. Groupée par jour. Filtres : Tout / Versements / Dépenses / Jours non dus.

---

## 7. Rentabilité

- Graphique à barres groupées sur 6 mois : **encaissé** (bleu) vs **dépenses** (orange). Une légende, jamais deux axes verticaux.
- Net cumulé depuis le début.
- Dépenses par kilomètre.
- Répartition des dépenses par catégorie, en barres horizontales.
- Export CSV.

---

## 8. Réglages

- **Contrat** : montant journalier, jours dus, solde de départ, caution. Modifiable.
- **Jours non dus** : liste des ajustements, avec suppression.
- **Comptes administrateurs** : liste, ajout par email.
- **Lien de consultation** : l'URL, trois interrupteurs (calendrier & solde / dépenses / photos), un bouton *Envoyer sur WhatsApp*, un bouton *Révoquer et régénérer*.
- **Échéances** : assurance, contrôle technique, prochaine vidange. Date, montant, alerte à J-15.

---

## 9. Page publique `/p/[jeton]`

Rendue **côté serveur**. Valide le jeton dans `partages`, puis lit les données avec la clé `service_role`.

Affiche, selon les interrupteurs : le solde et le calendrier du mois, la liste des dépenses, les photos.
**Aucune action possible.** Pas de bouton, pas de formulaire, pas de Server Action accessible.

Si le jeton est inconnu ou révoqué : page « Ce lien n'est plus valide », sans détail.

**Critères d'acceptation**
- La page s'ouvre en navigation privée, sans connexion.
- Aucune clé de service n'apparaît dans le HTML ou le bundle JavaScript.
- Modifier l'URL pour pointer vers une donnée non partagée ne donne rien.

---

## 10. Connexion

Email + mot de passe. Lien « mot de passe oublié » qui passe par l'email Supabase.
Aucune inscription publique : les comptes sont créés depuis les réglages ou depuis Supabase.

---

## Hors périmètre V1

Rappels automatiques WhatsApp ou email · import du CA Yango/Heetch · export PDF · multi-véhicules · OCR des factures · mode sombre.

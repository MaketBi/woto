# Brief design — à donner à un outil de design

Copier-coller le bloc ci-dessous. Joindre `maquette/index.html` si l'outil accepte les pièces jointes :
c'est la base fonctionnelle à embellir, pas à réinventer.

---

Tu es designer produit. Conçois l'interface d'une application web mobile appelée **Woto**.

## Le produit

Woto sert à suivre **une voiture louée à un chauffeur VTC à Dakar, au Sénégal**. Le chauffeur n'est pas salarié : il encaisse ses courses, garde sa part, et verse **8 000 F CFA par jour travaillé**, du lundi au samedi.

L'application répond à deux questions, et à rien d'autre :
**« Est-ce que le chauffeur est à jour dans ses versements ? »** et **« Est-ce que cette voiture rapporte de l'argent ? »**

## Qui l'utilise

- **Le propriétaire** (un seul utilisateur qui saisit) : il ouvre l'app sur son téléphone, souvent debout, dans la rue, en 4G moyenne, pour enregistrer un versement en quelques secondes. Il n'est pas comptable et ne veut voir aucun jargon.
- **Le chauffeur et quelques proches** : ils consultent une page en lecture seule reçue par WhatsApp. Pas de compte, pas de bouton, juste de la lecture.

## Le principe directeur

**L'écran central est un calendrier mensuel.** Une couleur par jour suffit à voir où sont les trous, sans lire un seul chiffre :

- **vert** : versé
- **orange** : versement partiel
- **rouge** : non versé
- **hachures grises à 45°** : jour non dû (dimanche, congés, voiture au garage, révision, panne)
- **neutre** : jour à venir

Les hachures sont importantes : un jour non dû ne doit jamais pouvoir être confondu avec un état de paiement. Toucher un jour ouvre une feuille remontant du bas, avec une action principale unique.

## Les écrans à concevoir

1. **Accueil** — le solde du chauffeur en très gros (rouge s'il doit de l'argent), la progression de la semaine, deux tuiles (encaissé du mois, net du mois), les alertes d'échéance, trois boutons d'action, les derniers mouvements.
2. **Calendrier** — la grille du mois, la légende, les totaux attendu / reçu / manquant, et la feuille de détail d'un jour.
3. **Saisie d'un versement** — le montant est fixe (8 000 F) et verrouillé, la date par défaut est aujourd'hui, le mode de paiement est celui de la dernière fois (espèces, Wave, Orange Money, virement). **Un seul bouton.**
4. **Dépenses** — quatre catégories seulement : entretien, assurance, contrôle technique, divers.
5. **Photos du véhicule** — parcours guidé de six prises de vue (avant, arrière, côté gauche, côté droit, intérieur, tableau de bord), puis kilométrage et état général sur 5.
6. **Rentabilité** — un graphique à barres groupées sur six mois (encaissé vs dépenses), la répartition des dépenses par catégorie.
7. **Réglages** — le contrat, les comptes, le lien de consultation avec ses interrupteurs, les échéances.
8. **Page publique de consultation** — version lecture seule, sobre, sans aucune action.

## Contraintes fermes

- **Mobile d'abord**, écran de référence 390 px de large. Le desktop est un bonus.
- **Monnaie : franc CFA**, entiers, séparateur de milliers par espace, jamais de décimale, jamais de symbole €. Exemple : `8 000 F`.
- **Police système** uniquement (`system-ui`) — aucune police chargée depuis le web, c'est du poids inutile en 3G.
- **Pas de mode sombre** dans cette version.
- Cibles tactiles d'au moins 44 × 44 px.
- Interface entièrement **en français**.
- Aucune animation de plus de 200 ms.

## Palette imposée

```
Fond de page   #f4f4f1     Cartes         #ffffff
Texte          #0b0b0b     Secondaire     #52514e     Discret  #898781
Bordures       #e6e5df
Bleu principal #2a78d6     Bleu clair     #eaf2fd
Versé          #0ca30c  sur #e7f6e7
Partiel        #fab219  sur #fdf3dd
Non versé      #d03b3b  sur #fbeaea
Graphique      encaissé #2a78d6 · dépenses #eb6834
```

## Le ton visuel recherché

Sobre, dense en information mais respirant, proche d'une application bancaire moderne. Rien de ludique, rien de « startup ». L'objet le plus important de chaque écran doit être évident en une demi-seconde : sur l'accueil c'est le solde, sur le calendrier ce sont les jours rouges.

## À éviter absolument

Dégradés décoratifs · ombres portées lourdes · illustrations · cartes vides qui font défiler pour rien · plus de cinq onglets · tableaux à faire défiler horizontalement · icônes qui remplacent un libellé texte · jargon comptable.

## Ce que j'attends en retour

Les maquettes des huit écrans, en montrant pour le calendrier les cinq états de jour côte à côte, et pour l'accueil les deux cas : chauffeur à jour et chauffeur en retard. Ajoute les états vides (aucun versement encore saisi) et les états de chargement.

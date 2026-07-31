-- Woto — jeu de données de démonstration (facultatif)
-- Reproduit le mois de juillet 2026 de la maquette.
-- Résultats attendus après exécution :
--     attendu du mois : 176 000 F   (22 jours dus × 8 000 F)
--     reçu            : 149 000 F
--     solde           :  27 000 F
--     états           : 18 versé · 1 partiel · 3 non versé · 9 non dû
-- Ces valeurs servent de test de non-régression du calcul.

insert into vehicules (id, immatriculation, marque, modele, annee, km_actuel, date_acquisition)
values ('11111111-1111-1111-1111-111111111111','DK-4821-AB','Peugeot','508',2019,142380, date '2026-02-01')
on conflict (id) do nothing;

insert into chauffeurs (id, nom, telephone)
values ('22222222-2222-2222-2222-222222222222','Ass','+221 77 000 00 00')
on conflict (id) do nothing;

insert into contrats (id, vehicule_id, chauffeur_id, date_debut,
                      montant_journalier, jours_actifs, solde_initial, caution)
values ('33333333-3333-3333-3333-333333333333',
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        date '2026-07-01', 8000, '{1,2,3,4,5,6}', 0, 150000)
on conflict (id) do nothing;

-- Jours non dus
insert into ajustements (contrat_id, date_debut, date_fin, montant_journalier, motif, commentaire) values
 ('33333333-3333-3333-3333-333333333333', date '2026-07-13', date '2026-07-15', 0, 'conges', 'Congés chauffeur'),
 ('33333333-3333-3333-3333-333333333333', date '2026-07-28', date '2026-07-29', 0, 'garage', 'Voiture au garage');

-- Versements complets
insert into versements (contrat_id, date, montant, mode)
select '33333333-3333-3333-3333-333333333333', j, 8000, 'especes'
from unnest(array[
  date '2026-07-01', date '2026-07-02', date '2026-07-03', date '2026-07-04',
  date '2026-07-06', date '2026-07-07', date '2026-07-08', date '2026-07-09',
  date '2026-07-10', date '2026-07-11', date '2026-07-16', date '2026-07-18',
  date '2026-07-20', date '2026-07-21', date '2026-07-22', date '2026-07-25',
  date '2026-07-27', date '2026-07-31']) j;

-- Un versement partiel
insert into versements (contrat_id, date, montant, mode)
values ('33333333-3333-3333-3333-333333333333', date '2026-07-17', 5000, 'wave');

-- Dépenses
insert into depenses (vehicule_id, date, categorie, montant, fournisseur, note, km) values
 ('11111111-1111-1111-1111-111111111111', date '2026-07-10', 'assurance',  25000, 'Assurance', 'Mensualité juillet', null),
 ('11111111-1111-1111-1111-111111111111', date '2026-07-26', 'entretien',  35000, 'Garage Momo', 'Vidange + filtres', 142100);

-- Échéances
insert into echeances (vehicule_id, type, libelle, date_echeance, montant) values
 ('11111111-1111-1111-1111-111111111111', 'assurance', 'Renouvellement assurance', date '2026-08-12', 25000),
 ('11111111-1111-1111-1111-111111111111', 'controle_technique', 'Contrôle technique', date '2026-11-03', 20000);

insert into echeances (vehicule_id, type, libelle, km_echeance) values
 ('11111111-1111-1111-1111-111111111111', 'vidange', 'Prochaine vidange', 147000);

-- Lien de consultation
insert into partages (vehicule_id, libelle, voir_calendrier, voir_depenses, voir_photos)
values ('11111111-1111-1111-1111-111111111111', 'Lien chauffeur', true, true, false);

-- Vérification
--   select count(*), sum(montant) from attendu_par_jour('33333333-3333-3333-3333-333333333333', date '2026-07-01', date '2026-07-31');
--   select solde_chauffeur('33333333-3333-3333-3333-333333333333', date '2026-07-31');   -- 27000
--   select etat, count(*) from etat_du_mois('33333333-3333-3333-3333-333333333333', 2026, 7) group by etat;

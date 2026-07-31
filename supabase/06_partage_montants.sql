-- Woto — interrupteur « Afficher les montants » du lien public
-- (maquette 1l : Lien actif · Afficher les montants · Afficher les dépenses).
-- Quand il est éteint, la page publique montre les états du calendrier
-- mais aucun montant en francs.

alter table partages
  add column if not exists voir_montants boolean not null default true;

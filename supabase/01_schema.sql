-- Woto — schéma V1
-- À exécuter dans le SQL Editor de Supabase, en premier.
-- Tous les montants sont des entiers en francs CFA (XOF). Aucun flottant.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- profils
-- Les administrateurs, et eux seuls. Le chauffeur n'a pas de compte.
create table if not exists profils (
  id         uuid primary key references auth.users(id) on delete cascade,
  nom        text not null,
  email      text not null,
  telephone  text,
  actif      boolean not null default true,
  cree_le    timestamptz not null default now()
);

-- ------------------------------------------------------------- vehicules
create table if not exists vehicules (
  id                uuid primary key default gen_random_uuid(),
  immatriculation   text not null,
  marque            text,
  modele            text,
  annee             int,
  date_acquisition  date,
  prix_acquisition  bigint,
  km_actuel         int,
  actif             boolean not null default true,
  cree_le           timestamptz not null default now()
);

-- ------------------------------------------------------------ chauffeurs
create table if not exists chauffeurs (
  id         uuid primary key default gen_random_uuid(),
  nom        text not null,
  telephone  text,
  actif      boolean not null default true,
  cree_le    timestamptz not null default now()
);

-- --------------------------------------------------------------- contrats
-- jours_actifs : entiers ISO, 1 = lundi ... 7 = dimanche. Retenu : {1,2,3,4,5,6}
create table if not exists contrats (
  id                  uuid primary key default gen_random_uuid(),
  vehicule_id         uuid not null references vehicules(id) on delete cascade,
  chauffeur_id        uuid references chauffeurs(id) on delete set null,
  date_debut          date not null,
  date_fin            date,
  montant_journalier  bigint not null default 8000 check (montant_journalier >= 0),
  jours_actifs        smallint[] not null default '{1,2,3,4,5,6}',
  solde_initial       bigint not null default 0,
  caution             bigint not null default 0,
  actif               boolean not null default true,
  cree_le             timestamptz not null default now(),
  check (date_fin is null or date_fin >= date_debut)
);

-- ------------------------------------------------------------ ajustements
-- Plages de jours où le montant attendu change. 0 = jour non dû.
create table if not exists ajustements (
  id                  uuid primary key default gen_random_uuid(),
  contrat_id          uuid not null references contrats(id) on delete cascade,
  date_debut          date not null,
  date_fin            date not null,
  montant_journalier  bigint not null default 0 check (montant_journalier >= 0),
  motif               text not null check (motif in ('garage','conges','revision','panne','autre')),
  commentaire         text,
  cree_par            uuid references profils(id) on delete set null,
  cree_le             timestamptz not null default now(),
  check (date_fin >= date_debut)
);
create index if not exists idx_ajustements_contrat on ajustements(contrat_id, date_debut, date_fin);

-- ------------------------------------------------------------- versements
create table if not exists versements (
  id          uuid primary key default gen_random_uuid(),
  contrat_id  uuid not null references contrats(id) on delete cascade,
  date        date not null,
  montant     bigint not null check (montant > 0),
  mode        text not null default 'especes'
              check (mode in ('especes','wave','orange_money','virement','autre')),
  note        text,
  saisi_par   uuid references profils(id) on delete set null,
  cree_le     timestamptz not null default now()
);
create index if not exists idx_versements_contrat_date on versements(contrat_id, date);

-- ---------------------------------------------------------------- depenses
-- Uniquement les charges à la charge du propriétaire.
-- Le carburant, le lavage, les péages et les amendes sont au chauffeur : hors périmètre.
create table if not exists depenses (
  id               uuid primary key default gen_random_uuid(),
  vehicule_id      uuid not null references vehicules(id) on delete cascade,
  date             date not null,
  categorie        text not null
                   check (categorie in ('entretien','assurance','controle_technique','divers')),
  montant          bigint not null check (montant > 0),
  fournisseur      text,
  note             text,
  km               int,
  justificatif_url text,
  saisi_par        uuid references profils(id) on delete set null,
  cree_le          timestamptz not null default now()
);
create index if not exists idx_depenses_vehicule_date on depenses(vehicule_id, date);

-- --------------------------------------------------------------- echeances
create table if not exists echeances (
  id             uuid primary key default gen_random_uuid(),
  vehicule_id    uuid not null references vehicules(id) on delete cascade,
  type           text not null check (type in ('assurance','controle_technique','vidange','autre')),
  libelle        text not null,
  date_echeance  date,
  km_echeance    int,
  montant        bigint,
  statut         text not null default 'a_venir' check (statut in ('a_venir','fait','en_retard')),
  rappel_jours   int not null default 15,
  cree_le        timestamptz not null default now()
);

-- ------------------------------------------------------------- inspections
create table if not exists inspections (
  id             uuid primary key default gen_random_uuid(),
  vehicule_id    uuid not null references vehicules(id) on delete cascade,
  date           date not null default current_date,
  km             int,
  etat_general   smallint check (etat_general between 1 and 5),
  commentaire    text,
  cree_par       uuid references profils(id) on delete set null,
  cree_le        timestamptz not null default now()
);

create table if not exists inspection_photos (
  id             uuid primary key default gen_random_uuid(),
  inspection_id  uuid not null references inspections(id) on delete cascade,
  chemin         text not null,
  angle          text not null
                 check (angle in ('avant','arriere','gauche','droite','interieur','tableau_bord','autre')),
  ordre          int not null default 0
);

-- --------------------------------------------------------------- partages
create table if not exists partages (
  id                uuid primary key default gen_random_uuid(),
  vehicule_id       uuid not null references vehicules(id) on delete cascade,
  jeton             text not null unique
                    default replace(replace(encode(gen_random_bytes(9),'base64'),'/','_'),'+','-'),
  libelle           text,
  voir_calendrier   boolean not null default true,
  voir_depenses     boolean not null default true,
  voir_photos       boolean not null default false,
  actif             boolean not null default true,
  cree_le           timestamptz not null default now(),
  dernier_acces     timestamptz
);

-- =================================================================
-- LE CALCUL. Il vit ici et nulle part ailleurs.
-- =================================================================

-- Une ligne par jour dû, avec le montant attendu ce jour-là.
create or replace function attendu_par_jour(
  p_contrat uuid,
  p_du      date default '1900-01-01',
  p_au      date default current_date
)
returns table(jour date, montant bigint)
language sql
stable
as $fn$
  select
    d::date as jour,
    coalesce(
      (select a.montant_journalier
         from ajustements a
        where a.contrat_id = c.id
          and d::date between a.date_debut and a.date_fin
        order by a.cree_le desc
        limit 1),
      c.montant_journalier
    ) as montant
  from contrats c
  cross join generate_series(
    greatest(p_du, c.date_debut),
    least(p_au, coalesce(c.date_fin, p_au)),
    interval '1 day'
  ) d
  where c.id = p_contrat
    and extract(isodow from d)::smallint = any(c.jours_actifs);
$fn$;

-- Le solde du chauffeur. Positif = il doit de l'argent.
create or replace function solde_chauffeur(
  p_contrat uuid,
  p_au      date default current_date
)
returns bigint
language sql
stable
as $fn$
  select
      (select solde_initial from contrats where id = p_contrat)
    + coalesce((select sum(montant) from attendu_par_jour(p_contrat, '1900-01-01', p_au)), 0)
    - coalesce((select sum(montant) from versements
                 where contrat_id = p_contrat and date <= p_au), 0);
$fn$;

-- L'état de chaque jour d'un mois : ce qui alimente le calendrier.
-- etat ∈ verse | partiel | non_verse | non_du | a_venir
create or replace function etat_du_mois(
  p_contrat uuid,
  p_annee   int,
  p_mois    int
)
returns table(jour date, attendu bigint, recu bigint, etat text, motif text)
language sql
stable
as $fn$
  with bornes as (
    select make_date(p_annee, p_mois, 1) as d1,
           (make_date(p_annee, p_mois, 1) + interval '1 month' - interval '1 day')::date as d2
  ),
  jours as (
    select d::date as jour from bornes, generate_series(d1, d2, interval '1 day') d
  ),
  att as (
    select a.jour, a.montant from bornes, attendu_par_jour(p_contrat, d1, d2) a
  ),
  ver as (
    select v.date as jour, sum(v.montant) as recu
      from versements v, bornes
     where v.contrat_id = p_contrat and v.date between d1 and d2
     group by v.date
  )
  select
    j.jour,
    coalesce(att.montant, 0) as attendu,
    coalesce(ver.recu, 0)    as recu,
    case
      when coalesce(att.montant, 0) = 0        then 'non_du'
      when j.jour > current_date               then 'a_venir'
      when coalesce(ver.recu, 0) >= att.montant then 'verse'
      when coalesce(ver.recu, 0) > 0           then 'partiel'
      else 'non_verse'
    end as etat,
    (select aj.motif from ajustements aj
      where aj.contrat_id = p_contrat
        and j.jour between aj.date_debut and aj.date_fin
      order by aj.cree_le desc limit 1) as motif
  from jours j
  left join att on att.jour = j.jour
  left join ver on ver.jour = j.jour
  order by j.jour;
$fn$;

-- Woto — authentification chauffeur par OTP SMS
-- À exécuter APRÈS 02_rls.sql.
--
-- Le chauffeur se connecte avec son numéro de téléphone : un code à 4 chiffres
-- lui est envoyé par SMS (edge functions simple-otp / simple-verify, API
-- Africa's Talking). Son compte auth est lié via chauffeurs.user_id.
-- Périmètre chauffeur : consulter son solde et son calendrier, faire les
-- inspections photos + kilométrage. Rien d'autre.

-- ---------------------------------------------------------------- otp_codes
-- Codes en clair, TTL 5 minutes, 3 tentatives max (détruits par simple-verify).
-- Accès service_role uniquement : RLS activé, AUCUNE policy.
create table if not exists otp_codes (
  id          uuid primary key default gen_random_uuid(),
  phone       text not null,
  code        text not null,
  attempts    int  not null default 0,
  expires_at  timestamptz not null,
  verified_at timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists idx_otp_codes_phone on otp_codes(phone, created_at desc);
alter table otp_codes enable row level security;

-- ------------------------------------------------- lien compte <-> chauffeur
alter table chauffeurs
  add column if not exists user_id uuid unique references auth.users(id) on delete set null;

-- Un chauffeur connecté = un compte lié à une fiche chauffeur active.
create or replace function est_chauffeur()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1 from chauffeurs c
     where c.user_id = auth.uid() and c.actif
  );
$fn$;

-- Ses contrats (utilisé par plusieurs policies).
create or replace function contrats_du_chauffeur()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $fn$
  select co.id
    from contrats co
    join chauffeurs ch on ch.id = co.chauffeur_id
   where ch.user_id = auth.uid() and ch.actif;
$fn$;

-- ------------------------------------------------------- policies chauffeur
-- Elles s'ajoutent (OR) aux policies admin_tout existantes.

-- Sa propre fiche
drop policy if exists chauffeur_lit_sa_fiche on chauffeurs;
create policy chauffeur_lit_sa_fiche on chauffeurs
  for select to authenticated
  using (user_id = auth.uid());

-- Ses contrats
drop policy if exists chauffeur_lit_ses_contrats on contrats;
create policy chauffeur_lit_ses_contrats on contrats
  for select to authenticated
  using (id in (select contrats_du_chauffeur()));

-- Les véhicules de ses contrats
drop policy if exists chauffeur_lit_ses_vehicules on vehicules;
create policy chauffeur_lit_ses_vehicules on vehicules
  for select to authenticated
  using (id in (select co.vehicule_id from contrats co
                 where co.id in (select contrats_du_chauffeur())));

-- Les versements et ajustements de ses contrats (lecture seule)
drop policy if exists chauffeur_lit_ses_versements on versements;
create policy chauffeur_lit_ses_versements on versements
  for select to authenticated
  using (contrat_id in (select contrats_du_chauffeur()));

drop policy if exists chauffeur_lit_ses_ajustements on ajustements;
create policy chauffeur_lit_ses_ajustements on ajustements
  for select to authenticated
  using (contrat_id in (select contrats_du_chauffeur()));

-- Inspections : il les crée et les consulte pour les véhicules de ses contrats
drop policy if exists chauffeur_gere_inspections on inspections;
create policy chauffeur_gere_inspections on inspections
  for all to authenticated
  using (est_chauffeur() and vehicule_id in
         (select co.vehicule_id from contrats co
           where co.id in (select contrats_du_chauffeur())))
  with check (est_chauffeur() and vehicule_id in
         (select co.vehicule_id from contrats co
           where co.id in (select contrats_du_chauffeur())));

drop policy if exists chauffeur_gere_inspection_photos on inspection_photos;
create policy chauffeur_gere_inspection_photos on inspection_photos
  for all to authenticated
  using (inspection_id in
         (select i.id from inspections i
           where i.vehicule_id in (select co.vehicule_id from contrats co
                                    where co.id in (select contrats_du_chauffeur()))))
  with check (inspection_id in
         (select i.id from inspections i
           where i.vehicule_id in (select co.vehicule_id from contrats co
                                    where co.id in (select contrats_du_chauffeur()))));

-- NB : pas de policy chauffeur sur depenses, echeances, partages, profils.
-- Le chauffeur ne voit ni les dépenses ni les échéances du propriétaire.

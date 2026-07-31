-- Woto — sécurité (RLS)
-- À exécuter APRÈS 01_schema.sql.
--
-- Principe :
--   * lecture et écriture réservées aux administrateurs actifs (table profils) ;
--   * AUCUNE policy pour le rôle `anon` sur les tables métier ;
--   * la page publique /p/[jeton] est rendue côté serveur et lit les données avec
--     la clé service_role, qui contourne RLS. Cette clé ne doit jamais atteindre
--     le navigateur.

-- Un administrateur = un profil actif correspondant à l'utilisateur connecté.
create or replace function est_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1 from profils p
     where p.id = auth.uid() and p.actif
  );
$fn$;

alter table profils            enable row level security;
alter table vehicules          enable row level security;
alter table chauffeurs         enable row level security;
alter table contrats           enable row level security;
alter table ajustements        enable row level security;
alter table versements         enable row level security;
alter table depenses           enable row level security;
alter table echeances          enable row level security;
alter table inspections        enable row level security;
alter table inspection_photos  enable row level security;
alter table partages           enable row level security;

-- Un administrateur peut tout faire sur les tables métier.
do $do$
declare t text;
begin
  foreach t in array array[
    'vehicules','chauffeurs','contrats','ajustements','versements',
    'depenses','echeances','inspections','inspection_photos','partages'
  ] loop
    execute format('drop policy if exists admin_tout on %I', t);
    execute format(
      'create policy admin_tout on %I for all to authenticated using (est_admin()) with check (est_admin())',
      t
    );
  end loop;
end
$do$;

-- Un administrateur voit tous les profils, mais ne modifie que le sien.
drop policy if exists profils_lecture on profils;
create policy profils_lecture on profils
  for select to authenticated
  using (est_admin());

drop policy if exists profils_maj on profils;
create policy profils_maj on profils
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Storage : bucket privé `photos`, réservé aux administrateurs.
-- À décommenter une fois le bucket créé dans l'interface Supabase.
--
-- drop policy if exists photos_admin on storage.objects;
-- create policy photos_admin on storage.objects
--   for all to authenticated
--   using (bucket_id = 'photos' and est_admin())
--   with check (bucket_id = 'photos' and est_admin());

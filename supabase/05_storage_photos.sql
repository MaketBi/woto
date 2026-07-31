-- Woto — bucket privé `photos` + policies d'accès
-- Chemin des objets : <vehicule_id>/<inspection_id>/<angle>.jpg
-- Lecture via URLs signées uniquement (bucket privé, aucun accès anonyme).

insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

-- Admin : tout, sur ce bucket uniquement
drop policy if exists photos_admin_tout on storage.objects;
create policy photos_admin_tout on storage.objects
  for all to authenticated
  using (bucket_id = 'photos' and est_admin())
  with check (bucket_id = 'photos' and est_admin());

-- Chauffeur : lire et déposer les photos des véhicules de ses contrats
-- (premier segment du chemin = vehicule_id)
drop policy if exists photos_chauffeur_lit on storage.objects;
create policy photos_chauffeur_lit on storage.objects
  for select to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] in (
      select co.vehicule_id::text from contrats co
       where co.id in (select contrats_du_chauffeur())
    )
  );

drop policy if exists photos_chauffeur_depose on storage.objects;
create policy photos_chauffeur_depose on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] in (
      select co.vehicule_id::text from contrats co
       where co.id in (select contrats_du_chauffeur())
    )
  );

-- Reprendre une photo = remplacer l'objet (upsert)
drop policy if exists photos_chauffeur_remplace on storage.objects;
create policy photos_chauffeur_remplace on storage.objects
  for update to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] in (
      select co.vehicule_id::text from contrats co
       where co.id in (select contrats_du_chauffeur())
    )
  )
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] in (
      select co.vehicule_id::text from contrats co
       where co.id in (select contrats_du_chauffeur())
    )
  );

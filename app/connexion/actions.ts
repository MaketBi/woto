"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

export type EtatConnexion = { erreur?: string; info?: string };

export async function seConnecter(
  _etat: EtatConnexion,
  formData: FormData
): Promise<EtatConnexion> {
  const email = String(formData.get("email") ?? "").trim();
  const motDePasse = String(formData.get("mot_de_passe") ?? "");

  if (!email || !motDePasse) {
    return { erreur: "Renseigne l'email et le mot de passe." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: motDePasse,
  });

  if (error) {
    return { erreur: "Email ou mot de passe incorrect." };
  }

  // Le compte doit exister et être actif dans `profils`.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profil } = await supabase
    .from("profils")
    .select("id")
    .eq("id", user!.id)
    .eq("actif", true)
    .maybeSingle();

  if (!profil) {
    await supabase.auth.signOut();
    return { erreur: "Ce compte n'est pas autorisé." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function motDePasseOublie(
  _etat: EtatConnexion,
  formData: FormData
): Promise<EtatConnexion> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { erreur: "Renseigne ton email, puis retouche « Mot de passe oublié »." };
  }

  const supabase = await createClient();
  const site = await getSiteUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${site}/connexion/reinitialiser`,
  });

  if (error) {
    return { erreur: "Envoi impossible. Réessaie dans un instant." };
  }

  return { info: "Email envoyé. Ouvre le lien qu'il contient pour choisir un nouveau mot de passe." };
}

export async function reinitialiserMotDePasse(
  _etat: EtatConnexion,
  formData: FormData
): Promise<EtatConnexion> {
  const motDePasse = String(formData.get("mot_de_passe") ?? "");

  if (motDePasse.length < 8) {
    return { erreur: "Le mot de passe doit faire au moins 8 caractères." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: motDePasse });

  if (error) {
    return { erreur: "Le lien a peut-être expiré. Redemande un email depuis la connexion." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Authentification chauffeur par code SMS — remplace les edge functions.
// Règles : numéro présent dans `chauffeurs` (actif) uniquement, code 4 chiffres
// en clair dans otp_codes (TTL 5 min), cooldown 30 s persisté en base,
// 3 tentatives puis code détruit. SMS via l'API Africa's Talking.

const AT_API_URL = "https://api.africastalking.com/version1/messaging";
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_COOLDOWN_MS = 30 * 1000;
const MAX_TENTATIVES = 3;

export type ResultatOtp = {
  ok: boolean;
  erreur?: string;
  essaisRestants?: number;
};

/** Normalise un numéro sénégalais en 2217XXXXXXXX ; null si invalide. */
function normaliserTelephone(brut: string): string | null {
  let digits = brut.replace(/\D/g, "");
  if (digits.length === 9 && digits.startsWith("7")) digits = "221" + digits;
  return /^2217[05678]\d{7}$/.test(digits) ? digits : null;
}

/** La fiche chauffeur active correspondant à un numéro normalisé. */
async function chauffeurParTelephone(
  admin: ReturnType<typeof createAdminClient>,
  telephone: string
) {
  const { data } = await admin
    .from("chauffeurs")
    .select("id, telephone, user_id")
    .eq("actif", true);
  return (
    (data ?? []).find(
      (c) => normaliserTelephone(c.telephone ?? "") === telephone
    ) ?? null
  );
}

async function envoyerSMS(
  telephone: string,
  message: string
): Promise<{ ok: boolean; erreur?: string }> {
  const username = process.env.AT_USERNAME;
  const apiKey = process.env.AT_API_KEY;
  if (!username || !apiKey) {
    // Repli développement UNIQUEMENT : pas d'envoi, le code est journalisé
    // côté serveur pour permettre de tester le parcours sans clés SMS.
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] SMS non configuré — code OTP pour ${telephone} : ${message}`);
      return { ok: true };
    }
    return { ok: false, erreur: "Service SMS non configuré." };
  }

  try {
    const params = new URLSearchParams({
      username,
      to: `+${telephone}`,
      message,
    });
    const reponse = await fetch(AT_API_URL, {
      method: "POST",
      headers: {
        apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params.toString(),
    });
    const resultat = await reponse.json();
    const destinataire = resultat.SMSMessageData?.Recipients?.[0];
    if (
      destinataire &&
      (destinataire.statusCode === 100 || destinataire.statusCode === 101)
    ) {
      return { ok: true };
    }
    console.error(
      "Africa's Talking:",
      destinataire?.status ?? resultat.SMSMessageData?.Message
    );
    return { ok: false, erreur: "Échec de l'envoi du SMS." };
  } catch (err) {
    console.error("Exception Africa's Talking:", err);
    return { ok: false, erreur: "Échec de l'envoi du SMS." };
  }
}

export async function envoyerCodeOtp(brut: string): Promise<ResultatOtp> {
  const telephone = normaliserTelephone(brut);
  if (!telephone) {
    return { ok: false, erreur: "Numéro invalide. Format attendu : 7X XXX XX XX." };
  }

  const admin = createAdminClient();

  const chauffeur = await chauffeurParTelephone(admin, telephone);
  if (!chauffeur) {
    return { ok: false, erreur: "Numéro non reconnu. Contactez le propriétaire." };
  }

  // Cooldown + réutilisation du code encore valide
  const { data: actif } = await admin
    .from("otp_codes")
    .select("code, created_at")
    .eq("phone", telephone)
    .is("verified_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let code: string;
  if (actif) {
    const age = Date.now() - new Date(actif.created_at).getTime();
    if (age < OTP_COOLDOWN_MS) {
      return {
        ok: false,
        erreur: "Un code vient d'être envoyé. Patientez quelques secondes.",
      };
    }
    code = actif.code;
  } else {
    code = Math.floor(1000 + Math.random() * 9000).toString();
    await admin
      .from("otp_codes")
      .delete()
      .eq("phone", telephone)
      .is("verified_at", null);
    const { error } = await admin.from("otp_codes").insert({
      phone: telephone,
      code,
      attempts: 0,
      expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    });
    if (error) {
      console.error("Insertion otp_codes:", error);
      return { ok: false, erreur: "Erreur interne. Réessayez." };
    }
  }

  const sms = await envoyerSMS(
    telephone,
    `${code} est votre code Woto. Ne le partagez jamais !`
  );
  if (!sms.ok) {
    // Ne pas laisser traîner un code jamais reçu (sauf s'il était déjà actif)
    if (!actif) {
      await admin.from("otp_codes").delete().eq("phone", telephone).eq("code", code);
    }
    return { ok: false, erreur: sms.erreur };
  }

  return { ok: true };
}

export async function verifierCodeOtp(
  brutTelephone: string,
  brutCode: string
): Promise<ResultatOtp> {
  const telephone = normaliserTelephone(brutTelephone);
  if (!telephone) return { ok: false, erreur: "Numéro invalide." };
  const code = String(brutCode).trim();
  if (!/^\d{4}$/.test(code)) return { ok: false, erreur: "Code invalide." };

  const admin = createAdminClient();

  const { data: otp } = await admin
    .from("otp_codes")
    .select("*")
    .eq("phone", telephone)
    .is("verified_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!otp) return { ok: false, erreur: "Aucun code en attente. Renvoyez un code." };

  if (new Date() > new Date(otp.expires_at)) {
    await admin.from("otp_codes").delete().eq("id", otp.id);
    return { ok: false, erreur: "Code expiré. Renvoyez un code." };
  }

  if (otp.attempts >= MAX_TENTATIVES) {
    await admin.from("otp_codes").delete().eq("id", otp.id);
    return { ok: false, erreur: "Trop de tentatives. Renvoyez un code." };
  }

  if (otp.code !== code) {
    await admin
      .from("otp_codes")
      .update({ attempts: otp.attempts + 1 })
      .eq("id", otp.id);
    return {
      ok: false,
      erreur: "Code invalide",
      essaisRestants: MAX_TENTATIVES - otp.attempts - 1,
    };
  }

  await admin
    .from("otp_codes")
    .update({ verified_at: new Date().toISOString() })
    .eq("id", otp.id);

  const chauffeur = await chauffeurParTelephone(admin, telephone);
  if (!chauffeur) {
    return { ok: false, erreur: "Numéro non reconnu. Contactez le propriétaire." };
  }

  // Compte auth : email fictif + mot de passe déterministe (jamais communiqué)
  const email = `${telephone}@woto.phone`;
  const motDePasse = `WT_${telephone}_${process.env.SUPABASE_SERVICE_ROLE_KEY!.slice(-8)}`;

  let userId = chauffeur.user_id;

  if (!userId) {
    const { data: cree, error: erreurCreation } =
      await admin.auth.admin.createUser({
        email,
        password: motDePasse,
        email_confirm: true,
        user_metadata: { role: "chauffeur", phone: telephone },
      });

    if (cree?.user) {
      userId = cree.user.id;
    } else if (
      erreurCreation?.message?.includes("already registered") ||
      erreurCreation?.message?.includes("already exists")
    ) {
      const { data: liste } = await admin.auth.admin.listUsers();
      userId = liste?.users?.find((u) => u.email === email)?.id ?? null;
    }

    if (!userId) {
      console.error("Création compte chauffeur:", erreurCreation);
      return { ok: false, erreur: "Erreur de création du compte. Réessayez." };
    }

    await admin.from("chauffeurs").update({ user_id: userId }).eq("id", chauffeur.id);
  } else {
    // S'assurer que le mot de passe déterministe est à jour
    await admin.auth.admin.updateUserById(userId, {
      password: motDePasse,
      email_confirm: true,
    });
  }

  // Ouvre la session via le client SSR : les cookies sont posés par le serveur.
  const supabase = await createClient();
  const { error: erreurConnexion } = await supabase.auth.signInWithPassword({
    email,
    password: motDePasse,
  });
  if (erreurConnexion) {
    console.error("signInWithPassword chauffeur:", erreurConnexion);
    return { ok: false, erreur: "Erreur d'ouverture de session. Réessayez." };
  }

  return { ok: true };
}

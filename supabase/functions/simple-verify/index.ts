// =============================================================================
// EDGE FUNCTION — VÉRIFICATION OTP + SESSION CHAUFFEUR
// Woto — adapté de la version Yonima, simplifié : vérifie le code SMS puis
// crée/retrouve le compte auth du chauffeur (email fictif <tel>@woto.phone,
// mot de passe déterministe jamais communiqué) et renvoie les tokens de session.
// Lie chauffeurs.user_id au premier login. 3 tentatives max, code détruit après.
// =============================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const MAX_ATTEMPTS = 3;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-client-info, apikey",
};

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normaliserTelephone(brut: string): string | null {
  let digits = brut.replace(/\D/g, "");
  if (digits.length === 9 && digits.startsWith("7")) digits = "221" + digits;
  return /^2217[05678]\d{7}$/.test(digits) ? digits : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, valid: false, error: "POST only" }, 405);

  try {
    const { phone, code } = await req.json();
    if (!phone || !code) {
      return json({ success: false, valid: false, error: "phone et code requis" }, 400);
    }

    const telephone = normaliserTelephone(String(phone));
    if (!telephone) {
      return json({ success: false, valid: false, error: "Numéro invalide" }, 400);
    }
    const codeSaisi = String(code).trim();

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Dernier code non vérifié pour ce numéro
    const { data: otp } = await admin
      .from("otp_codes")
      .select("*")
      .eq("phone", telephone)
      .is("verified_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otp) {
      return json({ success: false, valid: false, error: "Aucun code en attente" }, 400);
    }

    if (new Date() > new Date(otp.expires_at)) {
      await admin.from("otp_codes").delete().eq("id", otp.id);
      return json({ success: false, valid: false, expired: true, error: "Code expiré" }, 400);
    }

    if (otp.attempts >= MAX_ATTEMPTS) {
      await admin.from("otp_codes").delete().eq("id", otp.id);
      return json(
        { success: false, valid: false, error: "Trop de tentatives, demandez un nouveau code" },
        400
      );
    }

    if (otp.code !== codeSaisi) {
      await admin.from("otp_codes").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
      return json(
        {
          success: false,
          valid: false,
          error: "Code invalide",
          attempts_remaining: MAX_ATTEMPTS - otp.attempts - 1,
        },
        400
      );
    }

    // Code valide — marquer vérifié
    await admin.from("otp_codes").update({ verified_at: new Date().toISOString() }).eq("id", otp.id);

    // Le numéro doit correspondre à un chauffeur actif
    const { data: chauffeurs } = await admin
      .from("chauffeurs")
      .select("id, telephone, user_id")
      .eq("actif", true);
    const chauffeur = (chauffeurs ?? []).find(
      (c) => normaliserTelephone(c.telephone ?? "") === telephone
    );
    if (!chauffeur) {
      return json(
        { success: false, valid: true, error: "Numéro non reconnu. Contactez le propriétaire." },
        403
      );
    }

    // Compte auth : email fictif + mot de passe déterministe (jamais communiqué)
    const email = `${telephone}@woto.phone`;
    const password = `WT_${telephone}_${SUPABASE_SERVICE_ROLE_KEY.slice(-8)}`;

    let userId = chauffeur.user_id as string | null;

    if (!userId) {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: "chauffeur", phone: telephone },
      });

      if (created?.user) {
        userId = created.user.id;
      } else if (
        createError?.message?.includes("already registered") ||
        createError?.message?.includes("already exists")
      ) {
        // Compte existant non lié (ex. fiche chauffeur recréée) : le retrouver
        const { data: liste } = await admin.auth.admin.listUsers();
        userId = liste?.users?.find((u) => u.email === email)?.id ?? null;
      }

      if (!userId) {
        console.error("Erreur création utilisateur:", createError);
        return json({ success: false, valid: true, error: "Erreur création compte" }, 500);
      }

      await admin.from("chauffeurs").update({ user_id: userId }).eq("id", chauffeur.id);
      console.log(`Chauffeur ${chauffeur.id} lié au compte ${userId}`);
    } else {
      // S'assurer que le mot de passe déterministe est à jour
      await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
    }

    // Session via signInWithPassword (client anon)
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let session = null;
    for (let tentative = 1; tentative <= 3 && !session; tentative++) {
      if (tentative > 1) await new Promise((r) => setTimeout(r, 200 * tentative));
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (!error && data?.session) session = data.session;
      else if (tentative === 3) console.error("signInWithPassword échoué:", error?.message);
    }

    if (!session) {
      return json(
        { success: false, valid: true, error: "Erreur création session. Réessayez.", retry: true },
        500
      );
    }

    console.log(`🎉 Session chauffeur créée pour ${telephone}`);
    return json({
      success: true,
      valid: true,
      phone: telephone,
      user_id: userId,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      token_type: "bearer",
    });
  } catch (error) {
    console.error("Erreur simple-verify:", error);
    return json({ success: false, valid: false, error: "Erreur serveur" }, 500);
  }
});

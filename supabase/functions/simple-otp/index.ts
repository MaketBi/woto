// =============================================================================
// EDGE FUNCTION — ENVOI OTP PAR SMS (Africa's Talking)
// Woto — adapté de la version Yonima, simplifié : SMS uniquement, réservé au
// chauffeur (numéro présent et actif dans la table chauffeurs).
// Code 4 chiffres en clair dans otp_codes, TTL 5 min, cooldown 30 s persisté
// en base (les isolates Deno ne partagent pas leur mémoire).
// Secrets requis : AT_USERNAME, AT_API_KEY.
// =============================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AT_API_URL = "https://api.africastalking.com/version1/messaging";
const AT_API_KEY = Deno.env.get("AT_API_KEY");
const AT_USERNAME = Deno.env.get("AT_USERNAME") ?? "";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const OTP_TTL_MS = 5 * 60 * 1000; // le code expire en 5 minutes
const OTP_COOLDOWN_MS = 30 * 1000; // 30 s minimum entre deux envois

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

// Normalise un numéro sénégalais en 2217XXXXXXXX (chiffres uniquement).
function normaliserTelephone(brut: string): string | null {
  let digits = brut.replace(/\D/g, "");
  if (digits.length === 9 && digits.startsWith("7")) digits = "221" + digits;
  return /^2217[05678]\d{7}$/.test(digits) ? digits : null;
}

async function envoyerSMS(
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  if (!AT_API_KEY || !AT_USERNAME) {
    return { success: false, error: "Service SMS non configuré" };
  }
  try {
    const params = new URLSearchParams();
    params.append("username", AT_USERNAME);
    params.append("to", `+${phone}`);
    params.append("message", message);

    const response = await fetch(AT_API_URL, {
      method: "POST",
      headers: {
        apiKey: AT_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params.toString(),
    });

    const result = await response.json();
    const recipient = result.SMSMessageData?.Recipients?.[0];
    if (recipient && (recipient.statusCode === 100 || recipient.statusCode === 101)) {
      return { success: true };
    }
    return {
      success: false,
      error:
        recipient?.status ?? result.SMSMessageData?.Message ?? "Erreur d'envoi",
    };
  } catch (err) {
    console.error("Exception Africa's Talking:", err);
    return { success: false, error: "Exception lors de l'envoi SMS" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "POST only" }, 405);

  try {
    const { phone } = await req.json();
    if (!phone) return json({ success: false, error: "phone requis" }, 400);

    const telephone = normaliserTelephone(String(phone));
    if (!telephone) {
      return json(
        { success: false, error: "Numéro invalide. Format attendu : 7X XXX XX XX." },
        400
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Réservé au chauffeur : le numéro doit exister dans chauffeurs (actif).
    const { data: chauffeurs } = await supabase
      .from("chauffeurs")
      .select("id, telephone")
      .eq("actif", true);
    const chauffeur = (chauffeurs ?? []).find(
      (c) => normaliserTelephone(c.telephone ?? "") === telephone
    );
    if (!chauffeur) {
      console.log(`Numéro non autorisé: ${telephone}`);
      return json(
        { success: false, error: "Numéro non reconnu. Contactez le propriétaire." },
        403
      );
    }

    // Cooldown + réutilisation : on lit le dernier code actif AVANT de générer.
    const { data: actif } = await supabase
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
      const age = Date.now() - new Date(actif.created_at as string).getTime();
      if (age < OTP_COOLDOWN_MS) {
        return json(
          { success: false, error: "Un code vient d'être envoyé. Patientez quelques secondes." },
          429
        );
      }
      code = actif.code as string; // code encore valide : on renvoie le même
    } else {
      code = Math.floor(1000 + Math.random() * 9000).toString();
      await supabase
        .from("otp_codes")
        .delete()
        .eq("phone", telephone)
        .is("verified_at", null);
      const { error: insertError } = await supabase.from("otp_codes").insert({
        phone: telephone,
        code,
        attempts: 0,
        expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      });
      if (insertError) {
        console.error("Erreur insertion OTP:", insertError);
        return json({ success: false, error: "Erreur sauvegarde code" }, 500);
      }
    }

    const sms = await envoyerSMS(telephone, `${code} est votre code Woto. Ne le partagez jamais !`);
    if (!sms.success) {
      console.error(`Échec SMS vers ${telephone}: ${sms.error}`);
      // Ne pas laisser traîner un code jamais reçu
      if (!actif) {
        await supabase.from("otp_codes").delete().eq("phone", telephone).eq("code", code);
      }
      return json({ success: false, error: "Impossible d'envoyer le SMS. Réessayez." }, 500);
    }

    console.log(`✅ OTP envoyé par SMS à ${telephone}`);
    return json({ success: true, channel: "sms", phone: telephone });
  } catch (error) {
    console.error("Erreur simple-otp:", error);
    return json({ success: false, error: "Erreur serveur" }, 500);
  }
});

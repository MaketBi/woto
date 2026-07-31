"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { envoyerCodeOtp, verifierCodeOtp } from "@/app/actions/otp";

export function FormulaireOtp() {
  const router = useRouter();
  const [etape, setEtape] = useState<"numero" | "code">("numero");
  const [telephone, setTelephone] = useState("");
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [attente, setAttente] = useState(0); // countdown avant renvoi possible
  const champCode = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (attente <= 0) return;
    const t = setTimeout(() => setAttente((a) => a - 1), 1000);
    return () => clearTimeout(t);
  }, [attente]);

  async function envoyerCode() {
    if (enCours) return;
    setErreur(null);
    setEnCours(true);
    const resultat = await envoyerCodeOtp(telephone);
    setEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.erreur ?? "Envoi impossible. Réessayez.");
      return;
    }
    setEtape("code");
    setCode("");
    setAttente(30);
    setTimeout(() => champCode.current?.focus(), 50);
  }

  async function verifierCode() {
    if (enCours || code.trim().length < 4) return;
    setErreur(null);
    setEnCours(true);
    const resultat = await verifierCodeOtp(telephone, code.trim());

    if (!resultat.ok) {
      setEnCours(false);
      const restantes =
        resultat.essaisRestants !== undefined && resultat.essaisRestants >= 0
          ? ` (${resultat.essaisRestants} essai${resultat.essaisRestants > 1 ? "s" : ""} restant${resultat.essaisRestants > 1 ? "s" : ""})`
          : "";
      setErreur((resultat.erreur ?? "Code invalide") + restantes);
      return;
    }

    // La session a été posée en cookies par la Server Action.
    router.push("/chauffeur");
    router.refresh();
  }

  if (etape === "numero") {
    return (
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          envoyerCode();
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="telephone">Numéro de téléphone</Label>
          <div className="flex items-center gap-2">
            <span className="flex h-12 items-center rounded-lg border border-line bg-plane px-3 text-[15px] font-semibold text-ink-2">
              +221
            </span>
            <Input
              id="telephone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="77 123 45 67"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              required
              className="h-12 bg-surface text-[15px] font-semibold"
            />
          </div>
          <p className="text-xs text-ink-3">
            Un code à 4 chiffres vous sera envoyé par SMS.
          </p>
        </div>

        {erreur && (
          <p className="rounded-xl bg-crit-soft px-4 py-3 text-sm font-medium text-crit-ink">
            {erreur}
          </p>
        )}

        <Button
          type="submit"
          disabled={enCours}
          className="w-full rounded-[14px] py-4 text-base font-semibold"
        >
          {enCours ? "Envoi…" : "Recevoir le code"}
        </Button>

        <Link
          href="/connexion"
          className="mx-auto mt-1 flex min-h-11 items-center px-2 text-sm font-semibold text-brand"
        >
          Je suis le propriétaire
        </Link>
      </form>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        verifierCode();
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Code reçu par SMS</Label>
        <Input
          id="code"
          ref={champCode}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={4}
          placeholder="••••"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          required
          className="h-14 bg-surface text-center text-[26px] font-bold tracking-[0.5em]"
        />
        <p className="text-xs text-ink-3">
          Envoyé au +221 {telephone}. Le code expire dans 5 minutes.
        </p>
      </div>

      {erreur && (
        <p className="rounded-xl bg-crit-soft px-4 py-3 text-sm font-medium text-crit-ink">
          {erreur}
        </p>
      )}

      <Button
        type="submit"
        disabled={enCours || code.trim().length < 4}
        className="w-full rounded-[14px] py-4 text-base font-semibold"
      >
        {enCours ? "Vérification…" : "Se connecter"}
      </Button>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setEtape("numero");
            setErreur(null);
          }}
          className="flex min-h-11 items-center px-2 text-sm font-semibold text-ink-3"
        >
          Changer de numéro
        </button>
        <button
          type="button"
          onClick={envoyerCode}
          disabled={attente > 0 || enCours}
          className="flex min-h-11 items-center px-2 text-sm font-semibold text-brand disabled:text-ink-4"
        >
          {attente > 0 ? `Renvoyer (${attente} s)` : "Renvoyer le code"}
        </button>
      </div>
    </form>
  );
}

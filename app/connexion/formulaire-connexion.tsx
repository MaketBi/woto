"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  seConnecter,
  motDePasseOublie,
  type EtatConnexion,
} from "./actions";

const etatInitial: EtatConnexion = {};

export function FormulaireConnexion({
  erreurProfil,
}: {
  erreurProfil?: boolean;
}) {
  const [etat, actionConnexion, enCours] = useActionState(
    seConnecter,
    etatInitial
  );
  const [etatOubli, actionOubli, oubliEnCours] = useActionState(
    motDePasseOublie,
    etatInitial
  );

  const erreur =
    etat.erreur ??
    etatOubli.erreur ??
    (erreurProfil ? "Ce compte n'est pas autorisé." : undefined);

  return (
    <form className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          className="h-12 bg-surface"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="mot_de_passe">Mot de passe</Label>
        <Input
          id="mot_de_passe"
          name="mot_de_passe"
          type="password"
          autoComplete="current-password"
          required
          className="h-12 bg-surface"
        />
      </div>

      {erreur && (
        <p className="rounded-xl bg-crit-soft px-4 py-3 text-sm font-medium text-crit-ink">
          {erreur}
        </p>
      )}
      {etatOubli.info && (
        <p className="rounded-xl bg-good-soft px-4 py-3 text-sm font-medium text-good-ink">
          {etatOubli.info}
        </p>
      )}

      <Button
        formAction={actionConnexion}
        disabled={enCours}
        className="h-13 w-full rounded-[14px] py-4 text-base font-semibold"
      >
        {enCours ? "Connexion…" : "Se connecter"}
      </Button>

      <button
        formAction={actionOubli}
        formNoValidate
        disabled={oubliEnCours}
        className="mx-auto mt-1 min-h-11 px-2 text-sm font-semibold text-brand"
      >
        {oubliEnCours ? "Envoi…" : "Mot de passe oublié ?"}
      </button>
    </form>
  );
}

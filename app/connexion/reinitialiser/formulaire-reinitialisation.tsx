"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  reinitialiserMotDePasse,
  type EtatConnexion,
} from "../actions";

const etatInitial: EtatConnexion = {};

export function FormulaireReinitialisation() {
  const [etat, action, enCours] = useActionState(
    reinitialiserMotDePasse,
    etatInitial
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="mot_de_passe">Nouveau mot de passe</Label>
        <Input
          id="mot_de_passe"
          name="mot_de_passe"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="h-12 bg-surface"
        />
        <p className="text-xs text-ink-3">Au moins 8 caractères.</p>
      </div>

      {etat.erreur && (
        <p className="rounded-xl bg-crit-soft px-4 py-3 text-sm font-medium text-crit-ink">
          {etat.erreur}
        </p>
      )}

      <Button
        type="submit"
        disabled={enCours}
        className="w-full rounded-[14px] py-4 text-base font-semibold"
      >
        {enCours ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}

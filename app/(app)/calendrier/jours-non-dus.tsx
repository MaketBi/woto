"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clsx } from "clsx";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { creerAjustement } from "@/app/actions/ajustements";

const MOTIFS = [
  { valeur: "garage", libelle: "Garage" },
  { valeur: "conges", libelle: "Congés" },
  { valeur: "revision", libelle: "Révision" },
  { valeur: "panne", libelle: "Panne" },
  { valeur: "autre", libelle: "Autre" },
] as const;

export function JoursNonDus({
  contratId,
  aujourdhui,
}: {
  contratId: string;
  aujourdhui: string;
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [enCours, startTransition] = useTransition();
  const [motif, setMotif] = useState<string>("conges");
  const [debut, setDebut] = useState(aujourdhui);
  const [fin, setFin] = useState(aujourdhui);
  const [commentaire, setCommentaire] = useState("");

  function enregistrer() {
    if (enCours) return;
    if (fin < debut) {
      toast.error("La fin doit être après le début.");
      return;
    }
    startTransition(async () => {
      const resultat = await creerAjustement({
        contratId,
        dateDebut: debut,
        dateFin: fin,
        motif,
        commentaire,
      });
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      toast.success("Jours non dus enregistrés");
      setOuvert(false);
      setCommentaire("");
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="flex min-h-[46px] w-full items-center justify-center rounded-[18px] bg-surface text-sm font-semibold"
      >
        Déclarer des jours non dus
      </button>

      <Sheet open={ouvert} onOpenChange={setOuvert}>
        <SheetContent
          side="bottom"
          className="mx-auto max-w-[412px] rounded-t-[20px] border-line bg-surface px-[18px] pb-[22px] pt-2.5"
        >
          <div className="mx-auto mb-3.5 h-1 w-[38px] rounded-sm bg-line" />
          <SheetHeader className="p-0 text-left">
            <SheetTitle className="text-xl font-bold tracking-[-0.3px]">
              Jours non dus
            </SheetTitle>
          </SheetHeader>

          <div className="mt-3.5 flex flex-col gap-3.5">
            <div>
              <div className="mb-2.5 text-sm font-medium text-ink-2">Motif</div>
              <div className="flex flex-wrap gap-2">
                {MOTIFS.map((m) => (
                  <button
                    key={m.valeur}
                    type="button"
                    onClick={() => setMotif(m.valeur)}
                    className={clsx(
                      "flex min-h-11 items-center rounded-full px-4 text-sm font-semibold",
                      motif === m.valeur
                        ? "bg-ink text-white"
                        : "bg-plane text-ink"
                    )}
                  >
                    {m.libelle}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="debut"
                  className="mb-1.5 block text-sm font-medium text-ink-2"
                >
                  Du
                </label>
                <input
                  id="debut"
                  type="date"
                  value={debut}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    setDebut(e.target.value);
                    if (fin < e.target.value) setFin(e.target.value);
                  }}
                  className="min-h-11 w-full rounded-[14px] bg-plane px-3 text-[15px] font-semibold"
                />
              </div>
              <div>
                <label
                  htmlFor="fin"
                  className="mb-1.5 block text-sm font-medium text-ink-2"
                >
                  Au
                </label>
                <input
                  id="fin"
                  type="date"
                  value={fin}
                  min={debut}
                  onChange={(e) => e.target.value && setFin(e.target.value)}
                  className="min-h-11 w-full rounded-[14px] bg-plane px-3 text-[15px] font-semibold"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="commentaire"
                className="mb-1.5 block text-sm font-medium text-ink-2"
              >
                Commentaire (facultatif)
              </label>
              <input
                id="commentaire"
                type="text"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="Voiture au garage…"
                className="min-h-11 w-full rounded-[14px] bg-plane px-3 text-[15px] placeholder:text-ink-4"
              />
            </div>

            <button
              type="button"
              onClick={enregistrer}
              disabled={enCours}
              className="flex min-h-[58px] w-full items-center justify-center rounded-full bg-ink text-base font-bold text-white disabled:opacity-60"
            >
              {enCours ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

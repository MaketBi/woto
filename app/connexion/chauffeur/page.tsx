import { FormulaireOtp } from "./formulaire-otp";

export const metadata = { title: "Connexion chauffeur — Woto" };

export default function PageConnexionChauffeur() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[412px] flex-col justify-center px-6 pb-16">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-[18px] bg-ink text-3xl font-bold text-lime">
          W
        </div>
        <h1 className="text-[26px] font-bold tracking-tight">Woto</h1>
        <p className="mt-1 text-sm text-ink-3">Espace chauffeur</p>
      </div>

      <FormulaireOtp />
    </main>
  );
}

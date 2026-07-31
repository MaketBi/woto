// Squelette de l'espace chauffeur.
export default function ChargementChauffeur() {
  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-[412px] animate-pulse flex-col gap-2.5 px-4 pb-6 pt-3"
      aria-hidden
    >
      <div>
        <div className="h-5 w-[150px] rounded-md bg-line" />
        <div className="mt-[7px] h-[13px] w-[110px] rounded-[5px] bg-[#eceae5]" />
      </div>
      <div className="rounded-[14px] border border-line bg-surface p-[18px]">
        <div className="h-[13px] w-[90px] rounded-[5px] bg-[#eceae5]" />
        <div className="my-2.5 h-10 w-[170px] rounded-lg bg-line" />
        <div className="h-7 w-[120px] rounded-full bg-[#eceae5]" />
      </div>
      <div className="rounded-[14px] border border-line bg-surface p-3.5">
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }, (_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-[#eceae5]" />
          ))}
        </div>
      </div>
      <p className="text-center text-xs font-medium text-ink-3">Mise à jour…</p>
    </div>
  );
}

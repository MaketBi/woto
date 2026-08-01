// Squelette générique des écrans à onglets — maquette 1d.
export default function ChargementApp() {
  return (
    <div className="flex animate-pulse flex-col gap-2.5" aria-hidden>
      {/* En-tête */}
      <div>
        <div className="h-5 w-[150px] rounded-md bg-line" />
        <div className="mt-[7px] h-[13px] w-[110px] rounded-[5px] bg-skeleton" />
      </div>
      {/* Carte principale */}
      <div className="rounded-[18px] bg-surface p-[18px]">
        <div className="h-[13px] w-[120px] rounded-[5px] bg-skeleton" />
        <div className="my-2.5 h-11 w-[190px] rounded-lg bg-line" />
        <div className="h-7 w-[150px] rounded-full bg-skeleton" />
      </div>
      {/* Carte semaine */}
      <div className="rounded-[18px] bg-surface px-4 py-3.5">
        <div className="h-[13px] w-[130px] rounded-[5px] bg-skeleton" />
        <div className="mt-[11px] grid grid-cols-6 gap-[7px]">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-[34px] rounded-lg bg-skeleton" />
          ))}
        </div>
      </div>
      {/* Tuiles */}
      <div className="grid grid-cols-2 gap-2.5">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-[18px] bg-surface px-3.5 py-[13px]">
            <div className="h-3 w-[90px] rounded-[5px] bg-skeleton" />
            <div className="mt-2 h-[22px] w-[110px] rounded-md bg-line" />
          </div>
        ))}
      </div>
      {/* Bouton */}
      <div className="min-h-[52px] rounded-xl bg-line" />
      {/* Liste */}
      <div className="overflow-hidden rounded-[18px] bg-surface">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={
              i < 2
                ? "flex justify-between border-b border-line-soft p-3.5"
                : "flex justify-between p-3.5"
            }
          >
            <div>
              <div className="h-3.5 w-[130px] rounded-[5px] bg-skeleton" />
              <div className="mt-1.5 h-[11px] w-20 rounded-[5px] bg-skeleton-2" />
            </div>
            <div className="h-3.5 w-16 rounded-[5px] bg-skeleton" />
          </div>
        ))}
      </div>
      <p className="text-center text-xs font-medium text-ink-3">Mise à jour…</p>
    </div>
  );
}

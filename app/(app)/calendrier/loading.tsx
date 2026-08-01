// Squelette du calendrier — maquette 1d (droite).
export default function ChargementCalendrier() {
  return (
    <div className="flex animate-pulse flex-col gap-3.5" aria-hidden>
      <div className="mx-auto h-[22px] w-[140px] rounded-md bg-line" />
      <div className="rounded-[18px] bg-surface p-3.5">
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }, (_, i) => (
            <div
              key={i}
              className={
                i < 7
                  ? "aspect-square rounded-lg bg-skeleton-2"
                  : "aspect-square rounded-lg bg-skeleton"
              }
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-[18px] bg-surface p-3">
            <div className="h-[11px] w-[50px] rounded-[5px] bg-skeleton-2" />
            <div className="mt-2 h-[18px] w-[70px] rounded-[5px] bg-skeleton" />
          </div>
        ))}
      </div>
      <p className="text-center text-xs font-medium text-ink-3">
        Chargement du mois…
      </p>
    </div>
  );
}

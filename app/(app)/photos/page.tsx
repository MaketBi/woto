export const metadata = { title: "Photos — Woto" };

// Écran complété à l'étape 6 (inspections guidées 6 angles + galerie).
export default function PagePhotos() {
  return (
    <>
      <h1 className="text-xl font-bold tracking-[-0.3px]">Photos</h1>
      <div className="rounded-xl border border-dashed border-line-2 bg-surface px-4 py-[26px] text-center">
        <div className="text-sm font-semibold text-ink-2">
          Bientôt disponible
        </div>
        <div className="mt-1 text-[13px] leading-[1.4] text-ink-3">
          Les inspections photo du véhicule (6 angles guidés) arrivent dans une
          prochaine version.
        </div>
      </div>
    </>
  );
}

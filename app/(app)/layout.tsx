import { BarreOnglets } from "@/components/barre-onglets";

// Coquille des écrans à onglets — mobile d'abord, 390 px de référence.
export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[412px] flex-col">
      <main className="flex flex-1 flex-col gap-2.5 px-4 pb-2 pt-3">
        {children}
      </main>
      <BarreOnglets />
    </div>
  );
}

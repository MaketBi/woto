"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const ONGLETS = [
  { href: "/", libelle: "Accueil" },
  { href: "/calendrier", libelle: "Calendrier" },
  { href: "/depenses", libelle: "Dépenses" },
  { href: "/reglages", libelle: "Réglages" },
] as const;

export function BarreOnglets() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky bottom-0 z-10 px-4 pt-2"
      style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
    >
      <div className="flex gap-1 rounded-full bg-surface p-1.5">
        {ONGLETS.map(({ href, libelle }) => {
          const actif =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={actif ? "page" : undefined}
              className={clsx(
                "flex min-h-11 flex-1 items-center justify-center rounded-full text-xs font-semibold",
                actif ? "bg-ink text-white" : "text-ink-2"
              )}
            >
              {libelle}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

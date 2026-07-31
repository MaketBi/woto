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
      className="sticky bottom-0 z-10 flex border-t border-line bg-surface pt-2"
      style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}
    >
      {ONGLETS.map(({ href, libelle }) => {
        const actif =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex min-h-11 flex-1 flex-col items-center justify-center gap-[5px]"
          >
            <span
              className={clsx(
                "h-0.5 w-[18px]",
                actif ? "bg-brand" : "bg-transparent"
              )}
            />
            <span
              className={clsx(
                "text-[11px] font-semibold",
                actif ? "text-brand" : "text-ink-3"
              )}
            >
              {libelle}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

import Link from "next/link";
import { clsx } from "clsx";

// CTA principal de la charte « Carte d'encre » : pilule encre + puce ronde citron.
// La puce porte un glyphe selon l'action : → pour avancer, + pour ajouter.

type Glyphe = "fleche" | "plus" | "aucun";

const GLYPHES: Record<Glyphe, string> = {
  fleche: "→",
  plus: "+",
  aucun: "",
};

function contenu(enfants: React.ReactNode, glyphe: Glyphe) {
  return (
    <>
      <span className="text-base font-bold">{enfants}</span>
      <span
        aria-hidden
        className="grid size-6 shrink-0 place-items-center rounded-full bg-lime text-[13px] font-bold text-ink"
      >
        {GLYPHES[glyphe]}
      </span>
    </>
  );
}

const BASE =
  "flex min-h-[58px] w-full items-center justify-center gap-2.5 rounded-full bg-ink px-5 text-white disabled:opacity-60";

export function BoutonPrimaire({
  children,
  glyphe = "fleche",
  className,
  ...props
}: React.ComponentProps<"button"> & { glyphe?: Glyphe }) {
  return (
    <button className={clsx(BASE, className)} {...props}>
      {contenu(children, glyphe)}
    </button>
  );
}

export function LienPrimaire({
  children,
  glyphe = "fleche",
  className,
  ...props
}: React.ComponentProps<typeof Link> & { glyphe?: Glyphe }) {
  return (
    <Link className={clsx(BASE, className)} {...props}>
      {contenu(children, glyphe)}
    </Link>
  );
}

// Bouton secondaire : pilule claire, sans bordure.
export function BoutonSecondaire({
  children,
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      className={clsx(
        "flex min-h-12 flex-1 items-center justify-center rounded-full bg-fill-soft px-4 text-[13px] font-semibold text-ink disabled:opacity-60",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

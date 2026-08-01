"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { fcfa } from "@/lib/format";
import type { MoisRentabilite } from "@/lib/data";

// Barres groupées 6 mois — encaissé vs dépenses, un seul axe vertical.
// Recharts reçoit des props JS, pas des classes : on lit les tokens de la charte
// au montage plutôt que de recopier les valeurs hexadécimales ici.

const TOKENS_PAR_DEFAUT = {
  ligne: "#e6e5df",
  ink2: "#7c7b76",
  ink3: "#a9a8a1",
  encaisse: "#16171c",
  depenses: "#d4f24d",
};

function useCouleursCharte() {
  const [couleurs, setCouleurs] = useState(TOKENS_PAR_DEFAUT);

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    const lire = (nom: string, repli: string) =>
      styles.getPropertyValue(nom).trim() || repli;
    setCouleurs({
      ligne: lire("--line", TOKENS_PAR_DEFAUT.ligne),
      ink2: lire("--ink-2", TOKENS_PAR_DEFAUT.ink2),
      ink3: lire("--ink-3", TOKENS_PAR_DEFAUT.ink3),
      encaisse: lire("--chart-1", TOKENS_PAR_DEFAUT.encaisse),
      depenses: lire("--chart-2", TOKENS_PAR_DEFAUT.depenses),
    });
  }, []);

  return couleurs;
}

export function GraphiqueRentabilite({
  mois,
  moisCourant,
}: {
  mois: MoisRentabilite[];
  moisCourant: string;
}) {
  const couleurs = useCouleursCharte();
  const donnees = mois.map((m) => {
    const nom = format(parseISO(`${m.mois}-01`), "MMM", { locale: fr });
    return {
      ...m,
      nom: nom.charAt(0).toUpperCase() + nom.slice(1).replace(".", ""),
      courant: m.mois === moisCourant,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={donnees} margin={{ top: 0, right: 0, bottom: 0, left: -12 }} barGap={3}>
        <XAxis
          dataKey="nom"
          axisLine={{ stroke: couleurs.ligne }}
          tickLine={false}
          tick={{ fontSize: 11, fill: couleurs.ink3, fontWeight: 500 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          width={44}
          tick={{ fontSize: 10.5, fill: couleurs.ink3 }}
          tickFormatter={(n: number) =>
            n === 0 ? "0" : `${Math.round(n / 1000)} k`
          }
        />
        <Tooltip
          formatter={(valeur) => fcfa(Number(valeur))}
          labelFormatter={(nom) => String(nom)}
          contentStyle={{
            borderRadius: 14,
            border: "none",
            boxShadow: "0 4px 16px rgba(22,23,28,.10)",
            fontSize: 13,
            fontFamily: "inherit",
          }}
          cursor={{ fill: "rgba(22,23,28,0.05)" }}
        />
        <Legend
          verticalAlign="top"
          align="left"
          height={30}
          iconType="square"
          iconSize={11}
          formatter={(valeur) => (
            <span style={{ fontSize: 12, color: couleurs.ink2, fontWeight: 500 }}>
              {valeur}
            </span>
          )}
        />
        <Bar
          dataKey="encaisse"
          name="Encaissé"
          fill={couleurs.encaisse}
          radius={[4, 4, 0, 0]}
          maxBarSize={14}
        />
        <Bar
          dataKey="depenses"
          name="Dépenses"
          fill={couleurs.depenses}
          radius={[4, 4, 0, 0]}
          maxBarSize={14}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

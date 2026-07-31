"use client";

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
// Couleurs validées daltonisme (charte) : encaissé #2a78d6, dépenses #eb6834.

export function GraphiqueRentabilite({
  mois,
  moisCourant,
}: {
  mois: MoisRentabilite[];
  moisCourant: string;
}) {
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
          axisLine={{ stroke: "#e6e5df" }}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#898781", fontWeight: 500 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          width={44}
          tick={{ fontSize: 10.5, fill: "#898781" }}
          tickFormatter={(n: number) =>
            n === 0 ? "0" : `${Math.round(n / 1000)} k`
          }
        />
        <Tooltip
          formatter={(valeur) => fcfa(Number(valeur))}
          labelFormatter={(nom) => String(nom)}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e6e5df",
            fontSize: 13,
            fontFamily: "inherit",
          }}
          cursor={{ fill: "rgba(11,11,11,0.04)" }}
        />
        <Legend
          verticalAlign="top"
          align="left"
          height={30}
          iconType="square"
          iconSize={11}
          formatter={(valeur) => (
            <span style={{ fontSize: 12, color: "#52514e", fontWeight: 500 }}>
              {valeur}
            </span>
          )}
        />
        <Bar
          dataKey="encaisse"
          name="Encaissé"
          fill="#2a78d6"
          radius={[3, 3, 0, 0]}
          maxBarSize={14}
        />
        <Bar
          dataKey="depenses"
          name="Dépenses"
          fill="#eb6834"
          radius={[3, 3, 0, 0]}
          maxBarSize={14}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

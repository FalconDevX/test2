import type { Financials } from "@/lib/types";
import { Panel } from "./ui";

interface FinancialSummaryProps {
  financials: Financials | null;
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "profit" | "cost" | "revenue" | "default";
}) {
  const accentColors = {
    profit: "text-profit",
    cost: "text-cost",
    revenue: "text-revenue",
    default: "text-foreground",
  };

  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-4">
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted">
        {label}
      </p>
      <p
        className={`font-mono text-xl font-semibold tabular-nums ${accentColors[accent ?? "default"]}`}
      >
        {value}
      </p>
    </div>
  );
}

export function FinancialSummary({ financials }: FinancialSummaryProps) {
  const fmt = (n: number | undefined) =>
    n !== undefined ? `${n.toLocaleString("pl-PL")} zł` : "—";

  return (
    <Panel title="Podsumowanie">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Przychód"
          value={fmt(financials?.totalRevenue)}
          accent="revenue"
        />
        <StatCard
          label="Zakup"
          value={fmt(financials?.totalPurchaseCost)}
          accent="cost"
        />
        <StatCard
          label="Transport"
          value={fmt(financials?.totalTransportCost)}
          accent="cost"
        />
        <StatCard
          label="Zysk"
          value={fmt(financials?.totalProfit)}
          accent="profit"
        />
      </div>
    </Panel>
  );
}

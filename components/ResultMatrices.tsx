import type { Supplier, Receiver, MatrixCell } from "@/lib/types";
import { Panel } from "./ui";

interface ResultMatricesProps {
  suppliers: Supplier[];
  receivers: Receiver[];
  transportMatrix: number[][];
  profitMatrix: MatrixCell[][];
  solutionMatrix: number[][];
}

interface MatrixTableProps {
  title: string;
  suppliers: Supplier[];
  receivers: Receiver[];
  matrix: MatrixCell[][];
  unit: string;
  highlightPositive?: boolean;
}

function MatrixTable({
  title,
  suppliers,
  receivers,
  matrix,
  unit,
  highlightPositive = false,
}: MatrixTableProps) {
  return (
    <div className="mb-6 last:mb-0">
      <h4 className="mb-3 text-xs font-medium text-muted">{title}</h4>
      <div className="scrollbar-thin overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-elevated">
              <th className="px-3 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted">
                Dostawca / Odbiorca
              </th>
              {receivers.map((r, j) => (
                <th
                  key={j}
                  className="px-2 py-2.5 text-center text-[10px] font-medium text-muted"
                >
                  {r.name}
                </th>
              ))}
              <th className="px-2 py-2.5 text-center text-[10px] font-medium text-muted">
                Podaż
              </th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <th className="px-3 py-2 text-left text-xs font-medium">
                  {s.name}
                </th>
                {receivers.map((_, j) => {
                  const value = matrix[i]?.[j] ?? 0;
                  const isPositive =
                    highlightPositive &&
                    typeof value === "number" &&
                    value > 0;
                  const isBlocked = value === "X";

                  return (
                    <td
                      key={j}
                      className={`px-2 py-2 text-center font-mono text-xs tabular-nums ${
                        isPositive
                          ? "bg-emerald-950/30 text-profit font-semibold"
                          : isBlocked
                            ? "text-muted"
                            : "text-foreground/80"
                      }`}
                    >
                      {isBlocked ? "X" : `${value} ${unit}`}
                    </td>
                  );
                })}
                <td className="px-2 py-2 text-center font-mono text-xs font-semibold tabular-nums">
                  {s.supply}
                </td>
              </tr>
            ))}
            <tr className="bg-surface-elevated/50">
              <th className="px-3 py-2 text-left text-xs font-medium text-muted">
                Popyt
              </th>
              {receivers.map((r, j) => (
                <td
                  key={j}
                  className="px-2 py-2 text-center font-mono text-xs font-semibold tabular-nums"
                >
                  {r.demand}
                </td>
              ))}
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ResultMatrices({
  suppliers,
  receivers,
  transportMatrix,
  profitMatrix,
  solutionMatrix,
}: ResultMatricesProps) {
  if (suppliers.length === 0) return null;

  return (
    <Panel title="Macierze wynikowe">
      <MatrixTable
        title="Macierz kosztów transportu k_ij"
        suppliers={suppliers}
        receivers={receivers}
        matrix={transportMatrix}
        unit="zł"
      />
      <MatrixTable
        title="Macierz zysków c_ij = sprzedaż − zakup − transport"
        suppliers={suppliers}
        receivers={receivers}
        matrix={profitMatrix}
        unit="zł"
      />
      <MatrixTable
        title="Macierz rozwiązania x_ij"
        suppliers={suppliers}
        receivers={receivers}
        matrix={solutionMatrix}
        unit="szt."
        highlightPositive
      />
    </Panel>
  );
}

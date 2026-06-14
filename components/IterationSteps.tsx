import type { ModiIteration, MatrixCell } from "@/lib/types";
import { Panel } from "./ui";
import { MatrixTable } from "./ResultMatrices";

interface IterationStepsProps {
  iterations: ModiIteration[];
}

function PotentialsRow({
  label,
  values,
  names,
}: {
  label: string;
  values: (number | null)[];
  names: string[];
}) {
  return (
    <div className="mb-4">
      <h5 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted">
        {label}
      </h5>
      <div className="flex flex-wrap gap-2">
        {values.map((value, i) => (
          <span
            key={i}
            className="rounded-md border border-border bg-surface-elevated px-2 py-1 font-mono text-xs tabular-nums"
          >
            {names[i]}: {value ?? "-"}
          </span>
        ))}
      </div>
    </div>
  );
}

export function IterationSteps({ iterations }: IterationStepsProps) {
  if (iterations.length === 0) return null;

  return (
    <Panel title={`Kroki rozwiązania (MODI) - ${iterations.length} kroków`}>
      <div className="space-y-8">
        {iterations.map((iteration, index) => {
          const supplierNames = iteration.suppliers.map((s) => s.name);
          const receiverNames = iteration.receivers.map((r) => r.name);
          const enterLabel =
            iteration.enteringCell &&
            `${iteration.suppliers[iteration.enteringCell.supplierIdx]?.name} → ${iteration.receivers[iteration.enteringCell.receiverIdx]?.name}`;

          return (
            <section
              key={`${iteration.step}-${index}`}
              className={`rounded-xl border p-4 ${
                iteration.isFinal
                  ? "border-emerald-900/50 bg-emerald-950/10"
                  : "border-border bg-surface-elevated/30"
              }`}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted">
                    Krok {index + 1} z {iterations.length}
                  </p>
                  <h3 className="text-sm font-semibold text-foreground">
                    {iteration.label}
                  </h3>
                  {iteration.financials && (
                    <p className="mt-1 text-xs text-muted">
                      Zysk:{" "}
                      <span className="font-mono font-semibold text-profit">
                        {iteration.financials.totalProfit} zł
                      </span>
                    </p>
                  )}
                </div>
                {iteration.isFinal && (
                  <span className="rounded-full border border-emerald-800/60 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-profit">
                    Optymalne
                  </span>
                )}
              </div>

              {(iteration.bestDelta != null ||
                iteration.shiftAmount != null ||
                enterLabel) && (
                <div className="mb-4 flex flex-wrap gap-3 text-xs text-muted">
                  {iteration.bestDelta != null && iteration.bestDelta > 0 && (
                    <span>
                      Najlepsze Δ:{" "}
                      <span className="font-mono text-foreground">
                        {iteration.bestDelta}
                      </span>
                    </span>
                  )}
                  {enterLabel && (
                    <span>
                      Komórka wchodząca:{" "}
                      <span className="font-mono text-foreground">{enterLabel}</span>
                    </span>
                  )}
                  {iteration.shiftAmount != null && (
                    <span>
                      Przesunięcie:{" "}
                      <span className="font-mono text-foreground">
                        {iteration.shiftAmount} szt.
                      </span>
                    </span>
                  )}
                </div>
              )}

              {iteration.alpha && (
                <PotentialsRow
                  label="Potencjały α (dostawcy)"
                  values={iteration.alpha}
                  names={supplierNames}
                />
              )}

              {iteration.beta && (
                <PotentialsRow
                  label="Potencjały β (odbiorcy)"
                  values={iteration.beta}
                  names={receiverNames}
                />
              )}

              {iteration.deltaMatrix && (
                <MatrixTable
                  title="Macierz wskaźników optymalności Δ_ij"
                  suppliers={iteration.suppliers}
                  receivers={iteration.receivers}
                  matrix={iteration.deltaMatrix as MatrixCell[][]}
                  unit="zł"
                />
              )}

              <MatrixTable
                title="Macierz rozwiązania x_ij"
                suppliers={iteration.suppliers}
                receivers={iteration.receivers}
                matrix={iteration.solutionMatrix}
                unit="szt."
                highlightPositive
              />
            </section>
          );
        })}
      </div>
    </Panel>
  );
}

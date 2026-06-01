"use client";

import type { SupplierInput, ReceiverInput } from "@/lib/types";
import { NumberInput, SectionTitle } from "./ui";

interface CostMatrixProps {
  suppliers: SupplierInput[];
  receivers: ReceiverInput[];
  transportCosts: number[][];
  blockedRoutes: [number, number][];
  onCostsChange: (costs: number[][]) => void;
  onBlockedChange: (routes: [number, number][]) => void;
  onRemoveSupplier?: (index: number) => void;
  onRemoveReceiver?: (index: number) => void;
}

function syncMatrixSize(
  costs: number[][],
  supplierCount: number,
  receiverCount: number
): number[][] {
  const next = costs.map((row) => [...row]);

  while (next.length < supplierCount) {
    next.push(new Array(receiverCount).fill(0));
  }
  while (next.length > supplierCount) {
    next.pop();
  }

  for (let i = 0; i < next.length; i++) {
    while (next[i].length < receiverCount) next[i].push(0);
    while (next[i].length > receiverCount) next[i].pop();
  }

  return next;
}

export function CostMatrix({
  suppliers,
  receivers,
  transportCosts,
  blockedRoutes,
  onCostsChange,
  onBlockedChange,
  onRemoveSupplier,
  onRemoveReceiver,
}: CostMatrixProps) {
  const costs = syncMatrixSize(
    transportCosts,
    suppliers.length,
    receivers.length
  );

  const isBlocked = (i: number, j: number) =>
    blockedRoutes.some((r) => r[0] === i && r[1] === j);

  const toggleBlocked = (i: number, j: number, checked: boolean) => {
    if (checked) {
      if (!isBlocked(i, j)) onBlockedChange([...blockedRoutes, [i, j]]);
    } else {
      onBlockedChange(blockedRoutes.filter((r) => !(r[0] === i && r[1] === j)));
    }
  };

  const updateCost = (i: number, j: number, value: number) => {
    const next = costs.map((row) => [...row]);
    next[i][j] = value;
    onCostsChange(next);
  };

  return (
    <div>
      <SectionTitle>Koszty transportu</SectionTitle>

      <div className="scrollbar-thin overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-elevated">
              <th className="px-3 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted">
                Dostawca / Odbiorca
              </th>
              {receivers.map((r, j) => (
                <th
                  key={j}
                  className="px-2 py-2.5 text-center text-[10px] font-medium uppercase tracking-wider text-muted"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className="truncate">{r.name}</span>
                    {onRemoveReceiver && (
                      <button
                        type="button"
                        onClick={() => onRemoveReceiver(j)}
                        className="shrink-0 rounded px-1 text-muted hover:text-cost cursor-pointer"
                        title="Usuń odbiorcę"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-2 py-2.5 text-center text-[10px] font-medium uppercase tracking-wider text-muted">
                Podaż
              </th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <th className="px-3 py-2 text-left text-xs font-medium text-foreground">
                  <div className="flex items-center gap-1">
                    <span className="truncate">{s.name}</span>
                    {onRemoveSupplier && (
                      <button
                        type="button"
                        onClick={() => onRemoveSupplier(i)}
                        className="shrink-0 rounded px-1 text-muted hover:text-cost cursor-pointer"
                        title="Usuń dostawcę"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </th>
                {receivers.map((_, j) => {
                  const blocked = isBlocked(i, j);
                  return (
                    <td
                      key={j}
                      className={`px-2 py-2 text-center transition-colors ${
                        blocked
                          ? "bg-red-950/60 ring-1 ring-inset ring-red-500/50"
                          : ""
                      }`}
                    >
                      <NumberInput
                        value={costs[i]?.[j] ?? 0}
                        disabled={blocked}
                        className="!w-14 !px-2 text-center font-mono text-xs disabled:opacity-50"
                        onChange={(v) => updateCost(i, j, v)}
                      />
                      <label
                        className={`mt-1.5 flex cursor-pointer items-center justify-center gap-1 text-[10px] ${
                          blocked ? "font-medium text-red-400" : "text-muted"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={blocked}
                          onChange={(e) =>
                            toggleBlocked(i, j, e.target.checked)
                          }
                          className="matrix-block-checkbox"
                        />
                        blok
                      </label>
                    </td>
                  );
                })}
                <td className="px-2 py-2 text-center font-mono text-xs font-semibold tabular-nums text-foreground">
                  {s.supply}
                </td>
              </tr>
            ))}
            <tr className="border-t border-border bg-surface-elevated/50">
              <th className="px-3 py-2 text-left text-xs font-medium text-muted">
                Popyt
              </th>
              {receivers.map((r, j) => (
                <td
                  key={j}
                  className="px-2 py-2 text-center font-mono text-xs font-semibold tabular-nums text-foreground"
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

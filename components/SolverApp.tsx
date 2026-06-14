"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SolveResult, SupplierInput, ReceiverInput } from "@/lib/types";
import {
  DEFAULT_SUPPLIERS,
  DEFAULT_RECEIVERS,
  DEFAULT_TRANSPORT_COSTS,
  DEFAULT_BLOCKED_ROUTES,
  DEFAULT_FORCED_RECEIVERS,
} from "@/lib/defaultData";
import type { ScenarioData } from "@/lib/dataIO";
import { SupplierForm } from "./SupplierForm";
import { ReceiverForm } from "./ReceiverForm";
import { CostMatrix } from "./CostMatrix";
import { FinancialSummary } from "./FinancialSummary";
import { NetworkGraph } from "./NetworkGraph";
import { IterationSteps } from "./IterationSteps";
import { ResultMatrices } from "./ResultMatrices";
import { DataToolbar } from "./DataToolbar";
import { Button, Panel } from "./ui";

function syncCostMatrix(
  costs: number[][],
  supplierCount: number,
  receiverCount: number
): number[][] {
  const next = costs.map((row) => [...row]);
  while (next.length < supplierCount) {
    next.push(new Array(receiverCount).fill(0));
  }
  while (next.length > supplierCount) next.pop();
  for (let i = 0; i < next.length; i++) {
    while (next[i].length < receiverCount) next[i].push(0);
    while (next[i].length > receiverCount) next[i].pop();
  }
  return next;
}

export function SolverApp() {
  const [suppliers, setSuppliers] = useState<SupplierInput[]>(DEFAULT_SUPPLIERS);
  const [receivers, setReceivers] = useState<ReceiverInput[]>(DEFAULT_RECEIVERS);
  const [transportCosts, setTransportCosts] = useState<number[][]>(
    DEFAULT_TRANSPORT_COSTS
  );
  const [blockedRoutes, setBlockedRoutes] = useState<[number, number][]>(
    DEFAULT_BLOCKED_ROUTES
  );
  const [forcedReceivers, setForcedReceivers] = useState<number[]>(
    DEFAULT_FORCED_RECEIVERS
  );
  const [result, setResult] = useState<SolveResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuppliersChange = (next: SupplierInput[]) => {
    if (next.length !== suppliers.length) {
      setTransportCosts((prev) =>
        syncCostMatrix(prev, next.length, receivers.length)
      );
      setBlockedRoutes([]);
    }
    setSuppliers(next);
  };

  const handleReceiversChange = (next: ReceiverInput[]) => {
    if (next.length !== receivers.length) {
      setTransportCosts((prev) =>
        syncCostMatrix(prev, suppliers.length, next.length)
      );
      setBlockedRoutes([]);
    }
    setReceivers(next);
  };

  const removeSupplier = (index: number) => {
    const nextSuppliers = suppliers.filter((_, i) => i !== index);
    setSuppliers(nextSuppliers);
    setTransportCosts((prev) =>
      syncCostMatrix(
        prev.filter((_, i) => i !== index),
        nextSuppliers.length,
        receivers.length
      )
    );
    setBlockedRoutes((prev) =>
      prev
        .filter(([i]) => i !== index)
        .map(([i, j]) => [i > index ? i - 1 : i, j] as [number, number])
    );
  };

  const removeReceiver = (index: number) => {
    const nextReceivers = receivers.filter((_, i) => i !== index);
    setReceivers(nextReceivers);
    setTransportCosts((prev) =>
      syncCostMatrix(
        prev.map((row) => row.filter((_, j) => j !== index)),
        suppliers.length,
        nextReceivers.length
      )
    );
    setBlockedRoutes((prev) =>
      prev
        .filter(([, j]) => j !== index)
        .map(([i, j]) => [i, j > index ? j - 1 : j] as [number, number])
    );
    setForcedReceivers((prev) =>
      prev
        .filter((id) => id !== index)
        .map((id) => (id > index ? id - 1 : id))
    );
  };

  const handleImport = (data: ScenarioData) => {
    setSuppliers(data.suppliers);
    setReceivers(data.receivers);
    setTransportCosts(
      syncCostMatrix(
        data.transportCosts,
        data.suppliers.length,
        data.receivers.length
      )
    );
    setBlockedRoutes(data.blockedRoutes);
    setForcedReceivers(data.forcedReceivers);
    void solve(data);
  };

  const initialSolveDone = useRef(false);

  const solve = useCallback(
    async (override?: ScenarioData) => {
      const payload = override ?? {
        suppliers,
        receivers,
        transportCosts,
        blockedRoutes,
        forcedReceivers,
      };

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/solve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Błąd rozwiązania");
        }

        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nieznany błąd");
      } finally {
        setLoading(false);
      }
    },
    [suppliers, receivers, transportCosts, blockedRoutes, forcedReceivers]
  );

  useEffect(() => {
    if (initialSolveDone.current) return;
    initialSolveDone.current = true;
    solve();
  }, [solve]);

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Pośrednik
            </h1>
            <p className="mt-0.5 text-xs text-muted">
              Optymalizacja transportu · metoda potencjałów (MODI)
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="rounded-full border border-border px-3 py-1 text-[10px] uppercase tracking-widest text-muted">
              Solver v2
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1800px] gap-6 px-6 py-8 lg:grid-cols-[560px_1fr]">
        <aside className="space-y-4">
          <Panel title="Dane wejściowe">
            <DataToolbar
              data={{
                suppliers,
                receivers,
                transportCosts,
                blockedRoutes,
                forcedReceivers,
              }}
              onImport={handleImport}
            />

            <div className="mt-5 space-y-6">
              <SupplierForm suppliers={suppliers} onChange={handleSuppliersChange} />
              <div className="h-px bg-border" />
              <ReceiverForm
                receivers={receivers}
                forcedReceivers={forcedReceivers}
                onChange={handleReceiversChange}
                onForcedChange={setForcedReceivers}
              />
              <div className="h-px bg-border" />
              <CostMatrix
                suppliers={suppliers}
                receivers={receivers}
                transportCosts={transportCosts}
                blockedRoutes={blockedRoutes}
                onCostsChange={setTransportCosts}
                onBlockedChange={setBlockedRoutes}
                onRemoveSupplier={removeSupplier}
                onRemoveReceiver={removeReceiver}
              />
            </div>

            <Button
              variant="primary"
              className="mt-6 w-full py-3 text-sm"
              onClick={() => solve()}
              disabled={loading}
            >
              {loading ? "Obliczanie…" : "Rozwiąż zagadnienie"}
            </Button>

            {error && (
              <p className="mt-3 rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2 text-xs text-cost">
                {error}
              </p>
            )}
          </Panel>

          <FinancialSummary financials={result?.financials ?? null} />
        </aside>

        <div className="space-y-6">
          <NetworkGraph
            nodesData={result?.nodesData ?? []}
            edgesData={result?.edgesData ?? []}
          />

          {result && (
            <>
              <IterationSteps iterations={result.iterations ?? []} />
              <ResultMatrices
                suppliers={result.suppliers}
                receivers={result.receivers}
                transportMatrix={result.transportMatrix}
                profitMatrix={result.profitMatrix}
                solutionMatrix={result.solutionMatrix}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}

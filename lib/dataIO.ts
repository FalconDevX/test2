import type { SupplierInput, ReceiverInput } from "./types";

export interface ScenarioData {
  suppliers: SupplierInput[];
  receivers: ReceiverInput[];
  transportCosts: number[][];
  blockedRoutes: [number, number][];
  forcedReceivers: number[];
}

function isEmptyCell(value: unknown): boolean {
  return value === "" || value === null || value === undefined;
}

function parseNumberCell(value: unknown): number {
  if (isEmptyCell(value)) return 0;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeEntityList<T extends { name: string }>(
  items: unknown,
  mapItem: (item: Record<string, unknown>, index: number) => T
): T[] {
  if (!Array.isArray(items)) {
    throw new Error("Nieprawidłowy format pliku JSON.");
  }

  return items.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error("Nieprawidłowy format pliku JSON.");
    }
    return mapItem(item as Record<string, unknown>, index);
  });
}

export function parseImportedScenario(raw: unknown): ScenarioData {
  if (!raw || typeof raw !== "object") {
    throw new Error("Nieprawidłowy format pliku JSON.");
  }

  const parsed = raw as Record<string, unknown>;

  const suppliers = normalizeEntityList(parsed.suppliers, (item) => ({
    name: String(item.name ?? ""),
    supply: parseNumberCell(item.supply),
    buyPrice: parseNumberCell(item.buyPrice),
  }));

  const receivers = normalizeEntityList(parsed.receivers, (item) => ({
    name: String(item.name ?? ""),
    demand: parseNumberCell(item.demand),
    sellPrice: parseNumberCell(item.sellPrice),
  }));

  if (!Array.isArray(parsed.transportCosts)) {
    throw new Error("Nieprawidłowy format pliku JSON.");
  }

  const rawCosts = parsed.transportCosts as unknown[][];
  const blockedRoutes: [number, number][] = [];
  const transportCosts: number[][] = [];

  for (let i = 0; i < suppliers.length; i++) {
    transportCosts[i] = [];
    for (let j = 0; j < receivers.length; j++) {
      const cell = rawCosts[i]?.[j];
      if (isEmptyCell(cell)) {
        transportCosts[i][j] = 0;
        blockedRoutes.push([i, j]);
      } else {
        transportCosts[i][j] = parseNumberCell(cell);
      }
    }
  }

  if (Array.isArray(parsed.blockedRoutes)) {
    for (const route of parsed.blockedRoutes) {
      if (!Array.isArray(route) || route.length < 2) continue;
      const supplierIdx = Number(route[0]);
      const receiverIdx = Number(route[1]);
      if (
        Number.isInteger(supplierIdx) &&
        Number.isInteger(receiverIdx) &&
        supplierIdx >= 0 &&
        receiverIdx >= 0 &&
        supplierIdx < suppliers.length &&
        receiverIdx < receivers.length &&
        !blockedRoutes.some(
          (r) => r[0] === supplierIdx && r[1] === receiverIdx
        )
      ) {
        blockedRoutes.push([supplierIdx, receiverIdx]);
      }
    }
  }

  return {
    suppliers,
    receivers,
    transportCosts,
    blockedRoutes,
    forcedReceivers: Array.isArray(parsed.forcedReceivers)
      ? parsed.forcedReceivers.map((id) => Number(id)).filter((id) => Number.isInteger(id))
      : [],
  };
}

export function buildExportPayload(data: ScenarioData) {
  return {
    suppliers: data.suppliers,
    receivers: data.receivers,
    transportCosts: data.transportCosts,
    blockedRoutes: data.blockedRoutes,
    forcedReceivers: data.forcedReceivers,
  };
}

export function downloadJson(data: ScenarioData, filename = "posrednik-dane.json") {
  const blob = new Blob([JSON.stringify(buildExportPayload(data), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

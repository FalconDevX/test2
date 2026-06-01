import type { Supplier, Receiver, Route, Financials } from "./types";

function getCycleCells(cells: { r: number; c: number }[], M: number, N: number) {
  let candidates = [...cells];
  let trimmed = true;
  while (trimmed) {
    trimmed = false;
    const rowCounts = Array(M).fill(0);
    const colCounts = Array(N).fill(0);
    for (const cell of candidates) {
      rowCounts[cell.r]++;
      colCounts[cell.c]++;
    }
    const nextCandidates = [];
    for (const cell of candidates) {
      if (rowCounts[cell.r] > 1 && colCounts[cell.c] > 1) {
        nextCandidates.push(cell);
      } else {
        trimmed = true;
      }
    }
    candidates = nextCandidates;
  }
  return candidates;
}

function hasCycle(cells: { r: number; c: number }[], M: number, N: number) {
  return getCycleCells(cells, M, N).length > 0;
}

function orderCycle(
  cycleCells: { r: number; c: number }[],
  startR: number,
  startC: number
) {
  const cycle: { r: number; c: number }[] = [];
  let curr = cycleCells.find((c) => c.r === startR && c.c === startC)!;
  let isRowSearch = true;
  let remaining = [...cycleCells];

  while (remaining.length > 0) {
    cycle.push(curr);
    remaining = remaining.filter((c) => !(c.r === curr.r && c.c === curr.c));
    if (remaining.length === 0) break;

    const next = remaining.find((c) =>
      isRowSearch ? c.r === curr.r : c.c === curr.c
    );
    curr = next!;
    isRowSearch = !isRowSearch;
  }
  return cycle;
}

function solveIntermediary(
  suppliers: Supplier[],
  receivers: Receiver[],
  transportCosts: number[][],
  blockedRoutes: [number, number][] = [],
  forcedReceivers: number[] = []
): {
  suppliers: Supplier[];
  receivers: Receiver[];
  activeRoutes: Route[];
  financials: Financials;
} {
  const workSuppliers: Supplier[] = suppliers.map((s) => ({ ...s }));
  const workReceivers: Receiver[] = receivers.map((r) => ({ ...r }));

  const realSupply = workSuppliers.reduce((sum, s) => sum + s.supply, 0);
  const realDemand = workReceivers.reduce((sum, r) => sum + r.demand, 0);

  const dummySupplierIdx = workSuppliers.length;
  workSuppliers.push({
    id: dummySupplierIdx,
    name: "Dostawca FIKCYJNY",
    supply: realDemand,
    buyPrice: 0,
    isDummy: true,
  });

  const dummyReceiverIdx = workReceivers.length;
  workReceivers.push({
    id: dummyReceiverIdx,
    name: "Odbiorca FIKCYJNY",
    demand: realSupply,
    sellPrice: 0,
    isDummy: true,
  });

  const workCosts = transportCosts.map((row) => [...row, 0]);
  workCosts.push(new Array(workReceivers.length).fill(0));

  const M = workSuppliers.length;
  const N = workReceivers.length;

  const isBlocked = (i: number, j: number) => {
    if (workSuppliers[i].isDummy || workReceivers[j].isDummy) return false;
    return blockedRoutes.some(
      (r) => r[0] === workSuppliers[i].id && r[1] === workReceivers[j].id
    );
  };

  const forcedIds = new Set(forcedReceivers);

  const profit = Array(M)
    .fill(0)
    .map(() => Array(N).fill(0));
  const possibleRoutes: { r: number; c: number; p: number }[] = [];

  for (let r = 0; r < M; r++) {
    for (let c = 0; c < N; c++) {
      if (isBlocked(r, c)) {
        profit[r][c] = -999999;
      } else if (
        workSuppliers[r].isDummy &&
        forcedIds.has(workReceivers[c].id)
      ) {
        profit[r][c] = -999999;
      } else if (workSuppliers[r].isDummy || workReceivers[c].isDummy) {
        profit[r][c] = 0;
      } else {
        profit[r][c] =
          workReceivers[c].sellPrice -
          workSuppliers[r].buyPrice -
          (workCosts[r][c] ?? 0);
      }
      possibleRoutes.push({ r, c, p: profit[r][c] });
    }
  }

  possibleRoutes.sort((a, b) => b.p - a.p);
  const allocations = Array(M)
    .fill(0)
    .map(() => Array(N).fill(0));
  let basicCells: { r: number; c: number }[] = [];

  const currentSupply = workSuppliers.map((s) => s.supply);
  const currentDemand = workReceivers.map((r) => r.demand);

  for (const route of possibleRoutes) {
    const { r, c } = route;
    if (currentSupply[r] > 0 && currentDemand[c] > 0) {
      const amount = Math.min(currentSupply[r], currentDemand[c]);
      allocations[r][c] += amount;
      basicCells.push({ r, c });
      currentSupply[r] -= amount;
      currentDemand[c] -= amount;
    }
  }

  for (let r = 0; r < M && basicCells.length < M + N - 1; r++) {
    for (let c = 0; c < N && basicCells.length < M + N - 1; c++) {
      if (!basicCells.some((b) => b.r === r && b.c === c)) {
        if (!hasCycle([...basicCells, { r, c }], M, N)) {
          basicCells.push({ r, c });
        }
      }
    }
  }

  const MAX_ITER = 1000;
  for (let iter = 0; iter < MAX_ITER; iter++) {
    const u = Array(M).fill(null) as (number | null)[];
    const v = Array(N).fill(null) as (number | null)[];
    u[0] = 0;

    let changed = true;
    while (changed) {
      changed = false;
      for (const b of basicCells) {
        if (u[b.r] !== null && v[b.c] === null) {
          v[b.c] = profit[b.r][b.c] - u[b.r]!;
          changed = true;
        } else if (v[b.c] !== null && u[b.r] === null) {
          u[b.r] = profit[b.r][b.c] - v[b.c]!;
          changed = true;
        }
      }
    }

    let bestDelta = 0;
    let enterR = -1;
    let enterC = -1;

    for (let r = 0; r < M; r++) {
      for (let c = 0; c < N; c++) {
        if (!basicCells.some((b) => b.r === r && b.c === c)) {
          const ui = u[r] ?? 0;
          const vj = v[c] ?? 0;
          const delta = profit[r][c] - ui - vj;
          if (delta > bestDelta) {
            bestDelta = delta;
            enterR = r;
            enterC = c;
          }
        }
      }
    }

    if (bestDelta <= 1e-9) break;

    const cycleCells = getCycleCells(
      [...basicCells, { r: enterR, c: enterC }],
      M,
      N
    );
    const cycle = orderCycle(cycleCells, enterR, enterC);

    let minAmount = Infinity;
    let leavingCell: { r: number; c: number } | null = null;

    for (let i = 1; i < cycle.length; i += 2) {
      const amt = allocations[cycle[i].r][cycle[i].c];
      if (amt < minAmount) {
        minAmount = amt;
        leavingCell = cycle[i];
      }
    }

    if (!leavingCell || minAmount === Infinity) break;

    for (let i = 0; i < cycle.length; i++) {
      if (i % 2 === 0) allocations[cycle[i].r][cycle[i].c] += minAmount;
      else allocations[cycle[i].r][cycle[i].c] -= minAmount;
    }

    basicCells.push({ r: enterR, c: enterC });
    basicCells = basicCells.filter(
      (b) => !(b.r === leavingCell!.r && b.c === leavingCell!.c)
    );
  }

  let activeRoutes: Route[] = [];
  for (let r = 0; r < M; r++) {
    for (let c = 0; c < N; c++) {
      if (allocations[r][c] > 0) {
        activeRoutes.push({
          supplierIdx: r,
          receiverIdx: c,
          amount: allocations[r][c],
        });
      }
    }
  }

  let totalPurchaseCost = 0;
  let totalTransportCost = 0;
  let totalRevenue = 0;

  for (const route of activeRoutes) {
    const s = workSuppliers[route.supplierIdx];
    const r = workReceivers[route.receiverIdx];
    const amount = route.amount;

    if (!s.isDummy && !r.isDummy) {
      totalPurchaseCost += amount * s.buyPrice;
      totalTransportCost +=
        amount * (workCosts[route.supplierIdx]?.[route.receiverIdx] ?? 0);
      totalRevenue += amount * r.sellPrice;
    }
  }
  const totalProfit = totalRevenue - totalPurchaseCost - totalTransportCost;

  const finalSuppliers = workSuppliers.filter((s) => !s.isDummy || s.supply > 0);
  const finalReceivers = workReceivers.filter((r) => !r.isDummy || r.demand > 0);

  const supplierIdMap = new Map<number, number>();
  finalSuppliers.forEach((s, newIdx) => {
    supplierIdMap.set(s.id, newIdx);
    s.id = newIdx;
  });

  const receiverIdMap = new Map<number, number>();
  finalReceivers.forEach((r, newIdx) => {
    receiverIdMap.set(r.id, newIdx);
    r.id = newIdx;
  });

  const finalRoutes = activeRoutes
    .map((r) => ({
      ...r,
      supplierIdx: supplierIdMap.get(r.supplierIdx)!,
      receiverIdx: receiverIdMap.get(r.receiverIdx)!,
    }))
    .filter((r) => r.amount > 0);

  return {
    suppliers: finalSuppliers,
    receivers: finalReceivers,
    activeRoutes: finalRoutes,
    financials: {
      totalPurchaseCost,
      totalTransportCost,
      totalRevenue,
      totalProfit,
    },
  };
}

export { solveIntermediary };

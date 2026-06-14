import type {
  Supplier,
  Receiver,
  Route,
  Financials,
  ModiIteration,
  MatrixCell,
} from "./types";

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

function cloneMatrix(matrix: number[][]): number[][] {
  return matrix.map((row) => [...row]);
}

function computeFinancials(
  allocations: number[][],
  workSuppliers: Supplier[],
  workReceivers: Receiver[],
  workCosts: number[][]
): Financials {
  let totalPurchaseCost = 0;
  let totalTransportCost = 0;
  let totalRevenue = 0;

  for (let r = 0; r < allocations.length; r++) {
    for (let c = 0; c < allocations[r].length; c++) {
      const amount = allocations[r][c];
      if (amount <= 0) continue;

      const s = workSuppliers[r];
      const receiver = workReceivers[c];
      if (s.isDummy || receiver.isDummy) continue;

      totalPurchaseCost += amount * s.buyPrice;
      totalTransportCost += amount * (workCosts[r]?.[c] ?? 0);
      totalRevenue += amount * receiver.sellPrice;
    }
  }

  return {
    totalPurchaseCost,
    totalTransportCost,
    totalRevenue,
    totalProfit: totalRevenue - totalPurchaseCost - totalTransportCost,
  };
}

function buildDeltaMatrix(
  profit: number[][],
  u: (number | null)[],
  v: (number | null)[],
  basicCells: { r: number; c: number }[],
  isBlocked: (r: number, c: number) => boolean
): MatrixCell[][] {
  const M = profit.length;
  const N = profit[0]?.length ?? 0;
  const delta: MatrixCell[][] = [];

  for (let r = 0; r < M; r++) {
    delta[r] = [];
    for (let c = 0; c < N; c++) {
      if (isBlocked(r, c)) {
        delta[r][c] = "X";
      } else if (basicCells.some((b) => b.r === r && b.c === c)) {
        delta[r][c] = 0;
      } else {
        const ui = u[r] ?? 0;
        const vj = v[c] ?? 0;
        delta[r][c] = profit[r][c] - ui - vj;
      }
    }
  }

  return delta;
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
  iterations: ModiIteration[];
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
    }
  }
  const allocations = Array(M)
    .fill(0)
    .map(() => Array(N).fill(0));
  let basicCells: { r: number; c: number }[] = [];

  const currentSupply = workSuppliers.map((s) => s.supply);
  const currentDemand = workReceivers.map((r) => r.demand);

  const addBasicCell = (r: number, c: number) => {
    if (!basicCells.some((b) => b.r === r && b.c === c)) {
      basicCells.push({ r, c });
    }
  };

  const allocateInitial = (r: number, c: number) => {
    if (isBlocked(r, c)) return;
    if (currentSupply[r] <= 0 || currentDemand[c] <= 0) return;

    const amount = Math.min(currentSupply[r], currentDemand[c]);
    allocations[r][c] += amount;
    addBasicCell(r, c);
    currentSupply[r] -= amount;
    currentDemand[c] -= amount;
  };

  const receiversWithBlocks: number[] = [];
  for (let c = 0; c < N; c++) {
    if (workReceivers[c].isDummy) continue;
    for (let r = 0; r < M; r++) {
      if (workSuppliers[r].isDummy) continue;
      if (isBlocked(r, c)) {
        receiversWithBlocks.push(c);
        break;
      }
    }
  }

  for (const c of receiversWithBlocks) {
    for (let r = 0; r < M; r++) {
      if (workSuppliers[r].isDummy) continue;
      allocateInitial(r, c);
    }
  }

  let nwI = 0;
  let nwJ = 0;
  while (nwI < M && nwJ < N) {
    if (currentSupply[nwI] <= 0) {
      nwI++;
      continue;
    }
    if (currentDemand[nwJ] <= 0) {
      nwJ++;
      continue;
    }
    if (isBlocked(nwI, nwJ)) {
      nwJ++;
      continue;
    }

    allocateInitial(nwI, nwJ);

    if (currentSupply[nwI] <= 0) nwI++;
    if (currentDemand[nwJ] <= 0) nwJ++;
  }

  for (let c = 0; c < N; c++) {
    if (!workReceivers[c].isDummy && currentDemand[c] > 0) {
      allocateInitial(dummySupplierIdx, c);
    }
  }

  for (let r = 0; r < M; r++) {
    if (!workSuppliers[r].isDummy && currentSupply[r] > 0) {
      allocateInitial(r, dummyReceiverIdx);
    }
  }

  allocateInitial(dummySupplierIdx, dummyReceiverIdx);

  for (let r = 0; r < M && basicCells.length < M + N - 1; r++) {
    for (let c = 0; c < N && basicCells.length < M + N - 1; c++) {
      if (isBlocked(r, c)) continue;
      if (!basicCells.some((b) => b.r === r && b.c === c)) {
        if (!hasCycle([...basicCells, { r, c }], M, N)) {
          basicCells.push({ r, c });
        }
      }
    }
  }

  const iterations: ModiIteration[] = [];
  const academicSuppliers = workSuppliers.map((s) => ({ ...s }));
  const academicReceivers = workReceivers.map((r) => ({ ...r }));

  const pushIteration = (
    step: number,
    label: string,
    extra: Partial<ModiIteration> = {}
  ) => {
    iterations.push({
      step,
      label,
      suppliers: academicSuppliers.map((s) => ({ ...s })),
      receivers: academicReceivers.map((r) => ({ ...r })),
      solutionMatrix: cloneMatrix(allocations),
      ...extra,
    });
  };

  pushIteration(0, "Rozwiązanie początkowe (metoda NW)", {
    financials: computeFinancials(
      allocations,
      workSuppliers,
      workReceivers,
      workCosts
    ),
  });

  let modiRound = 0;
  let stepCounter = 1;
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
        if (isBlocked(r, c)) continue;
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

    modiRound++;
    pushIteration(
      stepCounter++,
      `Iteracja ${modiRound} - obliczenie α, β i wskaźników Δ`,
      {
        alpha: [...u],
        beta: [...v],
        deltaMatrix: buildDeltaMatrix(profit, u, v, basicCells, isBlocked),
        bestDelta,
        enteringCell:
          bestDelta > 1e-9
            ? { supplierIdx: enterR, receiverIdx: enterC }
            : null,
        financials: computeFinancials(
          allocations,
          workSuppliers,
          workReceivers,
          workCosts
        ),
      }
    );

    if (bestDelta <= 1e-9) {
      const last = iterations[iterations.length - 1];
      last.isFinal = true;
      last.label = `Iteracja ${modiRound} - optymalność (brak dodatniego Δ)`;
      break;
    }

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

    pushIteration(
      stepCounter++,
      `Iteracja ${modiRound} - macierz po przesunięciu (θ = ${minAmount})`,
      {
        bestDelta,
        enteringCell: { supplierIdx: enterR, receiverIdx: enterC },
        shiftAmount: minAmount,
        financials: computeFinancials(
          allocations,
          workSuppliers,
          workReceivers,
          workCosts
        ),
      }
    );
  }

  if (iterations.length > 0 && !iterations[iterations.length - 1].isFinal) {
    const last = iterations[iterations.length - 1];
    last.isFinal = true;
    last.label = `Wynik końcowy - ${last.label}`;
    last.financials = computeFinancials(
      allocations,
      workSuppliers,
      workReceivers,
      workCosts
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
    iterations,
  };
}

export { solveIntermediary };

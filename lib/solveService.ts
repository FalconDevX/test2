import type {
  Supplier,
  Receiver,
  Route,
  SolveInput,
  SolveResult,
  VisNode,
  VisEdge,
  MatrixCell,
} from "./types";
import { solveIntermediary } from "./posrednik_algo";

function buildMatrixData(
  result: {
    suppliers: Supplier[];
    receivers: Receiver[];
    activeRoutes: Route[];
  },
  transportCosts: number[][],
  blockedRoutes: [number, number][]
) {
  const { suppliers, receivers } = result;
  const transportMatrix: number[][] = [];
  const profitMatrix: MatrixCell[][] = [];
  const solutionMatrix: number[][] = [];

  const isBlocked = (i: number, j: number) =>
    blockedRoutes.some((route) => route[0] === i && route[1] === j);

  for (let i = 0; i < suppliers.length; i++) {
    transportMatrix[i] = [];
    profitMatrix[i] = [];
    solutionMatrix[i] = [];

    for (let j = 0; j < receivers.length; j++) {
      const transportCost = transportCosts[i]?.[j] ?? 0;
      transportMatrix[i][j] = transportCost;

      if (isBlocked(i, j)) {
        profitMatrix[i][j] = "X";
      } else if (suppliers[i].isDummy || receivers[j].isDummy) {
        profitMatrix[i][j] = 0;
      } else {
        profitMatrix[i][j] =
          receivers[j].sellPrice - suppliers[i].buyPrice - transportCost;
      }

      solutionMatrix[i][j] = 0;
    }
  }

  for (const route of result.activeRoutes) {
    solutionMatrix[route.supplierIdx][route.receiverIdx] = route.amount;
  }

  return { transportMatrix, profitMatrix, solutionMatrix };
}

function buildGraphData(result: {
  suppliers: Supplier[];
  receivers: Receiver[];
  activeRoutes: Route[];
}): { nodesData: VisNode[]; edgesData: VisEdge[] } {
  const visNodes: VisNode[] = [];
  const visEdges: VisEdge[] = [];

  const realSuppliers = result.suppliers.filter((s) => !s.isDummy);
  const realReceivers = result.receivers.filter((r) => !r.isDummy);

  realSuppliers.forEach((s, idx) => {
    visNodes.push({
      id: "S" + s.id,
      label: `${s.name}\nPodaż: ${s.supply}\nZakup: ${s.buyPrice} zł`,
      x: 0,
      y: (idx - realSuppliers.length / 2) * 130,
      shape: "box",
      color: { background: "#1a1a1a", border: "#404040" },
      font: { face: "monospace", size: 13, color: "#e5e5e5" },
    });
  });

  realReceivers.forEach((r, idx) => {
    visNodes.push({
      id: "R" + r.id,
      label: `${r.name}\nPopyt: ${r.demand}\nSprzedaż: ${r.sellPrice} zł`,
      x: 600,
      y: (idx - realReceivers.length / 2) * 130,
      shape: "box",
      color: { background: "#141414", border: "#525252" },
      font: { face: "monospace", size: 13, color: "#e5e5e5" },
    });
  });

  result.activeRoutes.forEach((route) => {
    const supplier = result.suppliers[route.supplierIdx];
    const receiver = result.receivers[route.receiverIdx];

    if (supplier.isDummy || receiver.isDummy) return;

    visEdges.push({
      from: "S" + supplier.id,
      to: "R" + receiver.id,
      label: `${route.amount} szt.`,
      font: {
        align: "middle",
        background: "#0a0a0a",
        strokeWidth: 2,
        strokeColor: "#0a0a0a",
        color: "#a3a3a3",
      },
      arrows: "to",
      color: { color: "#737373", highlight: "#e5e5e5" },
      width: 2,
      smooth: false,
    });
  });

  return { nodesData: visNodes, edgesData: visEdges };
}

export function solveProblem(input: SolveInput): SolveResult {
  const suppliers: Supplier[] = input.suppliers.map((s, index) => ({
    id: index,
    name: s.name,
    supply: Number(s.supply),
    buyPrice: Number(s.buyPrice),
    isDummy: false,
  }));

  const receivers: Receiver[] = input.receivers.map((r, index) => ({
    id: index,
    name: r.name,
    demand: Number(r.demand),
    sellPrice: Number(r.sellPrice),
    isDummy: false,
  }));

  const transportCosts = input.transportCosts.map((row) =>
    row.map((value) => Number(value))
  );

  const blockedRoutes = input.blockedRoutes || [];

  const result = solveIntermediary(
    suppliers,
    receivers,
    transportCosts,
    blockedRoutes,
    input.forcedReceivers ?? []
  );

  const graphData = buildGraphData(result);
  const matrixData = buildMatrixData(result, transportCosts, blockedRoutes);

  return {
    ...result,
    ...graphData,
    ...matrixData,
    iterations: result.iterations,
  };
}

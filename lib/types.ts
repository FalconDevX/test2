export interface SupplierInput {
  name: string;
  supply: number;
  buyPrice: number;
}

export interface ReceiverInput {
  name: string;
  demand: number;
  sellPrice: number;
}

export interface Supplier extends SupplierInput {
  id: number;
  isDummy: boolean;
}

export interface Receiver extends ReceiverInput {
  id: number;
  isDummy: boolean;
}

export interface Route {
  supplierIdx: number;
  receiverIdx: number;
  amount: number;
}

export interface Financials {
  totalPurchaseCost: number;
  totalTransportCost: number;
  totalRevenue: number;
  totalProfit: number;
}

export interface SolveInput {
  suppliers: SupplierInput[];
  receivers: ReceiverInput[];
  transportCosts: number[][];
  blockedRoutes: [number, number][];
  forcedReceivers?: number[];
}

export interface VisNode {
  id: string;
  label: string;
  x: number;
  y: number;
  shape: string;
  color: { background: string; border: string };
  font: { face: string; size: number; color?: string };
}

export interface VisEdge {
  from: string;
  to: string;
  label: string;
  font: {
    align: string;
    background: string;
    strokeWidth: number;
    strokeColor: string;
    color?: string;
  };
  arrows: string;
  color: { color: string; highlight: string };
  width: number;
  smooth: boolean;
}

export type MatrixCell = number | string;

export interface SolveResult {
  suppliers: Supplier[];
  receivers: Receiver[];
  activeRoutes: Route[];
  financials: Financials;
  nodesData: VisNode[];
  edgesData: VisEdge[];
  transportMatrix: number[][];
  profitMatrix: MatrixCell[][];
  solutionMatrix: number[][];
}

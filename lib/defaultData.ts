import type { SupplierInput, ReceiverInput } from "./types";

export const DEFAULT_SUPPLIERS: SupplierInput[] = [
  { name: "Hurtownia Alfa", supply: 20, buyPrice: 10 },
  { name: "Hurtownia Beta", supply: 30, buyPrice: 12 },
];

export const DEFAULT_RECEIVERS: ReceiverInput[] = [
  { name: "Sklep Wwa", demand: 10, sellPrice: 30 },
  { name: "Sklep Krk", demand: 28, sellPrice: 25 },
  { name: "Sklep Poz", demand: 27, sellPrice: 30 },
];

export const DEFAULT_TRANSPORT_COSTS: number[][] = [
  [8, 14, 17],
  [12, 9, 19],
];

export const DEFAULT_BLOCKED_ROUTES: [number, number][] = [];

export const DEFAULT_FORCED_RECEIVERS: number[] = [];

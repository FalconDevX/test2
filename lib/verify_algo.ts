import { solveIntermediary } from "./posrednik_algo";
import {
  DEFAULT_SUPPLIERS,
  DEFAULT_RECEIVERS,
  DEFAULT_TRANSPORT_COSTS,
  DEFAULT_BLOCKED_ROUTES,
} from "./defaultData";
import type { Supplier, Receiver } from "./types";

function mkSuppliers(
  data: { name: string; supply: number; buyPrice: number }[]
): Supplier[] {
  return data.map((s, id) => ({ ...s, id, isDummy: false }));
}

function mkReceivers(
  data: { name: string; demand: number; sellPrice: number }[]
): Receiver[] {
  return data.map((r, id) => ({ ...r, id, isDummy: false }));
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function verifyInvariants(
  result: ReturnType<typeof solveIntermediary>,
  blockedRoutes: [number, number][]
) {
  for (const route of result.activeRoutes) {
    const s = result.suppliers[route.supplierIdx];
    const r = result.receivers[route.receiverIdx];
    if (s.isDummy || r.isDummy) continue;

    assert(route.amount > 0, "Trasa ma zerową ilość");
    const blocked = blockedRoutes.some(
      (b) => b[0] === s.id && b[1] === r.id
    );
    assert(!blocked, `Przydzielono zablokowaną trasę S${s.id}->R${r.id}`);
  }
}

function verifyFinancials(result: ReturnType<typeof solveIntermediary>) {
  let purchase = 0;
  let revenue = 0;
  let transport = 0;

  for (const route of result.activeRoutes) {
    const s = result.suppliers[route.supplierIdx];
    const r = result.receivers[route.receiverIdx];
    if (s.isDummy || r.isDummy) continue;
    purchase += route.amount * s.buyPrice;
    revenue += route.amount * r.sellPrice;
  }

  assert(
    result.financials.totalPurchaseCost === purchase,
    "Błędny koszt zakupu"
  );
  assert(result.financials.totalRevenue === revenue, "Błędny przychód");
  assert(
    result.financials.totalProfit ===
      result.financials.totalRevenue -
        result.financials.totalPurchaseCost -
        result.financials.totalTransportCost,
    "Błędny zysk"
  );

  void transport;
}

const tests: { name: string; run: () => void }[] = [
  {
    name: "Domyślne dane bez blokad",
    run: () => {
      const result = solveIntermediary(
        mkSuppliers(DEFAULT_SUPPLIERS),
        mkReceivers(DEFAULT_RECEIVERS),
        DEFAULT_TRANSPORT_COSTS,
        []
      );
      verifyInvariants(result, []);
      verifyFinancials(result);
      assert(result.financials.totalProfit > 0, "Zysk powinien być dodatni");
    },
  },
  {
    name: "Domyślne dane z blokadami",
    run: () => {
      const result = solveIntermediary(
        mkSuppliers(DEFAULT_SUPPLIERS),
        mkReceivers(DEFAULT_RECEIVERS),
        DEFAULT_TRANSPORT_COSTS,
        DEFAULT_BLOCKED_ROUTES
      );
      verifyInvariants(result, DEFAULT_BLOCKED_ROUTES);
      verifyFinancials(result);
    },
  },
  {
    name: "Bilans: nadmiar podaży",
    run: () => {
      const result = solveIntermediary(
        mkSuppliers([{ name: "S1", supply: 100, buyPrice: 10 }]),
        mkReceivers([{ name: "R1", demand: 60, sellPrice: 30 }]),
        [[5]],
        []
      );
      verifyInvariants(result, []);
      assert(result.receivers.some((r) => r.isDummy), "Brak fikcyjnego odbiorcy");
    },
  },
  {
    name: "Wymuszony odbiorca dostaje towar mimo niskiego zysku",
    run: () => {
      const suppliers = mkSuppliers([
        { name: "S0", supply: 100, buyPrice: 10 },
      ]);
      const receivers = mkReceivers([
        { name: "R0", demand: 50, sellPrice: 11 },
      ]);
      const result = solveIntermediary(suppliers, receivers, [[5]], [], [0]);
      verifyInvariants(result, []);
      const allocated = result.activeRoutes
        .filter((r) => !result.receivers[r.receiverIdx].isDummy)
        .reduce((sum, r) => sum + r.amount, 0);
      assert(allocated === 50, "Wymuszony odbiorca powinien dostać pełny popyt");
    },
  },
  {
    name: "Faza 1 preferuje trasy o wyższym zysku",
    run: () => {
      const suppliers = mkSuppliers([
        { name: "S0", supply: 50, buyPrice: 10 },
        { name: "S1", supply: 50, buyPrice: 20 },
      ]);
      const receivers = mkReceivers([
        { name: "R0", demand: 50, sellPrice: 40 },
      ]);
      const result = solveIntermediary(
        suppliers,
        receivers,
        [[2], [2]],
        []
      );
      const route = result.activeRoutes.find(
        (r) => result.suppliers[r.supplierIdx].id === 0
      );
      assert(!!route && route.amount === 50, "Powinien wybrać tańszego dostawcę S0");
    },
  },
  {
    name: "Domyślne dane — zgodność z Excel (Pośrednik.xlsx)",
    run: () => {
      const result = solveIntermediary(
        mkSuppliers(DEFAULT_SUPPLIERS),
        mkReceivers(DEFAULT_RECEIVERS),
        DEFAULT_TRANSPORT_COSTS,
        []
      );

      const matrix = Array.from({ length: result.suppliers.length }, () =>
        Array(result.receivers.length).fill(0)
      );
      for (const route of result.activeRoutes) {
        matrix[route.supplierIdx][route.receiverIdx] = route.amount;
      }

      const alfaIdx = result.suppliers.findIndex((s) => s.name.includes("Alfa"));
      const betaIdx = result.suppliers.findIndex((s) => s.name.includes("Beta"));
      const wwaIdx = result.receivers.findIndex((r) => r.name.includes("Wwa"));
      const krkIdx = result.receivers.findIndex((r) => r.name.includes("Krk"));
      const pozIdx = result.receivers.findIndex((r) => r.name.includes("Poz"));

      assert(matrix[alfaIdx][wwaIdx] === 10, "Alfa powinna dostarczać 10 do Wwa");
      assert(matrix[alfaIdx][krkIdx] === 0, "Alfa nie powinna dostarczać do Krk");
      assert(matrix[alfaIdx][pozIdx] === 10, "Alfa powinna dostarczać 10 do Poz");
      assert(matrix[betaIdx][krkIdx] === 28, "Beta powinna dostarczać 28 do Krk");
      assert(matrix[betaIdx][pozIdx] === 0, "Beta nie powinna dostarczać do Poz");
      const hfIdx = result.suppliers.findIndex((s) => s.isDummy && s.name.includes("Dostawca"));
      const ofIdx = result.receivers.findIndex((r) => r.isDummy && r.name.includes("Odbiorca"));
      if (hfIdx >= 0) {
        assert(
          result.suppliers[hfIdx].supply === 65,
          "Dostawca fikcyjny powinien mieć akademicką podaż 65"
        );
        assert(matrix[hfIdx][pozIdx] === 17, "Dostawca fikcyjny powinien dostarczyć 17 do Poz");
      }
      if (ofIdx >= 0) {
        assert(
          result.receivers[ofIdx].demand === 50,
          "Odbiorca fikcyjny powinien mieć akademicki popyt 50"
        );
        assert(matrix[betaIdx][ofIdx] === 2, "Beta powinna wysłać 2 szt. do odbiorcy fikcyjnego");
        if (hfIdx >= 0) {
          assert(
            matrix[hfIdx][ofIdx] === 48,
            "Dostawca fikcyjny powinien wysłać 48 szt. do odbiorcy fikcyjnego"
          );
        }
      }
      const pozColSum = result.activeRoutes
        .filter((r) => r.receiverIdx === pozIdx)
        .reduce((sum, r) => sum + r.amount, 0);
      assert(pozColSum === 27, "Kolumna Poz powinna sumować się do 27");
      assert(
        result.financials.totalProfit === 262,
        `Zysk powinien wynosić 262 (Excel), jest ${result.financials.totalProfit}`
      );
      assert(
        result.financials.totalRevenue === 1300,
        "Przychód powinien wynosić 1300"
      );
      assert(
        result.financials.totalTransportCost === 502,
        "Koszt transportu powinien wynosić 502"
      );
      assert(
        result.financials.totalPurchaseCost === 536,
        "Koszt zakupu powinien wynosić 536"
      );
    },
  },
];

let passed = 0;
for (const test of tests) {
  test.run();
  passed++;
  console.log(`✓ ${test.name}`);
}

console.log(`\n${passed}/${tests.length} testów OK`);

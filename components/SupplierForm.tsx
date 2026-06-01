"use client";

import type { SupplierInput } from "@/lib/types";
import { Button, Input, NumberInput, SectionTitle } from "./ui";

interface SupplierFormProps {
  suppliers: SupplierInput[];
  onChange: (suppliers: SupplierInput[]) => void;
}

export function SupplierForm({ suppliers, onChange }: SupplierFormProps) {
  const update = (index: number, field: keyof SupplierInput, value: string | number) => {
    const next = suppliers.map((s, i) =>
      i === index
        ? {
            ...s,
            [field]: field === "name" ? value : value,
          }
        : s
    );
    onChange(next);
  };

  const add = () => {
    onChange([
      ...suppliers,
      { name: `Dostawca ${suppliers.length + 1}`, supply: 0, buyPrice: 0 },
    ]);
  };

  const remove = (index: number) => {
    onChange(suppliers.filter((_, i) => i !== index));
  };

  return (
    <div>
      <SectionTitle>Dostawcy</SectionTitle>

      <div className="mb-2 grid grid-cols-[1fr_64px_72px_32px] gap-2 px-0.5 text-[10px] uppercase tracking-wider text-muted">
        <span>Nazwa</span>
        <span>Podaż</span>
        <span>Zakup</span>
        <span />
      </div>

      <div className="space-y-2">
        {suppliers.map((supplier, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_64px_72px_32px] gap-2"
          >
            <Input
              value={supplier.name}
              onChange={(v) => update(index, "name", v)}
            />
            <NumberInput
              value={supplier.supply}
              onChange={(v) => update(index, "supply", v)}
            />
            <NumberInput
              value={supplier.buyPrice}
              onChange={(v) => update(index, "buyPrice", v)}
            />
            <Button
              variant="danger"
              className="!px-0 !py-0 h-full min-h-[38px] text-lg leading-none"
              onClick={() => remove(index)}
            >
              ×
            </Button>
          </div>
        ))}
      </div>

      <Button variant="ghost" className="mt-3 w-full text-xs" onClick={add}>
        + Dodaj dostawcę
      </Button>
    </div>
  );
}

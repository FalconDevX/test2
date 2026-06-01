"use client";

import type { ReceiverInput } from "@/lib/types";
import { Button, Input, NumberInput, SectionTitle } from "./ui";

interface ReceiverFormProps {
  receivers: ReceiverInput[];
  forcedReceivers: number[];
  onChange: (receivers: ReceiverInput[]) => void;
  onForcedChange: (forcedReceivers: number[]) => void;
}

export function ReceiverForm({
  receivers,
  forcedReceivers,
  onChange,
  onForcedChange,
}: ReceiverFormProps) {
  const update = (index: number, field: keyof ReceiverInput, value: string | number) => {
    const next = receivers.map((r, i) =>
      i === index
        ? {
            ...r,
            [field]: value,
          }
        : r
    );
    onChange(next);
  };

  const toggleForced = (index: number, checked: boolean) => {
    if (checked) {
      if (!forcedReceivers.includes(index)) {
        onForcedChange([...forcedReceivers, index]);
      }
    } else {
      onForcedChange(forcedReceivers.filter((id) => id !== index));
    }
  };

  const add = () => {
    onChange([
      ...receivers,
      { name: `Odbiorca ${receivers.length + 1}`, demand: 0, sellPrice: 0 },
    ]);
  };

  const remove = (index: number) => {
    onChange(receivers.filter((_, i) => i !== index));
    onForcedChange(
      forcedReceivers
        .filter((id) => id !== index)
        .map((id) => (id > index ? id - 1 : id))
    );
  };

  return (
    <div>
      <SectionTitle>Odbiorcy</SectionTitle>

      <div className="mb-2 grid grid-cols-[1fr_64px_72px_36px_32px] gap-2 px-0.5 text-[10px] uppercase tracking-wider text-muted">
        <span>Nazwa</span>
        <span>Popyt</span>
        <span>Sprzedaż</span>
        <span className="text-center">Wym.</span>
        <span />
      </div>

      <div className="space-y-2">
        {receivers.map((receiver, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_64px_72px_36px_32px] gap-2"
          >
            <Input
              value={receiver.name}
              onChange={(v) => update(index, "name", v)}
            />
            <NumberInput
              value={receiver.demand}
              onChange={(v) => update(index, "demand", v)}
            />
            <NumberInput
              value={receiver.sellPrice}
              onChange={(v) => update(index, "sellPrice", v)}
            />
            <label className="flex cursor-pointer items-center justify-center">
              <input
                type="checkbox"
                checked={forcedReceivers.includes(index)}
                onChange={(e) => toggleForced(index, e.target.checked)}
                className="matrix-block-checkbox"
                title="Wymuszona realizacja umowy"
              />
            </label>
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
        + Dodaj odbiorcę
      </Button>
    </div>
  );
}

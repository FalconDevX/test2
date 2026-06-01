"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

interface PanelProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, children, className = "" }: PanelProps) {
  return (
    <section
      className={`rounded-xl border border-border bg-surface p-5 ${className}`}
    >
      {title && (
        <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-muted">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

interface SectionTitleProps {
  children: ReactNode;
}

export function SectionTitle({ children }: SectionTitleProps) {
  return (
    <h3 className="mb-3 text-sm font-medium text-foreground">{children}</h3>
  );
}

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}

const buttonVariants = {
  primary:
    "bg-accent text-bg hover:bg-foreground/90 disabled:opacity-40",
  secondary:
    "border border-border bg-surface-elevated text-foreground hover:border-border-hover hover:bg-[#1a1a1a]",
  danger:
    "border border-border bg-transparent text-muted hover:border-red-900/50 hover:text-cost",
  ghost:
    "text-muted hover:text-foreground",
};

export function Button({
  children,
  onClick,
  variant = "secondary",
  className = "",
  type = "button",
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed ${buttonVariants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

interface InputProps {
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "number";
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  className = "",
  disabled = false,
}: InputProps) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted/50 outline-none transition-colors focus:border-border-hover focus:ring-1 focus:ring-border-hover disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    />
  );
}

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}

export function NumberInput({
  value,
  onChange,
  className = "",
  disabled = false,
}: NumberInputProps) {
  const [text, setText] = useState(String(value));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) {
      setText(String(value));
    }
  }, [value]);

  const inputClassName = `w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-border-hover focus:ring-1 focus:ring-border-hover disabled:cursor-not-allowed disabled:opacity-40 ${className}`;

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      disabled={disabled}
      onFocus={(e) => {
        focusedRef.current = true;
        e.target.select();
      }}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "" || /^-?\d*\.?\d*$/.test(raw)) {
          setText(raw);
        }
      }}
      onBlur={() => {
        focusedRef.current = false;
        const parsed = text.trim() === "" ? 0 : Number(text);
        const next = Number.isFinite(parsed) ? parsed : value;
        onChange(next);
        setText(String(next));
      }}
      className={inputClassName}
    />
  );
}

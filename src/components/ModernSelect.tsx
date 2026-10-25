"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  dotColor?: string;
}

export function ModernSelect({
  value,
  onChange,
  options,
  className = "",
  align = "left",
  size = "md",
}: {
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[];
  className?: string;
  align?: "left" | "right";
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`w-full bg-white hover:bg-slate-50/90 active:scale-[0.98] border border-slate-200/90 rounded-xl text-left shadow-sm flex items-center justify-between gap-2.5 transition-all select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-1 ${
          size === "sm" ? "px-2.5 py-1.5 text-xs min-h-[36px]" : "px-3 py-2 text-xs min-h-[40px]"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selected?.dotColor && (
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${selected.dotColor}`}
            />
          )}
          <span className="font-semibold text-slate-700 truncate">
            {selected?.label}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180 text-[#9F1D22]" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className={`absolute top-full mt-1.5 min-w-[200px] w-full bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl ring-1 ring-slate-900/5 p-1.5 z-50 space-y-0.5 max-h-60 overflow-y-auto no-scrollbar overscroll-contain ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-xs transition-all active:scale-[0.98] select-none ${
                  isSelected
                    ? "bg-rose-50/90 text-[#9F1D22] font-semibold"
                    : "text-slate-700 hover:bg-slate-100/80 active:bg-slate-200/70"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {opt.dotColor && (
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${opt.dotColor}`}
                    />
                  )}
                  <div className="truncate">
                    <span className="block truncate">{opt.label}</span>
                    {opt.sublabel && (
                      <span
                        className={`block text-[10px] font-mono ${
                          isSelected ? "text-rose-700/75" : "text-slate-400"
                        }`}
                      >
                        {opt.sublabel}
                      </span>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-[#9F1D22] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const STATUS_OPTIONS: SelectOption[] = [
  {
    value: "BELUM_DIKERJAKAN",
    label: "Belum Dikerjakan",
    dotColor: "bg-slate-400",
  },
  {
    value: "SEDANG_DIKERJAKAN",
    label: "Sedang Dikerjakan",
    dotColor: "bg-amber-500",
  },
  {
    value: "OVERDUE",
    label: "Overdue",
    dotColor: "bg-rose-600",
  },
  {
    value: "SELESAI",
    label: "Selesai",
    dotColor: "bg-emerald-500",
  },
];

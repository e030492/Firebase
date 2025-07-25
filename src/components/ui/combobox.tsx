"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface ComboboxProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyPlaceholder?: string;
  disabled?: boolean;
}

export function Combobox({ 
    options, 
    value, 
    onChange, 
    placeholder="Seleccione una opción...",
    searchPlaceholder="Buscar opción...",
    emptyPlaceholder="No se encontró ninguna opción.",
    disabled = false
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value || "");

  React.useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return options;
    return options.filter(option =>
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [inputValue, options]);

  const handleSelect = (optionValue: string) => {
    const newValue = optionValue === value ? "" : optionValue;
    onChange(newValue);
    setInputValue(newValue);
    setOpen(false);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputValue(text);
    onChange(text); // Update form state in real-time
    if (!open) {
      setOpen(true);
    }
  }

  const handleBlur = () => {
    setOpen(false);
    // The value is already up-to-date due to handleInputChange
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
            <Input
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => setOpen(true)}
                onBlur={handleBlur}
                placeholder={placeholder}
                disabled={disabled}
                className="pr-8"
            />
            <ChevronsUpDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 shrink-0 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ minWidth: "var(--radix-popover-trigger-width)" }}>
        {open && filteredOptions.length > 0 && (
          <ul className="max-h-60 overflow-auto py-1">
            {filteredOptions.map((option) => (
              <li
                key={option.value}
                onMouseDown={(e) => { // Use onMouseDown to prevent onBlur from firing first
                    e.preventDefault();
                    handleSelect(option.value);
                }}
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
              >
                <span className="truncate">{option.label}</span>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}

"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

const multiSelectVariants = cva(
  "flex w-full items-center justify-between min-h-[40px] h-auto transition-colors focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "rounded-md border border-slate-200 bg-white",
        ghost: "rounded-lg border-0 bg-transparent shadow-none",
        outline: "rounded-lg border border-slate-200 bg-transparent shadow-none",
        elevated: "rounded-lg border border-slate-200 bg-white shadow-md",
        primary: "rounded-lg border border-indigo-200 bg-white shadow-sm ring-1 ring-indigo-100",
        kanban: "rounded-xl border bg-card text-card-foreground shadow",
        error: "rounded-md border border-red-300 bg-white shadow-sm focus:ring-red-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps
  extends VariantProps<typeof multiSelectVariants> {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  maxDisplay?: number;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  maxDisplay = 2,
  variant,
  className,
  disabled,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedLabels = value.map(
    (v) => options.find((o) => o.value === v)?.label || v
  );

  const handleSelect = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const handleRemove = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== item));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            multiSelectVariants({ variant }),
            value.length > 0 && "pr-8",
            className
          )}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 items-center">
            {value.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {selectedLabels.slice(0, maxDisplay).map((label, i) => (
                  <Badge
                    key={value[i]}
                    variant="secondary"
                    className="mr-1"
                  >
                    {label}
                    <span
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                      onClick={(e) => handleRemove(e, value[i])}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </span>
                  </Badge>
                ))}
                {value.length > maxDisplay && (
                  <Badge variant="secondary">
                    +{value.length - maxDisplay} more
                  </Badge>
                )}
              </>
            )}
          </div>
          <div className="flex items-center">
            {value.length > 0 && (
              <span
                className="mr-2 text-muted-foreground hover:text-foreground"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

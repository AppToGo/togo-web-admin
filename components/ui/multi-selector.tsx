"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export interface MultiSelectorOption {
  value: string;
  label: string;
  badge?: React.ReactNode;
}

export interface MultiSelectorProps {
  options: MultiSelectorOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  allLabel?: string;
  className?: string;
  disabled?: boolean;
  showSelectAll?: boolean;
  showFooter?: boolean;
  clearAllLabel?: string;
  selectAllLabel?: string;
  icon?: React.ReactNode;
  maxDisplay?: number;
}

export function MultiSelector({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  allLabel = "All",
  className,
  disabled,
  showSelectAll = true,
  showFooter = true,
  clearAllLabel = "Clear",
  selectAllLabel = "Select All",
  icon,
  maxDisplay = 1,
}: MultiSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const allValues = React.useMemo(() => options.map((o) => o.value), [options]);
  const isAllSelected = value.length === options.length && options.length > 0;

  const selectedOptions = React.useMemo(
    () => options.filter((o) => value.includes(o.value)),
    [options, value]
  );

  const handleToggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleToggleAll = () => {
    if (isAllSelected) {
      onChange([]);
    } else {
      onChange(allValues);
    }
  };

  const handleSelectAll = () => {
    onChange(allValues);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const displayText = React.useMemo(() => {
    if (value.length === 0) return placeholder;
    if (isAllSelected) return allLabel;
    if (value.length === 1) return selectedOptions[0]?.label;
    return `${value.length} selected`;
  }, [value.length, isAllSelected, selectedOptions, allLabel, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-10 px-3 justify-between gap-2 min-w-[180px]",
            "bg-white hover:bg-slate-50 border-slate-200",
            "text-slate-700 font-normal",
            className
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {icon && <span className="shrink-0 text-slate-400">{icon}</span>}
            <span className="truncate text-sm">
              {value.length === 0 ? (
                <span className="text-slate-400">{placeholder}</span>
              ) : (
                displayText
              )}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {value.length > 1 && !isAllSelected && (
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[10px] font-medium"
              >
                {value.length}
              </Badge>
            )}
            <ChevronsUpDown className="w-4 h-4 text-slate-400" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[280px] p-0 z-50"
        align="start"
        sideOffset={4}
      >
        <Command className="rounded-lg border-0">
          <CommandInput
            placeholder={searchPlaceholder}
            className="h-10 border-b border-slate-100"
          />
          <CommandList className="max-h-[300px] overflow-auto">
            <CommandEmpty className="py-3 text-sm text-slate-500 text-center">
              {emptyMessage}
            </CommandEmpty>
            <CommandGroup className="p-1">
              {/* Select All option */}
              {showSelectAll && options.length > 0 && (
                <>
                  <CommandItem
                    onSelect={handleToggleAll}
                    className="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-slate-100 aria-selected:bg-slate-100"
                  >
                    <div className="flex items-center justify-center w-4 h-4 rounded border border-slate-300 bg-white shrink-0">
                      {isAllSelected && (
                        <Check className="w-3 h-3 text-indigo-600" />
                      )}
                    </div>
                    <span className="flex-1 text-sm font-medium text-slate-700">
                      {allLabel}
                    </span>
                    <Badge variant="outline" className="text-[10px] h-5">
                      {options.length}
                    </Badge>
                  </CommandItem>
                  <div className="my-1 border-t border-slate-100" />
                </>
              )}

              {/* Individual options */}
              {options.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleToggleOption(option.value)}
                    className="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-slate-100 aria-selected:bg-slate-100"
                  >
                    <div className="flex items-center justify-center w-4 h-4 rounded border border-slate-300 bg-white shrink-0">
                      {isSelected && (
                        <Check className="w-3 h-3 text-indigo-600" />
                      )}
                    </div>
                    <span className="flex-1 text-sm text-slate-700 truncate">
                      {option.label}
                    </span>
                    {option.badge}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>

          {/* Footer actions */}
          {showFooter && (
            <div className="flex items-center justify-between px-2 py-2 border-t border-slate-100 bg-slate-50/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-7 px-2 text-xs text-slate-500 hover:text-slate-700"
                disabled={value.length === 0}
              >
                <X className="w-3 h-3 mr-1" />
                {clearAllLabel}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-7 px-2 text-xs text-indigo-600 hover:text-indigo-700"
                disabled={isAllSelected}
              >
                <Check className="w-3 h-3 mr-1" />
                {selectAllLabel}
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

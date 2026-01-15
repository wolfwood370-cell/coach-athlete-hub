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

export interface MultiSelectOption {
  value: string;
  label: string;
  group?: string;
}

export interface GroupedOptions {
  group: string;
  options: MultiSelectOption[];
}

interface MultiSelectProps {
  options: MultiSelectOption[] | GroupedOptions[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  maxDisplayed?: number;
  className?: string;
}

function isGroupedOptions(
  options: MultiSelectOption[] | GroupedOptions[]
): options is GroupedOptions[] {
  return options.length > 0 && "group" in options[0];
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  emptyMessage = "No items found.",
  maxDisplayed = 3,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  // Normalize options to a flat list for lookup
  const flatOptions = React.useMemo(() => {
    if (isGroupedOptions(options)) {
      return options.flatMap((g) => g.options);
    }
    return options;
  }, [options]);

  const selectedLabels = React.useMemo(() => {
    return selected
      .map((val) => flatOptions.find((opt) => opt.value === val)?.label)
      .filter(Boolean) as string[];
  }, [selected, flatOptions]);

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  const renderOptions = () => {
    if (isGroupedOptions(options)) {
      return options.map((group) => (
        <CommandGroup key={group.group} heading={group.group}>
          {group.options.map((option) => (
            <CommandItem
              key={option.value}
              value={option.value}
              onSelect={() => handleSelect(option.value)}
              className="cursor-pointer"
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  selected.includes(option.value) ? "opacity-100" : "opacity-0"
                )}
              />
              {option.label}
            </CommandItem>
          ))}
        </CommandGroup>
      ));
    }

    return (
      <CommandGroup>
        {options.map((option) => (
          <CommandItem
            key={option.value}
            value={option.value}
            onSelect={() => handleSelect(option.value)}
            className="cursor-pointer"
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                selected.includes(option.value) ? "opacity-100" : "opacity-0"
              )}
            />
            {option.label}
          </CommandItem>
        ))}
      </CommandGroup>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between min-h-10 h-auto", className)}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selected.length === 0 && (
              <span className="text-muted-foreground font-normal">
                {placeholder}
              </span>
            )}
            {selectedLabels.slice(0, maxDisplayed).map((label, idx) => (
              <Badge
                key={selected[idx]}
                variant="secondary"
                className="text-xs px-1.5 py-0 h-5"
              >
                {label}
                <button
                  type="button"
                  className="ml-1 hover:text-destructive"
                  onClick={(e) => handleRemove(selected[idx], e)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {selected.length > maxDisplayed && (
              <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                +{selected.length - maxDisplayed}
              </Badge>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            {renderOptions()}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

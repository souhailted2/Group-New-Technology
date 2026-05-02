import { useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Popover, PopoverContent } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const PopoverAnchor = PopoverPrimitive.Anchor;

interface Option {
  id: number | string;
  name: string;
}

interface SearchComboboxProps {
  selectedId: string;
  onSelect: (id: string, name: string) => void;
  options: Option[];
  placeholder?: string;
  inputTestId?: string;
  optionTestIdPrefix?: string;
  className?: string;
}

export function SearchCombobox({
  selectedId,
  onSelect,
  options,
  placeholder = "اكتب للبحث...",
  inputTestId,
  optionTestIdPrefix,
  className,
}: SearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState("");

  const selectedOption = options.find((o) => String(o.id) === selectedId);
  const displayValue = selectedId ? (selectedOption?.name ?? "") : inputText;

  const filtered = options.filter(
    (o) =>
      !inputText.trim() ||
      o.name.toLowerCase().includes(inputText.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className={cn("relative", className)}>
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          <Input
            data-testid={inputTestId}
            placeholder={placeholder}
            value={displayValue}
            onChange={(e) => {
              setInputText(e.target.value);
              if (selectedId) onSelect("", "");
              if (!open) setOpen(true);
            }}
            onFocus={() => {
              if (selectedId && selectedOption) setInputText(selectedOption.name);
              setOpen(true);
            }}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            className="pr-9"
            autoComplete="off"
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="p-0"
        style={{ width: "var(--radix-popover-trigger-width)" }}
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            {filtered.length === 0 ? (
              <CommandEmpty>لا توجد نتائج</CommandEmpty>
            ) : (
              <CommandGroup>
                {filtered.map((o) => (
                  <CommandItem
                    key={o.id}
                    value={String(o.name)}
                    data-testid={
                      optionTestIdPrefix
                        ? `${optionTestIdPrefix}-${o.id}`
                        : undefined
                    }
                    onSelect={() => {
                      onSelect(String(o.id), o.name);
                      setInputText(o.name);
                      setOpen(false);
                    }}
                  >
                    {o.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
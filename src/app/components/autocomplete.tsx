"use client";

import {
  CommandGroup,
  CommandItem,
  CommandList,
  CommandInput,
} from "@ui/command";
import { Command as CommandPrimitive } from "cmdk";
import {
  useState,
  useRef,
  useCallback,
  type KeyboardEvent,
  useMemo,
} from "react";

import { Skeleton } from "@ui/skeleton";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/client";

const useAutocomplete = (input: string) =>
  useQuery({
    enabled: !!input,
    queryKey: ["autocomplete", input],
    queryFn: async () => {
      const res = await client.maps.autocomplete.$get({ input });
      return await res.json();
    },
  });

type Option = {
  value: string;
  label: string;
};

type AutoCompleteProps = {
  disabled?: boolean;
  placeholder?: string;
};

export const AutoComplete = ({ placeholder, disabled }: AutoCompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setOpen] = useState(false);
  const [focus, setFocus] = useState(false);

  const [search, setSearch] = useState<string>("");
  const [selected, setSelected] = useState<Option>();

  const { data, isLoading } = useAutocomplete(search);

  const options = useMemo(() => data ?? [], [data]);

  const emptyMessage = "No results found";
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (!input) {
        return;
      }

      // Keep the options displayed when the user is typing
      if (!isOpen) {
        setOpen(true);
      }

      // This is not a default behaviour of the <input /> field
      if (event.key === "Enter" && input.value !== "") {
        const optionToSelect = options.find(
          (option) => option.label === input.value
        );
        if (optionToSelect) {
          setSelected(optionToSelect);
        }
      }

      if (event.key === "Escape") {
        input.blur();
      }
    },
    [isOpen, options]
  );

  const handleBlur = useCallback(() => {
    setOpen(false);
    setFocus(false);

    if (selected) setSearch(selected.label);
  }, [selected]);

  const handleFocus = useCallback(() => {
    setOpen(true);
    setFocus(true);
  }, []);

  const handleSelectOption = useCallback((selectedOption: Option) => {
    setSelected(selectedOption);

    // This is a hack to prevent the input from being focused after the user selects an option
    // We can call this hack: "The next tick"
    setTimeout(() => {
      inputRef?.current?.blur();
    }, 0);
  }, []);

  return (
    <CommandPrimitive onKeyDown={handleKeyDown} className="">
      <div>
        <CommandInput
          ref={inputRef}
          value={focus ? search : selected?.label ?? search}
          onValueChange={(s) => setSearch(s)}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="text-base"
        />
      </div>
      <div className="relative mt-1">
        <div
          className={cn(
            "animate-in fade-in-0 zoom-in-95 absolute top-0 z-10 w-full rounded-xl bg-white outline-none",
            isOpen ? "block" : "hidden"
          )}
        >
          <CommandList className="rounded-lg ring-1 ring-slate-200">
            {isLoading ? (
              <CommandPrimitive.Loading>
                <div className="p-1">
                  <Skeleton className="h-8 w-full">
                    <p>Loading...</p>
                  </Skeleton>
                </div>
              </CommandPrimitive.Loading>
            ) : null}
            {options.length > 0 && !isLoading ? (
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selected?.value === option.value;
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onSelect={() => handleSelectOption(option)}
                      className={cn(
                        "flex w-full items-center gap-2",
                        !isSelected ? "pl-8" : null
                      )}
                    >
                      {isSelected ? <Check className="w-4" /> : null}
                      {option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ) : null}
            {!isLoading ? (
              <CommandPrimitive.Empty className="select-none rounded-sm px-2 py-3 text-center text-sm">
                {emptyMessage}
              </CommandPrimitive.Empty>
            ) : null}
          </CommandList>
        </div>
      </div>
    </CommandPrimitive>
  );
};

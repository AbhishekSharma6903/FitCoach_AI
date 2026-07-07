"use client";

/**
 * SearchCommand — Generic debounced search with keyboard navigation.
 *
 * Works with the shadcn/base-ui Popover (no PopoverAnchor needed).
 * The input acts as the trigger; results show in a Popover below it.
 */

import * as React from "react";
import { Search, Loader2 } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

export interface SearchResultItem {
  id: string | number;
  primary: string;
  secondary?: string;
  badge?: string;
  badgeColor?: string;   // Tailwind text color class
  rightLabel?: string;
  indicator?: string;    // Tailwind bg color class for dot (shown when no thumbnail)
  thumbnail?: string;    // Phase 6: exercise image URL (replaces indicator dot)
}

interface SearchCommandProps<T> {
  placeholder?: string;
  /** Pre-fills the search input and triggers search on mount (for Quick Add) */
  initialQuery?: string;
  onSearch: (query: string) => Promise<T[]>;
  renderItem: (item: T) => SearchResultItem;
  onSelect: (item: T) => void;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

export default function SearchCommand<T>({
  placeholder = "Search…",
  initialQuery = "",
  onSearch,
  renderItem,
  onSelect,
  emptyText = "No results found.",
  className,
  disabled = false,
}: SearchCommandProps<T>) {
  const [query, setQuery] = React.useState(initialQuery);

  // When initialQuery changes (modal reopened with new food name), update the query
  React.useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
  }, [initialQuery]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<T[]>([]);

  const debouncedQuery = useDebounce(query, 300);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on click outside
  React.useEffect(() => {
    function handler(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  React.useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    onSearch(debouncedQuery)
      .then((r) => { if (!cancelled) { setResults(r); setOpen(r.length > 0); } })
      .catch(() => { if (!cancelled) { setResults([]); setOpen(false); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery, onSearch]);

  function handleSelect(item: T) {
    onSelect(item);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Input */}
      <div className="relative">
        {loading ? (
          <Loader2
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin pointer-events-none"
          />
        ) : (
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        )}
        <input
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-label={placeholder}
          autoComplete="off"
          disabled={disabled}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") { setOpen(false); setQuery(""); }
          }}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-foreground",
            "pl-9 pr-4 py-2.5 text-sm placeholder:text-muted-foreground",
            "outline-none focus:border-primary focus:ring-1 focus:ring-primary/30",
            "transition-colors disabled:opacity-50",
          )}
        />
      </div>

      {/* Dropdown — absolutely positioned below input */}
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-lg overflow-hidden">
          <Command shouldFilter={false}>
            <CommandList className="max-h-64 overflow-y-auto">
              <CommandGroup>
                {results.map((item) => {
                  const r = renderItem(item);
                  return (
                    <CommandItem
                      key={r.id}
                      value={String(r.id)}
                      onSelect={() => handleSelect(item)}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer data-[selected=true]:bg-[#222222] rounded-lg mx-1 my-0.5"
                    >
                      {/* Phase 6: thumbnail image when available, else colour dot */}
                      {r.thumbnail ? (
                        <img
                          src={r.thumbnail}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          className="w-7 h-7 rounded-lg object-cover shrink-0"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : r.indicator ? (
                        <span className={cn("w-2 h-2 rounded-full shrink-0", r.indicator)} />
                      ) : null}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-foreground truncate">
                            {r.primary}
                          </span>
                          {r.badge && (
                            <span className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 shrink-0",
                              r.badgeColor ?? "text-primary",
                            )}>
                              {r.badge}
                            </span>
                          )}
                        </div>
                        {r.secondary && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {r.secondary}
                          </p>
                        )}
                      </div>
                      {r.rightLabel && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {r.rightLabel}
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

type FilterOption = {
  value: string;
  label: string;
};

type Props = {
  scopeId: string;
  placeholder: string;
  selectLabel?: string;
  selectDataKey?: string;
  selectOptions?: FilterOption[];
  sortLabel?: string;
  sortDataKey?: string;
  sortOptions?: FilterOption[];
  className?: string;
  initialQuery?: string;
  initialSelect?: string;
  initialSort?: string;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function RealtimeFilter({
  scopeId,
  placeholder,
  selectLabel = "Bộ lọc",
  selectDataKey,
  selectOptions = [],
  sortLabel = "Sắp xếp",
  sortDataKey,
  sortOptions = [],
  className = "",
  initialQuery = "",
  initialSelect = "",
  initialSort = "",
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputId = useId();
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState(initialSelect);
  const [sort, setSort] = useState(initialSort);
  const [matchedCount, setMatchedCount] = useState<number | null>(null);

  const normalizedQuery = useMemo(() => normalize(query.trim()), [query]);

  useEffect(() => {
    const scope = document.getElementById(scopeId);
    if (!scope) return;

    const items = Array.from(
      scope.querySelectorAll<HTMLElement>("[data-filter-item]"),
    );

    if (sort && sortDataKey) {
      const direction = sort.endsWith("_desc") ? -1 : 1;
      const sortedItems = items.slice().sort((left, right) => {
        const leftValue = Number(left.dataset[sortDataKey] || 0);
        const rightValue = Number(right.dataset[sortDataKey] || 0);
        return (leftValue - rightValue) * direction;
      });

      sortedItems.forEach((item) => scope.appendChild(item));
    }

    let visibleCount = 0;

    items.forEach((item) => {
      const haystack = normalize(item.dataset.search || item.textContent || "");
      const optionValue = selectDataKey ? item.dataset[selectDataKey] || "" : "";
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      const matchesSelect = !selected || optionValue === selected;
      const visible = matchesQuery && matchesSelect;

      item.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    queueMicrotask(() => setMatchedCount(visibleCount));
  }, [normalizedQuery, scopeId, selected, selectDataKey, sort, sortDataKey]);

  const hasSelect = selectOptions.length > 0;
  const hasSort = sortOptions.length > 0;
  const gridClass =
    hasSelect && hasSort
      ? "grid gap-3 md:grid-cols-[1fr_190px_190px]"
      : hasSelect || hasSort
        ? "grid gap-3 md:grid-cols-[1fr_190px]"
        : "";

  return (
    <div className={`rounded-xl border border-pink-100 bg-white p-4 shadow-sm ${className}`}>
      <div className={gridClass}>
        <label className="relative block" htmlFor={inputId}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300" size={18} />
          <input
            className="h-11 w-full rounded-lg border border-pink-100 bg-white pl-11 pr-4 text-sm outline-none focus:border-primary"
            id={inputId}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            type="search"
            value={query}
          />
        </label>

        {hasSelect ? (
          <select
            aria-label={selectLabel}
            className="h-11 rounded-lg border border-pink-100 bg-white px-3 text-sm font-bold outline-none focus:border-primary"
            onChange={(event) => setSelected(event.target.value)}
            value={selected}
          >
            {selectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : null}

        {hasSort ? (
          <select
            aria-label={sortLabel}
            className="h-11 rounded-lg border border-pink-100 bg-white px-3 text-sm font-bold outline-none focus:border-primary"
            onChange={(event) => {
              const nextSort = event.target.value;
              const params = new URLSearchParams(searchParams.toString());
              setSort(nextSort);
              if (nextSort) {
                params.set("sort", nextSort);
              } else {
                params.delete("sort");
              }
              router.replace(
                params.toString() ? `${pathname}?${params.toString()}` : pathname,
                { scroll: false },
              );
            }}
            value={sort}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {matchedCount !== null ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-muted">
          <span>{matchedCount} kết quả phù hợp</span>
          {matchedCount === 0 ? (
            <span className="rounded-full bg-primary-soft px-3 py-1 text-primary">
              Không tìm thấy dữ liệu phù hợp
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

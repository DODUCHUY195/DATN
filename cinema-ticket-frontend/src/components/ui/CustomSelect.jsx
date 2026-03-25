import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

function isEmptyValue(v) {
  return v === "" || v === null || v === undefined;
}

function isSelected(optionValue, value, multiple) {
  if (multiple) {
    if (!Array.isArray(value)) return false;

    // Option "Tất cả" (value rỗng) chỉ active khi chưa chọn gì
    if (isEmptyValue(optionValue)) {
      return value.length === 0;
    }

    return value.map(String).includes(String(optionValue));
  }

  return String(optionValue ?? "") === String(value ?? "");
}

function normalizeOptions(options) {
  return options.map((option) => ({
    ...option,
    label: option.label ?? String(option.value ?? ""),
    searchText: `${option.label ?? ""} ${option.searchText ?? ""} ${
      option.emoji ?? ""
    } ${option.flag ?? ""} ${option.meta ?? ""}`.trim(),
  }));
}

function OptionLeading({ option }) {
  if (option.imageUrl) {
    return (
      <img
        src={option.imageUrl}
        alt=""
        className="h-9 w-9 rounded-xl object-cover ring-1 ring-black/5 dark:ring-white/10"
      />
    );
  }

  const token = option.flag || option.emoji || option.icon;
  if (!token) return null;

  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 shrink-0 text-base dark:bg-slate-800">
      {token}
    </span>
  );
}

function SelectedBadges({ selectedOptions }) {
  return (
    <div className="flex flex-wrap gap-2">
      {selectedOptions.slice(0, 2).map((option) => (
        <span
          key={String(option.value)}
          className="inline-flex items-center gap-2 rounded-full border border-amber-200/60 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
        >
          {(option.flag || option.emoji || option.icon) && (
            <span className="text-sm leading-none">
              {option.flag || option.emoji || option.icon}
            </span>
          )}
          <span className="max-w-[110px] truncate">{option.label}</span>
        </span>
      ))}

      {selectedOptions.length > 2 ? (
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          +{selectedOptions.length - 2}
        </span>
      ) : null}
    </div>
  );
}

function SelectedDisplay({
  multiple,
  selectedOptions,
  selectedOption,
  placeholder,
}) {
  if (multiple) {
    if (!selectedOptions.length) {
      return (
        <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>
      );
    }

    return <SelectedBadges selectedOptions={selectedOptions} />;
  }

  if (!selectedOption) {
    return (
      <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>
    );
  }

  return (
    <span className="flex min-w-0 items-center gap-3">
      <OptionLeading option={selectedOption} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
          {selectedOption.label}
        </span>
        {selectedOption.meta ? (
          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
            {selectedOption.meta}
          </span>
        ) : null}
      </span>
    </span>
  );
}

export default function CustomSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Chọn...",
  searchable = false,
  disabled = false,
  className = "",
  dropdownClassName = "",
  error,
  multiple = false,
  clearable = false,
  maxDropdownHeight = "18rem",
  loading = false,
}) {
  const selectId = useId();
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const inputRef = useRef(null);
  const optionRefs = useRef([]);

  const normalizedOptions = useMemo(() => normalizeOptions(options), [options]);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedOption = useMemo(
    () =>
      normalizedOptions.find((option) =>
        isSelected(option.value, value, false)
      ),
    [normalizedOptions, value]
  );

  const selectedOptions = useMemo(
    () =>
      normalizedOptions.filter((option) =>
        isSelected(option.value, value, true)
      ),
    [normalizedOptions, value]
  );

  const filteredOptions = useMemo(() => {
    if (!searchable || !query.trim()) return normalizedOptions;
    const keyword = query.trim().toLowerCase();
    return normalizedOptions.filter((option) =>
      option.searchText.toLowerCase().includes(keyword)
    );
  }, [normalizedOptions, query, searchable]);

  const selectOption = (option) => {
    if (option.disabled) return;

    if (multiple) {
      const currentValues = Array.isArray(value) ? [...value] : [];
      const normalizedCurrentValues = currentValues.filter(
        (item) => !isEmptyValue(item)
      );

      // Click option "Tất cả" => reset
      if (isEmptyValue(option.value)) {
        onChange?.([]);
        return;
      }

      const exists = normalizedCurrentValues
        .map(String)
        .includes(String(option.value));

      const next = exists
        ? normalizedCurrentValues.filter(
            (item) => String(item) !== String(option.value)
          )
        : [...normalizedCurrentValues, option.value];

      onChange?.(next);
      return;
    }

    onChange?.(option.value);
    setOpen(false);
    setQuery("");
    buttonRef.current?.focus();
  };

  const clearSelection = (event) => {
    event.stopPropagation();
    onChange?.(multiple ? [] : "");
    setQuery("");
  };

  const onButtonKeyDown = (event) => {
    if (disabled) return;

    if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
    }
  };

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (
        !rootRef.current?.contains(document.activeElement) &&
        !rootRef.current?.contains(event.target)
      ) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }

      if (!filteredOptions.length) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => (current + 1) % filteredOptions.length);
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex(
          (current) =>
            (current - 1 + filteredOptions.length) % filteredOptions.length
        );
      }

      if (event.key === "Home") {
        event.preventDefault();
        setActiveIndex(0);
      }

      if (event.key === "End") {
        event.preventDefault();
        setActiveIndex(filteredOptions.length - 1);
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const option = filteredOptions[activeIndex];
        if (option) selectOption(option);
      }

      if (multiple && event.key === "Backspace" && !query) {
        const currentValues = Array.isArray(value) ? [...value] : [];
        currentValues.pop();
        onChange?.(currentValues);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, filteredOptions, multiple, onChange, open, query, value]);

  useEffect(() => {
    if (!open) return;

    const firstSelectedIndex = filteredOptions.findIndex((option) =>
      isSelected(option.value, value, multiple)
    );

    setActiveIndex(firstSelectedIndex >= 0 ? firstSelectedIndex : 0);

    const timer = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(timer);
  }, [open, filteredOptions, value, multiple]);

  useEffect(() => {
    const node = optionRefs.current[activeIndex];
    if (node) node.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {label ? (
        <label
          htmlFor={selectId}
          className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400"
        >
          {label}
        </label>
      ) : null}

      <button
        ref={buttonRef}
        id={selectId}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${selectId}-listbox`}
        aria-haspopup="listbox"
        disabled={disabled}
        onKeyDown={onButtonKeyDown}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={[
          "group flex min-h-[60px] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200",
          "bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:bg-slate-950",
          open
            ? "border-amber-400 ring-4 ring-amber-400/10 shadow-[0_16px_40px_rgba(245,158,11,0.18)] dark:border-amber-500"
            : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700",
          error ? "border-rose-400 ring-4 ring-rose-400/10" : "",
          disabled ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
      >
        <div className="min-w-0 flex-1">
          <SelectedDisplay
            multiple={multiple}
            selectedOption={selectedOption}
            selectedOptions={selectedOptions}
            placeholder={placeholder}
          />
        </div>

        <div className="flex items-center gap-2">
          {clearable &&
          ((multiple && selectedOptions.length > 0) ||
            (!multiple && selectedOption)) ? (
            <span
              onClick={clearSelection}
              className="flex h-8 w-8 items-center justify-center rounded-full shrink-0 bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <X size={14} />
            </span>
          ) : null}

          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 bg-slate-100 text-slate-500 transition-all duration-200 dark:bg-slate-800 dark:text-slate-300 ${
              open
                ? "rotate-180 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
                : ""
            }`}
          >
            <ChevronDown size={16} />
          </span>
        </div>
      </button>

      {error ? <p className="mt-1.5 text-sm text-rose-500">{error}</p> : null}

      <div
        className={[
          "absolute z-[1000] mt-2 w-full origin-top overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] transition-all duration-200 dark:border-slate-800 dark:bg-slate-950",
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-2 scale-[0.98] opacity-0",
          dropdownClassName,
        ].join(" ")}
      >
        {searchable ? (
          <div className="border-b border-slate-100 p-3 dark:border-slate-800">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                ref={inputRef}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder={multiple ? "Tìm và chọn nhiều mục..." : "Tìm kiếm..."}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
              />
            </div>
          </div>
        ) : null}

        <div
          id={`${selectId}-listbox`}
          role="listbox"
          aria-multiselectable={multiple || undefined}
          className="overflow-y-auto p-2 relative z-50"
          style={{ maxHeight: maxDropdownHeight }}
        >
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              Đang tải dữ liệu...
            </div>
          ) : filteredOptions.length ? (
            <div className="space-y-1">
              {filteredOptions.map((option, index) => {
                const active = isSelected(option.value, value, multiple);
                const focused = activeIndex === index;

                return (
                  <button
                    key={String(option.value ?? index)}
                    ref={(node) => {
                      optionRefs.current[index] = node;
                    }}
                    type="button"
                    role="option"
                    aria-selected={active}
                    disabled={option.disabled}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectOption(option)}
                    className={[
                      "flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-150",
                      active
                        ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20"
                        : focused
                        ? "bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
                        : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900",
                      option.disabled ? "cursor-not-allowed opacity-50" : "",
                    ].join(" ")}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <OptionLeading option={option} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {option.label}
                        </span>
                        {option.meta ? (
                          <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                            {option.meta}
                          </span>
                        ) : null}
                      </span>
                    </span>

                    <span
                      className={[
                        "flex h-8 w-8 items-center justify-center rounded-full shrink-0 transition-all",
                        active
                          ? "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
                          : "bg-transparent text-transparent",
                      ].join(" ")}
                    >
                      <Check size={16} />
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              Không có dữ liệu phù hợp
            </div>
          )}
        </div>

        {multiple ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
              Đã chọn {selectedOptions.length} mục
            </p>
            <button
              type="button"
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-300"
              onClick={() => onChange?.([])}
            >
              Bỏ chọn tất cả
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
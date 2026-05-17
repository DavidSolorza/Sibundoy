import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown } from "lucide-react";

function SearchableSelect({
  value,
  onChange,
  options = [],
  getOptionValue = (o) => (typeof o === "object" ? o.id : o),
  getOptionLabel = (o) => (typeof o === "object" ? o.nombre || o.label || String(o.id) : String(o)),
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  noOptionsMessage = "Sin resultados",
  renderOption,
  disabled = false,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter((o) => getOptionLabel(o).toLowerCase().includes(q));
  }, [options, search, getOptionLabel]);

  const selectedOption = options.find((o) => getOptionValue(o) === value);
  const selectedLabel = selectedOption ? getOptionLabel(selectedOption) : "";

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setHighlightedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  useEffect(() => {
    if (listRef.current && highlightedIndex >= 0) {
      const el = listRef.current.children[highlightedIndex];
      if (el) el.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  function handleKeyDown(e) {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[highlightedIndex]) {
          selectOption(filtered[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSearch("");
        break;
    }
  }

  function selectOption(opt) {
    const val = getOptionValue(opt);
    onChange(val);
    setIsOpen(false);
    setSearch("");
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-left transition-colors duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={`truncate ${selectedLabel ? "text-gray-900" : "text-gray-400"}`}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setHighlightedIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="w-full text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />
          </div>
          <div ref={listRef} className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-400">{noOptionsMessage}</p>
            ) : (
              filtered.map((opt, i) => {
                const isSelected = getOptionValue(opt) === value;
                return (
                  <button
                    key={getOptionValue(opt)}
                    type="button"
                    onClick={() => selectOption(opt)}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      i === highlightedIndex ? "bg-blue-50" : ""
                    } ${isSelected ? "font-medium text-blue-700" : "text-gray-700"}`}
                  >
                    {renderOption ? renderOption(opt) : getOptionLabel(opt)}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;

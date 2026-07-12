import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, FolderOpen, Calendar, LayoutDashboard, X, ArrowRight } from "lucide-react";
import { MOCK_SEARCH_INDEX } from "../../lib/mock-data";

const TYPE_ICON: Record<string, React.ElementType> = {
  Group:    Users,
  Resource: FolderOpen,
  Session:  Calendar,
  Page:     LayoutDashboard,
};

interface SearchModalProps {
  onClose: () => void;
}

export function SearchModal({ onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = query.trim().length > 0
    ? MOCK_SEARCH_INDEX.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.sub.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : MOCK_SEARCH_INDEX.slice(0, 6);

  useEffect(() => { setActive(0); }, [query]);

  const go = useCallback((href: string) => {
    navigate(href);
    onClose();
  }, [navigate, onClose]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    if (e.key === "Enter" && results[active]) go(results[active].href);
    if (e.key === "Escape") onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[80]" onClick={onClose} />

      {/* Modal */}
      <div className="fixed top-[12vh] left-1/2 -translate-x-1/2 w-full max-w-[580px] bg-surface border border-border rounded-2xl shadow-[0_24px_64px_rgba(15,23,42,0.18)] z-[81] overflow-hidden animate-[sfModal_0.16s_ease]">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search groups, resources, sessions…"
            className="flex-1 bg-transparent outline-none text-[14px] text-foreground placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[11px] border border-border rounded px-1.5 py-0.5 bg-background text-muted-foreground font-medium shrink-0">ESC</kbd>
        </div>

        {/* Results */}
        <div className="py-1.5 max-h-[380px] overflow-y-auto">
          {results.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-muted-foreground">No results for "{query}"</div>
          ) : (
            <>
              {!query && <div className="px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Suggestions</div>}
              {results.map((item, i) => {
                const Icon = TYPE_ICON[item.type] ?? Search;
                return (
                  <button
                    key={i}
                    onClick={() => go(item.href)}
                    onMouseEnter={() => setActive(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${active === i ? "bg-primary-soft" : "hover:bg-background"}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active === i ? "bg-primary text-white" : "bg-border-soft text-muted-foreground"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-semibold truncate">{item.label}</div>
                      <div className="text-[11.5px] text-muted-foreground">{item.type} · {item.sub}</div>
                    </div>
                    <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-opacity ${active === i ? "opacity-100 text-primary" : "opacity-0"}`} />
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border-soft text-[11px] text-muted-foreground">
          <span><kbd className="border border-border rounded px-1 py-0.5 bg-background mr-1">↑↓</kbd> Navigate</span>
          <span><kbd className="border border-border rounded px-1 py-0.5 bg-background mr-1">↵</kbd> Open</span>
          <span><kbd className="border border-border rounded px-1 py-0.5 bg-background mr-1">ESC</kbd> Close</span>
        </div>
      </div>
    </>
  );
}

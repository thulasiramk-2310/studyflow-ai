import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, FolderOpen, Calendar, LayoutDashboard, X, ArrowRight, Sparkles, BookOpen } from "lucide-react";
import { searchService } from "../../services/search.service";
import type { SearchResult } from "../../services/search.service";

const TYPE_ICON: Record<string, React.ElementType> = {
  group:    Users,
  resource: FolderOpen,
  session:  Calendar,
  page:     LayoutDashboard,
  quiz:     BookOpen,
  flashcard: Sparkles,
  chat:     Sparkles
};

const TYPE_LABELS: Record<string, string> = {
  page: "Pages",
  group: "Groups",
  resource: "Resources",
  session: "Sessions",
  quiz: "Quizzes",
  flashcard: "Flashcards",
  chat: "Chats"
};

interface SearchItem {
  id: string;
  type: string;
  label: string;
  sub: string;
  href: string;
}

const STATIC_PAGES: SearchItem[] = [
  { id: "p1", type: "page", label: "Dashboard", sub: "Overview of your activity", href: "/dashboard" },
  { id: "p2", type: "page", label: "Groups", sub: "View your study groups", href: "/groups" },
  { id: "p3", type: "page", label: "Sessions", sub: "View your study sessions", href: "/sessions" },
  { id: "p4", type: "page", label: "Settings", sub: "Manage your account", href: "/settings" },
];

export function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [results, setResults] = useState<SearchItem[]>(STATIC_PAGES);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    inputRef.current?.focus(); 
  }, []);

  useEffect(() => {
    const fetchSearch = async () => {
      const q = query.trim();
      if (q.length === 0) {
        setResults(STATIC_PAGES);
        return;
      }

      setLoading(true);
      try {
        const data = await searchService.search(q);
        
        let newResults: SearchItem[] = [];
        
        // Match static pages
        const pages = STATIC_PAGES.filter(item => 
          item.label.toLowerCase().includes(q.toLowerCase()) || 
          item.sub.toLowerCase().includes(q.toLowerCase())
        );
        newResults.push(...pages);

        // Map API results
        const mapApiResult = (res: SearchResult) => ({
          id: `${res.type}_${res.id}`,
          type: res.type,
          label: res.title,
          sub: res.description || res.type,
          href: res.url
        });

        newResults.push(...data.groups.map(mapApiResult));
        newResults.push(...data.sessions.map(mapApiResult));
        newResults.push(...data.resources.map(mapApiResult));
        newResults.push(...data.quizzes.map(mapApiResult));
        newResults.push(...data.flashcards.map(mapApiResult));

        setResults(newResults);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchSearch, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  useEffect(() => { setActive(0); }, [results]);

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

  // Group results by type
  const groupedResults = results.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, SearchItem[]>);

  let flatIndex = 0;

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-[sfFade_0.15s_ease]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
        <div 
          className="w-full max-w-[540px] bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden pointer-events-auto animate-[sfScale_0.15s_ease]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header/Input */}
          <div className="flex items-center px-4 py-3 border-b border-border">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent border-0 outline-none text-base px-3 h-9 text-foreground placeholder:text-muted-foreground"
              placeholder="Search groups, sessions, resources..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={onKey}
            />
            {query && (
              <button onClick={() => setQuery("")} className="p-1.5 rounded-md text-muted-foreground hover:bg-border-soft transition-colors mr-1">
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block text-[11px] font-medium font-sans border border-border rounded px-1.5 bg-background text-muted-foreground">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-[380px] overflow-y-auto p-2">
            {loading && query.length > 0 && results.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">Searching...</div>
            ) : results.length > 0 ? (
              Object.entries(groupedResults).map(([type, items]) => (
                <div key={type} className="mb-2 last:mb-0">
                  <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {TYPE_LABELS[type] || type}
                  </div>
                  {items.map((item) => {
                    const i = flatIndex++;
                    const Icon = TYPE_ICON[item.type] || FolderOpen;
                    return (
                      <button
                        key={item.id}
                        onClick={() => go(item.href)}
                        onMouseEnter={() => setActive(i)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors text-left ${active === i ? "bg-primary-soft/40" : "hover:bg-background"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${active === i ? "bg-primary text-white shadow-sm" : "bg-background border border-border-soft text-muted-foreground"}`}>
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[14px] font-semibold text-foreground line-clamp-1">{item.label}</span>
                            <span className="text-[12px] text-muted-foreground capitalize line-clamp-1">{item.sub}</span>
                          </div>
                        </div>
                        {active === i && <ArrowRight className="w-4 h-4 text-primary shrink-0 opacity-80" />}
                      </button>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="px-4 py-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-background border border-border-soft flex items-center justify-center mb-3">
                  <Search className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">No results found</p>
                <p className="text-[13px] text-muted-foreground mt-1">We couldn't find anything matching "{query}"</p>
              </div>
            )}
          </div>
          
          <div className="bg-background border-t border-border px-4 py-2.5 flex items-center gap-4 text-[11px] font-medium text-muted-foreground shrink-0">
            <span className="flex items-center gap-1.5"><kbd className="border border-border rounded px-1.5 shadow-[0_1px_0_rgba(15,23,42,0.06)] bg-surface text-[10px]">↑</kbd> <kbd className="border border-border rounded px-1.5 shadow-[0_1px_0_rgba(15,23,42,0.06)] bg-surface text-[10px]">↓</kbd> to navigate</span>
            <span className="flex items-center gap-1.5"><kbd className="border border-border rounded px-1.5 shadow-[0_1px_0_rgba(15,23,42,0.06)] bg-surface text-[10px]">↵</kbd> to open</span>
          </div>
        </div>
      </div>
    </>
  );
}

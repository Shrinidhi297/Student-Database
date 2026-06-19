import { useCallback, useEffect, useRef, useState } from 'react';
import { History, Sparkles, Search as SearchIcon, X, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { parseNaturalLanguage, SUGGESTED_QUERIES, getRecentSearches, addRecentSearch } from '@/lib/query-parser';
import { formatFilterBadge } from '@/lib/filter-builder';
import { cn } from '@/lib/utils';
import type { AiSearchFilters, AiSearchResult } from '@/lib/ai-search';

export type AiSearchProps = {
  onSearch: (result: AiSearchResult) => void;
  onClear: () => void;
  activeFilters: AiSearchFilters | null;
  isSearching: boolean;
};

export function AiSearch({ onSearch, onClear, activeFilters, isSearching }: AiSearchProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches());
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setShowHistory(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) {
        return;
      }

      setError('');
      setShowSuggestions(false);
      setShowHistory(false);

      const result = await parseNaturalLanguage(trimmed);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      addRecentSearch(trimmed);
      setRecentSearches(getRecentSearches());
      onSearch(result.result);
    },
    [onSearch],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      void handleSearch(input);
    },
    [input, handleSearch],
  );

  const handleSuggestionClick = useCallback(
    (query: string) => {
      setInput(query);
      setShowSuggestions(false);
      void handleSearch(query);
    },
    [handleSearch],
  );

  const handleHistoryClick = useCallback(
    (query: string) => {
      setInput(query);
      setShowHistory(false);
      void handleSearch(query);
    },
    [handleSearch],
  );

  const handleClear = useCallback(() => {
    setInput('');
    setError('');
    onClear();
  }, [onClear]);

  const filtersArray = activeFilters
    ? Object.entries(activeFilters).filter(
        ([key]) => key !== 'limit' && key !== 'offset' && key !== 'order_by',
      )
    : [];

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={cn(
            'relative flex items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300',
            isSearching && 'animate-pulse-glow',
            'focus-within:border-primary/30 focus-within:bg-white/[0.05]',
          )}
        >
          <div className="flex items-center pl-4 text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary/70" />
          </div>
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError('');
            }}
            onFocus={() => {
              if (!input) {
                setShowSuggestions(true);
              }
            }}
            placeholder="Ask AI to find students..."
            className="border-0 bg-transparent pl-3 pr-2 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
          />
          {input && (
            <button
              type="button"
              onClick={() => {
                setInput('');
                setError('');
              }}
              className="mr-1 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={isSearching || !input.trim()}
            className="mr-1.5 rounded-xl"
          >
            {isSearching ? (
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span className="hidden sm:inline">Thinking...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <SearchIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Search</span>
              </div>
            )}
          </Button>
        </div>
      </form>

      {error && (
        <div className="mt-2 animate-fade-down rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-2.5 backdrop-blur-xl">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {filtersArray.length > 0 && (
        <div className="mt-3 flex animate-fade-up flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground/60">Filters:</span>
          {filtersArray.map(([field, value]) => (
            <Badge
              key={field}
              variant="default"
              className="animate-scale-in text-xs backdrop-blur-xl"
            >
              {formatFilterBadge(field, value)}
            </Badge>
          ))}
          {activeFilters?.limit && (
            <Badge variant="outline" className="animate-scale-in text-xs">
              Limit: {activeFilters.limit}
            </Badge>
          )}
          {activeFilters?.order_by && (
            <Badge variant="outline" className="animate-scale-in text-xs">
              Sort: {activeFilters.order_by.field} ({activeFilters.order_by.direction})
            </Badge>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="ml-1 text-xs text-muted-foreground/50 underline underline-offset-2 transition-colors hover:text-muted-foreground"
          >
            Clear all
          </button>
        </div>
      )}

      {showSuggestions && !input && (
        <div className="glass-strong absolute left-0 right-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-2xl p-3 animate-fade-down">
          {recentSearches.length > 0 && (
            <div className="mb-3">
              <div className="mb-1.5 flex items-center gap-1.5 px-2 text-xs font-medium text-muted-foreground/60">
                <History className="h-3 w-3" />
                Recent searches
              </div>
              {recentSearches.map((query) => (
                <button
                  key={query}
                  type="button"
                  onClick={() => handleHistoryClick(query)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                >
                  <History className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                  <span className="truncate">{query}</span>
                </button>
              ))}
            </div>
          )}

          <div>
            <div className="mb-1.5 flex items-center gap-1.5 px-2 text-xs font-medium text-muted-foreground/60">
              <TrendingUp className="h-3 w-3" />
              Suggestions
            </div>
            {SUGGESTED_QUERIES.map((query) => (
              <button
                key={query}
                type="button"
                onClick={() => handleSuggestionClick(query)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
              >
                <Sparkles className="h-3 w-3 shrink-0 text-primary/40" />
                <span className="truncate">{query}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showHistory && !input && recentSearches.length === 0 && (
        <div className="glass-strong absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl p-4 text-center text-sm text-muted-foreground animate-fade-down">
          No recent searches yet.
        </div>
      )}
    </div>
  );
}

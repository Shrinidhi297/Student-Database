import { callAiApi, parseLocalFallback, type AiSearchFilters, type AiSearchResult } from './ai-search';

function getApiKey(): string | null {
  const key = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!key || key === 'your_gemini_api_key_here') return null;
  return key;
}

export type ParseResult =
  | { ok: true; result: AiSearchResult }
  | { ok: false; error: string };

function hasValidFilters(filters: AiSearchFilters): boolean {
  const keys = Object.keys(filters) as (keyof AiSearchFilters)[];
  return keys.length > 0;
}

export async function parseNaturalLanguage(query: string): Promise<ParseResult> {
  const trimmed = query.trim();
  if (!trimmed) return { ok: false, error: 'Please enter a search query.' };

  const apiKey = getApiKey();

  if (apiKey) {
    try {
      const aiResponse = await callAiApi(trimmed, apiKey);
      const filters = aiResponse.filters ?? {};
      if (hasValidFilters(filters)) {
        return { ok: true, result: { filters: filters as AiSearchFilters, raw_query: trimmed } };
      }
    } catch {
      // fall through
    }
  }

  const localFilters = parseLocalFallback(trimmed);
  if (hasValidFilters(localFilters)) {
    return { ok: true, result: { filters: localFilters, raw_query: trimmed } };
  }

  // Last-resort fuzzy: treat entire query as a generic search across name/usn/department
  const generic: AiSearchFilters = {
    first_name: { operator: 'contains', value: trimmed.replace(/^(show|find|search|list|get|display|fetch|load|view|all|any)\s+/i, '').trim() },
  };
  return { ok: true, result: { filters: generic, raw_query: trimmed } };
}

export const SUGGESTED_QUERIES = [
  'Show active students',
  'Find students with GPA above 3.5',
  'Show students from CSE department',
  'Find students with attendance below 75%',
  'Show top 5 students by marks',
  'Find students named Rahul',
  'Show final year students',
  'Find students with attendance between 60 and 80%',
  'Show CSE students with low attendance',
  'Find high performers with marks above 90',
  'Show me students from AIML department',
  'Find failed students attendance below 40',
];

const RECENT_SEARCHES_KEY = 'scholar_ai_recent_searches';
const MAX_RECENT = 10;

export function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_RECENT);
  } catch { return []; }
}

export function addRecentSearch(query: string): void {
  try {
    const existing = getRecentSearches();
    const updated = [query, ...existing.filter((q) => q !== query)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch { /* noop */ }
}

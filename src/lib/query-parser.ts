import { callAiApi, parseLocalFallback, type AiSearchFilters, type AiSearchResult } from './ai-search';

function getApiKey(): string | null {
  const key = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!key || key === 'your_gemini_api_key_here') {
    return null;
  }
  return key;
}

export type ParseResult =
  | { ok: true; result: AiSearchResult }
  | { ok: false; error: string };

function hasValidFilters(filters: AiSearchFilters): boolean {
  const keys = Object.keys(filters) as (keyof AiSearchFilters)[];
  return keys.length > 0;
}

// Normalize query: expand synonyms, fix common typos, clean up
function normalizeQuery(query: string): string {
  let normalized = query.trim();

  // Synonym expansion
  const synonyms: [RegExp, string][] = [
    [/\bstudents?\b/i, 'students'],
    [/\bdept\b/i, 'department'],
    [/\bsem\b/i, 'semester'],
    [/\batt\b/i, 'attendance'],
    [/\beng\b/i, 'engineering'],
    [/\bcs\b/i, 'CSE'],
    [/\bcomp\b/i, 'CSE'],
    [/\bcomputer\b/i, 'CSE'],
    [/\belectronics?\b/i, 'ECE'],
    [/\belectrical\b/i, 'EEE'],
    [/\bmechanical\b/i, 'ME'],
    [/\bcivil\b/i, 'CE'],
    [/\binformation\s+tech\b/i, 'IT'],
    [/\bintelligent\s+system\b/i, 'ISE'],
    [/\bartificial\s+intelligence\b/i, 'AIML'],
    [/\bmachine\s+learning\b/i, 'AIML'],
    [/\bsenior\b/i, 'final year'],
    [/\bjunior\b/i, 'third year'],
    [/\bfreshman\b/i, 'first year'],
    [/\bsophomore\b/i, 'second year'],
    [/\balumni\b/i, 'graduated'],
    [/\bpass(ed)?\s*out\b/i, 'graduated'],
    [/\bdropped\b/i, 'inactive'],
    [/\bdiscontinued\b/i, 'inactive'],
  ];

  for (const [pattern, replacement] of synonyms) {
    normalized = normalized.replace(pattern, replacement);
  }

  // Clean up extra whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

// Generate explanation from filters
function generateExplanation(filters: AiSearchFilters, query: string): string {
  const parts: string[] = [];

  if (filters.status) {
    const status = typeof filters.status === 'string' ? filters.status : filters.status.value;
    parts.push(`${status} students`);
  }
  if (filters.department) {
    const dept = typeof filters.department === 'string' ? filters.department : filters.department.value;
    parts.push(`from ${dept}`);
  }
  if (filters.semester) {
    if (typeof filters.semester === 'number') {
      parts.push(`semester ${filters.semester}`);
    } else {
      parts.push(`semesters ${filters.semester.value}-${filters.semester.value2}`);
    }
  }
  if (filters.gpa) {
    const gpa = filters.gpa;
    if (gpa.operator === 'between') {
      parts.push(`GPA between ${gpa.value} and ${gpa.value2}`);
    } else if (gpa.operator === 'gte') {
      parts.push(`GPA >= ${gpa.value}`);
    } else if (gpa.operator === 'lte') {
      parts.push(`GPA <= ${gpa.value}`);
    } else if (gpa.operator === 'gt') {
      parts.push(`GPA > ${gpa.value}`);
    } else if (gpa.operator === 'lt') {
      parts.push(`GPA < ${gpa.value}`);
    }
  }
  if (filters.attendance) {
    const att = filters.attendance;
    if (att.operator === 'between') {
      parts.push(`attendance between ${att.value}% and ${att.value2}%`);
    } else if (att.operator === 'lt') {
      parts.push(`attendance < ${att.value}%`);
    } else if (att.operator === 'gt') {
      parts.push(`attendance > ${att.value}%`);
    }
  }
  if (filters.marks) {
    const marks = filters.marks;
    if (marks.operator === 'between') {
      parts.push(`marks between ${marks.value} and ${marks.value2}`);
    } else if (marks.operator === 'gt') {
      parts.push(`marks > ${marks.value}`);
    } else if (marks.operator === 'lt') {
      parts.push(`marks < ${marks.value}`);
    }
  }
  if (filters.first_name) {
    const name = typeof filters.first_name === 'string' ? filters.first_name : filters.first_name.value;
    parts.push(`named "${name}"`);
  }
  if (filters.order_by) {
    parts.push(`sorted by ${filters.order_by.field} ${filters.order_by.direction === 'desc' ? 'descending' : 'ascending'}`);
  }
  if (filters.limit) {
    parts.push(`top ${filters.limit}`);
  }

  return parts.length > 0 ? parts.join(' ') : `Searching for: ${query}`;
}

export async function parseNaturalLanguage(query: string): Promise<ParseResult> {
  const trimmed = normalizeQuery(query);

  if (!trimmed) {
    return { ok: false, error: 'Please enter a search query.' };
  }

  const apiKey = getApiKey();

  if (apiKey) {
    try {
      const aiResponse = await callAiApi(trimmed, apiKey);
      const filters = aiResponse.filters ?? {};

      if (hasValidFilters(filters)) {
        const explanation = aiResponse.explanation || generateExplanation(filters, trimmed);
        return {
          ok: true,
          result: { filters: filters as AiSearchFilters, raw_query: trimmed, explanation },
        };
      }
    } catch {
      // AI API failed — fall through to local parser
    }
  }

  const localFilters = parseLocalFallback(trimmed);

  if (hasValidFilters(localFilters)) {
    const explanation = generateExplanation(localFilters, trimmed);
    return {
      ok: true,
      result: { filters: localFilters, raw_query: trimmed, explanation },
    };
  }

  if (!apiKey) {
    return {
      ok: false,
      error: 'AI search is in offline mode. Add a valid Gemini API key to .env for full natural language support.',
    };
  }

  return {
    ok: false,
    error: 'Unable to understand search query. Please try again.',
  };
}

export type NavigationIntent = {
  route: string;
  label: string;
};

export function parseNavigationIntent(query: string): NavigationIntent | null {
  const navigationRules: Array<{ route: string; label: string; pattern: RegExp }> = [
    {
      route: '/students',
      label: 'Student directory',
      pattern: /\b(go to|open|navigate to|take me to|visit|show me|show|browse)\s+(the\s+)?(students|student list|student records|student directory)\b/i,
    },
    {
      route: '/dashboard',
      label: 'Dashboard',
      pattern: /\b(go to|open|navigate to|take me to|visit|show me|show|browse)\s+(the\s+)?dashboard\b/i,
    },
    {
      route: '/auth',
      label: 'Authentication page',
      pattern: /\b(go to|open|navigate to|take me to|visit|show me|show|browse)\s+(the\s+)?(login|sign in|auth|authentication)\b/i,
    },
  ];

  for (const rule of navigationRules) {
    if (rule.pattern.test(query)) {
      return { route: rule.route, label: rule.label };
    }
  }

  return null;
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
  'Not graduated students from ECE',
  'Students with GPA between 3 and 4',
  'Find gmail users',
  'Show bottom 5 by GPA',
  'Semester 3 students with marks above 80',
  'Inactive students from ME department',
];

const RECENT_SEARCHES_KEY = 'scholar_ai_recent_searches';
const MAX_RECENT = 10;

export function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string): void {
  try {
    const existing = getRecentSearches();
    const updated = [query, ...existing.filter((q) => q !== query)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // localStorage may be unavailable
  }
}

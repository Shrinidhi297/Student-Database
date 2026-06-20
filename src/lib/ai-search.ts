import { z } from 'zod';

export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'between';

export type FilterCondition = {
  operator: FilterOperator;
  value: string | number;
  value2?: string | number;
};

export type AiSearchFilters = {
  first_name?: string | FilterCondition;
  last_name?: string | FilterCondition;
  email?: string | FilterCondition;
  phone?: string | FilterCondition;
  grade_level?: string | FilterCondition;
  status?: string | FilterCondition;
  enrollment_date?: string | FilterCondition;
  gpa?: FilterCondition;
  notes?: string | FilterCondition;
  usn?: string | FilterCondition;
  department?: string | FilterCondition;
  semester?: number | FilterCondition;
  attendance?: FilterCondition;
  marks?: FilterCondition;
  limit?: number;
  offset?: number;
  order_by?: { field: string; direction: 'asc' | 'desc' };
};

export type AiSearchResult = {
  filters: AiSearchFilters;
  raw_query: string;
};

const operatorSchema = z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'between']);

const conditionSchema: z.ZodType<FilterCondition> = z.object({
  operator: operatorSchema,
  value: z.union([z.string(), z.number()]),
  value2: z.union([z.string(), z.number()]).optional(),
});

const fieldSchema = z.union([z.string(), conditionSchema]);

const filtersSchema = z.object({
  first_name: fieldSchema.optional(),
  last_name: fieldSchema.optional(),
  email: fieldSchema.optional(),
  phone: fieldSchema.optional(),
  grade_level: fieldSchema.optional(),
  status: fieldSchema.optional(),
  enrollment_date: fieldSchema.optional(),
  gpa: conditionSchema.optional(),
  notes: fieldSchema.optional(),
  usn: fieldSchema.optional(),
  department: fieldSchema.optional(),
  semester: z.union([z.number(), conditionSchema]).optional(),
  attendance: conditionSchema.optional(),
  marks: conditionSchema.optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  order_by: z
    .object({
      field: z.string(),
      direction: z.enum(['asc', 'desc']),
    })
    .optional(),
});

export const aiResponseSchema = z.object({
  filters: filtersSchema,
  explanation: z.string().optional(),
});

export type AiResponse = z.infer<typeof aiResponseSchema>;

const AVAILABLE_FIELDS = [
  { name: 'first_name', type: 'string', description: 'Student first name' },
  { name: 'last_name', type: 'string', description: 'Student last name' },
  { name: 'email', type: 'string', description: 'Email address' },
  { name: 'phone', type: 'string', description: 'Phone number' },
  { name: 'grade_level', type: 'string', description: 'Grade or class level (e.g. Grade 10, Freshman, etc.)' },
  { name: 'status', type: 'string', description: 'Enrollment status: active, inactive, or graduated' },
  { name: 'enrollment_date', type: 'string', description: 'Date of enrollment (YYYY-MM-DD format)' },
  { name: 'gpa', type: 'number', description: 'CGPA or grade point average (0.0 – 10.0)' },
  { name: 'notes', type: 'string', description: 'Miscellaneous notes about the student' },
  { name: 'usn', type: 'string', description: 'University Serial Number or student ID' },
  { name: 'department', type: 'string', description: 'Department name (e.g. CSE, AIML, ECE, ME, CE)' },
  { name: 'semester', type: 'number', description: 'Current semester number (1-8)' },
  { name: 'attendance', type: 'number', description: 'Attendance percentage (0-100)' },
  { name: 'marks', type: 'number', description: 'Total marks or percentage score (0-100)' },
];

function buildSystemPrompt(): string {
  const fieldsDesc = AVAILABLE_FIELDS.map(
    (f) => `  - "${f.name}" (${f.type}): ${f.description}`,
  ).join('\n');

  return `You are a student database query parser. Convert any natural language query into JSON filters. Always return a best-effort parse — NEVER return empty filters.

Available fields (use ONLY these):
${fieldsDesc}

Rules (ABSOLUTELY REQUIRED):
1. Respond ONLY with valid JSON — no markdown, no code fences, no extra text.
2. For exact string matches: { "field": "value" } — e.g. { "department": "CSE" }
3. For numeric comparisons, use operator object:
   Operators: "eq", "neq", "gt", "gte", "lt", "lte", "contains", "between"
4. Department synonyms: computer science/CS → CSE, AIML/AI-ML/AI/ML → AIML, ECE/electronics, ME/mechanical, CE/civil, ISE/information science, IT
5. For names, use "contains" operator on first_name (and optionally last_name)
6. For "top N", add limit + order_by with desc direction
7. For "bottom/last/worst N", add limit + order_by with asc direction
8. "passed" → marks >= 40, "failed" → marks < 40
9. "high marks/performers" → marks > 75, "low marks/struggling" → marks < 40
10. "high CGPA/good CGPA" → gpa >= 8, "low CGPA/poor CGPA" → gpa < 6
11. "low/poor attendance" → attendance < 75, "good/regular attendance" → attendance >= 75
12. Years: "first year/freshman" → semester 1, "second year/sophomore" → semester between 3-4, "third year/junior" → semester between 5-6, "final year/last year/senior/fourth year" → semester 8
13. Combine conditions as separate keys (AND logic)

Examples:
Query: "active CSE students with attendance below 75"
{"filters":{"status":"active","department":"CSE","attendance":{"operator":"lt","value":75}},"explanation":"Active CSE students with low attendance"}

Query: "top 5 by marks"
{"filters":{"order_by":{"field":"marks","direction":"desc"},"limit":5},"explanation":"Top 5 students by marks"}

Query: "show Rahul Patel"
{"filters":{"first_name":{"operator":"contains","value":"Rahul"},"last_name":{"operator":"contains","value":"Patel"}},"explanation":"Students named Rahul Patel"}

Query: "high performers"
{"filters":{"marks":{"operator":"gt","value":75}},"explanation":"Students with marks above 75"}

Query: "failed students"
{"filters":{"marks":{"operator":"lt","value":40}},"explanation":"Students with marks below 40"}

Query: "students with low attendance"
{"filters":{"attendance":{"operator":"lt","value":75}},"explanation":"Students with attendance below 75%"}

Query: "AIML department final year"
{"filters":{"department":"AIML","semester":8},"explanation":"Final year AIML students"}

Query: "show everything"
{"filters":{},"explanation":"All students"}`;
}

function buildUserPrompt(query: string): string {
  return `Convert this query to student database filters: "${query}"`;
}

export async function callAiApi(query: string, apiKey: string): Promise<AiResponse> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(query);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      }),
    },
  );

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`AI API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  return parseAiTextResponse(text);
}

export function parseAiTextResponse(text: string): AiResponse {
  const cleaned = text
    .replace(/```(?:json)?\s*/gi, '')
    .replace(/```/g, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { filters: {}, explanation: 'Unable to understand search query. Please try again.' };
  }

  const result = aiResponseSchema.safeParse(parsed);
  if (!result.success) {
    return { filters: {}, explanation: 'Unable to understand search query. Please try again.' };
  }

  return result.data;
}

function isKeyword(word: string): boolean {
  return ['active', 'inactive', 'graduated', 'all', 'top', 'the', 'best', 'good', 'bad', 'me', 'my',
    'students', 'student', 'show', 'find', 'search', 'list', 'get', 'display', 'fetch', 'load',
    'view', 'any', 'some', 'with', 'having', 'that', 'who', 'which', 'whose', 'their',
    'please', 'would', 'could', 'can', 'give', 'tell', 'need', 'want', 'looking', 'where',
    'are', 'is', 'an', 'a', 'of', 'in', 'on', 'at', 'by', 'to', 'for', 'from', 'and', 'or',
    'the', 'all', 'me', 'do', 'does', 'did', 'has', 'have', 'been', 'been', 'not', 'no', 'but'].includes(word.toLowerCase());
}

/** Map synonyms / long names to department codes */
const DEPT_SYNONYMS: Record<string, string> = {
  'computer science': 'CSE', 'comp sci': 'CSE', 'computer': 'CSE', 'cs': 'CSE',
  'computerscience': 'CSE', 'cse': 'CSE',
  'aiml': 'AIML', 'ai ml': 'AIML', 'ai & ml': 'AIML', 'artificial intelligence': 'AIML',
  'machine learning': 'AIML', 'ai': 'AIML', 'ml': 'AIML',
  'ece': 'ECE', 'electronics': 'ECE', 'electronics and communication': 'ECE',
  'eee': 'EEE', 'electrical': 'EEE', 'electrical and electronics': 'EEE',
  'me': 'ME', 'mechanical': 'ME', 'mechanical engineering': 'ME',
  'ce': 'CE', 'civil': 'CE', 'civil engineering': 'CE',
  'ise': 'ISE', 'information science': 'ISE', 'information science and engineering': 'ISE',
  'it': 'IT', 'information technology': 'IT',
};

/** Extract department code from query text, returns null if not found */
function extractDepartment(q: string): string | null {
  const patterns = [
    /(?:department|dept|branch|from)\s*[:\s]*(CSE|AIML|AI|ML|ECE|EEE|ME|CE|ISE|IT)\b/i,
    /\b(CSE|AIML|ECE|EEE|ME|CE|ISE|IT)\b/i,
    /from\s+(CSE|AIML|AI|ML|ECE|EEE|ME|CE|ISE|IT)\b/i,
    /(?:in|of|:)\s*(CSE|AIML|AI|ML|ECE|EEE|ME|CE|ISE|IT)\b/i,
  ];
  for (const p of patterns) {
    const m = q.match(p);
    if (m) return m[1].toUpperCase() === 'AI' || m[1].toUpperCase() === 'ML' ? 'AIML' : m[1].toUpperCase();
  }
  // Check synonyms
  for (const [syn, code] of Object.entries(DEPT_SYNONYMS)) {
    if (q.includes(syn)) return code;
  }
  return null;
}

/** Find standalone numbers in the query with optional context words */
function extractNumbers(q: string): number[] {
  const nums: number[] = [];
  const matches = q.matchAll(/\b(\d+(?:\.\d+)?)\b/g);
  for (const m of matches) nums.push(parseFloat(m[1]));
  return nums;
}

/** Detect USN-like pattern */
function extractUsn(q: string): string | null {
  const m = q.match(/\b\d[A-Za-z]{2}\d{2}[A-Za-z]{2}\d{3}\b/);
  return m ? m[0].toUpperCase() : null;
}

/** Detect email-like pattern */
function extractEmail(q: string): string | null {
  const m = q.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  return m ? m[0].toLowerCase() : null;
}

/** Check if a word looks like a person name (capitalizable, >=2 letters, not a keyword/dept/number) */
function looksLikeName(word: string): boolean {
  const clean = word.replace(/[^a-zA-Z]/g, '');
  if (clean.length < 2) return false;
  const lc = clean.toLowerCase();
  if (isKeyword(lc)) return false;
  if (lc in DEPT_SYNONYMS) return false;
  if (['gpa', 'cgpa', 'sem', 'semester', 'grade', 'marks', 'score', 'attendance',
       'usn', 'email', 'phone', 'status', 'notes', 'name', 'department', 'dept'].includes(lc)) return false;
  return true;
}

export function parseLocalFallback(query: string): AiSearchFilters {
  const q = query.toLowerCase().trim();
  const filters: AiSearchFilters = {};
  const words = q.split(/\s+/).filter(Boolean);

  // ── USN ──
  const usn = extractUsn(q);
  if (usn) filters.usn = { operator: 'contains', value: usn };

  // ── Email ──
  const email = extractEmail(q);
  if (email) filters.email = email;

  // ── Status ──
  if (/\b(active|currently enrolled|enrolled|current)\b/.test(q)) {
    filters.status = 'active';
  } else if (/\b(inactive|not active|dropped|left|exited)\b/.test(q)) {
    filters.status = 'inactive';
  } else if (/\b(graduated|alumni|completed|passed out|passedout)\b/.test(q)) {
    filters.status = 'graduated';
  }

  // ── Department ──
  const dept = extractDepartment(q);
  if (dept) filters.department = dept;

  // ── Semester / Year ──
  const exactSem = q.match(/(?:semester|sem)\s*(\d)/i);
  if (exactSem) {
    filters.semester = parseInt(exactSem[1], 10);
  } else if (/\bfinal\s*year\b/.test(q) || /\blast\s*year\b/.test(q) || /\bfourth\s*year\b/.test(q)) {
    filters.semester = 8;
  } else if (/\bfirst\s*year\b/.test(q) || /\bfreshman\b/.test(q)) {
    filters.semester = 1;
  } else if (/\bsecond\s*year\b/.test(q) || /\bsophomore\b/.test(q)) {
    filters.semester = { operator: 'between', value: 3, value2: 4 };
  } else if (/\bthird\s*year\b/.test(q) || /\bjunior\b/.test(q)) {
    filters.semester = { operator: 'between', value: 5, value2: 6 };
  } else if (!filters.semester) {
    const yearNum = q.match(/\byear\s*(\d)\b/i);
    if (yearNum) {
      const y = parseInt(yearNum[1], 10);
      if (y === 1) filters.semester = 1;
      else if (y === 2) filters.semester = { operator: 'between', value: 3, value2: 4 };
      else if (y === 3) filters.semester = { operator: 'between', value: 5, value2: 6 };
      else if (y === 4) filters.semester = 8;
    }
  }

  // ── Grade level ──
  const gradeMatch = q.match(/(?:grade|class|level)\s*(\d+)/i);
  if (gradeMatch) {
    filters.grade_level = { operator: 'contains', value: gradeMatch[1] };
  } else if (/\b(freshman|fresher)\b/.test(q)) {
    filters.grade_level = { operator: 'contains', value: '1' };
  } else if (/\bsophomore\b/.test(q)) {
    filters.grade_level = { operator: 'contains', value: '2' };
  } else if (/\bjunior\b/.test(q)) {
    filters.grade_level = { operator: 'contains', value: '3' };
  } else if (/\bsenior\b/.test(q) && !filters.semester) {
    filters.grade_level = { operator: 'contains', value: '4' };
  }

  // ── Name extraction ──
  const numbers = extractNumbers(q);

  let capturedName: string | null = null;

  // "named / called / name is X"
  const explicitName = q.match(/(?:named|called|name\s+(?:is|like))\s+(\w+)/i);
  if (explicitName) capturedName = explicitName[1];

  // "find/show/search X"
  if (!capturedName) {
    const actionName = q.match(/(?:find|show|search|list)\s+(\w+)/i);
    if (actionName && looksLikeName(actionName[1])) capturedName = actionName[1];
  }

  // "X student"
  if (!capturedName) {
    const xStudent = q.match(/(\w+)\s+student/i);
    if (xStudent && looksLikeName(xStudent[1])) capturedName = xStudent[1];
  }

  // Single word that looks like a name (2+ letters, not keyword/dept/number)
  if (!capturedName && words.length <= 3) {
    for (const w of words) {
      const clean = w.replace(/[^a-zA-Z]/g, '');
      if (looksLikeName(clean)) { capturedName = clean; break; }
    }
  }

  // Two consecutive words that both look like names → first_name + last_name
  if (!capturedName) {
    for (let i = 0; i < words.length - 1; i++) {
      const w1 = words[i].replace(/[^a-zA-Z]/g, '');
      const w2 = words[i + 1].replace(/[^a-zA-Z]/g, '');
      if (w1.length >= 2 && w2.length >= 2 && !isKeyword(w1.toLowerCase()) && !isKeyword(w2.toLowerCase()) &&
          !(w1.toLowerCase() in DEPT_SYNONYMS) && !(w2.toLowerCase() in DEPT_SYNONYMS) &&
          !['gpa', 'cgpa', 'marks', 'score', 'attendance'].includes(w1.toLowerCase()) &&
          !['gpa', 'cgpa', 'marks', 'score', 'attendance'].includes(w2.toLowerCase())) {
        filters.first_name = { operator: 'contains', value: w1 };
        filters.last_name = { operator: 'contains', value: w2 };
        capturedName = ''; /* mark as handled */
        break;
      }
    }
  }

  if (capturedName && capturedName.length > 0) {
    filters.first_name = { operator: 'contains', value: capturedName };
  }

  // ── Number-based filters (attendance, marks, gpa) ──
  for (const num of numbers) {
    if (num > 100 || (num >= 0 && num <= 10 && /\b(sem(ester)?|year)\b/i.test(q) && num >= 1 && num <= 8)) continue;

    // "X% attendance", "attendance X%", "attendance X"
    const attPercent = q.match(/(?:attendance\s*(?:of\s*)?)(\d+(?:\.\d+)?)\s*%/i);
    const attVal = q.match(/(\d+(?:\.\d+)?)\s*%\s*attendance/i);
    const attBelow = q.match(/attendance\s*(?:below|under|less|fewer|<\s*|<=\s*|at\s+most)\s*(\d+(?:\.\d+)?)/i);
    const attAbove = q.match(/attendance\s*(?:above|over|greater|more|higher|>\s*|>=\s*|at\s+least)\s*(\d+(?:\.\d+)?)/i);
    const attBetween = q.match(/attendance\s*(?:between)\s*(\d+(?:\.\d+)?)\s*(?:and|to|-)\s*(\d+(?:\.\d+)?)/i);
    const attLow = /\b(low|poor|bad|worst|irregular)\s+attendance\b/.test(q);
    const attHigh = /\b(good|high|regular|best)\s+attendance\b/.test(q);

    if (attBetween) {
      filters.attendance = { operator: 'between', value: parseFloat(attBetween[1]), value2: parseFloat(attBetween[2]) };
    } else if (attBelow || attLow) {
      filters.attendance = { operator: 'lt', value: attBelow ? parseFloat(attBelow[1]) : 75 };
    } else if (attAbove || attHigh) {
      filters.attendance = { operator: 'gte', value: attAbove ? parseFloat(attAbove[1]) : 75 };
    } else if (attPercent) {
      filters.attendance = { operator: 'gte', value: parseFloat(attPercent[1]) };
    } else if (attVal) {
      filters.attendance = { operator: 'gte', value: parseFloat(attVal[1]) };
    }

    // Marks: "marks X", "X marks", "scored X", "score above/below X"
    const marksAbove = q.match(/(?:marks?|score|scored)\s*(?:above|over|greater|more|higher|>\s*|>=\s*|at\s+least)\s*(\d+(?:\.\d+)?)/i);
    const marksBelow = q.match(/(?:marks?|score|scored)\s*(?:below|under|less|fewer|<\s*|<=\s*|at\s+most)\s*(\d+(?:\.\d+)?)/i);
    const marksBetween = q.match(/(?:marks?|score)\s*(?:between)\s*(\d+(?:\.\d+)?)\s*(?:and|to|-)\s*(\d+(?:\.\d+)?)/i);
    const marksExact = q.match(/(?:marks?|score|scored)\s*(?:of\s*)?(\d+(?:\.\d+)?)\b/i);
    const highPerformer = /\b(high|top|best|excellent|good|bright)\s+(performers?|scorers?|students|marks)\b/.test(q);
    const lowPerformer = /\b(low|poor|bad|weak|struggling)\s+(performers?|scorers?|students|marks)\b/.test(q);

    if (marksBetween) {
      filters.marks = { operator: 'between', value: parseFloat(marksBetween[1]), value2: parseFloat(marksBetween[2]) };
    } else if (marksAbove || highPerformer) {
      filters.marks = { operator: 'gt', value: marksAbove ? parseFloat(marksAbove[1]) : 75 };
    } else if (marksBelow || lowPerformer) {
      filters.marks = { operator: 'lt', value: marksBelow ? parseFloat(marksBelow[1]) : 40 };
    } else if (marksExact) {
      filters.marks = { operator: 'gt', value: parseFloat(marksExact[1]) };
    }

    // "scored/got X" without explicit marks keyword
    if (!filters.marks && !filters.attendance) {
      const scored = q.match(/(?:scored?|got|have|with)\s+(?:above|over|more\s+than|>\s*)\s*(\d+(?:\.\d+)?)\s*(?:marks?|score)?/i);
      if (scored) filters.marks = { operator: 'gt', value: parseFloat(scored[1]) };
    }

    // GPA: "gpa X", "cgpa X", "gpa above/below X"
    const gpaAbove = q.match(/(?:gpa|cgpa)\s*(?:above|over|greater|more|higher|>\s*|>=\s*|at\s+least)\s*(\d+(?:\.\d+)?)/i);
    const gpaBelow = q.match(/(?:gpa|cgpa)\s*(?:below|under|less|fewer|<\s*|<=\s*|at\s+most)\s*(\d+(?:\.\d+)?)/i);
    const gpaBetween = q.match(/(?:gpa|cgpa)\s*(?:between)\s*(\d+(?:\.\d+)?)\s*(?:and|to|-)\s*(\d+(?:\.\d+)?)/i);

    if (gpaBetween) {
      filters.gpa = { operator: 'between', value: parseFloat(gpaBetween[1]), value2: parseFloat(gpaBetween[2]) };
    } else if (gpaAbove) {
      filters.gpa = { operator: 'gte', value: parseFloat(gpaAbove[1]) };
    } else if (gpaBelow) {
      filters.gpa = { operator: 'lte', value: parseFloat(gpaBelow[1]) };
    } else if (/\b(gpa|cgpa)\b/i.test(q) && !filters.gpa) {
      const gpaVal = q.match(/(?:gpa|cgpa)\s*(?:of\s*)?(\d+(?:\.\d+)?)/i);
      if (gpaVal) filters.gpa = { operator: 'gte', value: parseFloat(gpaVal[1]) };
    }

    // "high CGPA" / "low CGPA"
    if (!filters.gpa) {
      if (/\b(high|good|excellent|best)\s+(gpa|cgpa)\b/.test(q)) filters.gpa = { operator: 'gte', value: 8 };
      if (/\b(low|poor|bad|worst)\s+(gpa|cgpa)\b/.test(q)) filters.gpa = { operator: 'lt', value: 6 };
    }
  }

  // ── "failed" → marks < 40 or attendance < 75 ──
  if (/\bfailed?\b/.test(q) || /\b(flunked|fail)\b/.test(q)) {
    if (!filters.marks) filters.marks = { operator: 'lt', value: 40 };
  }

  // ── "passed" → marks >= 40 ──
  if (/\b(passed?|pass)\b/.test(q) && !filters.marks) {
    filters.marks = { operator: 'gte', value: 40 };
  }

  // ── "low attendance" → attendance < 75 ──
  if (/\b(low|poor|bad|worst|irregular)\s+attendance\b/.test(q) && !filters.attendance) {
    filters.attendance = { operator: 'lt', value: 75 };
  }
  if (/\b(good|high|regular|best)\s+attendance\b/.test(q) && !filters.attendance) {
    filters.attendance = { operator: 'gte', value: 75 };
  }

  // ── Top / Bottom N ──
  const topMatch = q.match(/top\s+(\d+)/i);
  if (topMatch) {
    filters.limit = parseInt(topMatch[1], 10);
    if (/\b(marks?|score)\b/.test(q)) filters.order_by = { field: 'marks', direction: 'desc' };
    else if (/\b(gpa|cgpa)\b/.test(q)) filters.order_by = { field: 'gpa', direction: 'desc' };
    else if (/\battendance\b/.test(q)) filters.order_by = { field: 'attendance', direction: 'desc' };
    else filters.order_by = { field: 'marks', direction: 'desc' };
  }

  const bottomMatch = q.match(/(?:bottom|last|worst|lowest)\s+(\d+)/i);
  if (bottomMatch && !filters.limit) {
    filters.limit = parseInt(bottomMatch[1], 10);
    if (/\b(marks?|score)\b/.test(q)) filters.order_by = { field: 'marks', direction: 'asc' };
    else if (/\b(gpa|cgpa)\b/.test(q)) filters.order_by = { field: 'gpa', direction: 'asc' };
    else if (/\battendance\b/.test(q)) filters.order_by = { field: 'attendance', direction: 'asc' };
    else filters.order_by = { field: 'created_at', direction: 'desc' };
  }

  // ── "high/low marks" without numbers ──
  if (/\b(high|good|excellent|best|bright)\s+(marks?|scorers?|performers?)\b/.test(q) && !filters.marks) {
    filters.marks = { operator: 'gt', value: 75 };
  }
  if (/\b(low|poor|bad|weak|struggling)\s+(marks?|scorers?|performers?)\b/.test(q) && !filters.marks) {
    filters.marks = { operator: 'lt', value: 40 };
  }

  return filters;
}

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

  return `You are a query parser for a student database. Convert natural language queries into structured JSON filters.

Available fields:
${fieldsDesc}

Rules:
1. Respond ONLY with valid JSON — no markdown, no code fences, no extra text.
2. For exact matches use the field name directly with a string value: { "department": "CSE" }
3. For comparisons use an object with operator and value:
   Operators: "eq", "neq", "gt", "gte", "lt", "lte", "contains", "between"
   Examples:
   - "attendance below 75%" → { "attendance": { "operator": "lt", "value": 75 } }
   - "marks above 85" → { "marks": { "operator": "gt", "value": 85 } }
   - "attendance between 60 and 80" → { "attendance": { "operator": "between", "value": 60, "value2": 80 } }
   - "name containing Rahul" → { "first_name": { "operator": "contains", "value": "Rahul" } }
4. For "top N" queries add a "limit" field and optionally "order_by":
   - "top 10 students by marks" → { "order_by": { "field": "marks", "direction": "desc" }, "limit": 10 }
5. For "final year" / "last semester" use the appropriate field comparison.
6. Combine multiple conditions in a single "filters" object as separate keys (AND logic).
7. If the query mentions a name without specifying first/last, match against first_name with "contains".
8. If the query cannot be understood, return: { "filters": {}, "explanation": "Unable to understand search query. Please try again." }

Example outputs:
Query: "Show CSE students with attendance below 75%"
{"filters":{"department":"CSE","attendance":{"operator":"lt","value":75}},"explanation":"CSE students with attendance under 75%"}

Query: "Find students who scored above 85 marks"
{"filters":{"marks":{"operator":"gt","value":85}},"explanation":"Students with marks above 85"}

Query: "Show top 10 students by marks"
{"filters":{"order_by":{"field":"marks","direction":"desc"},"limit":10},"explanation":"Top 10 students by marks"}

Query: "Show final year students"
{"filters":{"grade_level":{"operator":"contains","value":"12"}},"explanation":"Final year students"}

Query: "Find students named Rahul"
{"filters":{"first_name":{"operator":"contains","value":"Rahul"}},"explanation":"Students named Rahul"}`;
}

function buildUserPrompt(query: string): string {
  return `Convert this query to student database filters: "${query}"`;
}

export async function callAiApi(query: string, apiKey: string): Promise<AiResponse> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(query);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
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
          temperature: 0.1,
          maxOutputTokens: 512,
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
  return ['active', 'inactive', 'graduated', 'all', 'top', 'the', 'best', 'good', 'bad', 'me', 'my', 'students', 'student', 'show', 'find', 'search', 'list', 'get', 'display', 'fetch', 'load', 'view', 'any', 'some', 'with', 'having', 'that', 'who', 'which', 'whose', 'their'].includes(word.toLowerCase());
}

export function parseLocalFallback(query: string): AiSearchFilters {
  const q = query.toLowerCase().trim();
  const filters: AiSearchFilters = {};
  const words = q.split(/\s+/).filter(Boolean);

  // Status filters
  if (/\b(active|currently enrolled|enrolled)\b/.test(q)) {
    filters.status = 'active';
  } else if (/\b(inactive|not active|dropped)\b/.test(q)) {
    filters.status = 'inactive';
  } else if (/\b(graduated|alumni|completed)\b/.test(q)) {
    filters.status = 'graduated';
  }

  // Name filters — try explicit patterns first
  let capturedName: string | null = null;

  // "students/named/called/called X", "name is X"
  const explicitNameMatch = q.match(/(?:students?\s+(?:named|called|like)\s+|named\s+|called\s+|name\s+(?:is|like)\s+)(\w+)/i);
  if (explicitNameMatch) {
    capturedName = explicitNameMatch[1];
  }

  // "find/show/search X student" where X is not a keyword
  if (!capturedName) {
    const findNameMatch = q.match(/(?:find|show|search)\s+(\w+)\s+student/i);
    if (findNameMatch && !isKeyword(findNameMatch[1])) {
      capturedName = findNameMatch[1];
    }
  }

  // "find/show/search/list X" at end of query or as a single word (not a keyword, not a number)
  if (!capturedName && words.length <= 3) {
    for (const word of words) {
      const clean = word.replace(/[^a-zA-Z]/g, '');
      if (clean.length >= 2 && !isKeyword(clean) && !/^\d+$/.test(clean) && !['cse', 'aiml', 'ece', 'eee', 'me', 'ce', 'ise', 'it', 'gpa'].includes(clean)) {
        capturedName = clean;
        break;
      }
    }
  }

  if (capturedName) {
    filters.first_name = { operator: 'contains', value: capturedName };
  }

  // Department filters
  const deptMatch = q.match(/(?:department|dept|branch|from)\s*[:\s]*(CSE|AIML|AI|ML|ECE|EEE|ME|CE|ISE|IT|CH|BT|AE|RE|PE|SE)/i)
    || q.match(/\b(CSE|AIML|ECE|EEE|ME|CE|ISE|IT)\b/i);
  if (deptMatch) {
    const dept = deptMatch[1].toUpperCase();
    filters.department = dept === 'AI' || dept === 'ML' ? 'AIML' : dept;
  }

  // "from department" pattern
  if (!filters.department) {
    const fromDeptMatch = q.match(/from\s+(CSE|AIML|AI|ML|ECE|EEE|ME|CE|ISE|IT)\b/i);
    if (fromDeptMatch) {
      const dept = fromDeptMatch[1].toUpperCase();
      filters.department = dept === 'AI' || dept === 'ML' ? 'AIML' : dept;
    }
  }

  // "department of/equal to X"
  if (!filters.department) {
    const deptEqMatch = q.match(/(?:dept|department)\s+(?:of|is|=|:)\s*(CSE|AIML|AI|ML|ECE|EEE|ME|CE|ISE|IT)\b/i);
    if (deptEqMatch) {
      const dept = deptEqMatch[1].toUpperCase();
      filters.department = dept === 'AI' || dept === 'ML' ? 'AIML' : dept;
    }
  }

  // Semester / year filters
  const semMatch = q.match(/(?:semester|sem)\s*(\d)/i);
  if (semMatch) {
    filters.semester = parseInt(semMatch[1], 10);
  }
  if (/\bfinal\s*year\b/.test(q) || /\blast\s*year\b/.test(q)) {
    filters.semester = 8;
  }
  if (/\bfirst\s*year\b/.test(q)) {
    filters.semester = 1;
  }
  if (/\bsecond\s*year\b/.test(q) || /\bsophomore\b/.test(q)) {
    filters.semester = { operator: 'between', value: 3, value2: 4 };
  }
  if (/\bthird\s*year\b/.test(q) || /\bjunior\b/.test(q)) {
    filters.semester = { operator: 'between', value: 5, value2: 6 };
  }
  // "year N" pattern (year 1, year 2, etc.)
  if (!filters.semester) {
    const yearNumMatch = q.match(/\byear\s*(\d)\b/i);
    if (yearNumMatch) {
      const y = parseInt(yearNumMatch[1], 10);
      if (y === 1) {
        filters.semester = 1;
      } else if (y === 2) {
        filters.semester = { operator: 'between', value: 3, value2: 4 };
      } else if (y === 3) {
        filters.semester = { operator: 'between', value: 5, value2: 6 };
      } else if (y === 4) {
        filters.semester = 8;
      }
    }
  }

  // Grade level filters
  const gradeMatch = q.match(/(?:grade|class|level)\s*(\d+)/i);
  if (gradeMatch) {
    filters.grade_level = { operator: 'contains', value: gradeMatch[1] };
  }

  // GPA filters — support "cgpa" and "gpa"
  const gpaPattern = /\b(gpa|cgpa)\b/i;
  if (gpaPattern.test(q)) {
    const gpaAboveMatch = q.match(/\bgpa\s*(?:above|over|greater|more|higher|>\s*|>=\s*|at\s+least)\s*(\d+(?:\.\d+)?)/i);
    const gpaBelowMatch = q.match(/\bgpa\s*(?:below|under|less|fewer|<\s*|<=\s*|at\s+most)\s*(\d+(?:\.\d+)?)/i);
    if (gpaAboveMatch) {
      filters.gpa = { operator: 'gte', value: parseFloat(gpaAboveMatch[1]) };
    } else if (gpaBelowMatch) {
      filters.gpa = { operator: 'lte', value: parseFloat(gpaBelowMatch[1]) };
    } else {
      const gpaGenericMatch = q.match(/\bgpa\s*(?:of\s*)?(\d+(?:\.\d+)?)/i);
      if (gpaGenericMatch && !/\b(above|below|over|under|less|more|greater|higher|than)\b/.test(q)) {
        filters.gpa = { operator: 'gte', value: parseFloat(gpaGenericMatch[1]) };
      }
    }
  }

  // Attendance filters
  const attBelowMatch = q.match(/attendance\s*(?:below|under|less|fewer|<\s*|<=\s*|at\s+most)\s*(\d+(?:\.\d+)?)/i);
  const attAboveMatch = q.match(/attendance\s*(?:above|over|greater|more|higher|>\s*|>=\s*|at\s+least)\s*(\d+(?:\.\d+)?)/i);
  const attBetweenMatch = q.match(/attendance\s*(?:between)\s*(\d+(?:\.\d+)?)\s*(?:and|to|-)\s*(\d+(?:\.\d+)?)/i);
  if (attBetweenMatch) {
    filters.attendance = { operator: 'between', value: parseFloat(attBetweenMatch[1]), value2: parseFloat(attBetweenMatch[2]) };
  } else if (attBelowMatch) {
    filters.attendance = { operator: 'lt', value: parseFloat(attBelowMatch[1]) };
  } else if (attAboveMatch) {
    filters.attendance = { operator: 'gt', value: parseFloat(attAboveMatch[1]) };
  } else {
    const attGenericMatch = q.match(/attendance\s*(?:of\s*)?(\d+(?:\.\d+)?)/i);
    if (attGenericMatch) {
      filters.attendance = { operator: 'gte', value: parseFloat(attGenericMatch[1]) };
    }
  }

  // Marks filters
  const marksAboveMatch = q.match(/marks?\s*(?:above|over|greater|more|higher|>\s*|>=\s*|at\s+least|scored?\s*(?:above|over|more|greater))\s*(\d+(?:\.\d+)?)/i);
  const marksBelowMatch = q.match(/marks?\s*(?:below|under|less|fewer|<\s*|<=\s*|at\s+most)\s*(\d+(?:\.\d+)?)/i);
  if (marksAboveMatch) {
    filters.marks = { operator: 'gt', value: parseFloat(marksAboveMatch[1]) };
  } else if (marksBelowMatch) {
    filters.marks = { operator: 'lt', value: parseFloat(marksBelowMatch[1]) };
  }

  // "whose marks are above/below X"
  if (!filters.marks) {
    const marks2 = q.match(/(?:scored?|got|have|with)\s+(?:above|over|more\s+than|>\s*)\s*(\d+(?:\.\d+)?)\s*(?:marks?|score)/i);
    if (marks2) {
      filters.marks = { operator: 'gt', value: parseFloat(marks2[1]) };
    }
  }

  // Top N students — detect field for ordering
  const topMatch = q.match(/top\s+(\d+)/i);
  if (topMatch) {
    filters.limit = parseInt(topMatch[1], 10);
    if (/\b(marks?|score)\b/.test(q)) {
      filters.order_by = { field: 'marks', direction: 'desc' };
    } else if (/\b(gpa|cgpa)\b/.test(q)) {
      filters.order_by = { field: 'gpa', direction: 'desc' };
    } else if (/\battendance\b/.test(q)) {
      filters.order_by = { field: 'attendance', direction: 'desc' };
    } else {
      filters.order_by = { field: 'marks', direction: 'desc' };
    }
  }

  // Last / bottom N students
  const bottomMatch = q.match(/(?:bottom|last|worst|lowest)\s+(\d+)/i);
  if (bottomMatch && !filters.limit) {
    filters.limit = parseInt(bottomMatch[1], 10);
    if (/\b(marks?|score)\b/.test(q)) {
      filters.order_by = { field: 'marks', direction: 'asc' };
    } else if (/\b(gpa|cgpa)\b/.test(q)) {
      filters.order_by = { field: 'gpa', direction: 'asc' };
    } else if (/\battendance\b/.test(q)) {
      filters.order_by = { field: 'attendance', direction: 'asc' };
    } else {
      filters.order_by = { field: 'created_at', direction: 'desc' };
    }
  }

  return filters;
}

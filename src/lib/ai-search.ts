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

export function parseLocalFallback(query: string): AiSearchFilters {
  const q = query.toLowerCase().trim();
  const filters: AiSearchFilters = {};

  // Status filters
  if (/\b(active|currently enrolled|enrolled)\b/.test(q)) {
    filters.status = 'active';
  } else if (/\b(inactive|not active|dropped)\b/.test(q)) {
    filters.status = 'inactive';
  } else if (/\b(graduated|alumni|completed)\b/.test(q)) {
    filters.status = 'graduated';
  }

  // Name filters
  const nameMatch = q.match(/(?:named?|name\s+(?:is|contains?|like))\s+(\w+)/i);
  if (nameMatch) {
    filters.first_name = { operator: 'contains', value: nameMatch[1] };
  }

  // "Find X students" pattern — X might be a name
  const findNameMatch = q.match(/(?:find|show|search)\s+(\w+)\s+student/i);
  if (findNameMatch && !['active', 'inactive', 'graduated', 'all', 'top', 'the', 'best', 'good', 'bad'].includes(findNameMatch[1].toLowerCase())) {
    filters.first_name = { operator: 'contains', value: findNameMatch[1] };
  }

  // Department filters
  const deptMatch = q.match(/(?:department|dept|branch|from)\s*[:\s]*(CSE|AIML|AI|ML|ECE|EEE|ME|CE|ISE|IT|CH|BT|AE|RE|PE|SE)/i)
    || q.match(/\b(CSE|AIML|ECE|EEE|ME|CE|ISE|IT)\b/);
  if (deptMatch) {
    const dept = deptMatch[1].toUpperCase();
    filters.department = dept === 'AI' ? 'AIML' : dept;
  }

  // Semester filters
  const semMatch = q.match(/(?:semester|sem|sem\s*)\s*(\d)/i);
  if (semMatch) {
    filters.semester = parseInt(semMatch[1], 10);
  }
  if (/\bfinal\s*year\b/.test(q)) {
    filters.semester = 8;
  }
  if (/\bfirst\s*year\b/.test(q)) {
    filters.semester = 1;
  }
  if (/\bsecond\s*year\b/.test(q)) {
    filters.semester = { operator: 'between', value: 3, value2: 4 };
  }
  if (/\bthird\s*year\b/.test(q)) {
    filters.semester = { operator: 'between', value: 5, value2: 6 };
  }

  // Grade level filters
  const gradeMatch = q.match(/(?:grade|class|level)\s*(\d+)/i);
  if (gradeMatch) {
    filters.grade_level = { operator: 'contains', value: gradeMatch[1] };
  }

  // GPA filters
  const gpaAboveMatch = q.match(/gpa\s*(?:above|over|greater|more|higher|>\s*|>=\s*|at\s+least)\s*(\d+(?:\.\d+)?)/i);
  const gpaBelowMatch = q.match(/gpa\s*(?:below|under|less|fewer|<\s*|<=\s*|at\s+most)\s*(\d+(?:\.\d+)?)/i);
  if (gpaAboveMatch) {
    filters.gpa = { operator: 'gte', value: parseFloat(gpaAboveMatch[1]) };
  } else if (gpaBelowMatch) {
    filters.gpa = { operator: 'lte', value: parseFloat(gpaBelowMatch[1]) };
  } else {
    const gpaGenericMatch = q.match(/gpa\s*(?:of\s*)?(\d+(?:\.\d+)?)/i);
    if (gpaGenericMatch && !/\b(above|below|over|under|less|more|greater|higher|than)\b/.test(q)) {
      filters.gpa = { operator: 'gte', value: parseFloat(gpaGenericMatch[1]) };
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

  // Top N students
  const topMatch = q.match(/top\s+(\d+)/i);
  if (topMatch) {
    filters.limit = parseInt(topMatch[1], 10);
    filters.order_by = { field: 'marks', direction: 'desc' };
  }

  // Last N students
  const lastMatch = q.match(/last\s+(\d+)/i);
  if (lastMatch && !filters.limit) {
    filters.limit = parseInt(lastMatch[1], 10);
    filters.order_by = { field: 'created_at', direction: 'desc' };
  }

  return filters;
}

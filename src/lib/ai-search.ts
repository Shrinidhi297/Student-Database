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
  year?: string | FilterCondition;
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
  explanation?: string;
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
  year: fieldSchema.optional(),
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
  { name: 'year', type: 'string', description: 'Year or class level (e.g. Year 10, Freshman, etc.)' },
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

  return `You are an intelligent query parser for a student database. Convert natural language queries into structured JSON filters.

Available fields:
${fieldsDesc}

RESPONSE RULES:
1. Respond ONLY with valid JSON — no markdown, no code fences, no explanations outside the JSON.
2. The response must be a single JSON object with "filters" key and optional "explanation" key.

FILTER CONSTRUCTION RULES:

A) EXACT MATCH — use the field name directly with a string/number value:
   - "CSE students" → { "department": "CSE" }
   - "semester 3" → { "semester": 3 }
   - "active students" → { "status": "active" }

B) COMPARISONS — use an object with "operator" and "value":
   Operators: "eq", "neq", "gt", "gte", "lt", "lte", "contains", "between"
   - "attendance below 75%" → { "attendance": { "operator": "lt", "value": 75 } }
   - "marks above 85" → { "marks": { "operator": "gt", "value": 85 } }
   - "GPA at least 3.5" → { "gpa": { "operator": "gte", "value": 3.5 } }
   - "attendance between 60 and 80" → { "attendance": { "operator": "between", "value": 60, "value2": 80 } }

C) TEXT SEARCH — use "contains" for partial matches:
   - "name containing Rahul" → { "first_name": { "operator": "contains", "value": "Rahul" } }
   - "email with gmail" → { "email": { "operator": "contains", "value": "gmail" } }

D) NEGATION — use "neq" operator:
   - "not active students" → { "status": { "operator": "neq", "value": "active" } }
   - "not from CSE" → { "department": { "operator": "neq", "value": "CSE" } }

E) TOP/BOTTOM QUERIES — combine "limit" and "order_by":
   - "top 10 students by marks" → { "order_by": { "field": "marks", "direction": "desc" }, "limit": 10 }
   - "bottom 5 by GPA" → { "order_by": { "field": "gpa", "direction": "asc" }, "limit": 5 }
   - "best 3 students" → { "order_by": { "field": "marks", "direction": "desc" }, "limit": 3 }

F) YEAR/SEMESTER MAPPING:
   - "first year" / "freshman" → semester 1
   - "second year" / "sophomore" → semester between 3 and 4
   - "third year" / "junior" → semester between 5 and 6
   - "final year" / "senior" / "last year" → semester 8
   - "semester N" → semester N directly

G) MULTIPLE CONDITIONS — combine all filters in the "filters" object (AND logic):
   - "CSE students with GPA above 3.5" → { "department": "CSE", "gpa": { "operator": "gt", "value": 3.5 } }

H) NAME HANDLING — if a name is mentioned without specifying first/last, use first_name with "contains":
   - "find Rahul" → { "first_name": { "operator": "contains", "value": "Rahul" } }
   - "students named Priya" → { "first_name": { "operator": "contains", "value": "Priya" } }

I) DATE QUERIES — enrollment_date is in YYYY-MM-DD format:
   - "enrolled in 2024" → { "enrollment_date": { "operator": "contains", "value": "2024" } }
   - "enrolled after January 2024" → { "enrollment_date": { "operator": "gte", "value": "2024-01-01" } }

J) UNUNDERSTANDABLE QUERIES — return empty filters:
   { "filters": {}, "explanation": "Unable to understand search query. Please try again." }

EXAMPLES:
Query: "Show CSE students with attendance below 75%"
→ {"filters":{"department":"CSE","attendance":{"operator":"lt","value":75}},"explanation":"CSE students with attendance under 75%"}

Query: "Find students who scored above 85 marks"
→ {"filters":{"marks":{"operator":"gt","value":85}},"explanation":"Students with marks above 85"}

Query: "Show top 10 students by marks"
→ {"filters":{"order_by":{"field":"marks","direction":"desc"},"limit":10},"explanation":"Top 10 students by marks"}

Query: "Show final year students"
→ {"filters":{"semester":8},"explanation":"Final year students (semester 8)"}

Query: "Find students named Rahul"
→ {"filters":{"first_name":{"operator":"contains","value":"Rahul"}},"explanation":"Students named Rahul"}

Query: "Not graduated students from ECE"
→ {"filters":{"status":{"operator":"neq","value":"graduated"},"department":"ECE"},"explanation":"Non-graduated ECE students"}

Query: "Students with GPA between 3 and 4"
→ {"filters":{"gpa":{"operator":"between","value":3,"value2":4}},"explanation":"Students with GPA between 3 and 4"}

Query: "Find gmail users"
→ {"filters":{"email":{"operator":"contains","value":"gmail"}},"explanation":"Students with gmail email"}`;
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

  // Status filters — with negation support
  const negated = /\b(not|no|without|excluding|except)\b/.test(q);
  if (/\b(active|currently enrolled|enrolled)\b/.test(q)) {
    filters.status = negated ? { operator: 'neq', value: 'active' } : 'active';
  } else if (/\b(inactive|not active|dropped|discontinued)\b/.test(q)) {
    filters.status = negated ? { operator: 'neq', value: 'inactive' } : 'inactive';
  } else if (/\b(graduated|alumni|completed|passed out)\b/.test(q)) {
    filters.status = negated ? { operator: 'neq', value: 'graduated' } : 'graduated';
  }

  // Name filters — try explicit patterns first (supports multi-word names)
  let capturedName: string | null = null;

  // "students/named/called X Y" (multi-word name support)
  const explicitNameMatch = q.match(/(?:students?\s+(?:named|called|like)\s+|named\s+|called\s+|name\s+(?:is|like)\s+)(\w+(?:\s+\w+)?)/i);
  if (explicitNameMatch) {
    capturedName = explicitNameMatch[1].trim();
  }

  // "find/show/search X student" where X is not a keyword
  if (!capturedName) {
    const findNameMatch = q.match(/(?:find|show|search|look\s+for)\s+(\w+)\s+student/i);
    if (findNameMatch && !isKeyword(findNameMatch[1])) {
      capturedName = findNameMatch[1];
    }
  }

  // "find/show/search X" at end of query or as a single word (not a keyword, not a number)
  if (!capturedName && words.length <= 3) {
    for (const word of words) {
      const clean = word.replace(/[^a-zA-Z]/g, '');
      if (clean.length >= 2 && !isKeyword(clean) && !/^\d+$/.test(clean) && !['cse', 'aiml', 'ece', 'eee', 'me', 'ce', 'ise', 'it', 'gpa', 'cgpa'].includes(clean)) {
        capturedName = clean;
        break;
      }
    }
  }

  if (capturedName) {
    filters.first_name = { operator: 'contains', value: capturedName };
  }

  // Department filters — with negation and more aliases
  const deptMatch = q.match(/(?:department|dept|branch|from)\s*[:\s]*(CSE|AIML|AI|ML|ECE|EEE|ME|CE|ISE|IT|CH|BT|AE|RE|PE|SE)/i)
    || q.match(/\b(CSE|AIML|ECE|EEE|ME|CE|ISE|IT)\b/i);
  if (deptMatch) {
    const dept = deptMatch[1].toUpperCase();
    const deptName = dept === 'AI' || dept === 'ML' ? 'AIML' : dept;
    filters.department = negated ? { operator: 'neq', value: deptName } : deptName;
  }

  // "from department" pattern
  if (!filters.department) {
    const fromDeptMatch = q.match(/from\s+(CSE|AIML|AI|ML|ECE|EEE|ME|CE|ISE|IT)\b/i);
    if (fromDeptMatch) {
      const dept = fromDeptMatch[1].toUpperCase();
      const deptName = dept === 'AI' || dept === 'ML' ? 'AIML' : dept;
      filters.department = negated ? { operator: 'neq', value: deptName } : deptName;
    }
  }

  // "department of/equal to X"
  if (!filters.department) {
    const deptEqMatch = q.match(/(?:dept|department)\s+(?:of|is|=|:)\s*(CSE|AIML|AI|ML|ECE|EEE|ME|CE|ISE|IT)\b/i);
    if (deptEqMatch) {
      const dept = deptEqMatch[1].toUpperCase();
      const deptName = dept === 'AI' || dept === 'ML' ? 'AIML' : dept;
      filters.department = negated ? { operator: 'neq', value: deptName } : deptName;
    }
  }

  // Semester / year filters
  const semMatch = q.match(/(?:semester|sem)\s*(\d)/i);
  if (semMatch) {
    filters.semester = parseInt(semMatch[1], 10);
  }
  if (/\bfinal\s*year\b/.test(q) || /\blast\s*year\b/.test(q) || /\bsenior\b/.test(q)) {
    filters.semester = 8;
  }
  if (/\bfirst\s*year\b/.test(q) || /\bfreshman\b/.test(q)) {
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
  // Year/class filters (e.g. "year 10", "grade 10")
  const gradeMatch = q.match(/(?:grade|class|level)\s*(\d+)/i);
  if (gradeMatch) {
    filters.year = { operator: 'contains', value: gradeMatch[1] };
  }

  // GPA/CGPA filters — supports "cgpa" and "gpa", range queries, and negation
  const gpaPattern = /\b(gpa|cgpa)\b/i;
  if (gpaPattern.test(q)) {
    const gpaAboveMatch = q.match(/\b(?:gpa|cgpa)\s*(?:above|over|greater|more|higher|>\s*|>=\s*|at\s+least)\s*(\d+(?:\.\d+)?)/i);
    const gpaBelowMatch = q.match(/\b(?:gpa|cgpa)\s*(?:below|under|less|fewer|<\s*|<=\s*|at\s+most)\s*(\d+(?:\.\d+)?)/i);
    const gpaBetweenMatch = q.match(/\b(?:gpa|cgpa)\s*(?:between)\s*(\d+(?:\.\d+)?)\s*(?:and|to|-)\s*(\d+(?:\.\d+)?)/i);
    const gpaExactMatch = q.match(/\b(?:gpa|cgpa)\s*(?:of|=|is|:)\s*(\d+(?:\.\d+)?)/i);

    if (gpaBetweenMatch) {
      filters.gpa = { operator: 'between', value: parseFloat(gpaBetweenMatch[1]), value2: parseFloat(gpaBetweenMatch[2]) };
    } else if (gpaAboveMatch) {
      filters.gpa = { operator: 'gte', value: parseFloat(gpaAboveMatch[1]) };
    } else if (gpaBelowMatch) {
      filters.gpa = { operator: 'lte', value: parseFloat(gpaBelowMatch[1]) };
    } else if (gpaExactMatch) {
      filters.gpa = { operator: 'gte', value: parseFloat(gpaExactMatch[1]) };
    } else {
      const gpaGenericMatch = q.match(/\b(?:gpa|cgpa)\s*(?:of\s*)?(\d+(?:\.\d+)?)/i);
      if (gpaGenericMatch && !/\b(above|below|over|under|less|more|greater|higher|than|between)\b/.test(q)) {
        filters.gpa = { operator: 'gte', value: parseFloat(gpaGenericMatch[1]) };
      }
    }
  }

  // Attendance filters — with range and negation support
  const attBetweenMatch = q.match(/attendance\s*(?:between)\s*(\d+(?:\.\d+)?)\s*(?:and|to|-)\s*(\d+(?:\.\d+)?)/i);
  const attBelowMatch = q.match(/attendance\s*(?:below|under|less|fewer|<\s*|<=\s*|at\s+most)\s*(\d+(?:\.\d+)?)/i);
  const attAboveMatch = q.match(/attendance\s*(?:above|over|greater|more|higher|>\s*|>=\s*|at\s+least)\s*(\d+(?:\.\d+)?)/i);
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

  // Marks filters — with range and "scored X" patterns
  const marksBetweenMatch = q.match(/marks?\s*(?:between)\s*(\d+(?:\.\d+)?)\s*(?:and|to|-)\s*(\d+(?:\.\d+)?)/i);
  const marksAboveMatch = q.match(/marks?\s*(?:above|over|greater|more|higher|>\s*|>=\s*|at\s+least|scored?\s*(?:above|over|more|greater))\s*(\d+(?:\.\d+)?)/i);
  const marksBelowMatch = q.match(/marks?\s*(?:below|under|less|fewer|<\s*|<=\s*|at\s+most)\s*(\d+(?:\.\d+)?)/i);
  if (marksBetweenMatch) {
    filters.marks = { operator: 'between', value: parseFloat(marksBetweenMatch[1]), value2: parseFloat(marksBetweenMatch[2]) };
  } else if (marksAboveMatch) {
    filters.marks = { operator: 'gt', value: parseFloat(marksAboveMatch[1]) };
  } else if (marksBelowMatch) {
    filters.marks = { operator: 'lt', value: parseFloat(marksBelowMatch[1]) };
  }

  // "whose marks are above/below X" and "scored X marks"
  if (!filters.marks) {
    const marks2 = q.match(/(?:scored?|got|have|with)\s+(?:above|over|more\s+than|>\s*)\s*(\d+(?:\.\d+)?)\s*(?:marks?|score)/i);
    if (marks2) {
      filters.marks = { operator: 'gt', value: parseFloat(marks2[1]) };
    }
  }

  // "scored X" or "got X" without "marks" keyword
  if (!filters.marks) {
    const marks3 = q.match(/(?:scored?|got)\s+(\d+(?:\.\d+)?)\s*(?:marks?|score|points)/i);
    if (marks3) {
      filters.marks = { operator: 'gte', value: parseFloat(marks3[1]) };
    }
  }

  // Email filters — domain or partial match
  if (!filters.email) {
    const emailDomainMatch = q.match(/(?:email|e-mail|mail)\s*(?:with|from|contains?|having)\s*(\w+(?:\.\w+)?)\b/i);
    if (emailDomainMatch) {
      filters.email = { operator: 'contains', value: emailDomainMatch[1] };
    }
  }

  // USN/student ID filter
  if (!filters.usn) {
    const usnMatch = q.match(/(?:usn|student\s*id|id\s*number)\s*(?:is|of|=|:)?\s*(\w+)/i);
    if (usnMatch) {
      filters.usn = { operator: 'contains', value: usnMatch[1] };
    }
  }

  // Phone number filter
  if (!filters.phone) {
    const phoneMatch = q.match(/(?:phone|mobile|contact|number)\s*(?:is|of|=|:)?\s*([\d\s\-+()]+)/i);
    if (phoneMatch) {
      filters.phone = { operator: 'contains', value: phoneMatch[1].trim() };
    }
  }

  // Enrollment date filters — "enrolled in 2024", "joined 2023", "enrolled after X"
  if (!filters.enrollment_date) {
    const enrolledYearMatch = q.match(/(?:enrolled|joined|admitted|enrollment)\s+(?:in\s+)?(\d{4})/i);
    if (enrolledYearMatch) {
      filters.enrollment_date = { operator: 'contains', value: enrolledYearMatch[1] };
    }
  }
  if (!filters.enrollment_date) {
    const enrolledAfterMatch = q.match(/(?:enrolled|joined|admitted)\s+(?:after|since|from)\s+(\w+\s+\d{4}|\d{4})/i);
    if (enrolledAfterMatch) {
      const dateStr = enrolledAfterMatch[1];
      const parsed = dateStr.match(/(\d{4})/);
      if (parsed) {
        filters.enrollment_date = { operator: 'gte', value: `${parsed[1]}-01-01` };
      }
    }
  }

  // Notes filter
  if (!filters.notes) {
    const notesMatch = q.match(/(?:notes?|remarks?|comments?)\s*(?:contains?|with|having)\s+(.+)/i);
    if (notesMatch) {
      filters.notes = { operator: 'contains', value: notesMatch[1].trim() };
    }
  }

  // Top N students — detect field for ordering
  const topMatch = q.match(/(?:top|best|highest|highest)\s+(\d+)/i);
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
  const bottomMatch = q.match(/(?:bottom|last|worst|lowest|poorest)\s+(\d+)/i);
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

  // "show all" / "list all" / "everyone" — no filter needed
  if (/\b(show|list|get|display|fetch|load|view)\s+(all|everyone|every|whole)\b/.test(q)) {
    return {};
  }

  return filters;
}

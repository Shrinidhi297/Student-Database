import { supabase } from './supabase';
import type { AiSearchFilters, FilterCondition } from './ai-search';

function applyCondition(query: any, field: string, condition: FilterCondition) {
  const { operator, value, value2 } = condition;

  switch (operator) {
    case 'eq':
      return query.eq(field, value);
    case 'neq':
      return query.neq(field, value);
    case 'gt':
      return query.gt(field, value);
    case 'gte':
      return query.gte(field, value);
    case 'lt':
      return query.lt(field, value);
    case 'lte':
      return query.lte(field, value);
    case 'contains':
      return query.ilike(field, `%${value}%`);
    case 'between':
      if (value2 !== undefined) {
        return query.gte(field, value).lte(field, value2);
      }
      return query;
    default:
      return query;
  }
}

export function buildFilterQuery(userId: string, filters: AiSearchFilters) {
  let query: any = supabase.from('students').select('*').eq('user_id', userId);

  const entries = Object.entries(filters) as [string, unknown][];

  for (const [field, value] of entries) {
    if (field === 'limit' || field === 'offset' || field === 'order_by') {
      continue;
    }

    if (value === undefined || value === null) {
      continue;
    }

    const isCondition = typeof value === 'object' && value !== null && 'operator' in value;
    if (isCondition) {
      query = applyCondition(query, field, value as FilterCondition);
    } else if (typeof value === 'string' || typeof value === 'number') {
      query = query.eq(field, value);
    }
  }

  if (filters.order_by) {
    const { field, direction } = filters.order_by;
    query = query.order(field, { ascending: direction === 'asc' });
  }

  if (filters.limit !== undefined) {
    query = query.limit(filters.limit);
  }

  if (filters.offset !== undefined) {
    query = query.range(filters.offset, filters.offset + (filters.limit ?? 20) - 1);
  }

  return query;
}

export function formatFilterBadge(field: string, value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const isCondition = typeof value === 'object' && value !== null && 'operator' in value;
  if (isCondition) {
    const cond = value as FilterCondition;
    const opMap: Record<string, string> = {
      eq: '=',
      neq: '\u2260',
      gt: '>',
      gte: '\u2265',
      lt: '<',
      lte: '\u2264',
      contains: '\u2208',
      between: '-',
    };
    const op = opMap[cond.operator] ?? cond.operator;
    if (cond.operator === 'between' && cond.value2 !== undefined) {
      return `${field} ${cond.value}${op}${cond.value2}`;
    }
    return `${field} ${op} ${cond.value}`;
  }

  return `${field}: ${value}`;
}

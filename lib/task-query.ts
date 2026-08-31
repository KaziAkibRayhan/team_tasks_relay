import {
  dayDifference,
  isOverdue,
  MEMBERS,
  memberFor,
  type Task,
} from '@/lib/task-data';

export const FILTER_STATUSES = [
  'active',
  'todo',
  'in_progress',
  'done',
  'all',
] as const;
export type FilterStatus = (typeof FILTER_STATUSES)[number];

export const ATTENTION_FILTERS = [
  'all',
  'urgent',
  'overdue',
  'unassigned',
] as const;
export type AttentionFilter = (typeof ATTENTION_FILTERS)[number];

export const SORT_OPTIONS = ['attention', 'due', 'updated'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const DEMO_STATES = ['normal', 'loading', 'error', 'empty'] as const;
export type DemoState = (typeof DEMO_STATES)[number];

export type QueryState = {
  q: string;
  status: FilterStatus;
  owner: string;
  attention: AttentionFilter;
  sort: SortOption;
  page: number;
  demo: DemoState;
};

export const DEFAULT_QUERY: QueryState = {
  q: '',
  status: 'active',
  owner: 'all',
  attention: 'all',
  sort: 'attention',
  page: 1,
  demo: 'normal',
};

function isOneOf<T extends string>(
  value: string | null,
  options: readonly T[],
): value is T {
  return value !== null && options.includes(value as T);
}

export function parseQuery(search: string): QueryState {
  const params = new URLSearchParams(search);
  const pageValue = Number(params.get('page'));
  const ownerValue = params.get('owner');
  const validOwner =
    ownerValue === 'all' ||
    ownerValue === 'unassigned' ||
    MEMBERS.some((member) => member.id === ownerValue);

  return {
    q: params.get('q')?.slice(0, 160) ?? '',
    status: isOneOf(params.get('status'), FILTER_STATUSES)
      ? (params.get('status') as FilterStatus)
      : DEFAULT_QUERY.status,
    owner: validOwner && ownerValue ? ownerValue : DEFAULT_QUERY.owner,
    attention: isOneOf(params.get('attention'), ATTENTION_FILTERS)
      ? (params.get('attention') as AttentionFilter)
      : DEFAULT_QUERY.attention,
    sort: isOneOf(params.get('sort'), SORT_OPTIONS)
      ? (params.get('sort') as SortOption)
      : DEFAULT_QUERY.sort,
    page:
      Number.isSafeInteger(pageValue) && pageValue > 0
        ? Math.min(pageValue, 10_000)
        : DEFAULT_QUERY.page,
    demo: isOneOf(params.get('demo'), DEMO_STATES)
      ? (params.get('demo') as DemoState)
      : DEFAULT_QUERY.demo,
  };
}

export function serializeQuery(query: QueryState) {
  const params = new URLSearchParams();
  const q = query.q.trim();

  if (q) params.set('q', q);
  if (query.status !== DEFAULT_QUERY.status) {
    params.set('status', query.status);
  }
  if (query.owner !== DEFAULT_QUERY.owner) params.set('owner', query.owner);
  if (query.attention !== DEFAULT_QUERY.attention) {
    params.set('attention', query.attention);
  }
  if (query.sort !== DEFAULT_QUERY.sort) params.set('sort', query.sort);
  if (query.page > 1) params.set('page', String(query.page));
  if (query.demo !== DEFAULT_QUERY.demo) params.set('demo', query.demo);

  const value = params.toString();
  return value ? `?${value}` : '';
}

function attentionScore(task: Task) {
  if (task.status === 'done') return -100;

  const dueDifference = task.dueDate ? dayDifference(task.dueDate) : null;
  let score = task.urgent ? 100 : 0;
  if (dueDifference !== null && dueDifference < 0) score += 80;
  if (dueDifference === 0) score += 60;
  if (!task.ownerId) score += 35;
  if (dueDifference !== null && dueDifference > 0 && dueDifference <= 14) {
    score += 15 - dueDifference;
  }
  return score;
}

function stableIdDifference(a: Task, b: Task) {
  return a.id.localeCompare(b.id);
}

export function filterAndSortTasks(tasks: Task[], query: QueryState) {
  const normalizedQuery = query.q.trim().toLocaleLowerCase();

  const filtered = tasks.filter((task) => {
    if (query.status === 'active' && task.status === 'done') return false;
    if (
      query.status !== 'active' &&
      query.status !== 'all' &&
      task.status !== query.status
    ) {
      return false;
    }

    if (query.owner === 'unassigned' && task.ownerId !== null) return false;
    if (
      query.owner !== 'all' &&
      query.owner !== 'unassigned' &&
      task.ownerId !== query.owner
    ) {
      return false;
    }

    if (query.attention === 'urgent' && !task.urgent) return false;
    if (query.attention === 'overdue' && !isOverdue(task)) return false;
    if (query.attention === 'unassigned' && task.ownerId !== null) return false;

    if (normalizedQuery) {
      const ownerName = memberFor(task.ownerId)?.name ?? 'unassigned';
      const haystack = `${task.title} ${ownerName} ${task.id}`.toLocaleLowerCase();
      if (!haystack.includes(normalizedQuery)) return false;
    }

    return true;
  });

  return filtered.toSorted((a, b) => {
    if (query.sort === 'attention') {
      const scoreDifference = attentionScore(b) - attentionScore(a);
      if (scoreDifference) return scoreDifference;

      const dueA = a.dueDate ?? '9999-12-31';
      const dueB = b.dueDate ?? '9999-12-31';
      const dueDifference = dueA.localeCompare(dueB);
      if (dueDifference) return dueDifference;
    }

    if (query.sort === 'due') {
      const dueA = a.dueDate ?? '9999-12-31';
      const dueB = b.dueDate ?? '9999-12-31';
      const dueDifference = dueA.localeCompare(dueB);
      if (dueDifference) return dueDifference;
    }

    if (query.sort === 'updated') {
      const updatedDifference =
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (updatedDifference) return updatedDifference;
    }

    return stableIdDifference(a, b);
  });
}

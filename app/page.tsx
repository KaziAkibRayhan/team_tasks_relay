'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  Filter,
  Plus,
  Search,
  Share2,
  UserRound,
  X,
} from 'lucide-react';

import { FilterSheet } from '@/app/components/filter-sheet';
import {
  AddTaskDialog,
  TaskDetailDialog,
  type NewTaskInput,
} from '@/app/components/task-dialogs';
import { TaskList } from '@/app/components/task-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { useUrlQueryState } from '@/hooks/use-url-query-state';
import {
  generateTasks,
  isOverdue,
  memberFor,
  STATUS_LABELS,
  type Task,
  type TaskStatus,
} from '@/lib/task-data';
import {
  DEFAULT_QUERY,
  filterAndSortTasks,
  type AttentionFilter,
  type SortOption,
} from '@/lib/task-query';

const PAGE_SIZE = 20;
const EMPTY_TASKS: Task[] = [];

const statusFilterLabels = {
  active: 'Active',
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
  all: 'All work',
};

const attentionLabels: Record<AttentionFilter, string> = {
  all: 'Any attention state',
  urgent: 'Urgent',
  overdue: 'Overdue',
  unassigned: 'Unassigned',
};

function LogoMark() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <span />
      <span />
    </span>
  );
}

function todayHeading() {
  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date());
}

type ToastMessage = {
  id: number;
  message: string;
};

export default function Home() {
  const [tasks, setTasks] = useState(() => generateTasks());
  const [filterOpen, setFilterOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const { query, commitQuery, ready: queryReady } = useUrlQueryState();

  const showToast = useCallback((message: string) => {
    setToast({ id: Date.now(), message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable;

      if (event.key === '/' && !isTyping) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }

    document.addEventListener('keydown', focusSearch);
    return () => document.removeEventListener('keydown', focusSearch);
  }, []);

  const displayedDemo = queryReady ? query.demo : 'loading';
  const sourceTasks = displayedDemo === 'empty' ? EMPTY_TASKS : tasks;
  const filteredTasks = useMemo(
    () => filterAndSortTasks(sourceTasks, query),
    [sourceTasks, query],
  );
  const total = filteredTasks.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(query.page, pageCount);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleTasks = filteredTasks.slice(startIndex, startIndex + PAGE_SIZE);
  const endIndex = Math.min(startIndex + PAGE_SIZE, total);

  useEffect(() => {
    if (queryReady && query.page !== currentPage) {
      commitQuery({ ...query, page: currentPage }, 'replace');
    }
  }, [commitQuery, currentPage, query, queryReady]);

  const attentionSource = displayedDemo === 'empty' ? [] : tasks;
  const activeTasks = attentionSource.filter((task) => task.status !== 'done');
  const attentionCounts = {
    urgent: activeTasks.filter((task) => task.urgent).length,
    overdue: activeTasks.filter((task) => isOverdue(task)).length,
    unassigned: activeTasks.filter((task) => !task.ownerId).length,
  };

  const activeFilterCount =
    Number(query.status !== DEFAULT_QUERY.status) +
    Number(query.owner !== DEFAULT_QUERY.owner) +
    Number(query.attention !== DEFAULT_QUERY.attention);

  const hasFiltering =
    Boolean(query.q.trim()) ||
    query.status !== DEFAULT_QUERY.status ||
    query.owner !== DEFAULT_QUERY.owner ||
    query.attention !== DEFAULT_QUERY.attention;

  const selectedTask =
    tasks.find((task) => task.id === selectedTaskId) ?? null;

  function clearFilters(keepSearch = true) {
    const next = {
      ...query,
      q: keepSearch ? query.q : '',
      status: DEFAULT_QUERY.status,
      owner: DEFAULT_QUERY.owner,
      attention: DEFAULT_QUERY.attention,
      sort: DEFAULT_QUERY.sort,
      page: 1,
    };
    commitQuery(next, 'push');
  }

  function setAttention(attention: AttentionFilter) {
    const nextAttention =
      query.attention === attention ? 'all' : attention;
    commitQuery(
      { ...query, attention: nextAttention, page: 1 },
      'push',
    );
  }

  function handleStatusChange(task: Task, status: TaskStatus) {
    if (task.status === status) return;
    const updatedTask = {
      ...task,
      status,
      updatedAt: new Date().toISOString(),
    };
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? updatedTask : item)),
    );

    const remainsVisible =
      filterAndSortTasks([updatedTask], query).length > 0;
    showToast(
      remainsVisible
        ? `${task.id} moved to ${STATUS_LABELS[status]}.`
        : `${task.id} moved to ${STATUS_LABELS[status]} and left this filtered view.`,
    );
  }

  function handleAdd(input: NewTaskInput) {
    const nextNumber =
      tasks.reduce((largest, task) => {
        const value = Number(task.id.replace('REL-', ''));
        return Number.isFinite(value) ? Math.max(largest, value) : largest;
      }, 100) + 1;
    const now = new Date().toISOString();
    const newTask: Task = {
      id: `REL-${String(nextNumber).padStart(3, '0')}`,
      title: input.title,
      description: null,
      status: 'todo',
      ownerId: input.ownerId,
      dueDate: input.dueDate,
      urgent: input.urgent,
      createdAt: now,
      updatedAt: now,
    };

    setTasks((current) => [newTask, ...current]);

    if (query.demo !== 'normal') {
      commitQuery({ ...query, demo: 'normal', page: 1 }, 'replace');
      showToast(`${newTask.id} added to To do.`);
      return;
    }

    const appearsInView =
      filterAndSortTasks([newTask], query).length > 0;
    showToast(
      appearsInView
        ? `${newTask.id} added to To do.`
        : `${newTask.id} added to To do. It is outside this filtered view.`,
    );
  }

  function handleSave(updatedTask: Task) {
    setTasks((current) =>
      current.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
    );
    setSelectedTaskId(null);
    const remainsVisible =
      filterAndSortTasks([updatedTask], query).length > 0;
    showToast(
      remainsVisible
        ? `${updatedTask.id} updated.`
        : `${updatedTask.id} updated and left this filtered view.`,
    );
  }

  async function shareView() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('View link copied. Anyone opening it will see these same filters.');
    } catch {
      showToast('This view is ready to share from your browser’s address bar.');
    }
  }

  const ownerFilter = memberFor(
    query.owner === 'all' || query.owner === 'unassigned' ? null : query.owner,
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="topbar">
        <a className="brand" href="#main" aria-label="Relay home">
          <LogoMark />
          <span>Relay</span>
        </a>
        <div className="topbar-actions">
          <span className="user-avatar" aria-label="Signed in as Samira Ahmed">
            SA
          </span>
          <Button
            className="add-task-button"
            size="lg"
            onClick={() => setAddOpen(true)}
          >
            <Plus data-icon="inline-start" />
            <span className="add-task-label">Add task</span>
          </Button>
        </div>
      </header>

      <main id="main" className="workspace">
        <section className="page-heading" aria-labelledby="work-title">
          <div>
            <p className="eyebrow">{todayHeading()}</p>
            <h1 id="work-title">Team tasks</h1>
            <p className="heading-copy">
              See ownership, timing, and next steps across the team.
            </p>
          </div>
          <div className="view-switcher" aria-label="Current view">
            <span className="view-dot" />
            <span className="view-copy">
              <small>Current view</small>
              <strong>{statusFilterLabels[query.status]}</strong>
            </span>
            <span className="view-count">
              {query.status === 'active' ? activeTasks.length : total}
            </span>
          </div>
        </section>

        <section className="attention-section" aria-labelledby="attention-title">
          <div className="attention-heading">
            <h2 id="attention-title">Quick filters</h2>
            <p>Jump to work that needs action. Counts can overlap.</p>
          </div>
          <div className="attention-grid">
            <button
              className={`attention-card urgent ${query.attention === 'urgent' ? 'is-selected' : ''}`}
              type="button"
              aria-pressed={query.attention === 'urgent'}
              onClick={() => setAttention('urgent')}
            >
              <span className="attention-icon"><AlertTriangle /></span>
              <span className="attention-copy">
                <span className="attention-value">
                  <strong>{attentionCounts.urgent}</strong>
                  <span>Urgent</span>
                </span>
                <small>Needs a decision</small>
              </span>
              <span className="attention-action" aria-hidden="true">
                {query.attention === 'urgent' ? 'Selected' : 'View'}
                <ArrowRight />
              </span>
            </button>
            <button
              className={`attention-card overdue ${query.attention === 'overdue' ? 'is-selected' : ''}`}
              type="button"
              aria-pressed={query.attention === 'overdue'}
              onClick={() => setAttention('overdue')}
            >
              <span className="attention-icon"><CalendarDays /></span>
              <span className="attention-copy">
                <span className="attention-value">
                  <strong>{attentionCounts.overdue}</strong>
                  <span>Overdue</span>
                </span>
                <small>Past due date</small>
              </span>
              <span className="attention-action" aria-hidden="true">
                {query.attention === 'overdue' ? 'Selected' : 'View'}
                <ArrowRight />
              </span>
            </button>
            <button
              className={`attention-card unassigned ${query.attention === 'unassigned' ? 'is-selected' : ''}`}
              type="button"
              aria-pressed={query.attention === 'unassigned'}
              onClick={() => setAttention('unassigned')}
            >
              <span className="attention-icon"><UserRound /></span>
              <span className="attention-copy">
                <span className="attention-value">
                  <strong>{attentionCounts.unassigned}</strong>
                  <span>Unassigned</span>
                </span>
                <small>Needs an owner</small>
              </span>
              <span className="attention-action" aria-hidden="true">
                {query.attention === 'unassigned' ? 'Selected' : 'View'}
                <ArrowRight />
              </span>
            </button>
          </div>
        </section>

        <section className="task-surface" aria-labelledby="tasks-title">
          <div className="surface-toolbar">
            <div className="surface-title">
              <h2 id="tasks-title" tabIndex={-1}>
                {statusFilterLabels[query.status]} tasks
              </h2>
              <p aria-live="polite">
                {displayedDemo === 'loading'
                  ? 'Loading tasks…'
                  : (
                    <>
                      <span className="result-total">{total} task{total === 1 ? '' : 's'}</span>
                      <span className="result-sort"> · sorted by {query.sort === 'attention' ? 'attention' : query.sort === 'due' ? 'due date' : 'recent update'}</span>
                    </>
                  )}
              </p>
            </div>
            <div className="toolbar-controls">
              <div className="search-field">
                <Search aria-hidden="true" />
                <label className="sr-only" htmlFor="task-search">
                  Search tasks, owners, or IDs
                </label>
                <Input
                  ref={searchRef}
                  id="task-search"
                  value={query.q}
                  onChange={(event) =>
                    commitQuery(
                      { ...query, q: event.target.value, page: 1 },
                      'replace',
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      commitQuery({ ...query, q: '', page: 1 }, 'replace');
                    }
                  }}
                  placeholder="Search title, ID, or owner"
                />
                {query.q ? (
                  <button
                    className="search-clear"
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      commitQuery({ ...query, q: '', page: 1 }, 'replace');
                      searchRef.current?.focus();
                    }}
                  >
                    <X />
                  </button>
                ) : (
                  <kbd>/</kbd>
                )}
              </div>
              <Button
                className="filter-button"
                variant="outline"
                size="lg"
                onClick={() => setFilterOpen(true)}
              >
                <Filter data-icon="inline-start" />
                <span className="filter-label-wide">Filters</span>
                <span className="filter-label-compact">Filter &amp; sort</span>
                {activeFilterCount ? (
                  <span className="filter-count">{activeFilterCount}</span>
                ) : null}
              </Button>
              <NativeSelect
                className="sort-select"
                aria-label="Sort tasks"
                value={query.sort}
                onChange={(event) => {
                  commitQuery(
                    {
                      ...query,
                      sort: event.target.value as SortOption,
                      page: 1,
                    },
                    'push',
                  );
                }}
              >
                <NativeSelectOption value="attention">Sort: attention</NativeSelectOption>
                <NativeSelectOption value="due">Sort: due date</NativeSelectOption>
                <NativeSelectOption value="updated">Sort: updated</NativeSelectOption>
              </NativeSelect>
              <Button
                className="share-button"
                variant="outline"
                size="lg"
                onClick={shareView}
              >
                <Share2 data-icon="inline-start" />
                <span>Copy view</span>
              </Button>
            </div>
          </div>

          {activeFilterCount > 0 ? (
            <div className="active-filters" aria-label="Active filters">
              <span>Filtered by</span>
              {query.status !== DEFAULT_QUERY.status ? (
                <button
                  type="button"
                  onClick={() =>
                    commitQuery(
                      { ...query, status: DEFAULT_QUERY.status, page: 1 },
                      'push',
                    )
                  }
                >
                  {statusFilterLabels[query.status]} <X />
                </button>
              ) : null}
              {query.owner !== DEFAULT_QUERY.owner ? (
                <button
                  type="button"
                  onClick={() =>
                    commitQuery(
                      { ...query, owner: DEFAULT_QUERY.owner, page: 1 },
                      'push',
                    )
                  }
                >
                  {query.owner === 'unassigned'
                    ? 'Unassigned'
                    : ownerFilter?.name ?? 'Unknown owner'}{' '}
                  <X />
                </button>
              ) : null}
              {query.attention !== DEFAULT_QUERY.attention ? (
                <button
                  type="button"
                  onClick={() =>
                    commitQuery(
                      {
                        ...query,
                        attention: DEFAULT_QUERY.attention,
                        page: 1,
                      },
                      'push',
                    )
                  }
                >
                  {attentionLabels[query.attention]} <X />
                </button>
              ) : null}
              {activeFilterCount > 1 ? (
                <button
                  className="clear-all-filters"
                  type="button"
                  onClick={() => clearFilters(true)}
                >
                  Clear all
                </button>
              ) : null}
            </div>
          ) : null}

          <TaskList
            tasks={visibleTasks}
            total={total}
            page={currentPage}
            pageCount={pageCount}
            startIndex={startIndex}
            endIndex={endIndex}
            demo={displayedDemo}
            isFiltered={hasFiltering}
            onOpenTask={(task) => setSelectedTaskId(task.id)}
            onStatusChange={handleStatusChange}
            onPrevious={() =>
              commitQuery(
                { ...query, page: Math.max(1, currentPage - 1) },
                'push',
              )
            }
            onNext={() =>
              commitQuery(
                {
                  ...query,
                  page: Math.min(pageCount, currentPage + 1),
                },
                'push',
              )
            }
            onRetry={() =>
              commitQuery(
                { ...query, demo: 'normal' },
                'replace',
              )
            }
            onClearFilters={() => clearFilters(false)}
            onAddTask={() => setAddOpen(true)}
          />
        </section>
      </main>

      {filterOpen ? (
        <FilterSheet
          open
          onOpenChange={setFilterOpen}
          query={query}
          onApply={(next) => commitQuery(next, 'push')}
          onClear={() => clearFilters(true)}
        />
      ) : null}

      {addOpen ? (
        <AddTaskDialog
          open
          onOpenChange={setAddOpen}
          onAdd={handleAdd}
        />
      ) : null}

      {selectedTask ? (
        <TaskDetailDialog
          key={selectedTask.id}
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onSave={handleSave}
        />
      ) : null}

      {toast ? (
        <output className="toast" aria-live="polite" key={toast.id}>
          <span><Check /></span>
          <p>{toast.message}</p>
          <button type="button" aria-label="Dismiss message" onClick={() => setToast(null)}>
            <X />
          </button>
        </output>
      ) : null}
    </div>
  );
}

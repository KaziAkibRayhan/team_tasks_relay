'use client';

import {
  AlertCircle,
  CalendarDays,
  Inbox,
  ListFilter,
  RotateCw,
  UserRound,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  dayDifference,
  memberFor,
  parseDateOnly,
  STATUS_LABELS,
  STATUSES,
  type Task,
  type TaskStatus,
} from '@/lib/task-data';
import type { DemoState } from '@/lib/task-query';

type TaskListProps = {
  tasks: Task[];
  total: number;
  page: number;
  pageCount: number;
  startIndex: number;
  endIndex: number;
  demo: DemoState;
  isFiltered: boolean;
  onOpenTask: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onPrevious: () => void;
  onNext: () => void;
  onRetry: () => void;
  onClearFilters: () => void;
  onAddTask: () => void;
};

function formatDue(task: Task) {
  if (!task.dueDate) return { label: 'No due date', tone: 'muted' };

  const date = parseDateOnly(task.dueDate);
  const formatted = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== new Date().getFullYear()
      ? { year: 'numeric' }
      : {}),
  }).format(date);

  if (task.status === 'done') return { label: formatted, tone: 'normal' };

  const difference = dayDifference(task.dueDate);
  if (difference < 0) {
    const count = Math.abs(difference);
    return {
      label: `${count} day${count === 1 ? '' : 's'} overdue`,
      tone: 'overdue',
    };
  }
  if (difference === 0) return { label: 'Today', tone: 'today' };
  if (difference === 1) return { label: 'Tomorrow', tone: 'soon' };
  return { label: formatted, tone: 'normal' };
}

function TaskRow({
  task,
  onOpenTask,
  onStatusChange,
}: Pick<TaskListProps, 'onOpenTask' | 'onStatusChange'> & { task: Task }) {
  const owner = memberFor(task.ownerId);
  const due = formatDue(task);

  return (
    <article className="task-row" role="listitem">
      <div className="task-title-cell">
        <span
          className={`task-signal ${task.urgent ? 'is-urgent' : ''}`}
          aria-hidden="true"
        />
        <div>
          <div className="task-title-line">
            <button
              className="task-open-button"
              type="button"
              onClick={() => onOpenTask(task)}
            >
              {task.title}
            </button>
            {task.urgent ? <span className="urgent-badge">Urgent</span> : null}
          </div>
          <p>{task.id}</p>
        </div>
      </div>

      <div className="task-status-cell">
        <span className="cell-label">Stage</span>
        <span className={`status-indicator status-${task.status}`} aria-hidden="true" />
        <NativeSelect
          className="quick-status-select"
          size="sm"
          value={task.status}
          aria-label={`Move ${task.id} to another stage`}
          onChange={(event) =>
            onStatusChange(task, event.target.value as TaskStatus)
          }
        >
          {STATUSES.map((value) => (
            <NativeSelectOption key={value} value={value}>
              {STATUS_LABELS[value]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <div className={`task-owner-cell ${owner ? '' : 'missing'}`}>
        <span className="cell-label">Owner</span>
        {owner ? (
          <span className="mini-avatar" aria-hidden="true">{owner.initials}</span>
        ) : (
          <UserRound aria-hidden="true" />
        )}
        <span>{owner?.name ?? 'Unassigned'}</span>
      </div>

      <div className={`task-due-cell ${due.tone}`}>
        <span className="cell-label">Due</span>
        <CalendarDays aria-hidden="true" />
        <span>{due.label}</span>
      </div>
    </article>
  );
}

function LoadingRows() {
  return (
    <div className="task-list loading-list" aria-busy="true" aria-label="Loading tasks">
      <div className="task-list-head" aria-hidden="true">
        <span>Task</span>
        <span>Status</span>
        <span>Owner</span>
        <span>Due</span>
      </div>
      {Array.from({ length: 6 }, (_, index) => (
        <div className="task-row skeleton-row" key={index}>
          <div className="skeleton-title">
            <Skeleton className="skeleton-dot" />
            <div>
              <Skeleton className="skeleton-line wide" />
              <Skeleton className="skeleton-line short" />
            </div>
          </div>
          <Skeleton className="skeleton-pill" />
          <Skeleton className="skeleton-owner" />
          <Skeleton className="skeleton-due" />
        </div>
      ))}
      <span className="sr-only" role="status">Loading team work…</span>
    </div>
  );
}

function TaskState({
  kind,
  onRetry,
  onClearFilters,
  onAddTask,
}: {
  kind: 'error' | 'empty' | 'filtered';
  onRetry: () => void;
  onClearFilters: () => void;
  onAddTask: () => void;
}) {
  if (kind === 'error') {
    return (
      <div className="task-state error-state" role="alert">
        <span className="state-icon"><AlertCircle /></span>
        <h3>Tasks couldn’t be loaded</h3>
        <p>The view is still intact. Try the request again when you’re ready.</p>
        <Button type="button" onClick={onRetry} size="lg">
          <RotateCw data-icon="inline-start" />
          Retry
        </Button>
      </div>
    );
  }

  if (kind === 'filtered') {
    return (
      <div className="task-state filtered-state">
        <span className="state-icon"><ListFilter /></span>
        <h3>No tasks match this view</h3>
        <p>Try a broader search, or remove one of the active filters.</p>
        <Button type="button" variant="outline" onClick={onClearFilters} size="lg">
          Clear filters
        </Button>
      </div>
    );
  }

  return (
    <div className="task-state empty-state">
      <span className="state-icon"><Inbox /></span>
      <h3>Your team’s work starts here</h3>
      <p>Add the first task so its owner and next step are clear to everyone.</p>
      <Button type="button" onClick={onAddTask} size="lg">
        Add first task
      </Button>
    </div>
  );
}

export function TaskList({
  tasks,
  total,
  page,
  pageCount,
  startIndex,
  endIndex,
  demo,
  isFiltered,
  onOpenTask,
  onStatusChange,
  onPrevious,
  onNext,
  onRetry,
  onClearFilters,
  onAddTask,
}: TaskListProps) {
  if (demo === 'loading') return <LoadingRows />;
  if (demo === 'error') {
    return (
      <TaskState
        kind="error"
        onRetry={onRetry}
        onClearFilters={onClearFilters}
        onAddTask={onAddTask}
      />
    );
  }
  if (total === 0) {
    return (
      <TaskState
        kind={isFiltered ? 'filtered' : 'empty'}
        onRetry={onRetry}
        onClearFilters={onClearFilters}
        onAddTask={onAddTask}
      />
    );
  }

  return (
    <>
      <div className="task-list" role="list" aria-label="Team tasks">
        <div className="task-list-head" aria-hidden="true">
          <span>Task</span>
          <span>Stage</span>
          <span>Owner</span>
          <span>Due</span>
        </div>
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onOpenTask={onOpenTask}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>

      <nav className="surface-footer" aria-label="Task pages">
        <p>
          Showing {startIndex + 1}–{endIndex} of {total}
        </p>
        <div>
          <Button
            type="button"
            variant="outline"
            disabled={page <= 1}
            onClick={onPrevious}
          >
            Previous
          </Button>
          <span>Page {page} of {pageCount}</span>
          <Button
            type="button"
            variant="outline"
            disabled={page >= pageCount}
            onClick={onNext}
          >
            Next
          </Button>
        </div>
      </nav>
    </>
  );
}

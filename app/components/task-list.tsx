'use client';

import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  Inbox,
  ListFilter,
  RotateCw,
  UserRound,
} from 'lucide-react';

import { TaskStatusSelect } from '@/app/components/task-status-select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  dayDifference,
  memberFor,
  parseDateOnly,
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
    timeZone: 'UTC',
    ...(date.getUTCFullYear() !== new Date().getUTCFullYear()
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
    <li className="task-row">
      <div className="task-title-cell">
        <div>
          <div className="task-title-line">
            <button
              className="task-open-button"
              type="button"
              title={task.title}
              onClick={() => onOpenTask(task)}
            >
              <span className="task-open-text">{task.title}</span>
              <ArrowUpRight className="task-open-icon" aria-hidden="true" />
            </button>
            {task.urgent ? <span className="urgent-badge">Urgent</span> : null}
          </div>
          <p>{task.id}</p>
        </div>
      </div>

      <div className="task-status-cell">
        <span className="cell-label">Stage</span>
        <div className="task-cell-value">
          <TaskStatusSelect task={task} onStatusChange={onStatusChange} />
        </div>
      </div>

      <div className={`task-owner-cell ${owner ? '' : 'missing'}`}>
        <span className="cell-label">Owner</span>
        <div className="task-cell-value">
          {owner ? (
            <span className="mini-avatar" aria-hidden="true">{owner.initials}</span>
          ) : (
            <UserRound aria-hidden="true" />
          )}
          <span>{owner?.name ?? 'Unassigned'}</span>
        </div>
      </div>

      <div className={`task-due-cell ${due.tone}`}>
        <span className="cell-label">Due</span>
        <div className="task-cell-value">
          <CalendarDays aria-hidden="true" />
          <span>{due.label}</span>
        </div>
      </div>
    </li>
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
      <output className="sr-only">Loading team work…</output>
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
      <div className="task-list">
        <div className="task-list-head" aria-hidden="true">
          <span>Task</span>
          <span>Stage</span>
          <span>Owner</span>
          <span>Due</span>
        </div>
        <ul className="task-list-items" aria-label="Team tasks">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onOpenTask={onOpenTask}
              onStatusChange={onStatusChange}
            />
          ))}
        </ul>
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

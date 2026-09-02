'use client';

import { Select } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';
import { useRef } from 'react';

import {
  STATUS_LABELS,
  STATUSES,
  type Task,
  type TaskStatus,
} from '@/lib/task-data';

const STATUS_ITEMS = STATUSES.map((value) => ({
  label: STATUS_LABELS[value],
  value,
}));

type TaskStatusSelectProps = {
  task: Task;
  onStatusChange: (task: Task, status: TaskStatus) => void;
};

export function TaskStatusSelect({
  task,
  onStatusChange,
}: TaskStatusSelectProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);

  function commitStatus(status: TaskStatus | null) {
    if (!status || status === task.status) return;

    const control = triggerRef.current;
    const row = control?.closest('li');
    // The row may leave a filtered view after this update, so keep focus nearby.
    const siblingRows = row?.parentElement
      ? Array.from(row.parentElement.children)
      : [];
    const rowIndex = row ? siblingRows.indexOf(row) : -1;
    const fallbackRow = siblingRows[rowIndex + 1] ?? siblingRows[rowIndex - 1];
    const fallbackControl =
      fallbackRow?.querySelector<HTMLButtonElement>('[data-task-status-trigger]');

    onStatusChange(task, status);
    window.requestAnimationFrame(() => {
      if (control && !document.contains(control)) {
        if (fallbackControl && document.contains(fallbackControl)) {
          fallbackControl.focus();
        } else {
          document.getElementById('tasks-title')?.focus();
        }
      }
    });
  }

  return (
    <Select.Root<TaskStatus>
      items={STATUS_ITEMS}
      value={task.status}
      onValueChange={commitStatus}
    >
      <Select.Trigger
        ref={triggerRef}
        className={`quick-status-trigger quick-status-${task.status}`}
        data-task-status-trigger
        type="button"
        aria-label={`Move ${task.id} to another stage`}
      >
        <span
          className={`status-indicator status-${task.status}`}
          aria-hidden="true"
        />
        <Select.Value className="quick-status-value" />
        <Select.Icon className="quick-status-icon">
          <ChevronDown aria-hidden="true" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner
          className="status-select-positioner"
          side="bottom"
          align="start"
          sideOffset={6}
          alignItemWithTrigger={false}
        >
          <Select.Popup className="status-select-popup">
            <Select.List className="status-select-list">
              {STATUS_ITEMS.map(({ label, value }) => (
                <Select.Item
                  className="status-select-item"
                  key={value}
                  value={value}
                  label={label}
                >
                  <span
                    className={`status-option-dot status-${value}`}
                    aria-hidden="true"
                  />
                  <Select.ItemText>{label}</Select.ItemText>
                  <Select.ItemIndicator className="status-select-check">
                    <Check aria-hidden="true" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

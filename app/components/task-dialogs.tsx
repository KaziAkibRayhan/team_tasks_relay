'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AlertTriangle, CalendarDays, UserRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import {
  MEMBERS,
  STATUS_LABELS,
  STATUSES,
  type Task,
  type TaskStatus,
} from '@/lib/task-data';

export type NewTaskInput = {
  title: string;
  ownerId: string | null;
  dueDate: string | null;
  urgent: boolean;
};

type AddTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (input: NewTaskInput) => void;
};

export function AddTaskDialog({
  open,
  onOpenChange,
  onAdd,
}: AddTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [ownerId, setOwnerId] = useState('unassigned');
  const [dueDate, setDueDate] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [titleError, setTitleError] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setTitle('');
      setOwnerId('unassigned');
      setDueDate('');
      setUrgent(false);
      setTitleError('');
    }
  }, [open]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      setTitleError('Give the task a short, specific title.');
      titleRef.current?.focus();
      return;
    }

    onAdd({
      title: cleanTitle,
      ownerId: ownerId === 'unassigned' ? null : ownerId,
      dueDate: dueDate || null,
      urgent,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="task-dialog add-task-dialog">
        <DialogHeader className="task-dialog-header">
          <span className="dialog-kicker">New work</span>
          <DialogTitle>Add a task</DialogTitle>
          <DialogDescription>
            A title is enough to get started. Ownership and timing can wait.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="dialog-form-grid">
            <div className="form-field form-field-full">
              <Label htmlFor="new-task-title">Task title</Label>
              <Input
                ref={titleRef}
                id="new-task-title"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (titleError) setTitleError('');
                }}
                placeholder="What needs to happen?"
                aria-invalid={Boolean(titleError)}
                aria-describedby={titleError ? 'new-task-title-error' : undefined}
                autoFocus
              />
              {titleError ? (
                <p id="new-task-title-error" className="field-error">
                  {titleError}
                </p>
              ) : null}
            </div>

            <div className="form-field">
              <Label htmlFor="new-task-owner">
                <UserRound /> Owner
              </Label>
              <NativeSelect
                id="new-task-owner"
                value={ownerId}
                onChange={(event) => setOwnerId(event.target.value)}
              >
                <NativeSelectOption value="unassigned">Unassigned</NativeSelectOption>
                {MEMBERS.map((member) => (
                  <NativeSelectOption key={member.id} value={member.id}>
                    {member.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div className="form-field">
              <Label htmlFor="new-task-due">
                <CalendarDays /> Due date
              </Label>
              <Input
                id="new-task-due"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>

            <label className="urgent-toggle form-field-full">
              <span className="urgent-toggle-icon"><AlertTriangle /></span>
              <span>
                <strong>Mark as urgent</strong>
                <small>Surface this task above the normal queue.</small>
              </span>
              <Checkbox
                checked={urgent}
                onCheckedChange={(checked) => setUrgent(checked === true)}
                aria-label="Mark task as urgent"
              />
            </label>
          </div>

          <DialogFooter className="task-dialog-footer">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="lg">Add task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type TaskDetailDialogProps = {
  task: Task | null;
  onClose: () => void;
  onSave: (task: Task) => void;
};

export function TaskDetailDialog({
  task,
  onClose,
  onSave,
}: TaskDetailDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [ownerId, setOwnerId] = useState('unassigned');
  const [dueDate, setDueDate] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [titleError, setTitleError] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? '');
    setStatus(task.status);
    setOwnerId(task.ownerId ?? 'unassigned');
    setDueDate(task.dueDate ?? '');
    setUrgent(task.urgent);
    setTitleError('');
  }, [task]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!task) return;

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setTitleError('A task needs a title.');
      titleRef.current?.focus();
      return;
    }

    onSave({
      ...task,
      title: cleanTitle,
      description: description.trim() || null,
      status,
      ownerId: ownerId === 'unassigned' ? null : ownerId,
      dueDate: dueDate || null,
      urgent,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <Dialog
      open={Boolean(task)}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="task-dialog task-detail-dialog">
        {task ? (
          <>
            <DialogHeader className="task-dialog-header">
              <span className="dialog-kicker">{task.id}</span>
              <DialogTitle>Edit task</DialogTitle>
              <DialogDescription>
                Keep the fields that help the team act or find this work.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="dialog-form-grid detail-form-grid">
                <div className="form-field form-field-full">
                  <Label htmlFor="detail-task-title">Task title</Label>
                  <Input
                    ref={titleRef}
                    id="detail-task-title"
                    value={title}
                    onChange={(event) => {
                      setTitle(event.target.value);
                      if (titleError) setTitleError('');
                    }}
                    aria-invalid={Boolean(titleError)}
                    aria-describedby={titleError ? 'detail-task-title-error' : undefined}
                  />
                  {titleError ? (
                    <p id="detail-task-title-error" className="field-error">
                      {titleError}
                    </p>
                  ) : null}
                </div>

                <div className="form-field form-field-full">
                  <Label htmlFor="detail-task-description">Description</Label>
                  <Textarea
                    id="detail-task-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Add context, a decision, or a hand-off note…"
                    rows={4}
                  />
                </div>

                <div className="form-field">
                  <Label htmlFor="detail-task-status">Stage</Label>
                  <NativeSelect
                    id="detail-task-status"
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as TaskStatus)
                    }
                  >
                    {STATUSES.map((value) => (
                      <NativeSelectOption key={value} value={value}>
                        {STATUS_LABELS[value]}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>

                <div className="form-field">
                  <Label htmlFor="detail-task-owner">Owner</Label>
                  <NativeSelect
                    id="detail-task-owner"
                    value={ownerId}
                    onChange={(event) => setOwnerId(event.target.value)}
                  >
                    <NativeSelectOption value="unassigned">Unassigned</NativeSelectOption>
                    {MEMBERS.map((member) => (
                      <NativeSelectOption key={member.id} value={member.id}>
                        {member.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>

                <div className="form-field form-field-full">
                  <Label htmlFor="detail-task-due">Due date</Label>
                  <Input
                    id="detail-task-due"
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                  />
                </div>

                <label className="urgent-toggle form-field-full">
                  <span className="urgent-toggle-icon"><AlertTriangle /></span>
                  <span>
                    <strong>Urgent</strong>
                    <small>Move this above the team’s normal queue.</small>
                  </span>
                  <Checkbox
                    checked={urgent}
                    onCheckedChange={(checked) => setUrgent(checked === true)}
                    aria-label="Mark task as urgent"
                  />
                </label>
              </div>

              <DialogFooter className="task-dialog-footer">
                <Button type="button" variant="ghost" size="lg" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" size="lg">Save changes</Button>
              </DialogFooter>
            </form>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

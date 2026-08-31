'use client';

import { useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { MEMBERS } from '@/lib/task-data';
import {
  DEFAULT_QUERY,
  type AttentionFilter,
  type FilterStatus,
  type QueryState,
  type SortOption,
} from '@/lib/task-query';

type FilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: QueryState;
  onApply: (next: QueryState) => void;
  onClear: () => void;
};

const statusOptions: Array<{ value: FilterStatus; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
  { value: 'all', label: 'All work' },
];

const attentionOptions: Array<{
  value: AttentionFilter;
  label: string;
  description: string;
}> = [
  { value: 'all', label: 'Any attention state', description: 'Show every task' },
  { value: 'urgent', label: 'Urgent', description: 'Needs a decision now' },
  { value: 'overdue', label: 'Overdue', description: 'Due date has passed' },
  { value: 'unassigned', label: 'Unassigned', description: 'No owner yet' },
];

export function FilterSheet({
  open,
  onOpenChange,
  query,
  onApply,
  onClear,
}: FilterSheetProps) {
  const isMobile = useIsMobile();
  const [draft, setDraft] = useState(query);

  useEffect(() => {
    if (open) setDraft(query);
  }, [open, query]);

  function updateDraft<K extends keyof QueryState>(
    key: K,
    value: QueryState[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value, page: 1 }));
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={isMobile ? 'filter-sheet filter-sheet-mobile' : 'filter-sheet'}
      >
        <SheetHeader className="filter-sheet-header">
          <span className="filter-sheet-icon" aria-hidden="true">
            <SlidersHorizontal />
          </span>
          <SheetTitle>Filter this view</SheetTitle>
          <SheetDescription>
            Narrow the list, then share the URL to send the same view.
          </SheetDescription>
        </SheetHeader>

        <div className="filter-sheet-body">
          <fieldset className="filter-group">
            <legend>Work stage</legend>
            <div className="segment-options">
              {statusOptions.map((option) => (
                <label key={option.value}>
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={draft.status === option.value}
                    onChange={() => updateDraft('status', option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="filter-field">
            <span>Owner</span>
            <NativeSelect
              value={draft.owner}
              onChange={(event) => updateDraft('owner', event.target.value)}
            >
              <NativeSelectOption value="all">Anyone</NativeSelectOption>
              <NativeSelectOption value="unassigned">Unassigned</NativeSelectOption>
              {MEMBERS.map((member) => (
                <NativeSelectOption key={member.id} value={member.id}>
                  {member.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>

          <fieldset className="filter-group">
            <legend>Needs attention</legend>
            <div className="choice-list">
              {attentionOptions.map((option) => (
                <label key={option.value}>
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                  </span>
                  <input
                    type="radio"
                    name="attention"
                    value={option.value}
                    checked={draft.attention === option.value}
                    onChange={() => updateDraft('attention', option.value)}
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <label className="filter-field filter-sort-field">
            <span>Sort by</span>
            <NativeSelect
              value={draft.sort}
              onChange={(event) =>
                updateDraft('sort', event.target.value as SortOption)
              }
            >
              <NativeSelectOption value="attention">Needs attention</NativeSelectOption>
              <NativeSelectOption value="due">Due date</NativeSelectOption>
              <NativeSelectOption value="updated">Recently updated</NativeSelectOption>
            </NativeSelect>
          </label>
        </div>

        <SheetFooter className="filter-sheet-footer">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => {
              setDraft((current) => ({
                ...current,
                status: DEFAULT_QUERY.status,
                owner: DEFAULT_QUERY.owner,
                attention: DEFAULT_QUERY.attention,
                sort: DEFAULT_QUERY.sort,
                page: 1,
              }));
              onClear();
              onOpenChange(false);
            }}
          >
            Clear filters
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={() => {
              onApply({ ...draft, page: 1 });
              onOpenChange(false);
            }}
          >
            Apply filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

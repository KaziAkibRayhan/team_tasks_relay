export const STATUSES = ['todo', 'in_progress', 'done'] as const;
export type TaskStatus = (typeof STATUSES)[number];

export type Member = {
  id: string;
  name: string;
  initials: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  ownerId: string | null;
  dueDate: string | null;
  urgent: boolean;
  createdAt: string;
  updatedAt: string;
};

export const MEMBERS: Member[] = [
  { id: 'samira', name: 'Samira Ahmed', initials: 'SA' },
  { id: 'nadia', name: 'Nadia Rahman', initials: 'NR' },
  { id: 'mehedi', name: 'Mehedi Hasan', initials: 'MH' },
  { id: 'tarek', name: 'Tarek Mahmood', initials: 'TM' },
  { id: 'farhana', name: 'Farhana Kabir', initials: 'FK' },
  { id: 'sanjida', name: 'Sanjida Chowdhury', initials: 'SC' },
  { id: 'rafiul', name: 'Rafiul Islam', initials: 'RI' },
  { id: 'evelyn', name: "Evelyn D'Souza", initials: 'ED' },
  { id: 'hyunjae', name: 'Hyun-Jae Kim', initials: 'HK' },
  {
    id: 'mohammad',
    name: 'Mohammad Abdur Rahman Chowdhury-Siddiqui',
    initials: 'MC',
  },
  {
    id: 'alexander',
    name: 'Alexander Theodore Montgomery',
    initials: 'AM',
  },
  { id: 'anika', name: 'Anika Sultana', initials: 'AS' },
];

const curatedTitles = [
  'Resolve duplicated billing notifications after customers change plans',
  'Confirm the revised launch checklist with customer success',
  'Document the hand-off process for enterprise onboarding requests',
  'Review Q3 accessibility findings and agree owners for every remaining issue',
  'Investigate intermittent timeouts from the document export service',
  'Replace the spreadsheet used for weekly renewal-risk reporting',
  'Prepare fallback copy for the maintenance window banner',
  'কাস্টমার সাপোর্ট দলের জন্য নতুন এসকেলেশন পদ্ধতি যাচাই করুন',
  'Validate the migration plan for accounts with more than 10,000 saved records',
  'Fix the unbroken identifier_that_is_intentionally_far_too_long_for_a_normal_task_row_2026',
  'Coordinate legal review for the updated data-processing agreement before the regional rollout begins',
  'Reconcile the July partner invoices with the finance export',
  'Map ownership for unresolved security questionnaire responses',
  'Triage reports that invited teammates cannot accept their invitation',
  'Write a short incident recap for the failed overnight import',
  'Confirm translated error messages with the localization vendor',
];

const actions = [
  'Review',
  'Confirm',
  'Update',
  'Investigate',
  'Document',
  'Reconcile',
  'Prepare',
  'Validate',
  'Triage',
  'Simplify',
  'Schedule',
  'Publish',
  'Audit',
  'Resolve',
  'Coordinate',
  'Test',
];

const subjects = [
  'the renewal-risk hand-off',
  'weekly customer health reporting',
  'the enterprise onboarding checklist',
  'notification delivery failures',
  'the pricing-page content',
  'regional tax configuration',
  'the support escalation path',
  'the new account import',
  'accessibility remediation',
  'vendor security responses',
  'invoice reconciliation rules',
  'workspace invitation emails',
  'the quarterly planning template',
  'data-retention exceptions',
  'mobile sign-in recovery',
  'the release readiness review',
  'analytics event naming',
  'the account closure workflow',
  'customer-facing maintenance copy',
  'the partner enablement guide',
];

const contexts = [
  'before Thursday’s team review',
  'with customer success',
  'for the September release',
  'after the latest policy update',
  'across every active region',
  'for accounts missing an owner',
  'with finance and operations',
  'before the next maintenance window',
  'for the mobile experience',
  'without changing existing permissions',
  'against the production export',
  'with the implementation team',
];

const descriptions = [
  'Capture the decision, name an owner, and link any follow-up work in the final note.',
  'The current spreadsheet has conflicting entries. Confirm the source of truth before making the change.',
  'Keep the first pass narrow. Flag anything that requires a policy decision rather than guessing.',
  'Test the empty, error, and long-content cases as part of the hand-off.',
  'This came out of the weekly team review and is blocking two related items.',
  'Share the final outcome with the people affected by the change.',
];

function utcDateAtNoon(date = new Date()) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      12,
    ),
  );
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function toDateOnly(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateOnly(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

export function dayDifference(value: string, from = new Date()) {
  const target = parseDateOnly(value).getTime();
  const base = utcDateAtNoon(from).getTime();
  return Math.round((target - base) / 86_400_000);
}

export function generateTasks(count = 320): Task[] {
  const today = utcDateAtNoon();

  return Array.from({ length: count }, (_, index) => {
    const title =
      curatedTitles[index] ??
      `${actions[index % actions.length]} ${subjects[(index * 7) % subjects.length]} ${contexts[(index * 5) % contexts.length]}`;

    const statusSelector = (index * 37 + 11) % 100;
    const status: TaskStatus =
      statusSelector < 50
        ? 'todo'
        : statusSelector < 82
          ? 'in_progress'
          : 'done';

    const ownerSelector = (index * 29 + 3) % 17;
    const ownerId =
      ownerSelector < 3
        ? null
        : MEMBERS[(index * 5 + ownerSelector) % MEMBERS.length].id;

    const dueSelector = (index * 31 + 7) % 19;
    const dueOffset = ((index * 17 + 23) % 151) - 42;
    const dueDate =
      dueSelector < 4 ? null : toDateOnly(addDays(today, dueOffset));

    const updatedDaysAgo = (index * 13 + 2) % 75;
    const createdDaysAgo = updatedDaysAgo + 2 + ((index * 11) % 120);
    const updatedAt = addDays(today, -updatedDaysAgo).toISOString();
    const createdAt = addDays(today, -createdDaysAgo).toISOString();

    return {
      id: `REL-${String(101 + index).padStart(3, '0')}`,
      title,
      description:
        index % 5 === 0 ? null : descriptions[(index * 3) % descriptions.length],
      status,
      ownerId,
      dueDate,
      urgent: index % 9 === 0 || index === 1,
      createdAt,
      updatedAt,
    };
  });
}

export function memberFor(ownerId: string | null) {
  return ownerId ? MEMBERS.find((member) => member.id === ownerId) ?? null : null;
}

export function isOverdue(task: Task, today = new Date()) {
  return Boolean(
    task.status !== 'done' &&
      task.dueDate &&
      dayDifference(task.dueDate, today) < 0,
  );
}

export function isDueToday(task: Task, today = new Date()) {
  return Boolean(
    task.status !== 'done' &&
      task.dueDate &&
      dayDifference(task.dueDate, today) === 0,
  );
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};

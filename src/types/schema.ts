// ============================================================================
// Global data schema shared by every module (To-Do, Calendar, Project Board,
// Job Board, Deep-Dive research). See the design discussion for rationale.
// ============================================================================

export type ID = string;

export interface BaseEntity {
  id: ID;
  createdAt: string; // ISO 8601
  updatedAt: string;
  tagIds: ID[];
  archived: boolean;
}

// Cross-cutting label usable on any entity type. The To-Do module's
// "categories" (Academic / Personal / ...) ARE tags — no separate concept.
export interface Tag {
  id: ID;
  name: string;
  color: string; // tailwind color token, e.g. 'blue'
}

export type EntityType = 'task' | 'project' | 'job' | 'event' | 'researchNote';

export interface EntityRef {
  type: EntityType;
  id: ID;
}

export type RelationKind =
  | 'blocks'
  | 'blockedBy'
  | 'relatesTo'
  | 'appliesTo'
  | 'partOf'
  | 'scheduledAs'
  | 'reference';

export interface Relation {
  id: ID;
  createdAt: string;
  from: EntityRef;
  to: EntityRef;
  kind: RelationKind;
}

export interface Task extends BaseEntity {
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  completedAt?: string;

  // Direct FKs for this task's "home" project/job — unused until the Project
  // Board and Job Board modules exist, but present now so tasks created
  // today are already linkable once those modules land.
  projectId?: ID;
  jobId?: ID;

  parentTaskId?: ID;
  subtaskIds: ID[];
}

export interface ProjectColumn {
  id: ID;
  name: string;
  taskIds: ID[];
}

export interface Project extends BaseEntity {
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
  columns: ProjectColumn[];
  startDate?: string;
  targetDate?: string;
}

export interface Contact {
  id: ID;
  name: string;
  role?: string;
  email?: string;
}

export interface Job extends BaseEntity {
  company: string;
  title: string;
  status: 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected' | 'withdrawn';
  postingUrl?: string;
  salaryRange?: { min?: number; max?: number; currency?: string };
  appliedDate?: string;
  contacts: Contact[];
  notes?: string;
}

export type RecurrenceFreq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

// A standards-based (RFC 5545 / RRULE-shaped) recurrence rule, rather than a
// proprietary format — see src/modules/calendar/recurrence.ts, which is the
// only place that interprets this shape (via the `rrule` library).
export interface RecurrenceRule {
  freq: RecurrenceFreq;
  interval: number; // every N units, e.g. interval=2 + freq='WEEKLY' = every 2 weeks
  byWeekday?: number[]; // 0=Sun..6=Sat (matches Date#getDay()); used when freq === 'WEEKLY'
  monthlyMode?: 'date' | 'weekday'; // 'date' = same day-of-month; 'weekday' = e.g. "2nd Tuesday"; used when freq === 'MONTHLY'
  until?: string; // 'YYYY-MM-DD', inclusive end date of the recurrence; omit for no date limit
  count?: number; // end after N occurrences; omit for no occurrence limit
  // IANA zone captured when the rule was created. Recurrence is generated in
  // local wall-clock terms (see recurrence.ts) rather than by converting
  // through this value, but it's kept for display/future multi-timezone use.
  timezone: string;
}

export interface Event extends BaseEntity {
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  location?: string;
  source?: EntityRef;

  // Present on the "master" event of a recurring series — expanded into
  // occurrences at render time (see expandEventsForRange in recurrence.ts)
  // rather than materialized into one row per occurrence.
  recurrence?: RecurrenceRule;
  // Occurrences of this series that were deleted individually (their
  // original start times) — RFC 5545 EXDATE-equivalent.
  excludedDates?: string[];

  // Present on an "exception" event that overrides a single occurrence of
  // another event's series (edited or moved individually), in place of that
  // generated occurrence. Such an event never has `recurrence` itself.
  recurrenceId?: ID; // the master event's id
  originalStart?: string; // ISO start time of the occurrence being replaced, as originally generated
}

export interface ResearchNote extends BaseEntity {
  title: string;
  content: string;
  sourceUrls: string[];
  projectId?: ID;
  jobId?: ID;
}

export interface AppState {
  tasks: Record<ID, Task>;
  projects: Record<ID, Project>;
  jobs: Record<ID, Job>;
  events: Record<ID, Event>;
  researchNotes: Record<ID, ResearchNote>;
  tags: Record<ID, Tag>;
  relations: Record<ID, Relation>;
}

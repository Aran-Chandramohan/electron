import { useAppStore } from '../../store/useAppStore';
import type { Task } from '../../types/schema';
import { colorClassesFor } from '../../components/shared/tagColors';
import { CheckIcon, PencilIcon, TrashIcon } from '../../components/icons/Icons';

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
}

const PRIORITY_STYLES: Record<Task['priority'], string> = {
  low: 'bg-slate-500/15 text-slate-300',
  medium: 'bg-sky-500/15 text-sky-300',
  high: 'bg-orange-500/15 text-orange-300',
  urgent: 'bg-red-500/15 text-red-300',
};

function formatDueDate(iso?: string): { label: string; overdue: boolean } | null {
  if (!iso) return null;
  const due = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue = due < today;
  const label = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return { label, overdue };
}

export function TaskItem({ task, onEdit }: TaskItemProps) {
  const tags = useAppStore((s) => s.tags);
  const toggleTaskStatus = useAppStore((s) => s.toggleTaskStatus);
  const deleteTask = useAppStore((s) => s.deleteTask);

  const isDone = task.status === 'done';
  const tag = task.tagIds[0] ? tags[task.tagIds[0]] : undefined;
  const due = formatDueDate(task.dueDate);

  return (
    <div className="group flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm transition hover:border-slate-700">
      <button
        onClick={() => toggleTaskStatus(task.id)}
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition ${
          isDone ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600 hover:border-slate-500'
        }`}
        title={isDone ? 'Mark as not done' : 'Mark as done'}
      >
        {isDone && <CheckIcon className="h-3 w-3 text-white" />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${isDone ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
          {task.title}
        </p>
        {task.description && (
          <p className={`mt-0.5 text-sm ${isDone ? 'text-slate-600' : 'text-slate-400'}`}>{task.description}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {tag && (
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colorClassesFor(tag.color).chip}`}>
              {tag.name}
            </span>
          )}
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PRIORITY_STYLES[task.priority]}`}>
            {task.priority}
          </span>
          {due && (
            <span
              className={`text-xs font-medium ${
                !isDone && due.overdue ? 'text-red-400' : 'text-slate-500'
              }`}
            >
              Due {due.label}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          onClick={() => onEdit(task)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
          title="Edit task"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => deleteTask(task.id)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
          title="Delete task"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

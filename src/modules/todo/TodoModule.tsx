import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { Task } from '../../types/schema';
import { CategoryFilter } from '../../components/shared/CategoryFilter';
import { TaskItem } from './TaskItem';
import { TaskForm } from './TaskForm';
import { PlusIcon } from '../../components/icons/Icons';

type StatusFilter = 'active' | 'done' | 'all';

export function TodoModule() {
  const tasks = useAppStore((s) => s.tasks);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const taskList = useMemo(() => {
    return Object.values(tasks)
      .filter((t) => !t.archived)
      .filter((t) => (selectedTagId ? t.tagIds.includes(selectedTagId) : true))
      .filter((t) => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'done') return t.status === 'done';
        return t.status !== 'done';
      })
      .sort((a, b) => {
        // Undated tasks sink to the bottom; otherwise soonest due date first.
        if (!a.dueDate && !b.dueDate) return b.createdAt.localeCompare(a.createdAt);
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
  }, [tasks, selectedTagId, statusFilter]);

  function openNewTaskForm() {
    setEditingTask(null);
    setFormOpen(true);
  }

  function openEditForm(task: Task) {
    setEditingTask(task);
    setFormOpen(true);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">To-Do List</h1>
          <p className="text-sm text-slate-400">{taskList.length} task{taskList.length === 1 ? '' : 's'}</p>
        </div>
        <button
          onClick={openNewTaskForm}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500"
        >
          <PlusIcon className="h-4 w-4" />
          New Task
        </button>
      </div>

      <div className="mb-4">
        <CategoryFilter selectedTagId={selectedTagId} onSelect={setSelectedTagId} />
      </div>

      <div className="mb-4 flex gap-1 rounded-lg bg-slate-900 p-1 text-sm font-medium">
        {(['active', 'done', 'all'] as StatusFilter[]).map((option) => (
          <button
            key={option}
            onClick={() => setStatusFilter(option)}
            className={`flex-1 rounded-md py-1.5 capitalize transition ${
              statusFilter === option ? 'bg-slate-700 text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {taskList.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 py-12 text-center text-sm text-slate-500">
            No tasks here. Click "New Task" to add one.
          </div>
        ) : (
          taskList.map((task) => <TaskItem key={task.id} task={task} onEdit={openEditForm} />)
        )}
      </div>

      {formOpen && <TaskForm editingTask={editingTask} onClose={() => setFormOpen(false)} />}
    </div>
  );
}

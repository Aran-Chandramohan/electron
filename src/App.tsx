import { useState } from 'react';
import { TodoModule } from './modules/todo/TodoModule';
import { CalendarModule } from './modules/calendar/CalendarModule';
import { CalendarIcon, ChecklistIcon } from './components/icons/Icons';

type ModuleId = 'todo' | 'calendar';

const AVAILABLE_MODULES: { id: ModuleId; label: string; Icon: typeof CalendarIcon }[] = [
  { id: 'todo', label: 'To-Do List', Icon: ChecklistIcon },
  { id: 'calendar', label: 'Calendar', Icon: CalendarIcon },
];

const UPCOMING_MODULES = ['Project Board', 'Job Board', 'Deep-Dive Research'];

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>('todo');

  return (
    <div className="flex h-screen bg-slate-950">
      <nav className="flex w-56 flex-shrink-0 flex-col border-r border-slate-800 bg-slate-900 py-4">
        <div className="mb-4 px-4 text-lg font-semibold text-slate-100">Productivity App</div>

        <div className="flex flex-col gap-1 px-2">
          {AVAILABLE_MODULES.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveModule(id)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeModule === id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 border-t border-slate-800 px-2 pt-4">
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Coming soon</p>
          {UPCOMING_MODULES.map((label) => (
            <div key={label} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-500">
              {label}
            </div>
          ))}
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto">
        {activeModule === 'todo' && <TodoModule />}
        {activeModule === 'calendar' && <CalendarModule />}
      </main>
    </div>
  );
}

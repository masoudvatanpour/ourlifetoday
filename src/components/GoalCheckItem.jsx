import { CATEGORY_COLORS } from '../lib/themes';

export default function GoalCheckItem({ goal, completed, onToggle, theme }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 active:scale-95 select-none ${
        completed
          ? `${theme.bgLight} ${theme.borderMed}`
          : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
      }`}
    >
      <span className="text-4xl flex-shrink-0">{goal.icon}</span>

      <div className="flex-1 text-left min-w-0">
        <p
          className={`text-lg font-bold truncate ${
            completed ? `${theme.text} opacity-70 line-through` : 'text-gray-800'
          }`}
        >
          {goal.title}
        </p>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[goal.category]}`}>
          {goal.category}
        </span>
      </div>

      <div
        className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all duration-200 ${
          completed ? 'border-transparent' : 'border-gray-300 bg-white'
        }`}
        style={completed ? { backgroundColor: theme.checkFill } : {}}
      >
        {completed && (
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </button>
  );
}

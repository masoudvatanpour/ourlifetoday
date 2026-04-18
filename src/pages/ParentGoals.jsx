import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getKids, getGoals, saveGoal, deleteGoal, generateId } from '../lib/storage';
import { getTheme, GOAL_ICONS, GOAL_CATEGORIES, CATEGORY_COLORS } from '../lib/themes';

const BLANK_GOAL = { title: '', icon: '⭐', category: 'chore', active: true };

export default function ParentGoals() {
  const navigate = useNavigate();
  const kids = getKids();
  const [selectedKidId, setSelectedKidId] = useState(kids[0]?.id || null);
  const [goals, setGoals] = useState(() => getGoals(selectedKidId));
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK_GOAL);
  const [error, setError] = useState('');

  const reload = (kidId = selectedKidId) => setGoals(getGoals(kidId));

  const switchKid = (id) => { setSelectedKidId(id); reload(id); setEditing(null); };

  const startAdd = () => { setEditing('new'); setForm({ ...BLANK_GOAL, kidId: selectedKidId }); setError(''); };
  const startEdit = (goal) => { setEditing(goal.id); setForm({ ...goal }); setError(''); };

  const handleSave = () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    const id = editing === 'new' ? generateId() : editing;
    const order = editing === 'new' ? goals.length : form.order;
    saveGoal({ ...form, id, kidId: selectedKidId, title: form.title.trim(), order });
    setEditing(null);
    reload();
  };

  const toggleActive = (goal) => {
    saveGoal({ ...goal, active: !goal.active });
    reload();
  };

  const handleDelete = (goalId) => {
    if (!confirm('Delete this goal and all its history?')) return;
    deleteGoal(goalId);
    reload();
  };

  const selectedKid = kids.find((k) => k.id === selectedKidId);
  const theme = selectedKid ? getTheme(selectedKid.color) : null;
  const activeGoals = goals.filter((g) => g.active).sort((a, b) => a.order - b.order);
  const inactiveGoals = goals.filter((g) => !g.active).sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-gray-800 px-5 pt-12 pb-6 text-white flex items-center gap-3">
        <button onClick={() => navigate('/parent')} className="text-gray-400 text-sm">← Back</button>
        <div className="flex-1">
          <h1 className="text-2xl font-black">Manage Goals</h1>
        </div>
        {selectedKidId && (
          <button onClick={startAdd} className="bg-white text-gray-800 px-4 py-2 rounded-xl font-bold text-sm active:scale-95">
            + Add
          </button>
        )}
      </div>

      {/* Kid tabs */}
      <div className="flex gap-2 px-4 pt-4 overflow-x-auto pb-1">
        {kids.map((kid) => {
          const t = getTheme(kid.color);
          const active = kid.id === selectedKidId;
          return (
            <button
              key={kid.id}
              onClick={() => switchKid(kid.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm flex-shrink-0 transition-all ${
                active ? `${t.bg} text-white shadow-md` : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              <span>{kid.avatar}</span>
              <span>{kid.name}</span>
            </button>
          );
        })}
      </div>

      <div className="px-4 pt-4 space-y-3">
        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Active ({activeGoals.length})</h3>
        {activeGoals.map((goal) => (
          <GoalRow key={goal.id} goal={goal} theme={theme} onEdit={() => startEdit(goal)} onToggle={() => toggleActive(goal)} onDelete={() => handleDelete(goal.id)} />
        ))}

        {inactiveGoals.length > 0 && (
          <>
            <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wide pt-2">Paused ({inactiveGoals.length})</h3>
            {inactiveGoals.map((goal) => (
              <GoalRow key={goal.id} goal={goal} theme={theme} inactive onEdit={() => startEdit(goal)} onToggle={() => toggleActive(goal)} onDelete={() => handleDelete(goal.id)} />
            ))}
          </>
        )}

        {goals.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-5xl mb-3">📋</p>
            <p className="font-medium">No goals yet. Add some!</p>
          </div>
        )}
      </div>

      {/* Edit/Add modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
            <h2 className="text-2xl font-black text-gray-800 mb-5">
              {editing === 'new' ? '+ Add Goal' : 'Edit Goal'}
            </h2>

            {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded-xl">{error}</p>}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Goal name</label>
                <input
                  className="w-full border-2 border-gray-200 rounded-xl p-3 text-lg font-semibold focus:border-gray-400 outline-none"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Brush teeth"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Icon</label>
                <div className="grid grid-cols-8 gap-2">
                  {GOAL_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setForm((f) => ({ ...f, icon }))}
                      className={`text-3xl p-1 rounded-xl ${form.icon === icon ? 'bg-gray-200 ring-2 ring-gray-400' : ''}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setForm((f) => ({ ...f, category: cat }))}
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold capitalize transition-all ${
                        form.category === cat ? 'ring-2 ring-offset-1 ring-gray-500 ' : 'opacity-70'
                      } ${CATEGORY_COLORS[cat]}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditing(null)} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 font-bold text-gray-600 active:scale-95">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-4 rounded-2xl bg-gray-800 text-white font-black text-lg active:scale-95">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GoalRow({ goal, theme, inactive, onEdit, onToggle, onDelete }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm flex items-center gap-3 p-4 ${inactive ? 'opacity-50' : ''}`}>
      <span className="text-3xl">{goal.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-800 truncate">{goal.title}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[goal.category]}`}>{goal.category}</span>
      </div>
      <button onClick={onToggle} className={`text-sm px-2 py-1 rounded-lg font-semibold ${goal.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
        {goal.active ? '✓ On' : 'Off'}
      </button>
      <button onClick={onEdit} className="p-2 rounded-xl bg-gray-100 text-gray-600 active:scale-90">✏️</button>
      <button onClick={onDelete} className="p-2 rounded-xl bg-red-50 text-red-500 active:scale-90">🗑️</button>
    </div>
  );
}

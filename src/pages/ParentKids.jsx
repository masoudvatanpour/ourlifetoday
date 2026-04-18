import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getKids, generateId } from '../lib/storage';
import { saveKid, deleteKid } from '../lib/db';
import { getTheme, AVATARS, COLOR_OPTIONS } from '../lib/themes';

const BLANK_KID = { name: '', pin: '', avatar: '🦋', color: 'purple', weeklyTarget: 5, age: 6 };

export default function ParentKids() {
  const navigate = useNavigate();
  const [kids, setKids] = useState(getKids);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK_KID);
  const [error, setError] = useState('');

  const reload = () => setKids(getKids());

  const startAdd = () => { setEditing('new'); setForm(BLANK_KID); setError(''); };
  const startEdit = (kid) => { setEditing(kid.id); setForm({ ...kid }); setError(''); };

  const handleSave = () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.pin || form.pin.length !== 4 || !/^\d{4}$/.test(form.pin)) {
      setError('PIN must be exactly 4 digits'); return;
    }
    const id = editing === 'new' ? generateId() : editing;
    saveKid({ ...form, id, name: form.name.trim() });
    setEditing(null);
    reload();
  };

  const handleDelete = (kidId) => {
    if (!confirm('Delete this kid and all their data?')) return;
    deleteKid(kidId);
    reload();
  };

  const theme = editing ? getTheme(form.color) : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-gray-800 px-5 pt-12 pb-6 text-white flex items-center gap-3">
        <button onClick={() => navigate('/parent')} className="text-gray-400 text-sm">← Back</button>
        <div className="flex-1">
          <h1 className="text-2xl font-black">Manage Kids</h1>
        </div>
        <button onClick={startAdd} className="bg-white text-gray-800 px-4 py-2 rounded-xl font-bold text-sm active:scale-95">
          + Add
        </button>
      </div>

      <div className="px-4 pt-5 space-y-3">
        {kids.map((kid) => {
          const t = getTheme(kid.color);
          return (
            <div key={kid.id} className={`bg-white rounded-2xl overflow-hidden shadow-sm border-l-4`} style={{ borderLeftColor: t.primaryHex }}>
              <div className="p-4 flex items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl ${t.bgLight} flex items-center justify-center text-4xl`}>{kid.avatar}</div>
                <div className="flex-1">
                  <p className="text-xl font-black text-gray-800">{kid.name}</p>
                  <p className="text-sm text-gray-500">Age {kid.age} · PIN: {'•'.repeat(kid.pin.length)} · Weekly target: {kid.weeklyTarget} days</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(kid)} className="p-2 rounded-xl bg-gray-100 text-gray-600 active:scale-90">✏️</button>
                  <button onClick={() => handleDelete(kid.id)} className="p-2 rounded-xl bg-red-50 text-red-500 active:scale-90">🗑️</button>
                </div>
              </div>
            </div>
          );
        })}

        {kids.length === 0 && !editing && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-5xl mb-3">👶</p>
            <p className="font-medium">No kids yet. Add one!</p>
          </div>
        )}
      </div>

      {/* Edit/Add form */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
            <h2 className="text-2xl font-black text-gray-800 mb-5">
              {editing === 'new' ? '+ Add Kid' : `Edit ${form.name}`}
            </h2>

            {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded-xl">{error}</p>}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Name</label>
                <input
                  className="w-full border-2 border-gray-200 rounded-xl p-3 text-lg font-semibold focus:border-gray-400 outline-none"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Kid's name"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Age</label>
                <input
                  type="number" min="1" max="18"
                  className="w-full border-2 border-gray-200 rounded-xl p-3 text-lg font-semibold focus:border-gray-400 outline-none"
                  value={form.age}
                  onChange={(e) => setForm((f) => ({ ...f, age: parseInt(e.target.value) || 6 }))}
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">4-digit PIN</label>
                <input
                  type="number" maxLength={4}
                  className="w-full border-2 border-gray-200 rounded-xl p-3 text-lg font-semibold focus:border-gray-400 outline-none"
                  value={form.pin}
                  onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value.slice(0, 4) }))}
                  placeholder="e.g. 1234"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Weekly goal (perfect days needed)</label>
                <div className="flex gap-2">
                  {[3, 4, 5, 6, 7].map((n) => (
                    <button
                      key={n}
                      onClick={() => setForm((f) => ({ ...f, weeklyTarget: n }))}
                      className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${form.weeklyTarget === n ? `${theme?.bg || 'bg-gray-800'} text-white` : 'bg-gray-100 text-gray-600'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Avatar</label>
                <div className="grid grid-cols-8 gap-2">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      onClick={() => setForm((f) => ({ ...f, avatar: a }))}
                      className={`text-3xl p-1 rounded-xl ${form.avatar === a ? 'bg-gray-200 ring-2 ring-gray-400' : ''}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Color theme</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map((c) => {
                    const t = getTheme(c);
                    return (
                      <button
                        key={c}
                        onClick={() => setForm((f) => ({ ...f, color: c }))}
                        className={`px-4 py-2 rounded-xl font-semibold text-sm text-white transition-all ${t.bg} ${form.color === c ? 'ring-3 ring-gray-600 ring-offset-2 scale-105' : 'opacity-70'}`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditing(null)} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 font-bold text-gray-600 active:scale-95">
                Cancel
              </button>
              <button onClick={handleSave} className="flex-1 py-4 rounded-2xl bg-gray-800 text-white font-black text-lg active:scale-95">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

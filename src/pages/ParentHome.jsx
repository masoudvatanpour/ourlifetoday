import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { getKids, getGoals, getDayCompletion, getRewards, getGoalLogs } from '../lib/storage';
import { getTheme } from '../lib/themes';
import { today, getLastNDates, isFuture } from '../lib/dateUtils';

export default function ParentHome() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const kids = getKids();
  const todayStr = today();

  const kidStats = useMemo(() => {
    return kids.map((kid) => {
      const goals = getGoals(kid.id).filter((g) => g.active);
      const todayComp = getDayCompletion(kid.id, todayStr);
      const last7 = getLastNDates(7).filter((d) => !isFuture(d));
      const perfectDays = last7.filter((d) => {
        const { total, completed } = getDayCompletion(kid.id, d);
        return total > 0 && completed === total;
      }).length;
      const rewards = getRewards(kid.id);
      const stars = rewards.filter((r) => r.type === 'star').length;
      const trophies = rewards.filter((r) => r.type === 'trophy').length;

      // Find goals needing attention (< 50% in last 7 days)
      const last7_2 = getLastNDates(7).filter((d) => !isFuture(d));
      const logs = getGoalLogs(kid.id, last7_2[0], last7_2[last7_2.length - 1]);
      const goalIssues = goals.filter((g) => {
        const completed = logs.filter((l) => l.goalId === g.id).length;
        return last7_2.length > 0 && completed / last7_2.length < 0.5;
      });

      return { ...kid, goals, todayComp, perfectDays7: perfectDays, stars, trophies, goalIssues };
    });
  }, [todayStr]);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-gray-800 px-5 pt-12 pb-6 text-white">
        <h1 className="text-3xl font-black">👨‍👩‍👧‍👦 Parent Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Overview of all kids</p>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {kidStats.map((kid) => {
          const theme = getTheme(kid.color);
          return (
            <div key={kid.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className={`bg-gradient-to-r ${theme.gradient} p-4 flex items-center gap-3 text-white`}>
                <div className="text-4xl">{kid.avatar}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-black">{kid.name}</h3>
                  <p className="text-white/70 text-sm">Age {kid.age} · {kid.goals.length} active goals</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black">{kid.todayComp.completed}/{kid.todayComp.total}</p>
                  <p className="text-white/70 text-xs">today</p>
                </div>
              </div>

              <div className="p-4 grid grid-cols-4 gap-3">
                {[
                  { label: 'Perfect days', value: `${kid.perfectDays7}/7`, emoji: '✅' },
                  { label: 'Stars', value: kid.stars, emoji: '⭐' },
                  { label: 'Trophies', value: kid.trophies, emoji: '🏆' },
                  { label: 'Goals', value: kid.goals.length, emoji: '📋' },
                ].map(({ label, value, emoji }) => (
                  <div key={label} className="text-center">
                    <div className="text-xl">{emoji}</div>
                    <div className="font-black text-gray-800 text-lg">{value}</div>
                    <div className="text-xs text-gray-400 leading-tight">{label}</div>
                  </div>
                ))}
              </div>

              {kid.goalIssues.length > 0 && (
                <div className="px-4 pb-4">
                  <div className="bg-orange-50 rounded-xl p-3">
                    <p className="text-xs font-bold text-orange-700 mb-1">⚠️ Needs attention this week:</p>
                    <div className="flex flex-wrap gap-1">
                      {kid.goalIssues.map((g) => (
                        <span key={g.id} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                          {g.icon} {g.title}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {kids.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-6xl mb-4">👶</p>
            <p className="text-xl font-semibold mb-4">No kids yet!</p>
            <button onClick={() => navigate('/parent/kids')} className="bg-gray-800 text-white px-6 py-3 rounded-2xl font-bold">
              Add a Kid
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/parent/kids')} className="bg-white rounded-2xl p-4 shadow-sm text-center border border-gray-100 active:scale-95 transition-transform">
            <p className="text-3xl mb-1">👶</p>
            <p className="font-bold text-gray-700">Manage Kids</p>
          </button>
          <button onClick={() => navigate('/parent/goals')} className="bg-white rounded-2xl p-4 shadow-sm text-center border border-gray-100 active:scale-95 transition-transform">
            <p className="text-3xl mb-1">✅</p>
            <p className="font-bold text-gray-700">Manage Goals</p>
          </button>
          <button onClick={() => navigate('/parent/report')} className="bg-white rounded-2xl p-4 shadow-sm text-center border border-gray-100 active:scale-95 transition-transform">
            <p className="text-3xl mb-1">📊</p>
            <p className="font-bold text-gray-700">View Reports</p>
          </button>
          <button onClick={logout} className="bg-gray-800 rounded-2xl p-4 shadow-sm text-center active:scale-95 transition-transform">
            <p className="text-3xl mb-1">🚪</p>
            <p className="font-bold text-white">Log Out</p>
          </button>
        </div>
      </div>
    </div>
  );
}

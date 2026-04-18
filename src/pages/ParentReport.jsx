import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getKids, getGoals, getDayCompletion, getGoalLogs, getRewards } from '../lib/storage';
import { getTheme } from '../lib/themes';
import { getLastNDates, today, isFuture, formatShort } from '../lib/dateUtils';

export default function ParentReport() {
  const navigate = useNavigate();
  const kids = getKids();
  const todayStr = today();

  const reports = useMemo(() => {
    const last30 = getLastNDates(30).filter((d) => !isFuture(d));
    return kids.map((kid) => {
      const goals = getGoals(kid.id).filter((g) => g.active);
      const logs = getGoalLogs(kid.id, last30[0], last30[last30.length - 1]);

      const perfectDays = last30.filter((d) => {
        const { total, completed } = getDayCompletion(kid.id, d);
        return total > 0 && completed === total;
      }).length;

      const rate = last30.length > 0 ? perfectDays / last30.length : 0;

      const goalStats = goals.map((g) => {
        const done = logs.filter((l) => l.goalId === g.id).length;
        return { ...g, rate: last30.length > 0 ? done / last30.length : 0 };
      });

      const needsWork = goalStats.filter((g) => g.rate < 0.4).sort((a, b) => a.rate - b.rate);
      const crushing = goalStats.filter((g) => g.rate >= 0.75).sort((a, b) => b.rate - a.rate);

      const rewards = getRewards(kid.id);
      const stars = rewards.filter((r) => r.type === 'star').length;
      const trophies = rewards.filter((r) => r.type === 'trophy').length;

      let streak = 0;
      for (const d of [...last30].reverse()) {
        const { total, completed } = getDayCompletion(kid.id, d);
        if (total > 0 && completed === total) streak++;
        else { if (d !== todayStr) break; }
      }

      return { kid, perfectDays, rate, goalStats, needsWork, crushing, stars, trophies, streak, last30: last30.length };
    });
  }, [todayStr]);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-gray-800 px-5 pt-12 pb-6 text-white flex items-center gap-3">
        <button onClick={() => navigate('/parent')} className="text-gray-400 text-sm">← Back</button>
        <div>
          <h1 className="text-2xl font-black">Parent Reports</h1>
          <p className="text-gray-400 text-xs">Last 30 days analysis</p>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-6">
        {/* Comparison */}
        {kids.length >= 2 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-black text-gray-700 text-lg mb-3">📊 Kids Comparison</h3>
            <div className="space-y-3">
              {reports.sort((a, b) => b.rate - a.rate).map(({ kid, rate, perfectDays, last30 }) => {
                const t = getTheme(kid.color);
                return (
                  <div key={kid.id}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{kid.avatar}</span>
                      <span className="font-bold text-gray-700">{kid.name}</span>
                      <span className="ml-auto font-black text-gray-800">{Math.round(rate * 100)}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${rate * 100}%`, backgroundColor: t.primaryHex }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{perfectDays} perfect days out of {last30}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Per-kid detailed report */}
        {reports.map(({ kid, perfectDays, rate, needsWork, crushing, stars, trophies, streak }) => {
          const theme = getTheme(kid.color);
          return (
            <div key={kid.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className={`bg-gradient-to-r ${theme.gradient} p-4 text-white flex items-center gap-3`}>
                <span className="text-4xl">{kid.avatar}</span>
                <div>
                  <h3 className="text-xl font-black">{kid.name}'s Report</h3>
                  <p className="text-white/70 text-sm">Last 30 days</p>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { v: `${Math.round(rate * 100)}%`, l: 'Success rate' },
                    { v: perfectDays, l: 'Perfect days' },
                    { v: streak, l: 'Day streak' },
                    { v: `${stars}⭐ ${trophies}🏆`, l: 'Rewards' },
                  ].map(({ v, l }) => (
                    <div key={l} className={`${theme.bgLight} rounded-xl p-2`}>
                      <p className={`font-black text-sm ${theme.textDark}`}>{v}</p>
                      <p className="text-xs text-gray-500 leading-tight">{l}</p>
                    </div>
                  ))}
                </div>

                {crushing.length > 0 && (
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-sm font-bold text-green-700 mb-1">🚀 Excelling at:</p>
                    <div className="flex flex-wrap gap-1">
                      {crushing.map((g) => (
                        <span key={g.id} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          {g.icon} {g.title} ({Math.round(g.rate * 100)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {needsWork.length > 0 && (
                  <div className="bg-orange-50 rounded-xl p-3">
                    <p className="text-sm font-bold text-orange-700 mb-1">⚠️ Needs more attention:</p>
                    <div className="flex flex-wrap gap-1">
                      {needsWork.map((g) => (
                        <span key={g.id} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                          {g.icon} {g.title} ({Math.round(g.rate * 100)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-sm font-bold text-blue-700">💬 Recommendation:</p>
                  <p className="text-sm text-blue-600 mt-1">
                    {rate >= 0.8
                      ? `${kid.name} is doing fantastic! Keep celebrating their wins. Consider adding more challenging goals.`
                      : rate >= 0.5
                      ? `${kid.name} is making good progress! ${needsWork.length > 0 ? `Help them focus on "${needsWork[0].title}" this week.` : 'Keep encouraging them!'}`
                      : `${kid.name} could use more support. Try doing "${needsWork[0]?.title || 'their goals'}" together to build the habit.`}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import { useAuth } from '../lib/AuthContext';
import { getTheme } from '../lib/themes';
import { getGoals, getDayCompletion, getRewards, getGoalLogs } from '../lib/storage';
import { getLastNDates, getWeekDates, getDayName, today, formatShort, isFuture } from '../lib/dateUtils';

function MiniBar({ value, color, label, date, isToday }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <span className="text-xs text-gray-500">{pct}%</span>
      <div className="w-full bg-gray-100 rounded-full overflow-hidden h-20 flex flex-col justify-end">
        <div
          className="w-full rounded-full transition-all duration-700"
          style={{ height: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className={`text-xs font-semibold ${isToday ? 'text-gray-800' : 'text-gray-400'}`}>{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const { currentKid } = useAuth();
  const theme = getTheme(currentKid?.color);
  const todayStr = today();

  const stats = useMemo(() => {
    if (!currentKid) return {};
    const last30 = getLastNDates(30);
    const last7 = getLastNDates(7);
    const goals = getGoals(currentKid.id).filter((g) => g.active);
    const rewards = getRewards(currentKid.id);
    const stars = rewards.filter((r) => r.type === 'star').length;
    const trophies = rewards.filter((r) => r.type === 'trophy').length;

    let streak = 0;
    const revDays = [...last30].reverse();
    for (const d of revDays) {
      if (isFuture(d)) continue;
      const { total, completed } = getDayCompletion(currentKid.id, d);
      if (total > 0 && completed === total) streak++;
      else { if (d !== todayStr) break; }
    }

    let bestStreak = 0, tempStreak = 0;
    for (const d of last30) {
      if (isFuture(d)) continue;
      const { total, completed } = getDayCompletion(currentKid.id, d);
      if (total > 0 && completed === total) { tempStreak++; bestStreak = Math.max(bestStreak, tempStreak); }
      else tempStreak = 0;
    }

    const month30 = last30.filter((d) => !isFuture(d));
    const perfectDays = month30.filter((d) => {
      const { total, completed } = getDayCompletion(currentKid.id, d);
      return total > 0 && completed === total;
    }).length;
    const monthRate = month30.length > 0 ? perfectDays / month30.length : 0;

    const week7Data = last7.map((d) => {
      const { total, completed } = getDayCompletion(currentKid.id, d);
      return { date: d, rate: total > 0 ? completed / total : 0, label: getDayName(d), isToday: d === todayStr };
    });

    return { streak, bestStreak, stars, trophies, monthRate, week7Data, month30 };
  }, [currentKid, todayStr]);

  const goalRates = useMemo(() => {
    if (!currentKid) return [];
    const last30 = getLastNDates(30).filter((d) => !isFuture(d));
    const goals = getGoals(currentKid.id).filter((g) => g.active);
    if (last30.length === 0) return goals.map((g) => ({ ...g, rate: 0 }));
    const logs = getGoalLogs(currentKid.id, last30[0], last30[last30.length - 1]);
    return goals.map((g) => {
      const completedDays = logs.filter((l) => l.goalId === g.id).length;
      return { ...g, rate: completedDays / last30.length };
    }).sort((a, b) => b.rate - a.rate);
  }, [currentKid]);

  if (!currentKid) return null;

  const { streak = 0, bestStreak = 0, stars = 0, trophies = 0, monthRate = 0, week7Data = [] } = stats;

  return (
    <div className={`min-h-screen pb-28 ${theme.bgLight}`}>
      <div className={`bg-gradient-to-br ${theme.gradient} px-5 pt-12 pb-6 text-white`}>
        <h1 className="text-3xl font-black mb-1">📊 My Stats</h1>
        <p className="text-white/70 text-sm">How awesome are you?</p>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* Top stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { emoji: '🔥', value: streak, label: 'Current streak', sub: 'days in a row' },
            { emoji: '🏆', value: bestStreak, label: 'Best streak', sub: 'days in a row' },
            { emoji: '⭐', value: stars, label: 'Total stars', sub: 'earned' },
            { emoji: '🥇', value: trophies, label: 'Trophies', sub: 'collected' },
          ].map(({ emoji, value, label, sub }) => (
            <div key={label} className={`bg-white rounded-2xl p-4 shadow-sm border ${theme.border}`}>
              <div className="text-3xl mb-1">{emoji}</div>
              <div className={`text-3xl font-black ${theme.textDark}`}>{value}</div>
              <div className="text-sm font-semibold text-gray-600">{label}</div>
              <div className="text-xs text-gray-400">{sub}</div>
            </div>
          ))}
        </div>

        {/* Monthly rate */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-700">Monthly completion rate</h3>
            <span className={`text-2xl font-black ${theme.textDark}`}>{Math.round(monthRate * 100)}%</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${monthRate * 100}%`, backgroundColor: theme.primaryHex }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
        </div>

        {/* Weekly bars */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-700 mb-4">This week</h3>
          <div className="flex gap-2">
            {week7Data.map((d) => (
              <MiniBar
                key={d.date}
                value={isFuture(d.date) ? 0 : d.rate}
                color={theme.primaryHex}
                label={d.label}
                isToday={d.isToday}
              />
            ))}
          </div>
        </div>

        {/* Per-goal breakdown */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-700 mb-3">Goal breakdown (30 days)</h3>
          <div className="space-y-3">
            {goalRates.map((g) => (
              <div key={g.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{g.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{g.title}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-600">{Math.round(g.rate * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${g.rate * 100}%`, backgroundColor: theme.primaryHex }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

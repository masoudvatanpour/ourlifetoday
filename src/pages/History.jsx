import { useMemo } from 'react';
import { useAuth } from '../lib/AuthContext';
import { getTheme } from '../lib/themes';
import { getDayCompletion } from '../lib/storage';
import { getLast365Days, getMonthLabel, getDayName, today, isFuture } from '../lib/dateUtils';

function DayCell({ date, rate, isToday }) {
  let bg = 'bg-gray-100';
  if (isFuture(date)) bg = 'bg-gray-50';
  else if (rate === null) bg = 'bg-gray-100';
  else if (rate === 1) bg = 'bg-green-500';
  else if (rate >= 0.5) bg = 'bg-green-300';
  else if (rate > 0) bg = 'bg-yellow-300';
  else bg = 'bg-red-200';

  return (
    <div
      className={`w-3.5 h-3.5 rounded-sm ${bg} ${isToday ? 'ring-2 ring-gray-600 ring-offset-1' : ''}`}
      title={date}
    />
  );
}

export default function History() {
  const { currentKid } = useAuth();
  const theme = getTheme(currentKid?.color);
  const todayStr = today();

  const { weeks, monthLabels } = useMemo(() => {
    const days = getLast365Days();
    // Pad start so first day aligns to Sunday
    const firstDate = new Date(days[0] + 'T12:00:00');
    const startPad = firstDate.getDay(); // 0=Sun
    const padded = [...Array(startPad).fill(null), ...days];

    const weeks = [];
    for (let i = 0; i < padded.length; i += 7) {
      weeks.push(padded.slice(i, i + 7));
    }

    // Month labels: place at first week of each month
    const labels = [];
    let lastMonth = null;
    weeks.forEach((week, wi) => {
      const firstDay = week.find(Boolean);
      if (!firstDay) return;
      const month = getMonthLabel(firstDay);
      if (month !== lastMonth) { labels.push({ wi, month }); lastMonth = month; }
    });

    return { weeks, monthLabels: labels };
  }, []);

  const dayData = useMemo(() => {
    const map = {};
    getLast365Days().forEach((d) => {
      if (isFuture(d)) { map[d] = null; return; }
      const { total, completed } = getDayCompletion(currentKid?.id, d);
      map[d] = total === 0 ? null : completed / total;
    });
    return map;
  }, [currentKid]);

  // Stats
  const { totalDays, perfectDays, currentStreak } = useMemo(() => {
    const days = getLast365Days().filter((d) => !isFuture(d));
    let totalDays = 0, perfectDays = 0, streak = 0;
    const rev = [...days].reverse();
    for (const d of rev) {
      const r = dayData[d];
      if (r === null) continue;
      totalDays++;
      if (r === 1) { perfectDays++; if (streak >= 0) streak++; }
      else { if (streak > 0 && d !== todayStr) break; }
    }
    return { totalDays, perfectDays, currentStreak: streak };
  }, [dayData, todayStr]);

  if (!currentKid) return null;

  return (
    <div className={`min-h-screen pb-28 ${theme.bgLight}`}>
      <div className={`bg-gradient-to-br ${theme.gradient} px-5 pt-12 pb-6 text-white`}>
        <h1 className="text-3xl font-black mb-1">📅 My History</h1>
        <p className="text-white/70 text-sm">Your last 365 days</p>
      </div>

      <div className="px-4 pt-5">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { emoji: '🔥', value: currentStreak, label: 'Day streak' },
            { emoji: '💚', value: perfectDays, label: 'Perfect days' },
            { emoji: '📈', value: `${totalDays > 0 ? Math.round((perfectDays / totalDays) * 100) : 0}%`, label: 'Success rate' },
          ].map(({ emoji, value, label }) => (
            <div key={label} className={`bg-white rounded-2xl p-3 text-center shadow-sm border ${theme.border}`}>
              <div className="text-2xl">{emoji}</div>
              <div className={`text-xl font-black ${theme.textDark}`}>{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-700 mb-3">Activity heatmap</h3>

          {/* Day labels */}
          <div className="flex gap-1 mb-1 pl-0">
            <div className="flex flex-col gap-1 mr-1">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} className="w-3.5 h-3.5 flex items-center justify-center text-[8px] text-gray-400">{d}</div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <div className="flex gap-1">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-1">
                    {week.map((date, di) =>
                      date ? (
                        <DayCell
                          key={di}
                          date={date}
                          rate={dayData[date] ?? null}
                          isToday={date === todayStr}
                        />
                      ) : (
                        <div key={di} className="w-3.5 h-3.5" />
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-3 justify-center flex-wrap text-xs text-gray-500">
          {[
            { bg: 'bg-gray-100', label: 'No data' },
            { bg: 'bg-red-200', label: 'Some' },
            { bg: 'bg-yellow-300', label: 'Half' },
            { bg: 'bg-green-300', label: 'Most' },
            { bg: 'bg-green-500', label: 'All ✓' },
          ].map(({ bg, label }) => (
            <div key={label} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-sm ${bg}`} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

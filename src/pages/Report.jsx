import { useMemo } from 'react';
import { useAuth } from '../lib/AuthContext';
import { getTheme } from '../lib/themes';
import { getGoals, getGoalLogs, getDayCompletion } from '../lib/storage';
import { getLastNDates, getDayName, today, isFuture } from '../lib/dateUtils';

function InsightCard({ emoji, title, items, bg, textColor }) {
  return (
    <div className={`rounded-2xl p-4 ${bg}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{emoji}</span>
        <h3 className={`font-bold text-lg ${textColor}`}>{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm opacity-60">Nothing to show yet — keep going!</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 bg-white/60 rounded-xl p-2">
              <span className="text-xl">{item.icon}</span>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${textColor}`}>{item.title}</p>
                <p className="text-xs opacity-60">{Math.round(item.rate * 100)}% of days</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Report() {
  const { currentKid } = useAuth();
  const theme = getTheme(currentKid?.color);
  const todayStr = today();

  const analysis = useMemo(() => {
    if (!currentKid) return {};
    const last30 = getLastNDates(30).filter((d) => !isFuture(d));
    const goals = getGoals(currentKid.id).filter((g) => g.active);
    const logs = getGoalLogs(currentKid.id, last30[0], last30[last30.length - 1]);

    const goalRates = goals.map((g) => {
      const completedDays = logs.filter((l) => l.goalId === g.id).length;
      return { ...g, rate: last30.length > 0 ? completedDays / last30.length : 0 };
    });

    const crushing = goalRates.filter((g) => g.rate >= 0.75).sort((a, b) => b.rate - a.rate);
    const steady = goalRates.filter((g) => g.rate >= 0.4 && g.rate < 0.75).sort((a, b) => b.rate - a.rate);
    const needsWork = goalRates.filter((g) => g.rate < 0.4).sort((a, b) => a.rate - b.rate);

    // Best/worst days of week
    const dayMap = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] };
    last30.forEach((d) => {
      const { total, completed } = getDayCompletion(currentKid.id, d);
      const name = getDayName(d);
      if (total > 0 && dayMap[name] !== undefined) dayMap[name].push(completed / total);
    });
    const dayAvgs = Object.entries(dayMap).map(([day, rates]) => ({
      day,
      avg: rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0,
      count: rates.length,
    })).filter((d) => d.count > 0).sort((a, b) => b.avg - a.avg);

    // Overall completion
    const totalPossible = last30.length;
    const perfectDays = last30.filter((d) => {
      const { total, completed } = getDayCompletion(currentKid.id, d);
      return total > 0 && completed === total;
    }).length;

    // Streak calc
    let streak = 0;
    for (const d of [...last30].reverse()) {
      const { total, completed } = getDayCompletion(currentKid.id, d);
      if (total > 0 && completed === total) streak++;
      else { if (d !== todayStr) break; }
    }

    return { crushing, steady, needsWork, dayAvgs, perfectDays, totalPossible, streak, goalRates };
  }, [currentKid, todayStr]);

  if (!currentKid) return null;

  const { crushing = [], steady = [], needsWork = [], dayAvgs = [], perfectDays = 0, totalPossible = 0, streak = 0 } = analysis;
  const overallRate = totalPossible > 0 ? Math.round((perfectDays / totalPossible) * 100) : 0;

  const summaryMessage = () => {
    if (overallRate >= 80) return { text: `You're a SUPERSTAR, ${currentKid.name}! 🌟 Keep up the amazing work!`, color: 'text-green-700', bg: 'bg-green-50' };
    if (overallRate >= 50) return { text: `Nice work, ${currentKid.name}! 💪 You're doing well — keep pushing!`, color: 'text-blue-700', bg: 'bg-blue-50' };
    return { text: `You can do it, ${currentKid.name}! 🎯 A little more effort goes a long way!`, color: 'text-orange-700', bg: 'bg-orange-50' };
  };

  const msg = summaryMessage();

  return (
    <div className={`min-h-screen pb-28 ${theme.bgLight}`}>
      <div className={`bg-gradient-to-br ${theme.gradient} px-5 pt-12 pb-6 text-white`}>
        <h1 className="text-3xl font-black mb-1">💡 My Report</h1>
        <p className="text-white/70 text-sm">Last 30 days · what's working?</p>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* Summary banner */}
        <div className={`${msg.bg} rounded-2xl p-4 border-2 border-white shadow-sm`}>
          <p className={`text-lg font-bold ${msg.color}`}>{msg.text}</p>
          <div className="flex gap-4 mt-3">
            <div className="text-center">
              <p className={`text-3xl font-black ${msg.color}`}>{overallRate}%</p>
              <p className="text-xs text-gray-500">overall</p>
            </div>
            <div className="text-center">
              <p className={`text-3xl font-black ${msg.color}`}>{streak}</p>
              <p className="text-xs text-gray-500">day streak</p>
            </div>
            <div className="text-center">
              <p className={`text-3xl font-black ${msg.color}`}>{perfectDays}</p>
              <p className="text-xs text-gray-500">perfect days</p>
            </div>
          </div>
        </div>

        <InsightCard
          emoji="🚀"
          title="Crushing it!"
          items={crushing}
          bg="bg-green-50"
          textColor="text-green-800"
        />

        <InsightCard
          emoji="📈"
          title="Getting there..."
          items={steady}
          bg="bg-blue-50"
          textColor="text-blue-800"
        />

        <InsightCard
          emoji="🎯"
          title="Focus on these"
          items={needsWork}
          bg="bg-orange-50"
          textColor="text-orange-800"
        />

        {/* Best days */}
        {dayAvgs.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-gray-700 mb-3">Best days of the week</h3>
            <div className="space-y-2">
              {dayAvgs.slice(0, 4).map(({ day, avg }, i) => (
                <div key={day} className="flex items-center gap-3">
                  <span className="text-lg">{['🥇', '🥈', '🥉', '4️⃣'][i]}</span>
                  <span className="w-10 font-semibold text-gray-700 text-sm">{day}</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${avg * 100}%`, backgroundColor: theme.primaryHex }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-600 w-10 text-right">{Math.round(avg * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tip */}
        <div className={`${theme.bgMed} rounded-2xl p-4`}>
          <p className="text-sm font-semibold text-center text-gray-600">
            💬 Tip: {needsWork.length > 0
              ? `Try setting a reminder for "${needsWork[0].title}" — you can do it!`
              : crushing.length > 0
              ? `You're amazing at "${crushing[0].title}" — you're a true champion!`
              : 'Keep checking your goals every day — small steps lead to big wins!'}
          </p>
        </div>
      </div>
    </div>
  );
}

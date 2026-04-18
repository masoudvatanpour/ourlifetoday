import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { getTheme } from '../lib/themes';
import {
  getGoals, toggleGoalLog, isGoalCompleted, getDayCompletion,
  hasDailyStarForDate, addReward, addGameUnlock, getGoalLogs,
} from '../lib/storage';
import { today, formatDateDisplay, getWeekDates, getWeekOf } from '../lib/dateUtils';
import GoalCheckItem from '../components/GoalCheckItem';
import CelebrationModal from '../components/CelebrationModal';

export default function Today() {
  const { currentKid } = useAuth();
  const navigate = useNavigate();
  const theme = getTheme(currentKid?.color);
  const todayStr = today();
  const [goals, setGoals] = useState([]);
  const [completedMap, setCompletedMap] = useState({});
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState(null);
  const [allDone, setAllDone] = useState(false);

  const loadData = useCallback(() => {
    if (!currentKid) return;
    const g = getGoals(currentKid.id).filter((g) => g.active).sort((a, b) => a.order - b.order);
    setGoals(g);
    const map = {};
    g.forEach((goal) => { map[goal.id] = isGoalCompleted(goal.id, todayStr); });
    setCompletedMap(map);
    const completion = getDayCompletion(currentKid.id, todayStr);
    setAllDone(completion.total > 0 && completion.completed === completion.total);
  }, [currentKid, todayStr]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggle = (goalId) => {
    const newVal = !completedMap[goalId];
    toggleGoalLog(goalId, currentKid.id, todayStr);
    const newMap = { ...completedMap, [goalId]: newVal };
    setCompletedMap(newMap);

    const total = goals.length;
    const completed = Object.values(newMap).filter(Boolean).length;
    const wasAllDone = allDone;
    const nowAllDone = total > 0 && completed === total;
    setAllDone(nowAllDone);

    if (nowAllDone && !wasAllDone) {
      checkForRewards(nowAllDone);
    }
  };

  const checkForRewards = (isAllDone) => {
    if (!isAllDone) return;

    let reward = { icon: '🌟', label: 'Daily Star!', detail: 'You completed all your goals today!' };
    let alreadyHasStar = hasDailyStarForDate(currentKid.id, todayStr);

    if (!alreadyHasStar) {
      addReward({ kidId: currentKid.id, type: 'star', icon: '⭐', name: 'Daily Star', forDate: todayStr, reason: 'Completed all goals' });
    }

    // Check weekly target
    const weekDates = getWeekDates(todayStr);
    const weekTarget = currentKid.weeklyTarget || 5;
    let daysCompleted = 0;
    for (const d of weekDates) {
      if (d > todayStr) continue;
      const { total, completed } = getDayCompletion(currentKid.id, d);
      if (total > 0 && completed === total) daysCompleted++;
    }

    if (daysCompleted >= weekTarget) {
      const weekOf = getWeekOf(todayStr);
      const unlock = addGameUnlock(currentKid.id, weekOf);
      if (unlock) {
        reward = {
          icon: '🏆',
          label: 'Trophy Earned!',
          detail: `You completed your goals ${daysCompleted} days this week! Game unlocked!`,
        };
        addReward({ kidId: currentKid.id, type: 'trophy', icon: '🏆', name: 'Weekly Trophy', forWeek: weekOf, reason: `Completed ${daysCompleted}/${weekTarget} days` });
      }
    }

    setCelebrationData({ icon: reward.icon, label: reward.label, detail: reward.detail });
    setShowCelebration(true);
  };

  if (!currentKid) return null;

  const completedCount = Object.values(completedMap).filter(Boolean).length;
  const total = goals.length;
  const progress = total > 0 ? completedCount / total : 0;

  return (
    <div className={`min-h-screen pb-28 ${theme.bgLight}`}>
      {/* Header */}
      <div className={`bg-gradient-to-br ${theme.gradient} px-5 pt-12 pb-8 text-white`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
              {currentKid.avatar}
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium">Good job,</p>
              <h1 className="text-2xl font-black">{currentKid.name}!</h1>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-xs">Today</p>
            <p className="font-bold text-sm">{formatDateDisplay(todayStr).split(',')[0]}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white/20 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold">
              {allDone ? '🎉 All done!' : `${completedCount} of ${total} goals`}
            </span>
            <span className="font-bold text-lg">{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-3 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Goals list */}
      <div className="px-4 pt-5 space-y-3">
        {goals.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-6xl mb-4">📋</p>
            <p className="text-xl font-semibold">No goals yet!</p>
            <p className="text-sm mt-2">Ask a parent to add some goals for you.</p>
          </div>
        ) : (
          goals.map((goal) => (
            <GoalCheckItem
              key={goal.id}
              goal={goal}
              completed={completedMap[goal.id] || false}
              onToggle={() => handleToggle(goal.id)}
              theme={theme}
            />
          ))
        )}

        {allDone && goals.length > 0 && (
          <div className={`mt-4 p-5 rounded-3xl ${theme.bgMed} text-center border-2 ${theme.borderMed}`}>
            <p className="text-4xl mb-2">🎊</p>
            <p className={`text-xl font-black ${theme.textDark}`}>Amazing work today!</p>
            <p className={`text-sm ${theme.text} mt-1`}>You're on a roll! Keep it up!</p>
          </div>
        )}
      </div>

      <CelebrationModal
        show={showCelebration}
        onClose={() => setShowCelebration(false)}
        title={celebrationData?.icon + ' ' + celebrationData?.label}
        subtitle={celebrationData?.detail}
        reward={celebrationData}
      />
    </div>
  );
}

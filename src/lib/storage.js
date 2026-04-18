const KEYS = {
  KIDS: 'olt_kids',
  GOALS: 'olt_goals',
  GOAL_LOGS: 'olt_goal_logs',
  REWARDS: 'olt_rewards',
  GAME_UNLOCKS: 'olt_game_unlocks',
  SETTINGS: 'olt_settings',
};

const get = (key) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
};

const set = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Settings
export const getSettings = () =>
  get(KEYS.SETTINGS) || { parentPin: '0000', initialized: false };
export const saveSettings = (settings) =>
  set(KEYS.SETTINGS, { ...getSettings(), ...settings });

// Kids
export const getKids = () => get(KEYS.KIDS) || [];
export const saveKid = (kid) => {
  const kids = getKids();
  const idx = kids.findIndex((k) => k.id === kid.id);
  if (idx >= 0) kids[idx] = kid;
  else kids.push(kid);
  set(KEYS.KIDS, kids);
  return kid;
};
export const deleteKid = (kidId) => {
  set(KEYS.KIDS, getKids().filter((k) => k.id !== kidId));
  set(KEYS.GOALS, (get(KEYS.GOALS) || []).filter((g) => g.kidId !== kidId));
  set(KEYS.GOAL_LOGS, (get(KEYS.GOAL_LOGS) || []).filter((l) => l.kidId !== kidId));
  set(KEYS.REWARDS, (get(KEYS.REWARDS) || []).filter((r) => r.kidId !== kidId));
  set(KEYS.GAME_UNLOCKS, (get(KEYS.GAME_UNLOCKS) || []).filter((u) => u.kidId !== kidId));
};

// Goals
export const getGoals = (kidId = null) => {
  const goals = get(KEYS.GOALS) || [];
  return kidId ? goals.filter((g) => g.kidId === kidId) : goals;
};
export const saveGoal = (goal) => {
  const goals = get(KEYS.GOALS) || [];
  const idx = goals.findIndex((g) => g.id === goal.id);
  if (idx >= 0) goals[idx] = goal;
  else goals.push(goal);
  set(KEYS.GOALS, goals);
  return goal;
};
export const deleteGoal = (goalId) => {
  set(KEYS.GOALS, (get(KEYS.GOALS) || []).filter((g) => g.id !== goalId));
  set(KEYS.GOAL_LOGS, (get(KEYS.GOAL_LOGS) || []).filter((l) => l.goalId !== goalId));
};

// Goal Logs
export const getGoalLogs = (kidId = null, startDate = null, endDate = null) => {
  const logs = get(KEYS.GOAL_LOGS) || [];
  return logs.filter((l) => {
    if (kidId && l.kidId !== kidId) return false;
    if (startDate && l.date < startDate) return false;
    if (endDate && l.date > endDate) return false;
    return true;
  });
};
export const toggleGoalLog = (goalId, kidId, date) => {
  const logs = get(KEYS.GOAL_LOGS) || [];
  const idx = logs.findIndex((l) => l.goalId === goalId && l.date === date);
  if (idx >= 0) {
    logs.splice(idx, 1);
  } else {
    logs.push({ id: generateId(), goalId, kidId, date, completed: true, completedAt: new Date().toISOString() });
  }
  set(KEYS.GOAL_LOGS, logs);
  return logs;
};
export const isGoalCompleted = (goalId, date) => {
  return (get(KEYS.GOAL_LOGS) || []).some((l) => l.goalId === goalId && l.date === date);
};

// Get completion data for a specific day
export const getDayCompletion = (kidId, date) => {
  const goals = getGoals(kidId).filter((g) => g.active);
  if (goals.length === 0) return { total: 0, completed: 0, rate: 0 };
  const logs = getGoalLogs(kidId, date, date);
  const completed = logs.filter((l) => goals.some((g) => g.id === l.goalId)).length;
  return { total: goals.length, completed, rate: completed / goals.length };
};

// Rewards
export const getRewards = (kidId) =>
  (get(KEYS.REWARDS) || []).filter((r) => r.kidId === kidId);
export const addReward = (reward) => {
  const rewards = get(KEYS.REWARDS) || [];
  const r = { ...reward, id: generateId(), earnedAt: new Date().toISOString() };
  rewards.push(r);
  set(KEYS.REWARDS, rewards);
  return r;
};
export const hasDailyStarForDate = (kidId, date) =>
  (get(KEYS.REWARDS) || []).some(
    (r) => r.kidId === kidId && r.type === 'star' && r.forDate === date
  );

// Game Unlocks
export const getGameUnlocks = (kidId) =>
  (get(KEYS.GAME_UNLOCKS) || []).filter((u) => u.kidId === kidId);
export const getAvailableGameUnlock = (kidId) =>
  (get(KEYS.GAME_UNLOCKS) || []).find((u) => u.kidId === kidId && !u.used);
export const addGameUnlock = (kidId, weekOf) => {
  const unlocks = get(KEYS.GAME_UNLOCKS) || [];
  // Don't add duplicate for same week
  if (unlocks.some((u) => u.kidId === kidId && u.weekOf === weekOf)) return null;
  const unlock = { id: generateId(), kidId, weekOf, used: false, createdAt: new Date().toISOString() };
  unlocks.push(unlock);
  set(KEYS.GAME_UNLOCKS, unlocks);
  return unlock;
};
export const markGameUnlockUsed = (unlockId) => {
  const unlocks = get(KEYS.GAME_UNLOCKS) || [];
  const idx = unlocks.findIndex((u) => u.id === unlockId);
  if (idx >= 0) unlocks[idx].used = true;
  set(KEYS.GAME_UNLOCKS, unlocks);
};

// Initialize with sample data on first run
export const initializeDefaultData = () => {
  const settings = getSettings();
  if (settings.initialized) return;

  const kids = [
    { id: 'kid1', name: 'Emma', pin: '1234', avatar: '🦋', color: 'purple', weeklyTarget: 5, age: 7 },
    { id: 'kid2', name: 'Leo', pin: '5678', avatar: '🦁', color: 'blue', weeklyTarget: 5, age: 5 },
  ];

  const goals = [
    { id: 'g1', kidId: 'kid1', title: 'Brush teeth', icon: '🦷', category: 'health', active: true, order: 0 },
    { id: 'g2', kidId: 'kid1', title: 'Make my bed', icon: '🛏️', category: 'chore', active: true, order: 1 },
    { id: 'g3', kidId: 'kid1', title: 'Read for 15 min', icon: '📚', category: 'learning', active: true, order: 2 },
    { id: 'g4', kidId: 'kid1', title: 'Do some exercise', icon: '🏃', category: 'health', active: true, order: 3 },
    { id: 'g5', kidId: 'kid1', title: 'Help set the table', icon: '🍽️', category: 'chore', active: true, order: 4 },
    { id: 'g6', kidId: 'kid1', title: 'Be kind to sibling', icon: '💝', category: 'kindness', active: true, order: 5 },
    { id: 'g7', kidId: 'kid2', title: 'Brush teeth', icon: '🦷', category: 'health', active: true, order: 0 },
    { id: 'g8', kidId: 'kid2', title: 'Clean up toys', icon: '🧸', category: 'chore', active: true, order: 1 },
    { id: 'g9', kidId: 'kid2', title: 'Practice writing', icon: '✏️', category: 'learning', active: true, order: 2 },
    { id: 'g10', kidId: 'kid2', title: 'Eat vegetables', icon: '🥦', category: 'health', active: true, order: 3 },
    { id: 'g11', kidId: 'kid2', title: 'Help tidy up', icon: '🧹', category: 'chore', active: true, order: 4 },
  ];

  set(KEYS.KIDS, kids);
  set(KEYS.GOALS, goals);
  saveSettings({ initialized: true, parentPin: '0000' });
};

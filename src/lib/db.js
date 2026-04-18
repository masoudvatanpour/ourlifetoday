// Write-through layer: writes go to localStorage immediately + Supabase in background.
// All reads still use storage.js directly (fast, synchronous).
import { supabase } from './supabase';
import {
  saveKid as lsSaveKid, deleteKid as lsDeleteKid,
  saveGoal as lsSaveGoal, deleteGoal as lsDeleteGoal,
  toggleGoalLog as lsToggleGoalLog, getGoalLogs as lsGetGoalLogs,
  addReward as lsAddReward,
  addGameUnlock as lsAddGameUnlock, markGameUnlockUsed as lsMarkGameUnlockUsed,
  saveSettings as lsSaveSettings, generateId,
} from './storage';

let familyId = null;
export const setFamilyId = (id) => { familyId = id; };
export const getFamilyId = () => familyId;

const sb = () => supabase; // null-safe accessor

// --- On login: pull all family data from Supabase into localStorage ---
export const loadFamilyData = async (userId) => {
  if (!sb()) return;
  try {
    // Get or create family row
    let { data: family } = await sb().from('families').select('id, parent_pin').eq('user_id', userId).single();
    if (!family) {
      const { data: created } = await sb().from('families').insert({ user_id: userId }).select('id, parent_pin').single();
      family = created;
    }
    if (!family) return;
    familyId = family.id;
    lsSaveSettings({ parentPin: family.parent_pin || '0000', initialized: true });

    // Kids
    const { data: kids } = await sb().from('kids').select('*').eq('family_id', familyId);
    localStorage.setItem('olt_kids', JSON.stringify(
      (kids || []).map((k) => ({
        id: k.id, name: k.name, pin: k.pin, avatar: k.avatar,
        color: k.color, weeklyTarget: k.weekly_target, age: k.age,
      }))
    ));

    if (!kids?.length) return;
    const kidIds = kids.map((k) => k.id);

    // Goals
    const { data: goals } = await sb().from('goals').select('*').in('kid_id', kidIds);
    localStorage.setItem('olt_goals', JSON.stringify(
      (goals || []).map((g) => ({
        id: g.id, kidId: g.kid_id, title: g.title, icon: g.icon,
        category: g.category, active: g.active, order: g.order,
      }))
    ));

    // Goal logs (last 400 days)
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 400);
    const { data: logs } = await sb().from('goal_logs').select('*')
      .in('kid_id', kidIds).gte('date', cutoff.toISOString().split('T')[0]);
    localStorage.setItem('olt_goal_logs', JSON.stringify(
      (logs || []).map((l) => ({
        id: l.id, goalId: l.goal_id, kidId: l.kid_id,
        date: l.date, completed: true, completedAt: l.completed_at,
      }))
    ));

    // Rewards
    const { data: rewards } = await sb().from('rewards').select('*').in('kid_id', kidIds);
    localStorage.setItem('olt_rewards', JSON.stringify(
      (rewards || []).map((r) => ({
        id: r.id, kidId: r.kid_id, type: r.type, icon: r.icon,
        name: r.name, forDate: r.for_date, forWeek: r.for_week,
        reason: r.reason, earnedAt: r.earned_at,
      }))
    ));

    // Game unlocks
    const { data: unlocks } = await sb().from('game_unlocks').select('*').in('kid_id', kidIds);
    localStorage.setItem('olt_game_unlocks', JSON.stringify(
      (unlocks || []).map((u) => ({
        id: u.id, kidId: u.kid_id, weekOf: u.week_of, used: u.used, createdAt: u.created_at,
      }))
    ));
  } catch (e) {
    console.error('loadFamilyData error:', e);
  }
};

export const clearLocalData = () => {
  ['olt_kids', 'olt_goals', 'olt_goal_logs', 'olt_rewards', 'olt_game_unlocks', 'olt_settings']
    .forEach((k) => localStorage.removeItem(k));
  familyId = null;
};

// --- Write-through functions (same API as storage.js) ---

export const saveKid = (kid) => {
  lsSaveKid(kid);
  if (familyId && sb()) {
    sb().from('kids').upsert({
      id: kid.id, family_id: familyId, name: kid.name, pin: kid.pin,
      avatar: kid.avatar, color: kid.color, weekly_target: kid.weeklyTarget, age: kid.age,
    }).then();
  }
  return kid;
};

export const deleteKid = (kidId) => {
  lsDeleteKid(kidId);
  if (sb()) sb().from('kids').delete().eq('id', kidId).then();
};

export const saveGoal = (goal) => {
  lsSaveGoal(goal);
  if (sb()) {
    sb().from('goals').upsert({
      id: goal.id, kid_id: goal.kidId, title: goal.title, icon: goal.icon,
      category: goal.category, active: goal.active, order: goal.order,
    }).then();
  }
  return goal;
};

export const deleteGoal = (goalId) => {
  lsDeleteGoal(goalId);
  if (sb()) sb().from('goals').delete().eq('id', goalId).then();
};

export const toggleGoalLog = (goalId, kidId, date) => {
  const wasCompleted = lsGetGoalLogs(kidId, date, date).some((l) => l.goalId === goalId);
  const logs = lsToggleGoalLog(goalId, kidId, date);
  if (sb()) {
    if (wasCompleted) {
      sb().from('goal_logs').delete().eq('goal_id', goalId).eq('date', date).then();
    } else {
      sb().from('goal_logs').upsert({ id: generateId(), goal_id: goalId, kid_id: kidId, date }).then();
    }
  }
  return logs;
};

export const addReward = (reward) => {
  const saved = lsAddReward(reward);
  if (sb()) {
    sb().from('rewards').insert({
      id: saved.id, kid_id: saved.kidId, type: saved.type, icon: saved.icon,
      name: saved.name, for_date: saved.forDate || null, for_week: saved.forWeek || null,
      reason: saved.reason,
    }).then();
  }
  return saved;
};

export const addGameUnlock = (kidId, weekOf) => {
  const unlock = lsAddGameUnlock(kidId, weekOf);
  if (unlock && sb()) {
    sb().from('game_unlocks').upsert({
      id: unlock.id, kid_id: unlock.kidId, week_of: unlock.weekOf, used: false,
    }).then();
  }
  return unlock;
};

export const markGameUnlockUsed = (unlockId) => {
  lsMarkGameUnlockUsed(unlockId);
  if (sb()) sb().from('game_unlocks').update({ used: true }).eq('id', unlockId).then();
};

export const saveSettings = (settings) => {
  lsSaveSettings(settings);
  if (settings.parentPin && familyId && sb()) {
    sb().from('families').update({ parent_pin: settings.parentPin }).eq('id', familyId).then();
  }
};

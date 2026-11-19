import { FriendRelation } from '../types';

export function getTodayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getYesterdayKey(date = new Date()): string {
  const prev = new Date(date);
  prev.setDate(prev.getDate() - 1);
  return getTodayKey(prev);
}

export function daysBetweenKeys(keyA: string, keyB: string): number {
  const [ya, ma, da] = keyA.split('-').map(Number);
  const [yb, mb, db] = keyB.split('-').map(Number);
  const utcA = Date.UTC(ya, ma - 1, da);
  const utcB = Date.UTC(yb, mb - 1, db);
  return Math.round((utcB - utcA) / (1000 * 60 * 60 * 24));
}

/**
 * Updates streak state when a snap is exchanged by either side.
 * Rules:
 * - A streak increases by +1 only once per calendar day when BOTH users have sent at least one snap on the current day (or completing yesterday's pair).
 * - If > 1 day has elapsed without an exchange from either side, streak resets to 0.
 */
export function applySnapExchangeToStreak(
  relation: FriendRelation,
  sender: 'me' | 'them',
  now = new Date()
): FriendRelation {
  const today = getTodayKey(now);
  const yesterday = getYesterdayKey(now);

  let next = { ...relation };
  if (sender === 'me') {
    next.lastSnapFromMeDate = today;
  } else {
    next.lastSnapFromThemDate = today;
  }
  next.lastSnapTimestamp = now.getTime();

  // Check if streak already expired before today
  const meValid =
    relation.lastSnapFromMeDate === today || relation.lastSnapFromMeDate === yesterday;
  const themValid =
    relation.lastSnapFromThemDate === today || relation.lastSnapFromThemDate === yesterday;

  if (relation.streakCount > 0 && (!meValid || !themValid)) {
    next.streakCount = 0;
  }

  // Both exchanged today?
  const bothToday = next.lastSnapFromMeDate === today && next.lastSnapFromThemDate === today;
  const alreadyIncrementedToday = next.streakHistory.some((h) => h.date === today);

  if (bothToday && !alreadyIncrementedToday) {
    const newCount = next.streakCount + 1;
    next.streakCount = newCount;
    next.streakHistory = [...next.streakHistory.slice(-29), { date: today, count: newCount }];
  }

  return next;
}

export interface StreakStatusInfo {
  isActive: boolean;
  isExpiringSoon: boolean;
  needsMySnapToday: boolean;
  needsTheirSnapToday: boolean;
  hoursRemaining: number;
  milestoneLabel: string | null;
}

export function getStreakStatusInfo(relation: FriendRelation, now = new Date()): StreakStatusInfo {
  const today = getTodayKey(now);
  const yesterday = getYesterdayKey(now);

  const meToday = relation.lastSnapFromMeDate === today;
  const themToday = relation.lastSnapFromThemDate === today;
  const meValid = meToday || relation.lastSnapFromMeDate === yesterday;
  const themValid = themToday || relation.lastSnapFromThemDate === yesterday;

  const isActive = relation.streakCount > 0 && meValid && themValid;

  // Hours until end of today or 24h from last snap
  const lastTs = relation.lastSnapTimestamp ?? now.getTime() - 12 * 3600 * 1000;
  const expiryTs = lastTs + 24 * 60 * 60 * 1000;
  const hoursRemaining = Math.max(0, Math.round(((expiryTs - now.getTime()) / (1000 * 60 * 60)) * 10) / 10);

  const isExpiringSoon = isActive && (!meToday || !themToday) && hoursRemaining <= 6;

  let milestoneLabel: string | null = null;
  if (relation.streakCount >= 365) milestoneLabel = '1 Year Legend';
  else if (relation.streakCount >= 100) milestoneLabel = '100+ Club';
  else if (relation.streakCount >= 30) milestoneLabel = '30 Day Flame';
  else if (relation.streakCount >= 7) milestoneLabel = '7 Day Streak';
  else if (relation.streakCount >= 3) milestoneLabel = 'Heating Up';

  return {
    isActive,
    isExpiringSoon,
    needsMySnapToday: isActive && !meToday,
    needsTheirSnapToday: isActive && !themToday,
    hoursRemaining,
    milestoneLabel,
  };
}

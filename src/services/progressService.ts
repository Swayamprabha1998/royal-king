import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface LevelProgress {
  stars: number;
  bestScore: number;
}

export interface UserProgress {
  highestLevelUnlocked: number;
  levels: Record<string, LevelProgress>;
}

const defaultProgress = (): UserProgress => ({
  highestLevelUnlocked: 1,
  levels: {},
});

// ── Load all progress for a user ─────────────────────────────
export const loadProgress = async (uid: string): Promise<UserProgress & { isNewUser: boolean }> => {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ...defaultProgress(), isNewUser: true };
  const data = snap.data();
  return {
    highestLevelUnlocked: data.highestLevelUnlocked ?? 1,
    levels: data.levels ?? {},
    isNewUser: false,
  };
};

// ── Save progress after a level is completed ─────────────────
export const saveLevelProgress = async (
  uid: string,
  levelId: number,
  stars: number,
  score: number,
  highestLevelUnlocked: number
): Promise<void> => {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);

  const existing: UserProgress = snap.exists()
    ? { highestLevelUnlocked: snap.data().highestLevelUnlocked ?? 1, levels: snap.data().levels ?? {} }
    : defaultProgress();

  // Only update stars/score if it's an improvement
  const prev = existing.levels[String(levelId)];
  const updatedLevel: LevelProgress = {
    stars:     Math.max(stars, prev?.stars ?? 0),
    bestScore: Math.max(score, prev?.bestScore ?? 0),
  };

  const payload = {
    highestLevelUnlocked: Math.max(highestLevelUnlocked, existing.highestLevelUnlocked),
    [`levels.${levelId}`]: updatedLevel,
  };

  if (snap.exists()) {
    await updateDoc(ref, payload);
  } else {
    await setDoc(ref, {
      highestLevelUnlocked: payload.highestLevelUnlocked,
      levels: { [levelId]: updatedLevel },
    });
  }
};

// ── Push local stars/unlock to Firestore (one-shot on login) ──
export const pushLocalProgressToFirestore = async (
  uid: string,
  highestLevelUnlocked: number,
  starsMap: Record<number, number>
): Promise<void> => {
  const ref = doc(db, 'users', uid);
  const levels: Record<string, LevelProgress> = {};
  Object.entries(starsMap).forEach(([id, stars]) => {
    if (stars > 0) levels[id] = { stars, bestScore: 0 };
  });
  await setDoc(ref, { highestLevelUnlocked, levels }, { merge: true });
};

// ── Reset all progress (called by "Reset Adventure") ─────────
export const resetProgress = async (uid: string): Promise<void> => {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, { highestLevelUnlocked: 1, levels: {} });
};

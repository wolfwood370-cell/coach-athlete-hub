import { create } from "zustand";

// =========================================
// Active Workout Session Store
// =========================================

export interface SetLog {
  setIndex: number;
  actualKg: string;
  actualReps: string;
  rpe: string;
  completed: boolean;
  completedAt?: string;
}

interface RestTimer {
  isRunning: boolean;
  endTime: number | null;
  duration: number;
}

interface ActiveSessionState {
  // Session identity
  activeSessionId: string | null;
  workoutId: string | null;

  // Carousel position
  currentExerciseIndex: number;

  // Local set logs keyed by exerciseId
  sessionLogs: Record<string, SetLog[]>;

  // Rest timer
  restTimer: RestTimer;

  // Session metadata
  startedAt: string | null;
  isActive: boolean;
}

interface ActiveSessionActions {
  startSession: (sessionId: string, workoutId: string) => void;
  endSession: () => void;

  // Exercise navigation
  nextExercise: (totalExercises: number) => void;
  prevExercise: () => void;
  setExerciseIndex: (index: number) => void;

  // Set logging
  completeSet: (exerciseId: string, setIndex: number, data: Partial<SetLog>) => void;
  updateSetField: (exerciseId: string, setIndex: number, field: keyof SetLog, value: string | boolean) => void;

  // Rest timer
  startRest: (duration: number) => void;
  skipRest: () => void;

  // Persistence
  persistToLocal: () => void;
  restoreFromLocal: () => ActiveSessionState | null;
  clearLocal: () => void;
}

const STORAGE_KEY = "active_workout_session";

const initialState: ActiveSessionState = {
  activeSessionId: null,
  workoutId: null,
  currentExerciseIndex: 0,
  sessionLogs: {},
  restTimer: { isRunning: false, endTime: null, duration: 90 },
  startedAt: null,
  isActive: false,
};

export const useActiveSessionStore = create<ActiveSessionState & ActiveSessionActions>(
  (set, get) => ({
    ...initialState,

    startSession: (sessionId, workoutId) => {
      set({
        activeSessionId: sessionId,
        workoutId,
        currentExerciseIndex: 0,
        sessionLogs: {},
        restTimer: { isRunning: false, endTime: null, duration: 90 },
        startedAt: new Date().toISOString(),
        isActive: true,
      });
      get().persistToLocal();
    },

    endSession: () => {
      set(initialState);
      get().clearLocal();
    },

    nextExercise: (totalExercises) => {
      const { currentExerciseIndex } = get();
      if (currentExerciseIndex < totalExercises - 1) {
        set({ currentExerciseIndex: currentExerciseIndex + 1 });
        get().persistToLocal();
      }
    },

    prevExercise: () => {
      const { currentExerciseIndex } = get();
      if (currentExerciseIndex > 0) {
        set({ currentExerciseIndex: currentExerciseIndex - 1 });
        get().persistToLocal();
      }
    },

    setExerciseIndex: (index) => {
      set({ currentExerciseIndex: index });
      get().persistToLocal();
    },

    completeSet: (exerciseId, setIndex, data) => {
      const { sessionLogs } = get();
      const exerciseLogs = [...(sessionLogs[exerciseId] || [])];

      const existing = exerciseLogs.findIndex((l) => l.setIndex === setIndex);
      const logEntry: SetLog = {
        setIndex,
        actualKg: data.actualKg || "",
        actualReps: data.actualReps || "",
        rpe: data.rpe || "",
        completed: data.completed ?? true,
        completedAt: new Date().toISOString(),
      };

      if (existing >= 0) {
        exerciseLogs[existing] = { ...exerciseLogs[existing], ...logEntry };
      } else {
        exerciseLogs.push(logEntry);
      }

      set({
        sessionLogs: { ...sessionLogs, [exerciseId]: exerciseLogs },
      });
      get().persistToLocal();
    },

    updateSetField: (exerciseId, setIndex, field, value) => {
      const { sessionLogs } = get();
      const exerciseLogs = [...(sessionLogs[exerciseId] || [])];
      const existing = exerciseLogs.findIndex((l) => l.setIndex === setIndex);

      if (existing >= 0) {
        exerciseLogs[existing] = { ...exerciseLogs[existing], [field]: value };
      } else {
        exerciseLogs.push({
          setIndex,
          actualKg: "",
          actualReps: "",
          rpe: "",
          completed: false,
          [field]: value,
        });
      }

      set({
        sessionLogs: { ...sessionLogs, [exerciseId]: exerciseLogs },
      });
      get().persistToLocal();
    },

    startRest: (duration) => {
      set({
        restTimer: {
          isRunning: true,
          endTime: Date.now() + duration * 1000,
          duration,
        },
      });
    },

    skipRest: () => {
      set({
        restTimer: { isRunning: false, endTime: null, duration: get().restTimer.duration },
      });
    },

    persistToLocal: () => {
      try {
        const state = get();
        const snapshot = {
          activeSessionId: state.activeSessionId,
          workoutId: state.workoutId,
          currentExerciseIndex: state.currentExerciseIndex,
          sessionLogs: state.sessionLogs,
          startedAt: state.startedAt,
          isActive: state.isActive,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {
        // localStorage may be full or unavailable
      }
    },

    restoreFromLocal: () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as ActiveSessionState;
      } catch {
        return null;
      }
    },

    clearLocal: () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    },
  })
);

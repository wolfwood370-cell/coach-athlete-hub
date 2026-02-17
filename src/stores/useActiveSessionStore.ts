import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
  activeSessionId: string | null;
  workoutId: string | null;
  currentExerciseIndex: number;
  sessionLogs: Record<string, SetLog[]>;
  restTimer: RestTimer;
  startedAt: string | null;
  isActive: boolean;
  /** The sync_version captured when the session started (for conflict detection) */
  deviceSyncVersion: number | null;
  /** Whether the session was completed locally but not yet synced */
  pendingSync: boolean;
}

interface ActiveSessionActions {
  startSession: (sessionId: string, workoutId: string, syncVersion?: number) => void;
  endSession: () => void;
  nextExercise: (totalExercises: number) => void;
  prevExercise: () => void;
  setExerciseIndex: (index: number) => void;
  completeSet: (exerciseId: string, setIndex: number, data: Partial<SetLog>) => void;
  updateSetField: (exerciseId: string, setIndex: number, field: keyof SetLog, value: string | boolean) => void;
  startRest: (duration: number) => void;
  skipRest: () => void;
  markDoneLocally: () => void;
}

const initialState: ActiveSessionState = {
  activeSessionId: null,
  workoutId: null,
  currentExerciseIndex: 0,
  sessionLogs: {},
  restTimer: { isRunning: false, endTime: null, duration: 90 },
  startedAt: null,
  isActive: false,
  deviceSyncVersion: null,
  pendingSync: false,
};

export const useActiveSessionStore = create<ActiveSessionState & ActiveSessionActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      startSession: (sessionId, workoutId, syncVersion) => {
        set({
          activeSessionId: sessionId,
          workoutId,
          currentExerciseIndex: 0,
          sessionLogs: {},
          restTimer: { isRunning: false, endTime: null, duration: 90 },
          startedAt: new Date().toISOString(),
          isActive: true,
          deviceSyncVersion: syncVersion ?? null,
          pendingSync: false,
        });
      },

      endSession: () => {
        set(initialState);
      },

      nextExercise: (totalExercises) => {
        const { currentExerciseIndex } = get();
        if (currentExerciseIndex < totalExercises - 1) {
          set({ currentExerciseIndex: currentExerciseIndex + 1 });
        }
      },

      prevExercise: () => {
        const { currentExerciseIndex } = get();
        if (currentExerciseIndex > 0) {
          set({ currentExerciseIndex: currentExerciseIndex - 1 });
        }
      },

      setExerciseIndex: (index) => {
        set({ currentExerciseIndex: index });
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

      markDoneLocally: () => {
        set({ pendingSync: true, isActive: false });
      },
    }),
    {
      name: "active-workout-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeSessionId: state.activeSessionId,
        workoutId: state.workoutId,
        currentExerciseIndex: state.currentExerciseIndex,
        sessionLogs: state.sessionLogs,
        restTimer: state.restTimer,
        startedAt: state.startedAt,
        deviceSyncVersion: state.deviceSyncVersion,
        pendingSync: state.pendingSync,
        isActive: state.isActive,
      }),
    }
  )
);

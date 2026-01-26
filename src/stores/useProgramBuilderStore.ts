import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ProgramExercise as BaseProgramExercise, WeekProgram, ProgramData } from '@/components/coach/WeekGrid';
import type { SetDataRecord } from '@/types/database';

// =========================================
// Types
// =========================================

// Extended ProgramExercise with setsData for granular set tracking
export interface ProgramExercise extends BaseProgramExercise {
  setsData?: SetDataRecord[];
}

// Re-export compatible types
export type { WeekProgram, ProgramData };

export interface SetField {
  reps?: number;
  weight_kg?: number;
  rpe?: number;
  rir?: number;
  completed?: boolean;
}

export interface ProgramBuilderState {
  // Core program data
  program: ProgramData;
  totalWeeks: number;
  currentWeek: number;
  
  // Selection state
  selectedExercise: {
    weekIndex: number;
    dayIndex: number;
    exerciseId: string;
  } | null;
  
  // Superset pending state
  supersetPendingId: string | null;
  
  // Metadata
  programId: string | null;
  programName: string;
  isDirty: boolean;
}

export interface ProgramBuilderActions {
  // Initialization
  initProgram: (weeks?: number) => void;
  loadProgram: (data: ProgramData, id: string, name: string) => void;
  reset: () => void;
  
  // Week operations
  setCurrentWeek: (weekIndex: number) => void;
  addWeek: () => void;
  duplicateWeek: (weekIndex: number) => void;
  cloneWeekToRange: (sourceWeekIndex: number, targetWeekIndices: number[]) => void;
  removeWeek: (weekIndex: number) => void;
  setTotalWeeks: (count: number) => void;
  
  // Block template operations
  extractBlock: (startWeek: number, endWeek: number) => ProgramData;
  insertBlock: (blockData: ProgramData, atWeekIndex: number) => void;
  
  // Day operations
  addDay: (weekId: number) => void;
  copyDay: (fromWeekIndex: number, fromDayIndex: number, toWeekIndex: number, toDayIndex: number, mode: 'append' | 'overwrite') => void;
  copyDayToMultiple: (fromWeekIndex: number, fromDayIndex: number, targets: { weekIndex: number; dayIndex: number }[], mode: 'append' | 'overwrite') => void;
  clearDay: (weekIndex: number, dayIndex: number) => void;
  
  // Exercise operations
  addExercise: (dayIndex: number, exercise: ProgramExercise, weekIndex?: number) => void;
  addEmptySlot: (dayIndex: number, weekIndex?: number) => void;
  updateExercise: (dayIndex: number, exerciseId: string, updates: Partial<ProgramExercise>, weekIndex?: number) => void;
  removeExercise: (dayIndex: number, exerciseId: string, weekIndex?: number) => void;
  reorderExercises: (dayIndex: number, newOrder: string[], weekIndex?: number) => void;
  fillSlot: (slotId: string, libraryExercise: { id: string; name: string; muscles: string[]; tracking_fields: string[] }, weekIndex: number, dayIndex: number) => void;
  
  // Set operations
  updateSet: (exerciseId: string, setIndex: number, field: keyof SetField, value: number | boolean, weekIndex?: number, dayIndex?: number) => void;
  
  // Superset operations
  setSupersetPending: (exerciseId: string | null) => void;
  toggleSuperset: (dayIndex: number, exerciseId: string, weekIndex?: number) => void;
  
  // Selection
  selectExercise: (weekIndex: number, dayIndex: number, exerciseId: string) => void;
  clearSelection: () => void;
  
  // Metadata
  setProgramName: (name: string) => void;
  markClean: () => void;
}

export type ProgramBuilderStore = ProgramBuilderState & ProgramBuilderActions;

// =========================================
// Helpers
// =========================================

function createEmptyProgram(weeks: number): ProgramData {
  const program: ProgramData = {};
  for (let w = 0; w < weeks; w++) {
    program[w] = {};
    for (let d = 0; d < 7; d++) {
      program[w][d] = [];
    }
  }
  return program;
}

function createEmptySlot(weekIndex: number, dayIndex: number): ProgramExercise {
  return {
    id: `slot-${weekIndex}-${dayIndex}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    exerciseId: '',
    name: '',
    sets: 0,
    reps: '',
    load: '',
    rpe: null,
    restSeconds: 90,
    notes: '',
    isEmpty: true,
  };
}

function generateSupersetGroupId(): string {
  return `superset-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

function cloneExercise(exercise: ProgramExercise): ProgramExercise {
  return {
    ...exercise,
    id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    supersetGroup: undefined, // Don't clone superset associations
  };
}

const DEFAULT_WEEKS = 4;

// =========================================
// Store
// =========================================

export const useProgramBuilderStore = create<ProgramBuilderStore>()(
  immer((set, get) => ({
    // Initial state
    program: createEmptyProgram(DEFAULT_WEEKS),
    totalWeeks: DEFAULT_WEEKS,
    currentWeek: 0,
    selectedExercise: null,
    supersetPendingId: null,
    programId: null,
    programName: '',
    isDirty: false,

    // =========================================
    // Initialization
    // =========================================
    
    initProgram: (weeks = DEFAULT_WEEKS) => {
      set((state) => {
        state.program = createEmptyProgram(weeks);
        state.totalWeeks = weeks;
        state.currentWeek = 0;
        state.selectedExercise = null;
        state.supersetPendingId = null;
        state.programId = null;
        state.programName = '';
        state.isDirty = false;
      });
    },

    loadProgram: (data, id, name) => {
      set((state) => {
        state.program = data;
        state.totalWeeks = Object.keys(data).length;
        state.currentWeek = 0;
        state.selectedExercise = null;
        state.supersetPendingId = null;
        state.programId = id;
        state.programName = name;
        state.isDirty = false;
      });
    },

    reset: () => {
      set((state) => {
        state.program = createEmptyProgram(DEFAULT_WEEKS);
        state.totalWeeks = DEFAULT_WEEKS;
        state.currentWeek = 0;
        state.selectedExercise = null;
        state.supersetPendingId = null;
        state.programId = null;
        state.programName = '';
        state.isDirty = false;
      });
    },

    // =========================================
    // Week Operations
    // =========================================

    setCurrentWeek: (weekIndex) => {
      set((state) => {
        if (weekIndex >= 0 && weekIndex < state.totalWeeks) {
          state.currentWeek = weekIndex;
        }
      });
    },

    addWeek: () => {
      set((state) => {
        const newWeekIndex = state.totalWeeks;
        state.program[newWeekIndex] = {};
        for (let d = 0; d < 7; d++) {
          state.program[newWeekIndex][d] = [];
        }
        state.totalWeeks += 1;
        state.isDirty = true;
      });
    },

    duplicateWeek: (weekIndex) => {
      set((state) => {
        const sourceWeek = state.program[weekIndex];
        if (!sourceWeek) return;

        const newWeekIndex = state.totalWeeks;
        state.program[newWeekIndex] = {};
        
        for (let d = 0; d < 7; d++) {
          const sourceDay = sourceWeek[d] || [];
          state.program[newWeekIndex][d] = sourceDay.map((ex) => cloneExercise(ex));
        }
        
        state.totalWeeks += 1;
        state.isDirty = true;
      });
    },

    cloneWeekToRange: (sourceWeekIndex, targetWeekIndices) => {
      set((state) => {
        const sourceWeek = state.program[sourceWeekIndex];
        if (!sourceWeek) return;

        for (const targetIndex of targetWeekIndices) {
          // Ensure target week exists
          if (!state.program[targetIndex]) {
            state.program[targetIndex] = {};
            for (let d = 0; d < 7; d++) {
              state.program[targetIndex][d] = [];
            }
          }

          // Clone all exercises from source to target (overwrite)
          for (let d = 0; d < 7; d++) {
            const sourceDay = sourceWeek[d] || [];
            state.program[targetIndex][d] = sourceDay.map((ex) => cloneExercise(ex));
          }

          // Expand totalWeeks if needed
          if (targetIndex >= state.totalWeeks) {
            state.totalWeeks = targetIndex + 1;
          }
        }

        state.isDirty = true;
      });
    },

    extractBlock: (startWeek, endWeek) => {
      const state = get();
      const blockData: ProgramData = {};
      
      for (let w = startWeek; w <= endWeek; w++) {
        const relativeIndex = w - startWeek;
        blockData[relativeIndex] = {};
        
        for (let d = 0; d < 7; d++) {
          const sourceDay = state.program[w]?.[d] || [];
          blockData[relativeIndex][d] = sourceDay.map((ex) => ({
            ...ex,
            id: crypto.randomUUID(),
            supersetGroup: undefined,
          }));
        }
      }
      
      return blockData;
    },

    insertBlock: (blockData, atWeekIndex) => {
      set((state) => {
        const blockSize = Object.keys(blockData).length;
        
        // Shift existing weeks to make room
        const newProgram: ProgramData = {};
        
        // Copy weeks before insertion point
        for (let w = 0; w < atWeekIndex; w++) {
          if (state.program[w]) {
            newProgram[w] = state.program[w];
          }
        }
        
        // Insert block data
        for (let i = 0; i < blockSize; i++) {
          newProgram[atWeekIndex + i] = {};
          for (let d = 0; d < 7; d++) {
            const sourceDay = blockData[i]?.[d] || [];
            newProgram[atWeekIndex + i][d] = sourceDay.map((ex) => ({
              ...ex,
              id: crypto.randomUUID(),
            }));
          }
        }
        
        // Shift remaining weeks
        for (let w = atWeekIndex; w < state.totalWeeks; w++) {
          if (state.program[w]) {
            newProgram[w + blockSize] = state.program[w];
          }
        }
        
        state.program = newProgram;
        state.totalWeeks = state.totalWeeks + blockSize;
        state.isDirty = true;
      });
    },

    removeWeek: (weekIndex) => {
      set((state) => {
        if (state.totalWeeks <= 1) return; // Keep at least 1 week

        // Remove the week
        delete state.program[weekIndex];

        // Reindex remaining weeks
        const newProgram: ProgramData = {};
        let newIndex = 0;
        for (let i = 0; i < state.totalWeeks; i++) {
          if (i !== weekIndex && state.program[i]) {
            newProgram[newIndex] = state.program[i];
            newIndex++;
          }
        }

        state.program = newProgram;
        state.totalWeeks -= 1;
        
        // Adjust current week if necessary
        if (state.currentWeek >= state.totalWeeks) {
          state.currentWeek = state.totalWeeks - 1;
        }
        
        state.isDirty = true;
      });
    },

    setTotalWeeks: (count) => {
      set((state) => {
        if (count < 1 || count > 52) return; // Reasonable limits

        if (count > state.totalWeeks) {
          // Add weeks
          for (let w = state.totalWeeks; w < count; w++) {
            state.program[w] = {};
            for (let d = 0; d < 7; d++) {
              state.program[w][d] = [];
            }
          }
        } else if (count < state.totalWeeks) {
          // Remove weeks from the end
          for (let w = count; w < state.totalWeeks; w++) {
            delete state.program[w];
          }
          if (state.currentWeek >= count) {
            state.currentWeek = count - 1;
          }
        }

        state.totalWeeks = count;
        state.isDirty = true;
      });
    },

    // =========================================
    // Day Operations
    // =========================================

    addDay: (weekId) => {
      // Days are fixed (0-6), so this is effectively a no-op or could add a slot
      set((state) => {
        // Ensure the week exists
        if (!state.program[weekId]) {
          state.program[weekId] = {};
          for (let d = 0; d < 7; d++) {
            state.program[weekId][d] = [];
          }
        }
        state.isDirty = true;
      });
    },

    copyDay: (fromWeekIndex, fromDayIndex, toWeekIndex, toDayIndex, mode) => {
      set((state) => {
        const sourceExercises = state.program[fromWeekIndex]?.[fromDayIndex] || [];
        if (!state.program[toWeekIndex]) {
          state.program[toWeekIndex] = {};
        }
        if (!state.program[toWeekIndex][toDayIndex]) {
          state.program[toWeekIndex][toDayIndex] = [];
        }

        const clonedExercises = sourceExercises
          .filter((ex) => !ex.isEmpty)
          .map((ex) => cloneExercise(ex));

        if (mode === 'overwrite') {
          state.program[toWeekIndex][toDayIndex] = clonedExercises;
        } else {
          state.program[toWeekIndex][toDayIndex].push(...clonedExercises);
        }

        state.isDirty = true;
      });
    },

    copyDayToMultiple: (fromWeekIndex, fromDayIndex, targets, mode) => {
      set((state) => {
        const sourceExercises = state.program[fromWeekIndex]?.[fromDayIndex] || [];
        
        for (const target of targets) {
          if (!state.program[target.weekIndex]) {
            state.program[target.weekIndex] = {};
          }
          if (!state.program[target.weekIndex][target.dayIndex]) {
            state.program[target.weekIndex][target.dayIndex] = [];
          }

          const clonedExercises = sourceExercises
            .filter((ex) => !ex.isEmpty)
            .map((ex) => cloneExercise(ex));

          if (mode === 'overwrite') {
            state.program[target.weekIndex][target.dayIndex] = clonedExercises;
          } else {
            state.program[target.weekIndex][target.dayIndex].push(...clonedExercises);
          }
        }

        state.isDirty = true;
      });
    },

    clearDay: (weekIndex, dayIndex) => {
      set((state) => {
        if (state.program[weekIndex]?.[dayIndex]) {
          state.program[weekIndex][dayIndex] = [];
          state.isDirty = true;
        }
      });
    },

    // =========================================
    // Exercise Operations
    // =========================================

    addExercise: (dayIndex, exercise, weekIndex) => {
      set((state) => {
        const week = weekIndex ?? state.currentWeek;
        if (!state.program[week]) {
          state.program[week] = {};
        }
        if (!state.program[week][dayIndex]) {
          state.program[week][dayIndex] = [];
        }
        state.program[week][dayIndex].push(exercise);
        state.isDirty = true;
      });
    },

    addEmptySlot: (dayIndex, weekIndex) => {
      set((state) => {
        const week = weekIndex ?? state.currentWeek;
        if (!state.program[week]) {
          state.program[week] = {};
        }
        if (!state.program[week][dayIndex]) {
          state.program[week][dayIndex] = [];
        }
        state.program[week][dayIndex].push(createEmptySlot(week, dayIndex));
        state.isDirty = true;
      });
    },

    updateExercise: (dayIndex, exerciseId, updates, weekIndex) => {
      set((state) => {
        const week = weekIndex ?? state.currentWeek;
        const exercises = state.program[week]?.[dayIndex];
        if (!exercises) return;

        const idx = exercises.findIndex((ex) => ex.id === exerciseId);
        if (idx !== -1) {
          Object.assign(exercises[idx], updates);
          state.isDirty = true;
        }
      });
    },

    removeExercise: (dayIndex, exerciseId, weekIndex) => {
      set((state) => {
        const week = weekIndex ?? state.currentWeek;
        const exercises = state.program[week]?.[dayIndex];
        if (!exercises) return;

        const idx = exercises.findIndex((ex) => ex.id === exerciseId);
        if (idx !== -1) {
          exercises.splice(idx, 1);
          
          // Clear selection if removing selected exercise
          if (state.selectedExercise?.exerciseId === exerciseId) {
            state.selectedExercise = null;
          }
          
          state.isDirty = true;
        }
      });
    },

    reorderExercises: (dayIndex, newOrder, weekIndex) => {
      set((state) => {
        const week = weekIndex ?? state.currentWeek;
        const exercises = state.program[week]?.[dayIndex];
        if (!exercises) return;

        // Create a map for quick lookup
        const exerciseMap = new Map<string, BaseProgramExercise>(exercises.map((ex) => [ex.id, ex]));
        
        // Reorder based on newOrder array
        const reordered: BaseProgramExercise[] = [];
        for (const id of newOrder) {
          const ex = exerciseMap.get(id);
          if (ex) {
            reordered.push(ex);
            exerciseMap.delete(id);
          }
        }
        
        // Append any exercises not in newOrder (shouldn't happen, but safety)
        exerciseMap.forEach((ex) => reordered.push(ex));
        
        state.program[week][dayIndex] = reordered;
        state.isDirty = true;
      });
    },

    fillSlot: (slotId, libraryExercise, weekIndex, dayIndex) => {
      set((state) => {
        const exercises = state.program[weekIndex]?.[dayIndex];
        if (!exercises) return;

        const idx = exercises.findIndex((ex) => ex.id === slotId);
        if (idx !== -1 && exercises[idx].isEmpty) {
          exercises[idx] = {
            id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            exerciseId: libraryExercise.id,
            name: libraryExercise.name,
            sets: 3,
            reps: '8-12',
            load: '',
            rpe: null,
            restSeconds: 90,
            notes: '',
            isEmpty: false,
            snapshotTrackingFields: [...libraryExercise.tracking_fields],
            snapshotMuscles: [...libraryExercise.muscles],
          };
          state.isDirty = true;
        }
      });
    },

    // =========================================
    // Set Operations
    // =========================================

    updateSet: (exerciseId, setIndex, field, value, weekIndex, dayIndex) => {
      set((state) => {
        // Find the exercise across all days if weekIndex/dayIndex not provided
        let exercise: (BaseProgramExercise & { setsData?: SetDataRecord[] }) | undefined;

        if (weekIndex !== undefined && dayIndex !== undefined) {
          exercise = state.program[weekIndex]?.[dayIndex]?.find((ex) => ex.id === exerciseId) as (BaseProgramExercise & { setsData?: SetDataRecord[] }) | undefined;
        } else {
          // Search current week
          for (let d = 0; d < 7; d++) {
            const ex = state.program[state.currentWeek]?.[d]?.find((e) => e.id === exerciseId);
            if (ex) {
              exercise = ex as (BaseProgramExercise & { setsData?: SetDataRecord[] });
              break;
            }
          }
        }

        if (!exercise) return;

        // For set-level updates, we store them in a setsData array
        // Initialize if not present
        if (!exercise.setsData) {
          exercise.setsData = Array.from({ length: exercise.sets }, (_, i) => ({
            set_number: i + 1,
            reps: 0,
            weight_kg: 0,
            completed: false,
          }));
        }

        // Ensure setIndex is valid and update the field
        if (setIndex >= 0 && setIndex < exercise.setsData.length) {
          const setData = exercise.setsData[setIndex];
          switch (field) {
            case 'reps':
              setData.reps = value as number;
              break;
            case 'weight_kg':
              setData.weight_kg = value as number;
              break;
            case 'rpe':
              setData.rpe = value as number;
              break;
            case 'completed':
              setData.completed = value as boolean;
              break;
          }
        }

        state.isDirty = true;
      });
    },

    // =========================================
    // Superset Operations
    // =========================================

    setSupersetPending: (exerciseId) => {
      set((state) => {
        state.supersetPendingId = exerciseId;
      });
    },

    toggleSuperset: (dayIndex, exerciseId, weekIndex) => {
      set((state) => {
        const week = weekIndex ?? state.currentWeek;
        const exercises = state.program[week]?.[dayIndex];
        if (!exercises) return;

        const exercise = exercises.find((ex) => ex.id === exerciseId);
        if (!exercise || exercise.isEmpty) return;

        // If already in a superset, remove from it
        if (exercise.supersetGroup) {
          const groupId = exercise.supersetGroup;
          exercise.supersetGroup = undefined;
          
          // Check if any other exercise still uses this group
          const otherInGroup = exercises.filter(
            (ex) => ex.supersetGroup === groupId && ex.id !== exerciseId
          );
          
          // If only one left, remove their superset too
          if (otherInGroup.length === 1) {
            otherInGroup[0].supersetGroup = undefined;
          }
          
          state.supersetPendingId = null;
          state.isDirty = true;
          return;
        }

        // If there's a pending superset exercise
        if (state.supersetPendingId && state.supersetPendingId !== exerciseId) {
          const pendingExercise = exercises.find((ex) => ex.id === state.supersetPendingId);
          if (pendingExercise && !pendingExercise.isEmpty) {
            // Create or join superset
            const groupId = pendingExercise.supersetGroup || generateSupersetGroupId();
            pendingExercise.supersetGroup = groupId;
            exercise.supersetGroup = groupId;
            state.supersetPendingId = null;
            state.isDirty = true;
          }
        } else {
          // Set this as pending
          state.supersetPendingId = exerciseId;
        }
      });
    },

    // =========================================
    // Selection
    // =========================================

    selectExercise: (weekIndex, dayIndex, exerciseId) => {
      set((state) => {
        const exercise = state.program[weekIndex]?.[dayIndex]?.find((ex) => ex.id === exerciseId);
        if (exercise && !exercise.isEmpty) {
          state.selectedExercise = { weekIndex, dayIndex, exerciseId };
        }
      });
    },

    clearSelection: () => {
      set((state) => {
        state.selectedExercise = null;
      });
    },

    // =========================================
    // Metadata
    // =========================================

    setProgramName: (name) => {
      set((state) => {
        state.programName = name;
        state.isDirty = true;
      });
    },

    markClean: () => {
      set((state) => {
        state.isDirty = false;
      });
    },
  }))
);

// =========================================
// Selectors
// =========================================

export const selectCurrentWeekProgram = (state: ProgramBuilderStore): WeekProgram | undefined => {
  return state.program[state.currentWeek];
};

export const selectDayExercises = (state: ProgramBuilderStore, dayIndex: number): ProgramExercise[] => {
  return state.program[state.currentWeek]?.[dayIndex] || [];
};

export const selectExercise = (state: ProgramBuilderStore, weekIndex: number, dayIndex: number, exerciseId: string): ProgramExercise | undefined => {
  return state.program[weekIndex]?.[dayIndex]?.find((ex) => ex.id === exerciseId);
};

export const selectTotalExerciseCount = (state: ProgramBuilderStore): number => {
  let count = 0;
  for (const week of Object.values(state.program)) {
    for (const day of Object.values(week)) {
      count += day.filter((ex) => !ex.isEmpty).length;
    }
  }
  return count;
};

export const selectWeekExerciseCount = (state: ProgramBuilderStore, weekIndex: number): number => {
  const week = state.program[weekIndex];
  if (!week) return 0;
  let count = 0;
  for (const day of Object.values(week)) {
    count += day.filter((ex) => !ex.isEmpty).length;
  }
  return count;
};

export const selectSelectedExerciseData = (state: ProgramBuilderStore): ProgramExercise | null => {
  if (!state.selectedExercise) return null;
  const { weekIndex, dayIndex, exerciseId } = state.selectedExercise;
  return state.program[weekIndex]?.[dayIndex]?.find((ex) => ex.id === exerciseId) || null;
};

import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkouts } from '../hooks/useWorkouts';
import { Workout } from '../types/workout';

// ─── Time helpers ─────────────────────────────────────────────────────────────

/** "3:00" → 180 (seconds). Returns 0 for empty / unparseable strings. */
function parseTime(str: string): number {
  if (!str || !str.includes(':')) return 0;
  const [m, s] = str.split(':').map((n) => parseInt(n) || 0);
  return m * 60 + s;
}

/** 180 → "3 min" | 3690 → "1 hr 1 min 30 sec" */
function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0 sec';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} hr`);
  if (m > 0) parts.push(`${m} min`);
  if (s > 0 && h === 0) parts.push(`${s} sec`); // drop seconds once we have hours
  return parts.join(' ');
}

function calcTotal(warmUp: string, rounds: number, roundTime: string, rest: string, coolDown: string): number {
  const r = Math.max(1, rounds);
  return (
    parseTime(warmUp) +
    r * parseTime(roundTime) +
    Math.max(0, r - 1) * parseTime(rest) +
    parseTime(coolDown)
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COLOR_OPTIONS = ['#34c759', '#ff453a', '#0a84ff', '#ffd60a', '#bf5af2', '#ff9f0a'];

const SNAP_POINTS = ['90%'];

const EMPTY_FORM = {
  name: '',
  warmUp: '',
  rounds: '3',
  roundTime: '3:00',
  rest: '1:00',
  coolDown: '',
  color: COLOR_OPTIONS[0],
};

type FormState = typeof EMPTY_FORM;

function workoutToForm(w: Workout): FormState {
  return {
    name: w.name,
    warmUp: w.warmUp === '0:00' ? '' : w.warmUp,
    rounds: String(w.rounds),
    roundTime: w.roundTime,
    rest: w.rest,
    coolDown: w.coolDown === '0:00' ? '' : w.coolDown,
    color: w.color,
  };
}

// ─── WorkoutScreen ────────────────────────────────────────────────────────────

export default function WorkoutScreen() {
  const insets = useSafeAreaInsets();
  const { workouts, loading, addWorkout, updateWorkout, deleteWorkout } = useWorkouts();

  const sheetRef = useRef<BottomSheetModal>(null);
  const [editing, setEditing] = useState<Workout | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const snapPoints = useMemo(() => SNAP_POINTS, []);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    sheetRef.current?.present();
  }

  function openEdit(workout: Workout) {
    setEditing(workout);
    setForm(workoutToForm(workout));
    sheetRef.current?.present();
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    const data = {
      name: form.name.trim(),
      warmUp: form.warmUp || '0:00',
      rounds: Math.max(1, parseInt(form.rounds) || 1),
      roundTime: form.roundTime || '3:00',
      rest: form.rest || '1:00',
      coolDown: form.coolDown || '0:00',
      color: form.color,
    };
    if (editing) {
      await updateWorkout({ ...editing, ...data });
    } else {
      await addWorkout(data);
    }
    sheetRef.current?.dismiss();
  }

  async function handleDelete() {
    if (editing) {
      await deleteWorkout(editing.id);
      sheetRef.current?.dismiss();
    }
  }

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.6} />
    ),
    [],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Workouts</Text>
          <Text style={styles.headerSub}>
            {workouts.length} session{workouts.length !== 1 ? 's' : ''} saved
          </Text>
        </View>
        <Pressable style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={22} color="#111" />
        </Pressable>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator style={styles.loader} color="#fff" />
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            workouts.length === 0 ? styles.emptyContainer : styles.listContent
          }
          ListEmptyComponent={<EmptyState />}
          renderItem={({ item }) => (
            <WorkoutCard workout={item} onEdit={() => openEdit(item)} />
          )}
        />
      )}

      {/* Bottom sheet */}
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.sheetHandle}
        keyboardBehavior="extend"
        keyboardBlursBehavior="restore"
      >
        <WorkoutForm
          form={form}
          onChange={setForm}
          isEditing={editing !== null}
          onSave={handleSave}
          onCancel={() => sheetRef.current?.dismiss()}
          onDelete={handleDelete}
        />
      </BottomSheetModal>
    </View>
  );
}

// ─── WorkoutCard ──────────────────────────────────────────────────────────────

function WorkoutCard({ workout, onEdit }: { workout: Workout; onEdit: () => void }) {
  const totalSec = calcTotal(workout.warmUp, workout.rounds, workout.roundTime, workout.rest, workout.coolDown);

  return (
    <View style={styles.card}>
      <View style={[styles.cardStrip, { backgroundColor: workout.color }]} />
      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{workout.name}</Text>
        <View style={styles.cardMeta}>
          <MetaPill icon="repeat-outline"        value={`${workout.rounds} rds`} />
          <MetaPill icon="timer-outline"         value={workout.roundTime} />
          <MetaPill icon="pause-circle-outline"  value={workout.rest} />
        </View>
        <Text style={styles.cardTotal}>~{formatDuration(totalSec)} total</Text>
      </View>
      <View style={styles.cardActions}>
        <Pressable style={styles.iconBtn} onPress={onEdit} hitSlop={8}>
          <Ionicons name="create-outline" size={20} color="rgba(255,255,255,0.5)" />
        </Pressable>
        <Pressable style={[styles.iconBtn, styles.playBtn]} hitSlop={8}>
          <Ionicons name="play" size={16} color="#111" />
        </Pressable>
      </View>
    </View>
  );
}

function MetaPill({
  icon,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
}) {
  return (
    <View style={styles.metaPill}>
      <Ionicons name={icon} size={12} color="rgba(255,255,255,0.4)" />
      <Text style={styles.metaText}>{value}</Text>
    </View>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>No workouts yet</Text>
      <Text style={styles.emptySub}>Tap + to create your first session</Text>
    </View>
  );
}

// ─── WorkoutForm ──────────────────────────────────────────────────────────────

interface FormProps {
  form: FormState;
  onChange: React.Dispatch<React.SetStateAction<FormState>>;
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

function WorkoutForm({ form, onChange, isEditing, onSave, onCancel, onDelete }: FormProps) {
  const [totalSec, setTotalSec] = useState(0);

  useEffect(() => {
    setTotalSec(
      calcTotal(
        form.warmUp,
        parseInt(form.rounds) || 1,
        form.roundTime,
        form.rest,
        form.coolDown,
      ),
    );
  }, [form.warmUp, form.rounds, form.roundTime, form.rest, form.coolDown]);

  function set(key: keyof FormState) {
    return (val: string) => onChange((prev) => ({ ...prev, [key]: val }));
  }

  return (
    <BottomSheetScrollView
      contentContainerStyle={styles.formScroll}
      keyboardShouldPersistTaps="handled"
    >
      {/* Title row */}
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>{isEditing ? 'Edit workout' : 'New workout'}</Text>
        <Pressable onPress={onCancel} hitSlop={8}>
          <Ionicons name="close" size={22} color="rgba(255,255,255,0.5)" />
        </Pressable>
      </View>

      {/* Name */}
      <Text style={styles.formLabel}>NAME</Text>
      <BottomSheetTextInput
        style={styles.input}
        value={form.name}
        onChangeText={set('name')}
        placeholder="e.g. Boxing rounds"
        placeholderTextColor="rgba(255,255,255,0.25)"
      />

      {/* Warm-up */}
      <Text style={styles.formLabel}>WARM-UP</Text>
      <BottomSheetTextInput
        style={styles.input}
        value={form.warmUp}
        onChangeText={set('warmUp')}
        placeholder="0:00"
        placeholderTextColor="rgba(255,255,255,0.25)"
      />

      {/* Rounds + Round time + Rest */}
      <View style={styles.formRow}>
        <View style={styles.formCol}>
          <Text style={styles.formLabel}>ROUNDS</Text>
          <BottomSheetTextInput
            style={styles.input}
            value={form.rounds}
            onChangeText={set('rounds')}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>
        <View style={styles.formCol}>
          <Text style={styles.formLabel}>ROUND TIME</Text>
          <BottomSheetTextInput
            style={styles.input}
            value={form.roundTime}
            onChangeText={set('roundTime')}
            placeholder="3:00"
            placeholderTextColor="rgba(255,255,255,0.25)"
          />
        </View>
        <View style={styles.formCol}>
          <Text style={styles.formLabel}>REST</Text>
          <BottomSheetTextInput
            style={styles.input}
            value={form.rest}
            onChangeText={set('rest')}
            placeholder="1:00"
            placeholderTextColor="rgba(255,255,255,0.25)"
          />
        </View>
      </View>

      {/* Cooling down */}
      <Text style={styles.formLabel}>COOLING DOWN</Text>
      <BottomSheetTextInput
        style={styles.input}
        value={form.coolDown}
        onChangeText={set('coolDown')}
        placeholder="0:00"
        placeholderTextColor="rgba(255,255,255,0.25)"
      />

      {/* Color picker */}
      <Text style={styles.formLabel}>COLOR</Text>
      <View style={styles.colorRow}>
        {COLOR_OPTIONS.map((c) => (
          <Pressable
            key={c}
            style={[
              styles.colorDot,
              { backgroundColor: c },
              form.color === c && styles.colorDotActive,
            ]}
            onPress={() => onChange((prev) => ({ ...prev, color: c }))}
          />
        ))}
      </View>

      {/* Total time */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total workout time</Text>
        <Text style={styles.totalValue}>{formatDuration(totalSec)}</Text>
      </View>

      {/* Save */}
      <Pressable style={styles.saveBtn} onPress={onSave}>
        <Text style={styles.saveBtnText}>{isEditing ? 'Save changes' : 'Save workout'}</Text>
      </Pressable>

      {/* Delete (edit only) */}
      {isEditing && (
        <Pressable style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.deleteBtnText}>Delete workout</Text>
        </Pressable>
      )}
    </BottomSheetScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#111',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    marginTop: 2,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  loader: {
    flex: 1,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  emptySub: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 14,
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
    minHeight: 72,
  },
  cardStrip: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
  },
  cardBody: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 14,
    gap: 4,
  },
  cardName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 10,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  cardTotal: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 14,
  },
  iconBtn: {
    padding: 6,
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },

  // Bottom sheet
  sheetBg: {
    backgroundColor: '#1c1c1c',
  },
  sheetHandle: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 36,
  },

  // Form
  formScroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 20,
  },
  formTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  formLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formCol: {
    flex: 1,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorDotActive: {
    borderWidth: 3,
    borderColor: '#fff',
  },

  // Total time
  totalRow: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 16,
    marginBottom: 20,
    gap: 4,
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  totalValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },

  saveBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveBtnText: {
    color: '#111',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: 'rgba(226,75,74,0.12)',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(226,75,74,0.25)',
    paddingVertical: 15,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#ff453a',
    fontSize: 16,
    fontWeight: '600',
  },
});

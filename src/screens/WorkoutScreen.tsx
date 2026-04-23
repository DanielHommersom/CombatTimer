import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useWorkouts } from '../hooks/useWorkouts';
import { Workout } from '../types/workout';
import { Preset } from '../data/presets';
import ActiveTimerBanner from '../components/ActiveTimerBanner';
import TimePill from '../components/TimePill';
import TimePickerModal from '../components/TimePickerModal';
import WorkoutBreakdownBar from '../components/WorkoutBreakdownBar';
import TemplateScreen from './TemplateScreen';
import { RootStackParamList } from '../navigation/BottomTabNavigator';

type WorkoutNav = NativeStackNavigationProp<RootStackParamList>;

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_OPTIONS = ['#34c759', '#ff453a', '#0a84ff', '#ffd60a', '#bf5af2', '#ff9f0a'];

const SNAP_POINTS = ['90%'];

const PHASE_COLORS = {
  warmUp:    '#ffd60a',
  roundTime: '#ff453a',
  rest:      '#34c759',
  coolDown:  '#0a84ff',
};

type PickerField = 'warmUp' | 'roundTime' | 'rest' | 'coolDown' | null;

const FIELD_LABELS: Record<Exclude<PickerField, null>, string> = {
  warmUp:    'Warm-up',
  roundTime: 'Round time',
  rest:      'Rest',
  coolDown:  'Cooling down',
};

// ─── Time helpers ─────────────────────────────────────────────────────────────

function parseTime(str: string): number {
  if (!str || !str.includes(':')) return 0;
  const [m, s] = str.split(':').map((n) => parseInt(n) || 0);
  return m * 60 + s;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0 sec';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} hr`);
  if (m > 0) parts.push(`${m} min`);
  if (s > 0 && h === 0) parts.push(`${s} sec`);
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

// ─── Form helpers ─────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name:      '',
  warmUp:    '0:00',
  rounds:    '3',
  roundTime: '3:00',
  rest:      '1:00',
  coolDown:  '0:00',
  color:     COLOR_OPTIONS[0],
};

const SCRATCH_FORM = {
  name:      '',
  warmUp:    '0:00',
  rounds:    '',
  roundTime: '',
  rest:      '',
  coolDown:  '0:00',
  color:     COLOR_OPTIONS[0],
};

type FormState = typeof EMPTY_FORM;

function workoutToForm(w: Workout): FormState {
  return {
    name:      w.name,
    warmUp:    w.warmUp,
    rounds:    String(w.rounds),
    roundTime: w.roundTime,
    rest:      w.rest,
    coolDown:  w.coolDown,
    color:     w.color,
  };
}

// ─── WorkoutScreen ────────────────────────────────────────────────────────────

export default function WorkoutScreen() {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<WorkoutNav>();
  const { workouts, loading, addWorkout, updateWorkout, deleteWorkout } = useWorkouts();

  const sheetRef = useRef<BottomSheetModal>(null);
  const [editing, setEditing]               = useState<Workout | null>(null);
  const [form, setForm]                     = useState<FormState>(EMPTY_FORM);
  const [activePicker, onPickerChange]      = useState<PickerField>(null);
  const [templateVisible, setTemplateVisible] = useState(false);
  const [toastMsg, setToastMsg]             = useState('');

  const snapPoints = useMemo(() => SNAP_POINTS, []);

  const lastWorkout = useMemo(
    () => workouts.length > 0
      ? [...workouts].sort((a, b) => b.createdAt - a.createdAt)[0]
      : null,
    [workouts],
  );

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
      name:      form.name.trim(),
      warmUp:    form.warmUp || '0:00',
      rounds:    Math.max(1, parseInt(form.rounds) || 1),
      roundTime: form.roundTime || '3:00',
      rest:      form.rest || '1:00',
      coolDown:  form.coolDown || '0:00',
      color:     form.color,
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

  function handleSelectPreset(preset: Preset | null) {
    setForm(preset === null ? SCRATCH_FORM : {
      name:      preset.name,
      warmUp:    preset.warmUp,
      rounds:    String(preset.rounds),
      roundTime: preset.roundTime,
      rest:      preset.rest,
      coolDown:  preset.coolDown,
      color:     preset.color,
    });
    setTemplateVisible(false);
    const msg = preset ? `${preset.name} loaded` : 'Starting fresh';
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2000);
  }

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.6} />
    ),
    [],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ActiveTimerBanner />
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
            <WorkoutCard
              workout={item}
              onEdit={() => openEdit(item)}
              onPlay={() => navigation.navigate('ActiveTimer', { workout: item })}
            />
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
        keyboardBlurBehavior="restore"
      >
        <WorkoutForm
          form={form}
          onChange={setForm}
          isEditing={editing !== null}
          onSave={handleSave}
          onCancel={() => sheetRef.current?.dismiss()}
          onDelete={handleDelete}
          activePicker={activePicker}
          onPickerChange={onPickerChange}
          onShowTemplates={() => setTemplateVisible(true)}
          toastMsg={toastMsg}
        />
      </BottomSheetModal>

      {/* TimePickerModal outside BottomSheetModal to avoid touch conflicts */}
      <TimePickerModal
        visible={activePicker !== null}
        value={activePicker !== null ? (form[activePicker] || '0:00') : '0:00'}
        color={activePicker !== null ? PHASE_COLORS[activePicker] : '#fff'}
        label={activePicker !== null ? FIELD_LABELS[activePicker] : ''}
        onConfirm={(val) => {
          if (activePicker !== null) setForm((p) => ({ ...p, [activePicker]: val }));
          onPickerChange(null);
        }}
        onClose={() => onPickerChange(null)}
      />

      {/* TemplateScreen outside BottomSheetModal */}
      <TemplateScreen
        visible={templateVisible}
        onSelect={handleSelectPreset}
        onClose={() => setTemplateVisible(false)}
        lastWorkout={lastWorkout}
      />
    </View>
  );
}

// ─── WorkoutCard ──────────────────────────────────────────────────────────────

function WorkoutCard({
  workout,
  onEdit,
  onPlay,
}: {
  workout: Workout;
  onEdit: () => void;
  onPlay: () => void;
}) {
  const totalSec  = calcTotal(workout.warmUp, workout.rounds, workout.roundTime, workout.rest, workout.coolDown);
  const scale     = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handlePlay() {
    scale.value = withSpring(0.82, { damping: 20, stiffness: 400 });
    onPlay();
  }

  return (
    <View style={styles.card}>
      <View style={[styles.cardStrip, { backgroundColor: workout.color }]} />
      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{workout.name}</Text>

        <View style={styles.cardPills}>
          {parseTime(workout.warmUp) > 0 && (
            <TimePill value={workout.warmUp} color={PHASE_COLORS.warmUp} size="sm" onPress={() => {}} />
          )}
          {parseTime(workout.roundTime) > 0 && (
            <TimePill value={workout.roundTime} color={PHASE_COLORS.roundTime} size="sm" onPress={() => {}} />
          )}
          {parseTime(workout.rest) > 0 && (
            <TimePill value={workout.rest} color={PHASE_COLORS.rest} size="sm" onPress={() => {}} />
          )}
          {parseTime(workout.coolDown) > 0 && (
            <TimePill value={workout.coolDown} color={PHASE_COLORS.coolDown} size="sm" onPress={() => {}} />
          )}
        </View>

        <Text style={styles.cardTotal}>~{formatDuration(totalSec)} · {workout.rounds} rounds</Text>
      </View>
      <View style={styles.cardActions}>
        <Pressable style={styles.iconBtn} onPress={onEdit} hitSlop={8}>
          <Ionicons name="create-outline" size={20} color="rgba(255,255,255,0.5)" />
        </Pressable>
        <Animated.View style={[styles.playBtn, animStyle]}>
          <Pressable style={styles.playBtnInner} onPress={handlePlay} hitSlop={8}>
            <Ionicons name="play" size={16} color="#111" />
          </Pressable>
        </Animated.View>
      </View>
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
  activePicker: PickerField;
  onPickerChange: (field: PickerField) => void;
  onShowTemplates: () => void;
  toastMsg: string;
}

function WorkoutForm({
  form, onChange, isEditing, onSave, onCancel, onDelete,
  onPickerChange, onShowTemplates, toastMsg,
}: FormProps) {
  const canSave = form.name.trim().length > 0 && parseTime(form.roundTime) > 0;

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

      {/* Name + Template button */}
      <Text style={styles.formLabel}>NAME</Text>
      <View style={styles.nameRow}>
        <BottomSheetTextInput
          style={[styles.input, styles.nameInput]}
          value={form.name}
          onChangeText={(v) => onChange((p) => ({ ...p, name: v }))}
          placeholder="e.g. Boxing rounds"
          placeholderTextColor="rgba(255,255,255,0.25)"
        />
        <Pressable style={styles.templateBtn} onPress={onShowTemplates}>
          <Text style={styles.templateBtnLabel}>Template</Text>
          <Text style={styles.templateBtnChevron}>›</Text>
        </Pressable>
      </View>
      {toastMsg !== '' && <Text style={styles.toastMsg}>{toastMsg}</Text>}

      {/* Rounds */}
      <Text style={styles.formLabel}>ROUNDS</Text>
      <BottomSheetTextInput
        style={[styles.input, styles.inputRounds]}
        value={form.rounds}
        onChangeText={(v) => onChange((p) => ({ ...p, rounds: v }))}
        keyboardType="number-pad"
        maxLength={2}
      />

      {/* Time fields */}
      <View style={styles.timeSection}>
        <View style={styles.timeRow}>
          <Text style={styles.timeRowLabel}>Warm-up</Text>
          <TimePill
            value={form.warmUp || '0:00'}
            color={PHASE_COLORS.warmUp}
            onPress={() => onPickerChange('warmUp')}
          />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeRowLabel}>Round time</Text>
          <TimePill
            value={form.roundTime || '0:00'}
            color={PHASE_COLORS.roundTime}
            onPress={() => onPickerChange('roundTime')}
          />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeRowLabel}>Rest</Text>
          <TimePill
            value={form.rest || '0:00'}
            color={PHASE_COLORS.rest}
            onPress={() => onPickerChange('rest')}
          />
        </View>
        <View style={[styles.timeRow, styles.timeRowLast]}>
          <Text style={styles.timeRowLabel}>Cooling down</Text>
          <TimePill
            value={form.coolDown || '0:00'}
            color={PHASE_COLORS.coolDown}
            onPress={() => onPickerChange('coolDown')}
          />
        </View>
      </View>

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
            onPress={() => onChange((p) => ({ ...p, color: c }))}
          />
        ))}
      </View>

      {/* Breakdown bar */}
      <View style={styles.divider} />
      <WorkoutBreakdownBar
        warmUp={form.warmUp || '0:00'}
        rounds={parseInt(form.rounds) || 1}
        roundTime={form.roundTime || '0:00'}
        rest={form.rest || '0:00'}
        coolDown={form.coolDown || '0:00'}
      />
      <View style={styles.divider} />

      {/* Save */}
      <Pressable
        style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
        onPress={onSave}
        disabled={!canSave}
      >
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
    paddingVertical: 12,
    paddingLeft: 14,
    gap: 6,
  },
  cardName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cardPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
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
    overflow: 'hidden',
  },
  playBtnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  inputRounds: {
    width: 80,
  },

  // Name row with template button
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  nameInput: {
    flex: 1,
    marginBottom: 0,
  },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 12,
  },
  templateBtnLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
  },
  templateBtnChevron: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 16,
  },
  toastMsg: {
    color: '#34c759',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
  },

  // Time section
  timeSection: {
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 24,
    overflow: 'hidden',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  timeRowLast: {
    borderBottomWidth: 0,
  },
  timeRowLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '400',
  },

  // Color picker
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

  divider: {
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 16,
  },

  saveBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveBtnDisabled: {
    opacity: 0.4,
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

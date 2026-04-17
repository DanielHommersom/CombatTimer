import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Preset, PRESET_CATEGORIES } from '../data/presets';
import { Workout } from '../types/workout';

export interface TemplateScreenProps {
  visible: boolean;
  onSelect: (preset: Preset | null) => void;
  onClose: () => void;
  lastWorkout: Workout | null;
}

// ─── PresetCard ───────────────────────────────────────────────────────────────

function PresetCard({ preset, onPress }: { preset: Preset; onPress: () => void }) {
  return (
    <Pressable style={styles.presetCard} onPress={onPress}>
      <View style={[styles.presetStrip, { backgroundColor: preset.color }]} />
      <View style={styles.presetBody}>
        <Text style={styles.presetName}>{preset.name}</Text>
        <Text style={styles.presetDesc}>{preset.description}</Text>
        <Text style={styles.presetMeta}>
          {preset.rounds} rounds · {preset.roundTime} · {preset.rest} rest
        </Text>
      </View>
      <Text style={styles.presetChevron}>›</Text>
    </Pressable>
  );
}

// ─── TemplateScreen ───────────────────────────────────────────────────────────

export default function TemplateScreen({ visible, onSelect, onClose, lastWorkout }: TemplateScreenProps) {
  const insets = useSafeAreaInsets();
  const [activeCat, setActiveCat] = useState(PRESET_CATEGORIES[0].id);

  const activePresets = PRESET_CATEGORIES.find((c) => c.id === activeCat)?.presets ?? [];

  function handleLastWorkout() {
    if (!lastWorkout) return;
    onSelect({
      id:          lastWorkout.id,
      name:        lastWorkout.name,
      rounds:      lastWorkout.rounds,
      roundTime:   lastWorkout.roundTime,
      rest:        lastWorkout.rest,
      warmUp:      lastWorkout.warmUp,
      coolDown:    lastWorkout.coolDown,
      color:       lastWorkout.color,
      description: '',
    });
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top }]}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Templates</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.5)" />
          </Pressable>
        </View>

        {/* Last session */}
        {lastWorkout && (
          <Pressable style={styles.lastCard} onPress={handleLastWorkout}>
            <Text style={styles.lastLabel}>Last session</Text>
            <Text style={styles.lastName}>{lastWorkout.name}</Text>
            <Text style={styles.lastMeta}>
              {lastWorkout.rounds} rounds · {lastWorkout.roundTime} · {lastWorkout.rest} rest
            </Text>
          </Pressable>
        )}

        {/* Category tabs */}
        <View style={styles.tabsWrap}>
          <View style={styles.tabs}>
            {PRESET_CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={[styles.tab, activeCat === cat.id && styles.tabActive]}
                onPress={() => setActiveCat(cat.id)}
              >
                <Text style={[styles.tabText, activeCat === cat.id && styles.tabTextActive]}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Preset list */}
        <FlatList
          data={activePresets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <PresetCard preset={item} onPress={() => onSelect(item)} />
          )}
          ListFooterComponent={
            <Pressable style={styles.scratchBtn} onPress={() => onSelect(null)}>
              <Text style={styles.scratchLabel}>Start from scratch</Text>
              <Text style={styles.scratchSub}>All fields empty</Text>
            </Pressable>
          }
        />
      </View>
    </Modal>
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
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },

  // Last session
  lastCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 14,
    gap: 3,
  },
  lastLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  lastName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  lastMeta: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },

  // Tabs
  tabsWrap: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
  },
  tabTextActive: {
    color: '#111',
  },

  // List
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 8,
  },

  // Preset card
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
    minHeight: 72,
  },
  presetStrip: {
    width: 4,
    alignSelf: 'stretch',
  },
  presetBody: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 14,
    gap: 3,
  },
  presetName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  presetDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  presetMeta: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
  },
  presetChevron: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 20,
    paddingRight: 16,
  },

  // Start from scratch
  scratchBtn: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    gap: 4,
  },
  scratchLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  scratchSub: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
  },
});

import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export interface TimePickerModalProps {
  visible: boolean;
  value: string;
  color: string;
  label: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

const ITEM_H = 48;
const VISIBLE_ITEMS = 3;
const DRUM_H = ITEM_H * VISIBLE_ITEMS;

function parseValue(value: string): { mins: number; secs: number } {
  if (!value || !value.includes(':')) return { mins: 0, secs: 0 };
  const [m, s] = value.split(':').map((n) => parseInt(n) || 0);
  return {
    mins: Math.max(0, Math.min(59, m)),
    secs: Math.max(0, Math.min(59, s)),
  };
}

// ─── DrumColumn ───────────────────────────────────────────────────────────────

interface DrumColumnProps {
  count: number;
  initial: number;
  valueRef: React.MutableRefObject<number>;
}

function DrumColumn({ count, initial, valueRef }: DrumColumnProps) {
  const ref = useRef<ScrollView>(null);
  const [liveIdx, setLiveIdx] = useState(initial);

  useEffect(() => {
    ref.current?.scrollTo({ y: initial * ITEM_H, animated: false });
    setLiveIdx(initial);
    valueRef.current = initial;
  }, [initial]);

  function clamp(y: number) {
    return Math.max(0, Math.min(count - 1, Math.round(y / ITEM_H)));
  }

  return (
    <View style={drum.wrap}>
      <View pointerEvents="none" style={drum.highlight} />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_H }}
        onScroll={(e) => {
          const idx = clamp(e.nativeEvent.contentOffset.y);
          setLiveIdx(idx);
          valueRef.current = idx;
        }}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const idx = clamp(e.nativeEvent.contentOffset.y);
          setLiveIdx(idx);
          valueRef.current = idx;
        }}
      >
        {Array.from({ length: count }, (_, i) => (
          <View key={i} style={drum.item}>
            <Text style={[drum.label, i === liveIdx && drum.labelSelected]}>
              {String(i).padStart(2, '0')}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const drum = StyleSheet.create({
  wrap: {
    width: 80,
    height: DRUM_H,
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: ITEM_H,
    left: 0,
    right: 0,
    height: ITEM_H,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
    zIndex: 1,
  },
  item: {
    height: ITEM_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.3)',
    fontVariant: ['tabular-nums'],
  },
  labelSelected: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '500',
  },
});

// ─── TimePickerModal ──────────────────────────────────────────────────────────

export default function TimePickerModal({
  visible,
  value,
  color,
  label,
  onConfirm,
  onClose,
}: TimePickerModalProps) {
  const parsed = parseValue(value);
  const minsRef = useRef(parsed.mins);
  const secsRef = useRef(parsed.secs);

  // Sync refs when picker opens with a new value
  useEffect(() => {
    if (visible) {
      const { mins: m, secs: s } = parseValue(value);
      minsRef.current = m;
      secsRef.current = s;
    }
  }, [visible, value]);

  function handleConfirm() {
    onConfirm(`${minsRef.current}:${String(secsRef.current).padStart(2, '0')}`);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.label}>{label}</Text>

          <View style={styles.pickerRow}>
            <DrumColumn
              key={`mins-${visible}-${value}`}
              count={60}
              initial={minsRef.current}
              valueRef={minsRef}
            />
            <Text style={styles.separator}>:</Text>
            <DrumColumn
              key={`secs-${visible}-${value}`}
              count={60}
              initial={secsRef.current}
              valueRef={secsRef}
            />
          </View>

          <Pressable
            style={[styles.confirmBtn, { backgroundColor: color }]}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmText}>Set time</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1c1c1c',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 24,
    paddingHorizontal: 32,
    paddingBottom: 44,
    gap: 24,
  },
  label: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  separator: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    marginBottom: 0,
  },
  confirmBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

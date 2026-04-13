import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export interface TimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

/**
 * Extract digits, cap at 4, format as time string while the user types.
 *   "3"    → "3"
 *   "30"   → "0:30"
 *   "300"  → "3:00"
 *   "130"  → "1:30"
 *   "1300" → "13:00"
 */
function formatWhileTyping(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length === 0) return '';
  if (digits.length === 1) return digits;
  if (digits.length === 2) return `0:${digits}`;
  if (digits.length === 3) return `${digits[0]}:${digits.slice(1)}`;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

/** Clamp minutes and seconds to [0, 59] and return a normalised string. */
function normalizeOnBlur(
  value: string,
  required: boolean,
): { normalized: string; error: string | null } {
  const trimmed = value.trim();

  if (!trimmed) {
    if (required) return { normalized: '', error: 'Required' };
    return { normalized: '0:00', error: null };
  }

  let mins = 0;
  let secs = 0;

  if (trimmed.includes(':')) {
    const [m, s] = trimmed.split(':');
    mins = Math.min(59, Math.max(0, parseInt(m) || 0));
    secs = Math.min(59, Math.max(0, parseInt(s) || 0));
  } else {
    // Single digit typed without blur yet (e.g. "3" → 0:03)
    secs = Math.min(59, parseInt(trimmed) || 0);
  }

  return {
    normalized: `${mins}:${String(secs).padStart(2, '0')}`,
    error: null,
  };
}

export default function TimeInput({
  label,
  value,
  onChange,
  placeholder = '0:00',
  required = false,
}: TimeInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [showValid, setShowValid] = useState(false);

  const borderColor = error
    ? 'rgba(226,75,74,0.6)'
    : showValid
    ? 'rgba(52,199,89,0.4)'
    : isFocused
    ? 'rgba(255,255,255,0.35)'
    : 'rgba(255,255,255,0.12)';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.inputRow, { borderColor }]}>
        <BottomSheetTextInput
          style={styles.input}
          value={value}
          onChangeText={(raw) => {
            onChange(formatWhileTyping(raw));
            if (error) setError(null);
            if (showValid) setShowValid(false);
          }}
          onFocus={() => {
            setIsFocused(true);
            setError(null);
            setShowValid(false);
          }}
          onBlur={() => {
            setIsFocused(false);
            const { normalized, error: err } = normalizeOnBlur(value, required);
            onChange(normalized);
            setError(err);
            setShowValid(err === null);
          }}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.25)"
          keyboardType="numeric"
          selectTextOnFocus
        />
        {showValid && (
          <Ionicons name="checkmark" size={14} color="#34c759" style={styles.checkmark} />
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 0.5,
    borderRadius: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  checkmark: {
    paddingRight: 12,
  },
  errorText: {
    color: '#ff453a',
    fontSize: 11,
    marginTop: 4,
  },
});

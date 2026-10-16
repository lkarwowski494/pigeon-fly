/**
 * PIGEON-FLY — AppraisalModal
 * Interactive physical conformation, eye sign, and wing evaluation modal.
 * Calculates standard FCI Olympiad score (90.00 - 95.00 pts) and distance suitability.
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Pigeon } from '../domain/types';
import {
  calculateAppraisalScore,
  EyeColor,
  EyeSignRing,
  KeelStrength,
  BackStrength,
  WingVentilation,
  AppraisalResult,
} from '../domain/appraisal';
import { FieldButton } from './FieldButton';

export interface AppraisalModalProps {
  visible: boolean;
  pigeon: Pigeon | null;
  onClose: () => void;
  onSaveAppraisal?: (result: AppraisalResult) => void;
}

export function AppraisalModal({
  visible,
  pigeon,
  onClose,
  onSaveAppraisal,
}: AppraisalModalProps) {
  if (!pigeon) return null;

  const [eyeColor, setEyeColor] = useState<EyeColor>('pearl');
  const [eyeSignRing, setEyeSignRing] = useState<EyeSignRing>('standing');
  const [keelStrength, setKeelStrength] = useState<KeelStrength>('tight_closed');
  const [backStrength, setBackStrength] = useState<BackStrength>('rock_solid');
  const [muscleScore, setMuscleScore] = useState<number>(4);
  const [featherScore, setFeatherScore] = useState<number>(5);
  const [wingVentilation, setWingVentilation] = useState<WingVentilation>('excellent');
  const [wingStepGap, setWingStepGap] = useState<boolean>(true);

  const evaluation: AppraisalResult = calculateAppraisalScore({
    pigeonId: pigeon.id,
    ringNumber: pigeon.ringNumber,
    eyeColor,
    eyeSignRing,
    keelStrength,
    backStrength,
    pectoralMuscleFlexibility: muscleScore,
    featherSilkyPowder: featherScore,
    wingVentilation,
    wingStepGap,
  });

  const handleSave = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    if (onSaveAppraisal) {
      onSaveAppraisal(evaluation);
    }
    Alert.alert(
      'Zapisano Ocenę!',
      `Ocena FCI: ${evaluation.scoreStandardFci.toFixed(2)} pkt\nTyp: ${evaluation.suitabilityTitle}`
    );
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>OCENA BUDOWY & ZNAK OKA</Text>
                <Text style={styles.subtitle}>
                  {pigeon.countryCode}-{pigeon.ringNumber} ({pigeon.year})
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Score & Category Hero Banner */}
            <View style={styles.heroCard}>
              <Text style={styles.heroScoreLabel}>PUNKTY STANDARD FCI (OLIMPIADA)</Text>
              <Text style={styles.heroScoreValue}>{evaluation.scoreStandardFci.toFixed(2)}</Text>
              <View style={styles.suitabilityBadge}>
                <Text style={styles.suitabilityText}>{evaluation.suitabilityTitle}</Text>
              </View>
              <Text style={styles.summaryText}>{evaluation.breederSummary}</Text>
            </View>

            {/* 1. Keel & Pelvis */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>1. WIDEŁKI MIEDNICOWE & MOSTEK:</Text>
              <View style={styles.chipsRow}>
                {(
                  [
                    { key: 'tight_closed', label: 'Zwarte jak skała (Idealne)' },
                    { key: 'medium', label: 'Średnio zwarte' },
                    { key: 'wide_open', label: 'Rozwarte' },
                  ] as const
                ).map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setKeelStrength(opt.key)}
                    style={[styles.chip, keelStrength === opt.key && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, keelStrength === opt.key && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 2. Back Firmness */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>2. GRZBIET I KUPER:</Text>
              <View style={styles.chipsRow}>
                {(
                  [
                    { key: 'rock_solid', label: 'Twardy i szeroki' },
                    { key: 'medium', label: 'Prawidłowy' },
                    { key: 'weak', label: 'Miękki / Wąski' },
                  ] as const
                ).map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setBackStrength(opt.key)}
                    style={[styles.chip, backStrength === opt.key && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, backStrength === opt.key && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 3. Eye Sign */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>3. ZNAK OKA (PIERŚCIEŃ KORELACJI):</Text>
              <View style={styles.chipsRow}>
                {(
                  [
                    { key: 'standing', label: 'Stojący (Szybkościowy)' },
                    { key: 'full_circle', label: 'Pełny okrąg (Rozpłód)' },
                    { key: 'inner_speed', label: 'Wewnętrzny sprinterski' },
                    { key: 'absent', label: 'Brak pierścienia' },
                  ] as const
                ).map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setEyeSignRing(opt.key)}
                    style={[styles.chip, eyeSignRing === opt.key && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, eyeSignRing === opt.key && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 4. Wing Ventilation */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>4. WENTYLACJA SKRZYDŁA (LOTKI 7-10):</Text>
              <View style={styles.chipsRow}>
                {(
                  [
                    { key: 'excellent', label: 'Głęboka (Maraton)' },
                    { key: 'moderate', label: 'Umiarkowana' },
                    { key: 'poor', label: 'Wąska' },
                  ] as const
                ).map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setWingVentilation(opt.key)}
                    style={[styles.chip, wingVentilation === opt.key && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, wingVentilation === opt.key && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => setWingStepGap(!wingStepGap)}
                style={[styles.toggleBtn, wingStepGap && styles.toggleBtnActive]}
              >
                <Text style={styles.toggleBtnText}>
                  {wingStepGap ? '✓ Wyraźny uskok skrzydełkowy (OK)' : 'Brak uskoku skrzydełkowego'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Strengths & Weaknesses */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>ATUTY FENOTYPOWE:</Text>
              {evaluation.strengths.map((s, idx) => (
                <Text key={idx} style={styles.strengthItem}>
                  ✓ {s}
                </Text>
              ))}
              {evaluation.weaknesses.length > 0 && (
                <>
                  <Text style={[styles.sectionHeading, { marginTop: 10, color: '#E53935' }]}>
                    PUNKTY DO POPRAWY W ROZPŁODZIE:
                  </Text>
                  {evaluation.weaknesses.map((w, idx) => (
                    <Text key={idx} style={styles.weaknessItem}>
                      ⚠️ {w}
                    </Text>
                  ))}
                </>
              )}
            </View>

            {/* Save Button */}
            <FieldButton
              title="💾 Zapisz Ocenę Ptaka w Notesie"
              onPress={handleSave}
              testID="btn-save-appraisal"
              style={{ marginTop: 8 }}
            />
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1E2127',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '92%',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E5A93C',
  },
  subtitle: {
    fontSize: 13,
    color: '#D4D8E0',
    fontWeight: '700',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
  },
  closeText: {
    fontSize: 22,
    color: '#8E94A0',
    fontWeight: '800',
  },
  heroCard: {
    backgroundColor: '#15171C',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E5A93C',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroScoreLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E94A0',
    letterSpacing: 0.8,
  },
  heroScoreValue: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'monospace',
    marginVertical: 4,
  },
  suitabilityBadge: {
    backgroundColor: '#2A2417',
    borderColor: '#E5A93C',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  suitabilityText: {
    color: '#E5A93C',
    fontSize: 12,
    fontWeight: '800',
  },
  summaryText: {
    fontSize: 12,
    color: '#D4D8E0',
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: '#15171C',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#1E2127',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  chipActive: {
    backgroundColor: 'rgba(229, 169, 60, 0.2)',
    borderColor: '#E5A93C',
  },
  chipText: {
    fontSize: 11,
    color: '#8E94A0',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#E5A93C',
    fontWeight: '700',
  },
  toggleBtn: {
    backgroundColor: '#1E2127',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginTop: 8,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#4CAF50',
  },
  toggleBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  strengthItem: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  weaknessItem: {
    color: '#E53935',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
});

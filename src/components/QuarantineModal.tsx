/**
 * PIGEON-FLY — QuarantineModal (Z-308, BR-ZDR-010, RD-27)
 * Quarantine Ward & Isolation Chamber management modal.
 * Tracks daily crop condition, droppings consistency, treatments, and releases patients.
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
import {
  QuarantinePatient,
  QuarantineDailyLog,
  CropCondition,
  DroppingsConsistency,
  evaluateQuarantineRelease,
  createQuarantinePatient,
} from '../domain/quarantine';
import { FieldButton } from './FieldButton';

export interface QuarantineModalProps {
  visible: boolean;
  onClose: () => void;
  patientRingNumber?: string;
  onDischargePatient?: (ringNumber: string) => void;
}

export function QuarantineModal({
  visible,
  onClose,
  patientRingNumber = 'PL-0284-24-9102',
  onDischargePatient,
}: QuarantineModalProps) {
  // Demo initial patient with 14-day YPDS quarantine
  const [patient, setPatient] = useState<QuarantinePatient>(() => {
    const p = createQuarantinePatient({
      pigeonId: 'p-quar-1',
      ringNumber: patientRingNumber,
      reason: 'ypds_adeno_coli',
      admissionDate: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
    });
    // Add two healthy logs
    p.dailyLogs = [
      {
        date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
        cropCondition: 'normal_empty',
        droppingsConsistency: 'normal_firm',
        appetite: 'normal',
        waterIntake: 'normal',
        bodyTemperature: 'normal',
        treatmentsAdministered: ['Elektrolity 300 mOsm/L', 'Maślan sodu'],
      },
      {
        date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString().split('T')[0],
        cropCondition: 'normal_empty',
        droppingsConsistency: 'normal_firm',
        appetite: 'normal',
        waterIntake: 'normal',
        bodyTemperature: 'normal',
        treatmentsAdministered: ['Ocet jabłkowy pH 4.2', 'Probiotyk'],
      },
    ];
    return p;
  });

  // Daily log inputs
  const [crop, setCrop] = useState<CropCondition>('normal_empty');
  const [droppings, setDroppings] = useState<DroppingsConsistency>('normal_firm');
  const [appetite, setAppetite] = useState<'normal' | 'reduced' | 'anorexic'>('normal');
  const [temperature, setTemperature] = useState<'normal' | 'cold_extremities' | 'feverish'>('normal');
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([
    'Elektrolity 300 mOsm/L',
  ]);

  const releaseEval = evaluateQuarantineRelease(patient);

  const toggleTreatment = (trt: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSelectedTreatments((prev) =>
      prev.includes(trt) ? prev.filter((t) => t !== trt) : [...prev, trt]
    );
  };

  const handleAddDailyLog = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const todayStr = new Date().toISOString().split('T')[0];
    const newLog: QuarantineDailyLog = {
      date: todayStr,
      cropCondition: crop,
      droppingsConsistency: droppings,
      appetite,
      waterIntake: 'normal',
      bodyTemperature: temperature,
      treatmentsAdministered: [...selectedTreatments],
    };

    setPatient((prev) => ({
      ...prev,
      dailyLogs: [...prev.dailyLogs.filter((l) => l.date !== todayStr), newLog],
    }));

    Alert.alert('Zapisano wpis kliniczny', `Zarejestrowano obserwację pacjenta na dzień ${todayStr}.`);
  };

  const handleDischarge = () => {
    if (!releaseEval.canRelease) {
      Alert.alert(
        'Brak zgody na zwolnienie',
        releaseEval.reasonsBlocking.join('\n\n')
      );
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    if (onDischargePatient) {
      onDischargePatient(patient.ringNumber);
    }

    setPatient((prev) => ({ ...prev, status: 'discharged' }));

    Alert.alert(
      'Ptak Zwolniony do Stada',
      `Gołąb ${patient.ringNumber} zakończył kwarantannę i został bezpiecznie przywrócony do stada macierzystego.`
    );
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.screenTag}>BR-ZDR-010 • PROTOKÓŁ IZOLATKI</Text>
              <Text style={styles.title}>Szpitalik & Kwarantanna</Text>
              <Text style={styles.subtitle}>
                Pacjent: <Text style={styles.ringText}>{patient.ringNumber}</Text> • Przyjęto:{' '}
                {patient.admissionDate}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Release Status Card */}
          <View
            style={[
              styles.statusCard,
              releaseEval.canRelease ? styles.statusCardReady : styles.statusCardQuarantine,
            ]}
          >
            <View style={styles.statusHeader}>
              <Text style={styles.statusTag}>STATUS ZOOHIGIENICZNY</Text>
              <Text
                style={[
                  styles.statusBadge,
                  releaseEval.canRelease ? styles.statusBadgeReady : styles.statusBadgeQuarantine,
                ]}
              >
                {releaseEval.canRelease
                  ? '🟢 ZGODA NA POWRÓT DO STADA'
                  : '⚠️ KWARANTANNA W TOKU'}
              </Text>
            </View>

            <Text style={styles.statusText}>
              Czas w izolatce: <strong>{releaseEval.daysInQuarantine}</strong> /{' '}
              {releaseEval.minDaysRequired} dni • Seria zdrowych dni:{' '}
              <strong>{releaseEval.consecutiveHealthyDays}</strong> /{' '}
              {releaseEval.requiredHealthyDays}
            </Text>

            {releaseEval.reasonsBlocking.length > 0 && (
              <View style={styles.blockingBox}>
                <Text style={styles.blockingTitle}>Czynnik blokujący powrót:</Text>
                {releaseEval.reasonsBlocking.map((r, i) => (
                  <Text key={i} style={styles.blockingItem}>
                    • {r}
                  </Text>
                ))}
              </View>
            )}

            {releaseEval.canRelease && (
              <FieldButton
                title="🕊️ Zwolnij Ptaka z Izolatki do Stada"
                onPress={handleDischarge}
                variant="primary"
                style={{ marginTop: 10 }}
              />
            )}
          </View>

          {/* Daily Checkup Input Form */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>DODAJ DZISIEJSZĄ OBSERWACJĘ KLINICZNĄ</Text>

            {/* Crop condition */}
            <Text style={styles.inputLabel}>1. Stan wola (poranna kontrola perystaltyki):</Text>
            <View style={styles.optionsRow}>
              {(
                [
                  { key: 'normal_empty', label: 'Puste rano (Zdrowe)' },
                  { key: 'slow_digestion', label: 'Opóźnione' },
                  { key: 'fermenting_stasis', label: 'Zaleganie płynu (YPDS)' },
                  { key: 'vomiting', label: 'Wymioty' },
                ] as const
              ).map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.chip, crop === opt.key && styles.chipActive]}
                  onPress={() => setCrop(opt.key)}
                >
                  <Text style={[styles.chipText, crop === opt.key && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Droppings */}
            <Text style={styles.inputLabel}>2. Konsystencja i barwa kału:</Text>
            <View style={styles.optionsRow}>
              {(
                [
                  { key: 'normal_firm', label: 'Prawidłowy (Zwarty + mocz)' },
                  { key: 'soft_pasty', label: 'Rozluźniony' },
                  { key: 'green_mucoid', label: 'Zielony śluzowaty (Coli)' },
                  { key: 'watery_puddle', label: 'Wodnista plama' },
                ] as const
              ).map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.chip, droppings === opt.key && styles.chipActive]}
                  onPress={() => setDroppings(opt.key)}
                >
                  <Text style={[styles.chipText, droppings === opt.key && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Treatments */}
            <Text style={styles.inputLabel}>3. Podane zabiegi ratunkowe i suplementy:</Text>
            <View style={styles.optionsRow}>
              {[
                'Elektrolity 300 mOsm/L',
                'Ocet jabłkowy pH 4.0',
                'Maślan sodu + IgY',
                'Ryż łuskany + kanar',
                'Probiotyk jelitowy',
              ].map((trt) => {
                const isSel = selectedTreatments.includes(trt);
                return (
                  <TouchableOpacity
                    key={trt}
                    style={[styles.chip, isSel && styles.chipTreatmentActive]}
                    onPress={() => toggleTreatment(trt)}
                  >
                    <Text style={[styles.chipText, isSel && styles.chipTreatmentTextActive]}>
                      {isSel ? `✓ ${trt}` : trt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <FieldButton
              title="➕ Zapisz Dzisiejszy Raport Kliniczny"
              onPress={handleAddDailyLog}
              variant="secondary"
              style={{ marginTop: 12 }}
            />
          </View>

          {/* History of Checkups */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>
              HISTORIA WPISÓW W IZOLATCE ({patient.dailyLogs.length})
            </Text>
            {patient.dailyLogs.map((log, idx) => (
              <View key={idx} style={styles.logItem}>
                <View style={styles.logHeader}>
                  <Text style={styles.logDate}>📅 Dzień: {log.date}</Text>
                  <Text
                    style={[
                      styles.logBadge,
                      log.cropCondition === 'normal_empty' &&
                      log.droppingsConsistency === 'normal_firm'
                        ? styles.logBadgeOk
                        : styles.logBadgeBad,
                    ]}
                  >
                    {log.cropCondition === 'normal_empty' &&
                    log.droppingsConsistency === 'normal_firm'
                      ? '✓ Wole i kał w normie'
                      : '⚠️ Objawy patologiczne'}
                  </Text>
                </View>
                <Text style={styles.logDetail}>
                  Wole: {log.cropCondition === 'normal_empty' ? 'Prawidłowe' : log.cropCondition} • Kał:{' '}
                  {log.droppingsConsistency === 'normal_firm' ? 'Zwarty' : log.droppingsConsistency}
                </Text>
                {log.treatmentsAdministered.length > 0 && (
                  <Text style={styles.logTreatments}>
                    💊 {log.treatmentsAdministered.join(' • ')}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121417',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  screenTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  ringText: {
    color: '#E5A93C',
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 22,
    fontWeight: '800',
  },
  statusCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  statusCardReady: {
    backgroundColor: '#12231A',
    borderColor: '#10B981',
  },
  statusCardQuarantine: {
    backgroundColor: '#261C14',
    borderColor: '#F59E0B',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusTag: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94A3B8',
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeReady: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    color: '#10B981',
  },
  statusBadgeQuarantine: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    color: '#F59E0B',
  },
  statusText: {
    fontSize: 13,
    color: '#D4D8E0',
    lineHeight: 18,
  },
  blockingBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#3E4756',
  },
  blockingTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
    marginBottom: 2,
  },
  blockingItem: {
    fontSize: 11,
    color: '#FCA5A5',
    lineHeight: 15,
  },
  sectionCard: {
    backgroundColor: '#16191E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
    padding: 14,
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '900',
    color: '#E5A93C',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#1E232B',
    borderWidth: 1,
    borderColor: '#3E4756',
  },
  chipActive: {
    backgroundColor: '#E5A93C',
    borderColor: '#E5A93C',
  },
  chipTreatmentActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4D8E0',
  },
  chipTextActive: {
    color: '#121417',
    fontWeight: '900',
  },
  chipTreatmentTextActive: {
    color: '#121417',
    fontWeight: '900',
  },
  logItem: {
    backgroundColor: '#1E232B',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 8,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logDate: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  logBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  logBadgeOk: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    color: '#10B981',
  },
  logBadgeBad: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#EF4444',
  },
  logDetail: {
    fontSize: 11,
    color: '#94A3B8',
  },
  logTreatments: {
    fontSize: 11,
    color: '#60A5FA',
    marginTop: 3,
  },
});

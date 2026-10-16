/**
 * PIGEON-FLY — ClockArrivalModal
 * Rapid 1-tap arrival clocking modal for races and trainings.
 * Computes instantaneous flight duration and speed in m/min.
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { calculateFlightSpeed } from '../domain/racing';
import { FieldButton } from './FieldButton';

export interface ClockArrivalModalProps {
  visible: boolean;
  onClose: () => void;
  raceDistanceMeters: number;
  releaseTimeIso: string;
  onClockArrival: (data: {
    ringNumber: string;
    arrivalTimeIso: string;
    velocityMPerMin: number;
  }) => Promise<void> | void;
}

export function ClockArrivalModal({
  visible,
  onClose,
  raceDistanceMeters,
  releaseTimeIso,
  onClockArrival,
}: ClockArrivalModalProps) {
  const [ringNumber, setRingNumber] = useState('');
  const [arrivalTime, setArrivalTime] = useState(new Date());

  // Update clock every second when modal is open
  useEffect(() => {
    if (!visible) return;
    setArrivalTime(new Date());
    const interval = setInterval(() => {
      setArrivalTime(new Date());
    }, 1000);
    if (typeof (interval as any)?.unref === 'function') {
      (interval as any).unref();
    }
    return () => clearInterval(interval);
  }, [visible]);

  // Compute speed
  const speedResult = calculateFlightSpeed({
    releaseTime: releaseTimeIso,
    arrivalTime: arrivalTime.toISOString(),
    distanceMeters: raceDistanceMeters,
  });

  const flightMinutes = Math.floor(speedResult.netFlightDurationSeconds / 60);
  const flightHours = Math.floor(flightMinutes / 60);
  const remainingMinutes = flightMinutes % 60;
  const remainingSeconds = speedResult.netFlightDurationSeconds % 60;

  const handleClock = async () => {
    if (!ringNumber.trim()) {
      Alert.alert('Brak numeru obrączki', 'Podaj numer obrączki rodowej powracającego gołębia.');
      return;
    }

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    await onClockArrival({
      ringNumber: ringNumber.trim(),
      arrivalTimeIso: arrivalTime.toISOString(),
      velocityMPerMin: speedResult.velocityMPerMin,
    });

    setRingNumber('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.title}>⏱️ ODBICIE PRZYLOTU GOŁĘBIA</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Live Time Display */}
            <View style={styles.liveTimeBox}>
              <Text style={styles.liveTimeLabel}>CZAS PRZYLOTU (TIMESTAMP):</Text>
              <Text style={styles.liveTimeVal}>
                {arrivalTime.toLocaleTimeString('pl-PL', { hour12: false })}
              </Text>
              <Text style={styles.liveDateVal}>
                {arrivalTime.toISOString().slice(0, 10)}
              </Text>
            </View>

            {/* Live Calculation Preview */}
            <View style={styles.statsPreview}>
              <View style={styles.statCol}>
                <Text style={styles.statLbl}>Czas lotu</Text>
                <Text style={styles.statVal}>
                  {flightHours}h {remainingMinutes}m {remainingSeconds}s
                </Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLbl}>Dystans</Text>
                <Text style={styles.statVal}>
                  {(raceDistanceMeters / 1000).toFixed(1)} km
                </Text>
              </View>
              <View style={[styles.statCol, styles.speedCol]}>
                <Text style={[styles.statLbl, { color: '#E5A93C' }]}>PRĘDKOŚĆ</Text>
                <Text style={styles.speedVal}>
                  {speedResult.velocityMPerMin.toFixed(2)}{' '}
                  <Text style={styles.unitText}>m/min</Text>
                </Text>
              </View>
            </View>

            {/* Ring number input */}
            <Text style={styles.label}>NUMER OBRĄCZKI STAŁEJ:</Text>
            <TextInput
              style={styles.ringInput}
              placeholder="np. PL-0284-23-1402"
              placeholderTextColor="#717886"
              value={ringNumber}
              onChangeText={setRingNumber}
              autoCapitalize="characters"
              autoFocus
            />

            {/* Confirm button */}
            <FieldButton
              title="ZATWIERDŹ I ODBIJ W RANKINGU"
              onPress={handleClock}
              style={{ marginTop: 20 }}
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1E2127',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 36,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2B2F38',
    paddingBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#E5A93C',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2E38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#D4D8E0',
    fontSize: 16,
    fontWeight: '700',
  },
  liveTimeBox: {
    backgroundColor: '#15171B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5A93C',
    marginBottom: 14,
  },
  liveTimeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.5,
  },
  liveTimeVal: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'monospace',
    marginVertical: 4,
  },
  liveDateVal: {
    fontSize: 13,
    color: '#8E94A0',
    fontFamily: 'monospace',
  },
  statsPreview: {
    flexDirection: 'row',
    backgroundColor: '#15171B',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#262930',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#262930',
  },
  speedCol: {
    borderRightWidth: 0,
    flex: 1.2,
  },
  statLbl: {
    fontSize: 11,
    color: '#8E94A0',
    fontWeight: '700',
    marginBottom: 2,
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F0F2F5',
    fontFamily: 'monospace',
  },
  speedVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#E5A93C',
    fontFamily: 'monospace',
  },
  unitText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E94A0',
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#A0A6B2',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  ringInput: {
    backgroundColor: '#15171B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3D424D',
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: 16,
    height: 54,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
});

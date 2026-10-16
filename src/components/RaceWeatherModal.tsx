/**
 * PIGEON-FLY — RaceWeatherModal
 * Aerodynamic calculator for wind direction, headwind/tailwind vectors,
 * and arrival time predictions for pigeon fanciers.
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { calculateWindImpact, WindAnalysis } from '../domain/weather';
import { Coordinates } from '../domain/types';
import { FieldButton } from './FieldButton';

export interface RaceWeatherModalProps {
  visible: boolean;
  onClose: () => void;
  releaseCoordinates?: Coordinates;
  loftCoordinates?: Coordinates;
  distanceMeters?: number;
}

export function RaceWeatherModal({
  visible,
  onClose,
  releaseCoordinates = { latitude: 52.1205, longitude: 11.6276 }, // Magdeburg
  loftCoordinates = { latitude: 52.2297, longitude: 21.0122 }, // Warsaw/Loft
  distanceMeters = 345200,
}: RaceWeatherModalProps) {
  const [windFromDeg, setWindFromDeg] = useState(270); // West (W)
  const [windSpeedKmh, setWindSpeedKmh] = useState('22');

  const windDirections: { label: string; deg: number; icon: string }[] = [
    { label: 'Zachód (W)', deg: 270, icon: '⬅️' },
    { label: 'Poł-Zach (SW)', deg: 225, icon: '↙️' },
    { label: 'Południe (S)', deg: 180, icon: '⬇️' },
    { label: 'Wschód (E)', deg: 90, icon: '➡️' },
    { label: 'Północ (N)', deg: 0, icon: '⬆️' },
    { label: 'Płn-Wsch (NE)', deg: 45, icon: '↗️' },
    { label: 'Płn-Zach (NW)', deg: 315, icon: '↖️' },
    { label: 'Poł-Wsch (SE)', deg: 135, icon: '↘️' },
  ];

  const speedVal = parseFloat(windSpeedKmh) || 0;

  const analysis: WindAnalysis = calculateWindImpact({
    releasePoint: releaseCoordinates,
    loftPoint: loftCoordinates,
    distanceMeters,
    windFromDeg,
    windSpeedKmh: speedVal,
  });

  const getConditionColor = (cond: string) => {
    switch (cond) {
      case 'tailwind_fast':
        return '#4CAF50'; // Green
      case 'moderate':
        return '#64B5F6'; // Blue
      case 'headwind_hard':
        return '#FFB74D'; // Amber
      case 'catastrophic_headwind':
        return '#E53935'; // Red
      default:
        return '#8E94A0';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>AERODYNAMIKA I WIATR</Text>
                <Text style={styles.subtitle}>
                  Kąt lotu: {analysis.flightBearingDeg}° • Dystans: {(distanceMeters / 1000).toFixed(1)} km
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Condition Banner */}
            <View
              style={[
                styles.conditionCard,
                { borderColor: getConditionColor(analysis.flightCondition) },
              ]}
            >
              <Text style={styles.conditionTitle}>{analysis.conditionDescription}</Text>
              <Text style={styles.predictedSpeed}>
                {analysis.estimatedVelocityMPerMin} <Text style={styles.unitText}>m/min</Text>
              </Text>
              <Text style={styles.predictedTime}>
                Szacowany czas lotu: {Math.floor(analysis.estimatedDurationMinutes / 60)}h{' '}
                {Math.round(analysis.estimatedDurationMinutes % 60)}m
              </Text>
              <Text style={styles.adviceText}>💡 {analysis.fancierAdvice}</Text>
            </View>

            {/* Wind Selector Form */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>KIERUNEK WIATRU (SKĄD WIEJE):</Text>
              <View style={styles.directionGrid}>
                {windDirections.map((item) => {
                  const isSelected = windFromDeg === item.deg;
                  return (
                    <TouchableOpacity
                      key={item.deg}
                      onPress={() => setWindFromDeg(item.deg)}
                      style={[
                        styles.directionChip,
                        isSelected && styles.directionChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.directionChipText,
                          isSelected && styles.directionChipTextActive,
                        ]}
                      >
                        {item.icon} {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.sectionHeading, { marginTop: 14 }]}>
                PRĘDKOŚĆ WIATRU (KM/H):
              </Text>
              <TextInput
                style={styles.input}
                value={windSpeedKmh}
                onChangeText={setWindSpeedKmh}
                keyboardType="decimal-pad"
                placeholder="np. 20"
                placeholderTextColor="#8E94A0"
              />

              {/* Vector Decomposition stats */}
              <View style={styles.vectorStatsRow}>
                <View style={styles.vectorBox}>
                  <Text style={styles.vectorLbl}>Wektor wzdłużny:</Text>
                  <Text
                    style={[
                      styles.vectorVal,
                      {
                        color:
                          analysis.effectiveTailwindKmh >= 0 ? '#4CAF50' : '#E53935',
                      },
                    ]}
                  >
                    {analysis.effectiveTailwindKmh >= 0
                      ? `+${analysis.effectiveTailwindKmh.toFixed(1)} km/h (w ogon)`
                      : `${analysis.effectiveTailwindKmh.toFixed(1)} km/h (w dziób)`}
                  </Text>
                </View>
                <View style={styles.vectorBox}>
                  <Text style={styles.vectorLbl}>Wiatr boczny:</Text>
                  <Text style={styles.vectorVal}>
                    {analysis.crosswindKmh.toFixed(1)} km/h
                  </Text>
                </View>
              </View>
            </View>

            {/* Close Button */}
            <FieldButton
              title="Zamknij Kalkulator Pogody"
              variant="secondary"
              onPress={onClose}
              testID="btn-close-weather"
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
    color: '#8E94A0',
    fontWeight: '600',
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
  conditionCard: {
    backgroundColor: '#15171C',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 14,
    alignItems: 'center',
  },
  conditionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  predictedSpeed: {
    fontSize: 36,
    fontWeight: '900',
    color: '#E5A93C',
    marginVertical: 4,
    fontFamily: 'monospace',
  },
  unitText: {
    fontSize: 16,
    color: '#8E94A0',
    fontWeight: '600',
  },
  predictedTime: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 8,
  },
  adviceText: {
    fontSize: 12,
    color: '#D4D8E0',
    lineHeight: 18,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: '#15171C',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  directionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  directionChip: {
    backgroundColor: '#1E2127',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
    width: '48%',
  },
  directionChipActive: {
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    borderColor: '#E5A93C',
  },
  directionChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E94A0',
  },
  directionChipTextActive: {
    color: '#E5A93C',
  },
  input: {
    backgroundColor: '#1E2127',
    borderWidth: 1,
    borderColor: '#373D4B',
    borderRadius: 8,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    height: 44,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  vectorStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  vectorBox: {
    flex: 1,
    backgroundColor: '#1E2127',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  vectorLbl: {
    fontSize: 11,
    color: '#8E94A0',
    marginBottom: 2,
  },
  vectorVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
});

/**
 * PIGEON-FLY — Kalkulator Prędkości Lotu (m/min)
 * Instant velocity calculator with Vincenty geodesic distance & night neutralization.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { calculateFlightSpeed, getRaceCategory } from '../../src/domain/racing';
import { FieldButton } from '../../src/components/FieldButton';

export default function CalculatorScreen() {
  const [distanceKm, setDistanceKm] = useState('345.2');
  const [releaseHour, setReleaseHour] = useState('06:30:00');
  const [arrivalHour, setArrivalHour] = useState('10:47:15');
  const [applyNightNeutral, setApplyNightNeutral] = useState(false);

  // Compute speed dynamically
  let speedResult: { mPerMin: number; kmH: number; category: string; duration: string } | null = null;
  let calcError: string | null = null;

  try {
    const distMeters = parseFloat(distanceKm) * 1000;
    if (!isNaN(distMeters) && distMeters > 0) {
      const today = new Date().toISOString().split('T')[0];
      const relTime = new Date(`${today}T${releaseHour}Z`);
      const arrTime = new Date(`${today}T${arrivalHour}Z`);

      if (!isNaN(relTime.getTime()) && !isNaN(arrTime.getTime()) && arrTime >= relTime) {
        const res = calculateFlightSpeed({
          distanceMeters: distMeters,
          releaseTime: relTime,
          arrivalTime: arrTime,
          neutralStart: applyNightNeutral ? '22:00' : undefined,
          neutralEnd: applyNightNeutral ? '05:00' : undefined,
        });

        const totalSec = res.netFlightDurationSeconds;
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = Math.floor(totalSec % 60);

        speedResult = {
          mPerMin: res.velocityMPerMin,
          kmH: res.velocityKmH,
          category: getRaceCategory(distMeters),
          duration: `${h}h ${m}min ${s}s`,
        };
      }
    }
  } catch (err: any) {
    calcError = err.message || 'Błąd obliczeń';
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Speed Result Highlight Box */}
        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>ŚREDNIA PRĘDKOŚĆ</Text>
          <Text style={styles.resultValue}>
            {speedResult ? speedResult.mPerMin.toFixed(2) : '---.--'}
          </Text>
          <Text style={styles.resultUnit}>metrów / minutę (m/min)</Text>

          {speedResult && (
            <View style={styles.subResultsRow}>
              <View style={styles.subItem}>
                <Text style={styles.subLabel}>Prędkość km/h</Text>
                <Text style={styles.subValue}>{speedResult.kmH.toFixed(2)} km/h</Text>
              </View>
              <View style={styles.subItem}>
                <Text style={styles.subLabel}>Czas netto</Text>
                <Text style={styles.subValue}>{speedResult.duration}</Text>
              </View>
              <View style={styles.subItem}>
                <Text style={styles.subLabel}>Kategoria</Text>
                <Text style={styles.subValue}>{speedResult.category.toUpperCase()}</Text>
              </View>
            </View>
          )}

          {calcError && <Text style={styles.errorText}>{calcError}</Text>}
        </View>

        {/* Inputs Form */}
        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>Dystans z gołębnika (km):</Text>
          <TextInput
            style={styles.textInput}
            keyboardType="decimal-pad"
            value={distanceKm}
            onChangeText={setDistanceKm}
            placeholder="np. 345.2"
            placeholderTextColor="#8E94A0"
          />

          <View style={styles.timeInputsRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>Wypuszczenie (HH:mm:ss):</Text>
              <TextInput
                style={styles.textInput}
                value={releaseHour}
                onChangeText={setReleaseHour}
                placeholder="06:30:00"
                placeholderTextColor="#8E94A0"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.inputLabel}>Przylot (HH:mm:ss):</Text>
              <TextInput
                style={styles.textInput}
                value={arrivalHour}
                onChangeText={setArrivalHour}
                placeholder="10:47:15"
                placeholderTextColor="#8E94A0"
              />
            </View>
          </View>

          {/* Night Neutralization Toggle */}
          <FieldButton
            title={applyNightNeutral ? '🌙 Neutralizacja nocna: WŁĄCZONA (22:00-05:00)' : '☀️ Neutralizacja nocna: WYŁĄCZONA'}
            variant={applyNightNeutral ? 'primary' : 'secondary'}
            onPress={() => setApplyNightNeutral(!applyNightNeutral)}
            style={styles.neutralBtn}
            textStyle={{ fontSize: 14 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121417',
  },
  container: {
    padding: 16,
  },
  resultBox: {
    backgroundColor: '#1E2127',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5A93C',
    marginBottom: 20,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 1,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  resultUnit: {
    fontSize: 15,
    fontWeight: '700',
    color: '#A0A6B2',
    marginTop: 2,
  },
  subResultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#2F343F',
    marginTop: 16,
    paddingTop: 12,
  },
  subItem: {
    alignItems: 'center',
  },
  subLabel: {
    fontSize: 12,
    color: '#8E94A0',
    marginBottom: 2,
  },
  subValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorText: {
    color: '#E53935',
    marginTop: 8,
    fontWeight: '600',
  },
  formSection: {
    backgroundColor: '#1E2127',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4D8E0',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#15171B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3D424D',
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 14,
    fontFamily: 'monospace',
  },
  timeInputsRow: {
    flexDirection: 'row',
  },
  neutralBtn: {
    minHeight: 48,
    marginTop: 4,
  },
});

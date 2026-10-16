/**
 * PIGEON-FLY — Kalkulator Prędkości Lotu (m/min)
 * Instant velocity calculator with Vincenty geodesic distance & night neutralization.
 * Supports Metric (m/min, km) & Imperial (ypm, mi) conversion and GPS release coordinates.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import {
  calculateFlightSpeed,
  calculateGeodesicDistanceMeters,
  getRaceCategory,
} from '../../src/domain/racing';
import { formatVelocity, formatDistance, UnitSystem } from '../../src/domain/units';
import { FieldButton } from '../../src/components/FieldButton';

interface GpsPreset {
  name: string;
  lat: number;
  lon: number;
}

const GPS_PRESETS: GpsPreset[] = [
  { name: 'Magdeburg (DE)', lat: 52.13, lon: 11.62 },
  { name: 'Bruksela (BE)', lat: 50.85, lon: 4.35 },
  { name: 'Berlin (DE)', lat: 52.52, lon: 13.40 },
  { name: 'Rawicz (PL)', lat: 51.61, lon: 16.85 },
];

export default function CalculatorScreen() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [calcMode, setCalcMode] = useState<'manual' | 'gps'>('manual');
  const [distanceKm, setDistanceKm] = useState('345.2');
  const [releaseHour, setReleaseHour] = useState('06:30:00');
  const [arrivalHour, setArrivalHour] = useState('10:47:15');
  const [applyNightNeutral, setApplyNightNeutral] = useState(false);

  // GPS coordinates
  const [selectedPreset, setSelectedPreset] = useState<GpsPreset>(GPS_PRESETS[0]);
  const [loftLat] = useState('51.8800');
  const [loftLon] = useState('17.0200');

  // Compute distance in meters based on mode
  let effectiveDistanceMeters = parseFloat(distanceKm) * 1000;
  if (calcMode === 'gps') {
    effectiveDistanceMeters = calculateGeodesicDistanceMeters(
      { latitude: selectedPreset.lat, longitude: selectedPreset.lon },
      { latitude: parseFloat(loftLat) || 51.88, longitude: parseFloat(loftLon) || 17.02 }
    );
  }

  // Compute speed dynamically
  let speedResult: {
    mPerMin: number;
    kmH: number;
    category: string;
    duration: string;
  } | null = null;
  let calcError: string | null = null;

  try {
    if (!isNaN(effectiveDistanceMeters) && effectiveDistanceMeters > 0) {
      const today = new Date().toISOString().split('T')[0];
      const relTime = new Date(`${today}T${releaseHour}Z`);
      const arrTime = new Date(`${today}T${arrivalHour}Z`);

      if (!isNaN(relTime.getTime()) && !isNaN(arrTime.getTime()) && arrTime >= relTime) {
        const res = calculateFlightSpeed({
          distanceMeters: effectiveDistanceMeters,
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
          category: getRaceCategory(effectiveDistanceMeters),
          duration: `${h}h ${m}min ${s}s`,
        };
      }
    }
  } catch (err: any) {
    calcError = err.message || 'Błąd obliczeń';
  }

  // Format speed and distance in active unit system
  const formattedSpeed = speedResult
    ? formatVelocity(speedResult.mPerMin, unitSystem)
    : null;
  const formattedDistance = formatDistance(effectiveDistanceMeters || 0, unitSystem);

  const getVelocityRating = (v: number) => {
    if (v >= 1500) return { label: '🚀 Ekspresowy lot (wiatr w ogon)', color: '#4CAF50' };
    if (v >= 1300) return { label: '⚡ Bardzo szybki lot (sprzyjające warunki)', color: '#81C784' };
    if (v >= 1000) return { label: '🕊️ Standardowy równy lot konkursowy', color: '#64B5F6' };
    return { label: '🌧️ Ciężki lot (pod wiatr lub opady)', color: '#FFB74D' };
  };

  const rating = speedResult ? getVelocityRating(speedResult.mPerMin) : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Unit Selector Row */}
        <View style={styles.unitSelectorRow}>
          <TouchableOpacity
            style={[styles.unitBtn, unitSystem === 'metric' && styles.unitBtnActive]}
            onPress={() => setUnitSystem('metric')}
          >
            <Text style={[styles.unitText, unitSystem === 'metric' && styles.unitTextActive]}>
              METRYCZNY (m/min, km)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitBtn, unitSystem === 'imperial' && styles.unitBtnActive]}
            onPress={() => setUnitSystem('imperial')}
          >
            <Text style={[styles.unitText, unitSystem === 'imperial' && styles.unitTextActive]}>
              IMPERIALNY (ypm, mi)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Speed Result Highlight Box */}
        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>ŚREDNIA PRĘDKOŚĆ LOTU</Text>
          <Text style={styles.resultValue}>
            {formattedSpeed ? formattedSpeed.value.toFixed(1) : '---.-'}
          </Text>
          <Text style={styles.resultUnit}>
            {formattedSpeed ? formattedSpeed.unit : unitSystem === 'metric' ? 'm/min' : 'ypm'}
          </Text>

          {rating && (
            <View style={[styles.ratingBadge, { borderColor: rating.color }]}>
              <Text style={[styles.ratingText, { color: rating.color }]}>{rating.label}</Text>
            </View>
          )}

          {speedResult && (
            <View style={styles.subResultsRow}>
              <View style={styles.subItem}>
                <Text style={styles.subLabel}>Dystans</Text>
                <Text style={styles.subValue}>{formattedDistance.formatted}</Text>
              </View>
              <View style={styles.subItem}>
                <Text style={styles.subLabel}>Czas netto</Text>
                <Text style={styles.subValue}>{speedResult.duration}</Text>
              </View>
              <View style={styles.subItem}>
                <Text style={styles.subLabel}>Kategoria FCI</Text>
                <Text style={styles.subValue}>{speedResult.category.toUpperCase()}</Text>
              </View>
            </View>
          )}

          {calcError && <Text style={styles.errorText}>{calcError}</Text>}
        </View>

        {/* Mode Selector (Manual vs GPS) */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, calcMode === 'manual' && styles.modeTabActive]}
            onPress={() => setCalcMode('manual')}
          >
            <Text style={[styles.modeTabText, calcMode === 'manual' && styles.modeTabTextActive]}>
              📏 Dystans ręczny
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, calcMode === 'gps' && styles.modeTabActive]}
            onPress={() => setCalcMode('gps')}
          >
            <Text style={[styles.modeTabText, calcMode === 'gps' && styles.modeTabTextActive]}>
              🌐 Współrzędne GPS (Vincenty)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Inputs Form */}
        <View style={styles.formSection}>
          {calcMode === 'manual' ? (
            <>
              <Text style={styles.inputLabel}>Dystans z gołębnika (km):</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="decimal-pad"
                value={distanceKm}
                onChangeText={setDistanceKm}
                placeholder="np. 345.2"
                placeholderTextColor="#8E94A0"
              />
            </>
          ) : (
            <>
              <Text style={styles.inputLabel}>Wybierz punkt wypuszczenia (GPS):</Text>
              <View style={styles.presetsRow}>
                {GPS_PRESETS.map((p) => {
                  const isSelected = selectedPreset.name === p.name;
                  return (
                    <TouchableOpacity
                      key={p.name}
                      onPress={() => setSelectedPreset(p)}
                      style={[styles.presetChip, isSelected && styles.presetChipActive]}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          isSelected && styles.presetChipTextActive,
                        ]}
                      >
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.gpsCoordBox}>
                <Text style={styles.gpsCoordText}>
                  Punkt startu: {selectedPreset.lat}°N, {selectedPreset.lon}°E{'\n'}
                  Twój gołębnik: {loftLat}°N, {loftLon}°E{'\n'}
                  <Text style={{ color: '#E5A93C', fontWeight: '800' }}>
                    Wyliczona odległość geodezyjna: {(effectiveDistanceMeters / 1000).toFixed(2)} km
                  </Text>
                </Text>
              </View>
            </>
          )}

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
            title={
              applyNightNeutral
                ? '🌙 Neutralizacja nocna: WŁĄCZONA (22:00-05:00)'
                : '☀️ Neutralizacja nocna: WYŁĄCZONA'
            }
            variant={applyNightNeutral ? 'primary' : 'secondary'}
            onPress={() => setApplyNightNeutral(!applyNightNeutral)}
            style={styles.neutralBtn}
            textStyle={{ fontSize: 13 }}
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
  unitSelectorRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  unitBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1E2127',
    borderWidth: 1,
    borderColor: '#2F343F',
    alignItems: 'center',
  },
  unitBtnActive: {
    borderColor: '#E5A93C',
    backgroundColor: '#2A2417',
  },
  unitText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E94A0',
  },
  unitTextActive: {
    color: '#E5A93C',
  },
  resultBox: {
    backgroundColor: '#1E2127',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5A93C',
    marginBottom: 14,
  },
  resultLabel: {
    fontSize: 12,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#A0A6B2',
    marginTop: 2,
  },
  ratingBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 10,
    backgroundColor: '#15171B',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
  },
  subResultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#2F343F',
    marginTop: 14,
    paddingTop: 12,
  },
  subItem: {
    alignItems: 'center',
  },
  subLabel: {
    fontSize: 11,
    color: '#8E94A0',
    marginBottom: 2,
  },
  subValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  errorText: {
    color: '#E53935',
    marginTop: 8,
    fontWeight: '600',
    fontSize: 12,
  },
  modeTabs: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 8,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1E2127',
    borderWidth: 1,
    borderColor: '#2F343F',
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: '#262930',
    borderColor: '#E5A93C',
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E94A0',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  formSection: {
    backgroundColor: '#1E2127',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  inputLabel: {
    fontSize: 13,
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
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  presetChip: {
    backgroundColor: '#15171B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  presetChipActive: {
    backgroundColor: '#E5A93C',
    borderColor: '#E5A93C',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A0A6B2',
  },
  presetChipTextActive: {
    color: '#121417',
    fontWeight: '800',
  },
  gpsCoordBox: {
    backgroundColor: '#15171B',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#262930',
  },
  gpsCoordText: {
    fontSize: 12,
    color: '#A0A6B2',
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  timeInputsRow: {
    flexDirection: 'row',
  },
  neutralBtn: {
    minHeight: 46,
    marginTop: 2,
  },
});

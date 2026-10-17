/**
 * PIGEON-FLY — Kalkulator Prędkości Lotu (m/min), Wektora Wiatru i Coeff FCI
 * Instant velocity calculator with Vincenty geodesic distance & night neutralization.
 * Aerodynamic flight forecast (weather wind impact, crosswind, ETA) & Concourse Coeff predictor.
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
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  calculateFlightSpeed,
  calculateGeodesicDistanceMeters,
  getRaceCategory,
} from '../../src/domain/racing';
import { formatVelocity, formatDistance, UnitSystem } from '../../src/domain/units';
import { calculateWindImpact } from '../../src/domain/weather';
import { evaluatePigeonPrize } from '../../src/domain/concourse';
import { calculateFlightEnergetics } from '../../src/domain/flightEnergetics';
import { FieldButton } from '../../src/components/FieldButton';
import { LoftFinanceModal } from '../../src/components/LoftFinanceModal';

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

const WIND_PRESETS = [
  { label: 'W (270°)', deg: 270 },
  { label: 'NW (315°)', deg: 315 },
  { label: 'N (0°)', deg: 0 },
  { label: 'NE (45°)', deg: 45 },
  { label: 'E (90°)', deg: 90 },
  { label: 'SE (135°)', deg: 135 },
  { label: 'S (180°)', deg: 180 },
  { label: 'SW (225°)', deg: 225 },
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

  // Aerodynamics & Wind state
  const [windDirDeg, setWindDirDeg] = useState(270);
  const [windSpeedKmh, setWindSpeedKmh] = useState('22');

  // Concourse & Coeff Predictor state
  const [basketedCount, setBasketedCount] = useState('2850');
  const [concoursePosition, setConcoursePosition] = useState('14');
  const [concourseBasePercent, setConcourseBasePercent] = useState<20 | 25 | 33>(20);

  // Flight Energetics state (RD-15, RD-16, Z-047, Z-284)
  const [airTempCelsius, setAirTempCelsius] = useState('20');
  const [preFlightFatGrams, setPreFlightFatGrams] = useState('35');

  // Loft Finance Assistant state (Z-056)
  const [isFinanceModalVisible, setIsFinanceModalVisible] = useState(false);

  // Compute distance in meters based on mode
  let effectiveDistanceMeters = parseFloat(distanceKm) * 1000;
  if (calcMode === 'gps') {
    effectiveDistanceMeters = calculateGeodesicDistanceMeters(
      { latitude: selectedPreset.lat, longitude: selectedPreset.lon },
      { latitude: parseFloat(loftLat) || 51.88, longitude: parseFloat(loftLon) || 17.02 }
    );
  }

  // Compute actual speed dynamically
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

  // Aerodynamic simulation
  const releaseCoords =
    calcMode === 'gps'
      ? { latitude: selectedPreset.lat, longitude: selectedPreset.lon }
      : { latitude: 52.13, longitude: 11.62 };
  const loftCoords = {
    latitude: parseFloat(loftLat) || 51.88,
    longitude: parseFloat(loftLon) || 17.02,
  };

  const windImpact = calculateWindImpact({
    releasePoint: releaseCoords,
    loftPoint: loftCoords,
    distanceMeters: effectiveDistanceMeters > 0 ? effectiveDistanceMeters : 345000,
    windFromDeg: windDirDeg,
    windSpeedKmh: parseFloat(windSpeedKmh) || 0,
  });

  let estimatedEtaStr = '--:--:--';
  try {
    const today = new Date().toISOString().split('T')[0];
    const relTime = new Date(`${today}T${releaseHour}Z`);
    if (!isNaN(relTime.getTime()) && windImpact.estimatedDurationMinutes > 0) {
      const etaMs = relTime.getTime() + windImpact.estimatedDurationMinutes * 60 * 1000;
      const etaDate = new Date(etaMs);
      estimatedEtaStr = etaDate.toISOString().substring(11, 19);
    }
  } catch {}

  // Concourse & Coeff calculations
  const parsedBasketed = parseInt(basketedCount, 10) || 1;
  const parsedPosition = parseInt(concoursePosition, 10) || 1;
  const concoursePrize = evaluatePigeonPrize({
    position: parsedPosition,
    totalBasketed: parsedBasketed,
    distanceKm: (effectiveDistanceMeters || 345000) / 1000,
    basePercent: concourseBasePercent,
  });

  // Flight Energetics calculation (RD-15, RD-16, Z-047, Z-284)
  const effDistKm = (effectiveDistanceMeters && effectiveDistanceMeters > 0 ? effectiveDistanceMeters : 345000) / 1000;
  const currentSpeed = speedResult ? speedResult.mPerMin : (windImpact.estimatedVelocityMPerMin > 0 ? windImpact.estimatedVelocityMPerMin : 1250);
  const currentHeadwind = -windImpact.effectiveTailwindKmh;

  let energeticsResult = null;
  try {
    energeticsResult = calculateFlightEnergetics({
      distanceKm: effDistKm,
      groundSpeedMPerMin: currentSpeed,
      airTemperatureCelsius: parseFloat(airTempCelsius) || 20,
      headwindKmh: currentHeadwind,
      birdWeightGrams: 420,
      preFlightFatReserveGrams: parseFloat(preFlightFatGrams) || 35,
    });
  } catch {}

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

  const handleApplyEta = () => {
    if (estimatedEtaStr !== '--:--:--') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      setArrivalHour(estimatedEtaStr);
      Alert.alert(
        'Zastosowano ETA',
        `Wstawiono prognozowaną godzinę przylotu: ${estimatedEtaStr} do kalkulatora prędkości.`
      );
    }
  };

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

        {/* SECTION 1: Aerodynamics & Wind Impact (BR-LOT-004) */}
        <View style={styles.toolCard}>
          <View style={styles.toolHeaderRow}>
            <Text style={styles.toolHeader}>🌪️ PROGNOZA WIATRU I AERODYNAMIKI (BR-LOT-004)</Text>
            <View style={styles.toolBadge}>
              <Text style={styles.toolBadgeText}>WEKTOR 3D</Text>
            </View>
          </View>
          <Text style={styles.toolDesc}>
            Dekompozycja wektora wiatru na azymut lotu ({windImpact.flightBearingDeg}°), składową w ogon/dziób i znos boczny.
          </Text>

          <Text style={styles.inputLabel}>Kierunek wiatru (skąd wieje):</Text>
          <View style={styles.presetsRow}>
            {WIND_PRESETS.map((w) => {
              const isSelected = windDirDeg === w.deg;
              return (
                <TouchableOpacity
                  key={w.label}
                  style={[styles.presetChip, isSelected && styles.presetChipActive]}
                  onPress={() => setWindDirDeg(w.deg)}
                >
                  <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                    {w.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Prędkość wiatru (km/h):</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={windSpeedKmh}
                onChangeText={setWindSpeedKmh}
                placeholder="np. 20"
                placeholderTextColor="#8E94A0"
              />
            </View>
            <View style={styles.windSpeedQuickRow}>
              {[10, 20, 35, 50].map((spd) => (
                <TouchableOpacity
                  key={spd}
                  style={styles.quickSpdBtn}
                  onPress={() => setWindSpeedKmh(String(spd))}
                >
                  <Text style={styles.quickSpdText}>{spd}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Aerodynamic Results Box */}
          <View style={styles.aeroBox}>
            <View style={styles.aeroRow}>
              <View style={styles.aeroItem}>
                <Text style={styles.aeroLabel}>Wpływ wiatru</Text>
                <Text
                  style={[
                    styles.aeroValue,
                    {
                      color:
                        windImpact.effectiveTailwindKmh >= 0 ? '#4CAF50' : '#EF4444',
                    },
                  ]}
                >
                  {windImpact.effectiveTailwindKmh >= 0
                    ? `+${windImpact.effectiveTailwindKmh} km/h (W ogon)`
                    : `${windImpact.effectiveTailwindKmh} km/h (W dziób)`}
                </Text>
              </View>
              <View style={styles.aeroItem}>
                <Text style={styles.aeroLabel}>Znos boczny</Text>
                <Text style={styles.aeroValue}>{windImpact.crosswindKmh} km/h</Text>
              </View>
            </View>

            <View style={[styles.aeroRow, { marginTop: 10, borderTopWidth: 1, borderTopColor: '#2F343F', paddingTop: 8 }]}>
              <View style={styles.aeroItem}>
                <Text style={styles.aeroLabel}>Prognozowana prędkość</Text>
                <Text style={[styles.aeroValue, { color: '#E5A93C', fontSize: 16 }]}>
                  ~{windImpact.estimatedVelocityMPerMin} m/min
                </Text>
              </View>
              <View style={styles.aeroItem}>
                <Text style={styles.aeroLabel}>Szacowana godzina (ETA)</Text>
                <Text style={[styles.aeroValue, { color: '#60A5FA', fontSize: 16 }]}>
                  {estimatedEtaStr}
                </Text>
              </View>
            </View>

            <View style={styles.adviceBox}>
              <Text style={styles.adviceTitle}>💡 Wskazówka Mistrza:</Text>
              <Text style={styles.adviceText}>{windImpact.fancierAdvice}</Text>
            </View>

            <FieldButton
              title={`⏱️ Wstaw prognozowaną godzinę przylotu (${estimatedEtaStr})`}
              variant="secondary"
              onPress={handleApplyEta}
              style={{ marginTop: 10 }}
            />
          </View>
        </View>

        {/* SECTION 2: Concourse & Coeff FCI Predictor (Z-044) */}
        <View style={styles.toolCard}>
          <View style={styles.toolHeaderRow}>
            <Text style={styles.toolHeader}>🏆 BAZA KONKURSOWA I COEFF FCI (Z-044)</Text>
            <View style={styles.toolBadge}>
              <Text style={styles.toolBadgeText}>FCI / PZHGP</Text>
            </View>
          </View>
          <Text style={styles.toolDesc}>
            Błyskawiczne szacowanie wejścia do bazy konkursowej, punktów GMP oraz współczynnika Coeff do reprezentacji olimpijskiej.
          </Text>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Gołębi w koszu:</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={basketedCount}
                onChangeText={setBasketedCount}
                placeholder="2850"
                placeholderTextColor="#8E94A0"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Twoja lokata:</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={concoursePosition}
                onChangeText={setConcoursePosition}
                placeholder="14"
                placeholderTextColor="#8E94A0"
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Baza konkursowa:</Text>
          <View style={styles.baseRow}>
            {([20, 25, 33] as const).map((b) => (
              <TouchableOpacity
                key={b}
                style={[styles.baseBtn, concourseBasePercent === b && styles.baseBtnActive]}
                onPress={() => setConcourseBasePercent(b)}
              >
                <Text style={[styles.baseText, concourseBasePercent === b && styles.baseTextActive]}>
                  {b}% {b === 20 ? '(Standard PZHGP)' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Concourse Result Box */}
          <View style={styles.concourseResultBox}>
            <View style={styles.concourseHeader}>
              <Text
                style={[
                  styles.concourseStatus,
                  { color: concoursePrize.isPrize ? '#4CAF50' : '#EF4444' },
                ]}
              >
                {concoursePrize.isPrize ? '✓ W BAZIE KONKURSOWEJ' : '✗ POZA KONKURSEM'}
              </Text>
              <Text style={styles.concourseLimitText}>
                Limit: {concoursePrize.prizeLimit} z {parsedBasketed} ptaków
              </Text>
            </View>

            <View style={styles.coeffRow}>
              <View style={styles.coeffItem}>
                <Text style={styles.coeffLabel}>Coeff FCI</Text>
                <Text style={styles.coeffValue}>{concoursePrize.fciCoefficient.toFixed(3)}</Text>
              </View>
              <View style={styles.coeffItem}>
                <Text style={styles.coeffLabel}>Punkty GMP</Text>
                <Text style={styles.coeffValue}>{concoursePrize.gmpPoints.toFixed(2)} pkt</Text>
              </View>
              <View style={styles.coeffItem}>
                <Text style={styles.coeffLabel}>Kkm do bazy</Text>
                <Text style={styles.coeffValue}>
                  {concoursePrize.concourseKilometers.toFixed(1)} kkm
                </Text>
              </View>
            </View>

            {concoursePrize.isPrize && concoursePrize.fciCoefficient < 5.0 && (
              <View style={styles.olympicBadge}>
                <Text style={styles.olympicBadgeText}>
                  ★ Super Szpic: Coeff poniżej 5.000 — Potencjał Olimpijski Kat. {speedResult?.category || 'A'}!
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* SECTION 3: Bioenergetyka Lotu i Protokół Regeneracji (RD-15, RD-16, Z-047, Z-284) */}
        {energeticsResult && (
          <View style={styles.toolCard}>
            <View style={styles.toolHeaderRow}>
              <Text style={styles.toolHeader}>⚡ BIOENERGETYKA LOTU I REGENERACJA (RD-15/16)</Text>
              <View style={styles.toolBadge}>
                <Text style={styles.toolBadgeText}>FIZJOLOGIA FCI</Text>
              </View>
            </View>
            <Text style={styles.toolDesc}>
              Szacowanie spalania kwasów tłuszczowych, rozpadu glikogenu, ryzyka katabolizmu białek piersiowych i odwodnienia w locie konkursowym.
            </Text>

            {/* Quick environmental & physical adjustments */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Temperatura (°C):</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={airTempCelsius}
                  onChangeText={setAirTempCelsius}
                  placeholder="20"
                  placeholderTextColor="#8E94A0"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Zapas tłuszczu (g):</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={preFlightFatGrams}
                  onChangeText={setPreFlightFatGrams}
                  placeholder="35"
                  placeholderTextColor="#8E94A0"
                />
              </View>
            </View>

            {/* Catabolism Risk Status Badge */}
            <View
              style={[
                styles.energyRiskCard,
                {
                  borderColor:
                    energeticsResult.muscleCatabolismRisk === 'critical'
                      ? '#EF4444'
                      : energeticsResult.muscleCatabolismRisk === 'high'
                      ? '#F97316'
                      : energeticsResult.muscleCatabolismRisk === 'moderate'
                      ? '#F59E0B'
                      : '#10B981',
                },
              ]}
            >
              <View style={styles.energyRiskHeader}>
                <Text style={styles.energyRiskTitle}>STAN METABOLICZNY PO POWROCIE:</Text>
                <Text
                  style={[
                    styles.energyRiskBadge,
                    {
                      color:
                        energeticsResult.muscleCatabolismRisk === 'critical'
                          ? '#EF4444'
                          : energeticsResult.muscleCatabolismRisk === 'high'
                          ? '#F97316'
                          : energeticsResult.muscleCatabolismRisk === 'moderate'
                          ? '#F59E0B'
                          : '#10B981',
                    },
                  ]}
                >
                  {energeticsResult.muscleCatabolismRisk === 'critical' && '⚠️ KATABOLIZM KRYTYCZNY (ROZPAD MIĘŚNI)'}
                  {energeticsResult.muscleCatabolismRisk === 'high' && '🔥 WYSOKIE ZUŻYCIE REZERW'}
                  {energeticsResult.muscleCatabolismRisk === 'moderate' && '⚡ UMIARKOWANY WYSIŁEK'}
                  {energeticsResult.muscleCatabolismRisk === 'low' && '✓ NISKIE ZMĘCZENIE (KOMFORT)'}
                  {energeticsResult.muscleCatabolismRisk === 'none' && '✓ BIEG JAŁOWY (MINIMALNY WYSIŁEK)'}
                </Text>
              </View>
              {energeticsResult.fatDeficit && (
                <Text style={styles.fatDeficitAlert}>
                  Wyczerpanie rezerw tłuszczowych! Ptak spala własne białko mięśni piersiowych ({energeticsResult.muscleProteinBurnedGrams} g), aby utrzymać siłę nośną.
                </Text>
              )}
            </View>

            {/* Energetic Breakdown Grid */}
            <View style={styles.bioGrid}>
              <View style={styles.bioItem}>
                <Text style={styles.bioLabel}>Całkowity wydatek</Text>
                <Text style={styles.bioValue}>{energeticsResult.totalEnergyExpenditureKj} kJ</Text>
                <Text style={styles.bioSubValue}>~{Math.round(energeticsResult.totalEnergyExpenditureKj / 4.184)} kcal</Text>
              </View>
              <View style={styles.bioItem}>
                <Text style={styles.bioLabel}>Spalony tłuszcz</Text>
                <Text style={[styles.bioValue, { color: '#FCD34D' }]}>{energeticsResult.fatBurnedGrams} g</Text>
                <Text style={styles.bioSubValue}>z {preFlightFatGrams} g zapasu</Text>
              </View>
              <View style={styles.bioItem}>
                <Text style={styles.bioLabel}>Glikogen (start)</Text>
                <Text style={styles.bioValue}>{energeticsResult.glycogenBurnedGrams} g</Text>
                <Text style={styles.bioSubValue}>pierwsze 15 min</Text>
              </View>
              <View style={styles.bioItem}>
                <Text style={styles.bioLabel}>Utrata wody</Text>
                <Text style={[styles.bioValue, { color: '#60A5FA' }]}>{energeticsResult.waterLossMilliliters} ml</Text>
                <Text style={styles.bioSubValue}>odparowanie i oddech</Text>
              </View>
              <View style={styles.bioItem}>
                <Text style={styles.bioLabel}>Białko mięśniowe</Text>
                <Text
                  style={[
                    styles.bioValue,
                    { color: energeticsResult.muscleProteinBurnedGrams > 0 ? '#EF4444' : '#10B981' },
                  ]}
                >
                  {energeticsResult.muscleProteinBurnedGrams} g
                </Text>
                <Text style={styles.bioSubValue}>
                  {energeticsResult.muscleProteinBurnedGrams > 0 ? 'katabolizm' : 'nienaruszone'}
                </Text>
              </View>
              <View style={styles.bioItem}>
                <Text style={styles.bioLabel}>Szacowana waga</Text>
                <Text style={styles.bioValue}>{energeticsResult.postFlightWeightGrams} g</Text>
                <Text style={styles.bioSubValue}>przed lotem: 420 g</Text>
              </View>
            </View>

            {/* Protocol Box (RD-16) */}
            <View style={styles.protocolBox}>
              <View style={styles.protocolHeaderRow}>
                <Text style={styles.protocolHeader}>🧬 2-FAZOWY PROTOKÓŁ REGENERACJI (RD-16)</Text>
                <View style={styles.daysBadge}>
                  <Text style={styles.daysBadgeText}>
                    Regeneracja: {energeticsResult.recoveryProtocol.recoveryTimeDays} {energeticsResult.recoveryProtocol.recoveryTimeDays === 1 ? 'dzień' : 'dni'}
                  </Text>
                </View>
              </View>

              <View style={styles.protocolStep}>
                <Text style={styles.stepTitle}>🥤 {energeticsResult.recoveryProtocol.drinkerPhase1.description}</Text>
                {energeticsResult.recoveryProtocol.drinkerPhase1.supplements.map((s, idx) => (
                  <Text key={idx} style={styles.bulletItem}>• {s}</Text>
                ))}
              </View>

              <View style={styles.protocolStep}>
                <Text style={styles.stepTitle}>💊 {energeticsResult.recoveryProtocol.drinkerPhase2.description}</Text>
                {energeticsResult.recoveryProtocol.drinkerPhase2.supplements.map((s, idx) => (
                  <Text key={idx} style={styles.bulletItem}>• {s}</Text>
                ))}
              </View>

              <View style={styles.protocolStep}>
                <Text style={styles.stepTitle}>🌾 Żywienie: {energeticsResult.recoveryProtocol.feedRecommendation.feedType}</Text>
                <Text style={styles.stepSubTitle}>Dodatki na karmę:</Text>
                {energeticsResult.recoveryProtocol.feedRecommendation.supplementsOnGrain.map((s, idx) => (
                  <Text key={idx} style={styles.bulletItem}>• {s}</Text>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Breeding Loft Finance & Season Budget Assistant (Z-056) */}
        <FieldButton
          title="💰 Asystent Budżetu i Finansów Sezonu Hodowlanego (Z-056)"
          variant="secondary"
          onPress={() => setIsFinanceModalVisible(true)}
          style={{ marginTop: 12, marginBottom: 12, minHeight: 52 }}
          testID="btn-open-loft-finance"
        />
      </ScrollView>

      {/* Breeding Loft Finance Modal (Z-056) */}
      <LoftFinanceModal
        visible={isFinanceModalVisible}
        onClose={() => setIsFinanceModalVisible(false)}
      />
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
    paddingBottom: 40,
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
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
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
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 10,
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
  toolCard: {
    backgroundColor: '#1E2127',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 16,
  },
  toolHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  toolHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.8,
  },
  toolBadge: {
    backgroundColor: '#2A2417',
    borderWidth: 1,
    borderColor: '#E5A93C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  toolBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E5A93C',
  },
  toolDesc: {
    fontSize: 12,
    color: '#A0A6B2',
    lineHeight: 16,
    marginBottom: 12,
  },
  windSpeedQuickRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    alignItems: 'center',
  },
  quickSpdBtn: {
    backgroundColor: '#15171B',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  quickSpdText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  aeroBox: {
    backgroundColor: '#15171B',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2B323F',
    marginTop: 4,
  },
  aeroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  aeroItem: {
    flex: 1,
  },
  aeroLabel: {
    fontSize: 11,
    color: '#8E94A0',
    marginBottom: 2,
  },
  aeroValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  adviceBox: {
    backgroundColor: '#1A212D',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#60A5FA',
  },
  adviceTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#60A5FA',
    marginBottom: 2,
  },
  adviceText: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  baseRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  baseBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#15171B',
    borderWidth: 1,
    borderColor: '#2F343F',
    alignItems: 'center',
  },
  baseBtnActive: {
    borderColor: '#E5A93C',
    backgroundColor: '#2A2417',
  },
  baseText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E94A0',
  },
  baseTextActive: {
    color: '#E5A93C',
    fontWeight: '800',
  },
  concourseResultBox: {
    backgroundColor: '#15171B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2B323F',
  },
  concourseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  concourseStatus: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  concourseLimitText: {
    fontSize: 12,
    color: '#8E94A0',
  },
  coeffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#2B323F',
    paddingTop: 10,
  },
  coeffItem: {
    alignItems: 'center',
  },
  coeffLabel: {
    fontSize: 11,
    color: '#8E94A0',
    marginBottom: 2,
  },
  coeffValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  olympicBadge: {
    backgroundColor: '#382B14',
    borderWidth: 1,
    borderColor: '#E5A93C',
    padding: 8,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  olympicBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FDE68A',
    textAlign: 'center',
  },
  energyRiskCard: {
    backgroundColor: '#15171B',
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 12,
  },
  energyRiskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  energyRiskTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E94A0',
    letterSpacing: 0.5,
  },
  energyRiskBadge: {
    fontSize: 12,
    fontWeight: '900',
  },
  fatDeficitAlert: {
    marginTop: 8,
    fontSize: 12,
    color: '#F87171',
    lineHeight: 16,
    fontWeight: '600',
  },
  bioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  bioItem: {
    width: '31%',
    backgroundColor: '#15171B',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2B323F',
    alignItems: 'center',
  },
  bioLabel: {
    fontSize: 10,
    color: '#8E94A0',
    textAlign: 'center',
    marginBottom: 2,
  },
  bioValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  bioSubValue: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
  },
  protocolBox: {
    backgroundColor: '#1A212D',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  protocolHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 6,
  },
  protocolHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#60A5FA',
  },
  daysBadge: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  daysBadgeText: {
    color: '#BFDBFE',
    fontSize: 11,
    fontWeight: '800',
  },
  protocolStep: {
    marginTop: 6,
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 2,
  },
  stepSubTitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: 2,
  },
  bulletItem: {
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 16,
    paddingLeft: 4,
  },
});

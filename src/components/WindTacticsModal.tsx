/**
 * PIGEON-FLY — Symulator Taktyki Wypuszczenia i Korytarzy Wiatrowych Modal (Z-070)
 * Analiza wektorowa wiatru, dekompozycja czołowy/ogon/boczny, okna startowe i zalecenia żywieniowe.
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
import {
  PRESET_RACE_ROUTES,
  RacePresetRoute,
  HourlyWindForecast,
  simulateTacticalReleaseWindows,
  ReleaseDecision,
} from '../domain/windTacticsSimulator';

interface WindTacticsModalProps {
  visible: boolean;
  onClose: () => void;
}

const DEFAULT_HOURLY_FORECASTS: HourlyWindForecast[] = [
  {
    timeLabel: '06:00',
    windSpeedKmh: 14,
    windFromDeg: 260, // Wiatr zachodni (w ogon)
    gustSpeedKmh: 20,
    temperatureC: 15,
    cloudCoverPct: 25,
  },
  {
    timeLabel: '07:00',
    windSpeedKmh: 18,
    windFromDeg: 275, // Wiatr WNW
    gustSpeedKmh: 24,
    temperatureC: 17,
    cloudCoverPct: 35,
  },
  {
    timeLabel: '08:00',
    windSpeedKmh: 22,
    windFromDeg: 300, // Wiatr NW (lekki znos boczny)
    gustSpeedKmh: 30,
    temperatureC: 20,
    cloudCoverPct: 50,
  },
  {
    timeLabel: '09:00',
    windSpeedKmh: 28,
    windFromDeg: 330, // Wiatr NNW (silniejszy boczny)
    gustSpeedKmh: 42,
    temperatureC: 23,
    cloudCoverPct: 65,
  },
];

export const WindTacticsModal: React.FC<WindTacticsModalProps> = ({ visible, onClose }) => {
  const [selectedRoute, setSelectedRoute] = useState<RacePresetRoute>(PRESET_RACE_ROUTES[0]);
  const [forecasts] = useState<HourlyWindForecast[]>(DEFAULT_HOURLY_FORECASTS);
  const [activeTab, setActiveTab] = useState<'windows' | 'vector' | 'tactics'>('windows');

  // Custom vector inputs for interactive simulation
  const [customWindDeg, setCustomWindDeg] = useState('270');
  const [customWindSpeed, setCustomWindSpeed] = useState('18');
  const [customGustSpeed, setCustomGustSpeed] = useState('25');

  const simulation = simulateTacticalReleaseWindows({
    route: selectedRoute,
    hourlyForecasts: forecasts,
    baseAirspeedKmh: 72,
  });

  const bestSlot = simulation.windows[simulation.bestWindowIndex];

  const getDecisionBadge = (decision: ReleaseDecision) => {
    switch (decision) {
      case 'RECOMMENDED':
        return { label: 'ZALECANE', color: '#4CAF50', bg: '#1E3824' };
      case 'ACCEPTABLE':
        return { label: 'DOPUSZCZALNE', color: '#6BA4F8', bg: '#1A293E' };
      case 'RISKY':
        return { label: 'RYZYKOWNE', color: '#E5A93C', bg: '#382B1E' };
      case 'UNACCEPTABLE':
        return { label: 'ZAKAZ', color: '#E05656', bg: '#381E1E' };
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>🌬️ Symulator Wiatru i Korytarzy Przylotu (Z-070)</Text>
              <Text style={styles.subTitle}>
                Dekompozycja wektorowa wiatru, okna startowe i predykcja prędkości szpicy
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="btn-close-wind-modal">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Route selector bar */}
          <View style={styles.routeSelectorBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {PRESET_RACE_ROUTES.map((r) => {
                const isSelected = r.id === selectedRoute.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.routeChip, isSelected && styles.routeChipActive]}
                    onPress={() => setSelectedRoute(r)}
                  >
                    <Text style={[styles.routeChipText, isSelected && styles.routeChipTextActive]}>
                      {r.name.split(':')[1]?.trim() || r.name} ({r.approxDistanceKm} km)
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Quick Metrics Banner */}
          <View style={styles.metricsBanner}>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>AZYMUT LOTU</Text>
              <Text style={styles.metricVal}>{simulation.flightBearingDeg}°</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>DYSTANS</Text>
              <Text style={styles.metricVal}>{simulation.distanceKm} km</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>SZPICA (M/MIN)</Text>
              <Text style={[styles.metricVal, { color: '#E5A93C' }]}>
                {bestSlot?.firstBirdVelocityMPerMin || 0}
              </Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>BAZA 20% (M/MIN)</Text>
              <Text style={[styles.metricVal, { color: '#6BA4F8' }]}>
                {bestSlot?.concourseCloseVelocityMPerMin || 0}
              </Text>
            </View>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'windows' && styles.tabButtonActive]}
              onPress={() => setActiveTab('windows')}
              testID="tab-wind-windows"
            >
              <Text style={[styles.tabButtonText, activeTab === 'windows' && styles.tabButtonTextActive]}>
                ⏱️ Okna Wypuszczenia
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'vector' && styles.tabButtonActive]}
              onPress={() => setActiveTab('vector')}
              testID="tab-wind-vector"
            >
              <Text style={[styles.tabButtonText, activeTab === 'vector' && styles.tabButtonTextActive]}>
                🧭 Aerodynamika & Znos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'tactics' && styles.tabButtonActive]}
              onPress={() => setActiveTab('tactics')}
              testID="tab-wind-tactics"
            >
              <Text style={[styles.tabButtonText, activeTab === 'tactics' && styles.tabButtonTextActive]}>
                🌽 Żywienie & Taktyka
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content Body */}
          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }}>
            {activeTab === 'windows' && (
              <View>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Symulacja Godzin Wypuszczenia</Text>
                  <Text style={styles.sectionSubtitle}>
                    Wpływ narastania temperatury i rotacji wiatru na szybkość i bezpieczeństwo stada
                  </Text>
                </View>

                {simulation.windows.map((slot, idx) => {
                  const badge = getDecisionBadge(slot.decision);
                  const isBest = idx === simulation.bestWindowIndex;
                  return (
                    <View
                      key={slot.releaseTime}
                      style={[
                        styles.slotCard,
                        isBest && { borderColor: '#4CAF50', borderWidth: 1.5 },
                      ]}
                    >
                      <View style={styles.slotHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.slotTime}>{slot.releaseTime}</Text>
                          {isBest && (
                            <View style={styles.bestPill}>
                              <Text style={styles.bestPillText}>⭐ OPTIMUM</Text>
                            </View>
                          )}
                        </View>
                        <View style={[styles.decisionBadge, { backgroundColor: badge.bg, borderColor: badge.color }]}>
                          <Text style={[styles.decisionBadgeText, { color: badge.color }]}>{badge.label}</Text>
                        </View>
                      </View>

                      {/* Main metrics grid */}
                      <View style={styles.slotGrid}>
                        <View style={styles.slotCol}>
                          <Text style={styles.slotColLabel}>PRĘDKOŚĆ SZPICY</Text>
                          <Text style={styles.slotColVal}>{slot.firstBirdVelocityMPerMin} m/min</Text>
                        </View>
                        <View style={styles.slotCol}>
                          <Text style={styles.slotColLabel}>ZAMKNIĘCIE BAZY 20%</Text>
                          <Text style={styles.slotColVal}>{slot.concourseCloseVelocityMPerMin} m/min</Text>
                        </View>
                        <View style={styles.slotCol}>
                          <Text style={styles.slotColLabel}>CZAS LOTU</Text>
                          <Text style={styles.slotColVal}>{slot.flightDurationHoursFormatted}</Text>
                        </View>
                        <View style={styles.slotCol}>
                          <Text style={styles.slotColLabel}>BEZPIECZEŃSTWO</Text>
                          <Text
                            style={[
                              styles.slotColVal,
                              { color: slot.safetyScore >= 80 ? '#4CAF50' : slot.safetyScore >= 60 ? '#6BA4F8' : '#E05656' },
                            ]}
                          >
                            {slot.safetyScore}/100
                          </Text>
                        </View>
                      </View>

                      {/* Wind components */}
                      <View style={styles.windCompRow}>
                        <Text style={styles.windCompText}>
                          Wiatr: <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{slot.windSpeedKmh} km/h</Text> (porywy {slot.gustSpeedKmh} km/h) • Składowa wzdłużna:{' '}
                          <Text
                            style={{
                              color: slot.effectiveTailwindKmh >= 0 ? '#4CAF50' : '#E05656',
                              fontWeight: 'bold',
                            }}
                          >
                            {slot.effectiveTailwindKmh >= 0 ? `+${slot.effectiveTailwindKmh}` : slot.effectiveTailwindKmh} km/h
                          </Text>{' '}
                          • Znos boczny: <Text style={{ color: '#E5A93C', fontWeight: 'bold' }}>{slot.crosswindKmh} km/h ({slot.driftAngleDeg}°)</Text>
                        </Text>
                      </View>

                      <Text style={styles.reasonText}>💡 {slot.decisionReason}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {activeTab === 'vector' && (
              <View>
                <Text style={styles.sectionTitle}>Interaktywny Trójkąt Nawigacyjny Wiatru</Text>
                <Text style={styles.sectionSubtitle}>
                  Wprowadź aktualny odczyt stacji pogodowej, aby obliczyć znos i prędkość
                </Text>

                <View style={styles.vectorInputCard}>
                  <View style={styles.rowTwoCols}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Kierunek wiatru (skąd wieje, 0-360°)</Text>
                      <TextInput
                        style={styles.input}
                        value={customWindDeg}
                        onChangeText={setCustomWindDeg}
                        keyboardType="numeric"
                        placeholder="270"
                      />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Prędkość wiatru (km/h)</Text>
                      <TextInput
                        style={styles.input}
                        value={customWindSpeed}
                        onChangeText={setCustomWindSpeed}
                        keyboardType="numeric"
                        placeholder="18"
                      />
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Porywy wiatru (Gusts km/h)</Text>
                    <TextInput
                      style={styles.input}
                      value={customGustSpeed}
                      onChangeText={setCustomGustSpeed}
                      keyboardType="numeric"
                      placeholder="25"
                    />
                  </View>
                </View>

                {/* Vector Visual Explanation */}
                <View style={styles.vectorExplanationCard}>
                  <Text style={styles.vectorCardTitle}>Rozbicie Wektorowe Sił Aerodynamicznych:</Text>
                  <View style={styles.vectorBulletRow}>
                    <Text style={styles.vectorIcon}>📐</Text>
                    <Text style={styles.vectorBulletText}>
                      <Text style={{ fontWeight: 'bold', color: '#FFFFFF' }}>Kurs bazowy gołębia: </Text>
                      {simulation.flightBearingDeg}° (od startu prosto do gołębnika)
                    </Text>
                  </View>
                  <View style={styles.vectorBulletRow}>
                    <Text style={styles.vectorIcon}>💨</Text>
                    <Text style={styles.vectorBulletText}>
                      <Text style={{ fontWeight: 'bold', color: '#FFFFFF' }}>Kąt znoszenia (Crab Angle): </Text>
                      Gołąb musi lecieć z odchyleniem dzioba o {bestSlot?.driftAngleDeg || 0}° pod wiatr, aby utrzymać linię prostą do domu.
                    </Text>
                  </View>
                  <View style={styles.vectorBulletRow}>
                    <Text style={styles.vectorIcon}>⚡</Text>
                    <Text style={styles.vectorBulletText}>
                      <Text style={{ fontWeight: 'bold', color: '#FFFFFF' }}>Prędkość względem ziemi: </Text>
                      {bestSlot?.groundSpeedKmh || 72} km/h ({bestSlot?.firstBirdVelocityMPerMin || 1200} m/min)
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'tactics' && (
              <View>
                <Text style={styles.sectionTitle}>Strategia Hodowlana i Żywieniowa</Text>
                <Text style={styles.sectionSubtitle}>
                  Dostosowanie karmy, elektrolitów i typowania serii do profilu wiatru
                </Text>

                <View style={styles.tacticCard}>
                  <Text style={styles.tacticCardLabel}>🌾 PROFIL KARMIENIA PRZED KOSZOWANIEM</Text>
                  <Text style={styles.tacticCardText}>{simulation.advisory.feedingStrategy}</Text>
                </View>

                <View style={styles.tacticCard}>
                  <Text style={styles.tacticCardLabel}>💧 NAWADNIANIE I ELEKTROLITY</Text>
                  <Text style={styles.tacticCardText}>{simulation.advisory.hydrationElectrolytes}</Text>
                </View>

                <View style={styles.tacticCard}>
                  <Text style={styles.tacticCardLabel}>🎯 STRATEGIA TYPOWANIA SERII MISTRZOWSKIEJ</Text>
                  <Text style={styles.tacticCardText}>{simulation.advisory.basketTipStrategy}</Text>
                </View>

                {simulation.advisory.geographicHazards.length > 0 && (
                  <View style={[styles.tacticCard, { borderColor: '#E5A93C' }]}>
                    <Text style={[styles.tacticCardLabel, { color: '#E5A93C' }]}>
                      ⚠️ OSTRZEŻENIA TERENOWE I METEOROLOGICZNE
                    </Text>
                    {simulation.advisory.geographicHazards.map((h, idx) => (
                      <Text key={idx} style={[styles.tacticCardText, { marginTop: 4 }]}>
                        • {h}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '94%',
    backgroundColor: '#1E2127',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#6BA4F8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2C313A',
    backgroundColor: '#16181D',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6BA4F8',
  },
  subTitle: {
    fontSize: 11,
    color: '#8A92A0',
    marginTop: 2,
  },
  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2E37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  routeSelectorBar: {
    backgroundColor: '#191C22',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C313A',
  },
  routeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#14171C',
    borderWidth: 1,
    borderColor: '#2C313A',
    minHeight: 44,
    justifyContent: 'center',
  },
  routeChipActive: {
    backgroundColor: '#1F2A38',
    borderColor: '#6BA4F8',
  },
  routeChipText: {
    fontSize: 11,
    color: '#8A92A0',
    fontWeight: '600',
  },
  routeChipTextActive: {
    color: '#6BA4F8',
    fontWeight: 'bold',
  },
  metricsBanner: {
    flexDirection: 'row',
    backgroundColor: '#16191E',
    borderBottomWidth: 1,
    borderColor: '#2C313A',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerVertical: {
    width: 1,
    backgroundColor: '#2C313A',
  },
  metricLabel: {
    fontSize: 9,
    color: '#8A92A0',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#191C22',
    borderBottomWidth: 1,
    borderBottomColor: '#2C313A',
  },
  tabButton: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabButtonActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#6BA4F8',
    backgroundColor: '#21252D',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A92A0',
  },
  tabButtonTextActive: {
    color: '#6BA4F8',
  },
  body: {
    padding: 16,
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#8A92A0',
    marginTop: 2,
  },
  slotCard: {
    backgroundColor: '#16181D',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2C313A',
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  slotTime: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bestPill: {
    backgroundColor: '#1E3824',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  bestPillText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  decisionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  decisionBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  slotGrid: {
    flexDirection: 'row',
    backgroundColor: '#121417',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  slotCol: {
    flex: 1,
    alignItems: 'center',
  },
  slotColLabel: {
    fontSize: 8.5,
    color: '#8A92A0',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  slotColVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  windCompRow: {
    backgroundColor: '#14171C',
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
  },
  windCompText: {
    fontSize: 11,
    color: '#8A92A0',
    lineHeight: 16,
  },
  reasonText: {
    fontSize: 11,
    color: '#D0D6E0',
    fontStyle: 'italic',
  },
  vectorInputCard: {
    backgroundColor: '#16181D',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2C313A',
  },
  formGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#A0A8B4',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#14171C',
    borderWidth: 1,
    borderColor: '#2C313A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 13,
    minHeight: 48,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 10,
  },
  vectorExplanationCard: {
    backgroundColor: '#131B26',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A4365',
  },
  vectorCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6BA4F8',
    marginBottom: 10,
  },
  vectorBulletRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  vectorIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  vectorBulletText: {
    flex: 1,
    fontSize: 11,
    color: '#C0D4EC',
    lineHeight: 16,
  },
  tacticCard: {
    backgroundColor: '#16181D',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2C313A',
  },
  tacticCardLabel: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#6BA4F8',
    marginBottom: 4,
  },
  tacticCardText: {
    fontSize: 11.5,
    color: '#D0D6E0',
    lineHeight: 17,
  },
});

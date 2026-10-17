/**
 * PIGEON-FLY — Biometryczny Monitor Mikroklimatu i Wentylacji Gołębnika Modal (Z-066)
 * Obliczanie punktu rosy (Magnus-Tetens), ryzyka kondensacji wilgoci w ściółce i nastaw kominów grawitacyjnych.
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
  calculateLoftVentilation,
  ClimateConditions,
  LoftDimensions,
  SeasonMode,
} from '../domain/loftVentilation';

interface LoftVentilationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LoftVentilationModal: React.FC<LoftVentilationModalProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'climate' | 'volume' | 'damper'>('climate');

  const [dimensions, setDimensions] = useState<LoftDimensions>({
    lengthM: 6.0,
    widthM: 3.0,
    heightM: 2.2,
    birdsCount: 50,
  });

  const [climate, setClimate] = useState<ClimateConditions>({
    temperatureCelsius: 16,
    relativeHumidityPct: 65,
    seasonMode: 'RACING_SUMMER',
    hasHeatedFloor: false,
  });

  const result = calculateLoftVentilation(dimensions, climate);

  const getCondensationColor = (risk: string) => {
    switch (risk) {
      case 'SAFE_DRY':
        return '#4CAF50';
      case 'WARNING_HUMID':
        return '#E5A93C';
      case 'CRITICAL_CONDENSATION':
        return '#E53935';
      default:
        return '#FFFFFF';
    }
  };

  const seasonOptions: { mode: SeasonMode; label: string }[] = [
    { mode: 'WINTER_REST', label: 'Spoczynek Zimowy' },
    { mode: 'BREEDING_SPRING', label: 'Lęgi (Wiosna)' },
    { mode: 'RACING_SUMMER', label: 'Sezon Lotowy' },
    { mode: 'MOULT_AUTUMN', label: 'Pierzenie (Jesień)' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>💨 Mikroklimat i Wentylacja Gołębnika (Z-066)</Text>
              <Text style={styles.subTitle}>Punkt rosy, wilgotność ściółki i nastawy kominów grawitacyjnych</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="btn-close-ventilation-modal">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Metrics Bar */}
          <View style={[styles.metricsBanner, { borderColor: getCondensationColor(result.condensationRisk) }]}>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>PUNKT ROSY (Td)</Text>
              <Text style={styles.metricVal}>{result.dewPointCelsius}°C</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>MARGINES KONDENSACJI</Text>
              <Text style={[styles.metricVal, { color: getCondensationColor(result.condensationRisk) }]}>
                ΔT +{result.condensationMarginDeltaT}°C
              </Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>WYMIANA POWIETRZA</Text>
              <Text style={[styles.metricVal, { color: '#0288D1' }]}>
                {result.airChangesPerHourACH} ACH
              </Text>
            </View>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'climate' && styles.tabBtnActive]}
              onPress={() => setActiveTab('climate')}
            >
              <Text style={[styles.tabText, activeTab === 'climate' && styles.tabTextActive]}>
                🌡️ Wilgotność & Temp.
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'volume' && styles.tabBtnActive]}
              onPress={() => setActiveTab('volume')}
            >
              <Text style={[styles.tabText, activeTab === 'volume' && styles.tabTextActive]}>
                📐 Kubatura & Stado
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'damper' && styles.tabBtnActive]}
              onPress={() => setActiveTab('damper')}
            >
              <Text style={[styles.tabText, activeTab === 'damper' && styles.tabTextActive]}>
                🌪️ Kominy & Ryzyka
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {activeTab === 'climate' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>POMIARY TEMPERATURY I WILGOTNOŚCI</Text>
                </View>

                <View style={styles.inputCard}>
                  <Text style={styles.inputLabel}>Temperatura w gołębniku (°C):</Text>
                  <View style={styles.quickOptionsRow}>
                    {[-5, 4, 12, 18, 26].map((temp) => (
                      <TouchableOpacity
                        key={temp}
                        style={[styles.quickOptBtn, climate.temperatureCelsius === temp && styles.quickOptBtnActive]}
                        onPress={() => setClimate((p) => ({ ...p, temperatureCelsius: temp }))}
                      >
                        <Text style={[styles.quickOptText, climate.temperatureCelsius === temp && styles.quickOptTextActive]}>
                          {temp}°C
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Wilgotność względna powietrza (RH %):</Text>
                  <View style={styles.quickOptionsRow}>
                    {[45, 60, 75, 85, 95].map((rh) => (
                      <TouchableOpacity
                        key={rh}
                        style={[styles.quickOptBtn, climate.relativeHumidityPct === rh && styles.quickOptBtnActive]}
                        onPress={() => setClimate((p) => ({ ...p, relativeHumidityPct: rh }))}
                      >
                        <Text style={[styles.quickOptText, climate.relativeHumidityPct === rh && styles.quickOptTextActive]}>
                          {rh}%
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.toggleBtn, climate.hasHeatedFloor && styles.toggleBtnActive]}
                    onPress={() => setClimate((p) => ({ ...p, hasHeatedFloor: !p.hasHeatedFloor }))}
                  >
                    <Text style={styles.toggleIcon}>{climate.hasHeatedFloor ? '🔥' : '❄️'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleTitle}>
                        {climate.hasHeatedFloor ? 'Płytowe ogrzewanie podłogi: WŁĄCZONE' : 'Ogrzewanie podłogowe: WYŁĄCZONE'}
                      </Text>
                      <Text style={styles.toggleSub}>
                        {climate.hasHeatedFloor ? 'Podnosi temperaturę ściółki o +2.5°C ponad punkt rosy' : 'Ściółka w temperaturze otoczenia'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Status Box */}
                <View style={[styles.statusBox, { borderColor: getCondensationColor(result.condensationRisk) }]}>
                  <Text style={styles.statusBoxTitle}>DIAGNOZA MIKROKLIMATU I KONDENSACJI:</Text>
                  <Text style={[styles.statusBoxHeading, { color: getCondensationColor(result.condensationRisk) }]}>
                    {result.condensationRiskLabel}
                  </Text>
                  <Text style={styles.statusBoxDesc}>
                    Przy temperaturze {climate.temperatureCelsius}°C i wilgotności {climate.relativeHumidityPct}%, para wodna ulega skropleniu
                    przy schłodzeniu do {result.dewPointCelsius}°C. Margines bezpieczeństwa wynosi {result.condensationMarginDeltaT}°C.
                  </Text>
                </View>
              </View>
            )}

            {activeTab === 'volume' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>WYMIARY GOŁĘBNIKA I ZAGĘSZCZENIE STADA</Text>
                </View>

                <View style={styles.inputCard}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Długość (m):</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={String(dimensions.lengthM)}
                        onChangeText={(t) => setDimensions((p) => ({ ...p, lengthM: parseFloat(t) || 1 }))}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Szerokość (m):</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={String(dimensions.widthM)}
                        onChangeText={(t) => setDimensions((p) => ({ ...p, widthM: parseFloat(t) || 1 }))}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Wysokość (m):</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={String(dimensions.heightM)}
                        onChangeText={(t) => setDimensions((p) => ({ ...p, heightM: parseFloat(t) || 1 }))}
                      />
                    </View>
                  </View>

                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Liczba gołębi w przedziale (szt.):</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={String(dimensions.birdsCount)}
                    onChangeText={(t) => setDimensions((p) => ({ ...p, birdsCount: parseInt(t, 10) || 1 }))}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Faza sezonu biologicznego:</Text>
                  <View style={styles.seasonsGrid}>
                    {seasonOptions.map((s) => (
                      <TouchableOpacity
                        key={s.mode}
                        style={[styles.seasonBtn, climate.seasonMode === s.mode && styles.seasonBtnActive]}
                        onPress={() => setClimate((p) => ({ ...p, seasonMode: s.mode }))}
                      >
                        <Text style={[styles.seasonBtnText, climate.seasonMode === s.mode && styles.seasonBtnTextActive]}>
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Podsumowanie kubatury */}
                <View style={styles.volumeCard}>
                  <Text style={styles.volumeTitle}>BILANS KUBATURY I PRZEPŁYWU ŚWIEŻEGO POWIETRZA</Text>
                  <View style={styles.dividerH} />
                  <Text style={styles.volumeRow}>• Całkowita kubatura przedziału: <strong>{result.loftVolumeM3} m³</strong></Text>
                  <Text style={styles.volumeRow}>
                    • Kubatura na 1 ptaka: <strong>{result.volumePerBirdM3} m³/ptak</strong> {result.isOvercrowded ? '(⚠️ PRZEZAGĘSZCZENIE < 0.45)' : '(✓ W NORMIE)'}
                  </Text>
                  <Text style={styles.volumeRow}>• Wymagana norma świeżego powietrza: <strong>{result.targetAirflowPerBirdM3} m³/ptak/h</strong></Text>
                  <Text style={styles.volumeRow}>• Łączne zapotrzebowanie stada: <strong>{result.requiredAirflowM3PerHour} m³/h</strong></Text>
                  <Text style={styles.volumeRow}>• Krotność wymian na godzinę: <strong>{result.airChangesPerHourACH} ACH</strong></Text>
                </View>
              </View>
            )}

            {activeTab === 'damper' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>REKOMENDACJA NASTAWY KOMINÓW WENTYLACYJNYCH</Text>
                </View>

                <View style={styles.damperCard}>
                  <View style={styles.damperHeader}>
                    <Text style={styles.damperTitle}>ZALECANE OTWARCIE PRZEPUSTNICY:</Text>
                    <Text style={styles.damperPercent}>{result.damperPercentOpen}%</Text>
                  </View>
                  <View style={styles.damperProgressBg}>
                    <View style={[styles.damperProgressFill, { width: `${result.damperPercentOpen}%` }]} />
                  </View>
                  <Text style={styles.damperSubText}>{result.damperRecommendationLabel}</Text>
                </View>

                {/* Ryzyka Chorobowe */}
                <View style={[styles.sectionHeader, { marginTop: 12 }]}>
                  <Text style={styles.sectionTitle}>ZOOHIGIENA I ZAPOBIEGANIE EPIDEMIOM</Text>
                </View>

                <View style={styles.risksRow}>
                  <View style={[styles.riskCard, { borderColor: result.coccidiosisRiskLevel === 'HIGH' ? '#E53935' : result.coccidiosisRiskLevel === 'MEDIUM' ? '#E5A93C' : '#4CAF50' }]}>
                    <Text style={styles.riskCardIcon}>🪱</Text>
                    <Text style={styles.riskCardTitle}>KOKCYDIOZA</Text>
                    <Text style={[styles.riskCardVal, { color: result.coccidiosisRiskLevel === 'HIGH' ? '#E53935' : result.coccidiosisRiskLevel === 'MEDIUM' ? '#E5A93C' : '#4CAF50' }]}>
                      {result.coccidiosisRiskLevel === 'HIGH' ? 'WYSOKIE' : result.coccidiosisRiskLevel === 'MEDIUM' ? 'ŚREDNIE' : 'NISKIE'}
                    </Text>
                  </View>

                  <View style={[styles.riskCard, { borderColor: result.respiratorySyndromeRiskLevel === 'HIGH' ? '#E53935' : result.respiratorySyndromeRiskLevel === 'MEDIUM' ? '#E5A93C' : '#4CAF50' }]}>
                    <Text style={styles.riskCardIcon}>🫁</Text>
                    <Text style={styles.riskCardTitle}>KATAR / ORNITOZA</Text>
                    <Text style={[styles.riskCardVal, { color: result.respiratorySyndromeRiskLevel === 'HIGH' ? '#E53935' : result.respiratorySyndromeRiskLevel === 'MEDIUM' ? '#E5A93C' : '#4CAF50' }]}>
                      {result.respiratorySyndromeRiskLevel === 'HIGH' ? 'WYSOKIE' : result.respiratorySyndromeRiskLevel === 'MEDIUM' ? 'ŚREDNIE' : 'NISKIE'}
                    </Text>
                  </View>
                </View>

                {/* Zalecenia działania */}
                <View style={styles.actionsCard}>
                  <Text style={styles.actionsTitle}>ZALECENIA ZOOHIGIENICZNE DLA HODOWCY:</Text>
                  {result.actionRecommendations.map((act, i) => (
                    <Text key={i} style={styles.actionItem}>• {act}</Text>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Bar */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeModalBtn} onPress={onClose}>
              <Text style={styles.closeModalBtnText}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#121417',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '94%',
    minHeight: '80%',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  subTitle: {
    color: '#8E94A0',
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1E2127',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  metricsBanner: {
    flexDirection: 'row',
    backgroundColor: '#1E2127',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  dividerVertical: {
    width: 1,
    backgroundColor: '#2F343F',
  },
  metricLabel: {
    color: '#8E94A0',
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1E2127',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#0288D1',
  },
  tabText: {
    color: '#8E94A0',
    fontSize: 11,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#E5A93C',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 12,
  },
  inputLabel: {
    color: '#8E94A0',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#121417',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  quickOptionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickOptBtn: {
    flex: 1,
    backgroundColor: '#121417',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  quickOptBtnActive: {
    backgroundColor: '#0288D1',
    borderColor: '#0288D1',
  },
  quickOptText: {
    color: '#8E94A0',
    fontSize: 11,
    fontWeight: '600',
  },
  quickOptTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121417',
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#374151',
    gap: 10,
  },
  toggleBtnActive: {
    borderColor: '#E5A93C',
    backgroundColor: '#2A2318',
  },
  toggleIcon: {
    fontSize: 20,
  },
  toggleTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  toggleSub: {
    color: '#8E94A0',
    fontSize: 10,
    marginTop: 1,
  },
  statusBox: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    marginBottom: 14,
  },
  statusBoxTitle: {
    color: '#8E94A0',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusBoxHeading: {
    fontSize: 14,
    fontWeight: '800',
    marginVertical: 4,
  },
  statusBoxDesc: {
    color: '#D1D5DB',
    fontSize: 11,
    lineHeight: 16,
  },
  seasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  seasonBtn: {
    width: '48%',
    backgroundColor: '#121417',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  seasonBtnActive: {
    backgroundColor: '#E5A93C',
    borderColor: '#E5A93C',
  },
  seasonBtnText: {
    color: '#8E94A0',
    fontSize: 11,
    fontWeight: '600',
  },
  seasonBtnTextActive: {
    color: '#121417',
    fontWeight: '800',
  },
  volumeCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 14,
  },
  volumeTitle: {
    color: '#E5A93C',
    fontSize: 11,
    fontWeight: '800',
  },
  dividerH: {
    height: 1,
    backgroundColor: '#2F343F',
    marginVertical: 8,
  },
  volumeRow: {
    color: '#D1D5DB',
    fontSize: 11,
    marginBottom: 4,
  },
  damperCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 12,
  },
  damperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  damperTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  damperPercent: {
    color: '#0288D1',
    fontSize: 18,
    fontWeight: '900',
  },
  damperProgressBg: {
    height: 10,
    backgroundColor: '#121417',
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
  },
  damperProgressFill: {
    height: '100%',
    backgroundColor: '#0288D1',
  },
  damperSubText: {
    color: '#D1D5DB',
    fontSize: 11,
    marginTop: 8,
  },
  risksRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  riskCard: {
    flex: 1,
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  riskCardIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  riskCardTitle: {
    color: '#8E94A0',
    fontSize: 9,
    fontWeight: '800',
  },
  riskCardVal: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
  },
  actionsCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  actionsTitle: {
    color: '#E5A93C',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },
  actionItem: {
    color: '#D1D5DB',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2F343F',
  },
  closeModalBtn: {
    backgroundColor: '#1E2127',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  closeModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

/**
 * PIGEON-FLY — Carbo-Lipid Supercompensation Modal (Z-083 / DEC-97)
 * Field Mode ergonomic interface (>= 48-56pt touch targets), dark theme (#121417).
 * Pre-race lipid and carbohydrate loading for long-distance & marathon flights (400-1000+ km).
 */

import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  calculateCarboLipidPlan,
  generateCarboLipidPlanHtml,
  DayFeedingPhase,
} from '../domain/carboLipidSupercompensation';
import { PdfService } from '../services/pdfService';
import { FieldButton } from './FieldButton';

interface CarboLipidSupercompensationModalProps {
  visible: boolean;
  onClose: () => void;
  loftName?: string;
  defaultRaceName?: string;
}

export const CarboLipidSupercompensationModal: React.FC<CarboLipidSupercompensationModalProps> = ({
  visible,
  onClose,
  loftName = 'Gołębnik Mistrza Pigeon-Fly',
  defaultRaceName = 'Lot Maraton PZHGP',
}) => {
  // Input states
  const [raceDistanceKm, setRaceDistanceKm] = useState(740);
  const [predictedSpeedMPerMin, setPredictedSpeedMPerMin] = useState(1150);
  const [ambientTempC, setAmbientTempC] = useState(25);
  const [headwindKmh, setHeadwindKmh] = useState(15);
  const [flockSize, setFlockSize] = useState(25);

  // Tab: 'schedule' | 'tactics' | 'summary'
  const [activeTab, setActiveTab] = useState<'schedule' | 'tactics' | 'summary'>('schedule');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const plan = useMemo(() => {
    return calculateCarboLipidPlan({
      raceDistanceKm,
      predictedSpeedMPerMin,
      ambientTempC,
      headwindKmh,
      flockSize,
    });
  }, [raceDistanceKm, predictedSpeedMPerMin, ambientTempC, headwindKmh, flockSize]);

  // Presets
  const applyPreset = (type: 'sprint' | 'middle' | 'long' | 'extreme') => {
    if (type === 'sprint') {
      setRaceDistanceKm(350);
      setPredictedSpeedMPerMin(1300);
      setAmbientTempC(22);
      setHeadwindKmh(0);
    } else if (type === 'middle') {
      setRaceDistanceKm(540);
      setPredictedSpeedMPerMin(1200);
      setAmbientTempC(24);
      setHeadwindKmh(10);
    } else if (type === 'long') {
      setRaceDistanceKm(740);
      setPredictedSpeedMPerMin(1150);
      setAmbientTempC(26);
      setHeadwindKmh(15);
    } else {
      setRaceDistanceKm(980);
      setPredictedSpeedMPerMin(1050);
      setAmbientTempC(29);
      setHeadwindKmh(22);
    }
  };

  const handlePrint = async () => {
    try {
      const html = generateCarboLipidPlanHtml(plan, {
        loftName,
        raceName: defaultRaceName,
        seasonYear: new Date().getFullYear(),
      });
      await PdfService.printHtml(html);
    } catch {
      Alert.alert('Błąd wydruku', 'Nie udało się zainicjować wydruku protokołu.');
    }
  };

  const handleShare = async () => {
    try {
      const html = generateCarboLipidPlanHtml(plan, {
        loftName,
        raceName: defaultRaceName,
        seasonYear: new Date().getFullYear(),
      });
      await PdfService.shareHtmlAsPdf(html, `Superkompensacja_Maraton_${raceDistanceKm}km.pdf`);
    } catch {
      Alert.alert('Błąd eksportu', 'Nie udało się wyeksportować protokołu do PDF.');
    }
  };

  const flockTotalFatGrams = Math.round(plan.totalFatRequirementPerBirdGrams * flockSize);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>⚡ Superkompensacja Lipidowa</Text>
            <Text style={styles.headerSubtitle}>
              Ładowanie Energetyczne przed Maratonem (Z-083)
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Zamknij kalkulator"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Quick Presets */}
          <Text style={styles.sectionHeader}>SZYBKIE PROGNOZY TRASY</Text>
          <View style={styles.presetsRow}>
            <TouchableOpacity
              style={[styles.presetButton, raceDistanceKm === 350 && styles.presetButtonActive]}
              onPress={() => applyPreset('sprint')}
            >
              <Text style={styles.presetButtonText}>350 km</Text>
              <Text style={styles.presetSubText}>Średni</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.presetButton, raceDistanceKm === 540 && styles.presetButtonActive]}
              onPress={() => applyPreset('middle')}
            >
              <Text style={styles.presetButtonText}>540 km</Text>
              <Text style={styles.presetSubText}>Daleki</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.presetButton, raceDistanceKm === 740 && styles.presetButtonActive]}
              onPress={() => applyPreset('long')}
            >
              <Text style={styles.presetButtonText}>740 km</Text>
              <Text style={styles.presetSubText}>Maraton</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.presetButton, raceDistanceKm === 980 && styles.presetButtonActive]}
              onPress={() => applyPreset('extreme')}
            >
              <Text style={styles.presetButtonText}>980 km</Text>
              <Text style={styles.presetSubText}>Super</Text>
            </TouchableOpacity>
          </View>

          {/* Stepper Inputs */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>PARAMETRY LOTU I POGODY</Text>

            {/* Race Distance */}
            <View style={styles.stepperRow}>
              <View style={styles.stepperLabelCol}>
                <Text style={styles.stepperLabel}>Dystans Lotu</Text>
                <Text style={styles.stepperSub}>{raceDistanceKm} km</Text>
              </View>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setRaceDistanceKm((prev) => Math.max(100, prev - 50))}
                >
                  <Text style={styles.stepBtnText}>-50</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setRaceDistanceKm((prev) => Math.min(1300, prev + 50))}
                >
                  <Text style={styles.stepBtnText}>+50</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Predicted Speed */}
            <View style={styles.stepperRow}>
              <View style={styles.stepperLabelCol}>
                <Text style={styles.stepperLabel}>Przewidywana Prędkość</Text>
                <Text style={styles.stepperSub}>
                  {predictedSpeedMPerMin} m/min (~{Math.round((predictedSpeedMPerMin * 60) / 1000)} km/h)
                </Text>
              </View>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setPredictedSpeedMPerMin((prev) => Math.max(800, prev - 50))}
                >
                  <Text style={styles.stepBtnText}>-50</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setPredictedSpeedMPerMin((prev) => Math.min(1800, prev + 50))}
                >
                  <Text style={styles.stepBtnText}>+50</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Temperature */}
            <View style={styles.stepperRow}>
              <View style={styles.stepperLabelCol}>
                <Text style={styles.stepperLabel}>Temperatura Otoczenia</Text>
                <Text style={styles.stepperSub}>{ambientTempC}°C</Text>
              </View>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setAmbientTempC((prev) => Math.max(10, prev - 2))}
                >
                  <Text style={styles.stepBtnText}>-2°C</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setAmbientTempC((prev) => Math.min(38, prev + 2))}
                >
                  <Text style={styles.stepBtnText}>+2°C</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Headwind */}
            <View style={styles.stepperRow}>
              <View style={styles.stepperLabelCol}>
                <Text style={styles.stepperLabel}>Wiatr Czołowy / Boczny</Text>
                <Text style={styles.stepperSub}>{headwindKmh} km/h</Text>
              </View>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setHeadwindKmh((prev) => Math.max(0, prev - 5))}
                >
                  <Text style={styles.stepBtnText}>-5</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setHeadwindKmh((prev) => Math.min(50, prev + 5))}
                >
                  <Text style={styles.stepBtnText}>+5</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Flock Size */}
            <View style={[styles.stepperRow, { borderBottomWidth: 0 }]}>
              <View style={styles.stepperLabelCol}>
                <Text style={styles.stepperLabel}>Wielkość Stada Lotowego</Text>
                <Text style={styles.stepperSub}>{flockSize} sztuk</Text>
              </View>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setFlockSize((prev) => Math.max(5, prev - 5))}
                >
                  <Text style={styles.stepBtnText}>-5</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setFlockSize((prev) => Math.min(100, prev + 5))}
                >
                  <Text style={styles.stepBtnText}>+5</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* KPI Banner */}
          <View style={[styles.kpiCard, { borderColor: plan.intensityColor }]}>
            <View style={styles.kpiTopRow}>
              <View style={[styles.intensityPill, { backgroundColor: plan.intensityColor + '25' }]}>
                <Text style={[styles.intensityText, { color: plan.intensityColor }]}>
                  {plan.intensityLabel}
                </Text>
              </View>
              <Text style={styles.kpiHours}>{plan.estimatedFlightHours} h w locie</Text>
            </View>

            <View style={styles.kpiGrid}>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiVal}>{plan.fatCombustionRateGramsPerHour} g/h</Text>
                <Text style={styles.kpiDesc}>Spalanie Tłuszczu</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={[styles.kpiVal, { color: '#E0A82E' }]}>
                  {plan.totalFatRequirementPerBirdGrams} g
                </Text>
                <Text style={styles.kpiDesc}>Tłuszcz / Gołąb</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiVal}>{plan.totalEnergyExpenditureKcal} kcal</Text>
                <Text style={styles.kpiDesc}>Energia / Ptak</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={[styles.kpiVal, { color: '#38BDF8' }]}>{flockTotalFatGrams} g</Text>
                <Text style={styles.kpiDesc}>Dla Stada ({flockSize} szt.)</Text>
              </View>
            </View>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'schedule' && styles.tabBtnActive]}
              onPress={() => setActiveTab('schedule')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'schedule' && styles.tabBtnTextActive]}>
                📅 Harmonogram 96h
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'tactics' && styles.tabBtnActive]}
              onPress={() => setActiveTab('tactics')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'tactics' && styles.tabBtnTextActive]}>
                🧬 Wytyczne
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'summary' && styles.tabBtnActive]}
              onPress={() => setActiveTab('summary')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'summary' && styles.tabBtnTextActive]}>
                📊 Makro i Bilans
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'schedule' && (
            <View style={styles.tabContentContainer}>
              {/* Day Selector Pills */}
              <View style={styles.daySelectorRow}>
                {['D-4', 'D-3', 'D-2', 'D-1 (Kosz)'].map((label, idx) => (
                  <TouchableOpacity
                    key={label}
                    style={[
                      styles.dayPill,
                      selectedDayIndex === idx && styles.dayPillActive,
                    ]}
                    onPress={() => setSelectedDayIndex(idx)}
                  >
                    <Text
                      style={[
                        styles.dayPillText,
                        selectedDayIndex === idx && styles.dayPillTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Day Phase Card */}
              {(() => {
                const day = plan.fourDaySchedule[selectedDayIndex] as DayFeedingPhase;
                return (
                  <View style={styles.dayCard}>
                    <Text style={styles.dayCardTitle}>{day.dayName}</Text>
                    <Text style={styles.dayCardObjective}>{day.phaseObjective}</Text>

                    {/* Macro distribution bar */}
                    <View style={styles.macroBarContainer}>
                      <View
                        style={[
                          styles.macroSegment,
                          { flex: day.recommendedCarboPercent, backgroundColor: '#3B82F6' },
                        ]}
                      />
                      <View
                        style={[
                          styles.macroSegment,
                          { flex: day.recommendedFatPercent, backgroundColor: '#E0A82E' },
                        ]}
                      />
                      <View
                        style={[
                          styles.macroSegment,
                          { flex: day.recommendedProteinPercent, backgroundColor: '#10B981' },
                        ]}
                      />
                    </View>
                    <View style={styles.macroLabelsRow}>
                      <Text style={[styles.macroLabel, { color: '#3B82F6' }]}>
                        Węglowodany: {day.recommendedCarboPercent}%
                      </Text>
                      <Text style={[styles.macroLabel, { color: '#E0A82E' }]}>
                        Tłuszcz: {day.recommendedFatPercent}%
                      </Text>
                      <Text style={[styles.macroLabel, { color: '#10B981' }]}>
                        Białko: {day.recommendedProteinPercent}%
                      </Text>
                    </View>

                    {/* Grains */}
                    <View style={styles.listSection}>
                      <Text style={styles.listSectionTitle}>🌾 Mieszanka Ziaren ({day.feedGramsPerBird} g/ptak):</Text>
                      {day.grainsRecommendation.map((grain, idx) => (
                        <Text key={idx} style={styles.listItem}>• {grain}</Text>
                      ))}
                    </View>

                    {/* Oils & Supplements */}
                    <View style={styles.listSection}>
                      <Text style={styles.listSectionTitle}>🥜 Oleje i Dodatki na Karmę:</Text>
                      {day.oilsAndSupplements.map((oil, idx) => (
                        <Text key={idx} style={styles.listItem}>• {oil}</Text>
                      ))}
                    </View>

                    {/* Drinker */}
                    <View style={styles.listSection}>
                      <Text style={styles.listSectionTitle}>💧 Suplementacja Poidła:</Text>
                      {day.drinkerAdditives.map((drink, idx) => (
                        <Text key={idx} style={styles.listItem}>• {drink}</Text>
                      ))}
                    </View>
                  </View>
                );
              })()}
            </View>
          )}

          {activeTab === 'tactics' && (
            <View style={styles.tabContentContainer}>
              <View style={styles.tacticsCard}>
                <Text style={styles.tacticsTitle}>ZASADY BIOENERGETYKI LOTU GOŁĘBIA</Text>
                {plan.keyTacticalGuidelines.map((guide, idx) => (
                  <View key={idx} style={styles.tacticRow}>
                    <Text style={styles.tacticDot}>⚡</Text>
                    <Text style={styles.tacticText}>{guide}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.tacticsCard, { marginTop: 12, borderLeftColor: '#EF4444' }]}>
                <Text style={[styles.tacticsTitle, { color: '#EF4444' }]}>
                  ⚠️ CZEGO KATEGORYCZNIE UNIKAĆ PRZED MARATONEM
                </Text>
                <Text style={styles.warningItem}>
                  1. <Text style={styles.boldText}>Brak białek strączkowych:</Text> W czwartek i piątek wyeliminuj groch, wykę i bobik. Produkty rozpadu mocznika obciążają nerki podczas wysiłku.
                </Text>
                <Text style={styles.warningItem}>
                  2. <Text style={styles.boldText}>Temperatura orzeszków ziemnych:</Text> Sprawdzaj świeżość — zjełczały tłuszcz wywołuje ostre zapalenie wątroby i natychmiastowe osłabienie.
                </Text>
                <Text style={styles.warningItem}>
                  3. <Text style={styles.boldText}>Pojenie w dniu koszowania:</Text> Upewnij się, że każdy maratończyk napoił się do woli 2 godziny przed włożeniem do klatki transportowej.
                </Text>
              </View>
            </View>
          )}

          {activeTab === 'summary' && (
            <View style={styles.tabContentContainer}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>BILANS CAŁKOWITY DLA STADA ({flockSize} SZTUK)</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Łączne zapotrzebowanie na tłuszcz:</Text>
                  <Text style={styles.summaryVal}>{flockTotalFatGrams} g (~{(flockTotalFatGrams / 1000).toFixed(2)} kg)</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Łączny wydatek kaloryczny:</Text>
                  <Text style={styles.summaryVal}>
                    {Math.round(plan.totalEnergyExpenditureKcal * flockSize).toLocaleString()} kcal
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Średnia dawka karmy / dzień:</Text>
                  <Text style={styles.summaryVal}>
                    {Math.round(35 * flockSize)} g ({((35 * flockSize) / 1000).toFixed(2)} kg)
                  </Text>
                </View>
                <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.summaryLabel}>Dawka L-Karnityny w poidle (D-3, D-2):</Text>
                  <Text style={styles.summaryVal}>500 mg / 1 litr wody</Text>
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <FieldButton
              title="Drukuj Protokół A4"
              variant="primary"
              onPress={handlePrint}
              style={styles.actionBtn}
            />
            <FieldButton
              title="Udostępnij PDF"
              variant="secondary"
              onPress={handleShare}
              style={styles.actionBtn}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121417',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#262A30',
    backgroundColor: '#1A1D23',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F0F2F5',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8A92A0',
    marginTop: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#262A30',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeButtonText: {
    color: '#F0F2F5',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8A92A0',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  presetButton: {
    flex: 1,
    height: 52,
    backgroundColor: '#1E2229',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D333D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetButtonActive: {
    borderColor: '#E0A82E',
    backgroundColor: '#2E2818',
  },
  presetButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F0F2F5',
  },
  presetSubText: {
    fontSize: 10,
    color: '#8A92A0',
    marginTop: 1,
  },
  card: {
    backgroundColor: '#1A1D23',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#262A30',
    padding: 14,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8A92A0',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#262A30',
  },
  stepperLabelCol: {
    flex: 1,
  },
  stepperLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F0F2F5',
  },
  stepperSub: {
    fontSize: 12,
    color: '#E0A82E',
    marginTop: 2,
    fontWeight: '700',
  },
  stepperControls: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBtn: {
    minWidth: 50,
    height: 48,
    backgroundColor: '#262A30',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  stepBtnText: {
    color: '#F0F2F5',
    fontSize: 12,
    fontWeight: '700',
  },
  kpiCard: {
    backgroundColor: '#1A1D23',
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 16,
  },
  kpiTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  intensityPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  intensityText: {
    fontSize: 11,
    fontWeight: '800',
  },
  kpiHours: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F0F2F5',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#22262E',
    padding: 10,
    borderRadius: 8,
  },
  kpiVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F0F2F5',
  },
  kpiDesc: {
    fontSize: 10,
    color: '#8A92A0',
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#1A1D23',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#262A30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#E0A82E25',
    borderColor: '#E0A82E',
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A92A0',
  },
  tabBtnTextActive: {
    color: '#E0A82E',
  },
  tabContentContainer: {
    marginBottom: 16,
  },
  daySelectorRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  dayPill: {
    flex: 1,
    height: 48,
    backgroundColor: '#1E2229',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2D333D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillActive: {
    backgroundColor: '#0284C725',
    borderColor: '#0284C7',
  },
  dayPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A92A0',
  },
  dayPillTextActive: {
    color: '#38BDF8',
  },
  dayCard: {
    backgroundColor: '#1A1D23',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#262A30',
    padding: 14,
  },
  dayCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F0F2F5',
  },
  dayCardObjective: {
    fontSize: 11,
    color: '#8A92A0',
    marginTop: 2,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  macroBarContainer: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  macroSegment: {
    height: '100%',
  },
  macroLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  listSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#262A30',
    paddingTop: 8,
  },
  listSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F0F2F5',
    marginBottom: 4,
  },
  listItem: {
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  tacticsCard: {
    backgroundColor: '#1A1D23',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#E0A82E',
    padding: 14,
  },
  tacticsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E0A82E',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  tacticRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  tacticDot: {
    fontSize: 12,
    marginRight: 6,
    marginTop: 2,
  },
  tacticText: {
    flex: 1,
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  warningItem: {
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 18,
    marginVertical: 4,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#F0F2F5',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#262A30',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8A92A0',
    flex: 1,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F0F2F5',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    height: 48,
  },
});

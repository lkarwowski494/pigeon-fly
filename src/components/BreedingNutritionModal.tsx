/**
 * PIGEON-FLY — Breeding Nutrition & Feeder Assistant Modal (Z-074 / DEC-88)
 * Field Mode ergonomic interface (>= 48-56pt touch targets), dark theme (#121417).
 * Phase-specific balancing (Egg formation, Crop milk D1-D5, Feathering D6-D24),
 * Feeder consumption calculator, nutrient gauges (Crude Protein >= 18%), and A4 print export.
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
  BreedingNutritionPhase,
  PREDEFINED_BREEDING_RATIONS,
  calculateRationNutrition,
  validateBreedingDiet,
  calculateFeederDemand,
  generateBreedingNutritionPdfHtml,
} from '../domain/breedingNutrition';
import { PdfService } from '../services/pdfService';
import { FieldButton } from './FieldButton';

interface BreedingNutritionModalProps {
  visible: boolean;
  onClose: () => void;
  initialPairsCount?: number;
}

export const BreedingNutritionModal: React.FC<BreedingNutritionModalProps> = ({
  visible,
  onClose,
  initialPairsCount = 12,
}) => {
  const [phase, setPhase] = useState<BreedingNutritionPhase>('CROP_MILK');
  const [selectedRationId, setSelectedRationId] = useState<string>(
    PREDEFINED_BREEDING_RATIONS[0].id
  );
  const [numPairs, setNumPairs] = useState<number>(initialPairsCount);
  const [numSquabs, setNumSquabs] = useState<number>(Math.round(initialPairsCount * 1.7));
  const [squabsAgeDays, setSquabsAgeDays] = useState<number>(7);

  const selectedRation = useMemo(() => {
    return (
      PREDEFINED_BREEDING_RATIONS.find((r) => r.id === selectedRationId) ||
      PREDEFINED_BREEDING_RATIONS[0]
    );
  }, [selectedRationId]);

  const nutrients = useMemo(() => {
    return calculateRationNutrition(selectedRation.ingredients);
  }, [selectedRation]);

  const validation = useMemo(() => {
    return validateBreedingDiet(nutrients, phase);
  }, [nutrients, phase]);

  const demand = useMemo(() => {
    return calculateFeederDemand({
      numPairs,
      numSquabs,
      squabsAgeDays,
      phase,
    });
  }, [numPairs, numSquabs, squabsAgeDays, phase]);

  const handlePrintNutritionGuide = async () => {
    try {
      const html = generateBreedingNutritionPdfHtml({
        rationName: selectedRation.name,
        nutrients,
        validation,
        demand,
        loftName: 'Gołębnik Mistrza Pigeon-Fly',
        seasonYear: 2026,
      });
      await PdfService.printHtml(html);
    } catch (err: any) {
      Alert.alert('Błąd drukowania', err?.message || 'Nie udało się wydrukować karty żywieniowej.');
    }
  };

  const handleShareNutritionGuide = async () => {
    try {
      const html = generateBreedingNutritionPdfHtml({
        rationName: selectedRation.name,
        nutrients,
        validation,
        demand,
        loftName: 'Gołębnik Mistrza Pigeon-Fly',
        seasonYear: 2026,
      });
      await PdfService.shareHtmlAsPdf(
        html,
        `Zalecenia_Zywieniowe_Legi_${phase}.pdf`
      );
    } catch (err: any) {
      Alert.alert('Błąd eksportu', err?.message || 'Nie udało się wyeksportować raportu PDF.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>🥣 Asystent Żywieniowy Lęgów</Text>
              <Text style={styles.subtitle}>
                Białko Surowe &ge; 18% &bull; Mleczko Wola &bull; Lizyna & Metionina (Z-074)
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Zamknij"
              testID="btn-close-nutrition-modal"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Phase Selector Tabs */}
          <View style={styles.phaseTabsRow}>
            <TouchableOpacity
              style={[styles.phaseTab, phase === 'EGG_FORMATION' && styles.phaseTabActive]}
              onPress={() => setPhase('EGG_FORMATION')}
              testID="tab-phase-egg"
            >
              <Text
                style={[
                  styles.phaseTabText,
                  phase === 'EGG_FORMATION' && styles.phaseTabTextActive,
                ]}
              >
                🥚 Składanie Jaj
              </Text>
              <Text style={styles.phaseTabSub}>Wapń, Grit, D3</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.phaseTab, phase === 'CROP_MILK' && styles.phaseTabActive]}
              onPress={() => setPhase('CROP_MILK')}
              testID="tab-phase-milk"
            >
              <Text
                style={[
                  styles.phaseTabText,
                  phase === 'CROP_MILK' && styles.phaseTabTextActive,
                ]}
              >
                🥛 Mleczko Wola
              </Text>
              <Text style={styles.phaseTabSub}>D1-D5 (Białko &ge;18%)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.phaseTab, phase === 'FEATHERING_GROWTH' && styles.phaseTabActive]}
              onPress={() => setPhase('FEATHERING_GROWTH')}
              testID="tab-phase-growth"
            >
              <Text
                style={[
                  styles.phaseTabText,
                  phase === 'FEATHERING_GROWTH' && styles.phaseTabTextActive,
                ]}
              >
                🪶 Odchów i Pióra
              </Text>
              <Text style={styles.phaseTabSub}>D6-D24 (Lizyna/Met)</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            {/* Ration Selector */}
            <Text style={styles.sectionTitle}>WYBIERZ MIESZANKĘ LĘGOWĄ:</Text>
            <View style={styles.rationList}>
              {PREDEFINED_BREEDING_RATIONS.map((r) => {
                const isSelected = r.id === selectedRation.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.rationCard, isSelected && styles.rationCardSelected]}
                    onPress={() => setSelectedRationId(r.id)}
                    testID={`ration-card-${r.id}`}
                  >
                    <View style={styles.rationHeader}>
                      <Text
                        style={[
                          styles.rationName,
                          isSelected && styles.rationNameSelected,
                        ]}
                      >
                        {r.name}
                      </Text>
                      {isSelected && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                    <Text style={styles.rationDesc}>{r.description}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Nutrients Breakdown Card */}
            <View style={styles.nutrientsCard}>
              <View style={styles.nutrientsHeaderRow}>
                <Text style={styles.nutrientsTitle}>SKŁAD ANALITYCZNY MIESZANKI</Text>
                <View
                  style={[
                    styles.scoreBadge,
                    validation.score >= 90 ? styles.scoreGood : styles.scoreWarning,
                  ]}
                >
                  <Text style={styles.scoreText}>Ocena: {validation.score}/100</Text>
                </View>
              </View>

              {/* Progress Bars for Key Nutrients */}
              {/* Crude Protein */}
              <View style={styles.nutrientRow}>
                <View style={styles.nutrientLabelRow}>
                  <Text style={styles.nutrientName}>Białko Surowe (CP):</Text>
                  <Text
                    style={[
                      styles.nutrientValue,
                      nutrients.crudeProteinPct >= 18.0 ? styles.valSuccess : styles.valDanger,
                    ]}
                  >
                    {nutrients.crudeProteinPct}%{' '}
                    <Text style={styles.targetHint}>(min. 18.0%)</Text>
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.min(100, (nutrients.crudeProteinPct / 24) * 100)}%`,
                        backgroundColor:
                          nutrients.crudeProteinPct >= 18.0 ? '#10B981' : '#EF4444',
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Crude Fat */}
              <View style={styles.nutrientRow}>
                <View style={styles.nutrientLabelRow}>
                  <Text style={styles.nutrientName}>Tłuszcz Surowy (lipidy wola):</Text>
                  <Text style={styles.nutrientValue}>{nutrients.crudeFatPct}%</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.min(100, (nutrients.crudeFatPct / 12) * 100)}%`,
                        backgroundColor: '#3B82F6',
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Lysine */}
              <View style={styles.nutrientRow}>
                <View style={styles.nutrientLabelRow}>
                  <Text style={styles.nutrientName}>Lizyna (rozwój mięśni):</Text>
                  <Text
                    style={[
                      styles.nutrientValue,
                      nutrients.lysinePct >= 0.85 ? styles.valSuccess : styles.valWarning,
                    ]}
                  >
                    {nutrients.lysinePct}%{' '}
                    <Text style={styles.targetHint}>(norma &ge; 0.85%)</Text>
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.min(100, (nutrients.lysinePct / 1.5) * 100)}%`,
                        backgroundColor:
                          nutrients.lysinePct >= 0.85 ? '#10B981' : '#F59E0B',
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Methionine */}
              <View style={styles.nutrientRow}>
                <View style={styles.nutrientLabelRow}>
                  <Text style={styles.nutrientName}>Metionina (keratyna piór):</Text>
                  <Text
                    style={[
                      styles.nutrientValue,
                      nutrients.methioninePct >= 0.3 ? styles.valSuccess : styles.valWarning,
                    ]}
                  >
                    {nutrients.methioninePct}%{' '}
                    <Text style={styles.targetHint}>(norma &ge; 0.30%)</Text>
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.min(100, (nutrients.methioninePct / 0.5) * 100)}%`,
                        backgroundColor:
                          nutrients.methioninePct >= 0.3 ? '#10B981' : '#F59E0B',
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Ca:P & Energy */}
              <View style={styles.statsSummaryGrid}>
                <View style={styles.miniStatBox}>
                  <Text style={styles.miniStatLabel}>Ca : P</Text>
                  <Text style={styles.miniStatVal}>{nutrients.caToPRatio} : 1</Text>
                </View>
                <View style={styles.miniStatBox}>
                  <Text style={styles.miniStatLabel}>ENERGIA</Text>
                  <Text style={styles.miniStatVal}>{nutrients.metabolizableEnergyKcalKg} kcal</Text>
                </View>
                <View style={styles.miniStatBox}>
                  <Text style={styles.miniStatLabel}>WŁÓKNO</Text>
                  <Text style={styles.miniStatVal}>{nutrients.crudeFiberPct}%</Text>
                </View>
              </View>
            </View>

            {/* Validation Alerts if any */}
            {validation.alerts.map((alert, idx) => (
              <View key={idx} style={styles.alertCard}>
                <Text style={styles.alertIcon}>🚨</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>{alert.message}</Text>
                  <Text style={styles.alertRec}>Zalecenie: {alert.recommendation}</Text>
                </View>
              </View>
            ))}

            {/* Feeder Demand Interactive Section */}
            <Text style={styles.sectionTitle}>KALKULATOR KARMNIKA LĘGOWEGO:</Text>
            <View style={styles.calculatorCard}>
              <View style={styles.stepperRow}>
                <Text style={styles.stepperLabel}>Liczba par lęgowych:</Text>
                <View style={styles.stepperControls}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setNumPairs((p) => Math.max(1, p - 1))}
                    testID="btn-dec-pairs"
                  >
                    <Text style={styles.stepperBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{numPairs}</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setNumPairs((p) => p + 1)}
                    testID="btn-inc-pairs"
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.stepperRow}>
                <Text style={styles.stepperLabel}>Liczba piskląt w celach:</Text>
                <View style={styles.stepperControls}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setNumSquabs((s) => Math.max(0, s - 1))}
                    testID="btn-dec-squabs"
                  >
                    <Text style={styles.stepperBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{numSquabs}</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setNumSquabs((s) => s + 1)}
                    testID="btn-inc-squabs"
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.stepperRow}>
                <Text style={styles.stepperLabel}>Wiek piskląt (dni):</Text>
                <View style={styles.stepperControls}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setSquabsAgeDays((a) => Math.max(1, a - 1))}
                    testID="btn-dec-age"
                  >
                    <Text style={styles.stepperBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>D{squabsAgeDays}</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setSquabsAgeDays((a) => Math.min(28, a + 1))}
                    testID="btn-inc-age"
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Demand Results Grid */}
              <View style={styles.resultsGrid}>
                <View style={styles.resultItem}>
                  <Text style={styles.resultVal}>{demand.dailyFeedPerPairGrams} g</Text>
                  <Text style={styles.resultLbl}>Karmy / parę / dobę</Text>
                </View>
                <View style={styles.resultItem}>
                  <Text style={[styles.resultVal, { color: '#E5A93C' }]}>
                    {demand.totalDailyFeedKg} kg
                  </Text>
                  <Text style={styles.resultLbl}>Razem karmy / dobę</Text>
                </View>
                <View style={styles.resultItem}>
                  <Text style={styles.resultVal}>{demand.totalDailyWaterLiters} l</Text>
                  <Text style={styles.resultLbl}>Woda do poideł / dobę</Text>
                </View>
                <View style={styles.resultItem}>
                  <Text style={styles.resultVal}>{demand.dailyGritTotalGrams} g</Text>
                  <Text style={styles.resultLbl}>Grit i minerały / dobę</Text>
                </View>
              </View>

              <View style={styles.feederTipBox}>
                <Text style={styles.feederTipText}>
                  ℹ️ {demand.recommendedFeederType} &bull; Częstotliwość:{' '}
                  <strong>{demand.feedFrequencyTimesPerDay}x dziennie</strong>
                </Text>
              </View>
            </View>

            {/* Special Supplements Checklist */}
            <Text style={styles.sectionTitle}>ZALECANE SUPLEMENTY W FAZIE:</Text>
            <View style={styles.supplementsCard}>
              {demand.specialSupplements.map((supp, idx) => (
                <View key={idx} style={styles.suppItem}>
                  <Text style={styles.suppBullet}>✓</Text>
                  <Text style={styles.suppText}>{supp}</Text>
                </View>
              ))}
            </View>

            {/* Advice Tips */}
            <View style={styles.adviceCard}>
              <Text style={styles.adviceHeader}>WSKAZÓWKI WETERYNARYJNO-HODOWLANE:</Text>
              {validation.adviceList.map((adv, idx) => (
                <Text key={idx} style={styles.adviceItemText}>
                  &bull; {adv}
                </Text>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <FieldButton
                title="🖨️ Drukuj Kartę Żywieniową (A4/PDF)"
                onPress={handlePrintNutritionGuide}
                style={{ marginBottom: 10, minHeight: 48 }}
                testID="btn-print-nutrition-guide"
              />

              <FieldButton
                title="📤 Udostępnij Raport Żywieniowy PDF"
                variant="secondary"
                onPress={handleShareNutritionGuide}
                style={{ marginBottom: 20, minHeight: 48 }}
                testID="btn-share-nutrition-guide"
              />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121417',
  },
  container: {
    flex: 1,
    backgroundColor: '#121417',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F3F4F6',
  },
  subtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#D1D5DB',
    fontWeight: 'bold',
  },
  phaseTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  phaseTab: {
    flex: 1,
    backgroundColor: '#1E2127',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#2F343F',
    alignItems: 'center',
  },
  phaseTabActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#3B82F6',
  },
  phaseTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  phaseTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  phaseTabSub: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
  },
  scrollContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5A93C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  rationList: {
    gap: 8,
    marginBottom: 14,
  },
  rationCard: {
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  rationCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#172554',
  },
  rationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rationName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  rationNameSelected: {
    color: '#93C5FD',
    fontWeight: '800',
  },
  checkMark: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  rationDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    lineHeight: 15,
  },
  nutrientsCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 14,
  },
  nutrientsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nutrientsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F3F4F6',
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scoreGood: {
    backgroundColor: '#059669',
  },
  scoreWarning: {
    backgroundColor: '#D97706',
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  nutrientRow: {
    marginBottom: 10,
  },
  nutrientLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nutrientName: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  nutrientValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F3F4F6',
  },
  targetHint: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: 'normal',
  },
  valSuccess: {
    color: '#34D399',
  },
  valWarning: {
    color: '#FBBF24',
  },
  valDanger: {
    color: '#F87171',
  },
  barTrack: {
    height: 6,
    backgroundColor: '#111827',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  statsSummaryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2F343F',
  },
  miniStatBox: {
    flex: 1,
    backgroundColor: '#121417',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  miniStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  miniStatVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#60A5FA',
    marginTop: 2,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  alertIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  alertTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FCA5A5',
  },
  alertRec: {
    fontSize: 10,
    color: '#F87171',
    marginTop: 2,
  },
  calculatorCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 14,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepperLabel: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    minWidth: 36,
    textAlign: 'center',
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2F343F',
  },
  resultItem: {
    width: '48%',
    backgroundColor: '#121417',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
  },
  resultVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#60A5FA',
  },
  resultLbl: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
    textAlign: 'center',
  },
  feederTipBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  feederTipText: {
    fontSize: 11,
    color: '#93C5FD',
  },
  supplementsCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 14,
    gap: 6,
  },
  suppItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suppBullet: {
    color: '#10B981',
    fontWeight: 'bold',
    marginRight: 6,
    fontSize: 12,
  },
  suppText: {
    fontSize: 11,
    color: '#D1D5DB',
    flex: 1,
  },
  adviceCard: {
    backgroundColor: '#172554',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E40AF',
    marginBottom: 14,
  },
  adviceHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#93C5FD',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  adviceItemText: {
    fontSize: 11,
    color: '#BFDBFE',
    lineHeight: 16,
    marginBottom: 4,
  },
  actionsContainer: {
    marginTop: 4,
  },
});

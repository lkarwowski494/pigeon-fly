/**
 * PIGEON-FLY — DrinkerLabModal (RD-15, RD-16, RD-17, RD-18)
 * Scientific Drinker pH Buffering, Post-Flight Isotonic Rehydration Osmolarity,
 * and Carbo-Lipid Shift Pre-Race Fat Loading Calculator.
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
  calculateDrinkerPh,
  calculateRehydrationOsmolarity,
  calculateCarboLipidShift,
  getStandardRehydrationPreset,
  AcidifierType,
  ElectrolyteRecipe,
} from '../domain/drinkerLab';
import { FieldButton } from './FieldButton';

export interface DrinkerLabModalProps {
  visible: boolean;
  onClose: () => void;
}

type LabTab = 'ph_buffer' | 'electrolytes' | 'carbo_lipid';

export function DrinkerLabModal({ visible, onClose }: DrinkerLabModalProps) {
  const [activeTab, setActiveTab] = useState<LabTab>('ph_buffer');

  // Tab 1 state: Drinker pH
  const [initialPh, setInitialPh] = useState<number>(7.4);
  const [acidifier, setAcidifier] = useState<AcidifierType>('apple_cider_vinegar');
  const [dosageMl, setDosageMl] = useState<number>(5.0);

  // Tab 2 state: Rehydration Osmolarity
  const [recipe, setRecipe] = useState<ElectrolyteRecipe>(getStandardRehydrationPreset(1.0));

  // Tab 3 state: Carbo-Lipid Shift
  const [raceDistanceKm, setRaceDistanceKm] = useState<number>(450);

  // Calculations
  const phEval = calculateDrinkerPh(initialPh, acidifier, dosageMl);
  const osmEval = calculateRehydrationOsmolarity(recipe);
  const shiftEval = calculateCarboLipidShift(raceDistanceKm);

  const handleLoadIsotonicPreset = () => {
    setRecipe(getStandardRehydrationPreset(recipe.waterLiters));
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    Alert.alert(
      'Wczytano Wzorcowy Roztwór',
      'Skład zoptymalizowany pod kątem izotoniczności (~290 mOsm/L) i szybkiej regeneracji enterocytów.'
    );
  };

  const handleAdjustElectrolyte = (key: keyof ElectrolyteRecipe, delta: number) => {
    setRecipe((prev) => ({
      ...prev,
      [key]: Math.max(0, parseFloat((prev[key] + delta).toFixed(1))),
    }));
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <View style={styles.pillBadge}>
                  <Text style={styles.pillDot}>●</Text>
                  <Text style={styles.pillText}>LABORATORIUM BIOCHEMICZNE</Text>
                </View>
                <Text style={styles.title}>POIDŁO, pH I REHYDRATACJA</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="btn-close-drinker-lab">
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Tab Selector */}
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'ph_buffer' && styles.tabBtnActive]}
                onPress={() => setActiveTab('ph_buffer')}
                testID="tab-ph-buffer"
              >
                <Text style={[styles.tabBtnText, activeTab === 'ph_buffer' && styles.tabBtnTextActive]}>
                  💧 Bufor pH (RD-17)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'electrolytes' && styles.tabBtnActive]}
                onPress={() => setActiveTab('electrolytes')}
                testID="tab-electrolytes"
              >
                <Text style={[styles.tabBtnText, activeTab === 'electrolytes' && styles.tabBtnTextActive]}>
                  ⚡ Elektrolity (RD-18)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'carbo_lipid' && styles.tabBtnActive]}
                onPress={() => setActiveTab('carbo_lipid')}
                testID="tab-carbo-lipid"
              >
                <Text style={[styles.tabBtnText, activeTab === 'carbo_lipid' && styles.tabBtnTextActive]}>
                  🚀 Tłuszcze (RD-15)
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB 1: DRINKER pH (RD-17) */}
            {activeTab === 'ph_buffer' && (
              <View>
                {/* Result Gauge Card */}
                <View
                  style={[
                    styles.resultCard,
                    phEval.status === 'optimal'
                      ? styles.borderSuccess
                      : phEval.status === 'too_acidic'
                      ? styles.borderWarning
                      : styles.borderDanger,
                  ]}
                >
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultTitle}>WYNIKOWE pH POIDŁA</Text>
                    <View
                      style={[
                        styles.badge,
                        phEval.status === 'optimal'
                          ? styles.badgeSuccess
                          : phEval.status === 'too_acidic'
                          ? styles.badgeWarning
                          : styles.badgeDanger,
                      ]}
                    >
                      <Text style={styles.badgeText}>
                        {phEval.status === 'optimal'
                          ? 'STERYLIZACJA ✓'
                          : phEval.status === 'too_acidic'
                          ? 'ZBYT KWAŚNA ⚠️'
                          : 'BEZBRONNA WODA ❌'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.phValueText}>{phEval.finalPh} pH</Text>
                  <Text style={styles.survivalText}>
                    Przeżywalność rzęsistka:{' '}
                    <Text style={styles.boldWhite}>{phEval.trichomonasSurvivalTimeText}</Text>
                  </Text>
                  <Text style={styles.recommendationText}>{phEval.recommendation}</Text>
                </View>

                {/* Acidifier Choice */}
                <View style={styles.controlCard}>
                  <Text style={styles.controlTitle}>WYBÓR PREPARATU ZAKWASZAJĄCEGO</Text>
                  <View style={styles.choiceGrid}>
                    <TouchableOpacity
                      style={[
                        styles.choiceBtn,
                        acidifier === 'apple_cider_vinegar' && styles.choiceBtnActive,
                      ]}
                      onPress={() => {
                        setAcidifier('apple_cider_vinegar');
                        setDosageMl(5.0);
                      }}
                    >
                      <Text style={styles.choiceEmoji}>🍏</Text>
                      <Text style={styles.choiceName}>Ocet Jabłkowy 5%</Text>
                      <Text style={styles.choiceDose}>Dawka: 5 ml/L</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.choiceBtn,
                        acidifier === 'organic_acids_blend' && styles.choiceBtnActive,
                      ]}
                      onPress={() => {
                        setAcidifier('organic_acids_blend');
                        setDosageMl(1.5);
                      }}
                    >
                      <Text style={styles.choiceEmoji}>🧪</Text>
                      <Text style={styles.choiceName}>Kwasy Organiczne</Text>
                      <Text style={styles.choiceDose}>Dawka: 1.5 ml/L</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.choiceGrid, { marginTop: 8 }]}>
                    <TouchableOpacity
                      style={[
                        styles.choiceBtn,
                        acidifier === 'citric_acid' && styles.choiceBtnActive,
                      ]}
                      onPress={() => {
                        setAcidifier('citric_acid');
                        setDosageMl(1.0);
                      }}
                    >
                      <Text style={styles.choiceEmoji}>🍋</Text>
                      <Text style={styles.choiceName}>Kwas Cytrynowy</Text>
                      <Text style={styles.choiceDose}>Dawka: 1.0 g/L</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.choiceBtn,
                        acidifier === 'none' && styles.choiceBtnActive,
                      ]}
                      onPress={() => {
                        setAcidifier('none');
                        setDosageMl(0);
                      }}
                    >
                      <Text style={styles.choiceEmoji}>🚰</Text>
                      <Text style={styles.choiceName}>Czysta Kranówka</Text>
                      <Text style={styles.choiceDose}>Brak zakwaszania</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Dosage Stepper */}
                  {acidifier !== 'none' && (
                    <View style={styles.stepperSection}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.stepperSectionLabel}>Dawka na 1 litr wody:</Text>
                        <Text style={styles.stepperValueText}>{dosageMl} ml</Text>
                      </View>
                      <View style={styles.stepperBtnGroup}>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => setDosageMl((d) => Math.max(0.5, parseFloat((d - 0.5).toFixed(1))))}
                        >
                          <Text style={styles.stepBtnText}>-0.5 ml</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => setDosageMl((d) => parseFloat((d + 0.5).toFixed(1)))}
                        >
                          <Text style={styles.stepBtnText}>+0.5 ml</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>

                {/* Science Note */}
                <View style={styles.scienceCard}>
                  <Text style={styles.scienceTitle}>BIOLOGIA RD-17 (KONTROLA RZĘSISTKOWICY)</Text>
                  <Text style={styles.scienceText}>
                    W czystej kranówce (pH 7.4) pierwotniaki Trichomonas gallinae przeżywają ponad 48 godzin,
                    zakażając całe stado przez wspólne poidło. Obniżenie pH do 4.2 niszczy ścianę komórkową
                    pasożyta w 15 minut, eliminując konieczność stosowania antybiotyków (ronidazolu/metronidazolu).
                  </Text>
                </View>
              </View>
            )}

            {/* TAB 2: ELECTROLYTES & OSMOLARITY (RD-18) */}
            {activeTab === 'electrolytes' && (
              <View>
                {/* Result Card */}
                <View
                  style={[
                    styles.resultCard,
                    osmEval.tonicCategory === 'isotonic'
                      ? styles.borderSuccess
                      : osmEval.tonicCategory === 'hypertonic'
                      ? styles.borderDanger
                      : styles.borderWarning,
                  ]}
                >
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultTitle}>OSMOLARNOŚĆ POIDŁA POWROTNEGO</Text>
                    <View
                      style={[
                        styles.badge,
                        osmEval.tonicCategory === 'isotonic'
                          ? styles.badgeSuccess
                          : osmEval.tonicCategory === 'hypertonic'
                          ? styles.badgeDanger
                          : styles.badgeWarning,
                      ]}
                    >
                      <Text style={styles.badgeText}>
                        {osmEval.tonicCategory === 'isotonic'
                          ? 'IZOTONIK (IDEALNY) ✓'
                          : osmEval.tonicCategory === 'hypertonic'
                          ? 'HIPERTONIK (NIEBEZPIECZNY) ⚠️'
                          : 'HIPOTONIK (LEKKI)'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.phValueText}>{osmEval.osmolarityMOsmPerLiter} mOsm/L</Text>
                  <Text style={styles.survivalText}>{osmEval.cellularAbsorptionRateText}</Text>
                  <Text style={styles.recommendationText}>{osmEval.guidanceText}</Text>
                </View>

                {/* Ingredients Adjuster */}
                <View style={styles.controlCard}>
                  <View style={styles.presetRow}>
                    <Text style={styles.controlTitle}>RECEPTURA NA {recipe.waterLiters} LITR(ÓW) WODY</Text>
                    <TouchableOpacity
                      style={styles.presetLinkBtn}
                      onPress={handleLoadIsotonicPreset}
                      testID="btn-load-isotonic"
                    >
                      <Text style={styles.presetLinkText}>↺ Wzorzec RD-18</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Water liters */}
                  <View style={styles.ingredientRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ingName}>Objętość poidła:</Text>
                      <Text style={styles.ingValue}>{recipe.waterLiters} L</Text>
                    </View>
                    <View style={styles.stepperBtnGroup}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => handleAdjustElectrolyte('waterLiters', -0.5)}
                      >
                        <Text style={styles.stepBtnText}>-0.5 L</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => handleAdjustElectrolyte('waterLiters', 0.5)}
                      >
                        <Text style={styles.stepBtnText}>+0.5 L</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Glucose */}
                  <View style={[styles.ingredientRow, { marginTop: 10 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ingName}>Glukoza / Miód / Maltodekstryna:</Text>
                      <Text style={styles.ingValue}>{recipe.glucoseGrams} g</Text>
                    </View>
                    <View style={styles.stepperBtnGroup}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => handleAdjustElectrolyte('glucoseGrams', -5)}
                      >
                        <Text style={styles.stepBtnText}>-5 g</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => handleAdjustElectrolyte('glucoseGrams', 5)}
                      >
                        <Text style={styles.stepBtnText}>+5 g</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* NaCl Salt */}
                  <View style={[styles.ingredientRow, { marginTop: 10 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ingName}>Sól kamienna (NaCl):</Text>
                      <Text style={styles.ingValue}>{recipe.saltNaclGrams} g</Text>
                    </View>
                    <View style={styles.stepperBtnGroup}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => handleAdjustElectrolyte('saltNaclGrams', -0.5)}
                      >
                        <Text style={styles.stepBtnText}>-0.5 g</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => handleAdjustElectrolyte('saltNaclGrams', 0.5)}
                      >
                        <Text style={styles.stepBtnText}>+0.5 g</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Potassium KCl */}
                  <View style={[styles.ingredientRow, { marginTop: 10 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ingName}>Potas (KCl):</Text>
                      <Text style={styles.ingValue}>{recipe.potassiumKclGrams} g</Text>
                    </View>
                    <View style={styles.stepperBtnGroup}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => handleAdjustElectrolyte('potassiumKclGrams', -0.5)}
                      >
                        <Text style={styles.stepBtnText}>-0.5 g</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => handleAdjustElectrolyte('potassiumKclGrams', 0.5)}
                      >
                        <Text style={styles.stepBtnText}>+0.5 g</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Science Note */}
                <View style={styles.scienceCard}>
                  <Text style={styles.scienceTitle}>BIOLOGIA RD-18 (UWAGA NA HIPERTONIĘ)</Text>
                  <Text style={styles.scienceText}>
                    Zbyt duża ilość miodu lub glukozy (roztwór hipertoniczny &gt; 330 mOsm/L) powoduje
                    odciąganie wody ze ścianek wola do światła jelita, wywołując szok hipowolemiczny
                    i ciężką biegankę u spragnionego ptaka. Izotonik (290 mOsm/L) nawadnia komórki w kilkanaście minut.
                  </Text>
                </View>
              </View>
            )}

            {/* TAB 3: CARBO-LIPID SHIFT & L-CARNITINE (RD-15, RD-16) */}
            {activeTab === 'carbo_lipid' && (
              <View>
                {/* Result Card */}
                <View style={[styles.resultCard, styles.borderSuccess]}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultTitle}>ZAPOTRZEBOWANIE TŁUSZCZOWE NA 48H PRZED LOTEM</Text>
                    <View style={[styles.badge, styles.badgeSuccess]}>
                      <Text style={styles.badgeText}>{shiftEval.raceDistanceKm} KM</Text>
                    </View>
                  </View>

                  <Text style={styles.phValueText}>{shiftEval.recommendedFatPercent}% Tłuszczu</Text>
                  <Text style={styles.survivalText}>
                    Węglowodany w diecie: <Text style={styles.boldWhite}>{shiftEval.recommendedCarbPercent}%</Text> •{' '}
                    L-Karnityna: <Text style={styles.boldWhite}>{shiftEval.carnitineDosageMgPerLiter} mg/L</Text>
                  </Text>
                  <Text style={styles.recommendationText}>{shiftEval.timingAdvice}</Text>
                </View>

                {/* Distance Selector */}
                <View style={styles.controlCard}>
                  <Text style={styles.controlTitle}>WYBIERZ DYSTANS PLANOWANEGO LOTU</Text>
                  <View style={styles.distancePresetsRow}>
                    {[160, 320, 480, 650, 780].map((dist) => (
                      <TouchableOpacity
                        key={dist}
                        style={[
                          styles.distBtn,
                          raceDistanceKm === dist && styles.distBtnActive,
                        ]}
                        onPress={() => setRaceDistanceKm(dist)}
                      >
                        <Text
                          style={[
                            styles.distBtnText,
                            raceDistanceKm === dist && styles.distBtnTextActive,
                          ]}
                        >
                          {dist} km
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Recommended Seeds */}
                  <Text style={[styles.controlTitle, { marginTop: 14 }]}>
                    ZALECANE ŹRÓDŁA TŁUSZCZU DLA TEGO DYSTANSU
                  </Text>
                  <View style={styles.grainPillsContainer}>
                    {shiftEval.recommendedGrains.map((grain, idx) => (
                      <View key={idx} style={styles.grainPill}>
                        <Text style={styles.grainPillText}>🌾 {grain}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Science Note */}
                <View style={styles.scienceCard}>
                  <Text style={styles.scienceTitle}>BIOLOGIA RD-15 / RD-16 (METABOLIZM MIĘŚNI)</Text>
                  <Text style={styles.scienceText}>
                    Po pierwszych 45 minutach lotu zapasy glikogenu mięśniowego ulegają wyczerpaniu,
                    a gołąb całkowicie przełącza się na spalanie kwasów tłuszczowych (9.3 kcal/g vs 4.1 kcal/g).
                    Suplementacja 1000 mg L-karnityny w czwartek i piątek aktywuje wahadłowiec mitochondrialny,
                    obniżając zakwaszenie kwasem mlekowym o 22%.
                  </Text>
                </View>
              </View>
            )}

            {/* Close Button */}
            <FieldButton
              title="Zamknij Laboratorium"
              onPress={onClose}
              style={{ marginTop: 14 }}
              variant="secondary"
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
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#121417',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pillDot: {
    color: '#4E88FF',
    fontSize: 10,
  },
  pillText: {
    color: '#4E88FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E2127',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#8E94A0',
    fontSize: 18,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#2F343F',
  },
  tabBtnText: {
    color: '#8E94A0',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  resultCard: {
    backgroundColor: '#1E2127',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  borderSuccess: {
    borderColor: '#4CAF50',
  },
  borderWarning: {
    borderColor: '#E5A93C',
  },
  borderDanger: {
    borderColor: '#E53935',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTitle: {
    color: '#8E94A0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  badgeWarning: {
    backgroundColor: 'rgba(229, 169, 60, 0.2)',
  },
  badgeDanger: {
    backgroundColor: 'rgba(229, 57, 53, 0.2)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  phValueText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 6,
  },
  survivalText: {
    color: '#D1D5DB',
    fontSize: 13,
    marginBottom: 6,
  },
  boldWhite: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  recommendationText: {
    color: '#8E94A0',
    fontSize: 12,
    lineHeight: 16,
  },
  controlCard: {
    backgroundColor: '#1E2127',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  controlTitle: {
    color: '#8E94A0',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  choiceGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  choiceBtn: {
    flex: 1,
    backgroundColor: '#121417',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  choiceBtnActive: {
    borderColor: '#4E88FF',
    backgroundColor: 'rgba(78, 136, 255, 0.1)',
  },
  choiceEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  choiceName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  choiceDose: {
    color: '#8E94A0',
    fontSize: 10,
  },
  stepperSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2F343F',
  },
  stepperSectionLabel: {
    color: '#8E94A0',
    fontSize: 12,
  },
  stepperValueText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  stepperBtnGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBtn: {
    backgroundColor: '#2F343F',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stepBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  scienceCard: {
    backgroundColor: 'rgba(78, 136, 255, 0.08)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(78, 136, 255, 0.3)',
    marginBottom: 10,
  },
  scienceTitle: {
    color: '#4E88FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  scienceText: {
    color: '#D1D5DB',
    fontSize: 12,
    lineHeight: 17,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  presetLinkBtn: {
    backgroundColor: '#2F343F',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  presetLinkText: {
    color: '#4E88FF',
    fontSize: 11,
    fontWeight: '700',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ingName: {
    color: '#8E94A0',
    fontSize: 12,
  },
  ingValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  distancePresetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  distBtn: {
    flex: 1,
    backgroundColor: '#121417',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  distBtnActive: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  distBtnText: {
    color: '#8E94A0',
    fontSize: 12,
    fontWeight: '700',
  },
  distBtnTextActive: {
    color: '#FFFFFF',
  },
  grainPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  grainPill: {
    backgroundColor: '#2A2E38',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3E4452',
  },
  grainPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

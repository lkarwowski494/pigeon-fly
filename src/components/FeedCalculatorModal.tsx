/**
 * PIGEON-FLY — FeedCalculatorModal (BR-ZDR-006)
 * Interactive 20-Grain Feed Compounder and Biochemical Nutrition Lab.
 * Formulates custom mixes with live crude protein, fat, carbohydrates, fiber,
 * and metabolizable energy (MJ/kg) gauges and master biological suitability scoring.
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
  calculateMixNutrients,
  validateMixTotalPercent,
  evaluateMixSuitability,
  GRAIN_DATABASE,
  MASTER_FEED_PRESETS,
  MixIngredient,
  MixPurpose,
} from '../domain/feedCompounder';
import { FieldButton } from './FieldButton';

export interface FeedCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveRecipe?: (recipe: { name: string; ingredients: MixIngredient[] }) => void;
}

export function FeedCalculatorModal({
  visible,
  onClose,
  onSaveRecipe,
}: FeedCalculatorModalProps) {
  const [ingredients, setIngredients] = useState<MixIngredient[]>(
    MASTER_FEED_PRESETS[0].ingredients
  );
  const [activePurpose, setActivePurpose] = useState<MixPurpose>('racing_speed');

  const nutrients = calculateMixNutrients(ingredients);
  const validation = validateMixTotalPercent(ingredients);
  const suitability = evaluateMixSuitability(nutrients, activePurpose);

  const handleLoadPreset = (preset: (typeof MASTER_FEED_PRESETS)[0]) => {
    setIngredients(preset.ingredients);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const handleAdjustPercent = (grainId: string, delta: number) => {
    const existing = ingredients.find((i) => i.grainId === grainId);
    let updated: MixIngredient[];

    if (existing) {
      const newPct = Math.max(0, existing.percentage + delta);
      if (newPct === 0) {
        updated = ingredients.filter((i) => i.grainId !== grainId);
      } else {
        updated = ingredients.map((i) =>
          i.grainId === grainId ? { ...i, percentage: newPct } : i
        );
      }
    } else if (delta > 0) {
      updated = [...ingredients, { grainId, percentage: delta }];
    } else {
      return;
    }

    setIngredients(updated);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const handleSave = () => {
    if (!validation.isValid) {
      Alert.alert(
        'Niepoprawny udział ziaren',
        `Suma składników wynosi ${validation.totalPercent}%. Musi wynosić dokładnie 100%.`
      );
      return;
    }

    if (onSaveRecipe) {
      onSaveRecipe({
        name: `Receptura (${nutrients.proteinPct}% B, ${nutrients.fatPct}% T)`,
        ingredients,
      });
    }
    Alert.alert('Zapisano recepturę paszową!', 'Receptura została utrwalona w dzienniku żywienia stada.');
    onClose();
  };

  const purposeOptions: { key: MixPurpose; label: string }[] = [
    { key: 'racing_speed', label: 'Loty Krótkie' },
    { key: 'racing_marathon', label: 'Maraton' },
    { key: 'breeding_rearing', label: 'Lęgi' },
    { key: 'depurative', label: 'Depuratywna' },
    { key: 'moult', label: 'Pierzenie' },
  ];

  const activeGrainsMap = new Map<string, number>();
  ingredients.forEach((i) => activeGrainsMap.set(i.grainId, i.percentage));

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>LABORATORIUM PASZOWE 20 ZIAREN</Text>
                <Text style={styles.subtitle}>Kalkulator Mieszanek i Bilans Makro (BR-ZDR-006)</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="btn-close-feed-calc">
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Presets Row */}
            <Text style={styles.sectionHeading}>SZABLONY MISTRZOWSKICH MIESZANEK</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScroll}>
              {MASTER_FEED_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.name}
                  onPress={() => handleLoadPreset(preset)}
                  style={styles.presetChip}
                >
                  <Text style={styles.presetName}>{preset.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Macro Gauges Display Card */}
            <View style={styles.macroCard}>
              <View style={styles.macroTopRow}>
                <Text style={styles.macroTitle}>BILANS BIOCHEMICZNY MIESZANKI</Text>
                <View
                  style={[
                    styles.validationBadge,
                    { backgroundColor: validation.isValid ? '#1B5E20' : '#B71C1C' },
                  ]}
                >
                  <Text style={styles.validationText}>
                    SUMA: {validation.totalPercent}% {validation.isValid ? '✓' : '(≠100%)'}
                  </Text>
                </View>
              </View>

              <View style={styles.gaugesRow}>
                <View style={styles.gaugeCol}>
                  <Text style={styles.gaugeVal}>{nutrients.proteinPct}%</Text>
                  <Text style={styles.gaugeLbl}>Białko</Text>
                </View>
                <View style={styles.gaugeCol}>
                  <Text style={[styles.gaugeVal, { color: '#FFD54F' }]}>{nutrients.fatPct}%</Text>
                  <Text style={styles.gaugeLbl}>Tłuszcz</Text>
                </View>
                <View style={styles.gaugeCol}>
                  <Text style={[styles.gaugeVal, { color: '#64B5F6' }]}>{nutrients.carbsPct}%</Text>
                  <Text style={styles.gaugeLbl}>Węglowodany</Text>
                </View>
                <View style={styles.gaugeCol}>
                  <Text style={[styles.gaugeVal, { color: '#81C784' }]}>{nutrients.fiberPct}%</Text>
                  <Text style={styles.gaugeLbl}>Włókno</Text>
                </View>
                <View style={styles.gaugeCol}>
                  <Text style={[styles.gaugeVal, { color: '#FF8A65' }]}>
                    {nutrients.energyMjKg}
                  </Text>
                  <Text style={styles.gaugeLbl}>MJ/kg</Text>
                </View>
              </View>
            </View>

            {/* Target Purpose Tabs & Evaluation Verdict */}
            <View style={styles.purposeCard}>
              <Text style={styles.purposeTitle}>PRZEZNACZENIE I OCENA BIOLOGICZNA</Text>
              <View style={styles.purposeTabsRow}>
                {purposeOptions.map((opt) => {
                  const isActive = activePurpose === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => setActivePurpose(opt.key)}
                      style={[styles.purposeTab, isActive && styles.purposeTabActive]}
                    >
                      <Text style={[styles.purposeTabText, isActive && styles.purposeTabTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.suitabilityBox}>
                <View style={styles.suitabilityScoreRow}>
                  <Text style={styles.verdictText}>{suitability.verdict}</Text>
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreText}>{suitability.score}/100</Text>
                  </View>
                </View>
                <Text style={styles.recommendationText}>{suitability.recommendation}</Text>
              </View>
            </View>

            {/* Grain Ingredients Composition List */}
            <Text style={styles.sectionHeading}>SKŁADNIKI PASZOWE (USTAW UDZIAŁ %)</Text>
            {Object.values(GRAIN_DATABASE).map((grain) => {
              const currentPct = activeGrainsMap.get(grain.id) || 0;
              const isActive = currentPct > 0;

              return (
                <View key={grain.id} style={[styles.grainRow, isActive && styles.grainRowActive]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.grainName, isActive && { color: '#FFFFFF' }]}>
                      {grain.name}
                    </Text>
                    <Text style={styles.grainSpecs}>
                      B: {grain.proteinPct}% • T: {grain.fatPct}% • W: {grain.carbsPct}% • {grain.energyMjKg} MJ/kg
                    </Text>
                  </View>

                  <View style={styles.controlsCol}>
                    <TouchableOpacity
                      onPress={() => handleAdjustPercent(grain.id, -5)}
                      style={styles.stepBtn}
                      testID={`btn-dec-${grain.id}`}
                    >
                      <Text style={styles.stepBtnText}>-5</Text>
                    </TouchableOpacity>

                    <Text style={[styles.grainPctValue, isActive && { color: '#E5A93C' }]}>
                      {currentPct}%
                    </Text>

                    <TouchableOpacity
                      onPress={() => handleAdjustPercent(grain.id, 5)}
                      style={styles.stepBtn}
                      testID={`btn-inc-${grain.id}`}
                    >
                      <Text style={styles.stepBtnText}>+5</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* Save Mix Button */}
            <FieldButton
              title="Zapisz Recepturę do Diety"
              onPress={handleSave}
              variant="primary"
              style={{ marginTop: 14 }}
              testID="btn-save-feed-recipe"
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
    backgroundColor: '#1E2127',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '94%',
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
    fontSize: 11,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
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
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E94A0',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  presetsScroll: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  presetChip: {
    backgroundColor: '#15171C',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  presetName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E5A93C',
  },
  macroCard: {
    backgroundColor: '#15171C',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    padding: 14,
    marginBottom: 14,
  },
  macroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  macroTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E94A0',
    letterSpacing: 0.6,
  },
  validationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  validationText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  gaugesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gaugeCol: {
    alignItems: 'center',
  },
  gaugeVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  gaugeLbl: {
    fontSize: 10,
    color: '#8E94A0',
    marginTop: 2,
  },
  purposeCard: {
    backgroundColor: '#15171C',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    padding: 14,
    marginBottom: 14,
  },
  purposeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E94A0',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  purposeTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  purposeTab: {
    flex: 1,
    backgroundColor: '#1E2127',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  purposeTabActive: {
    backgroundColor: '#2A2417',
    borderColor: '#E5A93C',
  },
  purposeTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E94A0',
  },
  purposeTabTextActive: {
    color: '#E5A93C',
    fontWeight: '800',
  },
  suitabilityBox: {
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 12,
  },
  suitabilityScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  verdictText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  scoreBadge: {
    backgroundColor: '#2A303C',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#E5A93C',
    fontFamily: 'monospace',
  },
  recommendationText: {
    fontSize: 12,
    color: '#A0A6B2',
    lineHeight: 17,
  },
  grainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15171C',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2F343F',
    padding: 10,
    marginBottom: 6,
  },
  grainRowActive: {
    borderColor: '#3E4654',
    backgroundColor: '#191C22',
  },
  grainName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4D8E0',
  },
  grainSpecs: {
    fontSize: 10,
    color: '#8E94A0',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  controlsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  stepBtn: {
    backgroundColor: '#262A34',
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D4452',
  },
  stepBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  grainPctValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8E94A0',
    fontFamily: 'monospace',
    minWidth: 38,
    textAlign: 'center',
  },
});

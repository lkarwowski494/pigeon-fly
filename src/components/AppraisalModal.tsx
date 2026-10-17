/**
 * PIGEON-FLY — AppraisalModal
 * Interactive physical conformation, eye sign, and wing evaluation modal.
 * Calculates standard FCI Olympiad score (90.00 - 95.00 pts) and distance suitability.
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
import { Pigeon } from '../domain/types';
import {
  calculateAppraisalScore,
  EyeColor,
  EyeSignRing,
  KeelStrength,
  BackStrength,
  WingVentilation,
  AppraisalResult,
} from '../domain/appraisal';
import {
  calculateMarketValuation,
  BloodlineTier,
  PigeonRole,
  PigeonMarketValuation,
} from '../domain/valuation';
import { FieldButton } from './FieldButton';

export interface AppraisalModalProps {
  visible: boolean;
  pigeon: Pigeon | null;
  onClose: () => void;
  onSaveAppraisal?: (result: AppraisalResult) => void;
}

export function AppraisalModal({
  visible,
  pigeon,
  onClose,
  onSaveAppraisal,
}: AppraisalModalProps) {
  if (!pigeon) return null;

  const [activeTab, setActiveTab] = useState<'conformation' | 'valuation'>('conformation');

  // Conformation state
  const [eyeColor, setEyeColor] = useState<EyeColor>('pearl');
  const [eyeSignRing, setEyeSignRing] = useState<EyeSignRing>('standing');
  const [keelStrength, setKeelStrength] = useState<KeelStrength>('tight_closed');
  const [backStrength, setBackStrength] = useState<BackStrength>('rock_solid');
  const [muscleScore, setMuscleScore] = useState<number>(4);
  const [featherScore, setFeatherScore] = useState<number>(5);
  const [wingVentilation, setWingVentilation] = useState<WingVentilation>('excellent');
  const [wingStepGap, setWingStepGap] = useState<boolean>(true);

  // Valuation state (Z-048)
  const defaultRole: PigeonRole =
    pigeon.status === 'breeding'
      ? 'breeder'
      : pigeon.year === new Date().getFullYear()
      ? 'youngster'
      : 'racer';
  const [role, setRole] = useState<PigeonRole>(defaultRole);
  const [totalPrizes, setTotalPrizes] = useState<number>(4);
  const [firstPrizes, setFirstPrizes] = useState<number>(0);
  const [bloodlineTier, setBloodlineTier] = useState<BloodlineTier>('regional_winner');
  const [inbreedingCoeff, setInbreedingCoeff] = useState<number>(6.25);

  const evaluation: AppraisalResult = calculateAppraisalScore({
    pigeonId: pigeon.id,
    ringNumber: pigeon.ringNumber,
    eyeColor,
    eyeSignRing,
    keelStrength,
    backStrength,
    pectoralMuscleFlexibility: muscleScore,
    featherSilkyPowder: featherScore,
    wingVentilation,
    wingStepGap,
  });

  const marketValuation: PigeonMarketValuation = calculateMarketValuation({
    ringNumber: pigeon.ringNumber,
    ageYears: pigeon.year ? new Date().getFullYear() - pigeon.year : 2,
    sex: pigeon.sex === 'cock' || pigeon.sex === 'hen' ? pigeon.sex : undefined,
    role,
    totalPrizes,
    firstPrizes,
    bloodlineTier,
    inbreedingCoefficient: inbreedingCoeff,
    conformationScoreFci: evaluation.scoreStandardFci,
  });

  const handleSave = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    if (onSaveAppraisal) {
      onSaveAppraisal(evaluation);
    }
    Alert.alert(
      'Zapisano Ocenę & Wycenę!',
      `Ocena FCI: ${evaluation.scoreStandardFci.toFixed(2)} pkt\nWycena rynkowa: ${marketValuation.estimatedValuePln.median} PLN (~${marketValuation.estimatedValueEur.median} EUR)\nKategoria: ${marketValuation.tierTitle}`
    );
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>OCENA BUDOWY & WYCENA RYNKOWA</Text>
                <Text style={styles.subtitle}>
                  {pigeon.countryCode}-{pigeon.ringNumber} ({pigeon.year})
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'conformation' && styles.tabBtnActive]}
                onPress={() => setActiveTab('conformation')}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === 'conformation' && styles.tabBtnTextActive,
                  ]}
                >
                  🔬 Budowa i Fenotyp FCI
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'valuation' && styles.tabBtnActive]}
                onPress={() => setActiveTab('valuation')}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === 'valuation' && styles.tabBtnTextActive,
                  ]}
                >
                  💎 Wycena Rynkowa (PLN/EUR)
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB 1: CONFORMATION */}
            {activeTab === 'conformation' && (
              <View>

            {/* Score & Category Hero Banner */}
            <View style={styles.heroCard}>
              <Text style={styles.heroScoreLabel}>PUNKTY STANDARD FCI (OLIMPIADA)</Text>
              <Text style={styles.heroScoreValue}>{evaluation.scoreStandardFci.toFixed(2)}</Text>
              <View style={styles.suitabilityBadge}>
                <Text style={styles.suitabilityText}>{evaluation.suitabilityTitle}</Text>
              </View>
              <Text style={styles.summaryText}>{evaluation.breederSummary}</Text>
            </View>

            {/* 1. Keel & Pelvis */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>1. WIDEŁKI MIEDNICOWE & MOSTEK:</Text>
              <View style={styles.chipsRow}>
                {(
                  [
                    { key: 'tight_closed', label: 'Zwarte jak skała (Idealne)' },
                    { key: 'medium', label: 'Średnio zwarte' },
                    { key: 'wide_open', label: 'Rozwarte' },
                  ] as const
                ).map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setKeelStrength(opt.key)}
                    style={[styles.chip, keelStrength === opt.key && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, keelStrength === opt.key && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 2. Back Firmness */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>2. GRZBIET I KUPER:</Text>
              <View style={styles.chipsRow}>
                {(
                  [
                    { key: 'rock_solid', label: 'Twardy i szeroki' },
                    { key: 'medium', label: 'Prawidłowy' },
                    { key: 'weak', label: 'Miękki / Wąski' },
                  ] as const
                ).map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setBackStrength(opt.key)}
                    style={[styles.chip, backStrength === opt.key && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, backStrength === opt.key && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 3. Eye Sign */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>3. ZNAK OKA (PIERŚCIEŃ KORELACJI):</Text>
              <View style={styles.chipsRow}>
                {(
                  [
                    { key: 'standing', label: 'Stojący (Szybkościowy)' },
                    { key: 'full_circle', label: 'Pełny okrąg (Rozpłód)' },
                    { key: 'inner_speed', label: 'Wewnętrzny sprinterski' },
                    { key: 'absent', label: 'Brak pierścienia' },
                  ] as const
                ).map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setEyeSignRing(opt.key)}
                    style={[styles.chip, eyeSignRing === opt.key && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, eyeSignRing === opt.key && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 4. Wing Ventilation */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>4. WENTYLACJA SKRZYDŁA (LOTKI 7-10):</Text>
              <View style={styles.chipsRow}>
                {(
                  [
                    { key: 'excellent', label: 'Głęboka (Maraton)' },
                    { key: 'moderate', label: 'Umiarkowana' },
                    { key: 'poor', label: 'Wąska' },
                  ] as const
                ).map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setWingVentilation(opt.key)}
                    style={[styles.chip, wingVentilation === opt.key && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, wingVentilation === opt.key && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => setWingStepGap(!wingStepGap)}
                style={[styles.toggleBtn, wingStepGap && styles.toggleBtnActive]}
              >
                <Text style={styles.toggleBtnText}>
                  {wingStepGap ? '✓ Wyraźny uskok skrzydełkowy (OK)' : 'Brak uskoku skrzydełkowego'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Strengths & Weaknesses */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>ATUTY FENOTYPOWE:</Text>
              {evaluation.strengths.map((s, idx) => (
                <Text key={idx} style={styles.strengthItem}>
                  ✓ {s}
                </Text>
              ))}
              {evaluation.weaknesses.length > 0 && (
                <>
                  <Text style={[styles.sectionHeading, { marginTop: 10, color: '#E53935' }]}>
                    PUNKTY DO POPRAWY W ROZPŁODZIE:
                  </Text>
                  {evaluation.weaknesses.map((w, idx) => (
                    <Text key={idx} style={styles.weaknessItem}>
                      ⚠️ {w}
                    </Text>
                  ))}
                </>
              )}
            </View>
          </View>
        )}

        {/* TAB 2: VALUATION */}
        {activeTab === 'valuation' && (
          <View>
            {/* Hero Valuation Banner */}
            <View style={styles.valHeroCard}>
              <Text style={styles.heroScoreLabel}>SZACOWANA WARTOŚĆ RYNKOWA (MEDIANA)</Text>
              <Text style={styles.valMedian}>{marketValuation.estimatedValuePln.median} PLN</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#6EE7B7' }}>
                ~{marketValuation.estimatedValueEur.median} EUR
              </Text>
              <Text style={styles.valRange}>
                Widełki: {marketValuation.estimatedValuePln.min} - {marketValuation.estimatedValuePln.max} PLN
              </Text>
              <View
                style={[
                  styles.suitabilityBadge,
                  { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                ]}
              >
                <Text style={[styles.suitabilityText, { color: '#10B981' }]}>
                  {marketValuation.tierTitle}
                </Text>
              </View>
              <Text style={styles.summaryText}>{marketValuation.valuationSummary}</Text>
            </View>

            {/* Rola Ptaka */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>STATUS / ROLA W GOŁĘBNIKU:</Text>
              <View style={styles.chipsRow}>
                {(
                  [
                    { key: 'racer', label: '🏆 Lotnik' },
                    { key: 'breeder', label: '🧬 Rozpłodowiec' },
                    { key: 'youngster', label: '🐣 Młódek' },
                  ] as const
                ).map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setRole(opt.key)}
                    style={[styles.chip, role === opt.key && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, role === opt.key && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Dorobek konkursowy */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>LICZBA KONKURSÓW W KARIERZE (BAZA 20%):</Text>
              <View style={styles.chipsRow}>
                {[0, 3, 7, 12, 20].map((num) => (
                  <TouchableOpacity
                    key={num}
                    onPress={() => setTotalPrizes(num)}
                    style={[styles.chip, totalPrizes === num && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, totalPrizes === num && styles.chipTextActive]}>
                      {num} konk.
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionHeading, { marginTop: 12 }]}>
                ZWYCIĘSTWA W LOCIE (1. NAGRODY):
              </Text>
              <View style={styles.chipsRow}>
                {[0, 1, 2, 4].map((num) => (
                  <TouchableOpacity
                    key={num}
                    onPress={() => setFirstPrizes(num)}
                    style={[styles.chip, firstPrizes === num && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, firstPrizes === num && styles.chipTextActive]}>
                      {num === 0 ? 'Brak' : `${num}x 1. konkurs`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Linia rodowodowa */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>LINIA RODOWODOWA (PREMIA GENETYCZNA):</Text>
              <View style={styles.chipsRow}>
                {(
                  [
                    { key: 'ordinary', label: 'Zwykła użytkowa' },
                    { key: 'regional_winner', label: 'Mistrzowie Okręgu (+25%)' },
                    { key: 'national_ace_bloodline', label: 'Asy Narodowe (+60%)' },
                    { key: 'olympic_dynasty', label: 'Dynastia Olimpijska (+120%)' },
                  ] as const
                ).map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setBloodlineTier(opt.key)}
                    style={[styles.chip, bloodlineTier === opt.key && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, bloodlineTier === opt.key && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Inbred Wrighta */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>WSPÓŁCZYNNIK INBREDU WRIGHTA (F):</Text>
              <View style={styles.chipsRow}>
                {[
                  { val: 0, label: 'Outcross (0%)' },
                  { val: 6.25, label: 'Optymalny (6.25%)' },
                  { val: 12.5, label: 'Średni (12.5%)' },
                  { val: 25.0, label: 'Ciasny (25%)' },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.val}
                    onPress={() => setInbreedingCoeff(opt.val)}
                    style={[styles.chip, inbreedingCoeff === opt.val && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, inbreedingCoeff === opt.val && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Breakdown składowych */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>SKŁADOWE ELEMENTY WYCENY:</Text>
              {marketValuation.breakdown.map((item, idx) => (
                <View key={idx} style={styles.breakdownItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.breakdownCat}>{item.category}</Text>
                    <Text style={styles.breakdownDesc}>{item.description}</Text>
                  </View>
                  <Text style={styles.breakdownVal}>+{item.plnValue} PLN</Text>
                </View>
              ))}
            </View>

            {/* Rekomendacja aukcyjna */}
            <View style={styles.auctionBox}>
              <Text style={styles.auctionTitle}>🏷️ REKOMENDACJA AUKCYJNA DLA HODOWCY</Text>
              <View style={styles.auctionRow}>
                <Text style={styles.auctionLabel}>Cena wywoławcza:</Text>
                <Text style={styles.auctionValue}>
                  {marketValuation.auctionRecommendation.startingBidPln} PLN
                </Text>
              </View>
              <View style={styles.auctionRow}>
                <Text style={styles.auctionLabel}>Cena minimalna (rezerwa):</Text>
                <Text style={styles.auctionValue}>
                  {marketValuation.auctionRecommendation.reservePricePln} PLN
                </Text>
              </View>
              {marketValuation.auctionRecommendation.buyNowPln && (
                <View style={styles.auctionRow}>
                  <Text style={styles.auctionLabel}>Kup Teraz:</Text>
                  <Text style={[styles.auctionValue, { color: '#E5A93C' }]}>
                    {marketValuation.auctionRecommendation.buyNowPln} PLN
                  </Text>
                </View>
              )}
              <View style={styles.auctionRow}>
                <Text style={styles.auctionLabel}>Rekomendowane miejsce:</Text>
                <Text style={[styles.auctionValue, { color: '#60A5FA' }]}>
                  {marketValuation.auctionRecommendation.recommendedPlatform ===
                  'international_pipa_herbots'
                    ? 'Portal międzynarodowy (PIPA / Herbots)'
                    : marketValuation.auctionRecommendation.recommendedPlatform ===
                      'national_auction'
                    ? 'Krajowa aukcja internetowa'
                    : 'Lokalna aukcja sekcyjna'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Save Button */}
        <FieldButton
          title="💾 Zapisz Ocenę i Wycenę Ptaka w Notesie"
          onPress={handleSave}
          testID="btn-save-appraisal"
          style={{ marginTop: 12 }}
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
    color: '#D4D8E0',
    fontWeight: '700',
    fontFamily: 'monospace',
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
  heroCard: {
    backgroundColor: '#15171C',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E5A93C',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroScoreLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E94A0',
    letterSpacing: 0.8,
  },
  heroScoreValue: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'monospace',
    marginVertical: 4,
  },
  suitabilityBadge: {
    backgroundColor: '#2A2417',
    borderColor: '#E5A93C',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  suitabilityText: {
    color: '#E5A93C',
    fontSize: 12,
    fontWeight: '800',
  },
  summaryText: {
    fontSize: 12,
    color: '#D4D8E0',
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: '#15171C',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#1E2127',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  chipActive: {
    backgroundColor: 'rgba(229, 169, 60, 0.2)',
    borderColor: '#E5A93C',
  },
  chipText: {
    fontSize: 11,
    color: '#8E94A0',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#E5A93C',
    fontWeight: '700',
  },
  toggleBtn: {
    backgroundColor: '#1E2127',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginTop: 8,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#4CAF50',
  },
  toggleBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  strengthItem: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  weaknessItem: {
    color: '#E53935',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#15171C',
    borderWidth: 1,
    borderColor: '#2F343F',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabBtnActive: {
    backgroundColor: '#E5A93C',
    borderColor: '#E5A93C',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
  },
  tabBtnTextActive: {
    color: '#121417',
    fontWeight: '900',
  },
  valHeroCard: {
    backgroundColor: '#15171C',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#10B981',
    alignItems: 'center',
    marginBottom: 14,
  },
  valMedian: {
    fontSize: 34,
    fontWeight: '900',
    color: '#10B981',
    fontFamily: 'monospace',
    marginVertical: 4,
  },
  valRange: {
    fontSize: 12,
    color: '#D4D8E0',
    fontWeight: '700',
    marginTop: 4,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
  },
  breakdownCat: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  breakdownDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#10B981',
    fontFamily: 'monospace',
  },
  auctionBox: {
    backgroundColor: '#16191E',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5A93C',
    marginTop: 6,
    marginBottom: 6,
  },
  auctionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#E5A93C',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  auctionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  auctionLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
  },
  auctionValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '900',
  },
});

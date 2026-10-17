/**
 * PIGEON-FLY — Intelligent Pairing Assistant Modal (Z-052)
 * AI breeding pairing evaluation modal: physical trait compensation,
 * Wright's inbreeding F safety analysis, and anticipated chick traits.
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  evaluateBreedingPair,
  BreederBirdProfile,
  ForearmLength,
  PrimaryFlightsType,
  MuscleElasticity,
  VentBonesTightness,
  EyeSignCircle,
  RaceCategorySpecialty,
} from '../domain/pairingAssistant';

interface PairingAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyPairing?: (cockRing: string, henRing: string, inbreedingF: number) => void;
}

const PRESET_COCKS: BreederBirdProfile[] = [
  {
    id: 'cock-01',
    ringNumber: 'PL-0284-21-1402',
    name: 'Super As 1402 (Vandenabeele)',
    sex: 'cock',
    bloodline: 'Gaby Vandenabeele',
    conformation: {
      forearm: 'short',
      primaryFlights: 'long_ventilated',
      muscle: 'fibrillar_supple',
      ventBones: 'tight_rock_hard',
      eyeCircle: 'full_360',
    },
    raceSpecialty: 'middle_B',
    totalPrizesWon: 22,
    fciAcePoints: 92,
  },
  {
    id: 'cock-02',
    ringNumber: 'DV-01234-24-512',
    name: 'Błyskawica 512 (Heremans)',
    sex: 'cock',
    bloodline: 'Leo Heremans',
    conformation: {
      forearm: 'short',
      primaryFlights: 'short_broad',
      muscle: 'fibrillar_supple',
      ventBones: 'tight_rock_hard',
      eyeCircle: 'partial_half',
    },
    raceSpecialty: 'sprint_A',
    totalPrizesWon: 14,
    fciAcePoints: 85,
  },
  {
    id: 'cock-03',
    ringNumber: 'PL-0284-20-888',
    name: 'Maratończyk 888 (Aarden)',
    sex: 'cock',
    bloodline: 'Jan Aarden',
    conformation: {
      forearm: 'medium',
      primaryFlights: 'long_ventilated',
      muscle: 'fibrillar_supple',
      ventBones: 'tight_rock_hard',
      eyeCircle: 'full_360',
    },
    raceSpecialty: 'marathon_M',
    totalPrizesWon: 16,
    fciAcePoints: 89,
  },
];

const PRESET_HENS: BreederBirdProfile[] = [
  {
    id: 'hen-01',
    ringNumber: 'BE-22-6012345',
    name: 'Golden Vandenabeele 345',
    sex: 'hen',
    bloodline: 'Gaby Vandenabeele',
    conformation: {
      forearm: 'medium',
      primaryFlights: 'long_ventilated',
      muscle: 'fibrillar_supple',
      ventBones: 'tight_rock_hard',
      eyeCircle: 'full_360',
    },
    raceSpecialty: 'middle_B',
    totalPrizesWon: 12,
    fciAcePoints: 86,
  },
  {
    id: 'hen-02',
    ringNumber: 'PL-0284-23-7711',
    name: 'Córka Olimpijki 711',
    sex: 'hen',
    bloodline: 'Dirk van den Bulck',
    conformation: {
      forearm: 'short',
      primaryFlights: 'short_broad',
      muscle: 'medium_firm',
      ventBones: 'tight_rock_hard',
      eyeCircle: 'partial_half',
    },
    raceSpecialty: 'sprint_A',
    totalPrizesWon: 8,
    fciAcePoints: 80,
  },
  {
    id: 'hen-03',
    ringNumber: 'NL-22-1987654',
    name: 'Barcelona Lady 654',
    sex: 'hen',
    bloodline: 'Jelle Jellema',
    conformation: {
      forearm: 'long',
      primaryFlights: 'long_ventilated',
      muscle: 'fibrillar_supple',
      ventBones: 'tight_rock_hard',
      eyeCircle: 'full_360',
    },
    raceSpecialty: 'marathon_M',
    totalPrizesWon: 10,
    fciAcePoints: 84,
  },
];

export const PairingAssistantModal: React.FC<PairingAssistantModalProps> = ({
  visible,
  onClose,
  onApplyPairing,
}) => {
  const [selectedCockIdx, setSelectedCockIdx] = useState(0);
  const [selectedHenIdx, setSelectedHenIdx] = useState(0);
  const [manualInbreedingF, setManualInbreedingF] = useState<number | undefined>(0.0625);

  const currentCock = PRESET_COCKS[selectedCockIdx];
  const currentHen = PRESET_HENS[selectedHenIdx];

  const result = evaluateBreedingPair(currentCock, currentHen, {
    calculatedInbreedingF: manualInbreedingF,
  });

  const handleApply = () => {
    if (onApplyPairing) {
      onApplyPairing(
        currentCock.ringNumber,
        currentHen.ringNumber,
        result.inbreedingCoefficientF
      );
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>🤖 Asystent Kojarzeń AI</Text>
            <Text style={styles.subtitle}>
              Kompensacja cech budowy & Inbred Wrighta F
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            testID="btn-close-pairing-assistant"
            accessibilityRole="button"
          >
            <Text style={styles.closeBtnText}>✕ Zamknij</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Quick Preset Pairs Bar */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>1. Wybierz Samca (Ojciec):</Text>
            <View style={styles.pillsRow}>
              {PRESET_COCKS.map((c, idx) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.birdPill,
                    selectedCockIdx === idx && styles.birdPillActive,
                  ]}
                  onPress={() => setSelectedCockIdx(idx)}
                >
                  <Text
                    style={[
                      styles.birdPillText,
                      selectedCockIdx === idx && styles.birdPillTextActive,
                    ]}
                  >
                    ♂ {c.ringNumber}
                  </Text>
                  <Text style={styles.birdPillSub}>{c.bloodline}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>2. Wybierz Samicę (Matka):</Text>
            <View style={styles.pillsRow}>
              {PRESET_HENS.map((h, idx) => (
                <TouchableOpacity
                  key={h.id}
                  style={[
                    styles.birdPill,
                    selectedHenIdx === idx && styles.birdPillActiveHen,
                  ]}
                  onPress={() => setSelectedHenIdx(idx)}
                >
                  <Text
                    style={[
                      styles.birdPillText,
                      selectedHenIdx === idx && styles.birdPillTextActive,
                    ]}
                  >
                    ♀ {h.ringNumber}
                  </Text>
                  <Text style={styles.birdPillSub}>{h.bloodline}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Inbreeding F Mode Selector */}
          <View style={styles.inbreedingBar}>
            <Text style={styles.inbreedingTitle}>Współczynnik Inbredu Wrighta F:</Text>
            <View style={styles.inbreedingBtnRow}>
              <TouchableOpacity
                style={[
                  styles.inbreedBtn,
                  manualInbreedingF === 0.0 && styles.inbreedBtnActive,
                ]}
                onPress={() => setManualInbreedingF(0.0)}
              >
                <Text style={styles.inbreedBtnText}>Outcross (0%)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.inbreedBtn,
                  manualInbreedingF === 0.0625 && styles.inbreedBtnActive,
                ]}
                onPress={() => setManualInbreedingF(0.0625)}
              >
                <Text style={styles.inbreedBtnText}>Liniowy (6.25%)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.inbreedBtn,
                  manualInbreedingF === 0.25 && styles.inbreedBtnActive,
                ]}
                onPress={() => setManualInbreedingF(0.25)}
              >
                <Text style={styles.inbreedBtnText}>Bliski (25%)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* AI Score & Tier Card */}
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View>
                <Text style={styles.scoreText}>
                  {result.overallScore}
                  <Text style={styles.scoreMax}> / 100 pkt</Text>
                </Text>
                <Text style={styles.tierLabel}>{result.tierLabel}</Text>
              </View>
              <View
                style={[
                  styles.statusPill,
                  result.tier === 'elite_champion' && styles.statusElite,
                  result.tier === 'highly_recommended' && styles.statusRec,
                  result.tier === 'acceptable' && styles.statusAcc,
                  result.tier === 'not_recommended' && styles.statusRisk,
                ]}
              >
                <Text style={styles.statusPillText}>
                  {result.tier === 'elite_champion'
                    ? 'ELITA ROZPŁODU'
                    : result.tier === 'highly_recommended'
                    ? 'BARDZO SILNA'
                    : result.tier === 'acceptable'
                    ? 'AKCEPTOWALNA'
                    : 'RYZYKOWNA'}
                </Text>
              </View>
            </View>

            {/* Score Breakdown Bars */}
            <View style={styles.breakdownBox}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Kompensacja Budowy Ciała:</Text>
                <Text style={styles.breakdownVal}>
                  {result.breakdown.conformationCompensationScore} / 35 pkt
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Czystość Genetyczna / Inbred F:</Text>
                <Text style={styles.breakdownVal}>
                  {result.breakdown.geneticDiversityScore} / 35 pkt
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Potencjał Wyczynowy & Dystans:</Text>
                <Text style={styles.breakdownVal}>
                  {result.breakdown.racePerformanceScore} / 30 pkt
                </Text>
              </View>
            </View>

            {/* Inbreeding evaluation note */}
            <View
              style={[
                styles.evalBox,
                result.isHighInbreedingRisk && styles.evalBoxRisk,
              ]}
            >
              <Text style={styles.evalBoxTitle}>🧬 Ocena Pokrewieństwa:</Text>
              <Text style={styles.evalBoxContent}>{result.inbreedingEvaluation}</Text>
            </View>

            {/* Anticipated Chick Traits */}
            {result.anticipatedChickTraits.length > 0 && (
              <View style={styles.traitsBox}>
                <Text style={styles.traitsTitle}>🐣 Przewidywane Cechy Potomstwa:</Text>
                {result.anticipatedChickTraits.map((t, idx) => (
                  <Text key={idx} style={styles.traitBullet}>
                    • {t}
                  </Text>
                ))}
              </View>
            )}

            {/* AI Advice Box */}
            <View style={styles.adviceBox}>
              <Text style={styles.adviceTitle}>💡 Ekspertyza Trenera AI:</Text>
              <Text style={styles.adviceContent}>{result.aiBreedingAdvice}</Text>
            </View>
          </View>

          {/* Spacer */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Footer Apply Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={handleApply}
            testID="btn-confirm-pairing"
            accessibilityRole="button"
          >
            <Text style={styles.applyBtnText}>
              💍 ZATWIERDŹ PARĘ (♂ {currentCock.ringNumber} x ♀ {currentHen.ringNumber})
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#334155',
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#F8FAFC',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionCard: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  birdPill: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  birdPillActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#3B82F6',
  },
  birdPillActiveHen: {
    backgroundColor: '#831843',
    borderColor: '#EC4899',
  },
  birdPillText: {
    color: '#CBD5E1',
    fontWeight: 'bold',
    fontSize: 12,
  },
  birdPillTextActive: {
    color: '#FFFFFF',
  },
  birdPillSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  inbreedingBar: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inbreedingTitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
    fontWeight: '600',
  },
  inbreedingBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inbreedBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  inbreedBtnActive: {
    backgroundColor: '#2563EB',
  },
  inbreedBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  scoreMax: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: 'normal',
  },
  tierLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#60A5FA',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusElite: {
    backgroundColor: '#065F46',
  },
  statusRec: {
    backgroundColor: '#1E40AF',
  },
  statusAcc: {
    backgroundColor: '#854D0E',
  },
  statusRisk: {
    backgroundColor: '#991B1B',
  },
  statusPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  breakdownBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  breakdownVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E2E8F0',
  },
  evalBox: {
    backgroundColor: '#0F2942',
    borderColor: '#1E40AF',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  evalBoxRisk: {
    backgroundColor: '#450A0A',
    borderColor: '#DC2626',
  },
  evalBoxTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#60A5FA',
    marginBottom: 2,
  },
  evalBoxContent: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 16,
  },
  traitsBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  traitsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 4,
  },
  traitBullet: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 16,
    marginBottom: 2,
  },
  adviceBox: {
    backgroundColor: '#064E3B',
    borderColor: '#059669',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  adviceTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#A7F3D0',
    marginBottom: 4,
  },
  adviceContent: {
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  applyBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 56, // Field Mode compliant
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
});

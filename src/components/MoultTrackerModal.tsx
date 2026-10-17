/**
 * PIGEON-FLY — Advanced Moult Progress Tracker Modal (Z-055)
 * Interactive 10-primary-feather inspection, blood quill basketing barriers,
 * and keratin regeneration nutrition protocol.
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
import {
  evaluatePigeonMoult,
  PigeonMoultProfile,
  PrimaryFeatherDetail,
  FeatherGrowthStage,
} from '../domain/moultTracker';

interface MoultTrackerModalProps {
  visible: boolean;
  onClose: () => void;
  pigeonRingNumber?: string;
  onSaveMoultProfile?: (profile: PigeonMoultProfile) => void;
}

export const MoultTrackerModal: React.FC<MoultTrackerModalProps> = ({
  visible,
  onClose,
  pigeonRingNumber = 'PL-0284-23-1402',
  onSaveMoultProfile,
}) => {
  const [selectedFeatherNumber, setSelectedFeatherNumber] = useState<number>(7);
  const [feathers, setFeathers] = useState<PrimaryFeatherDetail[]>([
    { number: 1, stage: 'completed', lengthPercent: 100, isBloodQuillVulnerable: false, isOuterWingFeather: false },
    { number: 2, stage: 'completed', lengthPercent: 100, isBloodQuillVulnerable: false, isOuterWingFeather: false },
    { number: 3, stage: 'completed', lengthPercent: 100, isBloodQuillVulnerable: false, isOuterWingFeather: false },
    { number: 4, stage: 'completed', lengthPercent: 100, isBloodQuillVulnerable: false, isOuterWingFeather: false },
    { number: 5, stage: 'completed', lengthPercent: 100, isBloodQuillVulnerable: false, isOuterWingFeather: false },
    { number: 6, stage: 'completed', lengthPercent: 100, isBloodQuillVulnerable: false, isOuterWingFeather: false },
    { number: 7, stage: 'maturing', lengthPercent: 80, isBloodQuillVulnerable: false, isOuterWingFeather: true },
    { number: 8, stage: 'intact', lengthPercent: 100, isBloodQuillVulnerable: false, isOuterWingFeather: true },
    { number: 9, stage: 'intact', lengthPercent: 100, isBloodQuillVulnerable: false, isOuterWingFeather: true },
    { number: 10, stage: 'intact', lengthPercent: 100, isBloodQuillVulnerable: false, isOuterWingFeather: true },
  ]);

  const [tailDroppedPairs, setTailDroppedPairs] = useState<number>(1);
  const [bodyMoultIntensity, setBodyMoultIntensity] = useState<'none' | 'light' | 'heavy_peak'>('light');

  const currentProfile: PigeonMoultProfile = {
    pigeonId: 'p-current',
    ringNumber: pigeonRingNumber,
    inspectionDate: new Date().toISOString().slice(0, 10),
    primaries: feathers,
    tail: {
      droppedPairsCount: tailDroppedPairs,
      isTailMoultActive: tailDroppedPairs > 0,
      notes: `${tailDroppedPairs} par sterówek w wymianie`,
    },
    bodyMoultIntensity,
  };

  const evaluation = evaluatePigeonMoult(currentProfile);

  const handleUpdateFeatherStage = (stage: FeatherGrowthStage, length: number, isBlood: boolean) => {
    setFeathers((prev) =>
      prev.map((f) =>
        f.number === selectedFeatherNumber
          ? {
              ...f,
              stage,
              lengthPercent: length,
              isBloodQuillVulnerable: isBlood,
            }
          : f
      )
    );
  };

  const handleSave = () => {
    if (onSaveMoultProfile) {
      onSaveMoultProfile(currentProfile);
    }
    Alert.alert(
      'Zapisano Stan Pierzenia!',
      `Ptak ${pigeonRingNumber}: Indeks odnowy skrzydła ${evaluation.overallWingRenovationPercent}%. Status: ${
        evaluation.isFitForBasketing ? 'Zdatny do lotu' : 'Blokada koszowania'
      }.`
    );
    onClose();
  };

  const activeFeather = feathers.find((f) => f.number === selectedFeatherNumber);

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>🪶 Tracker Pierzenia Skrzydła</Text>
            <Text style={styles.subtitle}>
              Ptak: {pigeonRingNumber} • 10 Lotek I Rzędu & Keratyna
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            testID="btn-close-moult-tracker"
            accessibilityRole="button"
          >
            <Text style={styles.closeBtnText}>✕ Zamknij</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Fitness & Basketing Banner */}
          <View
            style={[
              styles.statusCard,
              evaluation.isFitForBasketing ? styles.statusFit : styles.statusBlocked,
            ]}
          >
            <View style={styles.statusRow}>
              <Text style={styles.statusTitle}>
                {evaluation.isFitForBasketing
                  ? '🟢 ZDATNY DO KOSZOWANIA'
                  : '🔴 ZAKAZ KOSZOWANIA (KRYTYCZNE PIERZENIE)'}
              </Text>
              <Text style={styles.renovationBadge}>
                {evaluation.overallWingRenovationPercent}% odnowy
              </Text>
            </View>

            {evaluation.basketingBlockReason ? (
              <Text style={styles.blockReasonText}>
                ⚠️ {evaluation.basketingBlockReason}
              </Text>
            ) : (
              <Text style={styles.safeDescText}>
                Wszystkie lotki nośne stabilne. Brak ukrwionych dętek zagrażających krwotokiem.
              </Text>
            )}
          </View>

          {/* Interactive Wing Diagram (10 Feathers) */}
          <Text style={styles.sectionLabel}>
            Wizualny Schemat Skrzydła (Dotknij lotkę, aby zmienić etap):
          </Text>
          <View style={styles.wingDiagram}>
            {feathers.map((f) => {
              const isSelected = f.number === selectedFeatherNumber;
              const isOuter = f.number >= 7;
              return (
                <TouchableOpacity
                  key={f.number}
                  style={[
                    styles.featherColumn,
                    isSelected && styles.featherColumnActive,
                  ]}
                  onPress={() => setSelectedFeatherNumber(f.number)}
                  testID={`feather-col-${f.number}`}
                >
                  <View style={styles.featherBarContainer}>
                    <View
                      style={[
                        styles.featherBarFill,
                        { height: `${Math.max(10, f.lengthPercent)}%` },
                        f.isBloodQuillVulnerable
                          ? styles.barBlood
                          : f.lengthPercent === 100
                          ? styles.barFull
                          : styles.barRegrowing,
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.featherNumText,
                      isOuter && styles.featherNumOuter,
                      isSelected && styles.featherNumActive,
                    ]}
                  >
                    #{f.number}
                  </Text>
                  <Text style={styles.featherLenText}>{f.lengthPercent}%</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.wingHint}>
            Lotki #1-#6: Wewnętrzne | Lotki #7-#10: Skrajne nośne (kluczowe do lotu)
          </Text>

          {/* Stage Controls for Selected Feather */}
          {activeFeather && (
            <View style={styles.controlBox}>
              <Text style={styles.controlTitle}>
                Aktualizuj stan lotki #{activeFeather.number} ({activeFeather.isOuterWingFeather ? 'Skrajna nośna' : 'Wewnętrzna'}):
              </Text>
              <View style={styles.stageBtnRow}>
                <TouchableOpacity
                  style={[
                    styles.stageBtn,
                    activeFeather.stage === 'completed' && styles.stageBtnActive,
                  ]}
                  onPress={() => handleUpdateFeatherStage('completed', 100, false)}
                >
                  <Text style={styles.stageBtnText}>Pełna (100%)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.stageBtn,
                    activeFeather.stage === 'maturing' && styles.stageBtnActive,
                  ]}
                  onPress={() => handleUpdateFeatherStage('maturing', 80, false)}
                >
                  <Text style={styles.stageBtnText}>Dojrzewa (80%)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.stageBtn,
                    activeFeather.stage === 'brushing' && styles.stageBtnActive,
                  ]}
                  onPress={() => handleUpdateFeatherStage('brushing', 50, false)}
                >
                  <Text style={styles.stageBtnText}>Pędzel (50%)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.stageBtn,
                    activeFeather.stage === 'blood_quill' && styles.stageBtnBlood,
                  ]}
                  onPress={() => handleUpdateFeatherStage('blood_quill', 20, true)}
                >
                  <Text style={styles.stageBtnText}>🩸 Dętka (20%)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.stageBtn,
                    activeFeather.stage === 'dropped' && styles.stageBtnActive,
                  ]}
                  onPress={() => handleUpdateFeatherStage('dropped', 0, false)}
                >
                  <Text style={styles.stageBtnText}>Zrzut (0%)</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Tail & Coverts Moult Controls */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ogon i Pierzenie Drobne:</Text>
            <View style={styles.tailRow}>
              <Text style={styles.inputLabel}>Zrzucone pary sterówek (0 - 6 par):</Text>
              <View style={styles.pillsRow}>
                {[0, 1, 2, 3, 4, 5, 6].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.tailPill,
                      tailDroppedPairs === p && styles.tailPillActive,
                    ]}
                    onPress={() => setTailDroppedPairs(p)}
                  >
                    <Text
                      style={[
                        styles.tailPillText,
                        tailDroppedPairs === p && styles.tailPillTextActive,
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ marginTop: 10 }}>
              <Text style={styles.inputLabel}>Intensywność pierzenia ciała:</Text>
              <View style={styles.pillsRow}>
                {[
                  { id: 'none', label: 'Brak' },
                  { id: 'light', label: 'Lekkie' },
                  { id: 'heavy_peak', label: 'Szczytowe (Wielkie)' },
                ].map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[
                      styles.bodyPill,
                      bodyMoultIntensity === b.id && styles.bodyPillActive,
                    ]}
                    onPress={() => setBodyMoultIntensity(b.id as any)}
                  >
                    <Text
                      style={[
                        styles.bodyPillText,
                        bodyMoultIntensity === b.id && styles.bodyPillTextActive,
                      ]}
                    >
                      {b.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Keratin Nutrition Protocol Card */}
          <View style={styles.keratinCard}>
            <Text style={styles.keratinTitle}>🧪 Protokół Regeneracji Keratyny:</Text>
            {evaluation.keratinNutritionalAdvice.map((a, idx) => (
              <Text key={idx} style={styles.keratinBullet}>
                • {a}
              </Text>
            ))}

            <Text style={styles.supplementsHeader}>Zalecana Suplementacja:</Text>
            <View style={styles.supplementsGrid}>
              {evaluation.recommendedFeedSupplements.map((s, idx) => (
                <View key={idx} style={styles.supplementPill}>
                  <Text style={styles.supplementText}>✓ {s}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Spacer */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Footer Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            testID="btn-save-moult"
            accessibilityRole="button"
          >
            <Text style={styles.saveBtnText}>
              💾 ZAPISZ PRZEGLĄD PIERZENIA W KARTOTECE
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
  statusCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
  },
  statusFit: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  statusBlocked: {
    backgroundColor: '#450A0A',
    borderColor: '#EF4444',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  renovationBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 'bold',
  },
  blockReasonText: {
    color: '#FECACA',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  safeDescText: {
    color: '#D1FAE5',
    fontSize: 12,
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  wingDiagram: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  featherColumn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 6,
  },
  featherColumnActive: {
    backgroundColor: '#334155',
  },
  featherBarContainer: {
    width: 14,
    height: 100,
    backgroundColor: '#0F172A',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#475569',
  },
  featherBarFill: {
    width: '100%',
    borderRadius: 7,
  },
  barFull: {
    backgroundColor: '#3B82F6',
  },
  barRegrowing: {
    backgroundColor: '#F59E0B',
  },
  barBlood: {
    backgroundColor: '#EF4444',
  },
  featherNumText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94A3B8',
    marginTop: 4,
  },
  featherNumOuter: {
    color: '#F59E0B',
  },
  featherNumActive: {
    color: '#FFFFFF',
  },
  featherLenText: {
    fontSize: 9,
    color: '#64748B',
  },
  wingHint: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  controlBox: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  controlTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  stageBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  stageBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 6,
    minHeight: 38,
    justifyContent: 'center',
  },
  stageBtnActive: {
    backgroundColor: '#2563EB',
  },
  stageBtnBlood: {
    backgroundColor: '#DC2626',
  },
  stageBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  tailRow: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 6,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tailPill: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    minHeight: 38,
    justifyContent: 'center',
  },
  tailPillActive: {
    backgroundColor: '#2563EB',
  },
  tailPillText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tailPillTextActive: {
    color: '#FFFFFF',
  },
  bodyPill: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    minHeight: 38,
    justifyContent: 'center',
  },
  bodyPillActive: {
    backgroundColor: '#2563EB',
  },
  bodyPillText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  bodyPillTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  keratinCard: {
    backgroundColor: '#0F2942',
    borderColor: '#1E40AF',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  keratinTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#60A5FA',
    marginBottom: 6,
  },
  keratinBullet: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
    marginBottom: 4,
  },
  supplementsHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#93C5FD',
    marginTop: 8,
    marginBottom: 6,
  },
  supplementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  supplementPill: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  supplementText: {
    color: '#DBEAFE',
    fontSize: 11,
    fontWeight: '600',
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
  saveBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 56, // Field Mode compliant
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

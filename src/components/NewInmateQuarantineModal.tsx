/**
 * PIGEON-FLY — New Inmate Quarantine & Isolation Ward Modal (Z-076 / DEC-90)
 * Field Mode ergonomic interface (>= 48-56pt touch targets), dark theme (#121417).
 * 21-day quarantine management, multi-stage lab checklist, and PIW Clearance Certificate export.
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
  InmateQuarantineRecord,
  evaluateInmateQuarantine,
  generateInmateQuarantineCertificateHtml,
} from '../domain/newInmateQuarantine';
import { PdfService } from '../services/pdfService';
import { FieldButton } from './FieldButton';

interface NewInmateQuarantineModalProps {
  visible: boolean;
  onClose: () => void;
  inmates?: InmateQuarantineRecord[];
  onUpdateInmate?: (updated: InmateQuarantineRecord) => void;
  loftName?: string;
}

const DEFAULT_INMATES: InmateQuarantineRecord[] = [
  {
    id: 'quar-01',
    ringNumber: 'BE-2025-6012488',
    originSource: 'Aukcja PIPA - Belgia (Ludo Claessens)',
    countryCode: 'BE',
    sex: 'cock',
    plumage: 'Ciemno-nakrapiany',
    admissionDate: '2026-03-27', // 21 days ago
    targetLoftSection: 'breeding',
    coproscopyStatus: 'negative',
    coproscopyDetails: 'Brak inwazji oocyst kokcydiów i jaj nicieni',
    cropSmearStatus: 'negative',
    cropSmearDetails: 'Trichomonas gallinae ujemny',
    pmv1Status: 'verified_valid',
    pmv1VaccineBatch: 'Pharmavac PMV ser. 24881',
    ectoparasiteTreatmentDone: true,
    clinicalExamNormal: true,
    clinicalNotes: 'Waga 465g, sprężyste mięśnie piersiowe, czysta woskówka',
  },
  {
    id: 'quar-02',
    ringNumber: 'DV-01234-25-881',
    originSource: 'Hodowla Günter Prange - Niemcy',
    countryCode: 'DV',
    sex: 'hen',
    plumage: 'Niebieska pstra',
    admissionDate: '2026-04-06', // 11 days ago (Stage 2)
    targetLoftSection: 'breeding',
    coproscopyStatus: 'positive_treated',
    coproscopyDetails: 'Wykryto oocysty, podano Baycox 2.5%, powtórka ujemna',
    cropSmearStatus: 'pending',
    pmv1Status: 'booster_administered',
    pmv1VaccineBatch: 'Colombovac PMV',
    ectoparasiteTreatmentDone: true,
    clinicalExamNormal: true,
  },
];

export const NewInmateQuarantineModal: React.FC<NewInmateQuarantineModalProps> = ({
  visible,
  onClose,
  inmates = DEFAULT_INMATES,
  onUpdateInmate,
  loftName = 'Gołębnik Mistrza Pigeon-Fly',
}) => {
  const [selectedId, setSelectedId] = useState<string>(inmates[0]?.id || '');
  const [localInmates, setLocalInmates] = useState<InmateQuarantineRecord[]>(inmates);

  const activeInmate = useMemo(() => {
    return localInmates.find((i) => i.id === selectedId) || localInmates[0] || null;
  }, [localInmates, selectedId]);

  const evaluation = useMemo(() => {
    if (!activeInmate) return null;
    return evaluateInmateQuarantine(activeInmate, new Date());
  }, [activeInmate]);

  const handlePrintCertificate = async () => {
    if (!activeInmate || !evaluation) return;
    try {
      const html = generateInmateQuarantineCertificateHtml({
        record: activeInmate,
        evaluation,
        loftName,
        seasonYear: 2026,
      });
      await PdfService.printHtml(html);
    } catch (err: any) {
      Alert.alert('Błąd drukowania', err?.message || 'Nie udało się wydrukować certyfikatu.');
    }
  };

  const handleShareCertificate = async () => {
    if (!activeInmate || !evaluation) return;
    try {
      const html = generateInmateQuarantineCertificateHtml({
        record: activeInmate,
        evaluation,
        loftName,
        seasonYear: 2026,
      });
      await PdfService.shareHtmlAsPdf(
        html,
        `Swiadectwo_Kwarantanny_${activeInmate.ringNumber}.pdf`
      );
    } catch (err: any) {
      Alert.alert('Błąd eksportu', err?.message || 'Nie udało się zapisać pliku PDF.');
    }
  };

  const handleDischargePatient = () => {
    if (!activeInmate || !evaluation) return;
    if (!evaluation.canDischargeToMainLoft) {
      Alert.alert(
        'Brak zgody na zwolnienie',
        `Nie można zwolnić ptaka do gołębnika głównego:\n\n${evaluation.blockingReasons.join('\n')}`
      );
      return;
    }

    const updated: InmateQuarantineRecord = {
      ...activeInmate,
      clearedDate: new Date().toISOString().slice(0, 10),
    };

    setLocalInmates((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    onUpdateInmate?.(updated);

    Alert.alert(
      'Kwarantanna Zakończona!',
      `Ptak ${activeInmate.ringNumber} został oficjalnie dopuszczony do sekcji: ${activeInmate.targetLoftSection}.`
    );
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
              <Text style={styles.title}>🛡️ E-Księga Kwarantanny</Text>
              <Text style={styles.subtitle}>
                Nowe Nabytki &bull; 21 Dni Izolacji &bull; Procedury Weterynaryjne (Z-076)
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Zamknij"
              testID="btn-close-new-quarantine-modal"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Inmates Selector Carousel */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.inmatesTabsContainer}
            contentContainerStyle={styles.inmatesTabsContent}
          >
            {localInmates.map((inmate) => {
              const isSelected = inmate.id === activeInmate?.id;
              const isCleared = Boolean(inmate.clearedDate);
              return (
                <TouchableOpacity
                  key={inmate.id}
                  style={[
                    styles.inmateTab,
                    isSelected && styles.inmateTabSelected,
                    isCleared && styles.inmateTabCleared,
                  ]}
                  onPress={() => setSelectedId(inmate.id)}
                  testID={`tab-inmate-${inmate.id}`}
                >
                  <Text
                    style={[
                      styles.inmateTabText,
                      isSelected && styles.inmateTabTextSelected,
                    ]}
                  >
                    {inmate.ringNumber}
                  </Text>
                  <Text style={styles.inmateTabSubText}>
                    {isCleared ? '✓ Zwolniony' : `${inmate.countryCode} &bull; Izolatka`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {activeInmate && evaluation ? (
            <ScrollView style={styles.scrollContent}>
              {/* Inmate Patient Card */}
              <View style={styles.cardHeaderBox}>
                <View style={styles.ringRow}>
                  <View>
                    <Text style={styles.ringLabel}>OBRĄCZKA RODOWA:</Text>
                    <Text style={styles.ringValue}>{activeInmate.ringNumber}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      evaluation.canDischargeToMainLoft
                        ? styles.statusBadgeCleared
                        : styles.statusBadgeActive,
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {evaluation.canDischargeToMainLoft ? 'ZGODNOŚĆ 100%' : 'W TOKU'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.originText}>
                  Źródło: <strong>{activeInmate.originSource}</strong>
                </Text>
                <Text style={styles.metaRow}>
                  Sekcja docelowa: <strong>{activeInmate.targetLoftSection}</strong> &bull; Data
                  przyjęcia: <strong>{activeInmate.admissionDate}</strong>
                </Text>

                {/* Progress Track */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressLabelRow}>
                    <Text style={styles.stageNameText}>{evaluation.stageName}</Text>
                    <Text style={styles.daysCounterText}>
                      Dzień {evaluation.daysElapsed} / 21
                    </Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${Math.min(100, Math.max(5, evaluation.progressPct))}%` },
                      ]}
                    />
                  </View>
                </View>
              </View>

              {/* Lab & Clinical Checklist */}
              <Text style={styles.sectionTitle}>
                PROTOKÓŁ BADAŃ LABORATORYJNYCH I ZABIEGÓW:
              </Text>
              <View style={styles.checklistCard}>
                {/* 1. Coproscopy */}
                <View style={styles.checkItem}>
                  <View style={styles.checkIconBox}>
                    <Text style={styles.checkIcon}>
                      {activeInmate.coproscopyStatus !== 'pending' ? '✓' : '⏳'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checkTitle}>Badanie koproskopowe (kał)</Text>
                    <Text style={styles.checkDesc}>
                      {activeInmate.coproscopyDetails || 'Kokcydia, glisty i kapilaria'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.resultPill,
                      activeInmate.coproscopyStatus === 'negative'
                        ? styles.pillGreen
                        : activeInmate.coproscopyStatus === 'positive_treated'
                        ? styles.pillAmber
                        : styles.pillRed,
                    ]}
                  >
                    <Text style={styles.resultPillText}>
                      {activeInmate.coproscopyStatus === 'negative'
                        ? 'UJEMNY'
                        : activeInmate.coproscopyStatus === 'positive_treated'
                        ? 'WYLECZONY'
                        : 'CZEKA'}
                    </Text>
                  </View>
                </View>

                {/* 2. Crop Smear */}
                <View style={styles.checkItem}>
                  <View style={styles.checkIconBox}>
                    <Text style={styles.checkIcon}>
                      {activeInmate.cropSmearStatus !== 'pending' ? '✓' : '⏳'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checkTitle}>Wymaz z wola (Trichomonas / Candida)</Text>
                    <Text style={styles.checkDesc}>
                      {activeInmate.cropSmearDetails || 'Rzęsistek i grzyby drożdżakowe'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.resultPill,
                      activeInmate.cropSmearStatus === 'negative'
                        ? styles.pillGreen
                        : activeInmate.cropSmearStatus === 'positive_treated'
                        ? styles.pillAmber
                        : styles.pillRed,
                    ]}
                  >
                    <Text style={styles.resultPillText}>
                      {activeInmate.cropSmearStatus === 'negative'
                        ? 'UJEMNY'
                        : activeInmate.cropSmearStatus === 'positive_treated'
                        ? 'WYLECZONY'
                        : 'CZEKA'}
                    </Text>
                  </View>
                </View>

                {/* 3. PMV-1 Vaccination */}
                <View style={styles.checkItem}>
                  <View style={styles.checkIconBox}>
                    <Text style={styles.checkIcon}>
                      {activeInmate.pmv1Status !== 'pending' ? '✓' : '⏳'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checkTitle}>Szczepienie ochronne PMV-1</Text>
                    <Text style={styles.checkDesc}>
                      {activeInmate.pmv1VaccineBatch || 'Paramyksowiroza (Colombovac/Pharmavac)'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.resultPill,
                      activeInmate.pmv1Status !== 'pending' ? styles.pillGreen : styles.pillRed,
                    ]}
                  >
                    <Text style={styles.resultPillText}>
                      {activeInmate.pmv1Status !== 'pending' ? 'WAŻNE' : 'CZEKA'}
                    </Text>
                  </View>
                </View>

                {/* 4. Ectoparasites */}
                <View style={styles.checkItem}>
                  <View style={styles.checkIconBox}>
                    <Text style={styles.checkIcon}>
                      {activeInmate.ectoparasiteTreatmentDone ? '✓' : '⏳'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checkTitle}>Pasożyty zewnętrzne (piórojady)</Text>
                    <Text style={styles.checkDesc}>Kąpiel insektycydowa / preparat na kark</Text>
                  </View>
                  <View
                    style={[
                      styles.resultPill,
                      activeInmate.ectoparasiteTreatmentDone ? styles.pillGreen : styles.pillRed,
                    ]}
                  >
                    <Text style={styles.resultPillText}>
                      {activeInmate.ectoparasiteTreatmentDone ? 'ZROBIONE' : 'BRAK'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Blocking Reasons if any */}
              {evaluation.blockingReasons.length > 0 && (
                <View style={styles.blockingBox}>
                  <Text style={styles.blockingTitle}>WARUNKI BLOKUJĄCE ZWOLNIENIE DO STADA:</Text>
                  {evaluation.blockingReasons.map((reason, idx) => (
                    <Text key={idx} style={styles.blockingItemText}>
                      &bull; {reason}
                    </Text>
                  ))}
                </View>
              )}

              {/* Recommendations */}
              <View style={styles.recCard}>
                <Text style={styles.recTitle}>KOLEJNA WYMAGANA CZYNNOŚĆ:</Text>
                <Text style={styles.recText}>{evaluation.nextActionRequired}</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsContainer}>
                {!activeInmate.clearedDate && (
                  <FieldButton
                    title="✓ Wydaj Świadectwo i Zwolnij do Stada"
                    onPress={handleDischargePatient}
                    disabled={!evaluation.canDischargeToMainLoft}
                    style={{ marginBottom: 10, minHeight: 48 }}
                    testID="btn-discharge-inmate"
                  />
                )}

                <FieldButton
                  title="🖨️ Drukuj Świadectwo Kwarantanny (A4/PDF)"
                  variant="secondary"
                  onPress={handlePrintCertificate}
                  style={{ marginBottom: 10, minHeight: 48 }}
                  testID="btn-print-quarantine-cert"
                />

                <FieldButton
                  title="📤 Udostępnij Świadectwo PDF"
                  variant="secondary"
                  onPress={handleShareCertificate}
                  style={{ marginBottom: 20, minHeight: 48 }}
                  testID="btn-share-quarantine-cert"
                />
              </View>
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Brak zarejestrowanych ptaków w kwarantannie.</Text>
            </View>
          )}
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
  inmatesTabsContainer: {
    maxHeight: 56,
    marginBottom: 12,
  },
  inmatesTabsContent: {
    gap: 8,
  },
  inmateTab: {
    backgroundColor: '#1E2127',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
    alignItems: 'center',
    minWidth: 100,
  },
  inmateTabSelected: {
    backgroundColor: '#047857',
    borderColor: '#10B981',
  },
  inmateTabCleared: {
    borderColor: '#059669',
  },
  inmateTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  inmateTabTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  inmateTabSubText: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  scrollContent: {
    flex: 1,
  },
  cardHeaderBox: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 14,
  },
  ringRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ringLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  ringValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#60A5FA',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeActive: {
    backgroundColor: '#D97706',
  },
  statusBadgeCleared: {
    backgroundColor: '#059669',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  originText: {
    fontSize: 12,
    color: '#E5E7EB',
    marginBottom: 4,
  },
  metaRow: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 10,
  },
  progressContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2F343F',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stageNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E5A93C',
  },
  daysCounterText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#121417',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5A93C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  checklistCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 12,
    gap: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
  },
  checkIconBox: {
    width: 26,
    alignItems: 'center',
    marginRight: 8,
  },
  checkIcon: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: 'bold',
  },
  checkTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F3F4F6',
  },
  checkDesc: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  resultPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillGreen: {
    backgroundColor: '#059669',
  },
  pillAmber: {
    backgroundColor: '#D97706',
  },
  pillRed: {
    backgroundColor: '#DC2626',
  },
  resultPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  blockingBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  blockingTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  blockingItemText: {
    fontSize: 11,
    color: '#FCA5A5',
    lineHeight: 16,
  },
  recCard: {
    backgroundColor: '#172554',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E40AF',
    marginBottom: 14,
  },
  recTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#93C5FD',
    textTransform: 'uppercase',
  },
  recText: {
    fontSize: 11,
    color: '#BFDBFE',
    marginTop: 2,
    lineHeight: 16,
  },
  actionsContainer: {
    marginTop: 4,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});

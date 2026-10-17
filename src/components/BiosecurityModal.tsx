/**
 * PIGEON-FLY — Generator Protokołu Sanitarnego i Zabezpieczenia Biologicznego Modal (Z-062)
 * Bioasekuracja PIW / GLW: audyt 4 filarów, wyliczanie wskaźnika zgodności, zalecenia pokontrolne i eksport A4 PDF.
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
  Alert,
} from 'react-native';
import {
  BiosecurityChecklist,
  BiosecurityLoftInfo,
  DEFAULT_BIOSECURITY_CHECKLIST,
  evaluateBiosecurityCompliance,
} from '../domain/biosecurityProtocol';
import { PdfService } from '../services/pdfService';

interface BiosecurityModalProps {
  visible: boolean;
  onClose: () => void;
}

export const BiosecurityModal: React.FC<BiosecurityModalProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'checklist' | 'evaluation' | 'official'>('checklist');
  const [checklist, setChecklist] = useState<BiosecurityChecklist>(DEFAULT_BIOSECURITY_CHECKLIST);

  const [loftInfo, setLoftInfo] = useState<BiosecurityLoftInfo>({
    wniNumber: 'PL 14120099',
    loftName: 'Gołębnik Mistrza',
    breederName: 'Hodowca Pigeon-Fly',
    address: 'ul. Lotników 44, 05-500 Piaseczno',
    pzhgpBranch: '0284 Warszawa-Mokotów',
    pzhgpSection: 'Sekcja 2 Piaseczno',
    totalBirdsCount: 65,
    auditDate: new Date().toISOString().slice(0, 10),
    auditorName: 'Lek. wet. Janusz Ptasiński',
    auditorRole: 'field_vet',
    auditReason: 'pre_season_check',
  });

  const complianceResult = evaluateBiosecurityCompliance(checklist);

  const toggleCheck = (key: keyof BiosecurityChecklist) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleExportPdf = async (mode: 'print' | 'share') => {
    try {
      await PdfService.exportBiosecurityReport(
        {
          loftInfo,
          checklist,
          result: complianceResult,
        },
        mode
      );
    } catch (e: any) {
      Alert.alert('Błąd eksportu', e?.message || 'Nie udało się wygenerować protokołu PIW.');
    }
  };

  const verdictColor =
    complianceResult.verdict === 'FULL_COMPLIANCE'
      ? '#4CAF50'
      : complianceResult.verdict === 'CONDITIONAL_COMPLIANCE'
      ? '#E5A93C'
      : '#E53935';

  const riskColor =
    complianceResult.epizooticRisk === 'LOW'
      ? '#4CAF50'
      : complianceResult.epizooticRisk === 'MEDIUM'
      ? '#E5A93C'
      : '#E53935';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>🛡️ Bioasekuracja i Kontrola PIW (Z-062)</Text>
              <Text style={styles.subTitle}>Audyt zoohigieniczny, wymogi HPAI/ND i urzędowy protokół</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="btn-close-biosecurity-modal">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Score Banner */}
          <View style={[styles.scoreBanner, { borderColor: verdictColor }]}>
            <View style={styles.scoreCol}>
              <Text style={styles.scoreLabel}>WSKAŹNIK ZGODNOŚCI</Text>
              <Text style={[styles.scoreVal, { color: verdictColor }]}>{complianceResult.scorePercent}%</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.scoreCol}>
              <Text style={styles.scoreLabel}>RYZYKO EPIZOOTYCZNE</Text>
              <Text style={[styles.riskBadge, { color: riskColor }]}>
                {complianceResult.epizooticRisk === 'LOW' ? '🟢 NISKIE' : complianceResult.epizooticRisk === 'MEDIUM' ? '🟡 ŚREDNIE' : '🔴 WYSOKIE'}
              </Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.scoreCol}>
              <Text style={styles.scoreLabel}>NARUSZENIA KRYTYCZNE</Text>
              <Text style={[styles.scoreVal, { color: complianceResult.criticalViolationsCount > 0 ? '#E53935' : '#4CAF50' }]}>
                {complianceResult.criticalViolationsCount}
              </Text>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'checklist' && styles.tabBtnActive]}
              onPress={() => setActiveTab('checklist')}
            >
              <Text style={[styles.tabText, activeTab === 'checklist' && styles.tabTextActive]}>
                📋 Wymogi (15)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'evaluation' && styles.tabBtnActive]}
              onPress={() => setActiveTab('evaluation')}
            >
              <Text style={[styles.tabText, activeTab === 'evaluation' && styles.tabTextActive]}>
                📊 Ocena i Zalecenia ({complianceResult.correctivePlan.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'official' && styles.tabBtnActive]}
              onPress={() => setActiveTab('official')}
            >
              <Text style={[styles.tabText, activeTab === 'official' && styles.tabTextActive]}>
                🏛️ Druk PIW A4
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {activeTab === 'checklist' && (
              <View>
                {/* Filar 1 */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>I. BARIERA WEJŚCIOWA I DEZYNFEKCJA</Text>
                </View>

                <TouchableOpacity
                  style={[styles.checkCard, checklist.matDisinfectionActive && styles.checkCardActive]}
                  onPress={() => toggleCheck('matDisinfectionActive')}
                >
                  <View style={styles.checkCardRow}>
                    <Text style={styles.checkIcon}>{checklist.matDisinfectionActive ? '☑️' : '⬜'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkTitle}>Mata dezynfekcyjna przy wejściu (Virkon S / Ecocid)</Text>
                      <Text style={styles.criticalBadge}>[KRYTYCZNE: 10 PKT]</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <View style={styles.parameterCard}>
                  <Text style={styles.paramTitle}>Wymiana roztworu w macie (Norma PIW: ≤ 7 dni):</Text>
                  <View style={styles.quickOptionsRow}>
                    {[3, 5, 7, 10, 14].map((days) => (
                      <TouchableOpacity
                        key={days}
                        style={[styles.quickOptBtn, checklist.disinfectantRenewalDays === days && styles.quickOptBtnActive]}
                        onPress={() => setChecklist((prev) => ({ ...prev, disinfectantRenewalDays: days }))}
                      >
                        <Text style={[styles.quickOptText, checklist.disinfectantRenewalDays === days && styles.quickOptTextActive]}>
                          co {days} dni
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.checkCard, checklist.dedicatedFootwear && styles.checkCardActive]}
                  onPress={() => toggleCheck('dedicatedFootwear')}
                >
                  <View style={styles.checkCardRow}>
                    <Text style={styles.checkIcon}>{checklist.dedicatedFootwear ? '☑️' : '⬜'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkTitle}>Dedykowane obuwie zmienne w gołębniku</Text>
                      <Text style={styles.criticalBadge}>[KRYTYCZNE: 10 PKT]</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.checkCard, checklist.protectiveClothing && styles.checkCardActive]}
                  onPress={() => toggleCheck('protectiveClothing')}
                >
                  <View style={styles.checkCardRow}>
                    <Text style={styles.checkIcon}>{checklist.protectiveClothing ? '☑️' : '⬜'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkTitle}>Odzież ochronna / fartuch roboczy</Text>
                      <Text style={styles.standardBadge}>[STANDARD: 5 PKT]</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.checkCard, checklist.visitorLogMaintained && styles.checkCardActive]}
                  onPress={() => toggleCheck('visitorLogMaintained')}
                >
                  <View style={styles.checkCardRow}>
                    <Text style={styles.checkIcon}>{checklist.visitorLogMaintained ? '☑️' : '⬜'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkTitle}>Rejestr osób postronnych i gości (księga wejść)</Text>
                      <Text style={styles.standardBadge}>[STANDARD: 5 PKT]</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Filar 2 */}
                <View style={[styles.sectionHeader, { marginTop: 16 }]}>
                  <Text style={styles.sectionTitle}>II. BARIERA PRZED PTAKAMI DZIKIMI I GRYZONIAMI</Text>
                </View>

                <View style={styles.parameterCard}>
                  <Text style={styles.paramTitle}>Średnica oczka siatki w wolierach (Norma PIW: ≤ 19 mm):</Text>
                  <View style={styles.quickOptionsRow}>
                    {[12, 16, 19, 25, 30].map((mm) => (
                      <TouchableOpacity
                        key={mm}
                        style={[styles.quickOptBtn, checklist.meshApertureMm === mm && styles.quickOptBtnActive]}
                        onPress={() => setChecklist((prev) => ({ ...prev, meshApertureMm: mm }))}
                      >
                        <Text style={[styles.quickOptText, checklist.meshApertureMm === mm && styles.quickOptTextActive]}>
                          {mm} mm {mm <= 19 ? '✓' : '✗'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.checkCard, checklist.enclosedFeedStorage && styles.checkCardActive]}
                  onPress={() => toggleCheck('enclosedFeedStorage')}
                >
                  <View style={styles.checkCardRow}>
                    <Text style={styles.checkIcon}>{checklist.enclosedFeedStorage ? '☑️' : '⬜'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkTitle}>Karma i grit w szczelnych pojemnikach gryzonio-szczelnych</Text>
                      <Text style={styles.criticalBadge}>[KRYTYCZNE: 10 PKT]</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.checkCard, checklist.internalWateringOnly && styles.checkCardActive]}
                  onPress={() => toggleCheck('internalWateringOnly')}
                >
                  <View style={styles.checkCardRow}>
                    <Text style={styles.checkIcon}>{checklist.internalWateringOnly ? '☑️' : '⬜'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkTitle}>Pojenie i karmienie wyłącznie wewnątrz pod dachem</Text>
                      <Text style={styles.criticalBadge}>[KRYTYCZNE: 10 PKT]</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.checkCard, checklist.activeRodentControl && styles.checkCardActive]}
                  onPress={() => toggleCheck('activeRodentControl')}
                >
                  <View style={styles.checkCardRow}>
                    <Text style={styles.checkIcon}>{checklist.activeRodentControl ? '☑️' : '⬜'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkTitle}>Aktywny program deratyzacji (karmniki z trutką)</Text>
                      <Text style={styles.standardBadge}>[STANDARD: 5 PKT]</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Filar 3 */}
                <View style={[styles.sectionHeader, { marginTop: 16 }]}>
                  <Text style={styles.sectionTitle}>III. HIGIENA, OBORNIK I KWARANTANNA</Text>
                </View>

                <TouchableOpacity
                  style={[styles.checkCard, checklist.thermalScorchingDone && styles.checkCardActive]}
                  onPress={() => toggleCheck('thermalScorchingDone')}
                >
                  <View style={styles.checkCardRow}>
                    <Text style={styles.checkIcon}>{checklist.thermalScorchingDone ? '☑️' : '⬜'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkTitle}>Dezynfekcja termiczna płomieniem (opalanie palnikiem rusztów)</Text>
                      <Text style={styles.standardBadge}>[STANDARD: 5 PKT]</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.checkCard, checklist.limeWhitewashingDone && styles.checkCardActive]}
                  onPress={() => toggleCheck('limeWhitewashingDone')}
                >
                  <View style={styles.checkCardRow}>
                    <Text style={styles.checkIcon}>{checklist.limeWhitewashingDone ? '☑️' : '⬜'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkTitle}>Bielenie wnętrza wapnem gaszonym (pH alkaliczne pow. 12)</Text>
                      <Text style={styles.standardBadge}>[STANDARD: 5 PKT]</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.checkCard, checklist.isolatedManureStorage && styles.checkCardActive]}
                  onPress={() => toggleCheck('isolatedManureStorage')}
                >
                  <View style={styles.checkCardRow}>
                    <Text style={styles.checkIcon}>{checklist.isolatedManureStorage ? '☑️' : '⬜'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkTitle}>Izolowane składowanie pomiotu (szczelne worki / płyta)</Text>
                      <Text style={styles.standardBadge}>[STANDARD: 5 PKT]</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.checkCard, checklist.quarantineStationFunctional && styles.checkCardActive]}
                  onPress={() => toggleCheck('quarantineStationFunctional')}
                >
                  <View style={styles.checkCardRow}>
                    <Text style={styles.checkIcon}>{checklist.quarantineStationFunctional ? '☑️' : '⬜'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkTitle}>Wydzielona izolatka kwarantannowa dla nowych/chorych (min. 21 dni)</Text>
                      <Text style={styles.standardBadge}>[STANDARD: 5 PKT]</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Filar 4 */}
                <View style={[styles.sectionHeader, { marginTop: 16 }]}>
                  <Text style={styles.sectionTitle}>IV. DOKUMENTACJA I SZCZEPIENIA WETERYNARYJNE</Text>
                </View>

                <TouchableOpacity
                  style={[styles.checkCard, checklist.validPmvVaccination && styles.checkCardActive]}
                  onPress={() => toggleCheck('validPmvVaccination')}
                >
                  <View style={styles.checkCardRow}>
                    <Text style={styles.checkIcon}>{checklist.validPmvVaccination ? '☑️' : '⬜'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkTitle}>Ważne zaświadczenie o szczepieniu PMV-1 (paramyksowiroza)</Text>
                      <Text style={styles.criticalBadge}>[KRYTYCZNE: 10 PKT]</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.checkCard, checklist.veterinaryBookUpToDate && styles.checkCardActive]}
                  onPress={() => toggleCheck('veterinaryBookUpToDate')}
                >
                  <View style={styles.checkCardRow}>
                    <Text style={styles.checkIcon}>{checklist.veterinaryBookUpToDate ? '☑️' : '⬜'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkTitle}>Urzędowa E-Księga leczenia zwierząt i okresy karencji</Text>
                      <Text style={styles.standardBadge}>[STANDARD: 5 PKT]</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'evaluation' && (
              <View>
                {/* Werdykt Podsumowujący */}
                <View style={[styles.verdictCard, { borderColor: verdictColor }]}>
                  <Text style={styles.verdictTitle}>ORZECZENIE AUDYTU BIOASEKURACJI</Text>
                  <Text style={[styles.verdictHeading, { color: verdictColor }]}>{complianceResult.verdictLabel}</Text>
                  <Text style={styles.verdictDesc}>
                    {complianceResult.verdict === 'FULL_COMPLIANCE'
                      ? 'Gołębnik spełnia wszystkie kluczowe rygory weterynaryjne dotyczące ochrony przed ptasią grypą (HPAI) i rzekomym pomorem drobiu (ND). Obiekt dopuszczony do lotów konkursowych PZHGP i transportu.'
                      : complianceResult.verdict === 'CONDITIONAL_COMPLIANCE'
                      ? 'Wykryto drobne uchybienia pozakrytyczne. Hodowca ma obowiązek wdrożyć zalecenia naprawcze w wyznaczonych terminach. Gołębnik warunkowo dopuszczony do eksploatacji.'
                      : 'Wykryto naruszenia standardów krytycznych (brak maty, brak szczepień lub brak osłony przed wróblami). Zagrożenie epizootyczne. Wymagana natychmiastowa interwencja przed inspekcją PIW.'}
                  </Text>
                </View>

                {/* Plan naprawczy */}
                <View style={[styles.sectionHeader, { marginTop: 14 }]}>
                  <Text style={styles.sectionTitle}>
                    ZALECENIA POKONTROLNE PIW ({complianceResult.correctivePlan.length})
                  </Text>
                </View>

                {complianceResult.correctivePlan.length === 0 ? (
                  <View style={styles.emptyPlanBox}>
                    <Text style={styles.emptyPlanIcon}>✅</Text>
                    <Text style={styles.emptyPlanText}>
                      Brak zaleceń pokontrolnych! Wszystkie wymogi bioasekuracji zostały w 100% zrealizowane.
                    </Text>
                  </View>
                ) : (
                  complianceResult.correctivePlan.map((plan, idx) => (
                    <View key={idx} style={styles.correctiveCard}>
                      <View style={styles.correctiveHeader}>
                        <Text style={styles.correctiveNum}>#{idx + 1}</Text>
                        <Text style={styles.correctiveTitle}>{plan.item}</Text>
                        <View style={styles.deadlineBadge}>
                          <Text style={styles.deadlineText}>{plan.deadlineDays} DNI</Text>
                        </View>
                      </View>
                      <Text style={styles.correctiveAction}>Działanie: {plan.action}</Text>
                    </View>
                  ))
                )}
              </View>
            )}

            {activeTab === 'official' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>DANE PODMIOTU I PROTOKOŁU PIW</Text>
                </View>

                <View style={styles.inputCard}>
                  <Text style={styles.inputLabel}>Weterynaryjny Numer Identyfikacyjny (WNI):</Text>
                  <TextInput
                    style={styles.textInput}
                    value={loftInfo.wniNumber}
                    onChangeText={(txt) => setLoftInfo((p) => ({ ...p, wniNumber: txt }))}
                    placeholder="np. PL 14120099"
                    placeholderTextColor="#6B7280"
                  />

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Posiadacz gołębi (Hodowca):</Text>
                  <TextInput
                    style={styles.textInput}
                    value={loftInfo.breederName}
                    onChangeText={(txt) => setLoftInfo((p) => ({ ...p, breederName: txt }))}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Adres gołębnika:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={loftInfo.address}
                    onChangeText={(txt) => setLoftInfo((p) => ({ ...p, address: txt }))}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Osoba kontrolująca (Audytor):</Text>
                  <TextInput
                    style={styles.textInput}
                    value={loftInfo.auditorName}
                    onChangeText={(txt) => setLoftInfo((p) => ({ ...p, auditorName: txt }))}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Liczebność stada (szt.):</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={String(loftInfo.totalBirdsCount)}
                    onChangeText={(txt) => setLoftInfo((p) => ({ ...p, totalBirdsCount: parseInt(txt, 10) || 0 }))}
                  />
                </View>

                {/* Print & Share Actions */}
                <View style={styles.exportSection}>
                  <TouchableOpacity
                    style={[styles.exportBtn, { backgroundColor: '#2E7D32' }]}
                    onPress={() => handleExportPdf('print')}
                    testID="btn-print-biosecurity-report"
                  >
                    <Text style={styles.exportBtnText}>🖨️ Drukuj Protokół Urzędowy PIW (A4)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.exportBtn, { backgroundColor: '#1E2127', borderWidth: 1, borderColor: '#374151', marginTop: 10 }]}
                    onPress={() => handleExportPdf('share')}
                    testID="btn-share-biosecurity-report"
                  >
                    <Text style={[styles.exportBtnText, { color: '#E5E7EB' }]}>📤 Udostępnij PDF (PIW / Weterynaria)</Text>
                  </TouchableOpacity>
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
    fontSize: 16,
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
  scoreBanner: {
    flexDirection: 'row',
    backgroundColor: '#1E2127',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  scoreCol: {
    flex: 1,
    alignItems: 'center',
  },
  dividerVertical: {
    width: 1,
    backgroundColor: '#2F343F',
  },
  scoreLabel: {
    color: '#8E94A0',
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  scoreVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  riskBadge: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
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
    backgroundColor: '#E5A93C',
  },
  tabText: {
    color: '#8E94A0',
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#121417',
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
  checkCard: {
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  checkCardActive: {
    borderColor: '#3B414F',
    backgroundColor: '#1B231D',
  },
  checkCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkIcon: {
    fontSize: 18,
  },
  checkTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  criticalBadge: {
    color: '#E53935',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  standardBadge: {
    color: '#8E94A0',
    fontSize: 10,
    marginTop: 2,
  },
  parameterCard: {
    backgroundColor: '#1A1D24',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2A2E38',
  },
  paramTitle: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
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
    paddingVertical: 6,
    alignItems: 'center',
  },
  quickOptBtnActive: {
    backgroundColor: '#E5A93C',
    borderColor: '#E5A93C',
  },
  quickOptText: {
    color: '#8E94A0',
    fontSize: 11,
    fontWeight: '600',
  },
  quickOptTextActive: {
    color: '#121417',
    fontWeight: '800',
  },
  verdictCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    marginBottom: 14,
  },
  verdictTitle: {
    color: '#8E94A0',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  verdictHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginVertical: 6,
  },
  verdictDesc: {
    color: '#D1D5DB',
    fontSize: 12,
    lineHeight: 18,
  },
  emptyPlanBox: {
    backgroundColor: '#1A2E20',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  emptyPlanIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  emptyPlanText: {
    color: '#A5D6A7',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  correctiveCard: {
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  correctiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  correctiveNum: {
    color: '#E5A93C',
    fontSize: 12,
    fontWeight: '800',
    marginRight: 6,
  },
  correctiveTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  deadlineBadge: {
    backgroundColor: '#4A1B1B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  deadlineText: {
    color: '#EF5350',
    fontSize: 10,
    fontWeight: '800',
  },
  correctiveAction: {
    color: '#E5A93C',
    fontSize: 11,
    marginTop: 4,
  },
  inputCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 16,
  },
  inputLabel: {
    color: '#8E94A0',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
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
  exportSection: {
    marginTop: 10,
  },
  exportBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
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

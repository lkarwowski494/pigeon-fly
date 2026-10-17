/**
 * PIGEON-FLY — Stud & Champion Pigeon Lease Agreement Modal (Z-081 / DEC-95)
 * Field Mode ergonomic interface (>= 48-56pt touch targets), dark theme (#121417).
 * Breeding lease contracts, offspring sharing models, strict housing, and printable A4 agreement.
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
  StudLeaseAgreementRecord,
  validateStudLeaseAgreement,
  generateStudLeaseAgreementHtml,
  OffspringSharingModel,
} from '../domain/studLeaseAgreement';
import { PdfService } from '../services/pdfService';
import { FieldButton } from './FieldButton';

interface StudLeaseAgreementModalProps {
  visible: boolean;
  onClose: () => void;
  initialAgreement?: Partial<StudLeaseAgreementRecord>;
}

const DEFAULT_AGREEMENT: StudLeaseAgreementRecord = {
  id: 'agr-01',
  contractNumber: 'DZIERZ-2026/001',
  agreementDate: '2026-02-10',
  startDate: '2026-03-01',
  endDate: '2026-07-31',
  lessor: {
    fullName: 'Łukasz Karwowski',
    pzhgpMemberNumber: '0284-1420',
    branchSection: 'Oddział 0284 Gostyń, Sekcja 1',
    address: 'ul. Polna 12, 63-800 Gostyń',
    phone: '+48 600 111 222',
  },
  lessee: {
    fullName: 'Jan Kowalski',
    pzhgpMemberNumber: '0284-3312',
    branchSection: 'Oddział 0284 Gostyń, Sekcja 2 Piaski',
    address: 'ul. Leśna 4, 63-820 Piaski',
    phone: '+48 601 222 333',
  },
  pigeon: {
    ringNumber: 'PL-0284-23-1402',
    pedigreeName: 'Błękitny As',
    sex: 'cock',
    birthYear: 2023,
    plumageColor: 'Niebieski nakrapiany',
    strain: 'Koopman / Gaby Vandenabeele',
    chipRingNumber: 'TAURIS-99412',
    estimatedValuePln: 8000,
  },
  offspringSharingModel: 'alternating_clutches',
  offspringSharingNotes: 'Lęg 1 i 3 dla Właściciela, Lęg 2 i 4 dla Dzierżawcy.',
  leaseFeePln: 0,
  strictHousingClause: true,
  ringCardsRetainedByLessor: true,
  veterinaryClearanceConfirmed: true,
  autopsyRequiredOnCasualty: true,
  quarantineReturnRequired: true,
  isSigned: true,
};

export const StudLeaseAgreementModal: React.FC<StudLeaseAgreementModalProps> = ({
  visible,
  onClose,
  initialAgreement,
}) => {
  const [agreement, setAgreement] = useState<StudLeaseAgreementRecord>({
    ...DEFAULT_AGREEMENT,
    ...initialAgreement,
  });

  const [activeTab, setActiveTab] = useState<'summary' | 'clauses' | 'parties'>('summary');

  const validation = useMemo(() => {
    return validateStudLeaseAgreement(agreement);
  }, [agreement]);

  const handleToggleOffspringModel = (model: OffspringSharingModel) => {
    let notes = 'Lęg 1 i 3 dla Właściciela, Lęg 2 i 4 dla Dzierżawcy.';
    if (model === 'equal_split_per_clutch') {
      notes = 'Po 1 młodym z każdego lęgu. Właściciel wybiera 1. pisklę w lęgach nieparzystych, Dzierżawca w parzystych.';
    } else if (model === 'all_to_lessee_fixed_fee') {
      notes = 'Wszystkie pisklęta dla Dzierżawcy w zamian za uzgodnioną opłatę dzierżawną.';
    } else if (model === 'custom_terms') {
      notes = 'Indywidualny harmonogram podziału wg załącznika.';
    }
    setAgreement((prev) => ({
      ...prev,
      offspringSharingModel: model,
      offspringSharingNotes: notes,
    }));
  };

  const handlePrintAgreement = async () => {
    try {
      const html = generateStudLeaseAgreementHtml(agreement);
      await PdfService.printHtml(html);
    } catch (err: any) {
      Alert.alert('Błąd wydruku', err?.message || 'Nie udało się wydrukować umowy.');
    }
  };

  const handleSharePdf = async () => {
    try {
      const html = generateStudLeaseAgreementHtml(agreement);
      await PdfService.shareHtmlAsPdf(
        html,
        `Umowa_Dzierzawy_${agreement.pigeon.ringNumber}.pdf`
      );
    } catch (err: any) {
      Alert.alert('Błąd eksportu', err?.message || 'Nie udało się wyeksportować PDF.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>🤝 Umowa Dzierżawy Rozpłodowej</Text>
            <Text style={styles.headerSubtitle}>
              Użyczenie wybitnego lotnika/rozpłodowca i podział lęgów (Z-081)
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Zamknij okno"
            testID="btn-close-stud-lease-modal"
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'summary' && styles.tabItemActive]}
            onPress={() => setActiveTab('summary')}
            testID="tab-lease-summary"
          >
            <Text style={[styles.tabText, activeTab === 'summary' && styles.tabTextActive]}>
              Umowa & Ptak
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'clauses' && styles.tabItemActive]}
            onPress={() => setActiveTab('clauses')}
            testID="tab-lease-clauses"
          >
            <Text style={[styles.tabText, activeTab === 'clauses' && styles.tabTextActive]}>
              Lęgi & Klauzule
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'parties' && styles.tabItemActive]}
            onPress={() => setActiveTab('parties')}
            testID="tab-lease-parties"
          >
            <Text style={[styles.tabText, activeTab === 'parties' && styles.tabTextActive]}>
              Strony Umowy
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Status banner */}
          <View style={[styles.statusBanner, { borderColor: validation.isValid ? '#10B981' : '#EF4444' }]}>
            <Text style={[styles.statusTitle, { color: validation.isValid ? '#10B981' : '#EF4444' }]}>
              {validation.isValid ? 'UMOWA KOMPLETNA I WAŻNA PRAWNIE' : 'BRAK WYMAGANYCH KLAUZUL'}
            </Text>
            <Text style={styles.statusSub}>
              Umowa nr: <Text style={styles.boldWhite}>{agreement.contractNumber}</Text> • Okres: {agreement.startDate} do {agreement.endDate}
            </Text>
          </View>

          {/* TAB 1: SUMMARY & PIGEON PROFILE */}
          {activeTab === 'summary' && (
            <View>
              {/* Leased Pigeon Card */}
              <View style={styles.pigeonCard}>
                <View style={styles.pigeonTopRow}>
                  <View>
                    <Text style={styles.pigeonRing}>{agreement.pigeon.ringNumber}</Text>
                    {agreement.pigeon.pedigreeName && (
                      <Text style={styles.pigeonName}>"{agreement.pigeon.pedigreeName}"</Text>
                    )}
                    <Text style={styles.pigeonMeta}>
                      {agreement.pigeon.sex === 'cock' ? 'Samiec 1.0' : 'Samica 0.1'} • Rocznik {agreement.pigeon.birthYear} • {agreement.pigeon.plumageColor}
                    </Text>
                    <Text style={styles.pigeonStrain}>Linia: {agreement.pigeon.strain}</Text>
                  </View>
                  <View style={styles.pigeonValBox}>
                    <Text style={styles.pigeonValNumber}>{agreement.pigeon.estimatedValuePln} PLN</Text>
                    <Text style={styles.pigeonValLabel}>Wartość ubezpieczeniowa</Text>
                  </View>
                </View>
              </View>

              {/* Quick Summary Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Warunki Porozumienia:</Text>
                
                <View style={styles.condRow}>
                  <Text style={styles.condLabel}>Właściciel (Użyczający):</Text>
                  <Text style={styles.condVal}>{agreement.lessor.fullName} ({agreement.lessor.pzhgpMemberNumber})</Text>
                </View>
                <View style={styles.condRow}>
                  <Text style={styles.condLabel}>Dzierżawca (Biorący):</Text>
                  <Text style={styles.condVal}>{agreement.lessee.fullName} ({agreement.lessee.pzhgpMemberNumber})</Text>
                </View>
                <View style={styles.condRow}>
                  <Text style={styles.condLabel}>Model Podziału Piskląt:</Text>
                  <Text style={[styles.condVal, { color: '#E5A93C' }]}>{validation.offspringModelLabel}</Text>
                </View>
                <View style={[styles.condRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.condLabel}>Karta Własności i Rodowód:</Text>
                  <Text style={[styles.condVal, { color: '#10B981' }]}>W depozycie Właściciela</Text>
                </View>
              </View>

              {/* Critical warning about no free-flight */}
              <View style={styles.criticalNotice}>
                <Text style={styles.criticalTitle}>🚨 BEZWZGLĘDNY ZAKAZ OBLOTÓW:</Text>
                <Text style={styles.criticalText}>
                  Gołąb pozostaje w gołębniku Dzierżawcy WYŁĄCZNIE w celi rozpłodowej lub w wolierze. Wypuszczenie ptaka na otwarte niebo grozi natychmiastowym zerwaniem umowy i roszczeniem odszkodowawczym w wysokości {agreement.pigeon.estimatedValuePln} PLN.
                </Text>
              </View>
            </View>
          )}

          {/* TAB 2: OFFSPRING SHARING & CLAUSES */}
          {activeTab === 'clauses' && (
            <View>
              {/* Offspring sharing model selector */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Wybierz Model Podziału Piskląt:</Text>

                <TouchableOpacity
                  style={[styles.modelOption, agreement.offspringSharingModel === 'alternating_clutches' && styles.modelOptionActive]}
                  onPress={() => handleToggleOffspringModel('alternating_clutches')}
                  testID="opt-alternating-clutches"
                >
                  <Text style={styles.modelIcon}>{agreement.offspringSharingModel === 'alternating_clutches' ? '🔘' : '⚪'}</Text>
                  <View style={styles.modelTexts}>
                    <Text style={styles.modelTitle}>Lęgi Naprzemienne (Standard)</Text>
                    <Text style={styles.modelSub}>Lęg 1 i 3 dla Właściciela, Lęg 2 i 4 dla Dzierżawcy.</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modelOption, agreement.offspringSharingModel === 'equal_split_per_clutch' && styles.modelOptionActive]}
                  onPress={() => handleToggleOffspringModel('equal_split_per_clutch')}
                  testID="opt-equal-split"
                >
                  <Text style={styles.modelIcon}>{agreement.offspringSharingModel === 'equal_split_per_clutch' ? '🔘' : '⚪'}</Text>
                  <View style={styles.modelTexts}>
                    <Text style={styles.modelTitle}>Po 1 Młodym z Każdego Lęgu</Text>
                    <Text style={styles.modelSub}>Równy podział gniazda. Właściciel wybiera pierwszy w lęgach nieparzystych.</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modelOption, agreement.offspringSharingModel === 'all_to_lessee_fixed_fee' && styles.modelOptionActive]}
                  onPress={() => handleToggleOffspringModel('all_to_lessee_fixed_fee')}
                  testID="opt-fixed-fee"
                >
                  <Text style={styles.modelIcon}>{agreement.offspringSharingModel === 'all_to_lessee_fixed_fee' ? '🔘' : '⚪'}</Text>
                  <View style={styles.modelTexts}>
                    <Text style={styles.modelTitle}>Wszystkie Pisklęta dla Dzierżawcy</Text>
                    <Text style={styles.modelSub}>W zamian za stałą opłatę dzierżawną na rzecz Właściciela.</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Safety & Health Clauses */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Klauzule Bezpieczeństwa i Zdrowotne:</Text>

                <TouchableOpacity
                  style={[styles.clauseCheckItem, agreement.strictHousingClause && styles.clauseCheckItemActive]}
                  onPress={() => setAgreement((prev) => ({ ...prev, strictHousingClause: !prev.strictHousingClause }))}
                  testID="chk-strict-housing"
                >
                  <Text style={styles.clauseCheckIcon}>{agreement.strictHousingClause ? '☑️' : '◻️'}</Text>
                  <View style={styles.clauseCheckTexts}>
                    <Text style={styles.clauseCheckTitle}>Bezwzględny zakaz oblotów (Cela/Woliera)</Text>
                    <Text style={styles.clauseCheckSub}>Ptak nie może być wypuszczony na zewnątrz pod żadnym pozorem.</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.clauseCheckItem, agreement.ringCardsRetainedByLessor && styles.clauseCheckItemActive]}
                  onPress={() => setAgreement((prev) => ({ ...prev, ringCardsRetainedByLessor: !prev.ringCardsRetainedByLessor }))}
                  testID="chk-cards-retained"
                >
                  <Text style={styles.clauseCheckIcon}>{agreement.ringCardsRetainedByLessor ? '☑️' : '◻️'}</Text>
                  <View style={styles.clauseCheckTexts}>
                    <Text style={styles.clauseCheckTitle}>Karta własności i rodowód u Właściciela</Text>
                    <Text style={styles.clauseCheckSub}>Dzierżawca nie otrzymuje karty tożsamości obrączki rodowej.</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.clauseCheckItem, agreement.veterinaryClearanceConfirmed && styles.clauseCheckItemActive]}
                  onPress={() => setAgreement((prev) => ({ ...prev, veterinaryClearanceConfirmed: !prev.veterinaryClearanceConfirmed }))}
                  testID="chk-vet-clearance"
                >
                  <Text style={styles.clauseCheckIcon}>{agreement.veterinaryClearanceConfirmed ? '☑️' : '◻️'}</Text>
                  <View style={styles.clauseCheckTexts}>
                    <Text style={styles.clauseCheckTitle}>Aktualne szczepienia PMV-1 i bioasekuracja</Text>
                    <Text style={styles.clauseCheckSub}>Potwierdzony brak inwazji pasożytniczych przed przekazaniem.</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.clauseCheckItem, agreement.autopsyRequiredOnCasualty && styles.clauseCheckItemActive]}
                  onPress={() => setAgreement((prev) => ({ ...prev, autopsyRequiredOnCasualty: !prev.autopsyRequiredOnCasualty }))}
                  testID="chk-autopsy-required"
                >
                  <Text style={styles.clauseCheckIcon}>{agreement.autopsyRequiredOnCasualty ? '☑️' : '◻️'}</Text>
                  <View style={styles.clauseCheckTexts}>
                    <Text style={styles.clauseCheckTitle}>Obowiązkowa sekcja zwłok PIW w razie zgonu</Text>
                    <Text style={styles.clauseCheckSub}>Urzędowa autopsja weterynaryjna celem wykluczenia zaniedbania.</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.clauseCheckItem, agreement.quarantineReturnRequired && styles.clauseCheckItemActive]}
                  onPress={() => setAgreement((prev) => ({ ...prev, quarantineReturnRequired: !prev.quarantineReturnRequired }))}
                  testID="chk-quarantine-return"
                >
                  <Text style={styles.clauseCheckIcon}>{agreement.quarantineReturnRequired ? '☑️' : '◻️'}</Text>
                  <View style={styles.clauseCheckTexts}>
                    <Text style={styles.clauseCheckTitle}>21-dniowa kwarantanna powrotna</Text>
                    <Text style={styles.clauseCheckSub}>Izolacja biologiczna po zakończeniu okresu dzierżawy.</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TAB 3: PARTIES DETAILS */}
          {activeTab === 'parties' && (
            <View>
              {/* Lessor Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Właściciel (Użyczający):</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Imię i Nazwisko:</Text>
                  <Text style={styles.metaVal}>{agreement.lessor.fullName}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Nr Członkowski PZHGP:</Text>
                  <Text style={styles.metaVal}>{agreement.lessor.pzhgpMemberNumber}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Oddział / Sekcja:</Text>
                  <Text style={styles.metaVal}>{agreement.lessor.branchSection}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Adres:</Text>
                  <Text style={styles.metaVal}>{agreement.lessor.address}</Text>
                </View>
                <View style={[styles.metaRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.metaLabel}>Telefon:</Text>
                  <Text style={styles.metaVal}>{agreement.lessor.phone}</Text>
                </View>
              </View>

              {/* Lessee Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Dzierżawca (Biorący w użyczenie):</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Imię i Nazwisko:</Text>
                  <Text style={styles.metaVal}>{agreement.lessee.fullName}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Nr Członkowski PZHGP:</Text>
                  <Text style={styles.metaVal}>{agreement.lessee.pzhgpMemberNumber}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Oddział / Sekcja:</Text>
                  <Text style={styles.metaVal}>{agreement.lessee.branchSection}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Adres:</Text>
                  <Text style={styles.metaVal}>{agreement.lessee.address}</Text>
                </View>
                <View style={[styles.metaRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.metaLabel}>Telefon:</Text>
                  <Text style={styles.metaVal}>{agreement.lessee.phone}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <FieldButton
              title="🖨️ Drukuj Umowę Dzierżawy A4 (AirPrint)"
              onPress={handlePrintAgreement}
              testID="btn-print-stud-lease-agreement"
              style={{ marginBottom: 10 }}
            />
            <FieldButton
              title="📄 Udostępnij Umowę PDF"
              onPress={handleSharePdf}
              testID="btn-share-stud-lease-pdf"
              variant="secondary"
              style={{ marginBottom: 10 }}
            />
            <FieldButton
              title="Zamknij"
              onPress={onClose}
              testID="btn-close-lease"
              variant="secondary"
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F3F4F6',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E2127',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  closeBtnText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E2127',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: '#E5A93C',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#121417',
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusBanner: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    marginBottom: 14,
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },
  statusSub: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  boldWhite: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  pigeonCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#0284C7',
    marginBottom: 14,
  },
  pigeonTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pigeonRing: {
    fontSize: 18,
    fontWeight: '900',
    color: '#38BDF8',
  },
  pigeonName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F3F4F6',
    marginTop: 2,
    fontStyle: 'italic',
  },
  pigeonMeta: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  pigeonStrain: {
    fontSize: 11,
    color: '#E5A93C',
    marginTop: 2,
  },
  pigeonValBox: {
    alignItems: 'flex-end',
  },
  pigeonValNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#34D399',
  },
  pigeonValLabel: {
    fontSize: 9,
    color: '#9CA3AF',
  },
  card: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F3F4F6',
    marginBottom: 10,
  },
  condRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
  },
  condLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  condVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F3F4F6',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  criticalNotice: {
    backgroundColor: '#351616',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    marginBottom: 14,
  },
  criticalTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FCA5A5',
    marginBottom: 4,
  },
  criticalText: {
    fontSize: 11,
    color: '#FECACA',
    lineHeight: 16,
  },
  modelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16191E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  modelOptionActive: {
    borderColor: '#E5A93C',
    backgroundColor: '#262013',
  },
  modelIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  modelTexts: {
    flex: 1,
  },
  modelTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F3F4F6',
  },
  modelSub: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  clauseCheckItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#16191E',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  clauseCheckItemActive: {
    borderColor: '#10B981',
    backgroundColor: '#13281E',
  },
  clauseCheckIcon: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 2,
  },
  clauseCheckTexts: {
    flex: 1,
  },
  clauseCheckTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F3F4F6',
  },
  clauseCheckSub: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
  },
  metaLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  metaVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F3F4F6',
  },
  actionSection: {
    marginTop: 8,
  },
});

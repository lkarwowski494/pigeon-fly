/**
 * PIGEON-FLY — Urzędowy Protokół Szczepień Ochronnych Modal (Z-069)
 * Standard PZHGP, FCI i PIW: Zaświadczenie weterynaryjne, serokonwersja 21 dni i paszport odporności.
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
  calculateFlockImmunitySummary,
  draftToPdfOptions,
  evaluatePigeonVaccineClearance,
  VACCINE_REGISTRY,
  VaccineType,
  VaccinationProtocolDraft,
} from '../domain/vaccinationProtocol';
import { PdfService } from '../services/pdfService';

interface VaccinationProtocolModalProps {
  visible: boolean;
  onClose: () => void;
}

interface DemoFlockBird {
  ringNumber: string;
  sex: 'cock' | 'hen';
  color: string;
  ageYears: number;
  vaccinationDate?: string;
}

const DEMO_BIRDS: DemoFlockBird[] = [
  {
    ringNumber: 'PL-0284-23-1402',
    sex: 'cock',
    color: 'Niebieski nakrapiany',
    ageYears: 3,
    vaccinationDate: '2026-02-15', // W pełni uodporniony
  },
  {
    ringNumber: 'PL-0284-22-9854',
    sex: 'hen',
    color: 'Ciemna płowa',
    ageYears: 4,
    vaccinationDate: '2026-02-15', // W pełni uodporniony
  },
  {
    ringNumber: 'DV-01234-24-512',
    sex: 'cock',
    color: 'Pstry',
    ageYears: 2,
    vaccinationDate: '2026-05-28', // W kwarantannie (<21 dni)
  },
  {
    ringNumber: 'PL-0284-21-3310',
    sex: 'cock',
    color: 'Czerwony',
    ageYears: 5,
    vaccinationDate: '2025-05-10', // Wygasłe (>365 dni)
  },
  {
    ringNumber: 'PL-0284-24-7701',
    sex: 'hen',
    color: 'Szpak',
    ageYears: 2,
    vaccinationDate: undefined, // Brak szczepienia
  },
];

export const VaccinationProtocolModal: React.FC<VaccinationProtocolModalProps> = ({
  visible,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'certificate' | 'export'>('status');
  const [birds, setBirds] = useState<DemoFlockBird[]>(DEMO_BIRDS);

  // Certificate draft state
  const [protocolNumber, setProtocolNumber] = useState(`ZAŚ-WET/${new Date().getFullYear()}/048`);
  const [vaccineType, setVaccineType] = useState<VaccineType>('PMV1_PARAMYXO');
  const [commercialName, setCommercialName] = useState('Pharmavac Columbi 2');
  const [batchNumber, setBatchNumber] = useState('LOT-2026-09B');
  const [vaccinationDate, setVaccinationDate] = useState('2026-02-15');
  const [expiryDate, setExpiryDate] = useState('2027-02-15');

  // Vet details
  const [veterinarianName, setVeterinarianName] = useState('dr n. wet. Janusz Kaczmarek');
  const [veterinarianPwzw, setVeterinarianPwzw] = useState('PWZ-WET-18492');
  const [clinicName, setClinicName] = useState('Przychodnia Weterynaryjna Ptaków Pocztowych');
  const [clinicAddress, setClinicAddress] = useState('ul. Parkowa 12, 63-900 Rawicz');

  // Breeder details
  const [breederName, setBreederName] = useState('Stanisław Kowalski');
  const [breederAddress, setBreederAddress] = useState('ul. Leśna 4, 63-900 Rawicz');
  const [pzhgpBranch, setPzhgpBranch] = useState('Oddział 0284 Gostyń');
  const [pzhgpSection, setPzhgpSection] = useState('Sekcja 01 Gostyń-Centrum');

  const summary = calculateFlockImmunitySummary(birds);

  const handleSelectVaccineType = (type: VaccineType) => {
    setVaccineType(type);
    const meta = VACCINE_REGISTRY[type];
    setCommercialName(meta.tradeName.split('/')[0].trim());
  };

  const handleApplyVaccinationToAll = () => {
    Alert.alert(
      'Urzędowe Szczepienie Stada',
      `Czy chcesz zastosować szczepienie ${commercialName} (seria: ${batchNumber}) z datą ${vaccinationDate} dla wszystkich ${birds.length} gołębi w stadzie?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Zastosuj do stada',
          onPress: () => {
            setBirds((prev) =>
              prev.map((b) => ({
                ...b,
                vaccinationDate,
              }))
            );
            Alert.alert('Sukces', 'Zaktualizowano daty szczepień dla całego stada.');
            setActiveTab('status');
          },
        },
      ]
    );
  };

  const handleExportPdf = async (mode: 'print' | 'share') => {
    try {
      const draft: VaccinationProtocolDraft = {
        protocolNumber,
        issueDate: new Date().toISOString().slice(0, 10),
        vaccinationDate,
        vaccineType,
        commercialName,
        batchNumber,
        expiryDate,
        veterinarianName,
        veterinarianPwzw,
        clinicName,
        clinicAddress,
        breederName,
        breederAddress,
        pzhgpBranch,
        pzhgpSection,
        pigeons: birds.map((b) => ({
          ringNumber: b.ringNumber,
          sex: b.sex,
          color: b.color,
          ageYears: b.ageYears,
        })),
      };

      const pdfOptions = draftToPdfOptions(draft);
      await PdfService.exportVaccinationCertificate(pdfOptions, mode);
    } catch (e: any) {
      Alert.alert('Błąd eksportu', e?.message || 'Nie udało się wyeksportować zaświadczenia.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>💉 Urzędowy Protokół Szczepień PZHGP (Z-069)</Text>
              <Text style={styles.subTitle}>
                Zaświadczenie weterynaryjne PIW, 21-dniowa serokonwersja i dopuszczenie do lotów
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="btn-close-vaccination-modal">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Metrics Banner */}
          <View style={styles.metricsBanner}>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>ODPORNOŚĆ</Text>
              <Text
                style={[
                  styles.metricVal,
                  { color: summary.flockImmunityPercentage >= 90 ? '#4CAF50' : '#E05656' },
                ]}
              >
                {summary.flockImmunityPercentage}%
              </Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>DOPUSZCZONE</Text>
              <Text style={[styles.metricVal, { color: '#4CAF50' }]}>{summary.eligibleCount}</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>KWARANTANNA</Text>
              <Text
                style={[
                  styles.metricVal,
                  { color: summary.seroconvertingCount > 0 ? '#E5A93C' : '#8A92A0' },
                ]}
              >
                {summary.seroconvertingCount}
              </Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>WYGASŁE/BRAK</Text>
              <Text
                style={[
                  styles.metricVal,
                  { color: summary.expiredCount + summary.unvaccinatedCount > 0 ? '#E05656' : '#8A92A0' },
                ]}
              >
                {summary.expiredCount + summary.unvaccinatedCount}
              </Text>
            </View>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'status' && styles.tabButtonActive]}
              onPress={() => setActiveTab('status')}
              testID="tab-vaccine-status"
            >
              <Text style={[styles.tabButtonText, activeTab === 'status' && styles.tabButtonTextActive]}>
                📋 Stan Stada ({birds.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'certificate' && styles.tabButtonActive]}
              onPress={() => setActiveTab('certificate')}
              testID="tab-vaccine-certificate"
            >
              <Text style={[styles.tabButtonText, activeTab === 'certificate' && styles.tabButtonTextActive]}>
                👨‍⚕️ Zaświadczenie Wet.
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'export' && styles.tabButtonActive]}
              onPress={() => setActiveTab('export')}
              testID="tab-vaccine-export"
            >
              <Text style={[styles.tabButtonText, activeTab === 'export' && styles.tabButtonTextActive]}>
                🖨️ Druk Urzędowy A4
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content Body */}
          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }}>
            {activeTab === 'status' && (
              <View>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Indywidualna Kontrola Odporności PMV-1</Text>
                  <Text style={styles.sectionSubtitle}>
                    Zgodność z 21-dniową kwarantanną i 365-dniową ważnością szczepionki
                  </Text>
                </View>

                {summary.warnings.length > 0 && (
                  <View style={styles.alertCard}>
                    <Text style={styles.alertTitle}>⚠️ Uwagi Weterynaryjne i Regulaminowe:</Text>
                    {summary.warnings.map((w, idx) => (
                      <Text key={idx} style={styles.alertText}>
                        • {w}
                      </Text>
                    ))}
                  </View>
                )}

                {birds.map((bird, idx) => {
                  const clearanceRes = evaluatePigeonVaccineClearance(bird.vaccinationDate);
                  const isOk = clearanceRes.basketingAllowed;
                  const isQuarantine = clearanceRes.clearance === 'IN_SEROCONVERSION';
                  const isExpiring = clearanceRes.clearance === 'EXPIRING_SOON';

                  let badgeColor = '#4CAF50';
                  let badgeText = 'Dopuszczony do lotu';

                  if (clearanceRes.clearance === 'IN_SEROCONVERSION') {
                    badgeColor = '#E5A93C';
                    badgeText = `Kwarantanna (jeszcze ${21 - (clearanceRes.daysSinceInjection || 0)} dni)`;
                  } else if (clearanceRes.clearance === 'EXPIRING_SOON') {
                    badgeColor = '#FF9500';
                    badgeText = `Wygasa za ${clearanceRes.daysUntilExpiry} dni`;
                  } else if (clearanceRes.clearance === 'EXPIRED') {
                    badgeColor = '#E05656';
                    badgeText = 'Szczepienie wygasło';
                  } else if (clearanceRes.clearance === 'UNVACCINATED') {
                    badgeColor = '#E05656';
                    badgeText = 'Brak szczepienia';
                  }

                  return (
                    <View key={bird.ringNumber} style={styles.birdCard}>
                      <View style={styles.birdHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.birdIndex}>#{idx + 1}</Text>
                          <Text style={styles.birdRing}>{bird.ringNumber}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: `${badgeColor}22`, borderColor: badgeColor }]}>
                          <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeText}</Text>
                        </View>
                      </View>

                      <View style={styles.birdDetailsRow}>
                        <Text style={styles.birdDetail}>
                          Płeć: <Text style={styles.birdVal}>{bird.sex === 'cock' ? '1.0 ♂' : '0.1 ♀'}</Text>
                        </Text>
                        <Text style={styles.birdDetail}>
                          Barwa: <Text style={styles.birdVal}>{bird.color}</Text>
                        </Text>
                        <Text style={styles.birdDetail}>
                          Wiek: <Text style={styles.birdVal}>{bird.ageYears} lata</Text>
                        </Text>
                        <Text style={styles.birdDetail}>
                          Szczepienie:{' '}
                          <Text style={styles.birdVal}>
                            {bird.vaccinationDate || 'Brak'}
                          </Text>
                        </Text>
                      </View>

                      {clearanceRes.rejectionReason && (
                        <Text style={styles.rejectionReasonText}>
                          ⛔ {clearanceRes.rejectionReason}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {activeTab === 'certificate' && (
              <View>
                <Text style={styles.sectionTitle}>Dane Zaświadczenia i Preparatu</Text>
                <Text style={styles.sectionSubtitle}>
                  Wpisz dane lekarza weterynarii oraz partii leku z fiolki
                </Text>

                {/* Vaccine Selector */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Typ Preparatu Szczepionkowego *</Text>
                  <View style={styles.vaccineSelectorGrid}>
                    {(Object.keys(VACCINE_REGISTRY) as VaccineType[]).map((vKey) => {
                      const vMeta = VACCINE_REGISTRY[vKey];
                      const isSelected = vaccineType === vKey;
                      return (
                        <TouchableOpacity
                          key={vKey}
                          style={[styles.vaccineChoiceBtn, isSelected && styles.vaccineChoiceBtnActive]}
                          onPress={() => handleSelectVaccineType(vKey)}
                        >
                          <Text style={[styles.vaccineChoiceTitle, isSelected && styles.vaccineChoiceTitleActive]}>
                            {vKey === 'PMV1_PARAMYXO' ? '💉 PMV-1 (Paramykso)' : vKey === 'SALMONELLA_PARATYPHUS' ? '🧪 SalmoPT (Salmonella)' : vKey === 'POX_DIPHTHERIA' ? '🪶 Ospa i Dyfteryt' : '🛡️ PMV + Herpes'}
                          </Text>
                          <Text style={styles.vaccineChoiceDesc} numberOfLines={2}>
                            {vMeta.tradeName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.rowTwoCols}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Nazwa Handlowa</Text>
                    <TextInput
                      style={styles.input}
                      value={commercialName}
                      onChangeText={setCommercialName}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Seria / Batch *</Text>
                    <TextInput
                      style={styles.input}
                      value={batchNumber}
                      onChangeText={setBatchNumber}
                    />
                  </View>
                </View>

                <View style={styles.rowTwoCols}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Data Szczepienia (Iniekcji)</Text>
                    <TextInput
                      style={styles.input}
                      value={vaccinationDate}
                      onChangeText={setVaccinationDate}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Ważność (365 dni)</Text>
                    <TextInput
                      style={styles.input}
                      value={expiryDate}
                      onChangeText={setExpiryDate}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.applyAllBtn}
                  onPress={handleApplyVaccinationToAll}
                  testID="btn-apply-vaccine-flock"
                >
                  <Text style={styles.applyAllBtnText}>🔄 Zastosuj to szczepienie dla całego stada ({birds.length} szt.)</Text>
                </TouchableOpacity>

                <View style={styles.dividerHorizontal} />

                <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Dane Gabinetu Weterynaryjnego</Text>

                <View style={styles.rowTwoCols}>
                  <View style={[styles.formGroup, { flex: 1.4 }]}>
                    <Text style={styles.label}>Lekarz Weterynarii *</Text>
                    <TextInput
                      style={styles.input}
                      value={veterinarianName}
                      onChangeText={setVeterinarianName}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Nr PWZW *</Text>
                    <TextInput
                      style={styles.input}
                      value={veterinarianPwzw}
                      onChangeText={setVeterinarianPwzw}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Nazwa Przychodni / Lecznicy</Text>
                  <TextInput
                    style={styles.input}
                    value={clinicName}
                    onChangeText={setClinicName}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Adres Przychodni</Text>
                  <TextInput
                    style={styles.input}
                    value={clinicAddress}
                    onChangeText={setClinicAddress}
                  />
                </View>
              </View>
            )}

            {activeTab === 'export' && (
              <View>
                <Text style={styles.sectionTitle}>Urzędowe Zaświadczenie PZHGP / PIW (A4)</Text>
                <Text style={styles.sectionSubtitle}>
                  Gotowy do druku i podpisu arkusz potwierdzenia szczepienia stada
                </Text>

                <View style={styles.certPreviewCard}>
                  <View style={styles.certHeaderRow}>
                    <Text style={styles.certTitlePreview}>URZĘDOWE ZAŚWIADCZENIE SZCZEPIENIA</Text>
                    <Text style={styles.certNoPreview}>{protocolNumber}</Text>
                  </View>
                  <Text style={styles.certMetaLine}>Lekarz: {veterinarianName} (PWZ: {veterinarianPwzw})</Text>
                  <Text style={styles.certMetaLine}>Lecznica: {clinicName}, {clinicAddress}</Text>
                  <Text style={styles.certMetaLine}>Hodowca: {breederName} ({pzhgpBranch})</Text>
                  <Text style={styles.certMetaLine}>Biopreparat: {commercialName} (Seria: {batchNumber})</Text>
                  <Text style={styles.certMetaLine}>Data iniekcji: {vaccinationDate} | Ważność: {expiryDate}</Text>
                  <Text style={styles.certMetaLine}>Liczba gołębi w wykazie: {birds.length} szt.</Text>

                  <View style={styles.certSealBox}>
                    <Text style={styles.certSealText}>Pieczęć i podpis uprawnionego lekarza weterynarii</Text>
                  </View>
                </View>

                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnPrint]}
                    onPress={() => handleExportPdf('print')}
                    testID="btn-print-vaccination-cert"
                  >
                    <Text style={styles.actionBtnText}>🖨️ Drukuj Zaświadczenie A4</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnShare]}
                    onPress={() => handleExportPdf('share')}
                    testID="btn-share-vaccination-cert"
                  >
                    <Text style={styles.actionBtnText}>📤 Udostępnij PDF</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '94%',
    backgroundColor: '#1E2127',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#4CAF50',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2C313A',
    backgroundColor: '#16181D',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  subTitle: {
    fontSize: 11,
    color: '#8A92A0',
    marginTop: 2,
  },
  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2E37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  metricsBanner: {
    flexDirection: 'row',
    backgroundColor: '#16191E',
    borderBottomWidth: 1,
    borderColor: '#2C313A',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerVertical: {
    width: 1,
    backgroundColor: '#2C313A',
  },
  dividerHorizontal: {
    height: 1,
    backgroundColor: '#2C313A',
    marginVertical: 14,
  },
  metricLabel: {
    fontSize: 9,
    color: '#8A92A0',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#191C22',
    borderBottomWidth: 1,
    borderBottomColor: '#2C313A',
  },
  tabButton: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabButtonActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#4CAF50',
    backgroundColor: '#21252D',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A92A0',
  },
  tabButtonTextActive: {
    color: '#4CAF50',
  },
  body: {
    padding: 16,
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#8A92A0',
    marginTop: 2,
  },
  alertCard: {
    backgroundColor: '#322312',
    borderWidth: 1,
    borderColor: '#E5A93C',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#E5A93C',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 11,
    color: '#E0D0B0',
    marginTop: 2,
  },
  birdCard: {
    backgroundColor: '#16181D',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2C313A',
  },
  birdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  birdIndex: {
    fontSize: 11,
    color: '#8A92A0',
    fontWeight: 'bold',
  },
  birdRing: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  birdDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  birdDetail: {
    fontSize: 11,
    color: '#8A92A0',
  },
  birdVal: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  rejectionReasonText: {
    fontSize: 10.5,
    color: '#E05656',
    marginTop: 6,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#A0A8B4',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#14171C',
    borderWidth: 1,
    borderColor: '#2C313A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 13,
    minHeight: 48,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 10,
  },
  vaccineSelectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vaccineChoiceBtn: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#14171C',
    borderWidth: 1,
    borderColor: '#2C313A',
    borderRadius: 8,
    padding: 10,
    minHeight: 52,
  },
  vaccineChoiceBtnActive: {
    backgroundColor: '#1B2C1E',
    borderColor: '#4CAF50',
  },
  vaccineChoiceTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8A92A0',
  },
  vaccineChoiceTitleActive: {
    color: '#4CAF50',
  },
  vaccineChoiceDesc: {
    fontSize: 10,
    color: '#656D7A',
    marginTop: 2,
  },
  applyAllBtn: {
    backgroundColor: '#264228',
    borderColor: '#4CAF50',
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: 4,
  },
  applyAllBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#81C784',
  },
  certPreviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginTop: 8,
    marginBottom: 16,
  },
  certHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 8,
    marginBottom: 10,
  },
  certTitlePreview: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  certNoPreview: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E5A93C',
    fontFamily: 'monospace',
  },
  certMetaLine: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 18,
  },
  certSealBox: {
    marginTop: 16,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: '#94A3B8',
    paddingTop: 8,
    alignItems: 'center',
  },
  certSealText: {
    fontSize: 10,
    color: '#64748B',
    fontStyle: 'italic',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    minHeight: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnPrint: {
    backgroundColor: '#2B579A',
  },
  actionBtnShare: {
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

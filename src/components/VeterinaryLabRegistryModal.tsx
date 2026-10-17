/**
 * PIGEON-FLY — Veterinary Laboratory Registry & Antibiogram Modal (Z-088 / DEC-102)
 * Field Mode ergonomic interface (>= 48-56pt touch targets), dark theme (#121417).
 * Manages coproscopy, crop swabs, Salmonella culture, and antibiogram sensitivity.
 */

import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  VeterinaryLabReportData,
  SampleType,
  AntibiogramEntry,
  evaluateVeterinaryLabReport,
  generateVeterinaryLabReportHtml,
  SAMPLE_TYPE_LABELS,
} from '../domain/veterinaryLabRegistry';
import { PdfService } from '../services/pdfService';
import { FieldButton } from './FieldButton';

interface VeterinaryLabRegistryModalProps {
  visible: boolean;
  onClose: () => void;
  defaultLoftName?: string;
  defaultBreederName?: string;
  defaultBreederPzhgpNumber?: string;
}

export const VeterinaryLabRegistryModal: React.FC<VeterinaryLabRegistryModalProps> = ({
  visible,
  onClose,
  defaultLoftName = 'Gołębnik Mistrza Pigeon-Fly',
  defaultBreederName = 'Tomasz Nowak',
  defaultBreederPzhgpNumber = 'PL-0284-1102',
}) => {
  // Report Meta
  const [reportNumber, setReportNumber] = useState('LAB-VET-2026/041');
  const [samplingDate, setSamplingDate] = useState('2026-03-20');
  const [completionDate, setCompletionDate] = useState('2026-03-23');
  const [laboratoryName, setLaboratoryName] = useState('Zakład Higieny Weterynaryjnej (ZHW) Poznań');
  const [veterinarianName, setVeterinarianName] = useState('Lek. wet. Janusz Ptasiński');
  const [sampleType, setSampleType] = useState<SampleType>('pool_feces_3day');
  const [flockSection, setFlockSection] = useState<'wdowcy' | 'samice' | 'mlode' | 'rozplod' | 'cale_stado'>('wdowcy');

  // Diagnostics state
  const [coccidiaOpg, setCoccidiaOpg] = useState(1200);
  const [ascaridiaPresent, setAscaridiaPresent] = useState(false);
  const [ascaridiaEpg, setAscaridiaEpg] = useState(0);
  const [capillariaPresent, setCapillariaPresent] = useState(false);
  const [capillariaEpg, setCapillariaEpg] = useState(0);
  const [trichomonasLevel, setTrichomonasLevel] = useState<'negative' | 'low' | 'moderate' | 'high'>('low');
  const [candidaDetected, setCandidaDetected] = useState(false);
  const [hexamitaDetected, setHexamitaDetected] = useState(false);
  const [salmonellaDetected, setSalmonellaDetected] = useState(false);
  const [pathogenicEColiDetected, setPathogenicEColiDetected] = useState(false);

  // Antibiogram
  const [antibiogram, setAntibiogram] = useState<AntibiogramEntry[]>([
    { antibioticName: 'Enrofloksacyna', susceptibility: 'S', notes: 'I wybór' },
    { antibioticName: 'Doksycyklina', susceptibility: 'I', notes: 'Średnia wrażliwość' },
    { antibioticName: 'Amoksycylina + kwas klaw.', susceptibility: 'S', notes: 'Alternatywa' },
    { antibioticName: 'Tetracyklina', susceptibility: 'R', notes: 'Szczep oporny' },
  ]);

  // Prescription
  const [treatmentPrescribed, setTreatmentPrescribed] = useState(true);
  const [medicationName, setMedicationName] = useState('Ronidazol 10% + Baycox');
  const [activeSubstance, setActiveSubstance] = useState('Ronidazol, Toltrazuril');
  const [dosageInstruction, setDosageInstruction] = useState('2 g / 1 litr wody pitnej');
  const [treatmentDurationDays, setTreatmentDurationDays] = useState(5);
  const [withdrawalDays, setWithdrawalDays] = useState(3);
  const [retestRecommendedDays, setRetestRecommendedDays] = useState(14);
  const [doctorNotes, setDoctorNotes] = useState('Po kuracji podawać probiotyk i witaminy B-kompleks.');

  // Active view tab: 'diagnostics' | 'antibiogram' | 'prescription'
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'antibiogram' | 'prescription'>('diagnostics');

  const reportData: VeterinaryLabReportData = useMemo(
    () => ({
      reportNumber,
      samplingDate,
      completionDate,
      laboratoryName,
      veterinarianName,
      sampleType,
      loftName: defaultLoftName,
      breederName: defaultBreederName,
      breederPzhgpNumber: defaultBreederPzhgpNumber,
      flockSection,
      coccidiaOpg,
      ascaridiaPresent,
      ascaridiaEpg,
      capillariaPresent,
      capillariaEpg,
      trichomonasLevel,
      candidaDetected,
      hexamitaDetected,
      salmonellaDetected,
      pathogenicEColiDetected,
      antibiogram,
      treatmentPrescribed,
      medicationName,
      activeSubstance,
      dosageInstruction,
      treatmentDurationDays,
      withdrawalDays,
      retestRecommendedDays,
      doctorNotes,
    }),
    [
      reportNumber,
      samplingDate,
      completionDate,
      laboratoryName,
      veterinarianName,
      sampleType,
      defaultLoftName,
      defaultBreederName,
      defaultBreederPzhgpNumber,
      flockSection,
      coccidiaOpg,
      ascaridiaPresent,
      ascaridiaEpg,
      capillariaPresent,
      capillariaEpg,
      trichomonasLevel,
      candidaDetected,
      hexamitaDetected,
      salmonellaDetected,
      pathogenicEColiDetected,
      antibiogram,
      treatmentPrescribed,
      medicationName,
      activeSubstance,
      dosageInstruction,
      treatmentDurationDays,
      withdrawalDays,
      retestRecommendedDays,
      doctorNotes,
    ]
  );

  const evaluation = useMemo(() => {
    return evaluateVeterinaryLabReport(reportData);
  }, [reportData]);

  const handleToggleSusceptibility = (index: number) => {
    setAntibiogram((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const nextSus: 'S' | 'I' | 'R' =
          item.susceptibility === 'S' ? 'I' : item.susceptibility === 'I' ? 'R' : 'S';
        return { ...item, susceptibility: nextSus };
      })
    );
  };

  const handlePrint = async () => {
    try {
      const html = generateVeterinaryLabReportHtml(reportData);
      await PdfService.printHtml(html);
    } catch {
      Alert.alert('Błąd wydruku', 'Nie udało się zainicjować wydruku sprawozdania laboratoryjnego.');
    }
  };

  const handleShare = async () => {
    try {
      const html = generateVeterinaryLabReportHtml(reportData);
      await PdfService.shareHtmlAsPdf(
        html,
        `Sprawozdanie_Lab_Vet_${reportNumber.replace(/[\/\\]/g, '_')}.pdf`
      );
    } catch {
      Alert.alert('Błąd eksportu', 'Nie udało się wyeksportować sprawozdania do PDF.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>🔬 Kartoteka Badań Laboratoryjnych</Text>
            <Text style={styles.headerSubtitle}>
              Koproskopia, Wymazy i Antybiogram (Z-088 / DEC-102)
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Zamknij kartotekę laboratoryjną"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Status Banner */}
          <View style={[styles.statusCard, { borderColor: evaluation.statusColor }]}>
            <View style={styles.statusTopRow}>
              <View style={[styles.statusPill, { backgroundColor: evaluation.statusColor + '25' }]}>
                <Text style={[styles.statusText, { color: evaluation.statusColor }]}>
                  {evaluation.statusLabel}
                </Text>
              </View>
              <View
                style={[
                  styles.racingBadge,
                  {
                    backgroundColor: evaluation.isFitForRacing
                      ? '#10B98125'
                      : '#EF444425',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.racingBadgeText,
                    { color: evaluation.isFitForRacing ? '#10B981' : '#EF4444' },
                  ]}
                >
                  {evaluation.isFitForRacing ? '✈️ ZDOLNY DO LOTU' : '🚫 ZAKAZ KOSZOWANIA'}
                </Text>
              </View>
            </View>
            <Text style={styles.diagnosisSummary}>
              Rozpoznanie: {evaluation.primaryDiagnoses.join(' • ')}
            </Text>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'diagnostics' && styles.tabBtnActive]}
              onPress={() => setActiveTab('diagnostics')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'diagnostics' && styles.tabBtnTextActive,
                ]}
              >
                🧫 Diagnostyka
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'antibiogram' && styles.tabBtnActive]}
              onPress={() => setActiveTab('antibiogram')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'antibiogram' && styles.tabBtnTextActive,
                ]}
              >
                🧪 Antybiogram ({antibiogram.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'prescription' && styles.tabBtnActive]}
              onPress={() => setActiveTab('prescription')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'prescription' && styles.tabBtnTextActive,
                ]}
              >
                💊 Ordynacja Leków
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab 1: Diagnostics */}
          {activeTab === 'diagnostics' && (
            <View style={styles.tabSection}>
              {/* Sample Type Picker */}
              <Text style={styles.sectionTitle}>RODZAJ PRÓBKI I SEKCJA STADA</Text>
              <View style={styles.pickerGrid}>
                {(
                  [
                    'pool_feces_3day',
                    'crop_swab',
                    'cloacal_swab_culture',
                    'blood_serology',
                  ] as SampleType[]
                ).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.pickerBtn, sampleType === t && styles.pickerBtnActive]}
                    onPress={() => setSampleType(t)}
                  >
                    <Text
                      style={[
                        styles.pickerBtnText,
                        sampleType === t && styles.pickerBtnTextActive,
                      ]}
                    >
                      {t === 'pool_feces_3day' && '💩 Kał (3 dni)'}
                      {t === 'crop_swab' && '🔬 Wymaz z Wola'}
                      {t === 'cloacal_swab_culture' && '🧫 Posiew Kloaka'}
                      {t === 'blood_serology' && '💉 Serologia'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Coproscopy Results Card */}
              <View style={styles.card}>
                <Text style={styles.cardHeaderTitle}>KOPROSKOPIA I PASOŻYTY PRZEWODU POKARMOWEGO</Text>

                {/* Coccidia Stepper */}
                <View style={styles.stepperRow}>
                  <View style={styles.stepperLabelCol}>
                    <Text style={styles.stepperLabel}>Kokcydioza (Eimeria sp.):</Text>
                    <Text
                      style={[
                        styles.stepperSub,
                        { color: coccidiaOpg > 5000 ? '#EF4444' : '#38BDF8' },
                      ]}
                    >
                      {coccidiaOpg} OPG ({coccidiaOpg < 1000 ? 'Norma' : coccidiaOpg < 6000 ? 'Umiarkowana' : 'Ostra!'})
                    </Text>
                  </View>
                  <View style={styles.stepperControls}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setCoccidiaOpg((prev) => Math.max(0, prev - 500))}
                    >
                      <Text style={styles.stepBtnText}>-500</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setCoccidiaOpg((prev) => Math.min(30000, prev + 500))}
                    >
                      <Text style={styles.stepBtnText}>+500</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Ascaridia Roundworms */}
                <View style={styles.toggleRowItem}>
                  <Text style={styles.toggleLabel}>Glista Gołębia (Ascaridia columbae):</Text>
                  <TouchableOpacity
                    style={[
                      styles.statusToggleBtn,
                      !ascaridiaPresent ? styles.btnGreen : styles.btnRed,
                    ]}
                    onPress={() => {
                      setAscaridiaPresent(!ascaridiaPresent);
                      setAscaridiaEpg(!ascaridiaPresent ? 250 : 0);
                    }}
                  >
                    <Text style={styles.statusToggleText}>
                      {!ascaridiaPresent ? 'UJEMNY' : `OBECNE (${ascaridiaEpg} EPG)`}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Capillaria Hairworms */}
                <View style={styles.toggleRowItem}>
                  <Text style={styles.toggleLabel}>Nicienie Włoskowate (Capillaria):</Text>
                  <TouchableOpacity
                    style={[
                      styles.statusToggleBtn,
                      !capillariaPresent ? styles.btnGreen : styles.btnRed,
                    ]}
                    onPress={() => {
                      setCapillariaPresent(!capillariaPresent);
                      setCapillariaEpg(!capillariaPresent ? 450 : 0);
                    }}
                  >
                    <Text style={styles.statusToggleText}>
                      {!capillariaPresent ? 'UJEMNY' : `OBECNE (${capillariaEpg} EPG)`}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Trichomonas Canker */}
                <View style={styles.toggleRowItem}>
                  <Text style={styles.toggleLabel}>Rzęsistkowica (Żółty Guzek):</Text>
                  <TouchableOpacity
                    style={[
                      styles.statusToggleBtn,
                      trichomonasLevel === 'negative'
                        ? styles.btnGreen
                        : trichomonasLevel === 'low'
                        ? styles.btnBlue
                        : trichomonasLevel === 'moderate'
                        ? styles.btnAmber
                        : styles.btnRed,
                    ]}
                    onPress={() => {
                      const next =
                        trichomonasLevel === 'negative'
                          ? 'low'
                          : trichomonasLevel === 'low'
                          ? 'moderate'
                          : trichomonasLevel === 'moderate'
                          ? 'high'
                          : 'negative';
                      setTrichomonasLevel(next);
                    }}
                  >
                    <Text style={styles.statusToggleText}>{trichomonasLevel.toUpperCase()}</Text>
                  </TouchableOpacity>
                </View>

                {/* Salmonella Culture */}
                <View style={[styles.toggleRowItem, { borderBottomWidth: 0 }]}>
                  <Text style={styles.toggleLabel}>Salmonella (Paratyfus) Posiew:</Text>
                  <TouchableOpacity
                    style={[
                      styles.statusToggleBtn,
                      !salmonellaDetected ? styles.btnGreen : styles.btnRed,
                    ]}
                    onPress={() => setSalmonellaDetected(!salmonellaDetected)}
                  >
                    <Text style={styles.statusToggleText}>
                      {!salmonellaDetected ? 'UJEMNY (Czysto)' : 'POZYTYWNY (ZAKAZ!)'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Tab 2: Antibiogram */}
          {activeTab === 'antibiogram' && (
            <View style={styles.tabSection}>
              <View style={styles.card}>
                <Text style={styles.cardHeaderTitle}>LEKOWRAŻLIWOŚĆ DROBNOUSTROJÓW (ANTYBIOGRAM)</Text>
                <Text style={styles.cardSub}>
                  Dotknij przycisk wrażliwości, aby zmienić status: S (Wrażliwy) → I (Średni) → R (Oporny)
                </Text>

                {antibiogram.map((entry, idx) => (
                  <View key={entry.antibioticName} style={styles.antibiogramRow}>
                    <View style={styles.antibioticInfo}>
                      <Text style={styles.antibioticName}>{entry.antibioticName}</Text>
                      <Text style={styles.antibioticNotes}>{entry.notes || 'Brak uwag'}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.susceptibilityBtn,
                        entry.susceptibility === 'S'
                          ? styles.btnGreen
                          : entry.susceptibility === 'I'
                          ? styles.btnAmber
                          : styles.btnRed,
                      ]}
                      onPress={() => handleToggleSusceptibility(idx)}
                    >
                      <Text style={styles.susceptibilityBtnText}>
                        {entry.susceptibility === 'S'
                          ? 'WRAŻLIWY (S)'
                          : entry.susceptibility === 'I'
                          ? 'ŚREDNI (I)'
                          : 'OPORNY (R)'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tab 3: Prescription & Retest */}
          {activeTab === 'prescription' && (
            <View style={styles.tabSection}>
              <View style={styles.card}>
                <Text style={styles.cardHeaderTitle}>ORDYNACJA LEKARSKA I ZALECENIA</Text>

                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Nazwa Preparatu:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={medicationName}
                    onChangeText={setMedicationName}
                    placeholder="np. Baycox 2.5%..."
                    placeholderTextColor="#64748B"
                  />
                </View>

                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Substancja Czynna:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={activeSubstance}
                    onChangeText={setActiveSubstance}
                    placeholder="np. Toltrazuril..."
                    placeholderTextColor="#64748B"
                  />
                </View>

                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Dawkowanie:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={dosageInstruction}
                    onChangeText={setDosageInstruction}
                    placeholder="np. 2 ml / 1 L wody..."
                    placeholderTextColor="#64748B"
                  />
                </View>

                <View style={styles.stepperRow}>
                  <View style={styles.stepperLabelCol}>
                    <Text style={styles.stepperLabel}>Czas Trwania Kuracji:</Text>
                    <Text style={styles.stepperSub}>{treatmentDurationDays} dni</Text>
                  </View>
                  <View style={styles.stepperControls}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setTreatmentDurationDays((prev) => Math.max(1, prev - 1))}
                    >
                      <Text style={styles.stepBtnText}>-1d</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setTreatmentDurationDays((prev) => Math.min(21, prev + 1))}
                    >
                      <Text style={styles.stepBtnText}>+1d</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.stepperRow}>
                  <View style={styles.stepperLabelCol}>
                    <Text style={styles.stepperLabel}>Karencja Lotowa:</Text>
                    <Text style={[styles.stepperSub, { color: '#EF4444' }]}>
                      {withdrawalDays} dni bez koszowania
                    </Text>
                  </View>
                  <View style={styles.stepperControls}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setWithdrawalDays((prev) => Math.max(0, prev - 1))}
                    >
                      <Text style={styles.stepBtnText}>-1d</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setWithdrawalDays((prev) => Math.min(28, prev + 1))}
                    >
                      <Text style={styles.stepBtnText}>+1d</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.cardRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.cardLabel}>Zalecenia Lekarza:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={doctorNotes}
                    onChangeText={setDoctorNotes}
                    placeholder="Dodatkowe uwagi..."
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <FieldButton
              title="Drukuj Raport A4"
              variant="primary"
              onPress={handlePrint}
              style={styles.actionBtn}
            />
            <FieldButton
              title="Udostępnij PDF"
              variant="secondary"
              onPress={handleShare}
              style={styles.actionBtn}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#262A30',
    backgroundColor: '#1A1D23',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F0F2F5',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8A92A0',
    marginTop: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#262A30',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeButtonText: {
    color: '#F0F2F5',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: '#1A1D23',
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 16,
  },
  statusTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  racingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  racingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  diagnosisSummary: {
    fontSize: 11,
    color: '#8A92A0',
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#1A1D23',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#262A30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#0284C725',
    borderColor: '#0284C7',
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A92A0',
  },
  tabBtnTextActive: {
    color: '#38BDF8',
  },
  tabSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8A92A0',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  pickerBtn: {
    flex: 1,
    minWidth: '45%',
    height: 48,
    backgroundColor: '#1E2229',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2D333D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  pickerBtnActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#0284C725',
  },
  pickerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A92A0',
  },
  pickerBtnTextActive: {
    color: '#38BDF8',
  },
  card: {
    backgroundColor: '#1A1D23',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#262A30',
    padding: 12,
    marginBottom: 10,
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F0F2F5',
    borderBottomWidth: 1,
    borderBottomColor: '#262A30',
    paddingBottom: 8,
    marginBottom: 8,
  },
  cardSub: {
    fontSize: 11,
    color: '#8A92A0',
    marginBottom: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#262A30',
  },
  stepperLabelCol: {
    flex: 1,
  },
  stepperLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  stepperSub: {
    fontSize: 12,
    color: '#38BDF8',
    marginTop: 2,
    fontWeight: '700',
  },
  stepperControls: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBtn: {
    minWidth: 48,
    height: 48,
    backgroundColor: '#262A30',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  stepBtnText: {
    color: '#F0F2F5',
    fontSize: 12,
    fontWeight: '700',
  },
  toggleRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#22262E',
  },
  toggleLabel: {
    fontSize: 12,
    color: '#CBD5E1',
    flex: 1,
  },
  statusToggleBtn: {
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusToggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F0F2F5',
  },
  btnGreen: {
    backgroundColor: '#10B98125',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  btnRed: {
    backgroundColor: '#EF444425',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  btnAmber: {
    backgroundColor: '#F59E0B25',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  btnBlue: {
    backgroundColor: '#0284C725',
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  antibiogramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#262A30',
  },
  antibioticInfo: {
    flex: 1,
  },
  antibioticName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F0F2F5',
  },
  antibioticNotes: {
    fontSize: 10,
    color: '#8A92A0',
    marginTop: 1,
  },
  susceptibilityBtn: {
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  susceptibilityBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F0F2F5',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#22262E',
  },
  cardLabel: {
    fontSize: 12,
    color: '#8A92A0',
    width: '40%',
  },
  textInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#22262E',
    borderRadius: 6,
    paddingHorizontal: 10,
    color: '#F0F2F5',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    height: 48,
  },
});

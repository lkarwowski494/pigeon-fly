/**
 * PIGEON-FLY — Generator Świadectwa Zgonu i Protokołu Utylizacji Padłego Gołębia (Z-090 / DEC-104)
 * Field Mode ergonomic interface (>= 48-56pt touch targets), dark theme (#121417).
 * Official PIW & PZHGP veterinary procedure:
 * - Cause classification (predator, infectious PMV-1/Salmonella, trauma collision, marathon exhaustion, euthanasia).
 * - Macroscopic post-mortem autopsy findings (pectoral muscles, crop, liver, air sacs, intestines).
 * - Ring disposal protocol (sheared/destroyed, deposited at branch, kept memorial).
 * - Animal byproduct disposal (UPPZ Kat. 2/3, clinical cremation, official autopsy ZHW).
 * - Epizootic alert & printable official A4 certificate HTML/PDF.
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
  PigeonMortalityProtocolData,
  PigeonMortalityCause,
  RingDisposalAction,
  CarcassDisposalMethod,
  MuscleCondition,
  CAUSE_LABELS,
  RING_DISPOSAL_LABELS,
  CARCASS_DISPOSAL_LABELS,
  validatePigeonMortality,
  evaluateEpizooticRisk,
  generatePigeonMortalityProtocolHtml,
} from '../domain/pigeonMortalityProtocol';
import { Sex } from '../domain/types';
import { PdfService } from '../services/pdfService';
import { FieldButton } from './FieldButton';

interface PigeonMortalityProtocolModalProps {
  visible: boolean;
  onClose: () => void;
  defaultLoftName?: string;
  defaultBreederName?: string;
  defaultBreederPzhgpNumber?: string;
  defaultRingNumber?: string;
  onProtocolSaved?: (data: PigeonMortalityProtocolData) => void;
}

export const PigeonMortalityProtocolModal: React.FC<PigeonMortalityProtocolModalProps> = ({
  visible,
  onClose,
  defaultLoftName = 'Mistrzowski Gołębnik Poznań',
  defaultBreederName = 'Tomasz Nowak',
  defaultBreederPzhgpNumber = 'PL-0284-1102',
  defaultRingNumber = 'PL-0284-23-1402',
  onProtocolSaved,
}) => {
  // Protocol Meta
  const [protocolNumber, setProtocolNumber] = useState('ZGON-2026/014');
  const [incidentDate, setIncidentDate] = useState('2026-04-12');
  const [discoveryTime, setDiscoveryTime] = useState('07:30');
  const [incidentLocation, setIncidentLocation] = useState('Gołębnik domowy (przedział lotników)');

  // Bird Data
  const [ringNumber, setRingNumber] = useState(defaultRingNumber);
  const [sex, setSex] = useState<Sex>('cock');
  const [plumageColor, setPlumageColor] = useState('Niebieski nakrapiany');
  const [birthYear, setBirthYear] = useState('2023');

  // Cause
  const [causeCategory, setCauseCategory] = useState<PigeonMortalityCause>('trauma_flight_collision');
  const [causeDescription, setCauseDescription] = useState('Zderzenie z linią napowietrzną podczas porannego oblotu.');
  const [epizooticNotificationRequired, setEpizooticNotificationRequired] = useState(false);
  const [epizooticDiseaseSuspected, setEpizooticDiseaseSuspected] = useState('');

  // Autopsy
  const [autopsyConducted, setAutopsyConducted] = useState(true);
  const [muscleCondition, setMuscleCondition] = useState<MuscleCondition>('normal');
  const [cropCondition, setCropCondition] = useState('Puste wole, bez serowatych nalotów rzęsistka.');
  const [liverCondition, setLiverCondition] = useState('Prawidłowa, brak zmian patologicznych i ognisk martwicy.');
  const [airSacsCondition, setAirSacsCondition] = useState('Krwotok do prawego worka piersiowego po złamaniu kości kruczej.');
  const [intestinesCondition, setIntestinesCondition] = useState('Brak zmian, brak pasożytów makroskopowych.');

  // Disposal
  const [ringDisposal, setRingDisposal] = useState<RingDisposalAction>('ring_cut_destroyed');
  const [carcassDisposal, setCarcassDisposal] = useState<CarcassDisposalMethod>('vet_cremation');
  const [disposalCompanyOrClinic, setDisposalCompanyOrClinic] = useState('Lecznica Weterynaryjna AVI-MED Poznań');
  const [disposalCertificateNumber, setDisposalCertificateNumber] = useState('UTYL-2026/889');
  const [veterinarianName, setVeterinarianName] = useState('Lek. wet. Janusz Ptasiński');
  const [vetLicenseNumber, setVetLicenseNumber] = useState('PWZW-10492');
  const [notes, setNotes] = useState('Ptak wybitny lotnik — 14 konkursów. Wyrejestrowany z aktywnego stada.');

  // Active section tab: 'details' | 'autopsy' | 'disposal'
  const [activeTab, setActiveTab] = useState<'details' | 'autopsy' | 'disposal'>('details');

  const protocolData: PigeonMortalityProtocolData = useMemo(
    () => ({
      protocolNumber,
      incidentDate,
      discoveryTime,
      loftName: defaultLoftName,
      breederName: defaultBreederName,
      breederPzhgpNumber: defaultBreederPzhgpNumber,
      ringNumber,
      sex,
      plumageColor,
      birthYear: parseInt(birthYear, 10) || 2023,
      causeCategory,
      causeDescription,
      incidentLocation,
      autopsyConducted,
      autopsyFindings: {
        muscleCondition,
        cropCondition,
        liverCondition,
        airSacsCondition,
        intestinesCondition,
      },
      ringDisposal,
      carcassDisposal,
      disposalCompanyOrClinic,
      disposalCertificateNumber,
      veterinarianName,
      vetLicenseNumber,
      epizooticNotificationRequired,
      epizooticDiseaseSuspected,
      notes,
    }),
    [
      protocolNumber,
      incidentDate,
      discoveryTime,
      defaultLoftName,
      defaultBreederName,
      defaultBreederPzhgpNumber,
      ringNumber,
      sex,
      plumageColor,
      birthYear,
      causeCategory,
      causeDescription,
      incidentLocation,
      autopsyConducted,
      muscleCondition,
      cropCondition,
      liverCondition,
      airSacsCondition,
      intestinesCondition,
      ringDisposal,
      carcassDisposal,
      disposalCompanyOrClinic,
      disposalCertificateNumber,
      veterinarianName,
      vetLicenseNumber,
      epizooticNotificationRequired,
      epizooticDiseaseSuspected,
      notes,
    ]
  );

  const epizooticAlert = evaluateEpizooticRisk(protocolData);

  const handleSaveProtocol = () => {
    const val = validatePigeonMortality(protocolData);
    if (!val.isValid) {
      Alert.alert('Błędy formularza', val.errors.join('\n'));
      return;
    }

    if (onProtocolSaved) {
      onProtocolSaved(protocolData);
    }

    Alert.alert(
      'Zatwierdzono Protokół Zgonu',
      `Gołąb ${protocolData.ringNumber} został pomyślnie wyrejestrowany ze stada aktywnego.\nPostępowanie z obrączką: ${RING_DISPOSAL_LABELS[protocolData.ringDisposal]}.\nUtylizacja: ${CARCASS_DISPOSAL_LABELS[protocolData.carcassDisposal]}.`
    );
  };

  const handlePrint = async () => {
    try {
      const html = generatePigeonMortalityProtocolHtml(protocolData);
      await PdfService.printHtml(html);
    } catch (e: any) {
      Alert.alert('Błąd drukowania', e?.message || 'Nie udało się wydrukować dokumentu.');
    }
  };

  const handleShare = async () => {
    try {
      const html = generatePigeonMortalityProtocolHtml(protocolData);
      await PdfService.shareHtmlAsPdf(
        html,
        `Protokol-Zgonu-${protocolData.protocolNumber.replace(/\//g, '_')}`
      );
    } catch (e: any) {
      Alert.alert('Błąd eksportu', e?.message || 'Nie udało się zapisać pliku PDF.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>ŚWIADECTWO ZGONU & PROTOKÓŁ UTYLIZACJI</Text>
            <Text style={styles.headerSubtitle}>
              Procedura PIW / UPPZ i wyrejestrowanie padłego gołębia (Z-090)
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            testID="btn-close-mortality-modal"
          >
            <Text style={styles.closeButtonText}>✕ Zamknij</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Epizootic Alert Banner if applicable */}
          {epizooticAlert.requiresImmediatePiwReport && (
            <View style={styles.epizooticBanner}>
              <Text style={styles.epizooticTitle}>
                ⚠️ ALARM EPIZOOTYCZNY — OBOWIĄZEK ZGŁOSZENIA DO PIW
              </Text>
              <Text style={styles.epizooticDesc}>{epizooticAlert.alertMessage}</Text>
            </View>
          )}

          {/* Section Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'details' && styles.tabActive]}
              onPress={() => setActiveTab('details')}
              testID="tab-mortality-details"
            >
              <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>
                1. Okoliczności & Ptak
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'autopsy' && styles.tabActive]}
              onPress={() => setActiveTab('autopsy')}
              testID="tab-mortality-autopsy"
            >
              <Text style={[styles.tabText, activeTab === 'autopsy' && styles.tabTextActive]}>
                2. Sekcja & Narządy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'disposal' && styles.tabActive]}
              onPress={() => setActiveTab('disposal')}
              testID="tab-mortality-disposal"
            >
              <Text style={[styles.tabText, activeTab === 'disposal' && styles.tabTextActive]}>
                3. Obrączka & UPPZ
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <View>
              {/* Meta Card */}
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>DANE FORMALNE I IDENTYFIKACJA PTAKA</Text>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Numer Protokołu PIW:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={protocolNumber}
                      onChangeText={setProtocolNumber}
                      placeholder="ZGON-2026/014"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Data Zdarzenia:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={incidentDate}
                      onChangeText={setIncidentDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Numer Obrączki Rodowej:</Text>
                    <TextInput
                      style={[styles.textInput, styles.highlightInput]}
                      value={ringNumber}
                      onChangeText={setRingNumber}
                      placeholder="PL-0284-23-1402"
                      placeholderTextColor="#64748B"
                      testID="input-mortality-ring"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Rocznik Ptaka:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={birthYear}
                      onChangeText={setBirthYear}
                      keyboardType="numeric"
                      placeholder="2023"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Płeć:</Text>
                    <View style={styles.sexRow}>
                      {(['cock', 'hen', 'unknown'] as const).map((s) => (
                        <TouchableOpacity
                          key={s}
                          style={[styles.sexChoice, sex === s && styles.sexChoiceActive]}
                          onPress={() => setSex(s)}
                        >
                          <Text style={[styles.sexChoiceText, sex === s && styles.sexChoiceTextActive]}>
                            {s === 'cock' ? '1.0 ♂' : s === 'hen' ? '0.1 ♀' : '?'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Upierzenie:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={plumageColor}
                      onChangeText={setPlumageColor}
                      placeholder="Niebieski nakrapiany"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Miejsce Upadku / Znalezienia:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={incidentLocation}
                    onChangeText={setIncidentLocation}
                    placeholder="np. Cela A-04, wylot, trasa lotu"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>

              {/* Cause Category Card */}
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>PRZYCZYNA UPADKU</Text>
                <View style={styles.chipGrid}>
                  {(
                    [
                      'trauma_flight_collision',
                      'predator',
                      'infectious_disease',
                      'exhaustion_post_race',
                      'humane_euthanasia',
                      'unknown',
                    ] as const
                  ).map((cause) => (
                    <TouchableOpacity
                      key={cause}
                      style={[
                        styles.chip,
                        causeCategory === cause && styles.chipActive,
                      ]}
                      onPress={() => setCauseCategory(cause)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          causeCategory === cause && styles.chipTextActive,
                        ]}
                      >
                        {CAUSE_LABELS[cause]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Szczegółowy Opis Przyczyny:</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={causeDescription}
                    onChangeText={setCauseDescription}
                    multiline
                    numberOfLines={3}
                    placeholder="Opisz okoliczności zdarzenia, obrażenia ciała lub przebieg agonii..."
                    placeholderTextColor="#64748B"
                  />
                </View>

                {causeCategory === 'infectious_disease' && (
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: '#f87171' }]}>
                      Podejrzewana Jednostka Zakaźna (PMV, Salmonella itp.):
                    </Text>
                    <TextInput
                      style={[styles.textInput, { borderColor: '#dc2626' }]}
                      value={epizooticDiseaseSuspected}
                      onChangeText={setEpizooticDiseaseSuspected}
                      placeholder="np. Paramyksowiroza PMV-1 lub Salmonelloza"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                )}
              </View>
            </View>
          )}

          {/* TAB 2: AUTOPSY */}
          {activeTab === 'autopsy' && (
            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>
                MAKROSKOPOWA OCENA NARZĄDÓW (SEKCJA ZWŁOK)
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Stan Umięśnienia Mostka:</Text>
                <View style={styles.muscleRow}>
                  {(
                    [
                      { id: 'normal', lbl: 'Norma (dobre)' },
                      { id: 'moderate_cachexia', lbl: 'Ostry mostek (spadek masy)' },
                      { id: 'severe_wasting', lbl: 'Kacheksja (skrajny zanik)' },
                    ] as const
                  ).map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        styles.muscleChoice,
                        muscleCondition === m.id && styles.muscleChoiceActive,
                      ]}
                      onPress={() => setMuscleCondition(m.id)}
                    >
                      <Text
                        style={[
                          styles.muscleChoiceText,
                          muscleCondition === m.id && styles.muscleChoiceTextActive,
                        ]}
                      >
                        {m.lbl}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Wole i Przełyk:</Text>
                <TextInput
                  style={styles.textInput}
                  value={cropCondition}
                  onChangeText={setCropCondition}
                  placeholder="Stan śluzówki wola, obecność karmy, naloty rzęsistkowe..."
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Wątroba i Narządy Miąższowe:</Text>
                <TextInput
                  style={styles.textInput}
                  value={liverCondition}
                  onChangeText={setLiverCondition}
                  placeholder="Barwa, kruchość, obecność martwiczych ognisk..."
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Worki Powietrzne i Płuca:</Text>
                <TextInput
                  style={styles.textInput}
                  value={airSacsCondition}
                  onChangeText={setAirSacsCondition}
                  placeholder="Przejrzystość, wysięk włóknikowy, krwawienia..."
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Przewód Pokarmowy i Jelita:</Text>
                <TextInput
                  style={styles.textInput}
                  value={intestinesCondition}
                  onChangeText={setIntestinesCondition}
                  placeholder="Treść pokarmowa, krwotoczny nieżyt, obecność glist..."
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>
          )}

          {/* TAB 3: DISPOSAL */}
          {activeTab === 'disposal' && (
            <View>
              {/* Ring Disposal Card */}
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>POSTĘPOWANIE Z OBRĄCZKĄ RODOWĄ</Text>
                <View style={styles.radioList}>
                  {(
                    [
                      'ring_cut_destroyed',
                      'ring_deposited_branch',
                      'kept_memorial',
                    ] as const
                  ).map((action) => (
                    <TouchableOpacity
                      key={action}
                      style={[
                        styles.radioItem,
                        ringDisposal === action && styles.radioItemActive,
                      ]}
                      onPress={() => setRingDisposal(action)}
                    >
                      <View style={styles.radioOuter}>
                        {ringDisposal === action && <View style={styles.radioInner} />}
                      </View>
                      <Text style={styles.radioText}>{RING_DISPOSAL_LABELS[action]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Carcass Disposal Card */}
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>PROCEDURA UTYLIZACJI ZWŁOK (UPPZ)</Text>
                <View style={styles.radioList}>
                  {(
                    [
                      'vet_cremation',
                      'rendering_plant_cat2_cat3',
                      'piw_autopsy',
                    ] as const
                  ).map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.radioItem,
                        carcassDisposal === method && styles.radioItemActive,
                      ]}
                      onPress={() => setCarcassDisposal(method)}
                    >
                      <View style={styles.radioOuter}>
                        {carcassDisposal === method && <View style={styles.radioInner} />}
                      </View>
                      <Text style={styles.radioText}>{CARCASS_DISPOSAL_LABELS[method]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Podmiot Odbierający / Utylizujący:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={disposalCompanyOrClinic}
                    onChangeText={setDisposalCompanyOrClinic}
                    placeholder="np. Lecznica AVI-MED / SARIA"
                    placeholderTextColor="#64748B"
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Nr Dowodu Utylizacji:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={disposalCertificateNumber}
                      onChangeText={setDisposalCertificateNumber}
                      placeholder="UTYL-2026/889"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Lekarz Weterynarii:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={veterinarianName}
                      onChangeText={setVeterinarianName}
                      placeholder="Lek. wet. Janusz Ptasiński"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nr PWZW Lekarza Weterynarii:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={vetLicenseNumber}
                    onChangeText={setVetLicenseNumber}
                    placeholder="np. PWZW-10492"
                    placeholderTextColor="#64748B"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Uwagi i Notatki Końcowe:</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={2}
                    placeholder="Wpisz dodatkowe uwagi..."
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Action Save & Deregister Button */}
          <FieldButton
            title="⚠️ Wyrejestruj Ptaka i Zatwierdź Protokół"
            onPress={handleSaveProtocol}
            style={styles.saveButton}
            testID="btn-save-mortality-protocol"
          />

          {/* Print & Share PDF Buttons */}
          <View style={styles.exportRow}>
            <FieldButton
              title="🖨️ AirPrint Świadectwo Zgonu"
              variant="secondary"
              onPress={handlePrint}
              style={{ flex: 1, marginRight: 8 }}
              testID="btn-print-mortality-protocol"
            />
            <FieldButton
              title="📤 Udostępnij PDF (PIW)"
              variant="secondary"
              onPress={handleShare}
              style={{ flex: 1 }}
              testID="btn-share-mortality-protocol"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
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
    backgroundColor: '#1A1D24',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#EF4444',
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#8E94A0',
    marginTop: 2,
  },
  closeButton: {
    minHeight: 48,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2F343F',
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  epizooticBanner: {
    backgroundColor: '#3b0d0c',
    borderWidth: 1.5,
    borderColor: '#dc2626',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  epizooticTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#f87171',
    marginBottom: 4,
  },
  epizooticDesc: {
    fontSize: 10,
    color: '#fca5a5',
    lineHeight: 14,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E2127',
    borderWidth: 1,
    borderColor: '#2F343F',
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  tabActive: {
    borderColor: '#EF4444',
    backgroundColor: '#2A1F22',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E94A0',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 14,
  },
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E94A0',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#14171D',
    borderWidth: 1,
    borderColor: '#2F343F',
    borderRadius: 8,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 13,
    minHeight: 48,
  },
  highlightInput: {
    borderColor: '#0284c7',
    fontFamily: 'monospace',
    fontWeight: '800',
    fontSize: 14,
    color: '#38bdf8',
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  sexRow: {
    flexDirection: 'row',
    gap: 4,
  },
  sexChoice: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#14171D',
    borderWidth: 1,
    borderColor: '#2F343F',
    borderRadius: 8,
  },
  sexChoiceActive: {
    borderColor: '#0284c7',
    backgroundColor: '#1A2938',
  },
  sexChoiceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E94A0',
  },
  sexChoiceTextActive: {
    color: '#38bdf8',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#14171D',
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  chipActive: {
    borderColor: '#EF4444',
    backgroundColor: '#2A1719',
  },
  chipText: {
    fontSize: 11,
    color: '#D4D8E0',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#F87171',
    fontWeight: '800',
  },
  muscleRow: {
    gap: 6,
  },
  muscleChoice: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#14171D',
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  muscleChoiceActive: {
    borderColor: '#E5A93C',
    backgroundColor: '#2B2418',
  },
  muscleChoiceText: {
    fontSize: 11,
    color: '#8E94A0',
    fontWeight: '600',
  },
  muscleChoiceTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  radioList: {
    gap: 8,
    marginBottom: 12,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    backgroundColor: '#14171D',
    borderWidth: 1,
    borderColor: '#2F343F',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  radioItemActive: {
    borderColor: '#EF4444',
    backgroundColor: '#24171A',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  radioText: {
    fontSize: 12,
    color: '#D4D8E0',
    fontWeight: '600',
    flex: 1,
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 12,
    minHeight: 52,
    backgroundColor: '#991B1B',
  },
  exportRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
});

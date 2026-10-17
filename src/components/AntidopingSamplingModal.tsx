/**
 * PIGEON-FLY — Generator Protokołu Wyrywkowej Kontroli Antydopingowej Modal (Z-093 / DEC-107)
 * Field Mode ergonomic interface (>= 48-56pt touch targets), dark theme (#121417).
 * Official FCI & PZHGP anti-doping biological sampling protocol:
 * - Event classification (basketing, post-race arrival, national exhibition, loft audit).
 * - Biological sample types (feces pool, crop lavage, cloacal swab, blood serum).
 * - Dual-sample tamper-evident security seals (Sample A + Sample B counter-sample).
 * - Chain of custody (+4°C isothermal coolbox, accredited FCI laboratory).
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
  AntidopingSamplingData,
  AntidopingSampleEvent,
  AntidopingSampleType,
  SAMPLE_EVENT_LABELS,
  SAMPLE_TYPE_LABELS,
  validateAntidopingSampling,
  generateAntidopingSamplingHtml,
} from '../domain/antidopingSamplingProtocol';
import { Sex } from '../domain/types';
import { PdfService } from '../services/pdfService';
import { FieldButton } from './FieldButton';

interface AntidopingSamplingModalProps {
  visible: boolean;
  onClose: () => void;
  defaultRaceName?: string;
  defaultRingNumber?: string;
  defaultBreederName?: string;
  defaultBreederPzhgpNumber?: string;
  onProtocolSaved?: (data: AntidopingSamplingData) => void;
}

export const AntidopingSamplingModal: React.FC<AntidopingSamplingModalProps> = ({
  visible,
  onClose,
  defaultRaceName = 'Lot Narodowy Bruksela (980 km)',
  defaultRingNumber = 'PL-0284-23-1402',
  defaultBreederName = 'Tomasz Nowak',
  defaultBreederPzhgpNumber = 'PL-0284-1102',
  onProtocolSaved,
}) => {
  // Protocol Meta
  const [protocolNumber, setProtocolNumber] = useState('DOP-FCI-2026/007');
  const [samplingDate, setSamplingDate] = useState('2026-05-16');
  const [samplingTime, setSamplingTime] = useState('19:45');
  const [event, setEvent] = useState<AntidopingSampleEvent>('race_basketing');
  const [eventName, setEventName] = useState(defaultRaceName);
  const [samplingLocation, setSamplingLocation] = useState('Punkt Koszowania Poznań Wilda');

  // Bird Identity
  const [ringNumber, setRingNumber] = useState(defaultRingNumber);
  const [sex, setSex] = useState<Sex>('cock');
  const [plumageColor, setPlumageColor] = useState('Niebieski');
  const [electronicChipSerial, setElectronicChipSerial] = useState('CHIP-99014');

  // Breeder
  const [breederName, setBreederName] = useState(defaultBreederName);
  const [breederPzhgpNumber, setBreederPzhgpNumber] = useState(defaultBreederPzhgpNumber);

  // Seals & Laboratory
  const [sampleType, setSampleType] = useState<AntidopingSampleType>('feces_pool');
  const [sampleASerial, setSampleASerial] = useState('FCI-A-89104');
  const [sampleBSerial, setSampleBSerial] = useState('FCI-B-89105');
  const [tamperEvidentSealIntact, setTamperEvidentSealIntact] = useState(true);
  const [storageTemperatureCelsius, setStorageTemperatureCelsius] = useState('4');
  const [transportContainerSerial, setTransportContainerSerial] = useState('COOL-FCI-03');
  const [targetLaboratory, setTargetLaboratory] = useState(
    'Ghent University Anti-Doping Lab (Ghent, Belgium)'
  );

  // Commission & Signatures
  const [fciInspectorName, setFciInspectorName] = useState('Marek Wiśniewski');
  const [veterinarianName, setVeterinarianName] = useState('Lek. wet. Janusz Ptasiński');
  const [vetLicenseNumber, setVetLicenseNumber] = useState('PWZW-10492');
  const [breederWitnessName, setBreederWitnessName] = useState(defaultBreederName);
  const [breederPresentDuringSealing, setBreederPresentDuringSealing] = useState(true);
  const [breederObjections, setBreederObjections] = useState(
    'Brak zastrzeżeń do procedury pobrania i plombowania.'
  );
  const [notes, setNotes] = useState(
    'Losowanie wyrywkowe przeprowadzone komisyjnie przed załadunkiem do kabiny.'
  );

  // Active view tab: 'event' | 'seals' | 'commission'
  const [activeTab, setActiveTab] = useState<'event' | 'seals' | 'commission'>('event');

  const protocolData: AntidopingSamplingData = useMemo(
    () => ({
      protocolNumber,
      samplingDate,
      samplingTime,
      event,
      eventName,
      samplingLocation,
      pigeon: {
        ringNumber,
        sex,
        plumageColor,
        electronicChipSerial: electronicChipSerial.trim() || undefined,
      },
      breederName,
      breederPzhgpNumber,
      sampleType,
      sampleASerial,
      sampleBSerial,
      tamperEvidentSealIntact,
      storageTemperatureCelsius: parseInt(storageTemperatureCelsius, 10) || 4,
      transportContainerSerial,
      targetLaboratory,
      fciInspectorName,
      veterinarianName,
      vetLicenseNumber,
      breederWitnessName,
      breederPresentDuringSealing,
      breederObjections,
      notes,
    }),
    [
      protocolNumber,
      samplingDate,
      samplingTime,
      event,
      eventName,
      samplingLocation,
      ringNumber,
      sex,
      plumageColor,
      electronicChipSerial,
      breederName,
      breederPzhgpNumber,
      sampleType,
      sampleASerial,
      sampleBSerial,
      tamperEvidentSealIntact,
      storageTemperatureCelsius,
      transportContainerSerial,
      targetLaboratory,
      fciInspectorName,
      veterinarianName,
      vetLicenseNumber,
      breederWitnessName,
      breederPresentDuringSealing,
      breederObjections,
      notes,
    ]
  );

  const handleSave = () => {
    const val = validateAntidopingSampling(protocolData);
    if (!val.isValid) {
      Alert.alert('Błędy procedury antydopingowej', val.errors.join('\n'));
      return;
    }

    if (onProtocolSaved) {
      onProtocolSaved(protocolData);
    }

    Alert.alert(
      'Zaplombowano Próbki Antydopingowe',
      `Protokół ${protocolData.protocolNumber} dla gołębia ${protocolData.pigeon.ringNumber} został pomyślnie zarejestrowany.\nPróbka A: ${protocolData.sampleASerial}\nKontrpróbka B: ${protocolData.sampleBSerial}\nLaboratorium: ${protocolData.targetLaboratory}`
    );
  };

  const handlePrint = async () => {
    try {
      const html = generateAntidopingSamplingHtml(protocolData);
      await PdfService.printHtml(html);
    } catch (e: any) {
      Alert.alert('Błąd drukowania', e?.message || 'Nie udało się wydrukować protokołu.');
    }
  };

  const handleShare = async () => {
    try {
      const html = generateAntidopingSamplingHtml(protocolData);
      await PdfService.shareHtmlAsPdf(
        html,
        `Protokol-Antydoping-${protocolData.protocolNumber.replace(/\//g, '_')}`
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
            <Text style={styles.headerTitle}>KONTROLA ANTYDOPINGOWA FCI / PZHGP</Text>
            <Text style={styles.headerSubtitle}>
              Protokół wyrywkowego pobrania prób i łańcuch dowodowy (Z-093)
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            testID="btn-close-antidoping-sampling-modal"
          >
            <Text style={styles.closeButtonText}>✕ Zamknij</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Seals Highlight Box */}
          <View style={styles.sealsBanner}>
            <View style={styles.sealCol}>
              <Text style={styles.sealBadgeTitle}>PRÓBKA A (GŁÓWNA)</Text>
              <Text style={styles.sealBadgeCode}>{sampleASerial}</Text>
              <Text style={styles.sealBadgeSub}>Screening laboratoryjny</Text>
            </View>
            <View style={styles.sealDivider} />
            <View style={styles.sealCol}>
              <Text style={styles.sealBadgeTitle}>KONTRPRÓBKA B</Text>
              <Text style={styles.sealBadgeCode}>{sampleBSerial}</Text>
              <Text style={styles.sealBadgeSub}>Depozyt odwoławczy</Text>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'event' && styles.tabActive]}
              onPress={() => setActiveTab('event')}
              testID="tab-sampling-event"
            >
              <Text style={[styles.tabText, activeTab === 'event' && styles.tabTextActive]}>
                1. Ptak & Zdarzenie
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'seals' && styles.tabActive]}
              onPress={() => setActiveTab('seals')}
              testID="tab-sampling-seals"
            >
              <Text style={[styles.tabText, activeTab === 'seals' && styles.tabTextActive]}>
                2. Próbki & Łańcuch
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'commission' && styles.tabActive]}
              onPress={() => setActiveTab('commission')}
              testID="tab-sampling-signatures"
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'commission' && styles.tabTextActive,
                ]}
              >
                3. Komisja & Podpisy
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: EVENT & BIRD */}
          {activeTab === 'event' && (
            <View>
              {/* Event Card */}
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>OKOLICZNOŚCI KONTROLI ANTYDOPINGOWEJ</Text>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Numer Protokołu FCI:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={protocolNumber}
                      onChangeText={setProtocolNumber}
                      placeholder="DOP-FCI-2026/007"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Data i Godzina:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={`${samplingDate} ${samplingTime}`}
                      onChangeText={(t) => {
                        const parts = t.split(' ');
                        if (parts[0]) setSamplingDate(parts[0]);
                        if (parts[1]) setSamplingTime(parts[1]);
                      }}
                      placeholder="YYYY-MM-DD HH:mm"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Okoliczność Typowania do Kontroli:</Text>
                  <View style={styles.chipGrid}>
                    {(
                      [
                        'race_basketing',
                        'race_arrival',
                        'national_exhibition',
                        'unannounced_loft_audit',
                      ] as const
                    ).map((e) => (
                      <TouchableOpacity
                        key={e}
                        style={[styles.chip, event === e && styles.chipActive]}
                        onPress={() => setEvent(e)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            event === e && styles.chipTextActive,
                          ]}
                        >
                          {SAMPLE_EVENT_LABELS[e]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nazwa Lotu / Wystawy:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={eventName}
                    onChangeText={setEventName}
                    placeholder="Lot Narodowy Bruksela (980 km)"
                    placeholderTextColor="#64748B"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Miejsce Pobrania:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={samplingLocation}
                    onChangeText={setSamplingLocation}
                    placeholder="np. Punkt Koszowania Poznań Wilda"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>

              {/* Bird Identity Card */}
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>DANE IDENTYFIKACYJNE BADANEGO PTAKA</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Numer Obrączki Rodowej PZHGP:</Text>
                  <TextInput
                    style={[styles.textInput, styles.highlightInput]}
                    value={ringNumber}
                    onChangeText={setRingNumber}
                    placeholder="PL-0284-23-1402"
                    placeholderTextColor="#64748B"
                    testID="input-antidoping-ring"
                  />
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
                      placeholder="Niebieski"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Obrączka Elektroniczna (Chip ESK):</Text>
                  <TextInput
                    style={styles.textInput}
                    value={electronicChipSerial}
                    onChangeText={setElectronicChipSerial}
                    placeholder="CHIP-99014"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>
            </View>
          )}

          {/* TAB 2: SEALS & CHAIN OF CUSTODY */}
          {activeTab === 'seals' && (
            <View>
              {/* Biological Material Card */}
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>MATERIAŁ BIOLOGICZNY</Text>
                <View style={styles.radioList}>
                  {(
                    [
                      'feces_pool',
                      'crop_lavage',
                      'cloacal_swab',
                      'blood_serum',
                      'feather_matrix',
                    ] as const
                  ).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.radioItem,
                        sampleType === type && styles.radioItemActive,
                      ]}
                      onPress={() => setSampleType(type)}
                    >
                      <View style={styles.radioOuter}>
                        {sampleType === type && <View style={styles.radioInner} />}
                      </View>
                      <Text style={styles.radioText}>{SAMPLE_TYPE_LABELS[type]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Security Seals & Coolbox */}
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>ŁAŃCUCH DOWODOWY I PLOMBY BEZPIECZNE</Text>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Kod Plomby Próbki A:</Text>
                    <TextInput
                      style={[styles.textInput, styles.sealInput]}
                      value={sampleASerial}
                      onChangeText={setSampleASerial}
                      placeholder="FCI-A-89104"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Kod Plomby Kontrpróbki B:</Text>
                    <TextInput
                      style={[styles.textInput, styles.sealInput]}
                      value={sampleBSerial}
                      onChangeText={setSampleBSerial}
                      placeholder="FCI-B-89105"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Temp. Chłodzenia (°C):</Text>
                    <TextInput
                      style={styles.textInput}
                      value={storageTemperatureCelsius}
                      onChangeText={setStorageTemperatureCelsius}
                      keyboardType="numeric"
                      placeholder="4"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Nr Pojemnika Izotermicznego:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={transportContainerSerial}
                      onChangeText={setTransportContainerSerial}
                      placeholder="COOL-FCI-03"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Akredytowane Laboratorium FCI:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={targetLaboratory}
                    onChangeText={setTargetLaboratory}
                    placeholder="Ghent University Anti-Doping Lab / IES Kraków"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>
            </View>
          )}

          {/* TAB 3: COMMISSION & SIGNATURES */}
          {activeTab === 'commission' && (
            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>KOMISJA POBIERAJĄCA I OŚWIADCZENIE HODOWCY</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Delegat ds. Antydopingu FCI / PZHGP:</Text>
                <TextInput
                  style={styles.textInput}
                  value={fciInspectorName}
                  onChangeText={setFciInspectorName}
                  placeholder="Marek Wiśniewski"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Lekarz Weterynarii Pobierający:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={veterinarianName}
                    onChangeText={setVeterinarianName}
                    placeholder="Lek. wet. Janusz Ptasiński"
                    placeholderTextColor="#64748B"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 0.8 }]}>
                  <Text style={styles.inputLabel}>Nr PWZW:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={vetLicenseNumber}
                    onChangeText={setVetLicenseNumber}
                    placeholder="PWZW-10492"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>
                  Hodowca obecny osobiście przy pobraniu i plombowaniu prób:
                </Text>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    breederPresentDuringSealing && styles.toggleBtnActive,
                  ]}
                  onPress={() =>
                    setBreederPresentDuringSealing(!breederPresentDuringSealing)
                  }
                >
                  <Text style={styles.toggleBtnText}>
                    {breederPresentDuringSealing ? '✓ OBECNY' : '✕ NIEOBECNY'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Oświadczenie Hodowcy / Świadka:</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={breederObjections}
                  onChangeText={setBreederObjections}
                  multiline
                  numberOfLines={2}
                  placeholder="Wpisz ewentualne uwagi lub 'Brak zastrzeżeń'..."
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
                  placeholder="Dodatkowe informacje..."
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>
          )}

          {/* Action Save Button */}
          <FieldButton
            title="🛡️ Zatwierdź i Zaplombuj Próbki Antydopingowe"
            onPress={handleSave}
            style={styles.saveButton}
            testID="btn-save-antidoping-sampling"
          />

          {/* Print & Share PDF Buttons */}
          <View style={styles.exportRow}>
            <FieldButton
              title="🖨️ AirPrint Protokół"
              variant="secondary"
              onPress={handlePrint}
              style={{ flex: 1, marginRight: 8 }}
              testID="btn-print-antidoping-sampling"
            />
            <FieldButton
              title="📤 Udostępnij PDF (FCI)"
              variant="secondary"
              onPress={handleShare}
              style={{ flex: 1 }}
              testID="btn-share-antidoping-sampling"
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
    color: '#0284c7',
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
  sealsBanner: {
    flexDirection: 'row',
    backgroundColor: '#0c2236',
    borderWidth: 1.5,
    borderColor: '#0284c7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  sealCol: {
    flex: 1,
    alignItems: 'center',
  },
  sealDivider: {
    width: 1,
    backgroundColor: '#0284c7',
    marginHorizontal: 8,
  },
  sealBadgeTitle: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.5,
  },
  sealBadgeCode: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'monospace',
    color: '#FFFFFF',
    marginVertical: 2,
  },
  sealBadgeSub: {
    fontSize: 8,
    color: '#94a3b8',
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
    borderColor: '#0284c7',
    backgroundColor: '#132333',
  },
  tabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E94A0',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#38bdf8',
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
    color: '#38bdf8',
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  sealInput: {
    fontFamily: 'monospace',
    fontWeight: '800',
    color: '#38bdf8',
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
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
    borderColor: '#0284c7',
    backgroundColor: '#132333',
  },
  chipText: {
    fontSize: 10,
    color: '#D4D8E0',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#38bdf8',
    fontWeight: '800',
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
    backgroundColor: '#132333',
  },
  sexChoiceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E94A0',
  },
  sexChoiceTextActive: {
    color: '#38bdf8',
  },
  radioList: {
    gap: 8,
    marginBottom: 6,
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
    borderColor: '#0284c7',
    backgroundColor: '#132333',
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
    backgroundColor: '#0284c7',
  },
  radioText: {
    fontSize: 11,
    color: '#D4D8E0',
    fontWeight: '600',
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#14171D',
    borderWidth: 1,
    borderColor: '#2F343F',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    minHeight: 48,
  },
  toggleLabel: {
    fontSize: 11,
    color: '#D4D8E0',
    flex: 1,
    marginRight: 8,
  },
  toggleBtn: {
    backgroundColor: '#2F343F',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#166534',
  },
  toggleBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 12,
    minHeight: 52,
    backgroundColor: '#0284c7',
  },
  exportRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
});

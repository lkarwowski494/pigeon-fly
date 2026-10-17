/**
 * PIGEON-FLY — Modal Ewidencji Błąkaczy i Kwarantanny Obcych Ptaków (FoundPigeonRegistryModal)
 * Przyjmowanie zagubionych ptaków, autodekodowanie obrączek FCI, kwarantanna w izolatce i repatriacja.
 * Zgodność z Field Mode (touch targets >= 48-56 pt) oraz eksport urzędowy A4 AirPrint/PDF.
 */

import React, { useState, useMemo } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { FieldButton } from './FieldButton';
import {
  FoundPigeonEntry,
  FoundPigeonStatus,
  ExhaustionLevel,
  ClinicalSymptom,
  FOUND_STATUS_LABELS,
  EXHAUSTION_LABELS,
  SYMPTOM_LABELS,
  COUNTRY_NAMES,
  decodeRingCountry,
  validateFoundPigeonEntry,
  calculateFoundPigeonsStats,
  generateFoundPigeonProtocolHtml,
} from '../domain/foundPigeonRegistry';
import { PdfService } from '../services/pdfService';

interface FoundPigeonRegistryModalProps {
  visible: boolean;
  onClose: () => void;
  defaultFinderName?: string;
  defaultFinderPhone?: string;
  defaultBranchName?: string;
  defaultLoftAddress?: string;
}

const DEMO_ENTRIES: FoundPigeonEntry[] = [
  {
    id: 'found-demo-01',
    ringNumber: 'DV-01234-23-567',
    countryCode: 'DV',
    foreignFederationName: 'Niemcy (Verband Deutscher Brieftaubenzüchter)',
    discoveryDate: '2026-07-04',
    discoveryTime: '18:30',
    finderName: 'Janusz Kowalski',
    finderPhone: '+48 601 234 567',
    finderLoftAddress: 'ul. Słoneczna 12, 63-800 Gostyń',
    finderBranch: 'Oddział 0284 Gostyń',
    quarantineCageNumber: 'IZO-01',
    status: 'in_quarantine',
    exhaustionLevel: 'severe',
    plumageColor: 'Niebieska-Pstra',
    sex: 'cock',
    electronicChipCode: 'BNZ-89104',
    symptoms: ['emaciation_keel', 'severe_dehydration'],
    treatmentGiven: 'Pojenie elektrolitowe hipotoniczne, roztwór glukozy, kardi, zakwaszacz pH 4.0.',
    ownerName: 'Hans Müller',
    ownerPhone: '+49 171 1234567',
    ownerBranch: 'RV Leipzig 01234',
    contactMethod: 'phone_call',
    notes: 'Ptak zgłoszony do niemieckiego związku, właściciel poprosił o odkarmienie i wypuszczenie.',
  },
  {
    id: 'found-demo-02',
    ringNumber: 'PL-0285-23-4412',
    countryCode: 'PL',
    discoveryDate: '2026-07-02',
    discoveryTime: '09:15',
    finderName: 'Janusz Kowalski',
    finderPhone: '+48 601 234 567',
    finderLoftAddress: 'ul. Słoneczna 12, 63-800 Gostyń',
    finderBranch: 'Oddział 0284 Gostyń',
    quarantineCageNumber: 'IZO-02',
    status: 'repatriated_to_owner',
    exhaustionLevel: 'mild',
    plumageColor: 'Ciemna',
    sex: 'hen',
    symptoms: ['healthy_tired'],
    treatmentGiven: 'Odpoczynek 48h, karma lekkostrawna.',
    ownerName: 'Krzysztof Nowak',
    ownerPhone: '+48 603 987 654',
    ownerBranch: 'Oddział 0285 Leszno',
    contactMethod: 'phone_call',
    resolutionDate: '2026-07-03',
    notes: 'Właściciel odebrał ptaka osobiście.',
  },
];

export const FoundPigeonRegistryModal: React.FC<FoundPigeonRegistryModalProps> = ({
  visible,
  onClose,
  defaultFinderName = 'Janusz Kowalski',
  defaultFinderPhone = '+48 601 234 567',
  defaultBranchName = 'Oddział 0284 Gostyń',
  defaultLoftAddress = 'ul. Słoneczna 12, 63-800 Gostyń',
}) => {
  const todayIso = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  const [entries, setEntries] = useState<FoundPigeonEntry[]>(DEMO_ENTRIES);
  const [selectedEntry, setSelectedEntry] = useState<FoundPigeonEntry>(DEMO_ENTRIES[0]);

  // Form State for new intake
  const [ringNumber, setRingNumber] = useState<string>('');
  const [discoveryDate, setDiscoveryDate] = useState<string>(todayIso);
  const [discoveryTime, setDiscoveryTime] = useState<string>(nowTime);
  const [quarantineCageNumber, setQuarantineCageNumber] = useState<string>('IZO-03');
  const [exhaustionLevel, setExhaustionLevel] = useState<ExhaustionLevel>('moderate');
  const [plumageColor, setPlumageColor] = useState<string>('Niebieski');
  const [sex, setSex] = useState<'cock' | 'hen' | 'unknown'>('cock');
  const [electronicChipCode, setElectronicChipCode] = useState<string>('');
  const [treatmentGiven, setTreatmentGiven] = useState<string>(
    'Pojenie elektrolitowe z glukozą, lekkostrawny granulat regeneracyjny, witamina B-complex.'
  );
  const [symptoms, setSymptoms] = useState<ClinicalSymptom[]>([
    'severe_dehydration',
    'emaciation_keel',
  ]);

  // Form State for Owner / Contact
  const [ownerName, setOwnerName] = useState<string>('');
  const [ownerPhone, setOwnerPhone] = useState<string>('');
  const [ownerBranch, setOwnerBranch] = useState<string>('');
  const [contactMethod, setContactMethod] = useState<
    'pzhgp_portal' | 'phone_call' | 'sms' | 'social_media'
  >('phone_call');
  const [status, setStatus] = useState<FoundPigeonStatus>('in_quarantine');
  const [resolutionDate, setResolutionDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'list' | 'new_intake' | 'contact_action'>('list');

  const stats = useMemo(() => calculateFoundPigeonsStats(entries), [entries]);

  // Decoded country live preview
  const decodedCountry = useMemo(() => decodeRingCountry(ringNumber), [ringNumber]);

  const handleToggleSymptom = (sym: ClinicalSymptom) => {
    if (symptoms.includes(sym)) {
      setSymptoms(symptoms.filter((s) => s !== sym));
    } else {
      setSymptoms([...symptoms, sym]);
    }
  };

  const handleAddIntake = () => {
    if (!ringNumber.trim()) {
      Alert.alert('Błąd', 'Podaj numer obrączki błąkacza.');
      return;
    }

    const ringUpper = ringNumber.trim().toUpperCase();
    const dec = decodeRingCountry(ringUpper);

    const newEntry: FoundPigeonEntry = {
      id: `found-${Date.now()}`,
      ringNumber: ringUpper,
      countryCode: dec.countryCode,
      foreignFederationName: dec.isForeign ? dec.federationName : undefined,
      discoveryDate,
      discoveryTime,
      finderName: defaultFinderName,
      finderPhone: defaultFinderPhone,
      finderLoftAddress: defaultLoftAddress,
      finderBranch: defaultBranchName,
      quarantineCageNumber: quarantineCageNumber.trim() || 'IZO-AUTO',
      status: 'in_quarantine',
      exhaustionLevel,
      plumageColor: plumageColor.trim() || 'Niebieski',
      sex,
      electronicChipCode: electronicChipCode.trim() || undefined,
      symptoms,
      treatmentGiven,
      notes: notes.trim() || undefined,
    };

    const val = validateFoundPigeonEntry(newEntry);
    if (!val.isValid) {
      Alert.alert('Błędy formalne', val.errors.join('\n'));
      return;
    }

    setEntries([newEntry, ...entries]);
    setSelectedEntry(newEntry);
    setRingNumber('');
    setElectronicChipCode('');
    setActiveTab('list');

    Alert.alert(
      'Zarejestrowano Błąkacza w Izolatce',
      `Gołąb ${newEntry.ringNumber} (${dec.federationName}) został zarejestrowany i umieszczony w klatce ${newEntry.quarantineCageNumber}. Obowiązuje 7-dniowa kwarantanna bioasekuracyjna.`
    );
  };

  const handleSelectEntryForContact = (entry: FoundPigeonEntry) => {
    setSelectedEntry(entry);
    setOwnerName(entry.ownerName || '');
    setOwnerPhone(entry.ownerPhone || '');
    setOwnerBranch(entry.ownerBranch || '');
    setStatus(entry.status);
    setContactMethod(entry.contactMethod === 'unidentified' ? 'phone_call' : entry.contactMethod || 'phone_call');
    setResolutionDate(entry.resolutionDate || '');
    setNotes(entry.notes || '');
    setActiveTab('contact_action');
  };

  const handleUpdateContact = () => {
    const updated: FoundPigeonEntry = {
      ...selectedEntry,
      ownerName: ownerName.trim() || undefined,
      ownerPhone: ownerPhone.trim() || undefined,
      ownerBranch: ownerBranch.trim() || undefined,
      status,
      contactMethod,
      resolutionDate: resolutionDate.trim() || (status !== 'in_quarantine' ? todayIso : undefined),
      notes: notes.trim() || undefined,
    };

    const val = validateFoundPigeonEntry(updated);
    if (!val.isValid) {
      Alert.alert('Błędy aktualizacji', val.errors.join('\n'));
      return;
    }

    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setSelectedEntry(updated);
    Alert.alert('Zaktualizowano Status Błąkacza', `Status zmieniono na: ${FOUND_STATUS_LABELS[status]}`);
    setActiveTab('list');
  };

  const handlePrintProtocol = async (entry: FoundPigeonEntry) => {
    try {
      const html = generateFoundPigeonProtocolHtml(entry);
      await PdfService.printHtml(html);
    } catch (e: any) {
      Alert.alert('Błąd drukowania', e?.message || 'Nie udało się wydrukować karty błąkacza.');
    }
  };

  const handleShareProtocol = async (entry: FoundPigeonEntry) => {
    try {
      const html = generateFoundPigeonProtocolHtml(entry);
      await PdfService.shareHtmlAsPdf(
        html,
        `Karta-Blakacza-${entry.ringNumber.replace(/[^a-zA-Z0-9]/g, '_')}`
      );
    } catch (e: any) {
      Alert.alert('Błąd eksportu', e?.message || 'Nie udało się wyeksportować pliku PDF.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>EWIDENCJA BŁĄKACZY & KWARANTANNA</Text>
            <Text style={styles.headerSubtitle}>
              Przybicia obcych ptaków, izolatka bioasekuracyjna i repatriacja (Z-097)
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            testID="btn-close-found-modal"
          >
            <Text style={styles.closeButtonText}>✕ Zamknij</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Summary Stats Bar */}
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statVal}>{stats.total}</Text>
                <Text style={styles.statLbl}>Błąkaczy</Text>
              </View>
              <View style={styles.statCol}>
                <Text
                  style={[
                    styles.statVal,
                    { color: stats.inQuarantine > 0 ? '#38bdf8' : '#FFFFFF' },
                  ]}
                >
                  {stats.inQuarantine}
                </Text>
                <Text style={styles.statLbl}>W izolatce</Text>
              </View>
              <View style={styles.statCol}>
                <Text
                  style={[
                    styles.statVal,
                    { color: stats.foreignCount > 0 ? '#fbbf24' : '#FFFFFF' },
                  ]}
                >
                  {stats.foreignCount}
                </Text>
                <Text style={styles.statLbl}>Zagraniczne</Text>
              </View>
              <View style={styles.statCol}>
                <Text
                  style={[
                    styles.statVal,
                    { color: stats.criticalCount > 0 ? '#f87171' : '#FFFFFF' },
                  ]}
                >
                  {stats.criticalCount}
                </Text>
                <Text style={styles.statLbl}>Krytyczne</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={[styles.statVal, { color: '#4ade80' }]}>
                  {stats.repatriated + stats.released}
                </Text>
                <Text style={styles.statLbl}>Rozwiązane</Text>
              </View>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'list' && styles.tabActive]}
              onPress={() => setActiveTab('list')}
              testID="tab-found-list"
            >
              <Text style={[styles.tabText, activeTab === 'list' && styles.tabTextActive]}>
                1. Rejestr ({entries.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'new_intake' && styles.tabActive]}
              onPress={() => setActiveTab('new_intake')}
              testID="tab-found-intake"
            >
              <Text style={[styles.tabText, activeTab === 'new_intake' && styles.tabTextActive]}>
                2. Przyjmij do Izolatki
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'contact_action' && styles.tabActive]}
              onPress={() => setActiveTab('contact_action')}
              testID="tab-found-contact"
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'contact_action' && styles.tabTextActive,
                ]}
              >
                3. Właściciel & Zwrot
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: LIST & CARDS */}
          {activeTab === 'list' && (
            <View>
              {entries.map((entry) => {
                const isForeign = entry.countryCode !== 'PL';
                return (
                  <View key={entry.id} style={styles.entryCard}>
                    <View style={styles.entryHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.entryRing}>{entry.ringNumber}</Text>
                          {isForeign && (
                            <View style={styles.foreignBadge}>
                              <Text style={styles.foreignBadgeText}>
                                🌍 {entry.countryCode}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.entryCountrySub}>
                          {COUNTRY_NAMES[entry.countryCode]}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          entry.status === 'in_quarantine'
                            ? styles.statusQuarantine
                            : entry.status === 'repatriated_to_owner' ||
                              entry.status === 'released_after_recovery'
                            ? styles.statusDone
                            : styles.statusContacted,
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>
                          {FOUND_STATUS_LABELS[entry.status]}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.entryDetailsRow}>
                      <Text style={styles.entryDetailText}>
                        Klatka:{' '}
                        <Text style={{ fontWeight: 'bold', color: '#38bdf8' }}>
                          {entry.quarantineCageNumber}
                        </Text>{' '}
                        • Przybył: {entry.discoveryDate} {entry.discoveryTime}
                      </Text>
                      <Text style={styles.entryDetailText}>
                        Kondycja:{' '}
                        <Text
                          style={{
                            color:
                              entry.exhaustionLevel === 'critical'
                                ? '#f87171'
                                : entry.exhaustionLevel === 'severe'
                                ? '#fbbf24'
                                : '#CBD5E1',
                          }}
                        >
                          {EXHAUSTION_LABELS[entry.exhaustionLevel]}
                        </Text>
                      </Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.entryActionsRow}>
                      <TouchableOpacity
                        style={styles.actionBtnPrimary}
                        onPress={() => handleSelectEntryForContact(entry)}
                        testID={`btn-manage-found-${entry.ringNumber}`}
                      >
                        <Text style={styles.actionBtnText}>📞 Właściciel / Zwrot</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtnMini}
                        onPress={() => handlePrintProtocol(entry)}
                      >
                        <Text style={styles.actionBtnMiniText}>🖨️ Karta A4</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtnMini}
                        onPress={() => handleShareProtocol(entry)}
                      >
                        <Text style={styles.actionBtnMiniText}>📤 PDF</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* TAB 2: NEW INTAKE */}
          {activeTab === 'new_intake' && (
            <View>
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>1. IDENTYFIKACJA OBRĄCZKI BŁĄKACZA</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Numer Obrączki Rodowej:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={ringNumber}
                    onChangeText={setRingNumber}
                    placeholder="PL-0284-24-1234 lub DV-01234-23-567"
                    placeholderTextColor="#64748B"
                    autoCapitalize="characters"
                  />
                  {ringNumber.length > 2 && (
                    <Text style={styles.decodedCountryText}>
                      Rozpoznano: <strong>{decodedCountry.federationName}</strong>{' '}
                      {decodedCountry.isForeign ? '(Federacja Zagraniczna)' : '(Polska PZHGP)'}
                    </Text>
                  )}
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Data Przybicia:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={discoveryDate}
                      onChangeText={setDiscoveryDate}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Godzina:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={discoveryTime}
                      onChangeText={setDiscoveryTime}
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Barwa Upierzenia:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={plumageColor}
                      onChangeText={setPlumageColor}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Płeć:</Text>
                    <View style={styles.sexToggleRow}>
                      {(['cock', 'hen', 'unknown'] as const).map((s) => (
                        <TouchableOpacity
                          key={s}
                          style={[
                            styles.sexBtn,
                            sex === s && styles.sexBtnActive,
                          ]}
                          onPress={() => setSex(s)}
                        >
                          <Text
                            style={[
                              styles.sexBtnText,
                              sex === s && styles.sexBtnTextActive,
                            ]}
                          >
                            {s === 'cock' ? '1.0 ♂' : s === 'hen' ? '0.1 ♀' : '?'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Kod Elektronicznego Chipa (jeśli posiada):</Text>
                  <TextInput
                    style={styles.textInput}
                    value={electronicChipCode}
                    onChangeText={setElectronicChipCode}
                    placeholder="np. TAUR-10928 / BNZ-99120"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>

              <View style={[styles.card, { borderColor: '#ef4444', borderWidth: 1.5 }]}>
                <Text style={[styles.cardSectionTitle, { color: '#f87171' }]}>
                  🛡️ BIOASEKURACJA: IZOLATKA KWARANTANNY (PIW)
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nr Klatki w Izolatce Sanitarnej:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={quarantineCageNumber}
                    onChangeText={setQuarantineCageNumber}
                    placeholder="IZO-01"
                    placeholderTextColor="#64748B"
                  />
                  <Text style={styles.helperText}>
                    Bezwzględny zakaz kontaktu z gołębiami stada głównego przez minimum 7 dni!
                  </Text>
                </View>

                <Text style={styles.inputLabel}>Stopień Wycieńczenia Klinicznego:</Text>
                <View style={styles.exhaustionCol}>
                  {(['mild', 'moderate', 'severe', 'critical'] as ExhaustionLevel[]).map(
                    (ex) => (
                      <TouchableOpacity
                        key={ex}
                        style={[
                          styles.exhaustionItem,
                          exhaustionLevel === ex && styles.exhaustionItemActive,
                        ]}
                        onPress={() => setExhaustionLevel(ex)}
                      >
                        <Text
                          style={[
                            styles.exhaustionItemText,
                            exhaustionLevel === ex && styles.exhaustionItemTextActive,
                          ]}
                        >
                          {EXHAUSTION_LABELS[ex]}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>

                <Text style={[styles.inputLabel, { marginTop: 10 }]}>
                  Stwierdzone Objawy Triażowe (Zaznacz):
                </Text>
                <View style={styles.symptomsGrid}>
                  {(
                    [
                      'healthy_tired',
                      'severe_dehydration',
                      'emaciation_keel',
                      'wing_droop',
                      'crop_stasis',
                      'diarrhea',
                      'predator_wound',
                      'pox_lesions',
                    ] as ClinicalSymptom[]
                  ).map((sym) => {
                    const isSelected = symptoms.includes(sym);
                    return (
                      <TouchableOpacity
                        key={sym}
                        style={[
                          styles.symptomChip,
                          isSelected && styles.symptomChipActive,
                        ]}
                        onPress={() => handleToggleSymptom(sym)}
                      >
                        <Text
                          style={[
                            styles.symptomChipText,
                            isSelected && styles.symptomChipTextActive,
                          ]}
                        >
                          {isSelected ? '✓ ' : ''}
                          {SYMPTOM_LABELS[sym]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={[styles.inputGroup, { marginTop: 10 }]}>
                  <Text style={styles.inputLabel}>Zastosowane Postępowanie / Odżywianie:</Text>
                  <TextInput
                    style={[styles.textInput, { minHeight: 60, textAlignVertical: 'top' }]}
                    value={treatmentGiven}
                    onChangeText={setTreatmentGiven}
                    multiline
                  />
                </View>
              </View>

              <FieldButton
                title="🛡️ Umieść w Izolatce i Zarejestruj Błąkacza"
                onPress={handleAddIntake}
                style={styles.saveButton}
                testID="btn-submit-found-intake"
              />
            </View>
          )}

          {/* TAB 3: CONTACT & REPATRIATION */}
          {activeTab === 'contact_action' && (
            <View>
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>
                  HODOWCA-WŁAŚCICIEL: {selectedEntry.ringNumber}
                </Text>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Imię i Nazwisko Właściciela:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={ownerName}
                      onChangeText={setOwnerName}
                      placeholder="np. Jan Kowalski"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Telefon Właściciela:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={ownerPhone}
                      onChangeText={setOwnerPhone}
                      placeholder="+48 600 000 000"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Oddział / Klub Właściciela:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={ownerBranch}
                    onChangeText={setOwnerBranch}
                    placeholder="np. Oddział 0285 Leszno lub RV Leipzig"
                    placeholderTextColor="#64748B"
                  />
                </View>

                <Text style={styles.inputLabel}>Sposób Zgłoszenia / Kontaktu:</Text>
                <View style={styles.contactMethodRow}>
                  {(
                    ['phone_call', 'sms', 'pzhgp_portal', 'social_media'] as const
                  ).map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.contactMethodBtn,
                        contactMethod === m && styles.contactMethodBtnActive,
                      ]}
                      onPress={() => setContactMethod(m)}
                    >
                      <Text
                        style={[
                          styles.contactMethodBtnText,
                          contactMethod === m && styles.contactMethodBtnTextActive,
                        ]}
                      >
                        {m === 'phone_call'
                          ? '📞 Telefon'
                          : m === 'sms'
                          ? '💬 SMS'
                          : m === 'pzhgp_portal'
                          ? '🌐 Portal PZHGP'
                          : '👥 Media'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>ZMIANA STATUSU I REZOLUCJA SPRAWY</Text>

                <View style={styles.statusSelectorCol}>
                  {(
                    [
                      'in_quarantine',
                      'owner_contacted',
                      'repatriated_to_owner',
                      'released_after_recovery',
                      'adopted_with_transfer',
                      'deceased_in_isolation',
                    ] as FoundPigeonStatus[]
                  ).map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.statusItem,
                        status === st && styles.statusItemActive,
                      ]}
                      onPress={() => setStatus(st)}
                    >
                      <Text
                        style={[
                          styles.statusItemTitle,
                          status === st && styles.statusItemTitleActive,
                        ]}
                      >
                        {FOUND_STATUS_LABELS[st]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Data Zakończenia / Zwrotu:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={resolutionDate}
                    onChangeText={setResolutionDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#64748B"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Notatki i Ustalenia z Właścicielem:</Text>
                  <TextInput
                    style={[styles.textInput, { minHeight: 60, textAlignVertical: 'top' }]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="np. Właściciel poprosił o wypuszczenie w sobotę rano po odkarmieniu."
                    placeholderTextColor="#64748B"
                    multiline
                  />
                </View>
              </View>

              <FieldButton
                title="💾 Zapisz Status i Ustalenia z Właścicielem"
                onPress={handleUpdateContact}
                style={styles.saveButton}
                testID="btn-save-found-contact"
              />

              <View style={styles.exportRow}>
                <FieldButton
                  title="🖨️ AirPrint Protokół"
                  variant="secondary"
                  onPress={() => handlePrintProtocol(selectedEntry)}
                  style={{ flex: 1, marginRight: 8 }}
                  testID="btn-print-found-protocol"
                />
                <FieldButton
                  title="📤 Udostępnij PDF (PZHGP)"
                  variant="secondary"
                  onPress={() => handleShareProtocol(selectedEntry)}
                  style={{ flex: 1 }}
                  testID="btn-share-found-protocol"
                />
              </View>
            </View>
          )}
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
    color: '#38bdf8',
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#8E94A0',
    marginTop: 2,
  },
  closeButton: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#2F343F',
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
  statsCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#38bdf8',
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#F0F2F5',
  },
  statLbl: {
    fontSize: 10,
    color: '#8E94A0',
    marginTop: 2,
    textAlign: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#1A1D24',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  tab: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#0284c7',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E94A0',
  },
  tabTextActive: {
    color: '#FFFFFF',
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
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  entryCard: {
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 10,
  },
  entryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  entryRing: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  foreignBadge: {
    backgroundColor: '#1e3a8a',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  foreignBadgeText: {
    color: '#bfdbfe',
    fontSize: 10,
    fontWeight: 'bold',
  },
  entryCountrySub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusQuarantine: {
    backgroundColor: '#0c4a6e',
  },
  statusDone: {
    backgroundColor: '#064e3b',
  },
  statusContacted: {
    backgroundColor: '#78350f',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  entryDetailsRow: {
    borderTopWidth: 1,
    borderTopColor: '#2F343F',
    paddingTop: 6,
    marginBottom: 8,
  },
  entryDetailText: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
  },
  entryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtnPrimary: {
    flex: 1,
    minHeight: 48,
    backgroundColor: '#0284c7',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  actionBtnMini: {
    minHeight: 48,
    minWidth: 50,
    backgroundColor: '#2F343F',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginRight: 4,
  },
  actionBtnMiniText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#121417',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    color: '#FFFFFF',
    paddingHorizontal: 10,
    minHeight: 48,
    fontSize: 13,
  },
  decodedCountryText: {
    fontSize: 11,
    color: '#38bdf8',
    marginTop: 4,
  },
  helperText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  sexToggleRow: {
    flexDirection: 'row',
  },
  sexBtn: {
    flex: 1,
    minHeight: 48,
    backgroundColor: '#121417',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  sexBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  sexBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  sexBtnTextActive: {
    color: '#FFFFFF',
  },
  exhaustionCol: {
    marginTop: 4,
  },
  exhaustionItem: {
    minHeight: 48,
    backgroundColor: '#121417',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2F343F',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  exhaustionItemActive: {
    borderColor: '#f87171',
    backgroundColor: '#7f1d1d',
  },
  exhaustionItemText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  exhaustionItemTextActive: {
    color: '#FFFFFF',
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  symptomChip: {
    minHeight: 48,
    backgroundColor: '#121417',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2F343F',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  symptomChipActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#60a5fa',
  },
  symptomChipText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  symptomChipTextActive: {
    color: '#FFFFFF',
  },
  contactMethodRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  contactMethodBtn: {
    flex: 1,
    minHeight: 48,
    backgroundColor: '#121417',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  contactMethodBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  contactMethodBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  contactMethodBtnTextActive: {
    color: '#FFFFFF',
  },
  statusSelectorCol: {
    marginTop: 4,
    marginBottom: 10,
  },
  statusItem: {
    minHeight: 48,
    backgroundColor: '#121417',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2F343F',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  statusItemActive: {
    backgroundColor: '#047857',
    borderColor: '#34d399',
  },
  statusItemTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  statusItemTitleActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#0284c7',
    marginBottom: 12,
  },
  exportRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
});

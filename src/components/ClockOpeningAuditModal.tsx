/**
 * PIGEON-FLY — Modal Komisyjnego Otwarcia Zegarów i Kontroli Odchyłki Chodu (ClockOpeningAuditModal)
 * Procedura sędziowska w punkcie zegarowym po locie: kontrola plomb, odchyłka chodu i zgranie ESK.
 * Ergonomia Field Mode (touch targets >= 48-56 pt) oraz oficjalny eksport A4 AirPrint/PDF.
 */

import React, { useState, useMemo } from 'react';
import {
  Modal,
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { FieldButton } from './FieldButton';
import {
  ClockOpeningAuditProtocol,
  ClockSystemType,
  CommissionVerdict,
  CLOCK_SYSTEM_LABELS,
  DRIFT_STATUS_LABELS,
  VERDICT_LABELS,
  determineDriftStatus,
  validateClockOpeningProtocol,
  generateClockOpeningAuditHtml,
} from '../domain/clockOpeningAuditProtocol';
import { PdfService } from '../services/pdfService';

interface ClockOpeningAuditModalProps {
  visible: boolean;
  onClose: () => void;
  defaultRaceName?: string;
  defaultBranchName?: string;
  defaultSectionName?: string;
  defaultBreederName?: string;
}

export const ClockOpeningAuditModal: React.FC<ClockOpeningAuditModalProps> = ({
  visible,
  onClose,
  defaultRaceName = 'Szczecin Narodowy 2026',
  defaultBranchName = 'Oddział 0284 Gostyń',
  defaultSectionName = 'Sekcja 02 Poniec',
  defaultBreederName = 'Janusz Kowalski',
}) => {
  const todayIso = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  // Form State
  const [protocolNumber, setProtocolNumber] = useState<string>('OTWARCIE-2026/0284/01');
  const [raceName, setRaceName] = useState<string>(defaultRaceName);
  const [raceDate, setRaceDate] = useState<string>(todayIso);
  const [openingDate, setOpeningDate] = useState<string>(todayIso);
  const [openingTime, setOpeningTime] = useState<string>(nowTime);
  const [stationName, setStationName] = useState<string>('Punkt Zegarowy Sekcja 02 Poniec');
  const [branchName, setBranchName] = useState<string>(defaultBranchName);
  const [sectionName, setSectionName] = useState<string>(defaultSectionName);
  const [breederName, setBreederName] = useState<string>(defaultBreederName);
  const [breederPzhgpNumber, setBreederPzhgpNumber] = useState<string>('0284-1234');

  // Device & Seal
  const [clockSystemType, setClockSystemType] = useState<ClockSystemType>('esk_electronic');
  const [clockDeviceModel, setClockDeviceModel] = useState<string>('Benzing M1');
  const [clockDeviceSerial, setClockDeviceSerial] = useState<string>('BNZ-M1-89104');
  const [sealSerialNumber, setSealSerialNumber] = useState<string>('PLOMBA-78190');
  const [tamperSealIntact, setTamperSealIntact] = useState<boolean>(true);

  // Drift & Timing
  const [driftSecondsInput, setDriftSecondsInput] = useState<string>('0.8');
  const [isTwoDayRace, setIsTwoDayRace] = useState<boolean>(false);
  const [eskSyncSource, setEskSyncSource] = useState<'gps' | 'dcf77' | 'quartz_internal'>('gps');

  // Arrivals data
  const [totalArrivalsRecorded, setTotalArrivalsRecorded] = useState<string>('18');
  const [firstArrivalTime, setFirstArrivalTime] = useState<string>('13:42:15');
  const [firstArrivalRing, setFirstArrivalRing] = useState<string>('PL-0284-22-1402');
  const [lastArrivalTime, setLastArrivalTime] = useState<string>('16:10:04');
  const [checksumHash, setChecksumHash] = useState<string>(
    'SHA256:8f4a1290bb34e91209cc542918231'
  );

  // Verdict & Committee
  const [verdict, setVerdict] = useState<CommissionVerdict>('approved');
  const [committeePresident, setCommitteePresident] = useState<string>('Marek Wiśniewski');
  const [committeeMember1, setCommitteeMember1] = useState<string>('Tomasz Nowak');
  const [committeeMember2, setCommitteeMember2] = useState<string>(
    'Piotr Zieliński (Rachmistrz)'
  );
  const [notes, setNotes] = useState<string>(
    'Odczyt z bazy pamięci terminala przebiegł pomyślnie, brak kolizji chipów.'
  );

  // Active Tab
  const [activeTab, setActiveTab] = useState<'device' | 'drift_data' | 'verdict'>('device');

  // Computed drift status
  const parsedDrift = parseFloat(driftSecondsInput) || 0;
  const driftStatus = useMemo(
    () => determineDriftStatus(parsedDrift, isTwoDayRace),
    [parsedDrift, isTwoDayRace]
  );

  // Build current protocol object
  const currentProtocol: ClockOpeningAuditProtocol = useMemo(
    () => ({
      id: `clock-${openingDate}-${protocolNumber}`,
      protocolNumber,
      raceName,
      raceDate,
      openingDate,
      openingTime,
      stationName,
      branchName,
      sectionName,
      breederName,
      breederPzhgpNumber,
      clockSystemType,
      clockDeviceModel,
      clockDeviceSerial,
      sealSerialNumber,
      tamperSealIntact,
      driftSeconds: parsedDrift,
      driftStatus,
      isTwoDayRace,
      eskSyncSource,
      totalArrivalsRecorded: parseInt(totalArrivalsRecorded, 10) || 0,
      firstArrivalTime,
      firstArrivalRing,
      lastArrivalTime,
      checksumHash,
      verdict,
      committeePresident,
      committeeMember1,
      committeeMember2,
      notes,
    }),
    [
      protocolNumber,
      raceName,
      raceDate,
      openingDate,
      openingTime,
      stationName,
      branchName,
      sectionName,
      breederName,
      breederPzhgpNumber,
      clockSystemType,
      clockDeviceModel,
      clockDeviceSerial,
      sealSerialNumber,
      tamperSealIntact,
      parsedDrift,
      driftStatus,
      isTwoDayRace,
      eskSyncSource,
      totalArrivalsRecorded,
      firstArrivalTime,
      firstArrivalRing,
      lastArrivalTime,
      checksumHash,
      verdict,
      committeePresident,
      committeeMember1,
      committeeMember2,
      notes,
    ]
  );

  const validation = useMemo(
    () => validateClockOpeningProtocol(currentProtocol),
    [currentProtocol]
  );

  const handlePrint = async () => {
    if (!validation.isValid) {
      Alert.alert('Błędy formalne', validation.errors.join('\n'));
      return;
    }
    try {
      const html = generateClockOpeningAuditHtml(currentProtocol);
      await PdfService.printHtml(html);
    } catch (e: any) {
      Alert.alert('Błąd drukowania', e?.message || 'Nie udało się wydrukować protokołu.');
    }
  };

  const handleShare = async () => {
    if (!validation.isValid) {
      Alert.alert('Błędy formalne', validation.errors.join('\n'));
      return;
    }
    try {
      const html = generateClockOpeningAuditHtml(currentProtocol);
      await PdfService.shareHtmlAsPdf(
        html,
        `Protokol-Otwarcia-Zegara-${currentProtocol.protocolNumber.replace(/[^a-zA-Z0-9]/g, '_')}`
      );
    } catch (e: any) {
      Alert.alert('Błąd eksportu', e?.message || 'Nie udało się wyeksportować pliku PDF.');
    }
  };

  const handleSave = () => {
    if (!validation.isValid) {
      Alert.alert('Błędy walidacji', validation.errors.join('\n'));
      return;
    }
    Alert.alert(
      'Zatwierdzono Otwarcie Zegarów',
      `Protokół ${currentProtocol.protocolNumber} dla hodowcy ${currentProtocol.breederName} został zarejestrowany. Werdykt: ${VERDICT_LABELS[currentProtocol.verdict]}.`
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>OTWARCIE ZEGARÓW & AUDYT ESK</Text>
            <Text style={styles.headerSubtitle}>
              Procedura sędziowska, kontrola plomb i odchyłki chodu (Z-098)
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            testID="btn-close-clock-audit-modal"
          >
            <Text style={styles.closeButtonText}>✕ Zamknij</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Top Verdict Banner */}
          <View
            style={[
              styles.verdictBanner,
              verdict === 'approved'
                ? styles.verdictApproved
                : verdict === 'approved_with_drift_correction'
                ? styles.verdictWarning
                : styles.verdictRejected,
            ]}
          >
            <Text style={styles.verdictBannerText}>{VERDICT_LABELS[verdict]}</Text>
            <Text style={styles.verdictBannerSub}>
              Odchyłka: {parsedDrift > 0 ? `+${parsedDrift}` : parsedDrift} s (
              {DRIFT_STATUS_LABELS[driftStatus]}) • Plomba:{' '}
              {tamperSealIntact ? 'NIENARUSZONA' : 'ZERWANA'}
            </Text>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'device' && styles.tabActive]}
              onPress={() => setActiveTab('device')}
              testID="tab-clock-device"
            >
              <Text style={[styles.tabText, activeTab === 'device' && styles.tabTextActive]}>
                1. Lot & Urządzenie
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'drift_data' && styles.tabActive]}
              onPress={() => setActiveTab('drift_data')}
              testID="tab-clock-drift"
            >
              <Text style={[styles.tabText, activeTab === 'drift_data' && styles.tabTextActive]}>
                2. Odchyłka & ESK
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'verdict' && styles.tabActive]}
              onPress={() => setActiveTab('verdict')}
              testID="tab-clock-verdict"
            >
              <Text style={[styles.tabText, activeTab === 'verdict' && styles.tabTextActive]}>
                3. Komisja & Druk
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: LOT & DEVICE */}
          {activeTab === 'device' && (
            <View>
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>DANE FORMALNE LOTU I OTWARCIA</Text>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Nr Protokołu Otwarcia:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={protocolNumber}
                      onChangeText={setProtocolNumber}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 0.8 }]}>
                    <Text style={styles.inputLabel}>Godzina Otwarcia:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={openingTime}
                      onChangeText={setOpeningTime}
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Nazwa Lotu:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={raceName}
                      onChangeText={setRaceName}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 0.8 }]}>
                    <Text style={styles.inputLabel}>Data Lotu:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={raceDate}
                      onChangeText={setRaceDate}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Punkt Zegarowy (Lokalizacja):</Text>
                  <TextInput
                    style={styles.textInput}
                    value={stationName}
                    onChangeText={setStationName}
                  />
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>HODOWCA I AUDYT ZEGARA</Text>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Hodowca:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={breederName}
                      onChangeText={setBreederName}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 0.8 }]}>
                    <Text style={styles.inputLabel}>Nr Członkowski:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={breederPzhgpNumber}
                      onChangeText={setBreederPzhgpNumber}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Typ Systemu Zegarowego:</Text>
                <View style={styles.typeSelectorRow}>
                  {(['esk_electronic', 'mechanical_drum'] as ClockSystemType[]).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.typeBadge,
                        clockSystemType === t && styles.typeBadgeActive,
                      ]}
                      onPress={() => setClockSystemType(t)}
                    >
                      <Text
                        style={[
                          styles.typeBadgeText,
                          clockSystemType === t && styles.typeBadgeTextActive,
                        ]}
                      >
                        {t === 'esk_electronic' ? '📡 Elektroniczny ESK' : '🕰️ Mechaniczny Bęben'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={[styles.inputRow, { marginTop: 10 }]}>
                  <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Model Urządzenia:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={clockDeviceModel}
                      onChangeText={setClockDeviceModel}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 0.8 }]}>
                    <Text style={styles.inputLabel}>Nr Fabryczny:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={clockDeviceSerial}
                      onChangeText={setClockDeviceSerial}
                    />
                  </View>
                </View>

                {/* Seal check */}
                <View style={[styles.inputGroup, { marginTop: 4 }]}>
                  <Text style={styles.inputLabel}>Nr Plomby Zabezpieczającej (z koszowania):</Text>
                  <TextInput
                    style={styles.textInput}
                    value={sealSerialNumber}
                    onChangeText={setSealSerialNumber}
                  />
                </View>

                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Plomba legalizacyjna w stanie nienaruszonym:</Text>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      tamperSealIntact ? styles.toggleBtnActive : styles.toggleBtnDanger,
                    ]}
                    onPress={() => setTamperSealIntact(!tamperSealIntact)}
                  >
                    <Text style={styles.toggleBtnText}>
                      {tamperSealIntact ? '✓ TAK' : '✗ ZERWANA'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* TAB 2: DRIFT & ESK DATA */}
          {activeTab === 'drift_data' && (
            <View>
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>KONTROLA ODCHYŁKI CHODU ZEGARA</Text>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Odchyłka Zegara (s):</Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        driftStatus === 'disqualified_excessive_drift' && {
                          borderColor: '#ef4444',
                          color: '#f87171',
                        },
                      ]}
                      value={driftSecondsInput}
                      onChangeText={setDriftSecondsInput}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 0.8 }]}>
                    <Text style={styles.inputLabel}>Lot Dwudniowy:</Text>
                    <TouchableOpacity
                      style={[styles.toggleBtn, isTwoDayRace && styles.toggleBtnActive]}
                      onPress={() => setIsTwoDayRace(!isTwoDayRace)}
                    >
                      <Text style={styles.toggleBtnText}>{isTwoDayRace ? 'TAK (4s)' : 'NIE (2s)'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.driftStatusCard}>
                  <Text style={styles.driftStatusTitle}>Ocena Odchyłki PZHGP:</Text>
                  <Text style={styles.driftStatusDesc}>{DRIFT_STATUS_LABELS[driftStatus]}</Text>
                  <Text style={styles.helperText}>
                    Tolerancja: do ±2.0 s na 24h. Od 2.1 s do 10.0 s dopuszczalna korekta. Powyżej 10.0 s dyskwalifikacja.
                  </Text>
                </View>

                {clockSystemType === 'esk_electronic' && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.inputLabel}>Źródło Czasu Bazy ESK:</Text>
                    <View style={styles.methodSelectorRow}>
                      {(['gps', 'dcf77', 'quartz_internal'] as const).map((s) => (
                        <TouchableOpacity
                          key={s}
                          style={[
                            styles.methodBtn,
                            eskSyncSource === s && styles.methodBtnActive,
                          ]}
                          onPress={() => setEskSyncSource(s)}
                        >
                          <Text
                            style={[
                              styles.methodBtnText,
                              eskSyncSource === s && styles.methodBtnTextActive,
                            ]}
                          >
                            {s === 'gps'
                              ? '🛰️ GPS'
                              : s === 'dcf77'
                              ? '📻 DCF-77'
                              : '⏱️ Kwarc'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>DANE ZGRANYCH PRZYLOTÓW</Text>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Liczba Odbitych Ptaków:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={totalArrivalsRecorded}
                      onChangeText={setTotalArrivalsRecorded}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Godzina 1. Przylotu:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={firstArrivalTime}
                      onChangeText={setFirstArrivalTime}
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Obrączka 1. Przylotu:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={firstArrivalRing}
                      onChangeText={setFirstArrivalRing}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Godzina Ostatniego:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={lastArrivalTime}
                      onChangeText={setLastArrivalTime}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Suma Kontrolna Pliku (SHA-256 / Checksum):</Text>
                  <TextInput
                    style={[styles.textInput, { fontFamily: 'monospace', fontSize: 11 }]}
                    value={checksumHash}
                    onChangeText={setChecksumHash}
                  />
                </View>
              </View>
            </View>
          )}

          {/* TAB 3: VERDICT & PRINT */}
          {activeTab === 'verdict' && (
            <View>
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>WERDYKT KOMISJI ZEGAROWEJ</Text>

                <View style={styles.verdictSelectorCol}>
                  {(
                    [
                      'approved',
                      'approved_with_drift_correction',
                      'rejected_seal_broken',
                      'rejected_desync_or_fraud',
                    ] as CommissionVerdict[]
                  ).map((v) => (
                    <TouchableOpacity
                      key={v}
                      style={[
                        styles.verdictItem,
                        verdict === v && styles.verdictItemActive,
                      ]}
                      onPress={() => setVerdict(v)}
                    >
                      <Text
                        style={[
                          styles.verdictItemText,
                          verdict === v && styles.verdictItemTextActive,
                        ]}
                      >
                        {VERDICT_LABELS[v]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>
                  SKŁAD KOMISJI ZEGAROWEJ (MIN. 3 OSOBY)
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Przewodniczący Komisji Zegarowej:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={committeePresident}
                    onChangeText={setCommitteePresident}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Członek Komisji 1:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={committeeMember1}
                      onChangeText={setCommitteeMember1}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Członek 2 / Rachmistrz:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={committeeMember2}
                      onChangeText={setCommitteeMember2}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Adnotacje i Uwagi Komisji:</Text>
                  <TextInput
                    style={[styles.textInput, { minHeight: 60, textAlignVertical: 'top' }]}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                  />
                </View>
              </View>

              {/* Action Buttons */}
              <FieldButton
                title="🛡️ Zatwierdź Protokół Otwarcia Zegarów"
                onPress={handleSave}
                style={styles.saveButton}
                testID="btn-save-clock-audit"
              />

              <View style={styles.exportRow}>
                <FieldButton
                  title="🖨️ AirPrint Protokół"
                  variant="secondary"
                  onPress={handlePrint}
                  style={{ flex: 1, marginRight: 8 }}
                  testID="btn-print-clock-audit"
                />
                <FieldButton
                  title="📤 Udostępnij PDF (PZHGP)"
                  variant="secondary"
                  onPress={handleShare}
                  style={{ flex: 1 }}
                  testID="btn-share-clock-audit"
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
  verdictBanner: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1.5,
  },
  verdictApproved: {
    backgroundColor: '#052e16',
    borderColor: '#16a34a',
  },
  verdictWarning: {
    backgroundColor: '#451a03',
    borderColor: '#d97706',
  },
  verdictRejected: {
    backgroundColor: '#450a0a',
    borderColor: '#dc2626',
  },
  verdictBannerText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  verdictBannerSub: {
    fontSize: 10,
    color: '#CBD5E1',
    marginTop: 4,
    fontWeight: 'bold',
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
  helperText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  typeBadge: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121417',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    marginRight: 6,
  },
  typeBadgeActive: {
    backgroundColor: '#0369a1',
    borderColor: '#38bdf8',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  typeBadgeTextActive: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    flex: 1,
  },
  toggleBtn: {
    minHeight: 48,
    minWidth: 80,
    backgroundColor: '#121417',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#047857',
    borderColor: '#34d399',
  },
  toggleBtnDanger: {
    backgroundColor: '#7f1d1d',
    borderColor: '#ef4444',
  },
  toggleBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  driftStatusCard: {
    backgroundColor: '#121417',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginTop: 4,
  },
  driftStatusTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  driftStatusDesc: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  methodSelectorRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  methodBtn: {
    flex: 1,
    minHeight: 48,
    backgroundColor: '#121417',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  methodBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  methodBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  methodBtnTextActive: {
    color: '#FFFFFF',
  },
  verdictSelectorCol: {
    marginTop: 4,
  },
  verdictItem: {
    minHeight: 52,
    backgroundColor: '#121417',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  verdictItemActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#0c4a6e',
  },
  verdictItemText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  verdictItemTextActive: {
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

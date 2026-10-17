/**
 * PIGEON-FLY — Ewidencja Zdarzeń Losowych i Generator Protokołu Wykreślenia Modal (Z-068)
 * Standard PZHGP: Ewidencja upadków, drapieżników, zagubień w lotach oraz urzędowy protokół A4.
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
  calculateDecommissionStats,
  DecommissionCause,
  DECOMMISSION_CAUSES,
  DecommissionRecord,
  DecommissionProtocolData,
} from '../domain/pigeonDecommission';
import { PdfService } from '../services/pdfService';

interface PigeonDecommissionModalProps {
  visible: boolean;
  onClose: () => void;
  initialFlockSize?: number;
}

const DEFAULT_INITIAL_RECORDS: DecommissionRecord[] = [
  {
    id: 'dec-1',
    pigeonId: 'p-01',
    ringNumber: 'PL-0284-22-1402',
    sex: 'cock',
    year: 2022,
    color: 'Niebieski nakrapiany',
    cause: 'RAPTOR_ATTACK',
    eventDate: '2026-05-18',
    locationOrRace: 'Oblot poranny przy gołębniku',
    witnessOrConfirmation: 'Resztki piór i obrączka na dachu',
    notes: 'Atak jastrzębia gołębiarza',
  },
  {
    id: 'dec-2',
    pigeonId: 'p-02',
    ringNumber: 'PL-0284-23-6611',
    sex: 'hen',
    year: 2023,
    color: 'Ciemna',
    cause: 'LOST_IN_RACE',
    eventDate: '2026-06-14',
    locationOrRace: 'Lot konkursowy nr 3 - Magdeburg (345 km)',
    witnessOrConfirmation: 'Brak odczytu w zegarze ESK',
    notes: 'Burza gradowa na trasie przelotu',
  },
  {
    id: 'dec-3',
    pigeonId: 'p-03',
    ringNumber: 'DV-01234-21-998',
    sex: 'hen',
    year: 2021,
    color: 'Płowa',
    cause: 'MORTALITY_NATURAL',
    eventDate: '2026-07-02',
    locationOrRace: 'Cela gniazdowa nr 14',
    witnessOrConfirmation: 'Zgon naturalny (wiek 5 lat)',
    notes: 'Utylizacja zgodna z wymogami PIW',
  },
];

export const PigeonDecommissionModal: React.FC<PigeonDecommissionModalProps> = ({
  visible,
  onClose,
  initialFlockSize = 65,
}) => {
  const [activeTab, setActiveTab] = useState<'records' | 'add' | 'protocol'>('records');
  const [records, setRecords] = useState<DecommissionRecord[]>(DEFAULT_INITIAL_RECORDS);
  const [totalRegistered, setTotalRegistered] = useState<number>(initialFlockSize);

  // Form state for adding new record
  const [ringNumber, setRingNumber] = useState('');
  const [sex, setSex] = useState<'cock' | 'hen'>('cock');
  const [year, setYear] = useState('2024');
  const [color, setColor] = useState('Niebieski');
  const [cause, setCause] = useState<DecommissionCause>('RAPTOR_ATTACK');
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [locationOrRace, setLocationOrRace] = useState('');
  const [witnessOrConfirmation, setWitnessOrConfirmation] = useState('');
  const [notes, setNotes] = useState('');

  // Protocol header settings
  const [protocolNumber, setProtocolNumber] = useState(`PW-${new Date().getFullYear()}/01`);
  const [breederName, setBreederName] = useState('Jan Kowalski (PL-0284-1234)');
  const [pzhgpBranch, setPzhgpBranch] = useState('Oddział 0284 Gostyń');
  const [pzhgpSection, setPzhgpSection] = useState('Sekcja 01 Gostyń-Centrum');
  const [loftCoords, setLoftCoords] = useState('51°52\'44.5"N 17°00\'40.2"E');

  const stats = calculateDecommissionStats(records, totalRegistered);

  const handleAddRecord = () => {
    if (!ringNumber.trim()) {
      Alert.alert('Błąd formularza', 'Wpisz numer obrączki rodowej ptaka.');
      return;
    }

    const newRec: DecommissionRecord = {
      id: `dec-${Date.now()}`,
      pigeonId: `p-${Date.now()}`,
      ringNumber: ringNumber.trim().toUpperCase(),
      sex,
      year: parseInt(year, 10) || new Date().getFullYear(),
      color: color.trim() || 'Niebieski',
      cause,
      eventDate: eventDate.trim() || new Date().toISOString().slice(0, 10),
      locationOrRace: locationOrRace.trim(),
      witnessOrConfirmation: witnessOrConfirmation.trim(),
      notes: notes.trim(),
    };

    setRecords((prev) => [newRec, ...prev]);
    Alert.alert(
      'Zdarzenie zarejestrowane',
      `Ptak ${newRec.ringNumber} został odnotowany w ewidencji zdarzeń losowych.\nDrzewo genealogiczne zachowuje pełną spójność.`
    );

    // Reset inputs
    setRingNumber('');
    setLocationOrRace('');
    setWitnessOrConfirmation('');
    setNotes('');
    setActiveTab('records');
  };

  const handleDeleteRecord = (id: string, ring: string) => {
    Alert.alert(
      'Usunąć wpis?',
      `Czy na pewno chcesz usunąć ptaka ${ring} z rejestru wykreśleń? Ptak powróci do stanu aktywnego.`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: () => {
            setRecords((prev) => prev.filter((r) => r.id !== id));
          },
        },
      ]
    );
  };

  const handleExportPdf = async (mode: 'print' | 'share') => {
    try {
      const protocolData: DecommissionProtocolData = {
        protocolNumber,
        issueDate: new Date().toISOString().slice(0, 10),
        seasonYear: new Date().getFullYear(),
        breederName,
        pzhgpBranch,
        pzhgpSection,
        loftCoordinates: loftCoords,
        totalRegisteredFlock: totalRegistered,
        records,
        notes: 'Wydruk z modułu Z-068 aplikacji PIGEON-FLY.',
      };

      await PdfService.exportPigeonDecommissionProtocol(protocolData, mode);
    } catch (e: any) {
      Alert.alert('Błąd eksportu', e?.message || 'Nie udało się wyeksportować protokołu.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>🕊️ Ewidencja Zdarzeń i Wykreślenia (Z-068)</Text>
              <Text style={styles.subTitle}>
                Standard PZHGP: Rejestr upadków, ataków drapieżników i protokół ubytków stada
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="btn-close-decommission-modal">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Metrics Banner */}
          <View style={styles.metricsBanner}>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>POCZĄTKOWE</Text>
              <Text style={styles.metricVal}>{stats.totalRegistered}</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>UBYTKI / STRATY</Text>
              <Text style={[styles.metricVal, { color: '#E05656' }]}>-{stats.totalDecommissioned}</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>AKTYWNE STADO</Text>
              <Text style={[styles.metricVal, { color: '#4CAF50' }]}>{stats.activeFlockSize}</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>WSKAŹNIK STRAT</Text>
              <Text style={[styles.metricVal, { color: stats.lossRatePercentage > 20 ? '#E05656' : '#E5A93C' }]}>
                {stats.lossRatePercentage}%
              </Text>
            </View>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'records' && styles.tabButtonActive]}
              onPress={() => setActiveTab('records')}
              testID="tab-decommission-records"
            >
              <Text style={[styles.tabButtonText, activeTab === 'records' && styles.tabButtonTextActive]}>
                📋 Rejestr ({records.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'add' && styles.tabButtonActive]}
              onPress={() => setActiveTab('add')}
              testID="tab-decommission-add"
            >
              <Text style={[styles.tabButtonText, activeTab === 'add' && styles.tabButtonTextActive]}>
                ➕ Zgłoś Zdarzenie
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'protocol' && styles.tabButtonActive]}
              onPress={() => setActiveTab('protocol')}
              testID="tab-decommission-protocol"
            >
              <Text style={[styles.tabButtonText, activeTab === 'protocol' && styles.tabButtonTextActive]}>
                🖨️ Protokół PZHGP
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }}>
            {activeTab === 'records' && (
              <View>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Zdarzenia Losowe i Wykreślenia</Text>
                  <Text style={styles.sectionSubtitle}>
                    Ostatnie ubytki stada zarejestrowane w bieżącym sezonie
                  </Text>
                </View>

                {records.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>Brak zarejestrowanych wykreśleń</Text>
                    <Text style={styles.emptySub}>
                      Wszystkie gołębie ze stanu początkowego są aktywne w gołębniku.
                    </Text>
                  </View>
                ) : (
                  records.map((rec, idx) => {
                    const meta = DECOMMISSION_CAUSES[rec.cause] || DECOMMISSION_CAUSES.OTHER;
                    return (
                      <View key={rec.id} style={styles.recordCard}>
                        <View style={styles.recordHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.recordIndex}>#{idx + 1}</Text>
                            <Text style={styles.recordRing}>{rec.ringNumber}</Text>
                            <View style={[styles.badge, { backgroundColor: `${meta.color}22`, borderColor: meta.color }]}>
                              <Text style={[styles.badgeText, { color: meta.color }]}>
                                {meta.icon} {meta.shortLabel}
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleDeleteRecord(rec.id, rec.ringNumber)}
                            style={styles.deleteBtn}
                            testID={`btn-delete-record-${idx}`}
                          >
                            <Text style={styles.deleteBtnText}>Usuń</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.recordDetailsRow}>
                          <Text style={styles.recordDetailItem}>
                            Płeć: <Text style={styles.recordDetailVal}>{rec.sex === 'cock' ? '♂ Samiec' : '♀ Samica'}</Text>
                          </Text>
                          <Text style={styles.recordDetailItem}>
                            Rocznik: <Text style={styles.recordDetailVal}>{rec.year}</Text>
                          </Text>
                          <Text style={styles.recordDetailItem}>
                            Barwa: <Text style={styles.recordDetailVal}>{rec.color}</Text>
                          </Text>
                          <Text style={styles.recordDetailItem}>
                            Data: <Text style={styles.recordDetailVal}>{rec.eventDate}</Text>
                          </Text>
                        </View>

                        {rec.locationOrRace ? (
                          <Text style={styles.recordSubInfo}>
                            📍 <Text style={styles.recordSubVal}>{rec.locationOrRace}</Text>
                          </Text>
                        ) : null}

                        {rec.witnessOrConfirmation ? (
                          <Text style={styles.recordSubInfo}>
                            👁️ <Text style={styles.recordSubVal}>Potwierdzenie: {rec.witnessOrConfirmation}</Text>
                          </Text>
                        ) : null}

                        {rec.notes ? (
                          <Text style={styles.recordNotes}>Uwagi: {rec.notes}</Text>
                        ) : null}
                      </View>
                    );
                  })
                )}

                {/* Biological Safety Card */}
                <View style={styles.safetyInfoCard}>
                  <Text style={styles.safetyTitle}>🛡️ Bezpieczeństwo Genealogiczne i Dobrostan</Text>
                  <Text style={styles.safetyText}>
                    Wykreślenie ptaka ze stada aktywnego nie kasuje go z bazy danych. Cyfrowe drzewa
                    rodowodowe jego rodziców, rodzeństwa i potomstwa zachowują 100% ciągłości historycznej.
                  </Text>
                </View>
              </View>
            )}

            {activeTab === 'add' && (
              <View>
                <Text style={styles.sectionTitle}>Rejestracja Nowego Zdarzenia</Text>
                <Text style={styles.sectionSubtitle}>
                  Wprowadź dane utraconego lub wykreślonego ptaka
                </Text>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Numer Obrączki Rodowej *</Text>
                  <TextInput
                    style={styles.input}
                    value={ringNumber}
                    onChangeText={setRingNumber}
                    placeholder="np. PL-0284-23-4501"
                    placeholderTextColor="#777"
                    autoCapitalize="characters"
                    testID="input-decommission-ring"
                  />
                </View>

                <View style={styles.rowTwoCols}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Płeć</Text>
                    <View style={styles.sexToggleRow}>
                      <TouchableOpacity
                        style={[styles.sexBtn, sex === 'cock' && styles.sexBtnActive]}
                        onPress={() => setSex('cock')}
                      >
                        <Text style={[styles.sexBtnText, sex === 'cock' && styles.sexBtnTextActive]}>
                          ♂ Samiec
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.sexBtn, sex === 'hen' && styles.sexBtnActive]}
                        onPress={() => setSex('hen')}
                      >
                        <Text style={[styles.sexBtnText, sex === 'hen' && styles.sexBtnTextActive]}>
                          ♀ Samica
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Rocznik</Text>
                    <TextInput
                      style={styles.input}
                      value={year}
                      onChangeText={setYear}
                      keyboardType="numeric"
                      placeholder="2024"
                      placeholderTextColor="#777"
                    />
                  </View>
                </View>

                <View style={styles.rowTwoCols}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Umaszczenie / Barwa</Text>
                    <TextInput
                      style={styles.input}
                      value={color}
                      onChangeText={setColor}
                      placeholder="np. Ciemna nakrapiana"
                      placeholderTextColor="#777"
                    />
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Data Zdarzenia (RRRR-MM-DD)</Text>
                    <TextInput
                      style={styles.input}
                      value={eventDate}
                      onChangeText={setEventDate}
                      placeholder="2026-06-15"
                      placeholderTextColor="#777"
                    />
                  </View>
                </View>

                {/* Cause Selector */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Przyczyna Wykreślenia / Zdarzenia *</Text>
                  <View style={styles.causeChipsGrid}>
                    {(Object.keys(DECOMMISSION_CAUSES) as DecommissionCause[]).map((cKey) => {
                      const cMeta = DECOMMISSION_CAUSES[cKey];
                      const isSelected = cause === cKey;
                      return (
                        <TouchableOpacity
                          key={cKey}
                          style={[
                            styles.causeChip,
                            isSelected && { backgroundColor: `${cMeta.color}33`, borderColor: cMeta.color },
                          ]}
                          onPress={() => setCause(cKey)}
                        >
                          <Text style={styles.causeChipIcon}>{cMeta.icon}</Text>
                          <Text
                            style={[
                              styles.causeChipText,
                              isSelected && { color: cMeta.color, fontWeight: 'bold' },
                            ]}
                            numberOfLines={1}
                          >
                            {cMeta.shortLabel}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Miejsce / Lot Konkursowy</Text>
                  <TextInput
                    style={styles.input}
                    value={locationOrRace}
                    onChangeText={setLocationOrRace}
                    placeholder="np. Oblot poranny lub Lot Magdeburg"
                    placeholderTextColor="#777"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Świadek / Potwierdzenie / Dowód</Text>
                  <TextInput
                    style={styles.input}
                    value={witnessOrConfirmation}
                    onChangeText={setWitnessOrConfirmation}
                    placeholder="np. Pióra na dachu, protokół weterynarza, umowa"
                    placeholderTextColor="#777"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Dodatkowe Uwagi</Text>
                  <TextInput
                    style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Szczegółowe okoliczności zdarzenia..."
                    placeholderTextColor="#777"
                    multiline
                  />
                </View>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleAddRecord}
                  testID="btn-submit-decommission"
                >
                  <Text style={styles.submitBtnText}>💾 Zapisz Wykreślenie w Ewidencji</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'protocol' && (
              <View>
                <Text style={styles.sectionTitle}>Urzędowy Protokół PZHGP</Text>
                <Text style={styles.sectionSubtitle}>
                  Konfiguracja nagłówka i generowanie gotowego do podpisu arkusza A4
                </Text>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Numer Protokołu</Text>
                  <TextInput
                    style={styles.input}
                    value={protocolNumber}
                    onChangeText={setProtocolNumber}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Imię i Nazwisko Hodowcy / Nr Członkowski</Text>
                  <TextInput
                    style={styles.input}
                    value={breederName}
                    onChangeText={setBreederName}
                  />
                </View>

                <View style={styles.rowTwoCols}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Oddział PZHGP</Text>
                    <TextInput
                      style={styles.input}
                      value={pzhgpBranch}
                      onChangeText={setPzhgpBranch}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Sekcja</Text>
                    <TextInput
                      style={styles.input}
                      value={pzhgpSection}
                      onChangeText={setPzhgpSection}
                    />
                  </View>
                </View>

                <View style={styles.rowTwoCols}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Koordynaty Gołębnika (WGS-84)</Text>
                    <TextInput
                      style={styles.input}
                      value={loftCoords}
                      onChangeText={setLoftCoords}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Początkowy Stan Stada</Text>
                    <TextInput
                      style={styles.input}
                      value={String(totalRegistered)}
                      onChangeText={(val) => setTotalRegistered(parseInt(val, 10) || 0)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* Print & Share actions */}
                <View style={styles.actionsCard}>
                  <Text style={styles.actionsCardTitle}>Druk i Eksport Dokumentu A4</Text>
                  <Text style={styles.actionsCardText}>
                    Dokument zawiera podsumowanie strat, rozbicie procentowe przyczyn, wykaz ptaków
                    z numerami obrączek oraz klauzulę integralności danych i podpisy komisji.
                  </Text>

                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnPrint]}
                      onPress={() => handleExportPdf('print')}
                      testID="btn-print-decommission-protocol"
                    >
                      <Text style={styles.actionBtnText}>🖨️ Drukuj Protokół A4</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnShare]}
                      onPress={() => handleExportPdf('share')}
                      testID="btn-share-decommission-protocol"
                    >
                      <Text style={styles.actionBtnText}>📤 Udostępnij PDF</Text>
                    </TouchableOpacity>
                  </View>
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
    borderColor: '#2B579A',
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
    color: '#E5A93C',
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
    borderBottomColor: '#E5A93C',
    backgroundColor: '#21252D',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A92A0',
  },
  tabButtonTextActive: {
    color: '#E5A93C',
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
  emptyCard: {
    padding: 24,
    backgroundColor: '#16181D',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2C313A',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#CCCCCC',
  },
  emptySub: {
    fontSize: 12,
    color: '#777777',
    textAlign: 'center',
    marginTop: 4,
  },
  recordCard: {
    backgroundColor: '#16181D',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2C313A',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordIndex: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8A92A0',
  },
  recordRing: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  deleteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#3A1E1E',
  },
  deleteBtnText: {
    fontSize: 11,
    color: '#E05656',
    fontWeight: '600',
  },
  recordDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 6,
  },
  recordDetailItem: {
    fontSize: 11,
    color: '#8A92A0',
  },
  recordDetailVal: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  recordSubInfo: {
    fontSize: 11,
    color: '#8A92A0',
    marginTop: 3,
  },
  recordSubVal: {
    color: '#D0D6E0',
  },
  recordNotes: {
    fontSize: 10,
    color: '#717885',
    fontStyle: 'italic',
    marginTop: 4,
  },
  safetyInfoCard: {
    backgroundColor: '#122336',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#2B579A',
  },
  safetyTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6BA4F8',
    marginBottom: 4,
  },
  safetyText: {
    fontSize: 11,
    color: '#B0C8E8',
    lineHeight: 16,
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
  sexToggleRow: {
    flexDirection: 'row',
    gap: 6,
    height: 48,
  },
  sexBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#14171C',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2C313A',
  },
  sexBtnActive: {
    backgroundColor: '#263445',
    borderColor: '#2B579A',
  },
  sexBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A92A0',
  },
  sexBtnTextActive: {
    color: '#6BA4F8',
    fontWeight: 'bold',
  },
  causeChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  causeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#14171C',
    borderWidth: 1,
    borderColor: '#2C313A',
    minHeight: 48,
  },
  causeChipIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  causeChipText: {
    fontSize: 11,
    color: '#A0A8B4',
  },
  submitBtn: {
    minHeight: 52,
    backgroundColor: '#E5A93C',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#121417',
  },
  actionsCard: {
    backgroundColor: '#16191E',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#2C313A',
  },
  actionsCardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionsCardText: {
    fontSize: 11,
    color: '#8A92A0',
    lineHeight: 16,
    marginBottom: 12,
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

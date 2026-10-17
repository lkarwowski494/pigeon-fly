/**
 * PIGEON-FLY — Kalkulator Odchyłek Zegarowych i Synchronizacji DCF-77 / GPS Modal (Z-071)
 * Standard PZHGP (art. 44 Regulaminu Lotowo-Zegarowego PZHGP i FCI).
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
  calculateClockDrift,
  correctArrivalTimestamp,
  CLOCK_TYPES,
  ClockType,
  ClockSyncSession,
  ClockProtocolData,
} from '../domain/clockSynchronization';
import { PdfService } from '../services/pdfService';

interface ClockSyncModalProps {
  visible: boolean;
  onClose: () => void;
  defaultRaceName?: string;
  defaultRaceDistanceKm?: number;
}

interface DemoArrival {
  ringNumber: string;
  clockTime: string;
}

const DEFAULT_DEMO_ARRIVALS: DemoArrival[] = [
  { ringNumber: 'PL-0284-23-1402', clockTime: '2026-06-14T11:15:20Z' },
  { ringNumber: 'PL-0284-22-9854', clockTime: '2026-06-14T11:32:45Z' },
  { ringNumber: 'DV-01234-24-512', clockTime: '2026-06-14T11:48:10Z' },
];

export const ClockSyncModal: React.FC<ClockSyncModalProps> = ({
  visible,
  onClose,
  defaultRaceName = 'Magdeburg',
  defaultRaceDistanceKm = 375,
}) => {
  const [activeTab, setActiveTab] = useState<'session' | 'correction' | 'protocol'>('session');

  // Sync Session State
  const [clockType, setClockType] = useState<ClockType>('MECHANICAL_BENZING');
  const [clockNumber, setClockNumber] = useState('B-77491');
  const [breederName, setBreederName] = useState('Jan Kowalski (PL-0284-1234)');
  const [raceName, setRaceName] = useState(defaultRaceName);
  const [pzhgpBranch, setPzhgpBranch] = useState('Oddział 0284 Gostyń');
  const [pzhgpSection, setPzhgpSection] = useState('Sekcja 01');

  // Timestamps
  const [masterStart, setMasterStart] = useState('2026-06-13T16:00:00Z');
  const [clockStart, setClockStart] = useState('2026-06-13T16:00:00Z');
  const [masterEnd, setMasterEnd] = useState('2026-06-14T16:00:00Z');
  const [clockEnd, setClockEnd] = useState('2026-06-14T16:00:18Z'); // +18s over 24h = 0.75 s/h

  const session: ClockSyncSession = {
    clockId: 'clock-main',
    clockType,
    clockNumber,
    breederName,
    raceName,
    masterSyncStartIso: masterStart,
    clockSyncStartIso: clockStart,
    masterSyncEndIso: masterEnd,
    clockSyncEndIso: clockEnd,
  };

  const driftResult = calculateClockDrift(session);
  const raceDistanceMeters = defaultRaceDistanceKm * 1000;

  const correctedArrivals = DEFAULT_DEMO_ARRIVALS.map((arr) => {
    const corr = correctArrivalTimestamp({
      clockArrivalIso: arr.clockTime,
      syncSession: session,
      driftResult,
      raceDistanceMeters,
    });
    return {
      ringNumber: arr.ringNumber,
      clockTime: arr.clockTime,
      correctedTime: corr.officialArrivalIso,
      driftSeconds: corr.correctionOffsetSeconds,
      officialVelocity: corr.officialCorrectedVelocityMPerMin,
      velocityImpact: corr.velocityImpactMPerMin,
    };
  });

  const handleExportPdf = async (mode: 'print' | 'share') => {
    try {
      const protocolData: ClockProtocolData = {
        protocolNumber: `PZ-${new Date().getFullYear()}/01`,
        issueDate: new Date().toISOString().slice(0, 10),
        raceName,
        pzhgpBranch,
        pzhgpSection,
        session,
        drift: driftResult,
        arrivals: correctedArrivals,
      };

      await PdfService.exportClockSyncProtocol(protocolData, mode);
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
              <Text style={styles.title}>⏱️ Kalkulator Odchyłek Zegarowych PZHGP (Z-071)</Text>
              <Text style={styles.subTitle}>
                Synchronizacja DCF-77 / GPS, korekta proporcjonalna chodu (art. 44 Regulaminu)
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="btn-close-clock-sync-modal">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Metrics Banner */}
          <View style={styles.metricsBanner}>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>CZAS PRACY</Text>
              <Text style={styles.metricVal}>{driftResult.sessionDurationHours} h</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>ODCHYŁKA CAŁKOWITA</Text>
              <Text
                style={[
                  styles.metricVal,
                  { color: driftResult.totalDriftSeconds === 0 ? '#4CAF50' : driftResult.isDisqualified ? '#E05656' : '#E5A93C' },
                ]}
              >
                {driftResult.totalDriftSeconds > 0 ? `+${driftResult.totalDriftSeconds}` : driftResult.totalDriftSeconds} s
              </Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>ODCHYŁKA / GODZ.</Text>
              <Text style={styles.metricVal}>{Math.abs(driftResult.hourlyDriftSeconds).toFixed(2)} s/h</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>ORZECZENIE</Text>
              <Text
                style={[
                  styles.metricVal,
                  { color: driftResult.isDisqualified ? '#E05656' : '#4CAF50', fontSize: 13 },
                ]}
              >
                {driftResult.isDisqualified ? 'DYSKWALIFIKACJA' : 'ZGODNY (WAŻNY)'}
              </Text>
            </View>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'session' && styles.tabButtonActive]}
              onPress={() => setActiveTab('session')}
              testID="tab-clock-session"
            >
              <Text style={[styles.tabButtonText, activeTab === 'session' && styles.tabButtonTextActive]}>
                ⚙️ Synchronizacja (Matka)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'correction' && styles.tabButtonActive]}
              onPress={() => setActiveTab('correction')}
              testID="tab-clock-correction"
            >
              <Text style={[styles.tabButtonText, activeTab === 'correction' && styles.tabButtonTextActive]}>
                🕊️ Korekta Odbić ({correctedArrivals.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'protocol' && styles.tabButtonActive]}
              onPress={() => setActiveTab('protocol')}
              testID="tab-clock-protocol"
            >
              <Text style={[styles.tabButtonText, activeTab === 'protocol' && styles.tabButtonTextActive]}>
                🖨️ Protokół Sędziowski
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content Body */}
          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }}>
            {activeTab === 'session' && (
              <View>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Parametry Chodu i Nastawiania Zegara</Text>
                  <Text style={styles.sectionSubtitle}>
                    Odczyty zegara wzorcowego DCF-77 / GPS oraz zegara zawodnika
                  </Text>
                </View>

                {driftResult.disqualificationReason && (
                  <View style={styles.disqualificationAlert}>
                    <Text style={styles.disqualificationTitle}>⛔ DYSKWALIFIKACJA ZEGARA (art. 44)</Text>
                    <Text style={styles.disqualificationText}>{driftResult.disqualificationReason}</Text>
                  </View>
                )}

                {/* Clock Type Selector */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Typ Zegara Konkursowego *</Text>
                  <View style={styles.clockTypesGrid}>
                    {(Object.keys(CLOCK_TYPES) as ClockType[]).map((cKey) => {
                      const cMeta = CLOCK_TYPES[cKey];
                      const isSelected = clockType === cKey;
                      return (
                        <TouchableOpacity
                          key={cKey}
                          style={[styles.clockTypeBtn, isSelected && styles.clockTypeBtnActive]}
                          onPress={() => setClockType(cKey)}
                        >
                          <Text style={[styles.clockTypeBtnTitle, isSelected && styles.clockTypeBtnTitleActive]}>
                            {cMeta.isElectronic ? '📱 ESK' : '🕰️ Mechaniczny'}
                          </Text>
                          <Text style={styles.clockTypeBtnDesc} numberOfLines={2}>
                            {cMeta.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.rowTwoCols}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Numer Zegara / Fabryczny</Text>
                    <TextInput
                      style={styles.input}
                      value={clockNumber}
                      onChangeText={setClockNumber}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1.2 }]}>
                    <Text style={styles.label}>Hodowca</Text>
                    <TextInput
                      style={styles.input}
                      value={breederName}
                      onChangeText={setBreederName}
                    />
                  </View>
                </View>

                <View style={styles.dividerHorizontal} />
                <Text style={[styles.sectionTitle, { fontSize: 13, marginBottom: 8 }]}>
                  Punkt 1: Nastawianie Zegara (Koszowanie)
                </Text>

                <View style={styles.rowTwoCols}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Czas Wzorcowy Matki (Tm1)</Text>
                    <TextInput
                      style={styles.input}
                      value={masterStart}
                      onChangeText={setMasterStart}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Czas Zegara Zawodnika (Tz1)</Text>
                    <TextInput
                      style={styles.input}
                      value={clockStart}
                      onChangeText={setClockStart}
                    />
                  </View>
                </View>

                <View style={styles.dividerHorizontal} />
                <Text style={[styles.sectionTitle, { fontSize: 13, marginBottom: 8 }]}>
                  Punkt 2: Otwieranie Zegara (Rozliczenie)
                </Text>

                <View style={styles.rowTwoCols}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Czas Wzorcowy Matki (Tm2)</Text>
                    <TextInput
                      style={styles.input}
                      value={masterEnd}
                      onChangeText={setMasterEnd}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Czas Zegara Zawodnika (Tz2)</Text>
                    <TextInput
                      style={styles.input}
                      value={clockEnd}
                      onChangeText={setClockEnd}
                    />
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'correction' && (
              <View>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Proporcjonalna Korekta Czasu Przylotu</Text>
                  <Text style={styles.sectionSubtitle}>
                    Zgodnie z art. 44 Regulaminu PZHGP czas przylotu koryguje się proporcjonalnie do czasu przelotu
                  </Text>
                </View>

                {correctedArrivals.map((arr, idx) => (
                  <View key={arr.ringNumber} style={styles.arrivalCard}>
                    <View style={styles.arrivalHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.arrivalIndex}>#{idx + 1}</Text>
                        <Text style={styles.arrivalRing}>{arr.ringNumber}</Text>
                      </View>
                      <View style={styles.offsetBadge}>
                        <Text style={styles.offsetBadgeText}>
                          Korekta: {arr.driftSeconds > 0 ? `-${arr.driftSeconds.toFixed(1)} s` : `+${Math.abs(arr.driftSeconds).toFixed(1)} s`}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.arrivalTimesRow}>
                      <View style={styles.timeCol}>
                        <Text style={styles.timeLabel}>CZAS Z ZEGARA</Text>
                        <Text style={styles.timeVal}>
                          {new Date(arr.clockTime).toLocaleTimeString('pl-PL')}
                        </Text>
                      </View>
                      <Text style={styles.timeArrow}>➔</Text>
                      <View style={styles.timeCol}>
                        <Text style={styles.timeLabel}>CZAS SKORYGOWANY (URZĘDOWY)</Text>
                        <Text style={[styles.timeVal, { color: '#E5A93C' }]}>
                          {new Date(arr.correctedTime).toLocaleTimeString('pl-PL')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.arrivalVelRow}>
                      <Text style={styles.velText}>
                        Prędkość oficjalna:{' '}
                        <Text style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                          {arr.officialVelocity.toFixed(2)} m/min
                        </Text>{' '}
                        (wpływ odchyłki:{' '}
                        <Text style={{ color: arr.velocityImpact >= 0 ? '#4CAF50' : '#E05656' }}>
                          {arr.velocityImpact >= 0 ? `+${arr.velocityImpact}` : arr.velocityImpact} m/min
                        </Text>
                        )
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'protocol' && (
              <View>
                <Text style={styles.sectionTitle}>Oficjalny Protokół Zegarowy PZHGP (A4)</Text>
                <Text style={styles.sectionSubtitle}>
                  Gotowy do druku i podpisu arkusz Komisji Zegarowej z pełnym rozliczeniem
                </Text>

                <View style={styles.protocolPreviewCard}>
                  <View style={styles.protocolHeader}>
                    <Text style={styles.protocolTitle}>PROTOKÓŁ ROZLICZENIA ZEGARÓW</Text>
                    <Text style={styles.protocolNo}>Nr: PZ-{new Date().getFullYear()}/01</Text>
                  </View>
                  <Text style={styles.protocolMeta}>Lot: {raceName} • Oddział: {pzhgpBranch} ({pzhgpSection})</Text>
                  <Text style={styles.protocolMeta}>Zegar: {session.clockNumber} ({CLOCK_TYPES[session.clockType].name})</Text>
                  <Text style={styles.protocolMeta}>
                    Odchyłka: {driftResult.totalDriftSeconds > 0 ? `+${driftResult.totalDriftSeconds}` : driftResult.totalDriftSeconds} s / {driftResult.sessionDurationHours} h ({driftResult.hourlyDriftSeconds.toFixed(2)} s/h)
                  </Text>
                  <Text style={styles.protocolMeta}>Orzeczenie: {driftResult.statusDescription}</Text>
                </View>

                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnPrint]}
                    onPress={() => handleExportPdf('print')}
                    testID="btn-print-clock-protocol"
                  >
                    <Text style={styles.actionBtnText}>🖨️ Drukuj Protokół A4</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnShare]}
                    onPress={() => handleExportPdf('share')}
                    testID="btn-share-clock-protocol"
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
    borderColor: '#E5A93C',
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
  dividerHorizontal: {
    height: 1,
    backgroundColor: '#2C313A',
    marginVertical: 12,
  },
  metricLabel: {
    fontSize: 9,
    color: '#8A92A0',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 15,
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
  disqualificationAlert: {
    backgroundColor: '#3E1E1E',
    borderWidth: 1,
    borderColor: '#E05656',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  disqualificationTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E05656',
    marginBottom: 4,
  },
  disqualificationText: {
    fontSize: 11,
    color: '#FFCDD2',
    lineHeight: 16,
  },
  formGroup: {
    marginBottom: 10,
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
  clockTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  clockTypeBtn: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#14171C',
    borderWidth: 1,
    borderColor: '#2C313A',
    borderRadius: 8,
    padding: 10,
    minHeight: 50,
  },
  clockTypeBtnActive: {
    backgroundColor: '#2D271B',
    borderColor: '#E5A93C',
  },
  clockTypeBtnTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8A92A0',
  },
  clockTypeBtnTitleActive: {
    color: '#E5A93C',
  },
  clockTypeBtnDesc: {
    fontSize: 10,
    color: '#656D7A',
    marginTop: 2,
  },
  arrivalCard: {
    backgroundColor: '#16181D',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2C313A',
  },
  arrivalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  arrivalIndex: {
    fontSize: 11,
    color: '#8A92A0',
    fontWeight: 'bold',
  },
  arrivalRing: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  offsetBadge: {
    backgroundColor: '#252018',
    borderColor: '#E5A93C',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  offsetBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#E5A93C',
  },
  arrivalTimesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121417',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  timeCol: {
    flex: 1,
    alignItems: 'center',
  },
  timeArrow: {
    fontSize: 16,
    color: '#8A92A0',
    marginHorizontal: 8,
  },
  timeLabel: {
    fontSize: 8.5,
    color: '#8A92A0',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  timeVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  arrivalVelRow: {
    marginTop: 2,
  },
  velText: {
    fontSize: 11,
    color: '#D0D6E0',
  },
  protocolPreviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginTop: 8,
    marginBottom: 16,
  },
  protocolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 8,
    marginBottom: 8,
  },
  protocolTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  protocolNo: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#E5A93C',
    fontFamily: 'monospace',
  },
  protocolMeta: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 18,
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

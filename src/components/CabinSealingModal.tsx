/**
 * PIGEON-FLY — Plombowanie Kabiny i Weryfikacja Zoohigieniczna Modal (Z-072)
 * Standard PZHGP i FCI: Rejestr plomb zabezpieczających, kontrola dobrostanu i protokół A4.
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
  calculateSealingReadiness,
  SEAL_POSITIONS,
  SealPosition,
  SealItem,
  CabinWelfareChecklist,
  CabinSealingProtocolData,
} from '../domain/cabinSealingProtocol';
import { PdfService } from '../services/pdfService';

interface CabinSealingModalProps {
  visible: boolean;
  onClose: () => void;
  defaultRaceName?: string;
  defaultReleasePlace?: string;
}

const DEFAULT_SEALS: SealItem[] = [
  {
    id: 'seal-1',
    position: 'LEFT_SIDE_CURTAIN',
    sealCode: 'PL-0284-SEAL-01298',
    isVerifiedIntact: true,
  },
  {
    id: 'seal-2',
    position: 'RIGHT_SIDE_CURTAIN',
    sealCode: 'PL-0284-SEAL-01299',
    isVerifiedIntact: true,
  },
  {
    id: 'seal-3',
    position: 'REAR_INSPECTION_DOOR',
    sealCode: 'PL-0284-SEAL-01300',
    isVerifiedIntact: true,
  },
  {
    id: 'seal-4',
    position: 'RELEASE_MECHANISM_LOCK',
    sealCode: 'PL-0284-SEAL-01301',
    isVerifiedIntact: true,
  },
  {
    id: 'seal-5',
    position: 'WATER_TANK_VALVE',
    sealCode: 'PL-0284-SEAL-01302',
    isVerifiedIntact: true,
  },
];

export const CabinSealingModal: React.FC<CabinSealingModalProps> = ({
  visible,
  onClose,
  defaultRaceName = 'Lot nr 4: Magdeburg',
  defaultReleasePlace = 'Magdeburg (Niemcy)',
}) => {
  const [activeTab, setActiveTab] = useState<'seals' | 'welfare' | 'protocol'>('seals');

  // Protocol header state
  const [protocolNumber, setProtocolNumber] = useState(`PLOMB-${new Date().getFullYear()}/01`);
  const [pzhgpBranch, setPzhgpBranch] = useState('Oddział 0284 Gostyń');
  const [pzhgpSection, setPzhgpSection] = useState('Sekcja 01 Gostyń-Centrum');
  const [raceName, setRaceName] = useState(defaultRaceName);
  const [releasePlace, setReleasePlace] = useState(defaultReleasePlace);
  const [registrationPlate, setRegistrationPlate] = useState('PGS 44102');
  const [cabinModel, setCabinModel] = useState('Geraldy 3000 Eco-Vent');
  const [convoyLeader, setConvoyLeader] = useState('Andrzej Woźniak');
  const [driverName, setDriverName] = useState('Marek Szymański');
  const [chairmanName, setChairmanName] = useState('Tadeusz Kaczmarek');
  const [commissionMember, setCommissionMember] = useState('Piotr Nowak');

  // Seals state
  const [seals, setSeals] = useState<SealItem[]>(DEFAULT_SEALS);

  // Welfare checklist state
  const [floorOk, setFloorOk] = useState(true);
  const [wateringOk, setWateringOk] = useState(true);
  const [freshWaterLiters, setFreshWaterLiters] = useState('180');
  const [fansOk, setFansOk] = useState(true);
  const [sensorsOk, setSensorsOk] = useState(true);
  const [densityOk, setDensityOk] = useState(true);
  const [totalBaskets, setTotalBaskets] = useState('96');
  const [totalPigeons, setTotalPigeons] = useState('2400');

  const welfare: CabinWelfareChecklist = {
    floorGratesAndBeddingOk: floorOk,
    wateringSystemFunctioning: wateringOk,
    freshWaterLoadedLiters: parseInt(freshWaterLiters, 10) || 0,
    ventilationFansOperational: fansOk,
    temperatureSensorsOperational: sensorsOk,
    densityNormsCompliant: densityOk,
    totalBasketsCount: parseInt(totalBaskets, 10) || 1,
    totalPigeonsCount: parseInt(totalPigeons, 10) || 0,
    avgPigeonsPerBasket: Math.round(
      (parseInt(totalPigeons, 10) || 0) / (parseInt(totalBaskets, 10) || 1)
    ),
  };

  const protocolData: CabinSealingProtocolData = {
    protocolNumber,
    issueDate: new Date().toISOString().slice(0, 10),
    departureTimeIso: new Date().toISOString(),
    pzhgpBranch,
    pzhgpSection,
    raceName,
    releasePlace,
    vehicleRegistrationPlate: registrationPlate,
    cabinModel,
    convoyLeaderName: convoyLeader,
    convoyLeaderPhone: '+48 601 234 567',
    driverName,
    commissionChairmanName: chairmanName,
    commissionMemberName: commissionMember,
    seals,
    welfare,
    routeNotes: 'Trasa ekspresowa z postojem na pojenie o 02:00.',
  };

  const readiness = calculateSealingReadiness(protocolData);

  const handleUpdateSealCode = (id: string, code: string) => {
    setSeals((prev) =>
      prev.map((s) => (s.id === id ? { ...s, sealCode: code.toUpperCase() } : s))
    );
  };

  const handleToggleSealIntact = (id: string) => {
    setSeals((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isVerifiedIntact: !s.isVerifiedIntact } : s))
    );
  };

  const handleExportPdf = async (mode: 'print' | 'share') => {
    try {
      await PdfService.exportCabinSealingProtocol(protocolData, mode);
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
              <Text style={styles.title}>🚛 Plombowanie Kabiny i Klatek PZHGP (Z-072)</Text>
              <Text style={styles.subTitle}>
                Rejestr plomb, audyt zoohigieniczny poideł i protokół Komisji Koszowej
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="btn-close-cabin-sealing-modal">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Metrics Banner */}
          <View style={styles.metricsBanner}>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>STATUS WYJAZDU</Text>
              <Text
                style={[
                  styles.metricVal,
                  { color: readiness.isReadyForDeparture ? '#4CAF50' : '#E05656', fontSize: 13 },
                ]}
              >
                {readiness.isReadyForDeparture ? 'ZATWIERDZONY' : 'ZASTRZEŻENIA'}
              </Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>PLOMBY</Text>
              <Text style={[styles.metricVal, { color: readiness.missingSealsCount === 0 ? '#4CAF50' : '#E05656' }]}>
                {readiness.totalSealsCount - readiness.missingSealsCount}/{readiness.totalSealsCount}
              </Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>WODA PITNA</Text>
              <Text style={[styles.metricVal, { color: welfare.freshWaterLoadedLiters >= 100 ? '#4CAF50' : '#E05656' }]}>
                {welfare.freshWaterLoadedLiters} l
              </Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>W KOSZU (ŚRED.)</Text>
              <Text style={styles.metricVal}>{welfare.avgPigeonsPerBasket} szt.</Text>
            </View>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'seals' && styles.tabButtonActive]}
              onPress={() => setActiveTab('seals')}
              testID="tab-cabin-seals"
            >
              <Text style={[styles.tabButtonText, activeTab === 'seals' && styles.tabButtonTextActive]}>
                🔒 Plomby ({seals.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'welfare' && styles.tabButtonActive]}
              onPress={() => setActiveTab('welfare')}
              testID="tab-cabin-welfare"
            >
              <Text style={[styles.tabButtonText, activeTab === 'welfare' && styles.tabButtonTextActive]}>
                🩺 Zoohigiena & Poidła
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'protocol' && styles.tabButtonActive]}
              onPress={() => setActiveTab('protocol')}
              testID="tab-cabin-protocol"
            >
              <Text style={[styles.tabButtonText, activeTab === 'protocol' && styles.tabButtonTextActive]}>
                🖨️ Protokół A4
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content Body */}
          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }}>
            {activeTab === 'seals' && (
              <View>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Rejestr Plomb Zabezpieczających Kabinę</Text>
                  <Text style={styles.sectionSubtitle}>
                    Unikalne numery plomb na burtach, drzwiach rewizyjnych i mechanizmie spustowym
                  </Text>
                </View>

                {readiness.checklistIssues.length > 0 && (
                  <View style={styles.issuesCard}>
                    <Text style={styles.issuesTitle}>⚠️ Wymogi Formalne Przed Wyjazdem:</Text>
                    {readiness.checklistIssues.map((issue, idx) => (
                      <Text key={idx} style={styles.issueText}>
                        • {issue}
                      </Text>
                    ))}
                  </View>
                )}

                {seals.map((seal, idx) => {
                  const meta = SEAL_POSITIONS[seal.position] || SEAL_POSITIONS.LEFT_SIDE_CURTAIN;
                  return (
                    <View key={seal.id} style={styles.sealCard}>
                      <View style={styles.sealHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.sealIcon}>{meta.icon}</Text>
                          <Text style={styles.sealLabel}>{meta.label}</Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.intactToggleBtn,
                            seal.isVerifiedIntact ? styles.intactBtnActive : styles.intactBtnInactive,
                          ]}
                          onPress={() => handleToggleSealIntact(seal.id)}
                          testID={`btn-toggle-seal-${idx}`}
                        >
                          <Text
                            style={[
                              styles.intactBtnText,
                              { color: seal.isVerifiedIntact ? '#4CAF50' : '#E05656' },
                            ]}
                          >
                            {seal.isVerifiedIntact ? '✓ NIENARUSZONA' : '✗ USZKODZONA'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.label}>Numer / Kod Plomby *</Text>
                        <TextInput
                          style={styles.input}
                          value={seal.sealCode}
                          onChangeText={(txt) => handleUpdateSealCode(seal.id, txt)}
                          placeholder="np. PL-0284-SEAL-01298"
                          placeholderTextColor="#777"
                          autoCapitalize="characters"
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {activeTab === 'welfare' && (
              <View>
                <Text style={styles.sectionTitle}>Kontrola Zoohigieny i Dobrostanu Kabiny</Text>
                <Text style={styles.sectionSubtitle}>
                  Przegląd techniczny instalacji pojenia, wentylacji i zagęszczenia stada
                </Text>

                <View style={styles.checkCard}>
                  <TouchableOpacity
                    style={styles.checkRow}
                    onPress={() => setFloorOk(!floorOk)}
                  >
                    <Text style={styles.checkIcon}>{floorOk ? '☑️' : '◻️'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkTitle}>Czystość podłóg i rusztów w klatkach</Text>
                      <Text style={styles.checkDesc}>Świeża odpylona ściółka / tektura, brak ostrych krawędzi</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.dividerSmall} />

                  <TouchableOpacity
                    style={styles.checkRow}
                    onPress={() => setWateringOk(!wateringOk)}
                  >
                    <Text style={styles.checkIcon}>{wateringOk ? '☑️' : '◻️'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkTitle}>Sprawność systemu pojenia i rynien</Text>
                      <Text style={styles.checkDesc}>Równomierny dostęp do wody we wszystkich sekcjach klatek</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.dividerSmall} />

                  <TouchableOpacity
                    style={styles.checkRow}
                    onPress={() => setFansOk(!fansOk)}
                  >
                    <Text style={styles.checkIcon}>{fansOk ? '☑️' : '◻️'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkTitle}>Wymuszona wentylacja mechaniczna</Text>
                      <Text style={styles.checkDesc}>Wszystkie wentylatory nawiewno-wywiewne w pełni sprawne</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.dividerSmall} />

                  <TouchableOpacity
                    style={styles.checkRow}
                    onPress={() => setDensityOk(!densityOk)}
                  >
                    <Text style={styles.checkIcon}>{densityOk ? '☑️' : '◻️'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkTitle}>Zgodność z normą zagęszczenia FCI</Text>
                      <Text style={styles.checkDesc}>Zachowana minimalna powierzchnia 350-520 cm² na ptaka</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.rowTwoCols}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Zapas Czystej Wody (litry) *</Text>
                    <TextInput
                      style={styles.input}
                      value={freshWaterLiters}
                      onChangeText={setFreshWaterLiters}
                      keyboardType="numeric"
                      placeholder="180"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Liczba Klatek (Koszów)</Text>
                    <TextInput
                      style={styles.input}
                      value={totalBaskets}
                      onChangeText={setTotalBaskets}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Łączna Liczba Załadowanych Ptaków</Text>
                  <TextInput
                    style={styles.input}
                    value={totalPigeons}
                    onChangeText={setTotalPigeons}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            )}

            {activeTab === 'protocol' && (
              <View>
                <Text style={styles.sectionTitle}>Urzędowy Protokół Plombowania PZHGP (A4)</Text>
                <Text style={styles.sectionSubtitle}>
                  Gotowy do podpisu dokument dla Komisji Koszowej, Konwojenta i Kierowcy
                </Text>

                <View style={styles.protocolPreviewCard}>
                  <View style={styles.protocolHeader}>
                    <Text style={styles.protocolTitle}>PROTOKÓŁ PLOMBOWANIA KABINY</Text>
                    <Text style={styles.protocolNo}>{protocolNumber}</Text>
                  </View>
                  <Text style={styles.protocolMeta}>Lot: {raceName} ➔ {releasePlace}</Text>
                  <Text style={styles.protocolMeta}>Pojazd: {registrationPlate} ({cabinModel})</Text>
                  <Text style={styles.protocolMeta}>Konwój: {convoyLeader} • Kierowca: {driverName}</Text>
                  <Text style={styles.protocolMeta}>Komisja: {chairmanName} (Przew.) • {commissionMember}</Text>
                  <Text style={styles.protocolMeta}>Stan: {welfare.totalPigeonsCount} ptaków w {welfare.totalBasketsCount} koszach • Zapas wody: {welfare.freshWaterLoadedLiters} l</Text>
                  <Text style={styles.protocolMeta}>Plomby zweryfikowane: {seals.length} szt. (100% nienaruszone)</Text>
                </View>

                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnPrint]}
                    onPress={() => handleExportPdf('print')}
                    testID="btn-print-cabin-sealing-protocol"
                  >
                    <Text style={styles.actionBtnText}>🖨️ Drukuj Protokół A4</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnShare]}
                    onPress={() => handleExportPdf('share')}
                    testID="btn-share-cabin-sealing-protocol"
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
    color: '#6BA4F8',
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
    borderBottomColor: '#2B579A',
    backgroundColor: '#21252D',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A92A0',
  },
  tabButtonTextActive: {
    color: '#6BA4F8',
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
  issuesCard: {
    backgroundColor: '#382218',
    borderWidth: 1,
    borderColor: '#E5A93C',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  issuesTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#E5A93C',
    marginBottom: 4,
  },
  issueText: {
    fontSize: 11,
    color: '#FFE0B2',
    marginTop: 2,
  },
  sealCard: {
    backgroundColor: '#16181D',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2C313A',
  },
  sealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sealIcon: {
    fontSize: 14,
  },
  sealLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  intactToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  intactBtnActive: {
    backgroundColor: '#1E3824',
    borderColor: '#4CAF50',
  },
  intactBtnInactive: {
    backgroundColor: '#381E1E',
    borderColor: '#E05656',
  },
  intactBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
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
  checkCard: {
    backgroundColor: '#16181D',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2C313A',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    minHeight: 48,
  },
  checkIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  checkTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  checkDesc: {
    fontSize: 10.5,
    color: '#8A92A0',
    marginTop: 1,
  },
  dividerSmall: {
    height: 1,
    backgroundColor: '#242831',
    marginVertical: 4,
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
    color: '#2B579A',
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

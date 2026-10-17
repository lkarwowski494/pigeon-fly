/**
 * PIGEON-FLY — Official PZHGP Membership & Ring Allocation Modal (Z-086 / DEC-100)
 * Field Mode ergonomic interface (>= 48-56pt touch targets), dark theme (#121417).
 * Generates official PZHGP Membership Certificate for PIW, exhibitions, and transit.
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
  PzhgpMembershipCertificateData,
  CertificatePurpose,
  RingSeriesEntry,
  validatePzhgpMembershipCertificate,
  generatePzhgpMembershipCertificateHtml,
  PURPOSE_LABELS,
} from '../domain/pzhgpMembershipCertificate';
import { PdfService } from '../services/pdfService';
import { FieldButton } from './FieldButton';

interface PzhgpMembershipCertificateModalProps {
  visible: boolean;
  onClose: () => void;
  defaultBreederName?: string;
  defaultBreederPzhgpNumber?: string;
  defaultBranchName?: string;
  defaultSectionName?: string;
}

export const PzhgpMembershipCertificateModal: React.FC<PzhgpMembershipCertificateModalProps> = ({
  visible,
  onClose,
  defaultBreederName = 'Łukasz Nowak',
  defaultBreederPzhgpNumber = 'PL-0284-1420',
  defaultBranchName = '0284 Nowy Tomyśl',
  defaultSectionName = 'Sekcja 01 Zbąszyń',
}) => {
  // Meta state
  const [certificateNumber, setCertificateNumber] = useState('ZAS/0284/2026/089');
  const [issueDate, setIssueDate] = useState('2026-03-15');
  const [seasonYear] = useState(2026);
  const [purpose, setPurpose] = useState<CertificatePurpose>('veterinary_inspection');

  // Breeder info
  const [breederName, setBreederName] = useState(defaultBreederName);
  const [breederPzhgpNumber, setBreederPzhgpNumber] = useState(defaultBreederPzhgpNumber);
  const [loftAddress, setLoftAddress] = useState('ul. Polna 8, 64-360 Zbąszyń');
  const [loftLatitude, setLoftLatitude] = useState(52.25142);
  const [loftLongitude, setLoftLongitude] = useState(15.91845);
  const [membershipSinceYear, setMembershipSinceYear] = useState(2012);

  // Legal & Sanitary
  const [isMembershipFeePaid, setIsMembershipFeePaid] = useState(true);
  const [hasDisciplinarySanctions, setHasDisciplinarySanctions] = useState(false);
  const [pmvVaccinationCertified, setPmvVaccinationCertified] = useState(true);
  const [sanitaryVetApprovalNumber, setSanitaryVetApprovalNumber] = useState('WET-POZ-2026/092');
  const [identityCardsIssued, setIdentityCardsIssued] = useState(true);

  // Allocated Rings
  const [allocatedRings, setAllocatedRings] = useState<RingSeriesEntry[]>([
    {
      id: 'rng-1',
      seriesRange: 'PL-0284-26-1001 — PL-0284-26-1050',
      ringsCount: 50,
      color: 'Czerwony (FCI 2026)',
      issueDate: '2026-01-10',
      paid: true,
    },
    {
      id: 'rng-2',
      seriesRange: 'PL-0284-26-1051 — PL-0284-26-1080',
      ringsCount: 30,
      color: 'Czerwony (FCI 2026)',
      issueDate: '2026-02-05',
      paid: true,
    },
  ]);

  // Signatures
  const [branchPresident, setBranchPresident] = useState('Mirosław Kaczmarek');
  const [branchSecretary, setBranchSecretary] = useState('Tomasz Adamczak');
  const [officialNotes, setOfficialNotes] = useState('Hodowca złożył komplet dokumentów stada.');

  // Active view tab: 'purpose' | 'rings' | 'signatures'
  const [activeTab, setActiveTab] = useState<'purpose' | 'rings' | 'signatures'>('purpose');

  const certificateData: PzhgpMembershipCertificateData = useMemo(
    () => ({
      certificateNumber,
      issueDate,
      seasonYear,
      purpose,
      breederName,
      breederPzhgpNumber,
      districtName: 'Okręg Poznań',
      branchName: defaultBranchName,
      sectionName: defaultSectionName,
      loftAddress,
      loftLatitude,
      loftLongitude,
      membershipSinceYear,
      isMembershipFeePaid,
      hasDisciplinarySanctions,
      pmvVaccinationCertified,
      sanitaryVetApprovalNumber,
      allocatedRings,
      identityCardsIssued,
      branchPresident,
      branchSecretary,
      officialNotes,
    }),
    [
      certificateNumber,
      issueDate,
      seasonYear,
      purpose,
      breederName,
      breederPzhgpNumber,
      defaultBranchName,
      defaultSectionName,
      loftAddress,
      loftLatitude,
      loftLongitude,
      membershipSinceYear,
      isMembershipFeePaid,
      hasDisciplinarySanctions,
      pmvVaccinationCertified,
      sanitaryVetApprovalNumber,
      allocatedRings,
      identityCardsIssued,
      branchPresident,
      branchSecretary,
      officialNotes,
    ]
  );

  const validation = useMemo(() => {
    return validatePzhgpMembershipCertificate(certificateData);
  }, [certificateData]);

  const handleAddRingSeries = () => {
    const nextIdx = allocatedRings.length + 1;
    const startNum = 1000 + nextIdx * 50;
    const endNum = startNum + 20;
    const newSeries: RingSeriesEntry = {
      id: `rng-${Date.now()}`,
      seriesRange: `PL-0284-26-${startNum} — PL-0284-26-${endNum}`,
      ringsCount: 20,
      color: 'Czerwony (FCI 2026)',
      issueDate: issueDate,
      paid: true,
    };
    setAllocatedRings([...allocatedRings, newSeries]);
  };

  const handleRemoveRingSeries = (id: string) => {
    if (allocatedRings.length <= 1) {
      Alert.alert('Błąd', 'Zaświadczenie musi zawierać co najmniej jedną serię obrączek.');
      return;
    }
    setAllocatedRings(allocatedRings.filter((r) => r.id !== id));
  };

  const handlePrint = async () => {
    try {
      const html = generatePzhgpMembershipCertificateHtml(certificateData);
      await PdfService.printHtml(html);
    } catch {
      Alert.alert('Błąd wydruku', 'Nie udało się zainicjować wydruku zaświadczenia PZHGP.');
    }
  };

  const handleShare = async () => {
    try {
      const html = generatePzhgpMembershipCertificateHtml(certificateData);
      await PdfService.shareHtmlAsPdf(
        html,
        `Zaswiadczenie_PZHGP_${breederName.replace(/\s+/g, '_')}_${seasonYear}.pdf`
      );
    } catch {
      Alert.alert('Błąd eksportu', 'Nie udało się wyeksportować zaświadczenia do PDF.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>📜 Zaświadczenie i Obrączki PZHGP</Text>
            <Text style={styles.headerSubtitle}>
              Certyfikat Przynależności Związkowej (Z-086 / DEC-100)
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Zamknij zaświadczenie"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Status Banner */}
          <View
            style={[
              styles.statusBanner,
              { borderColor: validation.isValid ? '#10B981' : '#EF4444' },
            ]}
          >
            <View style={styles.statusLeft}>
              <Text
                style={[
                  styles.statusText,
                  { color: validation.isValid ? '#10B981' : '#EF4444' },
                ]}
              >
                {validation.isValid
                  ? '✅ ZAŚWIADCZENIE WAŻNE — PEŁNE PRAWA'
                  : '⚠️ BRAKI FORMALNE / BLOKADA'}
              </Text>
              <Text style={styles.statusSub}>
                {validation.isValid
                  ? `Zarejestrowano ${validation.totalRingsAllocated} obrączek rodowych PZHGP/FCI dla sezonu ${seasonYear}.`
                  : validation.errors[0]}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeVal}>{validation.totalRingsAllocated}</Text>
              <Text style={styles.statusBadgeDesc}>Obrączek</Text>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'purpose' && styles.tabBtnActive]}
              onPress={() => setActiveTab('purpose')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'purpose' && styles.tabBtnTextActive,
                ]}
              >
                🎯 Cel i Status
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'rings' && styles.tabBtnActive]}
              onPress={() => setActiveTab('rings')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'rings' && styles.tabBtnTextActive,
                ]}
              >
                💍 Obrączki ({allocatedRings.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'signatures' && styles.tabBtnActive]}
              onPress={() => setActiveTab('signatures')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'signatures' && styles.tabBtnTextActive,
                ]}
              >
                ✍️ Zarząd Oddziału
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab 1: Purpose & Breeder Details */}
          {activeTab === 'purpose' && (
            <View style={styles.tabSection}>
              <Text style={styles.sectionTitle}>CEL WYDANIA ZAŚWIADCZENIA</Text>
              <View style={styles.purposeGrid}>
                {(
                  [
                    'veterinary_inspection',
                    'national_exhibition',
                    'border_crossing_transit',
                    'general_membership',
                  ] as CertificatePurpose[]
                ).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.purposeButton,
                      purpose === p && styles.purposeButtonActive,
                    ]}
                    onPress={() => setPurpose(p)}
                  >
                    <Text
                      style={[
                        styles.purposeButtonText,
                        purpose === p && styles.purposeButtonTextActive,
                      ]}
                    >
                      {p === 'veterinary_inspection' && '🏛️ PIW (Weterynaria)'}
                      {p === 'national_exhibition' && '🏆 Wystawa PZHGP'}
                      {p === 'border_crossing_transit' && '🚛 Transport UE'}
                      {p === 'general_membership' && '📜 Ogólne Związkowe'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.card}>
                <Text style={styles.cardHeaderTitle}>WARUNKI STATUTOWE I SANITARNE</Text>

                {/* Membership Fee */}
                <View style={styles.toggleRowItem}>
                  <Text style={styles.toggleLabel}>Roczna Składka Członkowska PZHGP:</Text>
                  <TouchableOpacity
                    style={[
                      styles.statusToggleBtn,
                      isMembershipFeePaid ? styles.btnGreen : styles.btnRed,
                    ]}
                    onPress={() => setIsMembershipFeePaid(!isMembershipFeePaid)}
                  >
                    <Text style={styles.statusToggleText}>
                      {isMembershipFeePaid ? 'OPŁACONA' : 'NIEOPŁACONA'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Sanctions */}
                <View style={styles.toggleRowItem}>
                  <Text style={styles.toggleLabel}>Status Dyscyplinarny:</Text>
                  <TouchableOpacity
                    style={[
                      styles.statusToggleBtn,
                      !hasDisciplinarySanctions ? styles.btnGreen : styles.btnRed,
                    ]}
                    onPress={() => setHasDisciplinarySanctions(!hasDisciplinarySanctions)}
                  >
                    <Text style={styles.statusToggleText}>
                      {!hasDisciplinarySanctions ? 'CZYSTE KONTO' : 'KARA ZAWIESZENIA'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* PMV-1 */}
                <View style={styles.toggleRowItem}>
                  <Text style={styles.toggleLabel}>Szczepienie PMV-1 (Pomór Drobiu):</Text>
                  <TouchableOpacity
                    style={[
                      styles.statusToggleBtn,
                      pmvVaccinationCertified ? styles.btnGreen : styles.btnRed,
                    ]}
                    onPress={() => setPmvVaccinationCertified(!pmvVaccinationCertified)}
                  >
                    <Text style={styles.statusToggleText}>
                      {pmvVaccinationCertified ? 'POTWIERDZONE' : 'BRAK ATESTU'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Identity Cards */}
                <View style={[styles.toggleRowItem, { borderBottomWidth: 0 }]}>
                  <Text style={styles.toggleLabel}>Karty Tożsamości Obrączek:</Text>
                  <TouchableOpacity
                    style={[
                      styles.statusToggleBtn,
                      identityCardsIssued ? styles.btnBlue : styles.btnAmber,
                    ]}
                    onPress={() => setIdentityCardsIssued(!identityCardsIssued)}
                  >
                    <Text style={styles.statusToggleText}>
                      {identityCardsIssued ? 'WYDANE HODOWCY' : 'W DEPOZYCIE'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Breeder info card */}
              <View style={styles.card}>
                <Text style={styles.cardHeaderTitle}>DANE HODOWCY I GOŁĘBNIKA</Text>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Hodowca:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={breederName}
                    onChangeText={setBreederName}
                    placeholder="Imię i nazwisko"
                    placeholderTextColor="#64748B"
                  />
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Nr Ewidencyjny PZHGP:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={breederPzhgpNumber}
                    onChangeText={setBreederPzhgpNumber}
                    placeholder="np. PL-0284-1420"
                    placeholderTextColor="#64748B"
                  />
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Adres Gołębnika:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={loftAddress}
                    onChangeText={setLoftAddress}
                    placeholder="Adres gołębnika..."
                    placeholderTextColor="#64748B"
                  />
                </View>
                <View style={[styles.cardRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.cardLabel}>Współrzędne GPS:</Text>
                  <Text style={styles.coordsText}>
                    {loftLatitude.toFixed(5)}°N, {loftLongitude.toFixed(5)}°E
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Tab 2: Ring Series */}
          {activeTab === 'rings' && (
            <View style={styles.tabSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>EWIDENCJA OBRĄCZEK RODOWYCH PZHGP</Text>
                <TouchableOpacity style={styles.addBtn} onPress={handleAddRingSeries}>
                  <Text style={styles.addBtnText}>+ Dodaj Serię</Text>
                </TouchableOpacity>
              </View>

              {allocatedRings.map((r, idx) => (
                <View key={r.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardHeaderTitle}>
                      Seria #{idx + 1} — {r.ringsCount} sztuk
                    </Text>
                    {allocatedRings.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => handleRemoveRingSeries(r.id)}
                      >
                        <Text style={styles.removeBtnText}>Usuń</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Zakres Numeracji:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={r.seriesRange}
                      onChangeText={(val) => {
                        setAllocatedRings((prev) =>
                          prev.map((item) =>
                            item.id === r.id ? { ...item, seriesRange: val } : item
                          )
                        );
                      }}
                      placeholder="Zakres obrączek..."
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Standard / Kolor:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={r.color}
                      onChangeText={(val) => {
                        setAllocatedRings((prev) =>
                          prev.map((item) =>
                            item.id === r.id ? { ...item, color: val } : item
                          )
                        );
                      }}
                      placeholder="Kolor obrączki..."
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  <View style={[styles.cardRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.cardLabel}>Status Opłaty za Obrączki:</Text>
                    <TouchableOpacity
                      style={[
                        styles.statusToggleBtn,
                        r.paid ? styles.btnGreen : styles.btnRed,
                      ]}
                      onPress={() => {
                        setAllocatedRings((prev) =>
                          prev.map((item) =>
                            item.id === r.id ? { ...item, paid: !item.paid } : item
                          )
                        );
                      }}
                    >
                      <Text style={styles.statusToggleText}>
                        {r.paid ? 'OPŁACONA' : 'NIEOPŁACONA'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Tab 3: Signatures & Board */}
          {activeTab === 'signatures' && (
            <View style={styles.tabSection}>
              <View style={styles.card}>
                <Text style={styles.cardHeaderTitle}>ZARZĄD ODDZIAŁU PZHGP</Text>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Prezes Zarządu Oddziału:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={branchPresident}
                    onChangeText={setBranchPresident}
                    placeholder="Imię i nazwisko Prezesa"
                    placeholderTextColor="#64748B"
                  />
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Sekretarz Oddziału:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={branchSecretary}
                    onChangeText={setBranchSecretary}
                    placeholder="Imię i nazwisko Sekretarza"
                    placeholderTextColor="#64748B"
                  />
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Nr Rejestru PIW:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={sanitaryVetApprovalNumber}
                    onChangeText={setSanitaryVetApprovalNumber}
                    placeholder="Nr zaświadczenia PIW..."
                    placeholderTextColor="#64748B"
                  />
                </View>
                <View style={[styles.cardRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.cardLabel}>Uwagi Zarządu:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={officialNotes}
                    onChangeText={setOfficialNotes}
                    placeholder="Dodatkowe adnotacje..."
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <FieldButton
              title="Drukuj Zaświadczenie A4"
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
  statusBanner: {
    backgroundColor: '#1A1D23',
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLeft: {
    flex: 1,
    marginRight: 10,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '800',
  },
  statusSub: {
    fontSize: 11,
    color: '#8A92A0',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#22262E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusBadgeVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#E0A82E',
  },
  statusBadgeDesc: {
    fontSize: 10,
    color: '#8A92A0',
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
    backgroundColor: '#E0A82E25',
    borderColor: '#E0A82E',
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A92A0',
  },
  tabBtnTextActive: {
    color: '#E0A82E',
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
  purposeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  purposeButton: {
    flex: 1,
    minWidth: '45%',
    height: 48,
    backgroundColor: '#1E2229',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2D333D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  purposeButtonActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#0284C725',
  },
  purposeButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A92A0',
  },
  purposeButtonTextActive: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#262A30',
    paddingBottom: 8,
    marginBottom: 8,
  },
  cardHeaderTitle: {
    fontSize: 13,
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
  coordsText: {
    fontSize: 12,
    color: '#38BDF8',
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
    paddingHorizontal: 14,
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
  btnBlue: {
    backgroundColor: '#0284C725',
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  btnAmber: {
    backgroundColor: '#F59E0B25',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addBtn: {
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: '#E0A82E',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#121417',
  },
  removeBtn: {
    height: 48,
    paddingHorizontal: 10,
    backgroundColor: '#EF444420',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
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

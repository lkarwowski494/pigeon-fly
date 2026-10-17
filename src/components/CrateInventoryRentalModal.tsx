/**
 * PIGEON-FLY — E-Rejestr Wypożyczeń Koszy i Księga Inwentarza Klatek Modal (Z-094 / DEC-108)
 * Field Mode ergonomic interface (>= 48-56pt touch targets), dark theme (#121417).
 * Manages section crate depot, rentals to breeders for training/races,
 * deposit tracking, overdue returns, and return biosecurity disinfection verification.
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
  CrateInventoryItem,
  CrateRentalEntry,
  CrateType,
  RentalPurpose,
  CRATE_TYPE_LABELS,
  RENTAL_PURPOSE_LABELS,
  isRentalOverdue,
  calculateDepotStats,
  validateCrateRental,
  generateCrateRentalProtocolHtml,
} from '../domain/crateInventoryRentalRegistry';
import { PdfService } from '../services/pdfService';
import { FieldButton } from './FieldButton';

interface CrateInventoryRentalModalProps {
  visible: boolean;
  onClose: () => void;
  defaultBranchName?: string;
  defaultSectionName?: string;
  onSaveRental?: (rental: CrateRentalEntry) => void;
}

const INITIAL_CRATES: CrateInventoryItem[] = [
  {
    crateId: 'KOSZ-042',
    inventoryNumber: 'INW/2026/42',
    type: 'aluminum_standard',
    capacityPigeons: 20,
    status: 'in_storage',
    condition: 'excellent',
    lastDisinfectionDate: '2026-05-01',
  },
  {
    crateId: 'KOSZ-043',
    inventoryNumber: 'INW/2026/43',
    type: 'aluminum_heavy',
    capacityPigeons: 30,
    status: 'rented',
    condition: 'good',
    lastDisinfectionDate: '2026-04-20',
    currentHolderBreederName: 'Tomasz Nowak',
  },
  {
    crateId: 'KOSZ-044',
    inventoryNumber: 'INW/2026/44',
    type: 'wood_traditional',
    capacityPigeons: 25,
    status: 'in_storage',
    condition: 'fair',
    lastDisinfectionDate: '2026-05-02',
  },
  {
    crateId: 'KOSZ-045',
    inventoryNumber: 'INW/2026/45',
    type: 'training_small',
    capacityPigeons: 12,
    status: 'quarantine_disinfection',
    condition: 'good',
    lastDisinfectionDate: '2026-05-10',
  },
  {
    crateId: 'KOSZ-046',
    inventoryNumber: 'INW/2026/46',
    type: 'aluminum_standard',
    capacityPigeons: 20,
    status: 'rented',
    condition: 'excellent',
    lastDisinfectionDate: '2026-05-03',
    currentHolderBreederName: 'Marek Wiśniewski',
  },
];

const INITIAL_RENTALS: CrateRentalEntry[] = [
  {
    rentalId: 'WYP-2026/088',
    crateId: 'KOSZ-043',
    breederName: 'Tomasz Nowak',
    breederPzhgpNumber: 'PL-0284-1102',
    checkoutDate: '2026-05-05',
    expectedReturnDate: '2026-05-10',
    depositPaidPln: 100,
    depositReturned: false,
    purpose: 'private_training',
    conditionAtCheckout: 'Czysty, zamki sprawne, brak uszkodzeń',
    disinfectionConfirmedOnReturn: false,
    officerName: 'Piotr Kaczmarek',
    notes: 'Wypożyczenie na prywatny trening przed lotem Bruksela.',
  },
  {
    rentalId: 'WYP-2026/089',
    crateId: 'KOSZ-046',
    breederName: 'Marek Wiśniewski',
    breederPzhgpNumber: 'PL-0284-2201',
    checkoutDate: '2026-05-12',
    expectedReturnDate: '2026-05-18',
    depositPaidPln: 100,
    depositReturned: false,
    purpose: 'race_transport',
    conditionAtCheckout: 'Stan fabryczny, ruszt aluminiowy',
    disinfectionConfirmedOnReturn: false,
    officerName: 'Piotr Kaczmarek',
    notes: 'Dowóz gołębi na punkt wkładania.',
  },
];

export const CrateInventoryRentalModal: React.FC<CrateInventoryRentalModalProps> = ({
  visible,
  onClose,
  defaultBranchName = 'Oddział 0284 Poznań Zachód',
  defaultSectionName = 'Sekcja 1 Wilda',
  onSaveRental,
}) => {
  const [crates, setCrates] = useState<CrateInventoryItem[]>(INITIAL_CRATES);
  const [rentals, setRentals] = useState<CrateRentalEntry[]>(INITIAL_RENTALS);

  // New rental form state
  const [selectedCrateId, setSelectedCrateId] = useState('KOSZ-042');
  const [rentalId, setRentalId] = useState('WYP-2026/090');
  const [breederName, setBreederName] = useState('Andrzej Kowalski');
  const [breederPzhgpNumber, setBreederPzhgpNumber] = useState('PL-0284-3305');
  const [checkoutDate, setCheckoutDate] = useState('2026-05-15');
  const [expectedReturnDate, setExpectedReturnDate] = useState('2026-05-19');
  const [depositPaidPln, setDepositPaidPln] = useState('100');
  const [purpose, setPurpose] = useState<RentalPurpose>('private_training');
  const [conditionAtCheckout, setConditionAtCheckout] = useState('Czysty, zdezynfekowany, zamki sprawne');
  const [officerName, setOfficerName] = useState('Piotr Kaczmarek');
  const [notes, setNotes] = useState('Trening prywatny 50 km.');

  // Active view tab: 'inventory' | 'new_rental' | 'active_rentals'
  const [activeTab, setActiveTab] = useState<'inventory' | 'new_rental' | 'active_rentals'>('inventory');

  const stats = useMemo(
    () => calculateDepotStats(crates, rentals),
    [crates, rentals]
  );

  const selectedCrate = useMemo(
    () => crates.find((c) => c.crateId === selectedCrateId) || crates[0],
    [crates, selectedCrateId]
  );

  const handleCreateRental = () => {
    const newEntry: CrateRentalEntry = {
      rentalId,
      crateId: selectedCrateId,
      breederName,
      breederPzhgpNumber,
      checkoutDate,
      expectedReturnDate,
      depositPaidPln: parseFloat(depositPaidPln) || 0,
      depositReturned: false,
      purpose,
      conditionAtCheckout,
      disinfectionConfirmedOnReturn: false,
      officerName,
      notes,
    };

    const val = validateCrateRental(newEntry);
    if (!val.isValid) {
      Alert.alert('Błędy wypożyczenia', val.errors.join('\n'));
      return;
    }

    // Update crate status to rented
    setCrates((prev) =>
      prev.map((c) =>
        c.crateId === selectedCrateId
          ? { ...c, status: 'rented', currentHolderBreederName: breederName }
          : c
      )
    );

    setRentals([newEntry, ...rentals]);
    if (onSaveRental) {
      onSaveRental(newEntry);
    }

    Alert.alert(
      'Wydano Kosz Transportowy',
      `Zarejestrowano wypożyczenie kosza ${selectedCrateId} dla ${breederName}.\nKaucja: ${newEntry.depositPaidPln} PLN. Termin zwrotu: ${expectedReturnDate}.`
    );

    setActiveTab('active_rentals');
  };

  const handleReturnCrate = (entry: CrateRentalEntry) => {
    Alert.alert(
      'Zwrot Kosza do Magazynu',
      `Czy potwierdzasz przyjęcie kosza ${entry.crateId} od hodowcy ${entry.breederName}, przeprowadzenie dezynfekcji biobójczej i zwrot kaucji ${entry.depositPaidPln} PLN?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: '✓ Przyjmij i Zwróć Kaucję',
          onPress: () => {
            const today = new Date().toISOString().split('T')[0];
            setRentals((prev) =>
              prev.map((r) =>
                r.rentalId === entry.rentalId
                  ? {
                      ...r,
                      actualReturnDate: today,
                      depositReturned: true,
                      disinfectionConfirmedOnReturn: true,
                      conditionAtReturn: 'Zwrócony czysty, zdezynfekowany',
                    }
                  : r
              )
            );

            setCrates((prev) =>
              prev.map((c) =>
                c.crateId === entry.crateId
                  ? {
                      ...c,
                      status: 'in_storage',
                      lastDisinfectionDate: today,
                      currentHolderBreederName: undefined,
                    }
                  : c
              )
            );

            Alert.alert(
              'Przyjęto Zwrot',
              `Kosz ${entry.crateId} powrócił na stan magazynowy Sekcji. Kaucja rozliczona.`
            );
          },
        },
      ]
    );
  };

  const handlePrintProtocol = async (rental: CrateRentalEntry) => {
    try {
      const crate = crates.find((c) => c.crateId === rental.crateId) || selectedCrate;
      const html = generateCrateRentalProtocolHtml(rental, crate, {
        branchName: defaultBranchName,
        sectionName: defaultSectionName,
      });
      await PdfService.printHtml(html);
    } catch (e: any) {
      Alert.alert('Błąd drukowania', e?.message || 'Nie udało się wydrukować protokołu.');
    }
  };

  const handleShareProtocol = async (rental: CrateRentalEntry) => {
    try {
      const crate = crates.find((c) => c.crateId === rental.crateId) || selectedCrate;
      const html = generateCrateRentalProtocolHtml(rental, crate, {
        branchName: defaultBranchName,
        sectionName: defaultSectionName,
      });
      await PdfService.shareHtmlAsPdf(
        html,
        `Protokol-Kosz-${rental.rentalId}`
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
            <Text style={styles.headerTitle}>KSIĘGA INWENTARZA & WYPOŻYCZEŃ KOSZY</Text>
            <Text style={styles.headerSubtitle}>
              Gospodarka sprzętowa Sekcji PZHGP i kaucje zwrotne (Z-094)
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            testID="btn-close-crate-modal"
          >
            <Text style={styles.closeButtonText}>✕ Zamknij</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Summary Stats Bar */}
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statVal}>{stats.totalCrates}</Text>
                <Text style={styles.statLbl}>Klatek łącznie</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={[styles.statVal, { color: '#4ade80' }]}>
                  {stats.availableInStorage}
                </Text>
                <Text style={styles.statLbl}>W magazynie</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={[styles.statVal, { color: '#38bdf8' }]}>
                  {stats.currentlyRented}
                </Text>
                <Text style={styles.statLbl}>Wypożyczone</Text>
              </View>
              <View style={styles.statCol}>
                <Text
                  style={[
                    styles.statVal,
                    { color: stats.overdueRentalsCount > 0 ? '#f87171' : '#FFFFFF' },
                  ]}
                >
                  {stats.overdueRentalsCount}
                </Text>
                <Text style={styles.statLbl}>Po terminie</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={[styles.statVal, { color: '#fbbf24' }]}>
                  {stats.totalDepositsHeldPln} zł
                </Text>
                <Text style={styles.statLbl}>W kaucjach</Text>
              </View>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'inventory' && styles.tabActive]}
              onPress={() => setActiveTab('inventory')}
              testID="tab-crate-inventory"
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'inventory' && styles.tabTextActive,
                ]}
              >
                1. Magazyn Klatek ({crates.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'new_rental' && styles.tabActive]}
              onPress={() => setActiveTab('new_rental')}
              testID="tab-crate-new-rental"
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'new_rental' && styles.tabTextActive,
                ]}
              >
                2. Wydaj Kosz
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'active_rentals' && styles.tabActive]}
              onPress={() => setActiveTab('active_rentals')}
              testID="tab-crate-active-rentals"
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'active_rentals' && styles.tabTextActive,
                ]}
              >
                3. Aktywne ({rentals.filter((r) => !r.actualReturnDate).length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: INVENTORY LIST */}
          {activeTab === 'inventory' && (
            <View>
              {crates.map((crate) => (
                <View key={crate.crateId} style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.crateTitle}>{crate.crateId}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        crate.status === 'in_storage'
                          ? styles.statusInStorage
                          : crate.status === 'rented'
                          ? styles.statusRented
                          : styles.statusMaintenance,
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {crate.status === 'in_storage'
                          ? 'W MAGAZYNIE'
                          : crate.status === 'rented'
                          ? 'WYPOŻYCZONA'
                          : 'DEZYNFEKCJA / NAPRAWA'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.crateTypeDesc}>{CRATE_TYPE_LABELS[crate.type]}</Text>

                  <View style={styles.crateMetaRow}>
                    <Text style={styles.metaItem}>
                      Pojemność: <Text style={styles.metaVal}>{crate.capacityPigeons} ptaków</Text>
                    </Text>
                    <Text style={styles.metaItem}>
                      Nr inwentarzowy: <Text style={styles.metaVal}>{crate.inventoryNumber}</Text>
                    </Text>
                  </View>

                  <View style={styles.crateMetaRow}>
                    <Text style={styles.metaItem}>
                      Ostatnia dezynfekcja: <Text style={styles.metaVal}>{crate.lastDisinfectionDate}</Text>
                    </Text>
                    {crate.currentHolderBreederName && (
                      <Text style={styles.metaItem}>
                        U hodowcy: <Text style={styles.metaValHighlight}>{crate.currentHolderBreederName}</Text>
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* TAB 2: NEW RENTAL FORM */}
          {activeTab === 'new_rental' && (
            <View>
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>FORMULARZ WYDANIA SPRZĘTU SEKCJI</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Wybierz Klatkę / Kosz z Magazynu:</Text>
                  <View style={styles.chipGrid}>
                    {crates
                      .filter((c) => c.status === 'in_storage')
                      .map((c) => (
                        <TouchableOpacity
                          key={c.crateId}
                          style={[
                            styles.chip,
                            selectedCrateId === c.crateId && styles.chipActive,
                          ]}
                          onPress={() => setSelectedCrateId(c.crateId)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              selectedCrateId === c.crateId && styles.chipTextActive,
                            ]}
                          >
                            {c.crateId} ({c.capacityPigeons} szt.)
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Nr Wypożyczenia:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={rentalId}
                      onChangeText={setRentalId}
                      placeholder="WYP-2026/090"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Kaucja Zwrotna (PLN):</Text>
                    <TextInput
                      style={[styles.textInput, styles.highlightInput]}
                      value={depositPaidPln}
                      onChangeText={setDepositPaidPln}
                      keyboardType="numeric"
                      placeholder="100"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Hodowca:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={breederName}
                      onChangeText={setBreederName}
                      placeholder="Andrzej Kowalski"
                      placeholderTextColor="#64748B"
                      testID="input-rental-breeder"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 0.8 }]}>
                    <Text style={styles.inputLabel}>Nr PZHGP:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={breederPzhgpNumber}
                      onChangeText={setBreederPzhgpNumber}
                      placeholder="PL-0284-3305"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Data Wydania:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={checkoutDate}
                      onChangeText={setCheckoutDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Planowany Zwrot:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={expectedReturnDate}
                      onChangeText={setExpectedReturnDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Cel Wypożyczenia:</Text>
                  <View style={styles.chipGrid}>
                    {(
                      [
                        'private_training',
                        'race_transport',
                        'derby_loft_exchange',
                        'medical_isolation',
                      ] as const
                    ).map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[styles.chip, purpose === p && styles.chipActive]}
                        onPress={() => setPurpose(p)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            purpose === p && styles.chipTextActive,
                          ]}
                        >
                          {RENTAL_PURPOSE_LABELS[p]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Gospodarz Sekcji Wydający:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={officerName}
                    onChangeText={setOfficerName}
                    placeholder="Piotr Kaczmarek"
                    placeholderTextColor="#64748B"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Uwagi / Stan Przy Wydaniu:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={conditionAtCheckout}
                    onChangeText={setConditionAtCheckout}
                    placeholder="Czysty, zdezynfekowany, zamki sprawne"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>

              {/* Submit Button */}
              <FieldButton
                title="📦 Zarejestruj Wydanie Kosza Transportowego"
                onPress={handleCreateRental}
                style={styles.saveButton}
                testID="btn-save-crate-rental"
              />
            </View>
          )}

          {/* TAB 3: ACTIVE RENTALS & RETURNS */}
          {activeTab === 'active_rentals' && (
            <View>
              {rentals.map((rental) => {
                const isOverdue = isRentalOverdue(rental);
                return (
                  <View key={rental.rentalId} style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.crateTitle}>
                        {rental.crateId} • {rental.breederName}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          rental.actualReturnDate
                            ? styles.statusReturned
                            : isOverdue
                            ? styles.statusOverdue
                            : styles.statusOnTime,
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>
                          {rental.actualReturnDate
                            ? 'ZWRÓCONY'
                            : isOverdue
                            ? '⚠️ PO TERMINIE'
                            : 'W TERMINIE'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.rentalSubText}>
                      Wydano: <strong>{rental.checkoutDate}</strong> • Planowany zwrot:{' '}
                      <strong style={{ color: isOverdue ? '#f87171' : '#FFFFFF' }}>
                        {rental.expectedReturnDate}
                      </strong>
                    </Text>

                    <View style={styles.rentalDepositRow}>
                      <Text style={styles.depositLabel}>
                        Kaucja w kasie: <Text style={styles.depositVal}>{rental.depositPaidPln} PLN</Text>
                      </Text>
                      <Text style={styles.depositLabel}>
                        Cel: <Text style={styles.depositVal}>{RENTAL_PURPOSE_LABELS[rental.purpose]}</Text>
                      </Text>
                    </View>

                    {/* Action buttons */}
                    <View style={styles.rentalActionsRow}>
                      {!rental.actualReturnDate && (
                        <TouchableOpacity
                          style={styles.returnButton}
                          onPress={() => handleReturnCrate(rental)}
                        >
                          <Text style={styles.returnButtonText}>✓ Przyjmij Zwrot</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={styles.printMiniButton}
                        onPress={() => handlePrintProtocol(rental)}
                        testID="btn-print-crate-protocol"
                      >
                        <Text style={styles.printMiniButtonText}>🖨️ Protokół</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.printMiniButton}
                        onPress={() => handleShareProtocol(rental)}
                        testID="btn-share-crate-protocol"
                      >
                        <Text style={styles.printMiniButtonText}>📤 PDF</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
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
    color: '#E5A93C',
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
  statsCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statLbl: {
    fontSize: 8.5,
    color: '#8E94A0',
    marginTop: 2,
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
    borderColor: '#E5A93C',
    backgroundColor: '#2B2418',
  },
  tabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E94A0',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#E5A93C',
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  crateTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusInStorage: {
    backgroundColor: '#14291e',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  statusRented: {
    backgroundColor: '#132333',
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  statusMaintenance: {
    backgroundColor: '#2e2311',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  statusReturned: {
    backgroundColor: '#14291e',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  statusOverdue: {
    backgroundColor: '#2b1316',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  statusOnTime: {
    backgroundColor: '#132333',
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  crateTypeDesc: {
    fontSize: 11,
    color: '#E5A93C',
    marginBottom: 8,
  },
  crateMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metaItem: {
    fontSize: 10,
    color: '#8E94A0',
  },
  metaVal: {
    color: '#D4D8E0',
    fontWeight: '700',
  },
  metaValHighlight: {
    color: '#38bdf8',
    fontWeight: '800',
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
    borderColor: '#E5A93C',
    color: '#FCD34D',
    fontWeight: '800',
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
    borderColor: '#E5A93C',
    backgroundColor: '#2B2418',
  },
  chipText: {
    fontSize: 10,
    color: '#D4D8E0',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#E5A93C',
    fontWeight: '800',
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 12,
    minHeight: 52,
    backgroundColor: '#B45309',
  },
  rentalSubText: {
    fontSize: 11,
    color: '#8E94A0',
    marginBottom: 8,
  },
  rentalDepositRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#14171D',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  depositLabel: {
    fontSize: 10,
    color: '#8E94A0',
  },
  depositVal: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rentalActionsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  returnButton: {
    minHeight: 48,
    paddingHorizontal: 12,
    backgroundColor: '#166534',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  returnButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  printMiniButton: {
    minHeight: 48,
    paddingHorizontal: 12,
    backgroundColor: '#2F343F',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  printMiniButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

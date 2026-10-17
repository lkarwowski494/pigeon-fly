/**
 * PIGEON-FLY — Electronic Clock & Antenna Registration Modal (Z-084 / DEC-98)
 * Field Mode ergonomic interface (>= 48-56pt touch targets), dark theme (#121417).
 * Official PZHGP ESK Protocol: clock base, terminals, antenna pads sensitivity, tamper seals.
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
  EskRegistrationData,
  EskSystemBrand,
  EskAntennaPad,
  EskTamperSeal,
  validateEskRegistration,
  generateEskRegistrationProtocolHtml,
} from '../domain/eskRegistrationProtocol';
import { PdfService } from '../services/pdfService';
import { FieldButton } from './FieldButton';

interface EskRegistrationProtocolModalProps {
  visible: boolean;
  onClose: () => void;
  defaultBreederName?: string;
  defaultBranch?: string;
  defaultSection?: string;
}

export const EskRegistrationProtocolModal: React.FC<EskRegistrationProtocolModalProps> = ({
  visible,
  onClose,
  defaultBreederName = 'Jan Kowalski',
  defaultBranch = '0284 Nowy Tomyśl',
  defaultSection = 'Sekcja 01 Zbąszyń',
}) => {
  // Protocol Meta
  const [protocolNumber, setProtocolNumber] = useState('ESK/0284/2026/014');
  const [verificationDate, setVerificationDate] = useState('2026-04-18');
  const [seasonYear] = useState(2026);

  // Breeder info
  const [breederName, setBreederName] = useState(defaultBreederName);
  const [breederPzhgpNumber, setBreederPzhgpNumber] = useState('PL-0284-1420');
  const [loftAddress, setLoftAddress] = useState('ul. Parkowa 12, 64-360 Zbąszyń');
  const [loftLatitude, setLoftLatitude] = useState(52.25142);
  const [loftLongitude, setLoftLongitude] = useState(15.91845);

  // System Brand & Hardware
  const [systemBrand, setSystemBrand] = useState<EskSystemBrand>('Tauris');
  const [baseStationSerial, setBaseStationSerial] = useState('TAU-BASE-89410');
  const [terminalSerial, setTerminalSerial] = useState('TAU-TERM-11204');
  const [softwareVersion, setSoftwareVersion] = useState('v14.02-PL');
  const [backupBatteryWorking, setBackupBatteryWorking] = useState(true);
  const [timeSyncSource, setTimeSyncSource] = useState<'GPS' | 'DCF-77' | 'Internal'>('DCF-77');

  // Antennas list
  const [antennas, setAntennas] = useState<EskAntennaPad[]>([
    {
      id: 'ant-1',
      antennaNumber: 1,
      padModel: 'Tauris 4-polowa',
      serialNumber: 'ANT-4P-99210',
      fieldCount: 4,
      entranceLocation: 'Wylot Wdowcy (Północ)',
      cableLengthMeters: 15,
      sensitivityDistanceCm: 7.5,
      sensitivityTestPassed: true,
    },
    {
      id: 'ant-2',
      antennaNumber: 2,
      padModel: 'Tauris 2-polowa',
      serialNumber: 'ANT-2P-44102',
      fieldCount: 2,
      entranceLocation: 'Wylot Samice (Wschód)',
      cableLengthMeters: 8,
      sensitivityDistanceCm: 6.0,
      sensitivityTestPassed: true,
    },
  ]);

  // Tamper seals list
  const [tamperSeals, setTamperSeals] = useState<EskTamperSeal[]>([
    {
      id: 'seal-1',
      sealNumber: 'PL-PZHGP-2026-8812',
      sealLocation: 'Złącze magistrali stacji matki',
      installedDate: '2026-04-18',
    },
  ]);

  // Commission members
  const [commissionMember1, setCommissionMember1] = useState('Marek Nowak');
  const [commissionMember2, setCommissionMember2] = useState('Piotr Wiśniewski');
  const [commissionPresident, setCommissionPresident] = useState('Tadeusz Zieliński');
  const [commissionNotes, setCommissionNotes] = useState('Instalacja w pełni ekranowana.');

  // Active view tab: 'system' | 'antennas' | 'commission'
  const [activeTab, setActiveTab] = useState<'system' | 'antennas' | 'commission'>('antennas');

  const registrationData: EskRegistrationData = useMemo(() => ({
    protocolNumber,
    verificationDate,
    seasonYear,
    breederName,
    breederPzhgpNumber,
    branchName: defaultBranch,
    sectionName: defaultSection,
    loftAddress,
    loftLatitude,
    loftLongitude,
    systemBrand,
    baseStationSerial,
    terminalSerial,
    softwareVersion,
    backupBatteryWorking,
    timeSyncSource,
    antennas,
    tamperSeals,
    commissionMember1,
    commissionMember2,
    commissionPresident,
    commissionNotes,
  }), [
    protocolNumber,
    verificationDate,
    seasonYear,
    breederName,
    breederPzhgpNumber,
    defaultBranch,
    defaultSection,
    loftAddress,
    loftLatitude,
    loftLongitude,
    systemBrand,
    baseStationSerial,
    terminalSerial,
    softwareVersion,
    backupBatteryWorking,
    timeSyncSource,
    antennas,
    tamperSeals,
    commissionMember1,
    commissionMember2,
    commissionPresident,
    commissionNotes,
  ]);

  const validation = useMemo(() => {
    return validateEskRegistration(registrationData);
  }, [registrationData]);

  // Antenna helpers
  const handleAddAntenna = () => {
    const nextNum = antennas.length + 1;
    const newAnt: EskAntennaPad = {
      id: `ant-${Date.now()}`,
      antennaNumber: nextNum,
      padModel: `${systemBrand} 4-polowa`,
      serialNumber: `ANT-${nextNum}000`,
      fieldCount: 4,
      entranceLocation: `Wylot ${nextNum}`,
      cableLengthMeters: 10,
      sensitivityDistanceCm: 6.5,
      sensitivityTestPassed: true,
    };
    setAntennas([...antennas, newAnt]);
  };

  const handleRemoveAntenna = (id: string) => {
    if (antennas.length <= 1) {
      Alert.alert('Błąd', 'Musisz posiadać co najmniej 1 antenę w protokole.');
      return;
    }
    setAntennas(antennas.filter((a) => a.id !== id));
  };

  const handleUpdateAntennaSensitivity = (id: string, delta: number) => {
    setAntennas((prev) =>
      prev.map((ant) => {
        if (ant.id !== id) return ant;
        const newDist = Math.max(1.0, Math.min(15.0, Math.round((ant.sensitivityDistanceCm + delta) * 10) / 10));
        return {
          ...ant,
          sensitivityDistanceCm: newDist,
          sensitivityTestPassed: newDist >= 5.0,
        };
      })
    );
  };

  const handleAddSeal = () => {
    const nextIdx = tamperSeals.length + 1;
    const newSeal: EskTamperSeal = {
      id: `seal-${Date.now()}`,
      sealNumber: `PL-PZHGP-${seasonYear}-${Math.floor(1000 + Math.random() * 9000)}`,
      sealLocation: nextIdx === 1 ? 'Magistrala stacji matki' : `Puszka anteny ${nextIdx}`,
      installedDate: verificationDate,
    };
    setTamperSeals([...tamperSeals, newSeal]);
  };

  const handleRemoveSeal = (id: string) => {
    setTamperSeals(tamperSeals.filter((s) => s.id !== id));
  };

  const handlePrint = async () => {
    try {
      const html = generateEskRegistrationProtocolHtml(registrationData);
      await PdfService.printHtml(html);
    } catch {
      Alert.alert('Błąd wydruku', 'Nie udało się zainicjować wydruku protokołu ESK.');
    }
  };

  const handleShare = async () => {
    try {
      const html = generateEskRegistrationProtocolHtml(registrationData);
      await PdfService.shareHtmlAsPdf(
        html,
        `Protokol_ESK_${breederName.replace(/\s+/g, '_')}_${seasonYear}.pdf`
      );
    } catch {
      Alert.alert('Błąd eksportu', 'Nie udało się wyeksportować protokołu ESK.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>📡 Rejestracja Stacji i Anten ESK</Text>
            <Text style={styles.headerSubtitle}>
              Protokół Weryfikacji ESK PZHGP (Z-084)
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Zamknij protokół ESK"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Status Banner */}
          <View
            style={[
              styles.statusBanner,
              { borderColor: validation.isCompliant ? '#10B981' : '#EF4444' },
            ]}
          >
            <View style={styles.statusLeft}>
              <Text
                style={[
                  styles.statusText,
                  { color: validation.isCompliant ? '#10B981' : '#EF4444' },
                ]}
              >
                {validation.isCompliant
                  ? '✅ SYSTEM ZGODNY Z NORMĄ PZHGP'
                  : '⚠️ WYKRYTO NIEZGODNOŚCI'}
              </Text>
              <Text style={styles.statusSub}>
                {validation.isCompliant
                  ? `Wszystkie ${antennas.length} anten (${validation.totalAntennaFields} pól) spełniają wymóg czułości >= 5.0 cm.`
                  : validation.errors[0]}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeVal}>{validation.totalAntennaFields}</Text>
              <Text style={styles.statusBadgeDesc}>Pól ESK</Text>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'antennas' && styles.tabBtnActive]}
              onPress={() => setActiveTab('antennas')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'antennas' && styles.tabBtnTextActive,
                ]}
              >
                📡 Anteny ({antennas.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'system' && styles.tabBtnActive]}
              onPress={() => setActiveTab('system')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'system' && styles.tabBtnTextActive,
                ]}
              >
                ⚙️ Baza i Zegar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'commission' && styles.tabBtnActive]}
              onPress={() => setActiveTab('commission')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'commission' && styles.tabBtnTextActive,
                ]}
              >
                🔒 Plomby i Komisja
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab 1: Antennas */}
          {activeTab === 'antennas' && (
            <View style={styles.tabSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>ANTENY WLOTOWE I TEST CZUŁOŚCI</Text>
                <TouchableOpacity style={styles.addBtn} onPress={handleAddAntenna}>
                  <Text style={styles.addBtnText}>+ Dodaj Antenę</Text>
                </TouchableOpacity>
              </View>

              {antennas.map((ant, idx) => (
                <View key={ant.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardHeaderTitle}>
                      Antena #{ant.antennaNumber} — {ant.padModel}
                    </Text>
                    {antennas.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => handleRemoveAntenna(ant.id)}
                      >
                        <Text style={styles.removeBtnText}>Usuń</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Numer Seryjny:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={ant.serialNumber}
                      onChangeText={(val) => {
                        setAntennas((prev) =>
                          prev.map((a) => (a.id === ant.id ? { ...a, serialNumber: val } : a))
                        );
                      }}
                      placeholder="SN..."
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Lokalizacja Wylotu:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={ant.entranceLocation}
                      onChangeText={(val) => {
                        setAntennas((prev) =>
                          prev.map((a) => (a.id === ant.id ? { ...a, entranceLocation: val } : a))
                        );
                      }}
                      placeholder="np. Wylot Wdowcy"
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  {/* Sensitivity Test Stepper */}
                  <View style={styles.sensitivityRow}>
                    <View style={styles.sensitivityInfo}>
                      <Text style={styles.sensitivityTitle}>Test Czułości Chipa</Text>
                      <Text
                        style={[
                          styles.sensitivityVal,
                          { color: ant.sensitivityTestPassed ? '#10B981' : '#EF4444' },
                        ]}
                      >
                        {ant.sensitivityDistanceCm.toFixed(1)} cm{' '}
                        {ant.sensitivityTestPassed ? '(Norma OK)' : '(ZA SŁABA!)'}
                      </Text>
                      <Text style={styles.sensitivityHint}>Norma PZHGP: min. 5.0 cm</Text>
                    </View>
                    <View style={styles.stepperControls}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => handleUpdateAntennaSensitivity(ant.id, -0.5)}
                      >
                        <Text style={styles.stepBtnText}>-0.5</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => handleUpdateAntennaSensitivity(ant.id, 0.5)}
                      >
                        <Text style={styles.stepBtnText}>+0.5</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Tab 2: System Brand & Base */}
          {activeTab === 'system' && (
            <View style={styles.tabSection}>
              <Text style={styles.sectionTitle}>SYSTEM ELEKTRONICZNEGO ZEGARKA</Text>

              {/* Brand picker */}
              <View style={styles.brandGrid}>
                {(['Tauris', 'Benzing', 'Bricon', 'Mega', 'Tipes', 'Unikon'] as EskSystemBrand[]).map(
                  (brand) => (
                    <TouchableOpacity
                      key={brand}
                      style={[
                        styles.brandButton,
                        systemBrand === brand && styles.brandButtonActive,
                      ]}
                      onPress={() => setSystemBrand(brand)}
                    >
                      <Text
                        style={[
                          styles.brandButtonText,
                          systemBrand === brand && styles.brandButtonTextActive,
                        ]}
                      >
                        {brand}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Nr Seryjny Bazy (Stacji):</Text>
                  <TextInput
                    style={styles.textInput}
                    value={baseStationSerial}
                    onChangeText={setBaseStationSerial}
                    placeholder="Nr fabryczny bazy..."
                    placeholderTextColor="#64748B"
                  />
                </View>

                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Nr Seryjny Zegara (Terminal):</Text>
                  <TextInput
                    style={styles.textInput}
                    value={terminalSerial}
                    onChangeText={setTerminalSerial}
                    placeholder="Nr seryjny zegara..."
                    placeholderTextColor="#64748B"
                  />
                </View>

                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Wersja Oprogramowania:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={softwareVersion}
                    onChangeText={setSoftwareVersion}
                    placeholder="Wersja softu..."
                    placeholderTextColor="#64748B"
                  />
                </View>

                {/* Time sync source */}
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Źródło Synchronizacji:</Text>
                  <View style={styles.toggleRow}>
                    {(['DCF-77', 'GPS'] as const).map((source) => (
                      <TouchableOpacity
                        key={source}
                        style={[
                          styles.toggleBtn,
                          timeSyncSource === source && styles.toggleBtnActive,
                        ]}
                        onPress={() => setTimeSyncSource(source)}
                      >
                        <Text
                          style={[
                            styles.toggleBtnText,
                            timeSyncSource === source && styles.toggleBtnTextActive,
                          ]}
                        >
                          {source}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Battery backup */}
                <View style={[styles.cardRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.cardLabel}>Akumulator Buforowy 12V:</Text>
                  <TouchableOpacity
                    style={[
                      styles.batteryBtn,
                      backupBatteryWorking ? styles.batteryBtnOk : styles.batteryBtnFail,
                    ]}
                    onPress={() => setBackupBatteryWorking(!backupBatteryWorking)}
                  >
                    <Text style={styles.batteryBtnText}>
                      {backupBatteryWorking ? '🔋 Sprawny (OK)' : '⚠️ Brak / Niesprawny'}
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
                  <Text style={styles.cardLabel}>Nr PZHGP:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={breederPzhgpNumber}
                    onChangeText={setBreederPzhgpNumber}
                    placeholder="np. PL-0284-1420"
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

          {/* Tab 3: Seals & Commission */}
          {activeTab === 'commission' && (
            <View style={styles.tabSection}>
              {/* Seals */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>PLOMBY ZABEZPIECZAJĄCE ESK</Text>
                <TouchableOpacity style={styles.addBtn} onPress={handleAddSeal}>
                  <Text style={styles.addBtnText}>+ Dodaj Plombę</Text>
                </TouchableOpacity>
              </View>

              {tamperSeals.map((seal, idx) => (
                <View key={seal.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardHeaderTitle}>Plomba #{idx + 1}</Text>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemoveSeal(seal.id)}
                    >
                      <Text style={styles.removeBtnText}>Usuń</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Nr Plomby:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={seal.sealNumber}
                      onChangeText={(val) => {
                        setTamperSeals((prev) =>
                          prev.map((s) => (s.id === seal.id ? { ...s, sealNumber: val } : s))
                        );
                      }}
                      placeholder="Nr plomby..."
                      placeholderTextColor="#64748B"
                    />
                  </View>
                  <View style={[styles.cardRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.cardLabel}>Lokalizacja:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={seal.sealLocation}
                      onChangeText={(val) => {
                        setTamperSeals((prev) =>
                          prev.map((s) => (s.id === seal.id ? { ...s, sealLocation: val } : s))
                        );
                      }}
                      placeholder="np. Gniazdo magistrali..."
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>
              ))}

              {/* Commission Members */}
              <View style={[styles.card, { marginTop: 12 }]}>
                <Text style={styles.cardHeaderTitle}>KOMISJA ZEGAROWA SEKCJI / ODDZIAŁU</Text>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Członek Komisji 1:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={commissionMember1}
                    onChangeText={setCommissionMember1}
                    placeholder="Imię i nazwisko"
                    placeholderTextColor="#64748B"
                  />
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Członek Komisji 2:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={commissionMember2}
                    onChangeText={setCommissionMember2}
                    placeholder="Imię i nazwisko"
                    placeholderTextColor="#64748B"
                  />
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Przewodniczący:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={commissionPresident}
                    onChangeText={setCommissionPresident}
                    placeholder="Imię i nazwisko"
                    placeholderTextColor="#64748B"
                  />
                </View>
                <View style={[styles.cardRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.cardLabel}>Uwagi Komisji:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={commissionNotes}
                    onChangeText={setCommissionNotes}
                    placeholder="Uwagi techniczne..."
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <FieldButton
              title="Drukuj Protokół A4"
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
    color: '#38BDF8',
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8A92A0',
    letterSpacing: 0.8,
  },
  addBtn: {
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: '#0284C7',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
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
  sensitivityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#262A30',
  },
  sensitivityInfo: {
    flex: 1,
  },
  sensitivityTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F0F2F5',
  },
  sensitivityVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  sensitivityHint: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
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
  brandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  brandButton: {
    flex: 1,
    minWidth: '30%',
    height: 48,
    backgroundColor: '#1E2229',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2D333D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandButtonActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#0284C725',
  },
  brandButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A92A0',
  },
  brandButtonTextActive: {
    color: '#38BDF8',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  toggleBtn: {
    height: 48,
    paddingHorizontal: 12,
    backgroundColor: '#22262E',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#0284C7',
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A92A0',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  batteryBtn: {
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  batteryBtnOk: {
    backgroundColor: '#10B98125',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  batteryBtnFail: {
    backgroundColor: '#EF444425',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  batteryBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F0F2F5',
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

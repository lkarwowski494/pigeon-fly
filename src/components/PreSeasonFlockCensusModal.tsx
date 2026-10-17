/**
 * PIGEON-FLY — Modal Urzędowego Spisu Gołębi PZHGP (PreSeasonFlockCensusModal)
 * Przedsezonowe zgłoszenie stada, typowanie 50 do GMP, audyt chipów ESK i zaświadczenie PMV-1.
 * Zgodność z Field Mode (ergonomia dotykowa >= 48-56 pt) i A4 AirPrint/PDF.
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
  PreSeasonFlockCensus,
  PigeonCensusEntry,
  CensusType,
  CENSUS_TYPE_LABELS,
  validateFlockCensus,
  calculateCensusStats,
  generatePreSeasonFlockCensusHtml,
} from '../domain/preSeasonFlockCensus';
import { PdfService } from '../services/pdfService';

interface PreSeasonFlockCensusModalProps {
  visible: boolean;
  onClose: () => void;
  defaultBreederName?: string;
  defaultBranchName?: string;
  defaultSectionName?: string;
}

const DEMO_PIGEONS: PigeonCensusEntry[] = [
  {
    ordinalNumber: 1,
    ringNumber: 'PL-0284-22-1402',
    color: 'Niebieski',
    sex: 'cock',
    birthYear: 2022,
    chipCode: 'TAUR-89A04F',
    isDesignatedForGmp: true,
    isDesignatedForInter: true,
    notes: 'Lotnik As Oddziału 2024',
  },
  {
    ordinalNumber: 2,
    ringNumber: 'PL-0284-22-1455',
    color: 'Niebieska-Pstra',
    sex: 'hen',
    birthYear: 2022,
    chipCode: 'TAUR-89A050',
    isDesignatedForGmp: true,
    isDesignatedForInter: true,
    notes: 'Seria 5/5 maraton',
  },
  {
    ordinalNumber: 3,
    ringNumber: 'PL-0284-23-4412',
    color: 'Ciemna-Nakrapiana',
    sex: 'cock',
    birthYear: 2023,
    chipCode: 'TAUR-89A051',
    isDesignatedForGmp: true,
    isDesignatedForInter: false,
    notes: '',
  },
  {
    ordinalNumber: 4,
    ringNumber: 'PL-0284-23-4490',
    color: 'Płowa',
    sex: 'hen',
    birthYear: 2023,
    chipCode: 'TAUR-89A052',
    isDesignatedForGmp: true,
    isDesignatedForInter: false,
    notes: 'Dobre wyniki w Kat. A',
  },
  {
    ordinalNumber: 5,
    ringNumber: 'PL-0284-24-7890',
    color: 'Czerwona-Nakrapiana',
    sex: 'cock',
    birthYear: 2024,
    chipCode: '',
    isDesignatedForGmp: false,
    isDesignatedForInter: false,
    notes: 'Roczniak — brak chipa przed koszowaniem',
  },
];

export const PreSeasonFlockCensusModal: React.FC<PreSeasonFlockCensusModalProps> = ({
  visible,
  onClose,
  defaultBreederName = 'Janusz Kowalski',
  defaultBranchName = 'Oddział 0284 Gostyń',
  defaultSectionName = 'Sekcja 02 Poniec',
}) => {
  const currentYear = new Date().getFullYear();
  const todayIso = new Date().toISOString().split('T')[0];

  // Form State
  const [seasonYear, setSeasonYear] = useState<string>(currentYear.toString());
  const [censusType, setCensusType] = useState<CensusType>('gmp_50');
  const [submissionDate, setSubmissionDate] = useState<string>(todayIso);
  const [breederName, setBreederName] = useState<string>(defaultBreederName);
  const [breederPzhgpNumber, setBreederPzhgpNumber] = useState<string>('0284-1234');
  const [branchName, setBranchName] = useState<string>(defaultBranchName);
  const [sectionName, setSectionName] = useState<string>(defaultSectionName);
  const [loftAddress, setLoftAddress] = useState<string>('ul. Słoneczna 12, 63-800 Gostyń');
  const [loftGpsCoordinates, setLoftGpsCoordinates] = useState<string>(
    '51°45\'22.1"N 16°52\'10.4"E'
  );
  const [eskSystemName, setEskSystemName] = useState<string>('Tauris World');

  // Veterinary PMV-1 State
  const [pmvVaccineName, setPmvVaccineName] = useState<string>('Colombovac PMV');
  const [pmvVaccineLotNumber, setPmvVaccineLotNumber] = useState<string>('LOT-PMV-2026-04');
  const [pmvVaccinationDate, setPmvVaccinationDate] = useState<string>('2026-02-15');
  const [vetName, setVetName] = useState<string>('Lek. wet. Janusz Ptasiński');
  const [vetLicenseNumber, setVetLicenseNumber] = useState<string>('PWZW-10492');

  // Pigeons State
  const [pigeons, setPigeons] = useState<PigeonCensusEntry[]>(DEMO_PIGEONS);

  // Quick-Add pigeon inputs
  const [newRing, setNewRing] = useState<string>('');
  const [newColor, setNewColor] = useState<string>('Niebieski');
  const [newSex, setNewSex] = useState<'cock' | 'hen'>('cock');
  const [newYear, setNewYear] = useState<string>(currentYear.toString());
  const [newChip, setNewChip] = useState<string>('');

  // UI Navigation
  const [activeTab, setActiveTab] = useState<'params' | 'pigeons' | 'verify_print'>('params');
  const [selectedCopy, setSelectedCopy] = useState<'branch' | 'calc_officer' | 'breeder'>('branch');

  // Build Census Object
  const currentCensus: PreSeasonFlockCensus = useMemo(
    () => ({
      id: `census-${seasonYear}-${breederPzhgpNumber}`,
      seasonYear: parseInt(seasonYear, 10) || currentYear,
      censusType,
      submissionDate,
      breederName,
      breederPzhgpNumber,
      branchName,
      sectionName,
      loftAddress,
      loftGpsCoordinates,
      eskSystemName,
      pmvVaccineName,
      pmvVaccineLotNumber,
      pmvVaccinationDate,
      vetName,
      vetLicenseNumber,
      pigeons,
    }),
    [
      seasonYear,
      currentYear,
      censusType,
      submissionDate,
      breederName,
      breederPzhgpNumber,
      branchName,
      sectionName,
      loftAddress,
      loftGpsCoordinates,
      eskSystemName,
      pmvVaccineName,
      pmvVaccineLotNumber,
      pmvVaccinationDate,
      vetName,
      vetLicenseNumber,
      pigeons,
    ]
  );

  const stats = useMemo(() => calculateCensusStats(currentCensus), [currentCensus]);
  const validation = useMemo(() => validateFlockCensus(currentCensus), [currentCensus]);

  const handleAddPigeon = () => {
    if (!newRing.trim()) {
      Alert.alert('Błąd', 'Podaj numer obrączki rodowej (np. PL-0284-24-1234).');
      return;
    }

    const ringUpper = newRing.trim().toUpperCase();
    if (pigeons.some((p) => p.ringNumber.toUpperCase() === ringUpper)) {
      Alert.alert('Duplikat', `Obrączka ${ringUpper} znajduje się już w tym spisie!`);
      return;
    }

    const entry: PigeonCensusEntry = {
      ordinalNumber: pigeons.length + 1,
      ringNumber: ringUpper,
      color: newColor.trim() || 'Niebieski',
      sex: newSex,
      birthYear: parseInt(newYear, 10) || currentYear,
      chipCode: newChip.trim().toUpperCase(),
      isDesignatedForGmp: censusType === 'gmp_50' && pigeons.length < 50,
      isDesignatedForInter: false,
    };

    setPigeons([...pigeons, entry]);
    setNewRing('');
    setNewChip('');
  };

  const handleToggleGmp = (ringNumber: string) => {
    setPigeons((prev) =>
      prev.map((p) => {
        if (p.ringNumber === ringNumber) {
          const willDesignate = !p.isDesignatedForGmp;
          if (willDesignate && stats.gmpCount >= 50) {
            Alert.alert('Limit GMP', 'Osiągnięto maksymalny limit 50 wytypowanych gołębi do GMP!');
            return p;
          }
          return { ...p, isDesignatedForGmp: willDesignate };
        }
        return p;
      })
    );
  };

  const handleToggleInter = (ringNumber: string) => {
    setPigeons((prev) =>
      prev.map((p) =>
        p.ringNumber === ringNumber ? { ...p, isDesignatedForInter: !p.isDesignatedForInter } : p
      )
    );
  };

  const handleRemovePigeon = (ringNumber: string) => {
    setPigeons((prev) => {
      const filtered = prev.filter((p) => p.ringNumber !== ringNumber);
      return filtered.map((p, idx) => ({ ...p, ordinalNumber: idx + 1 }));
    });
  };

  const handlePrint = async () => {
    if (!validation.isValid) {
      Alert.alert('Błędy formalne', validation.errors.join('\n'));
      return;
    }
    try {
      const html = generatePreSeasonFlockCensusHtml(currentCensus, selectedCopy);
      await PdfService.printHtml(html);
    } catch (e: any) {
      Alert.alert('Błąd drukowania', e?.message || 'Nie udało się wydrukować spisu.');
    }
  };

  const handleShare = async () => {
    if (!validation.isValid) {
      Alert.alert('Błędy formalne', validation.errors.join('\n'));
      return;
    }
    try {
      const html = generatePreSeasonFlockCensusHtml(currentCensus, selectedCopy);
      await PdfService.shareHtmlAsPdf(
        html,
        `Spis-Golebi-${currentCensus.seasonYear}-${currentCensus.breederPzhgpNumber}`
      );
    } catch (e: any) {
      Alert.alert('Błąd eksportu', e?.message || 'Nie udało się wyeksportować pliku PDF.');
    }
  };

  const handleSaveCensus = () => {
    if (!validation.isValid) {
      Alert.alert('Błędy weryfikacji', validation.errors.join('\n'));
      return;
    }
    Alert.alert(
      'Zatwierdzono Spis Gołębi PZHGP',
      `Spis stada na sezon ${currentCensus.seasonYear} dla hodowcy ${currentCensus.breederName} (${currentCensus.breederPzhgpNumber}) został zatwierdzony i oznaczony jako gotowy do przekazania Komisji Lotowej.`
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>URZĘDOWY SPIS GOŁĘBI PZHGP</Text>
            <Text style={styles.headerSubtitle}>
              Przedsezonowe zgłoszenie stada i audyt chipów ESK (Z-095)
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            testID="btn-close-census-modal"
          >
            <Text style={styles.closeButtonText}>✕ Zamknij</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Top Quick Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statVal}>{stats.totalPigeons}</Text>
                <Text style={styles.statLbl}>Zgłoszono</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={[styles.statVal, { color: '#38bdf8' }]}>
                  {stats.cocksCount} ♂ / {stats.hensCount} ♀
                </Text>
                <Text style={styles.statLbl}>Płeć stada</Text>
              </View>
              <View style={styles.statCol}>
                <Text
                  style={[
                    styles.statVal,
                    { color: stats.gmpCount > 50 ? '#f87171' : '#4ade80' },
                  ]}
                >
                  {stats.gmpCount} / 50
                </Text>
                <Text style={styles.statLbl}>GMP 50-tka</Text>
              </View>
              <View style={styles.statCol}>
                <Text
                  style={[
                    styles.statVal,
                    { color: stats.chipsMissingCount > 0 ? '#fbbf24' : '#4ade80' },
                  ]}
                >
                  {stats.chipsAssignedCount} / {stats.totalPigeons}
                </Text>
                <Text style={styles.statLbl}>Z chipem ESK</Text>
              </View>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'params' && styles.tabActive]}
              onPress={() => setActiveTab('params')}
              testID="tab-census-params"
            >
              <Text style={[styles.tabText, activeTab === 'params' && styles.tabTextActive]}>
                1. Dane & Weterynaria
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'pigeons' && styles.tabActive]}
              onPress={() => setActiveTab('pigeons')}
              testID="tab-census-pigeons"
            >
              <Text style={[styles.tabText, activeTab === 'pigeons' && styles.tabTextActive]}>
                2. Lista Ptaków ({pigeons.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'verify_print' && styles.tabActive]}
              onPress={() => setActiveTab('verify_print')}
              testID="tab-census-verify"
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'verify_print' && styles.tabTextActive,
                ]}
              >
                3. Weryfikacja & Druk
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: PARAMS & VETERINARY */}
          {activeTab === 'params' && (
            <View>
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>PARAMETRY SEZONU I TYP SPISU</Text>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 0.8, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Rok Sezonu:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={seasonYear}
                      onChangeText={setSeasonYear}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1.2 }]}>
                    <Text style={styles.inputLabel}>Data Złożenia Spisu:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={submissionDate}
                      onChangeText={setSubmissionDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Wariant Spisu PZHGP:</Text>
                <View style={styles.typeSelectorRow}>
                  {(['gmp_50', 'total_flock', 'youngsters'] as CensusType[]).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.typeBadge,
                        censusType === t && styles.typeBadgeActive,
                      ]}
                      onPress={() => setCensusType(t)}
                    >
                      <Text
                        style={[
                          styles.typeBadgeText,
                          censusType === t && styles.typeBadgeTextActive,
                        ]}
                      >
                        {t === 'gmp_50'
                          ? '🏆 GMP 50'
                          : t === 'total_flock'
                          ? '📋 Całość Stada'
                          : '🐣 Młode Derby'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>DANE HODOWCY I PRZYNALEŻNOŚĆ ZWIĄZKOWA</Text>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Imię i Nazwisko:</Text>
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

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Oddział PZHGP:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={branchName}
                      onChangeText={setBranchName}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Sekcja:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={sectionName}
                      onChangeText={setSectionName}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Adres Gołębnika:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={loftAddress}
                    onChangeText={setLoftAddress}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Współrzędne GPS:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={loftGpsCoordinates}
                      onChangeText={setLoftGpsCoordinates}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>System ESK:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={eskSystemName}
                      onChangeText={setEskSystemName}
                    />
                  </View>
                </View>
              </View>

              {/* VETERINARY BOX */}
              <View style={[styles.card, { borderColor: '#ef4444', borderWidth: 1.5 }]}>
                <Text style={[styles.cardSectionTitle, { color: '#f87171' }]}>
                  🛡️ ATESTACJA WETERYNARYJNA PMV-1 (OBOWIĄZKOWA)
                </Text>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Nazwa Szczepionki:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={pmvVaccineName}
                      onChangeText={setPmvVaccineName}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 0.8 }]}>
                    <Text style={styles.inputLabel}>Nr Serii (LOT):</Text>
                    <TextInput
                      style={styles.textInput}
                      value={pmvVaccineLotNumber}
                      onChangeText={setPmvVaccineLotNumber}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Data Wykonania Szczepienia:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={pmvVaccinationDate}
                    onChangeText={setPmvVaccinationDate}
                    placeholder="YYYY-MM-DD"
                  />
                  <Text style={styles.helperText}>
                    Ważność szczepienia: 365 dni od daty podania. Wymagane przez PIW.
                  </Text>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Lekarz Weterynarii:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={vetName}
                      onChangeText={setVetName}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 0.8 }]}>
                    <Text style={styles.inputLabel}>Nr PWZW:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={vetLicenseNumber}
                      onChangeText={setVetLicenseNumber}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* TAB 2: PIGEONS & ESK CHIPS */}
          {activeTab === 'pigeons' && (
            <View>
              {/* Quick Add Card */}
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>+ DODAJ GOŁĘBIA DO SPISU</Text>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Nr Obrączki Rodowej:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={newRing}
                      onChangeText={setNewRing}
                      placeholder="PL-0284-24-1234"
                      placeholderTextColor="#64748B"
                      autoCapitalize="characters"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 0.8 }]}>
                    <Text style={styles.inputLabel}>Rocznik:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={newYear}
                      onChangeText={setNewYear}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Barwa Upierzenia:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={newColor}
                      onChangeText={setNewColor}
                      placeholder="Niebieski"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Płeć:</Text>
                    <View style={styles.sexToggleRow}>
                      <TouchableOpacity
                        style={[
                          styles.sexButton,
                          newSex === 'cock' && styles.sexButtonActive,
                        ]}
                        onPress={() => setNewSex('cock')}
                      >
                        <Text
                          style={[
                            styles.sexButtonText,
                            newSex === 'cock' && styles.sexButtonTextActive,
                          ]}
                        >
                          1.0 ♂
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.sexButton,
                          newSex === 'hen' && styles.sexButtonActiveHen,
                        ]}
                        onPress={() => setNewSex('hen')}
                      >
                        <Text
                          style={[
                            styles.sexButtonText,
                            newSex === 'hen' && styles.sexButtonTextActive,
                          ]}
                        >
                          0.1 ♀
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Kod Elektroniczny Chipa ESK:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newChip}
                    onChangeText={setNewChip}
                    placeholder="TAUR-89A053 / BNZ-10492"
                    placeholderTextColor="#64748B"
                    autoCapitalize="characters"
                  />
                </View>

                <FieldButton
                  title="+ Wprowadź Ptaka do Spisu"
                  onPress={handleAddPigeon}
                  style={{ marginTop: 8 }}
                  testID="btn-add-pigeon-to-census"
                />
              </View>

              {/* Pigeons Table / List */}
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>
                  LISTA GOŁĘBI W SPISIE ({pigeons.length})
                </Text>

                {pigeons.map((pigeon) => (
                  <View key={pigeon.ringNumber} style={styles.pigeonRowCard}>
                    <View style={styles.pigeonMainInfo}>
                      <View style={styles.pigeonHeaderRow}>
                        <Text style={styles.pigeonIndex}>#{pigeon.ordinalNumber}</Text>
                        <Text style={styles.pigeonRing}>{pigeon.ringNumber}</Text>
                        <Text
                          style={[
                            styles.pigeonSexBadge,
                            pigeon.sex === 'cock' ? styles.sexCock : styles.sexHen,
                          ]}
                        >
                          {pigeon.sex === 'cock' ? '1.0 ♂' : '0.1 ♀'}
                        </Text>
                        <Text style={styles.pigeonYear}>{pigeon.birthYear}</Text>
                      </View>

                      <Text style={styles.pigeonSubText}>
                        Barwa: {pigeon.color} • Chip:{' '}
                        <Text
                          style={{
                            color: pigeon.chipCode ? '#38bdf8' : '#f87171',
                            fontFamily: 'monospace',
                          }}
                        >
                          {pigeon.chipCode || 'BRAK CHIPA'}
                        </Text>
                      </Text>
                    </View>

                    {/* Flags toggles */}
                    <View style={styles.pigeonActionsCol}>
                      <TouchableOpacity
                        style={[
                          styles.flagButton,
                          pigeon.isDesignatedForGmp && styles.flagButtonActiveGmp,
                        ]}
                        onPress={() => handleToggleGmp(pigeon.ringNumber)}
                        testID={`toggle-gmp-${pigeon.ringNumber}`}
                      >
                        <Text
                          style={[
                            styles.flagButtonText,
                            pigeon.isDesignatedForGmp && styles.flagButtonTextActive,
                          ]}
                        >
                          {pigeon.isDesignatedForGmp ? '✓ GMP 50' : 'GMP 50'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.flagButton,
                          pigeon.isDesignatedForInter && styles.flagButtonActiveInter,
                        ]}
                        onPress={() => handleToggleInter(pigeon.ringNumber)}
                        testID={`toggle-inter-${pigeon.ringNumber}`}
                      >
                        <Text
                          style={[
                            styles.flagButtonText,
                            pigeon.isDesignatedForInter && styles.flagButtonTextActive,
                          ]}
                        >
                          {pigeon.isDesignatedForInter ? '✓ Inter' : 'Inter'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleRemovePigeon(pigeon.ringNumber)}
                      >
                        <Text style={styles.deleteButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* TAB 3: VERIFY & PRINT */}
          {activeTab === 'verify_print' && (
            <View>
              {/* Validation Status Card */}
              <View
                style={[
                  styles.card,
                  {
                    borderColor: validation.isValid ? '#22c55e' : '#ef4444',
                    borderWidth: 2,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.cardSectionTitle,
                    { color: validation.isValid ? '#4ade80' : '#f87171' },
                  ]}
                >
                  {validation.isValid
                    ? '✓ SPIS ZGODNY Z REGULAMINEM PZHGP'
                    : '⚠ WYKRYTO BŁĘDY W SPISIE'}
                </Text>

                {validation.isValid ? (
                  <Text style={styles.validationOkText}>
                    Wszystkie kryteria formalne zostały spełnione: unikalność obrączek, brak
                    kolizji chipów ESK, limit GMP zachowany, ważne szczepienie PMV-1.
                  </Text>
                ) : (
                  <View style={styles.errorsContainer}>
                    {validation.errors.map((err, i) => (
                      <Text key={i} style={styles.errorItem}>
                        • {err}
                      </Text>
                    ))}
                  </View>
                )}
              </View>

              {/* Copy Selection */}
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>WYBIERZ EGZEMPLARZ URZĘDOWY DO WYDRUKU</Text>
                <Text style={styles.helperText}>
                  Regulamin PZHGP wymaga sporządzenia 3 egzemplarzy spisu stada:
                </Text>

                <View style={styles.copySelectorCol}>
                  <TouchableOpacity
                    style={[
                      styles.copyButton,
                      selectedCopy === 'branch' && styles.copyButtonActiveBranch,
                    ]}
                    onPress={() => setSelectedCopy('branch')}
                  >
                    <Text style={styles.copyButtonTitle}>
                      📘 Egzemplarz 1: Zarząd Oddziału PZHGP
                    </Text>
                    <Text style={styles.copyButtonDesc}>
                      Dla Komisji Lotowej do archiwum Oddziału i pieczęci
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.copyButton,
                      selectedCopy === 'calc_officer' && styles.copyButtonActiveCalc,
                    ]}
                    onPress={() => setSelectedCopy('calc_officer')}
                  >
                    <Text style={styles.copyButtonTitle}>
                      📗 Egzemplarz 2: Rachmistrz Oddziałowy
                    </Text>
                    <Text style={styles.copyButtonDesc}>
                      Do importu bazy ptaków i chipów ESK w programie obliczeniowym
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.copyButton,
                      selectedCopy === 'breeder' && styles.copyButtonActiveBreeder,
                    ]}
                    onPress={() => setSelectedCopy('breeder')}
                  >
                    <Text style={styles.copyButtonTitle}>📙 Egzemplarz 3: Hodowca</Text>
                    <Text style={styles.copyButtonDesc}>
                      Do okazania podczas kontroli lotowej lub inspekcji gołębnika
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Buttons */}
              <FieldButton
                title="🛡️ Zatwierdź i Zablokuj Spis Sezonu"
                onPress={handleSaveCensus}
                style={styles.saveButton}
                testID="btn-save-census"
              />

              <View style={styles.exportRow}>
                <FieldButton
                  title="🖨️ AirPrint Spis Gołębi"
                  variant="secondary"
                  onPress={handlePrint}
                  style={{ flex: 1, marginRight: 8 }}
                  testID="btn-print-census"
                />
                <FieldButton
                  title="📤 Udostępnij PDF (PZHGP)"
                  variant="secondary"
                  onPress={handleShare}
                  style={{ flex: 1 }}
                  testID="btn-share-census"
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
    borderColor: '#0284c7',
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
    justifyContent: 'space-between',
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
    marginHorizontal: 2,
    paddingHorizontal: 4,
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
  sexToggleRow: {
    flexDirection: 'row',
  },
  sexButton: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121417',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    marginRight: 4,
  },
  sexButtonActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#60a5fa',
  },
  sexButtonActiveHen: {
    backgroundColor: '#be185d',
    borderColor: '#f472b6',
  },
  sexButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  sexButtonTextActive: {
    color: '#FFFFFF',
  },
  pigeonRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121417',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 8,
  },
  pigeonMainInfo: {
    flex: 1,
  },
  pigeonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pigeonIndex: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginRight: 6,
  },
  pigeonRing: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
    marginRight: 8,
  },
  pigeonSexBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  sexCock: {
    backgroundColor: '#1e3a8a',
    color: '#93c5fd',
  },
  sexHen: {
    backgroundColor: '#831843',
    color: '#fbcfe8',
  },
  pigeonYear: {
    fontSize: 11,
    color: '#94A3B8',
  },
  pigeonSubText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  pigeonActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagButton: {
    minHeight: 48,
    minWidth: 54,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E2127',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 6,
    marginLeft: 4,
    paddingHorizontal: 4,
  },
  flagButtonActiveGmp: {
    backgroundColor: '#047857',
    borderColor: '#34d399',
  },
  flagButtonActiveInter: {
    backgroundColor: '#0369a1',
    borderColor: '#38bdf8',
  },
  flagButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  flagButtonTextActive: {
    color: '#FFFFFF',
  },
  deleteButton: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
  validationOkText: {
    fontSize: 12,
    color: '#4ade80',
    lineHeight: 18,
  },
  errorsContainer: {
    backgroundColor: '#450a0a',
    borderRadius: 8,
    padding: 10,
  },
  errorItem: {
    fontSize: 11,
    color: '#fca5a5',
    marginBottom: 4,
  },
  copySelectorCol: {
    marginTop: 8,
  },
  copyButton: {
    minHeight: 52,
    backgroundColor: '#121417',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
    padding: 10,
    marginBottom: 8,
    justifyContent: 'center',
  },
  copyButtonActiveBranch: {
    borderColor: '#38bdf8',
    backgroundColor: '#0c4a6e',
  },
  copyButtonActiveCalc: {
    borderColor: '#34d399',
    backgroundColor: '#064e3b',
  },
  copyButtonActiveBreeder: {
    borderColor: '#fbbf24',
    backgroundColor: '#78350f',
  },
  copyButtonTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  copyButtonDesc: {
    fontSize: 10,
    color: '#CBD5E1',
    marginTop: 2,
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

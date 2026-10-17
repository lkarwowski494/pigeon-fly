/**
 * PIGEON-FLY — Generator Świadectwa Zgodności Weterynaryjnej Punktu Koszowania (Z-092 / DEC-106)
 * Field Mode ergonomic interface (>= 48-56pt touch targets), dark theme (#121417).
 * Manages pre-basketing sanitation inspection, biocide concentration and exposure audit,
 * basket/crate physical disinfection, and official PIW / PZHGP sanitation certification.
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
  BasketingStationSanitationData,
  BasketingSanitationVerdict,
  VERDICT_LABELS,
  validateBasketingStationSanitation,
  calculateSanitationScore,
  generateBasketingStationSanitationHtml,
} from '../domain/basketingStationSanitationProtocol';
import { PdfService } from '../services/pdfService';
import { FieldButton } from './FieldButton';

interface BasketingStationSanitationModalProps {
  visible: boolean;
  onClose: () => void;
  defaultBranchNumber?: string;
  defaultBranchName?: string;
  defaultStationName?: string;
  defaultRaceName?: string;
  onProtocolSaved?: (data: BasketingStationSanitationData) => void;
}

export const BasketingStationSanitationModal: React.FC<BasketingStationSanitationModalProps> = ({
  visible,
  onClose,
  defaultBranchNumber = '0284',
  defaultBranchName = 'Poznań Zachód',
  defaultStationName = 'Punkt Wkładań Sekcja 1 — Poznań Wilda',
  defaultRaceName = 'Lot nr 3 — Nowa Sól (220 km)',
  onProtocolSaved,
}) => {
  // Protocol Meta
  const [protocolNumber, setProtocolNumber] = useState('AT-SAN-2026/009');
  const [inspectionDate, setInspectionDate] = useState('2026-05-08');
  const [inspectionTime, setInspectionTime] = useState('16:30');
  const [raceName, setRaceName] = useState(defaultRaceName);
  const [stationName, setStationName] = useState(defaultStationName);
  const [stationAddress, setStationAddress] = useState('ul. Rolna 24, 61-487 Poznań');

  // Disinfectant
  const [productName, setProductName] = useState('Virkon S');
  const [activeSubstance, setActiveSubstance] = useState('Mononadsiarczan potasu');
  const [batchNumber, setBatchNumber] = useState('LOT-2026/03V');
  const [expiryDate, setExpiryDate] = useState('2027-12-31');
  const [solutionConcentrationPct, setSolutionConcentrationPct] = useState('2.0');
  const [exposureTimeMinutes, setExposureTimeMinutes] = useState('30');

  // Crates
  const [cratesCount, setCratesCount] = useState('45');
  const [cratesCleanAndDisinfected, setCratesCleanAndDisinfected] = useState(true);
  const [beddingType, setBeddingType] = useState<
    'corrugated_cardboard' | 'dustless_wood_shavings' | 'paper_mats'
  >('corrugated_cardboard');
  const [technicalIntegrityOk, setTechnicalIntegrityOk] = useState(true);
  const [densityCompliant, setDensityCompliant] = useState(true);

  // Checklist
  const [entranceDisinfectionMatsActive, setEntranceDisinfectionMatsActive] = useState(true);
  const [surfacesAndTablesSanitized, setSurfacesAndTablesSanitized] = useState(true);
  const [ventilationOperational, setVentilationOperational] = useState(true);
  const [rodentAndWildBirdShielded, setRodentAndWildBirdShielded] = useState(true);
  const [handSanitationAvailable, setHandSanitationAvailable] = useState(true);
  const [cleanWaterSourceAvailable, setCleanWaterSourceAvailable] = useState(true);

  // Verdict & Signatures
  const [verdict, setVerdict] = useState<BasketingSanitationVerdict>('approved_full');
  const [conditionalRequirements, setConditionalRequirements] = useState('');
  const [inspectorName, setInspectorName] = useState('Marek Wiśniewski');
  const [veterinarianName, setVeterinarianName] = useState('Lek. wet. Janusz Ptasiński');
  const [sectionPresidentName, setSectionPresidentName] = useState('Piotr Kaczmarek');
  const [notes, setNotes] = useState('Stan sanitarno-higieniczny punktu wzorowy.');

  // Active view tab: 'station' | 'crates' | 'checklist'
  const [activeTab, setActiveTab] = useState<'station' | 'crates' | 'checklist'>('station');

  const protocolData: BasketingStationSanitationData = useMemo(
    () => ({
      protocolNumber,
      inspectionDate,
      inspectionTime,
      raceName,
      stationName,
      stationAddress,
      branchNumber: defaultBranchNumber,
      branchName: defaultBranchName,
      disinfectant: {
        productName,
        activeSubstance,
        batchNumber,
        expiryDate,
        solutionConcentrationPct: parseFloat(solutionConcentrationPct) || 2.0,
        exposureTimeMinutes: parseInt(exposureTimeMinutes, 10) || 30,
      },
      crateAudit: {
        cratesCount: parseInt(cratesCount, 10) || 45,
        cratesCleanAndDisinfected,
        beddingType,
        technicalIntegrityOk,
        densityCompliant,
      },
      checklist: {
        entranceDisinfectionMatsActive,
        surfacesAndTablesSanitized,
        ventilationOperational,
        rodentAndWildBirdShielded,
        handSanitationAvailable,
        cleanWaterSourceAvailable,
      },
      verdict,
      conditionalRequirements: conditionalRequirements.trim() || undefined,
      inspectorName,
      veterinarianName,
      sectionPresidentName,
      notes,
    }),
    [
      protocolNumber,
      inspectionDate,
      inspectionTime,
      raceName,
      stationName,
      stationAddress,
      defaultBranchNumber,
      defaultBranchName,
      productName,
      activeSubstance,
      batchNumber,
      expiryDate,
      solutionConcentrationPct,
      exposureTimeMinutes,
      cratesCount,
      cratesCleanAndDisinfected,
      beddingType,
      technicalIntegrityOk,
      densityCompliant,
      entranceDisinfectionMatsActive,
      surfacesAndTablesSanitized,
      ventilationOperational,
      rodentAndWildBirdShielded,
      handSanitationAvailable,
      cleanWaterSourceAvailable,
      verdict,
      conditionalRequirements,
      inspectorName,
      veterinarianName,
      sectionPresidentName,
      notes,
    ]
  );

  const sanitationResult = useMemo(
    () => calculateSanitationScore(protocolData),
    [protocolData]
  );

  const handleSave = () => {
    const val = validateBasketingStationSanitation(protocolData);
    if (!val.isValid) {
      Alert.alert('Błędy atestacji', val.errors.join('\n'));
      return;
    }

    if (onProtocolSaved) {
      onProtocolSaved(protocolData);
    }

    Alert.alert(
      'Zatwierdzono Protokół Sanitarny',
      `Punkt wkładań "${protocolData.stationName}" otrzymał orzeczenie:\n${VERDICT_LABELS[protocolData.verdict]}.\nWskaźnik bioasekuracji: ${sanitationResult.score}%.`
    );
  };

  const handlePrint = async () => {
    try {
      const html = generateBasketingStationSanitationHtml(protocolData);
      await PdfService.printHtml(html);
    } catch (e: any) {
      Alert.alert('Błąd drukowania', e?.message || 'Nie udało się wydrukować protokołu.');
    }
  };

  const handleShare = async () => {
    try {
      const html = generateBasketingStationSanitationHtml(protocolData);
      await PdfService.shareHtmlAsPdf(
        html,
        `Atestacja-Sanitarna-${protocolData.protocolNumber.replace(/\//g, '_')}`
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
            <Text style={styles.headerTitle}>ATESTACJA SANITARNA PUNKTU KOSZOWANIA</Text>
            <Text style={styles.headerSubtitle}>
              Procedura Bioasekuracji PIW & Odkażanie Klatek PZHGP (Z-092)
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            testID="btn-close-sanitation-modal"
          >
            <Text style={styles.closeButtonText}>✕ Zamknij</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Score & Verdict Banner */}
          <View
            style={[
              styles.verdictBanner,
              verdict === 'approved_full'
                ? styles.bannerApproved
                : verdict === 'approved_conditional'
                ? styles.bannerConditional
                : styles.bannerRejected,
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.verdictTitle,
                  verdict === 'approved_full'
                    ? styles.textGreen
                    : verdict === 'approved_conditional'
                    ? styles.textAmber
                    : styles.textRed,
                ]}
              >
                {VERDICT_LABELS[verdict]}
              </Text>
              <Text style={styles.verdictSub}>
                {stationName} • {raceName}
              </Text>
            </View>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreBadgeVal}>{sanitationResult.score}%</Text>
              <Text style={styles.scoreBadgeLbl}>Zgodność</Text>
            </View>
          </View>

          {/* Critical Issues if any */}
          {sanitationResult.criticalIssues.length > 0 && (
            <View style={styles.issuesBox}>
              <Text style={styles.issuesTitle}>⚠️ WYKRYTE UCHYBIENIA SANITARNE:</Text>
              {sanitationResult.criticalIssues.map((issue, idx) => (
                <Text key={idx} style={styles.issueText}>
                  • {issue}
                </Text>
              ))}
            </View>
          )}

          {/* Section Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'station' && styles.tabActive]}
              onPress={() => setActiveTab('station')}
              testID="tab-sanitation-station"
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'station' && styles.tabTextActive,
                ]}
              >
                1. Punkt & Środek
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'crates' && styles.tabActive]}
              onPress={() => setActiveTab('crates')}
              testID="tab-sanitation-crates"
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'crates' && styles.tabTextActive,
                ]}
              >
                2. Klatki ({cratesCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'checklist' && styles.tabActive]}
              onPress={() => setActiveTab('checklist')}
              testID="tab-sanitation-checklist"
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'checklist' && styles.tabTextActive,
                ]}
              >
                3. Bioasekuracja Sali
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: STATION & DISINFECTANT */}
          {activeTab === 'station' && (
            <View>
              {/* Station Card */}
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>DANE PUNKTU WKŁADAŃ I LOTU</Text>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Numer Protokołu:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={protocolNumber}
                      onChangeText={setProtocolNumber}
                      placeholder="AT-SAN-2026/009"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Data Kontroli:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={inspectionDate}
                      onChangeText={setInspectionDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nazwa Punktu Wkładań:</Text>
                  <TextInput
                    style={[styles.textInput, styles.highlightInput]}
                    value={stationName}
                    onChangeText={setStationName}
                    placeholder="np. Punkt Wkładań Sekcja 1"
                    placeholderTextColor="#64748B"
                    testID="input-sanitation-station-name"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Adres Punktu:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={stationAddress}
                    onChangeText={setStationAddress}
                    placeholder="np. ul. Rolna 24, Poznań"
                    placeholderTextColor="#64748B"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Lot Konkursowy:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={raceName}
                    onChangeText={setRaceName}
                    placeholder="np. Lot nr 3 — Nowa Sól"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>

              {/* Disinfectant Card */}
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>PREPARAT BIOBÓJCZY / DEZYNFEKCYJNY</Text>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Nazwa Handlowa:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={productName}
                      onChangeText={setProductName}
                      placeholder="Virkon S / Ecocid"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Numer Partii (LOT):</Text>
                    <TextInput
                      style={styles.textInput}
                      value={batchNumber}
                      onChangeText={setBatchNumber}
                      placeholder="LOT-2026/03V"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Stężenie Roztworu (%):</Text>
                    <TextInput
                      style={styles.textInput}
                      value={solutionConcentrationPct}
                      onChangeText={setSolutionConcentrationPct}
                      keyboardType="numeric"
                      placeholder="2.0"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Czas Ekspozycji (min):</Text>
                    <TextInput
                      style={styles.textInput}
                      value={exposureTimeMinutes}
                      onChangeText={setExposureTimeMinutes}
                      keyboardType="numeric"
                      placeholder="30"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* TAB 2: CRATES */}
          {activeTab === 'crates' && (
            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>ATESTACJA KLATEK TRANSPORTOWYCH</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Liczba Klatek Koszowych:</Text>
                <TextInput
                  style={styles.textInput}
                  value={cratesCount}
                  onChangeText={setCratesCount}
                  keyboardType="numeric"
                  placeholder="45"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>
                  Czystość rusztów i dezynfekcja opryskowa:
                </Text>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    cratesCleanAndDisinfected && styles.toggleBtnActive,
                  ]}
                  onPress={() => setCratesCleanAndDisinfected(!cratesCleanAndDisinfected)}
                >
                  <Text style={styles.toggleBtnText}>
                    {cratesCleanAndDisinfected ? '✓ SPEŁNIONO' : '✕ BRAK'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>
                  Stan techniczny (brak ostrych drutów, sprawne zamki):
                </Text>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    technicalIntegrityOk && styles.toggleBtnActive,
                  ]}
                  onPress={() => setTechnicalIntegrityOk(!technicalIntegrityOk)}
                >
                  <Text style={styles.toggleBtnText}>
                    {technicalIntegrityOk ? '✓ BEZPIECZNE' : '✕ USZKODZONE'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>
                  Norma zagęszczenia FCI (min. 200 cm²/ptaka):
                </Text>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    densityCompliant && styles.toggleBtnActive,
                  ]}
                  onPress={() => setDensityCompliant(!densityCompliant)}
                >
                  <Text style={styles.toggleBtnText}>
                    {densityCompliant ? '✓ ZGODNA' : '✕ PRZEKROCZONA'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Rodzaj Ściółki w Klatkach:</Text>
                <View style={styles.beddingSelector}>
                  {(
                    [
                      { id: 'corrugated_cardboard', lbl: 'Tektura falista' },
                      { id: 'dustless_wood_shavings', lbl: 'Wióry odpylone' },
                      { id: 'paper_mats', lbl: 'Maty papierowe' },
                    ] as const
                  ).map((b) => (
                    <TouchableOpacity
                      key={b.id}
                      style={[
                        styles.beddingChoice,
                        beddingType === b.id && styles.beddingChoiceActive,
                      ]}
                      onPress={() => setBeddingType(b.id)}
                    >
                      <Text
                        style={[
                          styles.beddingChoiceText,
                          beddingType === b.id && styles.beddingChoiceTextActive,
                        ]}
                      >
                        {b.lbl}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* TAB 3: CHECKLIST & VERDICT */}
          {activeTab === 'checklist' && (
            <View>
              {/* Checklist Card */}
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>LISTA KONTROLNA BIOASEKURACJI SALI</Text>

                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>
                    Aktywne maty dezynfekcyjne przy drzwiach:
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      entranceDisinfectionMatsActive && styles.toggleBtnActive,
                    ]}
                    onPress={() =>
                      setEntranceDisinfectionMatsActive(!entranceDisinfectionMatsActive)
                    }
                  >
                    <Text style={styles.toggleBtnText}>
                      {entranceDisinfectionMatsActive ? '✓ ZALANE' : '✕ BRAK'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>
                    Stoły wkładaniowe i posadzka odkażone:
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      surfacesAndTablesSanitized && styles.toggleBtnActive,
                    ]}
                    onPress={() =>
                      setSurfacesAndTablesSanitized(!surfacesAndTablesSanitized)
                    }
                  >
                    <Text style={styles.toggleBtnText}>
                      {surfacesAndTablesSanitized ? '✓ CZYSTE' : '✕ BRAK'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>
                    Wentylacja nawiewno-wywiewna sprawna:
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      ventilationOperational && styles.toggleBtnActive,
                    ]}
                    onPress={() => setVentilationOperational(!ventilationOperational)}
                  >
                    <Text style={styles.toggleBtnText}>
                      {ventilationOperational ? '✓ SPRAWNA' : '✕ BRAK'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>
                    Brak gryzoni i dzikich ptaków (siatki w oknach):
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      rodentAndWildBirdShielded && styles.toggleBtnActive,
                    ]}
                    onPress={() =>
                      setRodentAndWildBirdShielded(!rodentAndWildBirdShielded)
                    }
                  >
                    <Text style={styles.toggleBtnText}>
                      {rodentAndWildBirdShielded ? '✓ BEZPIECZNIE' : '✕ BRAK'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>
                    Dozowniki do dezynfekcji rąk komisji:
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      handSanitationAvailable && styles.toggleBtnActive,
                    ]}
                    onPress={() => setHandSanitationAvailable(!handSanitationAvailable)}
                  >
                    <Text style={styles.toggleBtnText}>
                      {handSanitationAvailable ? '✓ DOSTĘPNE' : '✕ BRAK'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>
                    Bieżące źródło zdatnej wody pitnej:
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      cleanWaterSourceAvailable && styles.toggleBtnActive,
                    ]}
                    onPress={() =>
                      setCleanWaterSourceAvailable(!cleanWaterSourceAvailable)
                    }
                  >
                    <Text style={styles.toggleBtnText}>
                      {cleanWaterSourceAvailable ? '✓ DOSTĘPNE' : '✕ BRAK'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Verdict Card */}
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>ORZECZENIE KOMISJI SANITARNEJ</Text>

                <View style={styles.verdictSelector}>
                  {(
                    [
                      { id: 'approved_full', lbl: '1. Dopuszczony bez zastrzeżeń' },
                      { id: 'approved_conditional', lbl: '2. Dopuszczony warunkowo' },
                      { id: 'rejected', lbl: '3. Zakaz koszowania (Odrzucony)' },
                    ] as const
                  ).map((v) => (
                    <TouchableOpacity
                      key={v.id}
                      style={[
                        styles.verdictChoice,
                        verdict === v.id && styles.verdictChoiceActive,
                      ]}
                      onPress={() => setVerdict(v.id)}
                    >
                      <Text
                        style={[
                          styles.verdictChoiceText,
                          verdict === v.id && styles.verdictChoiceTextActive,
                        ]}
                      >
                        {v.lbl}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {verdict === 'approved_conditional' && (
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: '#f59e0b' }]}>
                      Wymagane Zalecenia Natychmiastowe:
                    </Text>
                    <TextInput
                      style={[styles.textInput, { borderColor: '#f59e0b' }]}
                      value={conditionalRequirements}
                      onChangeText={setConditionalRequirements}
                      placeholder="Wpisz nakazane czynności naprawcze przed wpuszczeniem ptaków..."
                      placeholderTextColor="#64748B"
                    />
                  </View>
                )}

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Delegat Bioasekuracji:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={inspectorName}
                      onChangeText={setInspectorName}
                      placeholder="Marek Wiśniewski"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Lekarz Weterynarii:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={veterinarianName}
                      onChangeText={setVeterinarianName}
                      placeholder="Lek. wet. Janusz Ptasiński"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Action Save Button */}
          <FieldButton
            title="🛡️ Zatwierdź Atestację Sanitarną Punktu"
            onPress={handleSave}
            style={styles.saveButton}
            testID="btn-save-sanitation-protocol"
          />

          {/* Print & Share PDF Buttons */}
          <View style={styles.exportRow}>
            <FieldButton
              title="🖨️ AirPrint Protokół"
              variant="secondary"
              onPress={handlePrint}
              style={{ flex: 1, marginRight: 8 }}
              testID="btn-print-sanitation-protocol"
            />
            <FieldButton
              title="📤 Udostępnij PDF (PIW)"
              variant="secondary"
              onPress={handleShare}
              style={{ flex: 1 }}
              testID="btn-share-sanitation-protocol"
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
    color: '#16a34a',
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
  verdictBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1.5,
  },
  bannerApproved: {
    backgroundColor: '#14291e',
    borderColor: '#16a34a',
  },
  bannerConditional: {
    backgroundColor: '#2e2311',
    borderColor: '#f59e0b',
  },
  bannerRejected: {
    backgroundColor: '#2b1316',
    borderColor: '#dc2626',
  },
  verdictTitle: {
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 3,
  },
  verdictSub: {
    fontSize: 10,
    color: '#D4D8E0',
  },
  scoreBadge: {
    alignItems: 'center',
    backgroundColor: '#14171D',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginLeft: 8,
  },
  scoreBadgeVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  scoreBadgeLbl: {
    fontSize: 8,
    color: '#8E94A0',
  },
  textGreen: {
    color: '#4ade80',
  },
  textAmber: {
    color: '#fbbf24',
  },
  textRed: {
    color: '#f87171',
  },
  issuesBox: {
    backgroundColor: '#381619',
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  issuesTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#f87171',
    marginBottom: 4,
  },
  issueText: {
    fontSize: 9,
    color: '#fca5a5',
    lineHeight: 13,
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
    borderColor: '#16a34a',
    backgroundColor: '#14291e',
  },
  tabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E94A0',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#4ade80',
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
    borderColor: '#16a34a',
    color: '#4ade80',
    fontWeight: '800',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 10,
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
  beddingSelector: {
    flexDirection: 'row',
    gap: 6,
  },
  beddingChoice: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#14171D',
    borderWidth: 1,
    borderColor: '#2F343F',
    borderRadius: 8,
    padding: 4,
  },
  beddingChoiceActive: {
    borderColor: '#16a34a',
    backgroundColor: '#14291e',
  },
  beddingChoiceText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E94A0',
    textAlign: 'center',
  },
  beddingChoiceTextActive: {
    color: '#4ade80',
  },
  verdictSelector: {
    gap: 8,
    marginBottom: 12,
  },
  verdictChoice: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#14171D',
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  verdictChoiceActive: {
    borderColor: '#16a34a',
    backgroundColor: '#14291e',
  },
  verdictChoiceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E94A0',
  },
  verdictChoiceTextActive: {
    color: '#4ade80',
    fontWeight: '800',
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 12,
    minHeight: 52,
    backgroundColor: '#166534',
  },
  exportRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
});

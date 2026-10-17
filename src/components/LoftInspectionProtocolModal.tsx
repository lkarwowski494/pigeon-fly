/**
 * PIGEON-FLY — Loft Inspection & Unannounced Visitation Modal (Z-087 / DEC-101)
 * Field Mode ergonomic interface (>= 48-56pt touch targets), dark theme (#121417).
 * Official PZHGP Anti-fraud inspection, headcount check, and electronic seal audit.
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
  LoftInspectionData,
  InspectionType,
  PigeonPhysicalCheck,
  evaluateLoftInspection,
  generateLoftInspectionProtocolHtml,
} from '../domain/loftInspectionProtocol';
import { PdfService } from '../services/pdfService';
import { FieldButton } from './FieldButton';

interface LoftInspectionProtocolModalProps {
  visible: boolean;
  onClose: () => void;
  defaultBreederName?: string;
  defaultBranchName?: string;
  defaultSectionName?: string;
}

export const LoftInspectionProtocolModal: React.FC<LoftInspectionProtocolModalProps> = ({
  visible,
  onClose,
  defaultBreederName = 'Stanisław Kowalczyk',
  defaultBranchName = '0284 Nowy Tomyśl',
  defaultSectionName = 'Sekcja 02 Buk',
}) => {
  // Protocol Meta
  const [protocolNumber, setProtocolNumber] = useState('KONTROLA/0284/2026/007');
  const [inspectionDate, setInspectionDate] = useState('2026-05-24');
  const [inspectionTime, setInspectionTime] = useState('14:30');
  const [inspectionType, setInspectionType] = useState<InspectionType>('unannounced_race_day');

  // Breeder info
  const [breederName, setBreederName] = useState(defaultBreederName);
  const [breederPzhgpNumber, setBreederPzhgpNumber] = useState('PL-0284-1802');
  const [loftAddress, setLoftAddress] = useState('ul. Ogrodowa 14, 64-320 Buk');
  const [loftLatitude, setLoftLatitude] = useState(52.35512);
  const [loftLongitude, setLoftLongitude] = useState(16.51842);

  // Headcount & Census
  const [declaredBirdsCount, setDeclaredBirdsCount] = useState(68);
  const [actualBirdsCount, setActualBirdsCount] = useState(68);
  const [foreignBirdsDetectedCount, setForeignBirdsDetectedCount] = useState(0);

  // Security & Hardware Checklist
  const [gpsCoordinatesMatch, setGpsCoordinatesMatch] = useState(true);
  const [eskAntennaPadsTamperFree, setEskAntennaPadsTamperFree] = useState(true);
  const [sealsIntact, setSealsIntact] = useState(true);
  const [trapGatesFunctioning, setTrapGatesFunctioning] = useState(true);
  const [loftHygieneSatisfactory, setLoftHygieneSatisfactory] = useState(true);
  const [freeFlightObservations, setFreeFlightObservations] = useState(
    'Oblot poranny w normie, stado zsynchronizowane.'
  );

  // Sampled Pigeons Check
  const [sampledBirds, setSampledBirds] = useState<PigeonPhysicalCheck[]>([
    {
      id: 'p-1',
      ringNumber: 'PL-0284-23-4412',
      sex: 'cock',
      plumageColor: 'Niebieska',
      chipBandSerial: 'CHIP-99014',
      ringCondition: 'flawless',
      inLoftVerified: true,
    },
    {
      id: 'p-2',
      ringNumber: 'PL-0284-24-1108',
      sex: 'hen',
      plumageColor: 'Ciemno-nakrapiana',
      chipBandSerial: 'CHIP-44120',
      ringCondition: 'flawless',
      inLoftVerified: true,
    },
  ]);

  // Commission & Verdict
  const [commissionMember1, setCommissionMember1] = useState('Janusz Woźniak');
  const [commissionMember2, setCommissionMember2] = useState('Marek Szymański');
  const [commissionPresident, setCommissionPresident] = useState('Tadeusz Lewandowski');
  const [commissionVerdict, setCommissionVerdict] = useState<
    'full_compliance' | 'minor_irregularity' | 'severe_violation'
  >('full_compliance');
  const [commissionObservations, setCommissionObservations] = useState(
    'Gołębnik w pełni zabezpieczony. Brak zastrzeżeń do instalacji ESK.'
  );

  // Active view tab: 'checklist' | 'pigeons' | 'verdict'
  const [activeTab, setActiveTab] = useState<'checklist' | 'pigeons' | 'verdict'>('checklist');

  const inspectionData: LoftInspectionData = useMemo(
    () => ({
      protocolNumber,
      inspectionDate,
      inspectionTime,
      inspectionType,
      breederName,
      breederPzhgpNumber,
      branchName: defaultBranchName,
      sectionName: defaultSectionName,
      loftAddress,
      loftLatitude,
      loftLongitude,
      declaredBirdsCount,
      actualBirdsCount,
      foreignBirdsDetectedCount,
      gpsCoordinatesMatch,
      eskAntennaPadsTamperFree,
      sealsIntact,
      trapGatesFunctioning,
      loftHygieneSatisfactory,
      freeFlightObservations,
      sampledBirds,
      commissionMember1,
      commissionMember2,
      commissionPresident,
      commissionVerdict,
      commissionObservations,
    }),
    [
      protocolNumber,
      inspectionDate,
      inspectionTime,
      inspectionType,
      breederName,
      breederPzhgpNumber,
      defaultBranchName,
      defaultSectionName,
      loftAddress,
      loftLatitude,
      loftLongitude,
      declaredBirdsCount,
      actualBirdsCount,
      foreignBirdsDetectedCount,
      gpsCoordinatesMatch,
      eskAntennaPadsTamperFree,
      sealsIntact,
      trapGatesFunctioning,
      loftHygieneSatisfactory,
      freeFlightObservations,
      sampledBirds,
      commissionMember1,
      commissionMember2,
      commissionPresident,
      commissionVerdict,
      commissionObservations,
    ]
  );

  const evaluation = useMemo(() => {
    return evaluateLoftInspection(inspectionData);
  }, [inspectionData]);

  const handleAddSampledBird = () => {
    const nextIdx = sampledBirds.length + 1;
    const newBird: PigeonPhysicalCheck = {
      id: `p-${Date.now()}`,
      ringNumber: `PL-0284-25-${3000 + nextIdx}`,
      sex: nextIdx % 2 === 0 ? 'hen' : 'cock',
      plumageColor: 'Niebieski nakrapiany',
      chipBandSerial: `CHIP-${50000 + nextIdx}`,
      ringCondition: 'flawless',
      inLoftVerified: true,
    };
    setSampledBirds([...sampledBirds, newBird]);
  };

  const handleRemoveSampledBird = (id: string) => {
    if (sampledBirds.length <= 1) {
      Alert.alert('Błąd', 'Protokół wymaga kontroli fizycznej co najmniej 1 ptaka.');
      return;
    }
    setSampledBirds(sampledBirds.filter((b) => b.id !== id));
  };

  const handlePrint = async () => {
    try {
      const html = generateLoftInspectionProtocolHtml(inspectionData);
      await PdfService.printHtml(html);
    } catch {
      Alert.alert('Błąd wydruku', 'Nie udało się zainicjować wydruku protokołu kontroli.');
    }
  };

  const handleShare = async () => {
    try {
      const html = generateLoftInspectionProtocolHtml(inspectionData);
      await PdfService.shareHtmlAsPdf(
        html,
        `Protokol_Kontroli_Golebnika_${breederName.replace(/\s+/g, '_')}.pdf`
      );
    } catch {
      Alert.alert('Błąd eksportu', 'Nie udało się wyeksportować protokołu do PDF.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>🕵️ Protokół Kontroli Gołębnika</Text>
            <Text style={styles.headerSubtitle}>
              Niezapowiedziana Wizytacja PZHGP (Z-087 / DEC-101)
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Zamknij protokół kontroli"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Verdict Banner */}
          <View style={[styles.verdictCard, { borderColor: evaluation.verdictColor }]}>
            <View style={styles.verdictTopRow}>
              <View style={[styles.verdictPill, { backgroundColor: evaluation.verdictColor + '25' }]}>
                <Text style={[styles.verdictText, { color: evaluation.verdictColor }]}>
                  {evaluation.verdictLabel}
                </Text>
              </View>
              <Text style={styles.verdictScore}>{evaluation.conformityScorePct}% zgodności</Text>
            </View>
            <Text style={styles.verdictSub}>
              {evaluation.isCompliant
                ? 'Gołębnik i stado lotników spełniają rygory Regulaminu Lotowo-Zegarowego PZHGP.'
                : evaluation.errors[0] || 'Wykryto naruszenia podlegające Sądowi Koleżeńskiemu.'}
            </Text>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'checklist' && styles.tabBtnActive]}
              onPress={() => setActiveTab('checklist')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'checklist' && styles.tabBtnTextActive,
                ]}
              >
                📋 Audyt i Spis
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'pigeons' && styles.tabBtnActive]}
              onPress={() => setActiveTab('pigeons')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'pigeons' && styles.tabBtnTextActive,
                ]}
              >
                🕊️ Ptaki ({sampledBirds.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'verdict' && styles.tabBtnActive]}
              onPress={() => setActiveTab('verdict')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'verdict' && styles.tabBtnTextActive,
                ]}
              >
                ⚖️ Werdykt Komisji
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab 1: Checklist & Census */}
          {activeTab === 'checklist' && (
            <View style={styles.tabSection}>
              {/* Inspection Type */}
              <Text style={styles.sectionTitle}>TRYB I OKOLICZNOŚCI KONTROLI</Text>
              <View style={styles.typeGrid}>
                {(
                  [
                    'unannounced_race_day',
                    'pre_season_census',
                    'routine_integrity_audit',
                    'post_protest_verification',
                  ] as InspectionType[]
                ).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeBtn, inspectionType === t && styles.typeBtnActive]}
                    onPress={() => setInspectionType(t)}
                  >
                    <Text
                      style={[
                        styles.typeBtnText,
                        inspectionType === t && styles.typeBtnTextActive,
                      ]}
                    >
                      {t === 'unannounced_race_day' && '⏱️ Dzień Lotu'}
                      {t === 'pre_season_census' && '📜 Przedsezonowy'}
                      {t === 'routine_integrity_audit' && '🔍 Rutynowa'}
                      {t === 'post_protest_verification' && '⚖️ Po Proteście'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Headcount Card */}
              <View style={styles.card}>
                <Text style={styles.cardHeaderTitle}>SPIS STADA I STAN LICZBOWY</Text>
                <View style={styles.stepperRow}>
                  <View style={styles.stepperLabelCol}>
                    <Text style={styles.stepperLabel}>Stan ze Spisu (Deklarowany):</Text>
                    <Text style={styles.stepperSub}>{declaredBirdsCount} ptaków</Text>
                  </View>
                  <View style={styles.stepperControls}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setDeclaredBirdsCount((prev) => Math.max(10, prev - 2))}
                    >
                      <Text style={styles.stepBtnText}>-2</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setDeclaredBirdsCount((prev) => Math.min(200, prev + 2))}
                    >
                      <Text style={styles.stepBtnText}>+2</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.stepperRow}>
                  <View style={styles.stepperLabelCol}>
                    <Text style={styles.stepperLabel}>Stan Stwierdzony w Gołębniku:</Text>
                    <Text
                      style={[
                        styles.stepperSub,
                        {
                          color:
                            actualBirdsCount === declaredBirdsCount
                              ? '#10B981'
                              : '#F59E0B',
                        },
                      ]}
                    >
                      {actualBirdsCount} ptaków (Różnica:{' '}
                      {actualBirdsCount - declaredBirdsCount})
                    </Text>
                  </View>
                  <View style={styles.stepperControls}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setActualBirdsCount((prev) => Math.max(10, prev - 2))}
                    >
                      <Text style={styles.stepBtnText}>-2</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setActualBirdsCount((prev) => Math.min(200, prev + 2))}
                    >
                      <Text style={styles.stepBtnText}>+2</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.stepperRow, { borderBottomWidth: 0 }]}>
                  <View style={styles.stepperLabelCol}>
                    <Text style={styles.stepperLabel}>Obce Gołębie w Celach:</Text>
                    <Text
                      style={[
                        styles.stepperSub,
                        {
                          color:
                            foreignBirdsDetectedCount === 0 ? '#10B981' : '#EF4444',
                        },
                      ]}
                    >
                      {foreignBirdsDetectedCount} sztuk
                    </Text>
                  </View>
                  <View style={styles.stepperControls}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setForeignBirdsDetectedCount((prev) => Math.max(0, prev - 1))}
                    >
                      <Text style={styles.stepBtnText}>-1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setForeignBirdsDetectedCount((prev) => Math.min(10, prev + 1))}
                    >
                      <Text style={styles.stepBtnText}>+1</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Hardware Security Checklist */}
              <View style={styles.card}>
                <Text style={styles.cardHeaderTitle}>AUDYT ZABEZPIECZEŃ I INSTALACJI ESK</Text>

                <View style={styles.toggleRowItem}>
                  <Text style={styles.toggleLabel}>Zgodność Współrzędnych GPS (WGS-84):</Text>
                  <TouchableOpacity
                    style={[
                      styles.statusToggleBtn,
                      gpsCoordinatesMatch ? styles.btnGreen : styles.btnRed,
                    ]}
                    onPress={() => setGpsCoordinatesMatch(!gpsCoordinatesMatch)}
                  >
                    <Text style={styles.statusToggleText}>
                      {gpsCoordinatesMatch ? 'ZGODNE' : 'NIEZGODNE'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.toggleRowItem}>
                  <Text style={styles.toggleLabel}>Anteny ESK Nienaruszone (brak przemieszczeń):</Text>
                  <TouchableOpacity
                    style={[
                      styles.statusToggleBtn,
                      eskAntennaPadsTamperFree ? styles.btnGreen : styles.btnRed,
                    ]}
                    onPress={() => setEskAntennaPadsTamperFree(!eskAntennaPadsTamperFree)}
                  >
                    <Text style={styles.statusToggleText}>
                      {eskAntennaPadsTamperFree ? 'NIENARUSZONE' : 'MANIPULACJA'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.toggleRowItem}>
                  <Text style={styles.toggleLabel}>Plomby Bazy i Puszek Zegarowych:</Text>
                  <TouchableOpacity
                    style={[
                      styles.statusToggleBtn,
                      sealsIntact ? styles.btnGreen : styles.btnRed,
                    ]}
                    onPress={() => setSealsIntact(!sealsIntact)}
                  >
                    <Text style={styles.statusToggleText}>
                      {sealsIntact ? 'NIENARUSZONE' : 'ZERWANA PLOMBA'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.toggleRowItem}>
                  <Text style={styles.toggleLabel}>Zapadnie i Wloty Sputnik (brak obejścia):</Text>
                  <TouchableOpacity
                    style={[
                      styles.statusToggleBtn,
                      trapGatesFunctioning ? styles.btnGreen : styles.btnRed,
                    ]}
                    onPress={() => setTrapGatesFunctioning(!trapGatesFunctioning)}
                  >
                    <Text style={styles.statusToggleText}>
                      {trapGatesFunctioning ? 'SPRAWNE' : 'NIESPRAWNE'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.toggleRowItem, { borderBottomWidth: 0 }]}>
                  <Text style={styles.toggleLabel}>Stan Zoohigieniczny i Dobrostan:</Text>
                  <TouchableOpacity
                    style={[
                      styles.statusToggleBtn,
                      loftHygieneSatisfactory ? styles.btnGreen : styles.btnAmber,
                    ]}
                    onPress={() => setLoftHygieneSatisfactory(!loftHygieneSatisfactory)}
                  >
                    <Text style={styles.statusToggleText}>
                      {loftHygieneSatisfactory ? 'PRAWIDŁOWY' : 'ZSTRZEŻENIA'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Tab 2: Sampled Birds */}
          {activeTab === 'pigeons' && (
            <View style={styles.tabSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>KONTROLA FIZYCZNA WYTYPOWANYCH PTAKÓW</Text>
                <TouchableOpacity style={styles.addBtn} onPress={handleAddSampledBird}>
                  <Text style={styles.addBtnText}>+ Dodaj Ptaka</Text>
                </TouchableOpacity>
              </View>

              {sampledBirds.map((b, idx) => (
                <View key={b.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardHeaderTitle}>
                      Ptak #{idx + 1} — {b.ringNumber}
                    </Text>
                    {sampledBirds.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => handleRemoveSampledBird(b.id)}
                      >
                        <Text style={styles.removeBtnText}>Usuń</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Obrączka Rodowa:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={b.ringNumber}
                      onChangeText={(val) => {
                        setSampledBirds((prev) =>
                          prev.map((item) => (item.id === b.id ? { ...item, ringNumber: val } : item))
                        );
                      }}
                      placeholder="Nr obrączki..."
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Płeć / Barwa:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={`${b.sex === 'cock' ? '1.0' : '0.1'} • ${b.plumageColor}`}
                      onChangeText={(val) => {
                        setSampledBirds((prev) =>
                          prev.map((item) => (item.id === b.id ? { ...item, plumageColor: val } : item))
                        );
                      }}
                      placeholder="Barwa..."
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Chip Elektroniczny ESK:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={b.chipBandSerial}
                      onChangeText={(val) => {
                        setSampledBirds((prev) =>
                          prev.map((item) => (item.id === b.id ? { ...item, chipBandSerial: val } : item))
                        );
                      }}
                      placeholder="Nr chipa..."
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  {/* Ring Condition & Presence Toggles */}
                  <View style={styles.toggleRowItem}>
                    <Text style={styles.toggleLabel}>Stan Obrączki Rodowej:</Text>
                    <TouchableOpacity
                      style={[
                        styles.statusToggleBtn,
                        b.ringCondition === 'flawless'
                          ? styles.btnGreen
                          : b.ringCondition === 'worn_legible'
                          ? styles.btnAmber
                          : styles.btnRed,
                      ]}
                      onPress={() => {
                        setSampledBirds((prev) =>
                          prev.map((item) => {
                            if (item.id !== b.id) return item;
                            const next =
                              item.ringCondition === 'flawless'
                                ? 'worn_legible'
                                : item.ringCondition === 'worn_legible'
                                ? 'suspicious_tamper'
                                : 'flawless';
                            return { ...item, ringCondition: next };
                          })
                        );
                      }}
                    >
                      <Text style={styles.statusToggleText}>
                        {b.ringCondition === 'flawless'
                          ? 'BEZ ZARZUTU'
                          : b.ringCondition === 'worn_legible'
                          ? 'CZYTELNA'
                          : 'PODEJRZANA!'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.toggleRowItem, { borderBottomWidth: 0 }]}>
                    <Text style={styles.toggleLabel}>Obecność w Gołębniku:</Text>
                    <TouchableOpacity
                      style={[
                        styles.statusToggleBtn,
                        b.inLoftVerified ? styles.btnGreen : styles.btnRed,
                      ]}
                      onPress={() => {
                        setSampledBirds((prev) =>
                          prev.map((item) =>
                            item.id === b.id ? { ...item, inLoftVerified: !item.inLoftVerified } : item
                          )
                        );
                      }}
                    >
                      <Text style={styles.statusToggleText}>
                        {b.inLoftVerified ? 'OBECNY' : 'BRAK PTAKA'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Tab 3: Commission & Verdict */}
          {activeTab === 'verdict' && (
            <View style={styles.tabSection}>
              <View style={styles.card}>
                <Text style={styles.cardHeaderTitle}>ORZECZENIE KOMISJI LOTOWEJ</Text>

                <View style={styles.typeGrid}>
                  {(
                    [
                      'full_compliance',
                      'minor_irregularity',
                      'severe_violation',
                    ] as const
                  ).map((v) => (
                    <TouchableOpacity
                      key={v}
                      style={[
                        styles.typeBtn,
                        commissionVerdict === v && styles.typeBtnActive,
                      ]}
                      onPress={() => setCommissionVerdict(v)}
                    >
                      <Text
                        style={[
                          styles.typeBtnText,
                          commissionVerdict === v && styles.typeBtnTextActive,
                        ]}
                      >
                        {v === 'full_compliance' && '✅ Pełna Zgodność'}
                        {v === 'minor_irregularity' && '⚠️ Drobne Uchybienia'}
                        {v === 'severe_violation' && '🚨 Naruszenie'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

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
                  <Text style={styles.cardLabel}>Przewodniczący Komisji:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={commissionPresident}
                    onChangeText={setCommissionPresident}
                    placeholder="Imię i nazwisko"
                    placeholderTextColor="#64748B"
                  />
                </View>
                <View style={[styles.cardRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.cardLabel}>Uwagi i Zalecenia:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={commissionObservations}
                    onChangeText={setCommissionObservations}
                    placeholder="Wpisz uwagi..."
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
  verdictCard: {
    backgroundColor: '#1A1D23',
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 16,
  },
  verdictTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  verdictPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verdictText: {
    fontSize: 11,
    fontWeight: '800',
  },
  verdictScore: {
    fontSize: 13,
    fontWeight: '900',
    color: '#F0F2F5',
  },
  verdictSub: {
    fontSize: 11,
    color: '#8A92A0',
    lineHeight: 16,
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
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8A92A0',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  typeBtn: {
    flex: 1,
    minWidth: '45%',
    height: 48,
    backgroundColor: '#1E2229',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2D333D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  typeBtnActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#0284C725',
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A92A0',
  },
  typeBtnTextActive: {
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
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#262A30',
  },
  stepperLabelCol: {
    flex: 1,
  },
  stepperLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  stepperSub: {
    fontSize: 12,
    color: '#38BDF8',
    marginTop: 2,
    fontWeight: '700',
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
    paddingHorizontal: 12,
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

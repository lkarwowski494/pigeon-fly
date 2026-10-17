/**
 * PIGEON-FLY — Rejestr Badań Genetycznych DNA & Parentage Verification Modal (Z-091 / DEC-105)
 * Field Mode ergonomic interface (>= 48-56pt touch targets), dark theme (#121417).
 * Manages ISAG STR microsatellite panel, parentage compatibility verification,
 * and performance endurance markers (LDHA lactate recycling, DRD4 stamina).
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
  StrLocus,
  LdhaGenotype,
  Drd4Genotype,
  DnaCertificateData,
  verifyParentage,
  evaluatePerformanceGenetics,
  generateDnaCertificateHtml,
  validateDnaCertificate,
} from '../domain/dnaProfileRegistry';
import { Sex } from '../domain/types';
import { PdfService } from '../services/pdfService';
import { FieldButton } from './FieldButton';

interface DnaProfileRegistryModalProps {
  visible: boolean;
  onClose: () => void;
  defaultLoftName?: string;
  defaultBreederName?: string;
  defaultBreederPzhgpNumber?: string;
  defaultRingNumber?: string;
  defaultSireRing?: string;
  defaultDamRing?: string;
  onSaveCertificate?: (data: DnaCertificateData) => void;
}

const DEFAULT_OFFSPRING_LOCI: StrLocus[] = [
  { name: 'PIGN04', allele1: 182, allele2: 194 },
  { name: 'PIGN12', allele1: 220, allele2: 228 },
  { name: 'PIGN15', allele1: 144, allele2: 152 },
  { name: 'PIGN26', allele1: 302, allele2: 310 },
  { name: 'PIGN57', allele1: 168, allele2: 174 },
  { name: 'PIGN69', allele1: 250, allele2: 256 },
  { name: 'PIGN73', allele1: 190, allele2: 198 },
  { name: 'PIGN82', allele1: 212, allele2: 218 },
];

const DEFAULT_SIRE_LOCI: StrLocus[] = [
  { name: 'PIGN04', allele1: 182, allele2: 188 },
  { name: 'PIGN12', allele1: 220, allele2: 224 },
  { name: 'PIGN15', allele1: 140, allele2: 144 },
  { name: 'PIGN26', allele1: 302, allele2: 308 },
  { name: 'PIGN57', allele1: 168, allele2: 170 },
  { name: 'PIGN69', allele1: 248, allele2: 250 },
  { name: 'PIGN73', allele1: 190, allele2: 194 },
  { name: 'PIGN82', allele1: 212, allele2: 220 },
];

const DEFAULT_DAM_LOCI: StrLocus[] = [
  { name: 'PIGN04', allele1: 194, allele2: 198 },
  { name: 'PIGN12', allele1: 228, allele2: 232 },
  { name: 'PIGN15', allele1: 152, allele2: 156 },
  { name: 'PIGN26', allele1: 310, allele2: 314 },
  { name: 'PIGN57', allele1: 174, allele2: 178 },
  { name: 'PIGN69', allele1: 256, allele2: 260 },
  { name: 'PIGN73', allele1: 198, allele2: 202 },
  { name: 'PIGN82', allele1: 218, allele2: 222 },
];

export const DnaProfileRegistryModal: React.FC<DnaProfileRegistryModalProps> = ({
  visible,
  onClose,
  defaultLoftName = 'Mistrzowski Gołębnik Poznań',
  defaultBreederName = 'Tomasz Nowak',
  defaultBreederPzhgpNumber = 'PL-0284-1102',
  defaultRingNumber = 'PL-0284-26-1401',
  defaultSireRing = 'PL-0284-21-9901',
  defaultDamRing = 'PL-0284-22-4410',
  onSaveCertificate,
}) => {
  // Meta
  const [certificateNumber, setCertificateNumber] = useState('DNA-2026-PL-8941');
  const [laboratoryName, setLaboratoryName] = useState('Laboklin Badania Genetyczne Weterynarii');
  const [issueDate, setIssueDate] = useState('2026-04-15');
  const [sampleDate, setSampleDate] = useState('2026-04-02');
  const [veterinarianName, setVeterinarianName] = useState('Lek. wet. Janusz Ptasiński');

  // Birds
  const [pigeonRing, setPigeonRing] = useState(defaultRingNumber);
  const [pigeonSex, setPigeonSex] = useState<Sex>('cock');
  const [pigeonColor, setPigeonColor] = useState('Niebieski nakrapiany');
  const [sireRing, setSireRing] = useState(defaultSireRing);
  const [damRing, setDamRing] = useState(defaultDamRing);

  // Performance Genotypes
  const [ldha, setLdha] = useState<LdhaGenotype>('A/A');
  const [drd4, setDrd4] = useState<Drd4Genotype>('T/T');

  // Loci
  const [offspringLoci, setOffspringLoci] = useState<StrLocus[]>(DEFAULT_OFFSPRING_LOCI);
  const [sireLoci, setSireLoci] = useState<StrLocus[]>(DEFAULT_SIRE_LOCI);
  const [damLoci, setDamLoci] = useState<StrLocus[]>(DEFAULT_DAM_LOCI);

  // Active View Tab: 'overview' | 'str' | 'performance'
  const [activeTab, setActiveTab] = useState<'overview' | 'str' | 'performance'>('overview');

  const verification = useMemo(
    () => verifyParentage(offspringLoci, sireLoci, damLoci),
    [offspringLoci, sireLoci, damLoci]
  );

  const performance = useMemo(
    () => evaluatePerformanceGenetics({ ldha, drd4 }),
    [ldha, drd4]
  );

  const certificateData: DnaCertificateData = useMemo(
    () => ({
      certificateNumber,
      laboratoryName,
      issueDate,
      sampleDate,
      veterinarianName,
      loftName: defaultLoftName,
      breederName: defaultBreederName,
      breederPzhgpNumber: defaultBreederPzhgpNumber,
      pigeonRing,
      pigeonSex,
      pigeonColor,
      sireRing,
      damRing,
      offspringLoci,
      sireLoci,
      damLoci,
      genotypes: { ldha, drd4 },
      verification,
      notes: 'Badanie laboratoryjne wykonane z próbki krwi obwodowej/piór.',
    }),
    [
      certificateNumber,
      laboratoryName,
      issueDate,
      sampleDate,
      veterinarianName,
      defaultLoftName,
      defaultBreederName,
      defaultBreederPzhgpNumber,
      pigeonRing,
      pigeonSex,
      pigeonColor,
      sireRing,
      damRing,
      offspringLoci,
      sireLoci,
      damLoci,
      ldha,
      drd4,
      verification,
    ]
  );

  const handleSave = () => {
    const val = validateDnaCertificate(certificateData);
    if (!val.isValid) {
      Alert.alert('Błędy certyfikatu', val.errors.join('\n'));
      return;
    }

    if (onSaveCertificate) {
      onSaveCertificate(certificateData);
    }

    Alert.alert(
      'Zapisano Profil DNA',
      `Certyfikat ${certificateData.certificateNumber} dla ptaka ${certificateData.pigeonRing} został pomyślnie zsynchronizowany z kartoteką rodowodową.\nWynik weryfikacji: ${verification.status === 'confirmed' ? '100% Zgodne' : 'Wykluczenie'}.`
    );
  };

  const handlePrint = async () => {
    try {
      const html = generateDnaCertificateHtml(certificateData);
      await PdfService.printHtml(html);
    } catch (e: any) {
      Alert.alert('Błąd drukowania', e?.message || 'Nie udało się wydrukować certyfikatu.');
    }
  };

  const handleShare = async () => {
    try {
      const html = generateDnaCertificateHtml(certificateData);
      await PdfService.shareHtmlAsPdf(
        html,
        `Certyfikat-DNA-${certificateData.pigeonRing}`
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
            <Text style={styles.headerTitle}>CERTYFIKAT DNA & PARENTAGE (ISAG)</Text>
            <Text style={styles.headerSubtitle}>
              Weryfikacja rodzicielstwa i markery wydolnościowe LDHA/DRD4 (Z-091)
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            testID="btn-close-dna-modal"
          >
            <Text style={styles.closeButtonText}>✕ Zamknij</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Verification Status Banner */}
          <View
            style={[
              styles.statusBanner,
              verification.status === 'confirmed'
                ? styles.bannerConfirmed
                : styles.bannerExcluded,
            ]}
          >
            <Text
              style={[
                styles.statusBannerTitle,
                verification.status === 'confirmed'
                  ? styles.textGreen
                  : styles.textRed,
              ]}
            >
              {verification.status === 'confirmed'
                ? '✓ POCHODZENIE W 100% POTWIERDZONE'
                : '✕ WYKLUCZENIE RODZICIELSKIE (BŁĄD W KRYCIU)'}
            </Text>
            <Text style={styles.statusBannerDesc}>{verification.summaryText}</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
              onPress={() => setActiveTab('overview')}
              testID="tab-dna-overview"
            >
              <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
                1. Ptak & Laboratorium
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'str' && styles.tabActive]}
              onPress={() => setActiveTab('str')}
              testID="tab-dna-str"
            >
              <Text style={[styles.tabText, activeTab === 'str' && styles.tabTextActive]}>
                2. Loci STR ({verification.testedLociCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'performance' && styles.tabActive]}
              onPress={() => setActiveTab('performance')}
              testID="tab-dna-performance"
            >
              <Text style={[styles.tabText, activeTab === 'performance' && styles.tabTextActive]}>
                3. Geny LDHA / DRD4
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <View>
              {/* Lab & Certificate Meta */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>DANE CERTYFIKATU I LABORATORIUM</Text>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Numer Certyfikatu:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={certificateNumber}
                      onChangeText={setCertificateNumber}
                      placeholder="DNA-2026-PL-8941"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Data Pobrania:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={sampleDate}
                      onChangeText={setSampleDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Laboratorium Genetyczne:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={laboratoryName}
                    onChangeText={setLaboratoryName}
                    placeholder="Laboklin / Genomia / PIW-PIB"
                    placeholderTextColor="#64748B"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Lekarz Weterynarii Pobierający:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={veterinarianName}
                    onChangeText={setVeterinarianName}
                    placeholder="Lek. wet. Janusz Ptasiński"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>

              {/* Bird & Parents Info */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>IDENTYFIKACJA BADANYCH PTAKÓW</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Obrączka Badanego Ptaka:</Text>
                  <TextInput
                    style={[styles.textInput, styles.highlightInput]}
                    value={pigeonRing}
                    onChangeText={setPigeonRing}
                    placeholder="PL-0284-26-1401"
                    placeholderTextColor="#64748B"
                    testID="input-dna-pigeon-ring"
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>1.0 Ojciec (Samiec):</Text>
                    <TextInput
                      style={styles.textInput}
                      value={sireRing}
                      onChangeText={setSireRing}
                      placeholder="PL-0284-21-9901"
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>0.1 Matka (Samica):</Text>
                    <TextInput
                      style={styles.textInput}
                      value={damRing}
                      onChangeText={setDamRing}
                      placeholder="PL-0284-22-4410"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* TAB 2: STR LOCI */}
          {activeTab === 'str' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>PANEL MIKROSATELITARNY STR (ISAG STANDARD)</Text>
              <Text style={styles.cardSubtitle}>
                Porównanie alleli potomka z ojcem i matką. Zgodność wymaga co najmniej 1 allelu wspólnego z każdym rodzicem.
              </Text>

              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 1.2 }]}>Locus</Text>
                <Text style={[styles.th, { flex: 1.5, textAlign: 'center' }]}>Młody</Text>
                <Text style={[styles.th, { flex: 1.5, textAlign: 'center' }]}>Ojciec ♂</Text>
                <Text style={[styles.th, { flex: 1.5, textAlign: 'center' }]}>Matka ♀</Text>
              </View>

              {verification.details.map((d) => (
                <View key={d.locus} style={styles.tableRow}>
                  <Text style={[styles.tdLocus, { flex: 1.2 }]}>{d.locus}</Text>
                  <Text style={[styles.tdOffspring, { flex: 1.5, textAlign: 'center' }]}>
                    {d.offspring[0]} / {d.offspring[1]}
                  </Text>
                  <View style={[styles.matchCell, { flex: 1.5 }]}>
                    <Text style={styles.tdParent}>
                      {d.sire ? `${d.sire[0]} / ${d.sire[1]}` : '—'}
                    </Text>
                    {d.sire && (
                      <Text style={d.sireMatch ? styles.badgeMatch : styles.badgeMismatch}>
                        {d.sireMatch ? '✓' : '✕'}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.matchCell, { flex: 1.5 }]}>
                    <Text style={styles.tdParent}>
                      {d.dam ? `${d.dam[0]} / ${d.dam[1]}` : '—'}
                    </Text>
                    {d.dam && (
                      <Text style={d.damMatch ? styles.badgeMatch : styles.badgeMismatch}>
                        {d.damMatch ? '✓' : '✕'}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* TAB 3: PERFORMANCE GENES */}
          {activeTab === 'performance' && (
            <View>
              {/* LDHA Card */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>1. DEHYDROGENAZA MLECZANOWA (LDHA)</Text>
                  <View style={styles.roundBadge}>
                    <Text style={styles.roundBadgeText}>ENERGIA</Text>
                  </View>
                </View>
                <Text style={styles.cardSubtitle}>
                  Gen kontrolujący kinetykę przekształcania mleczanu w energię podczas lotu.
                </Text>

                <View style={styles.genotypeSelector}>
                  {(['A/A', 'A/B', 'B/B'] as const).map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genotypeChoice,
                        ldha === g && styles.genotypeChoiceActive,
                      ]}
                      onPress={() => setLdha(g)}
                    >
                      <Text
                        style={[
                          styles.genotypeText,
                          ldha === g && styles.genotypeTextActive,
                        ]}
                      >
                        {g}
                      </Text>
                      <Text style={styles.genotypeSub}>
                        {g === 'A/A'
                          ? 'Wybitny maraton'
                          : g === 'A/B'
                          ? 'Wysoka wydolność'
                          : 'Typ dziki'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* DRD4 Card */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>2. RECEPTOR DOPAMINY (DRD4)</Text>
                  <View style={styles.roundBadge}>
                    <Text style={styles.roundBadgeText}>PSYCHIKA</Text>
                  </View>
                </View>
                <Text style={styles.cardSubtitle}>
                  Gen determinujący motywację powrotową, orientację i wolę walki w złej pogodzie.
                </Text>

                <View style={styles.genotypeSelector}>
                  {(['T/T', 'C/T', 'C/C'] as const).map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genotypeChoice,
                        drd4 === g && styles.genotypeChoiceActive,
                      ]}
                      onPress={() => setDrd4(g)}
                    >
                      <Text
                        style={[
                          styles.genotypeText,
                          drd4 === g && styles.genotypeTextActive,
                        ]}
                      >
                        {g}
                      </Text>
                      <Text style={styles.genotypeSub}>
                        {g === 'T/T'
                          ? 'Żelazna psychika'
                          : g === 'C/T'
                          ? 'Podwyższona forma'
                          : 'Standard'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Performance Score Summary */}
              <View style={styles.scoreCard}>
                <Text style={styles.scoreTitle}>INDEKS POTENCJAŁU LOTOWEGO:</Text>
                <Text style={styles.scoreVal}>{performance.score} / 100 pkt</Text>
                <Text style={styles.scoreVerdict}>{performance.verdict}</Text>
                <Text style={styles.scoreDesc}>{performance.description}</Text>
              </View>
            </View>
          )}

          {/* Action Save Button */}
          <FieldButton
            title="🧬 Zapisz Profil DNA w Kartotece Ptaka"
            onPress={handleSave}
            style={styles.saveButton}
            testID="btn-save-dna-profile"
          />

          {/* Print & Share PDF Buttons */}
          <View style={styles.exportRow}>
            <FieldButton
              title="🖨️ AirPrint Certyfikat DNA"
              variant="secondary"
              onPress={handlePrint}
              style={{ flex: 1, marginRight: 8 }}
              testID="btn-print-dna-certificate"
            />
            <FieldButton
              title="📤 Udostępnij PDF (ISAG)"
              variant="secondary"
              onPress={handleShare}
              style={{ flex: 1 }}
              testID="btn-share-dna-certificate"
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
  statusBanner: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1.5,
  },
  bannerConfirmed: {
    backgroundColor: '#14291e',
    borderColor: '#16a34a',
  },
  bannerExcluded: {
    backgroundColor: '#2b1316',
    borderColor: '#dc2626',
  },
  statusBannerTitle: {
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 4,
  },
  statusBannerDesc: {
    fontSize: 10,
    color: '#D4D8E0',
    lineHeight: 14,
  },
  textGreen: {
    color: '#4ade80',
  },
  textRed: {
    color: '#f87171',
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
    borderColor: '#0284c7',
    backgroundColor: '#132333',
  },
  tabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E94A0',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#38bdf8',
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
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 10,
    color: '#8E94A0',
    marginBottom: 12,
    lineHeight: 14,
  },
  roundBadge: {
    backgroundColor: '#162332',
    borderWidth: 1,
    borderColor: '#0284c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roundBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38bdf8',
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
    borderColor: '#0284c7',
    fontFamily: 'monospace',
    fontWeight: '800',
    fontSize: 14,
    color: '#38bdf8',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#161920',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginBottom: 6,
  },
  th: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E94A0',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#262B35',
  },
  tdLocus: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  tdOffspring: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38bdf8',
    fontFamily: 'monospace',
  },
  tdParent: {
    fontSize: 10,
    color: '#D4D8E0',
    fontFamily: 'monospace',
  },
  matchCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  badgeMatch: {
    fontSize: 10,
    fontWeight: '900',
    color: '#4ade80',
  },
  badgeMismatch: {
    fontSize: 10,
    fontWeight: '900',
    color: '#f87171',
  },
  genotypeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  genotypeChoice: {
    flex: 1,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#14171D',
    borderWidth: 1,
    borderColor: '#2F343F',
    borderRadius: 8,
    padding: 6,
  },
  genotypeChoiceActive: {
    borderColor: '#0284c7',
    backgroundColor: '#132333',
  },
  genotypeText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#8E94A0',
  },
  genotypeTextActive: {
    color: '#38bdf8',
  },
  genotypeSub: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  scoreCard: {
    backgroundColor: '#142419',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#16a34a',
    marginBottom: 14,
    alignItems: 'center',
  },
  scoreTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#86efac',
    letterSpacing: 0.5,
  },
  scoreVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#4ade80',
    marginVertical: 4,
  },
  scoreVerdict: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  scoreDesc: {
    fontSize: 10,
    color: '#bbf7d0',
    textAlign: 'center',
    lineHeight: 14,
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 12,
    minHeight: 52,
    backgroundColor: '#0284c7',
  },
  exportRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
});

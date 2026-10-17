/**
 * PIGEON-FLY — VeterinaryLabModal (BR-ZDR-008, BR-ZDR-010, RD-27, Z-305, Z-306)
 * Clinical diagnostic triage for Young Pigeon Disease Syndrome (Adeno-Coli / YPDS),
 * Parasitological coproscopy laboratory, and 12-Month Veterinary Flock Protocol.
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  YpdsSymptom,
  evaluateYpdsRisk,
  CoccidiaLevel,
  TrichomonasLevel,
  evaluateCoproscopy,
  classifyCoccidiaOpg,
  getVeterinaryCalendarMonth,
  getAnnualVeterinaryCalendar,
} from '../domain/health';
import { FieldButton } from './FieldButton';
import { PdfService } from '../services/pdfService';

export interface VeterinaryLabModalProps {
  visible: boolean;
  onClose: () => void;
  selectedPigeonRing?: string;
  onIsolatePigeon?: (ringNumber: string) => void;
}

export function VeterinaryLabModal({
  visible,
  onClose,
  selectedPigeonRing = 'PL-0284-24-9102',
  onIsolatePigeon,
}: VeterinaryLabModalProps) {
  const [activeTab, setActiveTab] = useState<'ypds' | 'coproscopy' | 'calendar'>('ypds');

  // YPDS Triage state
  const [isYoungBird, setIsYoungBird] = useState(true);
  const [selectedSymptoms, setSelectedSymptoms] = useState<YpdsSymptom[]>([]);

  // Coproscopy state
  const [coccidia, setCoccidia] = useState<CoccidiaLevel>('mild');
  const [opgInput, setOpgInput] = useState<string>('');
  const [hpfInput, setHpfInput] = useState<string>('');
  const [nematodes, setNematodes] = useState(false);
  const [capillaria, setCapillaria] = useState(false);
  const [trichomonas, setTrichomonas] = useState<TrichomonasLevel>('negative');

  // Calendar month state
  const currentMonthNum = new Date().getMonth() + 1;
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthNum);

  const parsedOpg =
    opgInput.trim() !== '' && !isNaN(Number(opgInput)) ? Number(opgInput) : undefined;
  const parsedHpf =
    hpfInput.trim() !== '' && !isNaN(Number(hpfInput)) ? Number(hpfInput) : undefined;

  const ypdsAssessment = evaluateYpdsRisk({
    symptoms: selectedSymptoms,
    isYoungBird,
  });

  const coproscopyEvaluation = evaluateCoproscopy({
    coccidia,
    coccidiaOpg: parsedOpg,
    nematodesPresent: nematodes,
    nematodeHpf: parsedHpf,
    capillariaPresent: capillaria,
    trichomonas,
  });

  const monthGuide = getVeterinaryCalendarMonth(selectedMonth);
  const annualCalendar = getAnnualVeterinaryCalendar();

  const toggleSymptom = (symptom: YpdsSymptom) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleIsolateClick = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
    if (onIsolatePigeon) {
      onIsolatePigeon(selectedPigeonRing);
    }
    Alert.alert(
      'Ptak Przeniesiony do Izolatki',
      `Gołąb ${selectedPigeonRing} został przypisany do przedziału kwarantannowego (Izolatka). Zablokowano możliwość koszowania.`
    );
  };

  const handleExportYpdsReport = async (mode: 'print' | 'share' = 'print') => {
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}

      const symptomLabels: Record<YpdsSymptom, string> = {
        crop_stasis: 'Wole lejące / zaleganie płynu i fermentującego ziarna',
        vomiting: 'Wymioty ziarnem po napojeniu / karmieniu',
        green_mucoid_diarrhea: 'Zielonkawa cuchnąca śluzowata biegunka',
        lethargy: 'Apatia, nastroszone pióra, chowanie głowy w ramionach',
        rapid_weight_loss: 'Gwałtowne chudnięcie / ostry spadek masy mięśniowej',
      };

      await PdfService.exportYpdsReport(
        {
          loftName: 'Gołębnik Mistrza',
          breederName: 'Hodowca Pigeon-Fly',
          pigeonRingNumber: selectedPigeonRing,
          isYoungBird,
          date: new Date().toISOString().slice(0, 10),
          symptoms: selectedSymptoms.map((s) => symptomLabels[s] || s),
          riskLevel: ypdsAssessment.riskLevel,
          summary: ypdsAssessment.summary,
          contraindications: ypdsAssessment.contraindications,
          protocols: ypdsAssessment.recommendedProtocols,
        },
        mode
      );
    } catch (err: any) {
      Alert.alert('Błąd eksportu', err.message || 'Nie udało się wygenerować raportu YPDS.');
    }
  };

  const handleExportVaccinationCert = async (mode: 'print' | 'share' = 'print') => {
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}

      const mockPigeons = [
        { ringNumber: selectedPigeonRing, sex: 'cock', color: 'Niebieski', ageYears: 2 },
        { ringNumber: 'PL-0284-23-1402', sex: 'cock', color: 'Ciemnonakrapiany', ageYears: 3 },
        { ringNumber: 'PL-0284-24-5501', sex: 'hen', color: 'Płowa', ageYears: 2 },
        { ringNumber: 'PL-0284-25-8812', sex: 'cock', color: 'Szpak', ageYears: 1 },
      ];

      const currentYear = new Date().getFullYear();
      await PdfService.exportVaccinationCertificate(
        {
          certificateNumber: `ZAŚ-WET/${currentYear}/048`,
          issueDate: new Date().toISOString().split('T')[0],
          vetName: 'dr n. wet. Janusz Kaczmarek',
          vetLicenseNumber: 'PWZ-WET-18492',
          clinicName: 'Przychodnia Weterynaryjna Ptaków Ozdobnych i Pocztowych',
          clinicAddress: 'ul. Parkowa 12, 63-900 Rawicz',
          loftName: 'Gołębnik Mistrza',
          fancierName: 'Stanisław Kowalski',
          fancierAddress: 'ul. Leśna 4, 63-900 Rawicz',
          pzhgpBranch: 'Oddział 0284 Rawicz (Sekcja 1)',
          vaccineName: 'Pharmavac Columbi 2 (PMV-1 + Pox)',
          batchNumber: 'SER-2026-X88',
          vaccinationDate: new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
          pigeons: mockPigeons,
        },
        mode
      );
    } catch (err: any) {
      Alert.alert('Błąd eksportu zaświadczenia', err?.message || 'Nie udało się wygenerować PDF.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.screenTag}>BR-ZDR-008 • BR-ZDR-010 • RD-27</Text>
            <Text style={styles.title}>Gabinet Weterynaryjny & Triage</Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityLabel="Zamknij gabinet weterynaryjny"
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'ypds' && styles.tabBtnActive]}
            onPress={() => setActiveTab('ypds')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'ypds' && styles.tabBtnTextActive]}>
              🚨 Triage YPDS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'coproscopy' && styles.tabBtnActive]}
            onPress={() => setActiveTab('coproscopy')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'coproscopy' && styles.tabBtnTextActive]}>
              🔬 Koproskopia
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'calendar' && styles.tabBtnActive]}
            onPress={() => setActiveTab('calendar')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'calendar' && styles.tabBtnTextActive]}>
              📅 Kalendarz 12M
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          {/* TAB 1: YPDS (Adeno-Coli) */}
          {activeTab === 'ypds' && (
            <View>
              <View style={styles.patientBanner}>
                <Text style={styles.patientTitle}>PACJENT: {selectedPigeonRing}</Text>
                <View style={styles.ageToggleRow}>
                  <TouchableOpacity
                    style={[styles.ageBtn, isYoungBird && styles.ageBtnActive]}
                    onPress={() => setIsYoungBird(true)}
                  >
                    <Text style={[styles.ageBtnText, isYoungBird && styles.ageBtnTextActive]}>
                      🐣 Młode (&lt; 1 rok)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.ageBtn, !isYoungBird && styles.ageBtnActive]}
                    onPress={() => setIsYoungBird(false)}
                  >
                    <Text style={[styles.ageBtnText, !isYoungBird && styles.ageBtnTextActive]}>
                      🦅 Dorosły (&ge; 1 rok)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.sectionHeader}>OBJAWY KLINICZNE (ZAZNACZ OBSERWACJE)</Text>
              <Text style={styles.guideText}>
                Asystent wczesnego ostrzegania przed Zespołem Choroby Młodych (Adenowirus + E. coli + Cirkowirus).
              </Text>

              {[
                { key: 'crop_stasis' as YpdsSymptom, label: '💧 Wole lejące / zaleganie cuchnącego płynu i karmy' },
                { key: 'vomiting' as YpdsSymptom, label: '🤮 Wymioty ziarnem po napojeniu / karmieniu' },
                { key: 'green_mucoid_diarrhea' as YpdsSymptom, label: '🟢 Cuchnąca, zielonkawo-śluzowata biegunka' },
                { key: 'lethargy' as YpdsSymptom, label: '🥀 Apatia, nastroszenie piór, siadanie w kącie' },
                { key: 'rapid_weight_loss' as YpdsSymptom, label: '⚖️ Gwałtowna utrata wagi i ostry spadek mięśni' },
              ].map((item) => {
                const isChecked = selectedSymptoms.includes(item.key);
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.symptomItem, isChecked && styles.symptomItemChecked]}
                    onPress={() => toggleSymptom(item.key)}
                  >
                    <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                      {isChecked && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={[styles.symptomText, isChecked && styles.symptomTextChecked]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Assessment Output Card */}
              <View
                style={[
                  styles.assessmentCard,
                  ypdsAssessment.riskLevel === 'critical' && styles.cardCritical,
                  ypdsAssessment.riskLevel === 'acute' && styles.cardAcute,
                  ypdsAssessment.riskLevel === 'suspected' && styles.cardSuspected,
                  ypdsAssessment.riskLevel === 'none' && styles.cardClean,
                ]}
              >
                <View style={styles.assessmentHeader}>
                  <Text style={styles.assessmentTag}>WYNIK TRIAGE KLINICZNEGO</Text>
                  <Text style={styles.riskBadge}>
                    {ypdsAssessment.riskLevel === 'critical'
                      ? 'KRYTYCZNY (ZAGROŻENIE ŻYCIA)'
                      : ypdsAssessment.riskLevel === 'acute'
                      ? 'OSTRE ADENO-COLI (YPDS)'
                      : ypdsAssessment.riskLevel === 'suspected'
                      ? 'PODEJRZENIE NIESTRAWNOŚCI'
                      : 'BRAK ZAGROŻENIA'}
                  </Text>
                </View>

                <Text style={styles.assessmentSummary}>{ypdsAssessment.summary}</Text>

                {ypdsAssessment.isEmergency && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.alertHeader}>⛔ BEZWZGLĘDNE ZAKAZY:</Text>
                    {ypdsAssessment.contraindications.map((c, i) => (
                      <Text key={i} style={styles.contraText}>
                        • {c}
                      </Text>
                    ))}

                    <Text style={[styles.alertHeader, { marginTop: 12 }]}>
                      📋 PROCEDURA RATUNKOWA RD-27:
                    </Text>
                    {ypdsAssessment.recommendedProtocols.map((p, i) => (
                      <View key={i} style={styles.protocolItem}>
                        <Text style={styles.protocolTitle}>{p.title}</Text>
                        <Text style={styles.protocolDesc}>{p.description}</Text>
                      </View>
                    ))}

                    <FieldButton
                      title="🏥 Przenieś Ptaka do Izolatki (Kwarantanna)"
                      variant="primary"
                      onPress={handleIsolateClick}
                      style={{ marginTop: 14 }}
                    />

                    <View style={styles.ypdsPdfActionsRow}>
                      <TouchableOpacity
                        style={styles.ypdsPrintBtn}
                        onPress={() => handleExportYpdsReport('print')}
                        testID="btn-print-ypds-report"
                      >
                        <Text style={styles.ypdsPrintBtnText}>🖨️ Drukuj Raport (PDF)</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.ypdsShareBtn}
                        onPress={() => handleExportYpdsReport('share')}
                        testID="btn-share-ypds-report"
                      >
                        <Text style={styles.ypdsShareBtnText}>📤 Udostępnij Lekarzowi</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* TAB 2: COPROSCOPY */}
          {activeTab === 'coproscopy' && (
            <View>
              <Text style={styles.sectionHeader}>PARAMETRY BADANIA PARAZYTOLOGICZNEGO</Text>
              <Text style={styles.guideText}>
                Wprowadź wynik mikroskopowego badania kału stada (metoda McMastera OPG / flotacja) lub wymazu z wola.
              </Text>

              {/* McMaster Quantitative OPG */}
              <View style={styles.opgContainer}>
                <View style={styles.opgHeaderRow}>
                  <Text style={styles.opgTitle}>KOMORA McMASTERA — OPG (OOCYSTY / GRAM KAŁU)</Text>
                  <Text style={styles.opgSubtitle}>Standard ilościowy Z-306 • Próg leczenia: &ge;1000 OPG</Text>
                </View>

                <View style={styles.opgInputRow}>
                  <TextInput
                    style={styles.opgInputField}
                    keyboardType="numeric"
                    placeholder="Wpisz OPG (np. 850)"
                    placeholderTextColor="#6B7280"
                    value={opgInput}
                    onChangeText={(val) => {
                      setOpgInput(val);
                      const num = parseInt(val, 10);
                      if (!isNaN(num)) {
                        setCoccidia(classifyCoccidiaOpg(num).level);
                      }
                    }}
                  />
                  {opgInput !== '' && (
                    <TouchableOpacity
                      style={styles.opgClearBtn}
                      onPress={() => {
                        setOpgInput('');
                        setCoccidia('negative');
                      }}
                    >
                      <Text style={styles.opgClearBtnText}>✕ Wyczyść</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Quick Presets */}
                <View style={styles.opgPresetsRow}>
                  {[
                    { label: '0 (Czysto)', opg: '0', lvl: 'negative' as CoccidiaLevel },
                    { label: '600 (Subkliniczny)', opg: '600', lvl: 'mild' as CoccidiaLevel },
                    { label: '2500 (Średni)', opg: '2500', lvl: 'moderate' as CoccidiaLevel },
                    { label: '8000 (Masowy +++)', opg: '8000', lvl: 'heavy' as CoccidiaLevel },
                  ].map((preset) => {
                    const isSel = opgInput === preset.opg;
                    return (
                      <TouchableOpacity
                        key={preset.opg}
                        style={[styles.opgPresetChip, isSel && styles.opgPresetChipActive]}
                        onPress={() => {
                          setOpgInput(preset.opg);
                          setCoccidia(preset.lvl);
                        }}
                      >
                        <Text
                          style={[
                            styles.opgPresetChipText,
                            isSel && styles.opgPresetChipTextActive,
                          ]}
                        >
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {parsedOpg !== undefined && (
                  <View
                    style={[
                      styles.opgResultBadge,
                      classifyCoccidiaOpg(parsedOpg).isChemicalNeeded
                        ? styles.opgResultBadgeChemical
                        : styles.opgResultBadgeNatural,
                    ]}
                  >
                    <Text style={styles.opgResultText}>
                      {classifyCoccidiaOpg(parsedOpg).thresholdLabel}
                    </Text>
                  </View>
                )}
              </View>

              {/* Qualitative Coccidia Fallback selector */}
              <Text style={styles.inputLabel}>Kokcydia — Kategoria jakościowa (Eimeria labbeana):</Text>
              <View style={styles.optionsRow}>
                {(['negative', 'mild', 'moderate', 'heavy'] as CoccidiaLevel[]).map((lvl) => {
                  const labels = {
                    negative: 'Ujemny (0)',
                    mild: 'Nieliczne (+)',
                    moderate: 'Pojedyncze (++)',
                    heavy: 'Masowe (+++)',
                  };
                  const isSel = coccidia === lvl;
                  return (
                    <TouchableOpacity
                      key={lvl}
                      style={[styles.optionBtn, isSel && styles.optionBtnActive]}
                      onPress={() => {
                        setCoccidia(lvl);
                        if (lvl === 'negative') setOpgInput('0');
                        else if (lvl === 'mild') setOpgInput('600');
                        else if (lvl === 'moderate') setOpgInput('2500');
                        else if (lvl === 'heavy') setOpgInput('8000');
                      }}
                    >
                      <Text style={[styles.optionText, isSel && styles.optionTextActive]}>
                        {labels[lvl]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Trichomonas selector */}
              <Text style={styles.inputLabel}>Rzęsistek (Trichomonas gallinae / Żółty guzek):</Text>
              <View style={styles.optionsRow}>
                {(['negative', 'mild', 'severe'] as TrichomonasLevel[]).map((lvl) => {
                  const labels = {
                    negative: 'Czysty (0)',
                    mild: 'Pojedyncze (+)',
                    severe: 'Masowe (+++)',
                  };
                  const isSel = trichomonas === lvl;
                  return (
                    <TouchableOpacity
                      key={lvl}
                      style={[styles.optionBtn, isSel && styles.optionBtnActive]}
                      onPress={() => setTrichomonas(lvl)}
                    >
                      <Text style={[styles.optionText, isSel && styles.optionTextActive]}>
                        {labels[lvl]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Worms toggles & HPF */}
              <Text style={styles.inputLabel}>Nicienie jelitowe (Jaja w polu widzenia HPF):</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    (nematodes || (parsedHpf !== undefined && parsedHpf > 0)) &&
                      styles.toggleBtnActive,
                  ]}
                  onPress={() => {
                    const next = !nematodes;
                    setNematodes(next);
                    if (!next) setHpfInput('');
                  }}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      (nematodes || (parsedHpf !== undefined && parsedHpf > 0)) &&
                        styles.toggleBtnTextActive,
                    ]}
                  >
                    {nematodes || (parsedHpf !== undefined && parsedHpf > 0)
                      ? `⚠️ Glisty (Ascaridia): OBECNE${parsedHpf ? ` (${parsedHpf} HPF)` : ''}`
                      : '✓ Glisty: Brak'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggleBtn, capillaria && styles.toggleBtnActive]}
                  onPress={() => setCapillaria(!capillaria)}
                >
                  <Text style={[styles.toggleBtnText, capillaria && styles.toggleBtnTextActive]}>
                    {capillaria ? '⚠️ Włosogłówki (Capillaria): OBECNE' : '✓ Włosogłówki: Brak'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* HPF Input row */}
              <View style={styles.hpfRow}>
                <Text style={styles.hpfLabel}>Ilość jaj glist w polu widzenia (HPF):</Text>
                <TextInput
                  style={styles.hpfInput}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#6B7280"
                  value={hpfInput}
                  onChangeText={(val) => {
                    setHpfInput(val);
                    const n = parseInt(val, 10);
                    if (!isNaN(n) && n > 0) {
                      setNematodes(true);
                    }
                  }}
                />
              </View>

              {/* Coproscopy Evaluation Box */}
              <View
                style={[
                  styles.assessmentCard,
                  coproscopyEvaluation.requiresChemicalMedication
                    ? styles.cardAcute
                    : coproscopyEvaluation.recommendations.length > 0
                    ? styles.cardSuspected
                    : styles.cardClean,
                ]}
              >
                <View style={styles.assessmentHeader}>
                  <Text style={styles.assessmentTag}>OCENA LEKARSKO-WETERYNARYJNA</Text>
                  <Text style={styles.riskBadge}>
                    {coproscopyEvaluation.overallHealthStatus === 'clean'
                      ? 'STADO CZYSTE'
                      : coproscopyEvaluation.overallHealthStatus === 'mild_infestation'
                      ? 'PROFILAKTYKA NATURALNA'
                      : 'WYMAGANE LECZENIE'}
                  </Text>
                </View>

                <Text style={styles.assessmentSummary}>{coproscopyEvaluation.summary}</Text>

                {coproscopyEvaluation.requiresLoftDisinfection && (
                  <View style={styles.torchBox}>
                    <Text style={styles.torchText}>
                      🔥 Wskazanie zoohigieniczne: jaja glist i oocysty kokcydiów są odporne na zwykłe środki myjące. Wymagane wypalenie rusztów podłogowych palnikiem gazowym!
                    </Text>
                  </View>
                )}

                {coproscopyEvaluation.recommendations.map((rec, i) => (
                  <View key={i} style={styles.protocolItem}>
                    <Text style={styles.protocolTitle}>
                      {rec.isChemical ? '💊 ' : '🌿 '}
                      {rec.target}
                    </Text>
                    <Text style={styles.protocolDesc}>{rec.protocol}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* TAB 3: CALENDAR */}
          {activeTab === 'calendar' && (
            <View>
              <Text style={styles.sectionHeader}>12-MIESIĘCZNY KALENDARZ ZDROWIA STADA</Text>
              <Text style={styles.guideText}>
                Wybierz miesiąc, aby wyświetlić profilaktykę, badania i szczepienia zgodne z rocznym cyklem hodowli.
              </Text>

              {/* Month Selector Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthsScroll}>
                {annualCalendar.map((m) => {
                  const isSel = selectedMonth === m.month;
                  return (
                    <TouchableOpacity
                      key={m.month}
                      style={[styles.monthChip, isSel && styles.monthChipActive]}
                      onPress={() => setSelectedMonth(m.month)}
                    >
                      <Text style={[styles.monthChipText, isSel && styles.monthChipTextActive]}>
                        {m.monthName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Month Details Card */}
              <View style={styles.monthCard}>
                <View style={styles.monthCardHeader}>
                  <Text style={styles.monthTitle}>
                    {monthGuide.month}. {monthGuide.monthName.toUpperCase()}
                  </Text>
                  <View style={styles.monthBadgeWrapper}>
                    <Text style={styles.monthBadgeTxt}>{monthGuide.seasonFocus}</Text>
                  </View>
                </View>

                <Text style={styles.monthSectionTitle}>Główne zadania hodowlano-weterynaryjne:</Text>
                {monthGuide.keyActions.map((act, i) => (
                  <Text key={i} style={styles.monthActionText}>
                    ✓ {act}
                  </Text>
                ))}

                <Text style={[styles.monthSectionTitle, { marginTop: 10 }]}>
                  Zalecana diagnostyka laboratoryjna:
                </Text>
                {monthGuide.recommendedDiagnostics.map((diag, i) => (
                  <Text key={i} style={styles.monthActionText}>
                    🔬 {diag}
                  </Text>
                ))}

                {monthGuide.mandatoryVaccinations.length > 0 && (
                  <View style={styles.vaccineBox}>
                    <Text style={styles.vaccineHeader}>💉 OBOWIĄZKOWE SZCZEPIENIA:</Text>
                    {monthGuide.mandatoryVaccinations.map((vac, i) => (
                      <Text key={i} style={styles.vaccineText}>
                        ★ {vac}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Urzędowe Zaświadczenie Szczepienia PIW / PZHGP */}
                <View style={styles.certExportBox}>
                  <Text style={styles.certExportTitle}>📑 URZĘDOWE ZAŚWIADCZENIE SZCZEPIEŃ (PIW / PZHGP)</Text>
                  <Text style={styles.certExportDesc}>
                    Generuje oficjalne zaświadczenie weterynaryjne z wykazem obrączek i numerem serii szczepionki PMV-1 wymagane do koszowania na loty konkursowe.
                  </Text>
                  <View style={styles.ypdsPdfActionsRow}>
                    <TouchableOpacity
                      style={styles.ypdsPrintBtn}
                      onPress={() => handleExportVaccinationCert('print')}
                    >
                      <Text style={styles.ypdsPrintBtnText}>🖨️ Drukuj Zaświadczenie PIW</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.ypdsShareBtn}
                      onPress={() => handleExportVaccinationCert('share')}
                    >
                      <Text style={styles.ypdsShareBtnText}>📤 Udostępnij (PDF)</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121417',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
  },
  screenTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 1,
  },
  title: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E2127',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#2A303C',
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E94A0',
  },
  tabBtnTextActive: {
    color: '#E5A93C',
    fontWeight: '800',
  },
  patientBanner: {
    backgroundColor: '#1E2430',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  patientTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  ageToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ageBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#15171B',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  ageBtnActive: {
    borderColor: '#E5A93C',
    backgroundColor: '#2A2417',
  },
  ageBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E94A0',
  },
  ageBtnTextActive: {
    color: '#E5A93C',
    fontWeight: '800',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 6,
  },
  guideText: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
    marginBottom: 12,
  },
  symptomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2127',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  symptomItemChecked: {
    borderColor: '#EF4444',
    backgroundColor: '#2B1B1E',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4A5568',
    backgroundColor: '#15171B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    borderColor: '#EF4444',
    backgroundColor: '#EF4444',
  },
  checkmark: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  symptomText: {
    fontSize: 13,
    color: '#D4D8E0',
    flex: 1,
  },
  symptomTextChecked: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  assessmentCard: {
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
  },
  cardClean: {
    backgroundColor: '#132E22',
    borderColor: '#10B981',
  },
  cardSuspected: {
    backgroundColor: '#2A2417',
    borderColor: '#F59E0B',
  },
  cardAcute: {
    backgroundColor: '#371B1D',
    borderColor: '#EF4444',
  },
  cardCritical: {
    backgroundColor: '#450A0A',
    borderColor: '#DC2626',
    borderWidth: 2,
  },
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assessmentTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  riskBadge: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  assessmentSummary: {
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
    fontWeight: '600',
  },
  alertHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F87171',
    marginBottom: 6,
  },
  contraText: {
    fontSize: 12,
    color: '#FCA5A5',
    lineHeight: 18,
  },
  protocolItem: {
    backgroundColor: '#1E2127',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  protocolTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5A93C',
    marginBottom: 2,
  },
  protocolDesc: {
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 15,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4D8E0',
    marginTop: 8,
    marginBottom: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  optionBtn: {
    backgroundColor: '#1E2127',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  optionBtnActive: {
    borderColor: '#E5A93C',
    backgroundColor: '#2A2417',
  },
  optionText: {
    fontSize: 11,
    color: '#8E94A0',
    fontWeight: '700',
  },
  optionTextActive: {
    color: '#E5A93C',
    fontWeight: '800',
  },
  toggleBtn: {
    flex: 1,
    backgroundColor: '#1E2127',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
    alignItems: 'center',
  },
  toggleBtnActive: {
    borderColor: '#EF4444',
    backgroundColor: '#2B1B1E',
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E94A0',
    textAlign: 'center',
  },
  toggleBtnTextActive: {
    color: '#F87171',
    fontWeight: '800',
  },
  torchBox: {
    backgroundColor: '#382B14',
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  torchText: {
    fontSize: 12,
    color: '#FDE68A',
    lineHeight: 16,
  },
  monthsScroll: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  monthChip: {
    backgroundColor: '#1E2127',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  monthChipActive: {
    backgroundColor: '#E5A93C',
    borderColor: '#E5A93C',
  },
  monthChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E94A0',
  },
  monthChipTextActive: {
    color: '#121417',
    fontWeight: '800',
  },
  monthCard: {
    backgroundColor: '#1E2127',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  monthCardHeader: {
    marginBottom: 10,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  monthBadgeWrapper: {
    backgroundColor: '#15171B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  monthBadgeTxt: {
    fontSize: 11,
    color: '#E5A93C',
    fontWeight: '700',
  },
  monthSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 4,
  },
  monthActionText: {
    fontSize: 13,
    color: '#D4D8E0',
    lineHeight: 18,
    marginVertical: 2,
  },
  vaccineBox: {
    backgroundColor: '#1A212D',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#60A5FA',
  },
  vaccineHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#60A5FA',
    marginBottom: 4,
  },
  vaccineText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    lineHeight: 16,
  },
  ypdsPdfActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  ypdsPrintBtn: {
    flex: 1,
    minHeight: 46,
    backgroundColor: '#E5A93C',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  ypdsPrintBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#121417',
  },
  ypdsShareBtn: {
    flex: 1,
    minHeight: 46,
    backgroundColor: '#2A303C',
    borderWidth: 1,
    borderColor: '#3E4756',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  ypdsShareBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  opgContainer: {
    backgroundColor: '#16191E',
    borderWidth: 1,
    borderColor: '#2F343F',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  opgHeaderRow: {
    marginBottom: 8,
  },
  opgTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#E5A93C',
    letterSpacing: 0.5,
  },
  opgSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  opgInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  opgInputField: {
    flex: 1,
    height: 48,
    backgroundColor: '#1E232B',
    borderWidth: 1,
    borderColor: '#3E4756',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  opgClearBtn: {
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#2A303C',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  opgClearBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  opgPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  opgPresetChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#20252F',
    borderWidth: 1,
    borderColor: '#3E4756',
  },
  opgPresetChipActive: {
    backgroundColor: '#E5A93C',
    borderColor: '#E5A93C',
  },
  opgPresetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4D8E0',
  },
  opgPresetChipTextActive: {
    color: '#121417',
    fontWeight: '900',
  },
  opgResultBadge: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  opgResultBadgeChemical: {
    backgroundColor: '#2D1B1B',
    borderColor: '#EF4444',
  },
  opgResultBadgeNatural: {
    backgroundColor: '#14281E',
    borderColor: '#10B981',
  },
  opgResultText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 16,
  },
  hpfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#16191E',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 14,
  },
  hpfLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4D8E0',
    flex: 1,
  },
  hpfInput: {
    width: 60,
    height: 40,
    backgroundColor: '#1E232B',
    borderWidth: 1,
    borderColor: '#3E4756',
    borderRadius: 6,
    paddingHorizontal: 8,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  certExportBox: {
    backgroundColor: '#16191E',
    borderWidth: 1,
    borderColor: '#2F343F',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  certExportTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#60A5FA',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  certExportDesc: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 15,
    marginBottom: 8,
  },
});

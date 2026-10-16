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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  YpdsSymptom,
  evaluateYpdsRisk,
  CoccidiaLevel,
  TrichomonasLevel,
  evaluateCoproscopy,
  getVeterinaryCalendarMonth,
  getAnnualVeterinaryCalendar,
} from '../domain/health';
import { FieldButton } from './FieldButton';

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
  const [nematodes, setNematodes] = useState(false);
  const [capillaria, setCapillaria] = useState(false);
  const [trichomonas, setTrichomonas] = useState<TrichomonasLevel>('negative');

  // Calendar month state
  const currentMonthNum = new Date().getMonth() + 1;
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthNum);

  const ypdsAssessment = evaluateYpdsRisk({
    symptoms: selectedSymptoms,
    isYoungBird,
  });

  const coproscopyEvaluation = evaluateCoproscopy({
    coccidia,
    nematodesPresent: nematodes,
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
                Wprowadź wynik mikroskopowego badania kału stada (metoda flotacyjna) lub wymazu z wola.
              </Text>

              {/* Coccidia selector */}
              <Text style={styles.inputLabel}>Kokcydia (Eimeria labbeana / columbae):</Text>
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
                      onPress={() => setCoccidia(lvl)}
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

              {/* Worms toggles */}
              <Text style={styles.inputLabel}>Nicienie jelitowe (Jaja w polu widzenia):</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <TouchableOpacity
                  style={[styles.toggleBtn, nematodes && styles.toggleBtnActive]}
                  onPress={() => setNematodes(!nematodes)}
                >
                  <Text style={[styles.toggleBtnText, nematodes && styles.toggleBtnTextActive]}>
                    {nematodes ? '⚠️ Glisty (Ascaridia): OBECNE' : '✓ Glisty: Brak'}
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
});

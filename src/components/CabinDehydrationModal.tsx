/**
 * PIGEON-FLY — Cabin Dehydration & Transport Welfare Modal (Z-085 / DEC-99)
 * Field Mode ergonomic interface (>= 48-56pt touch targets), dark theme (#121417).
 * Evaluates water loss, gular panting, cabin microclimate and watering trough sessions.
 */

import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CabinDehydrationInput,
  evaluateCabinDehydration,
  generateCabinDehydrationReportHtml,
} from '../domain/cabinDehydration';
import { PdfService } from '../services/pdfService';
import { FieldButton } from './FieldButton';

interface CabinDehydrationModalProps {
  visible: boolean;
  onClose: () => void;
  defaultRaceName?: string;
  defaultCabinSerial?: string;
  defaultConvoyLeader?: string;
  defaultBranchName?: string;
}

export const CabinDehydrationModal: React.FC<CabinDehydrationModalProps> = ({
  visible,
  onClose,
  defaultRaceName = 'Lot Narodowy Bruksela PZHGP',
  defaultCabinSerial = 'Kabina Specjalistyczna Mercedes Actros',
  defaultConvoyLeader = 'Marek Wiśniewski (Konwojent Główny)',
  defaultBranchName = '0284 Nowy Tomyśl',
}) => {
  // Input state
  const [cabinTempC, setCabinTempC] = useState(26);
  const [relativeHumidityPct, setRelativeHumidityPct] = useState(65);
  const [transitHours, setTransitHours] = useState(14);
  const [releaseSiteWaitHours, setReleaseSiteWaitHours] = useState(8);
  const [ventilationM3PerHourPer100Birds, setVentilationM3PerHourPer100Birds] = useState(25);
  const [birdsCountInCabin, setBirdsCountInCabin] = useState(2400);
  const [wateringSessionsCount, setWateringSessionsCount] = useState(2);
  const [avgWaterConsumedMlPerBirdPerSession, setAvgWaterConsumedMlPerBirdPerSession] = useState(7);
  const [averagePigeonBodyWeightGrams] = useState(420);

  // Active view tab: 'overview' | 'welfare' | 'flock'
  const [activeTab, setActiveTab] = useState<'overview' | 'welfare' | 'flock'>('overview');

  const input: CabinDehydrationInput = useMemo(
    () => ({
      cabinTempC,
      relativeHumidityPct,
      transitHours,
      releaseSiteWaitHours,
      ventilationM3PerHourPer100Birds,
      birdsCountInCabin,
      wateringSessionsCount,
      avgWaterConsumedMlPerBirdPerSession,
      averagePigeonBodyWeightGrams,
    }),
    [
      cabinTempC,
      relativeHumidityPct,
      transitHours,
      releaseSiteWaitHours,
      ventilationM3PerHourPer100Birds,
      birdsCountInCabin,
      wateringSessionsCount,
      avgWaterConsumedMlPerBirdPerSession,
      averagePigeonBodyWeightGrams,
    ]
  );

  const report = useMemo(() => {
    return evaluateCabinDehydration(input);
  }, [input]);

  // Presets
  const applyPreset = (preset: 'short' | 'medium' | 'heat_marathon' | 'traffic_jam') => {
    if (preset === 'short') {
      setCabinTempC(20);
      setRelativeHumidityPct(60);
      setTransitHours(8);
      setReleaseSiteWaitHours(3);
      setVentilationM3PerHourPer100Birds(28);
      setWateringSessionsCount(1);
      setAvgWaterConsumedMlPerBirdPerSession(7);
    } else if (preset === 'medium') {
      setCabinTempC(24);
      setRelativeHumidityPct(65);
      setTransitHours(12);
      setReleaseSiteWaitHours(6);
      setVentilationM3PerHourPer100Birds(25);
      setWateringSessionsCount(2);
      setAvgWaterConsumedMlPerBirdPerSession(8);
    } else if (preset === 'heat_marathon') {
      setCabinTempC(30);
      setRelativeHumidityPct(72);
      setTransitHours(16);
      setReleaseSiteWaitHours(10);
      setVentilationM3PerHourPer100Birds(22);
      setWateringSessionsCount(2);
      setAvgWaterConsumedMlPerBirdPerSession(9);
    } else {
      setCabinTempC(33);
      setRelativeHumidityPct(78);
      setTransitHours(20);
      setReleaseSiteWaitHours(8);
      setVentilationM3PerHourPer100Birds(16);
      setWateringSessionsCount(0); // Crisis!
      setAvgWaterConsumedMlPerBirdPerSession(0);
    }
  };

  const handlePrint = async () => {
    try {
      const html = generateCabinDehydrationReportHtml(report, input, {
        raceName: defaultRaceName,
        cabinSerial: defaultCabinSerial,
        convoyLeader: defaultConvoyLeader,
        branchName: defaultBranchName,
      });
      await PdfService.printHtml(html);
    } catch {
      Alert.alert('Błąd wydruku', 'Nie udało się zainicjować wydruku protokołu.');
    }
  };

  const handleShare = async () => {
    try {
      const html = generateCabinDehydrationReportHtml(report, input, {
        raceName: defaultRaceName,
        cabinSerial: defaultCabinSerial,
        convoyLeader: defaultConvoyLeader,
        branchName: defaultBranchName,
      });
      await PdfService.shareHtmlAsPdf(
        html,
        `Protokol_Dobrostanu_Kabiny_${report.totalCabinHours}h.pdf`
      );
    } catch {
      Alert.alert('Błąd eksportu', 'Nie udało się wyeksportować raportu do PDF.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>🚛 Bilans Wodny Kabiny i Dobrostan</Text>
            <Text style={styles.headerSubtitle}>
              Kalkulator Odwodnienia w Transporcie (Z-085)
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Zamknij kalkulator dobrostanu"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Quick Presets */}
          <Text style={styles.sectionHeader}>SCENARIUSZE TRANSPORTOWE KABINY</Text>
          <View style={styles.presetsRow}>
            <TouchableOpacity
              style={[styles.presetButton, transitHours === 8 && styles.presetButtonActive]}
              onPress={() => applyPreset('short')}
            >
              <Text style={styles.presetButtonText}>Krótki (11h)</Text>
              <Text style={styles.presetSubText}>20°C • 1 pojenie</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.presetButton, transitHours === 12 && styles.presetButtonActive]}
              onPress={() => applyPreset('medium')}
            >
              <Text style={styles.presetButtonText}>Średni (18h)</Text>
              <Text style={styles.presetSubText}>24°C • 2 pojenia</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.presetButton, transitHours === 16 && styles.presetButtonActive]}
              onPress={() => applyPreset('heat_marathon')}
            >
              <Text style={styles.presetButtonText}>Maraton (26h)</Text>
              <Text style={styles.presetSubText}>30°C • Upał</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.presetButton, transitHours === 20 && styles.presetButtonActive]}
              onPress={() => applyPreset('traffic_jam')}
            >
              <Text style={[styles.presetButtonText, { color: '#EF4444' }]}>Kryzys (28h)</Text>
              <Text style={styles.presetSubText}>33°C • Brak wody</Text>
            </TouchableOpacity>
          </View>

          {/* KPI Banner */}
          <View style={[styles.kpiCard, { borderColor: report.riskColor }]}>
            <View style={styles.kpiTopRow}>
              <View style={[styles.riskPill, { backgroundColor: report.riskColor + '25' }]}>
                <Text style={[styles.riskText, { color: report.riskColor }]}>
                  {report.riskLabel}
                </Text>
              </View>
              <Text style={styles.kpiHours}>{report.totalCabinHours}h w klatkach</Text>
            </View>

            <View style={styles.kpiGrid}>
              <View style={styles.kpiItem}>
                <Text style={[styles.kpiVal, { color: report.riskColor }]}>
                  {report.dehydrationPercentBodyWeight}%
                </Text>
                <Text style={styles.kpiDesc}>Ubytek Masy Ciała</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={[styles.kpiVal, { color: '#38BDF8' }]}>
                  {report.netFluidDeficitMlPerBird} ml
                </Text>
                <Text style={styles.kpiDesc}>Deficyt / Ptaka</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiVal}>{report.evaporationRateMlPerHour} ml/h</Text>
                <Text style={styles.kpiDesc}>Tempo Parowania</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={[styles.kpiVal, { color: '#E0A82E' }]}>
                  {report.totalFlockWaterLossLiters} L
                </Text>
                <Text style={styles.kpiDesc}>Łączny Ubytek Stada</Text>
              </View>
            </View>
          </View>

          {/* Stepper Inputs Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>PARAMETRY MIKROKLIMATU I CZASU</Text>

            {/* Temperature */}
            <View style={styles.stepperRow}>
              <View style={styles.stepperLabelCol}>
                <Text style={styles.stepperLabel}>Temperatura w Kabinie</Text>
                <Text style={styles.stepperSub}>{cabinTempC}°C</Text>
              </View>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setCabinTempC((prev) => Math.max(12, prev - 2))}
                >
                  <Text style={styles.stepBtnText}>-2°C</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setCabinTempC((prev) => Math.min(38, prev + 2))}
                >
                  <Text style={styles.stepBtnText}>+2°C</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Relative Humidity */}
            <View style={styles.stepperRow}>
              <View style={styles.stepperLabelCol}>
                <Text style={styles.stepperLabel}>Wilgotność Względna (RH)</Text>
                <Text style={styles.stepperSub}>{relativeHumidityPct}%</Text>
              </View>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setRelativeHumidityPct((prev) => Math.max(25, prev - 5))}
                >
                  <Text style={styles.stepBtnText}>-5%</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setRelativeHumidityPct((prev) => Math.min(95, prev + 5))}
                >
                  <Text style={styles.stepBtnText}>+5%</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Transit Hours */}
            <View style={styles.stepperRow}>
              <View style={styles.stepperLabelCol}>
                <Text style={styles.stepperLabel}>Czas Jazdy (Transport)</Text>
                <Text style={styles.stepperSub}>{transitHours} godz.</Text>
              </View>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setTransitHours((prev) => Math.max(2, prev - 2))}
                >
                  <Text style={styles.stepBtnText}>-2h</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setTransitHours((prev) => Math.min(30, prev + 2))}
                >
                  <Text style={styles.stepBtnText}>+2h</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Release Site Wait */}
            <View style={styles.stepperRow}>
              <View style={styles.stepperLabelCol}>
                <Text style={styles.stepperLabel}>Postój na Miejscu Startu</Text>
                <Text style={styles.stepperSub}>{releaseSiteWaitHours} godz.</Text>
              </View>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setReleaseSiteWaitHours((prev) => Math.max(1, prev - 1))}
                >
                  <Text style={styles.stepBtnText}>-1h</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setReleaseSiteWaitHours((prev) => Math.min(24, prev + 1))}
                >
                  <Text style={styles.stepBtnText}>+1h</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Mechanical Ventilation */}
            <View style={styles.stepperRow}>
              <View style={styles.stepperLabelCol}>
                <Text style={styles.stepperLabel}>Wydajność Wentylacji</Text>
                <Text style={styles.stepperSub}>
                  {ventilationM3PerHourPer100Birds} m³/h / 100 ptaków (Norma: 20-30)
                </Text>
              </View>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setVentilationM3PerHourPer100Birds((prev) => Math.max(10, prev - 3))}
                >
                  <Text style={styles.stepBtnText}>-3</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setVentilationM3PerHourPer100Birds((prev) => Math.min(45, prev + 3))}
                >
                  <Text style={styles.stepBtnText}>+3</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Watering Sessions */}
            <View style={styles.stepperRow}>
              <View style={styles.stepperLabelCol}>
                <Text style={styles.stepperLabel}>Sesje Pojenia w Kabinie</Text>
                <Text style={styles.stepperSub}>{wateringSessionsCount} sesje z korytkiem</Text>
              </View>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setWateringSessionsCount((prev) => Math.max(0, prev - 1))}
                >
                  <Text style={styles.stepBtnText}>-1</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setWateringSessionsCount((prev) => Math.min(5, prev + 1))}
                >
                  <Text style={styles.stepBtnText}>+1</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Birds in Cabin */}
            <View style={[styles.stepperRow, { borderBottomWidth: 0 }]}>
              <View style={styles.stepperLabelCol}>
                <Text style={styles.stepperLabel}>Obsada Kabiny</Text>
                <Text style={styles.stepperSub}>{birdsCountInCabin} gołębi</Text>
              </View>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setBirdsCountInCabin((prev) => Math.max(500, prev - 200))}
                >
                  <Text style={styles.stepBtnText}>-200</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setBirdsCountInCabin((prev) => Math.min(5000, prev + 200))}
                >
                  <Text style={styles.stepBtnText}>+200</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'overview' && styles.tabBtnActive]}
              onPress={() => setActiveTab('overview')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'overview' && styles.tabBtnTextActive,
                ]}
              >
                🔬 Wpływ na Lot
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'welfare' && styles.tabBtnActive]}
              onPress={() => setActiveTab('welfare')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'welfare' && styles.tabBtnTextActive,
                ]}
              >
                📜 Norma PZHGP
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'flock' && styles.tabBtnActive]}
              onPress={() => setActiveTab('flock')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'flock' && styles.tabBtnTextActive,
                ]}
              >
                💧 Bilans Stada
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <View style={styles.tabContentContainer}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>DIAGNOZA FIZJOLOGICZNA LOTNIKÓW</Text>
                <Text style={styles.analysisText}>{report.flightImpactAnalysis}</Text>
                <View style={styles.guidelineDivider} />
                <Text style={styles.guidelineTitle}>Zalecenia dla Konwojenta przed Startem:</Text>
                {report.recommendations.map((rec, idx) => (
                  <View key={idx} style={styles.recRow}>
                    <Text style={styles.recDot}>•</Text>
                    <Text style={styles.recText}>{rec}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'welfare' && (
            <View style={styles.tabContentContainer}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>REGULAMIN DOBROSTANU I TRANSPORTU PZHGP</Text>
                {report.pzhgpComplianceNotes.length > 0 ? (
                  report.pzhgpComplianceNotes.map((note, idx) => (
                    <View key={idx} style={styles.warningBox}>
                      <Text style={styles.warningBoxText}>⚠️ {note}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.okBox}>
                    <Text style={styles.okBoxText}>
                      ✅ Wszystkie procedury pojenia i wentylacji są w pełni zgodne z Regulaminem PZHGP.
                    </Text>
                  </View>
                )}
                <Text style={styles.rulesSummary}>
                  • Obowiązek pojenia: Transport trwający powyżej 12h wymaga min. 1 sesji pojenia, a powyżej 20h min. 2 sesji.{'\n'}
                  • Minimalny przepływ powietrza: 20-30 m³/h na 100 ptaków zapobiega hipertermii.{'\n'}
                  • Przy ubytku masy wodnej &gt; 4.5% nakazuje się bezwzględne opóźnienie startu i podanie wody z elektrolitem.
                </Text>
              </View>
            </View>
          )}

          {activeTab === 'flock' && (
            <View style={styles.tabContentContainer}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>BILANS CAŁKOWITY DLA KABINY ({birdsCountInCabin} GOŁĘBI)</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Łączna woda wyparowana przez stado:</Text>
                  <Text style={[styles.summaryVal, { color: '#EF4444' }]}>
                    {report.totalFlockWaterLossLiters} Litrów
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Woda podana i wypita z korytek:</Text>
                  <Text style={[styles.summaryVal, { color: '#10B981' }]}>
                    +{report.totalFlockWaterReplenishedLiters} Litrów
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Woda pobrana / ptaka (średnio):</Text>
                  <Text style={styles.summaryVal}>
                    {report.waterReplenishedMlPerBird} ml
                  </Text>
                </View>
                <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.summaryLabel}>Końcowy deficyt płynów na ptaka:</Text>
                  <Text style={[styles.summaryVal, { color: '#38BDF8' }]}>
                    {report.netFluidDeficitMlPerBird} ml ({report.dehydrationPercentBodyWeight}%)
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <FieldButton
              title="Drukuj Raport A4"
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
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8A92A0',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  presetButton: {
    flex: 1,
    height: 52,
    backgroundColor: '#1E2229',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D333D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetButtonActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#0284C725',
  },
  presetButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F0F2F5',
  },
  presetSubText: {
    fontSize: 9,
    color: '#8A92A0',
    marginTop: 1,
  },
  kpiCard: {
    backgroundColor: '#1A1D23',
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 16,
  },
  kpiTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskText: {
    fontSize: 11,
    fontWeight: '800',
  },
  kpiHours: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F0F2F5',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#22262E',
    padding: 10,
    borderRadius: 8,
  },
  kpiVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F0F2F5',
  },
  kpiDesc: {
    fontSize: 10,
    color: '#8A92A0',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#1A1D23',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#262A30',
    padding: 14,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8A92A0',
    marginBottom: 10,
    letterSpacing: 0.5,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#F0F2F5',
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
    minWidth: 50,
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
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
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
  tabContentContainer: {
    marginBottom: 16,
  },
  analysisText: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 12,
  },
  guidelineDivider: {
    height: 1,
    backgroundColor: '#262A30',
    marginVertical: 10,
  },
  guidelineTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F0F2F5',
    marginBottom: 6,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 3,
  },
  recDot: {
    color: '#38BDF8',
    fontSize: 14,
    marginRight: 6,
    lineHeight: 18,
  },
  recText: {
    flex: 1,
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
  warningBox: {
    backgroundColor: '#EF444420',
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
  },
  warningBoxText: {
    color: '#FCA5A5',
    fontSize: 12,
    lineHeight: 17,
  },
  okBox: {
    backgroundColor: '#10B98120',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
  },
  okBoxText: {
    color: '#86EFAC',
    fontSize: 12,
    lineHeight: 17,
  },
  rulesSummary: {
    fontSize: 11,
    color: '#8A92A0',
    lineHeight: 18,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#262A30',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8A92A0',
    flex: 1,
  },
  summaryVal: {
    fontSize: 13,
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

/**
 * PIGEON-FLY — Post-Race Electrolyte & Energy Recovery Modal (Z-077 / DEC-91)
 * Field Mode ergonomic interface (>= 48-56pt touch targets), dark theme (#121417).
 * Evaluates mass loss, fluid/lipid deficit, creates exact 2-phase rehydration and muscle recovery plans.
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
  evaluatePostRaceDeficit,
  generatePostRaceRestitutionHtml,
  PostRaceDeficitInput,
  ClinicalSigns,
} from '../domain/postRaceRestitution';
import { PdfService } from '../services/pdfService';
import { FieldButton } from './FieldButton';

interface PostRaceRestitutionModalProps {
  visible: boolean;
  onClose: () => void;
  loftName?: string;
  defaultRaceName?: string;
}

export const PostRaceRestitutionModal: React.FC<PostRaceRestitutionModalProps> = ({
  visible,
  onClose,
  loftName = 'Gołębnik Mistrza Pigeon-Fly',
  defaultRaceName = 'Lot Konkursowy PZHGP',
}) => {
  // Input states
  const [ringNumber, setRingNumber] = useState('PL-0284-23-1402');
  const [normalWeight, setNormalWeight] = useState(420);
  const [returnWeight, setReturnWeight] = useState(385);
  const [raceDistanceKm, setRaceDistanceKm] = useState(450);
  const [flightDurationHours, setFlightDurationHours] = useState(6.5);
  const [ambientTempC, setAmbientTempC] = useState(26);
  const [birdsCount, setBirdsCount] = useState(20);

  // Clinical signs
  const [sunkenEyes, setSunkenEyes] = useState(false);
  const [blueBreastSkin, setBlueBreastSkin] = useState(false);
  const [sharpKeel, setSharpKeel] = useState(false);
  const [dryCrop, setDryCrop] = useState(false);
  const [exhaustedPanting, setExhaustedPanting] = useState(false);

  // Active view tab: 'overview' | 'phase1' | 'phase2'
  const [activeTab, setActiveTab] = useState<'overview' | 'phase1' | 'phase2'>('overview');

  const clinicalSigns: ClinicalSigns = useMemo(() => ({
    sunkenEyes,
    blueBreastSkin,
    sharpKeel,
    dryCrop,
    exhaustedPanting,
  }), [sunkenEyes, blueBreastSkin, sharpKeel, dryCrop, exhaustedPanting]);

  const deficitInput: PostRaceDeficitInput = useMemo(() => ({
    ringNumber,
    normalWeightGrams: normalWeight,
    returnWeightGrams: returnWeight,
    raceDistanceKm,
    flightDurationHours,
    ambientTempC,
    clinicalSigns,
  }), [ringNumber, normalWeight, returnWeight, raceDistanceKm, flightDurationHours, ambientTempC, clinicalSigns]);

  const evaluation = useMemo(() => {
    return evaluatePostRaceDeficit(deficitInput, birdsCount);
  }, [deficitInput, birdsCount]);

  // Presets
  const applyPreset = (preset: 'standard' | 'heat' | 'catastrophic') => {
    if (preset === 'standard') {
      setNormalWeight(420);
      setReturnWeight(402); // -4.3%
      setRaceDistanceKm(350);
      setFlightDurationHours(4.5);
      setAmbientTempC(22);
      setSunkenEyes(false);
      setBlueBreastSkin(false);
      setSharpKeel(false);
      setDryCrop(false);
      setExhaustedPanting(false);
    } else if (preset === 'heat') {
      setNormalWeight(425);
      setReturnWeight(385); // -9.4%
      setRaceDistanceKm(540);
      setFlightDurationHours(8.0);
      setAmbientTempC(29);
      setSunkenEyes(true);
      setBlueBreastSkin(false);
      setSharpKeel(false);
      setDryCrop(true);
      setExhaustedPanting(true);
    } else {
      setNormalWeight(430);
      setReturnWeight(372); // -13.5%
      setRaceDistanceKm(720);
      setFlightDurationHours(11.5);
      setAmbientTempC(32);
      setSunkenEyes(true);
      setBlueBreastSkin(true);
      setSharpKeel(true);
      setDryCrop(true);
      setExhaustedPanting(true);
    }
  };

  const handlePrintProtocol = async () => {
    try {
      const html = generatePostRaceRestitutionHtml(evaluation, {
        loftName,
        raceName: defaultRaceName,
        seasonYear: new Date().getFullYear(),
      });
      await PdfService.printHtml(html);
    } catch (err: any) {
      Alert.alert('Błąd wydruku', err?.message || 'Nie udało się wydrukować protokołu.');
    }
  };

  const handleSharePdf = async () => {
    try {
      const html = generatePostRaceRestitutionHtml(evaluation, {
        loftName,
        raceName: defaultRaceName,
        seasonYear: new Date().getFullYear(),
      });
      await PdfService.shareHtmlAsPdf(
        html,
        `Protokol_Restytucji_Lotowej_${evaluation.ringNumber}.pdf`
      );
    } catch (err: any) {
      Alert.alert('Błąd eksportu', err?.message || 'Nie udało się wyeksportować PDF.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>⚡ Bilans Elektrolitowy i Restytucja</Text>
            <Text style={styles.headerSubtitle}>
              Fizjologia powrotowa, osmolarność poidła & BCAA (Z-077)
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Zamknij okno"
            testID="btn-close-restitution-modal"
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'overview' && styles.tabItemActive]}
            onPress={() => setActiveTab('overview')}
            testID="tab-restitution-overview"
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
              Deficyt & Objawy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'phase1' && styles.tabItemActive]}
            onPress={() => setActiveTab('phase1')}
            testID="tab-restitution-phase1"
          >
            <Text style={[styles.tabText, activeTab === 'phase1' && styles.tabTextActive]}>
              Faza I: Poidło 0-3h
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'phase2' && styles.tabItemActive]}
            onPress={() => setActiveTab('phase2')}
            testID="tab-restitution-phase2"
          >
            <Text style={[styles.tabText, activeTab === 'phase2' && styles.tabTextActive]}>
              Faza II: Mięśnie & BCAA
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Quick Presets */}
          <View style={styles.presetSection}>
            <Text style={styles.sectionHeading}>Szybkie profile obciążenia:</Text>
            <View style={styles.presetRow}>
              <TouchableOpacity
                style={styles.presetBtn}
                onPress={() => applyPreset('standard')}
                testID="preset-standard"
              >
                <Text style={styles.presetBtnText}>Średni 350km</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.presetBtn, styles.presetBtnOrange]}
                onPress={() => applyPreset('heat')}
                testID="preset-heat"
              >
                <Text style={styles.presetBtnText}>Upalny 540km</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.presetBtn, styles.presetBtnRed]}
                onPress={() => applyPreset('catastrophic')}
                testID="preset-catastrophic"
              >
                <Text style={styles.presetBtnText}>Ciężki 720km</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Top KPI Card */}
          <View style={[styles.kpiCard, { borderColor: evaluation.severityColor }]}>
            <View style={styles.kpiTopRow}>
              <View>
                <Text style={styles.kpiRing}>{evaluation.ringNumber}</Text>
                <Text style={[styles.severityBadge, { backgroundColor: evaluation.severityColor }]}>
                  {evaluation.severityLabel}
                </Text>
              </View>
              <View style={styles.kpiBigNumberBox}>
                <Text style={[styles.kpiBigPercent, { color: evaluation.severityColor }]}>
                  -{evaluation.massLossPercent.toFixed(1)}%
                </Text>
                <Text style={styles.kpiSubLabel}>Ubytek wagi ({evaluation.massLossGrams} g)</Text>
              </View>
            </View>

            <View style={styles.kpiMetricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>💧 {evaluation.estimatedFluidDeficitMl} ml</Text>
                <Text style={styles.metricDesc}>Deficyt wody (75%)</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>🔥 {evaluation.estimatedLipidCombustedGrams} g</Text>
                <Text style={styles.metricDesc}>Spalony tłuszcz (25%)</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>⏱️ {evaluation.phase2.recoveryEstimatedHours} h</Text>
                <Text style={styles.metricDesc}>Czas restytucji</Text>
              </View>
            </View>
          </View>

          {/* TAB 1: OVERVIEW & CLINICAL SIGNS */}
          {activeTab === 'overview' && (
            <View>
              {/* Steppers for weights & race parameters */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Pomiary Wagowe & Parametry Trasy</Text>

                <View style={styles.stepperRow}>
                  <View style={styles.stepperCol}>
                    <Text style={styles.stepperLabel}>Waga wyjściowa (g)</Text>
                    <View style={styles.stepperControls}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setNormalWeight((w) => Math.max(300, w - 5))}
                        testID="btn-dec-normal-weight"
                      >
                        <Text style={styles.stepBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepValue}>{normalWeight} g</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setNormalWeight((w) => Math.min(600, w + 5))}
                        testID="btn-inc-normal-weight"
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.stepperCol}>
                    <Text style={styles.stepperLabel}>Waga po powrocie (g)</Text>
                    <View style={styles.stepperControls}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setReturnWeight((w) => Math.max(250, w - 5))}
                        testID="btn-dec-return-weight"
                      >
                        <Text style={styles.stepBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepValue}>{returnWeight} g</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setReturnWeight((w) => Math.min(normalWeight, w + 5))}
                        testID="btn-inc-return-weight"
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={[styles.stepperRow, { marginTop: 14 }]}>
                  <View style={styles.stepperCol}>
                    <Text style={styles.stepperLabel}>Dystans lotu (km)</Text>
                    <View style={styles.stepperControls}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setRaceDistanceKm((d) => Math.max(50, d - 25))}
                        testID="btn-dec-distance"
                      >
                        <Text style={styles.stepBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepValue}>{raceDistanceKm} km</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setRaceDistanceKm((d) => Math.min(1200, d + 25))}
                        testID="btn-inc-distance"
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.stepperCol}>
                    <Text style={styles.stepperLabel}>Czas w locie (h)</Text>
                    <View style={styles.stepperControls}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setFlightDurationHours((h) => Math.max(1, Math.round((h - 0.5) * 10) / 10))}
                        testID="btn-dec-flight-hours"
                      >
                        <Text style={styles.stepBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepValue}>{flightDurationHours} h</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setFlightDurationHours((h) => Math.min(24, Math.round((h + 0.5) * 10) / 10))}
                        testID="btn-inc-flight-hours"
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={[styles.stepperRow, { marginTop: 14 }]}>
                  <View style={styles.stepperCol}>
                    <Text style={styles.stepperLabel}>Temperatura trasy (°C)</Text>
                    <View style={styles.stepperControls}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setAmbientTempC((t) => Math.max(10, t - 1))}
                        testID="btn-dec-temp"
                      >
                        <Text style={styles.stepBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepValue}>{ambientTempC} °C</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setAmbientTempC((t) => Math.min(42, t + 1))}
                        testID="btn-inc-temp"
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.stepperCol}>
                    <Text style={styles.stepperLabel}>Liczba ptaków w stadzie</Text>
                    <View style={styles.stepperControls}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setBirdsCount((c) => Math.max(5, c - 5))}
                        testID="btn-dec-birds"
                      >
                        <Text style={styles.stepBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepValue}>{birdsCount} szt.</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setBirdsCount((c) => Math.min(100, c + 5))}
                        testID="btn-inc-birds"
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Clinical Signs Checklist */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Kliniczna Ocena Powrotowa (Skala Wyczerpania)</Text>
                
                <TouchableOpacity
                  style={[styles.checkItem, sunkenEyes && styles.checkItemActive]}
                  onPress={() => setSunkenEyes(!sunkenEyes)}
                  testID="chk-sunken-eyes"
                >
                  <Text style={styles.checkIcon}>{sunkenEyes ? '☑️' : '◻️'}</Text>
                  <View style={styles.checkTexts}>
                    <Text style={styles.checkTitle}>Zapadnięte gałki oczne</Text>
                    <Text style={styles.checkSub}>Odwodnienie tkankowe oczodołu (utrata płynów wewnątrzkomórkowych)</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.checkItem, blueBreastSkin && styles.checkItemActive]}
                  onPress={() => setBlueBreastSkin(!blueBreastSkin)}
                  testID="chk-blue-breast"
                >
                  <Text style={styles.checkIcon}>{blueBreastSkin ? '☑️' : '◻️'}</Text>
                  <View style={styles.checkTexts}>
                    <Text style={styles.checkTitle}>Sinica skóry mięśnia piersiowego</Text>
                    <Text style={styles.checkSub}>Hipoksja, skurcz naczyniowy i wysokie nagromadzenie kwasu mlekowego</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.checkItem, sharpKeel && styles.checkItemActive]}
                  onPress={() => setSharpKeel(!sharpKeel)}
                  testID="chk-sharp-keel"
                >
                  <Text style={styles.checkIcon}>{sharpKeel ? '☑️' : '◻️'}</Text>
                  <View style={styles.checkTexts}>
                    <Text style={styles.checkTitle}>Wyostrzony grzebień mostka</Text>
                    <Text style={styles.checkSub}>Głęboki katabolizm białek mięśniowych (spalanie mięśnia w locie)</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.checkItem, dryCrop && styles.checkItemActive]}
                  onPress={() => setDryCrop(!dryCrop)}
                  testID="chk-dry-crop"
                >
                  <Text style={styles.checkIcon}>{dryCrop ? '☑️' : '◻️'}</Text>
                  <View style={styles.checkTexts}>
                    <Text style={styles.checkTitle}>Zapadnięte, suche wole</Text>
                    <Text style={styles.checkSub}>Całkowity brak treści płynnej w wolu po przylocie</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.checkItem, exhaustedPanting && styles.checkItemActive]}
                  onPress={() => setExhaustedPanting(!exhaustedPanting)}
                  testID="chk-panting"
                >
                  <Text style={styles.checkIcon}>{exhaustedPanting ? '☑️' : '◻️'}</Text>
                  <View style={styles.checkTexts}>
                    <Text style={styles.checkTitle}>Przyspieszony oddech / ziajanie</Text>
                    <Text style={styles.checkSub}>Alkalozę oddechową spowodowaną hiperwentylacją wyrównuje bufor cytrynianowy</Text>
                  </View>
                </TouchableOpacity>

                {evaluation.clinicalRiskSummary.length > 0 && (
                  <View style={styles.alertBox}>
                    <Text style={styles.alertTitle}>⚠️ Zidentyfikowane Zagrożenia Kliniczne:</Text>
                    {evaluation.clinicalRiskSummary.map((item, idx) => (
                      <Text key={idx} style={styles.alertItemText}>• {item}</Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* TAB 2: PHASE I REHYDRATION */}
          {activeTab === 'phase1' && (
            <View>
              <View style={styles.card}>
                <View style={styles.phaseHeaderRow}>
                  <Text style={styles.cardTitle}>Faza I: Poidło Powrotowe (Godziny 0–3)</Text>
                  <Text style={[styles.pillBadge, { backgroundColor: evaluation.phase1.solutionTonicity === 'hypotonic' ? '#3B82F6' : '#10B981' }]}>
                    {evaluation.phase1.solutionTonicity === 'hypotonic' ? 'HIPOTONIK (280 mOsm)' : 'IZOTONIK (290-305 mOsm)'}
                  </Text>
                </View>
                <Text style={styles.phaseDescText}>
                  Cel: Błyskawiczne nawodnienie łożyska naczyniowego bez efektu obrzęku komórek oraz łagodne uzupełnienie glikogenu wątrobowego.
                </Text>

                <View style={styles.drinkerSpecsBox}>
                  <Text style={styles.drinkerSpecTitle}>Objętość poidła dla {birdsCount} ptaków: {evaluation.phase1.drinkerWaterLiters} L wody</Text>
                  <Text style={styles.drinkerSpecSub}>Docelowa osmolarność: {evaluation.phase1.targetOsmolalityMOsmKg} mOsm/kg</Text>
                </View>

                {/* Recipe ingredients table */}
                <View style={styles.recipeTable}>
                  <View style={styles.recipeRow}>
                    <Text style={styles.recipeColName}>Glukoza lub Maltodekstryna</Text>
                    <Text style={styles.recipeColDose}>{evaluation.phase1.glucoseOrMaltodextrinGramsPerLiter} g/L</Text>
                    <Text style={styles.recipeColTotal}>
                      {(evaluation.phase1.glucoseOrMaltodextrinGramsPerLiter * evaluation.phase1.drinkerWaterLiters).toFixed(1)} g na poidło
                    </Text>
                  </View>

                  <View style={styles.recipeRow}>
                    <Text style={styles.recipeColName}>Chlorek Sodu (NaCl)</Text>
                    <Text style={styles.recipeColDose}>{evaluation.phase1.sodiumChlorideGramsPerLiter} g/L</Text>
                    <Text style={styles.recipeColTotal}>
                      {(evaluation.phase1.sodiumChlorideGramsPerLiter * evaluation.phase1.drinkerWaterLiters).toFixed(1)} g na poidło
                    </Text>
                  </View>

                  <View style={styles.recipeRow}>
                    <Text style={styles.recipeColName}>Chlorek Potasu (KCl)</Text>
                    <Text style={styles.recipeColDose}>{evaluation.phase1.potassiumChlorideGramsPerLiter} g/L</Text>
                    <Text style={styles.recipeColTotal}>
                      {(evaluation.phase1.potassiumChlorideGramsPerLiter * evaluation.phase1.drinkerWaterLiters).toFixed(1)} g na poidło
                    </Text>
                  </View>

                  <View style={[styles.recipeRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.recipeColName}>Cytrynian Sodu (Bufor kwasowy)</Text>
                    <Text style={styles.recipeColDose}>{evaluation.phase1.sodiumCitrateGramsPerLiter} g/L</Text>
                    <Text style={styles.recipeColTotal}>
                      {(evaluation.phase1.sodiumCitrateGramsPerLiter * evaluation.phase1.drinkerWaterLiters).toFixed(1)} g na poidło
                    </Text>
                  </View>
                </View>

                <View style={styles.tipBox}>
                  <Text style={styles.tipTitle}>💡 Zasady Bezpiecznego Podania Poidła:</Text>
                  <Text style={styles.tipText}>• {evaluation.phase1.waterTemperatureAdvice}</Text>
                  <Text style={styles.tipText}>• Limit wstępny: maks. {evaluation.phase1.maxInitialIntakeMlPerBird} ml/gołębia w pierwszych 15 minutach (ochrona przed zarzuceniem i wymiocinami).</Text>
                  <Text style={styles.tipText}>• {evaluation.phase1.timingAdvice}</Text>
                </View>
              </View>
            </View>
          )}

          {/* TAB 3: PHASE II MUSCLE RESTITUTION */}
          {activeTab === 'phase2' && (
            <View>
              <View style={styles.card}>
                <View style={styles.phaseHeaderRow}>
                  <Text style={styles.cardTitle}>Faza II: Odbudowa Mięśni & BCAA</Text>
                  <Text style={[styles.pillBadge, { backgroundColor: '#2563EB' }]}>
                    Czas: {evaluation.phase2.recoveryEstimatedHours}h
                  </Text>
                </View>
                <Text style={styles.phaseDescText}>
                  Podanie: Wieczór po locie oraz dzień +1. Zatrzymanie katabolizmu powysiłkowego, naprawa mikrourazów miofibryli mięśniowych i wypłukanie kwasu mlekowego.
                </Text>

                {/* Supplement dosages */}
                <View style={styles.supplementsList}>
                  <View style={styles.suppItem}>
                    <View style={styles.suppIconBox}>
                      <Text style={styles.suppIcon}>💪</Text>
                    </View>
                    <View style={styles.suppDetails}>
                      <Text style={styles.suppTitle}>BCAA 2:1:1 (Leucyna, Izoleucyna, Walina)</Text>
                      <Text style={styles.suppDosage}>{evaluation.phase2.bcaaDosageGramsPerKgFeed} g / 1 kg karmy</Text>
                      <Text style={styles.suppHint}>Blokuje enzymatyczny rozpad włókien mięśnia piersiowego.</Text>
                    </View>
                  </View>

                  <View style={styles.suppItem}>
                    <View style={styles.suppIconBox}>
                      <Text style={styles.suppIcon}>🥛</Text>
                    </View>
                    <View style={styles.suppDetails}>
                      <Text style={styles.suppTitle}>Izolat Białka Serwatkowego / Drożdże Piwne</Text>
                      <Text style={styles.suppDosage}>{evaluation.phase2.wheyProteinGramsPerKgFeed} g / 1 kg karmy</Text>
                      <Text style={styles.suppHint}>Pełnowartościowe źródło aminokwasów egzogennych do hipertrofii naprawczej.</Text>
                    </View>
                  </View>

                  <View style={styles.suppItem}>
                    <View style={styles.suppIconBox}>
                      <Text style={styles.suppIcon}>🧪</Text>
                    </View>
                    <View style={styles.suppDetails}>
                      <Text style={styles.suppTitle}>L-Karnityna</Text>
                      <Text style={styles.suppDosage}>{evaluation.phase2.lCarnitineMgPerLiterWater} mg / 1 L wody</Text>
                      <Text style={styles.suppHint}>Przyspiesza utylizację mleczanów i transport długołańcuchowych kwasów tłuszczowych.</Text>
                    </View>
                  </View>

                  <View style={styles.suppItem}>
                    <View style={styles.suppIconBox}>
                      <Text style={styles.suppIcon}>🛡️</Text>
                    </View>
                    <View style={styles.suppDetails}>
                      <Text style={styles.suppTitle}>Witamina E + Selen Organiczny</Text>
                      <Text style={styles.suppDosage}>{evaluation.phase2.vitaminEPlusSeleniumMgPerLiter} mg / 1 L wody</Text>
                      <Text style={styles.suppHint}>Potężny antyoksydant neutralizujący rodniki powstałe przy hipoksji powrotowej.</Text>
                    </View>
                  </View>
                </View>

                {/* Dietary guideline */}
                <View style={styles.dietBox}>
                  <Text style={styles.dietTitle}>🥣 Zalecenie Żywieniowe (Dieta Powrotowa):</Text>
                  <Text style={styles.dietText}>{evaluation.phase2.feedRecommendation}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons for PDF and AirPrint */}
          <View style={styles.actionSection}>
            <FieldButton
              title="🖨️ Drukuj Protokół A4 (AirPrint)"
              onPress={handlePrintProtocol}
              testID="btn-print-restitution-protocol"
              style={{ marginBottom: 10 }}
            />
            <FieldButton
              title="📄 Udostępnij Protokół PDF"
              onPress={handleSharePdf}
              testID="btn-share-restitution-pdf"
              variant="secondary"
              style={{ marginBottom: 10 }}
            />
            <FieldButton
              title="Zamknij"
              onPress={onClose}
              testID="btn-close-restitution"
              variant="secondary"
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F3F4F6',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E2127',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  closeBtnText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E2127',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: '#E5A93C',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#121417',
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  presetSection: {
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 6,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  presetBtnOrange: {
    borderColor: '#F59E0B',
  },
  presetBtnRed: {
    borderColor: '#EF4444',
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  kpiCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    marginBottom: 14,
  },
  kpiTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiRing: {
    fontSize: 16,
    fontWeight: '800',
    color: '#60A5FA',
    marginBottom: 4,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  kpiBigNumberBox: {
    alignItems: 'flex-end',
  },
  kpiBigPercent: {
    fontSize: 28,
    fontWeight: '900',
  },
  kpiSubLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  kpiMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2F343F',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F3F4F6',
  },
  metricDesc: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F3F4F6',
    marginBottom: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stepperCol: {
    flex: 1,
  },
  stepperLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121417',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  stepBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E5A93C',
  },
  stepValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#16191E',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  checkItemActive: {
    borderColor: '#EF4444',
    backgroundColor: '#261616',
  },
  checkIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  checkTexts: {
    flex: 1,
  },
  checkTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F3F4F6',
  },
  checkSub: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  alertBox: {
    backgroundColor: '#371818',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  alertTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FCA5A5',
    marginBottom: 4,
  },
  alertItemText: {
    fontSize: 10,
    color: '#FECACA',
    lineHeight: 14,
  },
  phaseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  phaseDescText: {
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 16,
    marginBottom: 12,
  },
  drinkerSpecsBox: {
    backgroundColor: '#121417',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    marginBottom: 12,
  },
  drinkerSpecTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#60A5FA',
  },
  drinkerSpecSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  recipeTable: {
    backgroundColor: '#121417',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 12,
    overflow: 'hidden',
  },
  recipeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
    alignItems: 'center',
  },
  recipeColName: {
    flex: 2,
    fontSize: 11,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  recipeColDose: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#E5A93C',
    textAlign: 'center',
  },
  recipeColTotal: {
    flex: 1.5,
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  tipBox: {
    backgroundColor: '#1C2433',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  tipTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#93C5FD',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 10,
    color: '#BFDBFE',
    lineHeight: 15,
  },
  supplementsList: {
    gap: 8,
    marginBottom: 12,
  },
  suppItem: {
    flexDirection: 'row',
    backgroundColor: '#121417',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2F343F',
    alignItems: 'center',
  },
  suppIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E2127',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  suppIcon: {
    fontSize: 18,
  },
  suppDetails: {
    flex: 1,
  },
  suppTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F3F4F6',
  },
  suppDosage: {
    fontSize: 12,
    fontWeight: '800',
    color: '#A78BFA',
    marginTop: 2,
  },
  suppHint: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  dietBox: {
    backgroundColor: '#1A2E20',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  dietTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6EE7B7',
    marginBottom: 4,
  },
  dietText: {
    fontSize: 11,
    color: '#D1FAE5',
    lineHeight: 16,
  },
  actionSection: {
    marginTop: 8,
  },
});

/**
 * PIGEON-FLY — Złota Księga Mistrzów i Roczny Bilans Hodowlano-Sportowy Stada (LoftAnnualPerformanceLedgerModal)
 * Jubileuszowy moduł Z-100 (DEC-114):
 * - Przegląd i edycja bilansu rocznego stada we wszystkich 4 filarach:
 *   1. Wyniki Sportowe i Tytuły Mistrzowskie (Wydajność %, Podia, Tytuły)
 *   2. Rozpłód i Lęgi (Zapłodnienie %, Klujność %, Odchów D24 %)
 *   3. Dobrostan i Przeżywalność Stada (Straty lotowe i drapieżniki, % przeżywalności)
 *   4. Złota Księga Mistrzów (Hall of Fame — wybitne asy rozpłodowe i lotowe)
 * - Obliczanie i prezentacja klasy medalowej stada (Diamentowy / Złoty / Srebrny / Brązowy Gołębnik).
 * - Generowanie i druk oficjalnego dyplomu / kroniki rocznej A4 AirPrint/PDF.
 * - Field Mode UX: touch targets >= 48-56 pt, wysoki kontrast.
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
  LoftAnnualPerformanceLedger,
  ChampionshipAchievement,
  HallOfFamePigeon,
  GRADE_LABELS,
  COMPETITION_LEVEL_LABELS,
  HALL_OF_FAME_STATUS_LABELS,
  calculateBasketingEfficiency,
  calculateBreedingMetrics,
  calculateFlockSurvivalRate,
  evaluateSeasonGrade,
  validateAnnualPerformanceLedger,
  generateLoftAnnualPerformanceLedgerHtml,
} from '../domain/loftAnnualPerformanceLedger';
import { PdfService } from '../services/pdfService';

interface LoftAnnualPerformanceLedgerModalProps {
  visible: boolean;
  onClose: () => void;
  defaultLoftName?: string;
  defaultBreederName?: string;
}

type TabType = 'overview' | 'racing' | 'championships' | 'breeding' | 'survival' | 'hall_of_fame';

const INITIAL_CHAMPIONSHIPS: ChampionshipAchievement[] = [
  {
    id: 'champ-01',
    title: 'Mistrz Oddziału',
    category: 'Kategoria A (Sprint 100-400 km)',
    level: 'branch',
    rank: 1,
    concourseCount: 40,
    coefficient: 142.35,
  },
  {
    id: 'champ-02',
    title: 'I Wicemistrz Okręgu',
    category: 'Generalne Mistrzostwo Polski (GMP)',
    level: 'district',
    rank: 2,
    competitionPoints: 1845.60,
    concourseCount: 35,
  },
  {
    id: 'champ-03',
    title: 'II Wicemistrz Oddziału',
    category: 'Kategoria Maraton (> 700 km)',
    level: 'branch',
    rank: 3,
    concourseCount: 18,
    coefficient: 88.14,
  },
];

const INITIAL_HALL_OF_FAME: HallOfFamePigeon[] = [
  {
    id: 'hof-01',
    ringNumber: 'PL-0284-21-1402',
    nameOrNick: 'Błękitna Błyskawica',
    sex: 'cock',
    plumageColor: 'Niebieski',
    birthYear: 2021,
    careerConcourses: 38,
    careerConcourseKm: 14650,
    bestCoefficient: 2.14,
    bloodlineLineage: 'Janssen / De Klak',
    status: 'active_legend',
    crowningAchievements: [
      '1. As Okręgu Poznań Kat. A 2024',
      '3 x 1. konkurs z lotu > 300 km',
      'Reprezentant na Wystawę Ogólnopolską',
    ],
  },
  {
    id: 'hof-02',
    ringNumber: 'PL-0284-19-8831',
    nameOrNick: 'Złota Dama Rozpłodu',
    sex: 'hen',
    plumageColor: 'Pstra',
    birthYear: 2019,
    careerConcourses: 29,
    careerConcourseKm: 11400,
    bestCoefficient: 5.12,
    bloodlineLineage: 'Gaby Vandenabeele',
    status: 'stud_pillar',
    crowningAchievements: [
      'Matka 6 asów oddziałowych',
      'Filar genetyczny linii średniodystansowej',
    ],
  },
];

export const LoftAnnualPerformanceLedgerModal: React.FC<LoftAnnualPerformanceLedgerModalProps> = ({
  visible,
  onClose,
  defaultLoftName = 'Mistrzowski Gołębnik Szmaragd',
  defaultBreederName = 'Łukasz Kowalski',
}) => {
  const currentYear = new Date().getFullYear();
  const todayIso = new Date().toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Metadane gołębnika
  const [seasonYear, setSeasonYear] = useState<number>(currentYear);
  const [loftName, setLoftName] = useState<string>(defaultLoftName);
  const [breederName, setBreederName] = useState<string>(defaultBreederName);
  const [breederPzhgpNumber, setBreederPzhgpNumber] = useState<string>('PL-0284-1234');
  const [sectionName, setSectionName] = useState<string>('Sekcja 1 Gostyń');
  const [branchNumber, setBranchNumber] = useState<string>('0284');
  const [branchName, setBranchName] = useState<string>('Gostyń');
  const [districtName, setDistrictName] = useState<string>('Okręg Poznań');

  // 1. Wyniki sportowe
  const [totalRaces, setTotalRaces] = useState<number>(14);
  const [totalBasketings, setTotalBasketings] = useState<number>(560);
  const [totalConcourses, setTotalConcourses] = useState<number>(185);
  const [totalConcourseKm, setTotalConcourseKm] = useState<number>(68420);
  const [firstPlaces, setFirstPlaces] = useState<number>(4);
  const [secondPlaces, setSecondPlaces] = useState<number>(6);
  const [thirdPlaces, setThirdPlaces] = useState<number>(3);
  const [topTenPlaces, setTopTenPlaces] = useState<number>(28);
  const [championships, setChampionships] = useState<ChampionshipAchievement[]>(INITIAL_CHAMPIONSHIPS);

  // Nowy tytuł mistrzowski (formularz dodawania)
  const [newChampTitle, setNewChampTitle] = useState<string>('');
  const [newChampCategory, setNewChampCategory] = useState<string>('');
  const [newChampLevel, setNewChampLevel] = useState<'section' | 'branch' | 'district' | 'region' | 'national'>('branch');
  const [newChampRank, setNewChampRank] = useState<string>('1');

  // 2. Rozpłód i Lęgi
  const [breedingPairsCount, setBreedingPairsCount] = useState<number>(20);
  const [eggsLaidCount, setEggsLaidCount] = useState<number>(80);
  const [eggsFertileCount, setEggsFertileCount] = useState<number>(76);
  const [eggsHatchedCount, setEggsHatchedCount] = useState<number>(74);
  const [squabsWeanedD24Count, setSquabsWeanedD24Count] = useState<number>(70);

  // 3. Stan stada i przeżywalność
  const [flockCountSeasonStart, setFlockCountSeasonStart] = useState<number>(85);
  const [youngRingedCount, setYoungRingedCount] = useState<number>(70);
  const [lossesInRaces, setLossesInRaces] = useState<number>(12);
  const [lossesLoftAndPredators, setLossesLoftAndPredators] = useState<number>(3);
  const [flockCountSeasonEnd, setFlockCountSeasonEnd] = useState<number>(140);

  // 4. Złota Księga (Hall of Fame)
  const [hallOfFame, setHallOfFame] = useState<HallOfFamePigeon[]>(INITIAL_HALL_OF_FAME);

  // Nowy As do Złotej Księgi
  const [newHofRing, setNewHofRing] = useState<string>('');
  const [newHofNick, setNewHofNick] = useState<string>('');
  const [newHofSex, setNewHofSex] = useState<'cock' | 'hen'>('cock');
  const [newHofColor, setNewHofColor] = useState<string>('Niebieski');
  const [newHofYear, setNewHofYear] = useState<string>('2022');
  const [newHofConcourses, setNewHofConcourses] = useState<string>('25');
  const [newHofKkm, setNewHofKkm] = useState<string>('9500');
  const [newHofCoeff, setNewHofCoeff] = useState<string>('3.50');
  const [newHofLineage, setNewHofLineage] = useState<string>('Janssen');
  const [newHofStatus, setNewHofStatus] = useState<'active_legend' | 'stud_pillar' | 'retired_hero'>('active_legend');
  const [newHofAchievement, setNewHofAchievement] = useState<string>('');

  // Obliczenia na bieżąco
  const basketingEfficiencyPct = useMemo(() => {
    return calculateBasketingEfficiency(totalConcourses, totalBasketings);
  }, [totalConcourses, totalBasketings]);

  const breedingMetrics = useMemo(() => {
    return calculateBreedingMetrics(
      eggsLaidCount,
      eggsFertileCount,
      eggsHatchedCount,
      squabsWeanedD24Count
    );
  }, [eggsLaidCount, eggsFertileCount, eggsHatchedCount, squabsWeanedD24Count]);

  const survivalRatePct = useMemo(() => {
    return calculateFlockSurvivalRate(
      flockCountSeasonStart,
      youngRingedCount,
      flockCountSeasonEnd
    );
  }, [flockCountSeasonStart, youngRingedCount, flockCountSeasonEnd]);

  const seasonEvaluation = useMemo(() => {
    return evaluateSeasonGrade(
      basketingEfficiencyPct,
      totalConcourses,
      championships.length,
      breedingMetrics.weaningRatePct
    );
  }, [basketingEfficiencyPct, totalConcourses, championships.length, breedingMetrics.weaningRatePct]);

  // Budowa pełnego obiektu
  const fullLedger: LoftAnnualPerformanceLedger = useMemo(() => {
    return {
      id: `ledger-${seasonYear}-${loftName.toLowerCase().replace(/\\s+/g, '-')}`,
      seasonYear,
      loftName,
      breederName,
      breederPzhgpNumber,
      sectionName,
      branchNumber,
      branchName,
      districtName,
      racingKpis: {
        totalRaces,
        totalBasketings,
        totalConcourses,
        basketingEfficiencyPct,
        totalConcourseKm,
        firstPlaces,
        secondPlaces,
        thirdPlaces,
        topTenPlaces,
        championships,
      },
      breedingKpis: {
        breedingPairsCount,
        eggsLaidCount,
        eggsFertileCount,
        eggsHatchedCount,
        squabsWeanedD24Count,
        fertilityRatePct: breedingMetrics.fertilityRatePct,
        hatchabilityRatePct: breedingMetrics.hatchabilityRatePct,
        weaningRatePct: breedingMetrics.weaningRatePct,
      },
      survivalBalance: {
        flockCountSeasonStart,
        youngRingedCount,
        lossesInRaces,
        lossesLoftAndPredators,
        flockCountSeasonEnd,
        survivalRatePct,
      },
      hallOfFame,
      seasonEvaluationGrade: seasonEvaluation.grade,
      evaluationRationale: seasonEvaluation.rationale,
      generationDate: todayIso,
      breederSignatureConfirmed: true,
    };
  }, [
    seasonYear,
    loftName,
    breederName,
    breederPzhgpNumber,
    sectionName,
    branchNumber,
    branchName,
    districtName,
    totalRaces,
    totalBasketings,
    totalConcourses,
    basketingEfficiencyPct,
    totalConcourseKm,
    firstPlaces,
    secondPlaces,
    thirdPlaces,
    topTenPlaces,
    championships,
    breedingPairsCount,
    eggsLaidCount,
    eggsFertileCount,
    eggsHatchedCount,
    squabsWeanedD24Count,
    breedingMetrics,
    flockCountSeasonStart,
    youngRingedCount,
    lossesInRaces,
    lossesLoftAndPredators,
    flockCountSeasonEnd,
    survivalRatePct,
    hallOfFame,
    seasonEvaluation,
    todayIso,
  ]);

  // Dodawanie tytułu mistrzowskiego
  const handleAddChampionship = () => {
    if (!newChampTitle.trim()) {
      Alert.alert('Błąd', 'Podaj tytuł mistrzowski (np. Mistrz Oddziału)');
      return;
    }
    const newEntry: ChampionshipAchievement = {
      id: `champ-${Date.now()}`,
      title: newChampTitle.trim(),
      category: newChampCategory.trim() || 'Ogólna',
      level: newChampLevel,
      rank: isNaN(Number(newChampRank)) ? newChampRank : Number(newChampRank),
    };
    setChampionships([...championships, newEntry]);
    setNewChampTitle('');
    setNewChampCategory('');
  };

  const handleRemoveChampionship = (id: string) => {
    setChampionships(championships.filter((c) => c.id !== id));
  };

  // Dodawanie Asa do Złotej Księgi
  const handleAddHallOfFame = () => {
    if (!newHofRing.trim()) {
      Alert.alert('Błąd', 'Podaj numer obrączki rodowej asa.');
      return;
    }
    const newEntry: HallOfFamePigeon = {
      id: `hof-${Date.now()}`,
      ringNumber: newHofRing.trim(),
      nameOrNick: newHofNick.trim() || undefined,
      sex: newHofSex,
      plumageColor: newHofColor.trim() || 'Niebieski',
      birthYear: parseInt(newHofYear, 10) || currentYear - 2,
      careerConcourses: parseInt(newHofConcourses, 10) || 0,
      careerConcourseKm: parseFloat(newHofKkm) || 0,
      bestCoefficient: parseFloat(newHofCoeff) || 0,
      bloodlineLineage: newHofLineage.trim() || 'Własna linia hodowlana',
      status: newHofStatus,
      crowningAchievements: newHofAchievement.trim() ? [newHofAchievement.trim()] : [],
    };
    setHallOfFame([...hallOfFame, newEntry]);
    setNewHofRing('');
    setNewHofNick('');
    setNewHofAchievement('');
  };

  const handleRemoveHallOfFame = (id: string) => {
    setHallOfFame(hallOfFame.filter((h) => h.id !== id));
  };

  // Eksport A4 AirPrint/PDF
  const handleExportPdf = async () => {
    const validation = validateAnnualPerformanceLedger(fullLedger);
    if (!validation.isValid) {
      Alert.alert('Błąd walidacji bilansu', validation.errors.join('\\n'));
      return;
    }

    try {
      const html = generateLoftAnnualPerformanceLedgerHtml(fullLedger);
      await PdfService.printHtml(html);
    } catch (err) {
      Alert.alert('Błąd drukowania', 'Nie udało się wygenerować dokumentu A4.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      testID="modal-loft-annual-performance-ledger"
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>JUBILEUSZOWY BILANS STADA (Z-100)</Text>
            <Text style={styles.headerTitle}>🌟 Złota Księga Mistrzów</Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            testID="btn-close-annual-ledger"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Klasa medalowa stada */}
        <View style={styles.gradeBanner}>
          <Text style={styles.gradeBannerTitle}>{seasonEvaluation.label}</Text>
          <Text style={styles.gradeBannerDesc}>{seasonEvaluation.rationale}</Text>
        </View>

        {/* Tab navigation */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'overview' && styles.tabItemActive]}
            onPress={() => setActiveTab('overview')}
            testID="tab-overview"
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
              Gołębnik
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'racing' && styles.tabItemActive]}
            onPress={() => setActiveTab('racing')}
            testID="tab-racing"
          >
            <Text style={[styles.tabText, activeTab === 'racing' && styles.tabTextActive]}>
              Sport ({basketingEfficiencyPct}%)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'championships' && styles.tabItemActive]}
            onPress={() => setActiveTab('championships')}
            testID="tab-championships"
          >
            <Text style={[styles.tabText, activeTab === 'championships' && styles.tabTextActive]}>
              Tytuły ({championships.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'breeding' && styles.tabItemActive]}
            onPress={() => setActiveTab('breeding')}
            testID="tab-breeding"
          >
            <Text style={[styles.tabText, activeTab === 'breeding' && styles.tabTextActive]}>
              Lęgi ({breedingMetrics.weaningRatePct}%)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'survival' && styles.tabItemActive]}
            onPress={() => setActiveTab('survival')}
            testID="tab-survival"
          >
            <Text style={[styles.tabText, activeTab === 'survival' && styles.tabTextActive]}>
              Stan ({survivalRatePct}%)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'hall_of_fame' && styles.tabItemActive]}
            onPress={() => setActiveTab('hall_of_fame')}
            testID="tab-hall-of-fame"
          >
            <Text style={[styles.tabText, activeTab === 'hall_of_fame' && styles.tabTextActive]}>
              Księga Asów ({hallOfFame.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* TAB: OVERVIEW / GOŁĘBNIK */}
          {activeTab === 'overview' && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Metadane Hodowli & Gołębnika</Text>

              <Text style={styles.inputLabel}>Nazwa Gołębnika</Text>
              <TextInput
                style={styles.input}
                value={loftName}
                onChangeText={setLoftName}
                testID="input-loft-name"
                placeholder="np. Mistrzowski Gołębnik Szmaragd"
                placeholderTextColor="#777"
              />

              <Text style={styles.inputLabel}>Imię i Nazwisko Hodowcy</Text>
              <TextInput
                style={styles.input}
                value={breederName}
                onChangeText={setBreederName}
                testID="input-breeder-name"
                placeholder="np. Łukasz Kowalski"
                placeholderTextColor="#777"
              />

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Nr PZHGP</Text>
                  <TextInput
                    style={styles.input}
                    value={breederPzhgpNumber}
                    onChangeText={setBreederPzhgpNumber}
                    testID="input-pzhgp-number"
                    placeholder="np. PL-0284-1234"
                    placeholderTextColor="#777"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Rok Sezonu</Text>
                  <TextInput
                    style={styles.input}
                    value={String(seasonYear)}
                    onChangeText={(val) => setSeasonYear(parseInt(val, 10) || currentYear)}
                    testID="input-season-year"
                    keyboardType="numeric"
                    placeholderTextColor="#777"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Oddział PZHGP</Text>
                  <TextInput
                    style={styles.input}
                    value={branchName}
                    onChangeText={setBranchName}
                    testID="input-branch-name"
                    placeholder="np. 0284 Gostyń"
                    placeholderTextColor="#777"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Okręg PZHGP</Text>
                  <TextInput
                    style={styles.input}
                    value={districtName}
                    onChangeText={setDistrictName}
                    testID="input-district-name"
                    placeholder="np. Okręg Poznań"
                    placeholderTextColor="#777"
                  />
                </View>
              </View>
            </View>
          )}

          {/* TAB: RACING / WYNIKI SPORTOWE */}
          {activeTab === 'racing' && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Bilans Sportowo-Lotowy Sezonu</Text>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{totalConcourses}</Text>
                  <Text style={styles.statLbl}>Konkursy</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{totalBasketings}</Text>
                  <Text style={styles.statLbl}>Koszowania</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: '#E5A93C' }]}>{basketingEfficiencyPct}%</Text>
                  <Text style={styles.statLbl}>Wydajność</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{totalConcourseKm.toLocaleString('pl-PL')}</Text>
                  <Text style={styles.statLbl}>kkm stada</Text>
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Liczba lotów</Text>
                  <TextInput
                    style={styles.input}
                    value={String(totalRaces)}
                    onChangeText={(v) => setTotalRaces(parseInt(v, 10) || 0)}
                    keyboardType="numeric"
                    testID="input-total-races"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Gołębiokoszowań</Text>
                  <TextInput
                    style={styles.input}
                    value={String(totalBasketings)}
                    onChangeText={(v) => setTotalBasketings(parseInt(v, 10) || 0)}
                    keyboardType="numeric"
                    testID="input-total-basketings"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Zdobytych konkursów</Text>
                  <TextInput
                    style={styles.input}
                    value={String(totalConcourses)}
                    onChangeText={(v) => setTotalConcourses(parseInt(v, 10) || 0)}
                    keyboardType="numeric"
                    testID="input-total-concourses"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Łącznie kkm</Text>
                  <TextInput
                    style={styles.input}
                    value={String(totalConcourseKm)}
                    onChangeText={(v) => setTotalConcourseKm(parseInt(v, 10) || 0)}
                    keyboardType="numeric"
                    testID="input-total-kkm"
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Pozycje na Podium w Lotach</Text>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>🥇 1. miejsca</Text>
                  <TextInput
                    style={styles.input}
                    value={String(firstPlaces)}
                    onChangeText={(v) => setFirstPlaces(parseInt(v, 10) || 0)}
                    keyboardType="numeric"
                    testID="input-first-places"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>🥈 2. miejsca</Text>
                  <TextInput
                    style={styles.input}
                    value={String(secondPlaces)}
                    onChangeText={(v) => setSecondPlaces(parseInt(v, 10) || 0)}
                    keyboardType="numeric"
                    testID="input-second-places"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>🥉 3. miejsca</Text>
                  <TextInput
                    style={styles.input}
                    value={String(thirdPlaces)}
                    onChangeText={(v) => setThirdPlaces(parseInt(v, 10) || 0)}
                    keyboardType="numeric"
                    testID="input-third-places"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>🎯 Top 10</Text>
                  <TextInput
                    style={styles.input}
                    value={String(topTenPlaces)}
                    onChangeText={(v) => setTopTenPlaces(parseInt(v, 10) || 0)}
                    keyboardType="numeric"
                    testID="input-top-ten"
                  />
                </View>
              </View>
            </View>
          )}

          {/* TAB: CHAMPIONSHIPS / TYTUŁY MISTRZOWSKIE */}
          {activeTab === 'championships' && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Tytuły Mistrzowskie ({championships.length})</Text>

              {championships.map((champ) => (
                <View key={champ.id} style={styles.listItemCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>
                      {champ.rank}. {champ.title} ({COMPETITION_LEVEL_LABELS[champ.level]})
                    </Text>
                    <Text style={styles.itemSub}>{champ.category}</Text>
                    <Text style={styles.itemMeta}>
                      Konkursy: {champ.concourseCount ?? '-'} | Coeff: {champ.coefficient ?? '-'} | Pkt: {champ.competitionPoints ?? '-'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleRemoveChampionship(champ.id)}
                  >
                    <Text style={styles.deleteButtonText}>Usuń</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>Dodaj Tytuł Mistrzowski</Text>
              <TextInput
                style={styles.input}
                value={newChampTitle}
                onChangeText={setNewChampTitle}
                placeholder="np. Mistrz Oddziału, I Wicemistrz Okręgu"
                placeholderTextColor="#777"
                testID="input-new-champ-title"
              />
              <TextInput
                style={styles.input}
                value={newChampCategory}
                onChangeText={setNewChampCategory}
                placeholder="np. Kat. A Sprint, Generalne Mistrzostwo Polski"
                placeholderTextColor="#777"
                testID="input-new-champ-cat"
              />
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Lokata</Text>
                  <TextInput
                    style={styles.input}
                    value={newChampRank}
                    onChangeText={setNewChampRank}
                    placeholder="np. 1"
                    placeholderTextColor="#777"
                    testID="input-new-champ-rank"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Szczebel</Text>
                  <View style={styles.choiceRow}>
                    {(['branch', 'district', 'national'] as const).map((lvl) => (
                      <TouchableOpacity
                        key={lvl}
                        style={[
                          styles.choiceChip,
                          newChampLevel === lvl && styles.choiceChipActive,
                        ]}
                        onPress={() => setNewChampLevel(lvl)}
                      >
                        <Text
                          style={[
                            styles.choiceChipText,
                            newChampLevel === lvl && styles.choiceChipTextActive,
                          ]}
                        >
                          {lvl === 'branch' ? 'Oddz.' : lvl === 'district' ? 'Okręg' : 'Polska'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <FieldButton
                title="+ Dodaj Osiągnięcie Mistrzowskie"
                onPress={handleAddChampionship}
                testID="btn-add-championship"
                variant="secondary"
                style={{ marginTop: 10 }}
              />
            </View>
          )}

          {/* TAB: BREEDING / ROZPŁÓD & LĘGI */}
          {activeTab === 'breeding' && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Bilans Rozpłodowo-Lęgowy</Text>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{breedingPairsCount}</Text>
                  <Text style={styles.statLbl}>Pary lęgowe</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: '#4CAF50' }]}>
                    {breedingMetrics.fertilityRatePct}%
                  </Text>
                  <Text style={styles.statLbl}>Zapłodnienie</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: '#2196F3' }]}>
                    {breedingMetrics.hatchabilityRatePct}%
                  </Text>
                  <Text style={styles.statLbl}>Klujność</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: '#E5A93C' }]}>
                    {breedingMetrics.weaningRatePct}%
                  </Text>
                  <Text style={styles.statLbl}>Odchów D24</Text>
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Liczba par lęgowych</Text>
                  <TextInput
                    style={styles.input}
                    value={String(breedingPairsCount)}
                    onChangeText={(v) => setBreedingPairsCount(parseInt(v, 10) || 0)}
                    keyboardType="numeric"
                    testID="input-breeding-pairs"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Zniesionych jaj</Text>
                  <TextInput
                    style={styles.input}
                    value={String(eggsLaidCount)}
                    onChangeText={(v) => setEggsLaidCount(parseInt(v, 10) || 0)}
                    keyboardType="numeric"
                    testID="input-eggs-laid"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Jaj zapłodnionych</Text>
                  <TextInput
                    style={styles.input}
                    value={String(eggsFertileCount)}
                    onChangeText={(v) => setEggsFertileCount(parseInt(v, 10) || 0)}
                    keyboardType="numeric"
                    testID="input-eggs-fertile"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Wyklutych piskląt</Text>
                  <TextInput
                    style={styles.input}
                    value={String(eggsHatchedCount)}
                    onChangeText={(v) => setEggsHatchedCount(parseInt(v, 10) || 0)}
                    keyboardType="numeric"
                    testID="input-eggs-hatched"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Odsadzonych młódków D24 (z obrączką)</Text>
              <TextInput
                style={styles.input}
                value={String(squabsWeanedD24Count)}
                onChangeText={(v) => setSquabsWeanedD24Count(parseInt(v, 10) || 0)}
                keyboardType="numeric"
                testID="input-squabs-weaned"
              />
            </View>
          )}

          {/* TAB: SURVIVAL / DOBROSTAN & PRZEŻYWALNOŚĆ */}
          {activeTab === 'survival' && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Bilans Dobrostanu i Przeżywalności Stada</Text>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{flockCountSeasonStart}</Text>
                  <Text style={styles.statLbl}>Stan startowy</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{youngRingedCount}</Text>
                  <Text style={styles.statLbl}>Zaobrączkowane</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: '#E53935' }]}>
                    {lossesInRaces + lossesLoftAndPredators}
                  </Text>
                  <Text style={styles.statLbl}>Straty</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: '#4CAF50' }]}>{survivalRatePct}%</Text>
                  <Text style={styles.statLbl}>Przeżywalność</Text>
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Stan stada na wiosnę</Text>
                  <TextInput
                    style={styles.input}
                    value={String(flockCountSeasonStart)}
                    onChangeText={(v) => setFlockCountSeasonStart(parseInt(v, 10) || 0)}
                    keyboardType="numeric"
                    testID="input-flock-start"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Młode zaobrączkowane</Text>
                  <TextInput
                    style={styles.input}
                    value={String(youngRingedCount)}
                    onChangeText={(v) => setYoungRingedCount(parseInt(v, 10) || 0)}
                    keyboardType="numeric"
                    testID="input-young-ringed"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Straty na lotach</Text>
                  <TextInput
                    style={styles.input}
                    value={String(lossesInRaces)}
                    onChangeText={(v) => setLossesInRaces(parseInt(v, 10) || 0)}
                    keyboardType="numeric"
                    testID="input-losses-races"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Straty (drapieżniki / zdrowie)</Text>
                  <TextInput
                    style={styles.input}
                    value={String(lossesLoftAndPredators)}
                    onChangeText={(v) => setLossesLoftAndPredators(parseInt(v, 10) || 0)}
                    keyboardType="numeric"
                    testID="input-losses-loft"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Stan stada na koniec sezonu (jesień)</Text>
              <TextInput
                style={styles.input}
                value={String(flockCountSeasonEnd)}
                onChangeText={(v) => setFlockCountSeasonEnd(parseInt(v, 10) || 0)}
                keyboardType="numeric"
                testID="input-flock-end"
              />
            </View>
          )}

          {/* TAB: HALL OF FAME / ZŁOTA KSIĘGA MISTRZÓW */}
          {activeTab === 'hall_of_fame' && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Panteon Wybitnych Asów ({hallOfFame.length})</Text>

              {hallOfFame.map((pigeon) => (
                <View key={pigeon.id} style={styles.hofCard}>
                  <View style={styles.hofHeader}>
                    <Text style={styles.hofRing}>{pigeon.ringNumber}</Text>
                    {pigeon.nameOrNick && <Text style={styles.hofNick}>"{pigeon.nameOrNick}"</Text>}
                    <Text style={styles.hofSex}>{pigeon.sex === 'cock' ? '1.0 ♂' : '0.1 ♀'} ({pigeon.birthYear})</Text>
                  </View>
                  <Text style={styles.hofMeta}>
                    Linia: {pigeon.bloodlineLineage} | Barwa: {pigeon.plumageColor}
                  </Text>
                  <Text style={styles.hofStats}>
                    ⚡ {pigeon.careerConcourses} konk. | 🏁 {pigeon.careerConcourseKm.toLocaleString('pl-PL')} kkm | 🎯 Coeff: {pigeon.bestCoefficient.toFixed(2)}
                  </Text>
                  <Text style={styles.hofStatus}>{HALL_OF_FAME_STATUS_LABELS[pigeon.status]}</Text>
                  {pigeon.crowningAchievements.map((ach, idx) => (
                    <Text key={idx} style={styles.hofAchievement}>• {ach}</Text>
                  ))}
                  <TouchableOpacity
                    style={[styles.deleteButton, { alignSelf: 'flex-end', marginTop: 8 }]}
                    onPress={() => handleRemoveHallOfFame(pigeon.id)}
                  >
                    <Text style={styles.deleteButtonText}>Usuń z Księgi</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>Wpisz Nowego Asa do Złotej Księgi</Text>
              <TextInput
                style={styles.input}
                value={newHofRing}
                onChangeText={setNewHofRing}
                placeholder="Nr obrączki (np. PL-0284-22-1402)"
                placeholderTextColor="#777"
                testID="input-new-hof-ring"
              />
              <TextInput
                style={styles.input}
                value={newHofNick}
                onChangeText={setNewHofNick}
                placeholder="Przydomek (np. Błękitna Błyskawica)"
                placeholderTextColor="#777"
                testID="input-new-hof-nick"
              />

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Płeć</Text>
                  <View style={styles.choiceRow}>
                    <TouchableOpacity
                      style={[styles.choiceChip, newHofSex === 'cock' && styles.choiceChipActive]}
                      onPress={() => setNewHofSex('cock')}
                    >
                      <Text style={[styles.choiceChipText, newHofSex === 'cock' && styles.choiceChipTextActive]}>
                        Samiec 1.0
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.choiceChip, newHofSex === 'hen' && styles.choiceChipActive]}
                      onPress={() => setNewHofSex('hen')}
                    >
                      <Text style={[styles.choiceChipText, newHofSex === 'hen' && styles.choiceChipTextActive]}>
                        Samica 0.1
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Linia rodowodowa</Text>
                  <TextInput
                    style={styles.input}
                    value={newHofLineage}
                    onChangeText={setNewHofLineage}
                    placeholder="np. Janssen, Schellens"
                    placeholderTextColor="#777"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Konkursy kariery</Text>
                  <TextInput
                    style={styles.input}
                    value={newHofConcourses}
                    onChangeText={setNewHofConcourses}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Łącznie kkm</Text>
                  <TextInput
                    style={styles.input}
                    value={newHofKkm}
                    onChangeText={setNewHofKkm}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Top Coeff</Text>
                  <TextInput
                    style={styles.input}
                    value={newHofCoeff}
                    onChangeText={setNewHofCoeff}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Główne osiągnięcie / Tytuł Asa</Text>
              <TextInput
                style={styles.input}
                value={newHofAchievement}
                onChangeText={setNewHofAchievement}
                placeholder="np. 1. As Polski Kat. B 2025, 12 konk."
                placeholderTextColor="#777"
              />

              <FieldButton
                title="⭐ Wpisz Asa do Złotej Księgi"
                onPress={handleAddHallOfFame}
                testID="btn-add-hall-of-fame"
                variant="secondary"
                style={{ marginTop: 10 }}
              />
            </View>
          )}

          {/* Action Button: Export PDF */}
          <View style={styles.bottomActions}>
            <FieldButton
              title="📜 Drukuj Złotą Księgę & Bilans A4 (AirPrint/PDF)"
              onPress={handleExportPdf}
              testID="btn-export-annual-ledger-pdf"
              variant="primary"
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
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F0F2F5',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E2127',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  closeButtonText: {
    color: '#F0F2F5',
    fontSize: 18,
    fontWeight: '700',
  },
  gradeBanner: {
    margin: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#262215',
    borderWidth: 1.5,
    borderColor: '#E5A93C',
  },
  gradeBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E5A93C',
    marginBottom: 4,
  },
  gradeBannerDesc: {
    fontSize: 12,
    color: '#E0E0E0',
    lineHeight: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E2127',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabItemActive: {
    backgroundColor: '#2F343F',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E94A0',
  },
  tabTextActive: {
    color: '#E5A93C',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  sectionCard: {
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#E5A93C',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A0A6B2',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#121417',
    borderWidth: 1,
    borderColor: '#2F343F',
    borderRadius: 6,
    color: '#F0F2F5',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    minHeight: 44,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  col: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#121417',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F0F2F5',
  },
  statLbl: {
    fontSize: 9,
    color: '#8E94A0',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  listItemCard: {
    flexDirection: 'row',
    backgroundColor: '#121417',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F0F2F5',
  },
  itemSub: {
    fontSize: 12,
    color: '#E5A93C',
    marginTop: 2,
  },
  itemMeta: {
    fontSize: 11,
    color: '#8E94A0',
    marginTop: 2,
  },
  deleteButton: {
    backgroundColor: '#3a1e22',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#FF6B6B',
    fontSize: 11,
    fontWeight: '700',
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  choiceChip: {
    flex: 1,
    backgroundColor: '#121417',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  choiceChipActive: {
    borderColor: '#E5A93C',
    backgroundColor: '#262215',
  },
  choiceChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E94A0',
  },
  choiceChipTextActive: {
    color: '#E5A93C',
  },
  hofCard: {
    backgroundColor: '#121417',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5A93C',
  },
  hofHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  hofRing: {
    fontSize: 14,
    fontWeight: '900',
    color: '#E5A93C',
    fontFamily: 'monospace',
  },
  hofNick: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F0F2F5',
    fontStyle: 'italic',
  },
  hofSex: {
    fontSize: 12,
    color: '#A0A6B2',
  },
  hofMeta: {
    fontSize: 11,
    color: '#8E94A0',
    marginBottom: 4,
  },
  hofStats: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F0F2F5',
    marginBottom: 4,
  },
  hofStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  hofAchievement: {
    fontSize: 11,
    color: '#C0C0C0',
    marginLeft: 4,
  },
  bottomActions: {
    marginVertical: 16,
    marginBottom: 32,
  },
});

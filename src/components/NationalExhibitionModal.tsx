/**
 * PIGEON-FLY — Modal Reprezentacji na Ogólnopolską Wystawę Gołębi Pocztowych (NationalExhibitionModal)
 * Kwalifikacja Klas Sport (A-H) i Standard według wzorca FCI.
 * Zgodność z Field Mode (touch targets >= 48-56 pt) oraz eksport urzędowy A4 AirPrint/PDF.
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
  NationalExhibitionDelegationProtocol,
  ExhibitionCandidatePigeon,
  ExhibitionDivision,
  SportCategory,
  FciStandardScores,
  SPORT_CATEGORY_LABELS,
  SPORT_CATEGORY_REQUIREMENTS,
  calculateStandardTotalScore,
  checkSportCategoryRequirements,
  validateExhibitionProtocol,
  calculateExhibitionStats,
  generateNationalExhibitionHtml,
} from '../domain/nationalExhibitionDelegation';
import { PdfService } from '../services/pdfService';

interface NationalExhibitionModalProps {
  visible: boolean;
  onClose: () => void;
  defaultDistrictName?: string;
  defaultEventName?: string;
}

const DEMO_CANDIDATES: ExhibitionCandidatePigeon[] = [
  {
    id: 'cand-01',
    ringNumber: 'PL-0284-22-1402',
    breederName: 'Janusz Kowalski',
    branchName: 'Oddział 0284 Gostyń',
    sex: 'cock',
    color: 'Niebieski',
    birthYear: 2022,
    division: 'sport',
    sportCategory: 'sport_a',
    totalConcourses2Years: 12,
    totalKkm2Years: 2450,
    sportCoeffSum: 14.285,
    qualificationStatus: 'qualified',
    notes: '1. As Sprintu w Okręgu',
  },
  {
    id: 'cand-02',
    ringNumber: 'PL-0284-23-4412',
    breederName: 'Janusz Kowalski',
    branchName: 'Oddział 0284 Gostyń',
    sex: 'cock',
    color: 'Ciemna-Nakrapiana',
    birthYear: 2023,
    division: 'standard',
    totalConcourses2Years: 10,
    totalKkm2Years: 3200,
    standardScores: {
      generalAppearance: 9.25,
      boneStructure: 28.5,
      backAndTail: 19.0,
      musculature: 28.25,
      wingsAndPlumage: 9.25,
    },
    qualificationStatus: 'qualified',
    notes: 'Zwycięzca Wystawy Okręgowej w Standardzie',
  },
  {
    id: 'cand-03',
    ringNumber: 'PL-0285-23-9999',
    breederName: 'Tomasz Nowak',
    branchName: 'Oddział 0285 Leszno',
    sex: 'hen',
    color: 'Płowa',
    birthYear: 2023,
    division: 'standard',
    totalConcourses2Years: 8,
    totalKkm2Years: 2400,
    standardScores: {
      generalAppearance: 9.0,
      boneStructure: 28.0,
      backAndTail: 18.5,
      musculature: 28.0,
      wingsAndPlumage: 9.0,
    },
    qualificationStatus: 'reserve',
    notes: '1. Rezerwowa samica w Standardzie',
  },
];

export const NationalExhibitionModal: React.FC<NationalExhibitionModalProps> = ({
  visible,
  onClose,
  defaultDistrictName = 'Okręg Poznań PZHGP',
  defaultEventName = '73. Ogólnopolska Wystawa Gołębi Pocztowych',
}) => {
  const currentYear = new Date().getFullYear();
  const todayIso = new Date().toISOString().split('T')[0];

  const [protocolNumber, setProtocolNumber] = useState<string>(
    'WYSTAWA-2026/OKR-POZNAN/01'
  );
  const [districtName, setDistrictName] = useState<string>(defaultDistrictName);
  const [exhibitionEventName, setExhibitionEventName] = useState<string>(defaultEventName);
  const [verificationDate, setVerificationDate] = useState<string>(todayIso);
  const [districtPresidentName, setDistrictPresidentName] = useState<string>(
    'Stanisław Wolny'
  );
  const [chiefJudgeName, setChiefJudgeName] = useState<string>(
    'Marek Wiśniewski (Sędzia Ekspert FCI)'
  );

  const [candidates, setCandidates] = useState<ExhibitionCandidatePigeon[]>(DEMO_CANDIDATES);

  // New Candidate Form State
  const [newRing, setNewRing] = useState<string>('');
  const [newBreeder, setNewBreeder] = useState<string>('Janusz Kowalski');
  const [newBranch, setNewBranch] = useState<string>('Oddział 0284 Gostyń');
  const [newSex, setNewSex] = useState<'cock' | 'hen'>('cock');
  const [newColor, setNewColor] = useState<string>('Niebieski');
  const [newDivision, setNewDivision] = useState<ExhibitionDivision>('sport');
  const [newSportCategory, setNewSportCategory] = useState<SportCategory>('sport_a');
  const [newConcourses, setNewConcourses] = useState<string>('10');
  const [newKkm, setNewKkm] = useState<string>('2000');
  const [newCoeff, setNewCoeff] = useState<string>('24.500');

  // Standard Scores Inputs
  const [scoreAppearance, setScoreAppearance] = useState<string>('9.25');
  const [scoreBone, setScoreBone] = useState<string>('28.50');
  const [scoreTail, setScoreTail] = useState<string>('19.00');
  const [scoreMuscles, setScoreMuscles] = useState<string>('28.25');
  const [scoreWings, setScoreWings] = useState<string>('9.25');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'roster' | 'add_eval' | 'confirm'>('roster');

  const standardTotalPreview = useMemo(() => {
    return (
      (parseFloat(scoreAppearance) || 0) +
      (parseFloat(scoreBone) || 0) +
      (parseFloat(scoreTail) || 0) +
      (parseFloat(scoreMuscles) || 0) +
      (parseFloat(scoreWings) || 0)
    );
  }, [scoreAppearance, scoreBone, scoreTail, scoreMuscles, scoreWings]);

  const currentProtocol: NationalExhibitionDelegationProtocol = useMemo(
    () => ({
      id: `exhib-${currentYear}-${districtName.replace(/\s+/g, '_')}`,
      protocolNumber,
      exhibitionYear: currentYear,
      districtName,
      exhibitionEventName,
      verificationDate,
      districtPresidentName,
      chiefJudgeName,
      candidates,
    }),
    [
      protocolNumber,
      currentYear,
      districtName,
      exhibitionEventName,
      verificationDate,
      districtPresidentName,
      chiefJudgeName,
      candidates,
    ]
  );

  const stats = useMemo(() => calculateExhibitionStats(currentProtocol), [currentProtocol]);
  const validation = useMemo(() => validateExhibitionProtocol(currentProtocol), [currentProtocol]);

  const handleAddCandidate = () => {
    if (!newRing.trim()) {
      Alert.alert('Błąd', 'Podaj numer obrączki kandydata.');
      return;
    }

    const ringUpper = newRing.trim().toUpperCase();
    const conc = parseInt(newConcourses, 10) || 0;
    const kkm = parseInt(newKkm, 10) || 0;

    let standardScores: FciStandardScores | undefined = undefined;
    if (newDivision === 'standard') {
      standardScores = {
        generalAppearance: parseFloat(scoreAppearance) || 0,
        boneStructure: parseFloat(scoreBone) || 0,
        backAndTail: parseFloat(scoreTail) || 0,
        musculature: parseFloat(scoreMuscles) || 0,
        wingsAndPlumage: parseFloat(scoreWings) || 0,
      };
    }

    const cand: ExhibitionCandidatePigeon = {
      id: `cand-${Date.now()}`,
      ringNumber: ringUpper,
      breederName: newBreeder.trim() || 'Hodowca PZHGP',
      branchName: newBranch.trim() || 'Oddział',
      sex: newSex,
      color: newColor.trim() || 'Niebieski',
      birthYear: currentYear - 2,
      division: newDivision,
      sportCategory: newDivision === 'sport' ? newSportCategory : undefined,
      totalConcourses2Years: conc,
      totalKkm2Years: kkm,
      sportCoeffSum: newDivision === 'sport' ? parseFloat(newCoeff) || undefined : undefined,
      standardScores,
      qualificationStatus: 'qualified',
    };

    // Sprawdzenie czy spełnia minima przed dodaniem
    if (newDivision === 'sport') {
      const check = checkSportCategoryRequirements(cand);
      if (!check.meetsRequirements) {
        cand.qualificationStatus = 'disqualified_requirements_unmet';
        Alert.alert(
          'Ostrzeżenie o brakach',
          `Ptak nie spełnia minimów dla ${SPORT_CATEGORY_LABELS[newSportCategory]} (brakuje ${check.missingConcourses} konk., ${check.missingKkm} kkm). Dodano ze statusem: BRAK MINIMUM.`
        );
      }
    } else {
      const minKkm = newSex === 'cock' ? 2500 : 2000;
      if (kkm < minKkm) {
        cand.qualificationStatus = 'disqualified_requirements_unmet';
        Alert.alert(
          'Minimum Standardu',
          `Ptak nie osiągnął minimum lotowego FCI (wymagane: ${minKkm} kkm dla ${newSex === 'cock' ? 'samca' : 'samicy'}). Dodano ze statusem: BRAK MINIMUM.`
        );
      }
    }

    setCandidates([...candidates, cand]);
    setNewRing('');
    setActiveTab('roster');
  };

  const handleToggleStatus = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus =
            c.qualificationStatus === 'qualified'
              ? 'reserve'
              : c.qualificationStatus === 'reserve'
              ? 'disqualified_requirements_unmet'
              : 'qualified';
          return { ...c, qualificationStatus: nextStatus };
        }
        return c;
      })
    );
  };

  const handleRemoveCandidate = (id: string) => {
    setCandidates(candidates.filter((c) => c.id !== id));
  };

  const handlePrint = async () => {
    if (!validation.isValid) {
      Alert.alert('Błędy formalne', validation.errors.join('\n'));
      return;
    }
    try {
      const html = generateNationalExhibitionHtml(currentProtocol);
      await PdfService.printHtml(html);
    } catch (e: any) {
      Alert.alert('Błąd drukowania', e?.message || 'Nie udało się wydrukować protokołu.');
    }
  };

  const handleShare = async () => {
    if (!validation.isValid) {
      Alert.alert('Błędy formalne', validation.errors.join('\n'));
      return;
    }
    try {
      const html = generateNationalExhibitionHtml(currentProtocol);
      await PdfService.shareHtmlAsPdf(
        html,
        `Reprezentacja-Wystawa-${currentProtocol.protocolNumber.replace(/[^a-zA-Z0-9]/g, '_')}`
      );
    } catch (e: any) {
      Alert.alert('Błąd eksportu', e?.message || 'Nie udało się wyeksportować pliku PDF.');
    }
  };

  const handleSave = () => {
    if (!validation.isValid) {
      Alert.alert('Błędy walidacji', validation.errors.join('\n'));
      return;
    }
    Alert.alert(
      'Zatwierdzono Reprezentację Okręgu',
      `Oficjalna Reprezentacja Okręgu na ${currentProtocol.exhibitionEventName} została zatwierdzona przez Prezesa Okręgu i Sędziego Głównego.`
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>REPREZENTACJA NA WYSTAWĘ OGÓLNOPOLSKĄ</Text>
            <Text style={styles.headerSubtitle}>
              Kwalifikacja do Klas Sport (A-H) & Standard FCI (Z-099)
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            testID="btn-close-exhibition-modal"
          >
            <Text style={styles.closeButtonText}>✕ Zamknij</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Summary Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statVal}>{stats.totalCandidates}</Text>
                <Text style={styles.statLbl}>Kandydatów</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={[styles.statVal, { color: '#38bdf8' }]}>
                  {stats.sportQualifiedCount}
                </Text>
                <Text style={styles.statLbl}>Sport Reprez.</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={[styles.statVal, { color: '#4ade80' }]}>
                  {stats.standardQualifiedCount}
                </Text>
                <Text style={styles.statLbl}>Standard Reprez.</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={[styles.statVal, { color: '#fbbf24' }]}>
                  {stats.reserveCount}
                </Text>
                <Text style={styles.statLbl}>Rezerwa</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={[styles.statVal, { color: '#f472b6' }]}>
                  {stats.averageStandardScore}
                </Text>
                <Text style={styles.statLbl}>Śr. Standard</Text>
              </View>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'roster' && styles.tabActive]}
              onPress={() => setActiveTab('roster')}
              testID="tab-exhibition-roster"
            >
              <Text style={[styles.tabText, activeTab === 'roster' && styles.tabTextActive]}>
                1. Skład Reprezentacji ({candidates.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'add_eval' && styles.tabActive]}
              onPress={() => setActiveTab('add_eval')}
              testID="tab-exhibition-add"
            >
              <Text style={[styles.tabText, activeTab === 'add_eval' && styles.tabTextActive]}>
                2. Dodaj / Oceń Ptaka
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'confirm' && styles.tabActive]}
              onPress={() => setActiveTab('confirm')}
              testID="tab-exhibition-confirm"
            >
              <Text style={[styles.tabText, activeTab === 'confirm' && styles.tabTextActive]}>
                3. Zatwierdź & Druk
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: ROSTER */}
          {activeTab === 'roster' && (
            <View>
              {candidates.map((cand) => {
                const isSport = cand.division === 'sport';
                return (
                  <View key={cand.id} style={styles.candCard}>
                    <View style={styles.candHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.candRing}>{cand.ringNumber}</Text>
                          <Text
                            style={[
                              styles.candSexBadge,
                              cand.sex === 'cock' ? styles.sexCock : styles.sexHen,
                            ]}
                          >
                            {cand.sex === 'cock' ? '1.0 ♂' : '0.1 ♀'}
                          </Text>
                        </View>
                        <Text style={styles.candBreederSub}>
                          {cand.breederName} ({cand.branchName})
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.statusBadge,
                          cand.qualificationStatus === 'qualified'
                            ? styles.statusQualified
                            : cand.qualificationStatus === 'reserve'
                            ? styles.statusReserve
                            : styles.statusUnmet,
                        ]}
                        onPress={() => handleToggleStatus(cand.id)}
                      >
                        <Text style={styles.statusBadgeText}>
                          {cand.qualificationStatus === 'qualified'
                            ? '✓ REPREZENTACJA'
                            : cand.qualificationStatus === 'reserve'
                            ? 'REZERWA'
                            : 'BRAK MINIMUM'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.candDetailsRow}>
                      <Text style={styles.candDetailText}>
                        Klasa:{' '}
                        <Text style={{ fontWeight: 'bold', color: '#38bdf8' }}>
                          {isSport
                            ? `SPORT: ${cand.sportCategory ? SPORT_CATEGORY_LABELS[cand.sportCategory] : '—'}`
                            : 'STANDARD FCI'}
                        </Text>
                      </Text>
                      <Text style={styles.candDetailText}>
                        Dorobek 2L: {cand.totalConcourses2Years} konk. • {cand.totalKkm2Years} kkm
                        {isSport && cand.sportCoeffSum
                          ? ` • Coeff: ${cand.sportCoeffSum.toFixed(3)}`
                          : ''}
                        {!isSport && cand.standardScores
                          ? ` • Ocena FCI: ${calculateStandardTotalScore(cand.standardScores).toFixed(2)} pkt`
                          : ''}
                      </Text>
                    </View>

                    <View style={styles.candActionsRow}>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleRemoveCandidate(cand.id)}
                      >
                        <Text style={styles.deleteBtnText}>Usuń kandydata</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* TAB 2: ADD / EVALUATE */}
          {activeTab === 'add_eval' && (
            <View>
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>DANE KANDYDATA DO REPREZENTACJI</Text>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Numer Obrączki Rodowej:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={newRing}
                      onChangeText={setNewRing}
                      placeholder="PL-0284-23-1402"
                      placeholderTextColor="#64748B"
                      autoCapitalize="characters"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 0.8 }]}>
                    <Text style={styles.inputLabel}>Płeć:</Text>
                    <View style={styles.sexToggleRow}>
                      <TouchableOpacity
                        style={[styles.sexBtn, newSex === 'cock' && styles.sexBtnActive]}
                        onPress={() => setNewSex('cock')}
                      >
                        <Text style={styles.sexBtnText}>1.0 ♂</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.sexBtn, newSex === 'hen' && styles.sexBtnActiveHen]}
                        onPress={() => setNewSex('hen')}
                      >
                        <Text style={styles.sexBtnText}>0.1 ♀</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Hodowca (Właściciel):</Text>
                    <TextInput
                      style={styles.textInput}
                      value={newBreeder}
                      onChangeText={setNewBreeder}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 0.8 }]}>
                    <Text style={styles.inputLabel}>Oddział:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={newBranch}
                      onChangeText={setNewBranch}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Wybierz Pion Wystawowy (Dywizję):</Text>
                <View style={styles.divisionSelectorRow}>
                  <TouchableOpacity
                    style={[
                      styles.divisionBtn,
                      newDivision === 'sport' && styles.divisionBtnActiveSport,
                    ]}
                    onPress={() => setNewDivision('sport')}
                  >
                    <Text style={styles.divisionBtnTitle}>🏆 KLASA SPORT</Text>
                    <Text style={styles.divisionBtnDesc}>Kategorie A, B, C, D, E, F, G, H</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.divisionBtn,
                      newDivision === 'standard' && styles.divisionBtnActiveStandard,
                    ]}
                    onPress={() => setNewDivision('standard')}
                  >
                    <Text style={styles.divisionBtnTitle}>🎖️ KLASA STANDARD</Text>
                    <Text style={styles.divisionBtnDesc}>100-punktowy wzorzec FCI</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* SPORT PARAMS */}
              {newDivision === 'sport' && (
                <View style={styles.card}>
                  <Text style={styles.cardSectionTitle}>PARAMETRY KATEGORII SPORT</Text>

                  <Text style={styles.inputLabel}>Kategoria Sportowa FCI:</Text>
                  <View style={styles.sportCatCol}>
                    {(
                      [
                        'sport_a',
                        'sport_b',
                        'sport_c',
                        'sport_d',
                        'sport_e',
                        'sport_f',
                        'sport_g',
                        'sport_h',
                      ] as SportCategory[]
                    ).map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.sportCatItem,
                          newSportCategory === cat && styles.sportCatItemActive,
                        ]}
                        onPress={() => setNewSportCategory(cat)}
                      >
                        <Text
                          style={[
                            styles.sportCatItemText,
                            newSportCategory === cat && styles.sportCatItemTextActive,
                          ]}
                        >
                          {SPORT_CATEGORY_LABELS[cat]}
                        </Text>
                        <Text style={styles.sportCatReqText}>
                          Min. {SPORT_CATEGORY_REQUIREMENTS[cat].minConcourses} konk. /{' '}
                          {SPORT_CATEGORY_REQUIREMENTS[cat].minKkm} kkm (
                          {SPORT_CATEGORY_REQUIREMENTS[cat].yearsPeriod} rok/lata)
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={[styles.inputRow, { marginTop: 10 }]}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>Liczba Konkursów (2L):</Text>
                      <TextInput
                        style={styles.textInput}
                        value={newConcourses}
                        onChangeText={setNewConcourses}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>Suma kkm (2L):</Text>
                      <TextInput
                        style={styles.textInput}
                        value={newKkm}
                        onChangeText={setNewKkm}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Suma Coeff:</Text>
                      <TextInput
                        style={styles.textInput}
                        value={newCoeff}
                        onChangeText={setNewCoeff}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* STANDARD PARAMS */}
              {newDivision === 'standard' && (
                <View style={styles.card}>
                  <Text style={styles.cardSectionTitle}>
                    OCENA SĘDZIOWSKA WEDŁUG WZORCA STANDARD FCI
                  </Text>

                  <View style={styles.scoreRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.scoreCriterionTitle}>
                        1. Wrażenie ogólne, oko, kondycja (max 10 pkt):
                      </Text>
                    </View>
                    <TextInput
                      style={styles.scoreInput}
                      value={scoreAppearance}
                      onChangeText={setScoreAppearance}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.scoreRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.scoreCriterionTitle}>
                        2. Kościec, mostek, widełki miednicowe (max 30 pkt):
                      </Text>
                    </View>
                    <TextInput
                      style={styles.scoreInput}
                      value={scoreBone}
                      onChangeText={setScoreBone}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.scoreRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.scoreCriterionTitle}>
                        3. Plecy, lędźwie, sterówki ogona (max 20 pkt):
                      </Text>
                    </View>
                    <TextInput
                      style={styles.scoreInput}
                      value={scoreTail}
                      onChangeText={setScoreTail}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.scoreRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.scoreCriterionTitle}>
                        4. Umięśnienie mostka i elastyczność (max 30 pkt):
                      </Text>
                    </View>
                    <TextInput
                      style={styles.scoreInput}
                      value={scoreMuscles}
                      onChangeText={setScoreMuscles}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.scoreRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.scoreCriterionTitle}>
                        5. Skrzydło, lotki, aksamitność upierzenia (max 10 pkt):
                      </Text>
                    </View>
                    <TextInput
                      style={styles.scoreInput}
                      value={scoreWings}
                      onChangeText={setScoreWings}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.totalScoreBanner}>
                    <Text style={styles.totalScoreBannerTitle}>ŁĄCZNA NOTA STANDARDU:</Text>
                    <Text style={styles.totalScoreBannerVal}>
                      {standardTotalPreview.toFixed(2)} pkt / 100.00
                    </Text>
                  </View>

                  <View style={[styles.inputRow, { marginTop: 10 }]}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>Liczba Konkursów (2L):</Text>
                      <TextInput
                        style={styles.textInput}
                        value={newConcourses}
                        onChangeText={setNewConcourses}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Suma kkm (min. 2500 ♂ / 2000 ♀):</Text>
                      <TextInput
                        style={styles.textInput}
                        value={newKkm}
                        onChangeText={setNewKkm}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              )}

              <FieldButton
                title="+ Dodaj Ptaka do Reprezentacji Okręgu"
                onPress={handleAddCandidate}
                style={styles.saveButton}
                testID="btn-submit-candidate"
              />
            </View>
          )}

          {/* TAB 3: CONFIRM & PRINT */}
          {activeTab === 'confirm' && (
            <View>
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>WERYFIKACJA PROTOKOŁU REPREZENTACJI</Text>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Nr Protokołu Reprezentacji:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={protocolNumber}
                      onChangeText={setProtocolNumber}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 0.8 }]}>
                    <Text style={styles.inputLabel}>Data Weryfikacji:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={verificationDate}
                      onChangeText={setVerificationDate}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Okręg PZHGP:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={districtName}
                    onChangeText={setDistrictName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Wystawa Docelowa:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={exhibitionEventName}
                    onChangeText={setExhibitionEventName}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Prezes Okręgu PZHGP:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={districtPresidentName}
                      onChangeText={setDistrictPresidentName}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Sędzia Główny Wystawy:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={chiefJudgeName}
                      onChangeText={setChiefJudgeName}
                    />
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <FieldButton
                title="🛡️ Zatwierdź Protokół Reprezentacji Okręgu"
                onPress={handleSave}
                style={styles.saveButton}
                testID="btn-save-exhibition-protocol"
              />

              <View style={styles.exportRow}>
                <FieldButton
                  title="🖨️ AirPrint Protokół"
                  variant="secondary"
                  onPress={handlePrint}
                  style={{ flex: 1, marginRight: 8 }}
                  testID="btn-print-exhibition-protocol"
                />
                <FieldButton
                  title="📤 Udostępnij PDF (PZHGP)"
                  variant="secondary"
                  onPress={handleShare}
                  style={{ flex: 1 }}
                  testID="btn-share-exhibition-protocol"
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
    fontSize: 13,
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
  candCard: {
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 10,
  },
  candHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  candRing: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'monospace',
    marginRight: 6,
  },
  candSexBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sexCock: {
    backgroundColor: '#1e3a8a',
    color: '#93c5fd',
  },
  sexHen: {
    backgroundColor: '#831843',
    color: '#fbcfe8',
  },
  candBreederSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusQualified: {
    backgroundColor: '#064e3b',
  },
  statusReserve: {
    backgroundColor: '#78350f',
  },
  statusUnmet: {
    backgroundColor: '#7f1d1d',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  candDetailsRow: {
    borderTopWidth: 1,
    borderTopColor: '#2F343F',
    paddingTop: 6,
    marginBottom: 6,
  },
  candDetailText: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
  },
  candActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteBtn: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  deleteBtnText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: 'bold',
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
  sexToggleRow: {
    flexDirection: 'row',
  },
  sexBtn: {
    flex: 1,
    minHeight: 48,
    backgroundColor: '#121417',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  sexBtnActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#60a5fa',
  },
  sexBtnActiveHen: {
    backgroundColor: '#be185d',
    borderColor: '#f472b6',
  },
  sexBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  divisionSelectorRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  divisionBtn: {
    flex: 1,
    minHeight: 52,
    backgroundColor: '#121417',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
    padding: 8,
    marginRight: 6,
    justifyContent: 'center',
  },
  divisionBtnActiveSport: {
    backgroundColor: '#0c4a6e',
    borderColor: '#38bdf8',
  },
  divisionBtnActiveStandard: {
    backgroundColor: '#064e3b',
    borderColor: '#34d399',
  },
  divisionBtnTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  divisionBtnDesc: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
  },
  sportCatCol: {
    marginTop: 4,
  },
  sportCatItem: {
    minHeight: 48,
    backgroundColor: '#121417',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2F343F',
    paddingHorizontal: 10,
    justifyContent: 'center',
    marginBottom: 6,
  },
  sportCatItemActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  sportCatItemText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  sportCatItemTextActive: {
    color: '#FFFFFF',
  },
  sportCatReqText: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#121417',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  scoreCriterionTitle: {
    fontSize: 11,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  scoreInput: {
    minHeight: 48,
    minWidth: 64,
    backgroundColor: '#1E2127',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#374151',
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 'bold',
  },
  totalScoreBanner: {
    backgroundColor: '#052e16',
    borderWidth: 1,
    borderColor: '#16a34a',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalScoreBannerTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#86efac',
  },
  totalScoreBannerVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
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

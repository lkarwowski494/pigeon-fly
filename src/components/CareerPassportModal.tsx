/**
 * PIGEON-FLY — Lifetime Concourse Career Passport Modal (Z-079 / DEC-93)
 * Field Mode ergonomic interface (>= 48-56pt touch targets), dark theme (#121417).
 * Individual concourse history, lifetime kkm, regularity index, and FCI Exhibition passport export.
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
  calculateCareerPassport,
  generateCareerPassportHtml,
  ConcourseRecord,
  CareerPassportInput,
} from '../domain/careerPassport';
import { PdfService } from '../services/pdfService';
import { FieldButton } from './FieldButton';

interface CareerPassportModalProps {
  visible: boolean;
  onClose: () => void;
  pigeonData?: CareerPassportInput;
  loftName?: string;
  breederName?: string;
  branchName?: string;
}

const DEFAULT_PIGEON_CAREER: CareerPassportInput = {
  ringNumber: 'PL-0284-23-1402',
  pigeonName: 'Błękitny As Gostynia',
  strain: 'Koopman / Gaby Vandenabeele',
  sex: 'cock',
  birthYear: 2023,
  color: 'Niebieski nakrapiany',
  totalBasketingCount: 14,
  records: [
    {
      id: 'cr-1',
      year: 2024,
      raceDate: '2024-05-12',
      raceName: 'Świebodzin I',
      releaseLocation: 'Świebodzin',
      distanceKm: 165.5,
      basketedCount: 3200,
      concoursePosition: 1,
      fciCoefficient: 0.312,
      pzhgpPoints: 39.8,
      speedMPerMin: 1420.5,
      concourseBase: 20,
      category: 'A',
    },
    {
      id: 'cr-2',
      year: 2024,
      raceDate: '2024-05-26',
      raceName: 'Nowy Tomyśl',
      releaseLocation: 'Nowy Tomyśl',
      distanceKm: 212.0,
      basketedCount: 3100,
      concoursePosition: 7,
      fciCoefficient: 2.258,
      pzhgpPoints: 38.9,
      speedMPerMin: 1380.2,
      concourseBase: 20,
      category: 'A',
    },
    {
      id: 'cr-3',
      year: 2024,
      raceDate: '2024-06-09',
      raceName: 'Magdeburg I',
      releaseLocation: 'Magdeburg',
      distanceKm: 345.2,
      basketedCount: 2800,
      concoursePosition: 14,
      fciCoefficient: 5.0,
      pzhgpPoints: 37.5,
      speedMPerMin: 1290.4,
      concourseBase: 20,
      category: 'B',
    },
    {
      id: 'cr-4',
      year: 2024,
      raceDate: '2024-06-23',
      raceName: 'Magdeburg II',
      releaseLocation: 'Magdeburg',
      distanceKm: 345.2,
      basketedCount: 2600,
      concoursePosition: 3,
      fciCoefficient: 1.154,
      pzhgpPoints: 39.4,
      speedMPerMin: 1342.1,
      concourseBase: 20,
      category: 'B',
    },
    {
      id: 'cr-5',
      year: 2024,
      raceDate: '2024-07-07',
      raceName: 'Braunschweig',
      releaseLocation: 'Braunschweig',
      distanceKm: 420.0,
      basketedCount: 2200,
      concoursePosition: 22,
      fciCoefficient: 10.0,
      pzhgpPoints: 36.1,
      speedMPerMin: 1260.8,
      concourseBase: 20,
      category: 'B',
    },
    {
      id: 'cr-6',
      year: 2025,
      raceDate: '2025-05-18',
      raceName: 'Nowy Tomyśl II',
      releaseLocation: 'Nowy Tomyśl',
      distanceKm: 212.0,
      basketedCount: 3300,
      concoursePosition: 12,
      fciCoefficient: 3.636,
      pzhgpPoints: 38.2,
      speedMPerMin: 1365.4,
      concourseBase: 20,
      category: 'A',
    },
    {
      id: 'cr-7',
      year: 2025,
      raceDate: '2025-06-01',
      raceName: 'Magdeburg III',
      releaseLocation: 'Magdeburg',
      distanceKm: 345.2,
      basketedCount: 2900,
      concoursePosition: 8,
      fciCoefficient: 2.759,
      pzhgpPoints: 39.1,
      speedMPerMin: 1312.0,
      concourseBase: 20,
      category: 'B',
    },
    {
      id: 'cr-8',
      year: 2025,
      raceDate: '2025-06-20',
      raceName: 'Hannover Narodowy',
      releaseLocation: 'Hannover',
      distanceKm: 525.0,
      basketedCount: 2100,
      concoursePosition: 4,
      fciCoefficient: 1.905,
      pzhgpPoints: 39.6,
      speedMPerMin: 1315.8,
      concourseBase: 20,
      category: 'C',
    },
    {
      id: 'cr-9',
      year: 2025,
      raceDate: '2025-07-12',
      raceName: 'Bruksela Międzynarodowy',
      releaseLocation: 'Bruksela',
      distanceKm: 742.0,
      basketedCount: 1800,
      concoursePosition: 2,
      fciCoefficient: 1.111,
      pzhgpPoints: 39.9,
      speedMPerMin: 1240.2,
      concourseBase: 20,
      category: 'M',
    },
    {
      id: 'cr-10',
      year: 2025,
      raceDate: '2025-07-26',
      raceName: 'Oostende Maraton',
      releaseLocation: 'Oostende',
      distanceKm: 825.0,
      basketedCount: 1600,
      concoursePosition: 1,
      fciCoefficient: 0.625,
      pzhgpPoints: 40.0,
      speedMPerMin: 1195.0,
      concourseBase: 20,
      category: 'M',
    },
  ],
};

export const CareerPassportModal: React.FC<CareerPassportModalProps> = ({
  visible,
  onClose,
  pigeonData = DEFAULT_PIGEON_CAREER,
  loftName = 'Gołębnik Mistrza Pigeon-Fly',
  breederName = 'Łukasz',
  branchName = 'Oddział 0284 Gostyń PZHGP',
}) => {
  const [activeTab, setActiveTab] = useState<'passport' | 'races' | 'olympic'>('passport');

  const analytics = useMemo(() => {
    return calculateCareerPassport(pigeonData);
  }, [pigeonData]);

  const handlePrintPassport = async () => {
    try {
      const html = generateCareerPassportHtml(analytics, {
        loftName,
        breederName,
        branchName,
      });
      await PdfService.printHtml(html);
    } catch (err: any) {
      Alert.alert('Błąd wydruku', err?.message || 'Nie udało się wydrukować paszportu.');
    }
  };

  const handleSharePdf = async () => {
    try {
      const html = generateCareerPassportHtml(analytics, {
        loftName,
        breederName,
        branchName,
      });
      await PdfService.shareHtmlAsPdf(
        html,
        `Paszport_Sportowy_${analytics.ringNumber}.pdf`
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
            <Text style={styles.headerTitle}>📜 Paszport Sportowy Lotnika</Text>
            <Text style={styles.headerSubtitle}>
              Księga konkursów, kkm, stabilność i klasa olimpijska (Z-079)
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Zamknij okno"
            testID="btn-close-career-passport"
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'passport' && styles.tabItemActive]}
            onPress={() => setActiveTab('passport')}
            testID="tab-passport-summary"
          >
            <Text style={[styles.tabText, activeTab === 'passport' && styles.tabTextActive]}>
              Karta Kariery
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'races' && styles.tabItemActive]}
            onPress={() => setActiveTab('races')}
            testID="tab-passport-races"
          >
            <Text style={[styles.tabText, activeTab === 'races' && styles.tabTextActive]}>
              Loty ({analytics.totalPrizesWon})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'olympic' && styles.tabItemActive]}
            onPress={() => setActiveTab('olympic')}
            testID="tab-passport-olympic"
          >
            <Text style={[styles.tabText, activeTab === 'olympic' && styles.tabTextActive]}>
              Wystawa FCI
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Pigeon Profile Card */}
          <View style={styles.pigeonCard}>
            <View style={styles.pigeonCardTop}>
              <View>
                <Text style={styles.pigeonRing}>{analytics.ringNumber}</Text>
                {analytics.pigeonName && (
                  <Text style={styles.pigeonName}>"{analytics.pigeonName}"</Text>
                )}
                <Text style={styles.pigeonMeta}>
                  {analytics.sex === 'cock' ? 'Samiec 1.0' : 'Samica 0.1'} • Rocznik {analytics.birthYear} • {analytics.color}
                </Text>
                {analytics.strain && (
                  <Text style={styles.pigeonStrain}>Szczep: {analytics.strain}</Text>
                )}
              </View>
              <View style={styles.pigeonRightBox}>
                <Text style={styles.prizesBig}>{analytics.totalPrizesWon} konk.</Text>
                <Text style={styles.kkmSub}>{analytics.totalConcourseKm.toFixed(1)} kkm</Text>
              </View>
            </View>
          </View>

          {/* TAB 1: PASSPORT SUMMARY */}
          {activeTab === 'passport' && (
            <View>
              {/* KPI Ribbon */}
              <View style={styles.kpiGrid}>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiTitle}>Wydajność Konkursowa</Text>
                  <Text style={styles.kpiVal}>{analytics.prizeEfficiencyPercent}%</Text>
                  <Text style={styles.kpiSub}>{analytics.totalPrizesWon} z {analytics.totalBasketingCount} wkładań</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiTitle}>Najlepszy Coeff FCI</Text>
                  <Text style={[styles.kpiVal, { color: '#60A5FA' }]}>{analytics.bestCoefficient.toFixed(3)}</Text>
                  <Text style={styles.kpiSub}>Śr: {analytics.averageCoefficient.toFixed(3)}</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiTitle}>Szpice (1. m. / Top 10)</Text>
                  <Text style={[styles.kpiVal, { color: '#E5A93C' }]}>{analytics.firstPrizeCount} / {analytics.topTenCount}</Text>
                  <Text style={styles.kpiSub}>Najlepsza lok: #{analytics.bestPosition}</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiTitle}>Wskaźnik Regularności</Text>
                  <Text style={[styles.kpiVal, { color: '#10B981' }]}>Top {analytics.regularityIndex}%</Text>
                  <Text style={styles.kpiSub}>Średnia pozycja na liście</Text>
                </View>
              </View>

              {/* Distance Breakdown Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Rozkład Dystansowy Sukcesów:</Text>

                <View style={styles.distRow}>
                  <View style={styles.distLabelCol}>
                    <Text style={styles.distName}>Kat. A (Sprint &lt; 300 km)</Text>
                    <Text style={styles.distSub}>{analytics.distanceBreakdown.shortSprintPrizes} konkursów</Text>
                  </View>
                  <Text style={styles.distKmVal}>{analytics.distanceBreakdown.shortSprintKm.toFixed(1)} km</Text>
                </View>

                <View style={styles.distRow}>
                  <View style={styles.distLabelCol}>
                    <Text style={styles.distName}>Kat. B (Średni 300–500 km)</Text>
                    <Text style={styles.distSub}>{analytics.distanceBreakdown.middleDistancePrizes} konkursów</Text>
                  </View>
                  <Text style={styles.distKmVal}>{analytics.distanceBreakdown.middleDistanceKm.toFixed(1)} km</Text>
                </View>

                <View style={styles.distRow}>
                  <View style={styles.distLabelCol}>
                    <Text style={styles.distName}>Kat. C (Daleki 500–700 km)</Text>
                    <Text style={styles.distSub}>{analytics.distanceBreakdown.longDistancePrizes} konkursów</Text>
                  </View>
                  <Text style={styles.distKmVal}>{analytics.distanceBreakdown.longDistanceKm.toFixed(1)} km</Text>
                </View>

                <View style={[styles.distRow, { borderBottomWidth: 0 }]}>
                  <View style={styles.distLabelCol}>
                    <Text style={styles.distName}>Kat. M (Maraton &gt; 700 km)</Text>
                    <Text style={styles.distSub}>{analytics.distanceBreakdown.marathonPrizes} konkursów</Text>
                  </View>
                  <Text style={styles.distKmVal}>{analytics.distanceBreakdown.marathonKm.toFixed(1)} km</Text>
                </View>
              </View>
            </View>
          )}

          {/* TAB 2: RACE CONCOURSE HISTORY */}
          {activeTab === 'races' && (
            <View>
              {Object.keys(analytics.recordsByYear)
                .map(Number)
                .sort((a, b) => b - a)
                .map((year) => {
                  const yearRecords = analytics.recordsByYear[year];
                  return (
                    <View key={year} style={styles.yearSection}>
                      <View style={styles.yearHeader}>
                        <Text style={styles.yearTitle}>Sezon {year}</Text>
                        <Text style={styles.yearSub}>
                          {yearRecords.length} konkursów • {yearRecords.reduce((sum, r) => sum + r.distanceKm, 0).toFixed(1)} kkm
                        </Text>
                      </View>

                      {yearRecords.map((r, idx) => (
                        <View key={r.id || idx} style={styles.raceItemCard}>
                          <View style={styles.raceItemHeader}>
                            <View>
                              <Text style={styles.raceItemName}>{r.raceName}</Text>
                              <Text style={styles.raceItemMeta}>{r.raceDate} • {r.distanceKm.toFixed(1)} km</Text>
                            </View>
                            <View style={styles.raceBadgeCol}>
                              <Text style={styles.positionBadge}>
                                #{r.concoursePosition} / {r.basketedCount}
                              </Text>
                              <Text style={styles.catPill}>Kat. {r.category}</Text>
                            </View>
                          </View>
                          <View style={styles.raceStatsRow}>
                            <Text style={styles.raceStatText}>Coeff: <Text style={styles.boldBlue}>{r.fciCoefficient.toFixed(3)}</Text></Text>
                            <Text style={styles.raceStatText}>Prędkość: <Text style={styles.boldText}>{r.speedMPerMin.toFixed(1)} m/min</Text></Text>
                            {r.pzhgpPoints && (
                              <Text style={styles.raceStatText}>Pkt: <Text style={styles.boldGold}>{r.pzhgpPoints.toFixed(2)}</Text></Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  );
                })}
            </View>
          )}

          {/* TAB 3: FCI EXHIBITION QUALIFICATIONS */}
          {activeTab === 'olympic' && (
            <View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Klasy Wystawowe PZHGP / FCI:</Text>
                
                <View style={[styles.eligibilityItem, analytics.fciExhibitionEligibility.sportA && styles.eligibilityItemActive]}>
                  <Text style={styles.eligibilityIcon}>{analytics.fciExhibitionEligibility.sportA ? '🏆' : '⚪'}</Text>
                  <View style={styles.eligibilityTexts}>
                    <Text style={styles.eligibilityTitle}>Klasa Sport A (Sprint 100–400 km)</Text>
                    <Text style={styles.eligibilityDesc}>Wymóg: min. 10 konkursów i min. 1,500 kkm w 2 latach</Text>
                  </View>
                  <Text style={[styles.eligibilityStatus, { color: analytics.fciExhibitionEligibility.sportA ? '#10B981' : '#9CA3AF' }]}>
                    {analytics.fciExhibitionEligibility.sportA ? 'KWALIFIKACJA' : 'BRAK'}
                  </Text>
                </View>

                <View style={[styles.eligibilityItem, analytics.fciExhibitionEligibility.sportB && styles.eligibilityItemActive]}>
                  <Text style={styles.eligibilityIcon}>{analytics.fciExhibitionEligibility.sportB ? '🏆' : '⚪'}</Text>
                  <View style={styles.eligibilityTexts}>
                    <Text style={styles.eligibilityTitle}>Klasa Sport B (Średni Dystans 300–600 km)</Text>
                    <Text style={styles.eligibilityDesc}>Wymóg: min. 8 konkursów i min. 2,800 kkm w 2 latach</Text>
                  </View>
                  <Text style={[styles.eligibilityStatus, { color: analytics.fciExhibitionEligibility.sportB ? '#10B981' : '#9CA3AF' }]}>
                    {analytics.fciExhibitionEligibility.sportB ? 'KWALIFIKACJA' : 'BRAK'}
                  </Text>
                </View>

                <View style={[styles.eligibilityItem, analytics.fciExhibitionEligibility.sportC && styles.eligibilityItemActive]}>
                  <Text style={styles.eligibilityIcon}>{analytics.fciExhibitionEligibility.sportC ? '🏆' : '⚪'}</Text>
                  <View style={styles.eligibilityTexts}>
                    <Text style={styles.eligibilityTitle}>Klasa Sport C (Daleki Dystans &gt; 500 km)</Text>
                    <Text style={styles.eligibilityDesc}>Wymóg: min. 6 konkursów i min. 3,300 kkm w 2 latach</Text>
                  </View>
                  <Text style={[styles.eligibilityStatus, { color: analytics.fciExhibitionEligibility.sportC ? '#10B981' : '#9CA3AF' }]}>
                    {analytics.fciExhibitionEligibility.sportC ? 'KWALIFIKACJA' : 'BRAK'}
                  </Text>
                </View>

                <View style={[styles.eligibilityItem, analytics.fciExhibitionEligibility.sportM && styles.eligibilityItemActive]}>
                  <Text style={styles.eligibilityIcon}>{analytics.fciExhibitionEligibility.sportM ? '🏆' : '⚪'}</Text>
                  <View style={styles.eligibilityTexts}>
                    <Text style={styles.eligibilityTitle}>Klasa Sport M (Maraton &gt; 700 km)</Text>
                    <Text style={styles.eligibilityDesc}>Wymóg: min. 2 konkursy i min. 1,400 kkm w 2 latach</Text>
                  </View>
                  <Text style={[styles.eligibilityStatus, { color: analytics.fciExhibitionEligibility.sportM ? '#10B981' : '#9CA3AF' }]}>
                    {analytics.fciExhibitionEligibility.sportM ? 'KWALIFIKACJA' : 'BRAK'}
                  </Text>
                </View>

                <View style={[styles.eligibilityItem, analytics.fciExhibitionEligibility.wyczyn && styles.eligibilityItemActive]}>
                  <Text style={styles.eligibilityIcon}>{analytics.fciExhibitionEligibility.wyczyn ? '💎' : '⚪'}</Text>
                  <View style={styles.eligibilityTexts}>
                    <Text style={styles.eligibilityTitle}>Klasa Wyczyn (Całokształt Kariery)</Text>
                    <Text style={styles.eligibilityDesc}>Wymóg: min. 18 konkursów i min. 6,000 kkm w dorobku życiowym</Text>
                  </View>
                  <Text style={[styles.eligibilityStatus, { color: analytics.fciExhibitionEligibility.wyczyn ? '#10B981' : '#9CA3AF' }]}>
                    {analytics.fciExhibitionEligibility.wyczyn ? 'WYCZYNOWIEC' : 'BRAK'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <FieldButton
              title="🖨️ Drukuj Paszport Sportowy A4 (AirPrint)"
              onPress={handlePrintPassport}
              testID="btn-print-career-passport"
              style={{ marginBottom: 10 }}
            />
            <FieldButton
              title="📄 Udostępnij Paszport Sportowy PDF"
              onPress={handleSharePdf}
              testID="btn-share-career-passport-pdf"
              variant="secondary"
              style={{ marginBottom: 10 }}
            />
            <FieldButton
              title="Zamknij"
              onPress={onClose}
              testID="btn-close-passport"
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
  pigeonCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#0284C7',
    marginBottom: 14,
  },
  pigeonCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pigeonRing: {
    fontSize: 18,
    fontWeight: '900',
    color: '#38BDF8',
  },
  pigeonName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F3F4F6',
    marginTop: 2,
    fontStyle: 'italic',
  },
  pigeonMeta: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  pigeonStrain: {
    fontSize: 11,
    color: '#E5A93C',
    marginTop: 2,
  },
  pigeonRightBox: {
    alignItems: 'flex-end',
  },
  prizesBig: {
    fontSize: 22,
    fontWeight: '900',
    color: '#38BDF8',
  },
  kkmSub: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  kpiTitle: {
    fontSize: 10,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  kpiVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F3F4F6',
    marginVertical: 2,
  },
  kpiSub: {
    fontSize: 9,
    color: '#6B7280',
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
  distRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
  },
  distLabelCol: {
    flex: 1,
  },
  distName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F3F4F6',
  },
  distSub: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  distKmVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#60A5FA',
  },
  yearSection: {
    marginBottom: 14,
  },
  yearHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  yearTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F3F4F6',
  },
  yearSub: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  raceItemCard: {
    backgroundColor: '#1E2127',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  raceItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  raceItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F3F4F6',
  },
  raceItemMeta: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  raceBadgeCol: {
    alignItems: 'flex-end',
  },
  positionBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
  },
  catPill: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },
  raceStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#121417',
    borderRadius: 6,
    padding: 6,
  },
  raceStatText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  boldBlue: {
    fontWeight: '800',
    color: '#60A5FA',
  },
  boldText: {
    fontWeight: '700',
    color: '#E5E7EB',
  },
  boldGold: {
    fontWeight: '800',
    color: '#E5A93C',
  },
  eligibilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16191E',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  eligibilityItemActive: {
    borderColor: '#10B981',
    backgroundColor: '#13281E',
  },
  eligibilityIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  eligibilityTexts: {
    flex: 1,
  },
  eligibilityTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F3F4F6',
  },
  eligibilityDesc: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  eligibilityStatus: {
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 6,
  },
  actionSection: {
    marginTop: 8,
  },
});

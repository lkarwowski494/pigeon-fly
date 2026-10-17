/**
 * PIGEON-FLY — National Championship & Ace Pigeons Modal (Z-075 / DEC-89)
 * Field Mode ergonomic interface (>= 48-56pt touch targets), dark theme (#121417).
 * Generalne Mistrzostwo Polski (GMP), Intermistrzostwo (FCI/PZHGP), and Ace Pigeon rankings.
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
  RaceFlightRecord,
  PigeonArrivalRecord,
  FlightCategory,
  calculateGmpChampionship,
  calculateInterChampionship,
  calculateAcePigeonRankings,
  generateNationalChampionshipReportHtml,
} from '../domain/nationalChampionship';
import { PdfService } from '../services/pdfService';
import { FieldButton } from './FieldButton';

interface NationalChampionshipModalProps {
  visible: boolean;
  onClose: () => void;
  flights?: RaceFlightRecord[];
  arrivals?: PigeonArrivalRecord[];
  loftName?: string;
  seasonYear?: number;
}

const DEFAULT_FLIGHTS: RaceFlightRecord[] = [
  {
    flightId: 'fl-1',
    flightName: 'Świebodzin I',
    flightDate: '2026-05-10',
    distanceKm: 225,
    category: 'A',
    totalBasketedPigeons: 1250,
  },
  {
    flightId: 'fl-2',
    flightName: 'Frankfurt / Oder',
    flightDate: '2026-05-17',
    distanceKm: 295,
    category: 'A',
    totalBasketedPigeons: 1180,
  },
  {
    flightId: 'fl-3',
    flightName: 'Magdeburg I',
    flightDate: '2026-05-24',
    distanceKm: 425,
    category: 'B',
    totalBasketedPigeons: 980,
  },
  {
    flightId: 'fl-4',
    flightName: 'Braunschweig',
    flightDate: '2026-06-07',
    distanceKm: 520,
    category: 'C',
    totalBasketedPigeons: 850,
  },
  {
    flightId: 'fl-5',
    flightName: 'Bruksela Narodowy',
    flightDate: '2026-06-21',
    distanceKm: 860,
    category: 'M',
    totalBasketedPigeons: 540,
  },
];

const DEFAULT_ARRIVALS: PigeonArrivalRecord[] = [
  // fl-1 (limit 250)
  { pigeonId: 'p-1', ringNumber: 'PL-0284-23-1402', sex: 'cock', flightId: 'fl-1', positionInConcourse: 4, isNominatedSeries: true },
  { pigeonId: 'p-2', ringNumber: 'PL-0284-22-9854', sex: 'hen', flightId: 'fl-1', positionInConcourse: 11, isNominatedSeries: true },
  { pigeonId: 'p-3', ringNumber: 'PL-0284-24-4401', sex: 'hen', isYearling: true, flightId: 'fl-1', positionInConcourse: 22, isNominatedSeries: true },
  { pigeonId: 'p-4', ringNumber: 'DV-01234-24-512', sex: 'cock', isYearling: true, flightId: 'fl-1', positionInConcourse: 35, isNominatedSeries: false },
  // fl-2 (limit 236)
  { pigeonId: 'p-1', ringNumber: 'PL-0284-23-1402', sex: 'cock', flightId: 'fl-2', positionInConcourse: 2, isNominatedSeries: true },
  { pigeonId: 'p-2', ringNumber: 'PL-0284-22-9854', sex: 'hen', flightId: 'fl-2', positionInConcourse: 18, isNominatedSeries: true },
  { pigeonId: 'p-4', ringNumber: 'DV-01234-24-512', sex: 'cock', isYearling: true, flightId: 'fl-2', positionInConcourse: 40, isNominatedSeries: true },
  // fl-3 (limit 196)
  { pigeonId: 'p-1', ringNumber: 'PL-0284-23-1402', sex: 'cock', flightId: 'fl-3', positionInConcourse: 6, isNominatedSeries: true },
  { pigeonId: 'p-3', ringNumber: 'PL-0284-24-4401', sex: 'hen', isYearling: true, flightId: 'fl-3', positionInConcourse: 14, isNominatedSeries: true },
  { pigeonId: 'p-2', ringNumber: 'PL-0284-22-9854', sex: 'hen', flightId: 'fl-3', positionInConcourse: 29, isNominatedSeries: true },
  // fl-4 (limit 170)
  { pigeonId: 'p-1', ringNumber: 'PL-0284-23-1402', sex: 'cock', flightId: 'fl-4', positionInConcourse: 8, isNominatedSeries: true },
  { pigeonId: 'p-2', ringNumber: 'PL-0284-22-9854', sex: 'hen', flightId: 'fl-4', positionInConcourse: 25, isNominatedSeries: true },
  // fl-5 (limit 108)
  { pigeonId: 'p-1', ringNumber: 'PL-0284-23-1402', sex: 'cock', flightId: 'fl-5', positionInConcourse: 5, isNominatedSeries: true },
  { pigeonId: 'p-2', ringNumber: 'PL-0284-22-9854', sex: 'hen', flightId: 'fl-5', positionInConcourse: 19, isNominatedSeries: true },
];

export const NationalChampionshipModal: React.FC<NationalChampionshipModalProps> = ({
  visible,
  onClose,
  flights = DEFAULT_FLIGHTS,
  arrivals = DEFAULT_ARRIVALS,
  loftName = 'Gołębnik Mistrza Pigeon-Fly',
  seasonYear = 2026,
}) => {
  const [activeTab, setActiveTab] = useState<'gmp' | 'inter' | 'aces'>('gmp');
  const [aceCategoryFilter, setAceCategoryFilter] = useState<FlightCategory | 'ALL' | 'YEARLING'>('ALL');

  const gmpSummary = useMemo(() => {
    return calculateGmpChampionship({
      loftName,
      seasonYear,
      flights,
      arrivals,
      maxCountedPerFlight: 3,
    });
  }, [loftName, seasonYear, flights, arrivals]);

  const interSummary = useMemo(() => {
    return calculateInterChampionship({
      loftName,
      seasonYear,
      flights,
      arrivals,
    });
  }, [loftName, seasonYear, flights, arrivals]);

  const aceRankings = useMemo(() => {
    const filterCat =
      aceCategoryFilter === 'ALL' || aceCategoryFilter === 'YEARLING'
        ? undefined
        : aceCategoryFilter;
    const onlyYearlings = aceCategoryFilter === 'YEARLING';

    return calculateAcePigeonRankings({
      flights,
      arrivals,
      filterCategory: filterCat,
      onlyYearlings,
    });
  }, [flights, arrivals, aceCategoryFilter]);

  const handlePrintReport = async () => {
    try {
      const html = generateNationalChampionshipReportHtml({
        gmp: gmpSummary,
        inter: interSummary,
        aces: aceRankings,
        loftName,
        seasonYear,
      });
      await PdfService.printHtml(html);
    } catch (err: any) {
      Alert.alert('Błąd drukowania', err?.message || 'Nie udało się wydrukować zestawienia.');
    }
  };

  const handleShareReport = async () => {
    try {
      const html = generateNationalChampionshipReportHtml({
        gmp: gmpSummary,
        inter: interSummary,
        aces: aceRankings,
        loftName,
        seasonYear,
      });
      await PdfService.shareHtmlAsPdf(
        html,
        `Mistrzostwo_Polski_PZHGP_${seasonYear}.pdf`
      );
    } catch (err: any) {
      Alert.alert('Błąd eksportu', err?.message || 'Nie udało się zapisać pliku PDF.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>🏆 Mistrzostwo Polski PZHGP</Text>
              <Text style={styles.subtitle}>
                GMP (Seria 5/3) &bull; Intermistrzostwo &bull; Asy Lotowe (Z-075)
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Zamknij"
              testID="btn-close-championship-modal"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* KPI Dashboard */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>PUNKTY GMP</Text>
              <Text style={styles.kpiVal}>{gmpSummary.totalChampionshipPoints.toFixed(1)}</Text>
              <Text style={styles.kpiSub}>{gmpSummary.totalPrizesCount} konk.</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>INTER COEFF</Text>
              <Text style={[styles.kpiVal, { color: '#10B981' }]}>
                {interSummary.totalCoeffSum.toFixed(3)}
              </Text>
              <Text style={styles.kpiSub}>{interSummary.totalNominatedPrizes} konk.</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>ŚREDNI COEFF</Text>
              <Text style={[styles.kpiVal, { color: '#60A5FA' }]}>
                {gmpSummary.averageCoeff.toFixed(3)}
              </Text>
              <Text style={styles.kpiSub}>{gmpSummary.totalConcourseKm} kkm</Text>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.navTabsRow}>
            <TouchableOpacity
              style={[styles.navTab, activeTab === 'gmp' && styles.navTabActive]}
              onPress={() => setActiveTab('gmp')}
              testID="tab-gmp"
            >
              <Text style={[styles.navTabText, activeTab === 'gmp' && styles.navTabTextActive]}>
                🥇 GMP (Seria)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navTab, activeTab === 'inter' && styles.navTabActive]}
              onPress={() => setActiveTab('inter')}
              testID="tab-inter"
            >
              <Text style={[styles.navTabText, activeTab === 'inter' && styles.navTabTextActive]}>
                🌍 Intermistrzostwo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navTab, activeTab === 'aces' && styles.navTabActive]}
              onPress={() => setActiveTab('aces')}
              testID="tab-aces"
            >
              <Text style={[styles.navTabText, activeTab === 'aces' && styles.navTabTextActive]}>
                ⭐ Asy Lotowe
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            {/* TAB 1: GMP */}
            {activeTab === 'gmp' && (
              <View>
                <Text style={styles.sectionHeader}>
                  LOTY ZALICZANE DO GENERALNEGO MISTRZOSTWA POLSKI
                </Text>
                {gmpSummary.flights.map((f, idx) => (
                  <View key={f.flightId} style={styles.flightCard}>
                    <View style={styles.flightCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.flightName}>
                          {idx + 1}. {f.flightName}
                        </Text>
                        <Text style={styles.flightMeta}>
                          {f.distanceKm} km &bull; Kat. {f.category} &bull; Baza 20%:{' '}
                          {f.prizeLimit} gołębi
                        </Text>
                      </View>
                      <View style={styles.pointsBadge}>
                        <Text style={styles.pointsBadgeVal}>
                          {f.totalFlightGmpPoints.toFixed(2)} pkt
                        </Text>
                        <Text style={styles.pointsBadgeSub}>
                          Coeff: {f.totalFlightCoeff.toFixed(3)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.countedPigeonsList}>
                      <Text style={styles.countedPigeonsLabel}>
                        Zaliczone z serii ({f.countedPigeons.length}/3):
                      </Text>
                      {f.countedPigeons.map((p, pIdx) => (
                        <View key={pIdx} style={styles.pigeonPill}>
                          <Text style={styles.pigeonPillRing}>{p.ringNumber}</Text>
                          <Text style={styles.pigeonPillPos}>#{p.position}</Text>
                          <Text style={styles.pigeonPillPts}>{p.gmpPoints.toFixed(2)} pkt</Text>
                          <Text style={styles.pigeonPillCoeff}>C:{p.fciCoeff.toFixed(3)}</Text>
                        </View>
                      ))}
                      {f.countedPigeons.length === 0 && (
                        <Text style={styles.noCountedText}>Brak konkursu z serii typowanej.</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* TAB 2: INTERMISTRZOSTWO */}
            {activeTab === 'inter' && (
              <View>
                <Text style={styles.sectionHeader}>
                  INTERMISTRZOSTWO FCI / PZHGP (LOTY &ge; 285 KM)
                </Text>
                <View style={styles.interInfoCard}>
                  <Text style={styles.interInfoTitle}>REGULAMIN INTERMISTRZOSTWA:</Text>
                  <Text style={styles.interInfoText}>
                    Do klasyfikacji zalicza się 3 pierwsze gołębie z 5 typowanych (seria 5/3) z
                    lotów o dystansie powyżej 285 km. O miejscu decyduje suma konkursów oraz
                    najniższy łączny Coeff.
                  </Text>
                  <View style={styles.interStatusRow}>
                    <Text style={styles.interStatusLabel}>Status klasyfikacji:</Text>
                    <View
                      style={[
                        styles.interBadge,
                        interSummary.qualifies ? styles.interBadgeOk : styles.interBadgeWait,
                      ]}
                    >
                      <Text style={styles.interBadgeText}>
                        {interSummary.qualifies
                          ? '✓ SPEŁNIA WYMOGI MINIMUM'
                          : 'OCZEKUJE NA KOLEJNE LOTY'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.interStatsCard}>
                  <View style={styles.interStatItem}>
                    <Text style={styles.interStatVal}>{interSummary.flightsCount}</Text>
                    <Text style={styles.interStatLbl}>Lotów kwalifikowanych (&ge;285 km)</Text>
                  </View>
                  <View style={styles.interStatItem}>
                    <Text style={styles.interStatVal}>{interSummary.totalNominatedPrizes}</Text>
                    <Text style={styles.interStatLbl}>Konkursów z serii 5/3</Text>
                  </View>
                  <View style={styles.interStatItem}>
                    <Text style={[styles.interStatVal, { color: '#10B981' }]}>
                      {interSummary.totalCoeffSum.toFixed(3)}
                    </Text>
                    <Text style={styles.interStatLbl}>Łączny Coeff</Text>
                  </View>
                </View>
              </View>
            )}

            {/* TAB 3: ACES (ASY LOTOWE) */}
            {activeTab === 'aces' && (
              <View>
                <Text style={styles.sectionHeader}>RANKING ASÓW LOTOWYCH (SUPER-LOTNICY)</Text>

                {/* Filter chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                  <TouchableOpacity
                    style={[styles.chip, aceCategoryFilter === 'ALL' && styles.chipActive]}
                    onPress={() => setAceCategoryFilter('ALL')}
                    testID="chip-all"
                  >
                    <Text style={[styles.chipText, aceCategoryFilter === 'ALL' && styles.chipTextActive]}>
                      Wszystkie (Wielobój)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.chip, aceCategoryFilter === 'YEARLING' && styles.chipActive]}
                    onPress={() => setAceCategoryFilter('YEARLING')}
                    testID="chip-yearling"
                  >
                    <Text style={[styles.chipText, aceCategoryFilter === 'YEARLING' && styles.chipTextActive]}>
                      Roczne
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.chip, aceCategoryFilter === 'A' && styles.chipActive]}
                    onPress={() => setAceCategoryFilter('A')}
                    testID="chip-cat-a"
                  >
                    <Text style={[styles.chipText, aceCategoryFilter === 'A' && styles.chipTextActive]}>
                      Kat. A (Sprint)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.chip, aceCategoryFilter === 'B' && styles.chipActive]}
                    onPress={() => setAceCategoryFilter('B')}
                    testID="chip-cat-b"
                  >
                    <Text style={[styles.chipText, aceCategoryFilter === 'B' && styles.chipTextActive]}>
                      Kat. B (Średni)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.chip, aceCategoryFilter === 'C' && styles.chipActive]}
                    onPress={() => setAceCategoryFilter('C')}
                    testID="chip-cat-c"
                  >
                    <Text style={[styles.chipText, aceCategoryFilter === 'C' && styles.chipTextActive]}>
                      Kat. C (Długi)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.chip, aceCategoryFilter === 'M' && styles.chipActive]}
                    onPress={() => setAceCategoryFilter('M')}
                    testID="chip-cat-m"
                  >
                    <Text style={[styles.chipText, aceCategoryFilter === 'M' && styles.chipTextActive]}>
                      Kat. M (Maraton)
                    </Text>
                  </TouchableOpacity>
                </ScrollView>

                {/* Ace List */}
                {aceRankings.map((ace) => (
                  <View key={ace.pigeonId} style={styles.aceCard}>
                    <View style={styles.aceRankCol}>
                      <View
                        style={[
                          styles.rankBadge,
                          ace.rank === 1
                            ? styles.rankGold
                            : ace.rank === 2
                            ? styles.rankSilver
                            : ace.rank === 3
                            ? styles.rankBronze
                            : styles.rankNormal,
                        ]}
                      >
                        <Text style={styles.rankBadgeText}>#{ace.rank}</Text>
                      </View>
                    </View>

                    <View style={styles.aceInfoCol}>
                      <View style={styles.aceTopRow}>
                        <Text style={styles.aceRing}>{ace.ringNumber}</Text>
                        <Text style={styles.aceSex}>
                          {ace.sex === 'cock' ? '♂ Samiec' : '♀ Samica'}
                        </Text>
                      </View>

                      <View style={styles.aceBadgesRow}>
                        {ace.categoryBadges.map((badge, bIdx) => (
                          <View key={bIdx} style={styles.catBadge}>
                            <Text style={styles.catBadgeText}>{badge}</Text>
                          </View>
                        ))}
                      </View>

                      <View style={styles.aceStatsRow}>
                        <Text style={styles.aceStatText}>
                          <strong>{ace.totalPrizes}</strong> konk. &bull;{' '}
                          <strong>{ace.totalConcourseKm}</strong> kkm
                        </Text>
                        <Text style={styles.aceCoeffText}>
                          Coeff: <strong>{ace.totalCoeff.toFixed(3)}</strong>
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}

                {aceRankings.length === 0 && (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>Brak gołębi spełniających wybrane kryteria.</Text>
                  </View>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <FieldButton
                title="🖨️ Drukuj Protokół Mistrzostwa (A4/PDF)"
                onPress={handlePrintReport}
                style={{ marginBottom: 10, minHeight: 48 }}
                testID="btn-print-championship-report"
              />

              <FieldButton
                title="📤 Udostępnij Protokół PDF"
                variant="secondary"
                onPress={handleShareReport}
                style={{ marginBottom: 20, minHeight: 48 }}
                testID="btn-share-championship-report"
              />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121417',
  },
  container: {
    flex: 1,
    backgroundColor: '#121417',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F3F4F6',
  },
  subtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#D1D5DB',
    fontWeight: 'bold',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2F343F',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  kpiVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#E5A93C',
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 1,
  },
  navTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  navTab: {
    flex: 1,
    backgroundColor: '#1E2127',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  navTabActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#3B82F6',
  },
  navTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  navTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollContent: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5A93C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  flightCard: {
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 10,
  },
  flightCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
    paddingBottom: 8,
    marginBottom: 8,
  },
  flightName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F3F4F6',
  },
  flightMeta: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  pointsBadge: {
    alignItems: 'flex-end',
  },
  pointsBadgeVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#60A5FA',
  },
  pointsBadgeSub: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 1,
  },
  countedPigeonsList: {
    gap: 6,
  },
  countedPigeonsLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  pigeonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121417',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  pigeonPillRing: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  pigeonPillPos: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E5A93C',
  },
  pigeonPillPts: {
    fontSize: 11,
    fontWeight: '700',
    color: '#60A5FA',
  },
  pigeonPillCoeff: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  noCountedText: {
    fontSize: 11,
    color: '#EF4444',
    fontStyle: 'italic',
  },
  interInfoCard: {
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 10,
  },
  interInfoTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#93C5FD',
    marginBottom: 4,
  },
  interInfoText: {
    fontSize: 11,
    color: '#D1D5DB',
    lineHeight: 16,
  },
  interStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2F343F',
  },
  interStatusLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  interBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  interBadgeOk: {
    backgroundColor: '#059669',
  },
  interBadgeWait: {
    backgroundColor: '#D97706',
  },
  interBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  interStatsCard: {
    flexDirection: 'row',
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 12,
  },
  interStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  interStatVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F3F4F6',
  },
  interStatLbl: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  chip: {
    backgroundColor: '#1E2127',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  chipActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#3B82F6',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  aceCard: {
    flexDirection: 'row',
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 8,
    alignItems: 'center',
  },
  aceRankCol: {
    width: 36,
    alignItems: 'center',
    marginRight: 10,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankGold: {
    backgroundColor: '#EAB308',
  },
  rankSilver: {
    backgroundColor: '#94A3B8',
  },
  rankBronze: {
    backgroundColor: '#B45309',
  },
  rankNormal: {
    backgroundColor: '#374151',
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  aceInfoCol: {
    flex: 1,
  },
  aceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aceRing: {
    fontSize: 13,
    fontWeight: '800',
    color: '#60A5FA',
  },
  aceSex: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  aceBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginVertical: 4,
  },
  catBadge: {
    backgroundColor: '#121417',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#374151',
  },
  catBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  aceStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  aceStatText: {
    fontSize: 11,
    color: '#D1D5DB',
  },
  aceCoeffText: {
    fontSize: 11,
    color: '#10B981',
  },
  emptyBox: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionsContainer: {
    marginTop: 10,
  },
});

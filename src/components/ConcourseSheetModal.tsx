/**
 * PIGEON-FLY — ConcourseSheetModal (Z-044, Z-049, FCI / PZHGP)
 * Official Concourse Ranking Sheet, 20%/25%/33% Prize Limit Filter,
 * National Championship (GMP) 5-from-50 series points, and Olympic Sport Categories (A, B, C, M, D, F).
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
  calculateConcourseLimit,
  evaluatePigeonPrize,
  calculateTeamSeriesScore,
  evaluateOlympicQualification,
  OLYMPIC_CATEGORIES,
  OlympicCategoryCode,
} from '../domain/concourse';
import { ArrivalWithPigeon } from '../db/raceRepository';
import { FieldButton } from './FieldButton';
import { PdfService } from '../services/pdfService';
import { CsvService } from '../services/csvService';
import { exportConcourseToCsv } from '../domain/csvExport';

export interface ConcourseSheetModalProps {
  visible: boolean;
  onClose: () => void;
  raceName: string;
  releaseLocation: string;
  distanceKm: number;
  totalBasketed: number;
  arrivals: ArrivalWithPigeon[];
}

export function ConcourseSheetModal({
  visible,
  onClose,
  raceName,
  releaseLocation,
  distanceKm,
  totalBasketed,
  arrivals,
}: ConcourseSheetModalProps) {
  const [basePercent, setBasePercent] = useState<20 | 25 | 33>(20);
  const [activeTab, setActiveTab] = useState<'concourse' | 'olympic'>('concourse');

  const concourseLimit = calculateConcourseLimit(totalBasketed, basePercent);

  // Evaluate arrivals against prize base
  const evaluatedArrivals = arrivals.map((arr, idx) => {
    const position = idx + 1;
    const prize = evaluatePigeonPrize({
      position,
      totalBasketed,
      distanceKm,
      basePercent,
    });
    return {
      ...arr,
      position,
      prize,
      isTip: idx < 10, // First 10 tipped for demo
    };
  });

  const prizeWinners = evaluatedArrivals.filter((a) => a.prize.isPrize);
  const teamSeries = calculateTeamSeriesScore(
    '5_from_50',
    evaluatedArrivals.map((a) => ({
      isTip: a.isTip,
      isPrize: a.prize.isPrize,
      gmpPoints: a.prize.gmpPoints,
      ringNumber: a.ringNumber,
    }))
  );

  const winningVelocity = arrivals.length > 0 ? arrivals[0].velocityMPerMin : 0;
  const lastPrizeVelocity =
    prizeWinners.length > 0
      ? prizeWinners[prizeWinners.length - 1].velocityMPerMin
      : 0;

  const concourseItems = evaluatedArrivals
    .filter((a) => a.prize.isPrize)
    .map((a) => ({
      position: a.position,
      ringNumber: a.ringNumber,
      plumageColor: a.plumageColor,
      sex: a.sex,
      fancierName: 'Hodowca Pigeon-Fly',
      loftName: 'Gołębnik Mistrza',
      arrivalTime: new Date(a.arrivalTime).toLocaleTimeString('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      distanceKm,
      velocityMPerMin: a.velocityMPerMin,
      fciCoeff: a.prize.fciCoefficient,
      gmpPoints: a.prize.gmpPoints,
      isTip: a.isTip,
    }));

  const handleExportCsv = async () => {
    try {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      const csv = exportConcourseToCsv({
        clubBranch: 'Oddział 0284 Gostyń • Sekcja Poniec',
        raceName,
        releaseLocation,
        releaseDateTime: new Date().toLocaleDateString('pl-PL'),
        distanceKm,
        totalBasketed,
        basePercent,
        prizeLimit: concourseLimit.prizeLimit,
        items: concourseItems,
      });
      await CsvService.shareCsv(
        `lista-konkursowa-${raceName.replace(/[^a-zA-Z0-9]/g, '_')}.csv`,
        csv,
        'Udostępnij listę konkursową CSV'
      );
    } catch (err: any) {
      Alert.alert('Błąd CSV', err?.message || 'Nie udało się wyeksportować CSV');
    }
  };

  const handleExportConcoursePdf = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    Alert.alert(
      'Oficjalna Lista Konkursowa (PZHGP / FCI)',
      `Wybierz format dokumentu dla lotu ${releaseLocation} (${prizeWinners.length} konkursów w bazie ${basePercent}%):`,
      [
        {
          text: '🖨️ Drukuj (AirPrint)',
          onPress: async () => {
            try {
              await PdfService.exportConcourseSheet(
                {
                  clubBranch: 'Oddział 0284 Gostyń • Sekcja Poniec',
                  raceName,
                  releaseLocation,
                  releaseDateTime: new Date().toLocaleDateString('pl-PL'),
                  distanceKm,
                  totalBasketed,
                  basePercent,
                  prizeLimit: concourseLimit.prizeLimit,
                  winningVelocity,
                  lastPrizeVelocity,
                  items: concourseItems,
                  seriesSummary: {
                    seriesName: 'Mistrzostwo Polski GMP (5 z 50)',
                    totalPoints: teamSeries.totalSeriesPoints,
                    countingBirdsCount: teamSeries.countingPigeonsCount,
                  },
                },
                'print'
              );
            } catch (err: any) {
              Alert.alert('Błąd', err?.message || 'Nie udało się wydrukować listy konkursowej');
            }
          },
        },
        {
          text: '📤 Udostępnij PDF (A4)',
          onPress: async () => {
            try {
              await PdfService.exportConcourseSheet(
                {
                  clubBranch: 'Oddział 0284 Gostyń • Sekcja Poniec',
                  raceName,
                  releaseLocation,
                  releaseDateTime: new Date().toLocaleDateString('pl-PL'),
                  distanceKm,
                  totalBasketed,
                  basePercent,
                  prizeLimit: concourseLimit.prizeLimit,
                  winningVelocity,
                  lastPrizeVelocity,
                  items: concourseItems,
                  seriesSummary: {
                    seriesName: 'Mistrzostwo Polski GMP (5 z 50)',
                    totalPoints: teamSeries.totalSeriesPoints,
                    countingBirdsCount: teamSeries.countingPigeonsCount,
                  },
                },
                'share'
              );
            } catch (err: any) {
              Alert.alert('Błąd', err?.message || 'Nie udało się wyeksportować listy konkursowej');
            }
          },
        },
        {
          text: '📥 Eksportuj do CSV (Excel)',
          onPress: handleExportCsv,
        },
        { text: 'Anuluj', style: 'cancel' },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <View style={styles.pillBadge}>
                  <Text style={styles.pillDot}>●</Text>
                  <Text style={styles.pillText}>OFICJALNA LISTA KONKURSOWA FCI</Text>
                </View>
                <Text style={styles.title}>{releaseLocation}</Text>
                <Text style={styles.subTitle}>
                  {raceName} • Dystans: {distanceKm.toFixed(1)} km
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="btn-close-concourse">
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Prize Base Selector */}
            <View style={styles.baseSelectorRow}>
              <Text style={styles.selectorLabel}>Baza Konkursowa:</Text>
              {([20, 25, 33] as const).map((pct) => (
                <TouchableOpacity
                  key={pct}
                  style={[
                    styles.baseBtn,
                    basePercent === pct && styles.baseBtnActive,
                  ]}
                  onPress={() => {
                    setBasePercent(pct);
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                  }}
                >
                  <Text
                    style={[
                      styles.baseBtnText,
                      basePercent === pct && styles.baseBtnTextActive,
                    ]}
                  >
                    {pct}% {pct === 20 ? '(PZHGP)' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Concourse Summary Cards */}
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Włożono ptaków</Text>
                <Text style={styles.summaryValue}>{totalBasketed} szt.</Text>
                <Text style={styles.summarySub}>Do kosza</Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Baza {basePercent}%</Text>
                <Text style={[styles.summaryValue, { color: '#E5A93C' }]}>
                  {concourseLimit.prizeLimit} nagród
                </Text>
                <Text style={styles.summarySub}>Limit konkursów</Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Zwycięzca (1:1)</Text>
                <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                  {winningVelocity.toFixed(1)} m/m
                </Text>
                <Text style={styles.summarySub}>Pierwszy ptak</Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Punkty Serii (5/50)</Text>
                <Text style={[styles.summaryValue, { color: '#4E88FF' }]}>
                  {teamSeries.totalSeriesPoints} pkt
                </Text>
                <Text style={styles.summarySub}>{teamSeries.countingPigeonsCount}/5 ptaków</Text>
              </View>
            </View>

            {/* Navigation Tabs */}
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'concourse' && styles.tabBtnActive]}
                onPress={() => setActiveTab('concourse')}
                testID="tab-concourse-list"
              >
                <Text style={[styles.tabBtnText, activeTab === 'concourse' && styles.tabBtnTextActive]}>
                  📋 Lista Konkursowa ({arrivals.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'olympic' && styles.tabBtnActive]}
                onPress={() => setActiveTab('olympic')}
                testID="tab-olympic-categories"
              >
                <Text style={[styles.tabBtnText, activeTab === 'olympic' && styles.tabBtnTextActive]}>
                  🏅 Kategorie Olimpijskie
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB 1: CONCOURSE LIST */}
            {activeTab === 'concourse' && (
              <View>
                {evaluatedArrivals.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.arrivalRow,
                      item.prize.isPrize ? styles.rowPrize : styles.rowNoPrize,
                    ]}
                  >
                    <View style={styles.posBadge}>
                      <Text style={styles.posText}>#{item.position}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.ringRow}>
                        <Text style={styles.ringText}>{item.ringNumber}</Text>
                        <Text style={styles.sexText}>{item.sex === 'cock' ? '♂' : '♀'}</Text>
                        {item.isTip && (
                          <View style={styles.tipBadge}>
                            <Text style={styles.tipText}>TYP (T)</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.velocityText}>
                        {item.velocityMPerMin.toFixed(2)} m/min • {item.plumageColor}
                      </Text>
                    </View>

                    <View style={styles.scoreCol}>
                      <View
                        style={[
                          styles.statusPill,
                          item.prize.isPrize ? styles.statusPillPrize : styles.statusPillNoPrize,
                        ]}
                      >
                        <Text style={styles.statusPillText}>
                          {item.prize.isPrize ? 'KONKURS' : 'POZA BAZĄ'}
                        </Text>
                      </View>
                      {item.prize.isPrize && (
                        <Text style={styles.coeffText}>
                          Coeff: <Text style={styles.boldText}>{item.prize.fciCoefficient.toFixed(3)}</Text>
                        </Text>
                      )}
                      {item.prize.isPrize && (
                        <Text style={styles.gmpText}>
                          GMP: <Text style={styles.boldText}>{item.prize.gmpPoints.toFixed(2)}</Text>
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* TAB 2: OLYMPIC CATEGORIES */}
            {activeTab === 'olympic' && (
              <View>
                {(['A', 'B', 'C', 'M', 'D', 'F'] as OlympicCategoryCode[]).map((code) => {
                  const def = OLYMPIC_CATEGORIES[code];
                  const racesMock = arrivals.map((a, idx) => ({
                    position: idx + 1,
                    totalBasketed,
                    distanceKm,
                  }));
                  const qual = evaluateOlympicQualification(code, racesMock);

                  return (
                    <View key={code} style={styles.olympicCard}>
                      <View style={styles.olympicHeader}>
                        <View style={styles.catCodeCircle}>
                          <Text style={styles.catCodeText}>{code}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.catName}>{def.name}</Text>
                          <Text style={styles.catDesc}>{def.description}</Text>
                        </View>
                        <View
                          style={[
                            styles.qualBadge,
                            qual.isQualified ? styles.qualBadgeSuccess : styles.qualBadgePending,
                          ]}
                        >
                          <Text style={styles.qualBadgeText}>
                            {qual.isQualified ? 'ZAKWALIFIKOWANY' : 'W TRAKCIE'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.olympicMetaRow}>
                        <Text style={styles.olympicMetaText}>
                          Zdobyte konkursy: <Text style={styles.boldText}>{qual.qualifiedPrizesCount}/{def.minPrizesRequired}</Text>
                        </Text>
                        <Text style={styles.olympicMetaText}>
                          Suma kkm: <Text style={styles.boldText}>{qual.totalConcourseKm}/{def.minTotalConcourseKm} km</Text>
                        </Text>
                        {qual.isQualified && (
                          <Text style={[styles.olympicMetaText, { color: '#E5A93C' }]}>
                            Łączny Coeff: <Text style={styles.boldText}>{qual.totalFciCoeff.toFixed(3)}</Text>
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Action Export Buttons */}
            <FieldButton
              title="📄 Drukuj / Udostępnij Listę Konkursową (PDF)"
              onPress={handleExportConcoursePdf}
              style={{ marginTop: 14 }}
              testID="btn-export-concourse-pdf"
            />
            <FieldButton
              title="📥 Eksportuj CSV do Programów Obliczeniowych"
              variant="secondary"
              onPress={handleExportCsv}
              style={{ marginTop: 8 }}
              testID="btn-export-concourse-csv"
            />
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#121417',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pillDot: {
    color: '#E5A93C',
    fontSize: 10,
  },
  pillText: {
    color: '#E5A93C',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  subTitle: {
    color: '#8E94A0',
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E2127',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#8E94A0',
    fontSize: 18,
    fontWeight: '700',
  },
  baseSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  selectorLabel: {
    color: '#8E94A0',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 8,
  },
  baseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
  },
  baseBtnActive: {
    backgroundColor: '#E5A93C',
  },
  baseBtnText: {
    color: '#8E94A0',
    fontSize: 12,
    fontWeight: '700',
  },
  baseBtnTextActive: {
    color: '#121417',
    fontWeight: '800',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  summaryLabel: {
    color: '#8E94A0',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  summarySub: {
    color: '#6B7280',
    fontSize: 10,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#2F343F',
  },
  tabBtnText: {
    color: '#8E94A0',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  arrivalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  rowPrize: {
    borderColor: 'rgba(76, 175, 80, 0.4)',
    backgroundColor: '#1A231C',
  },
  rowNoPrize: {
    borderColor: '#2F343F',
    opacity: 0.7,
  },
  posBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2F343F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  posText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  ringText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  sexText: {
    color: '#8E94A0',
    fontSize: 14,
    fontWeight: '700',
  },
  tipBadge: {
    backgroundColor: '#E5A93C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tipText: {
    color: '#121417',
    fontSize: 9,
    fontWeight: '800',
  },
  velocityText: {
    color: '#8E94A0',
    fontSize: 12,
  },
  scoreCol: {
    alignItems: 'flex-end',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 2,
  },
  statusPillPrize: {
    backgroundColor: 'rgba(76, 175, 80, 0.25)',
  },
  statusPillNoPrize: {
    backgroundColor: 'rgba(142, 148, 160, 0.2)',
  },
  statusPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  coeffText: {
    color: '#E5A93C',
    fontSize: 11,
  },
  gmpText: {
    color: '#4E88FF',
    fontSize: 11,
  },
  boldText: {
    fontWeight: '800',
  },
  olympicCard: {
    backgroundColor: '#1E2127',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  olympicHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  catCodeCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    borderWidth: 1,
    borderColor: '#E5A93C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catCodeText: {
    color: '#E5A93C',
    fontSize: 18,
    fontWeight: '900',
  },
  catName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  catDesc: {
    color: '#8E94A0',
    fontSize: 11,
    marginTop: 2,
  },
  qualBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  qualBadgeSuccess: {
    backgroundColor: 'rgba(76, 175, 80, 0.25)',
  },
  qualBadgePending: {
    backgroundColor: 'rgba(142, 148, 160, 0.2)',
  },
  qualBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  olympicMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2F343F',
  },
  olympicMetaText: {
    color: '#8E94A0',
    fontSize: 12,
  },
});

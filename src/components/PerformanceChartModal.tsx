/**
 * PIGEON-FLY — PerformanceChartModal
 * Interactive velocity curve ($m/\text{min}$) and racing form trendline visualizer.
 * Analyzes season races, prize concourses, FCI coefficients, and championship GMP points.
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line, Circle, Text as SvgText, Rect, Path, G } from 'react-native-svg';
import { Pigeon } from '../domain/types';
import {
  calculatePigeonForm,
  calculateSpeedDelta,
  PigeonFormSummary,
  RacePerformanceEntry,
} from '../domain/performance';
import { FieldButton } from './FieldButton';

export interface PerformanceChartModalProps {
  visible: boolean;
  pigeon: Pigeon | null;
  onClose: () => void;
  raceHistory?: RacePerformanceEntry[];
}

const DEFAULT_DEMO_HISTORY: RacePerformanceEntry[] = [
  {
    raceId: 'r-1',
    raceName: 'Lot 1 — Świebodzin',
    releaseDate: '2026-05-03',
    distanceKm: 165.4,
    velocityMPerMin: 1180.5,
    flightDurationMinutes: 140.1,
    concoursePosition: 28,
    totalBasketed: 1600,
    isPrize: true,
    fciCoefficient: 17.5,
    gmpPoints: 20.0,
  },
  {
    raceId: 'r-2',
    raceName: 'Lot 2 — Gorzów Wlkp.',
    releaseDate: '2026-05-10',
    distanceKm: 220.8,
    velocityMPerMin: 1245.0,
    flightDurationMinutes: 177.3,
    concoursePosition: 14,
    totalBasketed: 1540,
    isPrize: true,
    fciCoefficient: 9.09,
    gmpPoints: 25.4,
  },
  {
    raceId: 'r-3',
    raceName: 'Lot 3 — Szczecin',
    releaseDate: '2026-05-17',
    distanceKm: 340.2,
    velocityMPerMin: 1390.2,
    flightDurationMinutes: 244.7,
    concoursePosition: 4,
    totalBasketed: 1480,
    isPrize: true,
    fciCoefficient: 2.7,
    gmpPoints: 36.2,
  },
  {
    raceId: 'r-4',
    raceName: 'Lot 4 — Greifswald (DE)',
    releaseDate: '2026-05-24',
    distanceKm: 425.0,
    velocityMPerMin: 1422.8,
    flightDurationMinutes: 298.7,
    concoursePosition: 2,
    totalBasketed: 1390,
    isPrize: true,
    fciCoefficient: 1.44,
    gmpPoints: 39.5,
  },
  {
    raceId: 'r-5',
    raceName: 'Lot 5 — Rostock (DE)',
    releaseDate: '2026-05-31',
    distanceKm: 512.6,
    velocityMPerMin: 1380.0,
    flightDurationMinutes: 371.4,
    concoursePosition: 19,
    totalBasketed: 1250,
    isPrize: true,
    fciCoefficient: 15.2,
    gmpPoints: 28.1,
  },
];

export function PerformanceChartModal({
  visible,
  pigeon,
  onClose,
  raceHistory,
}: PerformanceChartModalProps) {
  if (!pigeon) return null;

  const history = raceHistory && raceHistory.length > 0 ? raceHistory : DEFAULT_DEMO_HISTORY;
  const form: PigeonFormSummary = calculatePigeonForm(pigeon.id, history);

  const [selectedEntry, setSelectedEntry] = useState<RacePerformanceEntry | null>(
    history[history.length - 1]
  );

  // SVG Chart Geometry
  const chartWidth = 320;
  const chartHeight = 180;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 30;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const velocities = history.map((h) => h.velocityMPerMin);
  const minV = Math.floor(Math.min(...velocities) / 100) * 100 - 50;
  const maxV = Math.ceil(Math.max(...velocities) / 100) * 100 + 50;

  const getX = (idx: number) => {
    if (history.length <= 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (idx / (history.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    const range = maxV - minV || 1;
    return paddingTop + innerHeight - ((val - minV) / range) * innerHeight;
  };

  // Generate SVG path for speed line
  const pathD = history.reduce((acc, curr, idx) => {
    const x = getX(idx);
    const y = getY(curr.velocityMPerMin);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const trajectoryColors: Record<string, { bg: string; text: string; icon: string }> = {
    peaking: { bg: '#2E7D32', text: '#A5D6A7', icon: '🔥 Szczyt Formy (Wznosząca)' },
    stable: { bg: '#1565C0', text: '#90CAF9', icon: '⭐ Stabilna Równa Forma' },
    declining: { bg: '#C62828', text: '#EF9A9A', icon: '⚠️ Spadek Formy (Zmęczenie)' },
    recovering: { bg: '#E65100', text: '#FFCC80', icon: '🔄 Regeneracja' },
  };

  const traj = trajectoryColors[form.formTrajectory] || trajectoryColors.stable;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>WYKRES FORMY I PRĘDKOŚCI</Text>
                <Text style={styles.ringText}>{pigeon.ringNumber}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="btn-close-performance">
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Trajectory Badge & Form Index Card */}
            <View style={styles.formSummaryCard}>
              <View style={styles.formScoreCol}>
                <Text style={styles.scoreNumber}>{form.formScore}</Text>
                <Text style={styles.scoreLabel}>INDEKS FORMY / 100</Text>
              </View>
              <View style={styles.formTrajCol}>
                <View style={[styles.trajBadge, { backgroundColor: traj.bg }]}>
                  <Text style={[styles.trajBadgeText, { color: traj.text }]}>{traj.icon}</Text>
                </View>
                <Text style={styles.formStatsMini}>
                  {form.totalPrizes}/{form.totalRaces} konk. ({form.efficiencyPercent}%) • Śr: {form.averageVelocityMPerMin} m/min
                </Text>
              </View>
            </View>

            {/* SVG Velocity Chart */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>DYNAMIKA PRĘDKOŚCI LOTÓW (m/min)</Text>
              <View style={styles.svgWrapper}>
                <Svg width={chartWidth} height={chartHeight}>
                  {/* Grid background lines */}
                  <Line
                    x1={paddingLeft}
                    y1={paddingTop}
                    x2={chartWidth - paddingRight}
                    y2={paddingTop}
                    stroke="#2F343F"
                    strokeDasharray="4 4"
                  />
                  <Line
                    x1={paddingLeft}
                    y1={paddingTop + innerHeight / 2}
                    x2={chartWidth - paddingRight}
                    y2={paddingTop + innerHeight / 2}
                    stroke="#2F343F"
                    strokeDasharray="4 4"
                  />
                  <Line
                    x1={paddingLeft}
                    y1={paddingTop + innerHeight}
                    x2={chartWidth - paddingRight}
                    y2={paddingTop + innerHeight}
                    stroke="#3E4554"
                  />

                  {/* Y Axis Labels */}
                  <SvgText
                    x={paddingLeft - 8}
                    y={paddingTop + 4}
                    fontSize="9"
                    fill="#8E94A0"
                    textAnchor="end"
                  >
                    {maxV}
                  </SvgText>
                  <SvgText
                    x={paddingLeft - 8}
                    y={paddingTop + innerHeight / 2 + 3}
                    fontSize="9"
                    fill="#8E94A0"
                    textAnchor="end"
                  >
                    {Math.round((maxV + minV) / 2)}
                  </SvgText>
                  <SvgText
                    x={paddingLeft - 8}
                    y={paddingTop + innerHeight + 3}
                    fontSize="9"
                    fill="#8E94A0"
                    textAnchor="end"
                  >
                    {minV}
                  </SvgText>

                  {/* Speed trendline */}
                  <Path d={pathD} fill="none" stroke="#E5A93C" strokeWidth="3" />

                  {/* Flight Points */}
                  {history.map((entry, idx) => {
                    const x = getX(idx);
                    const y = getY(entry.velocityMPerMin);
                    const isSelected = selectedEntry?.raceId === entry.raceId;

                    return (
                      <G key={entry.raceId}>
                        <Circle
                          cx={x}
                          cy={y}
                          r={isSelected ? 7 : 5}
                          fill={entry.isPrize ? '#4CAF50' : '#E53935'}
                          stroke="#FFFFFF"
                          strokeWidth={isSelected ? 2 : 1}
                        />
                        <SvgText
                          x={x}
                          y={chartHeight - 10}
                          fontSize="9"
                          fill={isSelected ? '#E5A93C' : '#8E94A0'}
                          fontWeight={isSelected ? 'bold' : 'normal'}
                          textAnchor="middle"
                        >
                          L{idx + 1}
                        </SvgText>
                      </G>
                    );
                  })}
                </Svg>
              </View>

              {/* Chart Legend */}
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                  <Text style={styles.legendText}>Konkurs (Baza)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#E53935' }]} />
                  <Text style={styles.legendText}>Poza konkursem</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendLine, { backgroundColor: '#E5A93C' }]} />
                  <Text style={styles.legendText}>Krzywa m/min</Text>
                </View>
              </View>
            </View>

            {/* Tactical Advice Box */}
            <View style={styles.adviceBox}>
              <Text style={styles.adviceTitle}>🎯 REKOMENDACJA TAKTYCZNA</Text>
              <Text style={styles.adviceText}>{form.tacticalAdvice}</Text>
            </View>

            {/* Race History Cards */}
            <Text style={styles.sectionTitle}>Rejestr Lotów w Sezonie ({history.length})</Text>
            {history.map((entry, idx) => {
              const isSelected = selectedEntry?.raceId === entry.raceId;
              const prevSpeed = idx > 0 ? history[idx - 1].velocityMPerMin : entry.velocityMPerMin;
              const delta = calculateSpeedDelta(entry.velocityMPerMin, prevSpeed);

              return (
                <TouchableOpacity
                  key={entry.raceId}
                  style={[styles.raceCard, isSelected && styles.raceCardSelected]}
                  onPress={() => setSelectedEntry(entry)}
                >
                  <View style={styles.raceCardHeader}>
                    <Text style={styles.raceName}>{entry.raceName}</Text>
                    <View
                      style={[
                        styles.prizeBadge,
                        { backgroundColor: entry.isPrize ? '#1B5E20' : '#37474F' },
                      ]}
                    >
                      <Text style={styles.prizeBadgeText}>
                        {entry.isPrize ? 'KONKURS' : 'BRAK'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.raceCardStatsRow}>
                    <View style={styles.statMini}>
                      <Text style={styles.statMiniLabel}>Dystans</Text>
                      <Text style={styles.statMiniVal}>{entry.distanceKm} km</Text>
                    </View>
                    <View style={styles.statMini}>
                      <Text style={styles.statMiniLabel}>Prędkość</Text>
                      <Text style={[styles.statMiniVal, { color: '#E5A93C' }]}>
                        {entry.velocityMPerMin.toFixed(1)} m/min
                      </Text>
                    </View>
                    <View style={styles.statMini}>
                      <Text style={styles.statMiniLabel}>Pozycja / Włoż.</Text>
                      <Text style={styles.statMiniVal}>
                        {entry.concoursePosition || '-'}/{entry.totalBasketed || '-'}
                      </Text>
                    </View>
                    <View style={styles.statMini}>
                      <Text style={styles.statMiniLabel}>Coeff FCI</Text>
                      <Text style={styles.statMiniVal}>
                        {entry.fciCoefficient !== undefined ? entry.fciCoefficient.toFixed(2) : '-'}
                      </Text>
                    </View>
                  </View>

                  {idx > 0 && (
                    <Text style={styles.deltaText}>
                      Zmiana prędkości: {delta.deltaMpm >= 0 ? '+' : ''}
                      {delta.deltaMpm} m/min ({delta.percentChange >= 0 ? '+' : ''}
                      {delta.percentChange}%)
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}

            <FieldButton
              title="Zamknij"
              variant="secondary"
              onPress={onClose}
              style={{ marginTop: 14 }}
              testID="btn-close-performance-bottom"
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
    backgroundColor: '#1E2127',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '94%',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 1,
  },
  ringText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
  },
  closeText: {
    fontSize: 22,
    color: '#8E94A0',
    fontWeight: '800',
  },
  formSummaryCard: {
    backgroundColor: '#15171C',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  formScoreCol: {
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#2F343F',
    paddingRight: 16,
    marginRight: 16,
  },
  scoreNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: '#E5A93C',
    fontFamily: 'monospace',
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8E94A0',
    marginTop: 2,
  },
  formTrajCol: {
    flex: 1,
  },
  trajBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  trajBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  formStatsMini: {
    fontSize: 12,
    color: '#A0A6B2',
  },
  chartContainer: {
    backgroundColor: '#15171C',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    padding: 14,
    marginBottom: 14,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D4D8E0',
    letterSpacing: 0.6,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  svgWrapper: {
    alignItems: 'center',
  },
  chartLegend: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLine: {
    width: 12,
    height: 3,
    borderRadius: 1.5,
  },
  legendText: {
    fontSize: 10,
    color: '#8E94A0',
  },
  adviceBox: {
    backgroundColor: '#2A2417',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5A93C',
    padding: 14,
    marginBottom: 16,
  },
  adviceTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  adviceText: {
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D4D8E0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  raceCard: {
    backgroundColor: '#15171C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
    padding: 12,
    marginBottom: 8,
  },
  raceCardSelected: {
    borderColor: '#E5A93C',
  },
  raceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  raceName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  prizeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  prizeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  raceCardStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statMini: {
    alignItems: 'center',
  },
  statMiniLabel: {
    fontSize: 10,
    color: '#8E94A0',
    marginBottom: 2,
  },
  statMiniVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  deltaText: {
    fontSize: 10,
    color: '#8E94A0',
    marginTop: 6,
    fontStyle: 'italic',
  },
});

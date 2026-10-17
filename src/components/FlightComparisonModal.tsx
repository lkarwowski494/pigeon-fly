/**
 * PIGEON-FLY — Branch Flight Comparison Modal (Z-051)
 * Interactive post-race analysis tool comparing loft arrivals with branch competition results.
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import {
  calculateFlightComparison,
  BranchRaceStats,
  LoftRaceInput,
} from '../domain/flightComparison';
import { ArrivalWithPigeon } from '../db/raceRepository';

interface FlightComparisonModalProps {
  visible: boolean;
  onClose: () => void;
  raceName: string;
  loftDistanceKm: number;
  basketedCount: number;
  arrivals: ArrivalWithPigeon[];
}

export const FlightComparisonModal: React.FC<FlightComparisonModalProps> = ({
  visible,
  onClose,
  raceName,
  loftDistanceKm,
  basketedCount,
  arrivals,
}) => {
  const [branchName, setBranchName] = useState('Oddział 0284 Gostyń');
  const [totalBranchBirds, setTotalBranchBirds] = useState('2450');
  const [winnerSpeed, setWinnerSpeed] = useState('1348.50');
  const [closingSpeed, setClosingSpeed] = useState('1215.20');
  const [windSpeed, setWindSpeed] = useState('18');
  const [windDir, setWindDir] = useState('270'); // West

  const totalBirdsNum = parseInt(totalBranchBirds, 10) || 2000;
  const winnerSpeedNum = parseFloat(winnerSpeed) || 1350.0;
  const closingSpeedNum = parseFloat(closingSpeed) || 1200.0;
  const windSpeedNum = parseFloat(windSpeed) || 15;
  const windDirNum = parseFloat(windDir) || 270;

  const branchStats: BranchRaceStats = {
    branchName,
    totalLoftsCount: 45,
    totalBirdsBasketed: totalBirdsNum,
    prizeLimit: Math.ceil(totalBirdsNum * 0.2),
    basePercent: 20,
    winnerBird: {
      breederName: 'Lider Oddziału',
      ringNumber: 'PL-0284-22-101',
      speedMPerMin: winnerSpeedNum,
      arrivalTimeIso: new Date().toISOString(),
      distanceKm: loftDistanceKm,
    },
    closingBird: {
      speedMPerMin: closingSpeedNum,
      arrivalTimeIso: new Date().toISOString(),
    },
    raceCategory: 'A',
    averageBranchDistanceKm: loftDistanceKm,
    windInfo: {
      speedKmh: windSpeedNum,
      directionDeg: windDirNum,
      description: 'Wiatr zachodni (boczny znoszący)',
    },
  };

  const loftInput: LoftRaceInput = {
    loftName: 'Gołębnik Mistrza',
    loftDistanceKm,
    basketedCount: basketedCount > 0 ? basketedCount : 50,
    arrivals,
  };

  const report = calculateFlightComparison(loftInput, branchStats);

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>📈 Analiza z Oddziałem PZHGP</Text>
            <Text style={styles.subtitle}>
              {raceName} • {loftDistanceKm.toFixed(1)} km • {branchName}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            testID="btn-close-comparison"
            accessibilityRole="button"
          >
            <Text style={styles.closeBtnText}>✕ Zamknij</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Quick Benchmark Parameters */}
          <View style={styles.paramCard}>
            <Text style={styles.cardHeader}>⚙️ Parametry Czołówki Oddziału:</Text>
            <View style={styles.paramRow}>
              <View style={styles.paramCol}>
                <Text style={styles.paramLabel}>1. Gołąb Oddziału (m/min):</Text>
                <TextInput
                  style={styles.paramInput}
                  keyboardType="numeric"
                  value={winnerSpeed}
                  onChangeText={setWinnerSpeed}
                  testID="input-winner-speed"
                />
              </View>
              <View style={styles.paramCol}>
                <Text style={styles.paramLabel}>Koniec Konkursu 20% (m/min):</Text>
                <TextInput
                  style={styles.paramInput}
                  keyboardType="numeric"
                  value={closingSpeed}
                  onChangeText={setClosingSpeed}
                  testID="input-closing-speed"
                />
              </View>
            </View>
            <View style={styles.paramRow}>
              <View style={styles.paramCol}>
                <Text style={styles.paramLabel}>Ptaków w Oddziale:</Text>
                <TextInput
                  style={styles.paramInput}
                  keyboardType="numeric"
                  value={totalBranchBirds}
                  onChangeText={setTotalBranchBirds}
                  testID="input-total-birds"
                />
              </View>
              <View style={styles.paramCol}>
                <Text style={styles.paramLabel}>Wiatr (km/h):</Text>
                <TextInput
                  style={styles.paramInput}
                  keyboardType="numeric"
                  value={windSpeed}
                  onChangeText={setWindSpeed}
                  testID="input-wind-speed"
                />
              </View>
            </View>
          </View>

          {/* Performance KPI Cards */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Wydajność Gołębnika</Text>
              <Text
                style={[
                  styles.kpiValue,
                  {
                    color:
                      report.loftEfficiencyPercent >= 20 ? '#10B981' : '#EF4444',
                  },
                ]}
              >
                {report.loftEfficiencyPercent}%
              </Text>
              <Text style={styles.kpiSub}>
                {report.prizesWonCount} konk. / {report.totalBasketedLoft} włoż.
              </Text>
              <View style={styles.kpiBadge}>
                <Text style={styles.kpiBadgeText}>
                  {report.efficiencyMultiplier}x normy bazy 20%
                </Text>
              </View>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Strata do 1. w Oddziale</Text>
              <Text
                style={[
                  styles.kpiValue,
                  {
                    color:
                      report.speedDeltaWinnerMPerMin >= 0
                        ? '#10B981'
                        : '#F59E0B',
                  },
                ]}
              >
                {report.speedDeltaWinnerMPerMin >= 0 ? '+' : ''}
                {report.speedDeltaWinnerMPerMin.toFixed(1)} m/min
              </Text>
              <Text style={styles.kpiSub}>
                1. ptak: {report.loftFirstSpeedMPerMin.toFixed(1)} m/min
              </Text>
              <View style={styles.kpiBadge}>
                <Text style={styles.kpiBadgeText}>
                  Szac. #{report.loftTopPositionEstimated} w Oddziale
                </Text>
              </View>
            </View>
          </View>

          {/* Tactical Diagnosis Card */}
          <View style={styles.diagnosisCard}>
            <Text style={styles.diagnosisTitle}>
              {report.tacticalDiagnosisTitle}
            </Text>
            {report.tacticalDiagnosisDetails.map((detail, idx) => (
              <Text key={idx} style={styles.diagnosisBullet}>
                • {detail}
              </Text>
            ))}

            {/* Wind Corridor note */}
            <View style={styles.windBox}>
              <Text style={styles.windBoxTitle}>💨 Korytarz Lotu i Wiatr:</Text>
              <Text style={styles.windBoxContent}>
                {report.windHandicapAnalysis.notes}
              </Text>
            </View>
          </View>

          {/* Coach Recommendations */}
          <View style={styles.coachCard}>
            <Text style={styles.coachTitle}>💡 Zalecenia Trenerskie na Kolejny Lot:</Text>
            {report.coachRecommendations.map((rec, idx) => (
              <View key={idx} style={styles.coachRow}>
                <Text style={styles.coachCheck}>✓</Text>
                <Text style={styles.coachText}>{rec}</Text>
              </View>
            ))}
          </View>

          {/* Spacer */}
          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#334155',
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#F8FAFC',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  paramCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E2E8F0',
    marginBottom: 10,
  },
  paramRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  paramCol: {
    flex: 1,
  },
  paramLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  paramInput: {
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  kpiSub: {
    fontSize: 11,
    color: '#CBD5E1',
    marginBottom: 8,
  },
  kpiBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  kpiBadgeText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  diagnosisCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    borderWidth: 1,
    borderColor: '#334155',
  },
  diagnosisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 10,
  },
  diagnosisBullet: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 20,
    marginBottom: 6,
  },
  windBox: {
    backgroundColor: '#0F2942',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#1E40AF',
  },
  windBoxTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#60A5FA',
    marginBottom: 4,
  },
  windBoxContent: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  coachCard: {
    backgroundColor: '#064E3B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#059669',
  },
  coachTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#A7F3D0',
    marginBottom: 10,
  },
  coachRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  coachCheck: {
    color: '#34D399',
    fontWeight: 'bold',
    fontSize: 14,
  },
  coachText: {
    color: '#FFFFFF',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});

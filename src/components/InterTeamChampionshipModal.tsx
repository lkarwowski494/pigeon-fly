/**
 * PIGEON-FLY — Inter-Team & Section Championship Modal (Z-082 / DEC-96)
 * Field Mode ergonomic interface (>= 48-56pt touch targets), dark theme (#121417).
 * Travelling Trophy (Puchar Przechodni), Yearling Derby, and Super-Cup rankings with printable A4 table.
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
  calculateInterTeamSeasonStandings,
  generateInterTeamStandingsHtml,
  ChampionshipType,
  FancierTeam,
  TeamRaceRecord,
  TeamRules,
} from '../domain/interTeamChampionship';
import { PdfService } from '../services/pdfService';
import { FieldButton } from './FieldButton';

interface InterTeamChampionshipModalProps {
  visible: boolean;
  onClose: () => void;
  branchName?: string;
  sectionName?: string;
}

const DEMO_TEAMS: FancierTeam[] = [
  {
    id: 'team-1',
    teamName: 'Team Gostyń Asy — Karwowski',
    breederName: 'Łukasz Karwowski',
    pzhgpNumber: '0284-1420',
    sectionName: 'Sekcja 1 Gostyń',
  },
  {
    id: 'team-2',
    teamName: 'Szybkie Skrzydła Piaski — Kowalski',
    breederName: 'Jan Kowalski',
    pzhgpNumber: '0284-3312',
    sectionName: 'Sekcja 2 Piaski',
  },
  {
    id: 'team-3',
    teamName: 'Poniec Błyskawica — Nowak',
    breederName: 'Piotr Nowak',
    pzhgpNumber: '0284-5501',
    sectionName: 'Sekcja 3 Poniec',
  },
  {
    id: 'team-4',
    teamName: 'Krobia Mistrz — Wiśniewski',
    breederName: 'Tomasz Wiśniewski',
    pzhgpNumber: '0284-4419',
    sectionName: 'Sekcja 4 Krobia',
  },
];

const DEMO_RACES: TeamRaceRecord[] = [
  // Race 1: Świebodzin (165 km)
  {
    raceId: 'r-1',
    raceName: 'Świebodzin I',
    raceDate: '2026-05-10',
    distanceKm: 165.0,
    teamId: 'team-1',
    arrivals: [
      { pigeonRing: 'PL-0284-23-1402', isYearling: false, distanceKm: 165.0, positionInConcourse: 1, totalBasketed: 2400, fciCoefficient: 0.417, racePoints: 40.0 },
      { pigeonRing: 'PL-0284-24-512', isYearling: true, distanceKm: 165.0, positionInConcourse: 4, totalBasketed: 2400, fciCoefficient: 1.667, racePoints: 39.5 },
      { pigeonRing: 'PL-0284-24-880', isYearling: true, distanceKm: 165.0, positionInConcourse: 9, totalBasketed: 2400, fciCoefficient: 3.750, racePoints: 38.8 },
      { pigeonRing: 'PL-0284-22-9854', isYearling: false, distanceKm: 165.0, positionInConcourse: 18, totalBasketed: 2400, fciCoefficient: 7.500, racePoints: 37.2 },
    ],
  },
  {
    raceId: 'r-1',
    raceName: 'Świebodzin I',
    raceDate: '2026-05-10',
    distanceKm: 165.0,
    teamId: 'team-2',
    arrivals: [
      { pigeonRing: 'DV-01234-23-11', isYearling: false, distanceKm: 165.0, positionInConcourse: 2, totalBasketed: 2400, fciCoefficient: 0.833, racePoints: 39.8 },
      { pigeonRing: 'DV-01234-24-22', isYearling: true, distanceKm: 165.0, positionInConcourse: 8, totalBasketed: 2400, fciCoefficient: 3.333, racePoints: 38.9 },
      { pigeonRing: 'DV-01234-24-33', isYearling: true, distanceKm: 165.0, positionInConcourse: 15, totalBasketed: 2400, fciCoefficient: 6.250, racePoints: 37.8 },
    ],
  },
  {
    raceId: 'r-1',
    raceName: 'Świebodzin I',
    raceDate: '2026-05-10',
    distanceKm: 165.0,
    teamId: 'team-3',
    arrivals: [
      { pigeonRing: 'PL-0284-23-771', isYearling: false, distanceKm: 165.0, positionInConcourse: 5, totalBasketed: 2400, fciCoefficient: 2.083, racePoints: 39.3 },
      { pigeonRing: 'PL-0284-24-991', isYearling: true, distanceKm: 165.0, positionInConcourse: 11, totalBasketed: 2400, fciCoefficient: 4.583, racePoints: 38.4 },
    ],
  },
  // Race 2: Magdeburg (345 km)
  {
    raceId: 'r-2',
    raceName: 'Magdeburg I',
    raceDate: '2026-05-24',
    distanceKm: 345.0,
    teamId: 'team-1',
    arrivals: [
      { pigeonRing: 'PL-0284-23-1402', isYearling: false, distanceKm: 345.0, positionInConcourse: 3, totalBasketed: 2100, fciCoefficient: 1.429, racePoints: 59.5 },
      { pigeonRing: 'PL-0284-24-512', isYearling: true, distanceKm: 345.0, positionInConcourse: 7, totalBasketed: 2100, fciCoefficient: 3.333, racePoints: 58.9 },
      { pigeonRing: 'PL-0284-22-9854', isYearling: false, distanceKm: 345.0, positionInConcourse: 14, totalBasketed: 2100, fciCoefficient: 6.667, racePoints: 57.8 },
    ],
  },
  {
    raceId: 'r-2',
    raceName: 'Magdeburg I',
    raceDate: '2026-05-24',
    distanceKm: 345.0,
    teamId: 'team-2',
    arrivals: [
      { pigeonRing: 'DV-01234-23-11', isYearling: false, distanceKm: 345.0, positionInConcourse: 1, totalBasketed: 2100, fciCoefficient: 0.476, racePoints: 60.0 },
      { pigeonRing: 'DV-01234-24-22', isYearling: true, distanceKm: 345.0, positionInConcourse: 10, totalBasketed: 2100, fciCoefficient: 4.762, racePoints: 58.4 },
    ],
  },
  {
    raceId: 'r-2',
    raceName: 'Magdeburg I',
    raceDate: '2026-05-24',
    distanceKm: 345.0,
    teamId: 'team-4',
    arrivals: [
      { pigeonRing: 'PL-0284-24-111', isYearling: true, distanceKm: 345.0, positionInConcourse: 6, totalBasketed: 2100, fciCoefficient: 2.857, racePoints: 59.0 },
      { pigeonRing: 'PL-0284-23-222', isYearling: false, distanceKm: 345.0, positionInConcourse: 12, totalBasketed: 2100, fciCoefficient: 5.714, racePoints: 58.1 },
    ],
  },
];

export const InterTeamChampionshipModal: React.FC<InterTeamChampionshipModalProps> = ({
  visible,
  onClose,
  branchName = 'Oddział 0284 Gostyń PZHGP',
  sectionName = 'Wszystkie Sekcje Oddziału',
}) => {
  const [activeTab, setActiveTab] = useState<ChampionshipType>('travelling_trophy');

  const rules: TeamRules = useMemo(() => {
    if (activeTab === 'yearling_derby') {
      return {
        seriesBasketedCount: 5,
        seriesCountingCount: 3,
        minDistanceKm: 100,
        yearlingOnly: true,
      };
    }
    if (activeTab === 'inter_team_supercup') {
      return {
        seriesBasketedCount: 10,
        seriesCountingCount: 5,
        minDistanceKm: 250,
        yearlingOnly: false,
      };
    }
    // travelling_trophy (default)
    return {
      seriesBasketedCount: 7,
      seriesCountingCount: 3,
      minDistanceKm: 100,
      yearlingOnly: false,
    };
  }, [activeTab]);

  const summary = useMemo(() => {
    return calculateInterTeamSeasonStandings(
      DEMO_TEAMS,
      DEMO_RACES,
      rules,
      activeTab,
      new Date().getFullYear()
    );
  }, [rules, activeTab]);

  const handlePrintStandings = async () => {
    try {
      const html = generateInterTeamStandingsHtml(summary, {
        branchName,
        sectionName,
      });
      await PdfService.printHtml(html);
    } catch (err: any) {
      Alert.alert('Błąd wydruku', err?.message || 'Nie udało się wydrukować tabeli punktacji.');
    }
  };

  const handleSharePdf = async () => {
    try {
      const html = generateInterTeamStandingsHtml(summary, {
        branchName,
        sectionName,
      });
      await PdfService.shareHtmlAsPdf(
        html,
        `Tabela_Punktacji_Zespolowej_${activeTab}_${summary.seasonYear}.pdf`
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
            <Text style={styles.headerTitle}>🏆 Punktacja Zespołowa Sekcji i Oddziału</Text>
            <Text style={styles.headerSubtitle}>
              Puchar Przechodni, Derby Roczniaków i Super-Cup PZHGP (Z-082)
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Zamknij okno"
            testID="btn-close-team-championship-modal"
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'travelling_trophy' && styles.tabItemActive]}
            onPress={() => setActiveTab('travelling_trophy')}
            testID="tab-championship-travelling"
          >
            <Text style={[styles.tabText, activeTab === 'travelling_trophy' && styles.tabTextActive]}>
              Puchar Przechodni
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'yearling_derby' && styles.tabItemActive]}
            onPress={() => setActiveTab('yearling_derby')}
            testID="tab-championship-yearling"
          >
            <Text style={[styles.tabText, activeTab === 'yearling_derby' && styles.tabTextActive]}>
              Derby Roczniaków
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'inter_team_supercup' && styles.tabItemActive]}
            onPress={() => setActiveTab('inter_team_supercup')}
            testID="tab-championship-supercup"
          >
            <Text style={[styles.tabText, activeTab === 'inter_team_supercup' && styles.tabTextActive]}>
              Super-Puchar Ligi
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Rules Banner */}
          <View style={styles.rulesBanner}>
            <Text style={styles.rulesTitle}>{summary.championshipTitle}</Text>
            <Text style={styles.rulesSub}>
              Reguły serii: <Text style={styles.boldWhite}>{rules.seriesCountingCount} z {rules.seriesBasketedCount}</Text> typowanych • Min. dystans: {rules.minDistanceKm} km {rules.yearlingOnly ? '• Wyłącznie roczniaki (1-roczne)' : ''}
            </Text>
          </View>

          {/* Trophy Leader Card */}
          {summary.leaderTeam && (
            <View style={styles.leaderCard}>
              <View style={styles.leaderTop}>
                <View>
                  <Text style={styles.leaderBadge}>🏆 LIDER KLASYFIKACJI</Text>
                  <Text style={styles.leaderTeamName}>{summary.leaderTeam.teamName}</Text>
                  <Text style={styles.leaderBreeder}>{summary.leaderTeam.breederName} • {summary.leaderTeam.sectionName}</Text>
                </View>
                <View style={styles.leaderPtsBox}>
                  <Text style={styles.leaderPtsBig}>{summary.leaderTeam.totalPoints.toFixed(2)}</Text>
                  <Text style={styles.leaderPtsLabel}>punktów razem</Text>
                </View>
              </View>
              <View style={styles.leaderMetricsRow}>
                <Text style={styles.leaderMetricText}>Konkursy: <Text style={styles.boldWhite}>{summary.leaderTeam.totalPrizes}</Text></Text>
                <Text style={styles.leaderMetricText}>KKM: <Text style={styles.boldWhite}>{summary.leaderTeam.totalConcourseKm.toFixed(1)} km</Text></Text>
                <Text style={styles.leaderMetricText}>Coeff: <Text style={styles.boldGreen}>{summary.leaderTeam.sumCoefficient.toFixed(3)}</Text></Text>
              </View>
            </View>
          )}

          {/* Standings Table Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tabela Wyników Sezonu {summary.seasonYear}:</Text>

            {summary.standings.map((s) => {
              let rankBadge = `${s.rank}.`;
              let rankColor = '#9CA3AF';
              if (s.rank === 1) { rankBadge = '🥇'; rankColor = '#EAB308'; }
              else if (s.rank === 2) { rankBadge = '🥈'; rankColor = '#94A3B8'; }
              else if (s.rank === 3) { rankBadge = '🥉'; rankColor = '#B45309'; }

              return (
                <View key={s.teamId} style={styles.standingItem}>
                  <View style={styles.rankCol}>
                    <Text style={[styles.rankText, { color: rankColor }]}>{rankBadge}</Text>
                  </View>
                  <View style={styles.teamCol}>
                    <Text style={styles.teamName}>{s.teamName}</Text>
                    <Text style={styles.teamMeta}>{s.breederName} • {s.sectionName}</Text>
                    <View style={styles.statsInline}>
                      <Text style={styles.inlineStat}>{s.totalPrizes} konk.</Text>
                      <Text style={styles.inlineStat}>• {s.totalConcourseKm.toFixed(0)} kkm</Text>
                      <Text style={styles.inlineStat}>• Coeff {s.sumCoefficient.toFixed(3)}</Text>
                    </View>
                  </View>
                  <View style={styles.ptsCol}>
                    <Text style={styles.ptsVal}>{s.totalPoints.toFixed(2)}</Text>
                    <Text style={styles.ptsSub}>pkt</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <FieldButton
              title="🖨️ Drukuj Tabelę Punktacji A4 (AirPrint)"
              onPress={handlePrintStandings}
              testID="btn-print-inter-team-standings"
              style={{ marginBottom: 10 }}
            />
            <FieldButton
              title="📄 Udostępnij Tabelę Wyników PDF"
              onPress={handleSharePdf}
              testID="btn-share-inter-team-pdf"
              variant="secondary"
              style={{ marginBottom: 10 }}
            />
            <FieldButton
              title="Zamknij"
              onPress={onClose}
              testID="btn-close-team-championship"
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
  rulesBanner: {
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 12,
  },
  rulesTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  rulesSub: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  boldWhite: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  boldGreen: {
    color: '#10B981',
    fontWeight: '700',
  },
  leaderCard: {
    backgroundColor: '#262215',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E5A93C',
    marginBottom: 14,
  },
  leaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  leaderBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: '#E5A93C',
    textTransform: 'uppercase',
  },
  leaderTeamName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F3F4F6',
    marginTop: 2,
  },
  leaderBreeder: {
    fontSize: 11,
    color: '#D1D5DB',
    marginTop: 2,
  },
  leaderPtsBox: {
    alignItems: 'flex-end',
  },
  leaderPtsBig: {
    fontSize: 22,
    fontWeight: '900',
    color: '#E5A93C',
  },
  leaderPtsLabel: {
    fontSize: 9,
    color: '#9CA3AF',
  },
  leaderMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#3F3518',
  },
  leaderMetricText: {
    fontSize: 11,
    color: '#D1D5DB',
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
  standingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
  },
  rankCol: {
    width: 32,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: '900',
  },
  teamCol: {
    flex: 1,
    paddingHorizontal: 8,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F3F4F6',
  },
  teamMeta: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 1,
  },
  statsInline: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  inlineStat: {
    fontSize: 10,
    color: '#60A5FA',
    fontWeight: '600',
  },
  ptsCol: {
    alignItems: 'flex-end',
    width: 70,
  },
  ptsVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  ptsSub: {
    fontSize: 9,
    color: '#9CA3AF',
  },
  actionSection: {
    marginTop: 8,
  },
});

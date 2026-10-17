/**
 * PIGEON-FLY — E-Księga Lotowa i Gablota Trofeów Modal (Z-061)
 * Cyfrowa ewidencja dokonań życiowych lotnika:
 * - Tab 1: Gablota Pucharów i Odznak (Trophy Cabinet)
 * - Tab 2: Kwalifikacje do Kategorii Olimpijskich FCI (A, B, C, M, Wyczyn)
 * - Tab 3: Rejestr wszystkich konkursów życiowych z bazy
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
import {
  calculatePigeonCareer,
  RacePrizeRecord,
} from '../domain/careerLedger';
import { Pigeon } from '../domain/types';

interface CareerLedgerModalProps {
  visible: boolean;
  onClose: () => void;
  pigeon?: Pigeon | null;
  pigeonRingNumber?: string;
  pigeonName?: string;
}

const DEMO_CAREER_PRIZES: RacePrizeRecord[] = [
  { id: 'cp1', year: 2024, raceDate: '2024-05-12', raceName: 'Świebodzin', raceDistanceKm: 165.5, basketedCount: 3200, concoursePosition: 1, fciCoefficient: 0.312, gmpPoints: 39.8, isFirstPrize: true, category: 'A' },
  { id: 'cp2', year: 2024, raceDate: '2024-05-26', raceName: 'Nowy Tomyśl', raceDistanceKm: 212.0, basketedCount: 3100, concoursePosition: 7, fciCoefficient: 2.258, gmpPoints: 38.9, category: 'A' },
  { id: 'cp3', year: 2024, raceDate: '2024-06-09', raceName: 'Magdeburg 1', raceDistanceKm: 345.2, basketedCount: 2800, concoursePosition: 14, fciCoefficient: 5.000, gmpPoints: 37.5, category: 'B' },
  { id: 'cp4', year: 2024, raceDate: '2024-06-23', raceName: 'Magdeburg 2', raceDistanceKm: 345.2, basketedCount: 2600, concoursePosition: 3, fciCoefficient: 1.154, gmpPoints: 39.4, category: 'B' },
  { id: 'cp5', year: 2024, raceDate: '2024-07-07', raceName: 'Braunschweig', raceDistanceKm: 420.0, basketedCount: 2200, concoursePosition: 22, fciCoefficient: 10.000, gmpPoints: 36.1, category: 'B' },
  { id: 'cp6', year: 2025, raceDate: '2025-05-18', raceName: 'Nowy Tomyśl', raceDistanceKm: 212.0, basketedCount: 3300, concoursePosition: 12, fciCoefficient: 3.636, gmpPoints: 38.2, category: 'A' },
  { id: 'cp7', year: 2025, raceDate: '2025-06-01', raceName: 'Magdeburg 1', raceDistanceKm: 345.2, basketedCount: 2900, concoursePosition: 8, fciCoefficient: 2.759, gmpPoints: 39.1, category: 'B' },
  { id: 'cp8', year: 2025, raceDate: '2025-06-20', raceName: 'Hannover', raceDistanceKm: 525.0, basketedCount: 2100, concoursePosition: 4, fciCoefficient: 1.905, gmpPoints: 39.6, category: 'C' },
  { id: 'cp9', year: 2025, raceDate: '2025-07-12', raceName: 'Bruksela Narodowy', raceDistanceKm: 742.0, basketedCount: 1800, concoursePosition: 2, fciCoefficient: 1.111, gmpPoints: 39.9, category: 'M' },
  { id: 'cp10', year: 2025, raceDate: '2025-07-26', raceName: 'Oostende Maraton', raceDistanceKm: 825.0, basketedCount: 1600, concoursePosition: 1, fciCoefficient: 0.625, gmpPoints: 40.0, isFirstPrize: true, category: 'M' },
];

export const CareerLedgerModal: React.FC<CareerLedgerModalProps> = ({
  visible,
  onClose,
  pigeon,
  pigeonRingNumber: explicitRing,
  pigeonName: explicitName,
}) => {
  const pigeonRingNumber = pigeon?.ringNumber || explicitRing || 'PL-0284-23-1402';
  const pigeonName = explicitName || (pigeon ? `${pigeon.ringNumber} (${pigeon.sex === 'cock' ? '1.0' : '0.1'})` : 'Błękitny As');
  const [activeTab, setActiveTab] = useState<'trophies' | 'olympic' | 'prizes'>('trophies');

  const career = calculatePigeonCareer(pigeonRingNumber, DEMO_CAREER_PRIZES, 12);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>🏆 E-Księga Lotowa i Trofea (Z-061)</Text>
              <Text style={styles.subTitle}>Dorobek życiowy, kkm, pucharowe odznaki i olimpiada FCI</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'trophies' && styles.tabBtnActive]}
              onPress={() => setActiveTab('trophies')}
            >
              <Text style={[styles.tabText, activeTab === 'trophies' && styles.tabTextActive]}>
                🏆 Gablota Trofeów
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'olympic' && styles.tabBtnActive]}
              onPress={() => setActiveTab('olympic')}
            >
              <Text style={[styles.tabText, activeTab === 'olympic' && styles.tabTextActive]}>
                🏛️ Kategorie FCI
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'prizes' && styles.tabBtnActive]}
              onPress={() => setActiveTab('prizes')}
            >
              <Text style={[styles.tabText, activeTab === 'prizes' && styles.tabTextActive]}>
                📋 Lista Konkursów
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {/* Hero Career Summary Card */}
            <View style={styles.heroCard}>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.heroSubLabel}>REKORD KARIERY SPORTOWEJ</Text>
                  <Text style={styles.heroRing}>{career.pigeonRing}</Text>
                  <Text style={styles.heroName}>{pigeonName}</Text>
                </View>
                <View style={styles.trophyCountBadge}>
                  <Text style={styles.trophyCountVal}>
                    {career.trophies.filter((t) => t.isUnlocked).length} / {career.trophies.length}
                  </Text>
                  <Text style={styles.trophyCountLabel}>Trofeów</Text>
                </View>
              </View>

              <View style={styles.kpiGrid}>
                <View style={styles.kpiItem}>
                  <Text style={styles.kpiVal}>{career.totalPrizesWon} / {career.totalRacesBasketed}</Text>
                  <Text style={styles.kpiLabel}>Konkursów (Wyd. {career.concourseEffectivenessPercent}%)</Text>
                </View>
                <View style={styles.kpiItem}>
                  <Text style={[styles.kpiVal, { color: '#38BDF8' }]}>{career.totalConcourseKilometers} km</Text>
                  <Text style={styles.kpiLabel}>Suma kkm w karierze</Text>
                </View>
                <View style={styles.kpiItem}>
                  <Text style={[styles.kpiVal, { color: '#FCD34D' }]}>{career.firstPrizeCount} x 1.</Text>
                  <Text style={styles.kpiLabel}>1. nagrody (Top 10: {career.topTenCount})</Text>
                </View>
                <View style={styles.kpiItem}>
                  <Text style={[styles.kpiVal, { color: '#34D399' }]}>{career.bestFciCoefficient.toFixed(3)}</Text>
                  <Text style={styles.kpiLabel}>Najlepszy Coeff FCI</Text>
                </View>
              </View>
            </View>

            {/* TAB 1: Gablota Trofeów */}
            {activeTab === 'trophies' && (
              <View>
                <View style={styles.card}>
                  <Text style={styles.cardHeader}>🏅 GABLOTA ZDOBYTYCH PUCHARÓW I ODZNAK</Text>
                  <Text style={styles.cardHint}>
                    Odznaki przyznawane automatycznie na podstawie oficjalnych list konkursowych PZHGP i FCI:
                  </Text>

                  <View style={styles.trophiesGrid}>
                    {career.trophies.map((tr) => (
                      <View
                        key={tr.id}
                        style={[
                          styles.trophyCard,
                          tr.isUnlocked ? styles.trophyUnlocked : styles.trophyLocked,
                        ]}
                      >
                        <Text style={styles.trophyIcon}>{tr.icon}</Text>
                        <Text
                          style={[
                            styles.trophyTitle,
                            { color: tr.isUnlocked ? '#F1F5F9' : '#64748B' },
                          ]}
                        >
                          {tr.title}
                        </Text>
                        <Text style={styles.trophyDesc}>{tr.description}</Text>
                        <View
                          style={[
                            styles.statusPill,
                            { backgroundColor: tr.isUnlocked ? '#065F46' : '#334155' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusPillText,
                              { color: tr.isUnlocked ? '#34D399' : '#94A3B8' },
                            ]}
                          >
                            {tr.isUnlocked ? '✓ ZDOBYTE' : '🔒 ZABLOKOWANE'}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* TAB 2: Kategorie Olimpijskie FCI */}
            {activeTab === 'olympic' && (
              <View>
                <View style={styles.card}>
                  <Text style={styles.cardHeader}>🏛️ KWALIFIKACJE OLIMPIJSKIE (REGULAMIN FCI)</Text>
                  <Text style={styles.cardHint}>
                    Zgodność z oficjalnymi normami Reprezentacji Polski na Wystawy Ogólnopolskie i Olimpiady FCI:
                  </Text>

                  {career.olympicQualifications.map((q) => (
                    <View
                      key={q.category}
                      style={[
                        styles.olympicItem,
                        q.isQualified && styles.olympicItemQualified,
                      ]}
                    >
                      <View style={styles.rowBetween}>
                        <Text style={styles.olympicCatTitle}>{q.categoryName}</Text>
                        <View
                          style={[
                            styles.olympicBadge,
                            { backgroundColor: q.isQualified ? '#10B981' : '#334155' },
                          ]}
                        >
                          <Text style={styles.olympicBadgeText}>
                            {q.isQualified ? '✓ KWALIFIKACJA' : 'W TRAKCIE'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.olympicMetricRow}>
                        <Text style={styles.olympicMetric}>
                          Konkursy: <Text style={{ fontWeight: 'bold', color: '#FFFFFF' }}>{q.earnedPrizes} / {q.requiredPrizes}</Text>
                        </Text>
                        <Text style={styles.olympicMetric}>
                          Kilometry: <Text style={{ fontWeight: 'bold', color: '#FFFFFF' }}>{q.earnedKkm} / {q.requiredMinKkm} kkm</Text>
                        </Text>
                        {q.totalCoefficient > 0 && (
                          <Text style={styles.olympicMetric}>
                            Coeff: <Text style={{ fontWeight: 'bold', color: '#38BDF8' }}>{q.totalCoefficient.toFixed(3)}</Text>
                          </Text>
                        )}
                      </View>
                      <Text style={styles.olympicNote}>{q.notes}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* TAB 3: Wszystkie Konkursy Życiowe */}
            {activeTab === 'prizes' && (
              <View>
                <View style={styles.card}>
                  <Text style={styles.cardHeader}>
                    📋 WSZYSTKIE ZDOBYTE KONKURSY ({DEMO_CAREER_PRIZES.length})
                  </Text>
                  {DEMO_CAREER_PRIZES.map((prize, idx) => (
                    <View key={prize.id} style={styles.prizeRow}>
                      <View style={styles.prizePositionBadge}>
                        <Text
                          style={[
                            styles.prizePosText,
                            prize.concoursePosition === 1 && { color: '#FCD34D', fontWeight: '900' },
                          ]}
                        >
                          {prize.concoursePosition}.
                        </Text>
                        <Text style={styles.prizePosSub}>lok.</Text>
                      </View>
                      <View style={{ flex: 1, paddingLeft: 8 }}>
                        <View style={styles.rowBetween}>
                          <Text style={styles.prizeName}>{prize.raceName}</Text>
                          <Text style={styles.prizeDate}>{prize.raceDate}</Text>
                        </View>
                        <Text style={styles.prizeMeta}>
                          {prize.raceDistanceKm} km • Koszowano: {prize.basketedCount} ptaków
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                          <Text style={styles.prizeCoeff}>Coeff: {prize.fciCoefficient.toFixed(3)}</Text>
                          {prize.gmpPoints && (
                            <Text style={styles.prizeGmp}>GMP: {prize.gmpPoints} pkt</Text>
                          )}
                          {prize.category && (
                            <Text style={styles.prizeCat}>Kat. {prize.category}</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Action Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeFooterBtn} onPress={onClose}>
              <Text style={styles.closeFooterBtnText}>ZAMKNIJ KSIĘGĘ LOTOWĄ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '92%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F1F5F9',
  },
  subTitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    padding: 6,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#D97706',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  heroCard: {
    backgroundColor: '#451A03',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D97706',
    padding: 16,
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroSubLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FCD34D',
    letterSpacing: 0.5,
  },
  heroRing: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  heroName: {
    fontSize: 12,
    color: '#FDE68A',
    marginTop: 2,
  },
  trophyCountBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  trophyCountVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FCD34D',
  },
  trophyCountLabel: {
    fontSize: 10,
    color: '#CBD5E1',
    fontWeight: 'bold',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  kpiItem: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 8,
    padding: 8,
  },
  kpiVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  kpiLabel: {
    fontSize: 10,
    color: '#FDE68A',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#93C5FD',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cardHint: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 12,
    lineHeight: 16,
  },
  trophiesGrid: {
    gap: 8,
  },
  trophyCard: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  trophyUnlocked: {
    borderColor: '#F59E0B',
    backgroundColor: '#1A1813',
  },
  trophyLocked: {
    opacity: 0.6,
  },
  trophyIcon: {
    fontSize: 26,
    marginBottom: 4,
  },
  trophyTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  trophyDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 16,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  olympicItem: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  olympicItemQualified: {
    borderColor: '#10B981',
    backgroundColor: '#0A1E17',
  },
  olympicCatTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  olympicBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  olympicBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  olympicMetricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  olympicMetric: {
    fontSize: 11,
    color: '#94A3B8',
  },
  olympicNote: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  prizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  prizePositionBadge: {
    width: 38,
    alignItems: 'center',
  },
  prizePosText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  prizePosSub: {
    fontSize: 9,
    color: '#64748B',
  },
  prizeName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#F1F5F9',
  },
  prizeDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  prizeMeta: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  prizeCoeff: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#34D399',
  },
  prizeGmp: {
    fontSize: 10,
    color: '#FCD34D',
  },
  prizeCat: {
    fontSize: 10,
    color: '#38BDF8',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  closeFooterBtn: {
    backgroundColor: '#D97706',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56, // Field Mode compliant
  },
  closeFooterBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});

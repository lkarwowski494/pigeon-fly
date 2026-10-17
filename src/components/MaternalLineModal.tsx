/**
 * PIGEON-FLY — Moduł Analizy Linii Matecznych i mtDNA Modal (Z-060)
 * Genetyka mitochondrialna i selekcja linii żeńskich:
 * - Wizualizacja nieprzerwanej dynastii matek (Matka Założycielka -> Babka -> Matka)
 * - Wskaźnik integralności mtDNA i ocena potencjału tlenowego OXPHOS
 * - Status transmisji mtDNA (Samice 0.1 przekazują 100%, Samce 1.0 nie przekazują)
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
import {
  analyzeMaternalLineage,
  PigeonPedigreeLite,
  AerobicOxphosRating,
} from '../domain/maternalLine';

interface MaternalLineModalProps {
  visible: boolean;
  onClose: () => void;
  selectedPigeonRing?: string;
}

const DEMO_PEDIGREE_DB: Record<string, PigeonPedigreeLite> = {
  'PL-0284-23-1402': {
    ringNumber: 'PL-0284-23-1402',
    name: 'Błękitna Asica',
    sex: 'hen',
    color: 'NIEB',
    year: 2023,
    motherRingNumber: 'PL-0284-20-805',
    raceAchievements: ['3x 1. Konkurs Oddziałowy', 'Coeff FCI 4.120'],
  },
  'PL-0284-20-805': {
    ringNumber: 'PL-0284-20-805',
    name: 'Złota Samica Rozpłodowa',
    sex: 'hen',
    color: 'N.NAKR',
    year: 2020,
    motherRingNumber: 'BELG-2016-41029',
    raceAchievements: ['1. As Okręgu Kat. A', 'Matka 4 wybitnych asów'],
  },
  'BELG-2016-41029': {
    ringNumber: 'BELG-2016-41029',
    name: 'Córka Olimpijki',
    sex: 'hen',
    color: 'CIEM',
    year: 2016,
    motherRingNumber: 'NL-2012-990412',
    raceAchievements: ['2. Nagroda Narodowa Bourges (480 km)'],
  },
  'NL-2012-990412': {
    ringNumber: 'NL-2012-990412',
    name: 'Matka Założycielka Dynastii',
    sex: 'hen',
    color: 'NIEB',
    year: 2012,
    raceAchievements: ['Złoty Medal Wystawy Ogólnopolskiej Kat. Sport', 'Olimpiada FCI Kat. B'],
  },
};

export const MaternalLineModal: React.FC<MaternalLineModalProps> = ({
  visible,
  onClose,
  selectedPigeonRing = 'PL-0284-23-1402',
}) => {
  const [activeTab, setActiveTab] = useState<'tree' | 'biology' | 'breeding'>('tree');

  const currentPigeon: PigeonPedigreeLite =
    DEMO_PEDIGREE_DB[selectedPigeonRing] || {
      ringNumber: selectedPigeonRing,
      sex: 'hen',
      color: 'NIEB',
      year: 2023,
      motherRingNumber: 'PL-0284-20-805',
    };

  const analysis = analyzeMaternalLineage(
    currentPigeon,
    (ring) => DEMO_PEDIGREE_DB[ring],
    6
  );

  const getRatingBadge = (rating: AerobicOxphosRating) => {
    switch (rating) {
      case 'world_class':
        return { label: 'KLASA ŚWIATOWA (WORLD-CLASS)', color: '#10B981', bg: '#064E3B' };
      case 'elite':
        return { label: 'ELITARNY SILNIK TLENOWY', color: '#38BDF8', bg: '#0C4A6E' };
      case 'proven':
        return { label: 'SPRAWDZONA LINIA MATCZYNA', color: '#FCD34D', bg: '#451A03' };
      case 'promising':
        return { label: 'OBIECUJĄCA LINIA', color: '#F97316', bg: '#431407' };
      default:
        return { label: 'NIEZWERYFIKOWANA', color: '#94A3B8', bg: '#1E293B' };
    }
  };

  const ratingBadge = getRatingBadge(analysis.aerobicCapacityRating);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>🧬 Analiza Linii Matecznych i mtDNA (Z-060)</Text>
              <Text style={styles.subTitle}>Dziedziczenie mitochondrialne, silnik tlenowy i dynastia matek</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'tree' && styles.tabBtnActive]}
              onPress={() => setActiveTab('tree')}
            >
              <Text style={[styles.tabText, activeTab === 'tree' && styles.tabTextActive]}>
                🧬 Drzewo Żeńskie
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'biology' && styles.tabBtnActive]}
              onPress={() => setActiveTab('biology')}
            >
              <Text style={[styles.tabText, activeTab === 'biology' && styles.tabTextActive]}>
                ⚡ Biologia OXPHOS
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'breeding' && styles.tabBtnActive]}
              onPress={() => setActiveTab('breeding')}
            >
              <Text style={[styles.tabText, activeTab === 'breeding' && styles.tabTextActive]}>
                💡 Selekcja i Kojarzenia
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {/* Hero Card: mtDNA Score & Transmission Notice */}
            <View style={styles.heroCard}>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.heroSubLabel}>PTAK ANALIZOWANY</Text>
                  <Text style={styles.heroRing}>{analysis.targetRingNumber}</Text>
                  <Text style={styles.heroName}>{currentPigeon.name || 'Bez nazwy własnej'}</Text>
                </View>
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreVal}>{analysis.mitochondrialIntegrityScore}</Text>
                  <Text style={styles.scoreMax}>/ 100 pkt</Text>
                  <Text style={styles.scoreLabel}>mtDNA Score</Text>
                </View>
              </View>

              <View style={[styles.ratingPill, { backgroundColor: ratingBadge.bg, borderColor: ratingBadge.color }]}>
                <Text style={[styles.ratingPillText, { color: ratingBadge.color }]}>
                  ★ {ratingBadge.label}
                </Text>
              </View>

              <View
                style={[
                  styles.transmissionCard,
                  { borderColor: analysis.canTransmitMtDna ? '#10B981' : '#F59E0B' },
                ]}
              >
                <Text
                  style={[
                    styles.transmissionText,
                    { color: analysis.canTransmitMtDna ? '#A7F3D0' : '#FDE68A' },
                  ]}
                >
                  {analysis.transmissionNotice}
                </Text>
              </View>
            </View>

            {/* TAB 1: Drzewo Linii Żeńskiej */}
            {activeTab === 'tree' && (
              <View>
                {/* Foundation Hen Highlight */}
                {analysis.foundationHen && (
                  <View style={styles.foundationCard}>
                    <Text style={styles.foundationLabel}>👑 MATKA ZAŁOŻYCIELKA DYNASTII (FOUNDATION HEN)</Text>
                    <Text style={styles.foundationTitle}>
                      {analysis.foundationHen.ringNumber} — {analysis.foundationHen.name || 'Założycielka Linii'}
                    </Text>
                    <Text style={styles.foundationSub}>
                      Rocznik: {analysis.foundationHen.year} • Barwa: {analysis.foundationHen.color}
                    </Text>
                    {analysis.foundationHen.raceAchievements.length > 0 && (
                      <View style={styles.achievementsRow}>
                        {analysis.foundationHen.raceAchievements.map((ach, idx) => (
                          <View key={idx} style={styles.achPill}>
                            <Text style={styles.achPillText}>🏆 {ach}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* Direct Ancestors Chain */}
                <View style={styles.card}>
                  <Text style={styles.cardHeader}>
                    👩‍👧‍👧 NIEPRZERWANY ŁAŃCUCH MATEK ({analysis.depthGenerations} POKOLENIA)
                  </Text>
                  <Text style={styles.cardHint}>
                    Mitochondria w komórkach tego gołębia są w 100% identyczne z mitochondriami poniższych samic (brak rekombinacji genetycznej):
                  </Text>

                  {analysis.ancestors.map((anc, idx) => (
                    <View key={anc.ringNumber} style={styles.ancestorItem}>
                      <View style={styles.genCircle}>
                        <Text style={styles.genCircleText}>{anc.generation}</Text>
                      </View>
                      <View style={{ flex: 1, paddingLeft: 10 }}>
                        <View style={styles.rowBetween}>
                          <Text style={styles.relationshipText}>{anc.relationshipTitle}</Text>
                          {anc.isFoundationHen && (
                            <View style={styles.crownBadge}>
                              <Text style={styles.crownBadgeText}>👑 ZAŁOŻYCIELKA</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.ancestorRing}>{anc.ringNumber}</Text>
                        <Text style={styles.ancestorName}>{anc.name || 'Brak nazwy własnej'}</Text>
                        <Text style={styles.ancestorMeta}>
                          Rocznik: {anc.year || '---'} • Barwa: {anc.color}
                        </Text>
                        {anc.raceAchievements.length > 0 && (
                          <View style={{ marginTop: 4 }}>
                            {anc.raceAchievements.map((a, aIdx) => (
                              <Text key={aIdx} style={styles.achievementLine}>• {a}</Text>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* TAB 2: Biologia OXPHOS & Mitochondria */}
            {activeTab === 'biology' && (
              <View>
                <View style={styles.card}>
                  <Text style={styles.cardHeader}>🔬 CZYM JEST mtDNA W SPORCIE GOŁĘBI?</Text>
                  <Text style={styles.bioParagraph}>
                    Mitochondria są organellami komórkowymi odpowiedzialnymi za produkcję ponad <Text style={{ fontWeight: 'bold', color: '#38BDF8' }}>90% energii ATP</Text> w procesie fosforylacji oksydacyjnej (OXPHOS).
                  </Text>
                  <Text style={styles.bioParagraph}>
                    Podczas wielogodzinnego lotu maratońskiego mięśnie piersiowe (pectoralis major) spalają kwasy tłuszczowe wyłącznie w obecności tlenu w mitochondriach.
                  </Text>
                  <Text style={styles.bioParagraph}>
                    W przeciwieństwie do DNA jądrowego (gdzie połowa genów pochodzi od ojca, a połowa od matki i ulega losowemu przetasowaniu podczas mejozy), <Text style={{ fontWeight: 'bold', color: '#10B981' }}>mtDNA nie ulega rekombinacji</Text>.
                  </Text>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardHeader}>⚖️ ZASADY DZIEDZICZENIA PŁCI U PTAKÓW</Text>
                  <View style={styles.genderRow}>
                    <Text style={styles.genderTitle}>Samica (0.1) — ZW:</Text>
                    <Text style={styles.genderDesc}>
                      Przekazuje swoje mitochondria (mtDNA) <Text style={{ fontWeight: 'bold' }}>100% potomstwa</Text>. Każdy jej syn i każda jej córka otrzyma dokładnie jej silnik komórkowy.
                    </Text>
                  </View>
                  <View style={[styles.genderRow, { marginTop: 10 }]}>
                    <Text style={styles.genderTitle}>Samiec (1.0) — ZZ:</Text>
                    <Text style={styles.genderDesc}>
                      Działa na mitochondriach swojej matki (wybitna wydolność w locie), lecz <Text style={{ fontWeight: 'bold' }}>nie przekazuje ich dalej</Text> — plemniki nie wnoszą mitochondriów do żółtka jaja.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* TAB 3: Selekcja i Kojarzenia */}
            {activeTab === 'breeding' && (
              <View>
                <View style={styles.card}>
                  <Text style={styles.cardHeader}>💡 WSKAZÓWKI HODOWLANE DLA TEJ LINII</Text>
                  {analysis.breederGuidance.map((g, idx) => (
                    <View key={idx} style={styles.guidanceRow}>
                      <Text style={styles.guidanceBullet}>✓</Text>
                      <Text style={styles.guidanceText}>{g}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardHeader}>🏆 POTENCJAŁ SPORTOWY DYNASTII</Text>
                  <Text style={styles.cardHint}>{analysis.biologicalSummary}</Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Text style={styles.statVal}>{analysis.depthGenerations}</Text>
                      <Text style={styles.statLabel}>Pokoleń w linii</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statVal, { color: '#10B981' }]}>{analysis.championAncestorCount}</Text>
                      <Text style={styles.statLabel}>Wybitnych matek</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statVal, { color: '#38BDF8' }]}>100%</Text>
                      <Text style={styles.statLabel}>Zgodność mtDNA</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Action Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeFooterBtn} onPress={onClose}>
              <Text style={styles.closeFooterBtnText}>ZAMKNIJ ANALIZATOR mtDNA</Text>
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
    backgroundColor: '#7C3AED',
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
    backgroundColor: '#1E1B4B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#7C3AED',
    padding: 16,
    marginBottom: 12,
  },
  heroSubLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#C4B5FD',
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
    color: '#DDD6FE',
    marginTop: 2,
  },
  scoreBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scoreVal: {
    fontSize: 26,
    fontWeight: '900',
    color: '#34D399',
  },
  scoreMax: {
    fontSize: 10,
    color: '#94A3B8',
  },
  scoreLabel: {
    fontSize: 9,
    color: '#CBD5E1',
    fontWeight: 'bold',
    marginTop: 2,
  },
  ratingPill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    marginTop: 12,
  },
  ratingPillText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  transmissionCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderLeftWidth: 3,
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  transmissionText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  foundationCard: {
    backgroundColor: '#312E81',
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  foundationLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FCD34D',
    letterSpacing: 0.5,
  },
  foundationTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  foundationSub: {
    fontSize: 11,
    color: '#C7D2FE',
    marginTop: 2,
  },
  achievementsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  achPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  achPillText: {
    fontSize: 10,
    color: '#FDE68A',
    fontWeight: '600',
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
    marginBottom: 10,
    lineHeight: 16,
  },
  ancestorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  genCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  genCircleText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  relationshipText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#A78BFA',
  },
  crownBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  crownBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0F172A',
  },
  ancestorRing: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  ancestorName: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  ancestorMeta: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  achievementLine: {
    fontSize: 10,
    color: '#FCD34D',
    lineHeight: 14,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bioParagraph: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 8,
  },
  genderRow: {
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 8,
  },
  genderTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F1F5F9',
  },
  genderDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 3,
    lineHeight: 16,
  },
  guidanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 4,
  },
  guidanceBullet: {
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: 13,
  },
  guidanceText: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 3,
  },
  statVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
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
    backgroundColor: '#7C3AED',
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

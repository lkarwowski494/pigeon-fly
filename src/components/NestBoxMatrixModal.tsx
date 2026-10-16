/**
 * PIGEON-FLY — NestBoxMatrixModal (BR-ROZP-001)
 * Interactive 2D breeding loft grid visualizer with real-time lifecycle states,
 * egg swapping protocols (podmiana na jajka gipsowe), and squab banding countdowns.
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
  NestBoxItem,
  NestBoxState,
  evaluateNestBoxState,
  checkBandingUrgency,
  simulateEggSwapProtocol,
  calculateFlockBreedingSummary,
} from '../domain/nestBoxMatrix';
import { FieldButton } from './FieldButton';

export interface NestBoxMatrixModalProps {
  visible: boolean;
  onClose: () => void;
  boxes?: NestBoxItem[];
}

const DEFAULT_DEMO_BOXES: NestBoxItem[] = [
  {
    id: 'b-01',
    section: 'Sektor Rozpłód',
    boxNumber: 'A-01',
    state: 'sitting',
    cockRingNumber: 'PL-0284-23-1402',
    henRingNumber: 'PL-0284-22-9854',
    pairedDate: '2026-03-01',
    egg1Date: '2026-03-10',
    egg2Date: '2026-03-12',
    egg1Status: 'fertile',
    egg2Status: 'fertile',
    inbreedingF: 0.0,
  },
  {
    id: 'b-02',
    section: 'Sektor Rozpłód',
    boxNumber: 'A-02',
    state: 'banding_alert',
    cockRingNumber: 'DV-01234-24-512',
    henRingNumber: 'PL-0284-24-4401',
    pairedDate: '2026-02-15',
    egg1Date: '2026-02-24',
    egg2Date: '2026-02-26',
    egg1Status: 'fertile',
    egg2Status: 'fertile',
    hatchDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    chick1Banded: false,
    chick2Banded: false,
    inbreedingF: 3.12,
  },
  {
    id: 'b-03',
    section: 'Sektor Rozpłód',
    boxNumber: 'A-03',
    state: 'pairing',
    cockRingNumber: 'PL-0284-21-3004',
    henRingNumber: 'NL-22-8119022',
    pairedDate: '2026-03-14',
    inbreedingF: 0.0,
  },
  {
    id: 'b-04',
    section: 'Sektor Rozpłód',
    boxNumber: 'A-04',
    state: 'rearing',
    cockRingNumber: 'BE-20-4100912',
    henRingNumber: 'PL-0284-23-6611',
    hatchDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    chick1RingNumber: 'PL-0284-26-101',
    chick2RingNumber: 'PL-0284-26-102',
    chick1Banded: true,
    chick2Banded: true,
  },
  {
    id: 'b-05',
    section: 'Sektor Rozpłód',
    boxNumber: 'A-05',
    state: 'empty',
  },
  {
    id: 'b-06',
    section: 'Sektor Rozpłód',
    boxNumber: 'A-06',
    state: 'empty',
  },
  {
    id: 'b-07',
    section: 'Sektor Rozpłód',
    boxNumber: 'B-01',
    state: 'sitting',
    cockRingNumber: 'PL-0284-22-5501',
    henRingNumber: 'PL-0284-23-7712',
    egg1Date: '2026-03-12',
    egg1Status: 'laid',
  },
  {
    id: 'b-08',
    section: 'Sektor Rozpłód',
    boxNumber: 'B-02',
    state: 'empty',
  },
  {
    id: 'b-09',
    section: 'Sektor Rozpłód',
    boxNumber: 'B-03',
    state: 'quarantine',
    notes: 'Dezynfekcja palnikiem gazowym przed lęgiem II',
  },
];

export function NestBoxMatrixModal({ visible, onClose, boxes }: NestBoxMatrixModalProps) {
  const [boxList, setBoxList] = useState<NestBoxItem[]>(boxes || DEFAULT_DEMO_BOXES);
  const [selectedBox, setSelectedBox] = useState<NestBoxItem>(boxList[1]); // Default to banding alert for instant impact

  const summary = calculateFlockBreedingSummary(boxList);

  const stateColors: Record<NestBoxState, { bg: string; border: string; text: string; icon: string }> = {
    empty: { bg: '#15171C', border: '#2F343F', text: '#8E94A0', icon: '📭 Pusta' },
    pairing: { bg: '#1E2838', border: '#2196F3', text: '#64B5F6', icon: '💑 Złączona' },
    sitting: { bg: '#2A2417', border: '#E5A93C', text: '#FFD54F', icon: '🥚 Wysiadywanie' },
    rearing: { bg: '#1A2E1E', border: '#4CAF50', text: '#81C784', icon: '🐣 Odchów' },
    banding_alert: { bg: '#3E1B1B', border: '#E53935', text: '#EF5350', icon: '⚠️ OBRĄCZKUJ!' },
    quarantine: { bg: '#281B28', border: '#9C27B0', text: '#BA68C8', icon: '⛔ Kwarantanna' },
  };

  const handleSelectBox = (box: NestBoxItem) => {
    setSelectedBox(box);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const handleSimulateBanding = () => {
    if (!selectedBox) return;
    const updated = boxList.map((b) =>
      b.id === selectedBox.id
        ? {
            ...b,
            state: 'rearing' as NestBoxState,
            chick1Banded: true,
            chick2Banded: true,
            chick1RingNumber: 'PL-0284-26-105',
            chick2RingNumber: 'PL-0284-26-106',
          }
        : b
    );
    setBoxList(updated);
    setSelectedBox(updated.find((b) => b.id === selectedBox.id)!);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    Alert.alert(
      'Zaobrączkowano Pisklęta!',
      `Cela ${selectedBox.boxNumber}: Przypisano obrączki rodowe PL-0284-26-105 i PL-0284-26-106 z mikronaklejkami QR.`
    );
  };

  const eggSwapAdvice = selectedBox
    ? simulateEggSwapProtocol(selectedBox.egg1Date, selectedBox.egg2Date)
    : null;

  const bandingUrgency = selectedBox?.hatchDate
    ? checkBandingUrgency(selectedBox.hatchDate)
    : null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>WIRTUALNY ZARZĄDCA CEL LĘGOWYCH</Text>
                <Text style={styles.subtitle}>Nest Box Matrix • Sektor Rozpłodowy 2026</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="btn-close-matrix">
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Loft Breeding Summary Stats */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryStatsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statVal}>{summary.occupiedBoxes}/{summary.totalBoxes}</Text>
                  <Text style={styles.statLbl}>Zajęte cele</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statVal}>{summary.activePairs}</Text>
                  <Text style={styles.statLbl}>Aktywne pary</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statVal}>{summary.totalEggsLaid}</Text>
                  <Text style={styles.statLbl}>Jaj złożonych</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={[styles.statVal, { color: summary.urgentBandingAlertsCount > 0 ? '#E53935' : '#4CAF50' }]}>
                    {summary.urgentBandingAlertsCount}
                  </Text>
                  <Text style={styles.statLbl}>Alarmy obrącz.</Text>
                </View>
              </View>
            </View>

            {/* 2D Nest Box Grid (Matrix) */}
            <Text style={styles.sectionHeading}>SCHEMAT KLATKOWY CEL (DOTKNIJ CELĘ)</Text>
            <View style={styles.gridContainer}>
              {boxList.map((box) => {
                const isSelected = selectedBox?.id === box.id;
                const colors = stateColors[box.state];

                return (
                  <TouchableOpacity
                    key={box.id}
                    onPress={() => handleSelectBox(box)}
                    style={[
                      styles.gridBox,
                      {
                        backgroundColor: colors.bg,
                        borderColor: isSelected ? '#FFFFFF' : colors.border,
                        borderWidth: isSelected ? 2.5 : 1,
                      },
                    ]}
                    testID={`box-${box.boxNumber}`}
                  >
                    <View style={styles.boxHeader}>
                      <Text style={[styles.boxNumber, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                        {box.boxNumber}
                      </Text>
                      {box.state === 'banding_alert' && (
                        <Text style={styles.alertBlink}>⚠️</Text>
                      )}
                    </View>
                    <Text style={styles.boxIconState}>{colors.icon}</Text>
                    {box.cockRingNumber ? (
                      <Text style={styles.boxPigeonMini} numberOfLines={1}>
                        ♂ {box.cockRingNumber.slice(-4)}
                      </Text>
                    ) : (
                      <Text style={styles.boxEmptyText}>Pusta</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selected Box Inspector Card */}
            {selectedBox && (
              <View style={styles.inspectorCard}>
                <View style={styles.inspectorHeader}>
                  <View>
                    <Text style={styles.inspectorTitle}>
                      CELA {selectedBox.boxNumber} ({selectedBox.section})
                    </Text>
                    <View style={[styles.badge, { backgroundColor: stateColors[selectedBox.state].bg, borderColor: stateColors[selectedBox.state].border }]}>
                      <Text style={[styles.badgeText, { color: stateColors[selectedBox.state].text }]}>
                        {stateColors[selectedBox.state].icon}
                      </Text>
                    </View>
                  </View>
                  {selectedBox.state === 'banding_alert' && (
                    <FieldButton
                      title="🏷️ Zaobrączkuj Teraz!"
                      onPress={handleSimulateBanding}
                      variant="primary"
                      style={styles.bandingActionBtn}
                      testID="btn-band-chicks-now"
                    />
                  )}
                </View>

                {/* Occupants Info */}
                {selectedBox.cockRingNumber ? (
                  <View style={styles.occupantsBox}>
                    <View style={styles.occupantRow}>
                      <Text style={styles.occupantLabel}>♂ Samiec:</Text>
                      <Text style={styles.occupantRing}>{selectedBox.cockRingNumber}</Text>
                    </View>
                    <View style={styles.occupantRow}>
                      <Text style={styles.occupantLabel}>♀ Samica:</Text>
                      <Text style={styles.occupantRing}>{selectedBox.henRingNumber || 'Brak'}</Text>
                    </View>
                    {selectedBox.inbreedingF !== undefined && (
                      <View style={styles.occupantRow}>
                        <Text style={styles.occupantLabel}>Inbred Wrighta (F):</Text>
                        <Text style={[styles.occupantRing, { color: selectedBox.inbreedingF > 10 ? '#E53935' : '#81C784' }]}>
                          {selectedBox.inbreedingF.toFixed(2)}%
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <Text style={styles.noOccupantsText}>
                    Ta cela jest pusta i zdezynfekowana. Gotowa na zestawienie nowej pary lęgowej.
                  </Text>
                )}

                {/* Egg Swapping & Biological Recommendation */}
                {eggSwapAdvice && (
                  <View style={styles.adviceBox}>
                    <Text style={styles.adviceHeading}>🥚 ASYSTENT PODMIANY NA JAJA GIPSOWE</Text>
                    <Text style={styles.adviceContent}>{eggSwapAdvice.recommendation}</Text>
                  </View>
                )}

                {/* Banding Urgency Banner */}
                {bandingUrgency && (
                  <View style={[styles.urgencyBox, { borderColor: bandingUrgency.isUrgent ? '#E53935' : '#2F343F' }]}>
                    <Text style={[styles.urgencyHeading, { color: bandingUrgency.isUrgent ? '#EF5350' : '#8E94A0' }]}>
                      CHRONOMETRAŻ OBRĄCZKOWANIA RODOWEGO (8.0 mm)
                    </Text>
                    <Text style={styles.urgencyContent}>{bandingUrgency.statusText}</Text>
                  </View>
                )}
              </View>
            )}

            <FieldButton
              title="Zamknij Schemat Cel"
              onPress={onClose}
              variant="secondary"
              style={{ marginTop: 14 }}
              testID="btn-close-matrix-bottom"
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
    fontSize: 11,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
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
  summaryCard: {
    backgroundColor: '#15171C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
    padding: 12,
    marginBottom: 14,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  statLbl: {
    fontSize: 10,
    color: '#8E94A0',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E94A0',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  gridBox: {
    width: '31%',
    borderRadius: 10,
    padding: 8,
    minHeight: 74,
    justifyContent: 'space-between',
  },
  boxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boxNumber: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  alertBlink: {
    fontSize: 12,
  },
  boxIconState: {
    fontSize: 10,
    color: '#D4D8E0',
    fontWeight: '600',
  },
  boxPigeonMini: {
    fontSize: 10,
    color: '#A0A6B2',
    fontFamily: 'monospace',
  },
  boxEmptyText: {
    fontSize: 10,
    color: '#555C6A',
    fontStyle: 'italic',
  },
  inspectorCard: {
    backgroundColor: '#15171C',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    padding: 14,
    marginBottom: 14,
  },
  inspectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  inspectorTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  bandingActionBtn: {
    minHeight: 36,
    paddingHorizontal: 10,
  },
  occupantsBox: {
    backgroundColor: '#1E2127',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  occupantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  occupantLabel: {
    fontSize: 12,
    color: '#8E94A0',
  },
  occupantRing: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  noOccupantsText: {
    fontSize: 12,
    color: '#8E94A0',
    lineHeight: 18,
    marginBottom: 10,
  },
  adviceBox: {
    backgroundColor: '#2A2417',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5A93C',
    padding: 10,
    marginBottom: 10,
  },
  adviceHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E5A93C',
    marginBottom: 4,
  },
  adviceContent: {
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 17,
  },
  urgencyBox: {
    backgroundColor: '#1E2127',
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  urgencyHeading: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
  urgencyContent: {
    fontSize: 12,
    color: '#D4D8E0',
    lineHeight: 17,
  },
});

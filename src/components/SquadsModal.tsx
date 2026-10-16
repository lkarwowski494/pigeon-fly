/**
 * PIGEON-FLY — SquadsModal (BR-STADO-006, Z-018)
 * Tactical Racing Squads & Team Management.
 * Manages squad assignments, capacity limits (GMP 5/50),
 * flock demographics, readiness scores, and average Coeff.
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
  RacingSquad,
  SquadAnalysis,
  getDefaultSquadPresets,
  analyzeSquad,
  assignPigeonToSquad,
  removePigeonFromSquad,
} from '../domain/squads';
import { Pigeon } from '../domain/types';
import { FieldButton } from './FieldButton';

export interface SquadsModalProps {
  visible: boolean;
  onClose: () => void;
  pigeons: Pigeon[];
  initialSquads?: RacingSquad[];
  onSaveSquads?: (squads: RacingSquad[]) => void;
}

export function SquadsModal({
  visible,
  onClose,
  pigeons,
  initialSquads,
  onSaveSquads,
}: SquadsModalProps) {
  const [squads, setSquads] = useState<RacingSquad[]>(() => {
    if (initialSquads && initialSquads.length > 0) return initialSquads;
    const presets = getDefaultSquadPresets('loft-01');
    // Pre-populate demo assignments
    const racingBirds = pigeons.filter((p) => p.status === 'racing');
    const adults = racingBirds.filter((p) => p.year < 2026);
    const youngsters = racingBirds.filter((p) => p.year === 2026);

    presets[0].assignedPigeonIds = adults.slice(0, 15).map((p) => p.id);
    presets[1].assignedPigeonIds = adults.slice(15, 25).map((p) => p.id);
    presets[3].assignedPigeonIds = youngsters.slice(0, 20).map((p) => p.id);
    return presets;
  });

  const [selectedSquadId, setSelectedSquadId] = useState<string>(squads[0].id);

  const selectedSquad = squads.find((s) => s.id === selectedSquadId) || squads[0];

  // Mock performance stats for demo analysis
  const mockPerformances: Record<string, any> = {};
  pigeons.forEach((p, idx) => {
    mockPerformances[p.id] = {
      prizesCount: (idx % 6) + 2,
      concourseKm: ((idx % 6) + 2) * 340,
      averageCoeff: 3.5 + (idx % 12) * 0.8,
      isFit: idx % 7 !== 0,
    };
  });

  const analysis: SquadAnalysis = analyzeSquad({
    squad: selectedSquad,
    pigeons,
    performances: mockPerformances,
  });

  const assignedPigeons = pigeons.filter((p) => selectedSquad.assignedPigeonIds.includes(p.id));

  // Eligible pigeons to add (not yet in this squad)
  const availablePigeonsToAdd = pigeons.filter(
    (p) => p.status === 'racing' && !selectedSquad.assignedPigeonIds.includes(p.id)
  );

  const handleSelectSquad = (squadId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSelectedSquadId(squadId);
  };

  const handleAddPigeon = (pigeon: Pigeon) => {
    try {
      const updated = assignPigeonToSquad({
        squads,
        pigeonId: pigeon.id,
        targetSquadId: selectedSquad.id,
        pigeon,
      });
      setSquads(updated);
      onSaveSquads?.(updated);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      Alert.alert(
        'Dodano do drużyny',
        `Gołąb ${pigeon.ringNumber} został przypisany do "${selectedSquad.name}".`
      );
    } catch (err: any) {
      Alert.alert('Błąd przypisania', err.message);
    }
  };

  const handleRemovePigeon = (pigeon: Pigeon) => {
    Alert.alert(
      'Usunąć z drużyny?',
      `Czy chcesz usunąć gołębia ${pigeon.ringNumber} ze składu "${selectedSquad.name}"?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: () => {
            const updated = removePigeonFromSquad({
              squads,
              pigeonId: pigeon.id,
              squadId: selectedSquad.id,
            });
            setSquads(updated);
            onSaveSquads?.(updated);
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } catch {}
          },
        },
      ]
    );
  };

  const handleOpenAddPicker = () => {
    if (availablePigeonsToAdd.length === 0) {
      Alert.alert('Brak ptaków', 'Wszystkie dostępne gołębie lotowe są już przypisane do tej drużyny.');
      return;
    }

    const options = availablePigeonsToAdd.slice(0, 6).map((p) => ({
      text: `${p.ringNumber} (${p.sex === 'cock' ? '♂' : '♀'} '${String(p.year).slice(-2)})`,
      onPress: () => handleAddPigeon(p),
    }));

    Alert.alert(
      `Dodaj do: ${selectedSquad.name}`,
      `Wybierz ptaka do składu (Dostępnych: ${availablePigeonsToAdd.length}):`,
      [...options, { text: 'Anuluj', style: 'cancel' }]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.screenTag}>BR-STADO-006 • Z-018</Text>
            <Text style={styles.title}>Drużyny Lotowe & Składy</Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityLabel="Zamknij okno drużyn"
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Squad Selection Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.squadsScroll}>
          {squads.map((sq) => {
            const isSelected = sq.id === selectedSquadId;
            return (
              <TouchableOpacity
                key={sq.id}
                style={[
                  styles.squadTab,
                  isSelected && { borderColor: sq.color, backgroundColor: '#202530' },
                ]}
                onPress={() => handleSelectSquad(sq.id)}
              >
                <View style={[styles.colorDot, { backgroundColor: sq.color }]} />
                <Text
                  style={[
                    styles.squadTabText,
                    isSelected && { color: sq.color, fontWeight: '800' },
                  ]}
                >
                  {`${sq.name.split(' ')[0]} ${sq.name.split(' ')[1]} (${sq.assignedPigeonIds.length})`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView contentContainerStyle={styles.container}>
          {/* Active Squad Card Header */}
          <View style={[styles.squadCard, { borderLeftColor: selectedSquad.color }]}>
            <View style={styles.squadCardHeader}>
              <View>
                <Text style={styles.squadTitle}>{selectedSquad.name}</Text>
                <Text style={styles.squadCategory}>
                  Cel: {selectedSquad.targetCategory || 'Ogólny'} • Limit: {selectedSquad.maxCapacity} ptaków
                </Text>
              </View>
              <View
                style={[
                  styles.capacityBadge,
                  analysis.isAtCapacity ? styles.badgeFull : styles.badgeOpen,
                ]}
              >
                <Text style={styles.capacityBadgeText}>
                  {analysis.totalBirds} / {selectedSquad.maxCapacity}
                </Text>
              </View>
            </View>

            {/* Demographics row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Samce ♂</Text>
                <Text style={styles.statValue}>{analysis.cocksCount}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Samice ♀</Text>
                <Text style={styles.statValue}>{analysis.hensCount}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Średni wiek</Text>
                <Text style={styles.statValue}>{analysis.averageAgeYears} lat</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Gotowość ARI</Text>
                <Text style={[styles.statValue, { color: '#10B981' }]}>
                  {analysis.readinessScorePct}%
                </Text>
              </View>
            </View>

            {/* Performance summary */}
            <View style={styles.perfRow}>
              <View style={styles.perfItem}>
                <Text style={styles.perfLabel}>Razem konkursy</Text>
                <Text style={styles.perfValue}>{analysis.totalPrizes} konk.</Text>
              </View>
              <View style={styles.perfItem}>
                <Text style={styles.perfLabel}>Zdobyte kkm</Text>
                <Text style={styles.perfValue}>{analysis.totalConcourseKm} kkm</Text>
              </View>
              <View style={styles.perfItem}>
                <Text style={styles.perfLabel}>Średni Coeff FCI</Text>
                <Text style={[styles.perfValue, { color: '#E5A93C' }]}>
                  {analysis.averageCoeff.toFixed(3)}
                </Text>
              </View>
            </View>
          </View>

          {/* Action button: Add bird */}
          <FieldButton
            title={`+ Dodaj Ptaka do ${selectedSquad.name}`}
            variant="primary"
            onPress={handleOpenAddPicker}
            style={{ marginBottom: 14 }}
            disabled={analysis.isAtCapacity}
          />

          {/* List of Birds in this Squad */}
          <Text style={styles.sectionHeader}>
            SKŁAD DRUŻYNY ({assignedPigeons.length} PTAKÓW)
          </Text>

          {assignedPigeons.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                Drużyna jest pusta. Dodaj ptaki lotowe, aby skompletować skład do koszowania.
              </Text>
            </View>
          ) : (
            assignedPigeons.map((pigeon) => {
              const isCock = pigeon.sex === 'cock';
              const perf = mockPerformances[pigeon.id];

              return (
                <View key={pigeon.id} style={styles.pigeonRow}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.pigeonRing}>{pigeon.ringNumber}</Text>
                      <Text style={[styles.sexBadge, isCock ? styles.cockColor : styles.henColor]}>
                        {isCock ? '♂' : '♀'}
                      </Text>
                    </View>
                    <Text style={styles.pigeonMeta}>
                      Rocznik: {pigeon.year} • Barwa: {pigeon.plumageColor} • Konkursy: {perf?.prizesCount || 0}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
                    <Text style={styles.coeffText}>
                      Coeff: {perf?.averageCoeff.toFixed(3) || '—'}
                    </Text>
                    <Text style={styles.kkmText}>{perf?.concourseKm || 0} kkm</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemovePigeon(pigeon)}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121417',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
  },
  screenTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E2127',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  squadsScroll: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2430',
  },
  squadTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2127',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  squadTabText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
  },
  squadCard: {
    backgroundColor: '#1E2127',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2F343F',
    borderLeftWidth: 4,
    marginBottom: 14,
  },
  squadCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  squadTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  squadCategory: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  capacityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeOpen: {
    backgroundColor: '#1A2E20',
  },
  badgeFull: {
    backgroundColor: '#371B1D',
  },
  capacityBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#81C784',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#2B323F',
    paddingTop: 10,
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#8E94A0',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  perfRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#2B323F',
    paddingTop: 10,
  },
  perfItem: {
    alignItems: 'center',
  },
  perfLabel: {
    fontSize: 10,
    color: '#8E94A0',
    marginBottom: 2,
  },
  perfValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 1,
    marginBottom: 10,
  },
  emptyBox: {
    backgroundColor: '#1E2127',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    fontSize: 13,
  },
  pigeonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2127',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  pigeonRing: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  sexBadge: {
    fontSize: 13,
    fontWeight: '800',
  },
  cockColor: {
    color: '#60A5FA',
  },
  henColor: {
    color: '#F472B6',
  },
  pigeonMeta: {
    fontSize: 11,
    color: '#8E94A0',
    marginTop: 2,
  },
  coeffText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5A93C',
    fontFamily: 'monospace',
  },
  kkmText: {
    fontSize: 11,
    color: '#64748B',
  },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2A1D20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  removeBtnText: {
    color: '#F87171',
    fontWeight: '800',
    fontSize: 12,
  },
});

/**
 * PIGEON-FLY — CompartmentsModal (BR-STADO-005)
 * Physical sections manager for lofts: Cocks (Wdowce), Hens (Wdówki),
 * Youngsters (Młode), Breeding (Rozpłodowy), and Quarantine (Izolatka).
 *
 * Zootechnical stocking density controls, crowding index warnings,
 * and seamless flock transfer between sections.
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
  LoftCompartment,
  getStandardCompartmentPresets,
  evaluateCompartment,
  canAssignPigeonToCompartment,
  movePigeonBetweenCompartments,
} from '../domain/compartments';
import { Pigeon } from '../domain/types';
import { FieldButton } from './FieldButton';

export interface CompartmentsModalProps {
  visible: boolean;
  onClose: () => void;
  pigeons: Pigeon[];
  initialCompartments?: LoftCompartment[];
  onSaveCompartments?: (compartments: LoftCompartment[]) => void;
}

export function CompartmentsModal({
  visible,
  onClose,
  pigeons,
  initialCompartments,
  onSaveCompartments,
}: CompartmentsModalProps) {
  const [compartments, setCompartments] = useState<LoftCompartment[]>(
    initialCompartments || getStandardCompartmentPresets('loft-01')
  );
  const [selectedCompartmentId, setSelectedCompartmentId] = useState<string | null>(null);

  // Compute evaluations for each compartment
  const evaluations = compartments.map((comp) => evaluateCompartment(comp, pigeons));

  const totalAssignedBirds = compartments.reduce(
    (acc, c) => acc + c.assignedPigeonIds.length,
    0
  );
  const totalMaxSafeCapacity = evaluations.reduce(
    (acc, e) => acc + e.maxSafePigeons,
    0
  );
  const overallCrowdingPct =
    totalMaxSafeCapacity > 0
      ? Math.round((totalAssignedBirds / totalMaxSafeCapacity) * 100)
      : 0;

  const handleOpenAssignPigeon = (compartment: LoftCompartment) => {
    // Show available pigeons to add or move to this compartment
    const availablePigeons = pigeons.filter(
      (p) => !compartment.assignedPigeonIds.includes(p.id)
    );

    if (availablePigeons.length === 0) {
      Alert.alert('Brak ptaków', 'Wszystkie ptaki ze stada są już przypisane do tego przedziału.');
      return;
    }

    Alert.alert(
      `Przypisz ptaka do: ${compartment.name}`,
      'Wybierz ptaka, którego chcesz umieścić w tym przedziale:',
      [
        ...availablePigeons.slice(0, 6).map((p) => ({
          text: `${p.sex === 'cock' ? '♂' : '♀'} ${p.ringNumber} (${p.plumageColor})`,
          onPress: () => {
            const check = canAssignPigeonToCompartment(compartment, p);
            if (!check.allowed) {
              Alert.alert('Błąd zootechniczny', check.reason || 'Niedozwolone przypisanie.');
              return;
            }

            // Find if already in another compartment and move cleanly
            const sourceComp = compartments.find((c) =>
              c.assignedPigeonIds.includes(p.id)
            );
            const sourceId = sourceComp ? sourceComp.id : '';

            const updated = movePigeonBetweenCompartments(
              p.id,
              sourceId,
              compartment.id,
              compartments
            );
            setCompartments(updated);
            onSaveCompartments?.(updated);
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {}
            Alert.alert(
              'Przeniesiono ptaka',
              `Gołąb ${p.ringNumber} został pomyślnie umieszczony w przedziale: ${compartment.name}.`
            );
          },
        })),
        { text: 'Anuluj', style: 'cancel' },
      ]
    );
  };

  const handleRemovePigeon = (compartmentId: string, pigeonId: string, ringNumber: string) => {
    Alert.alert(
      'Usunąć ptaka z przedziału?',
      `Czy chcesz odpiąć gołębia ${ringNumber} z tego sektora?`,
      [
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: () => {
            const updated = compartments.map((c) =>
              c.id === compartmentId
                ? {
                    ...c,
                    assignedPigeonIds: c.assignedPigeonIds.filter((id) => id !== pigeonId),
                  }
                : c
            );
            setCompartments(updated);
            onSaveCompartments?.(updated);
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
          },
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
                  <Text style={styles.pillText}>ZARZĄDZANIE PRZESTRZENIĄ GOŁĘBNIKA</Text>
                </View>
                <Text style={styles.title}>PRZEDZIAŁY I SEKCJE STADA</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="btn-close-compartments">
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Global Loft Density Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Obsada Stada</Text>
                  <Text style={styles.summaryValue}>
                    {totalAssignedBirds} / {pigeons.length} ptaków
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Zagęszczenie Globalne</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      overallCrowdingPct > 100 ? styles.textDanger : styles.textSuccess,
                    ]}
                  >
                    {overallCrowdingPct}% normy
                  </Text>
                </View>
              </View>
              <Text style={styles.summarySub}>
                Łączna bezpieczna kubatura gołębnika: {totalMaxSafeCapacity} miejsc wg norm zootechnicznych FCI.
              </Text>
            </View>

            {/* Compartments List */}
            <Text style={styles.sectionHeader}>SEKTORY FIZYCZNE GOŁĘBNIKA</Text>

            {compartments.map((comp) => {
              const stats = evaluateCompartment(comp, pigeons);
              const assignedBirds = pigeons.filter((p) =>
                comp.assignedPigeonIds.includes(p.id)
              );

              return (
                <View key={comp.id} style={styles.compCard}>
                  <View style={styles.compHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.compName}>{comp.name}</Text>
                      <Text style={styles.compDimensions}>
                        {comp.floorAreaM2} m² powierzchni • {comp.volumeM3} m³ kubatury
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        stats.statusLevel === 'optimal'
                          ? styles.statusOptimal
                          : stats.statusLevel === 'warning'
                          ? styles.statusWarning
                          : styles.statusDanger,
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {stats.statusLevel === 'optimal'
                          ? 'OPTYMALNE'
                          : stats.statusLevel === 'warning'
                          ? 'BLISKO LIMITU'
                          : 'PRZEZAGĘSZCZENIE'}
                      </Text>
                    </View>
                  </View>

                  {/* Stocking Gauge */}
                  <View style={styles.gaugeContainer}>
                    <View style={styles.gaugeBarBackground}>
                      <View
                        style={[
                          styles.gaugeBarFill,
                          {
                            width: `${Math.min(100, stats.crowdingPct)}%` as any,
                            backgroundColor:
                              stats.statusLevel === 'optimal'
                                ? '#4CAF50'
                                : stats.statusLevel === 'warning'
                                ? '#E5A93C'
                                : '#E53935',
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.gaugeMetaRow}>
                      <Text style={styles.gaugeMetaText}>
                        Obsada: <Text style={styles.whiteText}>{stats.pigeonCount}</Text> z max{' '}
                        {stats.maxSafePigeons} ptaków
                      </Text>
                      <Text style={styles.gaugeMetaText}>
                        {stats.floorAreaPerBirdM2} m²/ptaka • {stats.airVolumePerBirdM3} m³/ptaka
                      </Text>
                    </View>
                  </View>

                  {/* Warning Message */}
                  {stats.warningMessage && (
                    <View style={styles.warningBox}>
                      <Text style={styles.warningText}>⚠️ {stats.warningMessage}</Text>
                    </View>
                  )}

                  {/* Assigned Birds Chips */}
                  <View style={styles.birdsChipsContainer}>
                    {assignedBirds.map((bird) => (
                      <TouchableOpacity
                        key={bird.id}
                        style={styles.birdChip}
                        onPress={() =>
                          handleRemovePigeon(comp.id, bird.id, bird.ringNumber)
                        }
                      >
                        <Text style={styles.birdChipText}>
                          {bird.sex === 'cock' ? '♂' : '♀'} {bird.ringNumber} ✕
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {assignedBirds.length === 0 && (
                      <Text style={styles.noBirdsText}>Brak przypisanych ptaków w tym przedziale.</Text>
                    )}
                  </View>

                  {/* Action Button */}
                  <FieldButton
                    title="+ Przypisz Ptaka do Przedziału"
                    variant="secondary"
                    onPress={() => handleOpenAssignPigeon(comp)}
                    style={{ marginTop: 10, minHeight: 40 }}
                    textStyle={{ fontSize: 13 }}
                  />
                </View>
              );
            })}
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
    marginBottom: 16,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pillDot: {
    color: '#4E88FF',
    fontSize: 10,
  },
  pillText: {
    color: '#4E88FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
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
  summaryCard: {
    backgroundColor: '#1E2127',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#2F343F',
  },
  summaryLabel: {
    color: '#8E94A0',
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  textSuccess: {
    color: '#4CAF50',
  },
  textDanger: {
    color: '#E53935',
  },
  summarySub: {
    color: '#8E94A0',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
  sectionHeader: {
    color: '#8E94A0',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  compCard: {
    backgroundColor: '#1E2127',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  compHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  compName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  compDimensions: {
    color: '#8E94A0',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusOptimal: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  statusWarning: {
    backgroundColor: 'rgba(229, 169, 60, 0.2)',
  },
  statusDanger: {
    backgroundColor: 'rgba(229, 57, 53, 0.2)',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  gaugeContainer: {
    marginBottom: 10,
  },
  gaugeBarBackground: {
    height: 8,
    backgroundColor: '#0E1116',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  gaugeBarFill: {
    height: 8,
    borderRadius: 4,
  },
  gaugeMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gaugeMetaText: {
    color: '#8E94A0',
    fontSize: 11,
  },
  whiteText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  warningBox: {
    backgroundColor: 'rgba(229, 169, 60, 0.12)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.3)',
    marginBottom: 10,
  },
  warningText: {
    color: '#E5A93C',
    fontSize: 12,
    lineHeight: 16,
  },
  birdsChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  birdChip: {
    backgroundColor: '#2A2E38',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3E4452',
  },
  birdChipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  noBirdsText: {
    color: '#8E94A0',
    fontSize: 12,
    fontStyle: 'italic',
  },
});

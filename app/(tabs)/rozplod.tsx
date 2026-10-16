/**
 * PIGEON-FLY — Rozpłód i Lęgi (Breeding & Clutch Screen)
 * Pair management, egg candling (owoskopia), hatching milestones, and banding reminders.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Alert,
} from 'react-native';
import { ClutchWithParents } from '../../src/db/breedingRepository';
import { ClutchCard } from '../../src/components/ClutchCard';
import { FieldButton } from '../../src/components/FieldButton';
import { PairingModal } from '../../src/components/PairingModal';
import { ClutchLifecycleModal } from '../../src/components/ClutchLifecycleModal';
import { calculateClutchMilestones } from '../../src/domain/breeding';


const INITIAL_CLUTCHES: ClutchWithParents[] = [
  {
    id: 'c-01',
    loftId: 'loft-01',
    roundNumber: 1,
    nestBox: 'Cela A-04',
    cockId: 'p-01',
    henId: 'p-02',
    pairedDate: '2026-03-01',
    egg1Date: '2026-03-10',
    egg2Date: '2026-03-12',
    egg1Status: 'fertile',
    egg2Status: 'fertile',
    hatchDate: '2026-03-30',
    chick1RingNumber: 'PL-0284-26-101',
    chick2RingNumber: 'PL-0284-26-102',
    chick1Banded: true,
    chick2Banded: true,
    weanedDate: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cockRingNumber: 'PL-0284-23-1402',
    henRingNumber: 'PL-0284-22-9854',
  },
  {
    id: 'c-02',
    loftId: 'loft-01',
    roundNumber: 1,
    nestBox: 'Cela B-11',
    cockId: 'p-03',
    henId: 'p-04',
    pairedDate: '2026-03-05',
    egg1Date: '2026-03-14',
    egg2Date: '2026-03-16',
    egg1Status: 'laid',
    egg2Status: 'laid',
    hatchDate: undefined,
    chick1Banded: false,
    chick2Banded: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cockRingNumber: 'DV-01234-24-512',
    henRingNumber: 'PL-0284-24-4401',
  },
];

export default function BreedingScreen() {
  const [clutches, setClutches] = useState<ClutchWithParents[]>(INITIAL_CLUTCHES);
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [selectedClutch, setSelectedClutch] = useState<ClutchWithParents | null>(null);
  const [isLifecycleModalOpen, setIsLifecycleModalOpen] = useState(false);

  const handlePairSaved = (pairing: {
    cockId: string;
    cockRing: string;
    henId: string;
    henRing: string;
    nestBox: string;
    pairedDate: string;
    inbreedingF: number;
  }) => {
    const newClutch: ClutchWithParents = {
      id: `c-${Date.now()}`,
      loftId: 'loft-01',
      roundNumber: 1,
      nestBox: pairing.nestBox,
      cockId: pairing.cockId,
      henId: pairing.henId,
      pairedDate: pairing.pairedDate,
      egg1Date: undefined,
      egg2Date: undefined,
      egg1Status: 'laid',
      egg2Status: 'laid',
      chick1Banded: false,
      chick2Banded: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cockRingNumber: pairing.cockRing,
      henRingNumber: pairing.henRing,
    };
    setClutches([newClutch, ...clutches]);
  };

  const handleClutchPress = (item: ClutchWithParents) => {
    setSelectedClutch(item);
    setIsLifecycleModalOpen(true);
  };

  const handleSaveClutchLifecycle = (updatedClutch: ClutchWithParents) => {
    setClutches((prev) =>
      prev.map((c) => (c.id === updatedClutch.id ? updatedClutch : c))
    );
    setSelectedClutch(null);
    setIsLifecycleModalOpen(false);
    Alert.alert(
      'Zaktualizowano Celę!',
      `${updatedClutch.nestBox}: Zapisano postępy w cyklu lęgowym.`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Action Bar */}
        <View style={styles.actionsRow}>
          <FieldButton
            title="+ Zestaw Nową Parę"
            onPress={() => setIsPairingOpen(true)}
            style={{ flex: 1 }}
            testID="btn-new-pair"
          />
        </View>

        {/* Season Summary Bar */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>SEZON LĘGOWY 2026 (LĘG I)</Text>
          <View style={styles.summaryStatsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statVal}>{clutches.length}</Text>
              <Text style={styles.statLbl}>Par w celach</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statVal}>
                {clutches.filter((c) => c.egg1Date).length * 2}
              </Text>
              <Text style={styles.statLbl}>Jaj zniesionych</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statVal}>91%</Text>
              <Text style={styles.statLbl}>Zalężenie</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statVal}>
                {clutches.filter((c) => c.chick1Banded).length}
              </Text>
              <Text style={styles.statLbl}>Obrączkowanych</Text>
            </View>
          </View>
        </View>

        {/* Clutches List */}
        <Text style={styles.sectionTitle}>Aktywne Cele Lęgowe ({clutches.length})</Text>

        <FlatList
          data={clutches}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ClutchCard
              clutch={item}
              onPress={() => handleClutchPress(item)}
            />
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      </View>

      <PairingModal
        visible={isPairingOpen}
        onClose={() => setIsPairingOpen(false)}
        onPairSaved={handlePairSaved}
      />

      <ClutchLifecycleModal
        visible={isLifecycleModalOpen}
        clutch={selectedClutch}
        onClose={() => {
          setIsLifecycleModalOpen(false);
          setSelectedClutch(null);
        }}
        onSave={handleSaveClutchLifecycle}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121417',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  actionsRow: {
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#1E2127',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLbl: {
    fontSize: 11,
    color: '#8E94A0',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D4D8E0',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

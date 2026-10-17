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
import { NestBoxMatrixModal } from '../../src/components/NestBoxMatrixModal';
import { PairingAssistantModal } from '../../src/components/PairingAssistantModal';
import { MaternalLineModal } from '../../src/components/MaternalLineModal';
import { WingAerodynamicsModal } from '../../src/components/WingAerodynamicsModal';
import { calculateClutchMilestones } from '../../src/domain/breeding';
import { PdfService } from '../../src/services/pdfService';


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
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isMaternalModalOpen, setIsMaternalModalOpen] = useState(false);
  const [isWingAerodynamicsOpen, setIsWingAerodynamicsOpen] = useState(false);

  const handleApplyAiPairing = (cockRing: string, henRing: string, inbreedingF: number) => {
    handlePairSaved({
      cockId: `p-${cockRing}`,
      cockRing,
      henId: `p-${henRing}`,
      henRing,
      nestBox: `Cela AI-${clutches.length + 1}`,
      pairedDate: new Date().toISOString().slice(0, 10),
      inbreedingF,
    });
    Alert.alert(
      'Utworzono Parę AI!',
      `Zestawiono ♂ ${cockRing} x ♀ ${henRing} w celi Cela AI-${clutches.length + 1} (Inbred: ${(inbreedingF * 100).toFixed(1)}%).`
    );
  };

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

  const handlePrintNestBoxCards = () => {
    if (clutches.length === 0) {
      Alert.alert('Brak par', 'Dodaj przynajmniej jedną parę lęgową przed wydrukiem kart cel.');
      return;
    }

    Alert.alert(
      'Karty Cel Gniazdowych A4 (PDF)',
      `Wygenerować karty cel dla ${clutches.length} aktywnych par lęgowych?`,
      [
        {
          text: '🖨️ Drukuj (AirPrint)',
          onPress: async () => {
            try {
              await PdfService.exportNestBoxCards(
                {
                  loftName: 'Gołębnik Mistrza',
                  breederName: 'Hodowca Pigeon-Fly',
                  seasonYear: 2026,
                  cards: clutches.map((c) => {
                    const milestones = calculateClutchMilestones({
                      pairDate: c.pairedDate,
                      egg1Date: c.egg1Date,
                    });
                    return {
                      nestBox: c.nestBox,
                      roundNumber: c.roundNumber,
                      pairedDate: c.pairedDate,
                      cockRingNumber: c.cockRingNumber,
                      henRingNumber: c.henRingNumber,
                      egg1Date: c.egg1Date,
                      egg2Date: c.egg2Date,
                      eggStatus: c.egg1Status === 'fertile' ? 'Zalężone / Pajączek' : 'Złożone',
                      expectedHatchDate: milestones.expectedHatchDate,
                      bandingWindow: `${milestones.bandingStartDate} - ${milestones.bandingEndDate}`,
                      chick1RingNumber: c.chick1RingNumber,
                      chick2RingNumber: c.chick2RingNumber,
                      weanedDate: milestones.weaningDate,
                    };
                  }),
                },
                'print'
              );
            } catch (err: any) {
              Alert.alert('Błąd drukowania', err.message);
            }
          },
        },
        {
          text: '📤 Udostępnij / Zapisz PDF',
          onPress: async () => {
            try {
              await PdfService.exportNestBoxCards(
                {
                  loftName: 'Gołębnik Mistrza',
                  breederName: 'Hodowca Pigeon-Fly',
                  seasonYear: 2026,
                  cards: clutches.map((c) => {
                    const milestones = calculateClutchMilestones({
                      pairDate: c.pairedDate,
                      egg1Date: c.egg1Date,
                    });
                    return {
                      nestBox: c.nestBox,
                      roundNumber: c.roundNumber,
                      pairedDate: c.pairedDate,
                      cockRingNumber: c.cockRingNumber,
                      henRingNumber: c.henRingNumber,
                      egg1Date: c.egg1Date,
                      egg2Date: c.egg2Date,
                      eggStatus: c.egg1Status === 'fertile' ? 'Zalężone / Pajączek' : 'Złożone',
                      expectedHatchDate: milestones.expectedHatchDate,
                      bandingWindow: `${milestones.bandingStartDate} - ${milestones.bandingEndDate}`,
                      chick1RingNumber: c.chick1RingNumber,
                      chick2RingNumber: c.chick2RingNumber,
                      weanedDate: milestones.weaningDate,
                    };
                  }),
                },
                'share'
              );
            } catch (err: any) {
              Alert.alert('Błąd udostępniania', err.message);
            }
          },
        },
        { text: 'Anuluj', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Action Bar */}
        <View style={styles.actionsRow}>
          <FieldButton
            title="+ Nowa Para"
            onPress={() => setIsPairingOpen(true)}
            style={{ flex: 1, marginRight: 8 }}
            testID="btn-new-pair"
          />
          <FieldButton
            title="🏢 Siatka Cel"
            variant="secondary"
            onPress={() => setIsMatrixOpen(true)}
            style={{ flex: 1 }}
            testID="btn-open-matrix"
          />
        </View>

        <FieldButton
          title="🖨️ Drukuj Karty Cel (A4/PDF)"
          variant="secondary"
          onPress={handlePrintNestBoxCards}
          style={{ marginBottom: 10, minHeight: 44 }}
          textStyle={{ fontSize: 13 }}
          testID="btn-print-nest-cards"
        />

        <FieldButton
          title="🤖 Asystent Kojarzeń AI"
          variant="secondary"
          onPress={() => setIsAssistantOpen(true)}
          style={{ marginBottom: 10, minHeight: 44 }}
          textStyle={{ fontSize: 13 }}
          testID="btn-open-pairing-assistant"
        />

        <FieldButton
          title="🧬 Analiza Linii Matecznych i mtDNA (Z-060)"
          variant="secondary"
          onPress={() => setIsMaternalModalOpen(true)}
          style={{ marginBottom: 10, minHeight: 44 }}
          textStyle={{ fontSize: 13 }}
          testID="btn-open-maternal-line"
        />

        <FieldButton
          title="🪽 Aerodynamika Skrzydła i Biomechanika (Z-064)"
          variant="secondary"
          onPress={() => setIsWingAerodynamicsOpen(true)}
          style={{ marginBottom: 12, minHeight: 44 }}
          textStyle={{ fontSize: 13 }}
          testID="btn-open-wing-aerodynamics"
        />

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

      <NestBoxMatrixModal
        visible={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
      />

      <PairingAssistantModal
        visible={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onApplyPairing={handleApplyAiPairing}
      />

      <MaternalLineModal
        visible={isMaternalModalOpen}
        onClose={() => setIsMaternalModalOpen(false)}
      />

      {/* Wing Aerodynamics & Biomechanics Modal (Z-064) */}
      <WingAerodynamicsModal
        visible={isWingAerodynamicsOpen}
        onClose={() => setIsWingAerodynamicsOpen(false)}
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

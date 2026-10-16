/**
 * PIGEON-FLY — Loty i Treningi (Races & Live Arrivals Screen)
 * Live leaderboard of incoming birds with real-time speed in m/min.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { ArrivalWithPigeon } from '../../src/db/raceRepository';
import { ArrivalCard } from '../../src/components/ArrivalCard';
import { FieldButton } from '../../src/components/FieldButton';
import { ClockArrivalModal } from '../../src/components/ClockArrivalModal';
import { NewRaceModal } from '../../src/components/NewRaceModal';
import { PdfService } from '../../src/services/pdfService';
import { Alert } from 'react-native';
import { calculateFciCoefficient, calculateConcourseLimit } from '../../src/domain/concourse';

const DEMO_ARRIVALS: ArrivalWithPigeon[] = [
  {
    id: 'arr-1',
    raceId: 'race-01',
    pigeonId: 'p-01',
    arrivalTime: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    distanceMeters: 345200,
    velocityMPerMin: 1342.541,
    scanType: 'qr',
    isManualOverride: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ringNumber: 'PL-0284-23-1402',
    countryCode: 'PL',
    year: 2023,
    sex: 'cock',
    plumageColor: 'Niebieski nakrapiany',
  },
  {
    id: 'arr-2',
    raceId: 'race-01',
    pigeonId: 'p-03',
    arrivalTime: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    distanceMeters: 345200,
    velocityMPerMin: 1324.112,
    scanType: 'qr',
    isManualOverride: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ringNumber: 'DV-01234-24-512',
    countryCode: 'DV',
    year: 2024,
    sex: 'cock',
    plumageColor: 'Pstry',
  },
];

export default function RacesScreen() {
  const [arrivals, setArrivals] = useState<ArrivalWithPigeon[]>(DEMO_ARRIVALS);
  const [isClockModalVisible, setIsClockModalVisible] = useState(false);
  const [isNewRaceModalVisible, setIsNewRaceModalVisible] = useState(false);
  const [raceName, setRaceName] = useState('Lot: Magdeburg');
  const [releaseLocation, setReleaseLocation] = useState('Magdeburg (Niemcy)');
  const [raceDistanceMeters, setRaceDistanceMeters] = useState(345200);
  const [releaseTimeIso, setReleaseTimeIso] = useState(
    new Date(Date.now() - 1000 * 60 * 240).toISOString() // 4 hours ago
  );
  const [isTraining, setIsTraining] = useState(false);
  const [basketedCount] = useState(120);

  const handleSaveNewRace = (data: {
    name: string;
    releaseName: string;
    distanceKm: number;
    releaseTimeIso: string;
    isTraining: boolean;
  }) => {
    setRaceName(data.name);
    setReleaseLocation(data.releaseName);
    setRaceDistanceMeters(data.distanceKm * 1000);
    setReleaseTimeIso(data.releaseTimeIso);
    setIsTraining(data.isTraining);
    Alert.alert(
      'Uruchomiono Lot!',
      `${data.name} — ${data.releaseName}\nDystans: ${data.distanceKm.toFixed(1)} km\nGodzina: ${new Date(data.releaseTimeIso).toLocaleTimeString('pl-PL')}`
    );
  };

  const handleExportBasketingList = () => {
    Alert.alert(
      'Lista Wkładaniowa (Kosz)',
      'Wybierz akcję dla oficjalnej listy wkładaniowej FCI / PZHGP:',
      [
        {
          text: '🖨️ Drukuj',
          onPress: async () => {
            try {
              await PdfService.exportBasketingList(
                {
                  loftName: 'Gołębnik Mistrza',
                  breederName: 'Hodowca Pigeon-Fly',
                  clubBranch: 'Oddział 0284 Gostyń',
                  raceName: releaseLocation,
                  releaseLocation: releaseLocation,
                  basketingDate: new Date().toISOString().slice(0, 10),
                  pigeons: arrivals.map((a, idx) => ({
                    index: idx + 1,
                    ringNumber: a.ringNumber,
                    color: a.plumageColor,
                    sex: a.sex,
                    isTip: idx < 5,
                  })),
                },
                'print'
              );
            } catch (e: any) {
              Alert.alert('Błąd', e?.message || 'Nie udało się wydrukować listy');
            }
          },
        },
        {
          text: '📤 Udostępnij PDF',
          onPress: async () => {
            try {
              await PdfService.exportBasketingList(
                {
                  loftName: 'Gołębnik Mistrza',
                  breederName: 'Hodowca Pigeon-Fly',
                  clubBranch: 'Oddział 0284 Gostyń',
                  raceName: releaseLocation,
                  releaseLocation: releaseLocation,
                  basketingDate: new Date().toISOString().slice(0, 10),
                  pigeons: arrivals.map((a, idx) => ({
                    index: idx + 1,
                    ringNumber: a.ringNumber,
                    color: a.plumageColor,
                    sex: a.sex,
                    isTip: idx < 5,
                  })),
                },
                'share'
              );
            } catch (e: any) {
              Alert.alert('Błąd', e?.message || 'Nie udało się wyeksportować PDF');
            }
          },
        },
        { text: 'Anuluj', style: 'cancel' },
      ]
    );
  };

  const handleClockArrival = (data: {
    ringNumber: string;
    arrivalTimeIso: string;
    velocityMPerMin: number;
  }) => {
    const newArrival: ArrivalWithPigeon = {
      id: `arr-${Date.now()}`,
      raceId: 'race-01',
      pigeonId: `p-${Date.now()}`,
      arrivalTime: data.arrivalTimeIso,
      distanceMeters: raceDistanceMeters,
      velocityMPerMin: data.velocityMPerMin,
      scanType: 'manual',
      isManualOverride: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ringNumber: data.ringNumber,
      countryCode: data.ringNumber.split('-')[0] || 'PL',
      year: new Date().getFullYear(),
      sex: 'cock',
      plumageColor: 'Niebieski',
    };

    setArrivals((prev) => {
      const updated = [newArrival, ...prev];
      return updated.sort((a, b) => b.velocityMPerMin - a.velocityMPerMin);
    });

    Alert.alert(
      'Odbito Przylot!',
      `Ptak: ${data.ringNumber}\nPrędkość: ${data.velocityMPerMin.toFixed(2)} m/min\nCzas: ${new Date(data.arrivalTimeIso).toLocaleTimeString('pl-PL')}`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Active Race Header Card */}
        <View style={styles.raceCard}>
          <View style={styles.raceHeader}>
            <Text style={styles.raceBadge}>
              {isTraining ? 'TRENING Z GOŁĘBNIKA' : 'LOT KONKURSOWY'}
            </Text>
            <Text style={styles.liveIndicator}>🔴 NA ŻYWO</Text>
          </View>
          <Text style={styles.releaseName}>{releaseLocation}</Text>
          <View style={styles.raceStatsRow}>
            <Text style={styles.statLabel}>
              Dystans: <Text style={styles.statValue}>{(raceDistanceMeters / 1000).toFixed(1)} km</Text>
            </Text>
            <Text style={styles.statLabel}>
              Wypuszczenie: <Text style={styles.statValue}>
                {new Date(releaseTimeIso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </Text>
            </Text>
          </View>
          <View style={[styles.raceStatsRow, { borderTopWidth: 0, paddingTop: 4 }]}>
            <Text style={styles.statLabel}>
              Baza 20%: <Text style={[styles.statValue, { color: '#E5A93C' }]}>{calculateConcourseLimit(basketedCount, 20).prizeLimit} konkursów</Text> / {basketedCount} włożonych
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <FieldButton
            title="⏱️ Odbij Przylot Ptaka"
            onPress={() => setIsClockModalVisible(true)}
            testID="btn-clock-arrival"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="🏁 + Nowy Lot / Trening"
            onPress={() => setIsNewRaceModalVisible(true)}
            testID="btn-new-race"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="📄 Drukuj Listę Wkładaniową (Kosz)"
            onPress={handleExportBasketingList}
            testID="btn-export-basketing"
            variant="secondary"
          />
        </View>

        {/* Leaderboard title */}
        <Text style={styles.sectionTitle}>Ranking Przylotów ({arrivals.length})</Text>

        {/* Arrivals List */}
        <FlatList
          data={arrivals}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ArrivalCard
              arrival={item}
              position={index + 1}
              fciCoeff={calculateFciCoefficient(index + 1, basketedCount)}
              testID={`arrival-card-${index}`}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      </View>

      {/* Quick Clocking Modal */}
      <ClockArrivalModal
        visible={isClockModalVisible}
        onClose={() => setIsClockModalVisible(false)}
        raceDistanceMeters={raceDistanceMeters}
        releaseTimeIso={releaseTimeIso}
        onClockArrival={handleClockArrival}
      />

      {/* New Race Configuration Modal */}
      <NewRaceModal
        visible={isNewRaceModalVisible}
        onClose={() => setIsNewRaceModalVisible(false)}
        onSaveRace={handleSaveNewRace}
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
  raceCard: {
    backgroundColor: '#1E2127',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E5A93C',
    marginBottom: 14,
  },
  raceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  raceBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.5,
  },
  liveIndicator: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4CAF50',
  },
  releaseName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  raceStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#2F343F',
    paddingTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: '#8E94A0',
  },
  statValue: {
    fontWeight: '700',
    color: '#F0F2F5',
  },
  actionRow: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E5A93C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 24,
  },
});

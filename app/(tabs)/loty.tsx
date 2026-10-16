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
import { PdfService } from '../../src/services/pdfService';
import { Alert } from 'react-native';

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
  const [arrivals] = useState<ArrivalWithPigeon[]>(DEMO_ARRIVALS);

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
                  raceName: 'Magdeburg (Niemcy)',
                  releaseLocation: 'Magdeburg',
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
                  raceName: 'Magdeburg (Niemcy)',
                  releaseLocation: 'Magdeburg',
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Active Race Header Card */}
        <View style={styles.raceCard}>
          <View style={styles.raceHeader}>
            <Text style={styles.raceBadge}>LOT KONKURSOWY</Text>
            <Text style={styles.liveIndicator}>🔴 NA ŻYWO</Text>
          </View>
          <Text style={styles.releaseName}>Magdeburg (Niemcy)</Text>
          <View style={styles.raceStatsRow}>
            <Text style={styles.statLabel}>Dystans: <Text style={styles.statValue}>345.2 km</Text></Text>
            <Text style={styles.statLabel}>Wypuszczenie: <Text style={styles.statValue}>06:30:00</Text></Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <FieldButton
            title="⏱️ Odbij Przylot Ptaka"
            onPress={() => {
              // Open quick clocking modal or scanner
            }}
            testID="btn-clock-arrival"
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
              testID={`arrival-card-${index}`}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      </View>
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

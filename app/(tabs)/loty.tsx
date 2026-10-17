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
import { TelemetryTrackModal } from '../../src/components/TelemetryTrackModal';
import { RaceWeatherModal } from '../../src/components/RaceWeatherModal';
import { BasketingSessionModal } from '../../src/components/BasketingSessionModal';
import { LiveDerbyModal } from '../../src/components/LiveDerbyModal';
import { ConcourseSheetModal } from '../../src/components/ConcourseSheetModal';
import { EskImportModal } from '../../src/components/EskImportModal';
import { FlightComparisonModal } from '../../src/components/FlightComparisonModal';
import { TrainingTossModal } from '../../src/components/TrainingTossModal';
import { BasketingProtocolModal } from '../../src/components/BasketingProtocolModal';
import { TransportWelfareModal } from '../../src/components/TransportWelfareModal';
import { LoftGeodesyModal } from '../../src/components/LoftGeodesyModal';
import { WindTacticsModal } from '../../src/components/WindTacticsModal';
import { ClockSyncModal } from '../../src/components/ClockSyncModal';
import { CabinSealingModal } from '../../src/components/CabinSealingModal';
import { NationalChampionshipModal } from '../../src/components/NationalChampionshipModal';
import { PostRaceRestitutionModal } from '../../src/components/PostRaceRestitutionModal';
import { TrainingTossLogModal } from '../../src/components/TrainingTossLogModal';
import { CareerPassportModal } from '../../src/components/CareerPassportModal';
import { FairPlayDeclarationModal } from '../../src/components/FairPlayDeclarationModal';
import { BasketEntry } from '../../src/domain/basketing';
import { PdfService } from '../../src/services/pdfService';
import { CsvService } from '../../src/services/csvService';
import { exportBasketingToCsv } from '../../src/domain/csvExport';
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
  const [basketedCount, setBasketedCount] = useState(120);
  const [isTelemetryModalVisible, setIsTelemetryModalVisible] = useState(false);
  const [isWeatherModalVisible, setIsWeatherModalVisible] = useState(false);
  const [isBasketingModalVisible, setIsBasketingModalVisible] = useState(false);
  const [isDerbyModalVisible, setIsDerbyModalVisible] = useState(false);
  const [isConcourseModalVisible, setIsConcourseModalVisible] = useState(false);
  const [isEskModalVisible, setIsEskModalVisible] = useState(false);
  const [isComparisonModalVisible, setIsComparisonModalVisible] = useState(false);
  const [isTossModalVisible, setIsTossModalVisible] = useState(false);
  const [isBasketingProtocolModalVisible, setIsBasketingProtocolModalVisible] = useState(false);
  const [isWelfareModalVisible, setIsWelfareModalVisible] = useState(false);
  const [isGeodesyModalVisible, setIsGeodesyModalVisible] = useState(false);
  const [isWindTacticsModalVisible, setIsWindTacticsModalVisible] = useState(false);
  const [isClockSyncModalVisible, setIsClockSyncModalVisible] = useState(false);
  const [isCabinSealingModalVisible, setIsCabinSealingModalVisible] = useState(false);
  const [isChampionshipModalVisible, setIsChampionshipModalVisible] = useState(false);
  const [isRestitutionModalVisible, setIsRestitutionModalVisible] = useState(false);
  const [isTossLogModalVisible, setIsTossLogModalVisible] = useState(false);
  const [isCareerPassportModalVisible, setIsCareerPassportModalVisible] = useState(false);
  const [isFairPlayModalVisible, setIsFairPlayModalVisible] = useState(false);

  const handleStartTrainingToss = (tossName: string, distanceKm: number) => {
    handleSaveNewRace({
      name: tossName,
      releaseName: tossName,
      distanceKm,
      releaseTimeIso: new Date().toISOString(),
      isTraining: true,
    });
  };

  const handleImportEskArrivals = (importedArrivals: ArrivalWithPigeon[]) => {
    setArrivals((prev) => {
      const existingRings = new Set(prev.map((a) => a.ringNumber));
      const newBirds = importedArrivals.filter((a) => !existingRings.has(a.ringNumber));
      const merged = [...newBirds, ...prev];
      return merged.sort((a, b) => b.velocityMPerMin - a.velocityMPerMin);
    });
  };

  const handleSaveBasketing = (entries: BasketEntry[]) => {
    setBasketedCount(entries.length > 0 ? entries.length : 120);
  };

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
        {
          text: '📥 Eksportuj do CSV',
          onPress: async () => {
            try {
              const csv = exportBasketingToCsv({
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
              });
              await CsvService.shareCsv(
                `lista-wkladaniowa-${releaseLocation.replace(/[^a-zA-Z0-9]/g, '_')}.csv`,
                csv,
                'Udostępnij listę wkładaniową CSV'
              );
            } catch (e: any) {
              Alert.alert('Błąd CSV', e?.message || 'Nie udało się wyeksportować CSV');
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
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            <FieldButton
              title="🛰️ Trasa GPS"
              onPress={() => setIsTelemetryModalVisible(true)}
              testID="btn-open-telemetry"
              variant="secondary"
              style={{ flex: 1 }}
            />
            <FieldButton
              title="💨 Wiatr i Pogoda"
              onPress={() => setIsWeatherModalVisible(true)}
              testID="btn-open-weather"
              variant="secondary"
              style={{ flex: 1 }}
            />
          </View>
          <FieldButton
            title="🏁 + Nowy Lot / Trening"
            onPress={() => setIsNewRaceModalVisible(true)}
            testID="btn-new-race"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="📦 Sesja Koszowania (Kosz)"
            onPress={() => setIsBasketingModalVisible(true)}
            testID="btn-open-basketing-session"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="🏆 Mini-Derby Sekcji (Live)"
            onPress={() => setIsDerbyModalVisible(true)}
            testID="btn-open-live-derby"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="📊 Oficjalna Lista Konkursowa i GMP"
            onPress={() => setIsConcourseModalVisible(true)}
            testID="btn-open-concourse-sheet"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="📥 Importuj z Zegara ESK (Tauris/Benzing)"
            onPress={() => setIsEskModalVisible(true)}
            testID="btn-open-esk-import"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="📈 Porównaj z Oddziałem PZHGP"
            onPress={() => setIsComparisonModalVisible(true)}
            testID="btn-open-flight-comparison"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="🧭 Planer Wywózek Treningowych (Toss)"
            onPress={() => setIsTossModalVisible(true)}
            testID="btn-open-toss-planner"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="📋 Lista Startowo-Zegarowa PZHGP (Z-057)"
            onPress={() => setIsBasketingProtocolModalVisible(true)}
            testID="btn-open-basketing-protocol"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="🚛 Dziennik Kabiny i Dobrostanu (Z-059)"
            onPress={() => setIsWelfareModalVisible(true)}
            testID="btn-open-transport-welfare"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="📐 Geodezyjna Kalibracja Koordynat (Z-067)"
            onPress={() => setIsGeodesyModalVisible(true)}
            testID="btn-open-loft-geodesy"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="🌬️ Symulator Wiatru i Korytarzy Przylotu (Z-070)"
            onPress={() => setIsWindTacticsModalVisible(true)}
            testID="btn-open-wind-tactics"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="⏱️ Rozliczenie i Odchyłka Zegarowa PZHGP (Z-071)"
            onPress={() => setIsClockSyncModalVisible(true)}
            testID="btn-open-clock-sync"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="🚛 Plombowanie Kabiny i Klatek PZHGP (Z-072)"
            onPress={() => setIsCabinSealingModalVisible(true)}
            testID="btn-open-cabin-sealing"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="🏆 Mistrzostwo Polski PZHGP i Asy (Z-075)"
            onPress={() => setIsChampionshipModalVisible(true)}
            testID="btn-open-national-championship"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="⚡ Bilans Elektrolitowy i Restytucja (Z-077)"
            onPress={() => setIsRestitutionModalVisible(true)}
            testID="btn-open-post-race-restitution"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="🧭 Dziennik Wywózek i Zwartość Stada (Z-078)"
            onPress={() => setIsTossLogModalVisible(true)}
            testID="btn-open-training-toss-log"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="📜 Paszport Sportowy Lotnika (Z-079)"
            onPress={() => setIsCareerPassportModalVisible(true)}
            testID="btn-open-career-passport"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="⚖️ Karta Etyki i Antydoping PZHGP (Z-080)"
            onPress={() => setIsFairPlayModalVisible(true)}
            testID="btn-open-fair-play"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="📄 Drukuj Listę Wkładaniową (PDF)"
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

      {/* Telemetry Track Modal */}
      <TelemetryTrackModal
        visible={isTelemetryModalVisible}
        onClose={() => setIsTelemetryModalVisible(false)}
      />

      {/* Race Weather Aerodynamics Modal */}
      <RaceWeatherModal
        visible={isWeatherModalVisible}
        onClose={() => setIsWeatherModalVisible(false)}
        distanceMeters={raceDistanceMeters}
      />

      {/* Basketing Session Modal */}
      <BasketingSessionModal
        visible={isBasketingModalVisible}
        onClose={() => setIsBasketingModalVisible(false)}
        raceName={releaseLocation}
        onSaveBasket={handleSaveBasketing}
      />

      {/* Live Section Derby Modal */}
      <LiveDerbyModal
        visible={isDerbyModalVisible}
        onClose={() => setIsDerbyModalVisible(false)}
      />

      {/* Official Concourse Sheet & Olympic Categories Modal */}
      <ConcourseSheetModal
        visible={isConcourseModalVisible}
        onClose={() => setIsConcourseModalVisible(false)}
        raceName={raceName}
        releaseLocation={releaseLocation}
        distanceKm={raceDistanceMeters / 1000}
        totalBasketed={basketedCount}
        arrivals={arrivals}
      />

      {/* Electronic Clock Import Modal (ESK) */}
      <EskImportModal
        visible={isEskModalVisible}
        onClose={() => setIsEskModalVisible(false)}
        raceDistanceMeters={raceDistanceMeters}
        releaseTimeIso={releaseTimeIso}
        raceName={raceName}
        onImportArrivals={handleImportEskArrivals}
      />

      {/* Branch Race Comparison Modal */}
      <FlightComparisonModal
        visible={isComparisonModalVisible}
        onClose={() => setIsComparisonModalVisible(false)}
        raceName={raceName}
        loftDistanceKm={raceDistanceMeters / 1000}
        basketedCount={basketedCount}
        arrivals={arrivals}
      />

      {/* Training Toss Planner Modal */}
      <TrainingTossModal
        visible={isTossModalVisible}
        onClose={() => setIsTossModalVisible(false)}
        onStartSession={handleStartTrainingToss}
      />

      {/* Official PZHGP Basketing & Clocking Protocol Modal (Z-057) */}
      <BasketingProtocolModal
        visible={isBasketingProtocolModalVisible}
        onClose={() => setIsBasketingProtocolModalVisible(false)}
        defaultRaceName={raceName}
        defaultRaceDistanceKm={raceDistanceMeters / 1000}
      />

      {/* Transport Welfare & Cabin Environment Log Modal (Z-059) */}
      <TransportWelfareModal
        visible={isWelfareModalVisible}
        onClose={() => setIsWelfareModalVisible(false)}
        raceName={raceName}
      />

      {/* Geodetic Loft Coordinate Calibration Modal (Z-067) */}
      <LoftGeodesyModal
        visible={isGeodesyModalVisible}
        onClose={() => setIsGeodesyModalVisible(false)}
      />

      {/* Wind Tactics & Release Windows Simulator Modal (Z-070) */}
      <WindTacticsModal
        visible={isWindTacticsModalVisible}
        onClose={() => setIsWindTacticsModalVisible(false)}
      />

      {/* Clock Synchronization & Offset Calculator Modal (Z-071) */}
      <ClockSyncModal
        visible={isClockSyncModalVisible}
        onClose={() => setIsClockSyncModalVisible(false)}
        defaultRaceName={raceName}
        defaultRaceDistanceKm={raceDistanceMeters / 1000}
      />

      {/* Cabin Sealing & Welfare Verification Protocol Modal (Z-072) */}
      <CabinSealingModal
        visible={isCabinSealingModalVisible}
        onClose={() => setIsCabinSealingModalVisible(false)}
        defaultRaceName={raceName}
        defaultReleasePlace={releaseLocation}
      />

      <NationalChampionshipModal
        visible={isChampionshipModalVisible}
        onClose={() => setIsChampionshipModalVisible(false)}
      />

      <PostRaceRestitutionModal
        visible={isRestitutionModalVisible}
        onClose={() => setIsRestitutionModalVisible(false)}
        defaultRaceName={raceName}
      />

      <TrainingTossLogModal
        visible={isTossLogModalVisible}
        onClose={() => setIsTossLogModalVisible(false)}
      />

      <CareerPassportModal
        visible={isCareerPassportModalVisible}
        onClose={() => setIsCareerPassportModalVisible(false)}
      />

      <FairPlayDeclarationModal
        visible={isFairPlayModalVisible}
        onClose={() => setIsFairPlayModalVisible(false)}
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

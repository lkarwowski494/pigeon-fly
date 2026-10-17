/**
 * PIGEON-FLY — Loty i Treningi (Races & Live Arrivals Screen)
 * Live leaderboard of incoming birds with real-time speed in m/min.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { InterTeamChampionshipModal } from '../../src/components/InterTeamChampionshipModal';
import { CarboLipidSupercompensationModal } from '../../src/components/CarboLipidSupercompensationModal';
import { EskRegistrationProtocolModal } from '../../src/components/EskRegistrationProtocolModal';
import { CabinDehydrationModal } from '../../src/components/CabinDehydrationModal';
import { PzhgpMembershipCertificateModal } from '../../src/components/PzhgpMembershipCertificateModal';
import { LoftInspectionProtocolModal } from '../../src/components/LoftInspectionProtocolModal';
import { BasketingStationSanitationModal } from '../../src/components/BasketingStationSanitationModal';
import { AntidopingSamplingModal } from '../../src/components/AntidopingSamplingModal';
import { CrateInventoryRentalModal } from '../../src/components/CrateInventoryRentalModal';
import { PreSeasonFlockCensusModal } from '../../src/components/PreSeasonFlockCensusModal';
import { EmergencyCabinReleaseModal } from '../../src/components/EmergencyCabinReleaseModal';
import { ClockOpeningAuditModal } from '../../src/components/ClockOpeningAuditModal';
import { NationalExhibitionModal } from '../../src/components/NationalExhibitionModal';
import { LoftAnnualPerformanceLedgerModal } from '../../src/components/LoftAnnualPerformanceLedgerModal';
import { OfficialProtocolsHubModal } from '../../src/components/OfficialProtocolsHubModal';
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
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsedMillis = Math.max(0, currentTime.getTime() - new Date(releaseTimeIso).getTime());
  const elapsedHours = Math.floor(elapsedMillis / (1000 * 60 * 60));
  const elapsedMinutes = Math.floor((elapsedMillis % (1000 * 60 * 60)) / (1000 * 60));
  const elapsedSecs = Math.floor((elapsedMillis % (1000 * 60)) / 1000);
  const formattedElapsed = `${String(elapsedHours).padStart(2, '0')}:${String(elapsedMinutes).padStart(2, '0')}:${String(elapsedSecs).padStart(2, '0')}`;
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
  const [isTeamChampionshipModalVisible, setIsTeamChampionshipModalVisible] = useState(false);
  const [isCarboLipidModalVisible, setIsCarboLipidModalVisible] = useState(false);
  const [isEskProtocolModalVisible, setIsEskProtocolModalVisible] = useState(false);
  const [isCabinDehydrationModalVisible, setIsCabinDehydrationModalVisible] = useState(false);
  const [isPzhgpCertificateModalVisible, setIsPzhgpCertificateModalVisible] = useState(false);
  const [isLoftInspectionModalVisible, setIsLoftInspectionModalVisible] = useState(false);
  const [isStationSanitationModalVisible, setIsStationSanitationModalVisible] = useState(false);
  const [isAntidopingSamplingModalVisible, setIsAntidopingSamplingModalVisible] = useState(false);
  const [isCrateRentalModalVisible, setIsCrateRentalModalVisible] = useState(false);
  const [isFlockCensusModalVisible, setIsFlockCensusModalVisible] = useState(false);
  const [isEmergencyReleaseModalVisible, setIsEmergencyReleaseModalVisible] = useState(false);
  const [isClockOpeningAuditModalVisible, setIsClockOpeningAuditModalVisible] = useState(false);
  const [isNationalExhibitionModalVisible, setIsNationalExhibitionModalVisible] = useState(false);
  const [isAnnualPerformanceLedgerModalVisible, setIsAnnualPerformanceLedgerModalVisible] = useState(false);
  const [isProtocolsHubModalVisible, setIsProtocolsHubModalVisible] = useState(false);

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
        {/* Dynamic Live Szpica & Race Header Banner (DEC-UX-02) */}
        <View style={styles.raceCard} testID="live-szpica-banner">
          <View style={styles.raceHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.raceBadge}>
                {isTraining ? 'TRENING Z GOŁĘBNIKA' : 'LOT KONKURSOWY'}
              </Text>
              <Text style={styles.liveIndicator}>🔴 NA ŻYWO</Text>
            </View>
            <View style={styles.elapsedTimerBadge}>
              <Text style={styles.elapsedTimerLabel}>CZAS LOTU</Text>
              <Text style={styles.elapsedTimerValue} testID="live-timer-elapsed">
                {formattedElapsed}
              </Text>
            </View>
          </View>

          <Text style={styles.releaseName}>{releaseLocation}</Text>

          <View style={styles.raceStatsRow}>
            <Text style={styles.statLabel}>
              Dystans: <Text style={styles.statValue}>{(raceDistanceMeters / 1000).toFixed(1)} km</Text>
            </Text>
            <Text style={styles.statLabel}>
              Start:{' '}
              <Text style={styles.statValue}>
                {new Date(releaseTimeIso).toLocaleTimeString('pl-PL', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </Text>
          </View>

          <View style={styles.szpicaMetricsRow}>
            <View style={styles.szpicaMetricItem}>
              <Text style={styles.szpicaMetricLabel}>SZPICA NA DOWODZIE</Text>
              <Text style={styles.szpicaMetricValue} testID="live-szpica-speed">
                {arrivals.length > 0
                  ? `${arrivals[0].velocityMPerMin.toFixed(2)} m/min`
                  : `est. ~${new Date(
                      new Date(releaseTimeIso).getTime() + (raceDistanceMeters / 1250) * 60000
                    ).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`}
              </Text>
            </View>
            <View style={styles.szpicaMetricItem}>
              <Text style={styles.szpicaMetricLabel}>BAZA 20% (NAGRODY)</Text>
              <Text style={[styles.szpicaMetricValue, { color: '#E5A93C' }]}>
                {calculateConcourseLimit(basketedCount, 20).prizeLimit} z {basketedCount} pt.
              </Text>
            </View>
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
            title="🏛️ Katalog Urzędowy PZHGP & FCI (100 Modułów)"
            onPress={() => setIsProtocolsHubModalVisible(true)}
            testID="btn-open-protocols-hub"
            variant="secondary"
            style={{ marginBottom: 10, borderColor: '#E5A93C', borderWidth: 1.5 }}
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
            title="🏆 Punktacja Zespołowa i Super-Cup (Z-082)"
            onPress={() => setIsTeamChampionshipModalVisible(true)}
            testID="btn-open-inter-team-championship"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="⚡ Superkompensacja Tłuszczowa i Maraton (Z-083)"
            onPress={() => setIsCarboLipidModalVisible(true)}
            testID="btn-open-carbo-lipid"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="📡 Rejestracja Zegara i Anten ESK (Z-084)"
            onPress={() => setIsEskProtocolModalVisible(true)}
            testID="btn-open-esk-protocol"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="🚛 Bilans Wodny Kabiny i Dobrostan (Z-085)"
            onPress={() => setIsCabinDehydrationModalVisible(true)}
            testID="btn-open-cabin-dehydration"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="📜 Zaświadczenie i Obrączki PZHGP (Z-086)"
            onPress={() => setIsPzhgpCertificateModalVisible(true)}
            testID="btn-open-pzhgp-certificate"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="🕵️ Protokół Kontroli Gołębnika (Z-087)"
            onPress={() => setIsLoftInspectionModalVisible(true)}
            testID="btn-open-loft-inspection"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="🛡️ Atestacja Sanitarna Punktu Koszowania (Z-092)"
            onPress={() => setIsStationSanitationModalVisible(true)}
            testID="btn-open-station-sanitation"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="💉 Kontrola Antydopingowa FCI (Z-093)"
            onPress={() => setIsAntidopingSamplingModalVisible(true)}
            testID="btn-open-antidoping-sampling"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="📦 E-Rejestr Koszy i Klatek Sekcyjnych (Z-094)"
            onPress={() => setIsCrateRentalModalVisible(true)}
            testID="btn-open-crate-rental"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="📋 Urzędowy Spis Gołębi PZHGP (Z-095)"
            onPress={() => setIsFlockCensusModalVisible(true)}
            testID="btn-open-flock-census"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="🚨 Awaria Kabiny i Wypuszczenie Awaryjne (Z-096)"
            onPress={() => setIsEmergencyReleaseModalVisible(true)}
            testID="btn-open-emergency-release"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="🕰️ Otwarcie Zegarów i Zgranie ESK (Z-098)"
            onPress={() => setIsClockOpeningAuditModalVisible(true)}
            testID="btn-open-clock-audit"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="🏆 Reprezentacja na Wystawę Ogólnopolską (Z-099)"
            onPress={() => setIsNationalExhibitionModalVisible(true)}
            testID="btn-open-national-exhibition"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />
          <FieldButton
            title="🌟 Złota Księga Mistrzów & Roczny Bilans (Z-100)"
            onPress={() => setIsAnnualPerformanceLedgerModalVisible(true)}
            testID="btn-open-annual-ledger"
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

      <InterTeamChampionshipModal
        visible={isTeamChampionshipModalVisible}
        onClose={() => setIsTeamChampionshipModalVisible(false)}
      />

      <CarboLipidSupercompensationModal
        visible={isCarboLipidModalVisible}
        onClose={() => setIsCarboLipidModalVisible(false)}
        defaultRaceName={raceName}
      />

      <EskRegistrationProtocolModal
        visible={isEskProtocolModalVisible}
        onClose={() => setIsEskProtocolModalVisible(false)}
      />

      <CabinDehydrationModal
        visible={isCabinDehydrationModalVisible}
        onClose={() => setIsCabinDehydrationModalVisible(false)}
        defaultRaceName={raceName}
      />

      <PzhgpMembershipCertificateModal
        visible={isPzhgpCertificateModalVisible}
        onClose={() => setIsPzhgpCertificateModalVisible(false)}
      />

      <LoftInspectionProtocolModal
        visible={isLoftInspectionModalVisible}
        onClose={() => setIsLoftInspectionModalVisible(false)}
      />

      <BasketingStationSanitationModal
        visible={isStationSanitationModalVisible}
        onClose={() => setIsStationSanitationModalVisible(false)}
        defaultRaceName={raceName}
      />

      <AntidopingSamplingModal
        visible={isAntidopingSamplingModalVisible}
        onClose={() => setIsAntidopingSamplingModalVisible(false)}
        defaultRaceName={raceName}
      />

      <CrateInventoryRentalModal
        visible={isCrateRentalModalVisible}
        onClose={() => setIsCrateRentalModalVisible(false)}
      />

      <PreSeasonFlockCensusModal
        visible={isFlockCensusModalVisible}
        onClose={() => setIsFlockCensusModalVisible(false)}
      />

      <EmergencyCabinReleaseModal
        visible={isEmergencyReleaseModalVisible}
        onClose={() => setIsEmergencyReleaseModalVisible(false)}
        defaultRaceName={raceName}
      />

      <ClockOpeningAuditModal
        visible={isClockOpeningAuditModalVisible}
        onClose={() => setIsClockOpeningAuditModalVisible(false)}
        defaultRaceName={raceName}
      />

      <NationalExhibitionModal
        visible={isNationalExhibitionModalVisible}
        onClose={() => setIsNationalExhibitionModalVisible(false)}
      />

      <LoftAnnualPerformanceLedgerModal
        visible={isAnnualPerformanceLedgerModalVisible}
        onClose={() => setIsAnnualPerformanceLedgerModalVisible(false)}
      />

      <OfficialProtocolsHubModal
        visible={isProtocolsHubModalVisible}
        onClose={() => setIsProtocolsHubModalVisible(false)}
        onOpenNationalExhibition={() => setIsNationalExhibitionModalVisible(true)}
        onOpenAnnualPerformanceLedger={() => setIsAnnualPerformanceLedgerModalVisible(true)}
        onOpenClockOpeningAudit={() => setIsClockOpeningAuditModalVisible(true)}
        onOpenEmergencyCabinRelease={() => setIsEmergencyReleaseModalVisible(true)}
        onOpenPreSeasonFlockCensus={() => setIsFlockCensusModalVisible(true)}
        onOpenCrateRental={() => setIsCrateRentalModalVisible(true)}
        onOpenAntidopingSampling={() => setIsAntidopingSamplingModalVisible(true)}
        onOpenStationSanitation={() => setIsStationSanitationModalVisible(true)}
        onOpenLoftInspection={() => setIsLoftInspectionModalVisible(true)}
        onOpenPzhgpCertificate={() => setIsPzhgpCertificateModalVisible(true)}
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
  elapsedTimerBadge: {
    backgroundColor: '#262215',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5A93C',
    alignItems: 'center',
  },
  elapsedTimerLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.5,
  },
  elapsedTimerValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  szpicaMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#121417',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  szpicaMetricItem: {
    flex: 1,
  },
  szpicaMetricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8E94A0',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  szpicaMetricValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#4CAF50',
    fontVariant: ['tabular-nums'],
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

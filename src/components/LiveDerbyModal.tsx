/**
 * PIGEON-FLY — LiveDerbyModal (BR-LOT-009)
 * Private Section Mini-Derby Live Leaderboard across multiple lofts.
 * Real-time geodesic distance calculations, velocity rankings ($m/\text{min}$),
 * gaps to leader, and live race commentary feed.
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  calculateDerbyStandings,
  generateDerbyLiveFeed,
  generateDerbyBroadcastCode,
  MiniDerbyRace,
  DerbyArrival,
  DerbyStanding,
} from '../domain/derby';
import { FieldButton } from './FieldButton';
import {
  LiveBroadcastService,
  BroadcastConnectionStatus,
} from '../services/liveBroadcastService';

export interface LiveDerbyModalProps {
  visible: boolean;
  onClose: () => void;
  derby?: MiniDerbyRace;
}

const DEFAULT_DEMO_DERBY: MiniDerbyRace = {
  id: 'derby-rawicz-2026',
  name: 'Mini-Derby Sekcji Rawicz',
  releasePointName: 'Magdeburg (DE)',
  releaseLat: 52.13,
  releaseLon: 11.62,
  releaseTime: '2026-06-14T06:00:00Z',
  participatingLofts: [
    {
      loftId: 'loft-01',
      loftName: 'Gołębnik Mistrza',
      fancierName: 'Stanisław Kowalski',
      latitude: 51.88,
      longitude: 17.02,
      geodesicDistanceMeters: 382450,
    },
    {
      loftId: 'loft-02',
      loftName: 'Wichura Loft',
      fancierName: 'Marek Nowak',
      latitude: 51.95,
      longitude: 17.15,
      geodesicDistanceMeters: 391200,
    },
    {
      loftId: 'loft-03',
      loftName: 'Srebrne Skrzydło',
      fancierName: 'Andrzej Wiśniewski',
      latitude: 51.82,
      longitude: 16.90,
      geodesicDistanceMeters: 374000,
    },
    {
      loftId: 'loft-04',
      loftName: 'Piorun Team',
      fancierName: 'Janusz Zieliński',
      latitude: 51.86,
      longitude: 17.08,
      geodesicDistanceMeters: 385100,
    },
  ],
};

const INITIAL_DEMO_ARRIVALS: DerbyArrival[] = [
  {
    arrivalId: 'arr-1',
    loftId: 'loft-01',
    pigeonId: 'p-01',
    ringNumber: 'PL-0284-23-1402',
    arrivalTime: '2026-06-14T10:45:12Z',
    distanceMeters: 382450,
    velocityMPerMin: 1341.93,
  },
  {
    arrivalId: 'arr-2',
    loftId: 'loft-02',
    pigeonId: 'p-02',
    ringNumber: 'PL-0284-24-5501',
    arrivalTime: '2026-06-14T10:50:04Z',
    distanceMeters: 391200,
    velocityMPerMin: 1348.97,
  },
  {
    arrivalId: 'arr-3',
    loftId: 'loft-03',
    pigeonId: 'p-03',
    ringNumber: 'PL-0284-22-9011',
    arrivalTime: '2026-06-14T10:44:30Z',
    distanceMeters: 374000,
    velocityMPerMin: 1316.90,
  },
];

export function LiveDerbyModal({ visible, onClose, derby }: LiveDerbyModalProps) {
  const currentDerby = derby || DEFAULT_DEMO_DERBY;
  const broadcastService = LiveBroadcastService.getInstance();
  const broadcastCode = generateDerbyBroadcastCode(currentDerby.name, 2026);
  const spectatorUrl = broadcastService.generateSpectatorLink(broadcastCode);

  const [arrivals, setArrivals] = useState<DerbyArrival[]>(INITIAL_DEMO_ARRIVALS);
  const [connectionStatus, setConnectionStatus] = useState<BroadcastConnectionStatus>(
    broadcastService.getConnectionStatus()
  );
  const [offlineCount, setOfflineCount] = useState<number>(
    broadcastService.getOfflineQueue().length
  );

  useEffect(() => {
    const unsubStatus = broadcastService.onStatusChange((status) => {
      setConnectionStatus(status);
      setOfflineCount(broadcastService.getOfflineQueue().length);
    });

    const unsubArrivals = broadcastService.subscribeToDerby(broadcastCode, (payload) => {
      const incoming = broadcastService.payloadToDerbyArrival(payload);
      setArrivals((prev) => {
        if (prev.some((a) => a.arrivalId === incoming.arrivalId)) {
          return prev;
        }
        return [incoming, ...prev];
      });
    });

    return () => {
      unsubStatus();
      unsubArrivals();
    };
  }, [broadcastCode]);

  const standings: DerbyStanding[] = calculateDerbyStandings(currentDerby, arrivals);

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(spectatorUrl);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    Alert.alert(
      'Skopiowano Link Transmisji!',
      `Link do kibicowania na żywo: ${spectatorUrl}`
    );
  };

  const handleSimulateNewArrival = async () => {
    const nextArrId = `arr-${Date.now()}`;
    const newArrival: DerbyArrival = {
      arrivalId: nextArrId,
      loftId: 'loft-04',
      pigeonId: `p-${Date.now()}`,
      ringNumber: 'PL-0284-25-8812',
      arrivalTime: '2026-06-14T10:43:10Z',
      distanceMeters: 385100,
      velocityMPerMin: 1360.05, // Rocket arrival!
    };

    const payload = broadcastService.createPayloadFromArrival({
      derbyCode: broadcastCode,
      arrival: newArrival,
      loftName: 'Piorun Team',
      fancierName: 'Janusz Zieliński',
      commentary: 'Rakieta! Ptak melduje się z dużą przewagą prędkości.',
    });

    await broadcastService.broadcastArrival(payload);
    setOfflineCount(broadcastService.getOfflineQueue().length);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <View style={styles.liveBadgeRow}>
                  <View style={styles.livePill}>
                    <Text style={styles.liveDot}>●</Text>
                    <Text style={styles.liveText}>TRANSMISJA NA ŻYWO</Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      connectionStatus === 'connected'
                        ? styles.statusPillConnected
                        : styles.statusPillOffline,
                    ]}
                  >
                    <Text style={styles.statusPillText}>
                      {connectionStatus === 'connected'
                        ? '🟢 REALTIME ONLINE'
                        : offlineCount > 0
                        ? `🟡 OFFLINE (${offlineCount} W KOLEJCE)`
                        : '🟡 TRYB LOKALNY'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.title}>{currentDerby.name.toUpperCase()}</Text>
                <Text style={styles.subtitle}>
                  Wypuszczenie: {currentDerby.releasePointName} • 06:00:00 CEST
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="btn-close-derby">
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Live Broadcast Link Card */}
            <View style={styles.broadcastCard}>
              <View style={styles.broadcastCol}>
                <Text style={styles.broadcastLabel}>KOD TRANSMISJI SUPABASE REALTIME</Text>
                <Text style={styles.broadcastCode}>{broadcastCode}</Text>
              </View>
              <FieldButton
                title="📋 Kopiuj Link"
                onPress={handleCopyCode}
                variant="primary"
                style={styles.copyBtn}
                textStyle={{ fontSize: 13 }}
                testID="btn-copy-derby-link"
              />
            </View>

            {/* Live Feed Ticker */}
            {standings.length > 0 && (
              <View style={styles.feedCard}>
                <Text style={styles.feedTitle}>📡 OSTATNI PRZYLOT NA ŻYWO</Text>
                <Text style={styles.feedMessage}>{generateDerbyLiveFeed(standings[0])}</Text>
              </View>
            )}

            {/* Standings Table Header */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, { width: 32 }]}>POZ</Text>
              <Text style={[styles.th, { flex: 1 }]}>PTAK / GOŁĘBNIK</Text>
              <Text style={[styles.th, { width: 68, textAlign: 'right' }]}>DYSTANS</Text>
              <Text style={[styles.th, { width: 85, textAlign: 'right' }]}>PRĘDKOŚĆ</Text>
            </View>

            {/* Standings List */}
            {standings.map((st) => {
              const isPodium = st.rank <= 3;
              const rankColor =
                st.rank === 1 ? '#FFD700' : st.rank === 2 ? '#C0C0C0' : st.rank === 3 ? '#CD7F32' : '#8E94A0';

              return (
                <View key={st.pigeonId} style={[styles.standingRow, isPodium && styles.podiumRow]}>
                  <View style={[styles.rankBox, { borderColor: rankColor }]}>
                    <Text style={[styles.rankText, { color: rankColor }]}>{st.rank}</Text>
                  </View>

                  <View style={{ flex: 1, marginHorizontal: 8 }}>
                    <Text style={styles.ringNumber}>{st.ringNumber}</Text>
                    <Text style={styles.loftName}>
                      {st.loftName} ({st.fancierName})
                    </Text>
                    <Text style={styles.arrTimeText}>
                      Przylot: {st.arrivalTime.slice(11, 19)}
                    </Text>
                  </View>

                  <View style={{ width: 68, alignItems: 'flex-end' }}>
                    <Text style={styles.distanceText}>{st.distanceKm} km</Text>
                  </View>

                  <View style={{ width: 85, alignItems: 'flex-end' }}>
                    <Text style={styles.velocityText}>{st.velocityMPerMin.toFixed(2)}</Text>
                    <Text style={styles.velocityUnit}>m/min</Text>
                    {st.rank > 1 && (
                      <Text style={styles.gapText}>-{st.gapToLeaderMpm.toFixed(1)} m/min</Text>
                    )}
                  </View>
                </View>
              );
            })}

            {/* Action Bar */}
            <View style={styles.actionsBar}>
              <FieldButton
                title="⚡ Symuluj Przylot z Innego Gołębnika"
                onPress={handleSimulateNewArrival}
                variant="secondary"
                testID="btn-simulate-arrival"
                style={{ marginBottom: 10 }}
              />
              <FieldButton
                title="Zamknij Tabelę Derbów"
                variant="primary"
                onPress={onClose}
                testID="btn-close-derby-bottom"
              />
            </View>
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 57, 53, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E53935',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusPillConnected: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  statusPillOffline: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  liveDot: {
    color: '#E53935',
    fontSize: 10,
    marginRight: 4,
  },
  liveText: {
    color: '#E53935',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#8E94A0',
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
  broadcastCard: {
    backgroundColor: '#15171C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  broadcastCol: {
    flex: 1,
  },
  broadcastLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E94A0',
    marginBottom: 2,
  },
  broadcastCode: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E5A93C',
    fontFamily: 'monospace',
  },
  copyBtn: {
    minHeight: 36,
    paddingHorizontal: 12,
    marginLeft: 10,
  },
  feedCard: {
    backgroundColor: '#2A2417',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5A93C',
    padding: 12,
    marginBottom: 14,
  },
  feedTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  feedMessage: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    lineHeight: 17,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
    marginBottom: 6,
  },
  th: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E94A0',
  },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15171C',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2F343F',
    padding: 10,
    marginBottom: 8,
  },
  podiumRow: {
    borderColor: '#3E4654',
    backgroundColor: '#191C22',
  },
  rankBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 13,
    fontWeight: '900',
  },
  ringNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  loftName: {
    fontSize: 11,
    color: '#8E94A0',
    marginTop: 1,
  },
  arrTimeText: {
    fontSize: 10,
    color: '#64B5F6',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4D8E0',
    fontFamily: 'monospace',
  },
  velocityText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#E5A93C',
    fontFamily: 'monospace',
  },
  velocityUnit: {
    fontSize: 9,
    color: '#8E94A0',
  },
  gapText: {
    fontSize: 9,
    color: '#EF5350',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  actionsBar: {
    marginTop: 12,
  },
});

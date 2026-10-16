/**
 * PIGEON-FLY — TelemetryTrackModal (Moduł 5)
 * Visualizer and analyzer for GPS loggers and IoT tracking rings.
 * Shows curved flight route, efficiency ratio, speed spikes, and altitude profile.
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlightTrack, analyzeFlightTrack, TelemetryPoint } from '../domain/telemetry';
import { FieldButton } from './FieldButton';

export interface TelemetryTrackModalProps {
  visible: boolean;
  onClose: () => void;
  track?: FlightTrack | null;
}

const SAMPLE_TRACK: FlightTrack = {
  id: 'track-demo-01',
  raceId: 'race-magdeburg-01',
  pigeonId: 'p-01',
  ringNumber: 'PL-0284-23-1402',
  points: [
    {
      latitude: 52.1205,
      longitude: 11.6276,
      altitudeMeters: 85,
      speedKmh: 45.0,
      timestampIso: '2026-06-01T06:30:00Z',
    },
    {
      latitude: 52.2451,
      longitude: 12.8712,
      altitudeMeters: 210,
      speedKmh: 78.5,
      timestampIso: '2026-06-01T07:45:00Z',
    },
    {
      latitude: 52.3414,
      longitude: 14.5516,
      altitudeMeters: 310,
      speedKmh: 84.2,
      timestampIso: '2026-06-01T08:50:00Z',
    },
    {
      latitude: 52.4064,
      longitude: 16.9252,
      altitudeMeters: 140,
      speedKmh: 72.0,
      timestampIso: '2026-06-01T10:45:00Z',
    },
  ],
};

export function TelemetryTrackModal({
  visible,
  onClose,
  track = SAMPLE_TRACK,
}: TelemetryTrackModalProps) {
  const activeTrack = track || SAMPLE_TRACK;
  const analysis = analyzeFlightTrack(activeTrack);

  const getEfficiencyRating = (ratio: number) => {
    if (ratio >= 0.95) return { text: 'IDEALNY KORYTARZ (SZPICA)', color: '#4CAF50' };
    if (ratio >= 0.88) return { text: 'BARDZO DOBRA TRAJEKTORIA', color: '#64B5F6' };
    if (ratio >= 0.75) return { text: 'UMIARKOWANE ZNOSZENIE (WIATR/MGŁA)', color: '#FFB74D' };
    return { text: 'DUŻE ODCHYLENIE OD TRASY (ATAK DRAPIEŻNIKA)', color: '#E53935' };
  };

  const rating = getEfficiencyRating(analysis.routeEfficiencyRatio);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>TELEMETRIA & TRASA GPS (IoT)</Text>
                <Text style={styles.ringText}>{activeTrack.ringNumber}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Efficiency Ratio Card */}
            <View style={styles.efficiencyCard}>
              <Text style={styles.efficiencyTitle}>WSKAŹNIK EFEKTYWNOŚCI TRASY</Text>
              <Text style={styles.efficiencyPercent}>
                {(analysis.routeEfficiencyRatio * 100).toFixed(1)}%
              </Text>
              <View style={[styles.ratingBadge, { borderColor: rating.color }]}>
                <Text style={[styles.ratingText, { color: rating.color }]}>
                  {rating.text}
                </Text>
              </View>
            </View>

            {/* Trajectory Stats Grid */}
            <View style={styles.statsCard}>
              <Text style={styles.sectionHeading}>DANE Z LOGERA OBRĄCZKI</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLbl}>W linii prostej:</Text>
                  <Text style={styles.statVal}>{(analysis.geodesicDistanceMeters / 1000).toFixed(1)} km</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLbl}>Rzeczywisty przelot:</Text>
                  <Text style={[styles.statVal, { color: '#E5A93C' }]}>
                    {(analysis.actualTrackDistanceMeters / 1000).toFixed(1)} km
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLbl}>Maks. prędkość:</Text>
                  <Text style={styles.statVal}>{analysis.maxSpeedKmh} km/h</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLbl}>Średnia prędkość:</Text>
                  <Text style={styles.statVal}>{analysis.avgSpeedKmh} km/h</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLbl}>Maks. pułap:</Text>
                  <Text style={styles.statVal}>{analysis.maxAltitudeMeters} m n.p.m.</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLbl}>Średni pułap:</Text>
                  <Text style={styles.statVal}>{analysis.avgAltitudeMeters} m n.p.m.</Text>
                </View>
              </View>
            </View>

            {/* Waypoints list */}
            <View style={styles.statsCard}>
              <Text style={styles.sectionHeading}>
                PUNKTY KONTROLNE TRASY ({activeTrack.points.length})
              </Text>
              {activeTrack.points.map((pt, idx) => (
                <View key={idx} style={styles.waypointRow}>
                  <View style={styles.pointDot}>
                    <Text style={styles.pointIdx}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.coordText}>
                      {pt.latitude.toFixed(4)}°N, {pt.longitude.toFixed(4)}°E
                    </Text>
                    <Text style={styles.pointMeta}>
                      {new Date(pt.timestampIso).toLocaleTimeString('pl-PL')} • {pt.speedKmh || 0} km/h • {pt.altitudeMeters || 0} m
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Footer */}
            <FieldButton
              title="Zamknij Panel Telemetrii"
              variant="secondary"
              onPress={onClose}
              testID="btn-close-telemetry"
              style={{ marginTop: 8 }}
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1E2127',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '92%',
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
    fontSize: 18,
    fontWeight: '800',
    color: '#E5A93C',
  },
  ringText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
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
  efficiencyCard: {
    backgroundColor: '#15171C',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E5A93C',
    alignItems: 'center',
    marginBottom: 14,
  },
  efficiencyTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E94A0',
    letterSpacing: 0.8,
  },
  efficiencyPercent: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 4,
    fontFamily: 'monospace',
  },
  ratingBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 4,
    backgroundColor: '#1E2127',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statsCard: {
    backgroundColor: '#15171C',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#1E2127',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  statLbl: {
    fontSize: 11,
    color: '#8E94A0',
    marginBottom: 2,
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  waypointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#2F343F',
  },
  pointDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2A303C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pointIdx: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E5A93C',
  },
  coordText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  pointMeta: {
    fontSize: 11,
    color: '#8E94A0',
    marginTop: 2,
  },
});

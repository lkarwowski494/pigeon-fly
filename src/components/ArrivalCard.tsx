/**
 * PIGEON-FLY — ArrivalCard Component
 * Displays clocked race arrival with position rank and velocity in m/min.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArrivalWithPigeon } from '../db/raceRepository';

export interface ArrivalCardProps {
  arrival: ArrivalWithPigeon;
  position: number;
  testID?: string;
}

export const ArrivalCard: React.FC<ArrivalCardProps> = ({ arrival, position, testID }) => {
  const timeFormatted = new Date(arrival.arrivalTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const isPodium = position <= 3;
  const positionColor = position === 1 ? '#FFD700' : position === 2 ? '#C0C0C0' : position === 3 ? '#CD7F32' : '#8E94A0';

  return (
    <View testID={testID} style={styles.card}>
      <View style={[styles.positionBadge, { borderColor: positionColor }]}>
        <Text style={[styles.positionText, { color: positionColor }]}>{position}</Text>
      </View>

      <View style={styles.pigeonInfo}>
        <Text style={styles.ringText}>
          {arrival.countryCode} {arrival.ringNumber}
        </Text>
        <Text style={styles.subText}>
          Przylot: {timeFormatted} • {Math.round(arrival.distanceMeters / 1000)} km
        </Text>
      </View>

      <View style={styles.speedBadge}>
        <Text style={styles.speedValue}>{arrival.velocityMPerMin.toFixed(1)}</Text>
        <Text style={styles.speedUnit}>m/min</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  positionBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  positionText: {
    fontSize: 16,
    fontWeight: '800',
  },
  pigeonInfo: {
    flex: 1,
  },
  ringText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  subText: {
    fontSize: 13,
    color: '#8E94A0',
    marginTop: 2,
  },
  speedBadge: {
    alignItems: 'flex-end',
    backgroundColor: '#272B33',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  speedValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#E5A93C', // High-contrast amber velocity
  },
  speedUnit: {
    fontSize: 11,
    color: '#A0A6B2',
    fontWeight: '600',
  },
});

/**
 * PIGEON-FLY — FeatherGauge Component
 * Visual gauge of the 10 primary flight feathers (lotki pierwszorzędowe).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FeatherStatus } from '../domain/types';

export interface FeatherGaugeProps {
  feathers: {
    featherNumber: number;
    status: FeatherStatus;
    lengthPct: number;
  }[];
  testID?: string;
}

export const FeatherGauge: React.FC<FeatherGaugeProps> = ({ feathers, testID }) => {
  return (
    <View testID={testID} style={styles.container}>
      <Text style={styles.title}>10 Lotek Pierwszorzędowych (Skrzydło)</Text>
      <View style={styles.gaugeRow}>
        {feathers.map((f) => {
          const isDropped = f.status === 'dropped';
          const isRegrowing = f.status === 'regrowing' && f.lengthPct < 100;
          const barColor = isDropped
            ? '#E53935' // Red if dropped
            : isRegrowing
            ? '#FB8C00' // Orange if regrowing
            : '#43A047'; // Green if intact/full

          return (
            <View key={f.featherNumber} style={styles.featherCol}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${f.lengthPct}%`,
                      backgroundColor: barColor,
                    },
                  ]}
                />
              </View>
              <Text style={styles.featherNumber}>{f.featherNumber}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#43A047' }]} />
          <Text style={styles.legendText}>Pełna</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FB8C00' }]} />
          <Text style={styles.legendText}>Wzrost</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#E53935' }]} />
          <Text style={styles.legendText}>Zrzucona</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginVertical: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E5A93C',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gaugeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 90,
    paddingBottom: 8,
  },
  featherCol: {
    alignItems: 'center',
    width: 24,
  },
  barTrack: {
    width: 14,
    height: 70,
    backgroundColor: '#15171B',
    borderRadius: 7,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  featherNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A0A6B2',
    marginTop: 6,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#8E94A0',
  },
});

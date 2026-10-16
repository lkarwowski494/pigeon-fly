/**
 * PIGEON-FLY — PigeonCard Component
 * Displays individual bird information with high-contrast ring number and sex icons.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Pigeon } from '../domain/types';

export interface PigeonCardProps {
  pigeon: Pigeon;
  onPress: () => void;
  testID?: string;
}

export const PigeonCard: React.FC<PigeonCardProps> = ({ pigeon, onPress, testID }) => {
  const sexSymbol = pigeon.sex === 'cock' ? '♂' : pigeon.sex === 'hen' ? '♀' : '?';
  const sexColor = pigeon.sex === 'cock' ? '#64B5F6' : pigeon.sex === 'hen' ? '#F48FB1' : '#9E9E9E';

  const statusLabel = {
    racing: 'Lotowy',
    breeding: 'Rozpłód',
    retired: 'Wycofany',
    sold: 'Sprzedany',
    lost: 'Zagubiony',
    deceased: 'Padły',
  }[pigeon.status] || pigeon.status;

  return (
    <TouchableOpacity
      testID={testID}
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Gołąb ${pigeon.ringNumber}, rocznik ${pigeon.year}, ${statusLabel}`}
    >
      <View style={styles.headerRow}>
        <View style={styles.ringBadge}>
          {pigeon.clipBandColor && (
            <View
              style={[
                styles.clipBandDot,
                {
                  backgroundColor:
                    pigeon.clipBandColor === 'red'
                      ? '#E53935'
                      : pigeon.clipBandColor === 'yellow'
                      ? '#FDD835'
                      : pigeon.clipBandColor === 'blue'
                      ? '#1E88E5'
                      : pigeon.clipBandColor === 'green'
                      ? '#43A047'
                      : '#FFFFFF',
                },
              ]}
            />
          )}
          <Text style={styles.countryText}>{pigeon.countryCode}</Text>
          <Text style={styles.ringText}>{pigeon.ringNumber}</Text>
          {pigeon.auxiliaryRingNumber && (
            <View style={styles.auxBadge}>
              <Text style={styles.auxText}>{pigeon.auxiliaryRingNumber}</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {(pigeon.photoUrl || pigeon.eyePhotoUrl || pigeon.wingPhotoUrl) && (
            <Text style={styles.photoIndicator}>📷</Text>
          )}
          <Text style={[styles.sexText, { color: sexColor }]}>{sexSymbol}</Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <Text style={styles.metaText}>Rocznik: {pigeon.year}</Text>
        <Text style={styles.metaSeparator}>•</Text>
        <Text style={styles.metaText}>{pigeon.plumageColor}</Text>
        <View style={styles.spacer} />
        <View style={[styles.statusBadge, pigeon.status === 'racing' && styles.statusRacing]}>
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ringBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  countryText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E5A93C',
    marginRight: 6,
  },
  ringText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  sexText: {
    fontSize: 24,
    fontWeight: '900',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#A0A6B2',
  },
  metaSeparator: {
    fontSize: 14,
    color: '#555C6A',
    marginHorizontal: 8,
  },
  spacer: {
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#2B303C',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusRacing: {
    backgroundColor: '#1E3A24',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#81C784',
  },
  clipBandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
  },
  auxBadge: {
    backgroundColor: '#262B35',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#383F4D',
  },
  auxText: {
    fontSize: 11,
    color: '#81C784',
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  photoIndicator: {
    fontSize: 14,
    marginRight: 4,
  },
});

/**
 * PIGEON-FLY — ClutchCard Component (Karta Lęgu)
 * Displays clutch lifecycle, eggs status, candling alerts, and banding reminders.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ClutchWithParents } from '../db/breedingRepository';
import { evaluateClutchStage } from '../domain/breeding';

export interface ClutchCardProps {
  clutch: ClutchWithParents;
  onPress: () => void;
  testID?: string;
}

export const ClutchCard: React.FC<ClutchCardProps> = ({ clutch, onPress, testID }) => {
  const evaluation = evaluateClutchStage(clutch);

  const getEggBadgeColor = (status: string) => {
    switch (status) {
      case 'fertile':
      case 'hatched':
        return '#4CAF50'; // Green
      case 'infertile':
      case 'broken':
      case 'dead_in_shell':
        return '#E53935'; // Red
      case 'laid':
        return '#FB8C00'; // Amber
      default:
        return '#757575'; // Grey
    }
  };

  const getEggStatusLabel = (status: string) => {
    switch (status) {
      case 'laid': return 'Zniesione';
      case 'fertile': return 'Zalężone (OK)';
      case 'infertile': return 'Czyste (Zbuk)';
      case 'hatched': return 'Wyklute';
      case 'broken': return 'Uszkodzone';
      default: return 'Oczekiwane';
    }
  };

  return (
    <TouchableOpacity
      testID={testID}
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      {/* Header: Nest Box & Round */}
      <View style={styles.headerRow}>
        <View style={styles.boxBadge}>
          <Text style={styles.boxText}>{clutch.nestBox}</Text>
        </View>
        <Text style={styles.roundText}>LĘG {clutch.roundNumber}</Text>
      </View>

      {/* Parents */}
      <View style={styles.parentsRow}>
        <Text style={styles.parentText}>
          <Text style={{ color: '#64B5F6', fontWeight: '800' }}>♂ </Text>
          {clutch.cockRingNumber}
        </Text>
        <Text style={styles.parentSeparator}>×</Text>
        <Text style={styles.parentText}>
          <Text style={{ color: '#F48FB1', fontWeight: '800' }}>♀ </Text>
          {clutch.henRingNumber}
        </Text>
      </View>

      {/* Eggs row */}
      <View style={styles.eggsContainer}>
        <View style={styles.eggItem}>
          <Text style={styles.eggNumber}>Jajko 1:</Text>
          <View style={[styles.eggBadge, { borderColor: getEggBadgeColor(clutch.egg1Status) }]}>
            <Text style={[styles.eggStatusText, { color: getEggBadgeColor(clutch.egg1Status) }]}>
              🥚 {getEggStatusLabel(clutch.egg1Status)}
            </Text>
          </View>
        </View>

        <View style={styles.eggItem}>
          <Text style={styles.eggNumber}>Jajko 2:</Text>
          <View style={[styles.eggBadge, { borderColor: getEggBadgeColor(clutch.egg2Status) }]}>
            <Text style={[styles.eggStatusText, { color: getEggBadgeColor(clutch.egg2Status) }]}>
              🥚 {getEggStatusLabel(clutch.egg2Status)}
            </Text>
          </View>
        </View>
      </View>

      {/* Critical Alert Bar if applicable */}
      {evaluation.alertMessage && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>⚠️ {evaluation.alertMessage}</Text>
        </View>
      )}

      {/* Banded status if chicks hatched */}
      {clutch.hatchDate && (
        <View style={styles.chicksRow}>
          <Text style={styles.chickLabel}>
            Pisklęta wyklute: {clutch.hatchDate} • Obrączkowanie: {clutch.chick1Banded && clutch.chick2Banded ? '✅ Zaobrączkowane' : '⏳ W toku'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E2127',
    borderRadius: 14,
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
  boxBadge: {
    backgroundColor: '#272B33',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5A93C',
  },
  boxText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.5,
  },
  roundText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#8E94A0',
  },
  parentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  parentText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  parentSeparator: {
    fontSize: 16,
    color: '#8E94A0',
    marginHorizontal: 10,
  },
  eggsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#262930',
    paddingTop: 8,
  },
  eggItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eggNumber: {
    fontSize: 12,
    color: '#A0A6B2',
    marginRight: 6,
  },
  eggBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#15171B',
  },
  eggStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  alertBanner: {
    backgroundColor: '#332712',
    borderLeftWidth: 4,
    borderLeftColor: '#E5A93C',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  alertText: {
    color: '#FFE082',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  chicksRow: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#262930',
    paddingTop: 6,
  },
  chickLabel: {
    fontSize: 12,
    color: '#81C784',
    fontWeight: '600',
  },
});

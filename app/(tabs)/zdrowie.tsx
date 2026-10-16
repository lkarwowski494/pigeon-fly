/**
 * PIGEON-FLY — Zdrowie i Pierzenie (Health & Moult Screen)
 * Paramyxo PMV-1 vaccination compliance, medication withdrawal warnings, and 10 flight feather inspection.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { FeatherGauge } from '../../src/components/FeatherGauge';
import { FieldButton } from '../../src/components/FieldButton';
import { analyzeWingMoult } from '../../src/domain/moult';

export default function HealthScreen() {
  const [selectedPigeonRing] = useState('PL-0284-23-1402');

  // Simulated moult logs for the selected bird
  const demoMoult = analyzeWingMoult('p-01', [
    {
      id: 'm-1',
      pigeonId: 'p-01',
      checkDate: '2026-09-15',
      primaryFeatherNumber: 1,
      status: 'full',
      lengthPct: 100,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'm-2',
      pigeonId: 'p-01',
      checkDate: '2026-09-15',
      primaryFeatherNumber: 2,
      status: 'full',
      lengthPct: 100,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'm-3',
      pigeonId: 'p-01',
      checkDate: '2026-10-01',
      primaryFeatherNumber: 3,
      status: 'regrowing',
      lengthPct: 65,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'm-4',
      pigeonId: 'p-01',
      checkDate: '2026-10-10',
      primaryFeatherNumber: 4,
      status: 'dropped',
      lengthPct: 0,
      createdAt: '',
      updatedAt: '',
    },
  ]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Paramyxovirus PMV-1 Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>SZCZEPIENIE PMV-1 (PARAMYKSO)</Text>
            <View style={styles.statusBadgeValid}>
              <Text style={styles.statusBadgeText}>WAŻNE</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>
            Ostatnie szczepienie stadne wykonano: <Text style={styles.highlightText}>15.02.2026</Text>
          </Text>
          <Text style={styles.cardSub}>
            Ważność odporności: do 15.02.2027 (Pozostało 122 dni). Zgodność z wymogami PZHGP/FCI: 100%.
          </Text>
        </View>

        {/* Medication Withdrawal Alert Card */}
        <View style={[styles.card, styles.withdrawalCard]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: '#4CAF50' }]}>STATUS KARENCJI LEKÓW</Text>
            <View style={[styles.statusBadgeValid, { backgroundColor: '#1B3B22' }]}>
              <Text style={[styles.statusBadgeText, { color: '#81C784' }]}>CZYSTO</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>
            Brak aktywnych okresów karencji farmakologicznej w stadzie. Ptaki gotowe do koszowania.
          </Text>
        </View>

        {/* Selected Bird Wing Moult Analysis */}
        <View style={styles.moultSection}>
          <View style={styles.moultHeader}>
            <Text style={styles.moultSectionTitle}>PRZEGLĄD SKRZYDŁA: {selectedPigeonRing}</Text>
          </View>

          <FeatherGauge feathers={demoMoult.feathers} />

          <View style={styles.moultStatsCard}>
            <Text style={styles.moultStatLabel}>
              Wskaźnik Regeneracji Skrzydła (ARI):{' '}
              <Text style={styles.moultStatValue}>{demoMoult.annualRegenerationIndex}%</Text>
            </Text>
            <Text style={styles.moultStatLabel}>
              Status lotowy:{' '}
              <Text style={{ color: demoMoult.isFitForRacing ? '#4CAF50' : '#E53935', fontWeight: '800' }}>
                {demoMoult.isFitForRacing ? 'ZDOLNY DO LOTU' : 'NIEZALECANY NA CIĘŻKI LOT'}
              </Text>
            </Text>
            {demoMoult.unfitnessReason && (
              <Text style={styles.unfitnessText}>{demoMoult.unfitnessReason}</Text>
            )}
          </View>
        </View>

        {/* Action Button */}
        <FieldButton
          title="+ Zapisz Przegląd Pierzenia / Lek"
          onPress={() => {}}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121417',
  },
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1E2127',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 14,
  },
  withdrawalCard: {
    borderColor: '#2E7D32',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.5,
  },
  statusBadgeValid: {
    backgroundColor: '#1B3B22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#81C784',
  },
  cardDesc: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: '#8E94A0',
  },
  highlightText: {
    color: '#E5A93C',
    fontWeight: '700',
  },
  moultSection: {
    marginBottom: 14,
  },
  moultHeader: {
    marginBottom: 4,
  },
  moultSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  moultStatsCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginTop: 8,
  },
  moultStatLabel: {
    fontSize: 14,
    color: '#A0A6B2',
    marginBottom: 4,
  },
  moultStatValue: {
    fontWeight: '800',
    color: '#E5A93C',
  },
  unfitnessText: {
    fontSize: 13,
    color: '#FF8A80',
    marginTop: 6,
    lineHeight: 18,
  },
});

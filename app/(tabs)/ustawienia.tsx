/**
 * PIGEON-FLY — Gołębnik i Ustawienia (Settings & Supabase Sync Screen)
 * Loft configuration, GPS coordinates, tandem members, and hybrid cloud sync control.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { FieldButton } from '../../src/components/FieldButton';

export default function SettingsScreen() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingQueueCount, setPendingQueueCount] = useState(0);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    // Simulate sync
    setTimeout(() => {
      setIsSyncing(false);
      setPendingQueueCount(0);
      Alert.alert('Synchronizacja', 'Baza lokalna SQLite została pomyślnie zsynchronizowana z chmurą Supabase.');
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Loft Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>MÓJ GOŁĘBNIK</Text>
          <Text style={styles.loftName}>Gołębnik Mistrza — Kat. A/B</Text>
          <Text style={styles.metaText}>Właściciel: Janusz Hodowca (PL-0284)</Text>
          <View style={styles.separator} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Koordynaty GPS:</Text>
            <Text style={styles.statValue}>52.2297° N, 21.0122° E</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Kraj i Federacja:</Text>
            <Text style={styles.statValue}>Polska (PZHGP / FCI)</Text>
          </View>
        </View>

        {/* Supabase Hybrid Cloud Sync Card */}
        <View style={styles.card}>
          <View style={styles.syncHeaderRow}>
            <Text style={styles.cardHeader}>CHMURA SUPABASE & OFFLINE-FIRST</Text>
            <View style={styles.onlineBadge}>
              <Text style={styles.onlineText}>POŁĄCZONO</Text>
            </View>
          </View>

          <Text style={styles.syncDesc}>
            Aplikacja działa w 100% offline w gołębniku (baza SQLite). Po wykryciu sieci dane synchronizują się z PostgreSQL.
          </Text>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Oczekujące wpisy w kolejce:</Text>
            <Text style={styles.statValue}>{pendingQueueCount} operacji</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Ostatnia synchronizacja:</Text>
            <Text style={styles.statValue}>Przed chwilą</Text>
          </View>

          <FieldButton
            title="🔄 Synchronizuj z Supabase"
            onPress={handleSyncNow}
            loading={isSyncing}
            style={{ marginTop: 14 }}
            testID="btn-sync-now"
          />
        </View>

        {/* Local Backup Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>KOPIA ZAPASOWA I EKSPORT</Text>
          <Text style={styles.syncDesc}>
            Eksportuj pełną bazę stada, rodowodów i wyników do bezpiecznego pliku SQLite / JSON na prywatny dysk.
          </Text>
          <FieldButton
            title="💾 Eksportuj Kopię (.sqlite / JSON)"
            variant="secondary"
            onPress={() => {
              Alert.alert('Eksport', 'Kopia bazy danych została przygotowana do zapisu w Plikach / iCloud Drive.');
            }}
          />
        </View>
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
    marginBottom: 16,
  },
  syncHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  onlineBadge: {
    backgroundColor: '#1B3B22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#81C784',
  },
  loftName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 6,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#A0A6B2',
  },
  separator: {
    height: 1,
    backgroundColor: '#2F343F',
    marginVertical: 12,
  },
  syncDesc: {
    fontSize: 14,
    color: '#D4D8E0',
    lineHeight: 20,
    marginVertical: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#8E94A0',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F0F2F5',
  },
});

/**
 * PIGEON-FLY — Stado (Flock Screen)
 * Main digital notebook list of pigeons with instant search and QR scanner launcher.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Pigeon } from '../../src/domain/types';
import { PigeonCard } from '../../src/components/PigeonCard';
import { FieldButton } from '../../src/components/FieldButton';
import { PaywallModal } from '../../src/components/PaywallModal';
import { PdfService } from '../../src/services/pdfService';

// Initial demo pigeons for immediate offline usability
const INITIAL_DEMO_PIGEONS: Pigeon[] = [
  {
    id: 'p-01',
    loftId: 'loft-01',
    ringNumber: 'PL-0284-23-1402',
    countryCode: 'PL',
    year: 2023,
    sex: 'cock',
    plumageColor: 'Niebieski nakrapiany',
    eyeSign: 'Żółte / Rozpłodowe',
    status: 'racing',
    qrCodeUuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-02',
    loftId: 'loft-01',
    ringNumber: 'PL-0284-22-9854',
    countryCode: 'PL',
    year: 2022,
    sex: 'hen',
    plumageColor: 'Ciemna płowa',
    eyeSign: 'Perłowe',
    status: 'breeding',
    qrCodeUuid: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-03',
    loftId: 'loft-01',
    ringNumber: 'DV-01234-24-512',
    countryCode: 'DV',
    year: 2024,
    sex: 'cock',
    plumageColor: 'Pstry',
    status: 'racing',
    qrCodeUuid: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function FlockScreen() {
  const router = useRouter();
  const [pigeons] = useState<Pigeon[]>(INITIAL_DEMO_PIGEONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'racing' | 'breeding'>('all');
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isProUser, setIsProUser] = useState(false);

  const handlePigeonPress = (pigeon: Pigeon) => {
    Alert.alert(
      `${pigeon.countryCode}-${pigeon.ringNumber}`,
      `Wybierz działanie dla gołębia (${pigeon.plumageColor}, ${pigeon.year}):`,
      [
        {
          text: '📜 Drukuj Rodowód PDF (A4)',
          onPress: () => exportPigeonPedigree(pigeon, 'print'),
        },
        {
          text: '📤 Udostępnij Rodowód PDF',
          onPress: () => exportPigeonPedigree(pigeon, 'share'),
        },
        { text: 'Anuluj', style: 'cancel' },
      ]
    );
  };

  const exportPigeonPedigree = async (pigeon: Pigeon, mode: 'print' | 'share') => {
    if (!isProUser) {
      setIsPaywallOpen(true);
      return;
    }

    try {
      await PdfService.exportPedigree(
        {
          pigeon,
          generation: 0,
        },
        {
          loftName: 'Gołębnik Mistrza',
          breederName: 'Hodowca Pigeon-Fly',
          breederPhone: '+48 600 000 000',
          inbreedingF: 0.0,
        },
        mode
      );
    } catch (e: any) {
      Alert.alert('Błąd', e?.message || 'Nie udało się wygenerować rodowodu');
    }
  };

  const filteredPigeons = pigeons.filter((p) => {
    const matchesSearch =
      p.ringNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.plumageColor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || p.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Action Bar */}
        <View style={styles.actionsRow}>
          <FieldButton
            title="📷 Skanuj QR"
            onPress={() => router.push('/modal/scan')}
            style={styles.actionBtn}
            testID="btn-scan-qr"
          />
          <View style={{ width: 12 }} />
          <FieldButton
            title="+ Dodaj Ptaka"
            variant="secondary"
            onPress={() => router.push('/modal/new-pigeon')}
            style={styles.actionBtn}
            testID="btn-add-pigeon"
          />
        </View>

        {/* Search input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Szukaj po numerze obrączki..."
            placeholderTextColor="#8E94A0"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="characters"
            clearButtonMode="while-editing"
          />
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['all', 'racing', 'breeding'] as const).map((filter) => {
            const label = filter === 'all' ? 'Wszystkie' : filter === 'racing' ? 'Lotowe' : 'Rozpłodowe';
            const isActive = selectedFilter === filter;
            return (
              <FieldButton
                key={filter}
                title={label}
                variant={isActive ? 'primary' : 'secondary'}
                onPress={() => setSelectedFilter(filter)}
                style={styles.filterPill}
                textStyle={{ fontSize: 14 }}
              />
            );
          })}
        </View>

        {/* Flock List */}
        <FlatList
          data={filteredPigeons}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PigeonCard
              pigeon={item}
              onPress={() => handlePigeonPress(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Nie znaleziono ptaków w notesie.</Text>
            </View>
          }
        />
      </View>

      {/* Paywall Pro Upgrade Modal */}
      <PaywallModal
        visible={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        onSelectPlan={async () => {
          setIsProUser(true);
          setIsPaywallOpen(false);
          Alert.alert('Sukces!', 'Plan Pigeon-Fly Pro aktywowany. Dostęp do generowania profesjonalnych rodowodów PDF został odblokowany!');
        }}
        onRestore={async () => {
          setIsProUser(true);
          setIsPaywallOpen(false);
          Alert.alert('Przywrócono', 'Przywrócono uprawnienia Pigeon-Fly Pro.');
        }}
        currentPigeonsCount={pigeons.length}
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
  actionsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    minHeight: 52,
  },
  searchContainer: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchInput: {
    height: 48,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    minHeight: 38,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#8E94A0',
    fontSize: 16,
  },
});

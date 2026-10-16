/**
 * Pigeon-Fly — PairingModal.tsx (Kojarzenie Par i Symulator Inbredu Wrighta)
 * Zgodność z Z-261, Z-262, RD-05:
 * Umożliwia dobór samca i samicy, wylicza na żywo współczynnik pokrewieństwa F
 * i przypisuje parę do konkretnej celi lęgowej (Nest Box).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FieldButton } from './FieldButton';
import { calculateWrightInbreeding } from '../domain/genetics';
import { Pigeon } from '../domain/types';
import { t } from '../lib/i18n';

export interface PairingModalProps {
  visible: boolean;
  onClose: () => void;
  onPairSaved: (pairing: {
    cockId: string;
    cockRing: string;
    henId: string;
    henRing: string;
    nestBox: string;
    pairedDate: string;
    inbreedingF: number;
  }) => void;
  availableCocks?: { id: string; ring: string; name?: string }[];
  availableHens?: { id: string; ring: string; name?: string }[];
}

const DEFAULT_COCKS = [
  { id: 'p-01', ring: 'PL-0284-23-1402', name: 'Niebieski As (Janssen)' },
  { id: 'p-03', ring: 'DV-01234-24-512', name: 'Płowy Szpic (Koopman)' },
  { id: 'p-05', ring: 'PL-0284-21-8899', name: 'Ciemny Maraton (Aarden)' },
];

const DEFAULT_HENS = [
  { id: 'p-02', ring: 'PL-0284-22-9854', name: 'Pstra Nioska (Gaby)' },
  { id: 'p-04', ring: 'PL-0284-24-4401', name: 'Czerwona Mistrzyni' },
  { id: 'p-06', ring: 'BELG-2023-6011', name: 'Czysta Krew (Heremans)' },
];

export function PairingModal({
  visible,
  onClose,
  onPairSaved,
  availableCocks = DEFAULT_COCKS,
  availableHens = DEFAULT_HENS,
}: PairingModalProps) {
  const [selectedCockId, setSelectedCockId] = useState(availableCocks[0]?.id || '');
  const [selectedHenId, setSelectedHenId] = useState(availableHens[0]?.id || '');
  const [nestBox, setNestBox] = useState('Cela 01');
  const [pairedDate, setPairedDate] = useState(new Date().toISOString().split('T')[0]);

  const selectedCock = availableCocks.find((c) => c.id === selectedCockId) || availableCocks[0];
  const selectedHen = availableHens.find((h) => h.id === selectedHenId) || availableHens[0];

  // Symulacja pokrewieństwa w oparciu o silnik genetyki
  const mockCockPigeon: Pigeon = {
    id: selectedCock.id,
    loftId: 'loft-1',
    countryCode: 'PL',
    ringNumber: selectedCock.ring,
    year: 2023,
    sex: 'cock',
    plumageColor: 'Niebieska',
    status: 'breeding',
    qrCodeUuid: 'qr-cock-mock',
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockHenPigeon: Pigeon = {
    id: selectedHen.id,
    loftId: 'loft-1',
    countryCode: 'PL',
    ringNumber: selectedHen.ring,
    year: 2023,
    sex: 'hen',
    plumageColor: 'Pstra',
    status: 'breeding',
    qrCodeUuid: 'qr-hen-mock',
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const lookup = new Map<string, Pigeon>([
    [mockCockPigeon.id, mockCockPigeon],
    [mockHenPigeon.id, mockHenPigeon],
  ]);

  const inbreedingResult = calculateWrightInbreeding(selectedCock.id, selectedHen.id, lookup);
  const inbreedingPct = (inbreedingResult.coefficientF * 100).toFixed(2);
  const isSafe = inbreedingResult.level === 'none' || inbreedingResult.level === 'low';



  const handleConfirm = () => {
    onPairSaved({
      cockId: selectedCock.id,
      cockRing: selectedCock.ring,
      henId: selectedHen.id,
      henRing: selectedHen.ring,
      nestBox,
      pairedDate,
      inbreedingF: inbreedingResult.coefficientF,
    });
    Alert.alert(
      'Para Skolejkowana!',
      `Cela: ${nestBox}\nPara: ${selectedCock.ring} × ${selectedHen.ring}\nInbred F: ${inbreedingPct}%\n\nAplikacja rozpoczęła odliczanie do zniesienia pierwszego jaja.`
    );
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Kojarzenie Nowej Pary</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Wybór Celi i Daty */}
          <View style={styles.rowInputs}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Cela Lęgowa:</Text>
              <TextInput
                style={styles.input}
                value={nestBox}
                onChangeText={setNestBox}
                placeholder="Cela 12"
                placeholderTextColor="#64748B"
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Data Zestawienia:</Text>
              <TextInput
                style={styles.input}
                value={pairedDate}
                onChangeText={setPairedDate}
                placeholder="2026-03-01"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          {/* Wybór Samca */}
          <Text style={styles.sectionHeader}>1. Wybierz Samca (1.0 ♂):</Text>
          <View style={styles.optionsList}>
            {availableCocks.map((c) => {
              const isSelected = c.id === selectedCockId;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.birdOption, isSelected && styles.birdOptionSelected]}
                  onPress={() => setSelectedCockId(c.id)}
                  accessibilityRole="button"
                >
                  <Text style={[styles.ringText, isSelected && styles.ringTextSelected]}>
                    ♂ {c.ring}
                  </Text>
                  {c.name && <Text style={styles.birdSubText}>{c.name}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Wybór Samicy */}
          <Text style={styles.sectionHeader}>2. Wybierz Samicę (0.1 ♀):</Text>
          <View style={styles.optionsList}>
            {availableHens.map((h) => {
              const isSelected = h.id === selectedHenId;
              return (
                <TouchableOpacity
                  key={h.id}
                  style={[styles.birdOption, isSelected && styles.birdOptionSelected]}
                  onPress={() => setSelectedHenId(h.id)}
                  accessibilityRole="button"
                >
                  <Text style={[styles.ringText, isSelected && styles.ringTextSelected]}>
                    ♀ {h.ring}
                  </Text>
                  {h.name && <Text style={styles.birdSubText}>{h.name}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Analiza Inbredu Wrighta */}
          <View
            style={[
              styles.inbreedingBox,
              isSafe ? styles.boxSafe : styles.boxWarning,
            ]}
          >
            <View style={styles.inbreedingHeader}>
              <Text style={styles.inbreedingTitle}>Współczynnik Inbredu Sewalla Wrighta (F):</Text>
              <Text style={styles.inbreedingValue}>{inbreedingPct}%</Text>
            </View>
            <Text style={styles.inbreedingDesc}>
              {isSafe
                ? 'Bezpieczny dobór genetyczny (brak bliskiego pokrewieństwa w 4 pokoleniach wstecz).'
                : inbreedingResult.warningMessage || 'Wykryto bliski inbred! Ryzyko depresji inbredowej.'}
            </Text>
          </View>


          {/* Akcja Zapisz */}
          <FieldButton
            title="✓ Zatwierdź Parę i Rozpocznij Lęg"
            onPress={handleConfirm}
            style={{ marginTop: 20 }}
            testID="btn-confirm-pairing"
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  rowInputs: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 12,
    height: 48,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E2E8F0',
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsList: {
    gap: 8,
    marginBottom: 14,
  },
  birdOption: {
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  birdOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#1E3A8A',
  },
  ringText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F1F5F9',
  },
  ringTextSelected: {
    color: '#FFFFFF',
  },
  birdSubText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  inbreedingBox: {
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
  },
  boxSafe: {
    backgroundColor: '#064E3B',
    borderColor: '#059669',
  },
  boxWarning: {
    backgroundColor: '#451A03',
    borderColor: '#D97706',
  },
  inbreedingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inbreedingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  inbreedingValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FBBF24',
  },
  inbreedingDesc: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
  },
});

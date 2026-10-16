/**
 * PIGEON-FLY — AddFeedingLogModal
 * Modal to record custom feeding sessions, grain mixes, and supplements in the drinker.
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { AnnualLoftPhase } from '../domain/nutrition';
import { FeedingLog } from '../domain/types';
import { FieldButton } from './FieldButton';

export interface AddFeedingLogModalProps {
  visible: boolean;
  onClose: () => void;
  defaultPhase?: AnnualLoftPhase;
  onSave: (log: Omit<FeedingLog, 'id' | 'createdAt'>) => Promise<void> | void;
}

export function AddFeedingLogModal({
  visible,
  onClose,
  defaultPhase = 'racing_widowhood',
  onSave,
}: AddFeedingLogModalProps) {
  const [phase, setPhase] = useState<AnnualLoftPhase>(defaultPhase);
  const [mixName, setMixName] = useState('');
  const [waterSupplements, setWaterSupplements] = useState('');
  const [feedSupplements, setFeedSupplements] = useState('');

  const phases: { id: AnnualLoftPhase; label: string }[] = [
    { id: 'racing_widowhood', label: 'Loty (Wdowieństwo)' },
    { id: 'breeding_reproduction', label: 'Lęgi i Wychów' },
    { id: 'autumn_moult', label: 'Wielkie Pierzenie' },
    { id: 'winter_rest', label: 'Zimowanie' },
  ];

  const handleSave = async () => {
    if (!mixName.trim()) {
      Alert.alert('Brak nazwy karmy', 'Podaj użytą mieszankę lub rodzaj karmy.');
      return;
    }

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    await onSave({
      loftId: 'loft-01',
      date: new Date().toISOString().slice(0, 10),
      phase,
      mixName: mixName.trim(),
      waterSupplements: waterSupplements.trim() || undefined,
      feedSupplements: feedSupplements.trim() || undefined,
    });

    setMixName('');
    setWaterSupplements('');
    setFeedSupplements('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.title}>DZIENNIK ŻYWIENIA I SUPLEMENTACJI</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Phase Selector */}
            <Text style={styles.label}>FAZA ROZWOJOWA STADA:</Text>
            <View style={styles.chipsRow}>
              {phases.map((p) => {
                const isSelected = phase === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setPhase(p.id)}
                    style={[styles.chip, isSelected && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Mix Name */}
            <Text style={styles.label}>MIESZANKA / ZIARNO (KARMIDŁO):</Text>
            <TextInput
              style={styles.input}
              placeholder="np. Kardi + orzeszki ziemne (ładowanie tłuszczem)"
              placeholderTextColor="#717886"
              value={mixName}
              onChangeText={setMixName}
            />

            {/* Water Supplements */}
            <Text style={[styles.label, { color: '#64B5F6' }]}>POIDŁO (DODATKI DO WODY):</Text>
            <TextInput
              style={styles.input}
              placeholder="np. Elektrolity, Zakwaszacz pH 4.2, Czosnek..."
              placeholderTextColor="#717886"
              value={waterSupplements}
              onChangeText={setWaterSupplements}
            />

            {/* Feed Supplements */}
            <Text style={[styles.label, { color: '#81C784' }]}>ZWILŻANIE KARMY / SUPLEMENTY:</Text>
            <TextInput
              style={styles.input}
              placeholder="np. Drożdże piwne na oleju z ostropestu plamistego..."
              placeholderTextColor="#717886"
              value={feedSupplements}
              onChangeText={setFeedSupplements}
            />

            {/* Save Button */}
            <FieldButton
              title="ZAPISZ DZIENNIK KARMIENIA"
              onPress={handleSave}
              style={{ marginTop: 20 }}
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1E2127',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 36,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2B2F38',
    paddingBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '900',
    color: '#E5A93C',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2E38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#D4D8E0',
    fontSize: 16,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#A0A6B2',
    marginBottom: 6,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  chip: {
    backgroundColor: '#15171B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  chipActive: {
    backgroundColor: '#E5A93C',
    borderColor: '#E5A93C',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A0A6B2',
  },
  chipTextActive: {
    color: '#121417',
  },
  input: {
    backgroundColor: '#15171B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2F343F',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 4,
  },
});

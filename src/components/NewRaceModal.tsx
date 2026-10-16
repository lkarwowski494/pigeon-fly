/**
 * PIGEON-FLY — NewRaceModal
 * Modal to configure and launch a new competition race or training toss.
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
import { FieldButton } from './FieldButton';

export interface NewRaceModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveRace: (data: {
    name: string;
    releaseName: string;
    distanceKm: number;
    releaseTimeIso: string;
    isTraining: boolean;
  }) => Promise<void> | void;
}

export function NewRaceModal({ visible, onClose, onSaveRace }: NewRaceModalProps) {
  const [name, setName] = useState('Lot Konkursowy');
  const [releaseName, setReleaseName] = useState('Magdeburg (Niemcy)');
  const [distanceKm, setDistanceKm] = useState('345.2');
  const [releaseTime, setReleaseTime] = useState('06:30:00');
  const [isTraining, setIsTraining] = useState(false);

  const presets = [
    { name: 'Magdeburg (Niemcy)', km: '345.2', training: false },
    { name: 'Bruksela (Belgia)', km: '780.0', training: false },
    { name: 'Rawicz (Trening)', km: '35.0', training: true },
    { name: 'Wrocław (Trening)', km: '75.0', training: true },
  ];

  const handleSave = async () => {
    const dist = parseFloat(distanceKm);
    if (!name.trim() || !releaseName.trim() || isNaN(dist) || dist <= 0) {
      Alert.alert('Błędne dane', 'Podaj poprawną nazwę lotu, punkt wypuszczenia i dystans.');
      return;
    }

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const today = new Date().toISOString().slice(0, 10);
    const releaseIso = new Date(`${today}T${releaseTime}Z`).toISOString();

    await onSaveRace({
      name: name.trim(),
      releaseName: releaseName.trim(),
      distanceKm: dist,
      releaseTimeIso: releaseIso,
      isTraining,
    });

    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.title}>NOWY LOT / TRENING</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Presets */}
            <Text style={styles.label}>SZABLONY SZYBKIEGO WYBORU:</Text>
            <View style={styles.presetsRow}>
              {presets.map((p, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setReleaseName(p.name);
                    setName(p.training ? 'Trening z gołębnika' : `Lot: ${p.name.split(' ')[0]}`);
                    setDistanceKm(p.km);
                    setIsTraining(p.training);
                  }}
                  style={styles.presetChip}
                >
                  <Text style={styles.presetText}>
                    {p.name} ({p.km} km)
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Type selector */}
            <Text style={styles.label}>TYP WYDARZENIA:</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                onPress={() => setIsTraining(false)}
                style={[styles.typeBtn, !isTraining && styles.typeBtnActive]}
              >
                <Text style={[styles.typeBtnText, !isTraining && styles.typeBtnTextActive]}>
                  🏆 Lot Konkursowy (PZHGP / FCI)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsTraining(true)}
                style={[styles.typeBtn, isTraining && styles.typeBtnActive]}
              >
                <Text style={[styles.typeBtnText, isTraining && styles.typeBtnTextActive]}>
                  🧭 Trening Stada
                </Text>
              </TouchableOpacity>
            </View>

            {/* Race Name */}
            <Text style={styles.label}>NAZWA LOTU:</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="np. Magdeburg I"
              placeholderTextColor="#717886"
            />

            {/* Release Location */}
            <Text style={styles.label}>MIEJSCE WYPUSZCZENIA (KRAJ / MIEJSCOWOŚĆ):</Text>
            <TextInput
              style={styles.input}
              value={releaseName}
              onChangeText={setReleaseName}
              placeholder="np. Magdeburg (Niemcy)"
              placeholderTextColor="#717886"
            />

            {/* Distance & Time */}
            <View style={styles.twoCols}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>DYSTANS (KM):</Text>
                <TextInput
                  style={styles.input}
                  value={distanceKm}
                  onChangeText={setDistanceKm}
                  keyboardType="decimal-pad"
                  placeholder="345.2"
                  placeholderTextColor="#717886"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.label}>GODZ. STARTU (HH:mm:ss):</Text>
                <TextInput
                  style={styles.input}
                  value={releaseTime}
                  onChangeText={setReleaseTime}
                  placeholder="06:30:00"
                  placeholderTextColor="#717886"
                />
              </View>
            </View>

            {/* Submit */}
            <FieldButton
              title="AKTYWUJ LOT I ROZPOCZNIJ ODLICZANIE"
              onPress={handleSave}
              style={{ marginTop: 18 }}
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
    fontSize: 16,
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
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  presetChip: {
    backgroundColor: '#15171B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  presetText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E5A93C',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: '#15171B',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  typeBtnActive: {
    backgroundColor: '#2A2518',
    borderColor: '#E5A93C',
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E94A0',
  },
  typeBtnTextActive: {
    color: '#E5A93C',
    fontWeight: '800',
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
  twoCols: {
    flexDirection: 'row',
  },
});

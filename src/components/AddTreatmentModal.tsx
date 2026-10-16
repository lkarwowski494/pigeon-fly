/**
 * PIGEON-FLY — AddTreatmentModal
 * Field Mode modal for recording veterinary treatments, vaccines, and medications
 * with automatic withdrawal period (karencja) calculation.
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
import { HealthEventType, HealthLog } from '../domain/types';
import { FieldButton } from './FieldButton';

export interface AddTreatmentModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (log: Omit<HealthLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void> | void;
  defaultRingNumber?: string;
}

export function AddTreatmentModal({
  visible,
  onClose,
  onSave,
  defaultRingNumber,
}: AddTreatmentModalProps) {
  const [eventType, setEventType] = useState<HealthEventType>('vaccine');
  const [productName, setProductName] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [targetScope, setTargetScope] = useState<'flock' | 'individual'>(
    defaultRingNumber ? 'individual' : 'flock'
  );
  const [ringNumber, setRingNumber] = useState(defaultRingNumber || '');
  const [withdrawalDays, setWithdrawalDays] = useState('0');
  const [notes, setNotes] = useState('');

  const eventTypes: { type: HealthEventType; label: string }[] = [
    { type: 'vaccine', label: 'Szczepienie' },
    { type: 'deworming', label: 'Odrobaczanie' },
    { type: 'antibiotic', label: 'Antybiotyk' },
    { type: 'supplement', label: 'Witaminy / Grity' },
    { type: 'treatment', label: 'Inne leczenie' },
  ];

  const handleSave = async () => {
    if (!productName.trim()) {
      Alert.alert('Brak nazwy preparatu', 'Podaj nazwę leku lub szczepionki.');
      return;
    }

    const parsedWithdrawal = parseInt(withdrawalDays, 10);
    const validWithdrawal = isNaN(parsedWithdrawal) ? 0 : Math.max(0, parsedWithdrawal);

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    await onSave({
      loftId: 'loft-01',
      pigeonId: targetScope === 'individual' ? ringNumber.trim() : undefined,
      eventType,
      date: new Date().toISOString().slice(0, 10),
      productName: productName.trim(),
      batchNumber: batchNumber.trim() || undefined,
      withdrawalDays: validWithdrawal,
      notes: notes.trim() || undefined,
    });

    // Reset and close
    setProductName('');
    setBatchNumber('');
    setNotes('');
    setWithdrawalDays('0');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.title}>NOWY ZABIEG / LEK</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Event Type selector */}
            <Text style={styles.label}>RODZAJ ZABIEGU:</Text>
            <View style={styles.chipsRow}>
              {eventTypes.map((item) => {
                const isSelected = eventType === item.type;
                return (
                  <TouchableOpacity
                    key={item.type}
                    onPress={() => {
                      setEventType(item.type);
                      if (item.type === 'antibiotic' && withdrawalDays === '0') {
                        setWithdrawalDays('7');
                      }
                    }}
                    style={[styles.chip, isSelected && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Product Name */}
            <Text style={styles.label}>NAZWA PREPARATU / LEKU:</Text>
            <TextInput
              style={styles.input}
              placeholder="np. Pharmavac Columbi 2, Ronidazole..."
              placeholderTextColor="#717886"
              value={productName}
              onChangeText={setProductName}
            />

            {/* Batch Number */}
            <Text style={styles.label}>NUMER SERII / PARTII (PIW):</Text>
            <TextInput
              style={styles.input}
              placeholder="np. LOT-2026-09A (opcjonalnie)"
              placeholderTextColor="#717886"
              value={batchNumber}
              onChangeText={setBatchNumber}
              autoCapitalize="characters"
            />

            {/* Scope: Flock vs Single Bird */}
            <Text style={styles.label}>ZAKRES PODAŻY:</Text>
            <View style={styles.scopeRow}>
              <TouchableOpacity
                onPress={() => setTargetScope('flock')}
                style={[styles.scopeBtn, targetScope === 'flock' && styles.scopeBtnActive]}
              >
                <Text style={[styles.scopeText, targetScope === 'flock' && styles.scopeTextActive]}>
                  Całe stado
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTargetScope('individual')}
                style={[styles.scopeBtn, targetScope === 'individual' && styles.scopeBtnActive]}
              >
                <Text style={[styles.scopeText, targetScope === 'individual' && styles.scopeTextActive]}>
                  Pojedynczy gołąb
                </Text>
              </TouchableOpacity>
            </View>

            {targetScope === 'individual' && (
              <>
                <Text style={styles.label}>NUMER OBRĄCZKI PTAKA:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="np. PL-0284-23-1402"
                  placeholderTextColor="#717886"
                  value={ringNumber}
                  onChangeText={setRingNumber}
                  autoCapitalize="characters"
                />
              </>
            )}

            {/* Withdrawal Days */}
            <Text style={styles.label}>OKRES KARENCJI (DNI PRZED LOTEM):</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#717886"
              value={withdrawalDays}
              onChangeText={setWithdrawalDays}
              keyboardType="numeric"
            />
            {parseInt(withdrawalDays, 10) > 0 && (
              <Text style={styles.withdrawalWarning}>
                ⚠️ Ptaki objęte karencją nie mogą być koszowane na lot konkursowy przez {withdrawalDays} dni!
              </Text>
            )}

            {/* Notes */}
            <Text style={styles.label}>DAWKOWANIE / UWAGI:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="np. 5g na 1 litr wody przez 3 dni..."
              placeholderTextColor="#717886"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            {/* Save Button */}
            <FieldButton
              title="ZAPISZ W KSIĘDZE LECZENIA"
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
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  scopeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  scopeBtn: {
    flex: 1,
    backgroundColor: '#15171B',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2F343F',
    alignItems: 'center',
  },
  scopeBtnActive: {
    borderColor: '#E5A93C',
    backgroundColor: '#2A261A',
  },
  scopeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E94A0',
  },
  scopeTextActive: {
    color: '#E5A93C',
  },
  withdrawalWarning: {
    fontSize: 12,
    color: '#FF8A80',
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 6,
    lineHeight: 16,
  },
});

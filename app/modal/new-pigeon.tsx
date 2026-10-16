/**
 * PIGEON-FLY — Dodaj Ptaka (Modal Form)
 * Fast form to add a new pigeon to the local flock digital notebook.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FieldButton } from '../../src/components/FieldButton';
import { Sex, PigeonStatus } from '../../src/domain/types';

export default function NewPigeonModal() {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState('PL');
  const [ringNumber, setRingNumber] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [sex, setSex] = useState<Sex>('cock');
  const [plumageColor, setPlumageColor] = useState('Niebieski');
  const [status, setStatus] = useState<PigeonStatus>('racing');

  const handleSave = () => {
    if (!ringNumber.trim()) {
      Alert.alert('Brak numeru obrączki', 'Podaj numer oficjalnej obrączki rodowej ptaka.');
      return;
    }

    Alert.alert('Sukces', `Ptak ${countryCode}-${ringNumber} został zapisany w notesie stada.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Kraj i Numer Obrączki Rodowej:</Text>
          <View style={styles.ringRow}>
            <TextInput
              style={[styles.input, styles.countryInput]}
              value={countryCode}
              onChangeText={setCountryCode}
              maxLength={4}
              autoCapitalize="characters"
              placeholder="PL"
              placeholderTextColor="#8E94A0"
            />
            <TextInput
              style={[styles.input, styles.ringInput]}
              value={ringNumber}
              onChangeText={setRingNumber}
              placeholder="0284-24-1234"
              placeholderTextColor="#8E94A0"
              autoCapitalize="characters"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Rocznik:</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={year}
            onChangeText={setYear}
            maxLength={4}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Płeć:</Text>
          <View style={styles.optionsRow}>
            <FieldButton
              title="Samiec (♂)"
              variant={sex === 'cock' ? 'primary' : 'secondary'}
              onPress={() => setSex('cock')}
              style={styles.optionBtn}
              textStyle={{ fontSize: 15 }}
            />
            <View style={{ width: 10 }} />
            <FieldButton
              title="Samica (♀)"
              variant={sex === 'hen' ? 'primary' : 'secondary'}
              onPress={() => setSex('hen')}
              style={styles.optionBtn}
              textStyle={{ fontSize: 15 }}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Barwa Upierzenia:</Text>
          <TextInput
            style={styles.input}
            value={plumageColor}
            onChangeText={setPlumageColor}
            placeholder="np. Ciemny nakrapiany, Szpak, Pstry"
            placeholderTextColor="#8E94A0"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Przeznaczenie (Status):</Text>
          <View style={styles.optionsRow}>
            <FieldButton
              title="Lotowy"
              variant={status === 'racing' ? 'primary' : 'secondary'}
              onPress={() => setStatus('racing')}
              style={styles.optionBtn}
              textStyle={{ fontSize: 15 }}
            />
            <View style={{ width: 10 }} />
            <FieldButton
              title="Rozpłodowy"
              variant={status === 'breeding' ? 'primary' : 'secondary'}
              onPress={() => setStatus('breeding')}
              style={styles.optionBtn}
              textStyle={{ fontSize: 15 }}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <FieldButton
            title="Zapisz Ptaka w Notesie"
            onPress={handleSave}
            testID="btn-save-new-pigeon"
          />
          <View style={{ height: 12 }} />
          <FieldButton
            title="Anuluj"
            variant="secondary"
            onPress={() => router.back()}
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
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4D8E0',
    marginBottom: 8,
  },
  ringRow: {
    flexDirection: 'row',
  },
  countryInput: {
    width: 70,
    marginRight: 10,
    textAlign: 'center',
    fontWeight: '800',
    color: '#E5A93C',
  },
  ringInput: {
    flex: 1,
  },
  input: {
    backgroundColor: '#1E2127',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3D424D',
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: 14,
    height: 52,
    fontFamily: 'monospace',
  },
  optionsRow: {
    flexDirection: 'row',
  },
  optionBtn: {
    flex: 1,
    minHeight: 46,
    paddingVertical: 10,
  },
  actionsContainer: {
    marginTop: 20,
    paddingBottom: 24,
  },
});

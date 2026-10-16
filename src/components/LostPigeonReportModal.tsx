/**
 * PIGEON-FLY — LostPigeonReportModal (BR-SKAN-008)
 * Emergency Lost & Found rescue manager for drifted or exhausted pigeons.
 * Privacy-safe finder contact, drift distance from home loft ($d_{\text{drift}}$),
 * and one-tap recovery resolution.
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  LostBirdRescueReport,
  createRescueReport,
  resolveRescueReport,
  maskBreederProfileForFinder,
} from '../domain/lostAndFound';
import { FieldButton } from './FieldButton';

export interface LostPigeonReportModalProps {
  visible: boolean;
  onClose: () => void;
  reports?: LostBirdRescueReport[];
  loftCoordinates?: { latitude: number; longitude: number };
}

const DEFAULT_DEMO_REPORTS: LostBirdRescueReport[] = [
  {
    id: 'sos-01',
    pigeonId: 'p-01',
    ringNumber: 'PL-0284-23-1402',
    qrCodeUuid: 'uuid-1402-pigeonfly',
    reportedAtIso: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 90 min ago
    finderName: 'Karolina Wiśniewska',
    finderPhone: '+48 601 234 567',
    finderEmail: 'karolina@example.com',
    finderAddressHint: 'Poznań, Rataje (os. Piastowskie) — znaleziony na parapecie',
    finderNotes: 'Ptak był przemoczony po ulewie. Dostał wodę z odrobiną cukru i pszenicę. Siedzi spokojnie w kartonie.',
    driftDistanceKm: 64.2,
    isResolved: false,
  },
];

export function LostPigeonReportModal({
  visible,
  onClose,
  reports,
  loftCoordinates = { latitude: 51.88, longitude: 17.02 },
}: LostPigeonReportModalProps) {
  const [activeReports, setActiveReports] = useState<LostBirdRescueReport[]>(
    reports || DEFAULT_DEMO_REPORTS
  );
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form state for reporting newly found bird
  const [ringNumber, setRingNumber] = useState('');
  const [finderName, setFinderName] = useState('');
  const [finderPhone, setFinderPhone] = useState('');
  const [addressHint, setAddressHint] = useState('');
  const [notes, setNotes] = useState('');

  const handleCallFinder = (phone: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Zadzwoń do Znalazcy', `Numer kontaktowy: ${phone}`);
    });
  };

  const handleResolve = (reportId: string) => {
    setActiveReports((prev) =>
      prev.map((r) => (r.id === reportId ? resolveRescueReport(r) : r))
    );
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    Alert.alert('Sukces!', 'Ptak został pomyślnie oznaczony jako odzyskany i bezpieczny w gołębniku.');
  };

  const handleCreateNewReport = () => {
    if (!ringNumber.trim() || !finderPhone.trim()) {
      Alert.alert('Brakujące dane', 'Podaj numer obrączki ptaka oraz telefon kontaktowy znalazcy.');
      return;
    }

    const newReport = createRescueReport({
      pigeonId: `p-${Date.now()}`,
      ringNumber: ringNumber.trim().toUpperCase(),
      qrCodeUuid: `uuid-${Date.now()}`,
      finderName: finderName.trim(),
      finderPhone: finderPhone.trim(),
      finderAddressHint: addressHint.trim(),
      finderNotes: notes.trim(),
      driftDistanceKm: 42.5,
      loftCoordinates,
    });

    setActiveReports([newReport, ...activeReports]);
    setIsAddingNew(false);
    setRingNumber('');
    setFinderName('');
    setFinderPhone('');
    setAddressHint('');
    setNotes('');

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    Alert.alert(
      'Zarejestrowano Zgłoszenie SOS!',
      `Zgłoszenie odnalezienia ptaka ${newReport.ringNumber} zostało zapisane w rejestrze stada.`
    );
  };

  const activeAlerts = activeReports.filter((r) => !r.isResolved);
  const resolvedAlerts = activeReports.filter((r) => r.isResolved);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <View style={styles.sosPill}>
                  <Text style={styles.sosDot}>●</Text>
                  <Text style={styles.sosText}>PORTAL RATUNKOWY SOS</Text>
                </View>
                <Text style={styles.title}>ZAGUBIONE I ODNALEZIONE PTAKI</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="btn-close-sos">
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Action Bar */}
            <View style={styles.topActionsRow}>
              <FieldButton
                title={isAddingNew ? 'Anuluj Dodawanie' : '+ Zgłoś Odnalezionego Ptaka'}
                onPress={() => setIsAddingNew(!isAddingNew)}
                variant={isAddingNew ? 'secondary' : 'primary'}
                style={{ flex: 1 }}
                testID="btn-toggle-add-report"
              />
            </View>

            {/* Form for manual found bird intake */}
            {isAddingNew && (
              <View style={styles.newReportCard}>
                <Text style={styles.formTitle}>NOWE ZGŁOSZENIE Z TERENU</Text>
                <Text style={styles.inputLabel}>Numer obrączki ptaka:</Text>
                <TextInput
                  style={styles.textInput}
                  value={ringNumber}
                  onChangeText={setRingNumber}
                  placeholder="np. PL-0284-24-5555"
                  placeholderTextColor="#8E94A0"
                  autoCapitalize="characters"
                />

                <Text style={styles.inputLabel}>Imię i nazwisko znalazcy:</Text>
                <TextInput
                  style={styles.textInput}
                  value={finderName}
                  onChangeText={setFinderName}
                  placeholder="np. Karolina Wiśniewska"
                  placeholderTextColor="#8E94A0"
                />

                <Text style={styles.inputLabel}>Numer telefonu do kontaktu:</Text>
                <TextInput
                  style={styles.textInput}
                  value={finderPhone}
                  onChangeText={setFinderPhone}
                  placeholder="+48 600 000 000"
                  placeholderTextColor="#8E94A0"
                  keyboardType="phone-pad"
                />

                <Text style={styles.inputLabel}>Miejscowość / Adres odnalezienia:</Text>
                <TextInput
                  style={styles.textInput}
                  value={addressHint}
                  onChangeText={setAddressHint}
                  placeholder="np. Poznań, ul. Grunwaldzka"
                  placeholderTextColor="#8E94A0"
                />

                <Text style={styles.inputLabel}>Stan ptaka / Notatki:</Text>
                <TextInput
                  style={[styles.textInput, { height: 70 }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="np. Zmęczony po locie, pije wodę, odpoczywa w altanie"
                  placeholderTextColor="#8E94A0"
                  multiline
                />

                <FieldButton
                  title="Zapisz Zgłoszenie Ratunkowe"
                  onPress={handleCreateNewReport}
                  variant="primary"
                  testID="btn-submit-report"
                />
              </View>
            )}

            {/* Active Alerts Section */}
            <Text style={styles.sectionHeading}>
              AKTYWNE ALARMY RATUNKOWE ({activeAlerts.length})
            </Text>

            {activeAlerts.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Brak aktywnych zagubień</Text>
                <Text style={styles.emptySubtitle}>
                  Wszystkie zgłoszone ptaki powróciły do macierzystego gołębnika.
                </Text>
              </View>
            ) : (
              activeAlerts.map((report) => (
                <View key={report.id} style={styles.reportCard}>
                  <View style={styles.reportHeader}>
                    <View>
                      <Text style={styles.reportRing}>{report.ringNumber}</Text>
                      <Text style={styles.reportTime}>
                        Zgłoszono: {new Date(report.reportedAtIso).toLocaleTimeString('pl-PL')}, {new Date(report.reportedAtIso).toLocaleDateString('pl-PL')}
                      </Text>
                    </View>
                    {report.driftDistanceKm !== undefined && (
                      <View style={styles.driftBadge}>
                        <Text style={styles.driftText}>Znos: ~{report.driftDistanceKm} km</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.finderInfoBox}>
                    <Text style={styles.finderName}>
                      👤 Znalazca: {report.finderName || 'Osoba prywatna'}
                    </Text>
                    {report.finderAddressHint && (
                      <Text style={styles.finderLocation}>
                        📍 Lokalizacja: {report.finderAddressHint}
                      </Text>
                    )}
                    {report.finderNotes && (
                      <Text style={styles.finderNotes}>
                        💬 „{report.finderNotes}”
                      </Text>
                    )}
                  </View>

                  {/* Actions Row */}
                  <View style={styles.reportActionsRow}>
                    <FieldButton
                      title={`📞 Zadzwoń (${report.finderPhone})`}
                      onPress={() => handleCallFinder(report.finderPhone)}
                      variant="primary"
                      style={{ flex: 1, marginRight: 8 }}
                      testID={`btn-call-${report.id}`}
                    />
                    <FieldButton
                      title="✓ Odzyskany"
                      onPress={() => handleResolve(report.id)}
                      variant="secondary"
                      style={{ minWidth: 105 }}
                      testID={`btn-resolve-${report.id}`}
                    />
                  </View>
                </View>
              ))
            )}

            {/* First Aid Box for finders */}
            <View style={styles.aidCard}>
              <Text style={styles.aidTitle}>🕊️ PROTOKÓŁ PIERWSZEJ POMOCY DLA ZNALAZCY</Text>
              <Text style={styles.aidText}>
                1. Napoić ptaka letnią wodą (można rozpuścić łyżeczkę cukru lub miodu na szklankę).{'\n'}
                2. Podać ziarna zbóż (pszenica, ryż, kasza jęczmienna). Nie podawać chleba ani mleka!{'\n'}
                3. Zapewnić bezpieczne schronienie przed kotami i drapieżnikami na 24–48 godzin.
              </Text>
            </View>

            {/* Resolved Alerts List */}
            {resolvedAlerts.length > 0 && (
              <>
                <Text style={styles.sectionHeading}>
                  HISTORIA ZAKOŃCZONYCH AKCJI RATUNKOWYCH ({resolvedAlerts.length})
                </Text>
                {resolvedAlerts.map((res) => (
                  <View key={res.id} style={styles.resolvedCard}>
                    <Text style={styles.resolvedRing}>{res.ringNumber}</Text>
                    <Text style={styles.resolvedMeta}>
                      Znalazca: {res.finderName} • Bezpiecznie powrócił do stada.
                    </Text>
                  </View>
                ))}
              </>
            )}

            <FieldButton
              title="Zamknij Portal Ratunkowy"
              onPress={onClose}
              variant="secondary"
              style={{ marginTop: 14 }}
              testID="btn-close-sos-bottom"
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
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1E2127',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '94%',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sosPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 57, 53, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E53935',
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  sosDot: {
    color: '#E53935',
    fontSize: 10,
    marginRight: 4,
  },
  sosText: {
    color: '#E53935',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 8,
  },
  closeText: {
    fontSize: 22,
    color: '#8E94A0',
    fontWeight: '800',
  },
  topActionsRow: {
    marginBottom: 14,
  },
  newReportCard: {
    backgroundColor: '#15171C',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E53935',
    padding: 14,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4D8E0',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#1E2127',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#373D4B',
    color: '#FFFFFF',
    fontSize: 14,
    paddingHorizontal: 10,
    height: 42,
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E94A0',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  emptyCard: {
    backgroundColor: '#15171C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#81C784',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#8E94A0',
    textAlign: 'center',
  },
  reportCard: {
    backgroundColor: '#15171C',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E53935',
    padding: 14,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reportRing: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  reportTime: {
    fontSize: 10,
    color: '#8E94A0',
    marginTop: 2,
  },
  driftBadge: {
    backgroundColor: '#2A2417',
    borderWidth: 1,
    borderColor: '#E5A93C',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  driftText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E5A93C',
  },
  finderInfoBox: {
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  finderName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  finderLocation: {
    fontSize: 11,
    color: '#64B5F6',
    marginBottom: 4,
  },
  finderNotes: {
    fontSize: 11,
    color: '#A0A6B2',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  reportActionsRow: {
    flexDirection: 'row',
  },
  aidCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
    padding: 14,
    marginBottom: 14,
  },
  aidTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64B5F6',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  aidText: {
    fontSize: 11,
    color: '#A0A6B2',
    lineHeight: 18,
  },
  resolvedCard: {
    backgroundColor: '#15171C',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2F343F',
    padding: 10,
    marginBottom: 6,
  },
  resolvedRing: {
    fontSize: 12,
    fontWeight: '800',
    color: '#81C784',
    fontFamily: 'monospace',
  },
  resolvedMeta: {
    fontSize: 10,
    color: '#8E94A0',
    marginTop: 2,
  },
});

/**
 * PIGEON-FLY — Electronic Clock Import Modal (Z-050)
 * Allows breeders to paste or load arrival logs from Tauris, Benzing, Bricon, and Mega clocks,
 * inspect parsed arrival times, speeds, and antenna hits, and import them directly into the race leaderboard.
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
} from 'react-native';
import {
  parseEskArrivalFile,
  matchEskWithBasketed,
  EskClockBrand,
  EskArrivalRecord,
  SAMPLE_ESK_FILES,
} from '../domain/eskImport';
import { BasketEntry } from '../domain/basketing';
import { ArrivalWithPigeon } from '../db/raceRepository';

interface EskImportModalProps {
  visible: boolean;
  onClose: () => void;
  raceDistanceMeters: number;
  releaseTimeIso: string;
  raceName: string;
  basketedEntries?: BasketEntry[];
  onImportArrivals: (arrivals: ArrivalWithPigeon[]) => void;
}

export const EskImportModal: React.FC<EskImportModalProps> = ({
  visible,
  onClose,
  raceDistanceMeters,
  releaseTimeIso,
  raceName,
  basketedEntries = [],
  onImportArrivals,
}) => {
  const [selectedBrand, setSelectedBrand] = useState<EskClockBrand>('unknown');
  const [fileContent, setFileContent] = useState('');
  const [parsedRecords, setParsedRecords] = useState<EskArrivalRecord[]>([]);
  const [summaryText, setSummaryText] = useState('');
  const [arrivalsToImport, setArrivalsToImport] = useState<ArrivalWithPigeon[]>([]);
  const [detectedBrand, setDetectedBrand] = useState<EskClockBrand>('unknown');

  const handleLoadSample = (brand: 'tauris' | 'benzing' | 'bricon') => {
    setSelectedBrand(brand);
    setFileContent(SAMPLE_ESK_FILES[brand]);
    handleParse(SAMPLE_ESK_FILES[brand], brand);
  };

  const handleParse = (contentToParse?: string, brandOverride?: EskClockBrand) => {
    const text = contentToParse !== undefined ? contentToParse : fileContent;
    if (!text.trim()) {
      Alert.alert('Brak danych', 'Wklej treść pliku z zegara lub wybierz plik przykładowy.');
      return;
    }

    const brand = brandOverride !== undefined ? brandOverride : selectedBrand;
    const result = parseEskArrivalFile(text, {
      clockBrand: brand,
      raceDistanceMeters,
      releaseTimeIso,
    });

    setDetectedBrand(result.clockBrand);
    setParsedRecords(result.records);
    setSummaryText(result.summaryText);

    // Match with basket
    const matchResult = matchEskWithBasketed(result.records, basketedEntries, {
      releaseTimeIso,
      raceDistanceMeters,
    });

    setArrivalsToImport(matchResult.arrivalsToSave);
  };

  const handleCommitImport = () => {
    if (arrivalsToImport.length === 0) {
      Alert.alert('Brak przylotów', 'Brak prawidłowych przylotów do zaimportowania.');
      return;
    }

    onImportArrivals(arrivalsToImport);
    Alert.alert(
      'Sukces Importu ESK!',
      `Zaimportowano ${arrivalsToImport.length} przylotów z zegara ${detectedBrand.toUpperCase()} do listy konkursowej lotu ${raceName}.`
    );
    onClose();
  };

  const handleClear = () => {
    setFileContent('');
    setParsedRecords([]);
    setSummaryText('');
    setArrivalsToImport([]);
    setDetectedBrand('unknown');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>📥 Import z Zegara ESK</Text>
            <Text style={styles.subtitle}>
              {raceName} • {(raceDistanceMeters / 1000).toFixed(1)} km
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            testID="btn-close-esk-import"
            accessibilityRole="button"
          >
            <Text style={styles.closeBtnText}>✕ Zamknij</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Brand Selector */}
          <Text style={styles.sectionLabel}>Producent Zegara Elektronicznego:</Text>
          <View style={styles.brandRow}>
            {[
              { id: 'unknown', label: '🔍 Auto-Wykryj' },
              { id: 'tauris', label: 'Tauris' },
              { id: 'benzing', label: 'Benzing' },
              { id: 'bricon', label: 'Bricon' },
              { id: 'mega', label: 'Mega/Unikon' },
            ].map((b) => (
              <TouchableOpacity
                key={b.id}
                style={[
                  styles.brandPill,
                  selectedBrand === b.id && styles.brandPillActive,
                ]}
                onPress={() => setSelectedBrand(b.id as EskClockBrand)}
              >
                <Text
                  style={[
                    styles.brandPillText,
                    selectedBrand === b.id && styles.brandPillTextActive,
                  ]}
                >
                  {b.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Demo Loaders */}
          <View style={styles.demoBar}>
            <Text style={styles.demoTitle}>Przetestuj z plikiem testowym:</Text>
            <View style={styles.demoBtnRow}>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => handleLoadSample('tauris')}
                testID="btn-sample-tauris"
              >
                <Text style={styles.demoBtnText}>Tauris .DAT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => handleLoadSample('benzing')}
                testID="btn-sample-benzing"
              >
                <Text style={styles.demoBtnText}>Benzing CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => handleLoadSample('bricon')}
                testID="btn-sample-bricon"
              >
                <Text style={styles.demoBtnText}>Bricon TXT</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Text Area for clock log */}
          <Text style={styles.sectionLabel}>Zawartość Raportu Odbić z Zegara (.txt, .dat, .csv):</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={6}
            placeholder="Wklej tutaj treść raportu wydruku lub pliku CSV wyeksportowanego z zegara ESK..."
            placeholderTextColor="#718096"
            value={fileContent}
            onChangeText={setFileContent}
            testID="input-esk-content"
          />

          {/* Parse and Clear Buttons */}
          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              style={styles.parseBtn}
              onPress={() => handleParse()}
              testID="btn-parse-esk"
              accessibilityRole="button"
            >
              <Text style={styles.parseBtnText}>⚡ Parsuj i Sprawdź Dane</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Text style={styles.clearBtnText}>Wyczyść</Text>
            </TouchableOpacity>
          </View>

          {/* Summary Banner */}
          {summaryText ? (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>📊 Wynik Analizy Pliku:</Text>
              <Text style={styles.summaryContent}>{summaryText}</Text>
            </View>
          ) : null}

          {/* Parsed List */}
          {parsedRecords.length > 0 && (
            <View style={styles.recordsSection}>
              <Text style={styles.sectionLabel}>
                Odczytane Odbicia Anteny ({parsedRecords.length}):
              </Text>
              {parsedRecords.map((item, idx) => (
                <View
                  key={item.id || idx}
                  style={[
                    styles.recordCard,
                    item.status === 'duplicate' && styles.recordCardDuplicate,
                    item.status === 'time_paradox' && styles.recordCardParadox,
                  ]}
                >
                  <View style={styles.recordHeader}>
                    <Text style={styles.recordOrder}>#{item.orderIndex}</Text>
                    <Text style={styles.recordRing}>{item.ringNumber}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        item.status === 'valid' && styles.statusBadgeValid,
                        item.status === 'duplicate' && styles.statusBadgeDuplicate,
                        item.status === 'time_paradox' && styles.statusBadgeParadox,
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {item.status === 'valid'
                          ? 'PRAWIDŁOWY'
                          : item.status === 'duplicate'
                          ? 'DUPLIKAT ANTENY'
                          : item.status === 'time_paradox'
                          ? 'BŁĄD CZASU'
                          : item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.recordDetailsRow}>
                    <Text style={styles.recordDetail}>
                      ⏰ Czas: <Text style={styles.recordDetailBold}>{item.arrivalTime}</Text>
                    </Text>
                    {item.antenna && (
                      <Text style={styles.recordDetail}>
                        📡 Antena: <Text style={styles.recordDetailBold}>{item.antenna}</Text>
                      </Text>
                    )}
                    {(item.clockSpeedMPerMin || item.calculatedSpeedMPerMin) && (
                      <Text style={styles.recordDetail}>
                        ⚡ Prędkość:{' '}
                        <Text style={[styles.recordDetailBold, { color: '#E5A93C' }]}>
                          {(item.clockSpeedMPerMin || item.calculatedSpeedMPerMin)?.toFixed(2)} m/min
                        </Text>
                      </Text>
                    )}
                  </View>

                  {item.errorMessage && (
                    <Text style={styles.errorText}>⚠️ {item.errorMessage}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Spacer */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Footer Import Button */}
        {arrivalsToImport.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.importCommitBtn}
              onPress={handleCommitImport}
              testID="btn-commit-esk-import"
              accessibilityRole="button"
            >
              <Text style={styles.importCommitBtnText}>
                📥 ZATWIERDŹ IMPORT ({arrivalsToImport.length} PRZYLOTÓW)
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#334155',
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#F8FAFC',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 8,
    marginTop: 12,
  },
  brandRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  brandPill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 44,
    justifyContent: 'center',
  },
  brandPillActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#3B82F6',
  },
  brandPillText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  brandPillTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  demoBar: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  demoTitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
    fontWeight: '600',
  },
  demoBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  demoBtnText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#1E293B',
    color: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    fontSize: 13,
    fontFamily: 'monospace',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginBottom: 12,
  },
  parseBtn: {
    flex: 3,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    minHeight: 56, // Field Mode compliant
    justifyContent: 'center',
  },
  parseBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  clearBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  clearBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryBox: {
    backgroundColor: '#0F2942',
    borderColor: '#1E40AF',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  summaryTitle: {
    color: '#60A5FA',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  summaryContent: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 18,
  },
  recordsSection: {
    marginTop: 8,
  },
  recordCard: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  recordCardDuplicate: {
    borderLeftColor: '#F59E0B',
    opacity: 0.75,
  },
  recordCardParadox: {
    borderLeftColor: '#EF4444',
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  recordOrder: {
    fontSize: 12,
    color: '#94A3B8',
    marginRight: 8,
    fontWeight: 'bold',
  },
  recordRing: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#F8FAFC',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeValid: {
    backgroundColor: '#064E3B',
  },
  statusBadgeDuplicate: {
    backgroundColor: '#78350F',
  },
  statusBadgeParadox: {
    backgroundColor: '#7F1D1D',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  recordDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recordDetail: {
    fontSize: 12,
    color: '#94A3B8',
  },
  recordDetailBold: {
    color: '#F8FAFC',
    fontWeight: '600',
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  importCommitBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 56, // Field Mode compliant
    justifyContent: 'center',
  },
  importCommitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

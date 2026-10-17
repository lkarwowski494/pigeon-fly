/**
 * PIGEON-FLY — Geodezyjna Kalibracja Koordynat Gołębnika Modal (Z-067)
 * Weryfikacja dokładności geodezyjnej koordynat WGS-84, symulacja zysku/straty m/min i druk oświadczenia PZHGP.
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
  evaluateLoftGeodesy,
  formatDmsString,
  GeodesyCalibrationInput,
} from '../domain/loftGeodesy';
import { PdfService } from '../services/pdfService';

interface LoftGeodesyModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LoftGeodesyModal: React.FC<LoftGeodesyModalProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'coords' | 'simulation' | 'declaration'>('coords');

  const [input, setInput] = useState<GeodesyCalibrationInput>({
    loftName: 'Gołębnik Mistrza',
    breederName: 'Hodowca Pigeon-Fly',
    loftAddress: 'ul. Lotników 44, 05-500 Piaseczno',
    pzhgpBranch: '0284 Warszawa-Mokotów',
    pzhgpSection: 'Sekcja 2 Piaseczno',
    registeredCoords: {
      latitude: 52.083333,
      longitude: 21.033333,
    },
    measuredCoords: {
      latitude: 52.083450, // odchyłka ok. 13 m
      longitude: 21.033333,
    },
    simulatedRaceDistanceKm: 350,
    simulatedFlightTimeMinutes: 270,
  });

  const result = evaluateLoftGeodesy(input);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PERFECT_MATCH':
      case 'ACCEPTABLE_TOLERANCE':
        return '#4CAF50';
      case 'DISCREPANCY_WARNING':
        return '#E5A93C';
      case 'CRITICAL_MISMATCH':
        return '#E53935';
      default:
        return '#FFFFFF';
    }
  };

  const handleExportPdf = async (mode: 'print' | 'share') => {
    try {
      await PdfService.exportGeodeticLoftDeclaration(input, result, mode);
    } catch (e: any) {
      Alert.alert('Błąd eksportu', e?.message || 'Nie udało się wyeksportować oświadczenia geodezyjnego.');
    }
  };

  const statusColor = getStatusColor(result.toleranceStatus);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>📐 Geodezyjna Kalibracja Koordynat (Z-067)</Text>
              <Text style={styles.subTitle}>Tolerancja geodezyjna WGS-84 i oświadczenie dla Zarządu Oddziału PZHGP</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="btn-close-geodesy-modal">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Metrics Banner */}
          <View style={[styles.metricsBanner, { borderColor: statusColor }]}>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>ODCHYŁKA GPS</Text>
              <Text style={[styles.metricVal, { color: statusColor }]}>
                {result.deviationMeters} m
              </Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>WPŁYW NA PRĘDKOŚĆ</Text>
              <Text style={[styles.metricVal, { color: '#E5A93C' }]}>
                ±{result.velocityImpactMPerMin} m/min
              </Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>RÓŻNICA CZASU</Text>
              <Text style={styles.metricVal}>
                ±{result.timeOffsetSeconds} s
              </Text>
            </View>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'coords' && styles.tabBtnActive]}
              onPress={() => setActiveTab('coords')}
            >
              <Text style={[styles.tabText, activeTab === 'coords' && styles.tabTextActive]}>
                🗺️ Koordynaty WGS-84
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'simulation' && styles.tabBtnActive]}
              onPress={() => setActiveTab('simulation')}
            >
              <Text style={[styles.tabText, activeTab === 'simulation' && styles.tabTextActive]}>
                ⏱️ Wpływ na Prędkość
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'declaration' && styles.tabBtnActive]}
              onPress={() => setActiveTab('declaration')}
            >
              <Text style={[styles.tabText, activeTab === 'declaration' && styles.tabTextActive]}>
                📜 Oświadczenie PZHGP
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {activeTab === 'coords' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>I. KOORDYNATY ZAREJESTROWANE W WYKAZIE PZHGP</Text>
                </View>

                <View style={styles.inputCard}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Szerokość (Lat °N):</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={String(input.registeredCoords.latitude)}
                        onChangeText={(t) => setInput((p) => ({ ...p, registeredCoords: { ...p.registeredCoords, latitude: parseFloat(t) || 0 } }))}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Długość (Lon °E):</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={String(input.registeredCoords.longitude)}
                        onChangeText={(t) => setInput((p) => ({ ...p, registeredCoords: { ...p.registeredCoords, longitude: parseFloat(t) || 0 } }))}
                      />
                    </View>
                  </View>
                  <Text style={styles.dmsHint}>Format DMS: {formatDmsString(result.registeredDms)}</Text>
                </View>

                <View style={[styles.sectionHeader, { marginTop: 12 }]}>
                  <Text style={styles.sectionTitle}>II. NOWY POMIAR ODBIORNIKIEM GNSS / SMARTFONEM</Text>
                </View>

                <View style={styles.inputCard}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Zmierzona Lat (°N):</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={String(input.measuredCoords.latitude)}
                        onChangeText={(t) => setInput((p) => ({ ...p, measuredCoords: { ...p.measuredCoords, latitude: parseFloat(t) || 0 } }))}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Zmierzona Lon (°E):</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={String(input.measuredCoords.longitude)}
                        onChangeText={(t) => setInput((p) => ({ ...p, measuredCoords: { ...p.measuredCoords, longitude: parseFloat(t) || 0 } }))}
                      />
                    </View>
                  </View>
                  <Text style={styles.dmsHint}>Format DMS: {formatDmsString(result.measuredDms)}</Text>
                </View>

                {/* Status Box */}
                <View style={[styles.statusCard, { borderColor: statusColor }]}>
                  <Text style={styles.statusTitle}>OCENA DOKŁADNOŚCI GEODEZYJNEJ:</Text>
                  <Text style={[styles.statusHeading, { color: statusColor }]}>{result.toleranceStatusLabel}</Text>
                  <Text style={styles.statusDesc}>{result.recommendation}</Text>
                </View>
              </View>
            )}

            {activeTab === 'simulation' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>SYMULATOR WYPACZENIA PRĘDKOŚCI LOTU</Text>
                </View>

                <View style={styles.inputCard}>
                  <Text style={styles.inputLabel}>Dystans lotu konkursowego (km):</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={String(input.simulatedRaceDistanceKm || 350)}
                    onChangeText={(t) => setInput((p) => ({ ...p, simulatedRaceDistanceKm: parseFloat(t) || 100 }))}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Szacowany czas przelotu (minuty):</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={String(input.simulatedFlightTimeMinutes || 270)}
                    onChangeText={(t) => setInput((p) => ({ ...p, simulatedFlightTimeMinutes: parseFloat(t) || 60 }))}
                  />
                  <Text style={styles.dmsHint}>
                    270 minut = 4 godz. 30 min (średnia prędkość ~1296 m/min)
                  </Text>
                </View>

                {/* Wyniki Symulacji */}
                <View style={styles.simCard}>
                  <Text style={styles.simTitle}>WPŁYW BŁĘDU {result.deviationMeters} M NA WYNIK SPORTOWY:</Text>
                  <View style={styles.dividerH} />
                  <Text style={styles.simRow}>
                    • Zmiana obliczonej prędkości: <strong>±{result.velocityImpactMPerMin} m/min</strong>
                  </Text>
                  <Text style={styles.simRow}>
                    • Ekwiwalent czasowy na zegarze ESK: <strong>±{result.timeOffsetSeconds} sekundy</strong>
                  </Text>
                  <Text style={styles.simRow}>
                    • Przy zaciętej rywalizacji w Oddziale PZHGP, odchyłka rzędu 0.05–0.1 m/min decyduje o 5–15 pozycjach na liście konkursowej!
                  </Text>
                </View>
              </View>
            )}

            {activeTab === 'declaration' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>OŚWIADCZENIE DO ZARZĄDU ODDZIAŁU PZHGP</Text>
                </View>

                <View style={styles.inputCard}>
                  <Text style={styles.inputLabel}>Imię i nazwisko hodowcy:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={input.breederName}
                    onChangeText={(t) => setInput((p) => ({ ...p, breederName: t }))}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Adres gołębnika macierzystego:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={input.loftAddress}
                    onChangeText={(t) => setInput((p) => ({ ...p, loftAddress: t }))}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Oddział i Sekcja PZHGP:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={`${input.pzhgpBranch} • ${input.pzhgpSection}`}
                    onChangeText={(t) => setInput((p) => ({ ...p, pzhgpBranch: t }))}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.exportBtn, { backgroundColor: '#2E7D32' }]}
                  onPress={() => handleExportPdf('print')}
                  testID="btn-print-geodesy-declaration"
                >
                  <Text style={styles.exportBtnText}>🖨️ Drukuj Oświadczenie A4 (AirPrint)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.exportBtn, { backgroundColor: '#1E2127', borderWidth: 1, borderColor: '#374151', marginTop: 10 }]}
                  onPress={() => handleExportPdf('share')}
                  testID="btn-share-geodesy-declaration"
                >
                  <Text style={[styles.exportBtnText, { color: '#E5E7EB' }]}>📤 Udostępnij PDF (Zarząd Oddziału)</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Footer Bar */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeModalBtn} onPress={onClose}>
              <Text style={styles.closeModalBtnText}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#121417',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '94%',
    minHeight: '80%',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  subTitle: {
    color: '#8E94A0',
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1E2127',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  metricsBanner: {
    flexDirection: 'row',
    backgroundColor: '#1E2127',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  dividerVertical: {
    width: 1,
    backgroundColor: '#2F343F',
  },
  metricLabel: {
    color: '#8E94A0',
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1E2127',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#E5A93C',
  },
  tabText: {
    color: '#8E94A0',
    fontSize: 11,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#121417',
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#E5A93C',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 12,
  },
  inputLabel: {
    color: '#8E94A0',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#121417',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  dmsHint: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 6,
    fontFamily: 'monospace',
  },
  statusCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    marginBottom: 14,
  },
  statusTitle: {
    color: '#8E94A0',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusHeading: {
    fontSize: 14,
    fontWeight: '800',
    marginVertical: 4,
  },
  statusDesc: {
    color: '#D1D5DB',
    fontSize: 11,
    lineHeight: 16,
  },
  simCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 14,
  },
  simTitle: {
    color: '#E5A93C',
    fontSize: 11,
    fontWeight: '800',
  },
  dividerH: {
    height: 1,
    backgroundColor: '#2F343F',
    marginVertical: 8,
  },
  simRow: {
    color: '#D1D5DB',
    fontSize: 11,
    marginBottom: 4,
    lineHeight: 16,
  },
  exportBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2F343F',
  },
  closeModalBtn: {
    backgroundColor: '#1E2127',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  closeModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

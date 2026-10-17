/**
 * PIGEON-FLY — Generator Zestawień do Druku Koszowego Modal (Z-057)
 * Lista Startowo-Zegarowa PZHGP:
 * - Podgląd zestawienia wkładaniowego z podziałem na płeć i klatki transportowe
 * - Weryfikacja chipów ESK i typowania serii (T)
 * - Druk bezpośredni AirPrint i eksport PDF A4 dla Komisji Wkładaniowej
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
  BasketingBirdItem,
  BasketingProtocol,
  formatSexPzhgp,
  summarizeBasketingProtocol,
  validateBasketingProtocol,
} from '../domain/basketingProtocol';
import { PdfService } from '../services/pdfService';

interface BasketingProtocolModalProps {
  visible: boolean;
  onClose: () => void;
  defaultRaceName?: string;
  defaultRaceDistanceKm?: number;
}

const DEFAULT_BIRDS: BasketingBirdItem[] = [
  { ordinal: 1, ringNumber: 'PL-0284-23-1401', sex: 'cock', color: 'NIEB', chipId: 'E14A7089', crateNumber: 1, isDesignated: true, pedigreeNote: 'As kat. A' },
  { ordinal: 2, ringNumber: 'PL-0284-23-1402', sex: 'hen', color: 'N.NAKR', chipId: 'E14A7090', crateNumber: 1, isDesignated: true, pedigreeNote: '3x 1. konk.' },
  { ordinal: 3, ringNumber: 'PL-0284-24-5511', sex: 'cock', color: 'CIEM', chipId: 'E14A7091', crateNumber: 1, isDesignated: true, pedigreeNote: 'Linia Schellens' },
  { ordinal: 4, ringNumber: 'PL-0284-24-5512', sex: 'hen', color: 'PSTR', chipId: 'E14A7092', crateNumber: 2, isDesignated: true, pedigreeNote: 'Olimpiada Kat. Sport' },
  { ordinal: 5, ringNumber: 'PL-0284-23-1415', sex: 'cock', color: 'NIEB', chipId: 'E14A7093', crateNumber: 2, isDesignated: true, pedigreeNote: 'Super Szpic' },
  { ordinal: 6, ringNumber: 'PL-0284-24-5520', sex: 'hen', color: 'CZAR', chipId: 'E14A7094', crateNumber: 2, isDesignated: false },
  { ordinal: 7, ringNumber: 'PL-0284-24-5525', sex: 'cock', color: 'PŁOW', chipId: 'E14A7095', crateNumber: 3, isDesignated: false },
  { ordinal: 8, ringNumber: 'PL-0284-24-5530', sex: 'hen', color: 'BIAŁ', chipId: 'E14A7096', crateNumber: 3, isDesignated: false },
  { ordinal: 9, ringNumber: 'DV-0123-22-888', sex: 'cock', color: 'N.NAKR', chipId: 'E14A7097', crateNumber: 3, isDesignated: false },
  { ordinal: 10, ringNumber: 'PL-0284-24-5545', sex: 'hen', color: 'NIEB', chipId: 'E14A7098', crateNumber: 4, isDesignated: false },
];

export const BasketingProtocolModal: React.FC<BasketingProtocolModalProps> = ({
  visible,
  onClose,
  defaultRaceName = 'Magdeburg 1',
  defaultRaceDistanceKm = 345.2,
}) => {
  const [raceNumber, setRaceNumber] = useState('3');
  const [raceName, setRaceName] = useState(defaultRaceName);
  const [distanceKm, setDistanceKm] = useState(String(defaultRaceDistanceKm));
  const [branch, setBranch] = useState('0284 Rawicz');
  const [section, setSection] = useState('01 Rawicz-Miasto');
  const [breederName, setBreederName] = useState('Jan Kowalski');
  const [breederCode, setBreederCode] = useState('1402');
  const [loftCoords, setLoftCoords] = useState('51°52\'48.0" N, 17°01\'12.0" E');
  const [eskSystem, setEskSystem] = useState('Tauris Maxi (Matka: TM-4821)');
  const [basketingPoint, setBasketingPoint] = useState('Punkt Wkładań nr 1 - Dom Hodowcy');

  const [birds, setBirds] = useState<BasketingBirdItem[]>(DEFAULT_BIRDS);

  const currentProtocol: BasketingProtocol = {
    branchCodeAndName: branch,
    sectionCodeAndName: section,
    raceNumber,
    raceName,
    flightDistanceKm: parseFloat(distanceKm) || defaultRaceDistanceKm,
    basketingDate: new Date().toISOString().slice(0, 10),
    basketingTime: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
    basketingPoint,
    breederName,
    breederCode,
    loftCoordinates: loftCoords,
    eskSystem,
    birds,
  };

  const summary = summarizeBasketingProtocol(currentProtocol);
  const validation = validateBasketingProtocol(currentProtocol);

  const toggleBirdDesignation = (ringNumber: string) => {
    setBirds((prev) =>
      prev.map((b) => (b.ringNumber === ringNumber ? { ...b, isDesignated: !b.isDesignated } : b))
    );
  };

  const handlePrint = async () => {
    if (!validation.isValid) {
      Alert.alert('Błąd walidacji', validation.errors.join('\n'));
      return;
    }
    try {
      await PdfService.exportBasketingClockingList(currentProtocol, 'print');
    } catch (e: any) {
      Alert.alert('Błąd drukowania', e?.message || 'Nie udało się wydrukować listy startowej.');
    }
  };

  const handleShare = async () => {
    if (!validation.isValid) {
      Alert.alert('Błąd walidacji', validation.errors.join('\n'));
      return;
    }
    try {
      await PdfService.exportBasketingClockingList(currentProtocol, 'share');
    } catch (e: any) {
      Alert.alert('Błąd eksportu PDF', e?.message || 'Nie udało się wyeksportować listy startowej.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>📋 Lista Startowo-Zegarowa PZHGP (Z-057)</Text>
              <Text style={styles.subTitle}>Oficjalny protokół wkładaniowy do druku A4 dla Komisji</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {/* Summary KPI Cards */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>W KOSZU</Text>
                <Text style={[styles.kpiValue, { color: '#60A5FA' }]}>{summary.totalBirds} szt.</Text>
                <Text style={styles.kpiSub}>wszystkie</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>SAMCE (1.0)</Text>
                <Text style={[styles.kpiValue, { color: '#38BDF8' }]}>{summary.cocksCount}</Text>
                <Text style={styles.kpiSub}>{Math.round((summary.cocksCount / (summary.totalBirds || 1)) * 100)}%</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>SAMICE (0.1)</Text>
                <Text style={[styles.kpiValue, { color: '#F472B6' }]}>{summary.hensCount}</Text>
                <Text style={styles.kpiSub}>{Math.round((summary.hensCount / (summary.totalBirds || 1)) * 100)}%</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>SERIA (T)</Text>
                <Text style={[styles.kpiValue, { color: '#FCD34D' }]}>{summary.designatedCount}</Text>
                <Text style={styles.kpiSub}>typowane</Text>
              </View>
            </View>

            {/* Validation alerts */}
            {validation.warnings.length > 0 && (
              <View style={styles.warningBox}>
                <Text style={styles.warningTitle}>⚠️ Uwagi weryfikacji:</Text>
                {validation.warnings.map((w, idx) => (
                  <Text key={idx} style={styles.warningText}>• {w}</Text>
                ))}
              </View>
            )}

            {/* Meta Section */}
            <View style={styles.card}>
              <Text style={styles.cardHeader}>🏢 PARAMETRY LOTU I ODDZIAŁU PZHGP</Text>
              <View style={styles.inputGrid}>
                <View style={styles.inputCol}>
                  <Text style={styles.inputLabel}>Oddział PZHGP:</Text>
                  <TextInput style={styles.textInput} value={branch} onChangeText={setBranch} />
                </View>
                <View style={styles.inputCol}>
                  <Text style={styles.inputLabel}>Sekcja:</Text>
                  <TextInput style={styles.textInput} value={section} onChangeText={setSection} />
                </View>
              </View>
              <View style={styles.inputGrid}>
                <View style={styles.inputCol}>
                  <Text style={styles.inputLabel}>Miejscowość lotu:</Text>
                  <TextInput style={styles.textInput} value={raceName} onChangeText={setRaceName} />
                </View>
                <View style={styles.inputCol}>
                  <Text style={styles.inputLabel}>Dystans (km):</Text>
                  <TextInput style={styles.textInput} value={distanceKm} onChangeText={setDistanceKm} keyboardType="numeric" />
                </View>
              </View>
              <View style={styles.inputGrid}>
                <View style={styles.inputCol}>
                  <Text style={styles.inputLabel}>Hodowca:</Text>
                  <TextInput style={styles.textInput} value={breederName} onChangeText={setBreederName} />
                </View>
                <View style={styles.inputCol}>
                  <Text style={styles.inputLabel}>Nr hodowcy:</Text>
                  <TextInput style={styles.textInput} value={breederCode} onChangeText={setBreederCode} />
                </View>
              </View>
              <View style={styles.inputGrid}>
                <View style={styles.inputCol}>
                  <Text style={styles.inputLabel}>Zegar ESK:</Text>
                  <TextInput style={styles.textInput} value={eskSystem} onChangeText={setEskSystem} />
                </View>
                <View style={styles.inputCol}>
                  <Text style={styles.inputLabel}>Punkt wkładań:</Text>
                  <TextInput style={styles.textInput} value={basketingPoint} onChangeText={setBasketingPoint} />
                </View>
              </View>
            </View>

            {/* Birds Table */}
            <View style={styles.card}>
              <Text style={styles.cardHeader}>🕊️ LISTA GOŁĘBI W KOSZU ({birds.length} szt.)</Text>
              <Text style={styles.hintText}>Dotknij wiersz ptaka, aby przełączyć status typowania serii (T)</Text>

              {birds.map((b) => (
                <TouchableOpacity
                  key={b.ringNumber}
                  style={[styles.birdRow, b.isDesignated && styles.birdRowDesignated]}
                  onPress={() => toggleBirdDesignation(b.ringNumber)}
                >
                  <Text style={styles.ordinalText}>{b.ordinal}.</Text>
                  <View style={{ flex: 1, paddingHorizontal: 6 }}>
                    <Text style={styles.ringText}>{b.ringNumber}</Text>
                    <Text style={styles.birdSubText}>
                      Barwa: {b.color} • Chip: {b.chipId || 'BRAK'} • {b.crateNumber ? `Klatka ${b.crateNumber}` : 'Brak klatki'}
                    </Text>
                  </View>
                  <View style={styles.sexBadge}>
                    <Text style={styles.sexBadgeText}>{formatSexPzhgp(b.sex)}</Text>
                  </View>
                  <View style={[styles.seriesBadge, b.isDesignated && styles.seriesBadgeActive]}>
                    <Text style={[styles.seriesBadgeText, b.isDesignated && styles.seriesBadgeTextActive]}>
                      {b.isDesignated ? 'T' : '–'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Footer Action Buttons */}
          <View style={styles.footer}>
            <View style={styles.actionBtnRow}>
              <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
                <Text style={styles.printBtnText}>🖨️ DRUKUJ A4 (AIRPRINT)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                <Text style={styles.shareBtnText}>📤 UDOSTĘPNIJ PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '92%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F1F5F9',
  },
  subTitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 10,
    color: '#64748B',
  },
  warningBox: {
    backgroundColor: '#3B2314',
    borderColor: '#F97316',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  warningTitle: {
    color: '#FDBA74',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  warningText: {
    color: '#FED7AA',
    fontSize: 11,
    lineHeight: 16,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#93C5FD',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  inputGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    color: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
  },
  hintText: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 10,
  },
  birdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  birdRowDesignated: {
    borderColor: '#F59E0B',
    backgroundColor: '#1A2130',
  },
  ordinalText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94A3B8',
    width: 24,
  },
  ringText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  birdSubText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  sexBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
  },
  sexBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#CBD5E1',
  },
  seriesBadge: {
    backgroundColor: '#1E293B',
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  seriesBadgeActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  seriesBadgeText: {
    color: '#64748B',
    fontWeight: 'bold',
    fontSize: 12,
  },
  seriesBadgeTextActive: {
    color: '#0F172A',
    fontWeight: '900',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  printBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56, // Field Mode compliant
  },
  printBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56, // Field Mode compliant
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});

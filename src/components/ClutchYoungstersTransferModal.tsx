/**
 * PIGEON-FLY — Clutch Youngsters Transfer & Parental Registry Modal (Z-089 / DEC-103)
 * Field Mode ergonomic interface (>= 48-56pt touch targets), dark theme (#121417).
 * Manages clutch chicks, banding window (D+6-D+8), weaning (D+24), and automated
 * profile transfer into active racing squad ('mlode') with full parental pedigree linkage.
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ClutchTransferPair,
  ClutchYoungster,
  calculateWeaningDate,
  calculateBandingWindow,
  transferYoungstersToRacingSquad,
  generateClutchRegistryHtml,
} from '../domain/clutchYoungstersTransfer';
import { Pigeon } from '../domain/types';
import { PdfService } from '../services/pdfService';
import { FieldButton } from './FieldButton';

interface ClutchYoungstersTransferModalProps {
  visible: boolean;
  onClose: () => void;
  initialClutch?: ClutchTransferPair;
  onTransferComplete?: (transferredPigeons: Partial<Pigeon>[]) => void;
  defaultLoftName?: string;
  defaultBreederName?: string;
}

const DEFAULT_CLUTCH: ClutchTransferPair = {
  clutchId: 'clutch-04',
  nestBox: 'Cela Rozpłodowa A-04',
  roundNumber: 1,
  sireRingNumber: 'PL-0284-21-9901',
  sireStrain: 'Janssen / De Klak',
  sireColor: 'Niebieski',
  damRingNumber: 'PL-0284-22-4410',
  damStrain: 'Gaby Vandenabeele',
  damColor: 'Pstra',
  pairingDate: '2026-02-14',
  egg1LayDate: '2026-02-23',
  egg2LayDate: '2026-02-25',
  chicks: [
    {
      id: 'chk-1',
      chickNumber: 1,
      hatchDate: '2026-03-15',
      ringNumber: 'PL-0284-26-1401',
      chipBandSerial: 'CHIP-99014',
      sex: 'cock',
      plumageColor: 'Niebieski nakrapiany',
      weaningDate: '2026-04-08',
      targetLoftSection: 'Gołębnik Młodych (Sekcja 1)',
      transferredToRacingSquad: false,
    },
    {
      id: 'chk-2',
      chickNumber: 2,
      hatchDate: '2026-03-15',
      ringNumber: 'PL-0284-26-1402',
      chipBandSerial: 'CHIP-99015',
      sex: 'hen',
      plumageColor: 'Pstra',
      weaningDate: '2026-04-08',
      targetLoftSection: 'Gołębnik Młodych (Sekcja 1)',
      transferredToRacingSquad: false,
    },
  ],
  notes: 'Wybitna para rozpłodowa — 100% zapłodnienia i wigor piskląt.',
};

export const ClutchYoungstersTransferModal: React.FC<ClutchYoungstersTransferModalProps> = ({
  visible,
  onClose,
  initialClutch = DEFAULT_CLUTCH,
  onTransferComplete,
  defaultLoftName = 'Gołębnik Mistrza Pigeon-Fly',
  defaultBreederName = 'Tomasz Nowak',
}) => {
  const [clutch, setClutch] = useState<ClutchTransferPair>(initialClutch);
  const [activeChickIndex, setActiveChickIndex] = useState<number>(0);

  const activeChick = clutch.chicks[activeChickIndex] || clutch.chicks[0];
  const bandingWindow = activeChick
    ? calculateBandingWindow(activeChick.hatchDate)
    : { startDate: '', optimalDate: '', endDate: '' };

  const handleChickFieldChange = (
    index: number,
    field: keyof ClutchYoungster,
    value: any
  ) => {
    const updatedChicks = [...clutch.chicks];
    const chick = { ...updatedChicks[index], [field]: value };

    // If hatch date changed, recompute weaning date automatically
    if (field === 'hatchDate') {
      chick.weaningDate = calculateWeaningDate(value);
    }

    updatedChicks[index] = chick;
    setClutch({ ...clutch, chicks: updatedChicks });
  };

  const handleTransfer = () => {
    const untransferred = clutch.chicks.filter((c) => !c.transferredToRacingSquad);
    if (untransferred.length === 0) {
      Alert.alert(
        'Brak młodych do przeniesienia',
        'Wszystkie pisklęta z tego lęgu zostały już przeniesione do stada lotowego.'
      );
      return;
    }

    const result = transferYoungstersToRacingSquad(clutch);
    if (result.count === 0) {
      Alert.alert(
        'Błąd walidacji',
        'Upewnij się, że pisklęta posiadają wpisany numer obrączki rodowej i poprawną datę wyklucia.'
      );
      return;
    }

    setClutch(result.updatedClutch);
    if (onTransferComplete) {
      onTransferComplete(result.transferredPigeons);
    }

    const ringList = result.transferredPigeons.map((p) => p.ringNumber).join(', ');
    Alert.alert(
      'Sukces! Młode w stadzie lotowym',
      `Pomyślnie przeniesiono ${result.count} młode (${ringList}) do stada lotników z przypisanym rodowodem rodziców:\n♂ ${clutch.sireRingNumber}\n♀ ${clutch.damRingNumber}`
    );
  };

  const handlePrint = async () => {
    try {
      const html = generateClutchRegistryHtml(clutch, {
        loftName: defaultLoftName,
        breederName: defaultBreederName,
        seasonYear: new Date().getFullYear(),
      });
      await PdfService.printHtml(html);
    } catch (e: any) {
      Alert.alert('Błąd drukowania', e?.message || 'Nie udało się wydrukować dokumentu.');
    }
  };

  const handleShare = async () => {
    try {
      const html = generateClutchRegistryHtml(clutch, {
        loftName: defaultLoftName,
        breederName: defaultBreederName,
        seasonYear: new Date().getFullYear(),
      });
      await PdfService.shareHtmlAsPdf(
        html,
        `Kartoteka-Legowa-${clutch.nestBox.replace(/\s+/g, '_')}`
      );
    } catch (e: any) {
      Alert.alert('Błąd eksportu', e?.message || 'Nie udało się wyeksportować pliku PDF.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>REJESTR LĘGÓW & MŁODYCH</Text>
            <Text style={styles.headerSubtitle}>
              Transfer odsadzonych młodych do stada lotowego (Z-089)
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            testID="btn-close-clutch-modal"
          >
            <Text style={styles.closeButtonText}>✕ Zamknij</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Pair & Nest Box Card */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>GNIAZDO: {clutch.nestBox}</Text>
              <View style={styles.roundBadge}>
                <Text style={styles.roundBadgeText}>RUNDA {clutch.roundNumber}</Text>
              </View>
            </View>

            <View style={styles.parentsRow}>
              {/* Sire */}
              <View style={styles.parentBox}>
                <Text style={styles.parentRole}>1.0 OJCIEC (SAMSIEC)</Text>
                <Text style={styles.parentRing}>{clutch.sireRingNumber}</Text>
                <Text style={styles.parentStrain}>{clutch.sireStrain || '—'}</Text>
                <Text style={styles.parentColor}>{clutch.sireColor || '—'}</Text>
              </View>

              {/* Dam */}
              <View style={styles.parentBox}>
                <Text style={styles.parentRole}>0.1 MATKA (SAMICA)</Text>
                <Text style={styles.parentRing}>{clutch.damRingNumber}</Text>
                <Text style={styles.parentStrain}>{clutch.damStrain || '—'}</Text>
                <Text style={styles.parentColor}>{clutch.damColor || '—'}</Text>
              </View>
            </View>

            <View style={styles.datesGrid}>
              <View style={styles.dateCol}>
                <Text style={styles.dateLabel}>Sparowanie:</Text>
                <Text style={styles.dateValue}>{clutch.pairingDate}</Text>
              </View>
              <View style={styles.dateCol}>
                <Text style={styles.dateLabel}>1. Jajko:</Text>
                <Text style={styles.dateValue}>{clutch.egg1LayDate}</Text>
              </View>
              <View style={styles.dateCol}>
                <Text style={styles.dateLabel}>2. Jajko (+44h):</Text>
                <Text style={styles.dateValue}>{clutch.egg2LayDate}</Text>
              </View>
            </View>
          </View>

          {/* Chicks Selector Tabs */}
          <View style={styles.chickTabsRow}>
            {clutch.chicks.map((chick, idx) => (
              <TouchableOpacity
                key={chick.id}
                style={[
                  styles.chickTab,
                  activeChickIndex === idx && styles.chickTabActive,
                ]}
                onPress={() => setActiveChickIndex(idx)}
                testID={`tab-chick-${idx + 1}`}
              >
                <Text
                  style={[
                    styles.chickTabText,
                    activeChickIndex === idx && styles.chickTabTextActive,
                  ]}
                >
                  Pisklę #{chick.chickNumber}: {chick.ringNumber || 'Bez obrączki'}
                </Text>
                <View
                  style={[
                    styles.statusDot,
                    chick.transferredToRacingSquad
                      ? styles.dotTransferred
                      : styles.dotNest,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Active Chick Detail Card */}
          {activeChick && (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>
                  KARTOTEKA PISKLĘCIA #{activeChick.chickNumber}
                </Text>
                <View
                  style={[
                    styles.statusPill,
                    activeChick.transferredToRacingSquad
                      ? styles.pillTransferred
                      : styles.pillNest,
                  ]}
                >
                  <Text style={styles.statusPillText}>
                    {activeChick.transferredToRacingSquad
                      ? 'W STADZIE LOTOWYM'
                      : 'W GNIEŹDZIE'}
                  </Text>
                </View>
              </View>

              {/* Banding Window Banner */}
              <View style={styles.milestoneBanner}>
                <Text style={styles.bannerHeading}>
                  KRYTYCZNE OKNO OBRĄCZKOWANIA (D+6 DO D+8):
                </Text>
                <Text style={styles.bannerDates}>
                  {bandingWindow.startDate} ➔ optymalnie:{' '}
                  <Text style={styles.bannerHighlight}>{bandingWindow.optimalDate}</Text> ➔ do{' '}
                  {bandingWindow.endDate}
                </Text>
                <Text style={styles.bannerNotice}>
                  Wymiar obrączki rodowej FCI: Ø 8.0 mm (jednolita, nierozerwalna).
                </Text>
              </View>

              {/* Inputs */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Numer Obrączki Rodowej PZHGP:</Text>
                <TextInput
                  style={styles.textInput}
                  value={activeChick.ringNumber}
                  onChangeText={(val) =>
                    handleChickFieldChange(activeChickIndex, 'ringNumber', val)
                  }
                  placeholder="np. PL-0284-26-1401"
                  placeholderTextColor="#64748B"
                  testID="input-chick-ring"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Data Wyklucia (18d):</Text>
                  <TextInput
                    style={styles.textInput}
                    value={activeChick.hatchDate}
                    onChangeText={(val) =>
                      handleChickFieldChange(activeChickIndex, 'hatchDate', val)
                    }
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#64748B"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Odsadzenie (D+24):</Text>
                  <TextInput
                    style={[styles.textInput, styles.readOnlyInput]}
                    value={activeChick.weaningDate}
                    editable={false}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Płeć fenotypowa:</Text>
                  <View style={styles.sexRow}>
                    {(['cock', 'hen', 'unknown'] as const).map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.sexChoice,
                          activeChick.sex === s && styles.sexChoiceActive,
                        ]}
                        onPress={() =>
                          handleChickFieldChange(activeChickIndex, 'sex', s)
                        }
                      >
                        <Text
                          style={[
                            styles.sexChoiceText,
                            activeChick.sex === s && styles.sexChoiceTextActive,
                          ]}
                        >
                          {s === 'cock' ? '1.0 ♂' : s === 'hen' ? '0.1 ♀' : '?'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Barwa upierzenia:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={activeChick.plumageColor}
                    onChangeText={(val) =>
                      handleChickFieldChange(activeChickIndex, 'plumageColor', val)
                    }
                    placeholder="np. Nakrapiana"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Obrączka Elektroniczna ESK:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={activeChick.chipBandSerial || ''}
                    onChangeText={(val) =>
                      handleChickFieldChange(activeChickIndex, 'chipBandSerial', val)
                    }
                    placeholder="np. CHIP-99014"
                    placeholderTextColor="#64748B"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Sekcja Docelowa:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={activeChick.targetLoftSection}
                    onChangeText={(val) =>
                      handleChickFieldChange(activeChickIndex, 'targetLoftSection', val)
                    }
                    placeholder="Gołębnik Młodych"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Action Transfer Button */}
          <FieldButton
            title="🕊️ Przenieś Młode do Stada Lotowego"
            onPress={handleTransfer}
            style={styles.transferButton}
            testID="btn-transfer-youngsters"
          />

          {/* Print & Share PDF Buttons */}
          <View style={styles.exportRow}>
            <FieldButton
              title="🖨️ AirPrint Karta Lęgu"
              variant="secondary"
              onPress={handlePrint}
              style={{ flex: 1, marginRight: 8 }}
              testID="btn-print-clutch-registry"
            />
            <FieldButton
              title="📤 Udostępnij PDF"
              variant="secondary"
              onPress={handleShare}
              style={{ flex: 1 }}
              testID="btn-share-clutch-registry"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121417',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
    backgroundColor: '#1A1D24',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#E5A93C',
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#8E94A0',
    marginTop: 2,
  },
  closeButton: {
    minHeight: 48,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2F343F',
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  roundBadge: {
    backgroundColor: '#2A303C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roundBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E5A93C',
  },
  parentsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  parentBox: {
    flex: 1,
    backgroundColor: '#14171D',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  parentRole: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8E94A0',
    marginBottom: 4,
  },
  parentRing: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0284c7',
    fontFamily: 'monospace',
  },
  parentStrain: {
    fontSize: 11,
    color: '#D4D8E0',
    marginTop: 2,
  },
  parentColor: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  datesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#161920',
    padding: 8,
    borderRadius: 8,
  },
  dateCol: {
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 9,
    color: '#8E94A0',
  },
  dateValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  chickTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chickTab: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E2127',
    borderWidth: 1,
    borderColor: '#2F343F',
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  chickTabActive: {
    borderColor: '#E5A93C',
    backgroundColor: '#262A33',
  },
  chickTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E94A0',
    marginRight: 6,
  },
  chickTabTextActive: {
    color: '#FFFFFF',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotNest: {
    backgroundColor: '#E5A93C',
  },
  dotTransferred: {
    backgroundColor: '#4CAF50',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pillNest: {
    backgroundColor: 'rgba(229, 169, 60, 0.2)',
  },
  pillTransferred: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  milestoneBanner: {
    backgroundColor: '#122336',
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  bannerHeading: {
    fontSize: 10,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 0.5,
  },
  bannerDates: {
    fontSize: 11,
    color: '#E2E8F0',
    marginTop: 3,
  },
  bannerHighlight: {
    fontWeight: '900',
    color: '#E5A93C',
  },
  bannerNotice: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E94A0',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#14171D',
    borderWidth: 1,
    borderColor: '#2F343F',
    borderRadius: 8,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 13,
    minHeight: 48,
  },
  readOnlyInput: {
    backgroundColor: '#1E232B',
    color: '#38bdf8',
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  sexRow: {
    flexDirection: 'row',
    gap: 4,
  },
  sexChoice: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#14171D',
    borderWidth: 1,
    borderColor: '#2F343F',
    borderRadius: 8,
  },
  sexChoiceActive: {
    borderColor: '#E5A93C',
    backgroundColor: '#2A303C',
  },
  sexChoiceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E94A0',
  },
  sexChoiceTextActive: {
    color: '#FFFFFF',
  },
  transferButton: {
    marginTop: 8,
    marginBottom: 12,
    minHeight: 52,
  },
  exportRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
});

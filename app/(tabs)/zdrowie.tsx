/**
 * PIGEON-FLY — Zdrowie, Profilaktyka i Pierzenie (Full Loft Health & Moult Screen)
 * Paramyxo PMV-1 compliance, 12-month flock medical calendar, Photoperiod Darkness (Verdunkelung), and 10 flight feather inspection.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { FeatherGauge } from '../../src/components/FeatherGauge';
import { FieldButton } from '../../src/components/FieldButton';
import { AddTreatmentModal } from '../../src/components/AddTreatmentModal';
import { PhotoperiodModal } from '../../src/components/PhotoperiodModal';
import { VeterinaryLabModal } from '../../src/components/VeterinaryLabModal';
import { AntidopingModal } from '../../src/components/AntidopingModal';
import { analyzeWingMoult, getPhotoperiodStatus } from '../../src/domain/moult';
import { PdfService } from '../../src/services/pdfService';
import { FeatherStatus, MoultLog } from '../../src/domain/types';
import { TreatmentRecordItem } from '../../src/domain/pdfExport';

const INITIAL_MOULT_LOGS: MoultLog[] = [
  { id: 'm-1', pigeonId: 'p-01', checkDate: '2026-09-15', primaryFeatherNumber: 1, status: 'full', lengthPct: 100, createdAt: '', updatedAt: '' },
  { id: 'm-2', pigeonId: 'p-01', checkDate: '2026-09-15', primaryFeatherNumber: 2, status: 'full', lengthPct: 100, createdAt: '', updatedAt: '' },
  { id: 'm-3', pigeonId: 'p-01', checkDate: '2026-10-01', primaryFeatherNumber: 3, status: 'regrowing', lengthPct: 65, createdAt: '', updatedAt: '' },
  { id: 'm-4', pigeonId: 'p-01', checkDate: '2026-10-10', primaryFeatherNumber: 4, status: 'dropped', lengthPct: 0, createdAt: '', updatedAt: '' },
];

const INITIAL_TREATMENTS: TreatmentRecordItem[] = [
  {
    date: '2026-02-15',
    eventType: 'Szczepienie PMV-1',
    productName: 'Pharmavac Columbi 2',
    batchNumber: 'LOT-2026-09A',
    targetPigeon: 'Całe stado (60 szt.)',
    withdrawalDays: 0,
    notes: 'Szczepienie podskórne w kark przed sezonem lęgowym',
  },
  {
    date: '2026-03-01',
    eventType: 'Odrobaczanie',
    productName: 'Levamisole 10%',
    batchNumber: 'LEV-551',
    targetPigeon: 'Całe stado',
    withdrawalDays: 7,
    notes: 'Podanie do wody pitnej po badaniu kału',
  },
];

export default function HealthScreen() {
  const [selectedPigeonRing] = useState('PL-0284-23-1402');
  const [isTreatmentModalVisible, setIsTreatmentModalVisible] = useState(false);
  const [isPhotoperiodModalVisible, setIsPhotoperiodModalVisible] = useState(false);
  const [isVetLabModalVisible, setIsVetLabModalVisible] = useState(false);
  const [isAntidopingModalVisible, setIsAntidopingModalVisible] = useState(false);
  const [treatments, setTreatments] = useState<TreatmentRecordItem[]>(INITIAL_TREATMENTS);
  const [moultLogs, setMoultLogs] = useState<MoultLog[]>(INITIAL_MOULT_LOGS);

  const photoperiod = getPhotoperiodStatus(new Date());
  const wingAnalysis = analyzeWingMoult('p-01', moultLogs);

  const handleFeatherPress = (featherNumber: number) => {
    Alert.alert(
      `Lotka #${featherNumber} (Skrzydło)`,
      'Wybierz aktualny stan zrzucenia lotki podczas przeglądu w ręku:',
      [
        {
          text: '🟩 Pełna / Odrośnięta (100%)',
          onPress: () => updateFeather(featherNumber, 'full', 100),
        },
        {
          text: '🟧 Wzrost / Odrost (50%)',
          onPress: () => updateFeather(featherNumber, 'regrowing', 50),
        },
        {
          text: '🟥 Zrzucona / Brak (0%)',
          onPress: () => updateFeather(featherNumber, 'dropped', 0),
        },
        { text: 'Anuluj', style: 'cancel' },
      ]
    );
  };

  const updateFeather = (featherNumber: number, status: FeatherStatus, lengthPct: number) => {
    setMoultLogs((prev) => {
      const filtered = prev.filter((m) => m.primaryFeatherNumber !== featherNumber);
      return [
        ...filtered,
        {
          id: `m-${featherNumber}-${Date.now()}`,
          pigeonId: 'p-01',
          checkDate: new Date().toISOString().slice(0, 10),
          primaryFeatherNumber: featherNumber,
          status,
          lengthPct,
          createdAt: '',
          updatedAt: '',
        },
      ];
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Paramyxovirus PMV-1 Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>SZCZEPIENIE PMV-1 (PARAMYKSO)</Text>
            <View style={styles.statusBadgeValid}>
              <Text style={styles.statusBadgeText}>WAŻNE</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>
            Ostatnie szczepienie stada: <Text style={styles.highlightText}>15.02.2026</Text> (Pharmavac Columbi 2)
          </Text>
          <Text style={styles.cardSub}>
            Ważność odporności do 15.02.2027. Zgodność z wymogami PZHGP / FCI: 100%.
          </Text>
        </View>

        {/* 12-Month Veterinary & Prevention Calendar */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ROCZNY KALENDARZ PROFILAKTYKI STADA</Text>
          <View style={styles.calendarTimeline}>
            <View style={styles.timelineItem}>
              <Text style={styles.monthBadge}>STY / LUT</Text>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Koproskopia & Szczepienie PMV-1 + Ospa</Text>
                <Text style={styles.timelineDesc}>Badanie kału pod mikroskopem na kokcydia i robaki; szczepienie stada.</Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <Text style={styles.monthBadge}>LUT / MAR</Text>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Kuracja przed parowaniem (Rzęsistek)</Text>
                <Text style={styles.timelineDesc}>Dezynfekcja wola (trichomonadoza / żółty guzek) przed złożeniem jaj.</Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <Text style={styles.monthBadge}>MAJ / CZE</Text>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Ochrona Młodzieży (Adeno-Coli / YPDS)</Text>
                <Text style={styles.timelineDesc}>Wzmacnianie odporności jelitowej (probiotyki, maślan sodu, przeciwciała).</Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <Text style={styles.monthBadge}>WRZ / PAŹ</Text>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Salmonelloza (Paratyfus) & Pierzenie</Text>
                <Text style={styles.timelineDesc}>Kontrola nosicielstwa salmonelli przed zimą; podaż metioniny na pióra.</Text>
              </View>
            </View>
          </View>
          <FieldButton
            title="🚨 Asystent Diagnostyczny YPDS & Koproskopia"
            variant="secondary"
            onPress={() => setIsVetLabModalVisible(true)}
            style={{ marginTop: 12, minHeight: 44 }}
            textStyle={{ fontSize: 13 }}
            testID="btn-open-vet-lab-modal"
          />
        </View>

        {/* Photoperiod / Darkness System (Verdunkelung) Card */}
        <View style={[styles.card, photoperiod.isActive && styles.activePhotoperiodCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {photoperiod.systemType === 'darkness' ? '🌙 SYSTEM ZACIEMNIANIA (VERDUNKELUNG)' : '☀️ SYSTEM DOŚWIETLANIA (BELICHTUNG)'}
            </Text>
            <View style={[styles.statusBadgeValid, { backgroundColor: photoperiod.isActive ? '#E5A93C' : '#2A2E38' }]}>
              <Text style={[styles.statusBadgeText, { color: photoperiod.isActive ? '#121417' : '#8E94A0' }]}>
                {photoperiod.isActive ? 'AKTYWNY' : 'NATURALNY'}
              </Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>{photoperiod.scheduleDescription}</Text>
          <Text style={styles.cardSub}>Cel biologiczny: {photoperiod.biologicalGoal}</Text>
          <FieldButton
            title="⏰ Zarządzaj Fotoperiodem i Roletami"
            variant="secondary"
            onPress={() => setIsPhotoperiodModalVisible(true)}
            style={{ marginTop: 12, minHeight: 44 }}
            textStyle={{ fontSize: 13 }}
            testID="btn-open-photoperiod-modal"
          />
        </View>

        {/* Selected Bird Wing Moult Analysis */}
        <View style={styles.moultSection}>
          <Text style={styles.moultSectionTitle}>PRZEGLĄD SKRZYDŁA: {selectedPigeonRing}</Text>
          <Text style={styles.moultHint}>Dotknij lotkę, aby zaktualizować jej stan podczas przeglądu w ręku</Text>
          <FeatherGauge
            feathers={wingAnalysis.feathers}
            onPressFeather={handleFeatherPress}
          />

          <View style={styles.moultStatsCard}>
            <Text style={styles.moultStatLabel}>
              Wskaźnik Regeneracji Skrzydła (ARI):{' '}
              <Text style={styles.moultStatValue}>{wingAnalysis.annualRegenerationIndex}%</Text>
            </Text>
            <Text style={styles.moultStatLabel}>
              Status lotowy:{' '}
              <Text style={{ color: wingAnalysis.isFitForRacing ? '#4CAF50' : '#E53935', fontWeight: '800' }}>
                {wingAnalysis.isFitForRacing ? 'ZDOLNY DO LOTU' : 'NIEZALECANY NA CIĘŻKI LOT'}
              </Text>
            </Text>
            {wingAnalysis.unfitnessReason && (
              <Text style={styles.unfitnessText}>{wingAnalysis.unfitnessReason}</Text>
            )}
          </View>
        </View>

        {/* Recent Treatments & PIW Withdrawal Warning Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>OSTATNIE ZABIEGI I KARENCJE (PIW)</Text>
          {treatments.map((t, idx) => {
            const hasWithdrawal = t.withdrawalDays > 0;
            return (
              <View key={idx} style={styles.treatmentRow}>
                <View style={styles.treatmentMeta}>
                  <Text style={styles.treatmentDate}>{t.date}</Text>
                  <Text style={styles.treatmentName}>{t.productName}</Text>
                  <Text style={styles.treatmentTarget}>{t.targetPigeon}</Text>
                </View>
                <View
                  style={[
                    styles.withdrawalBadge,
                    hasWithdrawal ? styles.withdrawalActive : styles.withdrawalClear,
                  ]}
                >
                  <Text
                    style={[
                      styles.withdrawalText,
                      hasWithdrawal ? styles.withdrawalActiveText : styles.withdrawalClearText,
                    ]}
                  >
                    {hasWithdrawal ? `⚠️ Karencja: ${t.withdrawalDays}d` : '✓ Brak karencji'}
                  </Text>
                </View>
              </View>
            );
          })}
          <FieldButton
            title="🛡️ Tarcza Antydopingowa FCI & Karencje"
            variant="secondary"
            onPress={() => setIsAntidopingModalVisible(true)}
            style={{ marginTop: 12, minHeight: 44 }}
            textStyle={{ fontSize: 13 }}
            testID="btn-open-antidoping-modal"
          />
        </View>

        {/* Action Buttons */}
        <FieldButton
          title="+ Zapisz Zabieg Weterynaryjny / Lek"
          onPress={() => setIsTreatmentModalVisible(true)}
          style={{ marginTop: 8, marginBottom: 10 }}
        />
        <FieldButton
          title="📄 Drukuj E-Książkę Leczenia (PIW)"
          onPress={() => {
            Alert.alert(
              'E-Księga Leczenia Zwierząt (PIW)',
              'Wybierz akcję dla urzędowej E-Księgi Zabiegów Weterynaryjnych:',
              [
                {
                  text: '🖨️ Drukuj',
                  onPress: async () => {
                    try {
                      await PdfService.exportVeterinaryTreatmentBook(
                        {
                          loftName: 'Gołębnik Mistrza',
                          breederName: 'Hodowca Pigeon-Fly',
                          veterinarianName: 'Lek. wet. Janusz Ptasiński',
                          records: treatments,
                        },
                        'print'
                      );
                    } catch (e: any) {
                      Alert.alert('Błąd', e?.message || 'Nie udało się wydrukować księgi');
                    }
                  },
                },
                {
                  text: '📤 Udostępnij PDF',
                  onPress: async () => {
                    try {
                      await PdfService.exportVeterinaryTreatmentBook(
                        {
                          loftName: 'Gołębnik Mistrza',
                          breederName: 'Hodowca Pigeon-Fly',
                          veterinarianName: 'Lek. wet. Janusz Ptasiński',
                          records: treatments,
                        },
                        'share'
                      );
                    } catch (e: any) {
                      Alert.alert('Błąd', e?.message || 'Nie udało się wyeksportować PDF');
                    }
                  },
                },
                { text: 'Anuluj', style: 'cancel' },
              ]
            );
          }}
          variant="secondary"
        />
      </ScrollView>

      {/* Add Treatment Modal */}
      <AddTreatmentModal
        visible={isTreatmentModalVisible}
        onClose={() => setIsTreatmentModalVisible(false)}
        defaultRingNumber={selectedPigeonRing}
        onSave={async (newLog) => {
          setTreatments((prev) => [
            {
              date: newLog.date,
              eventType: newLog.eventType,
              productName: newLog.productName,
              batchNumber: newLog.batchNumber,
              targetPigeon: newLog.pigeonId ? `Ptak: ${newLog.pigeonId}` : 'Całe stado',
              withdrawalDays: newLog.withdrawalDays,
              notes: newLog.notes,
            },
            ...prev,
          ]);
          Alert.alert('Zapisano', `Zabieg ${newLog.productName} został zapisany w E-Księdze PIW.`);
        }}
      />

      {/* Photoperiod & Blind Automation Modal */}
      <PhotoperiodModal
        visible={isPhotoperiodModalVisible}
        onClose={() => setIsPhotoperiodModalVisible(false)}
      />

      {/* Veterinary Lab, YPDS Triage & Coproscopy Modal (Z-305, Z-306) */}
      <VeterinaryLabModal
        visible={isVetLabModalVisible}
        onClose={() => setIsVetLabModalVisible(false)}
        selectedPigeonRing={selectedPigeonRing}
      />

      {/* FCI Antidoping & Prohibited Substances Guard Modal (Z-304, BR-ZDR-009) */}
      <AntidopingModal
        visible={isAntidopingModalVisible}
        onClose={() => setIsAntidopingModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121417',
  },
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1E2127',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 14,
  },
  activePhotoperiodCard: {
    borderColor: '#E5A93C',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.5,
  },
  statusBadgeValid: {
    backgroundColor: '#1B3B22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#81C784',
  },
  cardDesc: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: '#8E94A0',
    lineHeight: 18,
  },
  highlightText: {
    color: '#E5A93C',
    fontWeight: '700',
  },
  calendarTimeline: {
    marginTop: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  monthBadge: {
    width: 65,
    backgroundColor: '#15171B',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    color: '#E5A93C',
    fontWeight: '800',
    fontSize: 11,
    textAlign: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timelineDesc: {
    fontSize: 12,
    color: '#8E94A0',
    marginTop: 1,
  },
  moultSection: {
    marginBottom: 14,
  },
  moultSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  moultStatsCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginTop: 8,
  },
  moultStatLabel: {
    fontSize: 14,
    color: '#A0A6B2',
    marginBottom: 4,
  },
  moultStatValue: {
    fontWeight: '800',
    color: '#E5A93C',
  },
  unfitnessText: {
    fontSize: 13,
    color: '#FF8A80',
    marginTop: 6,
    lineHeight: 18,
  },
  moultHint: {
    fontSize: 11,
    color: '#E5A93C',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  treatmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#262930',
  },
  treatmentMeta: {
    flex: 1,
  },
  treatmentDate: {
    fontSize: 11,
    color: '#8E94A0',
    fontFamily: 'monospace',
  },
  treatmentName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  treatmentTarget: {
    fontSize: 12,
    color: '#A0A6B2',
    marginTop: 1,
  },
  withdrawalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  withdrawalActive: {
    backgroundColor: '#381E1E',
    borderWidth: 1,
    borderColor: '#E53935',
  },
  withdrawalClear: {
    backgroundColor: '#1E3824',
    borderWidth: 1,
    borderColor: '#43A047',
  },
  withdrawalText: {
    fontSize: 11,
    fontWeight: '800',
  },
  withdrawalActiveText: {
    color: '#FF8A80',
  },
  withdrawalClearText: {
    color: '#81C784',
  },
});

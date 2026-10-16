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
} from 'react-native';
import { FeatherGauge } from '../../src/components/FeatherGauge';
import { FieldButton } from '../../src/components/FieldButton';
import { analyzeWingMoult, getPhotoperiodStatus } from '../../src/domain/moult';
import { PdfService } from '../../src/services/pdfService';

export default function HealthScreen() {
  const [selectedPigeonRing] = useState('PL-0284-23-1402');
  const photoperiod = getPhotoperiodStatus(new Date());

  // Simulated moult logs for the selected bird
  const demoMoult = analyzeWingMoult('p-01', [
    {
      id: 'm-1',
      pigeonId: 'p-01',
      checkDate: '2026-09-15',
      primaryFeatherNumber: 1,
      status: 'full',
      lengthPct: 100,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'm-2',
      pigeonId: 'p-01',
      checkDate: '2026-09-15',
      primaryFeatherNumber: 2,
      status: 'full',
      lengthPct: 100,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'm-3',
      pigeonId: 'p-01',
      checkDate: '2026-10-01',
      primaryFeatherNumber: 3,
      status: 'regrowing',
      lengthPct: 65,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'm-4',
      pigeonId: 'p-01',
      checkDate: '2026-10-10',
      primaryFeatherNumber: 4,
      status: 'dropped',
      lengthPct: 0,
      createdAt: '',
      updatedAt: '',
    },
  ]);

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
        </View>

        {/* Selected Bird Wing Moult Analysis */}
        <View style={styles.moultSection}>
          <Text style={styles.moultSectionTitle}>PRZEGLĄD SKRZYDŁA: {selectedPigeonRing}</Text>
          <FeatherGauge feathers={demoMoult.feathers} />

          <View style={styles.moultStatsCard}>
            <Text style={styles.moultStatLabel}>
              Wskaźnik Regeneracji Skrzydła (ARI):{' '}
              <Text style={styles.moultStatValue}>{demoMoult.annualRegenerationIndex}%</Text>
            </Text>
            <Text style={styles.moultStatLabel}>
              Status lotowy:{' '}
              <Text style={{ color: demoMoult.isFitForRacing ? '#4CAF50' : '#E53935', fontWeight: '800' }}>
                {demoMoult.isFitForRacing ? 'ZDOLNY DO LOTU' : 'NIEZALECANY NA CIĘŻKI LOT'}
              </Text>
            </Text>
            {demoMoult.unfitnessReason && (
              <Text style={styles.unfitnessText}>{demoMoult.unfitnessReason}</Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <FieldButton
          title="+ Zapisz Zabieg Weterynaryjny / Lek"
          onPress={() => {}}
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
                          records: [
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
                          ],
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
                          records: [
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
                          ],
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
});

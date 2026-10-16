/**
 * PIGEON-FLY — Żywienie i Suplementy (Nutrition & Supplementation Screen)
 * Feeding protocols, weekly widowhood rotation, and drinker/feeder supplement schedule.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { AnnualLoftPhase, getFeedingProtocol } from '../../src/domain/nutrition';
import { calculateLoftCosts } from '../../src/domain/costCalculator';
import { FieldButton } from '../../src/components/FieldButton';
import { AddFeedingLogModal } from '../../src/components/AddFeedingLogModal';
import { FeedCalculatorModal } from '../../src/components/FeedCalculatorModal';
import { DrinkerLabModal } from '../../src/components/DrinkerLabModal';

export default function NutritionScreen() {
  const [selectedPhase, setSelectedPhase] = useState<AnnualLoftPhase>('racing_widowhood');
  const [selectedDay, setSelectedDay] = useState<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'>('tue');
  const [flockSize, setFlockSize] = useState<number>(60);
  const [bagPrice, setBagPrice] = useState<number>(85);
  const [isFeedingModalVisible, setIsFeedingModalVisible] = useState(false);
  const [isFeedCalcOpen, setIsFeedCalcOpen] = useState(false);
  const [isDrinkerLabOpen, setIsDrinkerLabOpen] = useState(false);
  const [customLogs, setCustomLogs] = useState<{
    date: string;
    phase: string;
    mixName: string;
    waterSupplements?: string;
    feedSupplements?: string;
  }[]>([]);

  const protocol = getFeedingProtocol(selectedPhase);
  const dayPlan = protocol.weeklySchedule[selectedDay];

  const daysList: { id: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'; label: string }[] = [
    { id: 'mon', label: 'Pon' },
    { id: 'tue', label: 'Wt' },
    { id: 'wed', label: 'Śr' },
    { id: 'thu', label: 'Czw' },
    { id: 'fri', label: 'Pt' },
    { id: 'sat', label: 'Sob' },
    { id: 'sun', label: 'Nd' },
  ];

  const phasesList: { id: AnnualLoftPhase; label: string }[] = [
    { id: 'racing_widowhood', label: 'Loty (Wdowieństwo)' },
    { id: 'breeding_reproduction', label: 'Lęgi i Wychów' },
    { id: 'autumn_moult', label: 'Wielkie Pierzenie' },
    { id: 'winter_rest', label: 'Zimowanie' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Phase Selector Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.phaseScroll}>
          {phasesList.map((p) => {
            const isActive = selectedPhase === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => setSelectedPhase(p.id)}
                style={[styles.phaseChip, isActive && styles.phaseChipActive]}
              >
                <Text style={[styles.phaseChipText, isActive && styles.phaseChipTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Phase Header Info */}
        <View style={styles.protocolCard}>
          <Text style={styles.protocolTitle}>{protocol.phaseName}</Text>
          <Text style={styles.protocolDesc}>{protocol.description}</Text>
          <View style={styles.mineralsRow}>
            <Text style={styles.mineralsLabel}>Stały dostęp: </Text>
            <Text style={styles.mineralsText}>{protocol.criticalMinerals.join(' • ')}</Text>
          </View>
        </View>

        {/* Day of Week Selector */}
        <View style={styles.daysRow}>
          {daysList.map((d) => {
            const isSelected = selectedDay === d.id;
            return (
              <TouchableOpacity
                key={d.id}
                onPress={() => setSelectedDay(d.id)}
                style={[styles.dayButton, isSelected && styles.dayButtonActive]}
              >
                <Text style={[styles.dayButtonText, isSelected && styles.dayButtonTextActive]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Day Schedule Detail Card */}
        {dayPlan && (
          <View style={styles.dayCard}>
            <View style={styles.dayCardHeader}>
              <Text style={styles.dayTitle}>PLAN NA TEN DZIEŃ ({dayPlan.dayOfWeek.toUpperCase()})</Text>
              <Text style={styles.grammageText}>{dayPlan.profile.recommendedGramsPerBird}g / ptaka</Text>
            </View>

            {/* Feeder section */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>🥣 KARMNIK (PORANNE I WIECZORNE KARMIENIE)</Text>
              <Text style={styles.feedText}><Text style={styles.feedTime}>Rano: </Text>{dayPlan.morningFeed}</Text>
              <Text style={styles.feedText}><Text style={styles.feedTime}>Wieczór: </Text>{dayPlan.eveningFeed}</Text>
            </View>

            {/* Nutritional profile badges */}
            <View style={styles.profileRow}>
              <View style={styles.profileBadge}>
                <Text style={styles.profileVal}>{dayPlan.profile.proteinPct}%</Text>
                <Text style={styles.profileLbl}>Białko</Text>
              </View>
              <View style={styles.profileBadge}>
                <Text style={styles.profileVal}>{dayPlan.profile.fatPct}%</Text>
                <Text style={styles.profileLbl}>Tłuszcz</Text>
              </View>
              <View style={styles.profileBadge}>
                <Text style={styles.profileVal}>{dayPlan.profile.carbohydratesPct}%</Text>
                <Text style={styles.profileLbl}>Węglowodany</Text>
              </View>
              <View style={styles.profileBadge}>
                <Text style={styles.profileVal}>{dayPlan.profile.fiberPct}%</Text>
                <Text style={styles.profileLbl}>Włókno</Text>
              </View>
            </View>

            {/* Drinker supplements */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionHeading, { color: '#64B5F6' }]}>💧 POIDŁO (DODATKI DO WODY)</Text>
              {dayPlan.waterSupplements.length > 0 ? (
                dayPlan.waterSupplements.map((s, idx) => (
                  <Text key={idx} style={styles.supplementItem}>• {s}</Text>
                ))
              ) : (
                <Text style={styles.emptySupplement}>Czysta świeża woda bez dodatków</Text>
              )}
            </View>

            {/* Feed supplements */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionHeading, { color: '#81C784' }]}>🌿 ZWILŻANIE KARMY (DROŻDŻE / OLEJE)</Text>
              {dayPlan.feedSupplements.length > 0 ? (
                dayPlan.feedSupplements.map((s, idx) => (
                  <Text key={idx} style={styles.supplementItem}>• {s}</Text>
                ))
              ) : (
                <Text style={styles.emptySupplement}>Karma sucha bez dodatków</Text>
              )}
            </View>

            {dayPlan.notes && (
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>⚠️ {dayPlan.notes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Loft Feeding Budget & Grain Demand Card */}
        {(() => {
          const loftCosts = calculateLoftCosts({
            flockSize,
            feedBagPrice: bagPrice,
            dailyGramsPerBird: dayPlan?.profile.recommendedGramsPerBird || 32,
            monthlySupplementsCost: 120,
            annualVeterinaryCost: 600,
          });

          return (
            <View style={styles.budgetCard}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetTitle}>BILANS ZIARNA I KOSZTÓW STADA</Text>
                <View style={styles.stepperContainer}>
                  <Text style={styles.stepperLabel}>Stado: </Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setFlockSize((s) => Math.max(5, s - 5))}
                  >
                    <Text style={styles.stepperBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.flockCountText}>{flockSize} szt.</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setFlockSize((s) => s + 5)}
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.budgetGrid}>
                <View style={styles.budgetItem}>
                  <Text style={styles.budgetNum}>{loftCosts.dailyFlockGrainKg} kg</Text>
                  <Text style={styles.budgetSub}>Dziennie ({dayPlan?.profile.recommendedGramsPerBird || 32}g/ptak)</Text>
                </View>
                <View style={styles.budgetItem}>
                  <Text style={styles.budgetNum}>{loftCosts.monthlyFlockGrainKg} kg</Text>
                  <Text style={styles.budgetSub}>Miesięcznie (~{loftCosts.monthlyFeedBags} worków 25kg)</Text>
                </View>
                <View style={styles.budgetItem}>
                  <Text style={[styles.budgetNum, { color: '#E5A93C' }]}>{loftCosts.monthlyFeedCost} zł</Text>
                  <Text style={styles.budgetSub}>Koszt karmy / msc (worek {bagPrice} zł)</Text>
                </View>
                <View style={styles.budgetItem}>
                  <Text style={[styles.budgetNum, { color: '#81C784' }]}>{loftCosts.costPerBirdPerMonth} zł</Text>
                  <Text style={styles.budgetSub}>Utrzymanie 1 ptaka / msc</Text>
                </View>
              </View>
            </View>
          );
        })()}

        {/* Custom Logged Feedings Card */}
        {customLogs.length > 0 && (
          <View style={styles.customLogsCard}>
            <Text style={styles.customLogsTitle}>ZAPISANE WPISY W DZIENNIKU GOŁĘBNIKA</Text>
            {customLogs.map((log, index) => (
              <View key={index} style={styles.customLogItem}>
                <View style={styles.customLogHeader}>
                  <Text style={styles.customLogDate}>{log.date}</Text>
                  <Text style={styles.customLogPhase}>{log.phase}</Text>
                </View>
                <Text style={styles.customLogMix}>🥣 {log.mixName}</Text>
                {log.waterSupplements && (
                  <Text style={styles.customLogWater}>💧 Poidło: {log.waterSupplements}</Text>
                )}
                {log.feedSupplements && (
                  <Text style={styles.customLogFeed}>🌿 Dodatki: {log.feedSupplements}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Action Button */}
        <FieldButton
          title="+ Zapisz Własny Dziennik Karmienia"
          onPress={() => setIsFeedingModalVisible(true)}
          style={{ marginTop: 14 }}
        />
        <FieldButton
          title="🔬 Laboratorium Paszowe 20 Ziaren"
          onPress={() => setIsFeedCalcOpen(true)}
          variant="secondary"
          style={{ marginTop: 10 }}
          testID="btn-open-feed-calc"
        />
        <FieldButton
          title="💧 Laboratorium Poidła i Elektrolitów (RD-17/18)"
          onPress={() => setIsDrinkerLabOpen(true)}
          variant="secondary"
          style={{ marginTop: 10 }}
          testID="btn-open-drinker-lab"
        />
      </ScrollView>

      {/* Add Feeding Log Modal */}
      <AddFeedingLogModal
        visible={isFeedingModalVisible}
        onClose={() => setIsFeedingModalVisible(false)}
        defaultPhase={selectedPhase}
        onSave={async (newLog) => {
          setCustomLogs((prev) => [
            {
              date: newLog.date,
              phase: newLog.phase,
              mixName: newLog.mixName,
              waterSupplements: newLog.waterSupplements,
              feedSupplements: newLog.feedSupplements,
            },
            ...prev,
          ]);
          Alert.alert('Zapisano!', `Mieszanka "${newLog.mixName}" została dodana do dziennika żywienia.`);
        }}
      />

      {/* 20-Grain Feed Calculator Modal */}
      <FeedCalculatorModal
        visible={isFeedCalcOpen}
        onClose={() => setIsFeedCalcOpen(false)}
      />

      {/* Drinker pH & Rehydration Osmolarity Lab Modal */}
      <DrinkerLabModal
        visible={isDrinkerLabOpen}
        onClose={() => setIsDrinkerLabOpen(false)}
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
  phaseScroll: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  phaseChip: {
    backgroundColor: '#1E2127',
    borderWidth: 1,
    borderColor: '#2F343F',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  phaseChipActive: {
    backgroundColor: '#E5A93C',
    borderColor: '#E5A93C',
  },
  phaseChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A0A6B2',
  },
  phaseChipTextActive: {
    color: '#121417',
  },
  protocolCard: {
    backgroundColor: '#1E2127',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 14,
  },
  protocolTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E5A93C',
    marginBottom: 6,
  },
  protocolDesc: {
    fontSize: 13,
    color: '#D4D8E0',
    lineHeight: 18,
    marginBottom: 10,
  },
  mineralsRow: {
    borderTopWidth: 1,
    borderTopColor: '#262930',
    paddingTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mineralsLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5A93C',
  },
  mineralsText: {
    fontSize: 12,
    color: '#8E94A0',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dayButton: {
    flex: 1,
    backgroundColor: '#1E2127',
    paddingVertical: 10,
    marginHorizontal: 3,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  dayButtonActive: {
    backgroundColor: '#E5A93C',
    borderColor: '#E5A93C',
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#A0A6B2',
  },
  dayButtonTextActive: {
    color: '#121417',
  },
  dayCard: {
    backgroundColor: '#1E2127',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  dayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#262930',
    paddingBottom: 8,
  },
  dayTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.5,
  },
  grammageText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  sectionBlock: {
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5A93C',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  feedText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 20,
  },
  feedTime: {
    fontWeight: '800',
    color: '#A0A6B2',
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#15171B',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  profileBadge: {
    alignItems: 'center',
  },
  profileVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#E5A93C',
    fontFamily: 'monospace',
  },
  profileLbl: {
    fontSize: 11,
    color: '#8E94A0',
    marginTop: 2,
  },
  supplementItem: {
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 18,
  },
  emptySupplement: {
    fontSize: 13,
    color: '#8E94A0',
    fontStyle: 'italic',
  },
  notesBox: {
    backgroundColor: '#332712',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  notesText: {
    color: '#FFE082',
    fontSize: 12,
    fontWeight: '700',
  },
  budgetCard: {
    backgroundColor: '#1E2127',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginTop: 14,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#262930',
    paddingBottom: 10,
    marginBottom: 12,
  },
  budgetTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.5,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperLabel: {
    fontSize: 12,
    color: '#8E94A0',
    fontWeight: '600',
  },
  stepperBtn: {
    backgroundColor: '#2A2E38',
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  flockCountText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginHorizontal: 8,
    fontFamily: 'monospace',
  },
  budgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  budgetItem: {
    width: '48%',
    backgroundColor: '#15171B',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#262930',
  },
  budgetNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F0F2F5',
    fontFamily: 'monospace',
  },
  budgetSub: {
    fontSize: 11,
    color: '#8E94A0',
    marginTop: 4,
    lineHeight: 14,
  },
  customLogsCard: {
    backgroundColor: '#1E2127',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginTop: 14,
  },
  customLogsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.5,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#262930',
    paddingBottom: 8,
  },
  customLogItem: {
    backgroundColor: '#15171B',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#262930',
  },
  customLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  customLogDate: {
    fontSize: 11,
    color: '#8E94A0',
    fontFamily: 'monospace',
  },
  customLogPhase: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E5A93C',
  },
  customLogMix: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  customLogWater: {
    fontSize: 12,
    color: '#64B5F6',
    marginBottom: 2,
  },
  customLogFeed: {
    fontSize: 12,
    color: '#81C784',
  },
});

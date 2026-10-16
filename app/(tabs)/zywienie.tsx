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
} from 'react-native';
import { AnnualLoftPhase, getFeedingProtocol } from '../../src/domain/nutrition';
import { FieldButton } from '../../src/components/FieldButton';

export default function NutritionScreen() {
  const [selectedPhase, setSelectedPhase] = useState<AnnualLoftPhase>('racing_widowhood');
  const [selectedDay, setSelectedDay] = useState<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'>('tue');

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

        {/* Action Button */}
        <FieldButton
          title="+ Zapisz Własny Dziennik Karmienia"
          onPress={() => {}}
          style={{ marginTop: 14 }}
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
});

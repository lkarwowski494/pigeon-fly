/**
 * PIGEON-FLY — ClutchLifecycleModal
 * Interactive management of clutch stages: egg laying, candling (owoskopia),
 * hatching, young bird banding with official rings, and weaning.
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ClutchWithParents } from '../db/breedingRepository';
import { EggStatus, calculateClutchMilestones, evaluateClutchStage } from '../domain/breeding';
import { FieldButton } from './FieldButton';

export interface ClutchLifecycleModalProps {
  visible: boolean;
  clutch: ClutchWithParents | null;
  onClose: () => void;
  onSave: (updatedClutch: ClutchWithParents) => void;
}

export function ClutchLifecycleModal({
  visible,
  clutch,
  onClose,
  onSave,
}: ClutchLifecycleModalProps) {
  if (!clutch) return null;

  const [egg1Date, setEgg1Date] = useState(clutch.egg1Date || '');
  const [egg2Date, setEgg2Date] = useState(clutch.egg2Date || '');
  const [egg1Status, setEgg1Status] = useState<EggStatus>(clutch.egg1Status || 'expected');
  const [egg2Status, setEgg2Status] = useState<EggStatus>(clutch.egg2Status || 'expected');
  const [hatchDate, setHatchDate] = useState(clutch.hatchDate || '');
  const [chick1Ring, setChick1Ring] = useState(clutch.chick1RingNumber || '');
  const [chick2Ring, setChick2Ring] = useState(clutch.chick2RingNumber || '');
  const [chick1Banded, setChick1Banded] = useState(Boolean(clutch.chick1Banded));
  const [chick2Banded, setChick2Banded] = useState(Boolean(clutch.chick2Banded));
  const [weanedDate, setWeanedDate] = useState(clutch.weanedDate || '');

  useEffect(() => {
    if (clutch) {
      setEgg1Date(clutch.egg1Date || '');
      setEgg2Date(clutch.egg2Date || '');
      setEgg1Status(clutch.egg1Status || 'expected');
      setEgg2Status(clutch.egg2Status || 'expected');
      setHatchDate(clutch.hatchDate || '');
      setChick1Ring(clutch.chick1RingNumber || '');
      setChick2Ring(clutch.chick2RingNumber || '');
      setChick1Banded(Boolean(clutch.chick1Banded));
      setChick2Banded(Boolean(clutch.chick2Banded));
      setWeanedDate(clutch.weanedDate || '');
    }
  }, [clutch]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const milestones = calculateClutchMilestones({
    pairDate: clutch.pairedDate,
    egg1Date: egg1Date || undefined,
  });

  const currentStageInfo = evaluateClutchStage({
    ...clutch,
    egg1Date: egg1Date || undefined,
    egg2Date: egg2Date || undefined,
    egg1Status,
    egg2Status,
    hatchDate: hatchDate || undefined,
    chick1Banded,
    chick2Banded,
    weanedDate: weanedDate || undefined,
  });

  const handleLayEgg1Today = () => {
    setEgg1Date(todayStr);
    if (egg1Status === 'expected') setEgg1Status('laid');
    const d = new Date();
    d.setDate(d.getDate() + 2);
    setEgg2Date(d.toISOString().slice(0, 10));
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  };

  const handleLayEgg2Today = () => {
    setEgg2Date(todayStr);
    if (egg2Status === 'expected') setEgg2Status('laid');
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  };

  const handleMarkHatchedToday = () => {
    setHatchDate(todayStr);
    if (egg1Status === 'fertile' || egg1Status === 'laid') setEgg1Status('hatched');
    if (egg2Status === 'fertile' || egg2Status === 'laid') setEgg2Status('hatched');
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  const handleMarkWeanedToday = () => {
    setWeanedDate(todayStr);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  const handleSave = () => {
    const updated: ClutchWithParents = {
      ...clutch,
      egg1Date: egg1Date.trim() || undefined,
      egg2Date: egg2Date.trim() || undefined,
      egg1Status,
      egg2Status,
      hatchDate: hatchDate.trim() || undefined,
      chick1RingNumber: chick1Ring.trim() || undefined,
      chick2RingNumber: chick2Ring.trim() || undefined,
      chick1Banded,
      chick2Banded,
      weanedDate: weanedDate.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    onSave(updated);
    onClose();
  };

  const eggStatuses: { status: EggStatus; label: string; icon: string }[] = [
    { status: 'laid', label: 'Zniesione', icon: '🥚' },
    { status: 'fertile', label: 'Zalężone', icon: '🟢' },
    { status: 'infertile', label: 'Czyste (Zbuk)', icon: '🔴' },
    { status: 'hatched', label: 'Wyklute', icon: '🐣' },
    { status: 'broken', label: 'Stłuczone', icon: '💥' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.cellTitle}>{clutch.nestBox} — Cykl Lęgowy</Text>
                <Text style={styles.parentsText}>
                  ♂ {clutch.cockRingNumber} × ♀ {clutch.henRingNumber}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Alert Banner if any */}
            {currentStageInfo.alertMessage && (
              <View style={styles.alertCard}>
                <Text style={styles.alertText}>⚠️ {currentStageInfo.alertMessage}</Text>
              </View>
            )}

            {/* Biological Milestones Overview */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>📅 HARMONOGRAM BIOLOGICZNY</Text>
              <View style={styles.milestoneGrid}>
                <View style={styles.milestoneRow}>
                  <Text style={styles.milestoneLbl}>Data parowania:</Text>
                  <Text style={styles.milestoneVal}>{clutch.pairedDate}</Text>
                </View>
                <View style={styles.milestoneRow}>
                  <Text style={styles.milestoneLbl}>Owoskopia (Dzień 5):</Text>
                  <Text style={[styles.milestoneVal, { color: '#E5A93C' }]}>{milestones.candlingDate}</Text>
                </View>
                <View style={styles.milestoneRow}>
                  <Text style={styles.milestoneLbl}>Wylęg (Dzień 18):</Text>
                  <Text style={[styles.milestoneVal, { color: '#4CAF50' }]}>{milestones.expectedHatchDate}</Text>
                </View>
                <View style={styles.milestoneRow}>
                  <Text style={styles.milestoneLbl}>Obrączkowanie (Dni 6-8):</Text>
                  <Text style={[styles.milestoneVal, { color: '#64B5F6' }]}>
                    {milestones.bandingStartDate} do {milestones.bandingEndDate}
                  </Text>
                </View>
                <View style={styles.milestoneRow}>
                  <Text style={styles.milestoneLbl}>Odsadzenie (Dzień 24):</Text>
                  <Text style={styles.milestoneVal}>{milestones.weaningDate}</Text>
                </View>
              </View>
            </View>

            {/* Eggs & Candling (Owoskopia) */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>🥚 JAJA I OWOSKOPIA (PRZEŚWIETLANIE)</Text>

              {/* Egg 1 */}
              <View style={styles.eggBlock}>
                <View style={styles.eggTitleRow}>
                  <Text style={styles.eggBlockTitle}>Jajko 1:</Text>
                  <TouchableOpacity onPress={handleLayEgg1Today} style={styles.quickDateBtn}>
                    <Text style={styles.quickDateText}>+ Zniesione Dzisiaj</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  value={egg1Date}
                  onChangeText={setEgg1Date}
                  placeholder="Data zniesienia (RRRR-MM-DD)"
                  placeholderTextColor="#8E94A0"
                />
                <Text style={styles.subLbl}>Wynik owoskopii / status:</Text>
                <View style={styles.pillsRow}>
                  {eggStatuses.map((item) => (
                    <TouchableOpacity
                      key={item.status}
                      onPress={() => setEgg1Status(item.status)}
                      style={[
                        styles.statusPill,
                        egg1Status === item.status && styles.activePill,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          egg1Status === item.status && styles.activePillText,
                        ]}
                      >
                        {item.icon} {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Egg 2 */}
              <View style={[styles.eggBlock, { borderTopWidth: 1, borderTopColor: '#2F343F', paddingTop: 12 }]}>
                <View style={styles.eggTitleRow}>
                  <Text style={styles.eggBlockTitle}>Jajko 2 (+44h):</Text>
                  <TouchableOpacity onPress={handleLayEgg2Today} style={styles.quickDateBtn}>
                    <Text style={styles.quickDateText}>+ Zniesione Dzisiaj</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  value={egg2Date}
                  onChangeText={setEgg2Date}
                  placeholder="Data zniesienia (RRRR-MM-DD)"
                  placeholderTextColor="#8E94A0"
                />
                <Text style={styles.subLbl}>Wynik owoskopii / status:</Text>
                <View style={styles.pillsRow}>
                  {eggStatuses.map((item) => (
                    <TouchableOpacity
                      key={item.status}
                      onPress={() => setEgg2Status(item.status)}
                      style={[
                        styles.statusPill,
                        egg2Status === item.status && styles.activePill,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          egg2Status === item.status && styles.activePillText,
                        ]}
                      >
                        {item.icon} {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Hatching & Banding Window */}
            <View style={styles.sectionCard}>
              <View style={styles.eggTitleRow}>
                <Text style={styles.sectionHeading}>🐣 WYLĘG I OBRĄCZKOWANIE (6-8 DZIEŃ)</Text>
                <TouchableOpacity onPress={handleMarkHatchedToday} style={styles.quickDateBtn}>
                  <Text style={styles.quickDateText}>+ Wyklute Dzisiaj</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                value={hatchDate}
                onChangeText={setHatchDate}
                placeholder="Data wyklucia (RRRR-MM-DD)"
                placeholderTextColor="#8E94A0"
              />

              {/* Chick 1 */}
              <View style={styles.chickRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subLbl}>Pisklę 1 — Nr Obrączki Rodowej:</Text>
                  <TextInput
                    style={styles.input}
                    value={chick1Ring}
                    onChangeText={setChick1Ring}
                    placeholder="PL-0284-26-..."
                    placeholderTextColor="#8E94A0"
                    autoCapitalize="characters"
                  />
                </View>
                <TouchableOpacity
                  onPress={() => setChick1Banded(!chick1Banded)}
                  style={[styles.bandBtn, chick1Banded && styles.bandBtnActive]}
                >
                  <Text style={styles.bandBtnText}>
                    {chick1Banded ? '✓ Zaobrączkowany' : 'Obrączkuj'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Chick 2 */}
              <View style={styles.chickRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subLbl}>Pisklę 2 — Nr Obrączki Rodowej:</Text>
                  <TextInput
                    style={styles.input}
                    value={chick2Ring}
                    onChangeText={setChick2Ring}
                    placeholder="PL-0284-26-..."
                    placeholderTextColor="#8E94A0"
                    autoCapitalize="characters"
                  />
                </View>
                <TouchableOpacity
                  onPress={() => setChick2Banded(!chick2Banded)}
                  style={[styles.bandBtn, chick2Banded && styles.bandBtnActive]}
                >
                  <Text style={styles.bandBtnText}>
                    {chick2Banded ? '✓ Zaobrączkowany' : 'Obrączkuj'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Weaning */}
            <View style={styles.sectionCard}>
              <View style={styles.eggTitleRow}>
                <Text style={styles.sectionHeading}>🕊️ ODSADZENIE MŁODYCH (24. DZIEŃ)</Text>
                <TouchableOpacity onPress={handleMarkWeanedToday} style={styles.quickDateBtn}>
                  <Text style={styles.quickDateText}>+ Odsadzone Dziś</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                value={weanedDate}
                onChangeText={setWeanedDate}
                placeholder="Data odsadzenia do przedziału młodzieży (RRRR-MM-DD)"
                placeholderTextColor="#8E94A0"
              />
            </View>

            {/* Actions */}
            <View style={styles.footerRow}>
              <FieldButton
                title="💾 ZAPISZ CYKL LĘGU"
                onPress={handleSave}
                testID="btn-save-clutch-lifecycle"
                style={{ flex: 1 }}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1E2127',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
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
  cellTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#E5A93C',
  },
  parentsText: {
    fontSize: 14,
    color: '#D4D8E0',
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 8,
  },
  closeText: {
    fontSize: 22,
    color: '#8E94A0',
    fontWeight: '800',
  },
  alertCard: {
    backgroundColor: 'rgba(251, 140, 0, 0.15)',
    borderColor: '#FB8C00',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  alertText: {
    color: '#FFB74D',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: '#15171C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
    padding: 14,
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  milestoneGrid: {
    gap: 6,
  },
  milestoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: '#222630',
    paddingBottom: 4,
  },
  milestoneLbl: {
    fontSize: 13,
    color: '#8E94A0',
  },
  milestoneVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F0F2F5',
  },
  eggBlock: {
    marginBottom: 10,
  },
  eggTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eggBlockTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F0F2F5',
  },
  quickDateBtn: {
    backgroundColor: '#2A303C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quickDateText: {
    color: '#E5A93C',
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#1E2127',
    borderWidth: 1,
    borderColor: '#373D4B',
    borderRadius: 8,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
    marginBottom: 8,
  },
  subLbl: {
    fontSize: 12,
    color: '#8E94A0',
    marginBottom: 6,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusPill: {
    backgroundColor: '#222630',
    borderWidth: 1,
    borderColor: '#373D4B',
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  activePill: {
    backgroundColor: 'rgba(229, 169, 60, 0.2)',
    borderColor: '#E5A93C',
  },
  statusPillText: {
    fontSize: 12,
    color: '#8E94A0',
    fontWeight: '600',
  },
  activePillText: {
    color: '#E5A93C',
    fontWeight: '700',
  },
  chickRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 10,
  },
  bandBtn: {
    backgroundColor: '#2A303C',
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#373D4B',
  },
  bandBtnActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#4CAF50',
  },
  bandBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  footerRow: {
    marginTop: 8,
  },
});

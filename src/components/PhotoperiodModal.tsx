/**
 * PIGEON-FLY — PhotoperiodModal (BR-ZDR-007, RD-13, RD-14)
 * Comprehensive Photoperiod & Chronobiology Manager for Verdunkelung (Darkness)
 * and Belichtung (Lighting) systems. Controls pineal gland melatonin synthesis,
 * halts primary flight feather moult, and automates roller blind notifications.
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  PhotoperiodConfig,
  PhotoperiodRegime,
  PHOTOPERIOD_PRESETS,
  evaluateDailyPhotoperiod,
  generateBlindAlarms,
  calculateScheduleHours,
  calculateSolarTimes,
  timeStringToMinutes,
  minutesToTimeString,
} from '../domain/photoperiod';
import { FieldButton } from './FieldButton';

export interface PhotoperiodModalProps {
  visible: boolean;
  onClose: () => void;
  config?: PhotoperiodConfig;
  onSaveConfig?: (config: PhotoperiodConfig) => void;
  loftLatitude?: number;
}

const DEFAULT_CONFIG: PhotoperiodConfig = {
  id: 'cfg-loft-01',
  loftId: 'loft-01',
  ...PHOTOPERIOD_PRESETS.verdunkelung,
};

export function PhotoperiodModal({
  visible,
  onClose,
  config,
  onSaveConfig,
  loftLatitude = 52.23, // Warsaw / Central Poland
}: PhotoperiodModalProps) {
  const [currentConfig, setCurrentConfig] = useState<PhotoperiodConfig>(
    config || DEFAULT_CONFIG
  );
  const [activeRegime, setActiveRegime] = useState<PhotoperiodRegime>(
    currentConfig.regime
  );

  const now = new Date();
  const evaluation = evaluateDailyPhotoperiod(currentConfig, now);
  const solar = calculateSolarTimes(loftLatitude, now);
  const alarms = generateBlindAlarms(currentConfig);

  const handleSelectRegime = (regime: PhotoperiodRegime) => {
    setActiveRegime(regime);
    const preset = PHOTOPERIOD_PRESETS[regime];
    setCurrentConfig((prev) => ({
      ...prev,
      ...preset,
      regime,
    }));
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const handleAdjustTime = (field: 'lightsOnTime' | 'lightsOffTime', deltaMinutes: number) => {
    const currentMin = timeStringToMinutes(currentConfig[field]);
    const updatedMin = (currentMin + deltaMinutes + 1440) % 1440;
    const updatedTimeStr = minutesToTimeString(updatedMin);

    const newConfig = {
      ...currentConfig,
      [field]: updatedTimeStr,
      regime: 'custom' as PhotoperiodRegime,
    };
    const { lightHours, darkHours } = calculateScheduleHours(
      newConfig.lightsOnTime,
      newConfig.lightsOffTime
    );
    newConfig.targetLightHours = lightHours;
    newConfig.targetDarkHours = darkHours;

    setCurrentConfig(newConfig);
    setActiveRegime('custom');
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const handleTestAlarm = (action: 'close_blinds' | 'open_blinds') => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}

    if (action === 'close_blinds') {
      Alert.alert(
        '🌙 ALARM ROLET: CIEMNIA (18:00)',
        'Zbliża się pora zaciemnienia gołębnika! Opuść szczelne rolety zewnętrzne. ' +
          'Upewnij się, że wentylacja z labiryntem światłoszczelnym pozostaje drożna (<0.5 lx).'
      );
    } else {
      Alert.alert(
        '☀️ ALARM ROLET: PODNIESIENIE (08:00)',
        'Pora na światło dzienne! Podnieś rolety zewnętrzne gołębnika. Rozpoczyna się 10-godzinny dzień biologiczny.'
      );
    }
  };

  const handleSave = () => {
    onSaveConfig?.(currentConfig);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    Alert.alert(
      'Zapisano Harmonogram',
      `Aktywowano profil fotoperiodu: ${currentConfig.name} (${currentConfig.lightsOnTime} – ${currentConfig.lightsOffTime}).`
    );
    onClose();
  };

  // 24h timeline percent calculation
  const onMin = timeStringToMinutes(currentConfig.lightsOnTime);
  const offMin = timeStringToMinutes(currentConfig.lightsOffTime);
  const currentMin = now.getHours() * 60 + now.getMinutes();

  const dayStartPct = ((onMin / 1440) * 100).toFixed(1);
  const dayWidthPct = ((((offMin - onMin + 1440) % 1440) / 1440) * 100).toFixed(1);
  const currentIndicatorPct = ((currentMin / 1440) * 100).toFixed(1);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <View style={styles.pillBadge}>
                  <Text style={styles.pillDot}>●</Text>
                  <Text style={styles.pillText}>CHRONOBIOLOGIA STADA</Text>
                </View>
                <Text style={styles.title}>FOTOPERIOD I AUTOMATYKA ROLET</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="btn-close-photoperiod">
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Live Evaluation Card */}
            <View
              style={[
                styles.liveStatusCard,
                evaluation.phase === 'closing_soon' || evaluation.phase === 'opening_soon'
                  ? styles.cardWarningBorder
                  : null,
              ]}
            >
              <View style={styles.liveHeader}>
                <Text style={styles.liveTitle}>AKTUALNY STAN DOBOWY</Text>
                <View
                  style={[
                    styles.phaseBadge,
                    evaluation.phase === 'day'
                      ? styles.phaseBadgeDay
                      : evaluation.phase === 'night'
                      ? styles.phaseBadgeNight
                      : styles.phaseBadgeWarning,
                  ]}
                >
                  <Text style={styles.phaseBadgeText}>
                    {evaluation.phase === 'day'
                      ? '☀️ FAZA ŚWIATŁA'
                      : evaluation.phase === 'night'
                      ? '🌙 FAZA CIEMNOŚCI'
                      : '⏰ WYMAGA UWAGI'}
                  </Text>
                </View>
              </View>

              <Text style={styles.nextEventHighlight}>
                {evaluation.nextTransitionName} za {evaluation.minutesUntilNextTransition} min (o{' '}
                {evaluation.nextTransitionTime})
              </Text>

              <Text style={styles.liveMeta}>
                Godziny dobowe:{' '}
                <Text style={styles.boldText}>{evaluation.lightHours}h Światła</Text> /{' '}
                <Text style={styles.boldText}>{evaluation.darkHours}h Ciemności</Text>
              </Text>
              <Text style={styles.liveMeta}>
                Naturalny wschód / zachód słońca dzisiaj: {solar.sunrise} – {solar.sunset} ({solar.dayLengthHours}h)
              </Text>
            </View>

            {/* 24-Hour Graphical Timeline */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>24-GODZINNY CYKL ŚWIATŁA</Text>
              <View style={styles.timelineBar}>
                {/* Night baseline */}
                <View style={styles.nightBlock} />
                {/* Day block */}
                <View
                  style={[
                    styles.dayBlock,
                    {
                      left: `${dayStartPct}%` as any,
                      width: `${dayWidthPct}%` as any,
                    },
                  ]}
                />
                {/* Current time pin */}
                <View
                  style={[
                    styles.currentPin,
                    { left: `${currentIndicatorPct}%` as any },
                  ]}
                />
              </View>

              <View style={styles.timelineLabels}>
                <Text style={styles.timelineLabelText}>00:00</Text>
                <Text style={[styles.timelineLabelText, { color: '#E5A93C' }]}>
                  ☀️ {currentConfig.lightsOnTime}
                </Text>
                <Text style={[styles.timelineLabelText, { color: '#4E88FF' }]}>
                  🌙 {currentConfig.lightsOffTime}
                </Text>
                <Text style={styles.timelineLabelText}>24:00</Text>
              </View>
            </View>

            {/* Preset Selector */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>MISTRZOWSKIE SYSTEMY FOTOPERIODU</Text>
              <View style={styles.presetButtonsRow}>
                <TouchableOpacity
                  style={[
                    styles.presetBtn,
                    activeRegime === 'verdunkelung' && styles.presetBtnActive,
                  ]}
                  onPress={() => handleSelectRegime('verdunkelung')}
                  testID="preset-verdunkelung"
                >
                  <Text style={styles.presetEmoji}>🌙</Text>
                  <Text style={styles.presetBtnTitle}>Ciemnia (Verdunkelung)</Text>
                  <Text style={styles.presetBtnSub}>10h światła / 14h nocy</Text>
                  <Text style={styles.presetDateSub}>15.03 – 21.06</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presetBtn,
                    activeRegime === 'belichtung' && styles.presetBtnActive,
                  ]}
                  onPress={() => handleSelectRegime('belichtung')}
                  testID="preset-belichtung"
                >
                  <Text style={styles.presetEmoji}>💡</Text>
                  <Text style={styles.presetBtnTitle}>Doświetlanie (Belichtung)</Text>
                  <Text style={styles.presetBtnSub}>16h światła / 8h nocy</Text>
                  <Text style={styles.presetDateSub}>22.06 – 30.09</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.presetButtonsRow, { marginTop: 8 }]}>
                <TouchableOpacity
                  style={[
                    styles.presetBtn,
                    activeRegime === 'natural' && styles.presetBtnActive,
                  ]}
                  onPress={() => handleSelectRegime('natural')}
                  testID="preset-natural"
                >
                  <Text style={styles.presetEmoji}>☀️</Text>
                  <Text style={styles.presetBtnTitle}>Rytm Naturalny</Text>
                  <Text style={styles.presetBtnSub}>Słoneczny / Pierzenie</Text>
                  <Text style={styles.presetDateSub}>Październik – Marzec</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presetBtn,
                    activeRegime === 'custom' && styles.presetBtnActive,
                  ]}
                  onPress={() => handleSelectRegime('custom')}
                  testID="preset-custom"
                >
                  <Text style={styles.presetEmoji}>⚙️</Text>
                  <Text style={styles.presetBtnTitle}>Własny Hodowcy</Text>
                  <Text style={styles.presetBtnSub}>Ręczna regulacja</Text>
                  <Text style={styles.presetDateSub}>Dowolne godziny</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Time Adjusters */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>PRECYZYJNA REGULACJA GODZIN</Text>

              <View style={styles.adjustRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.adjustLabel}>☀️ Odsłonięcie / Światło:</Text>
                  <Text style={styles.adjustTimeVal}>{currentConfig.lightsOnTime}</Text>
                </View>
                <View style={styles.stepperGroup}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => handleAdjustTime('lightsOnTime', -15)}
                  >
                    <Text style={styles.stepBtnText}>-15m</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => handleAdjustTime('lightsOnTime', 15)}
                  >
                    <Text style={styles.stepBtnText}>+15m</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.adjustRow, { marginTop: 12 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.adjustLabel}>🌙 Zasłonięcie / Ciemnia:</Text>
                  <Text style={styles.adjustTimeVal}>{currentConfig.lightsOffTime}</Text>
                </View>
                <View style={styles.stepperGroup}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => handleAdjustTime('lightsOffTime', -15)}
                  >
                    <Text style={styles.stepBtnText}>-15m</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => handleAdjustTime('lightsOffTime', 15)}
                  >
                    <Text style={styles.stepBtnText}>+15m</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Alarms and Notifications List */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>AUTOMATYCZNE ALERTY ROLET</Text>
              {alarms.map((alarm) => (
                <View key={alarm.id} style={styles.alarmItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alarmTime}>{alarm.time} (Akcja: {alarm.eventTime})</Text>
                    <Text style={styles.alarmTitle}>{alarm.title}</Text>
                    <Text style={styles.alarmMsg}>{alarm.message}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.testAlertBtn}
                    onPress={() => handleTestAlarm(alarm.action)}
                  >
                    <Text style={styles.testAlertText}>🧪 Testuj</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Biological Rationale (RD-13 & RD-14) */}
            <View style={styles.bioCard}>
              <Text style={styles.bioTitle}>DLACZEGO TO DZIAŁA? (RD-13 / RD-14)</Text>
              <Text style={styles.bioText}>{evaluation.biologicalGoal}</Text>
              <Text style={[styles.bioText, { marginTop: 6 }]}>
                {evaluation.hormonalStatusText}
              </Text>
            </View>

            {/* Save Button */}
            <FieldButton
              title="💾 Zapisz i Aktywuj Harmonogram"
              onPress={handleSave}
              style={{ marginTop: 16 }}
              testID="btn-save-photoperiod"
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
    backgroundColor: '#121417',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pillDot: {
    color: '#E5A93C',
    fontSize: 10,
  },
  pillText: {
    color: '#E5A93C',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E2127',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#8E94A0',
    fontSize: 18,
    fontWeight: '700',
  },
  liveStatusCard: {
    backgroundColor: '#1E2127',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  cardWarningBorder: {
    borderColor: '#E5A93C',
  },
  liveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveTitle: {
    color: '#8E94A0',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  phaseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  phaseBadgeDay: {
    backgroundColor: 'rgba(229, 169, 60, 0.2)',
  },
  phaseBadgeNight: {
    backgroundColor: 'rgba(78, 136, 255, 0.2)',
  },
  phaseBadgeWarning: {
    backgroundColor: 'rgba(229, 57, 53, 0.2)',
  },
  phaseBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  nextEventHighlight: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  liveMeta: {
    color: '#8E94A0',
    fontSize: 13,
    marginTop: 2,
  },
  boldText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#1E2127',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  sectionTitle: {
    color: '#8E94A0',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  timelineBar: {
    height: 24,
    backgroundColor: '#0E1116',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  nightBlock: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F172A',
  },
  dayBlock: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#E5A93C',
  },
  currentPin: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#FF3B30',
  },
  timelineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timelineLabelText: {
    color: '#8E94A0',
    fontSize: 11,
    fontWeight: '700',
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: '#121417',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  presetBtnActive: {
    borderColor: '#E5A93C',
    backgroundColor: 'rgba(229, 169, 60, 0.08)',
  },
  presetEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  presetBtnTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  presetBtnSub: {
    color: '#8E94A0',
    fontSize: 11,
  },
  presetDateSub: {
    color: '#E5A93C',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adjustLabel: {
    color: '#8E94A0',
    fontSize: 13,
  },
  adjustTimeVal: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  stepperGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  stepBtn: {
    backgroundColor: '#2F343F',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  stepBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  alarmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
  },
  alarmTime: {
    color: '#E5A93C',
    fontSize: 13,
    fontWeight: '800',
  },
  alarmTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  alarmMsg: {
    color: '#8E94A0',
    fontSize: 12,
    marginTop: 2,
  },
  testAlertBtn: {
    backgroundColor: '#2A2E38',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 10,
  },
  testAlertText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bioCard: {
    backgroundColor: 'rgba(78, 136, 255, 0.08)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(78, 136, 255, 0.3)',
    marginBottom: 8,
  },
  bioTitle: {
    color: '#4E88FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  bioText: {
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 18,
  },
});

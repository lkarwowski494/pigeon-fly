/**
 * PIGEON-FLY — Training Toss Optimizer Modal (Z-053)
 * Interactive route planner and safety evaluator for private pigeon tosses.
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
  evaluateTrainingTossPlan,
  TrainingSquadType,
  RaptorThreatLevel,
} from '../domain/trainingToss';

interface TrainingTossModalProps {
  visible: boolean;
  onClose: () => void;
  onStartSession?: (tossName: string, distanceKm: number) => void;
}

export const TrainingTossModal: React.FC<TrainingTossModalProps> = ({
  visible,
  onClose,
  onStartSession,
}) => {
  const [squadType, setSquadType] = useState<TrainingSquadType>('widowhood_cocks');
  const [distanceKmStr, setDistanceKmStr] = useState('35');
  const [releaseLocationName, setReleaseLocationName] = useState('Rawicz (Wywózka 35 km)');
  const [windSpeedStr, setWindSpeedStr] = useState('14');
  const [windDirStr, setWindDirStr] = useState('220'); // SW
  const [rainProbStr, setRainProbStr] = useState('5');
  const [tempCStr, setTempCStr] = useState('18');
  const [raptorThreat, setRaptorThreat] = useState<RaptorThreatLevel>('low');
  const [powerLinesCrossing, setPowerLinesCrossing] = useState(false);

  const distanceKm = parseFloat(distanceKmStr) || 35.0;
  const windSpeedKmh = parseFloat(windSpeedStr) || 12.0;
  const windDirectionDeg = parseFloat(windDirStr) || 210.0;
  const rainProbabilityPercent = parseFloat(rainProbStr) || 5;
  const temperatureC = parseFloat(tempCStr) || 18;

  const evaluation = evaluateTrainingTossPlan({
    tossName: `Wywózka: ${releaseLocationName}`,
    squadType,
    pigeonsCount: 30,
    homeLoft: {
      name: 'Gołębnik Macierzysty',
      coords: { latitude: 51.8700, longitude: 17.0200 },
    },
    releaseLocation: {
      name: releaseLocationName,
      coords: { latitude: 51.6100, longitude: 16.8500 },
      distanceKm,
    },
    plannedReleaseHour: '07:30',
    weather: {
      windSpeedKmh,
      windDirectionDeg,
      visibilityKm: 15,
      temperatureC,
      rainProbabilityPercent,
    },
    terrain: {
      raptorThreat,
      powerLinesCrossing,
    },
  });

  const handlePresetDistance = (km: number, name: string) => {
    setDistanceKmStr(km.toString());
    setReleaseLocationName(name);
  };

  const handleStartSession = () => {
    if (evaluation.status === 'NO_GO_ABORT') {
      Alert.alert(
        'Ostrzeżenie Bezpieczeństwa!',
        'Warunki pogodowe lub terenowe stwarzają wysokie ryzyko strat. Czy na pewno chcesz wystartować trening?',
        [
          { text: 'Anuluj', style: 'cancel' },
          {
            text: 'Wypuść Mimo To',
            style: 'destructive',
            onPress: () => {
              if (onStartSession) {
                onStartSession(evaluation.tossName, distanceKm);
              }
              onClose();
            },
          },
        ]
      );
      return;
    }

    if (onStartSession) {
      onStartSession(evaluation.tossName, distanceKm);
    }
    Alert.alert(
      'Rozpoczęto Trening!',
      `Zarejestrowano start wywózki ${distanceKm} km. Oczekiwany powrót za ok. ${evaluation.flightDurationMinutes} min.`
    );
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>🧭 Planer Wywózek Treningowych</Text>
            <Text style={styles.subtitle}>
              Aerodynamika trasy, drapieżniki & okno pogodowe
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            testID="btn-close-toss-modal"
            accessibilityRole="button"
          >
            <Text style={styles.closeBtnText}>✕ Zamknij</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Status Gauge Banner */}
          <View
            style={[
              styles.statusBanner,
              { borderColor: evaluation.statusColor },
            ]}
          >
            <View style={styles.statusRow}>
              <Text
                style={[styles.statusText, { color: evaluation.statusColor }]}
              >
                {evaluation.statusLabel}
              </Text>
              <Text style={styles.scorePill}>
                {evaluation.safetyScore} / 100 pkt
              </Text>
            </View>

            <View style={styles.flightStatsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Azymut Powrotu</Text>
                <Text style={styles.statVal}>
                  {evaluation.flightBearingDeg}° NE
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Przewidywany Czas</Text>
                <Text style={styles.statVal}>
                  {evaluation.flightDurationMinutes} min
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Szac. Prędkość</Text>
                <Text style={styles.statVal}>
                  {evaluation.expectedSpeedMPerMin} m/min
                </Text>
              </View>
            </View>

            <Text style={styles.windDesc}>
              💨 {evaluation.windDecomposition.windTypeDescription}
            </Text>
          </View>

          {/* Squad Type Selector */}
          <Text style={styles.sectionLabel}>Grupa Lotowa (Drużyna):</Text>
          <View style={styles.pillsRow}>
            {[
              { id: 'widowhood_cocks', label: 'Wdowce Samce' },
              { id: 'youngsters', label: 'Młode (Lotki)' },
              { id: 'marathon_squad', label: 'Maraton' },
              { id: 'widowhood_hens', label: 'Wdówki' },
            ].map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.squadPill,
                  squadType === s.id && styles.squadPillActive,
                ]}
                onPress={() => setSquadType(s.id as TrainingSquadType)}
              >
                <Text
                  style={[
                    styles.squadPillText,
                    squadType === s.id && styles.squadPillTextActive,
                  ]}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Distance Presets */}
          <Text style={styles.sectionLabel}>Dystans Wywózki:</Text>
          <View style={styles.pillsRow}>
            {[
              { km: 15, name: 'Krobia (15 km - Rozruch)' },
              { km: 30, name: 'Rawicz (30 km - Środa)' },
              { km: 50, name: 'Trzebnica (50 km - Skrzydło)' },
              { km: 75, name: 'Wrocław Północ (75 km - Szlif)' },
            ].map((p) => (
              <TouchableOpacity
                key={p.km}
                style={[
                  styles.distPill,
                  distanceKm === p.km && styles.distPillActive,
                ]}
                onPress={() => handlePresetDistance(p.km, p.name)}
              >
                <Text
                  style={[
                    styles.distPillText,
                    distanceKm === p.km && styles.distPillTextActive,
                  ]}
                >
                  {p.km} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Hazards & Alerts */}
          {evaluation.hazardsDetected.length > 0 && (
            <View style={styles.hazardsCard}>
              <Text style={styles.hazardsTitle}>⚠️ Wykryte Zagrożenia na Trasie:</Text>
              {evaluation.hazardsDetected.map((h, idx) => (
                <Text key={idx} style={styles.hazardBullet}>
                  • {h}
                </Text>
              ))}
            </View>
          )}

          {/* Tactical Advice */}
          <View style={styles.adviceCard}>
            <Text style={styles.adviceTitle}>💡 Wskazówki Treningowe:</Text>
            <Text style={styles.windowText}>
              ⏰ Zalecane okno startu: {evaluation.optimalReleaseWindow}
            </Text>
            {evaluation.tacticalAdvice.map((a, idx) => (
              <Text key={idx} style={styles.adviceBullet}>
                ✓ {a}
              </Text>
            ))}
          </View>

          {/* Spacer */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Footer Action Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.startBtn,
              { backgroundColor: evaluation.statusColor },
            ]}
            onPress={handleStartSession}
            testID="btn-start-toss-session"
            accessibilityRole="button"
          >
            <Text style={styles.startBtnText}>
              🚀 ROZPOCZNIJ WYWÓZKĘ ({distanceKm} KM)
            </Text>
          </TouchableOpacity>
        </View>
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
  statusBanner: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  scorePill: {
    backgroundColor: '#0F172A',
    color: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 'bold',
  },
  flightStatsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 2,
  },
  statVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  windDesc: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  squadPill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 44,
    justifyContent: 'center',
  },
  squadPillActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#3B82F6',
  },
  squadPillText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  squadPillTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  distPill: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  distPillActive: {
    backgroundColor: '#059669',
    borderColor: '#10B981',
  },
  distPillText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  distPillTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  hazardsCard: {
    backgroundColor: '#450A0A',
    borderColor: '#DC2626',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  hazardsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#F87171',
    marginBottom: 6,
  },
  hazardBullet: {
    fontSize: 12,
    color: '#FECACA',
    lineHeight: 18,
    marginBottom: 4,
  },
  adviceCard: {
    backgroundColor: '#064E3B',
    borderColor: '#059669',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  adviceTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#A7F3D0',
    marginBottom: 6,
  },
  windowText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 6,
  },
  adviceBullet: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
    marginBottom: 4,
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
  startBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 56, // Field Mode compliant
    justifyContent: 'center',
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

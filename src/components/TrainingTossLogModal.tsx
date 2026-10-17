/**
 * PIGEON-FLY — Electronic Training Toss Log Modal (Z-078 / DEC-92)
 * Field Mode ergonomic interface (>= 48-56pt touch targets), dark theme (#121417).
 * Private tosses tracking, lead speed, 15-minute flock cohesion index, and season readiness scoring.
 */

import React, { useState, useMemo } from 'react';
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
  TrainingTossLogEntry,
  evaluateFlockSeasonReadiness,
  generateTrainingTossLogSheetHtml,
} from '../domain/trainingTossLog';
import { PdfService } from '../services/pdfService';
import { FieldButton } from './FieldButton';

interface TrainingTossLogModalProps {
  visible: boolean;
  onClose: () => void;
  loftName?: string;
  seasonYear?: number;
}

const DEFAULT_TOSSES: TrainingTossLogEntry[] = [
  {
    id: 'toss-1',
    tossDate: '2026-04-05',
    tossName: 'Wywózka 1: Borek Wlkp',
    squadType: 'youngsters',
    releaseLocation: 'Borek Wlkp (Pola)',
    distanceKm: 15.0,
    azimuthDeg: 210,
    releaseTime: '08:00',
    leadArrivalTime: '08:14',
    tailArrivalTime: '08:35',
    basketedCount: 40,
    leadGroupCount: 12,
    returned15MinCount: 36, // 90%
    totalReturnedSameDayCount: 40,
    ambientTempC: 14,
    windCondition: 'SW 8 km/h',
    notes: 'Błyskawiczne odejście z kosza bez krążenia.',
  },
  {
    id: 'toss-2',
    tossDate: '2026-04-09',
    tossName: 'Wywózka 2: Gostyń Północ',
    squadType: 'youngsters',
    releaseLocation: 'Gostyń Północ',
    distanceKm: 30.0,
    azimuthDeg: 212,
    releaseTime: '07:30',
    leadArrivalTime: '07:54',
    tailArrivalTime: '08:20',
    basketedCount: 40,
    leadGroupCount: 15,
    returned15MinCount: 35, // 87.5%
    totalReturnedSameDayCount: 40,
    ambientTempC: 16,
    windCondition: 'W 12 km/h',
    notes: 'Bardzo zwarta szpica, lądowanie bez siadania na dachu.',
  },
  {
    id: 'toss-3',
    tossDate: '2026-04-14',
    tossName: 'Wywózka 3: Krobia Południe',
    squadType: 'youngsters',
    releaseLocation: 'Krobia Południe',
    distanceKm: 45.0,
    azimuthDeg: 210,
    releaseTime: '07:00',
    leadArrivalTime: '07:36',
    tailArrivalTime: '08:10',
    basketedCount: 40,
    leadGroupCount: 10,
    returned15MinCount: 34, // 85%
    totalReturnedSameDayCount: 40,
    ambientTempC: 17,
    windCondition: 'NW 14 km/h',
  },
  {
    id: 'toss-4',
    tossDate: '2026-04-18',
    tossName: 'Wywózka 4: Rawicz Las',
    squadType: 'youngsters',
    releaseLocation: 'Rawicz (Wiatrak)',
    distanceKm: 60.0,
    azimuthDeg: 215,
    releaseTime: '07:00',
    leadArrivalTime: '07:48',
    tailArrivalTime: '08:30',
    basketedCount: 40,
    leadGroupCount: 14,
    returned15MinCount: 33, // 82.5%
    totalReturnedSameDayCount: 39,
    ambientTempC: 19,
    windCondition: 'SW 15 km/h',
    notes: 'Jeden ptak wrócił z zadrapaniem od krogulca.',
  },
];

export const TrainingTossLogModal: React.FC<TrainingTossLogModalProps> = ({
  visible,
  onClose,
  loftName = 'Gołębnik Mistrza Pigeon-Fly',
  seasonYear = new Date().getFullYear(),
}) => {
  const [tosses, setTosses] = useState<TrainingTossLogEntry[]>(DEFAULT_TOSSES);
  const [activeTab, setActiveTab] = useState<'history' | 'readiness' | 'add'>('history');

  // Form states for new toss
  const [newLocation, setNewLocation] = useState('Trzebnica Wzgórza');
  const [newDistanceKm, setNewDistanceKm] = useState('75');
  const [newAzimuthDeg, setNewAzimuthDeg] = useState('214');
  const [newReleaseTime, setNewReleaseTime] = useState('06:30');
  const [newLeadTime, setNewLeadTime] = useState('07:32');
  const [newBasketed, setNewBasketed] = useState('39');
  const [newLeadGroup, setNewLeadGroup] = useState('11');
  const [newReturned15, setNewReturned15] = useState('32');
  const [newReturnedSameDay, setNewReturnedSameDay] = useState('39');
  const [newWind, setNewWind] = useState('WNW 12 km/h');

  const readiness = useMemo(() => {
    return evaluateFlockSeasonReadiness(tosses);
  }, [tosses]);

  const handleAddToss = () => {
    const dist = parseFloat(newDistanceKm) || 30;
    const basketed = parseInt(newBasketed, 10) || 30;
    const leadGroup = parseInt(newLeadGroup, 10) || 5;
    const ret15 = parseInt(newReturned15, 10) || 20;
    const retSameDay = parseInt(newReturnedSameDay, 10) || basketed;
    const az = parseInt(newAzimuthDeg, 10) || 210;

    const newEntry: TrainingTossLogEntry = {
      id: `toss-${Date.now()}`,
      tossDate: new Date().toISOString().slice(0, 10),
      tossName: `Wywózka ${newLocation} ${dist} km`,
      squadType: 'youngsters',
      releaseLocation: newLocation,
      distanceKm: dist,
      azimuthDeg: az,
      releaseTime: newReleaseTime,
      leadArrivalTime: newLeadTime,
      basketedCount: basketed,
      leadGroupCount: leadGroup,
      returned15MinCount: ret15,
      totalReturnedSameDayCount: retSameDay,
      windCondition: newWind,
    };

    setTosses((prev) => [newEntry, ...prev]);
    setActiveTab('history');
    Alert.alert('Zarejestrowano Wywózkę!', `Dodano wywózkę: ${newLocation} (${dist} km).`);
  };

  const handlePrintLog = async () => {
    try {
      const html = generateTrainingTossLogSheetHtml(readiness, {
        loftName,
        seasonYear,
      });
      await PdfService.printHtml(html);
    } catch (err: any) {
      Alert.alert('Błąd wydruku', err?.message || 'Nie udało się wydrukować dziennika wywózek.');
    }
  };

  const handleShareLog = async () => {
    try {
      const html = generateTrainingTossLogSheetHtml(readiness, {
        loftName,
        seasonYear,
      });
      await PdfService.shareHtmlAsPdf(
        html,
        `Dziennik_Wywozek_Treningowych_${seasonYear}.pdf`
      );
    } catch (err: any) {
      Alert.alert('Błąd eksportu', err?.message || 'Nie udało się wyeksportować PDF.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>🧭 Dziennik Wywózek Treningowych</Text>
            <Text style={styles.headerSubtitle}>
              Prędkości szpicy, wskaźnik zwartości 15-min i gotowość stada (Z-078)
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Zamknij okno"
            testID="btn-close-toss-log-modal"
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'history' && styles.tabItemActive]}
            onPress={() => setActiveTab('history')}
            testID="tab-toss-history"
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              Wywózki ({tosses.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'readiness' && styles.tabItemActive]}
            onPress={() => setActiveTab('readiness')}
            testID="tab-toss-readiness"
          >
            <Text style={[styles.tabText, activeTab === 'readiness' && styles.tabTextActive]}>
              Gotowość Bojowa
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'add' && styles.tabItemActive]}
            onPress={() => setActiveTab('add')}
            testID="tab-toss-add"
          >
            <Text style={[styles.tabText, activeTab === 'add' && styles.tabTextActive]}>
              + Nowa Wywózka
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Quick KPI ribbon */}
          <View style={styles.kpiRibbon}>
            <View style={styles.kpiRibbonItem}>
              <Text style={styles.kpiRibbonVal}>{readiness.totalTosses}</Text>
              <Text style={styles.kpiRibbonLabel}>Wywózek</Text>
            </View>
            <View style={styles.kpiRibbonItem}>
              <Text style={styles.kpiRibbonVal}>{readiness.maxTossDistanceKm.toFixed(0)} km</Text>
              <Text style={styles.kpiRibbonLabel}>Maks. dystans</Text>
            </View>
            <View style={styles.kpiRibbonItem}>
              <Text style={styles.kpiRibbonVal}>{readiness.averageSpeedMPerMin.toFixed(0)} m/m</Text>
              <Text style={styles.kpiRibbonLabel}>Śr. prędkość</Text>
            </View>
            <View style={styles.kpiRibbonItem}>
              <Text style={[styles.kpiRibbonVal, { color: readiness.averageCohesionPct >= 75 ? '#10B981' : '#F59E0B' }]}>
                {readiness.averageCohesionPct.toFixed(0)}%
              </Text>
              <Text style={styles.kpiRibbonLabel}>Zwartość 15m</Text>
            </View>
          </View>

          {/* TAB 1: HISTORY OF TOSSES */}
          {activeTab === 'history' && (
            <View>
              {readiness.analyses.map((a, idx) => {
                const e = a.entry;
                return (
                  <View key={e.id} style={styles.tossCard}>
                    <View style={styles.tossCardHeader}>
                      <View>
                        <Text style={styles.tossName}>{e.releaseLocation}</Text>
                        <Text style={styles.tossDateMeta}>
                          {e.tossDate} • Dystans: {e.distanceKm.toFixed(1)} km • Azymut: {e.azimuthDeg}°
                        </Text>
                      </View>
                      <View style={[styles.cohesionBadge, { backgroundColor: a.cohesionRatingColor }]}>
                        <Text style={styles.cohesionBadgeText}>{a.flockCohesionPct.toFixed(0)}% ZWARTOŚĆ</Text>
                      </View>
                    </View>

                    <View style={styles.tossMetricsRow}>
                      <View style={styles.tossMetric}>
                        <Text style={styles.tossMetricVal}>{a.speedLeadMPerMin.toFixed(1)}</Text>
                        <Text style={styles.tossMetricSub}>m/min (szpica)</Text>
                      </View>
                      <View style={styles.tossMetric}>
                        <Text style={styles.tossMetricVal}>
                          {e.releaseTime} ➔ {e.leadArrivalTime}
                        </Text>
                        <Text style={styles.tossMetricSub}>{a.leadDurationMinutes} min lotu</Text>
                      </View>
                      <View style={styles.tossMetric}>
                        <Text style={styles.tossMetricVal}>
                          {e.returned15MinCount} / {e.basketedCount}
                        </Text>
                        <Text style={styles.tossMetricSub}>w 15 minutach</Text>
                      </View>
                      <View style={styles.tossMetric}>
                        <Text style={[styles.tossMetricVal, { color: a.lossesCount > 0 ? '#EF4444' : '#10B981' }]}>
                          {a.lossesCount > 0 ? `-${a.lossesCount}` : '0'}
                        </Text>
                        <Text style={styles.tossMetricSub}>straty</Text>
                      </View>
                    </View>

                    {e.windCondition && (
                      <View style={styles.weatherLine}>
                        <Text style={styles.weatherText}>💨 Wiatr: {e.windCondition}</Text>
                        {e.ambientTempC && <Text style={styles.weatherText}>🌡️ {e.ambientTempC}°C</Text>}
                      </View>
                    )}

                    {e.notes && (
                      <Text style={styles.tossNotesText}>📝 {e.notes}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* TAB 2: FLOCK SEASON READINESS */}
          {activeTab === 'readiness' && (
            <View>
              {/* Verdict Card */}
              <View style={[styles.verdictCard, { borderColor: readiness.verdictColor }]}>
                <View style={styles.verdictHeader}>
                  <Text style={[styles.verdictTitle, { color: readiness.verdictColor }]}>
                    {readiness.verdictLabel}
                  </Text>
                  <Text style={styles.scoreNumber}>{readiness.readinessScore} / 100 pkt</Text>
                </View>

                <View style={styles.recsBox}>
                  <Text style={styles.recsHeading}>Ocena Taktyczna & Rekomendacje:</Text>
                  {readiness.recommendations.map((rec, idx) => (
                    <Text key={idx} style={styles.recItem}>• {rec}</Text>
                  ))}
                </View>
              </View>

              {/* Biological Guidelines Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>🔬 Fizjologia Lotu Próbnego i Zwartości:</Text>
                <Text style={styles.bodyText}>
                  • <Text style={styles.boldText}>Zasada 15 minut:</Text> Gołębie pocztowe o wysokiej formie i nienagannej orientacji wchodzą do gołębnika zwartą paczką. Wskaźnik zwartości stada &gt; 80% w ciągu 15 minut od czołówki oznacza gotowość do walki o czołowe konkursy w oddziale.
                </Text>
                <Text style={[styles.bodyText, { marginTop: 6 }]}>
                  • <Text style={styles.boldText}>Progresja Dystansów:</Text> Stopniowe wydłużanie (15 km ➔ 30 km ➔ 50 km ➔ 75 km) eliminuje syndrom paniki i uczy stado natychmiastowego obierania azymutu bez wielokrotnego krążenia nad koszem.
                </Text>
                <Text style={[styles.bodyText, { marginTop: 6 }]}>
                  • <Text style={styles.boldText}>Trening w Środku Tygodnia:</Text> Dla wdowców zalecana jest wywózka 30–45 km we wtorek lub środę z możliwością krótkiego spotkania z partnerem, co potęguje motywację przed lotem niedzielnym.
                </Text>
              </View>
            </View>
          )}

          {/* TAB 3: ADD NEW TOSS FORM */}
          {activeTab === 'add' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Wprowadź Dane z Nowej Wywózki</Text>

              <Text style={styles.inputLabel}>Miejsce Wypuszczenia</Text>
              <TextInput
                style={styles.inputField}
                value={newLocation}
                onChangeText={setNewLocation}
                placeholder="np. Rawicz - Leśniczówka"
                placeholderTextColor="#6B7280"
                testID="input-toss-location"
              />

              <View style={styles.rowTwoCols}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Dystans (km)</Text>
                  <TextInput
                    style={styles.inputField}
                    value={newDistanceKm}
                    onChangeText={setNewDistanceKm}
                    keyboardType="numeric"
                    placeholder="35"
                    placeholderTextColor="#6B7280"
                    testID="input-toss-distance"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Azymut powrotu (°)</Text>
                  <TextInput
                    style={styles.inputField}
                    value={newAzimuthDeg}
                    onChangeText={setNewAzimuthDeg}
                    keyboardType="numeric"
                    placeholder="215"
                    placeholderTextColor="#6B7280"
                    testID="input-toss-azimuth"
                  />
                </View>
              </View>

              <View style={styles.rowTwoCols}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Czas startu (HH:MM)</Text>
                  <TextInput
                    style={styles.inputField}
                    value={newReleaseTime}
                    onChangeText={setNewReleaseTime}
                    placeholder="07:30"
                    placeholderTextColor="#6B7280"
                    testID="input-toss-release-time"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Szpica na dachu (HH:MM)</Text>
                  <TextInput
                    style={styles.inputField}
                    value={newLeadTime}
                    onChangeText={setNewLeadTime}
                    placeholder="07:58"
                    placeholderTextColor="#6B7280"
                    testID="input-toss-lead-time"
                  />
                </View>
              </View>

              <View style={styles.rowThreeCols}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Włożone</Text>
                  <TextInput
                    style={styles.inputField}
                    value={newBasketed}
                    onChangeText={setNewBasketed}
                    keyboardType="numeric"
                    placeholder="40"
                    placeholderTextColor="#6B7280"
                    testID="input-toss-basketed"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Szpica (1. grupa)</Text>
                  <TextInput
                    style={styles.inputField}
                    value={newLeadGroup}
                    onChangeText={setNewLeadGroup}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor="#6B7280"
                    testID="input-toss-lead-group"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>W 15 minut</Text>
                  <TextInput
                    style={styles.inputField}
                    value={newReturned15}
                    onChangeText={setNewReturned15}
                    keyboardType="numeric"
                    placeholder="35"
                    placeholderTextColor="#6B7280"
                    testID="input-toss-returned15"
                  />
                </View>
              </View>

              <View style={styles.rowTwoCols}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Łącznie w dniu lotu</Text>
                  <TextInput
                    style={styles.inputField}
                    value={newReturnedSameDay}
                    onChangeText={setNewReturnedSameDay}
                    keyboardType="numeric"
                    placeholder="40"
                    placeholderTextColor="#6B7280"
                    testID="input-toss-returned-same-day"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Wiatr i Warunki</Text>
                  <TextInput
                    style={styles.inputField}
                    value={newWind}
                    onChangeText={setNewWind}
                    placeholder="SW 12 km/h"
                    placeholderTextColor="#6B7280"
                    testID="input-toss-wind"
                  />
                </View>
              </View>

              <FieldButton
                title="💾 Zapisz Wywózkę w Dzienniku"
                onPress={handleAddToss}
                testID="btn-save-toss-entry"
                style={{ marginTop: 12 }}
              />
            </View>
          )}

          {/* Action Buttons for PDF and AirPrint */}
          <View style={styles.actionSection}>
            <FieldButton
              title="🖨️ Drukuj Dziennik Wywózek A4 (AirPrint)"
              onPress={handlePrintLog}
              testID="btn-print-toss-log"
              style={{ marginBottom: 10 }}
            />
            <FieldButton
              title="📄 Udostępnij Dziennik Wywózek PDF"
              onPress={handleShareLog}
              testID="btn-share-toss-log-pdf"
              variant="secondary"
              style={{ marginBottom: 10 }}
            />
            <FieldButton
              title="Zamknij"
              onPress={onClose}
              testID="btn-close-toss-log"
              variant="secondary"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F3F4F6',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E2127',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  closeBtnText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E2127',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: '#E5A93C',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#121417',
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  kpiRibbon: {
    flexDirection: 'row',
    backgroundColor: '#1E2127',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  kpiRibbonItem: {
    flex: 1,
    alignItems: 'center',
  },
  kpiRibbonVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  kpiRibbonLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  tossCard: {
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  tossCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tossName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F3F4F6',
  },
  tossDateMeta: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  cohesionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cohesionBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tossMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#121417',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  tossMetric: {
    alignItems: 'center',
    flex: 1,
  },
  tossMetricVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#60A5FA',
  },
  tossMetricSub: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 1,
  },
  weatherLine: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  weatherText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  tossNotesText: {
    fontSize: 10,
    color: '#D1D5DB',
    marginTop: 4,
    fontStyle: 'italic',
  },
  verdictCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    marginBottom: 14,
  },
  verdictHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  verdictTitle: {
    fontSize: 13,
    fontWeight: '900',
    flex: 1,
    marginRight: 8,
  },
  scoreNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F3F4F6',
  },
  recsBox: {
    backgroundColor: '#121417',
    borderRadius: 8,
    padding: 10,
  },
  recsHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  recItem: {
    fontSize: 11,
    color: '#E5E7EB',
    lineHeight: 16,
  },
  card: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F3F4F6',
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 11,
    color: '#D1D5DB',
    lineHeight: 16,
  },
  boldText: {
    fontWeight: '800',
    color: '#E5A93C',
  },
  inputLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
    marginTop: 6,
  },
  inputField: {
    backgroundColor: '#121417',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 10,
  },
  rowThreeCols: {
    flexDirection: 'row',
    gap: 8,
  },
  actionSection: {
    marginTop: 8,
  },
});

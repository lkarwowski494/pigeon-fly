/**
 * PIGEON-FLY — Dziennik Kabiny i Dobrostanu w Transporcie Modal (Z-059)
 * Monitorowanie zoohigieny i warunków stada w kabinie transportowej:
 * - Tab 1: Zagęszczenie w koszach i normy powierzchniowe cm²/ptak (FCI)
 * - Tab 2: Mikroklimat kabiny i wskaźnik stresu termicznego THI
 * - Tab 3: Rejestr pojenia i odpoczynku przed wypuszczeniem
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
  calculateCrateDensity,
  calculateCabinThi,
  evaluateTransportWelfare,
  CrateManifest,
  CabinEnvironmentLog,
  WateringEvent,
  RaceDistanceTier,
} from '../domain/transportWelfare';

interface TransportWelfareModalProps {
  visible: boolean;
  onClose: () => void;
  raceName?: string;
}

const DEFAULT_CRATES: CrateManifest[] = [
  { crateId: 'cr-1', crateNumber: 1, widthCm: 100, depthCm: 100, birdCount: 22, sexRestriction: 'cocks_only' },
  { crateId: 'cr-2', crateNumber: 2, widthCm: 100, depthCm: 100, birdCount: 22, sexRestriction: 'hens_only' },
  { crateId: 'cr-3', crateNumber: 3, widthCm: 100, depthCm: 100, birdCount: 24, sexRestriction: 'cocks_only' },
  { crateId: 'cr-4', crateNumber: 4, widthCm: 100, depthCm: 100, birdCount: 25, sexRestriction: 'hens_only' },
];

export const TransportWelfareModal: React.FC<TransportWelfareModalProps> = ({
  visible,
  onClose,
  raceName = 'Magdeburg 1',
}) => {
  const [activeTab, setActiveTab] = useState<'density' | 'thi' | 'watering'>('density');
  const [distanceTier, setDistanceTier] = useState<RaceDistanceTier>('medium');

  // Crates state
  const [crates, setCrates] = useState<CrateManifest[]>(DEFAULT_CRATES);

  // Cabin climate state
  const [tempCelsius, setTempCelsius] = useState<number>(22);
  const [humidityPercent, setHumidityPercent] = useState<number>(60);
  const [isVentilationActive, setIsVentilationActive] = useState<boolean>(true);

  // Watering state
  const [wateringEvents, setWateringEvents] = useState<WateringEvent[]>([
    {
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4h ago
      drinkerTroughsFilled: true,
      waterQuality: 'clean_fresh',
      observedDrinkingIntensity: 'normal',
      notes: 'Pojenie wieczorne po przyjeździe na miejsce wypuszczenia',
    },
  ]);

  const envLog: CabinEnvironmentLog = {
    timestamp: new Date().toISOString(),
    temperatureCelsius: tempCelsius,
    relativeHumidityPercent: humidityPercent,
    isForcedVentilationActive: isVentilationActive,
    isVehicleMoving: false,
  };

  const welfare = evaluateTransportWelfare(crates, envLog, wateringEvents, distanceTier);
  const thi = calculateCabinThi(tempCelsius, humidityPercent);

  const handleRegisterWatering = () => {
    const newEvent: WateringEvent = {
      timestamp: new Date().toISOString(),
      drinkerTroughsFilled: true,
      waterQuality: 'clean_fresh',
      observedDrinkingIntensity: 'eager',
      notes: 'Pojenie kontrolne w kabinie transportowej',
    };
    setWateringEvents((prev) => [newEvent, ...prev]);
    Alert.alert('Zarejestrowano pojenie', 'Napełnienie rynienek świeżą wodą zostało zapisane w dzienniku.');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>🚛 Dziennik Kabiny i Dobrostanu (Z-059)</Text>
              <Text style={styles.subTitle}>Zoohigiena transportu, wskaźnik THI i normy koszowania FCI</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'density' && styles.tabBtnActive]}
              onPress={() => setActiveTab('density')}
            >
              <Text style={[styles.tabText, activeTab === 'density' && styles.tabTextActive]}>
                📦 Zagęszczenie
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'thi' && styles.tabBtnActive]}
              onPress={() => setActiveTab('thi')}
            >
              <Text style={[styles.tabText, activeTab === 'thi' && styles.tabTextActive]}>
                🌡️ Stres Cieplny (THI)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'watering' && styles.tabBtnActive]}
              onPress={() => setActiveTab('watering')}
            >
              <Text style={[styles.tabText, activeTab === 'watering' && styles.tabTextActive]}>
                🥤 Pojenie i Odpoczynek
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {/* Top Welfare Score & Readiness Banner */}
            <View
              style={[
                styles.welfareHeroCard,
                {
                  borderColor:
                    welfare.overallStatus === 'optimal'
                      ? '#10B981'
                      : welfare.overallStatus === 'caution'
                      ? '#F59E0B'
                      : '#EF4444',
                },
              ]}
            >
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.heroSubLabel}>INDEKS DOBROSTANU W TRANSPORCIE (TWI)</Text>
                  <Text
                    style={[
                      styles.heroScoreText,
                      {
                        color:
                          welfare.overallStatus === 'optimal'
                            ? '#10B981'
                            : welfare.overallStatus === 'caution'
                            ? '#F59E0B'
                            : '#EF4444',
                      },
                    ]}
                  >
                    {welfare.welfareScore} / 100 pkt
                  </Text>
                </View>
                <View
                  style={[
                    styles.readinessBadge,
                    {
                      backgroundColor:
                        welfare.releaseReadiness === 'GO'
                          ? '#10B981'
                          : welfare.releaseReadiness === 'DELAY_FOR_WATERING'
                          ? '#F59E0B'
                          : '#EF4444',
                    },
                  ]}
                >
                  <Text style={styles.readinessText}>
                    {welfare.releaseReadiness === 'GO' && '✓ ZEZWOLENIE: GO'}
                    {welfare.releaseReadiness === 'DELAY_FOR_WATERING' && '⚠️ POJENIE WYMAGANE'}
                    {welfare.releaseReadiness === 'EMERGENCY_VENTILATION' && '🚨 ALARM WENTYLACJI'}
                  </Text>
                </View>
              </View>

              <View style={styles.kpiRow}>
                <View style={styles.kpiItem}>
                  <Text style={styles.kpiLabel}>PTAKI W KABINIE</Text>
                  <Text style={styles.kpiValue}>{welfare.totalBirds} szt.</Text>
                </View>
                <View style={styles.kpiItem}>
                  <Text style={styles.kpiLabel}>POW. NA PTAKA</Text>
                  <Text style={styles.kpiValue}>{welfare.avgAreaPerBirdCm2} cm²</Text>
                </View>
                <View style={styles.kpiItem}>
                  <Text style={styles.kpiLabel}>WSKAŹNIK THI</Text>
                  <Text style={styles.kpiValue}>{welfare.currentThi.thiValue}</Text>
                </View>
                <View style={styles.kpiItem}>
                  <Text style={styles.kpiLabel}>OSTATNIE POJENIE</Text>
                  <Text style={styles.kpiValue}>
                    {welfare.lastWateringHoursAgo !== null ? `${welfare.lastWateringHoursAgo}h temu` : 'BRAK'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Violations / Warnings */}
            {welfare.violations.length > 0 && (
              <View style={styles.violationsBox}>
                <Text style={styles.violationsTitle}>🚨 Naruszenia norm dobrostanu:</Text>
                {welfare.violations.map((v, idx) => (
                  <Text key={idx} style={styles.violationText}>• {v}</Text>
                ))}
              </View>
            )}

            {/* TAB 1: Zagęszczenie w Koszach */}
            {activeTab === 'density' && (
              <View>
                {/* Distance Tier Selector */}
                <View style={styles.card}>
                  <Text style={styles.cardHeader}>📏 KATEGORIA DYSTANSU I NORMA FCI</Text>
                  <View style={styles.tierBtnRow}>
                    {(['short', 'medium', 'long', 'marathon'] as RaceDistanceTier[]).map((tier) => (
                      <TouchableOpacity
                        key={tier}
                        style={[styles.tierBtn, distanceTier === tier && styles.tierBtnActive]}
                        onPress={() => setDistanceTier(tier)}
                      >
                        <Text style={[styles.tierBtnText, distanceTier === tier && styles.tierBtnTextActive]}>
                          {tier === 'short' && '<300 km (350 cm²)'}
                          {tier === 'medium' && '300-500 km (380 cm²)'}
                          {tier === 'long' && '500-700 km (440 cm²)'}
                          {tier === 'marathon' && '>700 km (520 cm²)'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Crates Manifest */}
                <View style={styles.card}>
                  <Text style={styles.cardHeader}>📦 EWIDENCJA KLATEK TRANSPORTOWYCH ({crates.length} KOSZY)</Text>
                  {crates.map((c) => {
                    const density = calculateCrateDensity(c.widthCm, c.depthCm, c.birdCount, distanceTier);
                    return (
                      <View
                        key={c.crateId}
                        style={[
                          styles.crateRow,
                          density.densityStatus === 'overcrowded' && styles.crateRowOvercrowded,
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={styles.rowBetween}>
                            <Text style={styles.crateTitle}>Kosz #{c.crateNumber} ({c.widthCm}x{c.depthCm} cm)</Text>
                            <Text
                              style={[
                                styles.densityBadge,
                                {
                                  color:
                                    density.densityStatus === 'optimal'
                                      ? '#10B981'
                                      : density.densityStatus === 'acceptable'
                                      ? '#F59E0B'
                                      : '#EF4444',
                                },
                              ]}
                            >
                              {density.densityStatus === 'optimal' && '✓ Norma OK'}
                              {density.densityStatus === 'acceptable' && '⚠️ Dopuszczalna'}
                              {density.densityStatus === 'overcrowded' && '🚨 Przepełnienie'}
                            </Text>
                          </View>
                          <Text style={styles.crateSub}>
                            Ptaków: {c.birdCount} / Limit: {density.maxAllowedBirds} • Powierzchnia: {density.areaPerBirdCm2} cm²/ptak (Wymóg: {density.minRequiredAreaPerBirdCm2} cm²)
                          </Text>
                          {density.overcrowdingDeltaBirds > 0 && (
                            <Text style={styles.overcrowdingAlert}>
                              Nadmiar: {density.overcrowdingDeltaBirds} ptaków powyżej limitu weterynaryjnego!
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* TAB 2: Mikroklimat Kabiny i THI */}
            {activeTab === 'thi' && (
              <View>
                {/* Microclimate Adjustments */}
                <View style={styles.card}>
                  <Text style={styles.cardHeader}>🌡️ CZUJNIKI TEMPERATURY I WILGOTNOŚCI</Text>
                  <Text style={styles.inputLabel}>Temperatura w kabinie ({tempCelsius}°C):</Text>
                  <View style={styles.quickBtnRow}>
                    {[16, 20, 24, 28, 32, 36].map((deg) => (
                      <TouchableOpacity
                        key={deg}
                        style={[styles.quickBtn, tempCelsius === deg && styles.quickBtnActive]}
                        onPress={() => setTempCelsius(deg)}
                      >
                        <Text style={[styles.quickBtnText, tempCelsius === deg && styles.quickBtnTextActive]}>
                          {deg}°C
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Wilgotność względna ({humidityPercent}% RH):</Text>
                  <View style={styles.quickBtnRow}>
                    {[40, 50, 60, 70, 80, 90].map((rh) => (
                      <TouchableOpacity
                        key={rh}
                        style={[styles.quickBtn, humidityPercent === rh && styles.quickBtnActive]}
                        onPress={() => setHumidityPercent(rh)}
                      >
                        <Text style={[styles.quickBtnText, humidityPercent === rh && styles.quickBtnTextActive]}>
                          {rh}%
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={[styles.rowBetween, { marginTop: 14 }]}>
                    <Text style={styles.inputLabel}>Wentylacja mechaniczna:</Text>
                    <TouchableOpacity
                      style={[styles.fanToggleBtn, isVentilationActive && styles.fanToggleActive]}
                      onPress={() => setIsVentilationActive(!isVentilationActive)}
                    >
                      <Text style={[styles.fanToggleText, isVentilationActive && styles.fanToggleTextActive]}>
                        {isVentilationActive ? '🌀 WŁĄCZONA (NAWIEW)' : 'OFF (GRAWITACYJNA)'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* THI Gauge Card */}
                <View style={styles.thiCard}>
                  <Text style={styles.thiLabel}>TEMPERATURE-HUMIDITY INDEX (THI)</Text>
                  <Text
                    style={[
                      styles.thiVal,
                      {
                        color:
                          thi.riskLevel === 'normal'
                            ? '#10B981'
                            : thi.riskLevel === 'alert'
                            ? '#FCD34D'
                            : thi.riskLevel === 'danger'
                            ? '#F97316'
                            : '#EF4444',
                      },
                    ]}
                  >
                    {thi.thiValue}
                  </Text>
                  <Text style={styles.thiStatus}>{thi.description}</Text>
                  <Text style={styles.thiAdvice}>Zalecenie: {thi.recommendedAction}</Text>
                </View>
              </View>
            )}

            {/* TAB 3: Pojenie i Odpoczynek */}
            {activeTab === 'watering' && (
              <View>
                <View style={styles.card}>
                  <Text style={styles.cardHeader}>🥤 REJESTRACJA POJENIA W KABINIE</Text>
                  <Text style={styles.cardHint}>
                    Zgodnie z protokołem weterynaryjnym FCI gołębie po przyjeździe na miejsce wypuszczenia muszą otrzymać dostęp do wody najpóźniej po 12 godzinach od załadunku.
                  </Text>
                  <TouchableOpacity style={styles.addWateringBtn} onPress={handleRegisterWatering}>
                    <Text style={styles.addWateringText}>+ ZAPISZ NAPEŁNIENIE RYNIENEK WODĄ</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardHeader}>📋 HISTORIA POJENIA ({wateringEvents.length})</Text>
                  {wateringEvents.map((w, idx) => (
                    <View key={idx} style={styles.wateringItem}>
                      <View style={styles.rowBetween}>
                        <Text style={styles.wateringTime}>
                          {new Date(w.timestamp).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })} • {new Date(w.timestamp).toISOString().slice(0, 10)}
                        </Text>
                        <Text style={styles.waterQualityBadge}>
                          {w.waterQuality === 'clean_fresh' ? '✓ Czysta i świeża' : '⚠️ Zanieczyszczona'}
                        </Text>
                      </View>
                      <Text style={styles.wateringNote}>{w.notes || 'Brak dodatkowych uwag.'}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Action Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeFooterBtn} onPress={onClose}>
              <Text style={styles.closeFooterBtnText}>ZAMKNIJ DZIENNIK KABINY</Text>
            </TouchableOpacity>
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
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    padding: 6,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#059669',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  welfareHeroCard: {
    backgroundColor: '#064E3B',
    borderRadius: 14,
    borderWidth: 2,
    padding: 14,
    marginBottom: 12,
  },
  heroSubLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#A7F3D0',
    letterSpacing: 0.5,
  },
  heroScoreText: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 2,
  },
  readinessBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  readinessText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 11,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  kpiItem: {
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#A7F3D0',
  },
  kpiValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  violationsBox: {
    backgroundColor: '#451A03',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  violationsTitle: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  violationText: {
    color: '#FECACA',
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
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cardHint: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 10,
    lineHeight: 16,
  },
  tierBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tierBtn: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tierBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#10B981',
  },
  tierBtnText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  tierBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  crateRow: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  crateRowOvercrowded: {
    borderColor: '#EF4444',
    backgroundColor: '#2A1215',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  crateTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#F1F5F9',
  },
  densityBadge: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  crateSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 3,
  },
  overcrowdingAlert: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 6,
  },
  quickBtnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  quickBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  quickBtnText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  quickBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  fanToggleBtn: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fanToggleActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  fanToggleText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  fanToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  thiCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  thiLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  thiVal: {
    fontSize: 40,
    fontWeight: '900',
    marginVertical: 4,
  },
  thiStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E2E8F0',
    textAlign: 'center',
  },
  thiAdvice: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
  },
  addWateringBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  addWateringText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  wateringItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  wateringTime: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#38BDF8',
  },
  waterQualityBadge: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  wateringNote: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
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
  closeFooterBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56, // Field Mode compliant
  },
  closeFooterBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});

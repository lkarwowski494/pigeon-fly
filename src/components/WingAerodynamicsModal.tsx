/**
 * PIGEON-FLY — Aerodynamiczny Asystent Doboru Par i Biomechaniki Skrzydła Modal (Z-064)
 * Obliczanie wskaźnika Aspect Ratio (AR = b^2/S), oporu indukowanego i symulator kompensacji w doborze par.
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
} from 'react-native';
import {
  calculateWingAerodynamics,
  simulatePairAerodynamics,
  WingBiometrics,
  WingCamberType,
} from '../domain/wingAerodynamics';

interface WingAerodynamicsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const WingAerodynamicsModal: React.FC<WingAerodynamicsModalProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'mating' | 'theory'>('analyzer');

  // Dane aktywnego badanego ptaka
  const [activeBiometrics, setActiveBiometrics] = useState<WingBiometrics>({
    pigeonRing: 'PL-0284-23-1402',
    pigeonSex: 'cock',
    wingspanCm: 72,
    wingAreaCm2: 600,
    wingtipSlotDegree: 4,
    camberType: 'MODERATE',
    forearmLeverRatio: 0.8,
    primaryFeatherRigidity: 4,
  });

  // Dane do symulatora kojarzeń (Samiec x Samica)
  const [cockBiometrics, setCockBiometrics] = useState<WingBiometrics>({
    pigeonRing: 'PL-0284-23-1402 (1.0)',
    pigeonSex: 'cock',
    wingspanCm: 72,
    wingAreaCm2: 600,
    wingtipSlotDegree: 4,
    camberType: 'DEEP',
    forearmLeverRatio: 0.79,
    primaryFeatherRigidity: 5,
  });

  const [henBiometrics, setHenBiometrics] = useState<WingBiometrics>({
    pigeonRing: 'PL-0284-22-9854 (0.1)',
    pigeonSex: 'hen',
    wingspanCm: 68,
    wingAreaCm2: 610,
    wingtipSlotDegree: 3,
    camberType: 'FLAT',
    forearmLeverRatio: 0.84,
    primaryFeatherRigidity: 4,
  });

  const singleProfile = calculateWingAerodynamics(activeBiometrics);
  const matingResult = simulatePairAerodynamics(cockBiometrics, henBiometrics);

  const getSpecialtyColor = (category: string) => {
    switch (category) {
      case 'HIGH_ASPECT':
        return '#4CAF50';
      case 'OPTIMAL_ALLROUND':
        return '#0288D1';
      case 'LOW_ASPECT':
        return '#E5A93C';
      default:
        return '#9E9E9E';
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'EXCELLENT':
        return '#4CAF50';
      case 'RECOMMENDED':
        return '#0288D1';
      case 'CAUTION':
        return '#E5A93C';
      case 'NOT_RECOMMENDED':
        return '#E53935';
      default:
        return '#FFFFFF';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>🪽 Aerodynamika i Biomechanika Skrzydła (Z-064)</Text>
              <Text style={styles.subTitle}>Wydłużenie skrzydła (Aspect Ratio), opór indukowany i kompensacja par</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="btn-close-wing-aerodynamics-modal">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Metrics Bar */}
          <View style={[styles.metricsBanner, { borderColor: getSpecialtyColor(singleProfile.aspectRatioCategory) }]}>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>ASPECT RATIO (AR)</Text>
              <Text style={[styles.metricVal, { color: getSpecialtyColor(singleProfile.aspectRatioCategory) }]}>
                {singleProfile.aspectRatio}
              </Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>OPÓR INDUKOWANY</Text>
              <Text style={[styles.metricVal, { color: singleProfile.inducedDragIndex <= 45 ? '#4CAF50' : '#E5A93C' }]}>
                {singleProfile.inducedDragIndex}%
              </Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>ODPORNOŚĆ POD WIATR</Text>
              <Text style={[styles.metricVal, { color: '#0288D1' }]}>
                {singleProfile.headwindScore}/100
              </Text>
            </View>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'analyzer' && styles.tabBtnActive]}
              onPress={() => setActiveTab('analyzer')}
            >
              <Text style={[styles.tabText, activeTab === 'analyzer' && styles.tabTextActive]}>
                🔬 Analiza Skrzydła
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'mating' && styles.tabBtnActive]}
              onPress={() => setActiveTab('mating')}
            >
              <Text style={[styles.tabText, activeTab === 'mating' && styles.tabTextActive]}>
                🕊️ Dobór Par (Symulator)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'theory' && styles.tabBtnActive]}
              onPress={() => setActiveTab('theory')}
            >
              <Text style={[styles.tabText, activeTab === 'theory' && styles.tabTextActive]}>
                📚 Fizyka Lotu
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {activeTab === 'analyzer' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>POMIARY BIOMETRYCZNE SKRZYDŁA</Text>
                </View>

                <View style={styles.inputCard}>
                  <Text style={styles.inputLabel}>Obrączka badanego ptaka:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={activeBiometrics.pigeonRing}
                    onChangeText={(t) => setActiveBiometrics((p) => ({ ...p, pigeonRing: t }))}
                  />

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Rozpiętość b (cm):</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={String(activeBiometrics.wingspanCm)}
                        onChangeText={(t) => setActiveBiometrics((p) => ({ ...p, wingspanCm: parseFloat(t) || 60 }))}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Powierzchnia S (cm²):</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={String(activeBiometrics.wingAreaCm2)}
                        onChangeText={(t) => setActiveBiometrics((p) => ({ ...p, wingAreaCm2: parseFloat(t) || 500 }))}
                      />
                    </View>
                  </View>

                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>
                    Szczeliny wentylacyjne lotek 7–10 (Wingtip Slotting: 1-5):
                  </Text>
                  <View style={styles.quickOptionsRow}>
                    {[1, 2, 3, 4, 5].map((slot) => (
                      <TouchableOpacity
                        key={slot}
                        style={[styles.quickOptBtn, activeBiometrics.wingtipSlotDegree === slot && styles.quickOptBtnActive]}
                        onPress={() => setActiveBiometrics((p) => ({ ...p, wingtipSlotDegree: slot }))}
                      >
                        <Text style={[styles.quickOptText, activeBiometrics.wingtipSlotDegree === slot && styles.quickOptTextActive]}>
                          {slot} {slot >= 4 ? '★' : ''}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Wysklepienie profilu skrzydła (Camber):</Text>
                  <View style={styles.quickOptionsRow}>
                    {(['FLAT', 'MODERATE', 'DEEP'] as WingCamberType[]).map((camber) => (
                      <TouchableOpacity
                        key={camber}
                        style={[styles.quickOptBtn, activeBiometrics.camberType === camber && styles.quickOptBtnActive]}
                        onPress={() => setActiveBiometrics((p) => ({ ...p, camberType: camber }))}
                      >
                        <Text style={[styles.quickOptText, activeBiometrics.camberType === camber && styles.quickOptTextActive]}>
                          {camber === 'FLAT' ? 'Płaski (Wiatr w plecy)' : camber === 'MODERATE' ? 'Umiarkowany' : 'Głęboki (Pod wiatr)'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Wyniki Aerodynamiczne */}
                <View style={[styles.resultCard, { borderColor: getSpecialtyColor(singleProfile.aspectRatioCategory) }]}>
                  <Text style={styles.resultTitle}>PROFIL AERODYNAMICZNY I PREDYSPOZYCJE</Text>
                  <Text style={[styles.resultHeading, { color: getSpecialtyColor(singleProfile.aspectRatioCategory) }]}>
                    {singleProfile.specialtyLabel}
                  </Text>
                  <Text style={styles.resultDesc}>{singleProfile.aerodynamicSummary}</Text>

                  <View style={styles.dividerH} />
                  <View style={styles.windRow}>
                    <View style={styles.windCol}>
                      <Text style={styles.windLabel}>🌬️ POD WIATR</Text>
                      <Text style={styles.windVal}>{singleProfile.headwindScore} pkt</Text>
                    </View>
                    <View style={styles.windCol}>
                      <Text style={styles.windLabel}>🚀 Z WIATREM</Text>
                      <Text style={styles.windVal}>{singleProfile.tailwindScore} pkt</Text>
                    </View>
                    <View style={styles.windCol}>
                      <Text style={styles.windLabel}>🧭 BOCZNY ZNOS</Text>
                      <Text style={styles.windVal}>{singleProfile.crosswindStabilityScore} pkt</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'mating' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>SYMULATOR KOMPENSACYJNEGO DOBORU PAR</Text>
                </View>

                {/* Karta Samca */}
                <View style={styles.pairCard}>
                  <Text style={styles.pairGenderLabel}>♂ SAMIEC (1.0)</Text>
                  <Text style={styles.pairRing}>{cockBiometrics.pigeonRing}</Text>
                  <View style={styles.pairMetricsRow}>
                    <Text style={styles.pairMetricItem}>Rozpiętość: {cockBiometrics.wingspanCm} cm</Text>
                    <Text style={styles.pairMetricItem}>Powierzchnia: {cockBiometrics.wingAreaCm2} cm²</Text>
                    <Text style={styles.pairMetricItem}>AR: {calculateWingAerodynamics(cockBiometrics).aspectRatio}</Text>
                  </View>
                </View>

                {/* Karta Samicy */}
                <View style={styles.pairCard}>
                  <Text style={[styles.pairGenderLabel, { color: '#E91E63' }]}>♀ SAMICA (0.1)</Text>
                  <Text style={styles.pairRing}>{henBiometrics.pigeonRing}</Text>
                  <View style={styles.pairMetricsRow}>
                    <Text style={styles.pairMetricItem}>Rozpiętość: {henBiometrics.wingspanCm} cm</Text>
                    <Text style={styles.pairMetricItem}>Powierzchnia: {henBiometrics.wingAreaCm2} cm²</Text>
                    <Text style={styles.pairMetricItem}>AR: {calculateWingAerodynamics(henBiometrics).aspectRatio}</Text>
                  </View>
                </View>

                {/* Wynik Kojarzenia */}
                <View style={[styles.matingResultCard, { borderColor: getRecommendationColor(matingResult.breedingRecommendation) }]}>
                  <View style={styles.matingHeaderRow}>
                    <Text style={styles.matingHeaderLabel}>WSKAŹNIK KOMPLEMENTARNOŚCI</Text>
                    <Text style={[styles.matingScoreVal, { color: getRecommendationColor(matingResult.breedingRecommendation) }]}>
                      {matingResult.complementarityScore}%
                    </Text>
                  </View>
                  <Text style={[styles.matingRecHeading, { color: getRecommendationColor(matingResult.breedingRecommendation) }]}>
                    {matingResult.breedingRecommendation === 'EXCELLENT' ? 'WYBITNE SKOJARZENIE' : matingResult.breedingRecommendation === 'RECOMMENDED' ? 'ZALECANE SKOJARZENIE' : 'KOJARZENIE WARUNKOWE'}
                  </Text>
                  <Text style={styles.matingReasonText}>{matingResult.recommendationReason}</Text>

                  <View style={styles.dividerH} />
                  <Text style={styles.offspringTitle}>PRZEWIDYWANE CECHY POTOMSTWA (F1):</Text>
                  <Text style={styles.offspringRow}>• Przewidywane wydłużenie skrzydła: <strong>AR = {matingResult.predictedOffspringAspectRatio}</strong></Text>
                  <Text style={styles.offspringRow}>• Dominująca kategoria lotowa: <strong>{matingResult.predictedSpecialty}</strong></Text>
                  <Text style={styles.offspringRow}>• Kluczowa zaleta aerodynamiczna: {matingResult.offspringAdvantage}</Text>
                </View>
              </View>
            )}

            {activeTab === 'theory' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>ZASADY BIOMECHANIKI I AERODYNAMIKI W HODOWLI</Text>
                </View>

                <View style={styles.theoryCard}>
                  <Text style={styles.theoryTitle}>1. Co to jest Aspect Ratio (Wskaźnik Wydłużenia)?</Text>
                  <Text style={styles.theoryText}>
                    Wzór fizyczny to AR = b² / S, gdzie b to rozpiętość skrzydeł, a S to łączna powierzchnia nośna.
                    Dla gołębi pocztowych optimum wynosi od 7.5 do 9.2. Im wyższy współczynnik AR, tym mniejszy opór indukowany
                    powstający na końcach skrzydeł podczas wielogodzinnego lotu.
                  </Text>
                </View>

                <View style={styles.theoryCard}>
                  <Text style={styles.theoryTitle}>2. Rola szczelin wentylacyjnych (Wingtip Slots)</Text>
                  <Text style={styles.theoryText}>
                    Ostatnie 4 lotki I rzędu (7–10) u wybitnych maratończyków zwężają się ku końcowi, tworząc widoczne szczeliny.
                    Działają one jak winglety w nowoczesnych samolotach pasażerskich: rozbijają potężne wiry brzegowe,
                    redukując opór aż o 15–20% podczas lotu pod wiatr.
                  </Text>
                </View>

                <View style={styles.theoryCard}>
                  <Text style={styles.theoryTitle}>3. Profil płaski vs głęboki (Camber)</Text>
                  <Text style={styles.theoryText}>
                    Skrzydło o płaskim profilu generuje minimalny opór przy bardzo wysokich prędkościach (wiatr w ogon, loty sprinterskie 1400–1600 m/min).
                    Profil głęboko wysklepiony zapewnia potężną siłę nośną przy niskiej prędkości przelotowej i pozwala ptakowi przebijać się
                    przez silny wiatr czołowy (loty ciężkie 1000–1150 m/min).
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Bar */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeModalBtn} onPress={onClose}>
              <Text style={styles.closeModalBtnText}>Zamknij</Text>
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#121417',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '94%',
    minHeight: '80%',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  subTitle: {
    color: '#8E94A0',
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1E2127',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  metricsBanner: {
    flexDirection: 'row',
    backgroundColor: '#1E2127',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  dividerVertical: {
    width: 1,
    backgroundColor: '#2F343F',
  },
  metricLabel: {
    color: '#8E94A0',
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1E2127',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#0288D1',
  },
  tabText: {
    color: '#8E94A0',
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#E5A93C',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 12,
  },
  inputLabel: {
    color: '#8E94A0',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#121417',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  quickOptionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickOptBtn: {
    flex: 1,
    backgroundColor: '#121417',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  quickOptBtnActive: {
    backgroundColor: '#0288D1',
    borderColor: '#0288D1',
  },
  quickOptText: {
    color: '#8E94A0',
    fontSize: 11,
    fontWeight: '600',
  },
  quickOptTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  resultCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    marginBottom: 14,
  },
  resultTitle: {
    color: '#8E94A0',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  resultHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginVertical: 4,
  },
  resultDesc: {
    color: '#D1D5DB',
    fontSize: 12,
    lineHeight: 18,
  },
  dividerH: {
    height: 1,
    backgroundColor: '#2F343F',
    marginVertical: 10,
  },
  windRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  windCol: {
    alignItems: 'center',
  },
  windLabel: {
    color: '#8E94A0',
    fontSize: 9,
    fontWeight: '700',
  },
  windVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  pairCard: {
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  pairGenderLabel: {
    color: '#42A5F5',
    fontSize: 10,
    fontWeight: '800',
  },
  pairRing: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  pairMetricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  pairMetricItem: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  matingResultCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    marginTop: 8,
    marginBottom: 14,
  },
  matingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matingHeaderLabel: {
    color: '#8E94A0',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  matingScoreVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  matingRecHeading: {
    fontSize: 14,
    fontWeight: '800',
    marginVertical: 4,
  },
  matingReasonText: {
    color: '#D1D5DB',
    fontSize: 12,
    lineHeight: 18,
  },
  offspringTitle: {
    color: '#E5A93C',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },
  offspringRow: {
    color: '#E5E7EB',
    fontSize: 11,
    marginBottom: 3,
  },
  theoryCard: {
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  theoryTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  theoryText: {
    color: '#9CA3AF',
    fontSize: 11,
    lineHeight: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2F343F',
  },
  closeModalBtn: {
    backgroundColor: '#1E2127',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  closeModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

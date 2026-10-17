/**
 * PIGEON-FLY — Inteligentny Generator Harmonogramu Sezonu Zimowego Modal (Z-058)
 * Zoohigiena i profilaktyka spoczynku zimowego:
 * - Tab 1: Chronometraż szczepień i przygotowania przedlęgowego (wstecz od daty parowania)
 * - Tab 2: Termiczna kalkulacja diety jęczmiennej i dodatków do poidła
 * - Tab 3: Wymogi zoohigieniczne 3 faz zimowania stada
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
  calculateWinterDietFormula,
  generateWinterSchedulePlan,
  WinterMilestone,
  WINTER_PHASES,
} from '../domain/winterSchedule';

interface WinterScheduleModalProps {
  visible: boolean;
  onClose: () => void;
}

export const WinterScheduleModal: React.FC<WinterScheduleModalProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'diet' | 'phases'>('timeline');
  const [pairingDateStr, setPairingDateStr] = useState('2027-02-20');
  const [tempCelsius, setTempCelsius] = useState<number>(0);
  const [hasHeatedSection, setHasHeatedSection] = useState<boolean>(false);

  const plan = generateWinterSchedulePlan({
    targetPairingDate: pairingDateStr,
    outdoorTemperatureCelsius: tempCelsius,
    hasHeatedBreedingSection: hasHeatedSection,
  });

  const diet = calculateWinterDietFormula(tempCelsius);

  const getCategoryIcon = (category: WinterMilestone['category']) => {
    switch (category) {
      case 'separation':
        return '🚻';
      case 'lab':
        return '🔬';
      case 'treatment':
        return '💊';
      case 'vaccine':
        return '💉';
      case 'disinfection':
        return '🔥';
      case 'nutrition':
        return '💡';
      case 'pairing':
        return '🕊️';
      default:
        return '📌';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>❄️ Harmonogram Zimowania i Profilaktyki (Z-058)</Text>
              <Text style={styles.subTitle}>Spoczynek zimowy, dieta jęczmienna i bezpieczny kalendarz szczepień</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'timeline' && styles.tabBtnActive]}
              onPress={() => setActiveTab('timeline')}
            >
              <Text style={[styles.tabText, activeTab === 'timeline' && styles.tabTextActive]}>
                🗓️ Oś Szczepień
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'diet' && styles.tabBtnActive]}
              onPress={() => setActiveTab('diet')}
            >
              <Text style={[styles.tabText, activeTab === 'diet' && styles.tabTextActive]}>
                🌾 Dieta Jęczmienna
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'phases' && styles.tabBtnActive]}
              onPress={() => setActiveTab('phases')}
            >
              <Text style={[styles.tabText, activeTab === 'phases' && styles.tabTextActive]}>
                🛡️ Fazy Zoohigieny
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {/* Safety Warnings */}
            {plan.safetyWarnings.length > 0 && (
              <View style={styles.alertBox}>
                <Text style={styles.alertTitle}>⚠️ Ostrzeżenie zoohigieniczne:</Text>
                {plan.safetyWarnings.map((w, idx) => (
                  <Text key={idx} style={styles.alertText}>• {w}</Text>
                ))}
              </View>
            )}

            {/* TAB 1: Oś Szczepień i Chronometraż Przedlęgowy */}
            {activeTab === 'timeline' && (
              <View>
                {/* Pairing Date Config Card */}
                <View style={styles.card}>
                  <Text style={styles.cardHeader}>🎯 PLANOWANA DATA PAROWANIA WIOSENNEGO</Text>
                  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Data połączenia par (YYYY-MM-DD):</Text>
                      <TextInput
                        style={styles.textInput}
                        value={pairingDateStr}
                        onChangeText={setPairingDateStr}
                        placeholder="2027-02-20"
                        placeholderTextColor="#64748B"
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.toggleHeatedBtn, hasHeatedSection && styles.toggleHeatedBtnActive]}
                      onPress={() => setHasHeatedSection(!hasHeatedSection)}
                    >
                      <Text style={[styles.toggleHeatedText, hasHeatedSection && styles.toggleHeatedTextActive]}>
                        {hasHeatedSection ? '🔥 Cela ogrzewana' : '❄️ Brak ogrzewania'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cardHint}>
                    Harmonogram automatycznie wylicza daty badań i szczepień wstecz, gwarantując min. 14 dni odstępu między szczepionkami.
                  </Text>
                </View>

                {/* Milestones Timeline */}
                <View style={styles.card}>
                  <Text style={styles.cardHeader}>📋 ETAPY PRZYGOTOWANIA PRZEDLĘGOWEGO (8 KROKÓW)</Text>
                  {plan.milestones.map((m, idx) => (
                    <View key={idx} style={styles.milestoneRow}>
                      <View style={styles.milestoneBadge}>
                        <Text style={styles.milestoneIcon}>{getCategoryIcon(m.category)}</Text>
                        <Text style={styles.milestoneDays}>
                          {m.daysBeforePairing === 0 ? 'D-0' : `T -${m.daysBeforePairing}d`}
                        </Text>
                      </View>
                      <View style={{ flex: 1, paddingLeft: 10 }}>
                        <View style={styles.rowBetween}>
                          <Text style={styles.milestoneTitle}>{m.title}</Text>
                          <Text style={styles.milestoneDate}>{m.targetDate}</Text>
                        </View>
                        <Text style={styles.milestoneDesc}>{m.description}</Text>
                        {m.minGapToNextVaccineDays && (
                          <Text style={styles.milestoneRule}>
                            ⚡ Wymóg: Min. {m.minGapToNextVaccineDays} dni odstępu do następnego szczepienia.
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* TAB 2: Dieta Jęczmienna & Termoregulacja */}
            {activeTab === 'diet' && (
              <View>
                {/* Temperature Selector */}
                <View style={styles.card}>
                  <Text style={styles.cardHeader}>🌡️ TEMPERATURA ZEWNĘTRZNA GOŁĘBNIKA</Text>
                  <Text style={styles.cardHint}>Wybierz aktualną temperaturę otoczenia, aby zbalansować udział jęczmienia i tłuszczu:</Text>
                  <View style={styles.tempBtnRow}>
                    {[
                      { label: '🥶 Mróz (-10°C)', val: -10 },
                      { label: '❄️ Spoczynek (0°C)', val: 0 },
                      { label: '⛅ Odwilż (+8°C)', val: 8 },
                    ].map((t) => (
                      <TouchableOpacity
                        key={t.val}
                        style={[styles.tempBtn, tempCelsius === t.val && styles.tempBtnActive]}
                        onPress={() => setTempCelsius(t.val)}
                      >
                        <Text style={[styles.tempBtnText, tempCelsius === t.val && styles.tempBtnTextActive]}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Diet Recipe Card */}
                <View style={styles.heroCard}>
                  <Text style={styles.heroLabel}>ZALECANA RECEPTURA MIESZANKI ZIMOWEJ</Text>
                  <Text style={styles.heroTitle}>{diet.dietName}</Text>
                  <Text style={styles.heroSub}>{diet.notes}</Text>

                  {/* Proportions Bars */}
                  <View style={styles.proportionsGrid}>
                    <View style={styles.propItem}>
                      <Text style={styles.propVal}>{diet.barleyPercent}%</Text>
                      <Text style={styles.propLabel}>Jęczmień</Text>
                    </View>
                    <View style={styles.propItem}>
                      <Text style={styles.propVal}>{diet.wheatPercent}%</Text>
                      <Text style={styles.propLabel}>Pszenica</Text>
                    </View>
                    <View style={styles.propItem}>
                      <Text style={styles.propVal}>{diet.cornPercent}%</Text>
                      <Text style={styles.propLabel}>Kukurydza</Text>
                    </View>
                    <View style={styles.propItem}>
                      <Text style={[styles.propVal, { color: '#FCD34D' }]}>{diet.fatSeedsPercent}%</Text>
                      <Text style={styles.propLabel}>Tłuszcz (Kardi/Len)</Text>
                    </View>
                    <View style={styles.propItem}>
                      <Text style={[styles.propVal, { color: diet.legumesPercent === 0 ? '#64748B' : '#60A5FA' }]}>
                        {diet.legumesPercent}%
                      </Text>
                      <Text style={styles.propLabel}>Strączkowe</Text>
                    </View>
                  </View>

                  <View style={styles.portionBadge}>
                    <Text style={styles.portionText}>
                      Dawkowanie dzienne: <u>{diet.dailyGramsPerBird} g</u> na ptaka (raz dziennie)
                    </Text>
                  </View>
                </View>

                {/* Drinker Additions Card */}
                <View style={styles.card}>
                  <Text style={styles.cardHeader}>🥤 SUPLEMENTACJA POIDŁA W TYM OKRESIE</Text>
                  {diet.drinkerAdditions.map((add, idx) => (
                    <View key={idx} style={styles.drinkerRow}>
                      <Text style={styles.drinkerBullet}>✓</Text>
                      <Text style={styles.drinkerText}>{add}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* TAB 3: Fazy Zoohigieny */}
            {activeTab === 'phases' && (
              <View>
                {Object.values(WINTER_PHASES).map((phase) => (
                  <View key={phase.id} style={styles.card}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.cardHeader}>🛡️ {phase.name.toUpperCase()}</Text>
                      <Text style={styles.phasePeriod}>{phase.periodDescription}</Text>
                    </View>
                    <Text style={styles.phaseGoal}>Cel: {phase.biologicalGoal}</Text>
                    <Text style={styles.phaseDiet}>Żywienie: {phase.dietFocus}</Text>

                    <Text style={styles.rulesHeader}>Zasady zoohigieniczne:</Text>
                    {phase.keyRules.map((rule, idx) => (
                      <Text key={idx} style={styles.ruleItem}>• {rule}</Text>
                    ))}

                    <Text style={styles.rulesHeader}>Zalecana suplementacja naturalna:</Text>
                    <View style={styles.supplementsRow}>
                      {phase.recommendedSupplements.map((sup, idx) => (
                        <View key={idx} style={styles.supBadge}>
                          <Text style={styles.supBadgeText}>{sup}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Footer Action Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeFooterBtn} onPress={onClose}>
              <Text style={styles.closeFooterBtnText}>ZAMKNIJ HARMONOGRAM ZIMOWANIA</Text>
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
    backgroundColor: '#0284C7',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 12,
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
  alertBox: {
    backgroundColor: '#451A03',
    borderColor: '#F97316',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  alertTitle: {
    color: '#FDBA74',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  alertText: {
    color: '#FED7AA',
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
    marginTop: 6,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  toggleHeatedBtn: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 18,
  },
  toggleHeatedBtnActive: {
    borderColor: '#F97316',
    backgroundColor: '#431407',
  },
  toggleHeatedText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  toggleHeatedTextActive: {
    color: '#FDBA74',
    fontWeight: 'bold',
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  milestoneBadge: {
    alignItems: 'center',
    width: 50,
  },
  milestoneIcon: {
    fontSize: 22,
  },
  milestoneDays: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94A3B8',
    marginTop: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F1F5F9',
    flex: 1,
  },
  milestoneDate: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#38BDF8',
    marginLeft: 6,
  },
  milestoneDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 16,
  },
  milestoneRule: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FCD34D',
    marginTop: 3,
  },
  tempBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  tempBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tempBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  tempBtnText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  tempBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  heroCard: {
    backgroundColor: '#0C4A6E',
    borderColor: '#0284C7',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#BAE6FD',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  heroSub: {
    fontSize: 11,
    color: '#E0F2FE',
    marginTop: 4,
    lineHeight: 16,
  },
  proportionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#082F49',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  propItem: {
    alignItems: 'center',
  },
  propVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#38BDF8',
  },
  propLabel: {
    fontSize: 9,
    color: '#BAE6FD',
    marginTop: 2,
  },
  portionBadge: {
    marginTop: 12,
    alignItems: 'center',
  },
  portionText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  drinkerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  drinkerBullet: {
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: 12,
  },
  drinkerText: {
    color: '#E2E8F0',
    fontSize: 12,
  },
  phasePeriod: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#38BDF8',
  },
  phaseGoal: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 4,
  },
  phaseDiet: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  rulesHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#E2E8F0',
    marginTop: 8,
    marginBottom: 4,
  },
  ruleItem: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
  },
  supplementsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  supBadge: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  supBadgeText: {
    fontSize: 10,
    color: '#BAE6FD',
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
    backgroundColor: '#0284C7',
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

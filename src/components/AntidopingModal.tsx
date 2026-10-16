/**
 * PIGEON-FLY — AntidopingModal (Z-304, BR-ZDR-009)
 * Regulatory FCI/PZHGP Anti-Doping Guard & Withdrawal Period Calculator.
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
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  FCI_SUBSTANCES_REGISTRY,
  ProhibitedSubstance,
  DopingCategory,
  detectSubstanceInProduct,
  getDetoxRecommendation,
} from '../domain/antidoping';
import { FieldButton } from './FieldButton';

export interface AntidopingModalProps {
  visible: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function AntidopingModal({
  visible,
  onClose,
  initialQuery = '',
}: AntidopingModalProps) {
  const [activeTab, setActiveTab] = useState<'calculator' | 'registry'>('calculator');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedSubstance, setSelectedSubstance] = useState<ProhibitedSubstance>(
    FCI_SUBSTANCES_REGISTRY[0]
  );
  const [adminDate, setAdminDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Calculate safe race date
  const computeSafeDate = () => {
    const d = new Date(adminDate);
    if (isNaN(d.getTime())) return 'Błędna data';
    d.setDate(d.getDate() + selectedSubstance.standardWithdrawalDays);
    return d.toISOString().split('T')[0];
  };

  const safeDateStr = computeSafeDate();
  const detox = getDetoxRecommendation(selectedSubstance.category);

  // Filter registry
  const filteredSubstances = FCI_SUBSTANCES_REGISTRY.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.innName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.brandNames.some((b) => b.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCat =
      categoryFilter === 'all' ||
      (categoryFilter === 'corticosteroid' && s.category === 'corticosteroid') ||
      (categoryFilter === 'anabolic' && s.category === 'anabolic_steroid') ||
      (categoryFilter === 'nsaid' && s.category === 'nsaid') ||
      (categoryFilter === 'antibiotic' && s.category === 'antibiotic') ||
      (categoryFilter === 'antiprotozoal' && s.category === 'antiprotozoal');

    return matchesSearch && matchesCat;
  });

  const handleSelectSubstance = (sub: ProhibitedSubstance) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSelectedSubstance(sub);
    setActiveTab('calculator');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>TARCZA ANTYDOPINGOWA FCI</Text>
                <Text style={styles.subtitle}>
                  Baza substancji zabronionych & kalkulator karencji PZHGP
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                testID="btn-close-antidoping-modal"
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Tab switch */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                onPress={() => setActiveTab('calculator')}
                style={[styles.tabBtn, activeTab === 'calculator' && styles.tabBtnActive]}
                testID="tab-antidoping-calc"
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === 'calculator' && styles.tabBtnTextActive,
                  ]}
                >
                  ⏱️ Kalkulator Karencji
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('registry')}
                style={[styles.tabBtn, activeTab === 'registry' && styles.tabBtnActive]}
                testID="tab-antidoping-registry"
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === 'registry' && styles.tabBtnTextActive,
                  ]}
                >
                  📚 Wykaz FCI ({FCI_SUBSTANCES_REGISTRY.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB 1: CALCULATOR & DETOX */}
            {activeTab === 'calculator' && (
              <View>
                {/* Active Substance Info Card */}
                <View
                  style={[
                    styles.card,
                    selectedSubstance.fciClassification === 'strictly_banned'
                      ? styles.cardDanger
                      : styles.cardWarning,
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.substanceName}>{selectedSubstance.name}</Text>
                      <Text style={styles.innName}>
                        {selectedSubstance.innName} • {selectedSubstance.categoryLabel}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.badge,
                        selectedSubstance.fciClassification === 'strictly_banned'
                          ? styles.badgeDanger
                          : styles.badgeWarning,
                      ]}
                    >
                      <Text style={styles.badgeText}>
                        {selectedSubstance.fciClassification === 'strictly_banned'
                          ? 'DOPING FCI'
                          : 'KARENCJA'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.description}>{selectedSubstance.description}</Text>

                  <View style={styles.brandRow}>
                    <Text style={styles.brandLabel}>Preparaty handlowe:</Text>
                    <Text style={styles.brandText}>
                      {selectedSubstance.brandNames.join(', ')}
                    </Text>
                  </View>

                  <Text style={styles.ruleRef}>⚖️ {selectedSubstance.fciRuleReference}</Text>
                </View>

                {/* Date Input */}
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>PARAMETRY PODANIA LEKU</Text>
                  <Text style={styles.inputLabel}>Data podania (YYYY-MM-DD):</Text>
                  <TextInput
                    style={styles.textInput}
                    value={adminDate}
                    onChangeText={setAdminDate}
                    placeholder="2026-05-15"
                    placeholderTextColor="#7A808C"
                    keyboardType="numbers-and-punctuation"
                  />

                  <View style={styles.grid2}>
                    <View style={styles.metricBox}>
                      <Text style={styles.metricVal}>
                        {selectedSubstance.standardWithdrawalDays} dni
                      </Text>
                      <Text style={styles.metricLbl}>Karencja minimalna</Text>
                    </View>
                    <View style={styles.metricBox}>
                      <Text style={styles.metricVal}>
                        {selectedSubstance.detectionWindowDays} dni
                      </Text>
                      <Text style={styles.metricLbl}>Okno detekcji lab</Text>
                    </View>
                  </View>

                  <View style={styles.safeResultBox}>
                    <Text style={styles.safeResultTitle}>
                      NAJWCZEŚNIEJSZA DATA KOSZOWANIA:
                    </Text>
                    <Text style={styles.safeResultDate}>{safeDateStr}</Text>
                    <Text style={styles.safeResultNote}>
                      {selectedSubstance.fciClassification === 'strictly_banned'
                        ? 'UWAGA: Substancja z listy dopingu! Przed koszowaniem zalecany test screeningowy próbki kału/moczu.'
                        : 'Ptak może być bezpiecznie koszowany od tej daty bez ryzyka dyskwalifikacji.'}
                    </Text>
                  </View>
                </View>

                {/* Detox & Liver Protection Protocol */}
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>🛡️ PROTOKÓŁ DETOKSU & OSŁONY</Text>
                  <Text style={styles.protocolName}>{detox.protocolName}</Text>
                  <Text style={styles.protocolDuration}>
                    Czas trwania: {detox.durationDays} dni po zakończeniu kuracji
                  </Text>

                  {detox.supplements.map((item, idx) => (
                    <View key={idx} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}

                  <View style={styles.hydrationBox}>
                    <Text style={styles.hydrationLabel}>Zalecenie nawadniania:</Text>
                    <Text style={styles.hydrationText}>{detox.hydrationAdvise}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* TAB 2: SUBSTANCE DIRECTORY & SEARCH */}
            {activeTab === 'registry' && (
              <View>
                {/* Search */}
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Szukaj leku (np. Baytril, Metacam, Clenbuterol)..."
                  placeholderTextColor="#7A808C"
                  clearButtonMode="while-editing"
                />

                {/* Filter chips */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterChipScroll}
                >
                  {[
                    { key: 'all', label: 'Wszystkie' },
                    { key: 'corticosteroid', label: 'Glikokortykosteroidy' },
                    { key: 'anabolic', label: 'Anaboliki' },
                    { key: 'nsaid', label: 'NLPZ / Ból' },
                    { key: 'antibiotic', label: 'Antybiotyki' },
                    { key: 'antiprotozoal', label: 'Rzęsistek' },
                  ].map((chip) => (
                    <TouchableOpacity
                      key={chip.key}
                      onPress={() => setCategoryFilter(chip.key)}
                      style={[
                        styles.chip,
                        categoryFilter === chip.key && styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          categoryFilter === chip.key && styles.chipTextActive,
                        ]}
                      >
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Substance List */}
                {filteredSubstances.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleSelectSubstance(item)}
                    style={styles.substanceRow}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{item.name}</Text>
                      <Text style={styles.rowSub}>
                        {item.innName} • Karencja: {item.standardWithdrawalDays} dni
                      </Text>
                      <Text style={styles.rowBrands} numberOfLines={1}>
                        Handlowe: {item.brandNames.join(', ')}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.badgeSmall,
                        item.fciClassification === 'strictly_banned'
                          ? styles.badgeDanger
                          : styles.badgeWarning,
                      ]}
                    >
                      <Text style={styles.badgeSmallText}>
                        {item.fciClassification === 'strictly_banned' ? 'DOPING' : 'KARENCJA'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <FieldButton
              title="ZAMKNIJ MODUŁ ANTYDOPINGOWY"
              variant="secondary"
              onPress={onClose}
              style={{ marginTop: 12, marginBottom: 20 }}
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
    backgroundColor: '#16191E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
  },
  scrollContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#8E94A0',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#232730',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#1E222B',
    borderRadius: 10,
    padding: 4,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#2F3646',
  },
  tabBtnText: {
    color: '#8E94A0',
    fontSize: 13,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#1E222B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2D3342',
  },
  cardDanger: {
    borderColor: '#E53935',
    backgroundColor: 'rgba(229, 57, 53, 0.08)',
  },
  cardWarning: {
    borderColor: '#F57C00',
    backgroundColor: 'rgba(245, 124, 0, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  substanceName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  innName: {
    color: '#B0B6C3',
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeDanger: {
    backgroundColor: '#E53935',
  },
  badgeWarning: {
    backgroundColor: '#F57C00',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  description: {
    color: '#CFD4DC',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  brandRow: {
    marginBottom: 6,
  },
  brandLabel: {
    color: '#8E94A0',
    fontSize: 11,
    fontWeight: '600',
  },
  brandText: {
    color: '#4FC3F7',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  ruleRef: {
    color: '#8E94A0',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  inputLabel: {
    color: '#B0B6C3',
    fontSize: 12,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#121417',
    color: '#FFFFFF',
    fontSize: 15,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2F3646',
    marginBottom: 10,
  },
  grid2: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#121417',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2F3646',
  },
  metricVal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  metricLbl: {
    color: '#8E94A0',
    fontSize: 11,
    marginTop: 2,
  },
  safeResultBox: {
    backgroundColor: '#0F261C',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  safeResultTitle: {
    color: '#81C784',
    fontSize: 11,
    fontWeight: '800',
  },
  safeResultDate: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  safeResultNote: {
    color: '#B0BEC5',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  protocolName: {
    color: '#4FC3F7',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  protocolDuration: {
    color: '#8E94A0',
    fontSize: 12,
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bulletDot: {
    color: '#4FC3F7',
    fontSize: 14,
    marginRight: 6,
    lineHeight: 18,
  },
  bulletText: {
    color: '#E0E0E0',
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  hydrationBox: {
    marginTop: 8,
    backgroundColor: '#121417',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2F3646',
  },
  hydrationLabel: {
    color: '#8E94A0',
    fontSize: 11,
  },
  hydrationText: {
    color: '#81D4FA',
    fontSize: 12,
    marginTop: 2,
  },
  searchInput: {
    backgroundColor: '#1E222B',
    color: '#FFFFFF',
    fontSize: 14,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2D3342',
    marginBottom: 10,
  },
  filterChipScroll: {
    gap: 6,
    paddingBottom: 10,
  },
  chip: {
    backgroundColor: '#1E222B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2D3342',
  },
  chipActive: {
    backgroundColor: '#2F3646',
    borderColor: '#4FC3F7',
  },
  chipText: {
    color: '#8E94A0',
    fontSize: 12,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  substanceRow: {
    backgroundColor: '#1E222B',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D3342',
  },
  rowTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  rowSub: {
    color: '#B0B6C3',
    fontSize: 12,
    marginTop: 2,
  },
  rowBrands: {
    color: '#8E94A0',
    fontSize: 11,
    marginTop: 2,
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginLeft: 8,
  },
  badgeSmallText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});

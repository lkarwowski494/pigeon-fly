/**
 * PIGEON-FLY — Asystent Kosztów i Budżetu Sezonu Hodowlanego Modal (Z-056)
 * Finanse i bilans ekonomiczny gołębnika:
 * - Tab 1: Bilans roczny, struktura wydatków i kontrola limitu budżetowego
 * - Tab 2: Koszt jednostkowy odchowania 1 młodego do odsadzenia
 * - Tab 3: Koszt jednostkowy utrzymania 1 lotnika w sezonie sportowym
 * - Tab 4: Rejestr wydatków i przychodów
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
  calculateChickRearingCost,
  calculateRacerSeasonCost,
  calculateSeasonFinancialSummary,
  ExpenseCategory,
  ExpenseEntry,
  RevenueEntry,
  EXPENSE_CATEGORY_NAMES,
  REVENUE_CATEGORY_NAMES,
} from '../domain/loftFinance';

interface LoftFinanceModalProps {
  visible: boolean;
  onClose: () => void;
}

const INITIAL_EXPENSES: ExpenseEntry[] = [
  { id: 'e1', date: '2026-02-10', category: 'feed', title: 'Karma lęgowa Mariman 10 worków', amount: 850, targetGroup: 'breeding' },
  { id: 'e2', date: '2026-02-18', category: 'veterinary', title: 'Szczepionka PMV-1 + Ospia stado', amount: 480, targetGroup: 'all' },
  { id: 'e3', date: '2026-03-01', category: 'pzhgp_fees', title: 'Obrączki rodowe 2026 + karty PZHGP', amount: 320, targetGroup: 'breeding' },
  { id: 'e4', date: '2026-03-15', category: 'pzhgp_fees', title: 'Opłata za antenę i zegar Tauris', amount: 350, targetGroup: 'racing' },
  { id: 'e5', date: '2026-04-10', category: 'feed', title: 'Karma lotowa energetyczna 8 worków', amount: 720, targetGroup: 'racing' },
  { id: 'e6', date: '2026-04-20', category: 'supplements', title: 'Witaminy, aminokwasy i elektrolity', amount: 260, targetGroup: 'racing' },
  { id: 'e7', date: '2026-05-01', category: 'pzhgp_fees', title: 'Koszowe oddziałowe - sezon starych', amount: 950, targetGroup: 'racing' },
  { id: 'e8', date: '2026-05-15', category: 'logistics', title: 'Paliwo na wywózki prywatne (500 km)', amount: 280, targetGroup: 'racing' },
];

const INITIAL_REVENUES: RevenueEntry[] = [
  { id: 'r1', date: '2026-05-20', category: 'youngster_sales', title: 'Sprzedaż 4 młodych z rozpłodu', amount: 800, buyerOrRace: 'Jan K.' },
  { id: 'r2', date: '2026-06-15', category: 'race_prizes', title: 'Nagroda oddziałowa za 1. serię', amount: 350, buyerOrRace: 'Lot 3' },
];

export const LoftFinanceModal: React.FC<LoftFinanceModalProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'balance' | 'chick' | 'racer' | 'ledger'>('balance');

  // Ledger state
  const [expenses, setExpenses] = useState<ExpenseEntry[]>(INITIAL_EXPENSES);
  const [revenues, setRevenues] = useState<RevenueEntry[]>(INITIAL_REVENUES);
  const [budgetCapStr, setBudgetCapStr] = useState('4500');

  // Chick calculator state
  const [breedingPairs, setBreedingPairs] = useState('12');
  const [weanedChicks, setWeanedChicks] = useState('42');
  const [breedingFeedPrice, setBreedingFeedPrice] = useState('4.20');
  const [breedingSupplements, setBreedingSupplements] = useState('220');
  const [ringFee, setRingFee] = useState('4.50');
  const [pmvDoseCost, setPmvDoseCost] = useState('6.00');

  // Racer calculator state
  const [racingTeamSize, setRacingTeamSize] = useState('45');
  const [racerFeedPrice, setRacerFeedPrice] = useState('3.90');
  const [racingSupplements, setRacingSupplements] = useState('550');
  const [vetPerRacer, setVetPerRacer] = useState('28');
  const [clubBasketingTotal, setClubBasketingTotal] = useState('1100');
  const [trainingFuelTotal, setTrainingFuelTotal] = useState('400');

  // New expense form
  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');
  const [newExpCategory, setNewExpCategory] = useState<ExpenseCategory>('feed');

  // Summary calculations
  const parsedBudgetCap = parseFloat(budgetCapStr) || 0;
  const summary = calculateSeasonFinancialSummary(expenses, revenues, parsedBudgetCap > 0 ? parsedBudgetCap : undefined);

  // Chick cost calculations
  const chickResult = calculateChickRearingCost({
    breedingPairCount: parseInt(breedingPairs, 10) || 12,
    youngstersWeanedCount: parseInt(weanedChicks, 10) || 42,
    feedPricePerKg: parseFloat(breedingFeedPrice) || 4.2,
    supplementsTotalCost: parseFloat(breedingSupplements) || 220,
    ringFeePerBird: parseFloat(ringFee) || 4.5,
    pmvVaccineCostPerBird: parseFloat(pmvDoseCost) || 6.0,
  });

  // Racer cost calculations
  const racerResult = calculateRacerSeasonCost({
    racingTeamSize: parseInt(racingTeamSize, 10) || 45,
    feedPricePerKg: parseFloat(racerFeedPrice) || 3.9,
    racingSupplementsTotal: parseFloat(racingSupplements) || 550,
    vetPreventionPerBird: parseFloat(vetPerRacer) || 28,
    clubBasketingFeesTotal: parseFloat(clubBasketingTotal) || 1100,
    trainingTossFuelTotal: parseFloat(trainingFuelTotal) || 400,
  });

  const handleAddExpense = () => {
    const amt = parseFloat(newExpAmount);
    if (!newExpTitle.trim() || isNaN(amt) || amt <= 0) {
      Alert.alert('Błąd', 'Podaj poprawny tytuł oraz kwotę wydatku.');
      return;
    }

    const newEntry: ExpenseEntry = {
      id: `exp-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      category: newExpCategory,
      title: newExpTitle.trim(),
      amount: amt,
    };

    setExpenses((prev) => [newEntry, ...prev]);
    setNewExpTitle('');
    setNewExpAmount('');
    Alert.alert('Sukces', `Dodano wydatek: ${amt.toFixed(2)} PLN (${EXPENSE_CATEGORY_NAMES[newExpCategory]}).`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>💰 Finanse i Budżet Gołębnika (Z-056)</Text>
              <Text style={styles.subTitle}>Księgowość stada, koszt odchowania młodego i lotnika</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'balance' && styles.tabBtnActive]}
              onPress={() => setActiveTab('balance')}
            >
              <Text style={[styles.tabText, activeTab === 'balance' && styles.tabTextActive]}>
                📊 Bilans
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'chick' && styles.tabBtnActive]}
              onPress={() => setActiveTab('chick')}
            >
              <Text style={[styles.tabText, activeTab === 'chick' && styles.tabTextActive]}>
                🐣 1 Młody
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'racer' && styles.tabBtnActive]}
              onPress={() => setActiveTab('racer')}
            >
              <Text style={[styles.tabText, activeTab === 'racer' && styles.tabTextActive]}>
                🏁 1 Lotnik
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'ledger' && styles.tabBtnActive]}
              onPress={() => setActiveTab('ledger')}
            >
              <Text style={[styles.tabText, activeTab === 'ledger' && styles.tabTextActive]}>
                🧾 Wpisy
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {/* TAB 1: Bilans Sezonu i Budżet */}
            {activeTab === 'balance' && (
              <View>
                {/* KPI Overview Grid */}
                <View style={styles.kpiGrid}>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>WYDATKI ŁĄCZNIE</Text>
                    <Text style={[styles.kpiValue, { color: '#EF4444' }]}>
                      {summary.totalExpenses.toFixed(2)} zł
                    </Text>
                    <Text style={styles.kpiSub}>~{summary.costPerDay.toFixed(2)} zł / dzień</Text>
                  </View>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>PRZYCHODY</Text>
                    <Text style={[styles.kpiValue, { color: '#10B981' }]}>
                      {summary.totalRevenues.toFixed(2)} zł
                    </Text>
                    <Text style={styles.kpiSub}>młode + nagrody</Text>
                  </View>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>WYNIK NETTO</Text>
                    <Text
                      style={[
                        styles.kpiValue,
                        { color: summary.netBalance >= 0 ? '#10B981' : '#F59E0B' },
                      ]}
                    >
                      {summary.netBalance >= 0 ? `+${summary.netBalance.toFixed(2)}` : summary.netBalance.toFixed(2)} zł
                    </Text>
                    <Text style={styles.kpiSub}>
                      {summary.netBalance >= 0 ? 'Zysk z hodowli' : 'Dopłata do pasji'}
                    </Text>
                  </View>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>GŁÓWNY KOSZT</Text>
                    <Text style={[styles.kpiValue, { fontSize: 13, color: '#60A5FA' }]} numberOfLines={1}>
                      {EXPENSE_CATEGORY_NAMES[summary.topCostCategory]}
                    </Text>
                    <Text style={styles.kpiSub}>
                      {summary.categoryBreakdown[summary.topCostCategory].percentage}% całości
                    </Text>
                  </View>
                </View>

                {/* Budget Cap Monitor */}
                <View style={[styles.sectionCard, summary.isOverBudget && styles.cardDanger]}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.sectionHeader}>🎯 KONTROLA LIMITU BUDŻETOWEGO</Text>
                    <Text
                      style={[
                        styles.budgetStatusText,
                        { color: summary.isOverBudget ? '#EF4444' : '#10B981' },
                      ]}
                    >
                      {summary.isOverBudget ? '⚠️ PRZEKROCZONY' : '✓ W NORMIE'}
                    </Text>
                  </View>
                  <View style={styles.budgetRow}>
                    <Text style={styles.inputLabel}>Planowany budżet roczny (zł):</Text>
                    <TextInput
                      style={styles.budgetInput}
                      keyboardType="numeric"
                      value={budgetCapStr}
                      onChangeText={setBudgetCapStr}
                    />
                  </View>
                  {summary.isOverBudget ? (
                    <Text style={styles.budgetAlertText}>
                      Przekroczono zaplanowany limit o <Text style={{ fontWeight: 'bold' }}>{summary.budgetVarianceAmount.toFixed(2)} zł</Text>.
                    </Text>
                  ) : (
                    <Text style={styles.budgetSafeText}>
                      Pozostało do dyspozycji: {((parsedBudgetCap || 0) - summary.totalExpenses).toFixed(2)} zł ({Math.round((((parsedBudgetCap || 0) - summary.totalExpenses) / (parsedBudgetCap || 1)) * 100)}% budżetu).
                    </Text>
                  )}
                </View>

                {/* Category Breakdown Bars */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionHeader}>📑 STRUKTURA WYDATKÓW WEDŁUG DZIAŁÓW</Text>
                  {(Object.keys(summary.categoryBreakdown) as ExpenseCategory[]).map((cat) => {
                    const item = summary.categoryBreakdown[cat];
                    if (item.total === 0) return null;
                    return (
                      <View key={cat} style={styles.catBarWrapper}>
                        <View style={styles.rowBetween}>
                          <Text style={styles.catName}>{EXPENSE_CATEGORY_NAMES[cat]}</Text>
                          <Text style={styles.catAmount}>
                            {item.total.toFixed(2)} zł ({item.percentage}%)
                          </Text>
                        </View>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { width: `${Math.min(100, item.percentage)}%` }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* TAB 2: Koszt Odchowania Młodego */}
            {activeTab === 'chick' && (
              <View>
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionHeader}>🐣 PARAMETRY ROZPŁODU I ODCHOWU</Text>
                  <View style={styles.inputGrid}>
                    <View style={styles.inputCol}>
                      <Text style={styles.inputLabel}>Liczba par lęgowych:</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={breedingPairs}
                        onChangeText={setBreedingPairs}
                      />
                    </View>
                    <View style={styles.inputCol}>
                      <Text style={styles.inputLabel}>Młodych odsadzonych:</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={weanedChicks}
                        onChangeText={setWeanedChicks}
                      />
                    </View>
                  </View>
                  <View style={styles.inputGrid}>
                    <View style={styles.inputCol}>
                      <Text style={styles.inputLabel}>Cena karmy (zł/kg):</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={breedingFeedPrice}
                        onChangeText={setBreedingFeedPrice}
                      />
                    </View>
                    <View style={styles.inputCol}>
                      <Text style={styles.inputLabel}>Suplementy lęgowe (zł):</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={breedingSupplements}
                        onChangeText={setBreedingSupplements}
                      />
                    </View>
                  </View>
                  <View style={styles.inputGrid}>
                    <View style={styles.inputCol}>
                      <Text style={styles.inputLabel}>Obrączka rodowa (zł):</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={ringFee}
                        onChangeText={setRingFee}
                      />
                    </View>
                    <View style={styles.inputCol}>
                      <Text style={styles.inputLabel}>Szczepionka PMV-1 (zł):</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={pmvDoseCost}
                        onChangeText={setPmvDoseCost}
                      />
                    </View>
                  </View>
                </View>

                {/* Chick Unit Cost Highlight */}
                <View style={styles.heroResultCard}>
                  <Text style={styles.heroResultLabel}>KOSZT JEDNOSTKOWY ODCHOWANIA 1 MŁODEGO</Text>
                  <Text style={styles.heroResultValue}>{chickResult.costPerYoungster.toFixed(2)} zł</Text>
                  <Text style={styles.heroResultSub}>
                    Koszt na parę lęgową: {chickResult.costPerPair.toFixed(2)} zł | Pasza: {chickResult.totalFeedKg} kg ({chickResult.totalFeedCost.toFixed(2)} zł)
                  </Text>
                </View>

                {/* Chick Breakdown */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionHeader}>📊 ROZBICIE KOSZTU ODCHOWANIA</Text>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>🌾 Karma dla rodziców i piskląt:</Text>
                    <Text style={styles.metricVal}>{chickResult.totalFeedCost.toFixed(2)} zł ({chickResult.breakdownPercent.feed}%)</Text>
                  </View>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>🧪 Suplementy, grity i minerały:</Text>
                    <Text style={styles.metricVal}>{chickResult.totalSupplementsCost.toFixed(2)} zł ({chickResult.breakdownPercent.supplements}%)</Text>
                  </View>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>💍 Obrączki rodowe PZHGP:</Text>
                    <Text style={styles.metricVal}>{chickResult.totalRingAndAdminCost.toFixed(2)} zł ({chickResult.breakdownPercent.rings}%)</Text>
                  </View>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>💉 Szczepienia PMV-1 i profilaktyka:</Text>
                    <Text style={styles.metricVal}>{chickResult.totalHealthPreventionCost.toFixed(2)} zł ({chickResult.breakdownPercent.health}%)</Text>
                  </View>
                  <View style={[styles.metricRow, { borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 8, marginTop: 4 }]}>
                    <Text style={[styles.metricLabel, { fontWeight: 'bold', color: '#FFFFFF' }]}>RAZEM KOSZT CAŁEGO LĘGU:</Text>
                    <Text style={[styles.metricVal, { fontWeight: 'bold', color: '#10B981', fontSize: 15 }]}>{chickResult.totalBreedingCost.toFixed(2)} zł</Text>
                  </View>
                </View>
              </View>
            )}

            {/* TAB 3: Koszt 1 Lotnika w Sezonie */}
            {activeTab === 'racer' && (
              <View>
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionHeader}>🏁 PARAMETRY DRUŻYNY LOTOWEJ</Text>
                  <View style={styles.inputGrid}>
                    <View style={styles.inputCol}>
                      <Text style={styles.inputLabel}>Liczba lotników w kadrze:</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={racingTeamSize}
                        onChangeText={setRacingTeamSize}
                      />
                    </View>
                    <View style={styles.inputCol}>
                      <Text style={styles.inputLabel}>Cena karmy (zł/kg):</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={racerFeedPrice}
                        onChangeText={setRacerFeedPrice}
                      />
                    </View>
                  </View>
                  <View style={styles.inputGrid}>
                    <View style={styles.inputCol}>
                      <Text style={styles.inputLabel}>Suplementy lotowe (zł):</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={racingSupplements}
                        onChangeText={setRacingSupplements}
                      />
                    </View>
                    <View style={styles.inputCol}>
                      <Text style={styles.inputLabel}>Weterynaria (zł/ptak):</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={vetPerRacer}
                        onChangeText={setVetPerRacer}
                      />
                    </View>
                  </View>
                  <View style={styles.inputGrid}>
                    <View style={styles.inputCol}>
                      <Text style={styles.inputLabel}>Koszowe + zegar (zł):</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={clubBasketingTotal}
                        onChangeText={setClubBasketingTotal}
                      />
                    </View>
                    <View style={styles.inputCol}>
                      <Text style={styles.inputLabel}>Paliwo na wywózki (zł):</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={trainingFuelTotal}
                        onChangeText={setTrainingFuelTotal}
                      />
                    </View>
                  </View>
                </View>

                {/* Racer Unit Cost Highlight */}
                <View style={styles.heroResultCard}>
                  <Text style={styles.heroResultLabel}>KOSZT UTRZYMANIA 1 LOTNIKA W SEZONIE</Text>
                  <Text style={[styles.heroResultValue, { color: '#60A5FA' }]}>{racerResult.totalCostPerRacer.toFixed(2)} zł</Text>
                  <Text style={styles.heroResultSub}>
                    Koszt całej drużyny ({racingTeamSize} szt.): {racerResult.totalRacingTeamCost.toFixed(2)} zł / rok
                  </Text>
                </View>

                {/* Racer Breakdown */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionHeader}>📊 ROZBICIE KOSZTU NA 1 LOTNIKA</Text>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>🌾 Pasza i ziarno całoroczne:</Text>
                    <Text style={styles.metricVal}>{racerResult.feedCostPerRacer.toFixed(2)} zł / ptak</Text>
                  </View>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>🧪 Suplementy i odżywki lotowe:</Text>
                    <Text style={styles.metricVal}>{racerResult.supplementsCostPerRacer.toFixed(2)} zł / ptak</Text>
                  </View>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>💉 Weterynaria, szczepienia, leki:</Text>
                    <Text style={styles.metricVal}>{racerResult.vetCostPerRacer.toFixed(2)} zł / ptak</Text>
                  </View>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>🚛 Koszowe oddziałowe i zegar:</Text>
                    <Text style={styles.metricVal}>{racerResult.basketingCostPerRacer.toFixed(2)} zł / ptak</Text>
                  </View>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>⛽ Treningi prywatne i paliwo:</Text>
                    <Text style={styles.metricVal}>{racerResult.trainingFuelCostPerRacer.toFixed(2)} zł / ptak</Text>
                  </View>
                </View>
              </View>
            )}

            {/* TAB 4: Rejestr Wpisów & Dodawanie */}
            {activeTab === 'ledger' && (
              <View>
                {/* Add Expense Form */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionHeader}>➕ SZYBKIE DODANIE WYDATKU</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Nazwa wydatku (np. Zapas gritów 5 wiader)"
                    placeholderTextColor="#64748B"
                    value={newExpTitle}
                    onChangeText={setNewExpTitle}
                  />
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                    <TextInput
                      style={[styles.textInput, { flex: 1 }]}
                      keyboardType="numeric"
                      placeholder="Kwota (zł)"
                      placeholderTextColor="#64748B"
                      value={newExpAmount}
                      onChangeText={setNewExpAmount}
                    />
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={handleAddExpense}
                    >
                      <Text style={styles.addBtnText}>+ ZAPISZ</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Kategoria wydatku:</Text>
                  <View style={styles.categoryPills}>
                    {(['feed', 'supplements', 'veterinary', 'pzhgp_fees', 'equipment', 'logistics'] as ExpenseCategory[]).map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.catPill, newExpCategory === cat && styles.catPillActive]}
                        onPress={() => setNewExpCategory(cat)}
                      >
                        <Text style={[styles.catPillText, newExpCategory === cat && styles.catPillTextActive]}>
                          {EXPENSE_CATEGORY_NAMES[cat].split(' ')[0]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Ledger entries list */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionHeader}>📋 OSTATNIE OPERACJE ({expenses.length})</Text>
                  {expenses.map((e) => (
                    <View key={e.id} style={styles.ledgerItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.ledgerTitle}>{e.title}</Text>
                        <Text style={styles.ledgerMeta}>
                          {e.date} • {EXPENSE_CATEGORY_NAMES[e.category]}
                        </Text>
                      </View>
                      <Text style={styles.ledgerAmount}>-{e.amount.toFixed(2)} zł</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Action Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeFooterBtn} onPress={onClose}>
              <Text style={styles.closeFooterBtnText}>ZAMKNIJ ASYSTENTA FINANSOWEGO</Text>
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
    backgroundColor: '#3B82F6',
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  kpiSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardDanger: {
    borderColor: '#EF4444',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#93C5FD',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  budgetInput: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: 100,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  budgetAlertText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
  },
  budgetSafeText: {
    color: '#10B981',
    fontSize: 12,
    marginTop: 8,
  },
  catBarWrapper: {
    marginBottom: 10,
  },
  catName: {
    fontSize: 12,
    color: '#E2E8F0',
  },
  catAmount: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  barTrack: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    marginTop: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  inputGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  inputCol: {
    flex: 1,
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
  heroResultCard: {
    backgroundColor: '#1E3A8A',
    borderColor: '#3B82F6',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  heroResultLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#93C5FD',
    letterSpacing: 0.5,
  },
  heroResultValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#10B981',
    marginVertical: 4,
  },
  heroResultSub: {
    fontSize: 11,
    color: '#DBEAFE',
    textAlign: 'center',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  metricLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  metricVal: {
    fontSize: 12,
    color: '#F1F5F9',
    fontWeight: '600',
  },
  addBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  categoryPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  catPill: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  catPillActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  catPillText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  catPillTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  ledgerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  ledgerTitle: {
    fontSize: 13,
    color: '#F1F5F9',
    fontWeight: '600',
  },
  ledgerMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  ledgerAmount: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: 'bold',
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
    backgroundColor: '#3B82F6',
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

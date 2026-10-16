/**
 * PIGEON-FLY — BasketingSessionModal
 * Interactive race entry and basketing management (Koszowanie stada).
 * Manage transport crates, designate series birds (Typka T do GMP), and calculate basket manifest.
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
  BasketEntry,
  calculateBasketingSummary,
  toggleSeriesDesignation,
} from '../domain/basketing';
import { FieldButton } from './FieldButton';

export interface BasketingSessionModalProps {
  visible: boolean;
  onClose: () => void;
  raceName: string;
  initialEntries?: BasketEntry[];
  onSaveBasket: (entries: BasketEntry[]) => void;
}

const DEMO_BASKET_POOL: BasketEntry[] = [
  {
    pigeonId: 'p-01',
    ringNumber: 'PL-0284-23-1402',
    countryCode: 'PL',
    year: 2023,
    sex: 'cock',
    plumageColor: 'Niebieski nakrapiany',
    isDesignatedSeries: true,
    basketingOrder: 1,
    basketCrateNumber: 1,
  },
  {
    pigeonId: 'p-02',
    ringNumber: 'PL-0284-22-9854',
    countryCode: 'PL',
    year: 2022,
    sex: 'hen',
    plumageColor: 'Ciemna płowa',
    isDesignatedSeries: true,
    basketingOrder: 2,
    basketCrateNumber: 1,
  },
  {
    pigeonId: 'p-03',
    ringNumber: 'DV-01234-24-512',
    countryCode: 'DV',
    year: 2024,
    sex: 'cock',
    plumageColor: 'Pstry',
    isDesignatedSeries: false,
    basketingOrder: 3,
    basketCrateNumber: 1,
  },
  {
    pigeonId: 'p-04',
    ringNumber: 'PL-0284-24-4401',
    countryCode: 'PL',
    year: 2024,
    sex: 'hen',
    plumageColor: 'Niebieska',
    isDesignatedSeries: false,
    basketingOrder: 4,
    basketCrateNumber: 1,
  },
];

export function BasketingSessionModal({
  visible,
  onClose,
  raceName,
  initialEntries,
  onSaveBasket,
}: BasketingSessionModalProps) {
  const [basket, setBasket] = useState<BasketEntry[]>(initialEntries || DEMO_BASKET_POOL);

  const summary = calculateBasketingSummary(basket);

  const handleToggleSeries = (pigeonId: string) => {
    const res = toggleSeriesDesignation(pigeonId, basket, 5);
    if (!res.success) {
      Alert.alert('Limit Serii', res.message || 'Nie można dodać więcej ptaków do serii typowanej.');
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setBasket(res.updatedBasket);
  };

  const handleRemoveFromBasket = (pigeonId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setBasket((prev) => prev.filter((b) => b.pigeonId !== pigeonId));
  };

  const handleSave = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    onSaveBasket(basket);
    Alert.alert(
      'Zapisano Koszowanie!',
      `Lot: ${raceName}\nWłożono: ${basket.length} ptaków\nTypowane (T): ${summary.designatedSeriesCount} ptaków`
    );
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>KOSZOWANIE (LISTA WKŁADANIOWA)</Text>
                <Text style={styles.subtitle}>Lot: {raceName}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Summary Bar */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryVal}>{summary.totalBasketed}</Text>
                <Text style={styles.summaryLbl}>W koszu</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryVal, { color: '#64B5F6' }]}>{summary.cocksCount}</Text>
                <Text style={styles.summaryLbl}>Samców (♂)</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryVal, { color: '#F48FB1' }]}>{summary.hensCount}</Text>
                <Text style={styles.summaryLbl}>Samic (♀)</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryVal, { color: '#E5A93C' }]}>
                  {summary.designatedSeriesCount}/5
                </Text>
                <Text style={styles.summaryLbl}>Seria (T)</Text>
              </View>
            </View>

            {/* List of Basketed Birds */}
            <Text style={styles.sectionHeading}>
              GOŁĘBIE W KOSZU TRANSPORTOWYM ({basket.length})
            </Text>

            {basket.map((item, idx) => (
              <View key={item.pigeonId} style={styles.pigeonRow}>
                <View style={styles.orderBadge}>
                  <Text style={styles.orderText}>{idx + 1}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.ringText}>
                    {item.countryCode}-{item.ringNumber}
                  </Text>
                  <Text style={styles.metaText}>
                    {item.sex === 'cock' ? '♂ Samiec' : '♀ Samica'} • {item.year} • {item.plumageColor}
                  </Text>
                </View>

                {/* Series Designation (T) Button */}
                <TouchableOpacity
                  onPress={() => handleToggleSeries(item.pigeonId)}
                  style={[styles.tipBtn, item.isDesignatedSeries && styles.tipBtnActive]}
                >
                  <Text style={[styles.tipBtnText, item.isDesignatedSeries && styles.tipBtnTextActive]}>
                    {item.isDesignatedSeries ? '★ Typka (T)' : '+ Typuj'}
                  </Text>
                </TouchableOpacity>

                {/* Remove button */}
                <TouchableOpacity
                  onPress={() => handleRemoveFromBasket(item.pigeonId)}
                  style={styles.removeBtn}
                >
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Save Button */}
            <FieldButton
              title="💾 ZATWIERDŹ LISTĘ KOSZOWANIA"
              onPress={handleSave}
              testID="btn-save-basketing-session"
              style={{ marginTop: 14 }}
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1E2127',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '92%',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#E5A93C',
  },
  subtitle: {
    fontSize: 13,
    color: '#8E94A0',
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
  },
  closeText: {
    fontSize: 22,
    color: '#8E94A0',
    fontWeight: '800',
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#15171C',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 14,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  summaryLbl: {
    fontSize: 11,
    color: '#8E94A0',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  pigeonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15171C',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 8,
  },
  orderBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2A303C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  orderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E5A93C',
  },
  ringText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  metaText: {
    fontSize: 11,
    color: '#8E94A0',
    marginTop: 2,
  },
  tipBtn: {
    backgroundColor: '#2A303C',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#373D4B',
    marginRight: 8,
  },
  tipBtnActive: {
    backgroundColor: '#E5A93C',
    borderColor: '#E5A93C',
  },
  tipBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E94A0',
  },
  tipBtnTextActive: {
    color: '#121417',
    fontWeight: '900',
  },
  removeBtn: {
    padding: 6,
  },
  removeText: {
    color: '#8E94A0',
    fontSize: 16,
    fontWeight: '800',
  },
});

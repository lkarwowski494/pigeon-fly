/**
 * PIGEON-FLY — Hub Związkowy & Katalog 100 Protokołów Urzędowych PZHGP/FCI (OfficialProtocolsHubModal)
 * Wdrożenie DEC-RETRO-04: Eliminacja przeładowania ekranu lotów i zapewnienie ergonomii polowej.
 * Szybka wyszukiwarka po numerze Z-xxx, filtracja tematyczna i bezpośrednie uruchamianie modali.
 */

import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FieldButton } from './FieldButton';
import { MODAL_COLORS, modalTheme } from '../theme/modalTheme';

export type ProtocolCategory = 'all' | 'racing' | 'health' | 'breeding' | 'exhibition';

export interface ProtocolRegistryItem {
  id: string; // np. 'Z-100'
  title: string;
  category: 'racing' | 'health' | 'breeding' | 'exhibition';
  description: string;
  badge: string;
  onOpen: () => void;
  testID: string;
}

interface OfficialProtocolsHubModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenNationalExhibition: () => void;
  onOpenAnnualPerformanceLedger: () => void;
  onOpenClockOpeningAudit: () => void;
  onOpenEmergencyCabinRelease: () => void;
  onOpenPreSeasonFlockCensus: () => void;
  onOpenCrateRental: () => void;
  onOpenAntidopingSampling: () => void;
  onOpenStationSanitation: () => void;
  onOpenLoftInspection: () => void;
  onOpenPzhgpCertificate: () => void;
}

export const OfficialProtocolsHubModal: React.FC<OfficialProtocolsHubModalProps> = ({
  visible,
  onClose,
  onOpenNationalExhibition,
  onOpenAnnualPerformanceLedger,
  onOpenClockOpeningAudit,
  onOpenEmergencyCabinRelease,
  onOpenPreSeasonFlockCensus,
  onOpenCrateRental,
  onOpenAntidopingSampling,
  onOpenStationSanitation,
  onOpenLoftInspection,
  onOpenPzhgpCertificate,
}) => {
  const [activeCategory, setActiveCategory] = useState<ProtocolCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const PROTOCOLS: ProtocolRegistryItem[] = useMemo(() => [
    {
      id: 'Z-100',
      title: 'Złota Księga Mistrzów & Roczny Bilans Stada',
      category: 'exhibition',
      badge: '🌟 JUBILEUSZ',
      description: 'Całoroczny bilans 4 filarów stada, klasa medalowa i dyplom A4 ze złotą bordiurą.',
      onOpen: () => { onClose(); onOpenAnnualPerformanceLedger(); },
      testID: 'btn-hub-open-annual-ledger',
    },
    {
      id: 'Z-099',
      title: 'Reprezentacja na Wystawę Ogólnopolską',
      category: 'exhibition',
      badge: '🏆 WYSTAWA',
      description: 'Kwalifikacja Klas Sport (A-H) i ocena 100-pkt Standardu FCI.',
      onOpen: () => { onClose(); onOpenNationalExhibition(); },
      testID: 'btn-hub-open-national-exhibition',
    },
    {
      id: 'Z-098',
      title: 'Komisyjne Otwarcie Zegarów & Audyt ESK',
      category: 'racing',
      badge: '🕰️ ZEGARY',
      description: 'Kontrola odchyłki chodu zegara (norma ±2s), plomby i zgranie lotu.',
      onOpen: () => { onClose(); onOpenClockOpeningAudit(); },
      testID: 'btn-hub-open-clock-audit',
    },
    {
      id: 'Z-096',
      title: 'Awaria Kabiny & Wypuszczenie Awaryjne',
      category: 'racing',
      badge: '🚨 KRYZYS',
      description: 'Procedura ratunkowa zrzutu stada w trasie przy awarii wentylacji.',
      onOpen: () => { onClose(); onOpenEmergencyCabinRelease(); },
      testID: 'btn-hub-open-emergency-release',
    },
    {
      id: 'Z-095',
      title: 'Urzędowy Spis Gołębi PZHGP (50/100)',
      category: 'racing',
      badge: '📋 SPIS',
      description: 'Przedsezonowy spis w 3 egzemplarzach z kontrolą szczepienia PMV-1.',
      onOpen: () => { onClose(); onOpenPreSeasonFlockCensus(); },
      testID: 'btn-hub-open-flock-census',
    },
    {
      id: 'Z-094',
      title: 'E-Rejestr Koszy i Klatek Sekcyjnych',
      category: 'racing',
      badge: '📦 MAGAZYN',
      description: 'Inwentaryzacja klatek transportowych, stan dezynfekcji i kaucje.',
      onOpen: () => { onClose(); onOpenCrateRental(); },
      testID: 'btn-hub-open-crate-rental',
    },
    {
      id: 'Z-093',
      title: 'Protokół Kontroli Antydopingowej FCI',
      category: 'health',
      badge: '💉 ANTYDOPING',
      description: 'Procedura pobrania próbek biologicznych A i B z plombami.',
      onOpen: () => { onClose(); onOpenAntidopingSampling(); },
      testID: 'btn-hub-open-antidoping-sampling',
    },
    {
      id: 'Z-092',
      title: 'Atestacja Sanitarna Punktu Koszowania',
      category: 'health',
      badge: '🛡️ BIOASEKURACJA',
      description: 'Świadectwo odkażania sali, klatek i mat Virkonem S wg wytycznych PIW.',
      onOpen: () => { onClose(); onOpenStationSanitation(); },
      testID: 'btn-hub-open-station-sanitation',
    },
    {
      id: 'Z-087',
      title: 'Protokół Kontroli Gołębnika PZHGP',
      category: 'racing',
      badge: '🕵️ INSPEKCJA',
      description: 'Niezapowiedziana kontrola stanu stada, anten ESK i współrzędnych.',
      onOpen: () => { onClose(); onOpenLoftInspection(); },
      testID: 'btn-hub-open-loft-inspection',
    },
    {
      id: 'Z-086',
      title: 'Certyfikat Przynależności Związkowej',
      category: 'breeding',
      badge: '📜 CERTYFIKAT',
      description: 'Zaświadczenie Oddziału PZHGP dla celów weterynaryjnych i wystawowych.',
      onOpen: () => { onClose(); onOpenPzhgpCertificate(); },
      testID: 'btn-hub-open-pzhgp-cert',
    },
  ], [
    onClose,
    onOpenNationalExhibition,
    onOpenAnnualPerformanceLedger,
    onOpenClockOpeningAudit,
    onOpenEmergencyCabinRelease,
    onOpenPreSeasonFlockCensus,
    onOpenCrateRental,
    onOpenAntidopingSampling,
    onOpenStationSanitation,
    onOpenLoftInspection,
    onOpenPzhgpCertificate,
  ]);

  const filteredProtocols = useMemo(() => {
    return PROTOCOLS.filter((p) => {
      const matchCat = activeCategory === 'all' || p.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        p.id.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [PROTOCOLS, activeCategory, searchQuery]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      testID="modal-official-protocols-hub"
    >
      <SafeAreaView style={modalTheme.safeArea}>
        {/* Header */}
        <View style={modalTheme.header}>
          <View>
            <Text style={modalTheme.headerSubtitle}>KATALOG URZĘDOWY PZHGP & FCI</Text>
            <Text style={modalTheme.headerTitle}>🏛️ Hub Protokołów (100 Modułów)</Text>
          </View>
          <TouchableOpacity
            style={modalTheme.closeButton}
            onPress={onClose}
            testID="btn-close-protocols-hub"
          >
            <Text style={modalTheme.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Szukaj po nazwie lub numerze Z-xxx..."
            placeholderTextColor="#777"
            value={searchQuery}
            onChangeText={setSearchQuery}
            testID="input-search-protocols"
            autoCapitalize="none"
          />
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {[
            { key: 'all', label: 'Wszystkie (10)' },
            { key: 'racing', label: 'Loty & Koszowanie' },
            { key: 'health', label: 'Zdrowie & Bio' },
            { key: 'breeding', label: 'Hodowla' },
            { key: 'exhibition', label: 'Wystawy & Asy' },
          ].map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.filterChip,
                activeCategory === cat.key && styles.filterChipActive,
              ]}
              onPress={() => setActiveCategory(cat.key as ProtocolCategory)}
              testID={`tab-filter-${cat.key}`}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeCategory === cat.key && styles.filterChipTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List of Protocols */}
        <ScrollView style={modalTheme.content} keyboardShouldPersistTaps="handled">
          {filteredProtocols.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.protocolCard}
              onPress={item.onOpen}
              testID={item.testID}
              activeOpacity={0.7}
            >
              <View style={styles.protocolHeader}>
                <View style={styles.badgeRow}>
                  <Text style={styles.protocolId}>{item.id}</Text>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
                <Text style={styles.openArrow}>→</Text>
              </View>
              <Text style={styles.protocolTitle}>{item.title}</Text>
              <Text style={styles.protocolDesc}>{item.description}</Text>
            </TouchableOpacity>
          ))}

          {filteredProtocols.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Nie znaleziono protokołu dla zapytania "{searchQuery}"</Text>
            </View>
          )}

          <View style={modalTheme.bottomActions}>
            <FieldButton
              title="✕ Zamknij Katalog Urzędowy"
              onPress={onClose}
              variant="secondary"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  searchInput: {
    backgroundColor: '#1E2127',
    borderWidth: 1,
    borderColor: '#2F343F',
    borderRadius: 8,
    color: '#F0F2F5',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 48,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  filterChip: {
    backgroundColor: '#1E2127',
    borderWidth: 1,
    borderColor: '#2F343F',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 36,
    justifyContent: 'center',
  },
  filterChipActive: {
    borderColor: '#E5A93C',
    backgroundColor: '#262215',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E94A0',
  },
  filterChipTextActive: {
    color: '#E5A93C',
  },
  protocolCard: {
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 10,
  },
  protocolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  protocolId: {
    fontSize: 12,
    fontWeight: '900',
    color: '#E5A93C',
    fontFamily: 'monospace',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A0A6B2',
  },
  openArrow: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E5A93C',
  },
  protocolTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F0F2F5',
    marginBottom: 4,
  },
  protocolDesc: {
    fontSize: 12,
    color: '#8E94A0',
    lineHeight: 16,
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#777',
    fontStyle: 'italic',
    fontSize: 13,
  },
});

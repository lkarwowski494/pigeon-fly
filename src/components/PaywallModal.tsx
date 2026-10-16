/**
 * Pigeon-Fly — Paywall Modal (Pigeon-Fly Pro Pass)
 * Inspirowany standardem portfolio Apps4Brew ("Cheaper than Espresso" / Rzetelne Rzemiosło).
 *
 * Cennik:
 * - 1,99 EUR / 8,99 PLN miesięcznie
 * - 6,99 EUR / 29,99 PLN rocznie (3 dni gratis) — Najpopularniejszy na sezon lotowy
 * - 19,99 EUR / 89,99 PLN jednorazowo Lifetime — Preferowany przez tradycyjnych mistrzów
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PRICING_TIERS } from '../domain/access';
import { useLang, t } from '../lib/i18n';

export interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPlan: (plan: 'monthly' | 'annual' | 'lifetime') => Promise<void>;
  onRestore: () => Promise<void>;
  currentPigeonsCount?: number;
}

export function PaywallModal({
  visible,
  onClose,
  onSelectPlan,
  onRestore,
  currentPigeonsCount = 0,
}: PaywallModalProps) {
  const lang = useLang();
  const isPl = lang === 'pl';
  const [selectedTier, setSelectedTier] = useState<'monthly' | 'annual' | 'lifetime'>('annual');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async () => {
    setIsProcessing(true);
    try {
      await onSelectPlan(selectedTier);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    setIsProcessing(true);
    try {
      await onRestore();
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const activePricing = PRICING_TIERS[selectedTier];

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('Zamknij')}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.badgeContainer}>
              <Text style={styles.heroBadge}>🕊️ PIGEON-FLY PRO</Text>
            </View>
            <Text style={styles.heroTitle}>
              {isPl ? 'Cyfrowy Notes Mistrza bez Limitów' : 'Master Your Loft Without Limits'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {isPl
                ? 'Zarządzaj nielimitowanym stadem, twórz rodowody PDF A4, transmituj przyloty na żywo i chroń dane w chmurze.'
                : 'Manage unlimited birds, generate PDF pedigrees, stream live arrivals and keep your loft data safe.'}
            </Text>
            {currentPigeonsCount >= 10 && (
              <View style={styles.limitWarning}>
                <Text style={styles.limitWarningText}>
                  {isPl
                    ? `Osiągnięto limit darmowego stada (${currentPigeonsCount}/10 gołębi). Dotychczasowe ptaki są w 100% bezpieczne!`
                    : `Free tier limit reached (${currentPigeonsCount}/10 birds). Your recorded pigeons remain 100% safe!`}
                </Text>
              </View>
            )}
          </View>

          {/* Korzyści PRO */}
          <View style={styles.benefitsList}>
            <BenefitRow
              icon="🕊️"
              title={isPl ? 'Nielimitowane Stado' : 'Unlimited Flock'}
              desc={
                isPl
                  ? 'Zarządzaj setkami gołębi w sekcjach rozpłodu, wdowców i młodych.'
                  : 'Manage hundreds of birds across breeding, widowhood and young sections.'
              }
            />
            <BenefitRow
              icon="📄"
              title={isPl ? 'Generator Rodowodów PDF A4' : 'A4 PDF Pedigree Generator'}
              desc={
                isPl
                  ? 'Drukuj certyfikowane rodowody do 4 pokoleń z pieczęcią hodowli i inbredem Wrighta.'
                  : 'Print certified 4-generation pedigrees with loft seal and Wright inbreeding.'
              }
            />
            <BenefitRow
              icon="📡"
              title={isPl ? 'Transmisja Przylotów Live' : 'Live Race Broadcasting'}
              desc={
                isPl
                  ? 'Udostępniaj przyloty w czasie rzeczywistym dla znajomych z sekcji przez Supabase Realtime.'
                  : 'Stream arrivals in real time to your club friends via Supabase Realtime.'
              }
            />
            <BenefitRow
              icon="🤝"
              title={isPl ? 'Tandem Hodowlany' : 'Breeding Tandem Sync'}
              desc={
                isPl
                  ? 'Współdzielenie gołębnika między wspólnikami (np. ojciec i syn) z rolami RLS.'
                  : 'Share your loft between breeding partners with granular cloud security.'
              }
            />
            <BenefitRow
              icon="🛡️"
              title={isPl ? 'E-Księga PIW & Antydoping FCI' : 'Veterinary PIW & FCI Antidoping'}
              desc={
                isPl
                  ? 'Automatyczne karencje leków, kalendarz weterynaryjny i blokada koszowania.'
                  : 'Automated medication withdrawals, veterinary calendar and basket lock.'
              }
            />
          </View>

          {/* Wybór Planu */}
          <View style={styles.tiersContainer}>
            {(['annual', 'lifetime', 'monthly'] as const).map((tierKey) => {
              const tier = PRICING_TIERS[tierKey];
              const isSelected = selectedTier === tierKey;
              return (
                <TouchableOpacity
                  key={tierKey}
                  style={[styles.tierCard, isSelected && styles.tierCardSelected]}
                  onPress={() => setSelectedTier(tierKey)}
                  accessibilityRole="button"
                >
                  <View style={styles.tierHeaderRow}>
                    <View style={styles.tierTitleCol}>
                      {tier.badgePl && (
                        <Text style={styles.tierBadge}>{isPl ? tier.badgePl : tier.badgeEn}</Text>
                      )}
                      <Text style={styles.tierLabel}>{isPl ? tier.labelPl : tier.labelEn}</Text>
                      <Text style={styles.tierSublabel}>
                        {isPl ? tier.sublabelPl : tier.sublabelEn}
                      </Text>
                    </View>
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Przycisk Zakupu */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handlePurchase}
            disabled={isProcessing}
            accessibilityRole="button"
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.ctaButtonText}>
                {selectedTier === 'annual'
                  ? isPl
                    ? 'Rozpocznij 3 dni za darmo'
                    : 'Start 3-Day Free Trial'
                  : isPl
                  ? `Odblokuj Pigeon-Fly Pro (${isPl ? activePricing.labelPl : activePricing.labelEn})`
                  : `Unlock Pigeon-Fly Pro (${activePricing.labelEn})`}
              </Text>
            )}
          </TouchableOpacity>

          {/* Stopka: Restore & Warunki */}
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={handleRestore} disabled={isProcessing}>
              <Text style={styles.restoreText}>
                {isPl ? 'Przywróć poprzedni zakup' : 'Restore Purchases'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.guaranteeText}>
              {isPl
                ? '100% Offline-First. Twoja historia lotów i gołębi nigdy nie zniknie.'
                : '100% Offline-First. Your flight and bird history is forever safe.'}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function BenefitRow({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <View style={styles.benefitRow}>
      <Text style={styles.benefitIcon}>{icon}</Text>
      <View style={styles.benefitTextCol}>
        <Text style={styles.benefitTitle}>{title}</Text>
        <Text style={styles.benefitDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A', // Ciemny loft slate
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badgeContainer: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 12,
  },
  heroBadge: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  limitWarning: {
    marginTop: 12,
    backgroundColor: '#451A03',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  limitWarningText: {
    color: '#FDE68A',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  benefitsList: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  benefitIcon: {
    fontSize: 24,
  },
  benefitTextCol: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  tiersContainer: {
    gap: 12,
    marginBottom: 24,
  },
  tierCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#334155',
    padding: 16,
  },
  tierCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#1E293B',
  },
  tierHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tierTitleCol: {
    flex: 1,
  },
  tierBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  tierLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  tierSublabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioCircleSelected: {
    borderColor: '#3B82F6',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
  },
  ctaButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minHeight: 56, // Ergofizyka Field Mode
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  footerLinks: {
    alignItems: 'center',
    gap: 8,
  },
  restoreText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  guaranteeText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
  },
});

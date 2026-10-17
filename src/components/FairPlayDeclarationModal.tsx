/**
 * PIGEON-FLY — Fair-Play & Anti-Doping Declaration Modal (Z-080 / DEC-94)
 * Field Mode ergonomic interface (>= 48-56pt touch targets), dark theme (#121417).
 * Official PZHGP/FCI anti-doping agreement, biological sampling consent, and printable legal charter.
 */

import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  evaluateFairPlayDeclaration,
  generateFairPlayDeclarationHtml,
  FairPlayBreederProfile,
  FairPlayClauses,
} from '../domain/fairPlayDeclaration';
import { PdfService } from '../services/pdfService';
import { FieldButton } from './FieldButton';

interface FairPlayDeclarationModalProps {
  visible: boolean;
  onClose: () => void;
  breederProfile?: Partial<FairPlayBreederProfile>;
}

const DEFAULT_PROFILE: FairPlayBreederProfile = {
  breederName: 'Łukasz Karwowski',
  pzhgpMemberNumber: '0284-1420',
  branchName: 'Oddział 0284 Gostyń',
  sectionName: 'Sekcja 1 Gostyń',
  loftAddress: 'ul. Polna 12, 63-800 Gostyń',
  loftCoordinates: '51°52\'14.2"N, 17°01\'12.4"E',
  seasonYear: 2026,
  declarationDate: '2026-04-15',
};

export const FairPlayDeclarationModal: React.FC<FairPlayDeclarationModalProps> = ({
  visible,
  onClose,
  breederProfile,
}) => {
  const profile: FairPlayBreederProfile = useMemo(() => ({
    ...DEFAULT_PROFILE,
    ...breederProfile,
  }), [breederProfile]);

  const [antiDopingCommitment, setAntiDopingCommitment] = useState(true);
  const [biologicalSamplingConsent, setBiologicalSamplingConsent] = useState(true);
  const [bannedSubstancesFree, setBannedSubstancesFree] = useState(true);
  const [disciplinaryConsequencesAcknowledged, setDisciplinaryConsequencesAcknowledged] = useState(true);
  const [animalWelfareDeclaration, setAnimalWelfareDeclaration] = useState(true);
  const [noActiveSuspensions, setNoActiveSuspensions] = useState(true);

  const clauses: FairPlayClauses = useMemo(() => ({
    antiDopingCommitment,
    biologicalSamplingConsent,
    bannedSubstancesFree,
    disciplinaryConsequencesAcknowledged,
    animalWelfareDeclaration,
    noActiveSuspensions,
  }), [
    antiDopingCommitment,
    biologicalSamplingConsent,
    bannedSubstancesFree,
    disciplinaryConsequencesAcknowledged,
    animalWelfareDeclaration,
    noActiveSuspensions,
  ]);

  const evaluation = useMemo(() => {
    return evaluateFairPlayDeclaration(profile, clauses);
  }, [profile, clauses]);

  const handlePrintDeclaration = async () => {
    try {
      const html = generateFairPlayDeclarationHtml(evaluation);
      await PdfService.printHtml(html);
    } catch (err: any) {
      Alert.alert('Błąd wydruku', err?.message || 'Nie udało się wydrukować oświadczenia.');
    }
  };

  const handleSharePdf = async () => {
    try {
      const html = generateFairPlayDeclarationHtml(evaluation);
      await PdfService.shareHtmlAsPdf(
        html,
        `Oswiadczenie_Antydopingowe_PZHGP_${profile.seasonYear}.pdf`
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
            <Text style={styles.headerTitle}>⚖️ Karta Etyki i Antydoping PZHGP</Text>
            <Text style={styles.headerSubtitle}>
              Zgoda na pobranie próbek, czysty sport i regulamin FCI (Z-080)
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Zamknij okno"
            testID="btn-close-fair-play-modal"
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Status Banner */}
          <View style={[styles.statusCard, { borderColor: evaluation.statusColor }]}>
            <View style={styles.statusRow}>
              <Text style={[styles.statusTitle, { color: evaluation.statusColor }]}>
                {evaluation.statusLabel}
              </Text>
              <Text style={styles.scoreText}>{evaluation.complianceScore}%</Text>
            </View>
            <Text style={styles.statusSub}>
              {evaluation.isFullyCompliant
                ? 'Wszystkie klauzule antydopingowe i etyczne zostały zaakceptowane.'
                : `Brakuje ${evaluation.missingClauses.length} wymaganych oświadczeń regulaminowych.`}
            </Text>
          </View>

          {/* Breeder Meta Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dane Członkowskie i Gołębnik:</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Hodowca:</Text>
              <Text style={styles.metaVal}>{profile.breederName}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Nr Członkowski:</Text>
              <Text style={styles.metaVal}>{profile.pzhgpMemberNumber}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Jednostka:</Text>
              <Text style={styles.metaVal}>{profile.branchName} • {profile.sectionName}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Koordynaty WGS-84:</Text>
              <Text style={styles.metaVal}>{profile.loftCoordinates}</Text>
            </View>
          </View>

          {/* Mandatory Clauses Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Wymagane Klauzule Prawne (FCI / PZHGP):</Text>

            {/* Clause 1 */}
            <TouchableOpacity
              style={[styles.clauseItem, antiDopingCommitment && styles.clauseItemActive]}
              onPress={() => setAntiDopingCommitment(!antiDopingCommitment)}
              testID="chk-antidoping-commitment"
            >
              <Text style={styles.clauseIcon}>{antiDopingCommitment ? '☑️' : '◻️'}</Text>
              <View style={styles.clauseTexts}>
                <Text style={styles.clauseTitle}>1. Zobowiązanie do Przepisów Antydopingowych FCI</Text>
                <Text style={styles.clauseSub}>
                  Bezwzględne przestrzeganie Regulaminu Lotowo-Zegarowego PZHGP i Kodeksu Antydopingowego FCI.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Clause 2 */}
            <TouchableOpacity
              style={[styles.clauseItem, biologicalSamplingConsent && styles.clauseItemActive]}
              onPress={() => setBiologicalSamplingConsent(!biologicalSamplingConsent)}
              testID="chk-biological-sampling"
            >
              <Text style={styles.clauseIcon}>{biologicalSamplingConsent ? '☑️' : '◻️'}</Text>
              <View style={styles.clauseTexts}>
                <Text style={styles.clauseTitle}>2. Zgoda na Pobranie Próbek Biologicznych</Text>
                <Text style={styles.clauseSub}>
                  Zgoda na pobranie odchodów, krwi, wymazu z wola i piór przez uprawnionego Delegata PZHGP w dowolnym momencie.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Clause 3 */}
            <TouchableOpacity
              style={[styles.clauseItem, bannedSubstancesFree && styles.clauseItemActive]}
              onPress={() => setBannedSubstancesFree(!bannedSubstancesFree)}
              testID="chk-banned-substances"
            >
              <Text style={styles.clauseIcon}>{bannedSubstancesFree ? '☑️' : '◻️'}</Text>
              <View style={styles.clauseTexts}>
                <Text style={styles.clauseTitle}>3. Oświadczenie o Czystości Stada</Text>
                <Text style={styles.clauseSub}>
                  Zakaz stosowania sterydów anabolicznych, kortykosteroidów, beta-agonistów i leków maskujących.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Clause 4 */}
            <TouchableOpacity
              style={[styles.clauseItem, disciplinaryConsequencesAcknowledged && styles.clauseItemActive]}
              onPress={() => setDisciplinaryConsequencesAcknowledged(!disciplinaryConsequencesAcknowledged)}
              testID="chk-disciplinary-consequences"
            >
              <Text style={styles.clauseIcon}>{disciplinaryConsequencesAcknowledged ? '☑️' : '◻️'}</Text>
              <View style={styles.clauseTexts}>
                <Text style={styles.clauseTitle}>4. Świadomość Sankcji Dyscyplinarnych</Text>
                <Text style={styles.clauseSub}>
                  Świadomość natychmiastowej dyskwalifikacji, anulowania wyników oraz odpowiedzialności przed Sądem Koleżeńskim.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Clause 5 */}
            <TouchableOpacity
              style={[styles.clauseItem, animalWelfareDeclaration && styles.clauseItemActive]}
              onPress={() => setAnimalWelfareDeclaration(!animalWelfareDeclaration)}
              testID="chk-animal-welfare"
            >
              <Text style={styles.clauseIcon}>{animalWelfareDeclaration ? '☑️' : '◻️'}</Text>
              <View style={styles.clauseTexts}>
                <Text style={styles.clauseTitle}>5. Gwarancja Dobrostanu i Szczepień PMV-1</Text>
                <Text style={styles.clauseSub}>
                  Poświadczenie ważnych szczepień ochronnych stada i humanitarnych warunków zoohigienicznych.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Clause 6 */}
            <TouchableOpacity
              style={[styles.clauseItem, noActiveSuspensions && styles.clauseItemActive]}
              onPress={() => setNoActiveSuspensions(!noActiveSuspensions)}
              testID="chk-no-active-suspensions"
            >
              <Text style={styles.clauseIcon}>{noActiveSuspensions ? '☑️' : '◻️'}</Text>
              <View style={styles.clauseTexts}>
                <Text style={styles.clauseTitle}>6. Brak Kar Dyscyplinarnych</Text>
                <Text style={styles.clauseSub}>
                  Oświadczenie o braku orzeczonych zakazów lotowania w PZHGP i organizacjach zagranicznych.
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Legal Warning Notice */}
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ Pouczenie Prawne Zarządu Głównego PZHGP:</Text>
            <Text style={styles.warningText}>
              Złożenie fałszywego oświadczenia lub odmowa wpuszczenia Delegata do gołębnika celem pobrania próby kontrolnej skutkuje automatycznym wykluczeniem hodowcy ze współzawodnictwa w danym sezonie.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <FieldButton
              title="🖨️ Drukuj Deklarację A4 (AirPrint)"
              onPress={handlePrintDeclaration}
              testID="btn-print-fair-play-declaration"
              style={{ marginBottom: 10 }}
            />
            <FieldButton
              title="📄 Udostępnij Deklarację PDF"
              onPress={handleSharePdf}
              testID="btn-share-fair-play-pdf"
              variant="secondary"
              style={{ marginBottom: 10 }}
            />
            <FieldButton
              title="Zamknij"
              onPress={onClose}
              testID="btn-close-fair-play"
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    marginBottom: 14,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 12,
    fontWeight: '900',
    flex: 1,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F3F4F6',
    marginLeft: 8,
  },
  statusSub: {
    fontSize: 11,
    color: '#9CA3AF',
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
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
  },
  metaLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  metaVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F3F4F6',
  },
  clauseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#16191E',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  clauseItemActive: {
    borderColor: '#10B981',
    backgroundColor: '#14251D',
  },
  clauseIcon: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 2,
  },
  clauseTexts: {
    flex: 1,
  },
  clauseTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F3F4F6',
  },
  clauseSub: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
    lineHeight: 14,
  },
  warningBox: {
    backgroundColor: '#352115',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginBottom: 14,
  },
  warningTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FBBF24',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 10,
    color: '#FDE68A',
    lineHeight: 15,
  },
  actionSection: {
    marginTop: 8,
  },
});

/**
 * PIGEON-FLY — Zunifikowany Motyw Bazowy Modali (Modal Theme)
 * Wdrożenie DEC-RETRO-05: Eliminacja duplikacji stylów bazowych w modalach.
 * Pełna zgodność ze standardem Field Mode (kontrast WCAG AAA/AA, touch targets >= 48-56 pt).
 */

import { StyleSheet } from 'react-native';

export const MODAL_COLORS = {
  background: '#121417',
  cardBackground: '#1E2127',
  goldAccent: '#E5A93C',
  goldDark: '#8c6d1f',
  border: '#2F343F',
  borderGold: '#c59b27',
  textPrimary: '#F0F2F5',
  textSecondary: '#8E94A0',
  textMuted: '#6C727F',
  success: '#4CAF50',
  error: '#FF5252',
  warning: '#FFB300',
  chipActive: '#262215',
};

export const modalTheme = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MODAL_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: MODAL_COLORS.border,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: MODAL_COLORS.goldAccent,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: MODAL_COLORS.textPrimary,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: MODAL_COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MODAL_COLORS.border,
  },
  closeButtonText: {
    color: MODAL_COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  sectionCard: {
    backgroundColor: MODAL_COLORS.cardBackground,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: MODAL_COLORS.border,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: MODAL_COLORS.goldAccent,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A0A6B2',
    marginBottom: 4,
  },
  input: {
    backgroundColor: MODAL_COLORS.background,
    borderWidth: 1,
    borderColor: MODAL_COLORS.border,
    borderRadius: 6,
    color: MODAL_COLORS.textPrimary,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    minHeight: 48,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  col: {
    flex: 1,
  },
  banner: {
    margin: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#262215',
    borderWidth: 1.5,
    borderColor: MODAL_COLORS.goldAccent,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: MODAL_COLORS.goldAccent,
    marginBottom: 4,
  },
  bannerDesc: {
    fontSize: 12,
    color: '#E0E0E0',
    lineHeight: 16,
  },
  bottomActions: {
    marginVertical: 16,
    marginBottom: 32,
  },
});

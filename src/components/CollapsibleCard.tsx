/**
 * PIGEON-FLY — Zwijana Karta Inline P16 (Collapsible Card)
 * Wzorzec BPR P16 („Jedna Otwarta”) eliminujący paraliż modalny (79 modali).
 * 
 * Zapewnia:
 * - Dostęp polowy z zachowaniem kontekstu ekranu głównego (bez popupów)
 * - Minimalną wysokość nagłówka 52pt (obsługa w rękawicach roboczych)
 * - Wyraźny kontrast i wskaźnik stanu rozwinięcia (▼ / ▲)
 * - Dotykową haptykę przy przełączaniu
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';

export interface CollapsibleCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  subtitle,
  badge,
  badgeColor = '#2563EB',
  isOpen,
  onToggle,
  children,
  style,
  testID,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onToggle();
  };

  return (
    <View style={[styles.container, isOpen && styles.containerOpen, style]} testID={testID}>
      <TouchableOpacity
        style={styles.header}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>{title}</Text>
            {badge ? (
              <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ) : null}
          </View>
          {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
        </View>

        <View style={styles.indicatorContainer}>
          <Text style={styles.indicatorText}>{isOpen ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {isOpen ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 12,
    overflow: 'hidden',
  },
  containerOpen: {
    borderColor: '#3B82F6',
  },
  header: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#252932',
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  subtitleText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 3,
  },
  indicatorContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E2127',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  body: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2F343F',
    backgroundColor: '#16191E',
  },
});

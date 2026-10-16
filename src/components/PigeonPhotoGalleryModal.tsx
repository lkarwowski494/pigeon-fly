/**
 * PIGEON-FLY — PigeonPhotoGalleryModal (BR-STADO-006)
 * High-definition multi-angle gallery: Sylwetka, Oko Makro (Eye-Sign), and Rozpostarte Skrzydło.
 * Camera / URL attachment with master fancier evaluation tips.
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pigeon } from '../domain/types';
import { FieldButton } from './FieldButton';

export interface PigeonPhotoGalleryModalProps {
  visible: boolean;
  pigeon: Pigeon | null;
  onClose: () => void;
  onSavePhotos?: (photos: {
    photoUrl?: string;
    eyePhotoUrl?: string;
    wingPhotoUrl?: string;
  }) => void;
}

type PhotoSlot = 'body' | 'eye' | 'wing';

const SAMPLE_DEMO_PHOTOS: Record<PhotoSlot, string> = {
  body: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop&q=80',
  eye: 'https://images.unsplash.com/photo-1579273166152-d725a4e2b755?w=800&auto=format&fit=crop&q=80',
  wing: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=800&auto=format&fit=crop&q=80',
};

export function PigeonPhotoGalleryModal({
  visible,
  pigeon,
  onClose,
  onSavePhotos,
}: PigeonPhotoGalleryModalProps) {
  if (!pigeon) return null;

  const [activeSlot, setActiveSlot] = useState<PhotoSlot>('body');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(pigeon.photoUrl);
  const [eyePhotoUrl, setEyePhotoUrl] = useState<string | undefined>(pigeon.eyePhotoUrl);
  const [wingPhotoUrl, setWingPhotoUrl] = useState<string | undefined>(pigeon.wingPhotoUrl);

  const getActivePhotoUri = () => {
    switch (activeSlot) {
      case 'body':
        return photoUrl;
      case 'eye':
        return eyePhotoUrl;
      case 'wing':
        return wingPhotoUrl;
    }
  };

  const setActivePhotoUri = (uri: string | undefined) => {
    switch (activeSlot) {
      case 'body':
        setPhotoUrl(uri);
        break;
      case 'eye':
        setEyePhotoUrl(uri);
        break;
      case 'wing':
        setWingPhotoUrl(uri);
        break;
    }
  };

  const handleAttachDemoPhoto = () => {
    const demoUri = SAMPLE_DEMO_PHOTOS[activeSlot];
    setActivePhotoUri(demoUri);
    Alert.alert('Załączono fotografię', 'Zdjęcie wzorcowe zostało przypisane do karty gołębia.');
  };

  const handleClearPhoto = () => {
    setActivePhotoUri(undefined);
  };

  const handleSave = () => {
    if (onSavePhotos) {
      onSavePhotos({
        photoUrl,
        eyePhotoUrl,
        wingPhotoUrl,
      });
    }
    Alert.alert('Zapisano galerię!', 'Fotografie zostały zaktualizowane w notesie stada.');
    onClose();
  };

  const activePhotoUri = getActivePhotoUri();

  const slotMetadata: Record<
    PhotoSlot,
    { title: string; subtitle: string; tip: string; icon: string }
  > = {
    body: {
      title: 'Sylwetka (Pokrój)',
      subtitle: 'Profil ptaka stojącego w spoczynku',
      tip: 'Fotografować z poziomu oczu ptaka. Sylwetka powinna ukazywać linię grzbietu, ułożenie skrzydeł oraz spięcie pojedynczego pióra w ogonie.',
      icon: '📸',
    },
    eye: {
      title: 'Znak Oka (Eye-Sign Makro)',
      subtitle: 'Zbliżenie tęczówki, źrenicy i pierścienia adaptacyjnego',
      tip: 'Fotografować w bezpośrednim słońcu bez lampy błyskowej pod kątem 45°. Umożliwia ocenę pierścienia korelacji i ziarnistości tęczówki.',
      icon: '👁️',
    },
    wing: {
      title: 'Rozpostarte Skrzydło',
      subtitle: 'Układ 10 lotek I rzędu i wentylacja',
      tip: 'Rozłożyć skrzydło na jednolitym ciemnym tle. Sprawdzić proporcje ostatnich 4 lotek (7-10), wygięcie końcówek oraz szczeliny aerodynamiczne.',
      icon: '🪶',
    },
  };

  const currentMeta = slotMetadata[activeSlot];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>GALERIA MAKRO PTATA</Text>
                <Text style={styles.ringText}>{pigeon.ringNumber}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="btn-close-gallery">
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Slot Switcher Tabs */}
            <View style={styles.slotTabsRow}>
              {(['body', 'eye', 'wing'] as PhotoSlot[]).map((slot) => {
                const isActive = activeSlot === slot;
                const meta = slotMetadata[slot];
                const hasPhoto =
                  slot === 'body' ? !!photoUrl : slot === 'eye' ? !!eyePhotoUrl : !!wingPhotoUrl;

                return (
                  <TouchableOpacity
                    key={slot}
                    onPress={() => setActiveSlot(slot)}
                    style={[styles.slotTab, isActive && styles.slotTabActive]}
                    testID={`tab-photo-${slot}`}
                  >
                    <Text style={styles.slotTabIcon}>{meta.icon}</Text>
                    <Text style={[styles.slotTabText, isActive && styles.slotTabTextActive]}>
                      {slot === 'body' ? 'Sylwetka' : slot === 'eye' ? 'Oko Makro' : 'Skrzydło'}
                    </Text>
                    {hasPhoto && <View style={styles.hasPhotoDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Photo Card Display */}
            <View style={styles.photoContainer}>
              {activePhotoUri ? (
                <View style={styles.imageWrapper}>
                  <Image
                    source={{ uri: activePhotoUri }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <View style={styles.imageOverlayTag}>
                    <Text style={styles.imageOverlayText}>
                      {currentMeta.icon} {currentMeta.title.toUpperCase()}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyPlaceholder}>
                  <Text style={styles.placeholderIcon}>{currentMeta.icon}</Text>
                  <Text style={styles.placeholderTitle}>Brak fotografii: {currentMeta.title}</Text>
                  <Text style={styles.placeholderSubtitle}>{currentMeta.subtitle}</Text>
                </View>
              )}

              {/* Action buttons for current photo */}
              <View style={styles.photoActionsRow}>
                <FieldButton
                  title={activePhotoUri ? '🔄 Zmień zdjęcie' : '📷 Załącz zdjęcie'}
                  onPress={handleAttachDemoPhoto}
                  variant="primary"
                  style={{ flex: 1 }}
                  testID="btn-attach-photo"
                />
                {activePhotoUri && (
                  <FieldButton
                    title="Usuń"
                    onPress={handleClearPhoto}
                    variant="danger"
                    style={{ marginLeft: 8, minWidth: 80 }}
                    testID="btn-remove-photo"
                  />
                )}
              </View>
            </View>

            {/* Fancier Tips Box */}
            <View style={styles.tipCard}>
              <Text style={styles.tipTitle}>💡 WSKAZÓWKA MISTRZA HODOWLI</Text>
              <Text style={styles.tipText}>{currentMeta.tip}</Text>
            </View>

            {/* Footer Save Button */}
            <FieldButton
              title="Zapisz Zmiany w Galerii"
              onPress={handleSave}
              variant="primary"
              style={styles.saveBtn}
              testID="btn-save-gallery"
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
    backgroundColor: '#1E2127',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '94%',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 1,
  },
  ringText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'monospace',
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
  slotTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  slotTab: {
    flex: 1,
    backgroundColor: '#15171C',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2F343F',
    alignItems: 'center',
    position: 'relative',
  },
  slotTabActive: {
    borderColor: '#E5A93C',
    backgroundColor: '#2A2417',
  },
  slotTabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  slotTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E94A0',
  },
  slotTabTextActive: {
    color: '#E5A93C',
    fontWeight: '800',
  },
  hasPhotoDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  photoContainer: {
    backgroundColor: '#15171C',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    overflow: 'hidden',
    padding: 12,
    marginBottom: 14,
  },
  imageWrapper: {
    width: '100%',
    height: 240,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imageOverlayTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  imageOverlayText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E5A93C',
  },
  emptyPlaceholder: {
    height: 220,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2F343F',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  placeholderIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D4D8E0',
    marginBottom: 4,
  },
  placeholderSubtitle: {
    fontSize: 12,
    color: '#8E94A0',
    textAlign: 'center',
  },
  photoActionsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  tipCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
    padding: 14,
    marginBottom: 16,
  },
  tipTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64B5F6',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  tipText: {
    fontSize: 12,
    color: '#A0A6B2',
    lineHeight: 18,
  },
  saveBtn: {
    minHeight: 48,
  },
});

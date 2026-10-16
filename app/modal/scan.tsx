/**
 * PIGEON-FLY — Skaner QR w Gołębniku (Modal)
 * High-speed camera scanner for micro-stickers on pigeon rings.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { parseQRPayload } from '../../src/domain/qr';
import { FieldButton } from '../../src/components/FieldButton';

export default function QRScannerModal() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedResult, setScannedResult] = useState<string | null>(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionBox}>
          <Text style={styles.permissionTitle}>Dostęp do Aparatu</Text>
          <Text style={styles.permissionDesc}>
            Aparat jest niezbędny do skanowania mikronaklejek QR na obrączkach ptaków wchodzących do gołębnika.
          </Text>
          <FieldButton
            title="Zezwól na Dostęp do Aparatu"
            onPress={() => {
              requestPermission();
            }}
            style={{ width: '100%', marginTop: 16 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scannedResult) return; // Prevent multiple scans

    setScannedResult(data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    const parsed = parseQRPayload(data);
    if (parsed.isValid) {
      const ringText = parsed.ringNumber ? ` (${parsed.ringNumber})` : '';
      const now = new Date();
      Alert.alert(
        'Odbito Gołębia w Lufce! 🕊️',
        `Zeskanowano kod ptaka${ringText}.\nCzas przylotu: ${now.toLocaleTimeString('pl-PL')}\nID weryfikacji: ${parsed.qrCodeUuid.slice(0, 16)}...`,
        [
          {
            text: 'Zapisz Przylot w Locie',
            onPress: () => router.back(),
          },
          {
            text: 'Skanuj kolejnego ptaka',
            onPress: () => setScannedResult(null),
          },
        ]
      );
    } else {
      Alert.alert('Nierozpoznany kod', `Kod nie należy do systemu Pigeon-Fly:\n${data}`, [
        { text: 'OK', onPress: () => setScannedResult(null) },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scannedResult ? undefined : handleBarcodeScanned}
      />

      {/* Target Reticle Overlay */}
      <View style={styles.overlay}>
        <View style={styles.reticle}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
        <Text style={styles.hintText}>Skieruj aparat na mikronaklejkę QR na obrączce</Text>
      </View>

      {/* Bottom Dismiss Button */}
      <SafeAreaView style={styles.bottomBar}>
        <FieldButton
          title="Zamknij Skaner"
          variant="secondary"
          onPress={() => router.back()}
          style={styles.closeBtn}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  permissionDesc: {
    fontSize: 15,
    color: '#A0A6B2',
    textAlign: 'center',
    lineHeight: 22,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticle: {
    width: 250,
    height: 250,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#E5A93C',
  },
  tl: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  tr: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bl: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  br: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  hintText: {
    marginTop: 24,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    backgroundColor: 'rgba(18, 20, 23, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },
  closeBtn: {
    backgroundColor: '#1E2127',
  },
});

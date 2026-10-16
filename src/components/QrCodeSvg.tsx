/**
 * Pigeon-Fly — Wektorowy Komponent Kodu QR SVG (Offline Vector QR Code)
 * Generuje ostry, bezstratny kod QR w wektorach SVG bezpośrednio z modułów qrcode.
 * Działa w 100% offline w gołębniku bez dostępu do internetu.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import QRCode from 'qrcode';

export interface QrCodeSvgProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  testID?: string;
}

export function generateQrMatrix(
  value: string,
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M'
): { size: number; modules: boolean[][] } {
  const qr = QRCode.create(value || 'pigeonfly://empty', { errorCorrectionLevel });
  const size = qr.modules.size;
  const matrix: boolean[][] = [];

  for (let r = 0; r < size; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c++) {
      row.push(Boolean(qr.modules.get(r, c)));
    }
    matrix.push(row);
  }

  return { size, modules: matrix };
}

export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  value,
  size = 200,
  color = '#000000',
  backgroundColor = '#FFFFFF',
  testID,
}) => {
  const { pathData, moduleCount } = useMemo(() => {
    try {
      const qr = QRCode.create(value || 'pigeonfly://empty', { errorCorrectionLevel: 'M' });
      const count = qr.modules.size;
      let d = '';

      for (let row = 0; row < count; row++) {
        for (let col = 0; col < count; col++) {
          if (qr.modules.get(row, col)) {
            d += `M${col},${row}h1v1h-1z `;
          }
        }
      }

      return { pathData: d, moduleCount: count };
    } catch {
      return { pathData: '', moduleCount: 21 };
    }
  }, [value]);

  if (!pathData) {
    return null;
  }

  return (
    <View style={[styles.container, { width: size, height: size }]} testID={testID}>
      <Svg width={size} height={size} viewBox={`0 0 ${moduleCount} ${moduleCount}`}>
        <Rect width={moduleCount} height={moduleCount} fill={backgroundColor} />
        <Path d={pathData} fill={color} />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * PIGEON-FLY — CSV Service (Sharing and Storage)
 * Exports CSV files directly to cache/document storage and triggers native iOS/Android sharing.
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export class CsvService {
  /**
   * Saves CSV content to a temporary local file and launches native share sheet.
   */
  static async shareCsv(
    filename: string,
    csvContent: string,
    dialogTitle = 'Udostępnij plik CSV'
  ): Promise<string> {
    const cleanFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    const targetUri = `${FileSystem.cacheDirectory || ''}${cleanFilename}`;

    await FileSystem.writeAsStringAsync(targetUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(targetUri, {
        mimeType: 'text/csv',
        UTI: 'public.comma-separated-values-text',
        dialogTitle,
      });
    }

    return targetUri;
  }
}

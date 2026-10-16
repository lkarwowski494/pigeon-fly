/**
 * PIGEON-FLY — Usługa Eksportu i Druku Dokumentów PDF (PDF Service)
 * Zgodność ze standardem offline-first i ergonomicznym trybem Field Mode:
 * - Generowanie i bezpośredni wydruk A4 (expo-print)
 * - Eksport do pliku PDF i udostępnianie (expo-sharing / AirDrop / Pliki / Drukarka)
 * - Obsługiwane dokumenty:
 *   1. 4-pokoleniowy Rodowód z kodem QR anty-fałszerstwa
 *   2. Oficjalna Lista Wkładaniowa do Kosza (FCI / PZHGP)
 *   3. E-Książka Leczenia Zwierząt i Zabiegów Weterynaryjnych (PIW)
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  generatePedigreeHtml,
  generateRaceBasketingListHtml,
  generateVeterinaryTreatmentBookHtml,
  generateQrStickerSheetHtml,
  generateNestBoxCardsHtml,
  PedigreePdfOptions,
  BasketingListPdfOptions,
  TreatmentRecordItem,
  StickerSheetOptions,
  NestBoxCardsPdfOptions,
} from '../domain/pdfExport';
import { PedigreeNode } from '../domain/types';

export class PdfService {
  /**
   * Drukuje dokument HTML bezpośrednio przez systemowe okno drukowania
   */
  static async printHtml(html: string): Promise<void> {
    await Print.printAsync({ html });
  }

  /**
   * Zapisuje dokument HTML jako plik PDF i otwiera natywny arkusz udostępniania
   */
  static async shareHtmlAsPdf(
    html: string,
    dialogTitle = 'Udostępnij dokument PDF'
  ): Promise<string> {
    const { uri } = await Print.printToFileAsync({ html });
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle,
      });
    }
    return uri;
  }

  /**
   * Generuje i drukuje lub udostępnia 4-pokoleniowy rodowód ptaka
   */
  static async exportPedigree(
    root: PedigreeNode,
    options: PedigreePdfOptions,
    mode: 'print' | 'share' = 'print'
  ): Promise<string | void> {
    const html = generatePedigreeHtml(root, options);
    if (mode === 'print') {
      await this.printHtml(html);
      return;
    }
    return await this.shareHtmlAsPdf(
      html,
      `Rodowód ${root.pigeon.countryCode}-${root.pigeon.ringNumber}`
    );
  }

  /**
   * Generuje i drukuje lub udostępnia oficjalną listę wkładaniową (kosz)
   */
  static async exportBasketingList(
    options: BasketingListPdfOptions,
    mode: 'print' | 'share' = 'print'
  ): Promise<string | void> {
    const html = generateRaceBasketingListHtml(options);
    if (mode === 'print') {
      await this.printHtml(html);
      return;
    }
    return await this.shareHtmlAsPdf(
      html,
      `Lista wkładaniowa — ${options.raceName}`
    );
  }

  /**
   * Generuje i drukuje lub udostępnia urzędową E-Książkę Leczenia Zwierząt PIW
   */
  static async exportVeterinaryTreatmentBook(
    options: {
      loftName: string;
      breederName: string;
      veterinarianName?: string;
      records: TreatmentRecordItem[];
    },
    mode: 'print' | 'share' = 'print'
  ): Promise<string | void> {
    const html = generateVeterinaryTreatmentBookHtml(options);
    if (mode === 'print') {
      await this.printHtml(html);
      return;
    }
    return await this.shareHtmlAsPdf(
      html,
      `E-Księga Leczenia Zwierząt — ${options.loftName}`
    );
  }

  /**
   * Generuje i drukuje lub udostępnia arkusz mikronaklejek QR A4 na obrączki rodowe
   */
  static async exportQrStickerSheet(
    options: StickerSheetOptions,
    mode: 'print' | 'share' = 'print'
  ): Promise<string | void> {
    const html = generateQrStickerSheetHtml(options);
    if (mode === 'print') {
      await this.printHtml(html);
      return;
    }
    return await this.shareHtmlAsPdf(
      html,
      `Arkusz mikronaklejek QR — ${options.loftName}`
    );
  }

  /**
   * Generuje i drukuje lub udostępnia karty frontu cel lęgowych A4 (Z-270)
   */
  static async exportNestBoxCards(
    options: NestBoxCardsPdfOptions,
    mode: 'print' | 'share' = 'print'
  ): Promise<string | void> {
    const html = generateNestBoxCardsHtml(options);
    if (mode === 'print') {
      await this.printHtml(html);
      return;
    }
    return await this.shareHtmlAsPdf(
      html,
      `Karty Cel Lęgowych — ${options.loftName}`
    );
  }
}


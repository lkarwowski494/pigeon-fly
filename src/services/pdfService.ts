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
  generateConcourseSheetHtml,
  generateYpdsEmergencyReportHtml,
  generateVaccinationCertificateHtml,
  PedigreePdfOptions,
  BasketingListPdfOptions,
  TreatmentRecordItem,
  StickerSheetOptions,
  NestBoxCardsPdfOptions,
  ConcourseSheetPdfOptions,
  YpdsEmergencyReportPdfOptions,
  VaccinationCertificatePdfOptions,
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

  /**
   * Generuje i drukuje lub udostępnia oficjalną listę konkursową PZHGP / FCI (A4)
   */
  static async exportConcourseSheet(
    options: ConcourseSheetPdfOptions,
    mode: 'print' | 'share' = 'print'
  ): Promise<string | void> {
    const html = generateConcourseSheetHtml(options);
    if (mode === 'print') {
      await this.printHtml(html);
      return;
    }
    return await this.shareHtmlAsPdf(
      html,
      `Lista Konkursowa — ${options.raceName}`
    );
  }

  /**
   * Generuje i drukuje lub udostępnia Kliniczny Protokół Triage YPDS (Z-305, RD-27)
   */
  static async exportYpdsReport(
    options: YpdsEmergencyReportPdfOptions,
    mode: 'print' | 'share' = 'print'
  ): Promise<string | void> {
    const html = generateYpdsEmergencyReportHtml(options);
    if (mode === 'print') {
      await this.printHtml(html);
      return;
    }
    return await this.shareHtmlAsPdf(
      html,
      `Protokół Triage YPDS — ${options.pigeonRingNumber}`
    );
  }

  /**
   * Generuje i drukuje lub udostępnia Urzędowe Zaświadczenie Szczepienia Stada (Z-307, PZHGP / PIW)
   */
  static async exportVaccinationCertificate(
    options: VaccinationCertificatePdfOptions,
    mode: 'print' | 'share' = 'print'
  ): Promise<string | void> {
    const html = generateVaccinationCertificateHtml(options);
    if (mode === 'print') {
      await this.printHtml(html);
      return;
    }
    return await this.shareHtmlAsPdf(
      html,
      `Zaświadczenie Szczepienia PMV-1 — ${options.certificateNumber}`
    );
  }

  /**
   * Generuje i drukuje lub udostępnia Kartę Oceny Sędziowskiej FCI Standard (Z-054)
   */
  static async exportFciStandardShowCard(
    input: any,
    result: any,
    mode: 'print' | 'share' = 'print'
  ): Promise<string | void> {
    const { generateFciShowCardHtml } = await import('../domain/fciStandardAppraisal');
    const html = generateFciShowCardHtml(input, result);
    if (mode === 'print') {
      await this.printHtml(html);
      return;
    }
    return await this.shareHtmlAsPdf(
      html,
      `Karta Oceny FCI Standard — ${input.ringNumber}`
    );
  }

  /**
   * Generuje i drukuje lub udostępnia Oficjalną Listę Startowo-Zegarową PZHGP (Z-057)
   */
  static async exportBasketingClockingList(
    protocol: any,
    mode: 'print' | 'share' = 'print'
  ): Promise<string | void> {
    const { generateBasketingProtocolHtml } = await import('../domain/basketingProtocol');
    const html = generateBasketingProtocolHtml(protocol);
    if (mode === 'print') {
      await this.printHtml(html);
      return;
    }
    return await this.shareHtmlAsPdf(
      html,
      `Lista Startowo-Zegarowa PZHGP — Lot ${protocol.raceNumber} ${protocol.raceName}`
    );
  }

  /**
   * Generuje i drukuje lub udostępnia Urzędowy Protokół Bioasekuracji i Inspekcji Sanitarnej PIW (Z-062)
   */
  static async exportBiosecurityReport(
    data: any,
    mode: 'print' | 'share' = 'print'
  ): Promise<string | void> {
    const { generateBiosecurityReportHtml } = await import('../domain/biosecurityProtocol');
    const html = generateBiosecurityReportHtml(data);
    if (mode === 'print') {
      await this.printHtml(html);
      return;
    }
    return await this.shareHtmlAsPdf(
      html,
      `Protokol-Bioasekuracji-PIW-${data.loftInfo?.wniNumber || 'inspekcja'}`
    );
  }

  /**
   * Generuje i drukuje lub udostępnia Urzędowe Świadectwo Zdrowia TRACES-NT (Z-063)
   */
  static async exportTracesHealthCertificate(
    consignment: any,
    validation: any,
    mode: 'print' | 'share' = 'print'
  ): Promise<string | void> {
    const { generateTracesCertificateHtml } = await import('../domain/vetPassportTraces');
    const html = generateTracesCertificateHtml(consignment, validation);
    if (mode === 'print') {
      await this.printHtml(html);
      return;
    }
    return await this.shareHtmlAsPdf(
      html,
      `Swiadectwo-TRACES-${consignment.certificateId || 'export'}`
    );
  }

  /**
   * Generuje i drukuje lub udostępnia Umowę Zbycia / Protokół Transferu Gołębi (Z-065)
   */
  static async exportPigeonTransferAgreement(
    contract: any,
    evaluation: any,
    mode: 'print' | 'share' = 'print'
  ): Promise<string | void> {
    const { generateTransferContractHtml } = await import('../domain/pigeonTransfer');
    const html = generateTransferContractHtml(contract, evaluation);
    if (mode === 'print') {
      await this.printHtml(html);
      return;
    }
    return await this.shareHtmlAsPdf(
      html,
      `Umowa-Transferu-${contract.contractNumber || 'pigeons'}`
    );
  }

  /**
   * Generuje i drukuje lub udostępnia Oświadczenie Geodezyjne WGS-84 dla PZHGP (Z-067)
   */
  static async exportGeodeticLoftDeclaration(
    input: any,
    result: any,
    mode: 'print' | 'share' = 'print'
  ): Promise<string | void> {
    const { generateGeodeticDeclarationHtml } = await import('../domain/loftGeodesy');
    const html = generateGeodeticDeclarationHtml(input, result);
    if (mode === 'print') {
      await this.printHtml(html);
      return;
    }
    return await this.shareHtmlAsPdf(
      html,
      `Oswiadczenie-Geodezyjne-PZHGP-${input.loftName || 'loft'}`
    );
  }

  /**
   * Generuje i drukuje lub udostępnia Protokół Wykreślenia i Rejestr Zdarzeń Losowych dla PZHGP (Z-068)
   */
  static async exportPigeonDecommissionProtocol(
    data: any,
    mode: 'print' | 'share' = 'print'
  ): Promise<string | void> {
    const { generateDecommissionProtocolHtml } = await import('../domain/pigeonDecommission');
    const html = generateDecommissionProtocolHtml(data);
    if (mode === 'print') {
      await this.printHtml(html);
      return;
    }
    return await this.shareHtmlAsPdf(
      html,
      `Protokol-Wykreslenia-${data.protocolNumber || 'PZHGP'}`
    );
  }

  /**
   * Generuje i drukuje lub udostępnia Protokół Zegarowy Otwierania i Rozliczania Zegarów dla PZHGP (Z-071)
   */
  static async exportClockSyncProtocol(
    data: any,
    mode: 'print' | 'share' = 'print'
  ): Promise<string | void> {
    const { generateClockProtocolHtml } = await import('../domain/clockSynchronization');
    const html = generateClockProtocolHtml(data);
    if (mode === 'print') {
      await this.printHtml(html);
      return;
    }
    return await this.shareHtmlAsPdf(
      html,
      `Protokol-Zegarowy-${data.protocolNumber || 'PZHGP'}`
    );
  }

  /**
   * Generuje i drukuje lub udostępnia Protokół Plombowania i Stanu Technicznego Kabiny PZHGP (Z-072)
   */
  static async exportCabinSealingProtocol(
    data: any,
    mode: 'print' | 'share' = 'print'
  ): Promise<string | void> {
    const { generateCabinSealingProtocolHtml } = await import('../domain/cabinSealingProtocol');
    const html = generateCabinSealingProtocolHtml(data);
    if (mode === 'print') {
      await this.printHtml(html);
      return;
    }
    return await this.shareHtmlAsPdf(
      html,
      `Protokol-Plombowania-Kabiny-${data.protocolNumber || 'PZHGP'}`
    );
  }
}



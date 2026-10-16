import { PdfService } from '../src/services/pdfService';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { PedigreeNode, Pigeon } from '../src/domain/types';

describe('PdfService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPigeon: Pigeon = {
    id: 'p-1',
    loftId: 'loft-1',
    ringNumber: 'PL-0284-23-1402',
    countryCode: 'PL',
    year: 2023,
    sex: 'cock',
    plumageColor: 'Niebieski',
    status: 'racing',
    eyeSign: 'Perłowe',
    qrCodeUuid: 'pigeonfly://v1/p/p-1-hash',
    notes: 'Wybitny lotnik',
    isDeleted: false,
    createdAt: '',
    updatedAt: '',
  };

  const mockRoot: PedigreeNode = {
    pigeon: mockPigeon,
    generation: 0,
  };

  it('prints HTML directly via expo-print', async () => {
    await PdfService.printHtml('<html><body>Hello</body></html>');
    expect(Print.printAsync).toHaveBeenCalledWith({ html: '<html><body>Hello</body></html>' });
  });

  it('shares HTML as PDF via expo-sharing when available', async () => {
    const uri = await PdfService.shareHtmlAsPdf('<html><body>Hello</body></html>', 'Test Doc');
    expect(Print.printToFileAsync).toHaveBeenCalledWith({ html: '<html><body>Hello</body></html>' });
    expect(Sharing.isAvailableAsync).toHaveBeenCalled();
    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///mock/pedigree.pdf', {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: 'Test Doc',
    });
    expect(uri).toBe('file:///mock/pedigree.pdf');
  });

  it('exports pedigree in print mode', async () => {
    await PdfService.exportPedigree(
      mockRoot,
      {
        loftName: 'Gołębnik Mistrza',
        breederName: 'Jan Kowalski',
        breederPhone: '+48 600 000 000',
        inbreedingF: 0.03125,
      },
      'print'
    );
    expect(Print.printAsync).toHaveBeenCalled();
  });

  it('exports pedigree in share mode', async () => {
    const uri = await PdfService.exportPedigree(
      mockRoot,
      {
        loftName: 'Gołębnik Mistrza',
        breederName: 'Jan Kowalski',
      },
      'share'
    );
    expect(Print.printToFileAsync).toHaveBeenCalled();
    expect(Sharing.shareAsync).toHaveBeenCalled();
    expect(uri).toBe('file:///mock/pedigree.pdf');
  });

  it('exports race basketing list in print mode', async () => {
    await PdfService.exportBasketingList(
      {
        loftName: 'Gołębnik Mistrza',
        breederName: 'Jan Kowalski',
        clubBranch: 'Oddział 0284 Gostyń',
        raceName: 'Magdeburg I',
        releaseLocation: 'Magdeburg, Niemcy',
        basketingDate: '2026-05-15',
        pigeons: [
          {
            index: 1,
            ringNumber: 'PL-0284-23-1402',
            color: 'Niebieski',
            sex: 'cock',
            isTip: true,
          },
        ],
      },
      'print'
    );
    expect(Print.printAsync).toHaveBeenCalled();
  });

  it('exports race basketing list in share mode', async () => {
    await PdfService.exportBasketingList(
      {
        loftName: 'Gołębnik Mistrza',
        breederName: 'Jan Kowalski',
        clubBranch: '0284',
        raceName: 'Magdeburg',
        releaseLocation: 'DE',
        basketingDate: '2026-05-15',
        pigeons: [],
      },
      'share'
    );
    expect(Print.printToFileAsync).toHaveBeenCalled();
    expect(Sharing.shareAsync).toHaveBeenCalled();
  });

  it('exports veterinary treatment book in print mode', async () => {
    await PdfService.exportVeterinaryTreatmentBook(
      {
        loftName: 'Gołębnik Mistrza',
        breederName: 'Jan Kowalski',
        records: [
          {
            date: '2026-02-15',
            eventType: 'szczepienie',
            productName: 'Pharmavac Columbi 2',
            targetPigeon: 'Całe stado',
            withdrawalDays: 0,
          },
        ],
      },
      'print'
    );
    expect(Print.printAsync).toHaveBeenCalled();
  });

  it('exports veterinary treatment book in share mode', async () => {
    await PdfService.exportVeterinaryTreatmentBook(
      {
        loftName: 'Gołębnik Mistrza',
        breederName: 'Jan Kowalski',
        records: [],
      },
      'share'
    );
    expect(Print.printToFileAsync).toHaveBeenCalled();
    expect(Sharing.shareAsync).toHaveBeenCalled();
  });

  it('exports QR sticker sheet in print mode', async () => {
    await PdfService.exportQrStickerSheet(
      {
        loftName: 'Gołębnik Mistrza',
        breederName: 'Jan Kowalski',
        stickers: [
          {
            pigeonId: 'p-1',
            ringNumber: 'PL-0284-23-1402',
            countryCode: 'PL',
            year: 2023,
            qrPayload: 'PIGEONFLY:V1:uuid-1:PL-0284-23-1402',
            auxiliaryRing: 'GUM-42',
          },
        ],
      },
      'print'
    );
    expect(Print.printAsync).toHaveBeenCalled();
  });

  it('exports QR sticker sheet in share mode', async () => {
    const uri = await PdfService.exportQrStickerSheet(
      {
        loftName: 'Gołębnik Mistrza',
        breederName: 'Jan Kowalski',
        stickers: [],
      },
      'share'
    );
    expect(Print.printToFileAsync).toHaveBeenCalled();
    expect(Sharing.shareAsync).toHaveBeenCalled();
    expect(uri).toBe('file:///mock/pedigree.pdf');
  });
});

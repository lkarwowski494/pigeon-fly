import { t, setLanguage, getLanguage, useLang, Language } from '../src/lib/i18n';

describe('i18n Multi-Language Translation System (TASK-R09-01 & R09-02)', () => {
  beforeEach(() => {
    setLanguage('pl');
  });

  it('defaults to Polish', () => {
    expect(getLanguage()).toBe('pl');
    expect(useLang()).toBe('pl');
    expect(t('Stado')).toBe('Stado');
    expect(t('Loty i Treningi')).toBe('Loty i Treningi');
  });

  it('translates to English correctly', () => {
    setLanguage('en');
    expect(getLanguage()).toBe('en');
    expect(t('Stado')).toBe('Flock');
    expect(t('Loty i Treningi')).toBe('Races & Training');
    expect(t('Cyfrowy notes mistrza')).toBe('Master Loft Digital Notebook');
  });

  it('translates to Dutch / Flemish (KBDB)', () => {
    setLanguage('nl');
    expect(getLanguage()).toBe('nl');
    expect(t('Stado')).toBe('Vliegploeg & Kweekduiven');
    expect(t('Loty i Treningi')).toBe('Vluchten & Africhtingen');
    expect(t('Samiec')).toBe('Doffer');
    expect(t('Samica')).toBe('Duivin');
  });

  it('translates to German (Brieftaubensport)', () => {
    setLanguage('de');
    expect(getLanguage()).toBe('de');
    expect(t('Stado')).toBe('Taubenbestand');
    expect(t('Loty i Treningi')).toBe('Flüge & Training');
    expect(t('Kalkulator')).toBe('Geschwindigkeitsrechner');
  });

  it('translates to French (Colombophilie)', () => {
    setLanguage('fr');
    expect(getLanguage()).toBe('fr');
    expect(t('Stado')).toBe('Colonie');
    expect(t('Loty i Treningi')).toBe('Concours & Entraînements');
    expect(t('Samiec')).toBe('Mâle');
    expect(t('Samica')).toBe('Femelle');
  });

  it('translates to Chinese (信鸽)', () => {
    setLanguage('zh');
    expect(getLanguage()).toBe('zh');
    expect(t('Stado')).toBe('鸽舍鸽群');
    expect(t('Kalkulator')).toBe('分速计算器');
    expect(t('Samiec')).toBe('雄鸽');
    expect(t('Samica')).toBe('雌鸽');
  });

  it('interpolates parameters accurately across languages', () => {
    setLanguage('pl');
    expect(t('Odbito ptaka: {ringNumber}', { ringNumber: 'PL-0284-23-1402' })).toBe(
      'Odbito ptaka: PL-0284-23-1402'
    );

    setLanguage('en');
    expect(t('Odbito ptaka: {ringNumber}', { ringNumber: 'PL-0284-23-1402' })).toBe(
      'Clocked pigeon: PL-0284-23-1402'
    );

    setLanguage('zh');
    expect(t('Odbito ptaka: {ringNumber}', { ringNumber: 'PL-0284-23-1402' })).toBe(
      '已成功打钟报进：PL-0284-23-1402'
    );
  });
});

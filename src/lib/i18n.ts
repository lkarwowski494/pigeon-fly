/**
 * PIGEON-FLY — i18n Translation Engine (6 Core Pigeon Racing Languages)
 * Obsługuje: PL, EN, NL, DE, FR, ZH
 */

import { translationsPL } from './i18n.pl';
import { translationsEN } from './i18n.en';
import { translationsNL } from './i18n.nl';
import { translationsDE } from './i18n.de';
import { translationsFR } from './i18n.fr';
import { translationsZH } from './i18n.zh';

export type Language = 'pl' | 'en' | 'nl' | 'de' | 'fr' | 'zh';

const dictionaries: Record<Language, Record<string, string>> = {
  pl: translationsPL,
  en: translationsEN,
  nl: translationsNL,
  de: translationsDE,
  fr: translationsFR,
  zh: translationsZH,
};

let currentLanguage: Language = 'pl';

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function useLang(): Language {
  return currentLanguage;
}

/**
 * Translates a key with parameter interpolation (e.g. {ringNumber}).
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const dict = dictionaries[currentLanguage] || translationsPL;
  let text = dict[key] || translationsPL[key] || key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }

  return text;
}

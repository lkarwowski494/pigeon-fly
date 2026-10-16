/**
 * PIGEON-FLY — i18n Translation Helper
 */

import { translationsPL } from './i18n.pl';
import { translationsEN } from './i18n.en';

export type Language = 'pl' | 'en';

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
  const dict = currentLanguage === 'en' ? translationsEN : translationsPL;
  let text = dict[key] || translationsPL[key] || key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }

  return text;
}

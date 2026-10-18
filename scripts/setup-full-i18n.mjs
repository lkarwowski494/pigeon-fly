import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

// 330+ Domain Translations for Pigeon Racing across TOP 6 Languages
// PL: Polski (Podstawa)
// EN: English (International)
// NL: Nederlands (Flemish / Dutch — Pigeon Racing Capital: Belgium/Netherlands)
// DE: Deutsch (German — Brieftaubensport)
// FR: Français (French — Colombophilie)
// ZH: 中文 (Chinese — 赛鸽)

import { DICT_ENTRIES } from './i18n-data.mjs';

console.log(`Loaded ${DICT_ENTRIES.length} dictionary entries.`);

const dictPL = {};
const dictEN = {};
const dictNL = {};
const dictDE = {};
const dictFR = {};
const dictZH = {};

for (const entry of DICT_ENTRIES) {
  const [key, en, nl, de, fr, zh] = entry;
  dictPL[key] = key;
  dictEN[key] = en;
  dictNL[key] = nl || en;
  dictDE[key] = de || en;
  dictFR[key] = fr || en;
  dictZH[key] = zh || en;
}

function writeDictFile(filename, dictName, dictObj, langTitle) {
  const entries = Object.entries(dictObj)
    .map(([k, v]) => `  '${k.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}': '${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}',`)
    .join('\n');

  const content = `/**
 * PIGEON-FLY — Słownik tłumaczeń (${langTitle})
 * Oficjalne słownictwo sportu gołębiarskiego (FCI / PZHGP / KBDB).
 */

export const ${dictName}: Record<string, string> = {
${entries}
};
`;
  writeFileSync(join(root, filename), content, 'utf8');
  console.log(`Wrote ${filename} (${Object.keys(dictObj).length} keys)`);
}

writeDictFile('src/lib/i18n.pl.ts', 'translationsPL', dictPL, 'Polski');
writeDictFile('src/lib/i18n.en.ts', 'translationsEN', dictEN, 'English');
writeDictFile('src/lib/i18n.nl.ts', 'translationsNL', dictNL, 'Nederlands / Vlaams');
writeDictFile('src/lib/i18n.de.ts', 'translationsDE', dictDE, 'Deutsch');
writeDictFile('src/lib/i18n.fr.ts', 'translationsFR', dictFR, 'Français');
writeDictFile('src/lib/i18n.zh.ts', 'translationsZH', dictZH, '中文 / Chinese');

// Write updated src/lib/i18n.ts
const i18nMain = `/**
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
      text = text.replace(new RegExp(\`\\\\{\${k}\\\\}\`, 'g'), String(v));
    }
  }

  return text;
}
`;

writeFileSync(join(root, 'src/lib/i18n.ts'), i18nMain, 'utf8');
console.log('Updated src/lib/i18n.ts with 6 languages.');

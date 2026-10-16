/**
 * Pigeon-Fly Database Path Protection (Standard SEC-09 z Apps4Brew Studio):
 * Przeniesienie bazy SQLite poza katalog Dokumenty (`Documents/SQLite/` -> `/Library/SQLite`).
 * Katalog Dokumenty jest widoczny dla użytkownika w systemowej aplikacji Pliki (UIFileSharingEnabled),
 * a roboczej bazy SQLite nie wolno narażać na przypadkowe uszkodzenie.
 * `/Library/SQLite` jest prywatne dla aplikacji i wchodzi do automatycznej kopii zapasowej telefonu (iCloud).
 */

export function resolveDatabaseDirectory(defaultDir?: string | null): string | undefined {
  if (defaultDir && /\/Documents\/SQLite\/?$/.test(defaultDir)) {
    return defaultDir.replace(/\/Documents\/SQLite\/?$/, '/Library/SQLite');
  }
  return undefined;
}

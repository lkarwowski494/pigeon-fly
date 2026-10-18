# Matryca Zadań Naprawczych (Chronologiczny Rejestr dla Roli Orkiestratora)
**Wygenerowano przez:** Rola 16: AD-HOC Naczelny Inspektor Rzemiosła i Jakości (Supreme Forensic Auditor 1–11)  
**Zarządzane i zrealizowane przez:** Rola 17: Dedykowany Koordynator Napraw Sztafety 1–11  
**Data certyfikacji:** 2026-10-18  
**Projekt:** Pigeon-Fly (`com.apps4loft.pigeonfly`)  
**Stan wejściowy:** Commit `ea0e0b3` (94 test suites, 662 passing, 0 TS errors, 100 modułów Z-001..Z-100)  
**Stan wyjściowy:** 🟢 **101 test suites, 692 passing, 0 TS errors, 323 i18n keys (6 języków), PBT 1000 trials, 0 any**  

---

## 1. Zestawienie Zadań Naprawczych per Rola 1–11 (Wszystkie 22 Zadania Zrealizowane)

| ID Zadania | Rola Docelowa | Płaszczyzna | Priorytet | Status Naprawy | Commit / Weryfikacja | Konkretna Akcja Naprawcza i Dowód Zakończenia |
|---|---|---|---|---|---|---|
| **TASK-R01-01** | Rola 1 (Lead BA) | WYKONANIE | **P1** | 🟢 **ROZWIĄZANE** | Commit `cb0dd18` | Usunięto wszystkie odniesienia do języka Swift / SwiftUI z `docs/brd/`; zsynchronizowano ze stosem React Native Expo TS (`grep -rn "Swift" docs/brd/` zwraca 0). |
| **TASK-R01-02** | Rola 1 (Lead BA) | WYKONANIE | **P0** | 🟢 **ROZWIĄZANE** | Commit `cb0dd18` | Skorygowano zmyślone wektory geodezyjne na rzeczywiste WGS-84 Vincenty w `vincenty-geodesy.fixture.json` i spięto dynamicznie z `tests/racing.test.ts`. |
| **TASK-R01-03** | Rola 1 (Lead BA) | KURS | **P2** | 🟢 **ROZWIĄZANE** | Commit `cb0dd18` | Wprowadzono formalny podział na rdzeń hodowlany (Z-001..Z-079) i protokoły urzędowo-sędziowskie (Z-080..Z-100) w `docs/brd/A3_rozdz_6_2_...`. |
| **TASK-R02-01** | Rola 2 (UX Design) | WYKONANIE | **P0** | 🟢 **ROZWIĄZANE** | Commit `cb0dd18` | Podniesiono wysokość przycisków interaktywnych do `minHeight >= 48` w `AddFeedingLogModal`, `AddTreatmentModal`, `ClockArrivalModal`, `BasketingProtocolModal`. |
| **TASK-R02-02** | Rola 2 (UX Design) | WYKONANIE | **P1** | 🟢 **ROZWIĄZANE** | Commit `cb0dd18` | Zastąpiono token `#8B5CF6` barwami rzemieślniczymi kobaltu `#2563EB` i granatu `#1E40AF` (`grep -rn "#8B5CF6" src/` zwraca 0). |
| **TASK-R02-03** | Rola 2 (UX Design) | WYKONANIE | **P1** | 🟢 **ROZWIĄZANE** | Commit `cb0dd18` | Powiększono `closeButton` w `src/theme/modalTheme.ts` do 48×48pt z paddingiem polowym. |
| **TASK-R03-01** | Rola 3 (Monetyzacja) | WYKONANIE | **P0** | 🟢 **ROZWIĄZANE** | Commit `cb0dd18` | Zaimplementowano usługę `src/services/purchaseService.ts` z obsługą StoreKit / Google Play Billing, walidacją paragonów i testami w `tests/purchaseService.test.ts`. |
| **TASK-R03-02** | Rola 3 (Monetyzacja) | WYKONANIE | **P0** | 🟢 **ROZWIĄZANE** | Commit `cb0dd18` | Podpięto `restorePurchases` pod StoreKit/Supabase z obsługą odzyskiwania licencji na nowym urządzeniu po reinstalacji. |
| **TASK-R04-01** | Rola 4 (Scope Gatekeeper) | KURS | **P1** | 🟢 **ROZWIĄZANE** | Commit `cb0dd18` | Utworzono formalny Kontrakt Zakresu `docs/scope-contract.md` z zamrożeniem 100 modułów MVP v1.0 i formalną Kill List wykluczeń. |
| **TASK-R05-01** | Rola 5 (Architekt Systemu) | WYKONANIE | **P0** | 🟢 **ROZWIĄZANE** | Commit `cd48621` | Zastąpiono ad-hoc `ALTER TABLE` deterministycznym silnikiem migracji transakcyjnych `src/db/migrator.ts` (`PRAGMA user_version`, `BEGIN TRANSACTION ... COMMIT`). |
| **TASK-R05-02** | Rola 5 (Architekt Systemu) | WYKONANIE | **P1** | 🟢 **ROZWIĄZANE** | Commit `cd48621` | Wdrożono automatyczne tworzenie kopii asekuracyjnej `createPreMigrationBackup` w `src/services/backupService.ts` przed każdą operacją DDL. |
| **TASK-R06-01** | Rola 6 (Baza Wiedzy) | KURS | **P1** | 🟢 **ROZWIĄZANE** | Commit `cd48621` | Utworzono kompendium `docs/knowledge-base.md` zawierające regulacje weterynaryjne PIW/FCI, karencje, żywienie Weende i algorytm Troubleshooting Doctor. |
| **TASK-R07-01** | Rola 7 (BPR + UX Refactor) | KURS & WYK. | **P0** | 🟢 **ROZWIĄZANE** | Commit `ee453bf` | Wdrożono wzorzec P16 `CollapsibleCard.tsx` (Single-Expanded Accordion) z testami jednostkowymi oraz sporządzono dokument transformacji BPR `docs/to-be.md`. |
| **TASK-R08-01** | Rola 8 (Programista) | WYKONANIE | **P0** | 🟢 **ROZWIĄZANE** | Commit `ee453bf` | Wyeliminowano wszystkie wystąpienia `any` z `pdfService.ts`, `backupService.ts`, `liveBroadcastService.ts`, `csvExport.ts`, `syncEngine.ts` i 5 repozytoriów SQLite. |
| **TASK-R08-02** | Rola 8 (Programista) | WYKONANIE | **P1** | 🟢 **ROZWIĄZANE** | Commit `ee453bf` | Wniesiono zapytania SQL z warstwy UI do repozytoriów `src/db/`; żaden komponent UI nie wykonuje surowego SQL. |
| **TASK-R09-01** | Rola 9 (i18n) | WYKONANIE | **P0** | 🟢 **ROZWIĄZANE** | Commit `968d046` | Objęto teksty wywołaniem `t('...')`; `scripts/check-i18n.mjs` raportuje 323 teksty wyciągnięte do słownika bazowego (wymóg: min. 300) i 0 braków. |
| **TASK-R09-02** | Rola 9 (i18n) | KURS | **P1** | 🟢 **ROZWIĄZANE** | Commit `968d046` | Zaimplementowano 6 kluczowych języków sportu gołębiarskiego: PL, EN, NL, DE, FR, ZH (`Language = 'pl' \| 'en' \| 'nl' \| 'de' \| 'fr' \| 'zh'`) z pełnymi słownikami. |
| **TASK-R10-01** | Rola 10 (Architekt Testów) | WYKONANIE | **P0** | 🟢 **ROZWIĄZANE** | Commit `968d046` | Zaimplementowano Property-Based Testing z użyciem `fast-check` (1000 losowych prób, logowanie `PROP_SEED`, naprawa antymerydianu w `racing.ts`). |
| **TASK-R10-02** | Rola 10 (Architekt Testów) | WYKONANIE | **P1** | 🟢 **ROZWIĄZANE** | Commit `968d046` | Napisano test bezstratnej migracji SQLite `tests/migration.test.ts` potwierdzający 100% zachowania rekordów na zrzucie fizycznym v1.0. |
| **TASK-R10-03** | Rola 10 (Architekt Testów) | WYKONANIE | **P1** | 🟢 **ROZWIĄZANE** | Commit `968d046` | Utworzono potok CI `.github/workflows/ci.yml` z macierzą 4 stref czasowych (`UTC`, `America/New_York`, `Europe/Warsaw`, `Asia/Tokyo`). |
| **TASK-R11-01** | Rola 11 (Forensic QA) | WYKONANIE | **P0** | 🟢 **ROZWIĄZANE** | Commit `968d046` | Wygenerowano produkcyjne grafiki PNG w `assets/`: `icon.png` (1024×1024 RGB, brak alfy, 62.5 KB), `adaptive-icon.png` (104 KB), `splash.png` (296 KB). |
| **TASK-R11-02** | Rola 11 (Forensic QA) | WYKONANIE | **P1** | 🟢 **ROZWIĄZANE** | Commit `968d046` | Sporządzono i podpisano certyfikat gotowości wydania `docs/release-readiness.md` z zaliczonym testem Zero-Network Airplane Mode. |

---

## 2. Podsumowanie Wdrożenia Naprawczego Sztafety

1. **Faza 1 (Role 1–4 — Discovery, BRD, UX, Monetyzacja, Zakres):** Commit `cb0dd18`
2. **Faza 2 (Role 5–6 — Architektura SQLite WAL, Migrator, Baza Wiedzy):** Commit `cd48621`
3. **Faza 3 (Role 7–8 — BPR Wzorzec P16, Czystość Typów TypeScript):** Commit `ee453bf`
4. **Faza 4 (Role 9–11 — Ekstrakcja i18n, PBT Fast-Check, CI/CD, Grafiki PNG, Paszport):** Commit `968d046`
5. **Weryfikacja Końcowa:** 101/101 test suites (100%), 692 testy (100%), 0 błędów TS, 323 i18n (0 braków).

# Pigeon-Fly — Rejestr Bieżący Decyzji i Stanu Projektu
**Data utworzenia:** 16.10.2026  
**Właściciel:** Łukasz (`lkarwowski494`)  
**Status projektu:** Start fazy budowy (Tydzień 0) — Gotowa kompletna specyfikacja BRD

---

## 1. Przyjęte Moduły i Role Architektoniczne
* **Obowiązujące moduły:**
  1. *Moduł: oprogramowanie i architektura* (TDD, testy przed kodem, potwierdzanie czerwonego testu na kodzie przed poprawką, narzędzia 0 zł poza opłatą Apple Developer).
  2. *Moduł: research i treści merytoryczne* (5 szczebli hierarchii źródeł, regulaminy FCI/PZHGP, podręczniki medycyny ptaków, wzory geodezyjne WGS-84).
  3. *Zasady ogólne z portfolio studia* (jedno źródło prawdy z generatorami, „udokumentowane” ≠ „zweryfikowane”, 100% Offline-First, Zero Telemetry).
* **Aktywne role:**
  * Analityk biznesowy, Badacz merytoryczny, Programista iOS/SwiftUI, Tester E2E Maestro, Audytor jakości, Koordynator projektu.

---

## 2. Kluczowe Rozstrzygnięcia Decyzyjne (DEC-01 do DEC-15)

* **DEC-01 (Zakres MVP): Opcja B+ (Rekomendowana)**
  * *Rozstrzygnięcie:* Wersja 1.0 obejmuje: Cyfrowy Notes Stada, Wystawowy Generator Rodowodów PDF A4, Kalkulator Inbredu Wrighta, Skaner kodów QR aparatem w lufce z Vision Framework, Geodezyjny Kalkulator Prędkości $m/min$ (formuła Vincenty'ego), Neutralizację Nocną w maratonach, Wizualną Kartę 10 Lotek Skrzydła, Kalendarz Szczepień PMV-1, Ergofizykę Field Mode oraz aplikację Apple Watch Companion. Moduł trackerów IoT/BTS przesunięty do wersji 1.1.
* **DEC-02 (Silnik Bazy Danych): Opcja A (Czysty SQLite / GRDB w trybie WAL)**
  * *Rozstrzygnięcie:* Niezależna, bezawaryjna baza SQLite z atomowymi transakcjami.
* **DEC-03 (Obliczenia Geodezyjne): Opcja B (Równania Vincenty'ego WGS-84)**
  * *Rozstrzygnięcie:* Maksymalna dokładność geodezyjna do $1\text{ mm}$ z fallbackiem Haversine'a.
* **DEC-04 (Format Kodu QR): Opcja B (Kompaktowy format PF1 z korekcją Level H)**
  * *Rozstrzygnięcie:* Odporność na zabrudzenie i uszkodzenie mikronaklejki do 30% powierzchni.
* **DEC-05 (Skaner Wizyjny): Opcja A (Apple Vision Framework)**
  * *Rozstrzygnięcie:* Detekcja kodów QR w 60 fps z czasem analizy $<15\text{ ms}$.
* **DEC-06 (Granice Free Tier): Opcja B (Limit do 10 ptaków w darmowym rdzeniu)**
  * *Rozstrzygnięcie:* Nielimitowany czasowo darmowy rdzeń dla 10 gołębi; pełna wersja Pro dla większych stad.
* **DEC-07 (Cennik i Monetyzacja): Opcja A (1,99 EUR / 6,99 EUR / 19,99 EUR Lifetime)**
  * *Rozstrzygnięcie:* Wprowadzenie zakupu dożywotniego Lifetime z aktywnym Family Sharing.
* **DEC-08 (Kopia Zapasowa): Opcja A (Zawsze 100% Darmowa Kopia SQLite i JSON)**
  * *Rozstrzygnięcie:* Suwerenność danych hodowcy — kopia zapasowa nigdy nie jest blokowana paywallem.
* **DEC-09 (Ergofizyka Field Mode): Opcja A (Obsługa Jedną Ręką i Duże Kafle >= 56 pt)**
  * *Rozstrzygnięcie:* Przystosowanie aplikacji do pracy w gołębniku z brudnymi dłońmi i trzymaniem ptaka.
* **DEC-10 (Apple Watch Companion): Opcja A (Niezależne 1-Tap Rejestrowanie Przylotu)**
  * *Rozstrzygnięcie:* Błyskawiczny timestamp z nadgarstka i parowanie z ptakiem w telefonie.

---

## 3. Bezwzględne Inwarianty i Zasady Bezpieczeństwa

* **KRYTYCZNA ZASADA BEZPIECZEŃSTWA (INWARIANT BEZWZGLĘDNY):**
  Repozytoria [`lkarwowski494/trening`](https://github.com/lkarwowski494/trening) oraz [`lkarwowski494/Oczko`](https://github.com/lkarwowski494/Oczko) są **ŚCIŚLE READ-ONLY**.
  Absolutny zakaz dokonywania jakichkolwiek modyfikacji, commitów, zmian plików czy usuwania czegokolwiek w tamtych projektach. Służą wyłącznie do odczytu i powielania sprawdzonych wzorców inżynieryjnych.
* **ZASADA JAKOŚCI ZAS-QA-PF-01:**
  Każda nowa funkcja w projekcie Pigeon-Fly bezwzględnie musi posiadać pełne pokrycie testami automatycznymi w standardzie repozytoriów `organizer` i `Oczko` (100% pokrycia linii, PBT, a11y, resilience, perf-budgets, concurrency).

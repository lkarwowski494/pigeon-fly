# Pigeon-Fly — Rejestr Bieżący Decyzji i Stanu Projektu
**Data aktualizacji:** 16.10.2026 (Wdrożenie Architektury Hybrydowej Supabase)  
**Właściciel:** Łukasz (`lkarwowski494`)  
**Status projektu:** Start fazy budowy (Tydzień 0) — Gotowa kompletna specyfikacja BRD z chmurą Supabase

---

## 1. Przyjęte Moduły i Role Architektoniczne
* **Obowiązujące moduły:**
  1. *Moduł: oprogramowanie i architektura hybrydowa* (TDD, testy przed kodem, lokalna baza SQLite WAL + chmura Supabase PostgreSQL 16, Row Level Security, Realtime WebSockets, Storage CDN, narzędzia 0 zł poza opłatą Apple).
  2. *Moduł: research i treści merytoryczne* (5 szczebli hierarchii źródeł, regulaminy FCI/PZHGP, podręczniki medycyny ptaków, wzory geodezyjne WGS-84).
  3. *Zasady ogólne z portfolio studia* (jedno źródło prawdy z generatorami, „udokumentowane” ≠ „zweryfikowane”, Ergofizyka Field Mode).
* **Aktywne role:**
  * Analityk biznesowy, Badacz merytoryczny, Programista iOS/SwiftUI, Inżynier baz danych PostgreSQL/Supabase, Tester E2E Maestro, Audytor jakości, Koordynator projektu.

---

## 2. Kluczowe Rozstrzygnięcia Decyzyjne (DEC-01 do DEC-39)

* **DEC-01 (Zakres MVP): Opcja B+ (Hybrydowa z Supabase — Rekomendowana)**
  * *Rozstrzygnięcie:* Wersja 1.0 obejmuje: Cyfrowy Notes Stada, Wystawowy Generator Rodowodów PDF A4, Kalkulator Inbredu Wrighta, Skaner kodów QR aparatem w lufce, Geodezyjny Kalkulator Prędkości $m/min$ (Vincenty), Wizualną Kartę 10 Lotek Skrzydła (ARI), Kalendarz Szczepień PMV-1, Ergofizykę Field Mode, Apple Watch Companion oraz **infrastrukturę Supabase: asynchroniczną synchronizację delta, multi-device sync, kryptograficzny portal weryfikacji rodowodów online pod kodem QR oraz globalną sieć pomocy zagubionym ptakom (Lost & Found)**.
* **DEC-02 (Architektura Bazy Danych): Opcja C (Hybrydowy Offline-First z Supabase)**
  * *Rozstrzygnięcie:* Lokalne SQLite 3 WAL jako natychmiastowy cel zapisu w gołębniku bez zasięgu GSM + asynchroniczna replikacja do PostgreSQL 16 w Supabase po wykryciu sieci.
* **DEC-03 (Obliczenia Geodezyjne): Opcja B (Równania Vincenty'ego WGS-84)**
  * *Rozstrzygnięcie:* Dokładność geodezyjna do $1\text{ mm}$ z fallbackiem Haversine'a.
* **DEC-04 (Format Kodu QR): Opcja B (Kompaktowy format PF1 z korekcją Level H)**
  * *Rozstrzygnięcie:* Odporność na zabrudzenie i uszkodzenie mikronaklejki do 30% powierzchni.
* **DEC-06 (Granice Free Tier): Opcja B (Limit do 10 ptaków w darmowym rdzeniu)**
  * *Rozstrzygnięcie:* Nielimitowany czasowo darmowy rdzeń dla 10 gołębi; pełna wersja Pro dla większych stad z chmurą Supabase.
* **DEC-07 (Cennik i Monetyzacja): Opcja A (1,99 EUR / 6,99 EUR / 19,99 EUR Lifetime)**
  * *Rozstrzygnięcie:* Wprowadzenie zakupu dożywotniego Lifetime z aktywnym Family Sharing i chmurą.
* **DEC-08 (Kopia Zapasowa): Opcja A (Zawsze 100% Darmowa Kopia SQLite i JSON)**
  * *Rozstrzygnięcie:* Suwerenność danych hodowcy — darmowy eksport lokalny niezależnie od chmury.
* **DEC-31 (Wybór Bazy Chmurowej): Opcja C (Supabase)**
  * *Rozstrzygnięcie:* Supabase PostgreSQL 16 z RLS, Realtime WebSockets, Storage i Edge Functions.
* **DEC-32 (Strategia Uwierzytelniania): Opcja B (Zero-Friction: Anonimowy Start $\rightarrow$ Apple Sign-In)**
  * *Rozstrzygnięcie:* Brak wymuszonego logowania na starcie; płynne łączenie z Apple ID przy przejściu na Pro/Tandem.
* **DEC-34 (Tandem Hodowlany): Opcja A (Współdzielenie gołębnika z rolami RLS)**
  * *Rozstrzygnięcie:* Role `OWNER`, `MEMBER`, `VIEWER` dla spółek hodowlanych (np. ojciec i syn).
* **DEC-35 (Transmisje na Żywo): Opcja A (Supabase Realtime Live Broadcast)**
  * *Rozstrzygnięcie:* Transmisja przylotów z lotu na żywo przez WebSockets pod prywatnym linkiem.
* **DEC-36 (Weryfikacja Rodowodów): Opcja A (Cyfrowy Paszport pod Kodem QR)**
  * *Rozstrzygnięcie:* SHA-256 + portal `pigeonfly.app/pedigree/[ID]` chroniący przed fałszerstwami.
* **DEC-37 (Sieć Pomocy Zagubionym): Opcja A (Portal Lost & Found z Push APNs)**
  * *Rozstrzygnięcie:* Znalazca zgłasza ptaka na stronie webowej; właściciel dostaje dyskretny alert push w 3 sekundy.
* **DEC-51 (Biologiczny Silnik Cyklu Lęgowego): Opcja A (Automatyczny Chronometraż Lęgów)**
  * *Rozstrzygnięcie:* Automatyczne wyliczanie dat biologicznych: 1. jajo (+9 dni), 2. jajo (+44h / 2 dni), owoskopia na 5. dzień, wylęg na 18. dzień, krytyczny alarm obrączkowania w oknie 6.–8. dnia życia piskląt oraz odsadzenie na 24. dzień. Wsparcie procedury podmiany na jajka gipsowe.
* **DEC-52 (4-Fazowy Silnik Żywieniowy): Opcja A (Tygodniowy Kalendarz Poidła i Karmnika)**
  * *Rozstrzygnięcie:* 4 fazy roczne (spoczynek zimowy, lęgi/odchów, sezon lotowy wdowi, wielkie pierzenie jesienne) z precyzyjną 7-dniową rotacją karmy (oczyszczająca $\to$ sportowa $\to$ ładowanie tłuszczem) oraz dedykowanymi suplementami do poidła (woda) i karmnika (zwilżanie karmy).
* **DEC-53 (Fotoperiod — Zaciemnianie i Doświetlanie): Opcja A (Moduł Verdunkelung & Belichtung)**
  * *Rozstrzygnięcie:* System automatycznie wylicza reżim fotoperiodyczny dla młodych gołębi: 14h ciemności (18:00–08:00) od 15 marca do 21 czerwca (blokada zrzucania 10 lotek) oraz doświetlanie do 16h (od 05:00 i do 22:30) od 22 czerwca do września (utrzymanie formy).
* **DEC-54 (12-Miesięczny Kalendarz Weterynaryjny i E-Księga Leczenia): Opcja A (Urzędowy Rejestr PIW)**
  * *Rozstrzygnięcie:* Całoroczny terminarz badań parazytologicznych kału (koproskopia), szczepień (PMV-1, ospa), kuracji przedlęgowych (rzęsistek) oraz urzędowa księga leków z automatycznym kalkulatorem karencji i eksportem do PDF dla Inspekcji Weterynaryjnej.
* **DEC-55 (Wirtualna Matryca Cel Lęgowych): Opcja A (Nest Box Matrix)**
  * *Rozstrzygnięcie:* Graficzna mapa przedziału rozpłodowego z kolorystycznymi statusami cel (pusta, para, wysiadywanie, owoskopia, alarm obrączkowania, odchów).

---

## 3. Bezwzględne Inwarianty i Zasady Bezpieczeństwa

* **KRYTYCZNA ZASADA BEZPIECZEŃSTWA (INWARIANT BEZWZGLĘDNY):**
  Repozytoria [`lkarwowski494/trening`](https://github.com/lkarwowski494/trening) oraz [`lkarwowski494/Oczko`](https://github.com/lkarwowski494/Oczko) są **ŚCIŚLE READ-ONLY**.
  Absolutny zakaz dokonywania jakichkolwiek modyfikacji, commitów, zmian plików czy usuwania czegokolwiek w tamtych projektach.
* **ZASADA JAKOŚCI ZAS-QA-PF-01:**
  Każda nowa funkcja w projekcie Pigeon-Fly bezwzględnie musi posiadać pełne pokrycie testami automatycznymi w standardzie repozytoriów `organizer` i `Oczko` (100% pokrycia linii, PBT, a11y, testy RLS w SQL `pgTAP`, resilience, perf-budgets, concurrency).

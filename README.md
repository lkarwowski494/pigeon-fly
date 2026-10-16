# PIGEON-FLY (Cyfrowy Notes Mistrza)

> **Kategoria:** Sport i Hodowla / Hobby / Narzędzia Offline-First  
> **Platforma docelowa:** iOS 18+ (SwiftUI / SwiftData / SQLite), watchOS 11+  
> **Filozofia:** 100% Offline-First, Zero Login, Zero Telemetry (Data Not Collected), SQLite WAL, Apple HIG & Field Mode  
> **Lokalizacja:** 35 języków od wersji 1.0 (z branżowym żargonem hodowlanym PZHGP / FCI / KBDB)

---

## 🕊️ O Projekcie

**Pigeon-Fly** to wyspecjalizowany, cyfrowy notes mistrza hodowli gołębi pocztowych, zaprojektowany jako bezpośredni, niezawodny następca tradycyjnego zeszytu w kratkę. Tworzony z myślą o doświadczonych hodowcach, pasjonatach i mistrzach sportu gołębiarskiego, którzy cenią absolutną niezawodność w warunkach polowych, intuicyjną prostotę, brak konieczności zakładania kont w chmurze i natychmiastowe działanie w gołębniku bez zasięgu sieci komórkowej.

Aplikacja łączy tradycję z nowoczesną inżynierią:
1. **Cyfrowy Notes Gołębnika & Kartoteka Stada:** Pełna historia każdego ptaka, rodowody do 4–5 pokoleń wstecz, wyliczanie inbredu Wrighta, galeria oka (Eye-Sign) i skrzydła.
2. **Generator Rodowodów PDF A4:** Eksport profesjonalnych, wystawowych rodowodów w międzynarodowym standardzie aukcyjnym (ze zdjęciami i wykazem konkursów).
3. **Błyskawiczne Skanowanie QR w Lufce:** Natychmiastowa identyfikacja ptaka i precyzyjne znakowanie czasu (Timestamp z dokładnością do ułamka sekundy) po przylocie z lotu.
4. **Automatyczny Kalkulator Prędkości ($m/min$):** Geodezyjne wyliczanie dystansu (Haversine/Vincenty), czasu lotu, wektora znosu wiatru i generowanie dynamicznego rankingu przylotów w czasie rzeczywistym.
5. **Zdrowie, Profilaktyka i Karta Pierzenia:** Interaktywny diagram 10 lotek I rzędu, kalendarz szczepień z okresami karencji leków (antydoping FCI) i bilansowanie karmy.
6. **Tryb Warsztatowy (Field Mode) & Apple Watch:** Ogromne, kontrastowe przyciski dla ubrudzonych rąk, obsługa jedną ręką, potwierdzenia dźwiękowe i haptyczne oraz rejestrowanie przylotów z poziomu nadgarstka.

---

## 📚 Dokumentacja Biznesowa i Architektoniczna (BRD)

Kompletna, wielotomowa dokumentacja wymagań biznesowych (BRD), architektury systemu, reguł dziedzinowych i strategii jakości znajduje się w katalogu [`docs/brd/`](docs/brd/):

- [`docs/brd/00_START_streszczenie_wykonawcze_i_spis_tresci.md`](docs/brd/00_START_streszczenie_wykonawcze_i_spis_tresci.md) — Streszczenie wykonawcze, status, persony, kluczowe wyróżniki rynkowe, model przychodu, 5 ryzyk i spis treści.
- [`docs/brd/00b_Jedna_lista_decyzji_projektowych_DEC.md`](docs/brd/00b_Jedna_lista_decyzji_projektowych_DEC.md) — Rejestr 50 decyzji projektowych (DEC-01 do DEC-50) z wariantami i rekomendacjami.
- [`docs/brd/00c_Sprzecznosci_i_errata.md`](docs/brd/00c_Sprzecznosci_i_errata.md) — Rozstrzygnięcia sprzeczności regulaminowych i technicznych.
- [`docs/brd/A1_rozdz_1_3_Tozsamosc_Persony_Scenariusze_Roczne.md`](docs/brd/A1_rozdz_1_3_Tozsamosc_Persony_Scenariusze_Roczne.md) — Wizja, 16 zasad produktu (ZP), 8 person i 15 scenariuszy życiowych w pełnym cyklu rocznym.
- [`docs/brd/A2_rozdz_4_6_1_Rynek_Konkurencja_Model_Przychodu.md`](docs/brd/A2_rozdz_4_6_1_Rynek_Konkurencja_Model_Przychodu.md) — Analiza rynku gołębiarskiego, audyt konkurencji, model Freemium/Pro/Lifetime i unit economics.
- [`docs/brd/A3_rozdz_6_2_Tabela_Zakresu_Z_i_Etapy.md`](docs/brd/A3_rozdz_6_2_Tabela_Zakresu_Z_i_Etapy.md) — Tabela zakresu Z-001 do Z-240 z etapami wydań i nakładem pracy.
- [`docs/brd/A4_rozdz_13_15_KPI_Marketing_ASO.md`](docs/brd/A4_rozdz_13_15_KPI_Marketing_ASO.md) — Metryki KPI bez śledzenia, organiczny marketing środowiskowy i ASO w 35 językach.
- [`docs/brd/B1_rozdz_7_Cyfrowy_Notes_Stada_i_Karty_Ptaka.md`](docs/brd/B1_rozdz_7_Cyfrowy_Notes_Stada_i_Karty_Ptaka.md) — Wymagania funkcjonalne kartoteki stada (BR-STADO).
- [`docs/brd/B2_rozdz_7_Rodowody_Inbred_i_Generator_PDF.md`](docs/brd/B2_rozdz_7_Rodowody_Inbred_i_Generator_PDF.md) — Genealogia, algorytm Wrighta i generator PDF (BR-ROD).
- [`docs/brd/B3_rozdz_7_Skaner_QR_i_Szybka_Identyfikacja.md`](docs/brd/B3_rozdz_7_Skaner_QR_i_Szybka_Identyfikacja.md) — Znakowanie QR, detekcja w lufce i weryfikacja (BR-SKAN).
- [`docs/brd/B4_rozdz_7_Treningi_Loty_i_Kalkulator_Predkosci.md`](docs/brd/B4_rozdz_7_Treningi_Loty_i_Kalkulator_Predkosci.md) — Zawody, wzory m/min, neutralizacja nocna i znos wiatru (BR-LOT).
- [`docs/brd/B5_rozdz_7_Zdrowie_Pierzenie_Dieta_i_Profilaktyka.md`](docs/brd/B5_rozdz_7_Zdrowie_Pierzenie_Dieta_i_Profilaktyka.md) — Karta 10 lotek skrzydła, bilans karm i profilaktyka (BR-ZDR).
- [`docs/brd/B6_rozdz_7_Telemetria_IoT_Mapy_Offline_i_Apple_Watch.md`](docs/brd/B6_rozdz_7_Telemetria_IoT_Mapy_Offline_i_Apple_Watch.md) — Śledzenie IoT/BTS, wektorowe mapy offline i aplikacja watchOS (BR-TEL).
- [`docs/brd/C1_rozdz_8_Reguly_Dziedzinowe_i_Fizyka_Lotu.md`](docs/brd/C1_rozdz_8_Reguly_Dziedzinowe_i_Fizyka_Lotu.md) — Zestaw reguł dziedzinowych RD-01 do RD-35 z wektorami testowymi.
- [`docs/brd/C2_rozdz_8P_Weryfikacja_Merytoryczna_i_Zrodla.md`](docs/brd/C2_rozdz_8P_Weryfikacja_Merytoryczna_i_Zrodla.md) — Hierarchia źródeł merytorycznych i decyzje badacza D1–D20.
- [`docs/brd/D1_rozdz_9_10_Wymagania_Niefunkcjonalne_NFR_i_Apple.md`](docs/brd/D1_rozdz_9_10_Wymagania_Niefunkcjonalne_NFR_i_Apple.md) — Wymagania niefunkcjonalne (NFR), ergonomia i Apple HIG.
- [`docs/brd/D2_rozdz_11_12_Architektura_Systemu_Model_SQLite_i_Kopie.md`](docs/brd/D2_rozdz_11_12_Architektura_Systemu_Model_SQLite_i_Kopie.md) — Pełny schemat DDL SQLite, indeksy, relacje i modele danych SwiftData.
- [`docs/brd/D3_rozdz_14_16_Rejestr_Ryzyk_i_Plan_Mitygacji.md`](docs/brd/D3_rozdz_14_16_Rejestr_Ryzyk_i_Plan_Mitygacji.md) — Rejestr 40 ryzyk (RYZ) i plany obrony.
- [`docs/brd/D4_rozdz_17_Wielowarstwowa_Strategia_Testow.md`](docs/brd/D4_rozdz_17_Wielowarstwowa_Strategia_Testow.md) — 9 warstw rygoru jakości i weryfikacji.

---

## 🏛️ Główne Zasady Jakościowe

1. **Zero chmury, 100% lokalności:** Baza SQLite w trybie WAL chroniona w bezpiecznym katalogu piaskownicy aplikacji.
2. **Kopia zapasowa zawsze darmowa:** Eksport i import bazy `.sqlite` oraz pliku JSON do prywatnego iCloud Drive lub lokalnego katalogu Pliki bez żadnych opłat.
3. **Prywatność absolutna:** Żadne współrzędne gołębnika, trasy ptaków ani dane hodowlane nie opuszczają urządzenia.
4. **Wyjątkowa ergofizyka polowa:** Ciemny motyw o wysokim kontraście, redukcja kroków do minimum, natychmiastowe reakcje haptyczne.

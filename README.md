# PIGEON-FLY (Cyfrowy Notes Mistrza)

> **Kategoria:** Sport i Hodowla / Hobby / Narzędzia Offline-First & Cloud Collaboration  
> **Platforma docelowa:** iOS 18+ (SwiftUI / SQLite / Supabase), watchOS 11+  
> **Architektura:** Hybrydowa Offline-First (Lokalna baza SQLite WAL z asynchroniczną synchronizacją dwukierunkową Supabase PostgreSQL 16)  
> **Chmura i Usługi:** Supabase (Auth, Row Level Security, Realtime WebSockets, Storage CDN, Edge Functions)  
> **Lokalizacja:** 35 języków od wersji 1.0 (z branżowym żargonem hodowlanym PZHGP / FCI / KBDB)

---

## 🕊️ O Projekcie

**Pigeon-Fly** to wyspecjalizowany, cyfrowy notes mistrza hodowli gołębi pocztowych, zaprojektowany jako bezpośredni, niezawodny następca tradycyjnego zeszytu w kratkę, rozszerzony o potęgę chmurowej bazy danych **Supabase**. Tworzony z myślą o doświadczonych hodowcach, pasjonatach, spółkach hodowlanych (tandemach) i mistrzach sportu gołębiarskiego.

Aplikacja łączy polową niezawodność z przełomowymi możliwościami chmurowymi:
1. **Prawdziwy Tryb Polowy (100% Offline-First w Gołębniku):** Brak zasięgu w gołębniku nie blokuje żadnej akcji. Wszystkie wpisy trafiają natychmiast do lokalnej bazy SQLite.
2. **Automatyczna Synchronizacja Chmurowa (Supabase PostgreSQL):** Po powrocie do domu lub złapaniu sieci dane stada, lęgów i czasów przylotu bezkonfliktowo replikują się do chmury.
3. **Tandem Hodowlany & Multi-Device Sync:** Współdzielenie gołębnika między wspólnikami (np. ojciec i syn, spółki hodowlane). Jednoczesna praca na iPhone, iPad i Mac z uprawnieniami RLS (Row Level Security).
4. **Relacje z Lotów na Żywo (Supabase Realtime):** Transmisja przylotów z zawodów na żywo dla rodziny, przyjaciół i członków sekcji przez bezpieczny link lub kod QR.
5. **Zweryfikowany Cyfrowy Paszport Rodowodu:** Ochrona przed fałszowaniem rodowodów. Każdy wygenerowany PDF A4 posiada unikalny link i kod QR weryfikowany w bazie Supabase (`pigeonfly.app/pedigree/[ID]`).
6. **Globalna Sieć Pomocy Zagubionym Gołębiom (Lost & Found):** Znalazca wycieńczonego gołębia skanuje mikronaklejkę QR lub wpisuje numer obrączki na publicznym portalu – właściciel otrzymuje natychmiastowe, bezpieczne powiadomienie Push z kontaktem do znalazcy.
7. **Błyskawiczne Skanowanie QR w Lufce:** Natychmiastowa identyfikacja ptaka i precyzyjny timestamp przylotu (dokładność ms) za pomocą aparatu i Apple Vision Framework.
8. **Automatyczny Kalkulator Prędkości ($m/min$):** Geodezyjne formuły ortodromy Vincenty'ego i Haversine'a, analiza wektora wiatru i neutralizacja nocna w maratonach.
9. **Zdrowie, Profilaktyka i Monitor 10 Lotek:** Interaktywna karta skrzydła ze Wskaźnikiem Gotowości Aerodynamicznej (ARI), kalendarz szczepień PMV-1 i kontrola okresów karencji leków (antydoping FCI).
10. **Apple Watch Companion:** 1-tap rejestracja przylotów z nadgarstka („Spadł ptak!”) z wibracją haptyczną i parowaniem w telefonie.

---

## 📚 Dokumentacja Biznesowa i Architektoniczna (BRD)

Kompletna specyfikacja wymagań biznesowych (BRD), architektury bazy danych SQLite/Supabase i reguł dziedzinowych znajduje się w katalogu [`docs/brd/`](docs/brd/):

- [`docs/brd/00_START_streszczenie_wykonawcze_i_spis_tresci.md`](docs/brd/00_START_streszczenie_wykonawcze_i_spis_tresci.md) — Streszczenie wykonawcze, persony, nowe możliwości chmurowe Supabase, model Freemium/Pro/Lifetime i spis treści.
- [`docs/brd/00b_Jedna_lista_decyzji_projektowych_DEC.md`](docs/brd/00b_Jedna_lista_decyzji_projektowych_DEC.md) — Rejestr 50 decyzji projektowych z uwzględnieniem architektury hybrydowej Supabase.
- [`docs/brd/00c_Sprzecznosci_i_errata.md`](docs/brd/00c_Sprzecznosci_i_errata.md) — Rozstrzygnięcia sprzeczności offline vs chmura, polityki prywatności i konfliktów synchronizacji.
- [`docs/brd/A1_rozdz_1_3_Tozsamosc_Persony_Scenariusze_Roczne.md`](docs/brd/A1_rozdz_1_3_Tozsamosc_Persony_Scenariusze_Roczne.md) — Wizja, 16 Zasad Produktu, 10 person (w tym Tandem i Znalazca) oraz 18 scenariuszy życiowych.
- [`docs/brd/A2_rozdz_4_6_1_Rynek_Konkurencja_Model_Przychodu.md`](docs/brd/A2_rozdz_4_6_1_Rynek_Konkurencja_Model_Przychodu.md) — Analiza rynku, cennik, ekonomia Supabase (darmowy tier vs Pro) i unit economics.
- [`docs/brd/A3_rozdz_6_2_Tabela_Zakresu_Z_i_Etapy.md`](docs/brd/A3_rozdz_6_2_Tabela_Zakresu_Z_i_Etapy.md) — Tabela zakresu funkcjonalnego (Z-001 do Z-260) z modułami chmurowymi.
- [`docs/brd/A4_rozdz_13_15_KPI_Marketing_ASO.md`](docs/brd/A4_rozdz_13_15_KPI_Marketing_ASO.md) — Metryki sukcesu, ochrona prywatności i ASO w 35 językach.
- [`docs/brd/B1_rozdz_7_Cyfrowy_Notes_Stada_i_Karty_Ptaka.md`](docs/brd/B1_rozdz_7_Cyfrowy_Notes_Stada_i_Karty_Ptaka.md) — Kartoteka stada, multi-device sync i globalna baza rodowodów.
- [`docs/brd/B2_rozdz_7_Rodowody_Inbred_i_Generator_PDF.md`](docs/brd/B2_rozdz_7_Rodowody_Inbred_i_Generator_PDF.md) — Genealogia, inbred Wrighta, generator PDF i weryfikacja cyfrowa online.
- [`docs/brd/B3_rozdz_7_Skaner_QR_i_Szybka_Identyfikacja.md`](docs/brd/B3_rozdz_7_Skaner_QR_i_Szybka_Identyfikacja.md) — Znakowanie QR, detekcja Vision 60 fps i timestamping.
- [`docs/brd/B4_rozdz_7_Treningi_Loty_i_Kalkulator_Predkosci.md`](docs/brd/B4_rozdz_7_Treningi_Loty_i_Kalkulator_Predkosci.md) — Loty, $m/min$, znos wiatru, Supabase Realtime Live Leaderboard i mini-derby.
- [`docs/brd/B5_rozdz_7_Zdrowie_Pierzenie_Dieta_i_Profilaktyka.md`](docs/brd/B5_rozdz_7_Zdrowie_Pierzenie_Dieta_i_Profilaktyka.md) — Monitor 10 lotek skrzydła (ARI), szczepienia PMV-1, karencje leków i pasze.
- [`docs/brd/B6_rozdz_7_Telemetria_IoT_Mapy_Offline_i_Apple_Watch.md`](docs/brd/B6_rozdz_7_Telemetria_IoT_Mapy_Offline_i_Apple_Watch.md) — Śledzenie IoT/BTS przez Edge Functions, wektorowe mapy offline i watchOS.
- [`docs/brd/C1_rozdz_8_Reguly_Dziedzinowe_i_Fizyka_Lotu.md`](docs/brd/C1_rozdz_8_Reguly_Dziedzinowe_i_Fizyka_Lotu.md) — 35 reguł dziedzinowych z wektorami testowymi.
- [`docs/brd/C2_rozdz_8P_Weryfikacja_Merytoryczna_i_Zrodla.md`](docs/brd/C2_rozdz_8P_Weryfikacja_Merytoryczna_i_Zrodla.md) — 5 szczebli hierarchii źródeł merytorycznych i decyzje badacza.
- [`docs/brd/D1_rozdz_9_10_Wymagania_Niefunkcjonalne_NFR_i_Apple.md`](docs/brd/D1_rozdz_9_10_Wymagania_Niefunkcjonalne_NFR_i_Apple.md) — Protokół synchronizacji delta, bezpieczeństwo RLS, ergonomia Field Mode i Apple HIG.
- [`docs/brd/D2_rozdz_11_12_Architektura_Systemu_Model_SQLite_i_Kopie.md`](docs/brd/D2_rozdz_11_12_Architektura_Systemu_Model_SQLite_i_Kopie.md) — Schemat DDL PostgreSQL dla Supabase z politykami RLS oraz lokalny schemat SQLite z protokołem synchronizacji.
- [`docs/brd/D3_rozdz_14_16_Rejestr_Ryzyk_i_Plan_Mitygacji.md`](docs/brd/D3_rozdz_14_16_Rejestr_Ryzyk_i_Plan_Mitygacji.md) — Rejestr 40 ryzyk z mitygacją dla chmury i sieci polowej.
- [`docs/brd/D4_rozdz_17_Wielowarstwowa_Strategia_Testow.md`](docs/brd/D4_rozdz_17_Wielowarstwowa_Strategia_Testow.md) — 9 warstw rygoru jakości, testy RLS `pgTAP`, testy współbieżności i Maestro E2E.
